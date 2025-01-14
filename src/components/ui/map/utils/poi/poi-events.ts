import mapboxgl from 'mapbox-gl';
import { POI, POICategory } from '@/types/note-types';
import { createPOIMarker } from './poi-markers';
import { usePOI } from './poi-state.tsx';

export const handleMapClick = (
  e: mapboxgl.MapMouseEvent & { lngLat: mapboxgl.LngLat }, 
  map: mapboxgl.Map,
  context: ReturnType<typeof usePOI>
) => {
  const { isPlacingPOI, tempMarker, setTempMarker, setIsPlacingPOI, setPoiModalOpen } = context;

  console.log("Map click event:", {
    hasMap: !!map,
    isPlacingPOI,
    clickLocation: e.lngLat,
    tempMarker: !!tempMarker
  });

  if (!map || !isPlacingPOI?.type) {
    console.log('Early return: no map or not in POI placement mode');
    return;
  }

  // Clean up any existing temporary marker first
  if (tempMarker) {
    console.log('Removing existing temp marker');
    tempMarker.remove();
    setTempMarker(null);
  }

  const position = {
    lat: e.lngLat.lat,
    lon: e.lngLat.lng
  };

  // Create new temporary marker with the POI icon
  const marker = createPOIMarker(
    map,
    position,
    isPlacingPOI.type,
    true // isDraggable
  );

  // Update position state when marker is dragged
  marker.on('dragend', () => {
    const newPos = marker.getLngLat();
    setIsPlacingPOI(prev => prev ? {
      ...prev,
      position: {
        lat: newPos.lat,
        lon: newPos.lng
      }
    } : null);
  });

  // Update states
  setTempMarker(marker);
  setIsPlacingPOI(prev => prev ? {
    ...prev,
    position
  } : null);

  // Open modal for data entry
  setPoiModalOpen(true);
};

export const handleEscapeKey = (e: KeyboardEvent, map: mapboxgl.Map) => {
  const context = usePOI();
  const { isPlacingPOI, tempMarker, setIsPlacingPOI, setPoiModalOpen, setTempMarker } = context;
  
  if (e.key === 'Escape' && isPlacingPOI) {
    setIsPlacingPOI(null);
    setPoiModalOpen(false);
    
    // Remove temp marker if it exists
    if (tempMarker) {
      tempMarker.remove();
      setTempMarker(null);
    }
    
    if (map) {
      map.getCanvas().style.cursor = 'default';
    }
  }
};

export const handleAddPOI = async (
  poiData: Omit<POI, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string }, 
  map: mapboxgl.Map
): Promise<POI> => {
  const { addPOI } = usePOI();

  console.log("handleAddPOI called with:", {
    poiData,
    hasMap: !!map
  });

  const newPOI: POI = {
    ...poiData,
    id: `poi-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: poiData.category || POICategory.Infrastructure,
    location: {
      lat: poiData.location.lat,
      lon: poiData.location.lon
    }
  };

  console.log("Created new POI:", newPOI);

  // Add to state
  addPOI(newPOI);
  console.log("Added POI to state");

  return newPOI;
};