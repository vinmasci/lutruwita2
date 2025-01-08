// src/components/ui/map-container.tsx
import React, { useEffect, useRef, useCallback, forwardRef } from 'react';
import { parseString } from 'xml2js';
import mapboxgl from 'mapbox-gl';
import { CircularProgress, Box, Typography } from '@mui/material';
import 'mapbox-gl/dist/mapbox-gl.css';

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

const LoadingOverlay = ({ progress, total }: { progress: number; total: number }) => (
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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

    // Check zoom level first
    const currentZoom = map.current.getZoom();
    console.log('Current zoom level:', currentZoom);
    
    // If zoom is too low, zoom in to see road details
    if (currentZoom < 13) {
      console.log('Zooming in to see road details...');
      map.current.easeTo({
        zoom: 13,
        center: [point.lon, point.lat],
        duration: 0  // Instant zoom for processing
      });

      // Give the map a moment to update after zooming
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const bbox = [
      [point.lon - 0.001, point.lat - 0.001],
      [point.lon + 0.001, point.lat + 0.001]
    ];

    // Query using the exact layer names we added
    const features = map.current.queryRenderedFeatures(bbox, {
      layers: [
        'road-motorway',
        'road-trunk',
        'road-primary',
        'road-secondary',
        'road-tertiary',
        'road-street',
        'road-service',
        'road-path',
        'road-track'
      ]
    });

    console.log('Features found:', {
      bbox,
      zoom: map.current.getZoom(),
      features: features.map(f => ({
        layer: f.layer.id,
        source: f.source,
        properties: f.properties
      }))
    });
  
    // Debug logging
    console.log('Features found:', {
      bbox,
      zoom: map.current.getZoom(),
      features: features.map(f => ({
        layer: f.layer.id,
        source: f.source,
        sourceLayer: f.sourceLayer, // This is important for composite sources
        properties: f.properties
      }))
    });
  
    if (features.length > 0) {
      const roadFeature = features[0];
      
      // Check OSM properties
      const properties = roadFeature.properties;
      const surface = properties?.surface;
      const highway = properties?.highway;
      const class_ = properties?.class;
  
      console.log('Road properties:', { surface, highway, class: class_ });
  
      if (
        // Check surface
        surface === 'paved' ||
        surface === 'asphalt' ||
        surface === 'concrete' ||
        // Check highway type
        highway === 'motorway' ||
        highway === 'trunk' ||
        highway === 'primary' ||
        highway === 'secondary' ||
        highway === 'tertiary' ||
        highway === 'residential' ||
        // Check road class
        class_ === 'motorway' ||
        class_ === 'trunk' ||
        class_ === 'primary' ||
        class_ === 'street'
      ) {
        return 'paved';
      }
    }
  
    return 'unpaved';
  };

  const processCoordinatesWithSurface = async (coordinates: Point[]): Promise<Point[]> => {
    setSurfaceProgress({
      isProcessing: true,
      progress: 0,
      total: coordinates.length
    });

    const enhancedCoordinates: Point[] = [];

    for (const [index, point] of coordinates.entries()) {
      const surface = await querySurfaceType(point);
      enhancedCoordinates.push({ ...point, surface });
      
      setSurfaceProgress(prev => ({
        ...prev,
        progress: index + 1
      }));
    }

    setSurfaceProgress(prev => ({
      ...prev,
      isProcessing: false
    }));

    return enhancedCoordinates;
  };

  const addRouteToMap = useCallback(async (coordinates: Point[]) => {
    if (!map.current || !isReady()) {
      throw new Error('Map not ready');
    }

    try {
      // Remove existing routes if any
      if (map.current.getSource(routeSourceId)) {
        map.current.removeLayer(`${routeLayerId}-background`);
        map.current.removeLayer(routeLayerId);
        map.current.removeSource(routeSourceId);
      }

      // Create segments based on surface type
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

      // Add source
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

      // Add route layers
      map.current.addLayer({
        id: `${routeLayerId}-background`,
        type: 'line',
        source: routeSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#FFB4B4',
          'line-width': 4,
          'line-opacity': ['case', ['==', ['get', 'surface'], 'unpaved'], 1, 0]
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

      // Fit map to route bounds
      const bounds = coordinates.reduce(
        (acc, coord) => ({
          minLat: Math.min(acc.minLat, coord.lat),
          maxLat: Math.max(acc.maxLat, coord.lat),
          minLon: Math.min(acc.minLon, coord.lon),
          maxLon: Math.max(acc.maxLon, coord.lon),
        }),
        { minLat: 90, maxLat: -90, minLon: 180, maxLon: -180 }
      );

      map.current.fitBounds(
        [
          [bounds.minLon, bounds.minLat],
          [bounds.maxLon, bounds.maxLat]
        ],
        {
          padding: 50,
          duration: 1000
        }
      );
    } catch (error) {
      console.error('Error adding route to map:', error);
      throw error;
    }
  }, [isReady]);

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
  
    console.log('Starting GPX parse...');
    
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
  
          // NEW: First move map to show coordinates
// First draw the initial route
console.log('Drawing initial route...');
await addRouteToMap(coordinates); // This will draw the route assuming all paved

// Then move map to show the route
console.log('Moving map to show route...');
const bounds = coordinates.reduce(
  (acc, coord) => ({
    minLat: Math.min(acc.minLat, coord.lat),
    maxLat: Math.max(acc.maxLat, coord.lat),
    minLon: Math.min(acc.minLon, coord.lon),
    maxLon: Math.max(acc.maxLon, coord.lon),
  }),
  { minLat: 90, maxLat: -90, minLon: 180, maxLon: -180 }
);

map.current.fitBounds(
  [[bounds.minLon, bounds.minLat], [bounds.maxLon, bounds.maxLat]],
  { padding: 50 }
);

// Wait for both movement AND tiles
await new Promise<void>(moveResolve => {
  const checkLoadStatus = () => {
    if (map.current?.areTilesLoaded()) {
      console.log('Map moved and tiles loaded');
      moveResolve();
    } else {
      console.log('Waiting for tiles...');
      setTimeout(checkLoadStatus, 100);
    }
  };

  map.current!.once('moveend', () => {
    console.log('Map moved, checking tiles...');
    checkLoadStatus();
  });
});

// Now process surface types after everything is loaded
console.log('Map ready, starting surface queries...');
const enhancedCoordinates = await processCoordinatesWithSurface(coordinates);

// Update the route with surface information
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
        style: 'mapbox://styles/mapbox/satellite-v9', // Base satellite style
        center: [146.5, -41.5],
        zoom: 6,
        minZoom: 3,
        maxZoom: 18,
        pitch: 0,
      });

      map.current = newMap;

      newMap.on('load', async () => {
        console.log('Base map loaded');
        
        try {
          // Add Mapbox Streets source directly
          newMap.addSource('streets', {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-streets-v8'
          });

// Add just one comprehensive road layer
newMap.addLayer({
  id: 'all-roads',
  type: 'line',
  source: 'streets',
  'source-layer': 'road',
  layout: {
    visibility: 'visible'
  },
  paint: {
    'line-opacity': 0
  }
});

// Add debug listener to check available properties
newMap.on('sourcedata', (e) => {
  if (e.sourceId === 'streets' && e.isSourceLoaded) {
    const features = newMap.querySourceFeatures('streets', {
      sourceLayer: 'road'
    });
    if (features.length > 0) {
      console.log('Available road properties:', {
        propertySamples: features.slice(0, 5).map(f => ({
          surface: f.properties?.surface,
          structure: f.properties?.structure,
          type: f.properties?.type,
          class: f.properties?.class
        }))
      });
    }
  }
});

          // Add terrain
          newMap.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
          });

          newMap.setTerrain({ source: 'mapbox-dem', exaggeration: 1.0 });

          newMap.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 90.0],
              'sky-atmosphere-sun-intensity': 15
            }
          });

          setStreetsLayersLoaded(true);
          console.log('Road layers added and ready for querying');

          // List all layers for debugging
          const allLayers = newMap.getStyle().layers;
          console.log('All available layers:', allLayers.map(layer => layer.id));

        } catch (error) {
          console.error('Error loading streets style:', error);
        }

        setIsMapReady(true);
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