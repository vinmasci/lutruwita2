// --------------------------------------------
// Core imports required for the component
// --------------------------------------------
import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useState
} from 'react';
import { parseString } from 'xml2js';  // For parsing GPX files
import mapboxgl from 'mapbox-gl';      // Main mapping library
import { CircularProgress, Box, Typography } from '@mui/material';  // UI components
import 'mapbox-gl/dist/mapbox-gl.css';
import { findPhotosNearPoints, type PhotoDocument } from '@/lib/db';
import * as turf from '@turf/turf';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import type { 
  Feature,
  Point as TurfPoint,
  GeoJsonProperties,
  Position,
  LineString,
  MultiLineString,
  FeatureCollection
} from 'geojson';
import { mapService } from '@/services/maps';
import { PhotoModal } from '@/components/ui/photo-modal';
import DistanceMarker from './distance-marker';
import Supercluster from 'supercluster';
import { createRoot } from 'react-dom/client';

// --------------------------------------------
// Type definitions for the component
// --------------------------------------------
interface MapRef {
  // Methods exposed to parent components
  handleGpxUpload: (content: string) => Promise<void>;  // Main GPX processing function
  isReady: () => boolean;                               // Map readiness check
  on: (event: string, callback: (event: any) => void) => void;    // Event listener binding
  off: (event: string, callback: (event: any) => void) => void;   // Event listener removal
  getCurrentRoutes: () => Array<{
    id: string;
    name: string;
    color: string;
    isVisible: boolean;
    gpxData: string;
  }>;
  getCenter: () => { lng: number; lat: number; };
  getZoom: () => number;
  getPitch: () => number;
  getBearing: () => number;
  getStyle: () => string;
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

const getDistancePoints = (
  map: mapboxgl.Map | null,
  lineString: Feature<LineString>,
  totalLength: number
) => {
  if (!map) return [];

  const zoom = map.getZoom();
  // Set interval based on zoom level
  let interval = 25; // Default to 25km for zoomed out
  if (zoom >= 14) interval = 5;        // Very close zoom
  else if (zoom >= 12) interval = 10;  // Medium zoom
  else if (zoom >= 10) interval = 15;  // Medium-far zoom

  const points = [];
  
  // Always add start point
  points.push({
    point: turf.along(lineString, 0, { units: 'kilometers' }),
    distance: 0
  });

  // Add interval points if we're zoomed in enough
  if (zoom >= 9) {
    let distance = interval;
    while (distance < totalLength - interval/2) {
      points.push({
        point: turf.along(lineString, distance, { units: 'kilometers' }),
        distance: Math.round(distance)
      });
      distance += interval;
    }
  }

  // Always add end point
  points.push({
    point: turf.along(lineString, totalLength, { units: 'kilometers' }),
    distance: totalLength
  });

  return points;
};

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
  const cachedRoadsRef = useRef<FeatureCollection | null>(null);  // Temporary road data cache

