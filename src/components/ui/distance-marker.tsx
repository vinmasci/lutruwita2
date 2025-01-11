import React from 'react';
import { Play, Flag } from 'lucide-react';

interface DistanceMarkerProps {
  distance: number;  // Distance in kilometers
  totalDistance?: number; // Total distance of route
  className?: string;
}

const DistanceMarker: React.FC<DistanceMarkerProps> = ({ distance, totalDistance, className = '' }) => {
  const isStart = distance === 0;
  const isEnd = totalDistance && Math.round(distance) === Math.round(totalDistance);
  
  return (
    <div className={`relative ${className}`}>
      {/* Main tooltip body */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="px-1.5 py-[1px] bg-gray-900/75 backdrop-blur-sm rounded text-[10px] font-medium text-white shadow-sm flex items-center gap-1">
        {isStart ? "▶" : `${Math.round(distance)}km`}
        </div>
        {/* Arrow pointing to line */}
        <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-900/75 -mb-1">
        </div>
      </div>
    </div>
  );
};

export default DistanceMarker;