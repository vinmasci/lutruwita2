import mapboxgl from 'mapbox-gl';
import { POI, POIType, POIIcons } from '@/types/note-types';
import { usePOI } from './poi-state';

export const createPOIMarker = (
  map: mapboxgl.Map,
  position: { lat: number; lon: number },
  poiType: POIType,
  isDraggable: boolean = false
): mapboxgl.Marker => {
  const el = document.createElement('div');
  el.className = isDraggable ? 'temp-poi-marker' : 'poi-marker';

  // Create marker container with styling
  const markerContainer = document.createElement('div');
  markerContainer.style.position = 'relative';
  markerContainer.style.backgroundColor = '#1f2937';
  markerContainer.style.padding = '4px 8px';
  markerContainer.style.borderRadius = '4px';
  markerContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
  markerContainer.style.display = 'flex';
  markerContainer.style.alignItems = 'center';
  markerContainer.style.gap = '4px';
  markerContainer.style.cursor = isDraggable ? 'move' : 'pointer';

  // Add icon
  const icon = document.createElement('span');
  icon.className = 'material-icons';
  icon.style.color = '#e17055';
  icon.style.fontSize = '20px';
  icon.textContent = POIIcons[poiType] || 'place';
  markerContainer.appendChild(icon);

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
    offset: [0, 8],
    clickTolerance: 3
  })
    .setLngLat([position.lon, position.lat])
    .addTo(map);

  return marker;
};

export const addPOIMarkerToMap = (
  map: mapboxgl.Map,
  poi: POI
): mapboxgl.Marker | null => {
  if (!map) return null;
  
  // Remove existing marker with same ID if it exists
  const existingMarker = document.querySelector(`[data-poi-id="${poi.id}"]`);
  if (existingMarker) {
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

  return marker;
};

export const removePOIMarker = (poiId: string): void => {
  const marker = document.querySelector(`[data-poi-id="${poiId}"]`);
  if (marker) {
    marker.remove();
  }
};

export const removeAllPOIMarkers = (): void => {
  document.querySelectorAll('.poi-marker-container').forEach(el => el.remove());
};