# Surface Detection System - Detailed Technical Analysis

## Current Implementation Deep Dive

### Core Function: assignSurfacesViaNearest

The function processes GPX points in batches of 5, attempting to find road surfaces for each point. Here's the exact process:

```typescript
for (let i = 0; i < coords.length; i += 5) {
  const slice = coords.slice(i, i + 5);
  const pt = slice[0];
```

#### Step 1: Moving the Map and Loading Roads

For each batch of 5 points:

1. Takes first point of batch and creates a bounding box around it:
```typescript
const bbox = [
  pt.lon - 0.001,  // ~100m west
  pt.lat - 0.001,  // ~100m south
  pt.lon + 0.001,  // ~100m east
  pt.lat + 0.001   // ~100m north
];
```

2. Moves map to this bounding box:
```typescript
map.current?.fitBounds(
  [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
  {
    padding: 50,
    duration: 0,
    maxZoom: 13,
    minZoom: 13
  }
);
```

3. Queries ALL roads in view (THIS IS THE PROBLEM AREA):
```typescript
const features = map.current?.queryRenderedFeatures(undefined, {
  layers: ['custom-roads']
});
```

#### CRITICAL ISSUE #1: Too Many Roads
- Using undefined for queryRenderedFeatures means "query entire viewport"
- This returns ALL roads in view, not just ones near our point
- That's why we sometimes get 2000+ roads when we only need the closest one
- This is inefficient and can lead to incorrect matches

#### Step 2: Caching Roads

```typescript
if (features && features.length > 0) {
  cachedRoadsRef.current = turf.featureCollection(
    features.map((f) => turf.feature(f.geometry, f.properties))
  );
}
```

#### CRITICAL ISSUE #2: Cache Problems
- Caching ALL these roads (sometimes 2000+) is unnecessary
- We're caching roads for an entire viewport but only need ones near our point
- Cache gets cleared after processing 5 points anyway

#### Step 3: Processing Points in Slice

For each point in the 5-point batch:
```typescript
for (let s = 0; s < slice.length; s++) {
  const realIndex = i + s;
  const pt2 = slice[s];
  let bestSurface: 'paved' | 'unpaved' = 'unpaved';
  let minDist = Infinity;
  const pointGeo = turf.point([pt2.lon, pt2.lat]);
```

#### CRITICAL ISSUE #3: Point Processing Logic
- We're processing points in batches of 5 but using roads loaded from first point's location
- Later points in batch might be far from where we loaded roads
- This can cause "no roads found" errors for points 2-5 in each batch

### Missing Surface Detection: Root Causes

1. **Loading Issues**:
   - Moving map too quickly between points
   - Not waiting for tiles to fully load
   - Zoom level might change during movement

2. **Query Area Problems**:
   - Querying entire viewport instead of specific area
   - Getting too many irrelevant roads
   - Missing nearby roads due to loading timing

3. **Cache Issues**:
   - Caching too many roads
   - Cache cleared too frequently
   - Cache might contain roads from wrong location

### Data Flow Analysis

Current flow per batch:
1. Move map to first point
2. Load ALL roads in view
3. Cache these roads (often 2000+)
4. Try to find nearest road for each point
5. Clear cache
6. Repeat

This creates several problems:
- Map constantly jumping around
- Loading way too much data
- Point 5 might be nowhere near point 1's loaded roads

### Current Output Example
```plaintext
[Log] Found roads: – {count: 81, surfaces: Array}
[Log] Processing point #2100, coords=(-41.16984, 147.74979)
[Log] Available roads at this point: – [{surface: undefined, ...}, ...]
```

### Performance Impact
- Loading 2000+ roads when we need 1
- Processing every road for each point
- Moving map too frequently
- Caching unnecessary data

## Recommendations

1. **Immediate Fixes Needed**:
   - Query smaller area around each point
   - Don't use global viewport query
   - Process points individually
   - Remove caching system

2. **Query Optimization**:
   Instead of:
   ```typescript
   queryRenderedFeatures(undefined, ...)
   ```
   Use:
   ```typescript
   queryRenderedFeatures(
     [[pt.lon - 0.0001, pt.lat - 0.0001], 
      [pt.lon + 0.0001, pt.lat + 0.0001]],
     { layers: ['custom-roads'] }
   )
   ```

3. **Processing Changes**:
   - Process one point at a time
   - Ensure tiles are loaded before querying
   - Only look for closest road
   - Remove batching system

4. **Surface Detection Logic**:
   - Keep current surface type detection
   - Maintain fallback to 'unpaved'
   - Keep surface synonyms

## Technical Implementation Plan

1. Remove batching:
   ```typescript
   // Instead of i += 5
   for (let i = 0; i < coords.length; i++)
   ```

2. Focused area queries:
   ```typescript
   // Small area around point
   const bbox = [
     pt.lon - 0.0001,
     pt.lat - 0.0001,
     pt.lon + 0.0001,
     pt.lat + 0.0001
   ];
   ```

3. Remove caching:
   - Remove cachedRoadsRef entirely
   - Process roads immediately after query

4. Better loading checks:
   ```typescript
   // Ensure tiles loaded
   if (map.current?.areTilesLoaded()) {
     // Then query roads
   }
   ```

## Conclusion

Current system is doing much more work than needed:
- Loading entire viewports of roads
- Caching thousands of roads
- Processing in inefficient batches
- Moving map too frequently

Need to shift to:
- Point-by-point processing
- Small, focused queries
- No caching
- Minimal map movement



Current Batching Problem

The code is processing points in batches of 5

It only loads road data for the first point in each batch

This means points 2-5 in each batch might be trying to use road data from the wrong location

Example: If point 5 is far from point 1, it won't find any nearby roads