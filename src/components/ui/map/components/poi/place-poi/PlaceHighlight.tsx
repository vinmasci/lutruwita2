// PlaceHighlight.tsx
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface PlaceHighlightProps {
  map: mapboxgl.Map;
  coordinates: [number, number] | null;
}

export const PlaceHighlight: React.FC<PlaceHighlightProps> = ({
  map,
  coordinates
}) => {
  const highlightLayerId = 'place-highlight-layer';

  useEffect(() => {
    // Remove any existing highlight layer
    if (map.getLayer(highlightLayerId)) {
      map.removeLayer(highlightLayerId);
    }
    if (map.getSource(highlightLayerId)) {
      map.removeSource(highlightLayerId);
    }

    // Only add highlight if we have coordinates
    if (coordinates) {
      // Add a new source and layer for the highlight
      map.addSource(highlightLayerId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coordinates
          },
          properties: {}
        }
      });

      map.addLayer({
        id: highlightLayerId,
        type: 'circle',
        source: highlightLayerId,
        paint: {
          'circle-radius': 12,
          'circle-color': 'rgba(255, 255, 255, 0.2)',
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255, 255, 255, 0.8)'
        }
      });
    }

    // Cleanup
    return () => {
      if (map.getLayer(highlightLayerId)) {
        map.removeLayer(highlightLayerId);
      }
      if (map.getSource(highlightLayerId)) {
        map.removeSource(highlightLayerId);
      }
    };
  }, [map, coordinates]);

  return null;
};

export default PlaceHighlight;