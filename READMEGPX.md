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

# Map Matching Implementation Progress

## Current Status
Working on implementing Mapbox Map Matching API to replace direct point-to-point lines with routes that follow actual roads.

### What's Working
1. Basic GPX file parsing
2. Point filtering and optimization:
   - Reduced points from 2428 to 1562 by filtering closely spaced points
   - Keeping start/end points of segments
   - Minimum 20m distance between points

2. Map Matching API Integration:
   - Successfully connecting to Mapbox Map Matching API
   - Handling chunks of 25 points
   - Basic error handling implemented

3. UI/UX:
   - Progress indicators working
   - Stage-based processing feedback
   - Fallback handling for failed matches

### Current Issues
1. Matching Quality:
   - Getting "NoMatch" and "NoSegment" responses for some segments
   - Some segments failing to match to any road network
   - Need to better handle transitions between matched and unmatched segments

2. API Challenges:
   - Initial profile errors (resolved by using correct API endpoint format)
   - Rate limiting considerations
   - Balancing chunk size with API limits

3. Route Continuity:
   - Gaps appearing between segments
   - Need better handling of segment transitions
   - Some matched routes not following visible roads

## Implementation Details

### Current Approach
1. Pre-processing:
   ```typescript
   - Filter points (> 20m apart)
   - Create overlapping segments (25 points)
   - Ensure segment continuity
   ```

2. Matching Strategy:
   ```typescript
   - Try cycling profile first
   - Fall back to walking/driving profiles
   - Use original points as last resort
   ```

3. Response Handling:
   ```typescript
   - Handle NoMatch/NoSegment gracefully
   - Create fallback responses
   - Maintain route continuity
   ```

## Next Steps

### Immediate Priorities
1. Profile Selection:
   - Implement cascading profile attempts (cycling → walking → driving)
   - Add profile-specific parameters
   - Better handle profile selection based on terrain

2. Segment Handling:
   - Improve segment overlap handling
   - Better transitions between segments
   - Smarter chunking based on terrain/density

3. Error Recovery:
   - Implement more sophisticated fallback strategies
   - Better handling of partial matches
   - Improved segment joining logic

### Future Improvements
1. Performance Optimization:
   - Cache successful matches
   - Optimize point filtering
   - Better handle large GPX files

2. Quality Improvements:
   - Validate matched routes against known paths
   - Handle off-road sections better
   - Improve surface type detection

3. User Experience:
   - Better progress indication
   - Manual override options
   - Visual feedback for match quality

## Technical Considerations

### API Usage
- Keep within rate limits (300 requests/minute)
- Monitor response times
- Handle timeouts gracefully
- Consider request batching

### Data Quality
- Balance point reduction vs route accuracy
- Handle GPS noise
- Consider elevation data

### Failed Attempts
1. Initial Implementation:
   - Direct point-by-point matching (too many requests)
   - Large segment sizes (API limits)
   - Single profile matching (poor success rate)

2. Matching Strategy:
   - No segment overlap (caused gaps)
   - Fixed chunk sizes (not terrain-aware)
   - Basic error handling (lost too many points)

## Questions to Resolve
1. What's the optimal segment size for our use case?
2. How to better handle off-road sections?
3. Should we implement manual override options?
4. How to better handle surface type detection?

## Notes for Next Implementation
1. Consider implementing a smarter chunking algorithm
2. Add better validation of matched routes
3. Implement caching for common routes
4. Add better handling of off-road sections
5. Consider adding manual adjustment tools