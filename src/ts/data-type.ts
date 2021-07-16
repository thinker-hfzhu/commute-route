
export interface Coordinate {

    lat: number;

    lon: number;
}

export function parseCoordinate(latlon: string): Coordinate {
    let nums = latlon.split(",");
    return { lat: parseFloat(nums[0]), lon: parseFloat(nums[1]) };
}

export interface DrivingTrace {

    coordinates: string; // encoded polyline

    // coordinatesAccuracy:

    // altitudes;

    // altitudesAccuracy;
    
    // headings;

    // headingsAccuracy;

    // timeStamps;
  
}

export interface MatchingPath {

    ways: number[];

    distance: number;

    startOffet?: number;

    endOffset?: number;

    confidence?: number;
    
}

export interface RouteRequest {

    origin: string;

    destination: string;

    start_time: string;

    user_id: string;

    route_style?: string;

    format?: string;
    
}

export interface RouteLeg {

    major_roads_names?: string[];

}

export interface NavRoute {

    duration: number; // in seconds

    // distance: number; // in meters; length in v9? 

    route_style: string;

    legs?: RouteLeg[];

}

export interface RouteResponse {

    status: string;

    message: string;

    routes: NavRoute[];

}
