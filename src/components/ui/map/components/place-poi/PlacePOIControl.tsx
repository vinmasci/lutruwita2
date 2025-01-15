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
    type: any;
  }>) => {
    if (!selectedPlace || !map) {
      console.log('No selected place or map available');
      return;
    }
    
    console.log('Selected place coordinates:', selectedPlace.coordinates);
    console.log('Adding POIs to place:', placeId, pois);
    
    const existingMarkers = document.querySelectorAll(`.poi-marker-${placeId}`);
    existingMarkers.forEach(marker => marker.remove());
    
    console.log('Selected place coordinates:', selectedPlace.coordinates);
    
    pois.forEach((poi, index) => {
      // Increased offset and adjusted calculations
      const baseOffset = 0.003; // Significantly increased for visibility
      const angle = (Math.PI * (index + 1)) / (pois.length + 1);
      const xOffset = Math.cos(angle) * baseOffset * 2; // Double horizontal spread
      const yOffset = Math.sin(angle) * baseOffset;
      
      const poiCoordinates: [number, number] = [
        selectedPlace.coordinates[0] + xOffset,
        selectedPlace.coordinates[1] - Math.abs(yOffset) * 2 // Increased vertical drop
      ];
      
      console.log(`Creating POI ${index + 1}/${pois.length}:`, {
        type: poi.type,
        coordinates: poiCoordinates
      });
      
      console.log(`Creating POI ${index + 1}/${pois.length}:`, {
        type: poi.type,
        baseOffset,
        angle: angle * (180 / Math.PI),
        coordinates: poiCoordinates,
        offset: { x: xOffset, y: yOffset }
      });

      const el = document.createElement('div');
      el.className = `poi-marker-container poi-marker-${placeId}`;
      el.style.position = 'relative';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.backgroundColor = '#1f2937';
      el.style.borderRadius = '50%';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      el.style.border = '2px solid white';
      el.style.zIndex = '999';

      let iconContent = '📍';
      switch(poi.type) {
        case 'Water Point':
          iconContent = '💧';
          break;
        case 'Cafe':
          iconContent = '☕';
          break;
        case 'General Store':
          iconContent = '🏪';
          break;
        case 'Parking':
          iconContent = '🅿️';
          break;
      }

      const icon = document.createElement('span');
      icon.textContent = iconContent;
      icon.style.fontSize = '16px';
      el.appendChild(icon);

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
        offset: [0, 0]
      })
        .setLngLat(poiCoordinates)
        .addTo(map);

      console.log(`Marker ${index + 1} added at:`, poiCoordinates);
      const markersOnMap = document.querySelectorAll('.poi-marker-container').length;
      console.log(`Total markers on map: ${markersOnMap}`);
    });
    
    setModalOpen(false);
    setSelectedPlace(null);
  };

  return null; // This is a control component that doesn't render anything
};

export default PlacePOIControl;
