import type { Feature, FeatureCollection } from 'geojson';

/**
 * Represents the possible surface types for a route segment.
 * - paved: Roads or paths with a solid surface (asphalt, concrete)
 * - unpaved: Dirt roads, natural paths, tracks, or any non-paved surface
 */
export type SurfaceType = 'paved' | 'unpaved';

/**
 * Represents a single point in a GPX track.
 * Contains geographical coordinates and optional metadata.
 */
export interface GpxPoint {
    lat: number;
    lon: number;
    ele: number;
    surface?: SurfaceType;
    timestamp?: string;
}

/**
 * Represents a segment of a route with consistent surface type.
 * Used to break down a route into sections based on surface characteristics.
 */
export interface RouteSegment {
    surface: SurfaceType;
    distance: number;
    geometry: {
        type: 'LineString';
        coordinates: [number, number][];
    };
}

/**
 * Represents a fully processed GPX route with all necessary metadata
 * and derived information for display and analysis.
 */
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

/**
 * Tracks the status of GPX file processing operations.
 * Used to provide feedback during upload and processing.
 */
export interface ProcessingStatus {
    isProcessing: boolean;
    progress: number;
    total: number;
    error?: string;
}

/**
 * Response format for GPX file upload operations.
 * Includes path to stored file and any error information.
 */
export interface UploadResponse {
    success: boolean;
    path: string;
    error?: string;
}

/**
 * Response format for GPX processing operations.
 * Includes route ID for successful processing or error details.
 */
export interface ProcessingResponse {
    success: boolean;
    routeId: string;
    error?: string;
}

/**
 * Response format for route retrieval operations.
 * Includes complete route data or error information.
 */
export interface RouteResponse {
    success: boolean;
    route: ProcessedRoute;
    error?: string;
}
