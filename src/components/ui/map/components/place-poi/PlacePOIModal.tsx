import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider
} from '@mui/material';
import {
  WaterDrop as WaterIcon,  // This is already imported above
  LocalCafe as CafeIcon,
  Store as ShopIcon,
  LocalParking as ParkingIcon,
  LocalGroceryStore as SupermarketIcon,  // Changed from ShoppingCart
  PedalBike as BikeShopIcon,
  RvHookup as CaravanIcon,
  Cabin as CampingIcon,
  Hotel as AccommodationIcon,
  Wc as ToiletIcon,
  Restaurant as RestaurantIcon,
  Train as TrainIcon,
  FlightTakeoff as AirportIcon,
  DirectionsBus as BusIcon,
  SportsBar as BreweryIcon,
  WineBar as WineryIcon,
  LocalHospital as HospitalIcon,
  Info as InfoIcon,
  LocalPostOffice as PostOfficeIcon,
  LocalPolice as PoliceIcon,
  LocalPharmacy as PharmacyIcon,  // Add this to existing imports
  LocalGasStation as FuelIcon,

  Add as AddIcon,
  Delete as DeleteIcon,
  // Additional needed icons
  Build as RepairIcon,
  Garage as StorageIcon,
  Home as ShelterIcon,
  Place as OtherIcon,
  Visibility as ViewpointIcon
} from '@mui/icons-material';
import { PlaceLabel } from './PlaceManager';
import { POICategory, InfrastructurePOIType, ServicesPOIType } from '@/types/note-types';

interface PlacePOIModalProps {
  open: boolean;
  place: PlaceLabel | null;
  onClose: () => void;
  onAddPOIs: (placeId: string, pois: Array<{
    category: POICategory;
    type: InfrastructurePOIType | ServicesPOIType;
  }>) => void;
}

interface POIOption {
  category: POICategory;
  type: InfrastructurePOIType | ServicesPOIType;
  icon: React.ReactNode;
  label: string;
}

interface PlacePOIModalProps {
  open: boolean;
  place: PlaceLabel | null;
  onClose: () => void;
  onAddPOIs: (placeId: string, pois: Array<{
    category: POICategory;
    type: InfrastructurePOIType | ServicesPOIType;
  }>) => void;
}

interface POIOption {
  category: POICategory;
  type: InfrastructurePOIType | ServicesPOIType;
  icon: React.ReactNode;
  label: string;
}

const POI_OPTIONS: POIOption[] = [
  // Infrastructure POIs
  { 
    category: POICategory.Infrastructure,
    type: InfrastructurePOIType.WaterPoint,
    icon: <WaterIcon />,
    label: 'Water Point'
  },
  {
    category: POICategory.Infrastructure,
    type: InfrastructurePOIType.PublicToilet,
    icon: <ToiletIcon />,
    label: 'Public Toilet'
  },
  {
    category: POICategory.Infrastructure,
    type: InfrastructurePOIType.BikeRepairStation,
    icon: <RepairIcon />,
    label: 'Bike Repair Station'
  },
  {
    category: POICategory.Infrastructure,
    type: InfrastructurePOIType.BikeShop,
    icon: <BikeShopIcon />,
    label: 'Bike Shop'
  },
  {
    category: POICategory.Infrastructure,
    type: InfrastructurePOIType.BikeStorage,
    icon: <StorageIcon />,
    label: 'Bike Storage'
  },
  {
    category: POICategory.Infrastructure,
    type: InfrastructurePOIType.Shelter,
    icon: <ShelterIcon />,
    label: 'Shelter'
  },
  {
    category: POICategory.Infrastructure,
    type: InfrastructurePOIType.Campsite,
    icon: <CampingIcon />,
    label: 'Campsite'
  },
  {
    category: POICategory.Infrastructure,
    type: InfrastructurePOIType.Parking,
    icon: <ParkingIcon />,
    label: 'Parking'
  },
  {
    category: POICategory.Infrastructure,
    type: InfrastructurePOIType.Viewpoint,
    icon: <ViewpointIcon />,
    label: 'Viewpoint'
  },
  {
    category: POICategory.Infrastructure,
    type: InfrastructurePOIType.Parking,  // Need to check what type to use for fuel station
    icon: <FuelIcon />,
    label: 'Fuel Station'
},

  // Services POIs
  {
    category: POICategory.Services,
    type: ServicesPOIType.Cafe,
    icon: <CafeIcon />,
    label: 'Cafe'
  },
  {
    category: POICategory.Services,
    type: ServicesPOIType.Restaurant,
    icon: <RestaurantIcon />,
    label: 'Restaurant'
  },
  {
    category: POICategory.Services,
    type: ServicesPOIType.PubBar,
    icon: <BreweryIcon />,
    label: 'Pub/Bar'
  },
  {
    category: POICategory.Services,
    type: ServicesPOIType.Supermarket,
    icon: <SupermarketIcon />,
    label: 'Supermarket'
  },
  {
    category: POICategory.Services,
    type: ServicesPOIType.GeneralStore,
    icon: <ShopIcon />,
    label: 'General Store'
  },
  {
    category: POICategory.Services,
    type: ServicesPOIType.PostOffice,
    icon: <PostOfficeIcon />,
    label: 'Post Office'
  },
  {
    category: POICategory.Services,
    type: ServicesPOIType.MedicalCenter,
    icon: <HospitalIcon />,
    label: 'Medical Center'
  },
  {
    category: POICategory.Services,
    type: ServicesPOIType.Pharmacy,
    icon: <PharmacyIcon />,
    label: 'Pharmacy'
  },
];

export const PlacePOIModal: React.FC<PlacePOIModalProps> = ({
  open,
  place,
  onClose,
  onAddPOIs
}) => {
  console.log('PlacePOIModal rendered');
  console.log('Modal open state:', open);
  console.log('Place data:', place);
  const [selectedPOIs, setSelectedPOIs] = useState<Array<{
    category: POICategory;
    type: InfrastructurePOIType | ServicesPOIType;
  }>>([]);

  const handleAddPOI = (poiOption: POIOption) => {
    setSelectedPOIs(prev => [...prev, {
      category: poiOption.category,
      type: poiOption.type
    }]);
  };

  const handleRemovePOI = (index: number) => {
    setSelectedPOIs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (place && selectedPOIs.length > 0) {
      onAddPOIs(place.id, selectedPOIs);
    }
    setSelectedPOIs([]);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid="place-poi-modal"
    >
<DialogTitle sx={{ pb: 0 }}>
        Add POIs to {place?.name}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select POIs to attach to this location
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Selected POIs:
          </Typography>
          <List>
            {selectedPOIs.map((poi, index) => {
              const poiOption = POI_OPTIONS.find(opt => opt.type === poi.type);
              return (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => handleRemovePOI(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    {poiOption?.icon}
                  </ListItemIcon>
                  <ListItemText primary={poiOption?.label} />
                </ListItem>
              );
            })}
          </List>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Available POIs:
        </Typography>
        <List>
          {POI_OPTIONS.map((poiOption) => (
           <ListItem
           key={poiOption.type}
           onClick={() => handleAddPOI(poiOption)}
           sx={{
             cursor: 'pointer',
             '&:hover': {
               backgroundColor: 'action.hover'
             }
           }}
           secondaryAction={
             <IconButton edge="end" aria-label="add">
               <AddIcon />
             </IconButton>
           }
         >
           <ListItemIcon>
             {poiOption.icon}
           </ListItemIcon>
           <ListItemText primary={poiOption.label} />
         </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave}
          variant="contained" 
          disabled={selectedPOIs.length === 0}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlacePOIModal;
