// --------------------------------------------
// Core imports required for the component
// --------------------------------------------
import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useState
} from 'react';
import mapboxgl from 'mapbox-gl';      // Main mapping library
import { CircularProgress, Box, Typography } from '@mui/material';  // UI components
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import { useGpxProcessing, useRouteRendering } from '@/hooks';
import { ProcessedRoute } from '@/types';
import type { 
  Feature,
  Point as TurfPoint,
  GeoJsonProperties,
  Position,
  LineString,
  MultiLineString,
  FeatureCollection
} from 'geojson';
import { mapService } from "../../services/map-service";
import { PhotoModal } from '@/components/ui/photo-modal';
import DistanceMarker from './distance-marker';
import Supercluster from 'supercluster';
import { createRoot } from 'react-dom/client';

// New POI imports
import { POIProvider } from './map/utils/poi/poi-state';
import { PlaceManager } from "./map/components/poi/place-poi/PlaceManager";
import { POIManager } from './map/components/poi/POIManager';
import { addPOIMarkerToMap } from './map/utils/poi/poi-markers';
import { POI, POICategory, InfrastructurePOIType } from '@/types/note-types';
import type { Map as MapboxMap, Marker } from 'mapbox-gl';
import { usePOI } from './map/utils/poi/poi-state';


// --------------------------------------------
// Type definitions for the component
// --------------------------------------------
interface PhotoDocument {
  _id: string;
  url: string;
  originalName?: string;
  latitude: number;
  longitude: number;
  uploadedAt: string;
}

interface MapRef {
  handleGpxUpload: (content: string, file: File) => Promise<void>;
  isReady: () => boolean;                               
  on: (event: string, callback: (event: any) => void) => void;    
  off: (event: string, callback: (event: any) => void) => void;   
  getCurrentRoutes: () => Array<{
    id: string;
    name: string;
    color: string;
    isVisible: boolean;
    gpxData: string;
    gpxFilePath?: string;
  }>;
  getCurrentPhotos: () => Array<{
    id: string;
    url: string;
    caption?: string;
    longitude: number;
    latitude: number;
  }>;
  getRouteData: () => FeatureCollection;
  getCenter: () => { lng: number; lat: number; };
  getZoom: () => number;
  getPitch: () => number;
  getBearing: () => number;
  getStyle: () => string;
  getMap: () => mapboxgl.Map | null;
  setViewState: (viewState: {
    center: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
  }) => void;
  clearRoutes: () => void;
  loadRoute: (route: {
    id: string;
    name: string;
    color: string;
    isVisible: boolean;
    gpxData: string;
  }) => Promise<void>;
  addPOI: (poiData: {
    name: string;
    description?: string;
    category: POICategory;
    type: InfrastructurePOIType;
    coordinates: [number, number];
  }) => Promise<POI>;
}

interface PhotoDocument {
  _id: string;
  url: string;
  originalName?: string;
  latitude: number;
  longitude: number;
  uploadedAt: string;
}

// --------------------------------------------
// Loading Overlay UI Component
// Shows progress during GPX processing
// --------------------------------------------
const LoadingOverlay = () => {
  const { status: processingStatus } = useGpxProcessing();
  
  if (!processingStatus.isProcessing) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: '48px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <CircularProgress size={60} sx={{ mb: 2 }} />
      <Typography variant="h6" color="white" gutterBottom>
        Processing GPX file...
      </Typography>
      <Typography color="white">
        {processingStatus.progress}% complete
      </Typography>
      {processingStatus.error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {processingStatus.error}
        </Typography>
      )}
    </Box>
  );
};
// --------------------------------------------
// Main MapContainer Component
// Handles all map rendering and GPX processing
// --------------------------------------------
interface PlacingPOIState {
  type: InfrastructurePOIType;
  position: { lat: number; lon: number } | null;
  iconType?: InfrastructurePOIType;
}

interface MapContainerProps {
  children?: React.ReactNode;
  placePOIMode: boolean;
  setPlacePOIMode: (mode: boolean) => void;
}

