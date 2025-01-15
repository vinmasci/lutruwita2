import React, { useState, useEffect, useCallback } from 'react';
import PlacePOIControl from './PlacePOIControl';
import { PlaceManager } from './PlaceManager';
import { PlacePOIModal } from './PlacePOIModal';
import mapboxgl from 'mapbox-gl';
import type { Map as MapboxMap } from 'mapbox-gl';
import type { PlaceLabel } from '../../../../../types/place-types';
import type { POI } from '../../../../../types/note-types';

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
  const [selectedPlace, setSelectedPlace] = useState<PlaceLabel | null>(null);
  
  console.log('Place POI Mode:', isPlacePOIMode);
  console.log('Selected Place:', selectedPlace);
  
  // Handle cursor style changes
  useEffect(() => {
    if (!map) return;
    
    if (isPlacePOIMode) {
      map.getCanvas().style.cursor = 'crosshair';
    } else {
      map.getCanvas().style.cursor = '';
    }

    return () => {
      if (map) {
        map.getCanvas().style.cursor = '';
      }
    };
  }, [map, isPlacePOIMode]);

  // Handle place selection
  const handlePlaceSelected = useCallback((place: PlaceLabel | null) => {
    console.log('Place selection triggered');
    if (!place) {
      console.log('No place selected');
      return;
    }
    
    console.log('Place selected:', place);
    setSelectedPlace(place);
    setIsPlacePOIMode(false);
    console.log('Place POI Mode deactivated after selection');
  }, []);

  // Handle icon assignment from modal
  const handleAddPOIs = useCallback((placeId: string, pois: POI[]) => {
    if (!map || !selectedPlace) return;

    // Add marker to map for each POI
    pois.forEach(poi => {
      new mapboxgl.Marker()
        .setLngLat(selectedPlace.coordinates)
        .addTo(map);
    });

    setSelectedPlace(null);
  }, [map, selectedPlace]);

  return (
    <>
      <PlacePOIControl
        isActive={isPlacePOIMode}
        onClick={() => {
          console.log('Place POI Control clicked');
          console.log('Current mode:', isPlacePOIMode ? 'active' : 'inactive');
          console.log('Toggling mode to:', !isPlacePOIMode ? 'active' : 'inactive');
          setIsPlacePOIMode(!isPlacePOIMode);
        }}
        className={className}
      />
      
      {map && isPlacePOIMode && (
        <>
          {console.log('Rendering PlaceManager with map:', map)}
          {console.log('Map loaded state:', map.loaded() ? 'loaded' : 'not loaded')}
          {console.log('Map style:', map.getStyle()?.name || 'no style loaded')}
          <PlaceManager
            map={map}
            onPlaceDetected={handlePlaceSelected}
          />
        </>
      )}

      {selectedPlace && (
        <PlacePOIModal
          open={!!selectedPlace}
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onAddPOIs={(placeId, pois) => handleAddPOIs(placeId, pois)}
        />
      )}
    </>
  );
};

export default PlacePOIModeManager;
