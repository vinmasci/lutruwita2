import express, { 
  Express, 
  Request, 
  Response, 
  RequestHandler,
  NextFunction
} from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { auth as Auth0, requiresAuth } from 'express-openid-connect';
import fs from 'fs';
import { GpxProcessor } from './src/services/gpx-processor';
import pg from 'pg';
import { 
  ErrorResponse, 
  PhotoUploadResponse, 
  RouteUploadResponse,
  TypedRequestBody,
  TypedResponse,
  ServerProcessedRoute,
  Auth0Request,
  SafeError,
  isErrorWithMessage,
  Photo,
  SurfaceDetectionRequest,
  SurfaceDetectionResponse,
  SurfaceDetectionResult,
  Auth0User
} from './src/types/server';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import type { ProcessedRoute } from './src/types/gpx-types';
import { 
  handleError, 
  handleBadRequest, 
  handleUnauthorized, 
  handleNotFound 
} from './src/utils/error-handling';
// Import Auth0's types
import { RequestContext } from 'express-openid-connect';

// Define base types for request handling
type BaseRequest = Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>;

// Enhanced RequestWithFile type that properly extends Express types
type RequestWithFile<T = any> = Auth0Request & TypedRequestBody<T> & {
  file?: Express.Multer.File;
  query: ParsedQs;
  params: ParamsDictionary;
};

// Custom request handler type with proper typing for body, response and params
type CustomRequestHandler<ReqBody = any, ResBody = any> = (
  req: RequestWithFile<ReqBody>,
  res: TypedResponse<ResBody>,
  next: NextFunction
) => Promise<TypedResponse<ResBody> | Response<ResBody> | void>;

// Type-safe middleware wrapper with proper type propagation
const wrapHandler = <ReqBody = any, ResBody = any>(
  handler: CustomRequestHandler<ReqBody, ResBody>
): RequestHandler<ParamsDictionary, ResBody, ReqBody, ParsedQs, Record<string, any>> => {
  return async (req, res, next) => {
    try {
      const result = await handler(req as RequestWithFile<ReqBody>, res as TypedResponse<ResBody>, next);
      // Only end the response if it hasn't been ended yet and we got a result
      if (!res.headersSent && result) {
        return result;
      }
    } catch (error) {
      if (!res.headersSent) {
        if (isErrorWithMessage(error)) {
          res.status(500).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'An unknown error occurred' });
        }
      }
    }
  };
};

// Helper function to handle responses consistently
const sendResponse = <T>(res: TypedResponse<T | ErrorResponse>, data: T | ErrorResponse, status = 200) => {
  res.status(status).json(data);
};

const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  host: 'db-postgresql-syd1-03661-do-user-18256196-0.m.db.ondigitalocean.com',
  port: 25060,
  database: 'defaultdb',
  user: 'doadmin',
  password: 'AVNS_NqgCqQKrbGcdayFfg3C',
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize storage service
import { StorageService } from './src/services/storage-service';
const storageService = new StorageService();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Auth0 configuration
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: 'http://localhost:3001',
  clientID: 'hLnq0z7KNvwcORjFF9KdC4kGPtu51kVB',
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuerBaseURL: 'https://dev-8jmwfh4hugvdjwh8.au.auth0.com',
  routes: {
    callback: '/callback',
    postLogoutRedirect: 'http://localhost:5173'
  },
  authorizationParams: {
    response_type: 'code',
    scope: 'openid profile email'
  },
  session: {
    absoluteDuration: 24 * 60 * 60
  },
  logoutParams: {
    returnTo: 'http://localhost:5173'
  }
};

export const app: Express = express();

// Auth router must be set up before other routes
app.use(Auth0(config));

// Handle successful authentication
app.get('/callback', (req, res) => {
  console.log('Callback route hit - redirecting to frontend');
  res.redirect('http://localhost:5173');
});

const MONGODB_URI = process.env.VITE_MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

console.log('MongoDB URI found:', MONGODB_URI.substring(0, 20) + '...');

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  credentials: true,
  maxAge: 86400
}));

