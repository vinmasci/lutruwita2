import { GpxProcessor } from '../gpx-processor';
import { parseGpx } from '../../utils/gpx/parsing';
import { GpxPoint } from '../../types/gpx-types';
import type { LineString } from 'geojson';

// Mock the parseGpx function
jest.mock('../../utils/gpx/parsing');
const mockedParseGpx = parseGpx as jest.MockedFunction<typeof parseGpx>;

describe('GpxProcessor', () => {
  let processor: GpxProcessor;
  
  // Sample GPX points for testing
  const samplePoints: GpxPoint[] = [
    { lat: 0, lon: 0, ele: 100, surface: 'unpaved' },
    { lat: 0, lon: 0.001, ele: 110, surface: 'unpaved' }, // ~111m east
    { lat: 0.001, lon: 0.001, ele: 120, surface: 'unpaved' }, // ~111m north
  ];

  beforeEach(() => {
    processor = new GpxProcessor();
    // Reset mock before each test
    jest.clearAllMocks();
  });

  describe('processGpx', () => {
    it('should process a valid GPX file successfully', async () => {
      // Mock the parseGpx function to return our sample points
      mockedParseGpx.mockResolvedValue(samplePoints);

      const testBuffer = Buffer.from('dummy gpx content');
      const fileName = 'test-route.gpx';

      const result = await processor.processGpx(testBuffer, fileName);

      // Verify parseGpx was called with correct arguments
      expect(mockedParseGpx).toHaveBeenCalledWith(testBuffer);

      // Check the processed route properties
      expect(result).toMatchObject({
        name: 'test-route',
        color: '#FF5733',
        isVisible: true,
        gpxData: 'dummy gpx content',
      });

      // Verify segments
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].surface).toBe('unpaved');
      
      // Verify GeoJSON
      expect(result.geojson).toBeDefined();
      expect(result.geojson?.features).toHaveLength(1);
      expect((result.geojson?.features[0].geometry as LineString).coordinates).toEqual(
        samplePoints.map(p => [p.lon, p.lat])
      );
    });

    it('should handle GPX parsing errors', async () => {
      // Mock parseGpx to throw an error
      mockedParseGpx.mockRejectedValue(new Error('Invalid GPX format'));

      const testBuffer = Buffer.from('invalid gpx content');
      const fileName = 'invalid.gpx';

      await expect(processor.processGpx(testBuffer, fileName))
        .rejects
        .toThrow('GPX processing failed: Invalid GPX format');
    });

    it('should calculate correct total distance', async () => {
      mockedParseGpx.mockResolvedValue(samplePoints);

      const testBuffer = Buffer.from('dummy gpx content');
      const fileName = 'test-route.gpx';

      const result = await processor.processGpx(testBuffer, fileName);

      // The total distance should be approximately 222 meters
      // (111m east + 111m north, using the Haversine formula)
      expect(result.segments[0].distance).toBeCloseTo(222, -1); // -1 means "within 10 meters"
    });
  });

  describe('GeoJSON creation', () => {
    it('should create valid GeoJSON with correct properties', async () => {
      mockedParseGpx.mockResolvedValue(samplePoints);

      const testBuffer = Buffer.from('dummy gpx content');
      const fileName = 'test-route.gpx';

      const result = await processor.processGpx(testBuffer, fileName);

      expect(result.geojson).toMatchObject({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              surface: 'unpaved',
              segmentIndex: 0,
              distance: expect.any(Number)
            },
            geometry: {
              type: 'LineString',
              coordinates: samplePoints.map(p => [p.lon, p.lat])
            }
          }
        ]
      });
    });
  });

  describe('Error handling', () => {
    it('should handle null or undefined file buffer', async () => {
      const fileName = 'test.gpx';
      
      // @ts-ignore - Testing invalid input
      await expect(processor.processGpx(null, fileName))
        .rejects
        .toThrow('GPX processing failed');
    });

    it('should handle empty file buffer', async () => {
      const testBuffer = Buffer.from('');
      const fileName = 'empty.gpx';

      mockedParseGpx.mockRejectedValue(new Error('Empty GPX file'));

      await expect(processor.processGpx(testBuffer, fileName))
        .rejects
        .toThrow('GPX processing failed: Empty GPX file');
    });
  });
});
