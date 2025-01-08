// src/pages/create.tsx
import React from 'react';
import type { MapRef } from '../components/ui/map-container';
import MapContainer from '../components/ui/map-container';

interface CreateProps {
  mapRef?: React.RefObject<MapRef>;
}

const Create: React.FC<CreateProps> = ({ mapRef }) => {
  return (
    <div className="w-full h-full relative">
      <MapContainer ref={mapRef} />
    </div>
  );
};

export default Create;