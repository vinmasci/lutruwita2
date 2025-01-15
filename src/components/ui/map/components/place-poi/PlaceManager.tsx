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

// ======================
// Component Props and State
// ======================
export const PlaceManager: React.FC<PlaceManagerProps> = ({
  map,
  onPlaceDetected,
  detectionRadius = DEFAULT_DETECTION_RADIUS
}) => {
  const [hoverPlace, setHoverPlace] = useState<PlaceLabel | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceLabel | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(true);  // Add it here
  const clickHandlerRef = useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);
  const moveHandlerRef = useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);

// ======================
// Event Handlers
// ======================
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

  const layers = getRelevantLayers();
  console.log('Available place layers:', layers);

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

  // Calculate base vertical offset and spacing
  const scale = getScaledSize(map);
  const poiSpacing = scale.iconSize + 8;
  const labelHeight = Math.max(14, map.getZoom() * 1.2);
  const baseVerticalOffset = labelHeight + 2;
  const poisPerRow = 5;
  
  pois.forEach((poi, index) => {
    // Calculate row and column for this POI
    const row = Math.floor(index / poisPerRow);
    const col = index % poisPerRow;

    // Calculate the total width of POIs in this row
    const poisInThisRow = Math.min(pois.length - (row * poisPerRow), poisPerRow);
    const totalRowWidth = poisInThisRow * poiSpacing;

    // Calculate pixel offsets from the place label
    const xOffset = -totalRowWidth/2 + (col * poiSpacing) + (scale.iconSize / 2);
    const yOffset = baseVerticalOffset + (row * (scale.iconSize + 4));

    // Create the marker element
    const el = document.createElement('div');
    el.className = 'place-poi-marker mapboxgl-marker';

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
    icon.style.fontSize = `${scale.fontSize}px`;
    markerContainer.appendChild(icon);

    // Add arrow pointing up (since anchor is now top)
    const arrow = document.createElement('div');
    arrow.style.position = 'absolute';
    arrow.style.top = '-4px';
    arrow.style.left = '50%';
    arrow.style.transform = 'translateX(-50%) rotate(180deg)';
    arrow.style.width = '0';
    arrow.style.height = '0';
    arrow.style.borderLeft = `${scale.arrowSize}px solid transparent`;
    arrow.style.borderRight = `${scale.arrowSize}px solid transparent`;
    arrow.style.borderBottom = `${scale.arrowSize}px solid #000000`;

    el.appendChild(markerContainer);
    markerContainer.appendChild(arrow);

    // Create and add the marker with offset
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
    
    console.log('Added marker:', {
      placeId,
      poiType: poi.type,
      offset: [xOffset, yOffset]
    });
  });

  setModalOpen(false);
  setSelectedPlace(null);
};

// ======================
// Effects and Lifecycle Methods
// ======================
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
      // Add zoom check at the start
      const currentZoom = map.getZoom();
      const markers = document.querySelectorAll('[data-place-id]');
      
      // Hide all markers if zoom is outside our desired range (11-15)
      if (currentZoom >= 17 || currentZoom < 8) {
        markers.forEach((markerEl) => {
          const marker = (markerEl as any).__marker;
          markerEl.style.display = 'none';
        });
        return;
      } else {
        // Show markers if they were hidden and we're in the correct zoom range
        markers.forEach((markerEl) => {
          const marker = (markerEl as any).__marker;
          markerEl.style.display = '';
        });
      }
      
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
        // Get initial search position from first marker in group
        const initialPos = groupMarkers[0].marker.getLngLat();
        const searchCenter = map.project([initialPos.lng, initialPos.lat]);
        
        // Create a search box around the marker's position
        const searchBox: [mapboxgl.Point, mapboxgl.Point] = [
          new mapboxgl.Point(searchCenter.x - 100, searchCenter.y - 100),
          new mapboxgl.Point(searchCenter.x + 100, searchCenter.y + 100)
        ];
  
        // Search for place labels near the marker
        const labelFeatures = map.queryRenderedFeatures(searchBox, {
          layers: PLACE_LAYER_PATTERNS
        });
  
        const placeFeature = labelFeatures.find(f => f.id === placeId);
        
        // If we can't find the place label, try searching in a larger area
        if (!placeFeature) {
          const largerSearchBox: [mapboxgl.Point, mapboxgl.Point] = [
            new mapboxgl.Point(searchCenter.x - 200, searchCenter.y - 200),
            new mapboxgl.Point(searchCenter.x + 200, searchCenter.y + 200)
          ];
          const moreFeatures = map.queryRenderedFeatures(largerSearchBox, {
            layers: PLACE_LAYER_PATTERNS
          });
          placeFeature = moreFeatures.find(f => f.id === placeId);
        }
  
        if (!placeFeature || !placeFeature.geometry || placeFeature.geometry.type !== 'Point') {
          console.log('Could not find place label:', placeId);
          return;
        }
  
        // Get the current screen coordinates of the place label
        const labelCoords = placeFeature.geometry.coordinates as [number, number];
        const labelPoint = map.project(labelCoords);
        
        // Get the zoom-based scale
        const scale = getScaledSize(map);
        
        // Calculate the space needed for all POIs in this group
        const poiSpacing = scale.iconSize + 4;
        const poisPerRow = 5;
        const rowWidth = Math.min(groupMarkers.length, poisPerRow) * poiSpacing;
  
        // Calculate vertical spacing
        const labelHeight = Math.max(14, map.getZoom() * 1.2);
        const verticalSpacing = scale.iconSize + 4;
        const baseOffset = labelHeight + 8;
  
        // Update each POI position
        groupMarkers.forEach((item, index) => {
          const row = Math.floor(index / poisPerRow);
          const col = index % poisPerRow;
          
          // Calculate screen coordinates relative to label position
          const x = labelPoint.x - (rowWidth / 2) + (col * poiSpacing) + (scale.iconSize / 2);
          const y = labelPoint.y + baseOffset + (row * verticalSpacing);
          
          // Convert screen coordinates back to map coordinates
          const newPos = map.unproject([x, y]);
          
          // Update marker position smoothly
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
  
    // Debounce the update function to avoid too frequent updates
    const debouncedUpdate = () => {
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(updatePOIPositions);
      } else {
        updatePOIPositions();
      }
    };
  
    // Add listeners for all update events
    UPDATE_EVENTS.forEach(eventType => {
      map.on(eventType, debouncedUpdate);
    });
  
    // Initial update
    updatePOIPositions();
  
    // Cleanup
    return () => {
      UPDATE_EVENTS.forEach(eventType => {
        map.off(eventType, debouncedUpdate);
      });
    };
  }, [map]);

// ======================
// Rendering
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
