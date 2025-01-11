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

const app = express();

// Auth router must be set up before other routes
app.use(Auth0(config));

// Handle successful authentication
app.get('/callback', (req, res) => {
  console.log('Callback route hit - redirecting to frontend');
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
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  credentials: true,
  maxAge: 86400
}));

// After Auth0 middleware, but before CSP headers
app.use((req, res, next) => {
  console.log('Current path:', req.path);
  console.log('Authentication state:', req.oidc ? 'User is authenticated' : 'User is not authenticated');
  console.log('User info:', req.oidc?.user);
  
  if (req.path === '/' && req.oidc.isAuthenticated()) {
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
// Get profile data
app.get('/api/profile', requiresAuth(), async (req, res) => {
  try {
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
        picture: req.oidc.user.picture,
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
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile data
app.put('/api/profile', requiresAuth(), async (req, res) => {
  try {
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
      res.status(404).json({ error: 'User not found' });
    } else {
      console.log('Profile updated successfully');
      res.json({ message: 'Profile updated successfully' });
    }
  } catch (error) {
    console.error('Detailed error in profile update:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('- GET  /api/photos/near');
  console.log('- POST /api/photos/upload');
  console.log('- GET  /api/profile (requires auth)');
  console.log('- PUT  /api/profile (requires auth)'); // Add this line
  console.log('- GET  /health');
});