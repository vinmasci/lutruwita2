import '@testing-library/jest-dom';

// Mock mapbox-gl since it requires a browser environment
jest.mock('mapbox-gl', () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    getCanvas: jest.fn(() => ({ style: {} })),
    getSource: jest.fn(),
    addSource: jest.fn(),
    removeSource: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    setLayoutProperty: jest.fn(),
    getBounds: jest.fn(() => ({
      getWest: jest.fn(),
      getSouth: jest.fn(),
      getEast: jest.fn(),
      getNorth: jest.fn()
    })),
    getZoom: jest.fn(),
    getCenter: jest.fn(),
    getPitch: jest.fn(),
    getBearing: jest.fn(),
    getStyle: jest.fn(() => ({ name: 'test-style' })),
    setTerrain: jest.fn(),
    flyTo: jest.fn()
  })),
  Marker: jest.fn(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn()
  })),
  NavigationControl: jest.fn(),
  FullscreenControl: jest.fn()
}));

// Mock turf since it's used with mapbox
jest.mock('@turf/turf', () => ({
  along: jest.fn(),
  length: jest.fn(),
  lineString: jest.fn()
}));
