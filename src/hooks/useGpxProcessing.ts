import { useState, useCallback, useRef, useEffect } from 'react';
import { ProcessingStatus, ProcessedRoute } from '../types';
import { GpxService } from '../services/gpx-service';
import * as turf from '@turf/turf';
import { GpxProcessor } from '../services/gpx-processor';
import type { FeatureCollection, Feature, LineString } from 'geojson';
import type { MapRef } from '../components/ui/map-container';

interface UseGpxProcessingProps {
    mapRef: React.RefObject<MapRef>;
}

export const useGpxProcessing = ({ mapRef }: UseGpxProcessingProps) => {
    const [status, setStatus] = useState<ProcessingStatus>({
        isProcessing: false,
        progress: 0,
        total: 0
    });
    const [currentRoute, setCurrentRoute] = useState<ProcessedRoute | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Keep track of ongoing upload for cleanup
    const abortControllerRef = useRef<AbortController | null>(null);

    // Cleanup function for ongoing operations
    const cleanup = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    const processGpxFile = useCallback(async (file: File): Promise<ProcessedRoute | null> => {
        cleanup();
        abortControllerRef.current = new AbortController();

        try {
            setError(null);
            setStatus({
                isProcessing: true,
                progress: 0,
                total: 100
            });

            // Validate file
            if (!file.name.toLowerCase().endsWith('.gpx')) {
                throw new Error('Invalid file type. Please upload a GPX file.');
            }

            // Step 1: Upload file
            const uploadResponse = await GpxService.uploadGpxFile(file);
            if (!uploadResponse.success || !uploadResponse.path) {
                throw new Error(uploadResponse.error || 'Upload failed');
            }

            setStatus(prev => ({
                ...prev,
                progress: 20
            }));

            // Step 2: Parse content
            const content = await file.text();
            const points = await GpxService.parseGpxContent(content);

            if (points.length === 0) {
                throw new Error('No valid points found in GPX file');
            }

            setStatus(prev => ({
                ...prev,
                progress: 40
            }));

            // Get map instance from ref
            const map = mapRef.current?.getMap();
            if (!map) {
                throw new Error('Map not initialized');
            }

            // Step 3: Process GPX data
            const processor = new GpxProcessor();
            const processedRoute = await processor.processGpx(Buffer.from(content), file.name);

            setStatus(prev => ({
                ...prev,
                progress: 80
            }));

            // Add file path to processed route
            const newRoute = {
                ...processedRoute,
                gpxFilePath: uploadResponse.path
            };

            setStatus(prev => ({
                ...prev,
                progress: 100,
                isProcessing: false
            }));

            setCurrentRoute(newRoute);
            return newRoute;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to process GPX file';
            setError(errorMessage);
            setStatus({
                isProcessing: false,
                progress: 0,
                total: 100,
                error: errorMessage
            });
            return null;
        } finally {
            cleanup();
        }
    }, [cleanup, mapRef]);

    const resetProcessing = useCallback(() => {
        cleanup();
        setStatus({
            isProcessing: false,
            progress: 0,
            total: 0
        });
        setError(null);
        setCurrentRoute(null);
    }, [cleanup]);

    const checkStatus = useCallback(async (routeId: string) => {
        try {
            const response = await GpxService.getRouteStatus(routeId);
            if (!response.success) {
                setError(response.error || 'Failed to check status');
                return false;
            }
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to check status');
            return false;
        }
    }, []);

    const getRoute = useCallback(async (routeId: string): Promise<ProcessedRoute | null> => {
        try {
            const response = await GpxService.getProcessedRoute(routeId);
            if (!response.success) {
                setError(response.error || 'Failed to get route');
                return null;
            }
            if (!response.route) {
                return null;
            }
            setCurrentRoute(response.route);
            return response.route;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get route');
            return null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    return {
        status,
        error,
        currentRoute,
        processGpxFile,
        resetProcessing,
        checkStatus,
        getRoute
    };
};

export default useGpxProcessing;
