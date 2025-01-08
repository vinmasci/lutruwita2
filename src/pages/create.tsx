// src/pages/create.tsx
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import type { MapRef } from '../components/ui/map-container';
import MapContainer from '../components/ui/map-container';
import type { MapContext } from '../components/layout/main-layout';

const Create = () => {
  const { mapRef } = useOutletContext<MapContext>();

  return (
    <div className="w-full h-full relative">
      <MapContainer ref={mapRef} />
    </div>
  );
};

export default Create;