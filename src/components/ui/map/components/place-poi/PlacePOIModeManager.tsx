import React, { useState, useEffect, useCallback } from 'react';
import { PlacePOIControl } from './PlacePOIControl';
import { PlaceManager } from './PlaceManager';
import type { Map as MapboxMap } from 'mapbox-gl';
import type { PlaceLabel } from './PlaceManager';

interface PlacePOIModeManagerProps {
  map: MapboxMap | null;
  className?: string;
  onPlaceSelected?: (place: PlaceLabel) => void;
}

export const PlacePOIModeManager: React.FC<PlacePOIModeManagerProps> = ({
  map,
  className,
  onPlaceSelected
}) => {
  const [isPlacePOIMode, setIsPlacePOIMode] = useState(false);
  
  // Handle cursor style changes
  useEffect(() => {
    if (!map) return;
    
    if (isPlacePOIMode) {
      map.getCanvas().style.cursor = 'pointer';
    } else {
      map.getCanvas().style.cursor = '';
    }

    return () => {
      if (map) {
        map.getCanvas().style.cursor = '';
      }
    };
  }, [map, isPlacePOIMode]);

  // Handle place detection
  const handlePlaceDetected = useCallback((place: PlaceLabel | null) => {
    if (!isPlacePOIMode) return;
    
    if (place) {
      onPlaceSelected?.(place);
      // Optionally disable place POI mode after selection
      setIsPlacePOIMode(false);
    }
  }, [isPlacePOIMode, onPlaceSelected]);

  return (
    <>
      <PlacePOIControl
        isActive={isPlacePOIMode}
        onClick={() => setIsPlacePOIMode(!isPlacePOIMode)}
        className={className}
      />
      
      {map && isPlacePOIMode && (
        <PlaceManager
          map={map}
          onPlaceDetected={handlePlaceDetected}
        />
      )}
    </>
  );
};

export default PlacePOIModeManager;