  // State management
  const [isMapReady, setIsMapReady] = React.useState(false);
  const [streetsLayersLoaded, setStreetsLayersLoaded] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
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
    (coordinates: Point[], gpxContent: string) => {
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
      const featureColl: FeatureCollection = {
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
      } as FeatureCollection;

      // Add source data to map
      map.current.addSource(routeSourceId, {
        type: 'geojson',
        data: featureColl
      });

// Add white stroke base layer
map.current.addLayer({
  id: routeLayerId + '-white-stroke',
  type: 'line',
  source: routeSourceId,
  layout: {
    'line-join': 'round',
    'line-cap': 'round'
  },
  paint: {
    'line-color': '#FFFFFF',
    'line-width': 5
  }
});

// Add base layer - solid lines for paved segments
map.current.addLayer({
  id: routeLayerId,
  type: 'line',
  source: routeSourceId,
  layout: {
    'line-join': 'round',
    'line-cap': 'round'
  },
  paint: {
    'line-color': '#e17055',
    'line-width': 3,
    'line-opacity': [
      'case',
      ['==', ['get', 'surface'], 'paved'],
      1,
      0
    ]
  }
});

// Add dashed lines for unpaved segments
map.current.addLayer({
  id: routeLayerId + '-unpaved',
  type: 'line',
  source: routeSourceId,
  layout: {
    'line-join': 'round',
    'line-cap': 'round'
  },
  paint: {
    'line-color': '#e17055',
    'line-width': 3,
    'line-opacity': [
      'case',
      ['==', ['get', 'surface'], 'unpaved'],
      1,
      0
    ],
    'line-dasharray': [0.5, 1.5]
  }
});

// Calculate combined line for distance markers
const combinedLine = turf.lineString(
  featureColl.features.reduce((coords: number[][], feature) => {
    if (feature.geometry.type === 'LineString') {
      return [...coords, ...feature.geometry.coordinates];
    }
    return coords;
  }, [])
);

// Calculate total length in kilometers
const totalLength = turf.length(combinedLine, { units: 'kilometers' as const });

// Get distance points based on zoom level
const distancePoints = getDistancePoints(map.current, combinedLine, totalLength);

// Add markers for each distance point
distancePoints.forEach(({ point, distance }) => {
  const el = document.createElement('div');
  const root = createRoot(el);
  root.render(<DistanceMarker distance={distance} totalDistance={totalLength} />);

  new mapboxgl.Marker({
    element: el,
    anchor: 'center',
    scale: 0.25  // Make markers 4x smaller
  })
    .setLngLat(point.geometry.coordinates as [number, number])
    .addTo(map.current);
});

console.log('[addRouteToMap] -> route layers and distance markers added.');
    },
    [isReady]
  );

