export interface PlaceLabel {
  id: string;
  name: string;
  coordinates: [number, number];
  zoom: number;
  type: 'town' | 'city' | 'suburb' | 'village';
}

export interface POI {
  category: POICategory;
  type: InfrastructurePOIType | ServicesPOIType;
}

export type POICategory = 'infrastructure' | 'services';
export type InfrastructurePOIType = 'water' | 'power' | 'transport';
export type ServicesPOIType = 'health' | 'education' | 'government';
