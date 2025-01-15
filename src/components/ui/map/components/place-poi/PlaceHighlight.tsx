import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

interface PlaceHighlightProps {
  map: mapboxgl.Map;
  coordinates: [number, number] | null;
}

export const PlaceHighlight: React.FC<PlaceHighlightProps> = ({
  map,
  coordinates
}) => {
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!coordinates) {
      if (marker) {
        marker.remove();
        setMarker(null);
      }
      return;
    }

    // Create a custom DOM element for the highlight
    const el = document.createElement('div');
    el.className = 'place-highlight';
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = 'rgba(33, 150, 243, 0.2)';
    el.style.border = '2px solid rgb(33, 150, 243)';
    el.style.animation = 'pulse 2s infinite';

    // Add pulse animation style if it doesn't exist
    if (!document.querySelector('#place-highlight-style')) {
      const style = document.createElement('style');
      style.id = 'place-highlight-style';
      style.innerHTML = `
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.4);
          }
          
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(33, 150, 243, 0);
          }
          
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(33, 150, 243, 0);
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Create and add the marker
    const newMarker = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat(coordinates)
      .addTo(map);

    setMarker(newMarker);

    return () => {
      newMarker.remove();
      setMarker(null);
    };
  }, [map, coordinates]);

  return null;
};

export default PlaceHighlight;