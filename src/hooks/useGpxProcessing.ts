import { useState, useCallback } from 'react';
import { ProcessingStatus, ProcessedRoute } from '../types';
import { GpxService } from '../services/gpx-service';

export const useGpxProcessing = () => {
    const [status, setStatus] = useState<ProcessingStatus>({
        isProcessing: false,
        progress: 0,
        total: 0
    });
    const [currentRoute, setCurrentRoute] = useState<ProcessedRoute | null>(null);
    const [error, setError] = useState<string | null>(null);

    const processGpxFile = useCallback(async (file: File): Promise<ProcessedRoute | null> => {
        try {
            setError(null);
            setStatus({
                isProcessing: true,
                progress: 0,
                total: 100
            });

            // Step 1: Upload file
            const uploadResponse = await GpxService.uploadGpxFile(file);
            if (!uploadResponse.success) {
                throw new Error(uploadResponse.error || 'Upload failed');
            }

            setStatus(prev => ({
                ...prev,
                progress: 20
            }));

            // Step 2: Start processing
            const content = await file.text();
            const points = await GpxService.parseGpxContent(content);

            setStatus(prev => ({
                ...prev,
                progress: 40
            }));

            // Step 3: Create route object
            const newRoute: ProcessedRoute = {
                id: Date.now().toString(),
                name: file.name,
                color: '#e17055',
                isVisible: true,
                gpxData: content,
                gpxFilePath: uploadResponse.path,
                segments: [{
                    points,
                    surface: 'unpaved'
                }]
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
        }
    }, []);

    const resetProcessing = useCallback(() => {
        setStatus({
            isProcessing: false,
            progress: 0,
            total: 0
        });
        setError(null);
        setCurrentRoute(null);
    }, []);

    const checkStatus = useCallback(async (routeId: string) => {
        const response = await GpxService.getRouteStatus(routeId);
        if (!response.success) {
            setError(response.error || 'Failed to check status');
            return false;
        }
        return true;
    }, []);

    const getRoute = useCallback(async (routeId: string): Promise<ProcessedRoute | null> => {
        const response = await GpxService.getProcessedRoute(routeId);
        if (!response.success) {
            setError(response.error || 'Failed to get route');
            return null;
        }
        setCurrentRoute(response.route);
        return response.route;
    }, []);

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