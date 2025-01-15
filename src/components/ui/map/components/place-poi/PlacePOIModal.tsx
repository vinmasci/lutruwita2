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
  WaterDrop as WaterIcon,
  LocalCafe as CafeIcon,
  Store as ShopIcon,
  LocalParking as ParkingIcon,
  Hotel as AccommodationIcon,
  Add as AddIcon,
  Delete as DeleteIcon
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

const POI_OPTIONS: POIOption[] = [
  { 
    category: POICategory.Infrastructure, 
    type: InfrastructurePOIType.WaterPoint, 
    icon: <WaterIcon />, 
    label: 'Water Point' 
  },
  { 
    category: POICategory.Services, 
    type: ServicesPOIType.Cafe, 
    icon: <CafeIcon />, 
    label: 'Cafe' 
  },
  { 
    category: POICategory.Services, 
    type: ServicesPOIType.GeneralStore, 
    icon: <ShopIcon />, 
    label: 'Shop' 
  },
  { 
    category: POICategory.Infrastructure, 
    type: InfrastructurePOIType.Parking, 
    icon: <ParkingIcon />, 
    label: 'Parking' 
  },
  // Add more POI types as needed
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
      <DialogTitle>
        <Typography variant="h6">
          Add POIs to {place?.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select POIs to attach to this location
        </Typography>
      </DialogTitle>

      <DialogContent>
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
              component="button"
              onClick={() => handleAddPOI(poiOption)}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <ListItemIcon>
                {poiOption.icon}
              </ListItemIcon>
              <ListItemText primary={poiOption.label} />
              <IconButton edge="end" aria-label="add">
                <AddIcon />
              </IconButton>
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
