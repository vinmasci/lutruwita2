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
// The main MapContainer
// --------------------------------------------
const MapContainer = forwardRef<MapRef>((props, ref) => {
  const routeSourceId = 'route';
  const routeLayerId = 'route-layer';
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
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
  // debugRoadSource => logs if the "australia-roads" source is loaded
  // ------------------------------------------------------------------
  const debugRoadSource = useCallback(() => {
    if (!map.current) {
      console.log('[debugRoadSource] No map instance');
      return;
    }
    const style = map.current.getStyle();
    if (!style) {
      console.log('[debugRoadSource] No style loaded yet');
      return;
    }

    const currentZoom = map.current.getZoom();
    const roadsSource = style.sources['australia-roads'];
    console.log('[debugRoadSource] Current state:', {
      zoom: currentZoom,
      isZoom13: Math.abs(currentZoom - 13) < 0.1,
      roadsSource
    });

    const rawSource = map.current.getSource('australia-roads') as any;
    if (rawSource && rawSource.vectorLayers) {
      console.log('[debugRoadSource] vectorLayers:', rawSource.vectorLayers);
    } else {
      console.warn('[debugRoadSource] No vectorLayers found. Current zoom:', currentZoom);
    }

    // If we're not at zoom 13, force it
    if (Math.abs(currentZoom - 13) >= 0.1) {
      console.log('[debugRoadSource] Forcing zoom to 13');
      map.current.setZoom(13);
    }
}, []);

  // ------------------------------------------------------------------
  // getRoadsAtZoom13 => queries the "australia-roads" source features at zoom 13
  // ------------------------------------------------------------------
  const getRoadsAtZoom13 = useCallback(async () => {
    if (!map.current) {
      console.log('[getRoadsAtZoom13] No map instance');
      return turf.featureCollection([]);
    }

    // Wait for tiles to load
    await new Promise<void>((resolve) => {
      const checkData = () => {
        const features = map.current?.querySourceFeatures('australia-roads', {
          sourceLayer: 'lutruwita'
        });
        
        console.log('[getRoadsAtZoom13] Checking for data...', {
          featureCount: features?.length || 0,
          zoom: map.current?.getZoom()
        });

        if (features && features.length > 0) {
          resolve();
        } else {
          setTimeout(checkData, 100);
        }
      };

      checkData();
    });

    const features = map.current.querySourceFeatures('australia-roads', {
      sourceLayer: 'lutruwita'
    });

    if (!features || features.length === 0) {
      console.warn('[getRoadsAtZoom13] No road features returned at z=13 (or near 13) ...');
      return turf.featureCollection([]);
    }

    const roads = features.map((f) => turf.feature(f.geometry, f.properties));
    console.log(`[getRoadsAtZoom13] Found ${roads.length} road features at z=13 query`);
    return turf.featureCollection(roads);
}, []);

  // ------------------------------------------------------------------
  // assignSurfacesViaNearest => forcibly jump map to bounding box center @ z=13,
  // then do a 500ms delay, then query roads
  // ------------------------------------------------------------------
  const assignSurfacesViaNearest = useCallback(
    async (coords: Point[]) => {
      if (!map.current) {
        console.log('[assignSurfacesViaNearest] No map.current, returning');
        return coords;
      }

      // 1) Compute bounding box
      const bounds = coords.reduce(
        (acc, c) => ({
          minLat: Math.min(acc.minLat, c.lat),
          maxLat: Math.max(acc.maxLat, c.lat),
          minLon: Math.min(acc.minLon, c.lon),
          maxLon: Math.max(acc.maxLon, c.lon)
        }),
        { minLat: 90, maxLat: -90, minLon: 180, maxLon: -180 }
      );
      console.log('[assignSurfacesViaNearest] Computed bounding box =>', bounds);

      // 2) Compute a center for that bounding box
      const centerLon = (bounds.minLon + bounds.maxLon) / 2;
      const centerLat = (bounds.minLat + bounds.maxLat) / 2;
      console.log(
        '[assignSurfacesViaNearest] Jumping instantly to center =>',
        [centerLon, centerLat],
        'at z=13'
      );

      // Force jump (no animation), so no waiting for moveend
      // The user can still zoom in/out afterward, because we do NOT enforce minZoom=13, maxZoom=13.
// Move map and wait for tiles
await new Promise<void>((resolve) => {
  const onSourceData = (e: any) => {
    if (e.sourceId === 'australia-roads' && e.isSourceLoaded && e.tile) {
      console.log('[assignSurfacesViaNearest] Tile loaded:', {
        coord: e.tile.tileID.canonical,
        hasData: e.tile.hasData
      });
      if (e.tile.hasData) {
        map.current?.off('sourcedata', onSourceData);
        setTimeout(resolve, 200); // Extra 200ms to be safe
      }
    }
  };

  map.current?.on('sourcedata', onSourceData);
  map.current?.jumpTo({
    center: [centerLon, centerLat],
    zoom: 13
  });

  // Failsafe timeout after 3 seconds
  setTimeout(() => {
    map.current?.off('sourcedata', onSourceData);
    console.log('[assignSurfacesViaNearest] Failsafe timeout - proceeding anyway');
    resolve();
  }, 3000);
});

// Debug current state
debugRoadSource();

      // 4) Debug the roads source
      debugRoadSource();

      // 5) Query all roads at z=13
      const roadsFC = await getRoadsAtZoom13();
      if (!roadsFC || roadsFC.features.length === 0) {
        console.warn('[assignSurfacesViaNearest] No roads found at z=13, defaulting to unpaved.');
        return coords.map((c) => ({ ...c, surface: 'unpaved' }));
      }

      console.log('[assignSurfacesViaNearest] Starting nearest-line logic...');
      setSurfaceProgress({
        isProcessing: true,
        progress: 0,
        total: coords.length
      });

      const results: Point[] = [];
      for (let i = 0; i < coords.length; i++) {
        // Every 100 points, move the viewport
        if (i % 100 === 0) {
          const pt = coords[i];
          map.current.jumpTo({
            center: [pt.lon, pt.lat],
            zoom: 13
          });
          // Wait for tiles to load
          await new Promise<void>((resolve) => setTimeout(resolve, 500));
          debugRoadSource();
        }
      
        const pt = coords[i];
        try {
          const pointGeo = turf.point([pt.lon, pt.lat]);
          let bestSurface: 'paved' | 'unpaved' = 'unpaved';
          let minDist = Infinity;

          // We'll skip logging for every single road, but let's log every 100 points
          if (i % 100 === 0) {
            console.log(
              `[assignSurfacesViaNearest] Processing point #${i}, coords=(${pt.lat}, ${pt.lon})`
            );
          }

          for (const road of roadsFC.features) {
            if (
              road.geometry.type !== 'LineString' &&
              road.geometry.type !== 'MultiLineString'
            )
              continue;
            const snap = turf.nearestPointOnLine(road, pointGeo);
            const dist = snap.properties.dist; // in km
            if (dist < minDist) {
              minDist = dist;
              const sRaw = road.properties?.surface?.toLowerCase() || '';
              if (['paved', 'asphalt', 'concrete', 'compacted'].includes(sRaw)) {
                bestSurface = 'paved';
              } else if (['unpaved', 'gravel'].includes(sRaw)) {
                bestSurface = 'unpaved';
              }
            }
          }
          results.push({ ...pt, surface: bestSurface });
        } catch (err) {
          console.warn('[assignSurfacesViaNearest] Error on point', i, err);
          results.push({ ...pt, surface: 'unpaved' });
        }

        if (i % 100 === 0) {
          console.log(
            `[assignSurfacesViaNearest] -> partial result: point #${i}, bestSurface=`,
            results[i]?.surface
          );
        }

        setSurfaceProgress((prev) => ({
          ...prev,
          progress: i + 1
        }));
      }

      setSurfaceProgress((prev) => ({
        ...prev,
        isProcessing: false
      }));
      console.log('[assignSurfacesViaNearest] Finished. Returning processed coords...');
      return results;
    },
    [debugRoadSource, getRoadsAtZoom13]
  );

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
  // handleGpxUpload => parse, assign surfaces, then add route
  // ------------------------------------------------------------------
  const handleGpxUpload = useCallback(
    async (gpxContent: string) => {
      console.log('[handleGpxUpload] Checking if map is ready...');
      if (!map.current || !isReady()) {
        console.warn('[handleGpxUpload] Map not fully ready, aborting GPX upload');
        throw new Error('Map not ready. Try again later.');
      }
      if (!gpxContent || typeof gpxContent !== 'string') {
        throw new Error('Invalid GPX content');
      }

      console.log('[handleGpxUpload] Parsing GPX...');
      const rawCoords = await new Promise<Point[]>((resolve, reject) => {
        parseString(
          gpxContent,
          { explicitArray: false },
          (err: Error | null, result: any) => {
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
          }
        );
      });

      console.log('[handleGpxUpload] Calling assignSurfacesViaNearest...');
      const finalCoords = await assignSurfacesViaNearest(rawCoords);

      const pavedCount = finalCoords.filter((c) => c.surface === 'paved').length;
      const unpavedCount = finalCoords.length - pavedCount;
      console.log(
        `[handleGpxUpload] Surfaces assigned. Paved=${pavedCount}, Unpaved=${unpavedCount} (total=${finalCoords.length})`
      );

      console.log('[handleGpxUpload] Adding route to map...');
      addRouteToMap(finalCoords);
      console.log('[handleGpxUpload] -> Route displayed with surfaces!');
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
        if (map.current) map.current.on(evt, cb);
      },
      off: (evt: string, cb: () => void) => {
        if (map.current) map.current.off(evt, cb);
      }
    }),
    [handleGpxUpload, isReady]
  );

  // ------------------------------------------------------------------
  // Initialize Map => but DO NOT lock at zoom=13
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

      // We START at zoom=13, but do NOT lock minZoom or maxZoom
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [146.5, -41.5],
        zoom: 13
        // no minZoom, no maxZoom => user can zoom freely
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
            layout: { visibility: 'visible' },
            paint: {
              'line-opacity': 1,
              'line-color': [
                'match',
                ['get', 'surface'],
                ['paved', 'asphalt', 'concrete', 'compacted'],
                '#4A90E2',
                ['unpaved', 'gravel'],
                '#D35400',
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

      // The user can zoom in/out freely now
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
