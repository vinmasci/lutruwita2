import React, { useEffect, useRef, useCallback, forwardRef, ForwardedRef } from 'react';
import { parseString } from 'xml2js';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapRef {
  handleGpxUpload: (content: string) => Promise<void>;
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
  const mapLoaded = useRef<boolean>(false);
  
  const addRouteToMap = useCallback(async (coordinates: Point[]) => {
    if (!map.current) {
      throw new Error('Map not initialized');
    }

    if (!mapLoaded.current) {
      throw new Error('Map not fully loaded');
    }

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

    // Query surface type for each segment and create style arrays
    const lineDasharray: number[] = [];
    const colors: string[] = [];
    let currentIndex = 0;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const [lon, lat] = [coordinates[i].lon, coordinates[i].lat];
      try {
        const response = await fetch(
          `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${lon},${lat}.json?access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();
        const surfaceType = data.features[0]?.properties?.class || 'paved';
        
        if (surfaceType === 'gravel' || surfaceType.includes('unpaved')) {
          // Dashed line for gravel (alternating cyan)
          lineDasharray.push(2, 1);
          colors.push('#00FFFF', '#00B2B2');
        } else {
          // Solid cyan line for paved
          lineDasharray.push(1, 0);
          colors.push('#00FFFF');
        }
        currentIndex += 2;
      } catch (error) {
        console.error('Error querying surface type:', error);
      }
    }

    // Add the route layer with dynamic styling
    map.current.addLayer({
      id: routeLayerId,
      type: 'line',
      source: routeSourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#00FFFF',
        'line-width': 3,
        'line-dasharray': lineDasharray.length > 0 ? lineDasharray : [1, 0]
      }
    });
  }, []);

  const handleGpxUpload = useCallback(async (gpxContent: string): Promise<void> => {
    if (!map.current) {
      throw new Error('Map not initialized');
    }

    if (!mapLoaded.current) {
      throw new Error('Map not fully loaded. Please try again in a moment.');
    }

    console.log('Starting GPX parse...', gpxContent.substring(0, 100));
    
    return new Promise((resolve, reject) => {
      parseString(gpxContent, (err: Error | null, result: any) => {
        if (err) {
          console.error('Error parsing GPX:', err);
          reject(new Error('Failed to parse GPX file'));
          return;
        }

        try {
          console.log('GPX structure:', JSON.stringify(result, null, 2));

          // Check if we have a route or track
          const points = result.gpx?.rte?.[0]?.rtept || result.gpx?.trk?.[0]?.trkseg?.[0]?.trkpt;
          
          if (!points) {
            throw new Error('Invalid GPX format: missing track points');
          }

          console.log('Points found:', points.length);

          const coordinates: Point[] = points.map((point: any) => {
            if (!point.$ || !point.$.lat || !point.$.lon) {
              throw new Error('Invalid track point format');
            }
            return {
              lat: parseFloat(point.$.lat),
              lon: parseFloat(point.$.lon)
            };
          });

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
  }, [addRouteToMap]);

  // Expose the handleGpxUpload function to parent components
  React.useImperativeHandle(
    ref,
    () => ({
      handleGpxUpload
    }),
    [handleGpxUpload]
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

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [146.5, -41.5], // Center on Tasmania
        zoom: 6,
        minZoom: 3,
        maxZoom: 18,
        pitch: 0, // Bird's eye view
      });

      // Listen for both style and source loading
      map.current.on('style.load', () => {
        console.log('Map style loaded');
        
        // Add terrain source
        map.current?.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        });

        // Set terrain
        map.current?.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        // Add sky layer
        map.current?.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 90.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });

        // Mark map as loaded after all sources and layers are added
        mapLoaded.current = true;
        console.log('Map fully initialized and ready');

      });

      // Add standard navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.FullscreenControl());
      map.current.addControl(
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
    </div>
  );
});

export default MapContainer;

// Export the ref interface for parent components
export type { MapRef };
