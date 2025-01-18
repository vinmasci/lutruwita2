import { useState, useCallback, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { ProcessedRoute, RouteSegment } from '../types';
import { Feature, FeatureCollection, LineString } from 'geojson';

export const useRouteRendering = (map: mapboxgl.Map | null) => {
    const [routes, setRoutes] = useState<ProcessedRoute[]>([]);
    const [activeRoute, setActiveRoute] = useState<ProcessedRoute | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Keep track of event listeners for cleanup
    const eventListeners = useRef<{ [key: string]: Function }>({});

    // Convert route segments to GeoJSON
    const createGeoJson = useCallback((segments: RouteSegment[]): FeatureCollection => {
        try {
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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create GeoJSON');
            return { type: 'FeatureCollection', features: [] };
        }
    }, []);

    // Add route to map
    const addRouteToMap = useCallback((route: ProcessedRoute) => {
        if (!map || !route.segments.length) return;

        try {
            const routeSourceId = `route-${route.id}`;
            const routeLayerId = `route-layer-${route.id}`;

            // Remove existing route if present
            if (map.getSource(routeSourceId)) {
                ['white-stroke', '', 'unpaved'].forEach(suffix => {
                    const layerId = `${routeLayerId}${suffix ? '-' + suffix : ''}`;
                    if (map.getLayer(layerId)) {
                        map.removeLayer(layerId);
                    }
                });
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
            setError(null);
        } catch (err) {
            console.error('Error adding route to map:', err);
            setError(err instanceof Error ? err.message : 'Failed to add route to map');
        }
    }, [map, createGeoJson]);

    // Remove route from map
    const removeRoute = useCallback((routeId: string) => {
        if (!map) return;

        try {
            const routeSourceId = `route-${routeId}`;
            const routeLayerId = `route-layer-${routeId}`;

            // Remove layers
            ['white-stroke', '', 'unpaved'].forEach(suffix => {
                const layerId = `${routeLayerId}${suffix ? '-' + suffix : ''}`;
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
            setError(null);
        } catch (err) {
            console.error('Error removing route:', err);
            setError(err instanceof Error ? err.message : 'Failed to remove route');
        }
    }, [map]);

    // Clear all routes
    const clearRoutes = useCallback(() => {
        routes.forEach(route => removeRoute(route.id));
    }, [routes, removeRoute]);

    // Update route visibility
    const updateRouteVisibility = useCallback((routeId: string, visible: boolean) => {
        if (!map) return;

        try {
            const routeLayerId = `route-layer-${routeId}`;
            const visibility = visible ? 'visible' : 'none';

            ['white-stroke', '', 'unpaved'].forEach(suffix => {
                const layerId = `${routeLayerId}${suffix ? '-' + suffix : ''}`;
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
            setError(null);
        } catch (err) {
            console.error('Error updating route visibility:', err);
            setError(err instanceof Error ? err.message : 'Failed to update route visibility');
        }
    }, [map]);

    // Add event listener with cleanup tracking
    const addMapListener = useCallback((eventName: string, handler: Function) => {
        if (!map) return;
        
        const wrappedHandler = (...args: any[]) => {
            try {
                handler(...args);
            } catch (err) {
                console.error(`Error in ${eventName} handler:`, err);
                setError(err instanceof Error ? err.message : `Error handling ${eventName} event`);
            }
        };
        
        map.on(eventName, wrappedHandler);
        eventListeners.current[eventName] = wrappedHandler;
    }, [map]);

    // Cleanup on unmount or when map changes
    useEffect(() => {
        return () => {
            if (map) {
                // Remove all event listeners
                Object.entries(eventListeners.current).forEach(([eventName, handler]) => {
                    map.off(eventName, handler as any);
                });
                eventListeners.current = {};

                // Remove all routes
                routes.forEach(route => {
                    const routeSourceId = `route-${route.id}`;
                    const routeLayerId = `route-layer-${route.id}`;

                    ['white-stroke', '', 'unpaved'].forEach(suffix => {
                        const layerId = `${routeLayerId}${suffix ? '-' + suffix : ''}`;
                        if (map.getLayer(layerId)) {
                            map.removeLayer(layerId);
                        }
                    });

                    if (map.getSource(routeSourceId)) {
                        map.removeSource(routeSourceId);
                    }
                });
            }
        };
    }, [map, routes]);

    return {
        routes,
        activeRoute,
        error,
        addRouteToMap,
        removeRoute,
        clearRoutes,
        updateRouteVisibility,
        addMapListener
    };
};

export default useRouteRendering;