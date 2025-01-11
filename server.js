import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { auth as Auth0 } from 'express-openid-connect';
import pkg from 'express-openid-connect';
const { requiresAuth } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Auth0 configuration
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: 'http://localhost:3001',
  clientID: 'hLnq0z7KNvwcORjFF9KdC4kGPtu51kVB',
  clientSecret: process.env.AUTH0_CLIENT_SECRET, // Add this line
  issuerBaseURL: 'https://dev-8jmwfh4hugvdjwh8.au.auth0.com',
  routes: {
    callback: '/callback'
  },
  authorizationParams: {
    response_type: 'code',
    audience: 'https://dev-8jmwfh4hugvdjwh8.au.auth0.com/api/v2/',
    scope: 'openid profile email'
  },
  session: {
    absoluteDuration: 24 * 60 * 60 // 24 hours in seconds
  }
};

const app = express();

// Auth router must be set up before other routes
app.use(Auth0(config));

// Handle successful authentication
app.post('/callback', (req, res) => {
  // After successful authentication, redirect to frontend with session info
  res.redirect('http://localhost:5173');
});

const MONGODB_URI = process.env.VITE_MONGODB_URI; // Changed to match your .env.local
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

console.log('MongoDB URI found:', MONGODB_URI.substring(0, 20) + '...');

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  credentials: true,
  maxAge: 86400 // Cache preflight requests for 24 hours
}));

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
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = file.originalname ? path.extname(file.originalname) : '';
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
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

const client = new MongoClient(MONGODB_URI);

// Upload photo endpoint
app.post('/api/photos/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { longitude, latitude, description } = req.body;
    
    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    await client.connect();
    const db = client.db('photoApp');
    const result = await db.collection('photos').insertOne({
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      longitude: Number(longitude),
      latitude: Number(latitude),
      description: description || '',
      uploadedAt: new Date()
    });

    res.json({ 
      success: true, 
      photoId: result.insertedId,
      path: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/photos/near', async (req, res) => {
  try {
    const { longitude, latitude } = req.query;
    
    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    await client.connect();
    const db = client.db('photoApp');
    
    console.log(`Searching for photos near: ${longitude}, ${latitude}`);
    
    const photos = await db.collection('photos').find({
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
    res.status(500).json({ error: error.message });
  }
});

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Add profile endpoint
app.get('/api/profile', requiresAuth(), (req, res) => {
  res.json(req.oidc.user);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('- GET  /api/photos/near');
  console.log('- POST /api/photos/upload');
  console.log('- GET  /api/profile (requires auth)');
  console.log('- GET  /health');
});