import { FlatBufferEncoder } from '../flatbuffers/fb-encoder';

import { ResponseConverger } from './route-converger';
import * as dt from './data-type';

interface RouteLeg {

    major_roads_names?: string[];

}

interface Route extends dt.Route {

    duration: number; // in seconds

    distance: number;  // in meters; 

    legs?: RouteLeg[];

}

export class ResponseConvergerV8 extends ResponseConverger {

    private static FB_ENCODER = null; // new FlatBufferCoder(fs.readFileSync('./schema/direction-v8.bfbs'));

    public constructor(usualResponse: dt.RouteResponse|Buffer|string,
            fastestResponse: dt.RouteResponse|Buffer|string, format: dt.Format) {
        super(usualResponse, fastestResponse, format);
    }

    protected validateStatus(response: dt.RouteResponse): dt.RouteResponse {
        if (response?.status != "0") {
            response.message = `${response.message} (${response?.status}) -- cannot find a route`;
            console.warn(response.message);
        }
        return response;
    }

    protected fbEncoder(): FlatBufferEncoder {
        return ResponseConvergerV8.FB_ENCODER;
    }
    
    protected duration(route: Route): number {
        return route.duration;
    }

    protected isSameMajorRoad(usualRoute: Route, fastestRoute: Route): boolean {
        if (fastestRoute?.legs?.length != usualRoute?.legs?.length) {
            return false;
        }
    
        for (let i = 0; i < fastestRoute.legs.length; i++) {
            let fLeg = fastestRoute.legs[i];
            let uLeg = usualRoute.legs[i];
    
            if (fLeg.major_roads_names?.length != uLeg.major_roads_names?.length) {
                return false;
            }
    
            for (let j = 0; j < fLeg.major_roads_names?.length; j++) {
                if (fLeg.major_roads_names[j] != uLeg.major_roads_names[j]) {
                    return false;
                }
            }
        }
    
        return true;
    }

}