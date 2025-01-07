import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapControls from './map-controls';
import ElevationProfile from './elevation-profile';

// Define map styles
const MAP_STYLES = {
  outdoor: 'mapbox://styles/mapbox/outdoors-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v12',
};

const MapContainer = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [currentStyle, setCurrentStyle] = useState('outdoor');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showElevation, setShowElevation] = useState(false);
  const [elevationData, setElevationData] = useState([
    // Sample data - replace with real data from your GPX/route
    { distance: 0, elevation: 100, grade: 0, surface: 'paved' },
    { distance: 1, elevation: 150, grade: 5, surface: 'paved' },
    { distance: 2, elevation: 200, grade: 5, surface: 'unpaved' },
    { distance: 3, elevation: 180, grade: -2, surface: 'unpaved' },
    { distance: 4, elevation: 250, grade: 7, surface: 'paved' },
  ]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[currentStyle as keyof typeof MAP_STYLES],
      center: [146.5, -41.5], // Center on Tasmania
      zoom: 7,
      minZoom: 3,
      maxZoom: 18,
    });

    // Initialize the draw control
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        line_string: true,
        trash: true
      },
      defaultMode: 'simple_select',
      styles: [
        {
          'id': 'gl-draw-line',
          'type': 'line',
          'filter': ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
          'layout': {
            'line-cap': 'round',
            'line-join': 'round'
          },
          'paint': {
            'line-color': '#00C2FF',
            'line-width': 4,
            'line-opacity': 0.7
          }
        },
        {
          'id': 'gl-draw-point',
          'type': 'circle',
          'filter': ['all', ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
          'paint': {
            'circle-radius': 6,
            'circle-color': '#FFFFFF',
            'circle-stroke-color': '#00C2FF',
            'circle-stroke-width': 2
          }
        }
      ]
    });

    // Add the draw control to the map
    map.current.addControl(draw.current);

    // Add standard navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl());
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      })
    );

    // Add click handler for snapping
    map.current.on('click', handleMapClick);

    // Clean up on unmount
    return () => {
      map.current?.remove();
    };
  }, [currentStyle]);

  const handleMapClick = async (e: mapboxgl.MapMouseEvent) => {
    if (!isDrawingMode || !map.current) return;

    const point = [e.lngLat.lng, e.lngLat.lat];
    
    // Query nearby roads
    const features = map.current.queryRenderedFeatures(e.point, {
      layers: ['road-secondary-tertiary', 'road-primary', 'road-street', 'road-path']
    });

    if (features.length > 0) {
      // Find the nearest road
      const nearestRoad = features[0];
      if (nearestRoad.geometry.type === 'LineString') {
        const snappedPoint = turf.nearestPointOnLine(
          nearestRoad.geometry as turf.LineString,
          turf.point(point)
        );

        // Add the snapped point to the line
        if (draw.current) {
          const selectedIds = draw.current.getSelected().map(f => f.id);
          const feature = selectedIds.length ? draw.current.get(selectedIds[0]) : null;

          if (feature && feature.type === 'Feature' && feature.geometry.type === 'LineString') {
            const coordinates = [...feature.geometry.coordinates, snappedPoint.geometry.coordinates];
            draw.current.set({
              type: 'FeatureCollection',
              features: [{
                ...feature,
                geometry: {
                  ...feature.geometry,
                  coordinates
                }
              }]
            });
          } else {
            // Start a new line
            draw.current.deleteAll();
            draw.current.add({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [snappedPoint.geometry.coordinates]
              }
            });
          }
        }
      }
    }
  };

  const handleZoomIn = () => {
    map.current?.zoomIn();
  };

  const handleZoomOut = () => {
    map.current?.zoomOut();
  };

  const handleLocate = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        map.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 14,
        });
      });
    }
  };

  const handleLayerToggle = () => {
    const styles = Object.keys(MAP_STYLES);
    const currentIndex = styles.indexOf(currentStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    const nextStyle = styles[nextIndex];
    setCurrentStyle(nextStyle);
    
    if (map.current) {
      map.current.setStyle(MAP_STYLES[nextStyle as keyof typeof MAP_STYLES]);
    }
  };

  const startDrawing = () => {
    setIsDrawingMode(true);
    draw.current?.changeMode('draw_line_string');
  };

  const stopDrawing = () => {
    setIsDrawingMode(false);
    draw.current?.changeMode('simple_select');
  };

  const handleRouteLoad = (routeData: any) => {
    if (!map.current) return;
    // Implement route loading logic here
  };

  const toggleElevationProfile = () => {
    setShowElevation(!showElevation);
  };

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full" />
      <MapControls 
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocate={handleLocate}
        onLayerToggle={handleLayerToggle}
      />
      <ElevationProfile 
        data={elevationData}
        visible={showElevation}
      />
      {/* Drawing Controls */}
      <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-lg">
        <button 
          onClick={isDrawingMode ? stopDrawing : startDrawing}
          className={`px-4 py-2 rounded ${isDrawingMode ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          {isDrawingMode ? 'Stop Drawing' : 'Start Drawing'}
        </button>
      </div>
    </div>
  );
};

export default MapContainer;