// ------------------------------------------------------------------
// Add photo markers to map
// Creates markers with popups for photos near the route
// ------------------------------------------------------------------
const addPhotoMarkersToMap = useCallback(async (coordinates: Point[]) => {
  if (!map.current) return;

  // Convert coordinates to format needed for photo query
  const points = coordinates.map(coord => ({
    longitude: coord.lon,
    latitude: coord.lat
  }));

  // Find photos near route
  const photos = await findPhotosNearPoints(points);

  // Remove any existing photo markers and modal containers
  document.querySelectorAll('.photo-marker').forEach(el => el.remove());
  document.querySelectorAll('.photo-modal-container').forEach(el => el.remove());

  // Create GeoJSON features for clustering
  const features = photos.map((photo, index) => ({
    type: 'Feature',
    properties: {
      id: `photo-${index}`,
      photo
    },
    geometry: {
      type: 'Point',
      coordinates: [photo.longitude, photo.latitude]
    }
  }));

  // Initialize supercluster
  const clusterIndex = new Supercluster({
    radius: 40,
    maxZoom: 16,
    minPoints: 2,
    initial: () => ({ photoCount: 0 })
  });

  clusterIndex.load(features);

  const createMarkerElement = (photo: any, count?: number) => {
    const el = document.createElement('div');
    el.className = 'photo-marker';
    el.style.position = 'relative';

    const imgContainer = document.createElement('div');
    imgContainer.style.position = 'relative';
    imgContainer.style.backgroundColor = '#1f2937';
    imgContainer.style.padding = '2px';
    imgContainer.style.borderRadius = '4px';
    imgContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
    imgContainer.style.width = 'fit-content';
    imgContainer.style.display = 'inline-block';
    imgContainer.style.cursor = 'pointer';

    const img = document.createElement('img');
    img.src = photo.url;
    img.alt = photo.originalName;
    img.style.width = '32px';
    img.style.height = '32px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '2px';
    img.style.border = '1px solid #374151';

    if (count) {
      const badge = document.createElement('div');
      badge.style.position = 'absolute';
      badge.style.top = '-8px';
      badge.style.right = '-8px';
      badge.style.backgroundColor = '#e17055';
      badge.style.color = 'white';
      badge.style.borderRadius = '9999px';
      badge.style.padding = '0px 4px'; // Reduced vertical padding, kept horizontal padding
      badge.style.fontSize = '10px';
      badge.style.fontWeight = 'bold';
      badge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      badge.textContent = `+${count}`;
      imgContainer.appendChild(badge);
    }

    const arrow = document.createElement('div');
    arrow.style.position = 'absolute';
    arrow.style.bottom = '-6px';
    arrow.style.left = '50%';
    arrow.style.transform = 'translateX(-50%)';
    arrow.style.width = '0';
    arrow.style.height = '0';
    arrow.style.borderLeft = '6px solid transparent';
    arrow.style.borderRight = '6px solid transparent';
    arrow.style.borderTop = '6px solid #1f2937';

    imgContainer.appendChild(img);
    imgContainer.appendChild(arrow);
    el.appendChild(imgContainer);

    return el;
  };

  const updateMarkers = () => {
    if (!map.current) return;

    const bounds = map.current.getBounds();
    const zoom = Math.floor(map.current.getZoom());

    const clusters = clusterIndex.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom
    );

    // Remove existing markers first
    document.querySelectorAll('.photo-marker-container').forEach(el => el.remove());

    clusters.forEach(cluster => {
      const coordinates = cluster.geometry.coordinates as [number, number];

      // Create marker container
      const markerEl = document.createElement('div');
      markerEl.className = 'mapboxgl-marker photo-marker-container';

      if (cluster.properties.cluster) {
        // Get cluster info
        const leaves = clusterIndex.getLeaves(cluster.properties.cluster_id, Infinity);
        const firstPhoto = leaves[0].properties.photo;
        const count = leaves.length - 1; // -1 because we're showing one photo

        const el = createMarkerElement(firstPhoto, count);
        markerEl.appendChild(el);

        // Create React root for the modal
        const modalContainer = document.createElement('div');
        modalContainer.className = 'photo-modal-container';
        document.body.appendChild(modalContainer);
        const modalRoot = createRoot(modalContainer);

        // Add click handler for cluster
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          // Zoom in when clicking cluster
          map.current?.flyTo({
            center: coordinates,
            zoom: zoom + 2
          });
        });
      } else {
        // Single photo marker
        const photo = cluster.properties.photo;
        const el = createMarkerElement(photo);
        markerEl.appendChild(el);

        // Create React root for the modal
        const modalContainer = document.createElement('div');
        modalContainer.className = 'photo-modal-container';
        document.body.appendChild(modalContainer);
        const modalRoot = createRoot(modalContainer);

        // Add click handler for single photo
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          modalRoot.render(
            <PhotoModal
              open={true}
              onClose={() => {
                modalRoot.render(
                  <PhotoModal
                    open={false}
                    onClose={() => {}}
                    photo={photo}
                  />
                );
              }}
              photo={photo}
            />
          );
        });
      }

      new mapboxgl.Marker({
        element: markerEl,
        anchor: 'bottom',
        offset: [0, 8],
        clickTolerance: 3
      })
        .setLngLat(coordinates)
        .addTo(map.current);
    });
  };

  // Initial update and add listeners
  updateMarkers();
  map.current.on('moveend', updateMarkers);
  map.current.on('zoomend', updateMarkers);

  console.log('Photo markers added to map');
}, []);

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
    const maxAttempts = 10;

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
          maxZoom: 14,  // Allow zooming in one more level at tricky spots
          minZoom: 12   // Allow zooming out if needed
        }
      );

// Convert point to pixel coordinates
const pointPixel = map.current?.project([pt.lon, pt.lat]);
if (!pointPixel) {
  console.warn('Could not convert point to pixel coordinates');
  return;
}

// First, do a wide scan to detect junction areas, but only for major roads
const wideAreaCheck = map.current?.queryRenderedFeatures([
  [pointPixel.x - 50, pointPixel.y - 50],
  [pointPixel.x + 50, pointPixel.y + 50]
], {
  layers: ['custom-roads'],
  filter: ['in', 'highway', 'trunk', 'primary', 'secondary', 'residential']  // Only get major roads
});

// Analyze the road features to detect junction characteristics
const isComplexJunction = wideAreaCheck && wideAreaCheck.length > 1;
let queryBox = 10; // default for regular road segments

if (isComplexJunction) {
  // Count unique road names/refs to better identify true junctions
  const uniqueRoads = new Set(
    wideAreaCheck
      .map(f => f.properties?.name || f.properties?.ref)
      .filter(Boolean)
  );
  
  // Adjust query box based on junction complexity
  if (uniqueRoads.size > 1) {
    queryBox = 30; // Major junction (different named roads)
  } else if (wideAreaCheck.length > 2) {
    queryBox = 20; // Minor junction or approach area
  }
}