// After Auth0 middleware, but before CSP headers
app.use((req: Request, res, next) => {
  console.log('Current path:', req.path);
  console.log('Authentication state:', req.oidc ? 'User is authenticated' : 'User is not authenticated');
  console.log('User info:', req.oidc?.user);
  
  if (req.path === '/' && req.oidc?.isAuthenticated()) {
    console.log('User authenticated, redirecting to frontend');
    return res.redirect('http://localhost:5173');
  }
  next();
});

// Add CSP headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'"
  );
  next();
});

// Add OPTIONS handling for preflight requests
app.options('*', cors());
app.use(express.json({limit: '12mb'}));
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.memoryStorage();

const photoUpload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const gpxUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.gpx')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only GPX files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for GPX files
  }
});

const client = new MongoClient(MONGODB_URI);

// Upload photo endpoint
const uploadPhoto: CustomRequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { longitude, latitude, description } = req.body as { longitude: string; latitude: string; description?: string };
    
    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    // Upload to DO Spaces
    const key = await storageService.uploadFile(req.file, 'photos');

    await client.connect();
    const db = client.db('photoApp');
    const result = await db.collection('photos').insertOne({
      filename: req.file.originalname,
      key: key,
      longitude: Number(longitude),
      latitude: Number(latitude),
      description: description || '',
      uploadedAt: new Date()
    });

    res.json({ 
      success: true, 
      photoId: result.insertedId,
      key: key
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: isErrorWithMessage(error) ? error.message : 'Unknown error occurred' });
  }
};

app.post('/api/photos/upload', photoUpload.single('photo'), uploadPhoto);

const getPhotosNear: CustomRequestHandler = async (req, res) => {
  try {
    const { longitude, latitude } = req.query as { longitude: string; latitude: string };
    
    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    await client.connect();
    const db = client.db('photoApp');
    
    console.log(`Searching for photos near: ${longitude}, ${latitude}`);
    
    const photos = await db.collection<Photo>('photos').find({
      $and: [
        {
          longitude: {
            $gte: Number(longitude) - 0.005,
            $lte: Number(longitude) + 0.005
          }
        },
        {
          latitude: {
            $gte: Number(latitude) - 0.005,
            $lte: Number(latitude) + 0.005
          }
        }
      ]
    }).toArray();

    console.log(`Found ${photos.length} photos`);
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: isErrorWithMessage(error) ? error.message : 'Unknown error occurred' });
  }
};

app.get('/api/photos/near', getPhotosNear);

// Unified GPX Upload and Processing Endpoint
const uploadRoute: CustomRequestHandler = async (req, res) => {
  try {
    console.log('Route upload request received');

    if (!req.file) {
      return handleBadRequest('No file uploaded', res);
    }

    // 1. Process GPX file
    const processor = new GpxProcessor();
    const route = await processor.processGpx(req.file.buffer, req.file.originalname) as ProcessedRoute;
    console.log('GPX processed successfully');

    // 2. Detect surfaces using PostGIS
    if (!route.geojson?.features?.[0]?.geometry || route.geojson.features[0].geometry.type !== 'LineString') {
      return handleBadRequest('Invalid GPX file format', res);
    }

    const lineString = {
      type: 'LineString',
      coordinates: (route.geojson.features[0].geometry as LineString).coordinates
    };

    const surfaceQuery = await pool.query(`
      SELECT 
        COALESCE(sc.standardized_surface, COALESCE(rn.surface, 'unpaved')) as surface,
        ST_AsGeoJSON(ST_Intersection(rn.geometry, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))) as segment,
        ST_Length(ST_Intersection(rn.geometry, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))::geography) as distance
      FROM road_network rn
      LEFT JOIN surface_classifications sc ON rn.surface = sc.original_surface
      WHERE ST_Intersects(rn.geometry, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
      ORDER BY ST_LineLocatePoint(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), ST_StartPoint(rn.geometry))
    `, [JSON.stringify(lineString)]);

    console.log('Surface detection completed');

    // 3. Save route with surface information
    await client.connect();
    const db = client.db('photoApp');
    const result = await db.collection('routes').insertOne({
      ...route,
      uploadedBy: req.oidc?.user?.sub || 'anonymous',
      uploadedAt: new Date()
    });

    console.log('Route saved successfully');

    const serverRoute: ServerProcessedRoute = {
      ...route,
      uploadedBy: req.oidc?.user?.sub || 'anonymous',
      uploadedAt: new Date(),
      id: result.insertedId.toString(),
      color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
      isVisible: true,
      gpxData: req.file.buffer.toString()
    };

    res.json({
      success: true,
      routeId: result.insertedId,
      route: serverRoute
    });
  } catch (error) {
    handleError(error, res);
  }
};

