# Map Save/Load System Implementation Plan

## Phase 1: Data Structure & Backend Setup ✅

### 1.1 MongoDB Schema Enhancement
```typescript
interface SavedMap {
    _id?: string;
    name: string;                // Required: Map name
    description?: string;        // Optional: Map description
    createdAt: Date;            // Auto: Creation timestamp
    updatedAt: Date;            // Auto: Last update timestamp
    createdBy: string;          // Auth0 user ID
    isPublic: boolean;          // Access control flag
    mapStyle: string;           // Current map style
    routes: Array<{             // Multiple routes per map
        id: string;             // Route identifier
        name: string;           // Route name
        gpxData: string;        // GPX data content
        color: string;          // Route display color
        opacity: number;        // Route opacity
        isVisible: boolean;     // Route visibility toggle
    }>;
    photos: Array<{            // Associated photos
        id: string;            // Photo identifier
        url: string;           // Photo URL/path
        caption?: string;      // Optional caption
        location: {            // Photo location
            lat: number;
            lon: number;
        }
    }>;
    viewState: {              // Map view state
        center: [number, number];
        zoom: number;
        pitch?: number;
        bearing?: number;
    };
}
```

### 1.2 Backend API Endpoints ✅
1. Successfully implemented all required endpoints:
   ```javascript
   POST /api/maps           // Create new map
   GET /api/maps           // List all maps
   GET /api/maps/:id       // Get specific map
   PUT /api/maps/:id       // Update map
   DELETE /api/maps/:id    // Delete map
   ```

2. Middleware implementations completed:
   - Authentication check
   - Input validation
   - Error handling
   - File upload handling for photos

## Phase 2: UI Components Development 🔄

### 2.1 Save Map Button & Modal
Completed:
- Added "Save Map" button to sidebar
- SaveMapModal component with:
  - Map name input (required)
  - Description textarea
  - Public/Private toggle
  - Save/Cancel buttons

Current Issues:
1. Implementation of getCurrentRoutes in MapContainer causing useState undefined error
2. Profile image loading issues (429 errors from Google OAuth)

Fixes Implemented:
1. Added useState import to MapContainer
2. Added MapRef interface extension for map state methods:
   ```typescript
   interface MapRef {
     getCurrentRoutes: () => Array<{
       id: string;
       name: string;
       color: string;
       isVisible: boolean;
       gpxData: string;
     }>;
     getCenter: () => { lng: number; lat: number; };
     getZoom: () => number;
     getPitch: () => number;
     getBearing: () => number;
     getStyle: () => string;
   }
   ```

Next Steps:
1. Fix profile image loading:
   - Update server code to handle Google OAuth URLs correctly
   - Implement proper error handling for image loading
2. Complete SaveMapModal integration:
   - Test map state saving functionality
   - Implement proper route data storage
   - Add validation for required fields

### 2.2 Map List View (Pending)
1. Create MapList component showing:
   - Thumbnail/preview
   - Map name
   - Description preview
   - Creation date
   - Edit/Delete buttons
   - Share button

### 2.3 Load Map Dialog (Pending)
1. Create LoadMapDialog component:
   - List of saved maps
   - Search/filter functionality
   - Preview capability
   - Load button

## Phase 3: State Management & Core Functions

### 3.1 Save Map Function
Current Implementation:
```typescript
const handleSaveMap = async (data: {
  name: string;
  description: string;
  isPublic: boolean;
  viewState: {
    center: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
  };
  mapStyle: string;
}) => {
  try {
    if (!mapRef.current) return;

    const routes = mapRef.current.getCurrentRoutes();
    const mapData = {
      ...data,
      routes,
    };

    await mapService.createMap(mapData);
    setSnackbar({
      open: true,
      message: 'Map saved successfully',
      severity: 'success'
    });
    setSaveMapModalOpen(false);
  } catch (error) {
    console.error('Error saving map:', error);
    setSnackbar({
      open: true,
      message: error instanceof Error ? error.message : 'Error saving map',
      severity: 'error'
    });
  }
};
```

### 3.2 Load Map Function (Pending)
Implementation needed for map loading functionality

## Next Steps

### Immediate Tasks
1. Fix profile image loading
2. Test and verify route saving functionality
3. Implement map loading capabilities
4. Add proper error handling for map operations

### Dependencies Review
Current:
- MongoDB for data storage ✅
- Auth0 for authentication ✅
- Express for API endpoints ✅
- React + TypeScript for frontend ✅

Needed:
- State management solution verification
- Photo storage solution finalization
- Route optimization implementation

### Known Issues
1. Profile image loading (429 errors)
2. useState reference in MapContainer
3. Route data storage verification needed
4. Map state saving validation required

## Future Considerations
1. Performance optimization for large datasets
2. Offline support possibilities
3. Mobile responsiveness
4. Multi-user collaboration features


yes so:
During GPX Processing:
* Take the processed GPX data
* Save it as a physical file in uploads/
* Get a filepath reference for it
* Include this filepath in the map save data
* During Photo Association:
* Take the photos that were found nearby
* Save copies in uploads/ specific to this map, or

Then all this data will get saved to Mongo

# GPX File Upload Implementation Status

## Implemented Features ✅
1. GPX file upload endpoint in server.js with multer configuration
2. File path storage in MongoDB integration
3. Frontend components updated to handle file uploads:
   - GPX-uploader component modified to pass file object
   - MapContainer updated to handle file upload and storage
   - Route interface updated to include gpxFilePath

## Issues Encountered and Fixed 🔧
1. **File Upload Chain**
   - Initial issue: File object wasn't being passed through the component chain
   - Resolution: Updated sidebar.tsx to pass file object to handleGpxUpload

