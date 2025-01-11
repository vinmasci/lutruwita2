import { MongoClient, ServerApiVersion } from 'mongodb';

// Cache the MongoDB connection
let client: MongoClient | null = null;

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
  
  // Find photos near a point
  export async function findNearbyPhotos(longitude: number, latitude: number) {
    const response = await fetch(`http://localhost:3001/api/photos/near?longitude=${longitude}&latitude=${latitude}`);
    if (!response.ok) {
      throw new Error('Failed to fetch photos');
    }
    return response.json() as Promise<PhotoDocument[]>;
  }
  
  // Find photos near multiple points
  export async function findPhotosNearPoints(points: Array<{ longitude: number, latitude: number }>) {
    const uniquePhotos = new Map<string, PhotoDocument>();
  
    for (const point of points) {
      const photos = await findNearbyPhotos(point.longitude, point.latitude);
      photos.forEach(photo => {
        uniquePhotos.set(photo._id.toString(), photo);
      });
    }
  
    return Array.from(uniquePhotos.values());
  }
  
  export type { PhotoDocument };