import { SavedMap } from '../types/map-types';

interface CreateMapData {
  name: string;
  description: string;
  isPublic: boolean;
  viewState: {
    center: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
  };
  mapStyle: string;
  routes: Array<{
    id: string;
    name: string;
    color: string;
    isVisible: boolean;
    gpxData: string;
  }>;
  photos: Array<{
    id: string;
    url: string;
    caption?: string;
    longitude: number;
    latitude: number;
  }>;
  routeData: {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      properties: {
        surface: string;
        segmentIndex: number;
      };
      geometry: {
        type: 'LineString';
        coordinates: number[][];
      };
    }>;
  };
}

const API_BASE = 'http://localhost:3001/api';

export const mapService = {
  // Create new map
  async createMap(mapData: CreateMapData) {
    try {
      console.log('Creating map with data:', mapData); // Debug log
      
      const response = await fetch(`${API_BASE}/maps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(mapData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      if (responseData.success) {
        // Show response in console for debugging
        console.log('Map saved successfully:', responseData);
        return responseData;
      } else {
        throw new Error(responseData.error || 'Failed to save map');
      }
    } catch (error) {
      console.error('Error in createMap:', error);
      throw error;
    }
  },

  // Rest of the service methods remain the same
  async getMaps() {
    const response = await fetch(`${API_BASE}/maps`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async getMap(id: string) {
    const response = await fetch(`${API_BASE}/maps/${id}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async updateMap(id: string, mapData: Partial<SavedMap>) {
    const response = await fetch(`${API_BASE}/maps/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(mapData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async deleteMap(id: string) {
    const response = await fetch(`${API_BASE}/maps/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
};