// Use features array to store all found features
let features = map.current?.queryRenderedFeatures([
  [pointPixel.x - queryBox, pointPixel.y - queryBox],
  [pointPixel.x + queryBox, pointPixel.y + queryBox]
], {
  layers: ['custom-roads']
}) || [];

// If still no features found at a junction, try a circular pattern
if (isComplexJunction && features.length === 0) {
  // Try querying in a circular pattern around the point
  for (let angle = 0; angle < 360; angle += 45) {
    const radian = (angle * Math.PI) / 180;
    const offsetX = Math.cos(radian) * 40;
    const offsetY = Math.sin(radian) * 40;
    
    const radialFeatures = map.current?.queryRenderedFeatures([
      [pointPixel.x + offsetX - 10, pointPixel.y + offsetY - 10],
      [pointPixel.x + offsetX + 10, pointPixel.y + offsetY + 10]
    ], {
      layers: ['custom-roads']
    });
    
    if (radialFeatures && radialFeatures.length > 0) {
      features = features.concat(radialFeatures);
      break;
    }
  }
}

// After all queries (including circular pattern) are complete
if (features && features.length > 0) {
  // Ensure all features are unique by creating a map keyed by feature geometry
  const uniqueFeaturesMap = new Map();
  features.forEach(f => {
    const key = JSON.stringify(f.geometry.coordinates);
    uniqueFeaturesMap.set(key, f);
  });
  
  const uniqueFeatures = Array.from(uniqueFeaturesMap.values());
  
  cachedRoadsRef.current = turf.featureCollection(
    uniqueFeatures.map((f) => turf.feature(f.geometry, f.properties))
  );
  

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
      // Create properly typed point feature using turf helper
      const pointFeature = turf.point([pt.lon, pt.lat]);

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
      
      // Create properly typed road feature
      const roadFeature: Feature<LineString | MultiLineString> = {
        type: 'Feature',
        geometry: road.geometry,
        properties: road.properties
      };
      // Ensure coordinates are properly typed as number[][]
      const lineCoords = road.geometry.type === 'LineString' 
        ? road.geometry.coordinates as number[][]
        : road.geometry.coordinates[0] as number[][];
      
      // Create properly typed features using turf helpers
      const lineFeature = turf.lineString(lineCoords, road.properties);
      const pointFeature = turf.point([pt.lon, pt.lat]);
      
      const snap = nearestPointOnLine(lineFeature, pointFeature);
      const dist = snap.properties.dist; // in km
// Add a small threshold to prefer staying on main roads
const DISTANCE_THRESHOLD = 0.001; // 1 meter buffer

if (dist < minDist - DISTANCE_THRESHOLD || 
   (road.properties?.highway === 'trunk' && dist < minDist + DISTANCE_THRESHOLD)) {
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

// Ensure all points are processed before continuing
if (!finalCoords || finalCoords.length !== rawCoords.length) {
  console.error('[handleGpxUpload] Not all points were processed');
  return;
}

// Calculate surface statistics
const pavedCount = finalCoords.filter((c) => c.surface === 'paved').length;
      const unpavedCount = finalCoords.length - pavedCount;
      console.log(
        `[handleGpxUpload] Surfaces assigned => paved=${pavedCount}, unpaved=${unpavedCount}, total=${finalCoords.length}`
      );

// Add the processed route to the map with original GPX content
addRouteToMap(finalCoords, gpxContent);  // Pass the GPX content
console.log('[handleGpxUpload] => Route displayed with surfaces');

// Add photo markers
await addPhotoMarkersToMap(finalCoords);
console.log('[handleGpxUpload] => Photo markers added');
    },
    [isReady, assignSurfacesViaNearest, addRouteToMap, addPhotoMarkersToMap]
  );
  // Save map handler
  const handleSaveMap = useCallback(async (data: {
    name: string;
    description: string;
    isPublic: boolean;
  }) => {
    if (!map.current) return;

    try {
      // Get current route data
      const source = map.current.getSource(routeSourceId) as mapboxgl.GeoJSONSource;
      const routeData = (source as any)._data as FeatureCollection;

      // Create map data object
      const mapData = {
        ...data,
        route: routeData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to database
      const savedMap = await mapService.createMap(mapData);
      console.log('Map saved successfully:', savedMap);
    } catch (error) {
      console.error('Error saving map:', error);
    }
  }, []);

  // ------------------------------------------------------------------
  // Expose methods to parent component
  // Makes key functionality available to parent components
  // ------------------------------------------------------------------
  interface Route {
    id: string;
    name: string;
    color: string;
    isVisible: boolean;
    gpxData: string;
  }
  
  const [routeStore, setRouteStore] = useState<Route[]>([]);
  
  React.useImperativeHandle(
    ref,
    () => ({
      handleGpxUpload,
      isReady,
      on: (evt: string, cb: (event: any) => void) => {
        if (map.current) {
          map.current.on(evt, cb);
        }
      },
      off: (evt: string, cb: (event: any) => void) => {
        if (map.current) {
          map.current.off(evt, cb);
        }
      },
      getCurrentRoutes: () => routeStore,
      getCenter: () => {
        if (!map.current) return { lng: 0, lat: 0 };
        const center = map.current.getCenter();
        return { lng: center.lng, lat: center.lat };
      },
      getZoom: () => {
        if (!map.current) return 0;
        return map.current.getZoom();
      },
      getPitch: () => {
        if (!map.current) return 0;
        return map.current.getPitch();
      },
      getBearing: () => {
        if (!map.current) return 0;
        return map.current.getBearing();
      },
      getStyle: () => {
        if (!map.current) return 'mapbox://styles/mapbox/satellite-streets-v12';
        return map.current.getStyle().name || 'mapbox://styles/mapbox/satellite-streets-v12';
      }
    }),
    [handleGpxUpload, isReady, routeStore]
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
        bounds: [[144.5, -43.7], [148.5, -40.5]], // Tasmania bounds: [west, south], [east, north]
        fitBoundsOptions: {
          padding: 50,
          pitch: 0,  // Bird's eye view (looking straight down)
          bearing: 0
        }
      } as any);

      map.current = newMap;

      newMap.on('load', () => {
        // Add terrain source and layer
        newMap.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });
        
        // Add terrain layer
        newMap.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
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

