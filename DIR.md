# Project Structure and Components

## Directory Overview

```
├── .env.local - Environment variables for local development
├── .gitignore - Specifies files to ignore in version control
├── eslint.config.js - ESLint configuration for code linting
├── index.html - Main HTML entry point for the Vite application
├── package-lock.json - Lock file for npm dependencies
├── package.json - Project dependencies and scripts configuration
├── postcss.config.js - PostCSS configuration (likely for Tailwind)
├── README.md - Project documentation
├── SAVEMAP.md - Documentation for map saving functionality
├── POILAYER.md - Documentation for POI layer functionality
├── server.js - Server-side application code
├── tailwind.config.js - Tailwind CSS configuration
├── tsconfig.app.json - TypeScript config for application code
├── tsconfig.json - Base TypeScript configuration
├── tsconfig.node.json - TypeScript config for Node/backend
├── tsconfig.server.json - TypeScript config for server code
├── vite.config.ts - Vite build tool configuration
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
    │       ├── bottom-tabs.tsx - Bottom navigation tabs component
    │       ├── button.tsx - Button component
    │       ├── distance-marker.tsx - Distance marker component
    │       ├── elevation-profile.tsx - Elevation profile UI component
    │       ├── floating-icon.tsx - Floating icon component
    │       ├── gpx-uploader.tsx - GPX file upload component
    │       ├── load-map-modal.tsx - Map loading modal
    │       ├── map-container.css - Map container styles
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
    │       ├── tabs.tsx - Tabbed interface component
    │       └── map/
    │           ├── components/
    │           │   └── poi/
    │           │       ├── POIManager.tsx - POI management component
    │           │       ├── POIMarker.tsx - POI marker implementation
    │           │       ├── POIModal.tsx - POI modal implementation
    │           │       └── POIToolbar.tsx - POI toolbar controls
    │           └── utils/
    │               └── poi/
    │                   ├── poi-events.ts - POI event handlers
    │                   ├── poi-markers.ts - POI marker utilities
    │                   └── poi-state.ts - POI state management
    ├── contexts/
    │   └── floating-icon-context.tsx - Context for floating icon state
    ├── lib/
    │   ├── db.ts - Database utilities
    │   └── utils.ts - Utility functions
    ├── pages/
    │   ├── create.tsx - Create page component
    │   ├── explore.tsx - Explore page component
    │   └── home.tsx - Home page component
    ├── services/
    │   └── map-service.ts - Map-related service functions
    └── types/
        ├── map-types.ts - Type definitions for mapping functionality
        └── note-types.ts - Type definitions for notes functionality
```

## Key Components and Relationships

### Core UI Components
- **MapContainer**: Main map visualization component
  - Manages map state and interactions
  - Integrates with MapControls and NotesPanel
  - Handles POI management through POIManager
  - Coordinates with POI-related utilities

- **POIManager**: Manages Points of Interest
  - Handles POI creation, editing, and deletion
  - Integrates with POIMarker, POIModal, and POIToolbar
  - Uses poi-state for state management
  - Coordinates with poi-markers for marker rendering

- **FloatingIcon**: Context-managed floating UI element
  - Provides context for floating icon state
  - Used across multiple components for consistent UI

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

### API Integration
1. Define API endpoints in src/services/
2. Create corresponding types in src/types/
3. Implement data fetching logic
4. Handle loading/error states
5. Update UI components with new data

## POI Management Process

1. User interacts with POIToolbar to create/edit POIs
2. POIManager coordinates state changes through poi-state
3. POIMarker handles visual representation on map
4. POIModal provides editing interface
5. Changes are persisted through map-service

## Testing Strategy

### Unit Tests
- Components: Jest + React Testing Library
- Services: Jest + Mock Service Worker
- Utilities: Jest

### Integration Tests
- Component interactions
- API response handling
- State management

### End-to-End Tests
- Cypress for UI workflows
- API contract testing

## Code Quality Standards

### Linting
- ESLint with TypeScript rules
- Prettier for code formatting
- Stylelint for CSS

### Type Safety
- Strict TypeScript configuration
- Type checking in CI pipeline
- Comprehensive type definitions

### Documentation
- JSDoc for all public APIs
- Storybook for UI components
- TypeDoc for type documentation

For more detailed project information, see [README.md](README.md)
