import React, { useRef, forwardRef } from 'react';
import type { MapRef } from '../ui/map-container';
import Sidebar from '../ui/sidebar';
import BottomTabs from '../ui/bottom-tabs';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = forwardRef<MapRef, MainLayoutProps>(({ children }, ref) => {
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
});

MainLayout.displayName = 'MainLayout';

export default MainLayout;
