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

  // Rest of your existing helper functions (determinePlaceType, getRelevantLayers, etc.)...

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