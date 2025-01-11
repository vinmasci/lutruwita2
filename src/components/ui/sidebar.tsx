import React, { useState, useRef, useEffect } from 'react';
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
  UploadFile as UploadFileIcon,
  AccountCircle as AccountCircleIcon
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
    display: 'flex',
    flexDirection: 'column',
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
  const [userData, setUserData] = useState<{
    picture?: string;
    bioName?: string;
    isAdmin?: boolean;
  } | null>(null);
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
    let checkInterval: NodeJS.Timeout | null = null;
    
    const checkMapReady = () => {
      // ADD DEBUG LOG HERE
      console.log("Debug mapRef:", {
        hasRef: Boolean(mapRef.current),
        isReadyFn: Boolean(mapRef.current?.isReady),
        isReadyResult: mapRef.current?.isReady?.()
      });
  
      if (mapRef.current?.isReady()) {
        console.log('Map is ready');
        setMapReady(true);
        if (checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
      } else {
        console.log('Map not ready yet...');
      }
    };

    // Check immediately
    checkMapReady();
    
    // Also set up an interval to keep checking until ready
    if (!checkInterval) {
      checkInterval = setInterval(checkMapReady, 500);
    }

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      setMapReady(false);
    };
  }, [mapRef]);

    // Add new useEffect for user data
    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const response = await fetch('http://localhost:3001/api/profile', {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          }
        } catch (error) {
          console.log('Error fetching user data:', error);
        }
      };
  
      fetchUserData();
    }, []);

  const handleFileUpload = async (file: File) => {
    console.log('Starting file upload process', { 
      fileName: file?.name,
      fileSize: file?.size,
      mapReady: mapRef.current?.isReady()
    });
    
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
      console.log('Invalid file type:', file.name);
      setSnackbar({
        open: true,
        message: 'Please select a valid GPX file',
        severity: 'error'
      });
      setLoading(false);
      return;
    }

    // Check map ready state with detailed logging
    const isMapReady = mapRef.current?.isReady();
    console.log('Map ready check:', {
      mapRefExists: !!mapRef.current,
      isMapReady,
      mapReadyState: mapReady
    });

    if (!mapRef.current || !isMapReady) {
      console.log('Map not ready for upload');
      setSnackbar({
        open: true,
        message: 'Please wait for the map to fully load and try again.',
        severity: 'error'
      });
      setLoading(false);
      return;
    }

    try {
      console.log('Reading file contents...');
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          console.log('File read successfully, content length:', (e.target?.result as string)?.length);
          resolve(e.target?.result as string);
        };
        reader.onerror = (e) => {
          console.error('Error reading file:', e);
          reject(new Error('Failed to read file'));
        };
        reader.readAsText(file);
      });

      console.log('Starting GPX upload to map...');
      await mapRef.current.handleGpxUpload(content);
      console.log('GPX upload completed successfully');
      
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
          disabled={!mapReady}
          onClick={() => {
            setUploadDialogOpen(true);
            setLoading(false);
          }}
          sx={{ justifyContent: open ? 'start' : 'center', minHeight: 48 }}
        >
<ListItemIcon>
  <UploadFileIcon />
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

      {/* Spacer to push profile to bottom */}
      <Box sx={{ flexGrow: 1 }} />
      
      {/* Profile section */}
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
  <ListItemButton 
    onClick={() => window.location.href = userData ? "http://localhost:3001/logout" : "http://localhost:3001/login"}
    sx={{
      justifyContent: open ? 'start' : 'center', 
      minHeight: 48,
      borderRadius: 1
    }}
  >
    <ListItemIcon>
      {userData?.picture ? (
        <Box
          component="img"
          src={userData.picture}
          alt={userData.bioName}
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%'
          }}
        />
      ) : (
        <AccountCircleIcon />
      )}
    </ListItemIcon>
    <ListItemText 
      primary={userData ? "Sign Out" : "Sign In"}
      secondary={userData?.bioName}
      sx={{ 
        opacity: open ? 1 : 0,
        display: open ? 'block' : 'none'
      }} 
    />
  </ListItemButton>
</Box>
    </StyledDrawer>
  );
};

export default Sidebar;
