import { Express, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { OpenIDRequest } from 'express-openid-connect';

// Auth0 types
export interface Auth0User {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

export interface Auth0Request extends OpenIDRequest {
  oidc: {
    isAuthenticated(): boolean;
    user?: Auth0User;
  };
}

// Express request/response types
export interface TypedRequestBody<T> extends Request {
  body: T;
  oidc?: {
    isAuthenticated(): boolean;
    user?: Auth0User;
  };
}

export interface TypedResponse<T> extends Response {
  json: (body: T) => this;
}

// API Response types
export interface ErrorResponse {
  error: string;
}

// Photo types
export interface PhotoUploadRequest {
  longitude: string;
  latitude: string;
  description?: string;
}
export interface PhotoUploadResponse {
  success: boolean;
  photoId: ObjectId;
  key: string;
}

export interface Photo {
  filename: string;
  key: string;
  longitude: number;
  latitude: number;
  description: string;
  uploadedAt: Date;
}

// Route types
export interface SurfaceDetectionRequest {
  route: {
    coordinates: [number, number][];
  };
}

export interface SurfaceDetectionResult {
  id: string;
  surface: string | null;
  highway: string;
  distance_meters: number;
}

export interface SurfaceDetectionResponse {
  results: SurfaceDetectionResult[][];
}
import type { Feature, FeatureCollection } from 'geojson';
import { ProcessedRoute, RouteSegment } from './gpx-types';

// Re-export types we need from gpx-types
export { ProcessedRoute, RouteSegment };

// Server-specific route types
export interface ServerProcessedRoute extends ProcessedRoute {
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ServerRouteSegment extends RouteSegment {
  segment: string; // PostGIS geometry as GeoJSON string
}

export interface RouteUploadResponse {
  success: boolean;
  routeId: ObjectId;
  route: ServerProcessedRoute;
}

// Server module declaration
declare module '../../../server.js' {
  const app: Express;

  // Express request handlers with Auth0
  export interface TypedRequestBody<T> extends Request {
    body: T;
    oidc?: {
      isAuthenticated(): boolean;
      user?: Auth0User;
    };
  }

  export interface TypedResponse<T> extends Response {
    json: (body: T) => TypedResponse<T>;
    status(code: number): TypedResponse<T>;
  }

  export { app };
}

// Utility type for handling unknown errors
export type SafeError = Error | { message: string } | unknown;
export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: string }).message === 'string'
  );
}
