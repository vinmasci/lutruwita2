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
  el.className = 'poi-marker mapboxgl-marker';
  el.style.zIndex = '2';

  // Create marker container
  const markerContainer = document.createElement('div');
  markerContainer.style.backgroundColor = '#1f2937';
  markerContainer.style.padding = '8px';
  markerContainer.style.borderRadius = '4px';
  markerContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
  markerContainer.style.position = 'relative';
  markerContainer.style.zIndex = '2';
  markerContainer.style.display = 'flex';
  markerContainer.style.alignItems = 'center';
  markerContainer.style.cursor = isDraggable ? 'move' : 'pointer';
  markerContainer.style.minWidth = '32px';
  markerContainer.style.minHeight = '32px';
  markerContainer.style.justifyContent = 'center';

  // Add icon
  const icon = document.createElement('span');
  icon.className = 'material-icons';
  icon.textContent = POIIcons[poiType];
  icon.style.color = '#e17055';
  icon.style.fontSize = '20px';
  markerContainer.appendChild(icon);

  // Add arrow
  const arrow = document.createElement('div');
  arrow.style.position = 'absolute';
  arrow.style.bottom = '-8px';
  arrow.style.left = '50%';
  arrow.style.transform = 'translateX(-50%)';
  arrow.style.width = '0';
  arrow.style.height = '0';
  arrow.style.borderLeft = '8px solid transparent';
  arrow.style.borderRight = '8px solid transparent';
  arrow.style.borderTop = '8px solid #1f2937';
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