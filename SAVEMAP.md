# Map Save/Load System Implementation Plan

## Phase 1: Data Structure & Backend Setup

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

### 1.2 Backend API Endpoints
1. Create new endpoints in server.js:
   ```javascript
   POST /api/maps           // Create new map
   GET /api/maps           // List all maps
   GET /api/maps/:id       // Get specific map
   PUT /api/maps/:id       // Update map
   DELETE /api/maps/:id    // Delete map
   ```

2. Add middleware:
   - Authentication check
   - Input validation
   - Error handling
   - File upload handling for photos

## Phase 2: UI Components Development

### 2.1 Save Map Button & Modal
1. Add "Save Map" button to sidebar
2. Create SaveMapModal component:
   - Map name input (required)
   - Description textarea
   - Public/Private toggle
   - Current routes list
   - Associated photos grid
   - Save/Cancel buttons

### 2.2 Map List View
1. Create MapList component showing:
   - Thumbnail/preview
   - Map name
   - Description preview
   - Creation date
   - Edit/Delete buttons
   - Share button

### 2.3 Load Map Dialog
1. Create LoadMapDialog component:
   - List of saved maps
   - Search/filter functionality
   - Preview capability
   - Load button

## Phase 3: State Management & Core Functions

### 3.1 Save Map Function
1. Implement saveMap function:
   ```typescript
   async function saveMap() {
     // 1. Collect current map state
     // 2. Gather all GPX data
     // 3. Process any photos
     // 4. Save to backend
     // 5. Show success/error message
   }
   ```

### 3.2 Load Map Function
1. Implement loadMap function:
   ```typescript
   async function loadMap(mapId: string) {
     // 1. Fetch map data
     // 2. Load GPX files
     // 3. Restore view state
     // 4. Load photos
     // 5. Apply visibility settings
   }
   ```

### 3.3 Map State Management
1. Create map state context/store
2. Track:
   - Current routes
   - Loaded photos
   - View state
   - Unsaved changes

## Phase 4: Route & Photo Management

### 4.1 Route Management
1. Ability to:
   - Add multiple routes
   - Name routes
   - Set route colors
   - Toggle visibility
   - Delete routes

### 4.2 Photo Management
1. Implement:
   - Photo upload
   - Location tagging
   - Caption editing
   - Photo deletion
   - Photo gallery view

## Phase 5: Integration & Testing

### 5.1 Core Integration
1. Connect all components
2. Implement proper state flow
3. Add loading states
4. Error handling

### 5.2 Testing
1. Unit tests for:
   - Save/Load functions
   - Data transformations
   - UI components

2. Integration tests for:
   - Full save/load cycle
   - Multi-route handling
   - Photo management

### 5.3 Error Handling
1. Implement:
   - Network error recovery
   - Validation error messages
   - Loading state indicators
   - Auto-save functionality

## Phase 6: Polish & Enhancement

### 6.1 UX Improvements
1. Add:
   - Autosave functionality
   - Unsaved changes warning
   - Loading animations
   - Success/error notifications

### 6.2 Performance Optimization
1. Implement:
   - Lazy loading for photos
   - GPX data optimization
   - State caching
   - Load time optimization

### 6.3 Sharing Features
1. Create:
   - Share link generation
   - Embed code generation
   - Permission management
   - View-only mode

## Next Steps

### Immediate Tasks
1. Set up MongoDB maps collection
2. Create basic SaveMapModal component
3. Implement save function
4. Add save button to UI

### Dependencies Needed
- MongoDB schema updates
- File storage solution for photos
- Backend route handlers
- Frontend state management

### Questions to Resolve
1. Storage strategy for GPX files:
   - Raw text vs parsed data
   - Compression needs
2. Photo storage solution:
   - Local vs cloud storage
   - Size limits
3. Access control implementation:
   - Public vs private maps
   - Sharing permissions

   CONTINUATATION:
   # Map Save/Load System Implementation Status

## Completed Work ✅

### Phase 1: Data Structure & Backend Setup
1. MongoDB Schema Enhancement
   - Successfully implemented SavedMap interface
   - Schema includes all necessary fields for map data, routes, and photos
   - Schema validated and working in TypeScript

2. Backend API Endpoints
   - Successfully implemented all required endpoints:
     - POST /api/maps
     - GET /api/maps
     - GET /api/maps/:id
     - PUT /api/maps/:id
     - DELETE /api/maps/:id
   - Added ObjectId handling for MongoDB operations
   - Authentication middleware integrated with Auth0
   - Basic error handling implemented

3. Frontend-Backend Integration
   - Successfully moved MongoDB operations to server-side only
   - Implemented fetch-based API calls in client
   - Resolved MongoDB browser import issues
   - Fixed timers/promises error by proper separation of concerns

## Current Focus 🔄

### Phase 2: UI Components Development
Currently implementing:
1. Save Map Button & Modal
   - Adding save button to sidebar
   - Creating SaveMapModal component with:
     - Map name input
     - Description textarea
     - Public/Private toggle
     - Current routes list
     - Save/Cancel buttons

## Technical Notes 📝

### What Worked
1. Backend API structure using express and MongoDB
2. Auth0 integration for authentication
3. Frontend-backend separation using fetch API
4. MongoDB schema design and implementation

### What Didn't Work
1. Initial attempt to use MongoDB directly in frontend
2. Direct ObjectId handling without proper type conversion
3. Mixed client-server code causing browser compatibility issues

### Lessons Learned
1. Keep all MongoDB operations server-side only
2. Use fetch API for frontend-backend communication
3. Proper typing of MongoDB ObjectId in TypeScript
4. Clear separation between client and server code

## Next Steps 📋

1. Immediate Tasks
   - Complete SaveMapModal component
   - Add save button to sidebar
   - Implement map state management
   - Add route list display

2. Upcoming Work
   - MapList view implementation
   - Load Map dialog
   - Photo management integration
   - Route management features

## Open Questions ❓

1. User Experience
   - Should save operation be automatic or manual?
   - How to handle unsaved changes warning?
   - Should we implement auto-save?

2. Technical Decisions
   - Best approach for storing GPX data (raw vs parsed)
   - How to handle large route datasets
   - Optimization strategy for photo storage

## Dependencies Review 📦

### Current
- MongoDB for data storage
- Auth0 for authentication
- Express for API endpoints
- React + TypeScript for frontend

### Needed
- State management solution for map data
- File storage solution for photos
- Route optimization tools

## Progress Notes 📝
- Phase 1 completed successfully
- Moving into Phase 2 UI development
- Basic infrastructure solid and tested
- Ready for user interface implementation

## Known Issues 🐛
1. Need to handle large GPX files more efficiently
2. Photo storage solution needs to be finalized
3. State management strategy needs to be defined

## Future Considerations 🔮
1. Performance optimization for large datasets
2. Offline support possibilities
3. Mobile responsiveness
4. Multi-user collaboration features

##WHAT WE ARE UP TO:
I see your sidebar component. According to SAVEMAP.md, we need to:

Add a "Save Map" button in the sidebar
Create a SaveMapModal component that will contain:

Map name input (required)
Description textarea
Public/Private toggle
Current routes list
Save/Cancel buttons



Would you like me to first:

Add the Save button to the sidebar
Create the SaveMapModal component
Or both together since they are related?