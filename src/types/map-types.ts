// Before: Empty file

// After:
export interface SavedMap {
    _id?: string;
    name: string;                // Required: Map name
    description?: string;        // Optional: Map description
    createdAt: Date;            // Auto: Creation timestamp
    updatedAt: Date;            // Auto: Last update timestamp
    createdBy: string;          // Auth0 user ID
    isPublic: boolean;          // Access control flag
    mapStyle: string;           // Current map style
    routes: Array<{             // Multiple routes per map
        id: string;             // Route identifier
        name: string;           // Route name
        gpxData: string;        // GPX data content
        color: string;          // Route display color
        opacity: number;        // Route opacity
        isVisible: boolean;     // Route visibility toggle
    }>;
    photos: Array<{            // Associated photos
        id: string;            // Photo identifier
        url: string;           // Photo URL/path
        caption?: string;      // Optional caption
        location: {            // Photo location
            lat: number;
            lon: number;
        }
    }>;
    viewState: {              // Map view state
        center: [number, number];
        zoom: number;
        pitch?: number;
        bearing?: number;
    };
}