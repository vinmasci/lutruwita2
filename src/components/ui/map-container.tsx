// src/components/ui/map-container.tsx
import React, { useEffect, useRef, useCallback, forwardRef } from 'react';
import { parseString } from 'xml2js';
import mapboxgl from 'mapbox-gl';
import { CircularProgress, Box, Typography } from '@mui/material';
import * as turf from '@turf/turf';
import { lineString, buffer, bbox } from '@turf/turf';
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
      bottom: '48px', // Leave space for bottom tabs
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

    // Create a small buffer around the point to increase chances of finding roads
    const buffer = 0.0005; // roughly 50 meters
    const bbox = [
      point.lon - buffer,
      point.lat - buffer,
      point.lon + buffer,
      point.lat + buffer
    ];

    // Convert bbox to screen coordinates
    const sw = map.current.project([bbox[0], bbox[1]]);
    const ne = map.current.project([bbox[2], bbox[3]]);

    // Query both the custom roads layer and mapbox streets layer
    const features = map.current.queryRenderedFeatures(
      [[sw.x, sw.y], [ne.x, ne.y]],
      {
        layers: ['custom-roads', 'road-secondary-tertiary', 'road-primary', 'road-street']
      }
    );
  
    console.log('Query results:', {
      location: [point.lon, point.lat],
      featuresFound: features.length,
      features: features.map(f => ({
        layer: f.layer.id,
        surface: f.properties?.surface,
        highway: f.properties?.highway,
        class: f.properties?.class
      }))
    });

    for (const feature of features) {
      const properties = feature.properties || {};
      const layerId = feature.layer.id;

      // First check custom roads layer
      if (layerId === 'custom-roads' && properties.surface) {
        const unpavedSurfaces = [
          'unpaved', 'dirt', 'gravel', 'grass', 'ground',
          'fine_gravel', 'compacted', 'earth', 'mud', 'sand', 'woodchips'
        ];
        
        if (unpavedSurfaces.includes(properties.surface.toLowerCase())) {
          return 'unpaved';
        }
        
        const pavedSurfaces = [
          'paved', 'asphalt', 'concrete', 'paving_stones', 'sett',
          'cobblestone', 'metal', 'wood', 'concrete:plates'
        ];
        
        if (pavedSurfaces.includes(properties.surface.toLowerCase())) {
          return 'paved';
        }
      }

      // Then check Mapbox streets layers
      if (layerId.startsWith('road-')) {
        // Most Mapbox streets are paved by default
        return 'paved';
      }

      // Check highway type as fallback
      if (properties.highway) {
        if (['track', 'path', 'bridleway', 'cycleway'].includes(properties.highway)) {
          return 'unpaved';
        }
        
        if (['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential'].includes(properties.highway)) {
          return 'paved';
        }
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

  if (!map.current) return coordinates;

  // Get bounds of the route
  const bounds = coordinates.reduce(
    (acc, coord) => ({
      minLat: Math.min(acc.minLat, coord.lat),
      maxLat: Math.max(acc.maxLat, coord.lat),
      minLon: Math.min(acc.minLon, coord.lon),
      maxLon: Math.max(acc.maxLon, coord.lon),
    }),
    { minLat: 90, maxLat: -90, minLon: 180, maxLon: -180 }
  );

  // Force zoom to 13 and fit bounds
  map.current.setZoom(13);
  map.current.fitBounds(
    [[bounds.minLon, bounds.minLat], [bounds.maxLon, bounds.maxLat]],
    { padding: 50, duration: 0 }
  );

  // Wait for tiles to load
  await new Promise<void>(resolve => {
    const checkTiles = () => {
      if (map.current?.areTilesLoaded()) {
        console.log('Tiles loaded at zoom 13');
        resolve();
      } else {
        setTimeout(checkTiles, 100);
      }
    };
    checkTiles();
  });

  const enhancedCoordinates: Point[] = [];
  const batchSize = 50;

  for (let i = 0; i < coordinates.length; i += batchSize) {
    const batch = coordinates.slice(i, i + batchSize);
    
    for (const [batchIndex, point] of batch.entries()) {
      try {
        if (!map.current) continue;

        const pixelPoint = map.current.project([point.lon, point.lat]);
        
        // Get the default surface type from the previous point
        let surfaceType: 'paved' | 'unpaved' = 
          enhancedCoordinates.length > 0 
            ? enhancedCoordinates[enhancedCoordinates.length - 1].surface || 'unpaved'
            : 'unpaved';

        try {
          const features = map.current.queryRenderedFeatures([
            [pixelPoint.x - 5, pixelPoint.y - 5],
            [pixelPoint.x + 5, pixelPoint.y + 5]
          ], {
            layers: ['custom-roads']
          });

          if (features.length > 0) {
            const roadFeature = features[0];
            const layerStyle = roadFeature.layer?.paint;
            
            if (layerStyle && 'line-color' in layerStyle) {
              const color = layerStyle['line-color'];
              // Check the actual color that's rendered
              if (color === '#4A90E2') {  // Blue color for paved roads
                surfaceType = 'paved';
              } else if (color === '#D35400') {  // Orange/brown color for unpaved roads
                surfaceType = 'unpaved';
              }
              // If color doesn't match either, keep the default (previous point's surface)
            }
          }
        } catch (queryError) {
          console.warn(`Query failed for point ${i + batchIndex}, using previous surface type:`, queryError);
          // Keep using the default surfaceType (previous point's surface)
        }

        enhancedCoordinates.push({ ...point, surface: surfaceType });
        
        setSurfaceProgress(prev => ({
          ...prev,
          progress: i + batchIndex + 1
        }));

      } catch (error) {
        console.warn(`Failed to process point at index ${i + batchIndex}:`, error);
        // Use previous point's surface type or default to unpaved
        const surfaceType = enhancedCoordinates.length > 0 
          ? enhancedCoordinates[enhancedCoordinates.length - 1].surface || 'unpaved'
          : 'unpaved';
        enhancedCoordinates.push({ ...point, surface: surfaceType });
      }
    }

    // Update the map every batch
    if (enhancedCoordinates.length > 0) {
      try {
        await addRouteToMap(enhancedCoordinates);
      } catch (error) {
        console.warn('Failed to update route display:', error);
      }
    }
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

if (!map.current) {
  throw new Error('Map not initialized');
}

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

  if (!map.current) {
    moveResolve();
    return;
  }
  map.current.once('moveend', () => {
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
        style: 'mapbox://styles/mapbox/satellite-streets-v12', // Base satellite style with streets overlay
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
// Add our custom road tiles source with broader zoom range
newMap.addSource('australia-roads', {
  type: 'vector',
  tiles: ['https://api.maptiler.com/tiles/7ed93f08-6f83-46f8-9319-96d8962f82bc/{z}/{x}/{y}.pbf?key=DFSAZFJXzvprKbxHrHXv'],
  minzoom: 10,  // Allow loading at lower zooms
  maxzoom: 14   // Allow higher detail when needed
});

console.log('Source loaded:', newMap.getSource('australia-roads'));

// Add a layer for our custom road data with improved visibility
newMap.addLayer({
  id: 'custom-roads',
  type: 'line',
  source: 'australia-roads',
  'source-layer': 'roads',
  minzoom: 10,
  layout: {
    visibility: 'visible'
  },
  paint: {
    'line-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      10, 0.3,
      13, 0.8
    ],
    'line-color': [
      'match',
      ['get', 'surface'],
      ['asphalt', 'paved', 'concrete'], '#4A90E2',
      ['unpaved', 'gravel', 'dirt'], '#D35400',
      '#888888'
    ],
    'line-width': [
      'interpolate',
      ['linear'],
      ['zoom'],
      10, 1,
      13, 2,
      16, 4
    ]
  },
  filter: ['has', 'surface']
});

console.log('Layer ID check:', newMap.getLayer('custom-roads')?.id);
console.log('Layer visibility:', newMap.getLayoutProperty('custom-roads', 'visibility'));

// Keep just one listener, combining both log formats
newMap.on('sourcedata', (e) => {
  if (e.sourceId === 'australia-roads' && e.isSourceLoaded) {
    const features = newMap.querySourceFeatures('australia-roads', {
      sourceLayer: 'roads'
    });
    if (features.length > 0) {
      console.log('Sample road feature properties:', 
        features.slice(0, 3).map(f => ({
          surface: f.properties?.surface,
          highway: f.properties?.highway,
          type: f.properties?.type,
          name: f.properties?.name,
          all: f.properties || {}
        }))
      );
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
