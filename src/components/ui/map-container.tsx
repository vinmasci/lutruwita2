import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef
} from 'react';
import { parseString } from 'xml2js';
import mapboxgl from 'mapbox-gl';
import { CircularProgress, Box, Typography } from '@mui/material';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';

// --------------------------------------------
// Types
// --------------------------------------------
interface MapRef {
  handleGpxUpload: (content: string) => Promise<void>;
  isReady: () => boolean;
  on: (event: string, callback: () => void) => void;
  off: (event: string, callback: () => void) => void;
}

interface Point {
  lat: number;
  lon: number;
  surface?: 'paved' | 'unpaved';
}

interface SurfaceProgressState {
  isProcessing: boolean;
  progress: number;
  total: number;
}

// --------------------------------------------
// Loading Overlay UI
// --------------------------------------------
const LoadingOverlay = ({
  progress,
  total
}: {
  progress: number;
  total: number;
}) => (
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: '48px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}
  >
    <CircularProgress size={60} sx={{ mb: 2 }} />
    <Typography variant="h6" color="white" gutterBottom>
      Processing GPX file...
    </Typography>
    <Typography color="white">
      {progress} of {total} points processed
    </Typography>
  </Box>
);

// --------------------------------------------
// Synonym sets for maximum coverage
// --------------------------------------------
const PAVED_SURFACES = [
  'paved', 'asphalt', 'concrete', 'compacted',
  'sealed', 'bitumen', 'tar'
];

const UNPAVED_SURFACES = [
  'unpaved', 'gravel', 'fine', 'fine_gravel', 
  'dirt', 'earth'
];

