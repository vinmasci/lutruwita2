// src/components/layout/main-layout.tsx
import React, { useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import type { MapRef } from '../ui/map-container';
import MapContainer from '../ui/map-container';
import Sidebar from '../ui/sidebar';
import BottomTabs from '../ui/bottom-tabs';
import { FloatingIconProvider } from '../../contexts/floating-icon-context';
import { POIType, InfrastructurePOIType } from '@/types/note-types';

interface PlacingPOIState {
  type: POIType;
  position?: { lat: number; lon: number; };
}

const MainLayout = () => {
  const mapRef = useRef<MapRef>(null);
  const [isPlacingPOI, setIsPlacingPOI] = useState<PlacingPOIState | null>(null);

  const handleStartPOIPlacement = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (map) {
        map.getCanvas().style.cursor = 'crosshair';
        setIsPlacingPOI({ 
          type: InfrastructurePOIType.WaterPoint 
        });
      }
    }
  };

  return (
    <FloatingIconProvider>
      <div className="h-screen w-full flex overflow-hidden">
        <Sidebar 
          mapRef={mapRef} 
          onStartPOIPlacement={handleStartPOIPlacement}
        />
        <main className="flex-1 flex flex-col">
          <div className="flex-1 relative h-[calc(100vh-48px)]">
            <MapContainer 
              ref={mapRef}
              isPlacingPOI={isPlacingPOI}
              setIsPlacingPOI={setIsPlacingPOI}
            />
            <Outlet />
          </div>
          <BottomTabs />
        </main>
      </div>
    </FloatingIconProvider>
  );
};

export default MainLayout;