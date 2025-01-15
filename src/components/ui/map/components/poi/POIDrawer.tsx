import React from 'react';
import {
  Drawer,
  IconButton,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Slide,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { 
  POI, 
  POICategory, 
  POIIcons, 
  InfrastructurePOIType,
  ServicesPOIType,
  AccommodationPOIType,
  NaturalFeaturesPOIType,
  InformationPOIType
} from '@/types/note-types';

interface POIDrawerProps {
  open: boolean;
  onClose: () => void;
  poi: POI | null;
  onSave: (updatedPOI: POI) => void;
  onDelete: (poiId: string) => void;
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

export const POIDrawer: React.FC<POIDrawerProps> = ({
  open,
  onClose,
  poi,
  onSave,
  onDelete
}) => {
  const [editedPOI, setEditedPOI] = React.useState<POI | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setEditedPOI(poi);
  }, [poi]);

  if (!editedPOI) return null;

  const handleCategoryChange = (category: POICategory) => {
    const availableTypes = getPOITypesByCategory(category);
    setEditedPOI(prev => prev ? {
      ...prev,
      category,
      type: availableTypes[0]
    } : null);
  };

  const handleSave = () => {
    if (editedPOI) {
      onSave({
        ...editedPOI,
        updatedAt: new Date()
      });
      onClose();
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(false);
    onDelete(editedPOI.id);
    onClose();
  };

  const availableTypes = getPOITypesByCategory(editedPOI.category);

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: { width: '400px' }
        }}
        SlideProps={{ 
          direction: "left",
          timeout: {
            enter: 300,
            exit: 200
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '8px' }}>
                {POIIcons[editedPOI.type]}
              </span>
              POI Details
            </Typography>
            <IconButton 
              onClick={() => setDeleteDialogOpen(true)}
              sx={{ mr: 1, color: 'error.main' }}
            >
              <DeleteIcon />
            </IconButton>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={editedPOI.name}
              onChange={(e) => setEditedPOI(prev => prev ? { ...prev, name: e.target.value } : null)}
              fullWidth
            />

            <TextField
              label="Description"
              value={editedPOI.description || ''}
              onChange={(e) => setEditedPOI(prev => prev ? { ...prev, description: e.target.value } : null)}
              multiline
              rows={4}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={editedPOI.category}
                label="Category"
                onChange={(e) => handleCategoryChange(e.target.value as POICategory)}
              >
                {Object.values(POICategory).map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={editedPOI.type}
                label="Type"
                onChange={(e) => setEditedPOI(prev => prev ? { ...prev, type: e.target.value } : null)}
              >
                {availableTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '8px' }}>
                      {POIIcons[type]}
                    </span>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                fullWidth
              >
                Save Changes
              </Button>
              <Button
                variant="outlined"
                onClick={onClose}
                fullWidth
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete POI</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this POI? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ 
              color: '#64B5F6',  // Light blue color
              '&:hover': {
                backgroundColor: 'rgba(100, 181, 246, 0.08)'  // Very light blue background on hover
              }
            }}
          >
            CANCEL
          </Button>
          <Button 
            onClick={handleDelete} 
            sx={{ 
              backgroundColor: '#F44336',  // Material red
              color: 'white',
              '&:hover': {
                backgroundColor: '#D32F2F'  // Darker red on hover
              }
            }}
          >
            DELETE
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default POIDrawer;