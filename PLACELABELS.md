# Place POI Feature - Progress Update

## Current Status

### Working ✅
1. Place POI Mode Toggle
   - Sidebar button successfully toggles place POI mode
   - Visual feedback when mode is active (button highlight)

2. Place Detection
   - Successfully detects place labels (towns, cities, suburbs)
   - Hover detection working with visual feedback
   - Click detection working and opens modal

3. Initial UI Flow
   - PlaceManager component mounting correctly
   - Modal opens when place is clicked
   - Basic POI type selection interface implemented

### Issues to Fix 🔧
1. PlacePOIModal DOM Nesting Issues
   - `<h6>` cannot appear as child of `<h2>` in DialogTitle
   - `<button>` cannot appear as descendant of `<button>` in ListItems
   - Need to restructure modal components to follow Material-UI guidelines

2. POI Saving and Rendering
   - POIs not yet being saved after selection
   - No visual rendering of POIs under place labels
   - Need to implement POI persistence layer

3. Visual Polish
   - Highlight effect positioning needs refinement
   - Consider more subtle hover effects
   - Better visual hierarchy for place labels and attached POIs

## Next Steps

### Immediate Tasks
1. Fix Modal Structure
   ```typescript
   // Replace nested h6 in DialogTitle
   // Fix button nesting in ListItems
   // Implement proper Material-UI patterns
   ```

2. Implement POI Persistence
   - Create data structure for place-attached POIs
   - Add save functionality to POIManager
   - Handle POI state updates

3. Visual Improvements
   - Refine highlight positioning
   - Add proper stacking for multiple POIs
   - Implement zoom level handling

### Future Enhancements
1. POI Management
   - Bulk editing capabilities
   - POI reordering within place groups
   - POI visibility toggles

2. User Interface
   - Improved selection feedback
   - Better mobile support
   - Keyboard navigation

3. Data Structure
   - Optimize for large numbers of POIs
   - Handle place label changes
   - Support offline capabilities

## Technical Notes
- Place detection using Mapbox label layers working well
- Modal state management needs review
- Consider caching mechanism for frequent place queries
- Need to implement proper cleanup on unmount

## Outstanding Questions
1. How to handle POI positioning when multiple POIs exist for one place?
2. What's the best approach for handling place label zoom levels?
3. How to manage POI visibility at different zoom levels?
4. Should we implement clustering for dense POI areas?

This document will be updated as implementation progresses and new challenges or solutions are discovered.

I am trying to implement a places POI
Basically when the user presses the PLACES POI icon on the sidebar:
1. We go into Places POI mode
2. The user clicks the map and it snaps to the nearest place label (town, village, city or suburb)
3. The PlacesModal then opens and the user can assign icons to the place
4. The icons show on the place below the label

After analyzing the code, I can identify several key issues why the place POI functionality isn't working:

Layer Pattern Mismatch:
The original code was looking for layer patterns like 'settlement-label', 'place-city-label', etc.
However, the satellite-streets-v12 style uses different layer names for places
The correct patterns should be 'settlement-major-label', 'settlement-minor-label', and 'settlement-subdivision-label'
Component Connection Issue:
In map-container.tsx, the PlaceManager is rendered conditionally with placePOIMode, but it's not properly connected to the sidebar's state
The placePOIMode prop is passed from Sidebar -> MapContainer -> PlaceManager, but the PlacePOIModeManager component (which should handle the mode state) isn't being used
Event Handler Setup:
The click handlers are being set up in useEffect, but they might be getting removed or not properly attached if the map style isn't fully loaded
The map.once('styledata') event might fire before we're ready to set up handlers
Debug Information:
Looking at the console logs, when you click the Places POI icon, it logs "Toggling placePOIMode: true" from sidebar.tsx
However, we're not seeing any logs from PlaceManager's click handler, which suggests either: a) The click events aren't reaching the PlaceManager b) The layer querying isn't finding any features c) The detection radius might be too small
To fix these issues:

The layer patterns have been updated to match the satellite-streets style - DONE!!
We should properly connect the PlacePOIModeManager to handle the state 
We should ensure the click handlers are properly set up after the map and style are fully loaded
We should add more detailed logging to track the feature detection process

What We Know For Certain
Component Setup

The component hierarchy is:

MainLayout

Sidebar (has Places POI button)
MapContainer

PlaceManager (should mount when in Places POI mode)







State and Props - What we know

placePOIMode state is defined in MainLayoutContent:
typescriptCopyconst [placePOIMode, setPlacePOIMode] = useState(false)

This state is passed to both Sidebar and MapContainer as props

What's Working

The Places POI button in Sidebar is being clicked and its click handler is executing

Confirmed by log: DEBUG -- Place POI Button Clicked -- Current mode: false Setting to: true


The map is loading and ready

Confirmed by logs:
Copy[MapContainer] Base map loaded
[MapContainer] Roads layer added, map is ready.
[isReady] Map check => {ready: true, isMapReady: true, streetsLayersLoaded: true}




What's Not Working

MapContainer is receiving placePOIMode as undefined

Confirmed by log: DEBUG -- MapContainer render -- Checking PlaceManager conditions: {placePOIMode: undefined, hasMap: true, mapIsReady: true}



