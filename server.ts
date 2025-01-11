import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();
app.use(cors());

const MONGODB_URI = process.env.MONGODB_URI;
const client = new MongoClient(MONGODB_URI);

app.get('/api/photos/near', async (req, res) => {
  try {
    const { longitude, latitude } = req.query;
    const db = client.db('photoApp');
    
    const photos = await db.collection('photos').aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)]
          },
          distanceField: "distance",
          maxDistance: 500,
          spherical: true
        }
      }
    ]).toArray();
    
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});