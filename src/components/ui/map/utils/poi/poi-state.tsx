import React, { createContext, useContext, useState, useCallback } from 'react';
import { POI, POICategory, InfrastructurePOIType } from '@/types/note-types';
import type { Marker } from 'mapbox-gl';

// Types and Interfaces
export interface PlacingPOIState {
  type: InfrastructurePOIType;
  position: { lat: number; lon: number } | null;
  iconType?: InfrastructurePOIType;
}

interface POIContextState {
  currentPOIs: POI[];
  isPlacingPOI: PlacingPOIState | null;
  poiModalOpen: boolean;
  tempMarker: Marker | null;
  setCurrentPOIs: (pois: POI[]) => void;
  addPOI: (poi: POI) => void;
  removePOI: (id: string) => void;
  setIsPlacingPOI: (state: PlacingPOIState | null) => void;
  setPoiModalOpen: (open: boolean) => void;
  setTempMarker: (marker: Marker | null) => void;
  clearPOIs: () => void;
}

// Create context
const POIContext = createContext<POIContextState | null>(null);

// Provider component
export const POIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPOIs, setCurrentPOIs] = useState<POI[]>([]);
  const [isPlacingPOI, setIsPlacingPOI] = useState<PlacingPOIState | null>(null);
  const [poiModalOpen, setPoiModalOpen] = useState(false);
  const [tempMarker, setTempMarker] = useState<Marker | null>(null);

  const addPOI = useCallback((poi: POI) => {
    setCurrentPOIs(prev => [...prev, poi]);
  }, []);

  const removePOI = useCallback((id: string) => {
    setCurrentPOIs(prev => prev.filter(poi => poi.id !== id));
  }, []);

  const clearPOIs = useCallback(() => {
    setCurrentPOIs([]);
    setIsPlacingPOI(null);
    setPoiModalOpen(false);
    if (tempMarker) {
      tempMarker.remove();
      setTempMarker(null);
    }
  }, [tempMarker]);

  const value = {
    currentPOIs,
    isPlacingPOI,
    poiModalOpen,
    tempMarker,
    setCurrentPOIs,
    addPOI,
    removePOI,
    setIsPlacingPOI,
    setPoiModalOpen,
    setTempMarker,
    clearPOIs
  };

  return <POIContext.Provider value={value}>{children}</POIContext.Provider>;
};

// Custom hook to use POI context
export const usePOI = () => {
  const context = useContext(POIContext);
  if (!context) {
    throw new Error('usePOI must be used within a POIProvider');
  }
  return context;
};