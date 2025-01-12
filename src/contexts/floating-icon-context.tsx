import React, { createContext, useContext, useState } from 'react';
import { FloatingIcon } from '../components/ui/floating-icon';

interface FloatingIconContextType {
  showFloatingIcon: (iconName: string) => void;
  hideFloatingIcon: () => void;
}

const FloatingIconContext = createContext<FloatingIconContextType | undefined>(undefined);

export function FloatingIconProvider({ children }: { children: React.ReactNode }) {
  const [iconName, setIconName] = useState<string | null>(null);

  const showFloatingIcon = (name: string) => {
    setIconName(name);
    document.body.style.cursor = 'crosshair';
  };

  const hideFloatingIcon = () => {
    setIconName(null);
    document.body.style.cursor = 'default';
  };

  return (
    <FloatingIconContext.Provider value={{ showFloatingIcon, hideFloatingIcon }}>
      {children}
      {iconName && <FloatingIcon iconName={iconName} isActive={true} />}
    </FloatingIconContext.Provider>
  );
}

export function useFloatingIcon() {
  const context = useContext(FloatingIconContext);
  if (context === undefined) {
    throw new Error('useFloatingIcon must be used within a FloatingIconProvider');
  }
  return context;
}