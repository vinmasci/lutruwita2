# Project Structure and Components

## Directory Overview

```
├── .env.local - Environment variables for local development
├── .gitignore - Specifies files to ignore in version control
├── australia-roads.geojson - Australian roads geodata
├── eslint.config.js - ESLint configuration for code linting
├── GPXUPLOAD.md - Documentation for GPX file upload functionality
├── GPX_REFACTOR.md - Documentation for GPX refactoring
├── GPX_UPLOAD_PROCESS.md - GPX upload process documentation
├── index.html - Main HTML entry point for the Vite application
├── LOG.md - Development log
├── OLDMAP-CONTAINER.md - Documentation for legacy map container
├── package-lock.json - Lock file for npm dependencies
├── package.json - Project dependencies and scripts configuration
├── PLACELABELS.md - Documentation for place labeling functionality
├── POILAYER.md - Documentation for POI layer functionality
├── postcss.config.js - PostCSS configuration (likely for Tailwind)
├── README.md - Project documentation
├── SAVEMAP.md - Documentation for map saving functionality
├── server.ts - Server-side application code (TypeScript)
├── tailwind.config.js - Tailwind CSS configuration
├── tsconfig.app.json - TypeScript config for application code
├── tsconfig.json - Base TypeScript configuration
├── tsconfig.node.json - TypeScript config for Node/backend
├── tsconfig.server.json - TypeScript config for server code
├── vite.config.ts - Vite build tool configuration
├── certs/ - SSL certificates directory
├── public/
│   └── vite.svg - Vite logo asset
├── uploads/ - Directory for uploaded GPX files
└── src/
    ├── App.css - Main application styles
    ├── App.tsx - Root React component
    ├── index.css - Global styles
    ├── main.tsx - Application entry point
    ├── vite-env.d.ts - Vite environment type declarations
    ├── assets/
    │   └── react.svg - React logo asset
    ├── components/
    │   ├── layout/
    │   │   └── main-layout.tsx - Main layout component
    │   └── ui/
    │       ├── alert.tsx - Alert/notification component
    │       ├── bottom-tabs.tsx - Bottom navigation tabs component
    │       ├── button.tsx - Button component
    │       ├── distance-marker.tsx - Distance marker component
    │       ├── elevation-profile.tsx - Elevation profile UI component
    │       ├── floating-icon.tsx - Floating icon component
    │       ├── gpx-uploader.tsx - GPX file upload component
    │       ├── load-map-modal.tsx - Map loading modal
    │       ├── map-container.tsx - Map container component
    │       ├── map-controls.tsx - Map controls UI
    │       ├── map-note.tsx - Map note component
    │       ├── notes-panel.tsx - Notes panel component
    │       ├── photo-modal.tsx - Photo modal component
    │       ├── poi-marker.tsx - POI marker component
    │       ├── poi-modal.tsx - POI modal component
    │       ├── save-map-modal.tsx - Map saving modal
    │       ├── sheet.tsx - Sheet component
    │       ├── sidebar.tsx - Sidebar component
    │       ├── surface-legend.tsx - Surface legend component
    │       ├── tabs.tsx - Tabbed interface component
    │       └── map/
    │           ├── components/
    │           │   └── poi/
    │           │       ├── POIDrawer.tsx - POI drawing interface
    │           │       ├── POIManager.tsx - POI management component
    │           │       ├── POIMarker.tsx - POI marker implementation
    │           │       ├── POIModal.tsx - POI modal implementation
    │           │       ├── POIToolbar.tsx - POI toolbar controls
    │           │       └── place-poi/
    │           │           ├── PlaceHighlight.tsx - Place highlighting component
    │           │           ├── PlaceManager.tsx - Main place-based POI manager
    │           │           ├── PlacePOIControl.tsx - Place POI controls
    │           │           ├── PlacePOIModal.tsx - Modal for place POI management
    │           │           └── PlacePOIModeManager.tsx - Manages place POI modes
    │           └── utils/
    │               └── poi/
    │                   ├── poi-events.ts - POI event handlers
    │                   ├── poi-markers.ts - POI marker utilities
    │                   └── poi-state.tsx - POI state management
    ├── contexts/
    │   └── floating-icon-context.tsx - Context for floating icon state
    ├── hooks/
    │   ├── index.ts - Main hooks exports
    │   ├── useGpxProcessing.ts - Hook for GPX file processing
    │   └── useRouteRendering.ts - Hook for route rendering
    ├── lib/
    │   ├── db.ts - Database utilities
    │   └── utils.ts - Utility functions
    ├── pages/
    │   ├── create.tsx - Create page component
    │   ├── explore.tsx - Explore page component
    │   └── home.tsx - Home page component
    ├── services/
    │   ├── gpx-processor.ts - GPX file processing logic
    │   ├── gpx-service.ts - GPX file processing service
    │   ├── index.ts - Main service exports
    │   ├── map-route-service.ts - Map route service
    │   ├── map-service.ts - Map-related service functions
    │   ├── photo-service.ts - Photo handling service
    │   ├── storage-service.ts - Local storage service (TypeScript)
    │   └── __tests__/
    │       ├── gpx-processor.test.ts - GPX processor unit tests
    │       ├── gpx-upload.e2e.test.ts - GPX upload end-to-end tests
    │       └── route-upload.integration.test.ts - Route upload integration tests
    ├── types/
    │   ├── gpx-types.ts - Type definitions for GPX file processing
    │   ├── index.ts - Main type exports
    │   ├── map-types.ts - Type definitions for mapping functionality
    │   ├── note-types.ts - Type definitions for notes functionality
    │   ├── place-types.ts - Type definitions for place-related functionality
    │   ├── server.d.ts - Server type definitions
    │   ├── storage-service.d.ts - Storage service type definitions
    │   └── test-types.ts - Test-related type definitions
    └── utils/
        ├── error-handling.ts - Error handling utilities
        └── gpx/
            ├── index.ts - Main GPX utilities
            └── parsing.ts - GPX parsing utilities
```

