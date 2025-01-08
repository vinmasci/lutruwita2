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
  const [mapReady, setMapReady] = useState(false);
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

  // Check map ready state
  React.useEffect(() => {
    const handleMapReady = () => {
      setMapReady(true);
    };

    const map = mapRef.current;
    if (map) {
      map.on('load', handleMapReady);
    }

    return () => {
      if (map) {
        map.off('load', handleMapReady);
      }
    };
  }, [mapRef]);

  const handleFileUpload = async (file: File) => {
    console.log('File selected:', file?.name);
    setLoading(true);

    if (!file) {
      console.log('No file selected');
      setSnackbar({
        open: true,
        message: 'No file selected',
        severity: 'error'
      });
      setLoading(false);
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

    if (!mapRef.current || !mapRef.current.isReady()) {
      console.error('Map not ready');
      setSnackbar({
        open: true,
        message: 'Please wait for the map to fully load and try again.',
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
      // Ensure loading state is reset even if error occurs
      setLoading(false);
      setUploadDialogOpen(false);
      return;
    }
    
    // Reset states after successful upload
    setLoading(false);
    setUploadDialogOpen(false);
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
          disabled={!mapReady}
          onClick={() => {
            setUploadDialogOpen(true);
            setLoading(false);
          }}
          sx={{ justifyContent: open ? 'start' : 'center', minHeight: 48 }}
        >
          <ListItemIcon>
            {!mapReady ? (
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
        onClose={() => {
          setUploadDialogOpen(false);
          setLoading(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload GPX File</DialogTitle>
        <DialogContent>
          {!mapReady ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <CircularProgress size={24} sx={{ mb: 2 }} />
              <Typography>
                Initializing map...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
            <Paper
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: 'background.paper',
                cursor: loading ? 'wait' : 'pointer',
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'border-color 0.2s ease',
                '&:hover': {
                  borderColor: loading ? 'divider' : 'primary.main',
                  bgcolor: 'action.hover'
                },
                '&.drag-active': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.selected'
                }
              }}
              component="label"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.add('drag-active');
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove('drag-active');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove('drag-active');
                const file = e.dataTransfer.files[0];
                if (file) handleFileUpload(file);
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={32} thickness={4} />
                  <Typography variant="body1" color="text.secondary">
                    Processing GPX file...
                  </Typography>
                </Box>
              ) : (
                <>
                  <UploadFileIcon sx={{ 
                    fontSize: 56, 
                    mb: 2, 
                    color: 'primary.main',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)'
                    }
                  }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                    Drag & Drop GPX file here
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
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
                    variant="body1"
                    sx={{ 
                      color: 'primary.main',
                      fontWeight: 500,
                      '&:hover': { 
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }
                    }}
                  >
                    click to browse
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      mt: 2,
                      display: 'block',
                      maxWidth: 300
                    }}
                  >
                    Supported formats: GPX (GPS Exchange Format)
                  </Typography>
                </>
              )}
            </Paper>
          </Box>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            boxShadow: 3,
            '& .MuiAlert-icon': {
              alignItems: 'center'
            }
          }}
          elevation={6}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </StyledDrawer>
  );
};

export default Sidebar;