const MapContainer = forwardRef<MapRef, MapContainerProps>(({ placePOIMode, setPlacePOIMode, children }, ref) => {
  // POI Context
  const { isPlacingPOI, setIsPlacingPOI } = usePOI();
  
  // New GPX and Route Hooks
  const { processGpxFile, status: processingStatus } = useGpxProcessing();
  const { routes, activeRoute, addRouteToMap, removeRoute, clearRoutes } = useRouteRendering(map.current);
  
  // Layer IDs
  const routeSourceId = 'route';
  const routeLayerId = 'route-layer';
  
  // Core references
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // State management
  const [isMapReady, setIsMapReady] = React.useState(false);
  const [streetsLayersLoaded, setStreetsLayersLoaded] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [currentPhotos, setCurrentPhotos] = useState<PhotoDocument[]>([]);
  const [tempMarker, setTempMarker] = useState<mapboxgl.Marker | null>(null);
  const [poiModalOpen, setPoiModalOpen] = useState(false);
  const [currentPOIs, setCurrentPOIs] = useState<POI[]>([]);

  // ------------------------------------------------------------------
  // isReady => Checks if map and all layers are fully loaded
  // Used to ensure map is ready before processing GPX data
  // ------------------------------------------------------------------
  const isReady = useCallback((): boolean => {
    const ready = Boolean(map.current) && isMapReady && streetsLayersLoaded;
    console.log('[isReady] Map check =>', { ready, isMapReady, streetsLayersLoaded });
    return ready;
  }, [isMapReady, streetsLayersLoaded]);

// First, add these component-level functions (before useImperativeHandle):
const createMarkerElement = useCallback((photo: any, count?: number) => {
  const el = document.createElement('div');
  el.className = 'photo-marker';
  el.style.position = 'relative';
  el.setAttribute('data-lat', photo.latitude.toString());
  el.setAttribute('data-lon', photo.longitude.toString());
  el.setAttribute('data-id', photo._id);
  el.setAttribute('data-url', photo.url);

  const imgContainer = document.createElement('div');
  imgContainer.style.position = 'relative';
  imgContainer.style.backgroundColor = '#1f2937';
  imgContainer.style.padding = '2px';
  imgContainer.style.borderRadius = '4px';
  imgContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
  imgContainer.style.width = 'fit-content';
  imgContainer.style.display = 'inline-block';
  imgContainer.style.cursor = 'pointer';

  const img = document.createElement('img');
  img.src = photo.url;
  img.alt = photo.originalName || '';
  img.style.width = '32px';
  img.style.height = '32px';
  img.style.objectFit = 'cover';
  img.style.borderRadius = '2px';
  img.style.border = '1px solid #374151';

  if (count) {
    const badge = document.createElement('div');
    badge.style.position = 'absolute';
    badge.style.top = '-8px';
    badge.style.right = '-8px';
    badge.style.backgroundColor = '#e17055';
    badge.style.color = 'white';
    badge.style.borderRadius = '9999px';
    badge.style.padding = '0px 4px';
    badge.style.fontSize = '10px';
    badge.style.fontWeight = 'bold';
    badge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    badge.textContent = `+${count}`;
    imgContainer.appendChild(badge);
  }

  const arrow = document.createElement('div');
  arrow.style.position = 'absolute';
  arrow.style.bottom = '-6px';
  arrow.style.left = '50%';
  arrow.style.transform = 'translateX(-50%)';
  arrow.style.width = '0';
  arrow.style.height = '0';
  arrow.style.borderLeft = '6px solid transparent';
  arrow.style.borderRight = '6px solid transparent';
  arrow.style.borderTop = '6px solid #1f2937';

  imgContainer.appendChild(img);
  imgContainer.appendChild(arrow);
  el.appendChild(imgContainer);

  return el;
}, []);

const updateMarkers = useCallback((clusterIndex: Supercluster) => {
  if (!map.current) return;

  const bounds = map.current.getBounds();
  const zoom = Math.floor(map.current.getZoom());

  const clusters = clusterIndex.getClusters(
    [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
    zoom
  );

  // Remove existing markers first
  document.querySelectorAll('.photo-marker-container').forEach(el => el.remove());

  clusters.forEach(cluster => {
    const coordinates = cluster.geometry.coordinates as [number, number];
    const markerEl = document.createElement('div');
    markerEl.className = 'mapboxgl-marker photo-marker-container';

    if (cluster.properties.cluster) {
      const leaves = clusterIndex.getLeaves(cluster.properties.cluster_id, Infinity);
      const firstPhoto = leaves[0].properties.photo;
      const count = leaves.length - 1;

      const el = createMarkerElement(firstPhoto, count);
      markerEl.appendChild(el);

      const modalContainer = document.createElement('div');
      modalContainer.className = 'photo-modal-container';
      document.body.appendChild(modalContainer);
      const modalRoot = createRoot(modalContainer);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        map.current?.flyTo({
          center: coordinates,
          zoom: (map.current.getZoom() || 0) + 2,
          duration: 1000
        });
      });

    } else {
      const photo = cluster.properties.photo;
      const el = createMarkerElement(photo);
      markerEl.appendChild(el);

      const modalContainer = document.createElement('div');
      modalContainer.className = 'photo-modal-container';
      document.body.appendChild(modalContainer);
      const modalRoot = createRoot(modalContainer);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        modalRoot.render(
          <PhotoModal
            open={true}
            onClose={() => {
              modalRoot.render(
                <PhotoModal
                  open={false}
                  onClose={() => {}}
                  photo={photo}
                />
              );
            }}
            photo={photo}
          />
        );
      });
    }

    new mapboxgl.Marker({
      element: markerEl,
      anchor: 'bottom',
      offset: [0, 8],
      clickTolerance: 3
    })
      .setLngLat(coordinates)
      .addTo(map.current);
  });
}, [map, createMarkerElement]);