## Key Components and Relationships

### Core UI Components
- **MapContainer**: Main map visualization component
  - Manages map state and interactions
  - Integrates with MapControls and NotesPanel
  - Handles POI management through POIManager
  - Coordinates with POI-related utilities

- **POI System**: Comprehensive POI management
  - **POIManager**: Central POI coordination
    - Handles POI creation, editing, and deletion
    - Integrates with POIMarker, POIModal, and POIToolbar
    - Uses poi-state for state management
  - **POIDrawer**: Drawing interface for POIs
  - **POIToolbar**: UI controls for POI manipulation
  - **POIModal**: Interface for POI details and editing

- **Place POI System**: Place-specific POI management
  - **PlaceManager**: Main place-based POI coordinator
    - Extends POI functionality for specific places
    - Integrates with map components and services
  - **PlacePOIControl**: Place-specific POI controls
  - **PlacePOIModeManager**: Mode management for place POIs
  - **PlaceHighlight**: Visual highlighting for places
  - **PlacePOIModal**: Place-specific POI editing interface

- **FloatingIcon**: Context-managed floating UI element
  - Provides context for floating icon state
  - Used across multiple components for consistent UI

### Services
- **MapService**: Core map functionality
- **GPXService**: GPX file processing
- **PhotoService**: Photo handling and management
- **StorageService**: Local data persistence (TypeScript)
- **GPXProcessor**: GPX file processing logic
- **ErrorHandling**: Centralized error handling utilities

### Data Flow
1. **User Interaction** → UI Components → Services
2. **Services** → API Calls → Backend
3. **Backend** → Database Operations → Response
4. **Response** → State Updates → UI Rendering

## Development Workflow

### Component Development
1. Create new component in appropriate directory
2. Add TypeScript interfaces in src/types/
3. Implement required services in src/services/
4. Write unit tests using Jest
5. Add integration tests for component interactions

### API Integration
1. Define API endpoints in src/services/
2. Create corresponding types in src/types/
3. Implement data fetching logic
4. Handle loading/error states using error-handling utilities
5. Update UI components with new data

## Testing Strategy

### Unit Tests
- Components: Jest + React Testing Library
- Services: Jest + Mock Service Worker
- Utilities: Jest

### Integration Tests
- Component interactions
- API response handling
- State management
- Route upload integration tests

### End-to-End Tests
- GPX upload workflows
- API contract testing
- Playwright for UI testing

## Code Quality Standards

### Linting
- ESLint with TypeScript rules
- Prettier for code formatting
- Stylelint for CSS

### Type Safety
- Strict TypeScript configuration
- Type checking in CI pipeline
- Comprehensive type definitions
- Type documentation with TypeDoc

### Documentation
- JSDoc for all public APIs
- Storybook for UI components
- TypeDoc for type documentation
- Detailed process documentation (GPX_REFACTOR.md, LOG.md)

For more detailed project information, see [README.md](README.md)
