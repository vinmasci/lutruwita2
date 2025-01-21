import { ObjectId } from 'mongodb';
import { ProcessedRoute } from './gpx-types';

// MongoDB Collections

export interface DBUser {
  _id?: ObjectId;
  auth0Id: string;
  bioName: string;
  email: string;
  picture: string;
  socialLinks: {
    instagram: string;
    strava: string;
    facebook: string;
  };
  website: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBPhoto {
  _id?: ObjectId;
  filename: string;
  key: string;
  longitude: number;
  latitude: number;
  description: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface DBMap {
  _id?: ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPublic: boolean;
  gpxData?: string;
  routeData?: {
    coordinates: Array<{
      lat: number;
      lon: number;
      surface: 'paved' | 'unpaved';
    }>;
  };
  photoIds: string[];
  viewState: {
    center: [number, number];
    zoom: number;
    pitch?: number;
    bearing?: number;
  };
}

// Omit properties we want to redefine and extend ProcessedRoute
export interface DBRoute extends Omit<ProcessedRoute, 'name'> {
  _id?: ObjectId;
  name?: string;          // Make name optional
  description?: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// PostgreSQL Tables

export interface RoadNetwork {
  id: string;
  geometry: string; // PostGIS geometry type
  surface?: string;
  highway?: string;
}

export interface SurfaceClassification {
  id: number;
  original_surface: string;
  standardized_surface: string;
}

// Enums

export enum SurfaceType {
  Paved = 'paved',
  Unpaved = 'unpaved',
  Unknown = 'unknown'
}

export enum MapVisibility {
  Public = 'public',
  Private = 'private'
}

// Indexes
export const DBIndexes = {
  Users: {
    auth0Id: { unique: true },
    email: { unique: true }
  },
  Photos: {
    key: { unique: true },
    location: '2dsphere'
  },
  Maps: {
    createdBy: 1,
    isPublic: 1
  },
  Routes: {
    uploadedBy: 1
  }
} as const;