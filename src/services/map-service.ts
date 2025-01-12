import { SavedMap } from '../types/map-types';

const API_BASE = 'http://localhost:3001/api';

export const mapService = {
  // Create new map
  async createMap(mapData: Omit<SavedMap, '_id' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
    const response = await fetch(`${API_BASE}/maps`, {
      method: 'POST',
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

  // Get all maps
  async getMaps() {
    const response = await fetch(`${API_BASE}/maps`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Get specific map
  async getMap(id: string) {
    const response = await fetch(`${API_BASE}/maps/${id}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Update map
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

  // Delete map
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