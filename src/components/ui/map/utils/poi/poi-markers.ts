import mapboxgl from 'mapbox-gl';
import { POI, POIType, POIIcons } from '@/types/note-types';

export const createPOIMarker = (
  map: mapboxgl.Map,
  position: { lat: number; lon: number },
  poiType: POIType,
  isDraggable: boolean = false
): mapboxgl.Marker => {
  // Create main container
  const el = document.createElement('div');
  el.className = 'poi-marker';
  el.style.position = 'relative';
  el.style.width = '32px';
  el.style.height = '32px';

  // Create marker circle
  const circle = document.createElement('div');
  circle.style.width = '100%';
  circle.style.height = '100%';
  circle.style.backgroundColor = '#e17055';
  circle.style.borderRadius = '50%';
  circle.style.border = '2px solid white';
  circle.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
  circle.style.position = 'relative';
  circle.style.display = 'flex';
  circle.style.alignItems = 'center';
  circle.style.justifyContent = 'center';

  // Create icon
  const icon = document.createElement('span');
  icon.className = 'material-icons';
  icon.textContent = POIIcons[poiType];
  icon.style.color = 'white';
  icon.style.fontSize = '16px';
  icon.style.userSelect = 'none';
  circle.appendChild(icon);

  el.appendChild(circle);

  // Create and return the marker
  const marker = new mapboxgl.Marker({
    element: el,
    draggable: isDraggable,
    anchor: 'center'
  })
    .setLngLat([position.lon, position.lat])
    .addTo(map);

  console.log('Created marker:', {
    type: poiType,
    position,
    icon: POIIcons[poiType]
  });

  return marker;
};

export const removeAllPOIMarkers = (): void => {
  const markers = document.querySelectorAll('.poi-marker');
  console.log(`Removing ${markers.length} POI markers`);
  markers.forEach(el => el.remove());
};