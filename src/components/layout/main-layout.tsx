import React from 'react';
import Sidebar from '../ui/sidebar';
import BottomTabs from '../ui/bottom-tabs';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="h-screen w-full flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          {children}
        </div>
        <BottomTabs />
      </main>
    </div>
  );
};

export default MainLayout;