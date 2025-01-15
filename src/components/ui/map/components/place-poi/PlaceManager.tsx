import React, { useEffect, useRef, useState } from 'react';
import mapboxgl, { MapMouseEvent } from 'mapbox-gl';
import PlaceHighlight from './PlaceHighlight';
import PlacePOIModal from './PlacePOIModal';
import { POICategory } from '@/types/note-types';
import { POIIcons } from '@/types/note-types';

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

// Add getScaledSize function here
const getScaledSize = (map: mapboxgl.Map) => {
  const zoom = map.getZoom();
  // Base size is 12px, scales up with zoom but caps at 24px
  const size = Math.min(24, Math.max(12, Math.floor(zoom * 1.2)));
  return {
    iconSize: size,
    padding: Math.max(3, Math.floor(size / 4)),
    fontSize: Math.max(10, Math.floor(size * 0.8)),
    arrowSize: Math.max(3, Math.floor(size / 4))
  };
};

// These patterns match the satellite-streets-v12 style layer IDs
const PLACE_LAYER_PATTERNS = [
  'settlement-major-label',
  'settlement-minor-label',
  'settlement-subdivision-label'
];

// Add this at the top with other constants
const UPDATE_EVENTS = ['move', 'zoom', 'render'] as const;

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

    // Get the pixel coordinates of the place label
    const labelPoint = map.project(selectedPlace.coordinates);
    
    // Calculate label height based on current zoom level
    const labelHeight = Math.max(14, map.getZoom() * 1.2); // Scale with zoom
    
    // Calculate base vertical offset (distance below label)
    const baseVerticalOffset = labelHeight + 8; // 8px padding below label
    
    // Calculate total width needed for all POIs
    const poiSize = Math.max(16, map.getZoom() * 1.2); // Scale POI size with zoom
    const poiSpacing = poiSize + 4; // 4px spacing between POIs
    const totalWidth = pois.length * poiSpacing;
    
    pois.forEach((poi, index) => {
      // Calculate horizontal position (centered below label)
      const startX = labelPoint.x - (totalWidth / 2) + (poiSpacing * index) + (poiSize / 2);
      
      // Calculate vertical position (stacked if needed)
      const verticalOffset = baseVerticalOffset + (Math.floor(index / 5) * (poiSize + 4));
      
      // Convert back to geographic coordinates
      const poiPoint = map.unproject([startX, labelPoint.y + verticalOffset]);
      
      const poiLocation = {
        lat: poiPoint.lat,
        lon: poiPoint.lng
      };

      // Create the marker element
      const el = document.createElement('div');
      el.className = 'place-poi-marker mapboxgl-marker';

      const scale = getScaledSize(map);
      // Create marker container with custom styling
      const markerContainer = document.createElement('div');
      markerContainer.style.backgroundColor = '#FFFFFF';
      markerContainer.style.padding = `${scale.padding}px`;
      markerContainer.style.borderRadius = `${scale.padding}px`;
      markerContainer.style.border = '1px solid #000000';
      markerContainer.style.position = 'relative';
      markerContainer.style.display = 'flex';
      markerContainer.style.alignItems = 'center';
      markerContainer.style.minWidth = `${scale.iconSize}px`;
      markerContainer.style.minHeight = `${scale.iconSize}px`;

      // Add icon with custom styling
      const icon = document.createElement('span');
      icon.className = 'material-icons';
      icon.textContent = POIIcons[poi.type];
      icon.style.color = '#000000';
      icon.style.fontSize = '10px'; // Reduced from 16px
      markerContainer.appendChild(icon);

      // Add arrow
      const arrow = document.createElement('div');
      arrow.style.position = 'absolute';
      arrow.style.bottom = '-4px'; // Reduced from -6px
      arrow.style.left = '50%';
      arrow.style.transform = 'translateX(-50%)';
      arrow.style.width = '0';
      arrow.style.height = '0';
      arrow.style.borderLeft = '3px solid transparent'; // Reduced from 6px
      arrow.style.borderRight = '3px solid transparent'; // Reduced from 6px
      arrow.style.borderTop = '3px solid #000000'; // Reduced from 6px

      el.appendChild(markerContainer);

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
      })
      .setLngLat([poiLocation.lon, poiLocation.lat])
      .addTo(map);

      // Store marker reference
      el.__marker = marker;

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

  useEffect(() => {
    if (!map) return;
  
    const updatePOIPositions = () => {
      const markers = document.querySelectorAll('[data-place-id]');
      
      // Group markers by place
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
  
      // Update each group of markers
      markerGroups.forEach((groupMarkers, placeId) => {
        const labelFeatures = map.queryRenderedFeatures(undefined, {
          layers: PLACE_LAYER_PATTERNS
        });
  
        const placeFeature = labelFeatures.find(f => f.id === placeId);
        if (!placeFeature || !placeFeature.geometry || placeFeature.geometry.type !== 'Point') return;
  
        // Get the screen coordinates of the place label
        const labelCoords = placeFeature.geometry.coordinates as [number, number];
        const labelPoint = map.project(labelCoords);
        
        // Get the zoom-based scale
        const scale = getScaledSize(map);
        
        // Calculate the space needed for all POIs in this group
        const poiSpacing = scale.iconSize + 4;
        const poisPerRow = 5;
        const rowCount = Math.ceil(groupMarkers.length / poisPerRow);
        const rowWidth = Math.min(groupMarkers.length, poisPerRow) * poiSpacing;
  
        // Get the actual rendered label height (approximate)
        const labelHeight = Math.max(14, map.getZoom() * 1.2);
        const verticalSpacing = scale.iconSize + 4;
        const baseOffset = labelHeight + 8;
  
        // Update each POI position
        groupMarkers.forEach((item, index) => {
          const row = Math.floor(index / poisPerRow);
          const col = index % poisPerRow;
          
          // Calculate screen coordinates
          const x = labelPoint.x - (rowWidth / 2) + (col * poiSpacing) + (scale.iconSize / 2);
          const y = labelPoint.y + baseOffset + (row * verticalSpacing);
          
          // Convert screen coordinates back to map coordinates
          const newPos = map.unproject([x, y]);
          
          // Update marker position
          item.marker.setLngLat(newPos);
  
          // Update marker size and styling
          const markerContainer = item.el.querySelector('div') as HTMLElement;
          if (markerContainer) {
            markerContainer.style.minWidth = `${scale.iconSize}px`;
            markerContainer.style.minHeight = `${scale.iconSize}px`;
            markerContainer.style.padding = `${scale.padding}px`;
            
            const icon = markerContainer.querySelector('.material-icons') as HTMLElement;
            if (icon) {
              icon.style.fontSize = `${scale.fontSize}px`;
            }
          }
        });
      });
    };
  
    // Add listeners for all update events
    UPDATE_EVENTS.forEach(eventType => {
      map.on(eventType, updatePOIPositions);
    });
  
    // Initial update
    updatePOIPositions();
  
    // Cleanup
    return () => {
      UPDATE_EVENTS.forEach(eventType => {
        map.off(eventType, updatePOIPositions);
      });
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