// Then update the addPhotoMarkersToMap function:
const addPhotoMarkersToMap = useCallback(async (coordinates: Point[]) => {
  if (!map.current) return;

  const points = coordinates.map(coord => ({
    longitude: coord.lon,
    latitude: coord.lat
  }));

  const photos = await findPhotosNearPoints(points);
  setCurrentPhotos(photos);
  
  document.querySelectorAll('.photo-marker').forEach(el => el.remove());
  document.querySelectorAll('.photo-modal-container').forEach(el => el.remove());

  const features = photos.map((photo, index) => ({
    type: 'Feature',
    properties: {
      id: `photo-${index}`,
      photo
    },
    geometry: {
      type: 'Point',
      coordinates: [photo.longitude, photo.latitude]
    }
  }));

  const clusterIndex = new Supercluster({
    radius: 40,
    maxZoom: 16,
    minPoints: 2
  });

  clusterIndex.load(features);

  updateMarkers(clusterIndex);
  map.current.on('moveend', () => updateMarkers(clusterIndex));
  map.current.on('zoomend', () => updateMarkers(clusterIndex));

  console.log('Photo markers added to map');
}, [updateMarkers]);

// POI handler
const handleAddPOI = useCallback(async (poiData: Omit<POI, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string }) => {
  console.log("handleAddPOI called with:", {
    poiData,
    hasMap: !!map.current,
    placingPOIState: isPlacingPOI
  });
  if (!map.current || !isPlacingPOI?.position) return;
  console.log("Early return from handleAddPOI:", {
    hasMap: !!map.current,
    hasPosition: !!isPlacingPOI?.position
  });
  
  const newPOI: POI = {
    ...poiData,
    id: `poi-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: poiData.category || 'Infrastructure', // Add default category
    type: poiData.iconType,  // Ensure type is set from iconType
    location: {
      lat: isPlacingPOI.position.lat,
      lon: isPlacingPOI.position.lon
    }
  };

  console.log("Created new POI:", newPOI);

  // Add to state
  setCurrentPOIs(prev => [...prev, newPOI]);
  console.log("Added POI to state");

  // Add marker to map
  await addPOIMarkerToMap(map.current, newPOI);
  console.log("Added POI marker to map");

  return newPOI;
}, [map, isPlacingPOI]);

// Save map handler
const handleSaveMap = useCallback(async (data: {
  name: string;
  description: string;
  isPublic: boolean;
  }) => {
  if (!map.current) return;
  
  try {
    console.log('Current photos before saving:', currentPhotos);  // Add this line here
    
    const source = map.current.getSource(routeSourceId);
    if (!source) {
      throw new Error('No route source found');
    }
  
  const routeData = (source as mapboxgl.GeoJSONSource)._data;
  if (!routeData || routeData.type !== 'FeatureCollection') {
    throw new Error('Invalid route data');
  }

// Get all routes, deduplicating any with identical GPX data
const mapRoutes = routes.map(route => ({
  id: route.id,
  name: route.name,
  color: route.color,
  isVisible: route.isVisible,
  gpxData: route.gpxData,
  gpxFilePath: route.gpxFilePath
}));

  // Get current map view state
  const center = map.current.getCenter();
  const viewState = {
    center: [center.lng, center.lat] as [number, number],
    zoom: map.current.getZoom(),
    pitch: map.current.getPitch(),
    bearing: map.current.getBearing()
  };

// Get all photo markers currently on the map
const photos = currentPhotos.map(photo => ({
  id: photo._id,
  url: photo.url,
  caption: photo.originalName,
  latitude: photo.latitude,
  longitude: photo.longitude
}));

console.log('Photos to save:', photos);

console.log('Final photos array:', photos);

// Create complete map data object
const mapData = {
  ...data,
  routes,
  routeData: {
    ...routeData,
    features: routeData.features.map(f => ({
      ...f,
      properties: {
        surface: f.properties?.surface || 'unpaved',
        segmentIndex: f.properties?.segmentIndex || 0
      }
    }))
  },
  pois: currentPOIs,  // Add this line
  photos: currentPhotos.map(photo => ({
    id: photo._id,
    url: photo.url,
    caption: photo.originalName,
    latitude: photo.latitude,
    longitude: photo.longitude
  })),
    viewState,
    mapStyle: map.current.getStyle().name || 'mapbox://styles/mapbox/satellite-streets-v12',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  console.log('Saving map with data:', mapData);
  // Save to database
  const savedMap = await mapService.createMap(mapData);
  console.log('Map saved successfully:', savedMap);
} catch (error) {
  console.error('Error saving map:', error);
}
}, [routeStore, mapService, currentPhotos]);

// ------------------------------------------------------------------
// Expose methods to parent component
// Makes key functionality available to parent components
// ------------------------------------------------------------------
React.useImperativeHandle(
  ref,
  () => ({
    handleGpxUpload: async (content: string, file: File) => {
      if (!isReady()) {
        throw new Error('Map not ready. Try again later.');
      }
      
      try {
        const route = await processGpxFile(file);
        if (route) {
          addRouteToMap(route);
          return route;
        }
        throw new Error('Failed to process GPX file');
      } catch (error) {
        console.error('Error processing GPX:', error);
        throw error;
      }
    },
    isReady,
    getMap: () => map.current,
    handleAddPOI,
    getCurrentPOIs: () => currentPOIs,
    
    // Map event handlers
    on: (evt: string, cb: (event: any) => void) => {
      if (map.current) {
        map.current.on(evt, cb);
      }
    },
    off: (evt: string, cb: (event: any) => void) => {
      if (map.current) {
        map.current.off(evt, cb);
      }
    },
    
    // Route management
    getCurrentRoutes: () => routes,
    
    // Photo management
    getCurrentPhotos: () => {
      return currentPhotos.map(photo => ({
        id: photo._id,
        url: photo.url,
        caption: photo.originalName,
        longitude: photo.longitude,
        latitude: photo.latitude
      }));
    },
    
    // Route data
    getRouteData: () => {
      if (!activeRoute?.geojson) return { type: 'FeatureCollection', features: [] };
      return activeRoute.geojson;
    },
    
    // Map state getters
    getCenter: () => {
      if (!map.current) return { lng: 0, lat: 0 };
      const center = map.current.getCenter();
      return { lng: center.lng, lat: center.lat };
    },
    getZoom: () => map.current?.getZoom() || 0,
    getPitch: () => map.current?.getPitch() || 0,
    getBearing: () => map.current?.getBearing() || 0,
    getStyle: () => map.current?.getStyle().name || 'mapbox://styles/mapbox/satellite-streets-v12',
    
    // Map state setters
    setViewState: (viewState) => {
      if (!map.current) return;
      map.current.flyTo({
        center: viewState.center,
        zoom: viewState.zoom,
        pitch: viewState.pitch,
        bearing: viewState.bearing
      });
    },
    
    // Clear functionality
    clearRoutes: () => {
      clearRoutes();
      document.querySelectorAll('.photo-marker, .photo-marker-container').forEach(el => el.remove());
      document.querySelectorAll('.photo-modal-container').forEach(el => el.remove());
      document.querySelectorAll('.poi-marker-container').forEach(el => el.remove());
      setCurrentPhotos([]);
      setCurrentPOIs([]);
    },
    
    // Load route functionality
    loadRoute: async (route, routeData?: FeatureCollection, savedPhotos?: Array<{
      id: string;
      url: string;
      caption?: string;
      location: {
        lat: number;
        lon: number;
      }
    }>) => {
      if (!map.current) return;
      
      try {
        if (routeData) {
          // Add the processed route directly
          const processedRoute: ProcessedRoute = {
            id: route.id,
            name: route.name,
            color: route.color || '#e17055',
            isVisible: true,
            gpxData: route.gpxData,
            gpxFilePath: route.gpxFilePath,
            segments: [],
            geojson: routeData
          };
          
          addRouteToMap(processedRoute);

          // Handle saved photos if they exist
          if (savedPhotos?.length) {
            setCurrentPhotos(savedPhotos.map(photo => ({
              _id: photo.id,
              url: photo.url,
              originalName: photo.caption || '',
              latitude: photo.latitude || photo.location?.lat,
              longitude: photo.longitude || photo.location?.lon,
              uploadedAt: new Date().toISOString()
            })));

            // Create photo markers
            const features = savedPhotos.map((photo, index) => ({
              type: 'Feature' as const,
              properties: {
                id: `photo-${index}`,
                photo: {
                  _id: photo.id,
                  url: photo.url,
                  originalName: photo.caption || '',
                  latitude: photo.latitude || photo.location?.lat,
                  longitude: photo.longitude || photo.location?.lon
                }
              },
              geometry: {
                type: 'Point' as const,
                coordinates: [
                  photo.longitude || photo.location?.lon,
                  photo.latitude || photo.location?.lat
                ]
              }
            }));

            // Set up clustering
            const clusterIndex = new Supercluster({
              radius: 40,
              maxZoom: 16,
              minPoints: 2
            });
            
            clusterIndex.load(features);
            const bounds = map.current.getBounds();
            const zoom = Math.floor(map.current.getZoom());
            
            map.current.on('moveend', () => updateMarkers(clusterIndex));
            map.current.on('zoomend', () => updateMarkers(clusterIndex));

            const clusters = clusterIndex.getClusters(
              [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
              zoom
            );

            clusters.forEach(cluster => {
              const coordinates = cluster.geometry.coordinates as [number, number];
              const markerEl = document.createElement('div');
              markerEl.className = 'mapboxgl-marker photo-marker-container';

              if (cluster.properties.cluster) {
                const leaves = clusterIndex.getLeaves(cluster.properties.cluster_id, Infinity);
                const firstPhoto = leaves[0].properties.photo;
                const count = leaves.length - 1;
                const el = createMarkerElement(firstPhoto, count);
                markerEl.appendChild(el);
              } else {
                const photo = cluster.properties.photo;
                const el = createMarkerElement(photo);
                markerEl.appendChild(el);
              }

              new mapboxgl.Marker({
                element: markerEl,
                anchor: 'bottom',
                offset: [0, 8],
                clickTolerance: 3
              })
                .setLngLat(coordinates)
                .addTo(map.current);
            });
          }
        } else if (route.gpxData) {
          // Process new GPX file
          const processedRoute = await processGpxFile(new File([route.gpxData], route.name));
          if (processedRoute) {
            addRouteToMap(processedRoute);
          }
        }
      } catch (error) {
        console.error('Error loading route:', error);
        throw new Error('Failed to load route');
      }
    },
    
    // POI placement
    startPOIPlacement: () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'crosshair';
        setIsPlacingPOI({
          type: InfrastructurePOIType.WaterPoint,
          position: null,
          iconType: InfrastructurePOIType.WaterPoint
        });
      }
    }
  }),
  [
    isReady, 
    processGpxFile, 
    addRouteToMap,
    routes,
    activeRoute,
    clearRoutes,
    createMarkerElement,
    updateMarkers,
    currentPhotos,
    currentPOIs
  ]
);

// ------------------------------------------------------------------
  // Map initialization
  // Sets up the map and loads necessary layers
  // Called once when component mounts
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('[MapContainer] Mapbox token not found');
      return;
    }

    try {
      mapboxgl.accessToken = mapboxToken;

      // Create new map instance
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        bounds: [[144.5, -43.7], [148.5, -40.5]], // Tasmania bounds: [west, south], [east, north]
        fitBoundsOptions: {
          padding: 50,
          pitch: 0,  // Bird's eye view (looking straight down)
          bearing: 0
        }
      } as any);

      map.current = newMap;

      newMap.on('load', () => {
        // Add terrain source and layer
        newMap.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });
        
        // Add terrain layer
        newMap.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
        console.log('[MapContainer] Base map loaded');

        try {
          // Add MapTiler vector tile source containing road data
          const tileUrl =
            'https://api.maptiler.com/tiles/5dd3666f-1ce4-4df6-9146-eda62a200bcb/{z}/{x}/{y}.pbf?key=DFSAZFJXzvprKbxHrHXv';
          newMap.addSource('australia-roads', {
            type: 'vector',
            tiles: [tileUrl],
            minzoom: 12,
            maxzoom: 14
          });

          // Add custom roads layer with surface-based styling
          newMap.addLayer({
            id: 'custom-roads',
            type: 'line',
            source: 'australia-roads',
            'source-layer': 'lutruwita',
            minzoom: 12,
            maxzoom: 14,
            layout: {
              visibility: 'visible'
            },
            paint: {
              'line-opacity': 1,
              'line-color': [
                'match',
                ['get', 'surface'],

                // Color roads based on surface type
                // Paved roads in blue
                ['paved', 'asphalt', 'concrete', 'compacted', 'sealed', 'bitumen', 'tar'],
                '#4A90E2',

                // Unpaved roads in orange
                ['unpaved', 'gravel', 'fine', 'fine_gravel', 'dirt', 'earth'],
                '#D35400',

                // Unknown surfaces in grey
                '#888888'
              ],
              'line-width': 2
            }
          });

          // Mark map as ready
          setStreetsLayersLoaded(true);
          setIsMapReady(true);
          console.log('[MapContainer] Roads layer added, map is ready.');
        } catch (err) {
          console.error('[MapContainer] Error adding roads source/layer:', err);
        }
      });

      // Add standard map controls
      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
      newMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      // Add control margin for navbar
      const controlContainer = document.querySelector('.mapboxgl-control-container');
      if (controlContainer) {
        (controlContainer as HTMLElement).style.marginTop = '64px';
      }

      // Track current interval
      let currentInterval = 25;

      // Add zoom change handler to update distance markers
      newMap.on('zoom', () => {
        const zoom = newMap.getZoom();
        // Calculate new interval based on zoom
        let newInterval = 25; // Default
        if (zoom >= 14) newInterval = 5;        // Very close zoom
        else if (zoom >= 12) newInterval = 10;  // Medium zoom
        else if (zoom >= 10) newInterval = 15;  // Medium-far zoom

        // Only update if interval changed
        if (newInterval !== currentInterval && newMap.getSource(routeSourceId)) {
          currentInterval = newInterval;
          
          // Remove only distance markers, explicitly excluding photo markers
          const distanceMarkers = document.querySelectorAll('.mapboxgl-marker:not(.photo-marker):not(.photo-marker-container)');
          distanceMarkers.forEach(marker => marker.remove());
          
          // Get current route data
          const source = newMap.getSource(routeSourceId) as mapboxgl.GeoJSONSource;
          const data = (source as any)._data as FeatureCollection;
          
          // Rebuild combined line
          const combinedLine = turf.lineString(
            data.features.reduce((coords: number[][], feature) => {
              if (feature.geometry.type === 'LineString') {
                return [...coords, ...feature.geometry.coordinates];
              }
              return coords;
            }, [])
          );

          // Calculate length and add new markers
          const totalLength = turf.length(combinedLine, { units: 'kilometers' });
          const distancePoints = getDistancePoints(newMap, combinedLine, totalLength);
          
          distancePoints.forEach(({ point, distance }) => {
            const el = document.createElement('div');
            const root = createRoot(el);
            root.render(<DistanceMarker distance={distance} />);

            new mapboxgl.Marker({
              element: el,
              anchor: 'center',
              scale: 0.25
            })
              .setLngLat(point.geometry.coordinates)
              .addTo(newMap);
          });
        }
      });

    } catch (err) {
      console.error('[MapContainer] Error creating map:', err);
    }

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Remove isPlacingPOI from dependencies

// ------------------------------------------------------------------
// Render the map component with loading overlay when processing
// ------------------------------------------------------------------
return (
  <div className="w-full h-full relative">
    <div className="absolute top-0 left-[160px] right-0 right-[40px] z-10 bg-black/0 p-4">
      <h1 className="text-white text-2xl font-fraunces font-bold pl-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">{routeName}</h1>
    </div>
    {!placePOIMode && (
      <POIManager map={map.current} placePOIMode={placePOIMode} />
    )}
    {placePOIMode && map.current && isMapReady && (
      <PlaceManager 
        map={map.current} 
        onPlaceDetected={(place) => {
          console.log('Place detected:', place);
          if (place) {
            // Modal opens automatically in PlaceManager
          }
        }} 
      />
    )}
    <div ref={mapContainer} className="w-full h-full" />
    <LoadingOverlay />

MapContainer.displayName = 'MapContainer';

export default MapContainer;
export type { MapRef };