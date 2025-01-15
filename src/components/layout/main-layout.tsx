// src/components/layout/main-layout.tsx
import React, { useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import type { MapRef } from '../ui/map-container';
import MapContainer from '../ui/map-container';
import Sidebar from '../ui/sidebar';
import BottomTabs from '../ui/bottom-tabs';
import { FloatingIconProvider } from '../../contexts/floating-icon-context';
import { InfrastructurePOIType } from '@/types/note-types';
import { POIProvider } from '../ui/map/utils/poi/poi-state';
import { usePOI } from '../ui/map/utils/poi/poi-state';

const MainLayout = () => {
  const mapRef = useRef<MapRef>(null);

  return (
    <FloatingIconProvider>
      <POIProvider>
        <MainLayoutContent mapRef={mapRef} />
      </POIProvider>
    </FloatingIconProvider>
  );
};

const MainLayoutContent = ({ mapRef }: { mapRef: React.RefObject<MapRef> }) => {
  const { setIsPlacingPOI } = usePOI();
  const [placePOIMode, setPlacePOIMode] = useState(false)

  const handleStartPOIPlacement = (type: InfrastructurePOIType) => {
    console.log("Starting POI placement for type:", type);
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (map) {
        map.getCanvas().style.cursor = 'crosshair';
        setIsPlacingPOI({
          type,
          position: null,
          iconType: type
        });
        console.log("Entered POI placement mode");
      }
    }
  };
  
  return (
    <div className="h-screen w-full flex overflow-hidden">
<Sidebar 
  mapRef={mapRef} 
  onStartPOIPlacement={handleStartPOIPlacement}
  placePOIMode={placePOIMode}
  setPlacePOIMode={setPlacePOIMode}
/>
      <main className="flex-1 flex flex-col">
        <div className="flex-1 relative h-[calc(100vh-48px)]">
        <MapContainer 
  ref={mapRef}
  placePOIMode={placePOIMode}
  setPlacePOIMode={setPlacePOIMode}
/>
          <Outlet />
        </div>
        <BottomTabs />
      </main>
    </div>
  );
};

export default MainLayout;