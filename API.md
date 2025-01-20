# API Documentation

## GPX Route Processing API

### Upload and Process GPX Route
Uploads a GPX file and processes it into a standardized route format with surface detection.

**Endpoint:** `POST /api/routes`  
**Content-Type:** `multipart/form-data`

**Request Body:**
```
{
  "gpx": File  // GPX file to process
}
```

**Response:**
```typescript
{
  "success": boolean,
  "route": {
    "id": string,          // Unique route identifier
    "name": string,        // Route name (derived from filename)
    "color": string,       // Route color (hex format)
    "isVisible": boolean,  // Route visibility state
    "gpxData": string,     // Original GPX file content
    "segments": [          // Route segments with surface information
      {
        "surface": "paved" | "unpaved" | "track" | "path" | "unknown",
        "distance": number,  // Segment length in meters
        "geometry": {
          "type": "LineString",
          "coordinates": [number, number][]  // Array of [lon, lat] pairs
        }
      }
    ],
    "geojson": {          // GeoJSON representation of route
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {
            "surface": string,
            "segmentIndex": number,
            "distance": number
          },
          "geometry": {
            "type": "LineString",
            "coordinates": [number, number][]
          }
        }
      ]
    }
  },
  "error"?: string        // Error message if processing failed
}
```

**Example Request:**
```bash
curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "gpx=@route.gpx" \
  http://localhost:3000/api/routes
```

**Example Success Response:**
```json
{
  "success": true,
  "route": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Mountain Trail",
    "color": "#FF5733",
    "isVisible": true,
    "gpxData": "<?xml version=\"1.0\"?>...",
    "segments": [
      {
        "surface": "track",
        "distance": 1234.56,
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [146.123, -41.456],
            [146.124, -41.457]
          ]
        }
      }
    ],
    "geojson": {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {
            "surface": "track",
            "segmentIndex": 0,
            "distance": 1234.56
          },
          "geometry": {
            "type": "LineString",
            "coordinates": [
              [146.123, -41.456],
              [146.124, -41.457]
            ]
          }
        }
      ]
    }
  }
}
```

**Example Error Response:**
```json
{
  "success": false,
  "error": "Failed to parse GPX file: Invalid XML format"
}
```

### Error Codes
- `400 Bad Request`: Invalid request format or missing file
- `415 Unsupported Media Type`: File is not a valid GPX file
- `500 Internal Server Error`: Server-side processing error

### Notes
- GPX file must contain at least one track segment (`<trkseg>`)
- Maximum file size: 10MB
- Supported GPX version: 1.1
- Surface detection uses PostGIS for spatial analysis
- Distances are calculated using the Haversine formula
- All coordinates are in WGS84 format (longitude, latitude)
