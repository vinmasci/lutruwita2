// ======================
// Imports and Type Definitions
// ======================
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl, { MapMouseEvent } from 'mapbox-gl';
import PlaceHighlight from './PlaceHighlight';
import PlacePOIModal from './PlacePOIModal';
import { POICategory } from '@/types/note-types';
import { POIIcons } from '@/types/note-types';
import { Alert, Snackbar } from '@mui/material';
import { getCategoryColor } from '../../../utils/poi/poi-markers';

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

// ======================
// Constants and Utility Functions
// ======================
const getScaledSize = (map: mapboxgl.Map) => {
  const zoom = map.getZoom();
  const size = Math.min(32, Math.max(16, Math.floor(zoom * 1.2)));
  return {
    iconSize: size,
    padding: Math.max(2, Math.floor(size * 0.15)),
    fontSize: Math.max(12, Math.floor(size * 0.75)),
    arrowSize: Math.max(4, Math.floor(size * 0.25))
  };
};

const PLACE_LAYER_PATTERNS = [
  'settlement-major-label',
  'settlement-minor-label',
  'settlement-subdivision-label'
];

const UPDATE_EVENTS = ['move', 'zoom', 'render'] as const;

const DEFAULT_DETECTION_RADIUS = 50;

// ======================
// Component
// ======================
export const PlaceManager: React.FC<PlaceManagerProps> = ({
  map,
  onPlaceDetected,
  detectionRadius = DEFAULT_DETECTION_RADIUS
}) => {
  const [hoverPlace, setHoverPlace] = useState<PlaceLabel | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceLabel | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(true);
  const clickHandlerRef = useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);
  const moveHandlerRef = useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);

  // ======================
  // Place Detection Functions
  // ======================
  const determinePlaceType = (layerId: string): PlaceLabel['type'] => {
    if (layerId.includes('settlement-major-label')) return 'city';
    if (layerId.includes('settlement-minor-label')) return 'town';
    if (layerId.includes('settlement-subdivision-label')) return 'suburb';
    return 'town';
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

  // ======================
  // Event Handlers
  // ======================
  const handleMapMove = (e: mapboxgl.MapMouseEvent & { point: mapboxgl.Point }) => {
    if (!map || !e.point) return;
    
    const point = e.point;
    const bbox: [mapboxgl.Point, mapboxgl.Point] = [
      new mapboxgl.Point(point.x - detectionRadius, point.y - detectionRadius),
      new mapboxgl.Point(point.x + detectionRadius, point.y + detectionRadius)
    ];

    const place = findNearestPlace(point, bbox);
    setHoverPlace(place);
  };

  const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
    if (!map || !map.getStyle()) return;

    const clickPoint = e.point;
    const bbox: [mapboxgl.Point, mapboxgl.Point] = [
      new mapboxgl.Point(clickPoint.x - detectionRadius, clickPoint.y - detectionRadius),
      new mapboxgl.Point(clickPoint.x + detectionRadius, clickPoint.y + detectionRadius)
    ];

    const place = findNearestPlace(clickPoint, bbox);
    
    if (place) {
      setSelectedPlace(place);
      setModalOpen(true);
    }
    onPlaceDetected?.(place);
  };

  const handleAddPOIs = (placeId: string, pois: Array<{
    category: POICategory;
    type: any;
  }>) => {
    if (!selectedPlace || !map) return;

    // Calculate base vertical offset and spacing
    const scale = getScaledSize(map);
    const poiSpacing = scale.iconSize + 5;
    const labelHeight = Math.max(14, map.getZoom() * 1.2);
    const baseVerticalOffset = labelHeight + 0;
    const poisPerRow = 6;
    
    pois.forEach((poi, index) => {
      // Calculate row and column
      const row = Math.floor(index / poisPerRow);
      const col = index % poisPerRow;

      // Calculate total width of POIs in this row
      const poisInThisRow = Math.min(pois.length - (row * poisPerRow), poisPerRow);
      const totalRowWidth = poisInThisRow * poiSpacing;

      // Calculate offsets
      const xOffset = -totalRowWidth/2 + (col * poiSpacing) + (scale.iconSize / 2) + 2;
      const yOffset = baseVerticalOffset + (row * (scale.iconSize + 3));

      // Create marker element
      const el = document.createElement('div');
      el.className = 'place-poi-marker mapboxgl-marker';

      // Get the background color based on POI category
      const backgroundColor = getCategoryColor(poi.type);

      // Create marker container with POI styling
      const markerContainer = document.createElement('div');
      markerContainer.style.backgroundColor = backgroundColor;
      markerContainer.style.padding = `${scale.padding}px`;
      markerContainer.style.borderRadius = '3px';
      markerContainer.style.boxShadow = '0 1px 2px rgba(0,0,0,0.5)';
      markerContainer.style.position = 'relative';
      markerContainer.style.zIndex = '2';
      markerContainer.style.display = 'flex';
      markerContainer.style.alignItems = 'center';
      markerContainer.style.minWidth = `${scale.iconSize}px`;
      markerContainer.style.minHeight = `${scale.iconSize}px`;
      markerContainer.style.justifyContent = 'center';

      // Add icon with POI styling
      const icon = document.createElement('span');
      icon.className = 'material-icons';
      icon.textContent = POIIcons[poi.type];
      icon.style.color = '#ffffff';
      icon.style.fontSize = `${scale.fontSize}px`;
      markerContainer.appendChild(icon);

      // Add arrow matching POI style
      const arrow = document.createElement('div');
      arrow.style.position = 'absolute';
      arrow.style.bottom = '-4px';
      arrow.style.left = '50%';
      arrow.style.transform = 'translateX(-50%)';
      arrow.style.width = '0';
      arrow.style.height = '0';
      arrow.style.borderLeft = `${scale.arrowSize}px solid transparent`;
      arrow.style.borderRight = `${scale.arrowSize}px solid transparent`;
      arrow.style.borderTop = `${scale.arrowSize}px solid ${backgroundColor}`;
      markerContainer.appendChild(arrow);

      el.appendChild(markerContainer);

      // Create and add marker
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'top',
        offset: [xOffset, yOffset]
      })
      .setLngLat(selectedPlace.coordinates)
      .addTo(map);

      // Store marker reference
      el.__marker = marker;

      el.setAttribute('data-poi-id', `place-${placeId}-poi-${Date.now()}-${index}`);
      el.setAttribute('data-place-id', placeId);
    });

    setModalOpen(false);
    setSelectedPlace(null);
  };

  // ======================
  // Effects
  // ======================
  useEffect(() => {
    if (!map) return;

    const setupListeners = () => {
      if (!map.getStyle()) return;

      if (moveHandlerRef.current) {
        map.off('mousemove', moveHandlerRef.current);
      }
      if (clickHandlerRef.current) {
        map.off('click', clickHandlerRef.current);
      }

      moveHandlerRef.current = handleMapMove;
      clickHandlerRef.current = handleMapClick;

      map.on('mousemove', moveHandlerRef.current);
      map.on('click', clickHandlerRef.current);
      map.getCanvas().style.cursor = 'pointer';
    };

    if (map.loaded()) {
      setupListeners();
    } else {
      map.once('load', setupListeners);
    }

    map.once('styledata', setupListeners);

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

  useEffect(() => {
    if (!map) return;
  
    const updatePOIPositions = () => {
      const currentZoom = map.getZoom();
      const markers = document.querySelectorAll('[data-place-id]');
      
      if (currentZoom >= 17 || currentZoom < 8) {
        markers.forEach((markerEl) => {
          markerEl.style.display = 'none';
        });
        return;
      } else {
        markers.forEach((markerEl) => {
          markerEl.style.display = '';
        });
      }
      
      const markerGroups = new Map<string, Array<{ marker: mapboxgl.Marker, el: Element }>>();
      
      markers.forEach((markerEl) => {
        const placeId = markerEl.getAttribute('data-place-id');
        const marker = (markerEl as any).__marker;
        if (marker && placeId) {
          if (!markerGroups.has(placeId)) {
            markerGroups.set(placeId, []);
          }
          markerGroups.get(placeId)?.push({ marker, el: markerEl });
        }
      });
  
      markerGroups.forEach((groupMarkers, placeId) => {
        const initialPos = groupMarkers[0].marker.getLngLat();
        const searchCenter = map.project([initialPos.lng, initialPos.lat]);
        
        const searchBox: [mapboxgl.Point, mapboxgl.Point] = [
          new mapboxgl.Point(searchCenter.x - 100, searchCenter.y - 100),
          new mapboxgl.Point(searchCenter.x + 100, searchCenter.y + 100)
        ];
  
        let placeFeature = map.queryRenderedFeatures(searchBox, {
          layers: PLACE_LAYER_PATTERNS
        }).find(f => f.id === placeId);
        
        if (!placeFeature) {
          const largerSearchBox: [mapboxgl.Point, mapboxgl.Point] = [
            new mapboxgl.Point(searchCenter.x - 200, searchCenter.y - 200),
            new mapboxgl.Point(searchCenter.x + 200, searchCenter.y + 200)
          ];
          placeFeature = map.queryRenderedFeatures(largerSearchBox, {
            layers: PLACE_LAYER_PATTERNS
          }).find(f => f.id === placeId);
        }
  
        if (!placeFeature || !placeFeature.geometry || placeFeature.geometry.type !== 'Point') {
          return;
        }
  
        const labelCoords = placeFeature.geometry.coordinates as [number, number];
        const labelPoint = map.project(labelCoords);
        
        const scale = getScaledSize(map);
        
        const poiSpacing = scale.iconSize + 4;
        const poisPerRow = 5;
  
        const labelHeight = Math.max(14, map.getZoom() * 1.2);
        const verticalSpacing = scale.iconSize + 4;
        const baseOffset = labelHeight + 16;

        groupMarkers.forEach((item, index) => {
          const row = Math.floor(index / poisPerRow);
          const col = index % poisPerRow;
          
          const groupWidth = Math.min(groupMarkers.length, poisPerRow) * poiSpacing;
          const startX = labelPoint.x - (groupWidth / 2) + (poiSpacing / 2);
          const x = startX + (col * poiSpacing);
          const y = labelPoint.y + baseOffset + (row * verticalSpacing);
          
          const newPos = map.unproject([x, y]);
          item.marker.setLngLat(newPos);
  
          // Update marker styling based on zoom
          const container = item.el.querySelector('div') as HTMLElement;
          if (container) {
            const scale = getScaledSize(map);
            container.style.padding = `${scale.padding}px`;
            container.style.minWidth = `${scale.iconSize}px`;
            container.style.minHeight = `${scale.iconSize}px`;
            
            const icon = container.querySelector('.material-icons') as HTMLElement;
            if (icon) {
              icon.style.fontSize = `${scale.fontSize}px`;
            }

            const arrow = container.querySelector('div[style*="border"]') as HTMLElement;
            if (arrow) {
              arrow.style.borderLeft = `${scale.arrowSize}px solid transparent`;
              arrow.style.borderRight = `${scale.arrowSize}px solid transparent`;
              arrow.style.borderTop = `${scale.arrowSize}px solid ${container.style.backgroundColor}`;
            }
          }
        });
      });
    };
  
    const debouncedUpdate = () => {
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(updatePOIPositions);
      } else {
        updatePOIPositions();
      }
    };
  
    UPDATE_EVENTS.forEach(eventType => {
      map.on(eventType, debouncedUpdate);
    });
  
    updatePOIPositions();
  
    return () => {
      UPDATE_EVENTS.forEach(eventType => {
        map.off(eventType, debouncedUpdate);
      });
    };
  }, [map]);

  // ======================
  // Render
  // ======================
  return (
    <>
      <Snackbar 
        open={showSnackbar} 
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="info" 
          onClose={() => setShowSnackbar(false)}
          sx={{ width: '100%' }}
        >
          Hover over a village, suburb, town or city name
        </Alert>
      </Snackbar>
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
