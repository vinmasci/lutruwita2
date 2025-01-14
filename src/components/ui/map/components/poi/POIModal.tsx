import React, { useState } from 'react';
import mapboxgl from 'mapbox-gl';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography
} from '@mui/material';
import {
  POIType,
  POICategory,
  InfrastructurePOIType,
  POIIcons
} from '@/types/note-types';
import { usePOI } from '../../utils/poi/poi-state';
import { handleAddPOI } from '../../utils/poi/poi-events';

interface POIModalProps {
  map: mapboxgl.Map;
  open: boolean;
  selectedType?: POIType;
  tempMarker: mapboxgl.Marker | null;
  onClose: () => void;
}

export const POIModal: React.FC<POIModalProps> = ({
  map,
  open,
  selectedType = InfrastructurePOIType.WaterPoint,
  tempMarker,
  onClose,
}) => {
  const { isPlacingPOI, setIsPlacingPOI } = usePOI();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPlacingPOI?.position) return;

    // Get final position from marker (in case it was dragged)
    const finalPosition = tempMarker?.getLngLat() || {
      lat: isPlacingPOI.position.lat,
      lng: isPlacingPOI.position.lon
    };

    const poiData = {
      name,
      description,
      category: POICategory.Infrastructure,
      type: selectedType,
      location: {
        lat: finalPosition.lat,
        lon: finalPosition.lng
      },
      createdBy: 'user' // This should come from auth context
    };

    try {
      await handleAddPOI(poiData, map);
      setName('');
      setDescription('');
      setIsPlacingPOI(null);
      if (map) {
        map.getCanvas().style.cursor = 'default';
      }
      onClose();
    } catch (error) {
      console.error('Error adding POI:', error);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <span className="material-icons" style={{ color: '#e17055' }}>
            {POIIcons[selectedType]}
          </span>
          <Typography>Add {selectedType}</Typography>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              autoFocus
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this point"
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any relevant details..."
              multiline
              rows={4}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            sx={{ 
              bgcolor: '#e17055',
              '&:hover': {
                bgcolor: '#d65d43'
              }
            }}
          >
            Add Point
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default POIModal;