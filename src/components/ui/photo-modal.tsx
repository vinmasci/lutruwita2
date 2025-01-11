import React from 'react';
import { Modal, Box, Typography } from '@mui/material';

interface PhotoModalProps {
  open: boolean;
  onClose: () => void;
  photo: {
    url: string;
    originalName: string;
    caption?: string;
    username?: string;
  };
}

export function PhotoModal({ open, onClose, photo }: PhotoModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="photo-modal-title"
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
          p: 3,
          maxWidth: '800px', // Set a max-width to prevent too wide images
          width: 'auto',     // Let it shrink to content
          maxHeight: '90vh', // Still limit the height to prevent overflow
          overflow: 'auto',
          outline: 'none',
          '& img': {
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
            maxHeight: '70vh',
            objectFit: 'contain',
            borderRadius: '8px',
            marginBottom: '16px'
          }
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.url}
          alt={photo.originalName}
          style={{
            width: 'auto',
            maxWidth: '100%'
          }}
        />
        {photo.caption && (
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#e5e7eb',
              mb: 1
            }}
          >
            {photo.caption}
          </Typography>
        )}
        {photo.username && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#9ca3af',
              fontStyle: 'italic'
            }}
          >
            By {photo.username}
          </Typography>
        )}
      </Box>
    </Modal>
  );
}