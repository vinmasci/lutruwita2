## RULES FOR CLAUDE AI
Before suggesting an update to a file, always check it on GITHUB first

# Lutruwita - Interactive Mapping Application

An advanced mapping platform for creating and sharing interactive routes for cycling, hiking, and outdoor activities in Tasmania.

## Current Status
🚧 **In Development** - Setting up initial project structure and dependencies

### Current Issues
- [x] Initial project setup with Create React App
- [x] Basic file structure created
- [x] Core components scaffolded
- [ ] Dependency conflicts resolving
  - Need to fix React Router DOM version issues
  - Web Vitals module needs proper configuration
- [ ] Tailwind configuration needs completion
- [ ] MapBox integration pending

## Project Setup Progress

### Environment Setup ⚙️
- [x] Create React App with TypeScript
- [x] Project structure organized
- [x] Git repository initialized
- [ ] Environment variables configured
- [ ] Development server running

### Dependencies 📦
- [x] React 19
- [x] TypeScript
- [ ] React Router DOM (needs version fix)
- [x] Tailwind CSS (partial)
- [ ] MapBox GL JS
- [ ] Turf.js
- [ ] Recharts
- [x] Shadcn/UI components (partial)
NOW USING VITE

### Core Components Structure 🏗️
- [x] Basic layout components created
  - [x] MainLayout
  - [x] Sidebar
  - [x] BottomTabs
- [x] Map components scaffolded
  - [x] MapContainer
  - [x] MapControls
  - [x] ElevationProfile
- [x] Page components created
  - [x] Home
  - [x] Create
  - [x] Explore

## Next Steps
1. Resolve current dependency issues:
   - Fix React Router DOM version
   - Configure Web Vitals properly
2. Complete Tailwind setup
3. Add MapBox integration
4. Implement drawing functionality

## Implementation Plan

### Phase 1: Core Infrastructure (Current Phase)
- [x] Project setup
- [x] Basic React application structure
- [x] Mobile-responsive layout implementation
- [ ] MapBox integration
- [ ] Basic routing setup
- [ ] Environment configuration

### Phase 2: Basic Map Features (Next Phase)
- [ ] Map display and controls
  - [ ] Basic map rendering
  - [ ] Zoom controls
  - [ ] Pan controls
  - [ ] Location detection
  - [ ] Map style switching
- [ ] Navigation implementation
  - [ ] Sidebar component
  - [ ] Bottom navigation tabs
  - [ ] Basic routing between views

### Phase 3: Route Management
- [ ] Route creation tools
  - [ ] Manual route drawing
  - [ ] GPX file upload and parsing
  - [ ] Route preview
  - [ ] Route editing
- [ ] Surface type system
- [ ] Elevation profile

### Phase 4: Advanced Features
- [ ] Points of Interest system
- [ ] Gradient visualization
- [ ] Comments system

### Phase 5: User Management
- [ ] Authentication system
- [ ] User roles and permissions

### Phase 6: Sharing and Integration
- [ ] Map sharing
- [ ] Multi-user features

### Phase 7: Mobile Optimization
- [ ] React Native implementation
- [ ] Offline capabilities

### Phase 8: Testing and Polish
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation

## Technical Details

### Map Styles to be Implemented
- [ ] Mapbox Outdoor (default)
- [ ] Light
- [ ] Dark
- [ ] Streets
- [ ] Satellite
- [ ] Hybrid
- [ ] 3D

### Route Features to be Implemented
- [ ] Line styles
- [ ] Surface types
- [ ] Gradient system
- [ ] Points of Interest

## Getting Started

### Prerequisites
- Node.js
- npm
- Git

### Current Setup Instructions
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Fix current dependency issues:
   ```bash
   npm install react-router-dom@6.21.1
   npm install web-vitals@3.5.1
   ```
4. Create necessary environment files (pending)

### Development
Currently working on resolving initial setup issues before proceeding with feature development.

## Contributing
Project is in initial setup phase. Contribution guidelines will be added once basic structure is stable.

## License
TBD

## Contact
[To be added]

### Surface Types
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

### Gradient System
- [ ] Grade classifications:
  - [ ] 0-3%: Green
  - [ ] 3-6%: Yellow
  - [ ] 6-9%: Orange
  - [ ] 9-12%: Red
  - [ ] 12-15%: Maroon
  - [ ] 15%+: Black

### Points of Interest Categories
- [ ] Infrastructure:
  - [ ] Towns
  - [ ] Train stations
  - [ ] Bus stops
  - [ ] Ferry points
- [ ] Services:
  - [ ] Supermarkets
  - [ ] Petrol stations
  - [ ] Bike shops
  - [ ] Cafes/Restaurants
- [ ] Accommodation:
  - [ ] Camping sites
  - [ ] Hotels/Hostels
- [ ] Natural Features:
  - [ ] Swimming spots
  - [ ] Water points
  - [ ] River crossings
- [ ] Information:
  - [ ] Tourist POIs
  - [ ] Warnings
  - [ ] Hazards

## Getting Started

[To be completed with setup instructions after initial development]

### Prerequisites

[To be completed with required software and tools]

### Installation

[To be completed with step-by-step installation guide]

### Development

[To be completed with development workflow instructions]

### Deployment

[To be completed with deployment procedures]

---

## Contributing

[To be completed with contribution guidelines]

## License

[To be completed with chosen license]

## Contact

[To be completed with contact information]

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