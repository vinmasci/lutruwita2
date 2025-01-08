// src/pages/create.tsx
import React, { forwardRef, useRef } from 'react';
import type { MapRef } from '../components/ui/map-container';
import MapContainer from '../components/ui/map-container';
import GpxUploader from '../components/ui/gpx-uploader';

const Create = forwardRef<MapRef, {}>((props, ref) => {
  const mapRef = useRef<MapRef>(null);
  
  return (
    <div className="w-full h-full relative">
      <MapContainer ref={mapRef} />
      <GpxUploader mapRef={mapRef} />
    </div>
  );
});

export default Create;