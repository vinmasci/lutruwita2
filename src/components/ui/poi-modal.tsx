import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { POICategory, POIType, InfrastructurePOIType, ServicesPOIType, AccommodationPOIType, NaturalFeaturesPOIType, InformationPOIType } from '@/types/note-types';

interface POIModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (poiData: {
    name: string;
    description?: string;
    category: POICategory;
    type: POIType;
    warning?: string;
    hasWarning: boolean;
    createdBy: string;
  }) => void;
}

export function POIModal({ open, onClose, onAdd }: POIModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<POICategory | ''>('');
  const [type, setType] = useState<POIType | ''>('');
  const [warning, setWarning] = useState('');
  const [hasWarning, setHasWarning] = useState(false);

  const getTypeOptions = (category: POICategory) => {
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

  const handleSubmit = () => {
    if (!name || !category || !type) return;

    onAdd({
      name,
      description,
      category: category as POICategory,
      type: type as POIType,
      warning: hasWarning ? warning : undefined,
      hasWarning,
      createdBy: 'user' // Replace with actual user ID
    });

    // Reset form
    setName('');
    setDescription('');
    setCategory('');
    setType('');
    setWarning('');
    setHasWarning(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="poi-modal-title"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      }}
    >
      <Box
        sx={{
          position: 'relative',
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
        <Typography variant="h6" component="h2" gutterBottom>
          Add Point of Interest
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{
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
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel sx={{ color: '#9ca3af' }}>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={(e) => {
              setCategory(e.target.value as POICategory);
              setType('');
            }}
            required
            sx={{
              color: '#e5e7eb',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4b5563',
              },
            }}
          >
            {Object.values(POICategory).map((cat) => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel sx={{ color: '#9ca3af' }}>Type</InputLabel>
          <Select
            value={type}
            label="Type"
            onChange={(e) => setType(e.target.value as POIType)}
            required
            disabled={!category}
            sx={{
              color: '#e5e7eb',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4b5563',
              },
            }}
          >
            {category && getTypeOptions(category as POICategory).map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            sx={{
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
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Warning
          </Typography>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <Button
              variant={hasWarning ? "contained" : "outlined"}
              onClick={() => setHasWarning(!hasWarning)}
              sx={{
                backgroundColor: hasWarning ? '#e17055' : 'transparent',
                borderColor: '#e17055',
                color: hasWarning ? 'white' : '#e17055',
                '&:hover': {
                  backgroundColor: hasWarning ? '#d65f4c' : 'rgba(225, 112, 85, 0.1)',
                  borderColor: '#e17055',
                },
              }}
            >
              Add Warning
            </Button>
          </div>
          {hasWarning && (
            <TextField
              label="Warning Message"
              value={warning}
              onChange={(e) => setWarning(e.target.value)}
              required={hasWarning}
              sx={{
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
          )}
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button
            onClick={onClose}
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
            onClick={handleSubmit}
            variant="contained"
            disabled={!name || !category || !type || (hasWarning && !warning)}
            sx={{
              backgroundColor: '#e17055',
              '&:hover': {
                backgroundColor: '#d65f4c',
              },
              '&.Mui-disabled': {
                backgroundColor: '#4b5563',
              },
            }}
          >
            Add POI
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}