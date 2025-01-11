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
          <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="px-1.5 py-0.5 bg-gray-900/75 backdrop-blur-sm rounded text-[10px] font-medium text-white shadow-sm">
              {distance}
            </div>
            {/* Arrow pointing to line */}
            <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-900/75 -mb-1">
            </div>
          </div>
        </div>
      );
};

export default DistanceMarker;