import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';

interface PlaceLabel {
  id: string;
  name: string;
  type: 'town' | 'city' | 'suburb' | 'village';
  coordinates: [number, number];
  zoom: number;
}

interface PlaceManagerProps {
  map: mapboxgl.Map;
  onPlaceDetected?: (place: PlaceLabel | null) => void;
  detectionRadius?: number; // in pixels
}

const PLACE_LAYER_PATTERNS = [
  'settlement-label',
  'place-city-label',
  'place-town-label',
  'place-village-label',
  'place-suburb-label'
];

const DEFAULT_DETECTION_RADIUS = 50; // pixels

export const PlaceManager: React.FC<PlaceManagerProps> = ({
  map,
  onPlaceDetected,
  detectionRadius = DEFAULT_DETECTION_RADIUS
}) => {
  const [selectedPlace, setSelectedPlace] = useState<PlaceLabel | null>(null);
  const clickHandlerRef = useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);

  const determinePlaceType = (layerId: string): PlaceLabel['type'] => {
    if (layerId.includes('city')) return 'city';
    if (layerId.includes('town')) return 'town';
    if (layerId.includes('village')) return 'village';
    if (layerId.includes('suburb')) return 'suburb';
    return 'town'; // default fallback
  };

  const getRelevantLayers = () => {
    const style = map.getStyle();
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
      map.queryRenderedFeatures(bbox, { layers: [layerId] })
    );

    features.forEach(feature => {
      if (!feature.geometry || feature.geometry.type !== 'Point') return;

      const featurePoint = map.project(feature.geometry.coordinates as [number, number]);
      const distance = calculateDistance(clickPoint, featurePoint);

      if (distance <= detectionRadius && distance < minDistance) {
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

  const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
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

    const place = findNearestPlace(clickPoint, bbox);
    setSelectedPlace(place);
    onPlaceDetected?.(place);

    // Debug visualization
    if (process.env.NODE_ENV === 'development') {
      console.log('Detected Place:', place);
      console.log('Click coordinates:', e.lngLat);
      console.log('Detection radius:', detectionRadius);
      console.log('Available layers:', getRelevantLayers());
    }
  };

  useEffect(() => {
    if (!map || clickHandlerRef.current) return;

    clickHandlerRef.current = handleMapClick;
    map.on('click', clickHandlerRef.current);

    return () => {
      if (clickHandlerRef.current) {
        map.off('click', clickHandlerRef.current);
        clickHandlerRef.current = null;
      }
    };
  }, [map]);

  // Provide visual feedback for detected places (optional)
  useEffect(() => {
    if (!selectedPlace) return;

    // Add visual indicator for detected place (implementation depends on your UI needs)
    // This could be a highlight effect, marker, or other visual feedback
    
    return () => {
      // Cleanup visual indicators
    };
  }, [selectedPlace]);

  return null; // This is a logic-only component
};

export default PlaceManager;