import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { PlaceManager } from './PlaceManager';
import { POICategory } from '@/types/note-types';

interface PlacePOIControlProps {
  isActive: boolean;
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

  return null; // This is a control component that doesn't render anything
};

export default PlacePOIControl;
