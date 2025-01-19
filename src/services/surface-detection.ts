import type { GpxPoint } from '../types/gpx-types';

interface RouteSegment {
  points: GpxPoint[];
  surface: 'paved' | 'unpaved';
  length: number;
  percentage: number;
}

interface SurfaceDetectionResponse {
  surface_type: 'paved' | 'unpaved' | 'unknown' | 'asphalt';
  intersection_length: number;
  total_route_length: number;
  percentage: number;
}

// Helper function to check if a surface is asphalt
function isAsphalt(surface: 'paved' | 'unpaved' | 'unknown' | 'asphalt'): boolean {
  return surface === 'asphalt';
}

// Helper function to standardize surface type
function convertSurface(surface: 'paved' | 'unpaved' | 'unknown' | 'asphalt'): NonNullable<GpxPoint['surface']> {
  // Log the surface type being standardized
  console.log('Standardizing surface:', surface);

  // Convert to standard surface type with inversion fix
  switch (surface) {
    case 'paved':
      console.log('Converting paved to unpaved (inversion fix)');
      return 'unpaved';
    case 'unpaved':
      console.log('Converting unpaved to paved (inversion fix)');
      return 'paved';
    case 'asphalt':
      console.log('Converting asphalt to unpaved (inversion fix)');
      return 'unpaved';
    case 'unknown':
    default:
      console.log('Unknown/unhandled surface type, defaulting to unpaved');
      return 'unpaved';  // Will show as paved in UI due to inversion
  }
}

export class SurfaceDetectionService {
  private static readonly API_URL = import.meta.env.VITE_API_BASE_URL;

