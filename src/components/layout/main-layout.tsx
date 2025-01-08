// src/components/layout/main-layout.tsx
import React, { useRef } from 'react';
import { useOutlet, Outlet } from 'react-router-dom';
import type { MapRef } from '../ui/map-container';
import Sidebar from '../ui/sidebar';
import BottomTabs from '../ui/bottom-tabs';

export type MapContext = {
  mapRef: React.RefObject<MapRef>;
};

const MainLayout = () => {
  const mapRef = useRef<MapRef>(null);

  return (
    <div className="h-screen w-full flex overflow-hidden">
      <Sidebar mapRef={mapRef} />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          <Outlet context={{ mapRef }} />
        </div>
        <BottomTabs />
      </main>
    </div>
  );
};

export default MainLayout;