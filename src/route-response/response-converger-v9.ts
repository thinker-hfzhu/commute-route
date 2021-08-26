import * as fs from 'fs';
import * as dt from '../data-type';
import { FlatBufferEncoder } from '../flatbuffers/fb-encoder';
import { ResponseConverger } from './response-converger';

interface RouteLeg {

    major_roads?: string[];

}

interface NavRoute extends dt.NavRoute {

    duration: number; // in seconds

    length: number;  // in meters; 

    legs?: RouteLeg[];

}

export class ResponseConvergerV9 extends ResponseConverger {

    private static FB_ENCODER = new FlatBufferEncoder(fs.readFileSync('./schema/direction-v9.bfbs'));

    public constructor(usualResponse: dt.NavResponse|Buffer|string,
            fastestResponse: dt.NavResponse|Buffer|string, format: dt.Format) {
        super(usualResponse, fastestResponse, format);
    }

    protected fbEncoder(): FlatBufferEncoder {
        return ResponseConvergerV9.FB_ENCODER;
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
    
            if (fLeg.major_roads?.length != uLeg.major_roads?.length) {
                return false;
            }
    
            for (let j = 0; j < fLeg.major_roads?.length; j++) {
                if (fLeg.major_roads[j] != uLeg.major_roads[j]) {
                    return false;
                }
            }
        }
    
        return true;
    }

}