## RULES FOR CLAUDE AI
Before suggesting an update to a file, always check it on GITHUB first
When making multiple changes to one file, its probably easier just to give me the whole file
If you dont give me the full file, give me the code in before and after so I can easily copy and paste
Dont try to edit my code, it wont work

## ACTIVE GOAL
Surface Detection System - Implementation Status
Current Implementation

Custom vector tileset created in MapTiler containing Australia's road network with surface data
Tileset optimized for zoom level 13
Surface information confirmed present in tileset (visible in MapTiler preview)
Basic integration implemented in map component

Current Issue
We're experiencing a data loading issue where the surface information isn't being queried correctly:

The GPX route loads successfully (2428 points processed)
Map correctly zooms to level 13
Tiles are confirmed to load
But querySourceFeatures returns 0 features

Debug Status
Currently investigating if this is a:

Source loading issue (data not loading from MapTiler)
Query timing issue (querying before data is ready)
Query parameter issue (wrong source-layer or filter settings)

Next Debug Steps

Add source loading state verification
Monitor source data events
Verify feature querying at different zoom levels
Test direct feature queries without GPX integration

Technical Details
javascriptCopy// Current Source Configuration
{
  type: 'vector',
  tiles: ['https://api.maptiler.com/tiles/7ed93f08-6f83-46f8-9319-96d8962f82bc/{z}/{x}/{y}.pbf'],
  minzoom: 13,
  maxzoom: 13
}

// Layer Configuration
{
  id: 'custom-roads',
  type: 'line',
  source: 'australia-roads',
  'source-layer': 'roads',
  layout: { visibility: 'visible' },
  paint: { 'line-opacity': 0.5, 'line-color': '#FF0000' }
}
Timeline

✅ Tileset created with surface data
✅ Basic map integration
✅ GPX route loading
✅ Zoom level management
🔄 Surface data querying (current blocker)
⏳ Route surface visualization
⏳ Performance optimization

Project Goals

Query road surface types for GPX route points
Visualize route segments based on surface type
Implement efficient surface detection for long routes
Provide accurate surface information for route planning

# Lutruwita - Interactive Mapping Application

An advanced mapping platform for creating and sharing interactive routes for cycling, hiking, and outdoor activities in Tasmania.

## Current Status
🚧 **In Development** - Basic map functionality implemented, working on feature development

### Completed Features ✅
- [x] Project setup with Vite + React + TypeScript
- [x] Basic file structure created
- [x] Core components implemented
- [x] Mapbox integration
- [x] Basic map controls (zoom, pan, locate)
- [x] Style switching functionality
- [x] Drawing tools integration
- [x] Mobile-responsive layout
- [x] Sidebar component
- [x] Bottom navigation
- [x] Basic route drawing capabilities

### Current Issues and Next Steps 🔄
- [ ] Implement surface type system
- [ ] Add elevation profile with real data
- [ ] Complete route editing tools
- [ ] Add GPX file upload functionality
- [ ] Implement point of interest system

## Project Structure

### Application Screens 📱
- **Home**: Main landing page
- **Create (Admin)**: Map creation and editing interface where administrators can:
  - Upload or draw new routes
  - Add and edit points of interest
  - Configure surface types and gradients
  - Set map visibility and sharing options
- **Explore**: Public view for users to discover and interact with created maps

### Dependencies 📦
- [x] React 18
- [x] TypeScript
- [x] React Router DOM
- [x] Tailwind CSS
- [x] MapBox GL JS
- [x] @mapbox/mapbox-gl-draw
- [x] Turf.js
- [x] Recharts
- [x] Shadcn/UI components

### Core Components Structure 🏗️
- [x] Layout components
  - [x] MainLayout
  - [x] Sidebar
  - [x] BottomTabs
- [x] Map components
  - [x] MapContainer
  - [x] MapControls
  - [x] ElevationProfile
- [x] Page components
  - [ ] Home
  - [x] Create
  - [x] Explore

## Implementation Plan

### Phase 1: Core Infrastructure ✅ (Completed)
- [x] Project setup
- [x] Basic React application structure
- [x] Mobile-responsive layout implementation
- [x] MapBox integration
- [x] Basic routing setup
- [x] Environment configuration

### Phase 2: Basic Map Features (In Progress)
- [x] Map display and controls
  - [x] Basic map rendering
  - [x] Zoom controls
  - [x] Pan controls
  - [x] Location detection
  - [x] Map style switching
- [x] Navigation implementation
  - [x] Sidebar component
  - [x] Bottom navigation tabs
  - [x] Basic routing between views

### Phase 3: Route Management (Next Focus)
- [ ] Admin route creation tools
  - [ ] Manual route drawing
  - [ ] GPX file upload and parsing
  - [ ] Route preview
  - [ ] Route editing

