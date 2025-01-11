const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

console.log('MongoDB URI found:', MONGODB_URI.substring(0, 20) + '...');

const app = express();
app.use(cors());
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
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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

const MONGODB_URI = process.env.MONGODB_URI;
const client = new MongoClient(MONGODB_URI);

// Upload photo endpoint
interface PhotoUploadRequest extends Request {
  file?: Express.Multer.File;
  body: {
    longitude: string;
    latitude: string;
    description?: string;
  };
}

interface PhotoQueryRequest extends Request {
  query: {
    longitude?: string;
    latitude?: string;
  };
}

app.post('/api/photos/upload', upload.single('photo'), async (req: PhotoUploadRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { longitude, latitude, description } = req.body;
    
    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    const db = client.db('photoApp');
    const result = await db.collection('photos').insertOne({
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)]
      },
      description: description || '',
      uploadedAt: new Date()
    });

    res.json({ 
      success: true, 
      photoId: result.insertedId,
      path: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/photos/near', async (req: PhotoQueryRequest, res: Response) => {
  try {
    const { longitude, latitude } = req.query;
    
    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    const db = client.db('photoApp');
    
    console.log(`Searching for photos near: ${longitude}, ${latitude}`);
    
    // Simple distance-based query since we're storing lat/lon directly
    const photos = await db.collection('photos').find({
      $and: [
        {
          longitude: {
            $gte: Number(longitude) - 0.005,  // Roughly 500m at equator
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
    
    // Photos already have url field, so we don't need to transform
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
