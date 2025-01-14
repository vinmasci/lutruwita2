import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { usePOI } from '../../utils/poi/poi-state';
import { POIModal } from './POIModal';
import { addPOIMarkerToMap, removeAllPOIMarkers } from '../../utils/poi/poi-markers';

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
    setTempMarker
  } = usePOI();

  // Keep track of active markers
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  // Set up map click handler
  useEffect(() => {
    if (!map) return;

    const handleClick = (e: mapboxgl.MapMouseEvent & { lngLat: mapboxgl.LngLat }) => {
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
      const el = document.createElement('div');
      el.className = 'temp-poi-marker';
      el.innerHTML = `<span class="material-icons" style="color: #e17055; font-size: 24px;">place</span>`;

      const marker = new mapboxgl.Marker({
        element: el,
        draggable: true,
        anchor: 'bottom'
      })
        .setLngLat([position.lon, position.lat])
        .addTo(map);

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

    // Clean up any markers not in currentPOIs
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!currentPOIs.find(poi => poi.id === id)) {
        marker.remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers for each POI
    currentPOIs.forEach(poi => {
      // Remove existing marker if it exists
      if (markersRef.current[poi.id]) {
        markersRef.current[poi.id].remove();
      }

      // Create new marker
      const marker = addPOIMarkerToMap(map, poi);
      if (marker) {
        markersRef.current[poi.id] = marker;
        console.log(`Added/Updated marker for POI ${poi.id}`, marker);
      }
    });

    return () => {
      // Cleanup only unmounted markers
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
    };
  }, [map, currentPOIs]);

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