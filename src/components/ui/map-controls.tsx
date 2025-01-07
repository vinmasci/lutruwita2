import React from 'react';
import { Button } from "@/components/ui/button";
import { Search, MapPin, ZoomIn, ZoomOut, Layers, Move, Compass } from 'lucide-react';

interface MapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onSearch?: () => void;
  onLocate?: () => void;
  onLayerToggle?: () => void;
}

const MapControls = ({ 
  onZoomIn, 
  onZoomOut, 
  onSearch, 
  onLocate, 
  onLayerToggle 
}: MapControlsProps) => {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 bg-white p-2 rounded-lg shadow-lg">
      <Button 
        size="icon" 
        variant="outline" 
        onClick={onSearch}
        className="h-8 w-8"
      >
        <Search className="h-4 w-4" />
      </Button>
      
      <Button 
        size="icon" 
        variant="outline" 
        onClick={onLocate}
        className="h-8 w-8"
      >
        <MapPin className="h-4 w-4" />
      </Button>
      
      <div className="w-full h-px bg-gray-200 my-1" />
      
      <Button 
        size="icon" 
        variant="outline" 
        onClick={onZoomIn}
        className="h-8 w-8"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button 
        size="icon" 
        variant="outline" 
        onClick={onZoomOut}
        className="h-8 w-8"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <div className="w-full h-px bg-gray-200 my-1" />
      
      <Button 
        size="icon" 
        variant="outline" 
        onClick={onLayerToggle}
        className="h-8 w-8"
      >
        <Layers className="h-4 w-4" />
      </Button>
      
      <Button 
        size="icon" 
        variant="outline" 
        className="h-8 w-8"
      >
        <Compass className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MapControls;