import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import { POIIcons } from '@/types/note-types';
import { useFloatingIcon } from '../../contexts/floating-icon-context';

interface POIModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (poiData: {
    name: string;
    description?: string;
    iconType: string;
  }) => void;
}

export function POIModal({ open, onClose, onAdd }: POIModalProps) {
  const [mode, setMode] = useState<'select' | 'details'>('select');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { showFloatingIcon, hideFloatingIcon } = useFloatingIcon();

  // Reset state when modal closes
  const handleClose = () => {
    setMode('select');
    setSelectedIcon(null);
    setName('');
    setDescription('');
    hideFloatingIcon();
    onClose();
  };

  // When user selects an icon
  const handleIconSelect = (iconType: string) => {
    setSelectedIcon(iconType);
    showFloatingIcon(POIIcons[iconType]);
    onClose(); // Close modal during placement
  };

  // When user clicks Save on the details form
  const handleSave = () => {
    if (!selectedIcon || !name) return;
    
    onAdd({
      name,
      description,
      iconType: selectedIcon
    });
    
    handleClose();
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
          maxWidth: mode === 'select' ? '800px' : '500px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        {mode === 'select' ? (
          <>
            <Typography variant="h6" component="h2" gutterBottom>
              Add Point of Interest
            </Typography>

            <Typography variant="body2" sx={{ mb: 2, color: '#9ca3af' }}>
              Select an icon to place on the map:
            </Typography>

            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: 2,
                mb: 3
              }}
            >
              {Object.entries(POIIcons).map(([type, iconName]) => (
                <Box
                  key={type}
                  onClick={() => handleIconSelect(type)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 1,
                    cursor: 'pointer',
                    borderRadius: 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '32px', marginBottom: '4px' }}>
                    {iconName}
                  </span>
                  <Typography variant="caption" align="center" sx={{ wordBreak: 'break-word' }}>
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        ) : (
          <>
            <Typography variant="h6" component="h2" gutterBottom>
              POI Details
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
          </>
        )}
      </Box>
    </Modal>
  );
}