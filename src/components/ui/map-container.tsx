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
import * as turf from '@turf/turf';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import type { Feature, Point as TurfPoint, GeoJsonProperties } from 'geojson';
import type { FeatureCollection } from 'geojson';
import type { LineString, MultiLineString } from 'geojson';
import DistanceMarker from './distance-marker';
import { createRoot } from 'react-dom/client';

// --------------------------------------------
// Type definitions for the component
// --------------------------------------------
interface MapRef {
  handleGpxUpload: (content: string) => Promise<void>;
  isReady: () => boolean;
  on: (event: string, callback: (event: any) => void) => void;
  off: (event: string, callback: (event: any) => void) => void;
}

interface Point {
  lat: number;
  lon: number;
  surface?: 'paved' | 'unpaved';
}

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  total: number;
  stage: 'parsing' | 'matching' | 'drawing';
  message: string;
}

interface MatchingResponse {
  code: string;
  matched_points: Array<{
    coordinates: [number, number];
    distance: number;
  }>;
  tracepoints: Array<{
    waypoint_index: number;
    location: [number, number];
    name?: string;
  }>;
  matchings: Array<{
    confidence: number;
    geometry: {
      coordinates: Array<[number, number]>;
      type: 'LineString';
    };
    legs: Array<{
      summary: string;
      steps: Array<any>;
      distance: number;
      duration: number;
    }>;
  }>;
}

