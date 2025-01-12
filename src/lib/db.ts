import { MongoClient, ServerApiVersion } from 'mongodb';
import { SavedMap } from '../types/map-types';

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

// Connect to MongoDB
async function connectToDatabase() {
    if (client) return client;
    
    client = new MongoClient(process.env.VITE_MONGODB_URI || '');
    await client.connect();
    return client;
}

// Save map
export async function saveMap(map: Omit<SavedMap, '_id'>): Promise<string> {
    const db = (await connectToDatabase()).db('photoApp');
    const result = await db.collection('maps').insertOne({
        ...map,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    return result.insertedId.toString();
}

// Get map by ID
export async function getMap(id: string): Promise<SavedMap | null> {
    const db = (await connectToDatabase()).db('photoApp');
    return db.collection('maps').findOne({ _id: id });
}

// Update map
export async function updateMap(id: string, map: Partial<SavedMap>): Promise<boolean> {
    const db = (await connectToDatabase()).db('photoApp');
    const result = await db.collection('maps').updateOne(
        { _id: id },
        { 
            $set: {
                ...map,
                updatedAt: new Date()
            }
        }
    );
    return result.matchedCount > 0;
}

// List maps for user
export async function listMaps(userId: string): Promise<SavedMap[]> {
    const db = (await connectToDatabase()).db('photoApp');
    return db.collection('maps')
        .find({ createdBy: userId })
        .sort({ updatedAt: -1 })
        .toArray();
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