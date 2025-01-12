import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Typography,
  Box
} from '@mui/material';

import type { MapRef } from './map-container';
import type { RefObject } from 'react';

interface SaveMapModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description: string;
    isPublic: boolean;
  }) => void;
  routes: Array<{
    id: string;
    name: string;
    color: string;
    isVisible: boolean;
  }>;
  mapRef: RefObject<MapRef>;
}

const SaveMapModal = ({ open, onClose, onSave, routes }: SaveMapModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }
    onSave({
      name: name.trim(),
      description: description.trim(),
      isPublic
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Save Current Map</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Map Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
        />
        
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={3}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          }
          label="Make map public"
          sx={{ mt: 2 }}
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Included Routes
        </Typography>
        <List dense>
          {routes.map((route) => (
            <ListItem key={route.id}>
              <ListItemText
                primary={route.name}
                secondary={`Color: ${route.color}`}
              />
            </ListItem>
          ))}
        </List>

        <Box sx={{ 
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          mt: 3
        }}>
          <Button
            variant="outlined"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Save Map
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SaveMapModal;
