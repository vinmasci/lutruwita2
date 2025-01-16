export enum POICategory {
    Infrastructure = 'Infrastructure',
    Services = 'Services',
    Accommodation = 'Accommodation',
    NaturalFeatures = 'Natural Features',
    Information = 'Information'
}

export enum InfrastructurePOIType {
    WaterPoint = 'Water Point',
    PublicToilet = 'Public Toilet',
    PublicShower = 'Public Shower',
    BikeRepairStation = 'Bike Repair Station',
    BikeShop = 'Bike Shop',
    BikeStorage = 'Bike Storage',
    Shelter = 'Shelter',
    Campsite = 'Campsite',
    Parking = 'Parking',
    Viewpoint = 'Viewpoint',
    CaravanPark = 'Caravan Park', // Add this new type
    Other = 'Other'
}

export enum ServicesPOIType {
    Cafe = 'Cafe',
    Restaurant = 'Restaurant',
    PubBar = 'Pub/Bar',
    Supermarket = 'Supermarket',
    GeneralStore = 'General Store',
    PostOffice = 'Post Office',
    MedicalCenter = 'Medical Center',
    Pharmacy = 'Pharmacy',
    FuelStation = 'Fuel Station'  // Add this
}

export enum AccommodationPOIType {
    Campground = 'Campground',
    HotelMotel = 'Hotel/Motel',
    Hostel = 'Hostel',
    FreeCamping = 'Free Camping',
    HutShelter = 'Hut/Shelter'
}

export enum NaturalFeaturesPOIType {
    Lookout = 'Lookout',
    Beach = 'Beach',
    Waterfall = 'Waterfall',
    Cave = 'Cave',
    RiverCrossing = 'River Crossing',
    HotSpring = 'Hot Spring'
}

export enum InformationPOIType {
    VisitorCenter = 'Visitor Center',
    TrailHead = 'Trail Head',
    ParkEntry = 'Park Entry',
    WarningPoint = 'Warning Point',
    HistoricalSite = 'Historical Site',
    InformationBoard = 'Information Board',
    Warning = 'Warning'
}

export type POIType = 
    | InfrastructurePOIType
    | ServicesPOIType
    | AccommodationPOIType
    | NaturalFeaturesPOIType
    | InformationPOIType;


export const POIIcons: Record<POIType, string> = {
    // Infrastructure
    [InfrastructurePOIType.Place]: 'location_city', 
    [InfrastructurePOIType.WaterPoint]: 'water_drop',
    [InfrastructurePOIType.PublicToilet]: 'wc',
    [InfrastructurePOIType.PublicShower]: 'shower',
    [InfrastructurePOIType.BikeRepairStation]: 'build',
    [InfrastructurePOIType.BikeShop]: 'pedal_bike',
    [InfrastructurePOIType.BikeStorage]: 'garage',
    [InfrastructurePOIType.Shelter]: 'house',
    [InfrastructurePOIType.Campsite]: 'cabin',
    [InfrastructurePOIType.Parking]: 'local_parking',
    [InfrastructurePOIType.Viewpoint]: 'visibility',
    [InfrastructurePOIType.Other]: 'place',

    // Services
    [ServicesPOIType.Cafe]: 'coffee',
    [ServicesPOIType.Restaurant]: 'restaurant',
    [ServicesPOIType.PubBar]: 'sports_bar',
    [ServicesPOIType.Supermarket]: 'local_grocery_store',
    [ServicesPOIType.GeneralStore]: 'store',
    [ServicesPOIType.PostOffice]: 'local_post_office',
    [ServicesPOIType.MedicalCenter]: 'local_hospital',
    [ServicesPOIType.Pharmacy]: 'local_pharmacy',
    [ServicesPOIType.FuelStation]: 'local_gas_station', // Added fuel station icon

    // Accommodation
    [AccommodationPOIType.Campground]: 'camping',
    [AccommodationPOIType.HotelMotel]: 'hotel',
    [AccommodationPOIType.Hostel]: 'house',
    [AccommodationPOIType.FreeCamping]: 'nature',
    [AccommodationPOIType.HutShelter]: 'cabin',
    [InfrastructurePOIType.CaravanPark]: 'rv_hookup', // Add this new icon mapping

    // Natural Features
    [NaturalFeaturesPOIType.Lookout]: 'visibility',
    [NaturalFeaturesPOIType.Beach]: 'beach_access',
    [NaturalFeaturesPOIType.Waterfall]: 'water',
    [NaturalFeaturesPOIType.Cave]: 'landscape',
    [NaturalFeaturesPOIType.RiverCrossing]: 'bridge',
    [NaturalFeaturesPOIType.HotSpring]: 'hot_tub',

    // Information
    [InformationPOIType.VisitorCenter]: 'info',
    [InformationPOIType.TrailHead]: 'hiking',
    [InformationPOIType.ParkEntry]: 'park',
    [InformationPOIType.WarningPoint]: 'warning',
    [InformationPOIType.HistoricalSite]: 'museum',
    [InformationPOIType.InformationBoard]: 'info_outline',
    [InformationPOIType.Warning]: 'report_problem'
};

export interface POI {
    id: string;
    category: POICategory;
    type: POIType;
    name: string;
    description?: string;
    location: {
        lat: number;
        lon: number;
    };
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    warning?: boolean;
}
