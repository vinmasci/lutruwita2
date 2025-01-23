# Lutruwita - Interactive Mapping Application

## Project Structure

```
src/
  features/           # Feature-based modules
    auth/            # Authentication feature
      components/    # Auth-specific components
      hooks/        # Auth-related hooks
      services/     # Auth services
      types/        # Auth type definitions
    maps/           # Map feature
      components/   
        MapContainer/
          index.tsx  # Main container
          Controls.tsx
          LayerManager.tsx
        RouteManager/
        SurfaceManager/
      hooks/
        useMapState.ts
        useRouteProcessing.ts
      services/
        mapService.ts
        routeService.ts
      types/
    photos/         # Photo management
    profiles/       # User profiles

  shared/           # Shared resources
    components/     # Reusable UI components
    hooks/         # Common hooks
    utils/         # Helper functions
    types/         # Global types

  lib/             # Core functionality
    api/           # API client
    config/        # App configuration
    db/            # Database utilities

  app/             # App core
    layout/        # Layout components
    routes/        # Route definitions
    providers/     # Context providers
```

## Migration Plan

1. Phase 1: Core Structure
   - Set up new directory structure
   - Move shared components
   - Establish core utilities

2. Phase 2: Feature Migration
   - Move auth-related code
   - Restructure map components
   - Migrate photo handling
   - Transfer profile management

3. Phase 3: Cleanup
   - Remove old structure
   - Update imports
   - Fix dependencies
   - Add tests

## Development Workflow

1. Branch: `feature/restructure`
2. Components: Create atomic components
3. Features: Organize by domain
4. Tests: Maintain test coverage
5. Documentation: Update as needed

## Core Features Status

- [x] Authentication system
- [x] User profile management
- [x] Basic map rendering
- [x] Map style switching
- [ ] Route management
- [ ] Surface detection
- [ ] Elevation profiles

## Getting Started

1. Clone repository
2. Switch to feature branch:
```bash
git checkout feature/restructure
```
3. Install dependencies:
```bash
npm install
```
4. Run development server:
```bash
npm run dev
```

## Environment Setup

Create `.env.local`:
```
VITE_MAPBOX_TOKEN=your_token
AUTH0_SECRET=your_secret
AUTH0_CLIENT_SECRET=your_client_secret
VITE_MONGODB_URI=your_mongodb_uri
```