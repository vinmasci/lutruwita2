import { parseString } from 'xml2js';
import { 
    GpxPoint, 
    ProcessedRoute, 
    UploadResponse, 
    ProcessingResponse, 
    RouteResponse 
} from '../types';

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3001';

export class GpxService {
    // File Upload
    static async uploadGpxFile(file: File): Promise<UploadResponse> {
        try {
            const formData = new FormData();
            formData.append('gpx', file);

            const response = await fetch(`${API_BASE_URL}/api/gpx/upload`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Upload error:', error);
            return {
                success: false,
                path: '',
                error: error instanceof Error ? error.message : 'Upload failed'
            };
        }
    }

    // Local GPX Parsing (will be moved to server later)
    static async parseGpxContent(content: string): Promise<GpxPoint[]> {
        return new Promise((resolve, reject) => {
            parseString(content, { explicitArray: false }, (err: Error | null, result: any) => {
                if (err) {
                    reject(new Error('Failed to parse GPX file'));
                    return;
                }

                try {
                    if (!result?.gpx) {
                        throw new Error('Invalid GPX structure');
                    }

                    const points = result.gpx?.rte?.rtept || result.gpx?.trk?.trkseg?.trkpt;
                    if (!points) {
                        throw new Error('No track points found');
                    }

                    const arr = Array.isArray(points) ? points : [points];
                    const coords = arr
                        .map((pt: any) => {
                            try {
                                if (!pt?.$?.lat || !pt?.$?.lon) {
                                    throw new Error('Missing coordinates');
                                }
                                const lat = parseFloat(pt.$.lat);
                                const lon = parseFloat(pt.$.lon);
                                if (isNaN(lat) || isNaN(lon)) {
                                    throw new Error('Invalid coordinates');
                                }
                                return { lat, lon };
                            } catch (err) {
                                console.warn('Invalid point:', pt);
                                return null;
                            }
                        })
                        .filter((x: GpxPoint | null): x is GpxPoint => x !== null);

                    if (coords.length === 0) {
                        throw new Error('No valid coordinates found');
                    }

                    resolve(coords);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    // Status Check
    static async getRouteStatus(routeId: string): Promise<ProcessingResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/gpx/status/${routeId}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to get route status');
            }

            return await response.json();
        } catch (error) {
            return {
                success: false,
                routeId: '',
                error: error instanceof Error ? error.message : 'Status check failed'
            };
        }
    }

    // Get Processed Route
    static async getProcessedRoute(routeId: string): Promise<RouteResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/gpx/route/${routeId}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to get processed route');
            }

            return await response.json();
        } catch (error) {
            return {
                success: false,
                route: {} as ProcessedRoute,
                error: error instanceof Error ? error.message : 'Failed to get route'
            };
        }
    }
}