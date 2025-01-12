import React, { useState } from 'react';
import { Modal, Box, Typography } from '@mui/material';
import { POIIcons } from '@/types/note-types';

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
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedIcon(null);
    setIsPlacing(false);
    onClose();
  };

  // When user selects an icon
  const handleIconSelect = (iconType: string) => {
    setSelectedIcon(iconType);
    setIsPlacing(true);
    document.body.style.cursor = 'crosshair';
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
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
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

        {isPlacing && (
          <Typography variant="body1" sx={{ textAlign: 'center', color: '#9ca3af' }}>
            Click on the map to place the POI
          </Typography>
        )}
      </Box>
    </Modal>
  );
}