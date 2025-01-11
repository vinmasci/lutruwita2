import React from 'react';

interface DistanceMarkerProps {
  distance: number;  // Distance in kilometers
  className?: string;
}

const DistanceMarker: React.FC<DistanceMarkerProps> = ({ distance, className = '' }) => {
  // Format distance: if < 1km show in meters, otherwise in km
  const formattedDistance = distance < 1 
    ? `${Math.round(distance * 1000)}m` 
    : `${Math.round(distance)}km`;

  return (
    <div className={`relative ${className}`}>
      {/* Main tooltip body */}
      <div className="absolute -translate-x-1/2 -translate-y-full mb-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded shadow-lg">
  <span className="text-xs font-medium text-gray-900">
    {formattedDistance}
  </span>
</div>
{/* Smaller arrow */}
<div className="absolute -translate-x-1/2 -mt-1 border-[4px] border-transparent border-t-white/90">
      </div>
    </div>
  );
};

export default DistanceMarker;