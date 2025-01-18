# GPX Upload and Processing Documentation

## Current Implementation

### Client-Side Components

1. **GpxUploader Component** (`src/components/ui/gpx-uploader.tsx`)
- Handles file selection UI
- Validates file type (.gpx)
- Displays upload progress
- Uses hooks for processing status

2. **MapContainer** (`src/components/ui/map-container.tsx`)
- Manages map state and rendering
- Handles route visualization
- Integrates with photo markers and POIs

3. **Hooks**
- `useGpxProcessing`: Manages GPX processing state and operations
- `useRouteRendering`: Handles route visualization on the map

### Processing Flow

1. **File Upload**
```typescript
const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file || !file.name.toLowerCase().endsWith('.gpx')) return;
  
  const route = await processGpxFile(file);
  if (route) {
    addRouteToMap(route);
  }
};
```

2. **GPX Processing**
- File is uploaded to server
- Content is parsed for coordinates
- Route segments are created
- Photos near route are fetched
- Surface types are detected (currently disabled)

3. **Route Rendering**
- Route is split into segments
- Each segment is styled based on surface type
- Distance markers are added
- Photo markers are clustered and added

## Planned Server-Side Implementation

### Server Components

1. **Upload Endpoint**
```typescript
POST /api/gpx/upload
- Accepts GPX file
- Returns file path and processing ID
```

2. **Processing Service**
```typescript
interface ProcessingService {
  parseGpx(filePath: string): Promise<GpxPoints[]>;
  detectSurfaces(points: GpxPoint[]): Promise<RouteSegment[]>;
  optimizeRoute(segments: RouteSegment[]): Promise<ProcessedRoute>;
}
```

3. **Status Endpoint**
```typescript
GET /api/gpx/status/:id
- Returns processing status and progress
```

4. **Route Endpoint**
```typescript
GET /api/gpx/route/:id
- Returns processed route data
```

### Database Schema

```typescript
interface SavedRoute {
  id: string;
  name: string;
  originalFilePath: string;
  processedData: {
    segments: RouteSegment[];
    totalDistance: number;
    elevationProfile?: ElevationPoint[];
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    isPublic: boolean;
  };
}

interface RouteSegment {
  points: GpxPoint[];
  surface: 'paved' | 'unpaved';
  properties?: {
    grade?: number;
    elevation?: number;
  };
}
```

### Missing Components To Be Implemented

1. **Surface Detection Service**
- PostGIS integration for road matching
- Improved accuracy with multiple data sources
- Caching of common routes

2. **Optimization Service**
- Route simplification for better performance
- Elevation data processing
- Grade calculation

3. **Error Handling**
- Retry logic for failed uploads
- Graceful degradation of features
- User feedback mechanisms

4. **Performance Optimizations**
- Batch processing of points
- Worker threads for heavy processing
- Response caching

### Infrastructure Requirements

1. **DigitalOcean Setup**
- App Platform for backend service
- Managed PostgreSQL with PostGIS
- Spaces bucket for file storage
- Load balancer configuration

2. **Environment Variables**
```bash
VITE_API_BASE_URL=http://localhost:3001
POSTGRES_URL=postgres://user:pass@host:5432/db
DO_SPACES_KEY=your_key
DO_SPACES_SECRET=your_secret
```

3. **API Rate Limiting**
```typescript
const rateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};
```

## Migration Steps

1. Create server infrastructure
2. Implement core API endpoints
3. Migrate processing logic to server
4. Update client to use new endpoints
5. Add error handling and feedback
6. Implement optimization features
7. Add monitoring and logging

## Security Considerations

1. File validation
2. User authentication
3. Rate limiting
4. CORS configuration
5. Input sanitization

## Future Improvements

1. Support for different file formats
2. Batch upload capabilities
3. Real-time processing updates
4. Advanced route analysis
5. Integration with external services
6. Mobile optimization

### UPDATE:
# GPX Upload - Remaining Tasks

## Client-Side Tasks
1. Photo Service Integration
   - Set up PhotoService endpoints
   - Update addPhotoMarkersToMap to use new service
   - Add error handling for failed photo fetches

2. Environment Variables
   - Ensure all API keys are in .env.local
   - Add proper typings for environment variables
   - Add validation checks for required env vars

3. Cleanup Improvements
   - Add proper cleanup for all markers
   - Add cleanup for map event listeners
   - Handle component unmounting better

## Server-Side Tasks
1. Initial Setup
   - Create Digital Ocean project
   - Set up PostgreSQL with PostGIS
   - Set up Spaces bucket for file storage
   - Configure App Platform

2. Database Setup
   - Create routes table
   - Create photos table
   - Set up spatial indexes
   - Create API schemas

3. API Endpoints Needed
   ```
   POST /api/gpx/upload
   - Handle file upload to DO Spaces
   - Validate GPX content
   - Return upload status and path
   
   GET /api/gpx/status/:id
   - Return processing status
   - Include progress information
   
   GET /api/gpx/route/:id
   - Return processed route data
   - Include surface information
   
   POST /api/photos/near-points
   - Find photos near route points
   - Return photo metadata
   ```

4. Processing Service
   - GPX parsing service
   - Surface detection using PostGIS
   - Route optimization
   - Photo proximity detection
   - Queue system for processing

## Security Tasks
1. API Security
   - Add rate limiting
   - Add request validation
   - Set up CORS properly
   - Add authentication

2. File Handling
   - Add file size limits
   - Add file type validation
   - Add virus scanning
   - Set up secure file storage

## Performance Tasks
1. Optimization
   - Add caching layer
   - Optimize database queries
   - Add batch processing
   - Implement lazy loading

2. Error Handling
   - Add retry logic
   - Add proper error reporting
   - Add user feedback mechanisms
   - Add logging system

## Next Steps
1. Set up Digital Ocean infrastructure
2. Create basic server with file upload endpoint
3. Move GPX processing to server
4. Set up photo service endpoints
5. Update client to use new endpoints