import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import PlaceHighlight from './PlaceHighlight';

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
  const [hoverPlace, setHoverPlace] = useState<PlaceLabel | null>(null);
  const clickHandlerRef = useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);
  const moveHandlerRef = useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);

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

  const handleMapMove = (e: mapboxgl.MapMouseEvent) => {
    const point = e.point;
    const bbox: [mapboxgl.Point, mapboxgl.Point] = [
      new mapboxgl.Point(
        point.x - detectionRadius,
        point.y - detectionRadius
      ),
      new mapboxgl.Point(
        point.x + detectionRadius,
        point.y + detectionRadius
      )
    ];

    const place = findNearestPlace(point, bbox);
    setHoverPlace(place);
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
    onPlaceDetected?.(place);
  };

  useEffect(() => {
    if (!map) return;

    moveHandlerRef.current = handleMapMove;
    clickHandlerRef.current = handleMapClick;

    map.on('mousemove', moveHandlerRef.current);
    map.on('click', clickHandlerRef.current);

    return () => {
      if (moveHandlerRef.current) {
        map.off('mousemove', moveHandlerRef.current);
        moveHandlerRef.current = null;
      }
      if (clickHandlerRef.current) {
        map.off('click', clickHandlerRef.current);
        clickHandlerRef.current = null;
      }
    };
  }, [map]);

  return (
    <PlaceHighlight
      map={map}
      coordinates={hoverPlace?.coordinates || null}
    />
  );
};

export default PlaceManager;