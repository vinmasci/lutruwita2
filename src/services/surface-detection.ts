import type { GpxPoint } from '../types/gpx-types';

interface RouteSegment {
  points: GpxPoint[];
  surface: string;
  length: number;
  percentage: number;
}

interface SurfaceDetectionResponse {
  surface_type: string;
  intersection_length: number;
  total_route_length: number;
  percentage: number;
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
  
      const surfaceData = await response.json();
      console.log('Received surface data:', surfaceData);
      
// Find segments along the route
const surfaceSegments = surfaceData.filter(s => s.intersection_length > 0)
.sort((a, b) => b.intersection_length - a.intersection_length);

// If no valid segments found, return unknown surface type
if (surfaceSegments.length === 0) {
console.log('No valid surface segments found, defaulting to unknown');
return points.map(pt => ({
  ...pt,
  surface: 'unknown'
}));
}

// Calculate surface type based on intersection length
const totalIntersectionLength = surfaceSegments.reduce((sum, segment) => 
sum + segment.intersection_length, 0);

// Use the surface type with the longest intersection
const dominantSurface = surfaceSegments[0]?.surface_type || 'unknown';
console.log('Dominant surface type:', dominantSurface, 
          'Total intersection length:', totalIntersectionLength);
  
      // Map points to the most likely surface based on proximity
      return points.map(pt => {
        const nearestSurface = surfaceSegments[0].surface_type;
        return {
          ...pt,
          surface: nearestSurface
        };
      });
    } catch (error) {
      console.error('Surface detection error:', error);
      return points.map(pt => ({ ...pt, surface: 'unknown' }));
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
        surface: data.surface_type,
        length: data.intersection_length,
        percentage: data.percentage
      }));
    } catch (error) {
      console.error('Surface breakdown error:', error);
      return [];
    }
  }

  static splitIntoSegments(points: GpxPoint[]): RouteSegment[] {
    const segments: RouteSegment[] = [];
    let currentSegment: GpxPoint[] = [];
    let currentSurface = points[0]?.surface || 'unknown';
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
        currentSurface = point.surface || 'unknown';
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