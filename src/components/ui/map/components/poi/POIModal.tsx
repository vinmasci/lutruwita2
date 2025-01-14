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
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  POIType,
  POICategory,
  InfrastructurePOIType,
  ServicesPOIType,
  AccommodationPOIType,
  NaturalFeaturesPOIType,
  InformationPOIType,
  POIIcons
} from '@/types/note-types';
import { usePOI } from '../../utils/poi/poi-state.tsx';
import { handleAddPOI } from '../../utils/poi/poi-events';

interface POIModalProps {
  map: mapboxgl.Map;
  open: boolean;
  selectedType?: POIType;
  tempMarker: mapboxgl.Marker | null;
  onClose: () => void;
}

const getPOITypesByCategory = (category: POICategory) => {
  switch (category) {
    case POICategory.Infrastructure:
      return Object.values(InfrastructurePOIType);
    case POICategory.Services:
      return Object.values(ServicesPOIType);
    case POICategory.Accommodation:
      return Object.values(AccommodationPOIType);
    case POICategory.NaturalFeatures:
      return Object.values(NaturalFeaturesPOIType);
    case POICategory.Information:
      return Object.values(InformationPOIType);
    default:
      return [];
  }
};

export const POIModal: React.FC<POIModalProps> = ({
  map,
  open,
  selectedType = InfrastructurePOIType.WaterPoint,
  tempMarker,
  onClose,
}) => {
  const { 
    isPlacingPOI, 
    setIsPlacingPOI, 
    addPOI, 
    setTempMarker,
    setPoiModalOpen 
  } = usePOI();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<POICategory>(POICategory.Infrastructure);
  const [type, setType] = useState<POIType>(selectedType);

  const handleCategoryChange = (event: any) => {
    const newCategory = event.target.value as POICategory;
    setCategory(newCategory);
    // Set the first POI type of the new category as default
    const types = getPOITypesByCategory(newCategory);
    if (types.length > 0) {
      setType(types[0]);
    }
  };

  const handleTypeChange = (event: any) => {
    setType(event.target.value as POIType);
  };

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
      category: category,
      type: type,
      location: {
        lat: finalPosition.lat,
        lon: finalPosition.lng
      },
      createdBy: 'user'
    };

    try {
      const contextData = {
        isPlacingPOI,
        setIsPlacingPOI,
        addPOI,
        setTempMarker,
        setPoiModalOpen
      };

      await handleAddPOI(poiData, map, contextData);
      
      // Reset form and state
      setName('');
      setDescription('');
      setIsPlacingPOI(null);
      
      // Cleanup
      if (tempMarker) {
        tempMarker.remove();
        setTempMarker(null);
      }
      
      if (map) {
        map.getCanvas().style.cursor = 'default';
      }
      
      onClose();
      setPoiModalOpen(false);
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
            {POIIcons[type]}
          </span>
          <Typography>Add Point of Interest</Typography>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Category Select */}
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                onChange={handleCategoryChange}
                label="Category"
              >
                {Object.values(POICategory).map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Type Select */}
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={type}
                onChange={handleTypeChange}
                label="Type"
              >
                {getPOITypesByCategory(category).map((poiType) => (
                  <MenuItem key={poiType} value={poiType}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <span className="material-icons" style={{ color: '#e17055', fontSize: '20px' }}>
                        {POIIcons[poiType]}
                      </span>
                      {poiType}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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