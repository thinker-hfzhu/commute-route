export type Version = "v0" | "v1";

export type Format = "flatbuffers" | "json" | "jsons";

export interface Coordinate {

    lat: number;

    lon: number;
}

export function parseCoordinate(latlon: string): Coordinate {
    let nums = latlon.split(",");
    return { lat: parseFloat(nums[0]), lon: parseFloat(nums[1]) };
}

export interface DrivingTrace {

    coordinates: string;    // encoded polyline

    // coordinatesAccuracy

}

export interface MatchingPath {

    ways: number[];

    distance: number;

    start_offet?: number;

    end_offset?: number;

    confidence?: number;
    
}

export interface RouteRequest {

    origin: string;

    destination: string;

    start_time: string;

    user_id: string;

    route_style?: string;

    format?: Format;

    version?: Version;
    
}

export interface RouteResponse {

    status: string;

    message: string;

    routes: Route[];

}

export interface Route {

    route_style: string;

}
export function RouteResponse(RouteResponse: any): any {
    throw new Error('Function not implemented.');
}

