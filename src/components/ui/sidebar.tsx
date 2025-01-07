import React, { useState, useRef } from 'react';
import type { MapRef } from './map-container';
import { 
  Box, 
  Drawer, 
  IconButton, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Route as RouteIcon,
  Terrain as TerrainIcon,
  Layers as LayersIcon,
  UploadFile as UploadFileIcon
} from '@mui/icons-material';

const drawerWidth = 240;
const closedWidth = 65;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: closedWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  '& .MuiDrawer-paper': {
    position: 'relative',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    border: 'none',
    borderRight: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  '& .MuiDrawer-paperAnchorLeft.closed': {
    width: closedWidth,
  },
  '& .MuiListItemIcon-root': {
    minWidth: 48,
    justifyContent: 'center',
  },
}));

interface SidebarProps {
  mapRef: React.RefObject<MapRef>;
}

const Sidebar = ({ mapRef }: SidebarProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    console.log('File selected:', file?.name);

    if (!file) {
      console.log('No file selected');
      return;
    }

    if (!file.name.endsWith('.gpx')) {
      console.log('Not a GPX file');
      setSnackbar({
        open: true,
        message: 'Please select a valid GPX file',
        severity: 'error'
      });
      return;
    }

    if (!mapRef.current) {
      console.error('Map reference not available');
      setSnackbar({
        open: true,
        message: 'Map not ready. Please try again.',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Reading file...');
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          console.log('File read successfully');
          resolve(e.target?.result as string);
        };
        reader.onerror = (e) => {
          console.error('Error reading file:', e);
          reject(new Error('Failed to read file'));
        };
        reader.readAsText(file);
      });

      console.log('Uploading to map...');
      await mapRef.current.handleGpxUpload(content);
      console.log('Upload complete');
      
      setSnackbar({
        open: true,
        message: 'GPX file loaded successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error in file upload process:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error loading GPX file',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setUploadDialogOpen(false);
    }
  };

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  return (
    <StyledDrawer
      variant="permanent"
      open={open}
      PaperProps={{
        className: open ? '' : 'closed',
        elevation: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', p: 1 }}>
        <IconButton onClick={handleDrawerToggle} size="small">
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>

      <List sx={{ px: 1 }}>
        <ListItemButton sx={{ justifyContent: open ? 'start' : 'center', minHeight: 48 }}>
          <ListItemIcon>
            <RouteIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Route Toggle" 
            sx={{ 
              opacity: open ? 1 : 0,
              display: open ? 'block' : 'none'
            }} 
          />
        </ListItemButton>
        <ListItemButton sx={{ justifyContent: open ? 'start' : 'center', minHeight: 48 }}>
          <ListItemIcon>
            <TerrainIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Gradient Toggle" 
            sx={{ 
              opacity: open ? 1 : 0,
              display: open ? 'block' : 'none'
            }} 
          />
        </ListItemButton>
        <ListItemButton sx={{ justifyContent: open ? 'start' : 'center', minHeight: 48 }}>
          <ListItemIcon>
            <LayersIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Surface Toggle" 
            sx={{ 
              opacity: open ? 1 : 0,
              display: open ? 'block' : 'none'
            }} 
          />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        <ListItemButton
          disabled={loading}
          onClick={() => setUploadDialogOpen(true)}
          sx={{ justifyContent: open ? 'start' : 'center', minHeight: 48 }}
        >
          <ListItemIcon>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <UploadFileIcon />
            )}
          </ListItemIcon>
          <ListItemText 
            primary="Upload GPX" 
            sx={{ 
              opacity: open ? 1 : 0,
              display: open ? 'block' : 'none'
            }} 
          />
        </ListItemButton>
      </List>

      <Dialog
        open={uploadDialogOpen}
        onClose={() => !loading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload GPX File</DialogTitle>
        <DialogContent>
          <Paper
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              bgcolor: 'background.default',
              cursor: loading ? 'wait' : 'pointer',
              '&:hover': {
                borderColor: loading ? '#ccc' : 'primary.main'
              }
            }}
            component="label"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <CircularProgress size={24} />
                <Typography>Processing GPX file...</Typography>
              </Box>
            ) : (
              <>
                <UploadFileIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
                <Typography variant="h6" gutterBottom>
                  Drag & Drop GPX file here
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  or
                </Typography>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  accept=".gpx"
                  style={{ display: 'none' }}
                />
                <Typography 
                  sx={{ 
                    color: 'primary.main',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  click to browse
                </Typography>
              </>
            )}
          </Paper>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </StyledDrawer>
  );
};

export default Sidebar;
