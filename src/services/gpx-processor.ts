import { parseGpx } from '../utils/gpx/parsing';
import { ProcessedRoute, GpxPoint, RouteSegment } from '../types/gpx-types';
import { v4 as uuidv4 } from 'uuid';
import type { Feature, FeatureCollection } from 'geojson';

/**
 * GpxProcessor handles the processing of GPX files into a standardized route format.
 * It provides functionality for:
 * - Parsing GPX files into points
 * - Calculating distances between points
 * - Creating GeoJSON representations of routes
 * - Managing route segments with surface information
 */
export class GpxProcessor {
  /**
   * Processes a GPX file and converts it into a standardized route format.
   * 
   * @param file - Buffer containing the GPX file data
   * @param fileName - Name of the GPX file (used for route naming)
   * @returns Promise resolving to a ProcessedRoute object containing route data and GeoJSON
   * @throws Error if GPX processing fails
   */
  async processGpx(file: Buffer, fileName: string): Promise<ProcessedRoute> {
    try {
      // Parse GPX file
      const points = await parseGpx(file);
      
      // Create initial segment with geometry
      const initialSegment: RouteSegment = {
        surface: 'unpaved', // Default surface type
        distance: this.calculateTotalDistance(points),
        geometry: {
          type: 'LineString',
          coordinates: points.map(point => [point.lon, point.lat])
        }
      };

      // Create GeoJSON feature collection
      const geojson = this.createGeoJSON([initialSegment]);
      
      // Create processed route
      const processedRoute: ProcessedRoute = {
        id: uuidv4(),
        name: fileName.replace(/\.gpx$/i, ''),
        color: '#FF5733', // Default color
        isVisible: true,
        gpxData: file.toString('utf-8'),
        segments: [initialSegment],
        geojson
      };

      return processedRoute;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GPX processing failed: ${error.message}`);
      }
      throw new Error('GPX processing failed: Unknown error');
    }
  }

  /**
   * Creates a GeoJSON FeatureCollection from route segments.
   * Each segment becomes a Feature with properties including surface type and distance.
   * 
   * @param segments - Array of route segments to convert to GeoJSON
   * @returns GeoJSON FeatureCollection containing route segment features
   */
  private createGeoJSON(segments: RouteSegment[]): FeatureCollection {
    const features = segments.map((segment, idx): Feature => ({
      type: 'Feature',
      properties: {
        surface: segment.surface,
        segmentIndex: idx,
        distance: segment.distance
      },
      geometry: segment.geometry
    }));

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Calculates the total distance of a route by summing distances between consecutive points.
   * Uses the Haversine formula for accurate Earth-surface distance calculation.
   * 
   * @param points - Array of GPX points to calculate total distance for
   * @returns Total distance in meters
   */
  private calculateTotalDistance(points: GpxPoint[]): number {
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      totalDistance += this.calculateDistance(points[i - 1], points[i]);
    }
    return totalDistance;
  }

  /**
   * Calculates the distance between two points using the Haversine formula.
   * This provides accurate distances over the Earth's surface, accounting for the planet's curvature.
   * 
   * @param point1 - First GPX point
   * @param point2 - Second GPX point
   * @returns Distance between points in meters
   */
  private calculateDistance(point1: GpxPoint, point2: GpxPoint): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lon - point1.lon) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
