# Map Matching Implementation Plan

## Current Implementation vs New Approach

### Current Implementation to Keep:
- Current styling and visuals:
  - White stroke outline (5px width)
  - Red route line (3px width)
  - Solid line for paved sections
  - Dashed line (0.5, 1.5) for unpaved sections
  - Black semi-transparent distance markers with arrow
  - Start point marked with ▶
  - Distance values shown in tooltips
  - Zoom-dependent marker intervals (25km, 15km, 10km, 5km)

### Proposed Changes:
- Replace direct point-to-point lines with Mapbox Map Matching
- Routes will follow actual road paths between points
- Surface data will come from Mapbox road attributes
- Animated route drawing as matching completes
- Loading overlay disappears after GPX processing
- Route appears to draw itself on the map progressively

## Implementation Steps

### 1. Initial Setup
- Set up Mapbox Map Matching API access
- Create test function to match small route segment
- Verify we can get matched routes and road attributes

### 2. Route Processing
- Split long GPX routes into processable chunks (max 100 points per API call)
- Implement queue system for processing chunks
- Add progress tracking for longer routes

### 3. Route Rendering
- Implement animated line drawing using line-dasharray
- Show immediate rough path while matching processes
- Update path segments as they're matched
- Keep distance markers aligned to matched route

### 4. Surface Detection
- Extract road surface type from Mapbox road metadata
- Map Mapbox road types to our surface categories
- Update styling based on matched road surfaces

### 5. Error Handling
- Handle API rate limits and quotas
- Implement retry logic for failed matches
- Fall back to direct lines if matching fails
- Handle gaps in road network

## Technical Considerations

### API Limits
- 100 points per request maximum
- Rate limits based on Mapbox plan
- Need to implement request throttling

### Performance Optimization
1. Progressive Loading:
   - Show immediate feedback
   - Process in background
   - Update UI as segments complete

2. Caching Strategy:
   - Cache matched routes
   - Store processed segments
   - Reuse for common routes

3. Error Recovery:
   - Retry failed segments
   - Fall back to simpler matching
   - Maintain partial results

## User Experience

### Loading & Animation:
1. Initial Upload & Animation:
   - Remove loading overlay after GPX processing
   - Draw route progressively from start to finish
   - Animate route being drawn like "drawing itself" on the map
   - Each segment appears to "flow" onto the map as it's matched
   - Visual effect similar to GPS tracking animation
   - Maintain all current styling while animating

2. During Processing:
   - Show progress through route
   - Animate matched segments
   - Update distance markers

3. Completion:
   - Smooth transition to final route
   - Update all markers and info
   - Enable user interactions

### Visual Feedback:
- Progress indicator for long routes
- Clear status messages
- Visual distinction between matched/unmatched segments

## Next Steps

1. Create proof of concept with small route
2. Test performance with various route lengths
3. Implement chunking for longer routes
4. Add progress tracking and animations
5. Integrate with existing surface display system