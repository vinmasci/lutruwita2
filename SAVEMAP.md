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