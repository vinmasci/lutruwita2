import React, { useRef } from 'react';
import type { MapRef } from '../ui/map-container';
import Sidebar from '../ui/sidebar';
import BottomTabs from '../ui/bottom-tabs';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const mapRef = useRef<MapRef>(null);
  return (
    <div className="h-screen w-full flex overflow-hidden">
      <Sidebar mapRef={mapRef} />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          {React.cloneElement(children as React.ReactElement, { ref: mapRef })}
        </div>
        <BottomTabs />
      </main>
    </div>
  );
};

export default MainLayout;
