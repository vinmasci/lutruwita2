import React, { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface PlaceManagerProps {
  map: mapboxgl.Map | null;
}

export const PlaceManager: React.FC<PlaceManagerProps> = ({ map }) => {
  useEffect(() => {
    if (!map) return;

    const handleClick = (e: mapboxgl.MapMouseEvent & { lngLat: mapboxgl.LngLat }) => {
      // Get the clicked point
      const point = e.point;

      // Query rendered features around the clicked point
      const features = map.queryRenderedFeatures(point, {
        layers: ['place-label']  // We'll refine this filter once we see what's available
      });

      // Log what we found
      console.log('Clicked point:', e.lngLat);
      console.log('Found features:', features);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map]);

  return null;  // No visual component yet
};

export default PlaceManager;