### Phase 4: Advanced Features (Planned)
- [ ] Points of Interest system
- [ ] Gradient visualization
- [ ] Comments system

### Phase 5: User Management (Planned)
- [ ] Authentication system
- [ ] User roles and permissions

### Phase 6: Sharing and Integration (Planned)
- [ ] Map sharing
- [ ] Multi-user features

### Phase 7: Mobile Optimization (Planned)
- [ ] React Native implementation
- [ ] Offline capabilities

### Phase 8: Testing and Polish (Planned)
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation

## Map Features

### Map Styles Implemented ✅
- [x] Mapbox Outdoor (default)
- [x] Light
- [x] Dark
- [x] Streets
- [x] Satellite
- [x] Satellite Streets

### Surface Types (To Be Implemented)
- [ ] Rating system (0-6):
  - [ ] 0: Green solid
  - [ ] 1: Green dashed yellow
  - [ ] 2: Yellow solid
  - [ ] 3: Yellow dashed red
  - [ ] 4: Red solid
  - [ ] 5: Red dashed maroon
  - [ ] 6: Maroon solid
- [ ] Special types:
  - [ ] Bike paths: Purple solid
  - [ ] Gravel bike paths: Purple dashed

### Gradient System (To Be Implemented)
- [ ] Grade classifications:
  - [ ] 0-3%: Green
  - [ ] 3-6%: Yellow
  - [ ] 6-9%: Orange
  - [ ] 9-12%: Red
  - [ ] 12-15%: Maroon
  - [ ] 15%+: Black

### Points of Interest Categories (To Be Implemented)
- [ ] Infrastructure
- [ ] Services
- [ ] Accommodation
- [ ] Natural Features
- [ ] Information

## Getting Started

### Prerequisites
- Node.js
- npm
- Git

### Installation
1. Clone the repository
```bash
git clone https://github.com/yourusername/lutruwita.git
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env.local` file with your Mapbox token:
```
VITE_MAPBOX_TOKEN=your_token_here
```

4. Start the development server
```bash
npm run dev
```

## Contributing
Project is in active development. Contribution guidelines will be added once basic structure is stable.

## License
TBD

## Contact
[To be added]

### My Original Vision
- I want to make a web app that is easily translatable to mobile.. 
- I would like to use react + react native so that I have the option to scale in the future
- I would like to use material ui for the bottom navigation which will be scrollable tabs with icons.. give me 6 place holder tabs
- I dont want a top navbar, I want to use Shadcn/UI Sidebar..
- It is to be a web app that creates beautiful maps for people to engage with, whether it be cycling or hiking etc.
- There will need to be a floating map tools panel for search, current location, zoom and pivot
- One page will be to create a map (so like an admin page almost), the user will then be able to embed that map and other people will be able to interact with it
- On the admin page, the user will be able to either upload a gpx file or draw a route onto the map (The gpx file or the drawn route will take into account the surface type of the road, track or path it is on) and be a solid line for paved or a dashed line for unpaved or unknown
- I would like the map to be mapbox outdoor to begin with but give the option of light, dark, streets, satellite, hybrid and 3d (the user will also be able to select this option
- There will be a comment system for the admin as well as the users where they can create a point of interest on the map and choose an icon to associate with it.. I would like to see it as sort of like a speech box or something with an icon in it that they choose (it might be for a town, supermarket, petrol station, bike shop, camping site, accommodation, tourist poi, cafe or restaurant, swimming spot, water point, river crossing, warning, train station, bus stop, ferry, hazard etc.)
- On the sidebar, I would like there to be three toggles, when one is enables, the other two are still present but you wont be able to interact with them 1. The route toggle (this will be draw mode for admin, or for the user they will be able to see the full route of gpx), the admin will be able to add many routes to one map, so there may be more than one. In admin, there should be an option to add another, then another etc. There should be an elevation profile as they draw (sticky at the bottom of the screen above the tabs). The elevation profile should also show the surface type and a coloured by the grade. 0 - 3% green, 3 - 6% yellow, 6 - 9% orange, 9 - 12% red, 12 - 15% maroon, 15% + black. The route should always be shown on the page, but really transparent when the surface type is toggled. The route line should be cyan. 2. Gradient Toggle - this will turn the route into a gradient, showing the steepness of the course. This is only required for the user.3. Surface Toggle - this will allow the admin to go into draw mode again and draw segments over roads with a rating of 0 - 6 (which will essentially be a guide for the surface type of the road). 0 - green, 1 - green dashed yellow, 2 - yellow, 3 - yellow dashed red, 4 - red, 5 red dashed moroon, 6 maroon. Also purple for bike paths and purple dashed for gravel bike paths. I would like the segment line to be wide and fairly transparent. It should always be present on the page, but more transparent when the gradient or route are toggled. 

