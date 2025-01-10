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

    // Ensure we're at zoom level 13 AND source and tiles are loaded
    await new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 10; // Maximum number of attempts to prevent infinite loops
        let checkInterval: NodeJS.Timeout;

        const cleanup = () => {
            if (checkInterval) clearInterval(checkInterval);
            if (map.current) {
                map.current.off('data', tileHandler);
                map.current.off('sourcedata', sourceHandler);
            }
        };

        const verifyDataAvailability = () => {
            attempts++;
            
            // Check if we have actual feature data
            const features = map.current?.querySourceFeatures('australia-roads', {
                sourceLayer: 'lutruwita'
            });

            const currentZoom = map.current?.getZoom();
            const tilesLoaded = map.current?.areTilesLoaded();
            
            console.log('Verification check:', {
                attempt: attempts,
                featureCount: features?.length,
                zoom: currentZoom,
                tilesLoaded
            });

            if (features && features.length > 0 && currentZoom === 13 && tilesLoaded) {
                cleanup();
                resolve();
                return true;
            }

            if (attempts >= maxAttempts) {
                cleanup();
                // Don't reject, just resolve and let the code continue with default surface
                resolve();
                return true;
            }

            return false;
        };

        // Set up event listeners for tile and source loading
        const tileHandler = (e: any) => {
            if (e.dataType === 'tile' && e.sourceId === 'australia-roads') {
                verifyDataAvailability();
            }
        };

        const sourceHandler = (e: any) => {
            if (e.sourceId === 'australia-roads' && e.isSourceLoaded) {
                verifyDataAvailability();
            }
        };

        map.current?.on('data', tileHandler);
        map.current?.on('sourcedata', sourceHandler);

        // Set zoom level if needed
        if (map.current?.getZoom() !== 13) {
            map.current?.setZoom(13);
            map.current?.once('zoomend', () => {
                verifyDataAvailability();
            });
        }

        // Start periodic checks
        checkInterval = setInterval(() => {
            if (verifyDataAvailability()) {
                clearInterval(checkInterval);
            }
        }, 200);

        // Initial check
        verifyDataAvailability();
    });

    // Debug state before query
    console.log('Pre-query state:', {
        zoom: map.current.getZoom(),
        sourceLoaded: map.current.isSourceLoaded('australia-roads'),
        point: [point.lon, point.lat],
        layerVisible: map.current.getLayoutProperty('custom-roads', 'visibility')
    });

    // Try both query methods
    const renderedFeatures = map.current.queryRenderedFeatures(
        [point.lon, point.lat],
        {
            layers: ['custom-roads'],
            validate: false
        }
    );

    const sourceFeatures = map.current.querySourceFeatures('australia-roads', {
        sourceLayer: 'lutruwita',
        validate: false
    });

    // Log all found features
    console.log('Query results:', {
        renderedFeatures: {
            count: renderedFeatures.length,
            surfaces: renderedFeatures.map(f => f.properties?.surface)
        },
        sourceFeatures: {
            count: sourceFeatures.length,
            surfaces: sourceFeatures.map(f => f.properties?.surface)
        }
    });

    // Check rendered features first
    for (const feature of renderedFeatures) {
        if (feature.properties?.surface) {
            const surface = feature.properties.surface.toLowerCase();
            if (['paved', 'asphalt', 'concrete'].includes(surface)) {
                return 'paved';
            }
        }
    }

    // Then check source features
    for (const feature of sourceFeatures) {
        if (feature.properties?.surface) {
            const surface = feature.properties.surface.toLowerCase();
            if (['paved', 'asphalt', 'concrete'].includes(surface)) {
                return 'paved';
            }
        }
    }

    // Default to unpaved if no paved surface found
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

