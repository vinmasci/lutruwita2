// src/components/layout/main-layout.tsx
import React, { useRef } from 'react';
import { useOutlet, useOutletContext } from 'react-router-dom';
import type { MapRef } from '../ui/map-container';
import Sidebar from '../ui/sidebar';
import BottomTabs from '../ui/bottom-tabs';

type ContextType = { mapRef: React.RefObject<MapRef> };

export function useMap() {
  return useOutletContext<ContextType>();
}

const MainLayout = () => {
  const mapRef = useRef<MapRef>(null);
  const outlet = useOutlet();

  return (
    <div className="h-screen w-full flex overflow-hidden">
      <Sidebar mapRef={mapRef} />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          {outlet ? React.cloneElement(outlet as React.ReactElement, { mapRef }) : null}
        </div>
        <BottomTabs />
      </main>
    </div>
  );
};

export default MainLayout;