Potential Problems
State Management Issues

State Update Not Propagating

The state change in Sidebar might not be properly updating MainLayout's state
The setState function might not be properly bound


Props Chain Break

There might be a break in the props chain between MainLayout and MapContainer
Props might be getting overwritten somewhere



Component Mounting Issues

Component Order

MapContainer might be rendering before state is initialized
Re-renders might not be triggered properly after state changes


Conditional Rendering

The condition for mounting PlaceManager might be incorrectly structured
Boolean evaluation might be failing due to undefined value



Type Issues

TypeScript Definition Problems

MapContainerProps might not be properly typed
Optional props might be causing undefined values



Render Cycle Issues

State Synchronization

State updates might be happening out of sync with component lifecycle
Multiple re-renders might be causing state resets



Next Steps for Investigation

Add state change logging in MainLayout
Verify props types in MapContainer
Check for any HOCs (Higher Order Components) that might be affecting prop passing
Verify that setPlacePOIMode is actually changing the state in MainLayout

Component Communication Requirements

Button Click in Sidebar → State Update in MainLayout
State Change in MainLayout → Props Update to MapContainer
Props Change in MapContainer → Mount PlaceManager
Mount PlaceManager → Setup Click Handlers



# Place POI System Implementation

## Overview
The Place POI system allows users to add POI markers that automatically snap to and group under map place labels (towns, cities, suburbs). This is separate from the regular POI system and provides a way to organize location-specific amenities and features under their respective place names.

## Core Functionality

### Label Snapping
- POIs automatically detect and snap to the nearest map place label
- POIs stay aligned with place labels during map zoom/pan operations
- Multiple POIs can be grouped under a single place label
- POIs scale appropriately with map zoom level

### Visual Organization
- POIs stack underneath the place name in an organized way
- Maintain consistent styling, colors, and stroke with existing POI system
- Visual hierarchy preserves map label readability

### Use Cases
Users can add multiple features to a place such as:
- Public amenities (toilets, parking)
- Commercial services (cafes, restaurants, supermarkets)
- Transport infrastructure (train stations, bus stops)
- Any other POI type that relates to the place

## Technical Implementation Requirements

### Place Label Detection
- System needs to detect place labels near click points
- Must identify label type (town, city, suburb, etc.)
- Should work with various map zoom levels

### POI Management
- Separate from regular POI system
- Needs additional metadata for place attachment
- Must handle multiple POIs per place label
- Requires position management for POI stacking

### UI Components
- New sidebar control for Place POI mode
- Modified POI creation flow for place attachment
- Visual indication of place-attached vs regular POIs

### Data Structure Extensions
```typescript
interface PlaceAttachedPOI extends POI {
  placeId: string;
  placeName: string;
  placeType: 'town' | 'city' | 'suburb' | 'village';
  stackPosition: number;  // Position in the stack under the place label
}
```

## Implementation Phases

### Phase 1: Place Label Detection
- Implement place label detection around click points
- Determine optimal detection radius
- Handle different place types

### Phase 2: POI Attachment
- Create place-attached POI data structure
- Implement POI to label snapping
- Develop stacking logic for multiple POIs

### Phase 3: UI Integration
- Add Place POI mode to sidebar
- Modify POI creation modal for place attachment
- Add visual indicators for place-attached POIs

### Phase 4: Zoom Handling
- Implement scaling behavior
- Ensure proper label alignment across zoom levels
- Handle POI visibility at different zoom levels

## Technical Considerations

### Label Detection
- Use map.queryRenderedFeatures() to find place labels
- Consider performance implications of frequent queries
- Handle cases where no label is found

### POI Positioning
- Calculate optimal spacing between stacked POIs
- Handle label position updates during map movement
- Consider collision detection between POIs

### Performance
- Optimize render updates during map interactions
- Efficiently handle multiple POIs per place
- Consider lazy loading for out-of-view POIs

## Usage Example
```typescript
// Example of adding a POI to a place
interface PlacePOIAddition {
  placeLabel: string;
  poiType: POIType;
  position: {
    lat: number;
    lon: number;
  };
}

// The system will:
1. Detect nearest place label
2. Create POI with place attachment
3. Position POI in next available stack position
4. Maintain position relative to place label
```

## Future Enhancements
- Grouping/clustering of POIs under busy labels
- Custom stacking arrangements
- Filter/search by place name
- Bulk POI addition to places
- Export/import place POI data

This document serves as a reference for implementing and maintaining the Place POI system, ensuring consistent behavior and proper integration with the existing POI functionality.

# Place POI Feature Implementation - Progress Update

## Completed Work ✅

1. Initial Detection System
- Created PlaceManager component for detecting place labels
- Set up infrastructure for querying map features around click points
- Implemented logging system to understand available place label layers
- Successfully integrated PlaceManager with existing map container

2. Component Structure
```
src/components/ui/map/components/place-poi/
└── PlaceManager.tsx
```

## Next Steps 🚀

### Immediate Tasks
1. Label Detection Refinement
   - Analyze logged data to determine optimal label layers to target
   - Define criteria for what constitutes a valid place label
   - Implement proper distance-based selection for nearby labels

