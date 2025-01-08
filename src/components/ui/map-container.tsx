import React, { useEffect, useRef, useCallback, forwardRef, ForwardedRef } from 'react';
import { parseString } from 'xml2js';
import mapboxgl from 'mapbox-gl';
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
}

const MapContainer = forwardRef<MapRef, {}>((props, ref) => {
  const routeSourceId = 'route';
  const routeLayerId = 'route-layer';
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = React.useState(false);
  const initializationTimer = useRef<NodeJS.Timeout | null>(null);
  
  const isReady = useCallback((): boolean => {
    return Boolean(map.current) && isMapReady;  // Check state instead of map.loaded()
  }, [isMapReady]);  // Include isMapReady in dependencies

  const addRouteToMap = useCallback(async (coordinates: Point[]) => {
    if (!map.current) {
      throw new Error('Map not initialized');
    }

    if (!isReady()) {
      throw new Error('Map not fully loaded');
    }

    try {
      // Remove existing route if any
      if (map.current.getSource(routeSourceId)) {
        map.current.removeLayer(routeLayerId);
        map.current.removeSource(routeSourceId);
      }

      // Add the route source
      map.current.addSource(routeSourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates.map(point => [point.lon, point.lat])
          }
        }
      });

      // Add the route layer with simple styling
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
          'line-width': 4
        }
      });
    } catch (error) {
      console.error('Error adding route to map:', error);
      throw error;
    }
  }, [isReady]);

  const handleGpxUpload = useCallback(async (gpxContent: string): Promise<void> => {
    if (!map.current) {
      throw new Error('Map not initialized');
    }

    if (!isReady()) {
      console.log('Map ready state:', {
        mapExists: !!map.current,
        loaded: map.current.loaded(),
        styleLoaded: map.current.isStyleLoaded(),
        isMapReady
      });
      throw new Error('Map not fully loaded. Please try again in a moment.');
    }

    // Validate GPX content
    if (!gpxContent || typeof gpxContent !== 'string') {
      throw new Error('Invalid GPX content');
    }

    // Check for basic GPX structure
    if (!gpxContent.includes('<gpx') || !gpxContent.includes('</gpx>')) {
      throw new Error('Invalid GPX file format');
    }

    console.log('Starting GPX parse...', gpxContent.substring(0, 100));
    
    return new Promise((resolve, reject) => {
      parseString(gpxContent, { explicitArray: false }, (err: Error | null, result: any) => {
        if (err) {
          console.error('Error parsing GPX:', err);
          reject(new Error('Failed to parse GPX file. Please ensure it is a valid GPX file.'));
          return;
        }

        // Validate parsed GPX structure
        if (!result?.gpx) {
          reject(new Error('Invalid GPX structure: missing root gpx element'));
          return;
        }

        try {
          console.log('GPX structure:', JSON.stringify(result, null, 2));

          // Check if we have a route or track
          const points = result.gpx?.rte?.rtept || result.gpx?.trk?.trkseg?.trkpt;
          
          if (!points) {
            throw new Error('Invalid GPX format: missing track points. Ensure your GPX file contains either a route (rte) or track (trk).');
          }

          // Handle both single and multiple points
          const pointsArray = Array.isArray(points) ? points : [points];

          console.log('Points found:', points.length);

          // Filter out any invalid points and ensure proper numeric conversion
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

          console.log('Coordinates processed:', coordinates.length);

          // Calculate bounds
          const bounds = coordinates.reduce(
            (acc, coord) => ({
              minLat: Math.min(acc.minLat, coord.lat),
              maxLat: Math.max(acc.maxLat, coord.lat),
              minLon: Math.min(acc.minLon, coord.lon),
              maxLon: Math.max(acc.maxLon, coord.lon),
            }),
            { minLat: 90, maxLat: -90, minLon: 180, maxLon: -180 }
          );

          // Add route to map
          addRouteToMap(coordinates).then(() => {
            // Fit map to route bounds with padding
            if (map.current) {
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
            }
            resolve();
          }).catch(reject);

        } catch (error) {
          console.error('Error processing GPX:', error);
          reject(error);
        }
      });
    });
  }, [addRouteToMap, isReady]);

  // Expose the handleGpxUpload function and isReady check to parent components
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

  // Cleanup function for initialization timer
  const cleanupInitTimer = useCallback(() => {
    if (initializationTimer.current) {
      clearTimeout(initializationTimer.current);
      initializationTimer.current = null;
    }
  }, []);

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
        center: [146.5, -41.5], // Center on Tasmania
        zoom: 6,
        minZoom: 3,
        maxZoom: 18,
        pitch: 0, // Bird's eye view
      });

      map.current = newMap;

      // Set up event listeners
      newMap.on('load', () => {
        console.log('Map load event fired');
        
        // Add terrain source
        newMap.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        });

        // Set terrain with reduced exaggeration for better route visibility
        newMap.setTerrain({ source: 'mapbox-dem', exaggeration: 1.0 });

        // Add sky layer
        newMap.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 90.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });

        // Just mark the map as ready after initial load
        console.log('Map fully initialized');
        setIsMapReady(true);
        cleanupInitTimer();
      });

      // Add standard navigation controls
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
      cleanupInitTimer();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [cleanupInitTimer]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
});

export default MapContainer;

// Export the ref interface for parent components
export type { MapRef };