// Track current interval
let currentInterval = 25;

// Add zoom change handler to update distance markers
newMap.on('zoom', () => {
  const zoom = newMap.getZoom();
  // Calculate new interval based on zoom
  let newInterval = 25; // Default
  if (zoom >= 14) newInterval = 5;        // Very close zoom
  else if (zoom >= 12) newInterval = 10;  // Medium zoom
  else if (zoom >= 10) newInterval = 15;  // Medium-far zoom

  // Only update if interval changed
  if (newInterval !== currentInterval && newMap.getSource(routeSourceId)) {
    currentInterval = newInterval;
// Remove only distance markers, explicitly excluding photo markers
const distanceMarkers = document.querySelectorAll('.mapboxgl-marker:not(.photo-marker):not(.photo-marker-container)');
distanceMarkers.forEach(marker => marker.remove());
    
    // Get current route data
    const source = newMap.getSource(routeSourceId) as mapboxgl.GeoJSONSource;
    const data = (source as any)._data as FeatureCollection;
    
    // Rebuild combined line
    const combinedLine = turf.lineString(
      data.features.reduce((coords: number[][], feature) => {
        if (feature.geometry.type === 'LineString') {
          return [...coords, ...feature.geometry.coordinates];
        }
        return coords;
      }, [])
    );

    // Calculate length and add new markers
    const totalLength = turf.length(combinedLine, { units: 'kilometers' });
    const distancePoints = getDistancePoints(newMap, combinedLine, totalLength);
    
    distancePoints.forEach(({ point, distance }) => {
      const el = document.createElement('div');
      const root = createRoot(el);
      root.render(<DistanceMarker distance={distance} />);

      new mapboxgl.Marker({
        element: el,
        anchor: 'center',
        scale: 0.25
      })
        .setLngLat(point.geometry.coordinates)
        .addTo(newMap);
    });
  }


});

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
