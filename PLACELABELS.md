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