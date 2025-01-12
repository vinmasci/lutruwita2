import { SavedMap } from '../types/map-types';

// Interface for photo documents
interface PhotoDocument {
    _id: string;
    url: string;
    originalName: string;
    uploadedAt: Date;
    latitude: number;
    longitude: number;
    auth0Id: string;
    username: string;
    caption: string;
    picture: string;
}

// Save map
export async function saveMap(map: Omit<SavedMap, '_id'>): Promise<string> {
    try {
        const response = await fetch('http://localhost:3001/api/maps', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(map)
        });

        if (!response.ok) {
            throw new Error(`Failed to save map: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        return result.mapId;
    } catch (error) {
        console.error('[saveMap] Error:', error);
        throw error;
    }
}

// Get map by ID
export async function getMap(id: string): Promise<SavedMap | null> {
    try {
        const response = await fetch(`http://localhost:3001/api/maps/${id}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`Failed to get map: ${response.status} ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error('[getMap] Error:', error);
        throw error;
    }
}

// Update map
export async function updateMap(id: string, map: Partial<SavedMap>): Promise<boolean> {
    try {
        const response = await fetch(`http://localhost:3001/api/maps/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(map)
        });

        if (!response.ok) {
            throw new Error(`Failed to update map: ${response.status} ${response.statusText}`);
        }

        return true;
    } catch (error) {
        console.error('[updateMap] Error:', error);
        throw error;
    }
}

// List maps for user
export async function listMaps(userId: string): Promise<SavedMap[]> {
    try {
        const response = await fetch('http://localhost:3001/api/maps', {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Failed to list maps: ${response.status} ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error('[listMaps] Error:', error);
        throw error;
    }
}

// Find photos near a point
export async function findNearbyPhotos(longitude: number, latitude: number) {
    console.log(`[findNearbyPhotos] Fetching photos near: ${longitude}, ${latitude}`);
    try {
        const url = `http://localhost:3001/api/photos/near?longitude=${longitude}&latitude=${latitude}`;
        console.log(`[findNearbyPhotos] Request URL: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit'
        });
        
        console.log(`[findNearbyPhotos] Response status: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[findNearbyPhotos] Error response: ${errorText}`);
            throw new Error(`Failed to fetch photos: ${response.status} ${response.statusText}`);
        }
        
        const photos = await response.json();
        console.log(`[findNearbyPhotos] Found ${photos.length} photos:`, photos);
        return photos as PhotoDocument[];
    } catch (error) {
        console.error('[findNearbyPhotos] Error:', error);
        // Check if it's a network error
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.error('[findNearbyPhotos] Network error - is the server running?');
        }
        throw error;
    }
}

// Find photos near multiple points
export async function findPhotosNearPoints(points: Array<{ longitude: number, latitude: number }>) {
    console.log(`[findPhotosNearPoints] Starting to process ${points.length} points`);
    const uniquePhotos = new Map<string, PhotoDocument>();

    try {
        for (const point of points) {
            const photos = await findNearbyPhotos(point.longitude, point.latitude);
            photos.forEach(photo => {
                uniquePhotos.set(photo._id.toString(), photo);
            });
        }

        const results = Array.from(uniquePhotos.values());
        console.log(`[findPhotosNearPoints] Found ${results.length} unique photos`);
        return results;
    } catch (error) {
        console.error('[findPhotosNearPoints] Error while processing points:', error);
        throw error;
    }
}

export type { PhotoDocument, SavedMap };