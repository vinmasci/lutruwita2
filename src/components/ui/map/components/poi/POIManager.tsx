import React, { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { usePOI } from '../../utils/poi/poi-state';
import { handleMapClick, handleEscapeKey } from '../../utils/poi/poi-events';
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

  // Set up map click handler
  useEffect(() => {
    if (!map) return;

    const handleClick = (e: mapboxgl.MapMouseEvent & { lngLat: mapboxgl.LngLat }) => {
      handleMapClick(e, map);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map]);

  // Set up escape key handler
  useEffect(() => {
    if (!map) return;

    const handleEscape = (e: KeyboardEvent) => {
      handleEscapeKey(e, map);
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [map]);

  // Update markers when POIs change
  useEffect(() => {
    if (!map) return;

    removeAllPOIMarkers();
    currentPOIs.forEach(poi => {
      addPOIMarkerToMap(map, poi);
    });
  }, [map, currentPOIs]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      removeAllPOIMarkers();
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