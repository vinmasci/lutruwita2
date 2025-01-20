import { ProcessedRoute, GpxPoint } from '../types';
import { parseGpx } from '../utils/gpx/parsing';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export class GpxService {
    static async uploadGpxFile(file: File): Promise<{
        success: boolean;
        path?: string;
        error?: string;
    }> {
        try {
            const formData = new FormData();
            formData.append('gpx', file);

            const response = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            return {
                success: true,
                path: data.path
            };
        } catch (error) {
            console.error('Upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Upload failed'
            };
        }
    }

    static async parseGpxContent(content: string): Promise<GpxPoint[]> {
        try {
            return await parseGpx(Buffer.from(content));
        } catch (error) {
            console.error('Parse error:', error);
            throw new Error('Failed to parse GPX content');
        }
    }

    static async getRouteStatus(routeId: string): Promise<{
        success: boolean;
        status?: string;
        error?: string;
    }> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/routes/${routeId}/status`);
            if (!response.ok) {
                throw new Error('Failed to get route status');
            }
            const data = await response.json();
            return {
                success: true,
                status: data.status
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get route status'
            };
        }
    }

    static async getProcessedRoute(routeId: string): Promise<{
        success: boolean;
        route?: ProcessedRoute;
        error?: string;
    }> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/routes/${routeId}`);
            if (!response.ok) {
                throw new Error('Failed to get route');
            }
            const route = await response.json();
            return {
                success: true,
                route
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get route'
            };
        }
    }
}
