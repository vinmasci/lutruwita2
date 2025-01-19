# GPX Upload Process Documentation

## 1. Client-Side Upload Initiation
### Component: src/components/ui/gpx-uploader.tsx
1. ✅ User selects GPX file through file input
2. ✅ File is validated:
   - ✅ Checks file extension is .gpx
   - ✅ Verifies file size
   - ✅ Ensures file is not empty
3. ✅ Creates FormData object with file
4. ✅ Triggers upload to server

## 2. Server-Side File Upload
### Component: server.js
1. ✅ Receives multipart form data
2. ✅ Generates unique filename using timestamp
3. ✅ Saves file to uploads/ directory
4. ✅ Returns upload response with:
   - ✅ Success status
   - ✅ File path
   - ✅ Any error messages

## 3. GPX File Processing
### Component: src/services/gpx-service.ts
1. ✅ Reads uploaded GPX file
2. ✅ Parses XML structure
3. ✅ Extracts:
   - ✅ Track points (lat/lon)
   - ✅ Elevation data
   - ✅ Timestamps
   - ✅ Any metadata
4. ✅ Converts to internal format
5. ✅ Validates data integrity

## 4. Surface Detection
### Component: src/services/surface-detection.ts
1. ✅ Prepares route geometry:
   - ✅ Creates LineString from points
   - ✅ Formats coordinates as [lon, lat] array
   - ✅ Builds GeoJSON structure
   - ✅ Validates geometry integrity

2. ✅ API Request:
   - ✅ Endpoint: `${API_URL}/api/surface-detection`
   - ✅ Method: POST
   - ✅ Headers: Content-Type: application/json
   - ✅ Body: { route: LineString }
   - ✅ Handles network errors and timeouts

3. 🔄 Server-Side Processing:
   - 🔄 PostGIS Operations:
     * 🔄 ST_Intersects with roads table
     * 🔄 ST_Length calculations
     * 🔄 Surface type determination
   - 🔄 Database Queries:
     * 🔄 Spatial index usage
     * 🔄 Query optimization
     * 🔄 Connection pooling
   - ❌ Performance Impact:
     * ❌ Large routes = more intersections
     * ❌ Complex spatial operations
     * ❌ Memory intensive calculations

4. ❌ Response Processing:
   - ❌ Surface Mapping:
     * ❌ Maps each point to nearest road
     * ❌ Calculates intersection lengths
     * ❌ Determines dominant surfaces
   - ❌ Gap Handling:
     * ❌ Identifies gaps between roads
     * ❌ Uses nearest surface types
     * ❌ Smooths transitions
   - ✅ Data Structure:
     ```typescript
     interface SurfaceDetectionResponse {
       surface_type: 'paved' | 'unpaved' | 'unknown' | 'asphalt';
       intersection_length: number;
       total_route_length: number;
       percentage: number;
     }
     ```

5. ❌ Current Limitations:
   - ❌ Processing Time:
     * ❌ Increases with route length
     * ❌ Complex spatial operations
     * ❌ Database query timeouts
   - ❌ Memory Usage:
     * ❌ Large point arrays
     * ❌ Multiple data copies
     * ❌ Array operations overhead
   - ❌ Performance Issues:
     * ❌ Long routes crash
     * ❌ Timeout on complex queries
     * ❌ Memory constraints

## 5. Route Processing
### Component: src/hooks/useGpxProcessing.ts
1. ✅ Calculates route metrics:
   - ✅ Total distance
   - ✅ Elevation gain/loss
   - 🔄 Surface percentages
2. 🔄 Segments route:
   - 🔄 Splits by surface type
   - 🔄 Handles transitions
   - 🔄 Creates sub-segments
3. ✅ Generates statistics:
   - ✅ Distance by surface
   - ✅ Elevation profiles
   - 🔄 Segment breakdowns

## 6. Map Integration
### Component: src/components/ui/map-container.tsx
1. ✅ Prepares route for display:
   - ✅ Formats coordinates
   - ✅ Sets up styling
   - ✅ Configures layers
