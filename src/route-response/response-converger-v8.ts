import * as fs from 'fs';
import * as dt from '../data-type';
import { FlatBufferEncoder } from '../flatbuffers/fb-encoder';
import { ResponseConverger } from './response-converger';

interface RouteLeg {

    major_roads_names?: string[];

}

interface NavRoute extends dt.NavRoute {

    duration: number; // in seconds

    distance: number;  // in meters; 

    legs?: RouteLeg[];

}

export class ResponseConvergerV8 extends ResponseConverger {

    private static FB_ENCODER = null; // new FlatBufferCoder(fs.readFileSync('./schema/direction-v8.bfbs'));

    public constructor(usualResponse: dt.NavResponse|Buffer|string,
            fastestResponse: dt.NavResponse|Buffer|string, format: dt.Format) {
        super(usualResponse, fastestResponse, format);
    }

    protected validateStatus(response: dt.NavResponse): dt.NavResponse {
        if (response?.status != "0") {
            console.warn("Cannot get route: " + response.message);
        }
        return response;
    }

    protected fbEncoder(): FlatBufferEncoder {
        return ResponseConvergerV8.FB_ENCODER;
    }
    
    protected duration(navRoute: NavRoute): number {
        return navRoute.duration;
    }

    protected isSameMajorRoad(usualRoute: NavRoute, fastestRoute: NavRoute): boolean {
        if (fastestRoute.legs.length != usualRoute.legs.length) {
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