import type { PhotoDocument } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export class PhotoService {
    static async findPhotosNearPoints(points: Array<{ latitude: number; longitude: number }>): Promise<PhotoDocument[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/photos/near-points`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ points }),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch photos');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching photos:', error);
            return [];
        }
    }
}