// --------------------------------------------
// Loading Overlay UI Component - Updated for multiple stages
// --------------------------------------------
const LoadingOverlay = ({
  progress,
  total,
  stage,
  message
}: {
  progress: number;
  total: number;
  stage: 'parsing' | 'matching' | 'drawing';
  message: string;
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
      {stage === 'parsing' && 'Processing GPX file...'}
      {stage === 'matching' && 'Matching route to roads...'}
      {stage === 'drawing' && 'Drawing route...'}
    </Typography>
    <Typography color="white" gutterBottom>
      {message}
    </Typography>
    <Typography color="white">
      {progress} of {total} points processed
    </Typography>
  </Box>
);

// --------------------------------------------
// Surface Type Classification Arrays
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
// Helper Functions
// --------------------------------------------
const getDistancePoints = (
  map: mapboxgl.Map,
  lineString: Feature<LineString>,
  totalLength: number
) => {
  const zoom = map.getZoom();
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

// Queue system for parallel processing
class RequestQueue {
  private queue: (() => Promise<any>)[] = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  async add(request: () => Promise<any>): Promise<any> {
    this.queue.push(request);
    return this.process();
  }

  private async process(): Promise<any> {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const request = this.queue.shift();
    
    try {
      const result = await request!();
      return result;
    } finally {
      this.running--;
      this.process();
    }
  }
}

// --------------------------------------------
// Main MapContainer Component
// --------------------------------------------
const MapContainer = forwardRef<MapRef>((props, ref) => {
  const routeSourceId = 'route';
  const routeLayerId = 'route-layer';
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const requestQueue = useRef<RequestQueue>(new RequestQueue(3));

  const [isMapReady, setIsMapReady] = React.useState(false);
  const [processing, setProcessing] = React.useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    total: 0,
    stage: 'parsing',
    message: ''
  });

  // Check if map is ready
  const isReady = useCallback((): boolean => {
    const ready = Boolean(map.current) && isMapReady;
    console.log('[isReady] Map check =>', { ready, isMapReady });
    return ready;
  }, [isMapReady]);

  // Match route segment using Mapbox API
  const matchRouteSegment = async (points: Point[]): Promise<MatchingResponse> => {
    const coordinates = points.map(p => `${p.lon},${p.lat}`).join(';');
    const url = `https://api.mapbox.com/matching/v5/mapbox/driving/${coordinates}?access_token=${mapboxgl.accessToken}&tidy=true&geometries=geojson&radiuses=${Array(points.length).fill(25).join(';')}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Map matching failed: ${response.statusText}`);
    }
    return response.json();
  };

  // Process route segments in parallel
  const processRouteSegments = async (coords: Point[]) => {
    const segments: Point[][] = [];
    for (let i = 0; i < coords.length; i += 100) {
      segments.push(coords.slice(i, i + 100));
    }

    setProcessing(prev => ({
      ...prev,
      stage: 'matching',
      message: 'Matching route segments to roads...',
      total: segments.length,
      progress: 0
    }));

    const matchedSegments: MatchingResponse[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      try {
        const result = await requestQueue.current.add(() => 
          matchRouteSegment(segments[i])
        );
        matchedSegments.push(result);
        
        setProcessing(prev => ({
          ...prev,
          progress: i + 1
        }));
      } catch (error) {
        console.error('Error matching segment:', error);
        // Fall back to original points if matching fails
        const fallbackResponse: MatchingResponse = {
          code: 'NoMatch',
          matched_points: segments[i].map(p => ({
            coordinates: [p.lon, p.lat],
            distance: 0
          })),
          tracepoints: segments[i].map((p, idx) => ({
            waypoint_index: idx,
            location: [p.lon, p.lat]
          })),
          matchings: [{
            confidence: 0,
            geometry: {
              type: 'LineString',
              coordinates: segments[i].map(p => [p.lon, p.lat])
            },
            legs: [{
              summary: 'fallback',
              steps: [],
              distance: 0,
              duration: 0
            }]
          }]
        };
        matchedSegments.push(fallbackResponse);
      }
    }

    return matchedSegments;
  };

  // Add route to map with animation
  const addRouteToMap = useCallback(
    (matchedSegments: MatchingResponse[]) => {
      if (!map.current || !isReady()) {
        console.error('[addRouteToMap] Map not ready');
        return;
      }

      // Combine all matched coordinates
      const allCoordinates = matchedSegments.flatMap(segment => 
        segment.matchings[0].geometry.coordinates
      );

      // Clean up existing layers
      if (map.current.getSource(routeSourceId)) {
        if (map.current.getLayer(routeLayerId + '-white-stroke')) {
          map.current.removeLayer(routeLayerId + '-white-stroke');
        }
        if (map.current.getLayer(routeLayerId)) {
          map.current.removeLayer(routeLayerId);
        }
        if (map.current.getLayer(routeLayerId + '-unpaved')) {
          map.current.removeLayer(routeLayerId + '-unpaved');
        }
        map.current.removeSource(routeSourceId);
      }

      // Add source
      map.current.addSource(routeSourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: allCoordinates
          }
        }
      });

      // Add white stroke base layer
      map.current.addLayer({
        id: routeLayerId + '-white-stroke',
        type: 'line',
        source: routeSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 5,
          'line-dasharray': [1, 0]
        }
      });

      // Add main route layer
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
          'line-dasharray': [1, 0]
        }
      });

      // Start animation
      let progress = 0;
      const animateRoute = () => {
        progress += 0.005;
        
        map.current?.setPaintProperty(
          routeLayerId + '-white-stroke',
          'line-dasharray',
          [1, progress, 0, 0]
        );
        
        map.current?.setPaintProperty(
          routeLayerId,
          'line-dasharray',
          [1, progress, 0, 0]
        );

        if (progress < 2) {
          animationFrameRef.current = requestAnimationFrame(animateRoute);
        } else {
          // Animation complete
          setProcessing(prev => ({
            ...prev,
            isProcessing: false
          }));

          // Add distance markers
          const lineString = turf.lineString(allCoordinates);
          const totalLength = turf.length(lineString, { units: 'kilometers' });
          const distancePoints = getDistancePoints(map.current!, lineString, totalLength);

          distancePoints.forEach(({ point, distance }) => {
            const el = document.createElement('div');
            const root = createRoot(el);
            root.render(
              <DistanceMarker 
                distance={distance} 
                totalDistance={totalLength} 
              />
            );

            new mapboxgl.Marker({
              element: el,
              anchor: 'center',
              scale: 0.25
            })
              .setLngLat(point.geometry.coordinates)
              .addTo(map.current!);
          });
        }
      };

      animationFrameRef.current = requestAnimationFrame(animateRoute);
    },
    [isReady]
  );

  // Handle GPX upload
  const handleGpxUpload = useCallback(
    async (gpxContent: string) => {
      if (!map.current || !isReady()) {
        throw new Error('Map not ready');
      }

      setProcessing({
        isProcessing: true,
        progress: 0,
        total: 0,
        stage: 'parsing',
        message: 'Reading GPX file...'
      });

      // Parse GPX
      const rawCoords = await new Promise<Point[]>((resolve, reject) => {
        parseString(gpxContent, { explicitArray: false }, (err, result) => {
          if (err) {
            reject(new Error('Failed to parse GPX file'));
            return;
          }
          try {
            if (!result?.gpx) {
              throw new Error('Invalid GPX structure');
            }
            
            const points = result.gpx?.rte?.rtept || result.gpx?.trk?.trkseg?.trkpt;
            if (!points) {
              throw new Error('No track points found');
            }

            const arr = Array.isArray(points) ? points : [points];
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
            
                  console.log('[handleGpxUpload] => Starting route matching with', rawCoords.length, 'pts');
                  
                  // Match route segments
                  const matchedSegments = await processRouteSegments(rawCoords);
            
                  // Draw route with animation
                  setProcessing(prev => ({
                    ...prev,
                    stage: 'drawing',
                    message: 'Drawing route...',
                    progress: 0,
                    total: matchedSegments.length
                  }));
            
                  addRouteToMap(matchedSegments);
                },
                [isReady, addRouteToMap]
              );
            
              // Expose methods to parent
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
                  }
                }),
                [handleGpxUpload, isReady]
              );
            
              // Initialize map
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
                    bounds: [[144.5, -43.7], [148.5, -40.5]], // Tasmania bounds
                    fitBoundsOptions: {
                      padding: 50,
                      pitch: 0,
                      bearing: 0
                    }
                  });
            
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
                    
                    // Add roads layer
                    newMap.addLayer({
                      id: 'road-data',
                      type: 'line',
                      source: {
                        type: 'vector',
                        url: 'mapbox://mapbox.mapbox-streets-v8'
                      },
                      'source-layer': 'road',
                      paint: {
                        'line-color': [
                          'match',
                          ['get', 'surface'],
                          ['paved', 'asphalt', 'concrete', 'compacted', 'sealed', 'bitumen', 'tar'],
                          '#4A90E2',
                          ['unpaved', 'gravel', 'fine', 'fine_gravel', 'dirt', 'earth'],
                          '#D35400',
                          '#888888'
                        ],
                        'line-width': 2
                      }
                    });
            
                    setIsMapReady(true);
                  });
            
                  // Add navigation controls
                  newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
                  newMap.addControl(new mapboxgl.FullscreenControl());
            
                  // Handle zoom changes for distance markers
                  let currentInterval = 25;
                  newMap.on('zoom', () => {
                    const zoom = newMap.getZoom();
                    let newInterval = 25;
                    if (zoom >= 14) newInterval = 5;
                    else if (zoom >= 12) newInterval = 10;
                    else if (zoom >= 10) newInterval = 15;
            
                    if (newInterval !== currentInterval && newMap.getSource(routeSourceId)) {
                      currentInterval = newInterval;
                      // Remove existing markers
                      const markers = document.querySelectorAll('.mapboxgl-marker');
                      markers.forEach(marker => marker.remove());
                      
                      // Get current route
                      const source = newMap.getSource(routeSourceId) as mapboxgl.GeoJSONSource;
                      const data = (source as any)._data as Feature<LineString>;
                      
                      // Add new markers
                      const totalLength = turf.length(data, { units: 'kilometers' });
                      const distancePoints = getDistancePoints(newMap, data, totalLength);
                      
                      distancePoints.forEach(({ point, distance }) => {
                        const el = document.createElement('div');
                        const root = createRoot(el);
                        root.render(<DistanceMarker distance={distance} totalDistance={totalLength} />);
            
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
            
                return () => {
                  if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                  }
                  if (map.current) {
                    map.current.remove();
                    map.current = null;
                  }
                };
              }, []);
            
              // Render
              return (
                <div className="w-full h-full relative">
                  <div ref={mapContainer} className="w-full h-full" />
                  {processing.isProcessing && (
                    <LoadingOverlay
                      progress={processing.progress}
                      total={processing.total}
                      stage={processing.stage}
                      message={processing.message}
                    />
                  )}
                </div>
              );
            });
            
            MapContainer.displayName = 'MapContainer';
            
            export default MapContainer;
            export type { MapRef };