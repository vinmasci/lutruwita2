import React, { useEffect, useRef, useState } from 'react';
import mapboxgl, { MapMouseEvent } from 'mapbox-gl';
import PlaceHighlight from './PlaceHighlight';
import PlacePOIModal from './PlacePOIModal';
import { POICategory } from '@/types/note-types';
import { createPOIMarker } from '@/components/ui/map/utils/poi/poi-markers';

export interface PlaceLabel {
  id: string;
  name: string;
  type: 'town' | 'city' | 'suburb' | 'village';
  coordinates: [number, number];
  zoom: number;
}

interface PlaceManagerProps {
  map: mapboxgl.Map;
  onPlaceDetected?: (place: PlaceLabel | null) => void;
  isActive?: boolean;
  detectionRadius?: number;
}

// These patterns match the satellite-streets-v12 style layer IDs
const PLACE_LAYER_PATTERNS = [
  'settlement-major-label',
  'settlement-minor-label',
  'settlement-subdivision-label'
];

const DEFAULT_DETECTION_RADIUS = 50;

export const PlaceManager: React.FC<PlaceManagerProps> = ({
  map,
  onPlaceDetected,
  detectionRadius = DEFAULT_DETECTION_RADIUS
}) => {
  const [hoverPlace, setHoverPlace] = useState<PlaceLabel | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceLabel | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const clickHandlerRef = useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);
  const moveHandlerRef = useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);

  const determinePlaceType = (layerId: string): PlaceLabel['type'] => {
    if (layerId.includes('settlement-major-label')) return 'city';
    if (layerId.includes('settlement-minor-label')) return 'town';
    if (layerId.includes('settlement-subdivision-label')) return 'suburb';
    return 'town'; // default fallback for unknown labels
  };

  const getRelevantLayers = () => {
    if (!map) return [];
    const style = map.getStyle();
    if (!style || !style.layers) return [];
    return style.layers
      .filter(layer => 
        PLACE_LAYER_PATTERNS.some(pattern => layer.id.includes(pattern))
      )
      .map(layer => layer.id);
  };

  const calculateDistance = (point1: mapboxgl.Point, point2: mapboxgl.Point): number => {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + 
      Math.pow(point2.y - point1.y, 2)
    );
  };

  const findNearestPlace = (clickPoint: mapboxgl.Point, bbox: [mapboxgl.Point, mapboxgl.Point]) => {
    const layers = getRelevantLayers();
    let nearestPlace: PlaceLabel | null = null;
    let minDistance = Infinity;

    const features = layers.flatMap(layerId => 
      map?.queryRenderedFeatures(bbox, { layers: [layerId] }) || []
    );

    features.forEach(feature => {
      if (!feature.geometry || feature.geometry.type !== 'Point') return;

      if (!map) return;
      const featurePoint = map.project(feature.geometry.coordinates as [number, number]);
      const distance = calculateDistance(clickPoint, featurePoint);

      if (distance <= detectionRadius && distance < minDistance && feature.layer) {
        minDistance = distance;
        nearestPlace = {
          id: feature.id as string,
          name: feature.properties?.name || 'Unknown Place',
          type: determinePlaceType(feature.layer.id),
          coordinates: feature.geometry.coordinates as [number, number],
          zoom: map.getZoom()
        };
      }
    });

    return nearestPlace;
  };

  const handleMapMove = (e: mapboxgl.MapMouseEvent & { point: mapboxgl.Point }) => {
    if (!map || !e.point) {
      console.log('Map or point is not available');
      return;
    }
    
    const point = e.point;
    if (typeof point.x !== 'number' || typeof point.y !== 'number') {
      console.log('Invalid point coordinates:', point);
      return;
    }

    const bbox: [mapboxgl.Point, mapboxgl.Point] = [
      new mapboxgl.Point(
        Number(point.x) - Number(detectionRadius),
        Number(point.y) - Number(detectionRadius)
      ),
      new mapboxgl.Point(
        Number(point.x) + Number(detectionRadius),
        Number(point.y) + Number(detectionRadius)
      )
    ];

    const place = findNearestPlace(point, bbox);
    setHoverPlace(place);
  };

  const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
    if (!map || !map.getStyle()) {
      console.log('Map or map style is not available');
      return;
    }

    console.log('Click coordinates:', e.lngLat);
    console.log('Pixel coordinates:', e.point);
    
    const clickPoint = e.point;
    const bbox: [mapboxgl.Point, mapboxgl.Point] = [
      new mapboxgl.Point(
        clickPoint.x - detectionRadius,
        clickPoint.y - detectionRadius
      ),
      new mapboxgl.Point(
        clickPoint.x + detectionRadius,
        clickPoint.y + detectionRadius
      )
    ];
  
    // Add debug logging for layers
    const layers = getRelevantLayers();
    console.log('Available place layers:', layers);

    // Debug log for features found
    const features = layers.flatMap(layerId => {
      const found = map.queryRenderedFeatures(bbox, { layers: [layerId] });
      console.log(`Features found for layer ${layerId}:`, found);
      return found;
    });

    console.log('Total features found:', features.length);
  
    const place = findNearestPlace(clickPoint, bbox);
    
    if (place) {
      setSelectedPlace(place);
      setModalOpen(true);
    } else {
      console.log('No place found near click point');
    }
    onPlaceDetected?.(place);
  };

  const handleAddPOIs = (placeId: string, pois: Array<{
    category: POICategory;
    type: any;
  }>) => {
    if (!selectedPlace || !map) {
      console.log('No selected place or map available');
      return;
    }

    console.log('Starting to add POIs:', {
      placeId,
      pois,
      selectedPlace
    });

    pois.forEach((poi, index) => {
      const offset = 0.002;
      const angle = (Math.PI * (index + 1)) / (pois.length + 1);
      
      const poiLocation = {
        lat: selectedPlace.coordinates[1] - offset,
        lon: selectedPlace.coordinates[0] + Math.cos(angle) * offset
      };

      const marker = createPOIMarker(map, poiLocation, poi.type, false);
      const el = marker.getElement();
      el.setAttribute('data-poi-id', `place-${placeId}-poi-${Date.now()}-${index}`);
      el.setAttribute('data-place-id', placeId);
      
      console.log('Added marker:', {
        placeId,
        poiType: poi.type,
        location: poiLocation
      });
    });

    setModalOpen(false);
    setSelectedPlace(null);
  };

  useEffect(() => {
    if (!map) return;

    const setupListeners = () => {
      if (!map.getStyle()) return;

      console.log('Setting up click handlers in PlaceManager');

      // Remove existing listeners first to avoid duplicates
      if (moveHandlerRef.current) {
        map.off('mousemove', moveHandlerRef.current);
      }
      if (clickHandlerRef.current) {
        map.off('click', clickHandlerRef.current);
      }

      moveHandlerRef.current = handleMapMove;
      clickHandlerRef.current = handleMapClick;

      if (moveHandlerRef.current) {
        map.on('mousemove', moveHandlerRef.current);
      }
      if (clickHandlerRef.current) {
        map.on('click', clickHandlerRef.current);
      }

      map.getCanvas().style.cursor = 'pointer';
    };

    if (map.loaded()) {
      setupListeners();
    } else {
      map.once('load', setupListeners);
    }

    map.once('styledata', () => {
      if (getRelevantLayers().length === 0) {
        console.log('No place label layers found in map style');
      }
      setupListeners();
    });

    return () => {
      if (moveHandlerRef.current) {
        map.off('mousemove', moveHandlerRef.current);
        moveHandlerRef.current = null;
      }
      if (clickHandlerRef.current) {
        map.off('click', clickHandlerRef.current);
        clickHandlerRef.current = null;
      }
      map.getCanvas().style.cursor = '';
    };
  }, [map]);

  return (
    <>
      <div 
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px',
          zIndex: 1000,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        Hover over a village, suburb, town or city name
      </div>
      <PlaceHighlight
        map={map}
        coordinates={hoverPlace?.coordinates || null}
      />
      {modalOpen && selectedPlace && (
        <PlacePOIModal
          open={modalOpen}
          place={selectedPlace}
          onClose={() => {
            setModalOpen(false);
            setSelectedPlace(null);
          }}
          onAddPOIs={handleAddPOIs}
        />
      )}
    </>
  );
};

export default PlaceManager;