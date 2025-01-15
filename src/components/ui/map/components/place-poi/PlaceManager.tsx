import React, { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface PlaceManagerProps {
  map: mapboxgl.Map | null;
}

export const PlaceManager: React.FC<PlaceManagerProps> = ({ map }) => {
  useEffect(() => {
    if (!map) return;

    const handleClick = (e: mapboxgl.MapMouseEvent & { lngLat: mapboxgl.LngLat }) => {
      // Get all layers first to see what's available
      const allLayers = map.getStyle().layers;
      const labelLayers = allLayers
        .filter(layer => layer.id.includes('label') && layer.id.includes('place'))
        .map(layer => layer.id);
      
      console.log('Available label layers:', labelLayers);

      // Query a slightly larger area around the click point for labels
      const bbox = [
        [e.point.x - 20, e.point.y - 20],
        [e.point.x + 20, e.point.y + 20]
      ];

      // Query for place labels in all relevant layers
      const features = labelLayers.flatMap(layerId => 
        map.queryRenderedFeatures(bbox, { layers: [layerId] })
      );

      // Log what we found
      console.log('Click position:', e.lngLat);
      console.log('Found place labels:', features);

      // If we found any labels, log more details about the first one
      if (features.length > 0) {
        const place = features[0];
        console.log('Place details:', {
          name: place.properties?.name,
          type: place.properties?.type,
          class: place.properties?.class,
          position: place.geometry.type === 'Point' ? place.geometry.coordinates : null
        });
      }
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map]);

  return null;
};

export default PlaceManager;