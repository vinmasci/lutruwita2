import mapboxgl from 'mapbox-gl';
import { POI, POIType, POIIcons } from '@/types/note-types';
import { usePOI } from './poi-state';

export const createPOIMarker = (
  map: mapboxgl.Map,
  position: { lat: number; lon: number },
  poiType: POIType,
  isDraggable: boolean = false
): mapboxgl.Marker => {
  // Create main container
  const el = document.createElement('div');
  el.className = isDraggable ? 'temp-poi-marker' : 'poi-marker mapboxgl-marker';

  // Create marker container with styling
  const markerContainer = document.createElement('div');
  markerContainer.className = 'poi-marker-container';
  markerContainer.style.position = 'relative';
  markerContainer.style.backgroundColor = '#1f2937';
  markerContainer.style.padding = '4px 8px';
  markerContainer.style.borderRadius = '4px';
  markerContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
  markerContainer.style.display = 'flex';
  markerContainer.style.alignItems = 'center';
  markerContainer.style.gap = '4px';
  markerContainer.style.cursor = isDraggable ? 'move' : 'pointer';
  markerContainer.style.zIndex = '1';

  // Add icon and text container
  const contentContainer = document.createElement('div');
  contentContainer.style.display = 'flex';
  contentContainer.style.alignItems = 'center';
  contentContainer.style.gap = '4px';

  // Add icon with material icons class
  const icon = document.createElement('span');
  icon.className = 'material-icons';
  icon.style.color = '#e17055';
  icon.style.fontSize = '20px';
  icon.style.lineHeight = '1';
  icon.style.display = 'block';
  icon.innerHTML = POIIcons[poiType] || '&#xe55f;'; // Default to 'place' icon
  contentContainer.appendChild(icon);

  markerContainer.appendChild(contentContainer);

  // Add arrow pointer
  const arrow = document.createElement('div');
  arrow.style.position = 'absolute';
  arrow.style.bottom = '-6px';
  arrow.style.left = '50%';
  arrow.style.transform = 'translateX(-50%)';
  arrow.style.width = '0';
  arrow.style.height = '0';
  arrow.style.borderLeft = '6px solid transparent';
  arrow.style.borderRight = '6px solid transparent';
  arrow.style.borderTop = '6px solid #1f2937';
  markerContainer.appendChild(arrow);

  el.appendChild(markerContainer);

  // Create and return the marker
  const marker = new mapboxgl.Marker({
    element: el,
    draggable: isDraggable,
    anchor: 'bottom',
    offset: [0, 8]
  })
    .setLngLat([position.lon, position.lat])
    .addTo(map);

  console.log('Created marker:', {
    position,
    poiType,
    isDraggable,
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

  // Add POI identifier and classes
  const el = marker.getElement();
  el.setAttribute('data-poi-id', poi.id);
  el.classList.add('mapboxgl-marker');
  el.classList.add('mapboxgl-marker-anchor-bottom');

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