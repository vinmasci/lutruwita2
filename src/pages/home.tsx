import React, { useState } from 'react';
import MapContainer from '../components/ui/map-container';
import type { PlacingPOIState } from '../types/map-types';

const Home = () => {
  const [isPlacingPOI, setIsPlacingPOI] = useState<PlacingPOIState | null>(null);

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        isPlacingPOI={isPlacingPOI}
        setIsPlacingPOI={setIsPlacingPOI}
      />
    </div>
  );
};

export default Home;
