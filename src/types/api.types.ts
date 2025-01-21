import { ObjectId } from 'mongodb';
import { Feature, FeatureCollection } from 'geojson';
import { ProcessedRoute, RouteSegment } from './gpx-types';

// General API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Photo Related Types
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

// Map Related Types
export interface MapCreateRequest {
  name: string;
  description?: string;
  isPublic: boolean;
  viewState: {
    center: [number, number];
    zoom: number;
    pitch?: number;
    bearing?: number;
  };
}

export interface MapResponse {
  _id: ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPublic: boolean;
  viewState: {
    center: [number, number];
    zoom: number;
    pitch?: number;
    bearing?: number;
  };
}

// Route Related Types
export interface RouteUploadRequest {
  name?: string;
  description?: string;
}

export interface RouteUploadResponse {
  success: boolean;
  routeId: ObjectId;
  route: ServerProcessedRoute;
}

export interface ServerProcessedRoute extends ProcessedRoute {
  uploadedBy: string;
  uploadedAt: Date;
  id: string;
  color: string;
  isVisible: boolean;
  gpxData: string;
}

// Surface Detection Types
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

// User Profile Types
export interface UserProfileResponse {
  auth0Id: string;
  bioName: string;
  email: string;
  picture: string;
  socialLinks: {
    instagram?: string;
    strava?: string;
    facebook?: string;
  };
  website?: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileUpdateRequest {
  bioName?: string;
  socialLinks?: {
    instagram?: string;
    strava?: string;
    facebook?: string;
  };
  website?: string;
}