// Wait for map to settle, tiles to load, AND features to be available
await new Promise<void>(resolve => {
  const checkReady = () => {
    // First check zoom and basic tile loading
    if (!map.current?.areTilesLoaded() || map.current?.getZoom() !== 13) {
      setTimeout(checkReady, 100);
      return;
    }

    // Then check if we have actual feature data
    const features = map.current.querySourceFeatures('australia-roads', {
      sourceLayer: 'lutruwita'
    });

    console.log('Checking data readiness:', {
      tilesLoaded: map.current.areTilesLoaded(),
      zoom: map.current.getZoom(),
      featureCount: features.length,
      sourceLoaded: map.current.isSourceLoaded('australia-roads')
    });

    if (features.length > 0) {
      // We have actual data
      resolve();
    } else {
      // Keep checking if we don't have features yet
      setTimeout(checkReady, 100);
    }
  };

  // Initial moveend handler
  map.current?.once('moveend', () => {
    console.log('Move ended, starting readiness checks');
    setTimeout(checkReady, 500);
  });

  // Also start checking immediately in case we're already at the right position
  checkReady();
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
  
// Force zoom level 13 and ensure all tiles are loaded
await new Promise<void>(resolve => {
  let tilesLoaded = false;
  let sourceFullyLoaded = false;
  let zoomCorrect = false;

  const checkAllReady = () => {
    if (tilesLoaded && sourceFullyLoaded && zoomCorrect) {
      console.log('All conditions met:', {
        tilesLoaded,
        sourceFullyLoaded,
        zoomCorrect,
        currentZoom: map.current?.getZoom()
      });
      resolve();
    }
  };

  // Listen for source data and tile loading
  const sourceDataHandler = (e: any) => {
    if (e.sourceId === 'australia-roads') {
      console.log('Source data update:', {
        isSourceLoaded: e.isSourceLoaded,
        dataType: e.dataType,
        tileID: e.tile?.tileID,
        hasData: e.tile?.hasData
      });

      // Only consider source loaded when we have actual tile data
      if (e.isSourceLoaded && e.tile?.hasData) {
        sourceFullyLoaded = true;
        checkAllReady();
      }
    }
  };

  // Listen for overall tile loading state
  const tileHandler = () => {
    if (map.current?.areTilesLoaded()) {
      console.log('All tiles loaded');
      tilesLoaded = true;
      checkAllReady();
    }
  };

  // Handle zoom level
  const handleZoom = () => {
    const currentZoom = map.current?.getZoom();
    console.log('Zoom changed:', currentZoom);
    if (currentZoom === 13) {
      zoomCorrect = true;
      checkAllReady();
    }
  };

  // Set up event listeners
  map.current?.on('sourcedata', sourceDataHandler);
  map.current?.on('data', tileHandler);

  // Handle zoom
  const currentZoom = map.current?.getZoom();
  if (currentZoom !== 13) {
    map.current?.setZoom(13);
    map.current?.once('zoomend', handleZoom);
  } else {
    zoomCorrect = true;
    checkAllReady();
  }

  // Check initial state
  if (map.current?.areTilesLoaded()) {
    tilesLoaded = true;
  }
  
  // Clean up event listeners
  return () => {
    map.current?.off('sourcedata', sourceDataHandler);
    map.current?.off('data', tileHandler);
  };
});

// Additional safety check after promise resolves
console.log('Ready check complete:', {
  zoom: map.current?.getZoom(),
  tilesLoaded: map.current?.areTilesLoaded(),
  sourceLoaded: map.current?.isSourceLoaded('australia-roads')
});
  
      let segments: { points: Point[], surface: 'paved' | 'unpaved' }[] = [];
      let currentSegment: Point[] = [];
      let currentSurface: 'paved' | 'unpaved' = 'unpaved';
  
      // Process points and create segments
      for (let i = 0; i < coordinates.length; i++) {
        const point = coordinates[i];
        
// Debug map state before query
console.log('Map state at query:', {
  zoom: map.current.getZoom(),
  center: map.current.getCenter(),
  bounds: map.current.getBounds(),
  tilesLoaded: map.current.areTilesLoaded()
});

// Get and log all available layers
const allLayers = map.current.getStyle().layers;
console.log('Available layers:', allLayers.map(l => l.id));

// Query surface type at this point
const projectedPoint = map.current.project([point.lon, point.lat]);
console.log('Querying at point:', {
  original: [point.lon, point.lat],
  projected: projectedPoint,
  zoom: map.current.getZoom()
});

// First try source features
const sourceFeatures = map.current.querySourceFeatures('australia-roads', {
  sourceLayer: 'lutruwita',  // Updated to new source layer name
  filter: ['has', 'surface']
});

console.log('Source features near point:', {
  count: sourceFeatures.length,
  features: sourceFeatures.map(f => ({
    surface: f.properties?.surface,
    geometry: f.geometry,
    properties: f.properties
  }))
});

// Then try rendered features
const features = map.current.queryRenderedFeatures(
  projectedPoint,
  { layers: ['custom-roads'] }
);

console.log('Rendered features at point:', {
  count: features.length,
  features: features.map(f => ({
    surface: f.properties?.surface,
    layer: f.layer.id,
    properties: f.properties
  }))
});

// Determine surface type
let surfaceType: 'paved' | 'unpaved' = 'unpaved';
if (features.length > 0) {
  console.log('First feature detail:', features[0]);
  
  if (features[0].properties?.surface) {
    const surface = features[0].properties.surface.toLowerCase();
    console.log('Surface value found:', surface);
    
    if (['paved', 'asphalt', 'concrete', 'compacted'].includes(surface)) {
      surfaceType = 'paved';
      console.log('Setting surface to paved');
    } else if (['unpaved', 'gravel'].includes(surface)) {
      surfaceType = 'unpaved';
      console.log('Setting surface to unpaved');
    }
  } else {
    console.log('No surface property found on feature');
  }
}

console.log('Final surface type:', surfaceType);
  
        // If surface type changes or last point, create new segment
        if ((surfaceType !== currentSurface && currentSegment.length > 0) || 
            i === coordinates.length - 1) {
          if (i === coordinates.length - 1) {
            currentSegment.push(point);
          }
          segments.push({
            points: [...currentSegment],
            surface: currentSurface
          });
          currentSegment = [point];
          currentSurface = surfaceType;
        } else {
          currentSegment.push(point);
        }
  
        // Update progress
        if (i % 100 === 0) {
          console.log(`Processing point ${i} of ${coordinates.length}`);
        }
      }
  
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

    // Step 1: Parse GPX file first
    const coordinates = await new Promise<Point[]>((resolve, reject) => {
      parseString(gpxContent, { explicitArray: false }, (err: Error | null, result: any) => {
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

          const coords = pointsArray
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

          if (coords.length === 0) {
            throw new Error('No valid coordinates found in GPX file');
          }

          resolve(coords);
        } catch (error) {
          reject(error);
        }
      });
    });

    // Step 2: Move map and ensure zoom is correct
    const bounds = coordinates.reduce(
      (acc, coord) => ({
        minLat: Math.min(acc.minLat, coord.lat),
        maxLat: Math.max(acc.maxLat, coord.lat),
        minLon: Math.min(acc.minLon, coord.lon),
        maxLon: Math.max(acc.maxLon, coord.lon),
      }),
      { minLat: 90, maxLat: -90, minLon: 180, maxLon: -180 }
    );

// Set zoom 13 first
map.current.setZoom(13);
    
await new Promise<void>(resolve => {
  map.current?.once('zoomend', () => {
    // Now fit bounds while maintaining zoom 13
    map.current?.fitBounds(
      [[bounds.minLon, bounds.minLat], [bounds.maxLon, bounds.maxLat]],
      { 
        padding: 50, 
        duration: 0,
        maxZoom: 13,
        minZoom: 13
      }
    );
    
    map.current?.once('moveend', () => {
      console.log('Move complete at zoom:', map.current?.getZoom());
      resolve();
    });
  });
});

    // Wait for tiles to load
    await new Promise<void>(resolve => {
      const checkTiles = () => {
        const features = map.current?.querySourceFeatures('australia-roads', {
          sourceLayer: 'lutruwita'
        });
        
        console.log('Checking tiles:', {
          zoom: map.current?.getZoom(),
          features: features?.length || 0,
          tilesLoaded: map.current?.areTilesLoaded()
        });

        if (features && features.length > 0) {
          resolve();
        } else {
          setTimeout(checkTiles, 100);
        }
      };

      // Start checking after a small delay
      setTimeout(checkTiles, 500);

      // Safety timeout
      setTimeout(() => {
        console.warn('Timeout waiting for tiles, proceeding anyway');
        resolve();
      }, 5000);
    });

    // Step 3: Now add route to map
    console.log('Map ready, drawing route...');
    await addRouteToMap(coordinates);

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
          
// Add our custom road tiles source with updated URL
const tileUrl = 'https://api.maptiler.com/tiles/5dd3666f-1ce4-4df6-9146-eda62a200bcb/{z}/{x}/{y}.pbf?key=DFSAZFJXzvprKbxHrHXv';

// Test a specific tile for Tasmania
const testTileCoords = {
  x: 3864,
  y: 2604,
  z: 13
};

const testTileUrl = tileUrl
  .replace('{z}', testTileCoords.z.toString())
  .replace('{x}', testTileCoords.x.toString())
  .replace('{y}', testTileCoords.y.toString());

console.log('Testing tile fetch:', testTileUrl);

fetch(testTileUrl)
  .then(async response => {
    console.log('Tile response:', {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type'),
      size: response.headers.get('content-length')
    });
  })
  .catch(error => console.error('Tile fetch failed:', error));

console.log('Adding source with URL:', tileUrl);

const sourceConfig = {
  type: 'vector' as const,
  tiles: [tileUrl],
  minzoom: 12,   // Changed from 13
  maxzoom: 14    // Changed from 13
};

newMap.addSource('australia-roads', sourceConfig);

// Debug the source immediately after adding
const source = newMap.getSource('australia-roads');
console.log('Source details:', {
  source,
  type: source.type,
  loaded: source.loaded?.(),
  tileSize: source.tileSize,
  attribution: source.attribution,
  maxzoom: source.maxzoom,
  minzoom: source.minzoom
});

// Add listener for when source loads
newMap.on('sourcedata', (e) => {
  if (e.sourceId === 'australia-roads') {
    console.log('Source data event:', {
      sourceId: e.sourceId,
      sourceLoaded: e.isSourceLoaded,
      dataType: e.dataType,
      tile: e.tile
    });

    if (e.isSourceLoaded) {
      // Try to query the source at current view
      const bounds = newMap.getBounds();
      const center = bounds.getCenter();
      
      console.log('Trying source query at:', {
        center: center,
        zoom: newMap.getZoom(),
        bounds: bounds
      });

      const features = newMap.querySourceFeatures('australia-roads', {
        sourceLayer: 'lutruwita'
      });
      
      // Get all unique surface values
      const surfaceTypes = new Set();
      features.forEach(f => {
        if (f.properties?.surface) {
          surfaceTypes.add(f.properties.surface);
        }
      });
      
      console.log('Source features found:', {
        count: features.length,
        uniqueSurfaces: Array.from(surfaceTypes),
        sample: features.slice(0, 2).map(f => ({
          surface: f.properties?.surface,
          geometry: f.geometry.type,
          allProps: f.properties
        }))
      });
    }
  }
});

console.log('Source loaded:', {
  source: newMap.getSource('australia-roads'),
  tiles: newMap.getSource('australia-roads').tiles
});

// Add the custom roads layer
newMap.addLayer({
  id: 'custom-roads',
  type: 'line',
  source: 'australia-roads',
  'source-layer': 'lutruwita',  // Changed from 'roads'
  minzoom: 12,  // Changed from 13
  maxzoom: 14,  // Changed from 13
  layout: {
    visibility: 'visible'
  },
  paint: {
    'line-opacity': 1,
    'line-color': [
      'match',
      ['get', 'surface'],
      ['paved', 'asphalt', 'concrete', 'compacted'], '#4A90E2',
      ['unpaved', 'gravel'], '#D35400',
      '#888888'
    ],
    'line-width': 2
  }
});

// Debug the layer
console.log('Layer added:', {
  layer: newMap.getLayer('custom-roads'),
  style: newMap.getStyle(),
  visible: newMap.getLayoutProperty('custom-roads', 'visibility')
});

// Add debug listener for source data
newMap.on('sourcedata', (e) => {
  if (e.sourceId === 'australia-roads' && e.isSourceLoaded) {
    // Debug what data is actually in the tiles
    const features = newMap.querySourceFeatures('australia-roads', {
      sourceLayer: 'lutruwita'  // Updated to new source layer name
    });
    
    console.log('Road source data loaded:', {
      featureCount: features.length,
      sampleFeatures: features.slice(0, 3).map(f => ({
        surface: f.properties?.surface,
        properties: f.properties
      })),
      bounds: map.current?.getBounds(),  // Added to debug query area
      zoom: map.current?.getZoom()       // Added to debug zoom level
    });
  }
});

// Add debug listener for tile loading
newMap.on('data', (e) => {
  if (e.dataType === 'tile') {
    console.log('Tile load event:', {
      source: e.source?.type,
      sourceId: e.sourceId,
      tile: e.tile,
      coord: e.coord
    });
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
