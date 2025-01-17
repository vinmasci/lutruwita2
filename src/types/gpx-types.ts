import type { Feature, FeatureCollection } from 'geojson';

export interface GpxPoint {
    lat: number;
    lon: number;
    surface?: 'paved' | 'unpaved';
}

export interface RouteSegment {
    points: GpxPoint[];
    surface: 'paved' | 'unpaved';
}

export interface ProcessedRoute {
    id: string;
    name: string;
    color: string;
    isVisible: boolean;
    gpxData: string;
    gpxFilePath?: string;
    segments: RouteSegment[];
    geojson?: FeatureCollection;
}

export interface ProcessingStatus {
    isProcessing: boolean;
    progress: number;
    total: number;
    error?: string;
}

export interface UploadResponse {
    success: boolean;
    path: string;
    error?: string;
}

export interface ProcessingResponse {
    success: boolean;
    routeId: string;
    error?: string;
}

export interface RouteResponse {
    success: boolean;
    route: ProcessedRoute;
    error?: string;
}