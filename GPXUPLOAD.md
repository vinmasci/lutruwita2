# GPX Upload and Processing Documentation

## Overview
We are migrating the GPX file processing from client-side to server-side using Digital Ocean. This will improve performance, reduce client workload, and enable more sophisticated processing capabilities. The main goals are:
1. Move file upload and processing to Digital Ocean
2. Implement server-side surface detection using PostGIS
3. Add efficient caching and optimization
4. Improve error handling and user feedback

## Completed Tasks

### Client-Side Structure
- ✅ Separated GPX processing logic from MapContainer
- ✅ Created GPX processing hook (useGpxProcessing)
- ✅ Created route rendering hook (useRouteRendering)
- ✅ Added cleanup for photo markers and event listeners
- ✅ Moved environment variables to .env.local
- ✅ Added proper error handling in client components
- ✅ Added progress indicators for processing
- ✅ Improved route data management

### API Structure
- ✅ Defined API endpoints
- ✅ Created GPX service class
- ✅ Added PhotoService for photo handling
- ✅ Created basic type definitions

## Pending Tasks

### 1. Digital Ocean Setup
- [x] Create new DO project
- [x] Set up PostgreSQL with PostGIS extension
- [x] Configure Spaces bucket for file storage
  - [x] Enable CDN
  - [x] Configure CORS
  - [x] Set up access keys
- [ ] Set up App Platform for backend service
- [ ] Configure environment variables for production

### 2. Database Setup
- [x] Create routes table
- [x] Create photos table
- [x] Create POI tables
- [x] Create place tables
- [x] Set up spatial indexes
- [ ] Create migrations
- [ ] Add database backup configuration

### 2A. Next Steps
- [ ] Configure App Platform
  - [ ] Set up Node.js environment
  - [ ] Configure auto-deployments
  - [ ] Set up environment variables
- [ ] Implement server endpoints
  - [ ] File upload handling
  - [ ] Route processing
  - [ ] Photo management
  - [ ] POI management
- [ ] Add monitoring and logging
  - [ ] Set up error tracking
  - [ ] Configure performance monitoring
  - [ ] Implement logging system

### NEXT STEPS:
First, let's set "File Listing" to "Restricted" instead of "Enabled" for security (click "Edit" next to File Listing)
You already have an access key "gravelmap...." with all permissions which we can use in your application.

### 3. API Endpoints to Implement
```typescript
POST /api/gpx/upload
- Handle file upload to DO Spaces
- Initial validation
- Return upload ID

POST /api/gpx/process/:id
- Parse GPX file
- Detect surface types
- Process elevation data
- Return processing status

GET /api/gpx/status/:id
- Return current processing status
- Include progress information

GET /api/gpx/route/:id
- Return processed route data
- Include surface information

POST /api/photos/near-points
- Find photos near route points
- Return photo metadata
```

### 4. Server-Side Processing
- [ ] Implement GPX parsing service
- [ ] Add surface detection using PostGIS
- [ ] Create route optimization service
- [ ] Add elevation profile generation
- [ ] Implement photo proximity detection
- [ ] Add processing queue system

### 5. Error Handling & Security
- [ ] Add rate limiting
- [ ] Implement request validation
- [ ] Set up proper CORS configuration
- [ ] Add file size limits
- [ ] Add file type validation
- [ ] Configure secure file storage
- [ ] Add error reporting system

### 6. Performance Optimizations
- [ ] Add Redis caching layer
- [ ] Optimize database queries
- [ ] Implement batch processing
- [ ] Add lazy loading for photos
- [ ] Configure CDN for static assets

## Required Environment Variables
```bash
# Client
VITE_API_BASE_URL=http://localhost:3001
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_MAPTILER_KEY=your_maptiler_key

# Server
DATABASE_URL=postgres://user:pass@host:5432/db
DO_SPACES_KEY=your_spaces_key
DO_SPACES_SECRET=your_spaces_secret
DO_SPACES_BUCKET=your_bucket_name
DO_SPACES_ENDPOINT=your_endpoint
```

## Next Steps

1. Initial Server Setup
   - Set up Digital Ocean project
   - Create basic Express server
   - Configure database connection
   - Set up file upload endpoint

2. Database Migration
   - Design schema
   - Create migrations
   - Add indexes
   - Test performance

3. Processing Pipeline
   - Implement file processing queue
   - Add surface detection
   - Set up photo processing
   - Add caching

4. Client Updates
   - Update API calls
   - Add better error handling
   - Improve progress indicators
   - Update tests

## Notes
- The server needs to handle large GPX files efficiently
- Surface detection should use PostGIS spatial queries
- All file operations should be asynchronous
- Processing should be queued for large files
- Add proper logging for debugging
- Consider implementing retry logic for failed operations
- Cache commonly accessed routes
- Add monitoring for server health