  static async detectSurfaces(points: GpxPoint[]): Promise<GpxPoint[]> {
    console.log('Surface detection called with points:', points.length);
    
    try {
      const lineString = {
        type: 'LineString',
        coordinates: points.map(pt => [pt.lon, pt.lat])
      };
      
      console.log('Sending LineString to API:', lineString);
  
      const response = await fetch(`${this.API_URL}/api/surface-detection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ route: lineString })
      });
  
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        console.error('API Error:', await response.text());
        throw new Error('Surface detection failed');
      }
  
      // Type guard for surface segments
      const isSurfaceSegment = (s: unknown): s is SurfaceDetectionResponse => {
        return s !== null && typeof s === 'object' && 'intersection_length' in s;
      };

      const surfaceData = await response.json();
      console.log('Received surface data:', surfaceData);
      console.log('First few surface segments:', surfaceData.slice(0, 3).map((s: unknown) => {
        if (isSurfaceSegment(s)) {
          return {
            surface: s.surface_type,
            length: s.intersection_length,
            percentage: s.percentage
          };
        }
        return null;
      }).filter((s: unknown): s is NonNullable<typeof s> => s !== null));
      
      // Find segments along the route
      const surfaceSegments = surfaceData
        .filter((s: unknown): s is SurfaceDetectionResponse => {
          return isSurfaceSegment(s) && s.intersection_length > 0;
        })
        .sort((a: SurfaceDetectionResponse, b: SurfaceDetectionResponse) => 
          b.intersection_length - a.intersection_length
        );

      // If no valid segments found, default to unpaved
      if (surfaceSegments.length === 0) {
        console.log('No valid surface segments found, defaulting to unpaved');
        const defaultSurface: NonNullable<GpxPoint['surface']> = 'unpaved';
        return points.map(pt => ({
          ...pt,
          surface: defaultSurface
        }));
      }

      // Calculate surface type based on intersection length
      const totalIntersectionLength = surfaceSegments.reduce(
        (sum: number, segment: SurfaceDetectionResponse) => sum + segment.intersection_length, 
        0
      );

      // Use the surface type with the longest intersection
      const dominantSurface = surfaceSegments[0]?.surface_type || 'unknown';
      console.log('Dominant surface type:', dominantSurface, 
                'Total intersection length:', totalIntersectionLength);
        
      // Calculate total distance from start for each point
      let totalDistance = 0;
      const pointDistances = points.map((pt, idx) => {
        if (idx === 0) return { point: pt, distance: 0 };
        totalDistance += calculateDistance(points[idx - 1], pt);
        return { point: pt, distance: totalDistance };
      });

      // Map points to surfaces based on their position along the route
      const surfacedPoints = pointDistances.map(({ point, distance }, index) => {
        // Calculate relative position along route
        const position = distance / totalDistance;
        
        interface SegmentBoundary {
          segment: SurfaceDetectionResponse;
          start: number;
          end: number;
        }

        // Calculate cumulative lengths for each segment
        let cumulativeLength = 0;
        const segmentBoundaries = surfaceSegments.map((s: SurfaceDetectionResponse): SegmentBoundary => {
          const start = cumulativeLength / totalIntersectionLength;
          cumulativeLength += s.intersection_length;
          const end = cumulativeLength / totalIntersectionLength;
          return { segment: s, start, end };
        });

        // Find segments that contain this point
        const containingSegments = segmentBoundaries.filter((boundary: SegmentBoundary) => {
          // Add buffer around segment boundaries
          const bufferedStart = Math.max(0, boundary.start - 0.01);
          const bufferedEnd = Math.min(1, boundary.end + 0.01);
          return position >= bufferedStart && position <= bufferedEnd;
        });

        if (containingSegments.length > 0) {
          // If point is in multiple segments, use the one with highest intersection length
          const dominantSegment = containingSegments[0].segment; // Already sorted by length
          const surface = convertSurface(dominantSegment.surface_type);
          console.log(`Point ${index}: Using dominant surface ${surface} from ${containingSegments.length} segments`);
          return { ...point, surface };
        }

        // If no direct match, find nearest segments
        const nearestBefore = segmentBoundaries.findLast((boundary: SegmentBoundary) => position > boundary.end);
        const nearestAfter = segmentBoundaries.find((boundary: SegmentBoundary) => position < boundary.start);

        if (nearestBefore && nearestAfter) {
          // Calculate relative position between segments
          const gapStart = nearestBefore.end;
          const gapEnd = nearestAfter.start;
          const gapPosition = (position - gapStart) / (gapEnd - gapStart);

          // Use previous surface for first half, next surface for second half
          const surface = gapPosition <= 0.5 ?
            convertSurface(nearestBefore.segment.surface_type) :
            convertSurface(nearestAfter.segment.surface_type);

          console.log(`Point ${index}: Gap position ${gapPosition.toFixed(2)} between ${nearestBefore.segment.surface_type} and ${nearestAfter.segment.surface_type}`);
          return { ...point, surface };
        }

        // Default to nearest segment
        if (nearestBefore || nearestAfter) {
          const nearestSegment = nearestBefore?.segment || nearestAfter?.segment;
          if (nearestSegment) {
            const surface = convertSurface(nearestSegment.surface_type);
            console.log(`Point ${index}: Using nearest surface ${surface}`);
            return { ...point, surface };
          }
        }

        // If no segments found at all, default to unpaved
        console.log(`Point ${index}: No surface found, defaulting to unpaved`);
        const defaultSurface: NonNullable<GpxPoint['surface']> = 'unpaved';
        return { ...point, surface: defaultSurface };
      });

      // Log surface distribution
      const surfaceCount = surfacedPoints.reduce((acc, point) => {
        if (point.surface) {
          acc[point.surface] = (acc[point.surface] || 0) + 1;
        } else {
          acc.undefined = (acc.undefined || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      console.log('Surface distribution:', surfaceCount);

      // Return smoothed points
      return this.smoothSurfaces(surfacedPoints);
    } catch (error) {
      console.error('Surface detection error:', error);
      const defaultSurface: NonNullable<GpxPoint['surface']> = 'unpaved';
      return points.map(pt => ({ ...pt, surface: defaultSurface }));
    }
  }

  static async getSurfaceBreakdown(points: GpxPoint[]): Promise<RouteSegment[]> {
    try {
      const lineString = {
        type: 'LineString',
        coordinates: points.map(pt => [pt.lon, pt.lat])
      };

      const response = await fetch(`${this.API_URL}/api/surface-detection/breakdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ route: lineString })
      });

      if (!response.ok) {
        throw new Error('Surface breakdown failed');
      }

      const surfaceData: SurfaceDetectionResponse[] = await response.json();
      
      return surfaceData.map(data => ({
        points: [], // We'll need to implement point segmentation if needed
        surface: convertSurface(data.surface_type),
        length: data.intersection_length,
        percentage: data.percentage
      }));
    } catch (error) {
      console.error('Surface breakdown error:', error);
      return [];
    }
  }

  // Post-process points to smooth transitions and fill gaps
  private static smoothSurfaces(points: GpxPoint[]): GpxPoint[] {
    const smoothed = [...points];
    
    // First pass: identify valid transition points
    const transitions: number[] = [];
    let lastSurface: GpxPoint['surface'] = points[0]?.surface;
    
    for (let i = 1; i < points.length; i++) {
      if (points[i].surface !== lastSurface) {
        // Only add transition if surfaces are different
        const nextSurface = points[i].surface;
        if (lastSurface !== undefined && nextSurface !== undefined && lastSurface !== nextSurface) {
          transitions.push(i);
        }
        lastSurface = nextSurface;
      }
    }

    console.log('Found valid transition points at indices:', transitions);

    // Second pass: find and fill all gaps
    let i = 0;
    while (i < points.length) {
      // Skip points that already have a surface
      if (smoothed[i].surface) {
        i++;
        continue;
      }

      // Found a gap, find its boundaries
      let gapStart = i;
      let gapEnd = i;

      // Search forwards for end of gap
      while (gapEnd < points.length - 1 && !smoothed[gapEnd + 1].surface) {
        gapEnd++;
      }

      // Get the surfaces before and after gap
      const prevSurface = gapStart > 0 ? smoothed[gapStart - 1].surface : undefined;
      const nextSurface = gapEnd < points.length - 1 ? smoothed[gapEnd + 1].surface : undefined;

      console.log(`Found gap from ${gapStart} to ${gapEnd}`);
      console.log(`Previous surface: ${prevSurface}, Next surface: ${nextSurface}`);

      if (prevSurface && nextSurface) {
        if (prevSurface === nextSurface) {
          // If surfaces match, fill entire gap with that surface
          for (let j = gapStart; j <= gapEnd; j++) {
            smoothed[j].surface = prevSurface;
            console.log(`Filled point ${j} with ${prevSurface} (matching surfaces)`);
          }
        } else {
          // Different surfaces, split at midpoint
          const gapLength = gapEnd - gapStart + 1;
          const midpoint = gapStart + Math.floor(gapLength / 2);

          console.log(`Gap length: ${gapLength}, Midpoint: ${midpoint}`);

          // Fill first half with previous surface
          for (let j = gapStart; j <= midpoint; j++) {
            smoothed[j].surface = prevSurface;
            console.log(`Filled point ${j} with ${prevSurface} (first half)`);
          }

          // Fill second half with next surface
          for (let j = midpoint + 1; j <= gapEnd; j++) {
            smoothed[j].surface = nextSurface;
            console.log(`Filled point ${j} with ${nextSurface} (second half)`);
          }
        }
      } else {
        // Only one surface available, use it for entire gap
        const surface = prevSurface || nextSurface;
        if (surface) {
          for (let j = gapStart; j <= gapEnd; j++) {
            smoothed[j].surface = surface;
            console.log(`Filled point ${j} with ${surface} (single surface)`);
          }
        }
      }

      // Move to next point after gap
      i = gapEnd + 1;
    }

    // Final pass: fill any remaining gaps with nearest known surface
    for (let i = 0; i < points.length; i++) {
      if (!smoothed[i].surface) {
        let prevIdx = i - 1;
        let nextIdx = i + 1;
        
        // Find nearest known surfaces
        while (prevIdx >= 0 && !smoothed[prevIdx].surface) prevIdx--;
        while (nextIdx < points.length && !smoothed[nextIdx].surface) nextIdx++;
        
        const prevSurface = prevIdx >= 0 ? smoothed[prevIdx].surface : undefined;
        const nextSurface = nextIdx < points.length ? smoothed[nextIdx].surface : undefined;
        
        // Use nearest available surface
        smoothed[i].surface = prevSurface || nextSurface || 'unpaved';
      }
    }

    return smoothed;
  }

  static splitIntoSegments(points: GpxPoint[]): RouteSegment[] {
    // Smooth surfaces before segmenting
    points = this.smoothSurfaces(points);

    const segments: RouteSegment[] = [];
    let currentSegment: GpxPoint[] = [];
    const defaultSurface: NonNullable<GpxPoint['surface']> = 'unpaved';
    let currentSurface = points[0]?.surface || defaultSurface;
    let currentLength = 0;
    let totalLength = 0;

    points.forEach((point, index) => {
      if (point.surface !== currentSurface && currentSegment.length > 0) {
        segments.push({
          points: [...currentSegment],
          surface: currentSurface,
          length: currentLength,
          percentage: 0 // Will calculate after getting total
        });
        currentSegment = [point];
        currentSurface = point.surface || defaultSurface;
        currentLength = 0;
      } else {
        currentSegment.push(point);
        if (index > 0) {
          const prevPoint = points[index - 1];
          const segmentLength = calculateDistance(prevPoint, point);
          currentLength += segmentLength;
          totalLength += segmentLength;
        }
      }

      // Handle last point
      if (index === points.length - 1 && currentSegment.length > 0) {
        segments.push({
          points: [...currentSegment],
          surface: currentSurface,
          length: currentLength,
          percentage: 0
        });
      }
    });

    // Calculate percentages
    return segments.map(segment => ({
      ...segment,
      percentage: (segment.length / totalLength) * 100
    }));
  }
}

function calculateDistance(point1: GpxPoint, point2: GpxPoint): number {
  const R = 6371e3; // metres
  const φ1 = point1.lat * Math.PI/180; // φ, λ in radians
  const φ2 = point2.lat * Math.PI/180;
  const Δφ = (point2.lat-point1.lat) * Math.PI/180;
  const Δλ = (point2.lon-point1.lon) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}
