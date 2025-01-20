import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';
import { TestContext } from '../../types/test-types';
import { RouteUploadResponse } from '../../types/server';

// File size limit from server configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Import app without starting the server
import { app } from '../../../server.js';

describe('Route Upload Integration Tests', () => {
  let testContext: TestContext;

  beforeAll(async () => {
    // Setup test database connections
    const mongoClient = new MongoClient(process.env.VITE_MONGODB_URI);
    await mongoClient.connect();

    const pgPool = new Pool({
      host: process.env.PG_HOST,
      port: parseInt(process.env.PG_PORT, 10),
      database: process.env.PG_DATABASE,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      ssl: {
        rejectUnauthorized: false
      }
    });

    testContext = { mongoClient, pgPool };
  });

  afterAll(async () => {
    // Clean up test data
    const db = testContext.mongoClient.db('photoApp');
    await db.collection('routes').deleteMany({
      // Only delete test routes
      name: { $regex: /^test-route/ }
    });
    
    await testContext.mongoClient.close();
    await testContext.pgPool.end();
  });

  describe('POST /api/routes', () => {
    it('should successfully process and store a valid GPX file', async () => {
      // Read test GPX file
      const gpxFile = fs.readFileSync(path.join(__dirname, '../../../uploads/1736662353807-164831248.gpx'));

      const response = await request(app)
        .post('/api/routes')
        .attach('gpx', gpxFile, 'test-route.gpx')
        .set('Authorization', `Bearer ${process.env.TEST_AUTH_TOKEN}`);

      expect(response.status).toBe(200);
      const body = response.body as RouteUploadResponse;
      expect(body).toMatchObject({
        success: true,
        route: {
          name: expect.any(String),
          segments: expect.any(Array),
          geojson: {
            type: 'FeatureCollection',
            features: expect.any(Array)
          },
          surfaces: expect.arrayContaining([
            expect.objectContaining({
              surface: expect.any(String),
              distance: expect.any(Number)
            })
          ])
        }
      });

      // Verify route properties
      const processedRoute = body.route;
      expect(processedRoute.segments.length).toBeGreaterThan(0);
      
      // Check geojson if present
      if (processedRoute.geojson) {
        expect(processedRoute.geojson.features.length).toBeGreaterThan(0);
      }
      
      // Check surfaces if present
      if (processedRoute.surfaces) {
        expect(processedRoute.surfaces.length).toBeGreaterThan(0);
        processedRoute.surfaces.forEach(surface => {
          expect(surface).toMatchObject({
            surface: expect.any(String),
            distance: expect.any(Number)
          });
        });
      }

      // Verify MongoDB storage
      const db = testContext.mongoClient.db('photoApp');
      const savedRoute = await db.collection('routes').findOne({
        _id: body.routeId
      });
      expect(savedRoute).toBeDefined();
      if (!savedRoute) {
        throw new Error('Route not found in database');
      }
      expect(savedRoute.segments).toHaveLength(body.route.segments.length);

      // Verify surface detection results
      if (body.route.surfaces) {
        expect(body.route.surfaces).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              surface: expect.any(String),
              distance: expect.any(Number)
            })
          ])
        );
      }
    });

    it('should handle file size exceeding limit', async () => {
      // Create a large file that exceeds MAX_FILE_SIZE
      const largeFile = Buffer.alloc(MAX_FILE_SIZE + 1024, 'x');

      const response = await request(app)
        .post('/api/routes')
        .attach('gpx', largeFile, 'large-file.gpx')
        .set('Authorization', `Bearer ${process.env.TEST_AUTH_TOKEN}`);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: expect.stringContaining('file size')
      });
    });

    it('should handle invalid file type', async () => {
      const invalidFile = Buffer.from('not a gpx file');

      const response = await request(app)
        .post('/api/routes')
        .attach('gpx', invalidFile, 'invalid.txt')
        .set('Authorization', `Bearer ${process.env.TEST_AUTH_TOKEN}`);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: expect.stringContaining('file type')
      });
    });

    it('should handle invalid GPX file format', async () => {
      const invalidFile = Buffer.from('invalid gpx content');

      const response = await request(app)
        .post('/api/routes')
        .attach('gpx', invalidFile, 'invalid.gpx')
        .set('Authorization', `Bearer ${process.env.TEST_AUTH_TOKEN}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing file in request', async () => {
      const response = await request(app)
        .post('/api/routes')
        .set('Authorization', `Bearer ${process.env.TEST_AUTH_TOKEN}`);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'No file uploaded'
      });
    });

    it('should handle unauthorized requests', async () => {
      const gpxFile = fs.readFileSync(path.join(__dirname, '../../../uploads/1736662353807-164831248.gpx'));

      const response = await request(app)
        .post('/api/routes')
        .attach('gpx', gpxFile, 'test-route.gpx');

      expect(response.status).toBe(401);
    });

    it('should handle database connection errors gracefully', async () => {
      // Temporarily break database connection
      await testContext.mongoClient.close();

      const gpxFile = fs.readFileSync(path.join(__dirname, '../../../uploads/1736662353807-164831248.gpx'));

      const response = await request(app)
        .post('/api/routes')
        .attach('gpx', gpxFile, 'test-route.gpx')
        .set('Authorization', `Bearer ${process.env.TEST_AUTH_TOKEN}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');

      // Restore connection for other tests
      await testContext.mongoClient.connect();
    });
  });
});
