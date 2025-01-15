import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { POICategory, POIType, POIIcons } from '@/types/note-types';
import type { MapRef } from './map-container';

interface POIModalProps {
    open: boolean;
    onClose: () => void;
    onAdd: (poiData: {
      name: string;
      description?: string;
      category: POICategory;
      iconType: POIType;
    }) => void;
    selectedType: POIType;
    tempMarker: mapboxgl.Marker | null;
    map: MapRef;
}

export function POIModal({ open, onClose, onAdd, selectedType, tempMarker }: POIModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<POICategory>(POICategory.Infrastructure);

  const handleClose = () => {
    // Clean up if user cancels
    if (tempMarker) {
      tempMarker.remove();
    }
    setName('');
    setDescription('');
    setCategory(POICategory.Infrastructure);
    onClose();
  };

  const handleSave = () => {
    if (!name) return;
    
    onAdd({
      name,
      description,
      category,
      iconType: selectedType
    });
    
    setName('');
    setDescription('');
    setCategory(POICategory.Infrastructure);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="poi-modal-title"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: '#1f2937',
          color: '#e5e7eb',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span className="material-icons">{POIIcons[selectedType]}</span>
          Add {selectedType}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                color: '#e5e7eb',
                '& fieldset': {
                  borderColor: '#4b5563',
                },
                '&:hover fieldset': {
                  borderColor: '#6b7280',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#9ca3af',
              },
            }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: '#9ca3af' }}>Category</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as POICategory)}
              sx={{
                color: '#e5e7eb',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4b5563',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6b7280',
                },
              }}
            >
              {Object.values(POICategory).map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                color: '#e5e7eb',
                '& fieldset': {
                  borderColor: '#4b5563',
                },
                '&:hover fieldset': {
                  borderColor: '#6b7280',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#9ca3af',
              },
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                color: '#9ca3af',
                borderColor: '#4b5563',
                '&:hover': {
                  borderColor: '#6b7280',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={!name}
              sx={{
                bgcolor: '#e17055',
                '&:hover': {
                  bgcolor: '#d65f4c',
                },
                '&.Mui-disabled': {
                  bgcolor: '#4b5563',
                },
              }}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
