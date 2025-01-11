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

// Get MongoDB connection
async function getMongoClient() {
  if (client) return client;

  const uri = import.meta.env.VITE_MONGODB_URI;
  if (!uri) throw new Error('MongoDB URI not found in environment variables');

  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  await client.connect();
  return client;
}

// Find photos near a point
export async function findNearbyPhotos(longitude: number, latitude: number, radiusInMeters: number = 500) {
  const client = await getMongoClient();
  const db = client.db('photoApp');

  const photos = await db.collection('photos').aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        distanceField: "distance",
        maxDistance: radiusInMeters,
        spherical: true
      }
    }
  ]).toArray() as PhotoDocument[];

  return photos;
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