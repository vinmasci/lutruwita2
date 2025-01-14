import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  POICategory,
  InfrastructurePOIType,
  ServicesPOIType,
  AccommodationPOIType,
  NaturalFeaturesPOIType,
  InformationPOIType,
  POIIcons,
  POIType
} from '@/types/note-types';
import { usePOI } from '../../utils/poi/poi-state.tsx';

interface POIToolbarProps {
  map: mapboxgl.Map | null;
}

interface POICategoryConfig {
  types: { [key: string]: string };
  icon: string;
}

const POI_CATEGORIES: { [key in POICategory]: POICategoryConfig } = {
  [POICategory.Infrastructure]: {
    types: InfrastructurePOIType,
    icon: 'build'
  },
  [POICategory.Services]: {
    types: ServicesPOIType,
    icon: 'store'
  },
  [POICategory.Accommodation]: {
    types: AccommodationPOIType,
    icon: 'hotel'
  },
  [POICategory.NaturalFeatures]: {
    types: NaturalFeaturesPOIType,
    icon: 'landscape'
  },
  [POICategory.Information]: {
    types: InformationPOIType,
    icon: 'info'
  }
};

export const POIToolbar: React.FC<POIToolbarProps> = ({ map }) => {
  const { setIsPlacingPOI } = usePOI();

  const handlePOISelect = (type: POIType) => {
    if (!map) return;
    
    map.getCanvas().style.cursor = 'crosshair';
    setIsPlacingPOI({
      type: type,
      position: null,
      iconType: type
    });
  };

  return (
    <div className="w-full max-w-xs">
      <Accordion type="single" collapsible className="w-full">
        {Object.entries(POI_CATEGORIES).map(([category, config]) => (
          <AccordionItem key={category} value={category}>
            <AccordionTrigger className="flex items-center gap-2 px-4">
              <span className="material-icons text-orange-500">
                {config.icon}
              </span>
              {category}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2 p-2">
                {Object.entries(config.types).map(([type, label]) => (
                  <Button
                    key={type}
                    variant="ghost"
                    className="flex items-center justify-start gap-2 px-2 py-1 text-sm hover:bg-orange-100"
                    onClick={() => handlePOISelect(type as POIType)}
                  >
                    <span className="material-icons text-orange-500 text-base">
                      {POIIcons[type as POIType]}
                    </span>
                    <span className="truncate">{label}</span>
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default POIToolbar;