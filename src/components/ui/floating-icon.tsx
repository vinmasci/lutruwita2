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
      <div style={{
        position: 'relative',
        backgroundColor: '#1f2937',
        padding: '8px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
        display: 'inline-block'
      }}>
        <span 
          className="material-icons"
          style={{
            fontSize: '24px',
            color: '#ffffff'
          }}
        >
          {iconName}
        </span>
        
        {/* Arrow pointer */}
        <div style={{
          position: 'absolute',
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid #1f2937'
        }} />
      </div>
    </div>
  );
}