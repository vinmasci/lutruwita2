import React, { forwardRef } from 'react';
import type { MapRef } from '../components/ui/map-container';
import MapContainer from '../components/ui/map-container';

const Create = forwardRef<MapRef, {}>((props, ref) => {
  return (
    <div className="w-full h-full relative">
      <MapContainer ref={ref} />
      {/* Add create-specific controls here */}
    </div>
  );
});

export default Create;
