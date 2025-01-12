import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import type { MapRef } from './map-container';
import { mapService } from '../../services/map-service';

interface LoadMapModalProps {
  open: boolean;
  onClose: () => void;
  mapRef: React.RefObject<MapRef>;
  onLoadSuccess: () => void;
}

interface SavedMapData {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  routes: Array<{
    id: string;
    name: string;
    color: string;
    isVisible: boolean;
    gpxData: string;
    gpxFilePath?: string;
  }>;
  routeData: {
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      properties: {
        surface: "paved" | "unpaved";
        segmentIndex: number;
      };
      geometry: {
        type: "LineString";
        coordinates: number[][];
      };
    }>;
  };
  photos: Array<{
    id: string;
    url: string;
    caption?: string;
    location: {
      lat: number;
      lon: number;
    };
  }>;
  viewState: {
    center: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
  };
}

const LoadMapModal = ({ open, onClose, mapRef, onLoadSuccess }: LoadMapModalProps) => {
  const [maps, setMaps] = useState<SavedMapData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaps = async () => {
      if (open) {
        setLoading(true);
        setError(null);
        try {
          const response = await mapService.getMaps();
          setMaps(response);
        } catch (err) {
          console.error('Error fetching maps:', err);
          setError(err instanceof Error ? err.message : 'Error fetching maps');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMaps();
  }, [open]);

  const handleLoadMap = async (map: SavedMapData) => {
    if (!mapRef.current) return;
  
    try {
      setLoading(true);
      setError(null);
  
      // Clear existing routes first
      mapRef.current.clearRoutes();
  
      // Load each route with its saved data
      for (const route of map.routes) {
        await mapRef.current.loadRoute(route, map.routeData, map.photos);
      }
  
      // Load the map's view state after routes are loaded
      mapRef.current.setViewState(map.viewState);
  
      onLoadSuccess();
      onClose();
    } catch (err) {
      console.error('Error loading map:', err);
      setError(err instanceof Error ? err.message : 'Error loading map');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMap = async (mapId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this map?')) return;

    try {
      await mapService.deleteMap(mapId);
      setMaps(maps.filter(m => m._id !== mapId));
    } catch (err) {
      console.error('Error deleting map:', err);
      setError(err instanceof Error ? err.message : 'Error deleting map');
    }
  };

  const filteredMaps = maps.filter(map => 
    map.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    map.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Load Saved Map</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search maps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredMaps.length === 0 ? (
          <Typography sx={{ p: 2, textAlign: 'center' }}>
            No saved maps found.
          </Typography>
        ) : (
          <List sx={{ width: '100%' }}>
            {filteredMaps.map((map) => (
              <ListItem
                key={map._id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                onClick={() => handleLoadMap(map)}
              >
                <ListItemText
                  primary={map.name}
                  secondary={
                    <>
                      {map.description}
                      <br />
                      Created: {new Date(map.createdAt).toLocaleDateString()}
                    </>
                  }
                />
                <IconButton
                  onClick={(e) => handleDeleteMap(map._id, e)}
                  size="small"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
        )}

        <Box sx={{ 
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          mt: 2
        }}>
          <Button onClick={onClose}>
            Cancel
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LoadMapModal;