2. POI Snapping System
   - Develop logic to snap POIs to detected labels
   - Create visual feedback for when a label is detected
   - Implement stacking logic for multiple POIs under one label

3. UI/UX Implementation
   - Add sidebar control for Place POI mode
   - Create visual distinction between regular POIs and place-attached POIs
   - Implement hover states for interactive labels

### Future Development
1. Place POI Management
   - Group management interface for POIs under the same place
   - Bulk editing capabilities for place-attached POIs
   - POI reordering within place groups

2. Visual Enhancements
   - Implement proper scaling with zoom levels
   - Add transitions for POI placement
   - Develop collision detection between POIs

3. Data Structure Updates
   - Finalize place-attached POI data structure
   - Implement persistence layer for place associations
   - Add metadata for place categorization

## Technical Notes 📝

### Current Implementation
```typescript
// Core detection system
const handleClick = (e: mapboxgl.MapMouseEvent & { lngLat: mapboxgl.LngLat }) => {
  const labelLayers = map.getStyle().layers
    .filter(layer => layer.id.includes('label') && layer.id.includes('place'))
    .map(layer => layer.id);

  const features = labelLayers.flatMap(layerId => 
    map.queryRenderedFeatures(bbox, { layers: [layerId] })
  );
};
```

### Next Implementation Requirements
1. Refined Detection:
   ```typescript
   interface PlaceLabel {
     name: string;
     type: 'town' | 'city' | 'suburb' | 'village';
     coordinates: [number, number];
     attachedPOIs: POI[];
   }
   ```

2. POI Attachment System:
   ```typescript
   interface PlaceAttachedPOI extends POI {
     placeId: string;
     stackPosition: number;
   }
   ```

## Outstanding Questions 🤔
1. How to handle zoom level changes for place label detection?
2. What's the optimal stacking arrangement for multiple POIs?
3. How to handle places that appear/disappear at different zoom levels?

## Next Development Session Goals
1. Complete place label detection analysis
2. Begin implementation of POI snapping system
3. Create initial UI controls for Place POI mode
4. Test label detection with various map zoom levels

## Long-term Considerations
1. Performance optimization for areas with many places
2. Mobile-friendly interaction patterns
3. Accessibility considerations for place selection
4. Data synchronization strategy for offline use

This update reflects the initial setup of the place detection system and outlines the next critical steps in developing the full Place POI feature.

# Current Implementation Progress

## Completed ✅
1. Created base PlaceManager component with place label detection
2. Added Place POI button to sidebar
3. Basic hover detection system for place labels
4. Click handler for place selection

## Current State
- Sidebar has a Place POI button that toggles `placePOIMode`
- When active, PlaceManager is rendered and starts detecting nearby place labels
- Basic click detection is working with console logging of selected places
- Visual feedback via Snackbar when a place is selected

## Current Issues 🔧
1. PlaceManager and POIManager are conflicting - need to ensure they don't both handle map clicks
2. Need to implement the PlaceHighlight component for visual feedback during hover
3. Need to create PlacePOIModal for adding POIs to selected places

## Next Steps 🚀
1. Implement PlaceHighlight component for visual feedback when hovering near place labels
2. Create PlacePOIModal component:
   - Allow selecting multiple POI types
   - Group POIs under place label
   - Handle POI positioning/stacking
3. Set up data structure for storing place-attached POIs
4. Implement visual stacking system for POIs under place labels
5. Add zoom level handling for place-attached POIs

## Files Created/Modified
- `/src/components/ui/map/components/place-poi/PlaceManager.tsx`
- `/src/components/ui/sidebar.tsx` (added Place POI button)
- `/src/components/ui/map/components/place-poi/PlacePOIModal.tsx` (created but not implemented)
- `/src/components/ui/map/components/place-poi/PlaceHighlight.tsx` (created but not implemented)

## Code State
Currently using a simple state in sidebar.tsx:
```typescript
const [placePOIMode, setPlacePOIMode] = useState(false);
```

Place POI button toggle:
```typescript
<ListItemButton
  onClick={() => setPlacePOIMode(!placePOIMode)}
  sx={{ justifyContent: open ? 'start' : 'center', minHeight: 48 }}
>
```

PlaceManager rendering:
```typescript
{placePOIMode && mapRef.current?.map && (
  <PlaceManager
    map={mapRef.current.map}
    onPlaceDetected={(place) => {
      if (place) {
        console.log('Selected place:', place);
        setPlacePOIMode(false);
        setSnackbar({
          open: true,
          message: `Selected ${place.name}`,
          severity: 'success'
        });
      }
    }}
  />
)}
```

## Technical Decisions Made
1. Keeping Place POI system separate from regular POI system
2. Using Material UI components for consistency with existing UI
3. Direct MapboxGL API usage for place label detection
4. Snackbar notifications for user feedback

## Next Technical Decisions Needed
1. Data structure for storing place-attached POIs
2. Strategy for handling POI stacking under place labels
3. Approach for scaling/showing/hiding POIs based on zoom level
4. Method for persisting place-POI relationships