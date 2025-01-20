import { GpxPoint } from '../../types/gpx-types';
import { DOMParser } from '@xmldom/xmldom';

/**
 * Parses a GPX file buffer into an array of GpxPoint objects.
 * Extracts track points (trkpt) from the GPX XML structure, including:
 * - Latitude and longitude coordinates
 * - Elevation data (ele tag)
 * - Timestamps (time tag)
 * 
 * Each point is assigned a default surface type of 'unpaved' which can be
 * updated later during surface detection processing.
 * 
 * @param file - Buffer containing GPX file data in XML format
 * @returns Promise resolving to array of parsed GpxPoint objects
 * @throws Error if parsing fails or GPX format is invalid
 */
export async function parseGpx(file: Buffer): Promise<GpxPoint[]> {
  try {
    const xmlStr = file.toString('utf-8');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');

    // Extract all track points from GPX XML
    const trackPoints = xmlDoc.getElementsByTagName('trkpt');
    const points: GpxPoint[] = [];

    // Process each track point to extract coordinates and metadata
    for (let i = 0; i < trackPoints.length; i++) {
      const point = trackPoints[i];
      const lat = parseFloat(point.getAttribute('lat') || '0');
      const lon = parseFloat(point.getAttribute('lon') || '0');
      
      // Extract elevation data (optional in GPX format)
      const eleNode = point.getElementsByTagName('ele')[0];
      const ele = eleNode ? parseFloat(eleNode.textContent || '0') : 0;
      
      // Extract timestamp if available (optional in GPX format)
      const timeNode = point.getElementsByTagName('time')[0];
      const timestamp = timeNode ? timeNode.textContent || undefined : undefined;

      points.push({
        lat,
        lon,
        ele,
        timestamp,
        surface: 'unpaved' // Default surface type
      });
    }

    return points;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse GPX file: ${error.message}`);
    }
    throw new Error('Failed to parse GPX file: Unknown error');
  }
}
