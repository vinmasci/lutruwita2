import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Route, 
  Mountain, 
  Layers, 
  Trash2, 
  Plus, 
  Minus,
  Maximize,
  Navigation,
  FileUp,
  MapPin,
  Target
} from 'lucide-react';

interface MapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLocate?: () => void;
  onLayerToggle?: () => void;
  onFullscreen?: () => void;
  onRouteToggle?: () => void;
  onGradientToggle?: () => void;
  onUploadGPX?: () => void;
  onClearRoute?: () => void;
  onRecenterMap?: () => void;
}

const MapControls = ({ 
  onZoomIn, 
  onZoomOut, 
  onLocate,
  onLayerToggle,
  onFullscreen,
  onRouteToggle,
  onGradientToggle,
  onUploadGPX,
  onClearRoute,
  onRecenterMap
}: MapControlsProps) => {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
      {/* Map Controls Box */}
      <div className="bg-white rounded-lg shadow-lg flex flex-col divide-y divide-gray-200">
        {/* Route/Surface Controls */}
        <Button 
          size="icon" 
          variant="ghost"
          onClick={onRouteToggle}
          className="p-2"
        >
          <Route className="h-5 w-5" />
        </Button>

        <Button 
          size="icon" 
          variant="ghost"
          onClick={onClearRoute}
          className="p-2"
        >
          <Trash2 className="h-5 w-5" />
        </Button>

        <Button 
          size="icon" 
          variant="ghost"
          onClick={onUploadGPX}
          className="p-2"
        >
          <FileUp className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation Controls Box */}
      <div className="bg-white rounded-lg shadow-lg flex flex-col divide-y divide-gray-200">
        <Button 
          size="icon" 
          variant="ghost"
          onClick={onZoomIn}
          className="p-2"
        >
          <Plus className="h-5 w-5" />
        </Button>

        <Button 
          size="icon" 
          variant="ghost"
          onClick={onZoomOut}
          className="p-2"
        >
          <Minus className="h-5 w-5" />
        </Button>

        <Button 
          size="icon" 
          variant="ghost"
          onClick={onLocate}
          className="p-2"
        >
          <MapPin className="h-5 w-5" />
        </Button>

        <Button 
          size="icon" 
          variant="ghost"
          onClick={onRecenterMap}
          className="p-2"
        >
          <Target className="h-5 w-5" />
        </Button>

        <Button 
          size="icon" 
          variant="ghost"
          onClick={onFullscreen}
          className="p-2"
        >
          <Maximize className="h-5 w-5" />
        </Button>
      </div>

      {/* View Controls Box */}
      <div className="bg-white rounded-lg shadow-lg flex flex-col divide-y divide-gray-200">
        <Button 
          size="icon" 
          variant="ghost"
          onClick={onLayerToggle}
          className="p-2"
        >
          <Layers className="h-5 w-5" />
        </Button>

        <Button 
          size="icon" 
          variant="ghost"
          onClick={onGradientToggle}
          className="p-2"
        >
          <Mountain className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default MapControls;