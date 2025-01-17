import { useState, useCallback, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { ProcessedRoute, RouteSegment } from '../types';
import { Feature, FeatureCollection, LineString } from 'geojson';

export const useRouteRendering = (map: mapboxgl.Map | null) => {
    const [routes, setRoutes] = useState<ProcessedRoute[]>([]);
    const [activeRoute, setActiveRoute] = useState<ProcessedRoute | null>(null);

    // Convert route segments to GeoJSON
    const createGeoJson = useCallback((segments: RouteSegment[]): FeatureCollection => {
        const features = segments.map((segment, idx) => ({
            type: 'Feature',
            properties: {
                surface: segment.surface,
                segmentIndex: idx
            },
            geometry: {
                type: 'LineString',
                coordinates: segment.points.map(p => [p.lon, p.lat])
            }
        })) as Feature<LineString>[];

        return {
            type: 'FeatureCollection',
            features
        };
    }, []);

    // Add route to map
    const addRouteToMap = useCallback((route: ProcessedRoute) => {
        if (!map || !route.segments.length) return;

        const routeSourceId = `route-${route.id}`;
        const routeLayerId = `route-layer-${route.id}`;

        // Remove existing route if present
        if (map.getSource(routeSourceId)) {
            if (map.getLayer(`${routeLayerId}-white-stroke`)) {
                map.removeLayer(`${routeLayerId}-white-stroke`);
            }
            if (map.getLayer(routeLayerId)) {
                map.removeLayer(routeLayerId);
            }
            if (map.getLayer(`${routeLayerId}-unpaved`)) {
                map.removeLayer(`${routeLayerId}-unpaved`);
            }
            map.removeSource(routeSourceId);
        }

        // Create GeoJSON if not already present
        const geojson = route.geojson || createGeoJson(route.segments);

        // Add source
        map.addSource(routeSourceId, {
            type: 'geojson',
            data: geojson
        });

        // Add white stroke base layer
        map.addLayer({
            id: `${routeLayerId}-white-stroke`,
            type: 'line',
            source: routeSourceId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#FFFFFF',
                'line-width': 5
            }
        });

        // Add base layer for paved segments
        map.addLayer({
            id: routeLayerId,
            type: 'line',
            source: routeSourceId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': route.color,
                'line-width': 3,
                'line-opacity': [
                    'case',
                    ['==', ['get', 'surface'], 'paved'],
                    1,
                    0
                ]
            }
        });

        // Add dashed lines for unpaved segments
        map.addLayer({
            id: `${routeLayerId}-unpaved`,
            type: 'line',
            source: routeSourceId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': route.color,
                'line-width': 3,
                'line-opacity': [
                    'case',
                    ['==', ['get', 'surface'], 'unpaved'],
                    1,
                    0
                ],
                'line-dasharray': [0.5, 1.5]
            }
        });

        // Update route store
        setRoutes(prev => [...prev, { ...route, geojson }]);
        setActiveRoute({ ...route, geojson });
    }, [map, createGeoJson]);

    // Remove route from map
    const removeRoute = useCallback((routeId: string) => {
        if (!map) return;

        const routeSourceId = `route-${routeId}`;
        const routeLayerId = `route-layer-${routeId}`;

        // Remove layers
        [`${routeLayerId}-white-stroke`, routeLayerId, `${routeLayerId}-unpaved`].forEach(layerId => {
            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }
        });

        // Remove source
        if (map.getSource(routeSourceId)) {
            map.removeSource(routeSourceId);
        }

        // Update state
        setRoutes(prev => prev.filter(r => r.id !== routeId));
        setActiveRoute(prev => prev?.id === routeId ? null : prev);
    }, [map]);

    // Clear all routes
    const clearRoutes = useCallback(() => {
        routes.forEach(route => removeRoute(route.id));
    }, [routes, removeRoute]);

    // Update route visibility
    const updateRouteVisibility = useCallback((routeId: string, visible: boolean) => {
        if (!map) return;

        const routeLayerId = `route-layer-${routeId}`;
        const visibility = visible ? 'visible' : 'none';

        [`${routeLayerId}-white-stroke`, routeLayerId, `${routeLayerId}-unpaved`].forEach(layerId => {
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', visibility);
            }
        });

        setRoutes(prev => 
            prev.map(route => 
                route.id === routeId 
                    ? { ...route, isVisible: visible }
                    : route
            )
        );
    }, [map]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (map) {
                routes.forEach(route => removeRoute(route.id));
            }
        };
    }, [map, routes, removeRoute]);

    return {
        routes,
        activeRoute,
        addRouteToMap,
        removeRoute,
        clearRoutes,
        updateRouteVisibility
    };
};

export default useRouteRendering;