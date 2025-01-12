├── .env.local - Environment variables for local development
├── .gitignore - Specifies files to ignore in version control
├── eslint.config.js - ESLint configuration for code linting
├── index.html - Main HTML entry point for the Vite application
├── package-lock.json - Lock file for npm dependencies
├── package.json - Project dependencies and scripts configuration
├── postcss.config.js - PostCSS configuration (likely for Tailwind)
├── README.md - Project documentation
├── SAVEMAP.md - Documentation for map saving functionality
├── server.js - Server-side application code
├── tailwind.config.js - Tailwind CSS configuration
├── tsconfig.app.json - TypeScript config for application code
├── tsconfig.json - Base TypeScript configuration
├── tsconfig.node.json - TypeScript config for Node/backend
├── tsconfig.server.json - TypeScript config for server code
├── vite.config.ts - Vite build tool configuration
├── public/
│   └── vite.svg - Vite logo asset
├── uploads/ - Directory for uploaded files
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
    │       ├── gpx-uploader.tsx - GPX file upload component
    │       ├── map-container.css - Map container styles
    │       ├── map-container.tsx - Map container component
    │       ├── map-controls.tsx - Map controls UI
    │       ├── map-note.tsx - Map note component
    │       ├── navbar.tsx - Navigation bar component
    │       ├── notes-panel.tsx - Notes panel component
    │       ├── photo-modal.tsx - Photo modal component
    │       ├── sheet.tsx - Sheet component
    │       ├── sidebar.tsx - Sidebar component
    │       └── tabs.tsx - Tabbed interface component
    ├── lib/
    │   ├── db.ts - Database utilities
    │   └── utils.ts - Utility functions
    ├── pages/
    │   ├── create.tsx - Create page component
    │   ├── explore.tsx - Explore page component
    │   └── home.tsx - Home page component
    └── types/
        ├── map-types.ts - Type definitions for mapping functionality
        └── note-types.ts - Type definitions for notes functionality

# Map Saving Process

1. User initiates save from UI
2. SaveMapModal (src/components/ui/save-map-modal.tsx) collects:
   - Map name (required)
   - Description (optional)
   - Public/private status
   - Included routes
3. Parent component calls mapService.createMap() (src/services/maps.ts)
4. API request sent to backend with SavedMap data (src/types/map-types.ts):
   - Map metadata (name, description, visibility)
   - Current map view state
   - Included routes with GPX data
   - Associated photos
   - Map style configuration
5. Backend persists map data and returns saved map object