// --------------------------------------------
// The main MapContainer
// --------------------------------------------
const MapContainer = forwardRef<MapRef>((props, ref) => {
  const routeSourceId = 'route';
  const routeLayerId = 'route-layer';

  // Standard references
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // We'll load roads for each vantage, then discard them
  const cachedRoadsRef = useRef<turf.FeatureCollection | null>(null);

  const [isMapReady, setIsMapReady] = React.useState(false);
  const [streetsLayersLoaded, setStreetsLayersLoaded] = React.useState(false);
  const [surfaceProgress, setSurfaceProgress] = React.useState<SurfaceProgressState>({
    isProcessing: false,
    progress: 0,
    total: 0
  });

  // ------------------------------------------------------------------
  // isReady => Has map loaded & are layers ready
  // ------------------------------------------------------------------
  const isReady = useCallback((): boolean => {
    const ready = Boolean(map.current) && isMapReady && streetsLayersLoaded;
    console.log('[isReady] Map check =>', { ready, isMapReady, streetsLayersLoaded });
    return ready;
  }, [isMapReady, streetsLayersLoaded]);

  // ------------------------------------------------------------------
  // addRouteToMap => splits coords by surface => multiple line segments
  // ------------------------------------------------------------------
  const addRouteToMap = useCallback(
    (coordinates: Point[]) => {
      if (!map.current || !isReady()) {
        console.error('[addRouteToMap] Map not ready, cannot add route');
        return;
      }

      console.log('[addRouteToMap] Splitting route into segments by surface...');
      let segments: { points: Point[]; surface: 'paved' | 'unpaved' }[] = [];
      let currentSegment: Point[] = [];
      let currentSurface: 'paved' | 'unpaved' = coordinates[0]?.surface || 'unpaved';

      // Build segments based on changes in surface
      for (let i = 0; i < coordinates.length; i++) {
        const c = coordinates[i];
        if (c.surface !== currentSurface && currentSegment.length > 0) {
          segments.push({
            points: [...currentSegment],
            surface: currentSurface
          });
          currentSegment = [c];
          currentSurface = c.surface || 'unpaved';
        } else {
          currentSegment.push(c);
        }
        if (i === coordinates.length - 1) {
          segments.push({
            points: [...currentSegment],
            surface: currentSurface
          });
        }
      }

      console.log('[addRouteToMap] Created', segments.length, 'segments total.');

      // Remove old route if any
      if (map.current.getSource(routeSourceId)) {
        if (map.current.getLayer(routeLayerId)) {
          map.current.removeLayer(routeLayerId);
        }
        map.current.removeSource(routeSourceId);
      }

      // Make a FeatureCollection
      const featureColl = {
        type: 'FeatureCollection',
        features: segments.map((seg, idx) => ({
          type: 'Feature',
          properties: {
            surface: seg.surface,
            segmentIndex: idx
          },
          geometry: {
            type: 'LineString',
            coordinates: seg.points.map((p) => [p.lon, p.lat])
          }
        }))
      };

      // Add the route source/layer
      map.current.addSource(routeSourceId, {
        type: 'geojson',
        data: featureColl
      });

      map.current.addLayer({
        id: routeLayerId,
        type: 'line',
        source: routeSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#FF4444',
          'line-width': 4,
          'line-dasharray': [
            'case',
            ['==', ['get', 'surface'], 'unpaved'],
            ['literal', [2, 2]],
            ['literal', [1, 0]]
          ]
        }
      });
      console.log('[addRouteToMap] -> route-layer added.');
    },
    [isReady]
  );

  // ------------------------------------------------------------------
  // For each point, we load roads around that point by fitting
  // a small bounding box, then query the rendered roads (fresh),
  // and then discard them once we've assigned surfaces for ~5 points.
  // ------------------------------------------------------------------
  const assignSurfacesViaNearest = useCallback(
    async (coords: Point[]) => {
      if (!map.current) {
        console.log('[assignSurfacesViaNearest] No map.current, returning coords unmodified');
        return coords;
      }

      // Let the user see the progress
      setSurfaceProgress({
        isProcessing: true,
        progress: 0,
        total: coords.length
      });

      const results: Point[] = [];

      // We'll process in small "chunks" of 5 to avoid stale caching
      for (let i = 0; i < coords.length; i += 5) {
        // These are the 5 points we'll handle in this vantage
        const slice = coords.slice(i, i + 5);

        // We'll use the FIRST point of the slice to focus bounding box
        // (Alternatively, you could do the bounding box of all 5 for more coverage)
        const pt = slice[0];

        // 1) Fit bounding box forcibly at zoom=13 (no caching from previous vantage)
        await new Promise<void>((resolve) => {
          let attempts = 0;
          const maxAttempts = 15;

          const checkTiles = () => {
            // bounding box ~0.001 deg => ~100m in each direction
            // Increase to 0.002 or 0.003 if you need a bigger area
            const bbox = [
              pt.lon - 0.001, 
              pt.lat - 0.001,
              pt.lon + 0.001,
              pt.lat + 0.001
            ];

            map.current?.fitBounds(
              [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
              {
                padding: 50,
                duration: 0,
                maxZoom: 13,
                minZoom: 13
              }
            );

            // Now query roads (fresh)
            const features = map.current?.queryRenderedFeatures(undefined, {
              layers: ['custom-roads']
            });

            console.log('[assignSurfacesViaNearest] Attempt vantage for chunk:', {
              startIndex: i,
              boundingBox: bbox,
              found: features?.length || 0,
              location: [pt.lat, pt.lon]
            });

            if (features && features.length > 0) {
              cachedRoadsRef.current = turf.featureCollection(
                features.map((f) => turf.feature(f.geometry, f.properties))
              );
              console.log('[assignSurfacesViaNearest] => Found roads for chunk', {
                roadsCount: features.length
              });
              resolve();
              return;
            }

            attempts++;
            if (attempts >= maxAttempts) {
              console.warn('[assignSurfacesViaNearest] Max attempts reached => no roads found for chunk:', i);
              cachedRoadsRef.current = null;
              resolve();
              return;
            }

            setTimeout(checkTiles, 400);
          };

          checkTiles();
        });

        // 2) Now do nearest-line logic for these 5 points
        const vantageRoads = cachedRoadsRef.current;
        for (let s = 0; s < slice.length; s++) {
          const realIndex = i + s;
          if (realIndex >= coords.length) break; // safety

          const pt2 = slice[s];
          let bestSurface: 'paved' | 'unpaved' = 'unpaved';
          let minDist = Infinity;
          const pointGeo = turf.point([pt2.lon, pt2.lat]);

          if (realIndex % 100 === 0) {
            console.log(
              `[assignSurfacesViaNearest] Processing point #${realIndex}, coords=(${pt2.lat}, ${pt2.lon})`
            );
          }

          // If vantageRoads is empty, default to unpaved
          if (!vantageRoads || vantageRoads.features.length === 0) {
            results.push({ ...pt2, surface: 'unpaved' });
          } else {
            // Evaluate each road
            for (const road of vantageRoads.features) {
              if (
                road.geometry.type !== 'LineString' &&
                road.geometry.type !== 'MultiLineString'
              ) {
                continue;
              }
              const snap = turf.nearestPointOnLine(road, pointGeo);
              const dist = snap.properties.dist; // in km
              if (dist < minDist) {
                minDist = dist;
                const sRaw = (road.properties?.surface || '').toLowerCase();
                if (PAVED_SURFACES.includes(sRaw)) {
                  bestSurface = 'paved';
                } else if (UNPAVED_SURFACES.includes(sRaw)) {
                  bestSurface = 'unpaved';
                } else {
                  bestSurface = 'unpaved'; // fallback
                }
              }
            }
            results.push({ ...pt2, surface: bestSurface });
          }

          setSurfaceProgress((prev) => ({
            ...prev,
            progress: realIndex + 1
          }));
        }

        // 3) Discard vantage roads so next chunk doesn't re-use them
        cachedRoadsRef.current = null;
      }

      // All done
      setSurfaceProgress((prev) => ({
        ...prev,
        isProcessing: false
      }));
      console.log('[assignSurfacesViaNearest] => Finished loop. Returning coords...');
      return results;
    },
    []
  );

  // ------------------------------------------------------------------
  // handleGpxUpload => parse, call assignSurfacesViaNearest, then add route
  // ------------------------------------------------------------------
  const handleGpxUpload = useCallback(
    async (gpxContent: string) => {
      console.log('[handleGpxUpload] Checking if map is ready...');
      if (!map.current || !isReady()) {
        console.warn('[handleGpxUpload] Map not ready, aborting GPX upload');
        throw new Error('Map not ready. Try again later.');
      }
      if (!gpxContent || typeof gpxContent !== 'string') {
        throw new Error('Invalid GPX content');
      }

      console.log('[handleGpxUpload] Parsing GPX...');
      const rawCoords = await new Promise<Point[]>((resolve, reject) => {
        parseString(gpxContent, { explicitArray: false }, (err: Error | null, result: any) => {
          if (err) {
            console.error('[handleGpxUpload] parseString error:', err);
            reject(new Error('Failed to parse GPX file'));
            return;
          }
          try {
            if (!result?.gpx) {
              throw new Error('Invalid GPX structure: missing root gpx element');
            }
            const points = result.gpx?.rte?.rtept || result.gpx?.trk?.trkseg?.trkpt;
            if (!points) {
              throw new Error('Invalid GPX format: missing track points');
            }

            const arr = Array.isArray(points) ? points : [points];
            console.log('[handleGpxUpload] Points found:', arr.length);

            const coords = arr
              .map((pt: any) => {
                try {
                  if (!pt?.$?.lat || !pt?.$?.lon) {
                    throw new Error('Missing lat/lon attributes');
                  }
                  const lat = parseFloat(pt.$.lat);
                  const lon = parseFloat(pt.$.lon);
                  if (isNaN(lat) || isNaN(lon)) {
                    throw new Error('Invalid lat/lon numeric values');
                  }
                  return { lat, lon };
                } catch (err2) {
                  console.warn('[handleGpxUpload] Skipping invalid point:', pt, err2);
                  return null;
                }
              })
              .filter((x: Point | null): x is Point => x !== null);

            if (coords.length === 0) {
              throw new Error('No valid coordinates found in GPX');
            }
            resolve(coords);
          } catch (err2) {
            reject(err2);
          }
        });
      });

      console.log('[handleGpxUpload] => Starting nearest-line logic for', rawCoords.length, 'pts');
      // Clear any leftover roads
      cachedRoadsRef.current = null;

      const finalCoords = await assignSurfacesViaNearest(rawCoords);

      // Count results
      const pavedCount = finalCoords.filter((c) => c.surface === 'paved').length;
      const unpavedCount = finalCoords.length - pavedCount;
      console.log(
        `[handleGpxUpload] Surfaces assigned => paved=${pavedCount}, unpaved=${unpavedCount}, total=${finalCoords.length}`
      );

      // Now add to map
      addRouteToMap(finalCoords);
      console.log('[handleGpxUpload] => Route displayed with surfaces');
    },
    [isReady, assignSurfacesViaNearest, addRouteToMap]
  );

  // ------------------------------------------------------------------
  // Expose methods to parent
  // ------------------------------------------------------------------
  React.useImperativeHandle(
    ref,
    () => ({
      handleGpxUpload,
      isReady,
      on: (evt: string, cb: () => void) => {
        if (map.current) {
          map.current.on(evt, cb);
        }
      },
      off: (evt: string, cb: () => void) => {
        if (map.current) {
          map.current.off(evt, cb);
        }
      }
    }),
    [handleGpxUpload, isReady]
  );

  // ------------------------------------------------------------------
  // Map init => start at zoom=13, user can move freely
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('[MapContainer] Mapbox token not found');
      return;
    }
    try {
      mapboxgl.accessToken = mapboxToken;

      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [146.5, -41.5],
        zoom: 13
      } as any);

      map.current = newMap;

      newMap.on('load', () => {
        console.log('[MapContainer] Base map loaded');
        try {
          // Add your vector roads
          const tileUrl =
            'https://api.maptiler.com/tiles/5dd3666f-1ce4-4df6-9146-eda62a200bcb/{z}/{x}/{y}.pbf?key=DFSAZFJXzvprKbxHrHXv';
          newMap.addSource('australia-roads', {
            type: 'vector',
            tiles: [tileUrl],
            minzoom: 12,
            maxzoom: 14
          });

          newMap.addLayer({
            id: 'custom-roads',
            type: 'line',
            source: 'australia-roads',
            'source-layer': 'lutruwita',
            minzoom: 12,
            maxzoom: 14,
            layout: {
              visibility: 'visible'
            },
            paint: {
              'line-opacity': 1,
              'line-color': [
                'match',
                ['get', 'surface'],

                // Paved synonyms
                ['paved', 'asphalt', 'concrete', 'compacted', 'sealed', 'bitumen', 'tar'],
                '#4A90E2',

                // Unpaved synonyms
                ['unpaved', 'gravel', 'fine', 'fine_gravel', 'dirt', 'earth'],
                '#D35400',

                // fallback color
                '#888888'
              ],
              'line-width': 2
            }
          });

          setStreetsLayersLoaded(true);
          setIsMapReady(true);
          console.log('[MapContainer] Roads layer added, map is ready.');
        } catch (err) {
          console.error('[MapContainer] Error adding roads source/layer:', err);
        }
      });

      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
      newMap.addControl(new mapboxgl.FullscreenControl());
    } catch (err) {
      console.error('[MapContainer] Error creating map:', err);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full" />
      {surfaceProgress.isProcessing && (
        <LoadingOverlay
          progress={surfaceProgress.progress}
          total={surfaceProgress.total}
        />
      )}
    </div>
  );
});

MapContainer.displayName = 'MapContainer';

export default MapContainer;
export type { MapRef };
