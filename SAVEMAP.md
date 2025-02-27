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

## CURRENT
# Photo Implementation Progress Summary

## What We've Achieved
1. **Photo Saving Implementation**
   - Successfully modified the save functionality to include photos in the map data
   - Photos are now properly stored with their metadata (id, url, caption, latitude, longitude)
   - Verified data structure is correct in the saved map object
   - Confirmed photos are being saved to the database

2. **State Management**
   - Added `currentPhotos` state to track active photos
   - Implemented proper state updates when loading and clearing routes
   - Successfully integrated photo state with the map save process

## Current Issues
1. **Map Loading**
   - Loading saved maps is failing due to photo data structure mismatch
   - Error occurs when trying to access `photo.location.lat` but photos are stored with flat structure
   - Need to update code to handle both data structures:
     ```typescript
     Stored format:
     {
       id: string,
       url: string,
       caption: string,
       latitude: number,
       longitude: number
     }
     ```

2. **Photo Marker Creation**
   - Error in createMarkerElement function when handling loaded photo data
   - Need to ensure consistent data structure between save and load operations

## Next Steps
1. **Fix Photo Loading**
   - Update loadRoute function to use correct photo data structure
   - Modify clustering code to work with flat photo structure
   - Add error handling for photo data format variations

2. **Code Updates Needed**
   - Review all places where photo.location is accessed
   - Update photo marker creation to use direct lat/long properties
   - Add data structure validation before processing photos

3. **Testing Required**
   - Test complete save and load cycle
   - Verify photo markers appear correctly after loading
   - Ensure clustering still works with loaded photos
   - Test photo modal functionality with loaded photos

## Implementation Details
```typescript
// Current photo data structure when loading
{
  id: string          // MongoDB ID
  url: string         // S3 URL
  caption: string     // Original filename
  longitude: number   // Direct coordinates
  latitude: number    // Direct coordinates
}

// Required changes for createMarkerElement
const el = document.createElement('div');
el.setAttribute('data-lat', photo.latitude.toString());    // Was photo.location.lat
el.setAttribute('data-lon', photo.longitude.toString());   // Was photo.location.lon
```

## Code Changes Required
1. `loadRoute` function needs updating to handle photo data correctly
2. `createMarkerElement` needs modification to use direct lat/long
3. Photo clustering code needs updating to use correct data structure
4. Error handling needs to be added for data structure validation

## Future Considerations
1. Consider standardizing photo data structure across the application
2. Add data validation layer for photo objects
3. Implement error recovery for malformed photo data
4. Add loading states for photo markers