# Lutruwita - Interactive Mapping Application

An advanced mapping platform for creating and sharing interactive routes for cycling, hiking, and outdoor activities in Tasmania.

## Project Status 🚧
Current Status: **In Active Development**

### Recently Completed ✅
1. **Authentication System**
   - Auth0 integration with proper configuration
   - User profile management with MongoDB integration
   - Login/Logout functionality
   - Profile editing interface
   - Social links integration (Instagram, Strava, Facebook)

2. **Core Infrastructure**
   - Project setup with Vite + React + TypeScript
   - Mobile-responsive layout implementation
   - MapBox integration with custom styling
   - Environment configuration
   - Basic routing setup

3. **Basic Map Features**
   - Basic map rendering and controls
   - Zoom and pan controls
   - Location detection
   - Map style switching
   - Navigation implementation
   - Sidebar component with responsive design
   - Bottom navigation tabs

### Current Focus 🔄
1. **Map Creation and Saving System**
   - Implement create/edit mode for maps
   - Save and load map states
   - Manage routes and viewpoints
   - Share and embed functionality
   - Database structure for storing map data

2. **Route Management**
   - Manual route drawing tools
   - GPX file upload and parsing
   - Route preview functionality
   - Surface type detection and display
   - Elevation profile integration

### Upcoming Features 📋
1. **Surface Type System**
   - Rating system (0-6) with color coding:
     - Green solid (0) to Maroon solid (6)
     - Special types for bike paths
   - Surface detection from map data
   - Manual surface type assignment
   - Visual indicators for surface types

2. **Gradient System**
   - Grade classifications (0-3% to 15%+)
   - Visual gradient representation
   - Elevation profile integration
   - Color-coded gradient display

3. **Points of Interest**
   - Infrastructure markers
   - Service locations
   - Accommodation options
   - Natural features
   - Information points
   - Custom POI creation

## Project Overview

For detailed information about the project structure and components, see [DIR.md](DIR.md).

For specific documentation about the map saving functionality, see [SAVEMAP.md](SAVEMAP.md).

## Technical Details

### Dependencies 📦
- React 18
- TypeScript
- React Router DOM
- Material UI
- MapBox GL JS
- @mapbox/mapbox-gl-draw
- Turf.js
- Recharts
- Shadcn/UI components

### Data Structures

#### SavedMap Interface
```typescript
interface SavedMap {
    _id?: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    isPublic: boolean;
    gpxData: string;
    routeData: {
        coordinates: Array<{
            lat: number;
            lon: number;
            surface: 'paved' | 'unpaved';
        }>;
    };
    photoIds: string[];
    viewState: {
        center: [number, number];
        zoom: number;
        pitch?: number;
        bearing?: number;
    };
}
```

#### User Schema
```typescript
interface User {
    auth0Id: string;
    bioName: string;
    socialLinks: {
        instagram: string;
        strava: string;
        facebook: string;
    };
    website: string;
    email: string;
    picture: string;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
}
```

### Map Styles Available
- Mapbox Outdoor (default)
- Light
- Dark
- Streets
- Satellite
- Satellite Streets

## Getting Started

### Prerequisites
- Node.js
- npm
- Git
- MongoDB

### Installation
1. Clone the repository
```bash
git clone https://github.com/yourusername/lutruwita.git
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env.local` file with required environment variables:
```
VITE_MAPBOX_TOKEN=your_token_here
AUTH0_SECRET=your_secret
AUTH0_CLIENT_SECRET=your_client_secret
VITE_MONGODB_URI=your_mongodb_uri
```

4. Start the development server
```bash
npm run dev
```

## Features Implementation Status

### Core Features
- [x] Authentication system
- [x] User profile management
- [x] Basic map rendering
- [x] Map style switching
- [x] Navigation structure
- [ ] Map save/load system
- [ ] Surface type detection
- [ ] Route management
- [ ] Elevation profiles

### Advanced Features
- [ ] Points of Interest system
- [ ] Gradient visualization
- [ ] Comments system
- [ ] Map sharing
- [ ] Offline capabilities
- [ ] Mobile optimization

## Contributing
Project is in active development. Contribution guidelines will be added once basic structure is stable.

## License
TBD

## Contact
[To be added]