app.post('/api/routes', requiresAuth(), gpxUpload.single('gpx'), uploadRoute);

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Add profile endpoint
// Get profile data
const getProfile: CustomRequestHandler = async (req, res) => {
  try {
    if (!req.oidc?.user?.sub) {
      return handleUnauthorized('User not authenticated', res);
    }

    console.log('Fetching profile for user:', req.oidc.user.sub);
    await client.connect();
    const db = client.db('photoApp');
    const user = await db.collection('users').findOne({ 
      auth0Id: req.oidc.user.sub 
    });
    
    console.log('Found user in MongoDB:', user);
    
    if (!user) {
      console.log('No user found, creating new user');
      // Create new user if doesn't exist
      const newUser = {
        auth0Id: req.oidc.user.sub,
        bioName: req.oidc.user.name,
        email: req.oidc.user.email,
        picture: req.oidc.user.picture.replace('=s96-c', ''),
        socialLinks: {
          instagram: '',
          strava: '',
          facebook: ''
        },
        website: '',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('users').insertOne(newUser);
      console.log('Created new user:', newUser);
      res.json(newUser);
    } else {
      console.log('Returning existing user:', user);
      res.json(user);
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: isErrorWithMessage(error) ? error.message : 'Failed to fetch profile' });
  }
};

app.get('/api/profile', requiresAuth(), getProfile);

// Update profile data
const updateProfile: CustomRequestHandler = async (req, res) => {
  try {
    if (!req.oidc?.user?.sub) {
      return handleUnauthorized('User not authenticated', res);
    }

    console.log('Updating profile for user:', req.oidc.user.sub);
    console.log('Update data received:', req.body);
    
    await client.connect();
    const db = client.db('photoApp');
    
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    console.log('Final update data:', updateData);

    const result = await db.collection('users').updateOne(
      { auth0Id: req.oidc.user.sub },
      { $set: updateData }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      console.log('No user found to update');
      return handleNotFound('User not found', res);
    } else {
      console.log('Profile updated successfully');
      res.json({ message: 'Profile updated successfully' });
    }
  } catch (error) {
    console.error('Detailed error in profile update:', error);
    res.status(500).json({ error: isErrorWithMessage(error) ? error.message : 'Failed to update profile' });
  }
};

app.put('/api/profile', requiresAuth(), updateProfile);

