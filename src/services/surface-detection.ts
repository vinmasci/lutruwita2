import type { Map as MapboxMap } from 'mapbox-gl';
import type { GpxPoint } from '../types/gpx-types';

const PAVED_SURFACES = [
  'paved', 'asphalt', 'concrete', 'compacted',
  'sealed', 'bitumen', 'tar'
];

const UNPAVED_SURFACES = [
  'unpaved', 'gravel', 'fine', 'fine_gravel', 
  'dirt', 'earth'
];

interface RouteSegment {
  points: GpxPoint[];
  surface: 'paved' | 'unpaved';
}

export class SurfaceDetectionService {
  private static readonly QUERY_BOX_SIZE = 10;
  private static readonly JUNCTION_CHECK_SIZE = 50;

  static async detectSurfaces(map: MapboxMap, points: GpxPoint[]): Promise<GpxPoint[]> {
    console.log('[SurfaceDetection] Starting surface detection for', points.length, 'points');
    
    // Check if custom-roads layer exists
    const hasRoadsLayer = map.getLayer('custom-roads');
    console.log('[SurfaceDetection] Custom roads layer exists:', !!hasRoadsLayer);
    
    // Wait for source to be loaded if it exists
    const hasRoadsSource = map.getSource('australia-roads');
    console.log('[SurfaceDetection] Roads source exists:', !!hasRoadsSource);
    
    if (!hasRoadsLayer || !hasRoadsSource) {
      console.warn('[SurfaceDetection] Roads layer or source missing - defaulting all surfaces to unpaved');
      return points.map(pt => ({ ...pt, surface: 'unpaved' }));
    }
    const results: GpxPoint[] = [];

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      
      // Convert point to pixel coordinates
      const pointPixel = map.project([pt.lon, pt.lat]);

      // First do a wide scan to detect junction areas
      const wideAreaCheck = map.queryRenderedFeatures(
        [
          [pointPixel.x - this.JUNCTION_CHECK_SIZE, pointPixel.y - this.JUNCTION_CHECK_SIZE],
          [pointPixel.x + this.JUNCTION_CHECK_SIZE, pointPixel.y + this.JUNCTION_CHECK_SIZE]
        ],
        { layers: ['custom-roads'] }
      );

      // Determine if we're at a complex junction
      const isComplexJunction = wideAreaCheck && wideAreaCheck.length > 1;
      let queryBox = this.QUERY_BOX_SIZE;

      if (isComplexJunction) {
        // Get unique road names to better identify true junctions
        const uniqueRoads = new Set(
          wideAreaCheck
            .map(f => f.properties?.name || f.properties?.ref)
            .filter(Boolean)
        );
        
        // Adjust query box based on junction complexity
        if (uniqueRoads.size > 1) {
          queryBox = 30; // Major junction
        } else if (wideAreaCheck.length > 2) {
          queryBox = 20; // Minor junction
        }
      }

      // Query for roads near the point with debug logging
      console.log(`[SurfaceDetection] Querying point ${i} at ${pt.lat},${pt.lon}`);
      let features = map.queryRenderedFeatures(
        [
          [pointPixel.x - queryBox, pointPixel.y - queryBox],
          [pointPixel.x + queryBox, pointPixel.y + queryBox]
        ],
        { layers: ['custom-roads'] }
      );

      // If no features found at junction, try circular pattern
      if (isComplexJunction && features.length === 0) {
        for (let angle = 0; angle < 360; angle += 45) {
          const radian = (angle * Math.PI) / 180;
          const offsetX = Math.cos(radian) * 40;
          const offsetY = Math.sin(radian) * 40;
          
          const radialFeatures = map.queryRenderedFeatures(
            [
              [pointPixel.x + offsetX - 10, pointPixel.y + offsetY - 10],
              [pointPixel.x + offsetX + 10, pointPixel.y + offsetY + 10]
            ],
            { layers: ['custom-roads'] }
          );
          
          if (radialFeatures && radialFeatures.length > 0) {
            features = features.concat(radialFeatures);
            break;
          }
        }
      }

      // Determine surface type with debug logging
      let surface: 'paved' | 'unpaved' = 'unpaved';
      if (features.length > 0) {
        console.log(`[SurfaceDetection] Found ${features.length} features for point ${i}:`, 
          features.map(f => ({ 
            surface: f.properties?.surface,
            geometry: f.geometry.type
          }))
        );
        // Get unique features by stringifying geometry
        const uniqueFeatures = Array.from(
          new Map(
            features.map(f => [JSON.stringify(f.geometry), f])
          ).values()
        );

        // Check for paved surfaces
        const hasPaved = uniqueFeatures.some(f => {
          const surfaceType = (f.properties?.surface || '').toLowerCase();
          return PAVED_SURFACES.includes(surfaceType);
        });

        surface = hasPaved ? 'paved' : 'unpaved';
      }

      results.push({ ...pt, surface });

      // Log progress every 100 points
      if (i % 100 === 0) {
        console.log(`[SurfaceDetection] Processed ${i} of ${points.length} points`);
      }
    }

    return results;
  }

  static splitIntoSegments(points: GpxPoint[]): RouteSegment[] {
    const segments: RouteSegment[] = [];
    let currentSegment: GpxPoint[] = [];
    let currentSurface = points[0]?.surface || 'unpaved';

    points.forEach((point, index) => {
      if (point.surface !== currentSurface && currentSegment.length > 0) {
        segments.push({
          points: [...currentSegment],
          surface: currentSurface
        });
        currentSegment = [point];
        currentSurface = point.surface || 'unpaved';
      } else {
        currentSegment.push(point);
      }

      // Handle last point
      if (index === points.length - 1 && currentSegment.length > 0) {
        segments.push({
          points: [...currentSegment],
          surface: currentSurface
        });
      }
    });

    return segments;
  }
}
