import React from 'react';
import { POIType, POIIcons } from '@/types/note-types';

interface POIMarkerProps {
  type: POIType;
  name?: string;
  isDraggable?: boolean;
  onClick?: () => void;
}

export const POIMarker: React.FC<POIMarkerProps> = ({
  type,
  name,
  isDraggable = false,
  onClick
}) => {
  return (
    <div 
      className={`poi-marker-container ${isDraggable ? 'cursor-move' : 'cursor-pointer'}`}
      onClick={onClick}
    >
      <div className="relative bg-gray-800 px-2 py-1 rounded flex items-center gap-1 shadow-md">
        <span className="material-icons text-orange-500 text-xl">
          {POIIcons[type]}
        </span>
        {name && (
          <span className="text-white text-sm truncate max-w-[150px]">
            {name}
          </span>
        )}
        {/* Arrow pointer */}
        <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-0 h-0
                      border-l-[6px] border-l-transparent
                      border-r-[6px] border-r-transparent
                      border-t-[6px] border-t-gray-800" />
      </div>
    </div>
  );
};

export default POIMarker;