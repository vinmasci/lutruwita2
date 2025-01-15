import mapboxgl from 'mapbox-gl';
import { 
  POI, 
  POIType, 
  POIIcons,
  InfrastructurePOIType,
  ServicesPOIType,
  AccommodationPOIType,
  NaturalFeaturesPOIType,
  InformationPOIType
} from '@/types/note-types';
import { usePOI } from './poi-state';

const getCategoryColor = (poiType: POIType): string => {
  // Check if type exists in each category enum
  if (Object.values(InfrastructurePOIType).includes(poiType)) {
    return '#00a8ff';  // Infrastructure - Blue
  }
  if (Object.values(ServicesPOIType).includes(poiType)) {
    return '#fd9644';  // Services - Orange
  }
  if (Object.values(AccommodationPOIType).includes(poiType)) {
    return '#e056fd';  // Accommodation - Purple
  }
  if (Object.values(NaturalFeaturesPOIType).includes(poiType)) {
    return '#20bf6b';  // Natural Features - Green
  }
  if (Object.values(InformationPOIType).includes(poiType)) {
    return '#eb4d4b';  // Information - Red
  }
  return '#1f2937';  // Default dark gray
};

export const createPOIMarker = (
  map: mapboxgl.Map,
  position: { lat: number; lon: number },
  poiType: POIType,
  isDraggable: boolean = false
): mapboxgl.Marker => {
  // Create main container
  const el = document.createElement('div');
  el.className = 'poi-marker mapboxgl-marker';
  el.style.zIndex = '2';

  const backgroundColor = getCategoryColor(poiType);

  // Create marker container
  const markerContainer = document.createElement('div');
  markerContainer.style.backgroundColor = backgroundColor;
  markerContainer.style.padding = '4px';
  markerContainer.style.borderRadius = '3px';
  markerContainer.style.boxShadow = '0 1px 2px rgba(0,0,0,0.5)';
  markerContainer.style.position = 'relative';
  markerContainer.style.zIndex = '2';
  markerContainer.style.display = 'flex';
  markerContainer.style.alignItems = 'center';
  markerContainer.style.cursor = isDraggable ? 'move' : 'pointer';
  markerContainer.style.minWidth = '16px';
  markerContainer.style.minHeight = '16px';
  markerContainer.style.justifyContent = 'center';

  // Add icon
  const icon = document.createElement('span');
  icon.className = 'material-icons';
  icon.textContent = POIIcons[poiType];
  icon.style.color = '#ffffff';  // White icons
  icon.style.fontSize = '12px';
  markerContainer.appendChild(icon);

  // Add arrow
  const arrow = document.createElement('div');
  arrow.style.position = 'absolute';
  arrow.style.bottom = '-4px';
  arrow.style.left = '50%';
  arrow.style.transform = 'translateX(-50%)';
  arrow.style.width = '0';
  arrow.style.height = '0';
  arrow.style.borderLeft = '4px solid transparent';
  arrow.style.borderRight = '4px solid transparent';
  arrow.style.borderTop = `4px solid ${backgroundColor}`;  // Arrow color matches background
  markerContainer.appendChild(arrow);

  el.appendChild(markerContainer);

  const marker = new mapboxgl.Marker({
    element: el,
    draggable: isDraggable,
    anchor: 'bottom',
    offset: [0, 0]
  })
    .setLngLat([position.lon, position.lat])
    .addTo(map);

  console.log('Created marker:', {
    position,
    poiType,
    backgroundColor,  // Added this log to debug color
    element: el.outerHTML
  });

  return marker;
};

export const addPOIMarkerToMap = (
  map: mapboxgl.Map,
  poi: POI
): mapboxgl.Marker | null => {
  if (!map) return null;
  
  console.log('Adding POI marker:', poi);

  // Remove existing marker with same ID if it exists
  const existingMarker = document.querySelector(`[data-poi-id="${poi.id}"]`);
  if (existingMarker) {
    console.log('Removing existing marker:', poi.id);
    existingMarker.remove();
  }

  // Create and add the marker
  const marker = createPOIMarker(
    map,
    poi.location,
    poi.type,
    false // not draggable for existing POIs
  );

  // Add POI identifier
  const el = marker.getElement();
  el.setAttribute('data-poi-id', poi.id);

  console.log('Added marker to map:', {
    id: poi.id,
    element: el.outerHTML
  });

  return marker;
};

export const removePOIMarker = (poiId: string): void => {
  const marker = document.querySelector(`[data-poi-id="${poiId}"]`);
  if (marker) {
    marker.remove();
  }
};

export const removeAllPOIMarkers = (): void => {
  document.querySelectorAll('.poi-marker').forEach(el => el.remove());
};