2. **MapRef Interface**
   - Issue: Interface didn't match implementation
   - Fix: Updated MapRef interface to include file parameter in handleGpxUpload signature

3. **Server Upload Error**
   - Current Issue: 500 error when trying to save files
   - Error: `ENOENT: no such file or directory, open 'uploads/1736660601162-317301749.gpx'`
   - Root Cause: Missing uploads directory in project root

## Pending Fixes 🔄
1. **Server-side Upload Directory**
   ```javascript
   import fs from 'fs';
   import path from 'path';

   // Add to server.js
   const uploadsDir = path.join(process.cwd(), 'uploads');
   if (!fs.existsSync(uploadsDir)) {
       fs.mkdirSync(uploadsDir, { recursive: true });
   }
   ```

2. **File Permissions**
   - Ensure server has write permissions to uploads directory
   - Verify directory path is correct in production environment

## Next Steps 📋
1. **Immediate**
   - Implement uploads directory creation
   - Test full upload flow
   - Add error handling for directory creation

2. **Short Term**
   - Add file cleanup routine for unused GPX files
   - Implement file size limits and validations
   - Add progress indicator for large file uploads

3. **Future Considerations**
   - Consider cloud storage integration for scalability
   - Implement file compression for large GPX files
   - Add file validation and sanitization

## Related Components
- server.js: Main server implementation
- gpx-uploader.tsx: Frontend upload component
- map-container.tsx: Map handling and GPX processing
- sidebar.tsx: User interface for file upload

## Testing Checklist
- [ ] Uploads directory exists and has correct permissions
- [ ] GPX file uploads successfully
- [ ] File path saved correctly in MongoDB
- [ ] File retrievable after save
- [ ] Error handling works as expected
- [ ] Upload progress indicator functions correctly

## Notes
- Keep monitoring for 500 errors after implementing directory creation
- Consider adding file type validation on server side
- May need to add cleanup routine for temporary files
- Consider implementing file deduplication

# Photo Implementation Findings

## Initial Approach (Overcomplicated)
We initially tried to implement photo saving through DOM markers:
1. Create markers with photo data attributes
2. Set latitude, longitude on markers
3. When saving map:
   - Query all photo markers
   - Extract data from markers
   - Reconstruct photo objects
   - Save to database

Problems with this approach:
- Converting database photos -> markers -> database photos
- Lost original photo IDs in the process
- Empty photos array in saved maps
- Extra complexity for no benefit

## The Simple Solution
We already have the photo data from our database query:
```typescript
// In map-container.tsx
const photos = await findPhotosNearPoints(points);
```

These photos already contain all needed information:
```typescript
{
    _id: string,          // Original database ID
    url: string,          // Original S3 URL
    originalName: string, // Can be used as caption
    latitude: number,     // Original coordinates
    longitude: number
}
```

To save photos with a map, we just need to:
1. Keep track of the found photos
2. Format them to match our SavedMap type:
```typescript
photos: Array<{
    id: string,           // Use photo._id
    url: string,          // Use photo.url
    caption?: string,     // Use photo.originalName
    location: {
        lat: number,      // Use photo.latitude
        lon: number       // Use photo.longitude
    }
}>
```

## Key Learnings
1. Don't reconstruct data you already have
2. DOM manipulation should be for display only, not data storage
3. Keep original data intact when possible
4. Simpler solutions are usually better

## Next Steps
1. Store photos array when they're found
2. Format photos to match SavedMap type when saving
3. Remove marker data attribute complexity
4. Focus markers on display functionality only

## Implementation Status
- [x] Photo finding near points working
- [x] Photo markers displaying correctly
- [ ] Photo data saving with maps
- [ ] Photo data loading with saved maps

J
I can show you the log of the photos without adding consoles:
[Log] [findNearbyPhotos] Found 4 photos: (db.ts, line 90)
Array (4)
0 {_id: "67627960af793a1d3a2a4347", url: "https://bikepath.s3.ap-southeast-2.amazonaws.com/1734506847644-IMG_4115.jpeg", originalName: "IMG_4115.jpeg", uploadedAt: "2024-12-18T07:27:28.814Z", latitude: -41.35268888888889, …}
1 {_id: "67627963af793a1d3a2a4348", url: "https://bikepath.s3.ap-southeast-2.amazonaws.com/1734506850450-IMG_4116.jpeg", originalName: "IMG_4116.jpeg", uploadedAt: "2024-12-18T07:27:31.436Z", latitude: -41.35256944444445, …}
2 {_id: "67627967af793a1d3a2a4349", url: "https://bikepath.s3.ap-southeast-2.amazonaws.com/1734506854609-IMG_4117.jpeg", originalName: "IMG_4117.jpeg", uploadedAt: "2024-12-18T07:27:35.630Z", latitude: -41.35156666666667, …}
3 {_id: "6762796aaf793a1d3a2a434a", url: "https://bikepath.s3.ap-southeast-2.amazonaws.com/1734506857194-IMG_4119.jpeg", originalName: "IMG_4119.jpeg", uploadedAt: "2024-12-18T07:27:38.057Z", latitude: -41.35183055555556, …}
Array Prototype

also:
[Log] [findPhotosNearPoints] Found 10 unique photos (db.ts, line 111)
[Log] Photo markers added to map (map-container.tsx, line 463)
[Log] [handleGpxUpload] => Photo markers added (map-container.tsx, line 747)

also:
[Log] [findPhotosNearPoints] Starting to process 443 points (db.ts, line 101)
[Log] [findNearbyPhotos] Fetching photos near: 147.34734, -41.33872 (db.ts, line 70)
[Log] [findNearbyPhotos] Request URL: http://localhost:3001/api/photos/near?longitude=147.34734&latitude=-41.33872 (db.ts, line 73)