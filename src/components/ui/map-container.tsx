// src/components/ui/map-container.tsx
import React, { useEffect, useRef, useCallback, forwardRef } from 'react';
import { parseString } from 'xml2js';
import mapboxgl, { Point as MapboxPoint } from 'mapbox-gl';
import { CircularProgress, Box, Typography } from '@mui/material';
import 'mapbox-gl/dist/mapbox-gl.css';

// Previous interfaces remain the same...
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

// Previous LoadingOverlay component remains the same...
const LoadingOverlay = ({ progress, total }: { progress: number; total: number }) => (
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
      zIndex: 1000,
    }}
  >
    <CircularProgress size={60} sx={{ mb: 2 }} />
    <Typography variant="h6" color="white" gutterBottom>
      Processing Surface Types
    </Typography>
    <Typography color="white">
      {progress} of {total} points processed
    </Typography>
  </Box>
);

const MapContainer = forwardRef<MapRef>((props, ref) => {
  // Previous state and refs remain the same...
  const routeSourceId = 'route';
  const routeLayerId = 'route-layer';
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = React.useState(false);
  const [streetsLayersLoaded, setStreetsLayersLoaded] = React.useState(false);
  const [surfaceProgress, setSurfaceProgress] = React.useState<SurfaceProgressState>({
    isProcessing: false,
    progress: 0,
    total: 0
  });

  const isReady = useCallback((): boolean => {
    return Boolean(map.current) && isMapReady && streetsLayersLoaded;
  }, [isMapReady, streetsLayersLoaded]);

  const querySurfaceType = async (point: Point): Promise<'paved' | 'unpaved'> => {
    if (!map.current) return 'unpaved';

    // Ensure we're at zoom level 13
    if (map.current.getZoom() !== 13) {
      map.current.setZoom(13);
      // Wait for zoom to complete
      await new Promise<void>(resolve => {
        map.current?.once('moveend', () => resolve());
      });
    }

    // Wait for tiles to load
    await new Promise<void>(resolve => {
      if (map.current?.areTilesLoaded()) {
        resolve();
      } else {
        map.current?.once('idle', () => resolve());
      }
    });

    const projectedPoint = map.current.project([point.lon, point.lat]);
    const features = map.current.queryRenderedFeatures(
      [[projectedPoint.x - 1, projectedPoint.y - 1], [projectedPoint.x + 1, projectedPoint.y + 1]],
      { layers: ['custom-roads'] }
    );

    console.log('Features at point:', [point.lon, point.lat], features.map(f => ({
      surface: f.properties?.surface,
      highway: f.properties?.highway
    })));

    for (const feature of features) {
      const surface = feature.properties?.surface;
      if (surface === 'paved') {
        return 'paved';
      }
    }

    return 'unpaved';
  };

  // Rest of the component implementation remains the same...
  const processCoordinatesWithSurface = async (coordinates: Point[]): Promise<Point[]> => {
    console.log('Starting surface processing with coordinates:', coordinates.length);
    
    setSurfaceProgress({
      isProcessing: true,
      progress: 0,
      total: coordinates.length
    });
  
    if (!map.current) {
      console.error('Map instance not found');
      return coordinates;
    }

    const bounds = coordinates.reduce(
      (acc, coord) => ({
        minLat: Math.min(acc.minLat, coord.lat),
        maxLat: Math.max(acc.maxLat, coord.lat),
        minLon: Math.min(acc.minLon, coord.lon),
        maxLon: Math.max(acc.maxLon, coord.lon),
      }),
      { minLat: 90, maxLat: -90, minLon: 180, maxLon: -180 }
    );
  
    // Set the map view and force zoom level 13
    map.current.fitBounds(
      [[bounds.minLon, bounds.minLat], [bounds.maxLon, bounds.maxLat]],
      { 
        padding: 50, 
        duration: 500,
        maxZoom: 13,
        minZoom: 13
      }
    );

    // Wait for map to settle and tiles to load
    await new Promise<void>(resolve => {
      const checkReady = () => {
        if (map.current?.areTilesLoaded() && map.current?.getZoom() === 13) {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      map.current?.once('moveend', () => {
        setTimeout(checkReady, 500); // Give extra time for tiles to load
      });
    });

    const enhancedCoordinates: Point[] = [];

    for (let i = 0; i < coordinates.length; i++) {
      try {
        if (!map.current) continue;

        const surfaceType = await querySurfaceType(coordinates[i]);
        enhancedCoordinates.push({ ...coordinates[i], surface: surfaceType });
        
        setSurfaceProgress(prev => ({
          ...prev,
          progress: i + 1
        }));

      } catch (error) {
        console.error(`Failed to process point ${i}:`, error);
        enhancedCoordinates.push({ ...coordinates[i], surface: 'unpaved' });
      }
    }
  
    setSurfaceProgress(prev => ({
      ...prev,
      isProcessing: false
    }));
  
    return enhancedCoordinates;
  };

  // Previous methods remain the same...
  const addRouteToMap = useCallback(async (coordinates: Point[]) => {
    if (!map.current || !isReady()) {
      throw new Error('Map not ready');
    }

    try {
      if (map.current.getSource(routeSourceId)) {
        map.current.removeLayer(routeLayerId);
        map.current.removeSource(routeSourceId);
      }

      let currentSegment: Point[] = [];
      const segments: { points: Point[], surface: 'paved' | 'unpaved' }[] = [];
      let currentSurface = coordinates[0]?.surface || 'paved';

      coordinates.forEach((point, index) => {
        if (point.surface !== currentSurface || index === coordinates.length - 1) {
          if (index === coordinates.length - 1) {
            currentSegment.push(point);
          }
          if (currentSegment.length > 0) {
            segments.push({
              points: [...currentSegment],
              surface: currentSurface
            });
          }
          currentSegment = [point];
          currentSurface = point.surface || 'paved';
        } else {
          currentSegment.push(point);
        }
      });

      map.current.addSource(routeSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: segments.map(segment => ({
            type: 'Feature',
            properties: {
              surface: segment.surface
            },
            geometry: {
              type: 'LineString',
              coordinates: segment.points.map(point => [point.lon, point.lat])
            }
          }))
        }
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
          'line-dasharray': ['case',
            ['==', ['get', 'surface'], 'unpaved'],
            ['literal', [2, 2]],
            ['literal', [1, 0]]
          ]
        }
      });
    } catch (error) {
      console.error('Error adding route to map:', error);
      throw error;
    }
  }, [isReady]);

  // Previous methods remain the same...
  const handleGpxUpload = useCallback(async (gpxContent: string): Promise<void> => {
    if (!map.current || !isReady()) {
      console.log('Map ready state:', {
        mapExists: !!map.current,
        isMapReady,
        streetsLayersLoaded
      });
      throw new Error('Map not fully loaded. Please try again in a moment.');
    }
  
    if (!gpxContent || typeof gpxContent !== 'string') {
      throw new Error('Invalid GPX content');
    }
  
    return new Promise((resolve, reject) => {
      parseString(gpxContent, { explicitArray: false }, async (err: Error | null, result: any) => {
        if (err) {
          console.error('Error parsing GPX:', err);
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
  
          const pointsArray = Array.isArray(points) ? points : [points];
          console.log('Points found:', pointsArray.length);
  
          const coordinates: Point[] = pointsArray
            .map((point: any) => {
              try {
                if (!point?.$?.lat || !point?.$?.lon) {
                  throw new Error('Missing lat/lon attributes');
                }
                
                const lat = parseFloat(point.$.lat);
                const lon = parseFloat(point.$.lon);
                
                if (isNaN(lat) || isNaN(lon)) {
                  throw new Error('Invalid coordinate values');
                }
                
                if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                  throw new Error('Coordinates out of valid range');
                }
                
                return { lat, lon };
              } catch (error) {
                console.warn('Skipping invalid point:', point, error);
                return null;
              }
            })
            .filter((point: Point | null): point is Point => point !== null);
  
          if (coordinates.length === 0) {
            throw new Error('No valid coordinates found in GPX file');
          }

          console.log('Map ready, starting surface queries...');
          const enhancedCoordinates = await processCoordinatesWithSurface(coordinates);

          console.log('Updating route with surface types...');
          await addRouteToMap(enhancedCoordinates);
          
          resolve();
        } catch (error) {
          console.error('Error processing GPX:', error);
          reject(error);
        }
      });
    });
  }, [addRouteToMap, isReady]);

  React.useImperativeHandle(
    ref,
    () => ({
      handleGpxUpload,
      isReady,
      on: (event: string, callback: () => void) => {
        if (map.current) {
          map.current.on(event, callback);
        }
      },
      off: (event: string, callback: () => void) => {
        if (map.current) {
          map.current.off(event, callback);
        }
      }
    }),
    [handleGpxUpload, isReady]
  );

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox token not found');
      return;
    }

    try {
      mapboxgl.accessToken = mapboxToken;

      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [146.5, -41.5],
        zoom: 13,
        minZoom: 8,
        maxZoom: 18,
        pitch: 60,
        terrain: {
          source: 'mapbox-dem',
          exaggeration: 1.5
        },
      } as any);

      map.current = newMap;

      newMap.on('load', async () => {
        console.log('Base map loaded');
        
        try {
          // Add terrain source
          newMap.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
          });
          
          // Enable terrain
          newMap.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
          
          // Add our custom road tiles source
          newMap.addSource('australia-roads', {
            type: 'vector',
            tiles: ['https://api.maptiler.com/tiles/7ed93f08-6f83-46f8-9319-96d8962f82bc/{z}/{x}/{y}.pbf?key=DFSAZFJXzvprKbxHrHXv'],
            minzoom: 13,
            maxzoom: 13
          });

          // Add the custom roads layer
          newMap.addLayer({
            id: 'custom-roads',
            type: 'line',
            source: 'australia-roads',
            'source-layer': 'roads',
            minzoom: 13,
            maxzoom: 13,
            layout: {
              visibility: 'none'
            },
            paint: {
              'line-opacity': 1,
              'line-color': [
                'match',
                ['get', 'surface'],
                'paved', '#4A90E2',
                'unpaved', '#D35400',
                '#888888'
              ],
              'line-width': 2
            }
          });

          setStreetsLayersLoaded(true);
          setIsMapReady(true);

        } catch (error) {
          console.error('Error loading streets style:', error);
        }
      });

      // Add controls
      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
      newMap.addControl(new mapboxgl.FullscreenControl());
      newMap.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        })
      );

    } catch (error) {
      console.error('Error creating map:', error);
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
