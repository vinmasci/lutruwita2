import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { usePOI } from '../../utils/poi/poi-state';
import { POIModal } from './POIModal';
import { createPOIMarker } from '../../utils/poi/poi-markers';

interface POIManagerProps {
  map: mapboxgl.Map | null;
}

export const POIManager: React.FC<POIManagerProps> = ({ map }) => {
  const {
    currentPOIs,
    isPlacingPOI,
    poiModalOpen,
    tempMarker,
    setIsPlacingPOI,
    setPoiModalOpen,
    setTempMarker,
    updatePOIPosition  // Added this
  } = usePOI();

  // Keep track of active markers
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  // Set up map click handler
  useEffect(() => {
    if (!map) return;

    const handleClick = (e: mapboxgl.MapMouseEvent & { lngLat: mapboxgl.LngLat }) => {
      if (!map || !isPlacingPOI?.type) {
        console.log('Early return: no map or not in POI placement mode');
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
  }, [map, isPlacingPOI, tempMarker, setIsPlacingPOI, setPoiModalOpen, setTempMarker]);

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
  }, [map, isPlacingPOI, tempMarker, setIsPlacingPOI, setPoiModalOpen, setTempMarker]);

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

      // Add dragend event handler
      marker.on('dragend', () => {
        if (isPlacingPOI) {  // Only allow updates when in POI mode
          const newPos = marker.getLngLat();
          updatePOIPosition(poi.id, {
            lat: newPos.lat,
            lon: newPos.lng
          });
        } else {
          // If not in POI mode, reset marker to original position
          marker.setLngLat([poi.location.lon, poi.location.lat]);
        }
      });

      markersRef.current[poi.id] = marker;
      console.log(`Created permanent marker for POI ${poi.id}`, marker);
    });

  }, [map, currentPOIs, isPlacingPOI, updatePOIPosition]);  // Added updatePOIPosition to dependencies

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
      )}
    </>
  );
};

export default POIManager;