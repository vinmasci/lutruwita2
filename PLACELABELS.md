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