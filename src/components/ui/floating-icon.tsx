import React, { useEffect, useState } from 'react';

interface FloatingIconProps {
  iconName: string;
  isActive: boolean;
}

export function FloatingIcon({ iconName, isActive }: FloatingIconProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'translate(10px, 10px)'
      }}
    >
      <span 
        className="material-icons"
        style={{
          fontSize: '32px',
          color: '#e17055',
          filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.5))'
        }}
      >
        {iconName}
      </span>
    </div>
  );
}