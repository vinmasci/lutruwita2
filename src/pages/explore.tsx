import React from 'react';
import MapContainer from '../components/ui/map-container';

const Explore = () => {
  return (
    <div className="w-full h-full relative">
      <MapContainer />
      {/* Add explore-specific controls here */}
    </div>
  );
};

export default Explore;