// New Map Endpoints
// Create new map
const createMap: CustomRequestHandler = async (req, res) => {
  try {
    if (!req.oidc?.user?.sub) {
      return handleUnauthorized('User not authenticated', res);
    }

    console.log('Creating new map for user:', req.oidc.user.sub);
    console.log('Received map data:', JSON.stringify(req.body, null, 2));
    console.log('Photos in received data:', req.body.photos);
    
    const mapData = {
      ...req.body,
      createdBy: req.oidc.user.sub,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('Final map data to save:', mapData);

    await client.connect();
    const db = client.db('photoApp');
    const result = await db.collection('maps').insertOne(mapData);

    console.log('Map created:', result.insertedId);
    res.json({ 
      success: true,
      mapId: result.insertedId,
      map: mapData 
    });
  } catch (error) {
    console.error('Error creating map:', error);
    res.status(500).json({ error: isErrorWithMessage(error) ? error.message : 'Failed to create map' });
  }
};

app.post('/api/maps', requiresAuth(), createMap);

// Get all maps for user
const getMaps: CustomRequestHandler = async (req, res) => {
  try {
    if (!req.oidc?.user?.sub) {
      return handleUnauthorized('User not authenticated', res);
    }

    console.log('Fetching maps for user:', req.oidc.user.sub);
    await client.connect();
    const db = client.db('photoApp');
    const maps = await db.collection('maps')
      .find({ createdBy: req.oidc.user.sub })
      .sort({ updatedAt: -1 })
      .toArray();

    console.log(`Found ${maps.length} maps`);
    res.json(maps);
  } catch (error) {
    console.error('Error fetching maps:', error);
    res.status(500).json({ error: isErrorWithMessage(error) ? error.message : 'Failed to fetch maps' });
  }
};

app.get('/api/maps', requiresAuth(), getMaps);

// Update specific map
const updateMap: CustomRequestHandler = async (req, res) => {
  try {
    if (!req.oidc?.user?.sub) {
      return handleUnauthorized('User not authenticated', res);
    }

    console.log('Updating map:', req.params.id);
    await client.connect();
    const db = client.db('photoApp');
    const result = await db.collection('maps').updateOne(
      { 
        _id: new ObjectId(req.params.id),
        createdBy: req.oidc.user.sub
      },
      { 
        $set: {
          ...req.body,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      console.log('Map not found or unauthorized');
      return handleNotFound('Map not found or unauthorized', res);
    }

    console.log('Map updated successfully');
    res.json({ message: 'Map updated successfully' });
  } catch (error) {
    console.error('Error updating map:', error);
    res.status(500).json({ error: isErrorWithMessage(error) ? error.message : 'Failed to update map' });
  }
};

app.put('/api/maps/:id', requiresAuth(), updateMap);

// Delete map
const deleteMap: CustomRequestHandler = async (req, res) => {
  try {
    if (!req.oidc?.user?.sub) {
      return handleUnauthorized('User not authenticated', res);
    }

    console.log('Deleting map:', req.params.id);
    await client.connect();
    const db = client.db('photoApp');
    const result = await db.collection('maps').deleteOne({
      _id: new ObjectId(req.params.id),
      createdBy: req.oidc.user.sub
    });

    if (result.deletedCount === 0) {
      console.log('Map not found or unauthorized');
      return handleNotFound('Map not found or unauthorized', res);
    }

    console.log('Map deleted successfully');
    res.json({ message: 'Map deleted successfully' });
  } catch (error) {
    console.error('Error deleting map:', error);
    res.status(500).json({ error: isErrorWithMessage(error) ? error.message : 'Failed to delete map' });
  }
};

app.delete('/api/maps/:id', requiresAuth(), deleteMap);

// Surface Detection Endpoints
const detectSurface: CustomRequestHandler = async (req, res) => {
  try {
    const { route } = req.body as { route: { coordinates: [number, number][] } };
    console.log('Received route:', route);
    
    if (!route?.coordinates) {
      console.error('Invalid route format received');
      return res.status(400).json({ error: 'Invalid route format' });
    }

    // Process points in batches to avoid overwhelming the database
    const BATCH_SIZE = 10;
    const results: any[] = [];
    
    for (let i = 0; i < route.coordinates.length; i += BATCH_SIZE) {
      const batch = route.coordinates.slice(i, i + BATCH_SIZE);
      const batchQueries = batch.map(([lon, lat]) => {
        return pool.query(`
          SELECT 
            rn.id,
            COALESCE(sc.standardized_surface, COALESCE(rn.surface, NULL)) as surface,
            rn.highway,
            ST_Distance(rn.geometry::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance_meters
          FROM road_network rn
          LEFT JOIN surface_classifications sc ON rn.surface = sc.original_surface
          WHERE ST_DWithin(
            rn.geometry::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            5
          )
          ORDER BY rn.geometry::geography <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography;
        `, [lon, lat]);
      });

      const batchResults = await Promise.all(batchQueries);
      batchResults.forEach(result => {
        results.push(result.rows);
      });

      // Small delay between batches to prevent overwhelming the database
      if (i + BATCH_SIZE < route.coordinates.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('Surface detection error:', error);
    res.status(500).json({ error: isErrorWithMessage(error) ? error.message : 'Failed to detect surfaces' });
  }
};

app.post('/api/surface-detection', detectSurface);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
