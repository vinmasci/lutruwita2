import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { PlaceManager } from './PlaceManager';
import { POICategory } from '@/types/note-types';

interface PlacePOIControlProps {
  isActive: boolean;
  onToggle?: (active: boolean) => void;
  onClick?: () => void;
  className?: string;
}

const PlacePOIControl: React.FC<PlacePOIControlProps> = ({ isActive, onToggle }) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const placeManagerRef = useRef<ReturnType<typeof PlaceManager> | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      console.error('Map instance not available');
      return;
    }

    if (isActive) {
      console.log('Activating Places POI mode');
      placeManagerRef.current = PlaceManager({
        map: mapRef.current,
        onPlaceDetected: (place) => {
          console.log('Place detected:', place);
          if (place) {
            // Handle place selection
          }
        }
      });

      return () => {
        console.log('Deactivating Places POI mode');
        if (placeManagerRef.current) {
          placeManagerRef.current = null;
        }
      };
    }
  }, [mapRef.current, isActive]);

  const handleAddPOIs = (placeId: string, pois: Array<{
    category: POICategory;
    type: POIType;
  }>) => {
    if (!selectedPlace || !map) {
      console.log('No selected place or map available');
      return;
    }
    
    console.log('Starting to add POIs:', {
      placeId,
      pois,
      selectedPlace
    });

    // Calculate vertical offset based on place name text size
    const verticalBaseOffset = 0.0015; // Adjust this value based on testing

    pois.forEach((poi, index) => {
      // Create a horizontal line of POIs below the place name
      const totalWidth = pois.length * 0.001; // total width of all POIs
      const startX = selectedPlace.coordinates[0] - (totalWidth / 2);
      const spacing = 0.001; // space between POIs
      
      const poiCoordinates = {
        lat: selectedPlace.coordinates[1] - verticalBaseOffset,
        lon: startX + (spacing * (index + 0.5)) // Center the POIs
      };

      // Create main container
      const el = document.createElement('div');
      el.className = 'place-poi-marker mapboxgl-marker';
      el.style.zIndex = '1'; // Below place name

      // Create marker container
      const markerContainer = document.createElement('div');
      markerContainer.style.backgroundColor = '#FFFFFF'; // White background
      markerContainer.style.padding = '6px';
      markerContainer.style.borderRadius = '4px';
      markerContainer.style.border = '2px solid #000000'; // Black border
      markerContainer.style.position = 'relative';
      markerContainer.style.display = 'flex';
      markerContainer.style.alignItems = 'center';
      markerContainer.style.cursor = 'pointer';
      markerContainer.style.minWidth = '24px';
      markerContainer.style.minHeight = '24px';
      markerContainer.style.justifyContent = 'center';
      markerContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

      // Add icon
      const icon = document.createElement('span');
      icon.className = 'material-icons';
      icon.textContent = POIIcons[poi.type];
      icon.style.color = '#000000'; // Black icon
      icon.style.fontSize = '16px';
      markerContainer.appendChild(icon);

      // Add arrow
      const arrow = document.createElement('div');
      arrow.style.position = 'absolute';
      arrow.style.bottom = '-6px';
      arrow.style.left = '50%';
      arrow.style.transform = 'translateX(-50%)';
      arrow.style.width = '0';
      arrow.style.height = '0';
      arrow.style.borderLeft = '6px solid transparent';
      arrow.style.borderRight = '6px solid transparent';
      arrow.style.borderTop = '6px solid #000000'; // Black arrow

      markerContainer.appendChild(arrow);
      el.appendChild(markerContainer);

      // Create and add the marker
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom',
        offset: [0, 0]
      })
      .setLngLat([poiCoordinates.lon, poiCoordinates.lat])
      .addTo(map);

      // Add data attributes
      el.setAttribute('data-poi-id', `place-${placeId}-poi-${Date.now()}-${index}`);
      el.setAttribute('data-place-id', placeId);
      
      console.log('Added place POI marker:', {
        type: poi.type,
        coordinates: poiCoordinates
      });
    });
    
    setModalOpen(false);
    setSelectedPlace(null);
  };

  return null; // This is a control component that doesn't render anything
};

export default PlacePOIControl;
