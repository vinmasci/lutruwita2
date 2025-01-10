// --------------------------------------------
// Core imports required for the component
// --------------------------------------------
import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef
} from 'react';
import { parseString } from 'xml2js';  // For parsing GPX files
import mapboxgl from 'mapbox-gl';      // Main mapping library
import { CircularProgress, Box, Typography } from '@mui/material';  // UI components
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';    // For geospatial calculations

// --------------------------------------------
// Type definitions for the component
// --------------------------------------------
interface MapRef {
  // Methods exposed to parent components
  handleGpxUpload: (content: string) => Promise<void>;  // Main GPX processing function
  isReady: () => boolean;                               // Map readiness check
  on: (event: string, callback: () => void) => void;    // Event listener binding
  off: (event: string, callback: () => void) => void;   // Event listener removal
}

interface Point {
  // Definition of a geographic point with surface type
  lat: number;
  lon: number;
  surface?: 'paved' | 'unpaved';
}

interface SurfaceProgressState {
  // State tracking for surface detection progress
  isProcessing: boolean;
  progress: number;
  total: number;
}

// --------------------------------------------
// Loading Overlay UI Component
// Shows progress during GPX processing
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
// Surface Type Classification Arrays
// Used to categorize different road surface types
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
// Main MapContainer Component
// Handles all map rendering and GPX processing
// --------------------------------------------
const MapContainer = forwardRef<MapRef>((props, ref) => {
  // Constants for identifying map layers
  const routeSourceId = 'route';
  const routeLayerId = 'route-layer';

  // Core references
  const mapContainer = useRef<HTMLDivElement>(null);         // DOM element for map
  const map = useRef<mapboxgl.Map | null>(null);            // Mapbox instance
  const cachedRoadsRef = useRef<turf.FeatureCollection | null>(null);  // Temporary road data cache

  // State management
  const [isMapReady, setIsMapReady] = React.useState(false);
  const [streetsLayersLoaded, setStreetsLayersLoaded] = React.useState(false);
  const [surfaceProgress, setSurfaceProgress] = React.useState<SurfaceProgressState>({
    isProcessing: false,
    progress: 0,
    total: 0
  });

  // ------------------------------------------------------------------
  // isReady => Checks if map and all layers are fully loaded
  // Used to ensure map is ready before processing GPX data
  // ------------------------------------------------------------------
  const isReady = useCallback((): boolean => {
    const ready = Boolean(map.current) && isMapReady && streetsLayersLoaded;
    console.log('[isReady] Map check =>', { ready, isMapReady, streetsLayersLoaded });
    return ready;
  }, [isMapReady, streetsLayersLoaded]);

  // ------------------------------------------------------------------
  // addRouteToMap => Takes processed points and renders route on map
  // - Splits route into segments based on surface type
  // - Creates different styles for paved/unpaved sections
  // - Handles map layer management
  // ------------------------------------------------------------------
  const addRouteToMap = useCallback(
    (coordinates: Point[]) => {
      if (!map.current || !isReady()) {
        console.error('[addRouteToMap] Map not ready, cannot add route');
        return;
      }

      // Split route into segments based on surface changes
      console.log('[addRouteToMap] Splitting route into segments by surface...');
      let segments: { points: Point[]; surface: 'paved' | 'unpaved' }[] = [];
      let currentSegment: Point[] = [];
      let currentSurface: 'paved' | 'unpaved' = coordinates[0]?.surface || 'unpaved';

      // Process each point to build segments
      for (let i = 0; i < coordinates.length; i++) {
        const c = coordinates[i];
        // Start new segment if surface type changes
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
        // Handle last point
        if (i === coordinates.length - 1) {
          segments.push({
            points: [...currentSegment],
            surface: currentSurface
          });
        }
      }

      console.log('[addRouteToMap] Created', segments.length, 'segments total.');

      // Clean up any existing route layers
      if (map.current.getSource(routeSourceId)) {
        if (map.current.getLayer(routeLayerId)) {
          map.current.removeLayer(routeLayerId);
        }
        map.current.removeSource(routeSourceId);
      }

      // Create GeoJSON feature collection from segments
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

      // Add source data to map
      map.current.addSource(routeSourceId, {
        type: 'geojson',
        data: featureColl
      });

      // Add base layer - solid lines for all segments
      map.current.addLayer({
        id: routeLayerId,
        type: 'line',
        source: routeSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#FF4444',  // Base red color
          'line-width': 4
        }
      });

      // Add overlay layer - dashed lines for unpaved segments
      map.current.addLayer({
        id: routeLayerId + '-unpaved-overlay',
        type: 'line',
        source: routeSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#FFB3B3',  // Lighter red for dashed overlay
          'line-width': 4,
          'line-opacity': [
            'case',
            ['==', ['get', 'surface'], 'unpaved'],
            1,
            0
          ],
          'line-dasharray': [1, 0.5]  // Dashed pattern for unpaved
        }
      });
      console.log('[addRouteToMap] -> route layers added.');
    },
    [isReady]
  );

  // ------------------------------------------------------------------
  // assignSurfacesViaNearest => Core surface detection function
  // Process:
  // 1. Takes GPX points in chunks of 5
  // 2. For each chunk:
  //    - Moves map to first point's location
  //    - Loads road data for that area
  //    - Finds nearest road for each point
  //    - Assigns surface type based on road properties
  // 3. Updates progress as it goes
  // ------------------------------------------------------------------
  const assignSurfacesViaNearest = useCallback(
    async (coords: Point[]) => {
      if (!map.current) {
        console.log('[assignSurfacesViaNearest] No map.current, returning coords unmodified');
        return coords;
      }

      // Initialize progress tracking
      setSurfaceProgress({
        isProcessing: true,
        progress: 0,
        total: coords.length
      });

      const results: Point[] = [];

      // Process points in chunks of 5 to avoid stale data
// Process one point at a time
for (let i = 0; i < coords.length; i++) {
  const pt = coords[i];

  await new Promise<void>((resolve) => {
    let attempts = 0;
    const maxAttempts = 15;

    const checkTiles = () => {
      // bounding box ~0.001 deg => ~100m in each direction
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

      const features = map.current?.queryRenderedFeatures(undefined, {
        layers: ['custom-roads']
      });

      console.log('[assignSurfacesViaNearest] Attempt vantage for point:', {
        index: i,
        boundingBox: bbox,
        found: features?.length || 0,
        location: [pt.lat, pt.lon]
      });

      if (features && features.length > 0) {
        cachedRoadsRef.current = turf.featureCollection(
          features.map((f) => turf.feature(f.geometry, f.properties))
        );
        console.log('[assignSurfacesViaNearest] => Found roads:', {
          roadsCount: features.length
        });
        resolve();
        return;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        console.warn('[assignSurfacesViaNearest] Max attempts reached => no roads found for point:', i);
        cachedRoadsRef.current = null;
        resolve();
        return;
      }

      setTimeout(checkTiles, 400);
    };

    checkTiles();
  });

  // Process the single point
  const vantageRoads = cachedRoadsRef.current;
  let bestSurface: 'paved' | 'unpaved' = 'unpaved';
  let minDist = Infinity;
  const pointGeo = turf.point([pt.lon, pt.lat]);

  if (i % 100 === 0) {
    console.log(
      `[assignSurfacesViaNearest] Processing point #${i}, coords=(${pt.lat}, ${pt.lon})`
    );
  }

  // If vantageRoads is empty, default to unpaved
  if (!vantageRoads || vantageRoads.features.length === 0) {
    results.push({ ...pt, surface: 'unpaved' });
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
    results.push({ ...pt, surface: bestSurface });
  }

  setSurfaceProgress((prev) => ({
    ...prev,
    progress: i + 1
  }));

  // Clear roads cache after each point
  cachedRoadsRef.current = null;
}

      // Finalize processing
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
  // handleGpxUpload => Main entry point for GPX processing
  // Process:
  // 1. Validates input and map readiness
  // 2. Parses GPX file into coordinate points
  // 3. Processes points to detect surface types
  // 4. Renders final route on map
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

      // Parse GPX file
      console.log('[handleGpxUpload] Parsing GPX...');
      const rawCoords = await new Promise<Point[]>((resolve, reject) => {
        parseString(gpxContent, { explicitArray: false }, (err: Error | null, result: any) => {
          if (err) {
            // If XML parsing fails, reject with error
            console.error('[handleGpxUpload] parseString error:', err);
            reject(new Error('Failed to parse GPX file'));
            return;
          }
          try {
            // Check for required GPX root element
            if (!result?.gpx) {
              throw new Error('Invalid GPX structure: missing root gpx element');
            }
            // Try to get points from either route (rte/rtept) or track (trk/trkseg/trkpt)
            const points = result.gpx?.rte?.rtept || result.gpx?.trk?.trkseg?.trkpt;
            if (!points) {
              throw new Error('Invalid GPX format: missing track points');
            }

            // Handle both single point and array of points
            const arr = Array.isArray(points) ? points : [points];
            console.log('[handleGpxUpload] Points found:', arr.length);

            // Transform each point to our internal format
            const coords = arr
              .map((pt: any) => {
                try {
                  // Extract lat/lon from GPX format
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
                  // Log and skip invalid points
                  console.warn('[handleGpxUpload] Skipping invalid point:', pt, err2);
                  return null;
                }
              })
              // Remove any invalid points that returned null
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
      // Clear any leftover roads from previous operations
      cachedRoadsRef.current = null;

      // Process all points to detect surface types
      const finalCoords = await assignSurfacesViaNearest(rawCoords);

      // Calculate surface statistics
      const pavedCount = finalCoords.filter((c) => c.surface === 'paved').length;
      const unpavedCount = finalCoords.length - pavedCount;
      console.log(
        `[handleGpxUpload] Surfaces assigned => paved=${pavedCount}, unpaved=${unpavedCount}, total=${finalCoords.length}`
      );

      // Add the processed route to the map
      addRouteToMap(finalCoords);
      console.log('[handleGpxUpload] => Route displayed with surfaces');
    },
    [isReady, assignSurfacesViaNearest, addRouteToMap]
  );
  // ------------------------------------------------------------------
  // Expose methods to parent component
  // Makes key functionality available to parent components
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
  // Map initialization
  // Sets up the map and loads necessary layers
  // Called once when component mounts
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

      // Create new map instance
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [146.5, -41.5],  // Tasmania center
        zoom: 13
      } as any);

      map.current = newMap;

      newMap.on('load', () => {
        console.log('[MapContainer] Base map loaded');
        try {
          // Add MapTiler vector tile source containing road data
          const tileUrl =
            'https://api.maptiler.com/tiles/5dd3666f-1ce4-4df6-9146-eda62a200bcb/{z}/{x}/{y}.pbf?key=DFSAZFJXzvprKbxHrHXv';
          newMap.addSource('australia-roads', {
            type: 'vector',
            tiles: [tileUrl],
            minzoom: 12,
            maxzoom: 14
          });

          // Add custom roads layer with surface-based styling
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

                // Color roads based on surface type
                // Paved roads in blue
                ['paved', 'asphalt', 'concrete', 'compacted', 'sealed', 'bitumen', 'tar'],
                '#4A90E2',

                // Unpaved roads in orange
                ['unpaved', 'gravel', 'fine', 'fine_gravel', 'dirt', 'earth'],
                '#D35400',

                // Unknown surfaces in grey
                '#888888'
              ],
              'line-width': 2
            }
          });

          // Mark map as ready
          setStreetsLayersLoaded(true);
          setIsMapReady(true);
          console.log('[MapContainer] Roads layer added, map is ready.');
        } catch (err) {
          console.error('[MapContainer] Error adding roads source/layer:', err);
        }
      });

      // Add standard map controls
      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
      newMap.addControl(new mapboxgl.FullscreenControl());
    } catch (err) {
      console.error('[MapContainer] Error creating map:', err);
    }

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // ------------------------------------------------------------------
  // Render the map component with loading overlay when processing
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