2. ✅ Creates map features:
   - ✅ Route line
   - 🔄 Surface coloring
   - ✅ Elevation indicators
   - ✅ Distance markers
3. ✅ Handles interactions:
   - ✅ Hover effects
   - ✅ Click events
   - ✅ Zoom behaviors

## 7. UI Updates
### Various Components
1. ✅ Updates progress indicators
2. ✅ Shows route details:
   - ✅ Distance
   - ✅ Elevation
   - 🔄 Surface breakdown
3. ✅ Enables route controls:
   - ✅ Visibility toggle
   - ✅ Style adjustments
   - ✅ Export options

## 8. Data Flow Details

### Client → Server
```
1. ✅ File Upload
   ↓
2. ✅ Save to Disk
   ↓
3. ✅ Return File Path
```

### Server Processing
```
1. Read GPX
   - Reads file from uploads directory
   - Validates XML structure
   - Memory: Loads entire file into memory
   ↓
2. Parse XML
   - Extracts track segments
   - Validates coordinates
   - Memory: Creates point arrays
   ↓
3. Extract Data
   - Converts to GeoJSON
   - Validates geometry
   - Memory: Duplicates data for conversion
   ↓
4. Surface Detection
   - PostGIS Query:
     * ST_Intersects with roads
     * No query limit
     * Full table scan possible
   - Memory Impact:
     * Large result sets
     * No pagination
     * All intersections at once
   ↓
5. Route Analysis
   - Process all points
   - Calculate all metrics
   - Memory: Holds all results
```

### Database Operations
```sql
-- Typical Surface Detection Query
SELECT 
  r.surface_type,
  ST_Length(
    ST_Intersection(
      ST_Transform(r.geometry, 3857),
      ST_Transform(route.geometry, 3857)
    )
  ) as intersection_length,
  ST_Length(
    ST_Transform(route.geometry, 3857)
  ) as total_length
FROM roads r
WHERE ST_Intersects(r.geometry, route.geometry)
```

### Query Impact
1. No Result Limiting:
   - Returns all intersections
   - Large memory allocation
   - Long processing time

2. Spatial Operations:
   - Complex geometry calculations
   - CPU intensive
   - Memory intensive

3. Connection Handling:
   - Single query
   - Long-running transaction
   - No chunking/streaming

### Server → Client
```
1. ✅ Route Data
   ↓
2. 🔄 Surface Info
   ↓
3. ✅ Statistics
   ↓
4. ✅ Render Updates
```

## 9. Error Handling

### Upload Errors
- ✅ File size limits
- ✅ Invalid formats
- ✅ Network issues
- ✅ Server errors

### Processing Errors
- ✅ Parse failures
- ✅ Missing data
- ✅ Invalid coordinates
- 🔄 Surface detection failures

### Display Errors
- ✅ Rendering issues
- ✅ Memory limits
- 🔄 Performance problems
- ✅ Browser compatibility

## 10. Performance Considerations

### Server-Side
- ✅ File size limits
- 🔄 Processing timeouts
- 🔄 Memory usage
- 🔄 Database query optimization

### Client-Side
- ✅ Browser memory
- ✅ Rendering performance
- ✅ Data structure efficiency
- ✅ Cache management

## 11. Data Persistence
1. ✅ Temporary file storage
2. ✅ Route caching
3. 🔄 Surface data storage
4. ✅ User preferences

## 12. Security Measures
1. ✅ File validation
2. ✅ Size limits
3. ✅ Type checking
4. ✅ Error sanitization

## 13. Optimization Points
1. ✅ File processing
2. 🔄 Surface detection
3. ✅ Route rendering
4. ✅ Data transfer

## 14. Future Improvements
1. 🔄 Route simplification
2. 🔄 Chunk processing
3. 🔄 Progressive loading
4. ✅ Better error recovery

Legend:
✅ - Working properly
🔄 - Impacted by or dependent on surface detection
❌ - Not working/needs fixing
