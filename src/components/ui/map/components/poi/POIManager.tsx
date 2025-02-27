import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { usePOI } from '../../utils/poi/poi-state';
import { POIModal } from './POIModal';
import { POIDrawer } from './POIDrawer';
import { createPOIMarker } from '../../utils/poi/poi-markers';

interface POIManagerProps {
  map: mapboxgl.Map | null;
  placePOIMode?: boolean;
}

export const POIManager: React.FC<POIManagerProps> = ({ map, placePOIMode }) => {
  const {
    currentPOIs,
    isPlacingPOI,
    poiModalOpen,
    tempMarker,
    selectedPOI,
    isDrawerOpen,
    setIsPlacingPOI,
    setPoiModalOpen,
    setTempMarker,
    setSelectedPOI,
    setIsDrawerOpen,
    setCurrentPOIs,
    updatePOIPosition
  } = usePOI();

  // Keep track of active markers
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  // Set up map click handler
  useEffect(() => {
    if (!map || placePOIMode) return;  // Don't even add click handler if in placePOIMode
  
    const handleClick = (e: mapboxgl.MapMouseEvent & { lngLat: mapboxgl.LngLat }) => {
      if (!map || !isPlacingPOI?.type) {
        return;
      }

      // Clean up any existing temporary marker
      if (tempMarker) {
        console.log('Removing existing temp marker');
        tempMarker.remove();
        setTempMarker(null);
      }

      const position = {
        lat: e.lngLat.lat,
        lon: e.lngLat.lng
      };

      // Create new temporary marker
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

      setPoiModalOpen(true);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, isPlacingPOI, tempMarker, setIsPlacingPOI, setPoiModalOpen, setTempMarker, placePOIMode]);

  // Set up escape key handler
  useEffect(() => {
    if (!map) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPlacingPOI) {
        setIsPlacingPOI(null);
        setPoiModalOpen(false);
        
        if (tempMarker) {
          tempMarker.remove();
          setTempMarker(null);
        }
        
        if (map) {
          map.getCanvas().style.cursor = 'default';
        }
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [map, isPlacingPOI, tempMarker, setIsPlacingPOI, setPoiModalOpen, setTempMarker, placePOIMode]);

  // Update markers when POIs change
  useEffect(() => {
    if (!map) return;

    // Remove all existing markers first
    Object.values(markersRef.current).forEach(marker => {
      marker.remove();
    });
    markersRef.current = {};

    // Add markers for currentPOIs
    currentPOIs.forEach(poi => {
      const marker = createPOIMarker(
        map,
        poi.location,
        poi.type,
        false
      );

      const el = marker.getElement();
      el.setAttribute('data-poi-id', poi.id);

      // Add click handler to open drawer
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isPlacingPOI) {  // Only open drawer if not in placement mode
          setSelectedPOI(poi);
          setIsDrawerOpen(true);
        }
      });

      // Add dragend event handler
      marker.on('dragend', () => {
        const newPos = marker.getLngLat();
        updatePOIPosition(poi.id, {
          lat: newPos.lat,
          lon: newPos.lng
        });
      });

      markersRef.current[poi.id] = marker;
      console.log(`Created permanent marker for POI ${poi.id}`, marker);
    });

  }, [map, currentPOIs, isPlacingPOI, updatePOIPosition, setSelectedPOI, setIsDrawerOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
    };
  }, []);

  return (
    <>
      {map && (
        <>
          <POIModal
            map={map}
            open={poiModalOpen}
            selectedType={isPlacingPOI?.type}
            tempMarker={tempMarker}
            onClose={() => {
              setPoiModalOpen(false);
              if (tempMarker) {
                tempMarker.remove();
                setTempMarker(null);
              }
              if (!isPlacingPOI?.position) {
                setIsPlacingPOI(null);
                map.getCanvas().style.cursor = 'default';
              }
            }}
          />
          <POIDrawer
            open={isDrawerOpen}
            onClose={() => {
              setIsDrawerOpen(false);
              setSelectedPOI(null);
            }}
            poi={selectedPOI}
            onSave={(updatedPOI) => {
              setCurrentPOIs(prev => 
                prev.map(p => p.id === updatedPOI.id ? updatedPOI : p)
              );
            }}
            onDelete={(poiId) => {
              setCurrentPOIs(prev => prev.filter(p => p.id !== poiId));
            }}
          />
        </>
      )}
    </>
  );
};

export default POIManager;