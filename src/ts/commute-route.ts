import * as ns from './nav-services';
import * as dt from './data-type';

import * as fs from 'fs';
import * as fc from '../fb/fb-coder';
import { format } from 'path';

export async function planCommuteRoute(request: dt.RouteRequest): Promise<any> {
    const origin = dt.parseCoordinate(request.origin);
    const destination = dt.parseCoordinate(request.destination);
    let errorMessage = '';
    let step = 'fetch-trace';

    const usualPromise = ns.fetchDrivingTrace(request.user_id, origin, destination, request.start_time) 
    .then((drivingTraces) => {
        step = 'match-trace';
        return ns.matchTraceToMap(drivingTraces);
    })
    .then((matchingPath) => {
        step = 'usual-route';
        return ns.trackUsualRoute(matchingPath.ways, request);
    })
    .then((routeResponse) => {
        var bytes = Buffer.from(routeResponse);
        return FB_CODER.decode(bytes);
    })
    .catch(error => {
        errorMessage = `Step ${step} error: ` + error.message;
        return null;
    });

    const fastestPromise = ns.planFastestRoute(request)
    .then((routeResponse) => {
        let bytes = Buffer.from(routeResponse);
        return FB_CODER.decode(bytes);
    })
    .catch(error => {
        errorMessage = 'Step fastest-route error: ' + error.message;
        return null;
    });
   
    return new Promise((resolve, reject) => {
        Promise.all([fastestPromise, usualPromise]).then((values) => {
            let fastestRoute: dt.RouteResponse = values[0];
            let usualRoute: dt.RouteResponse = values[1];
            if (usualRoute != null) {
                usualRoute.routes[0].route_style = 'USUAL';
            }

            let commuteRoute: dt.RouteResponse = usualRoute;
            if (commuteRoute == null) {
                commuteRoute = fastestRoute;
            } else if (fastestRoute != null && isObviousFaster(fastestRoute.routes[0], usualRoute.routes[0])) {
                commuteRoute.routes.push(fastestRoute.routes[0]);
            };

            if (errorMessage) {
                commuteRoute.message = errorMessage;
            }

            if (request.format == 'flatbuffers') {
                resolve(FB_CODER.encode(commuteRoute));
            } else {
                FB_CODER.beautify(commuteRoute, request.format);
                resolve(commuteRoute);
            }
        })
        .catch(error => {
            reject(error)
        })
    });
    
}

const FB_CODER = new fc.FlatBufferCoder(fs.readFileSync('./src/fb/direction-v9.bfbs'));

const TWO_MINUTES = 2 * 60; // two minutes, in seconds

const ONE_MINUTES = 1 * 60; // one minutes, in seconds

function isObviousFaster(fastestRoute: dt.NavRoute, usualRoute: dt.NavRoute): boolean {
    let delay: number = usualRoute.duration - fastestRoute.duration;
    if (isSameMajorRoad(fastestRoute, usualRoute)) {
        let threshold: number = usualRoute.duration * 0.1;
        return delay > (threshold > TWO_MINUTES ? threshold : TWO_MINUTES);
    } else {
        return delay > ONE_MINUTES;
    }
}

function isSameMajorRoad(fastestRoute: dt.NavRoute, usualRoute: dt.NavRoute): boolean {
    if (fastestRoute.legs.length != usualRoute.legs.length) {
        return false;
    }

    for (let i = 0; i < fastestRoute.legs.length; i++) {
        let fLeg = fastestRoute.legs[i];
        let uLeg = usualRoute.legs[i];

        if (fLeg.major_roads.length != uLeg.major_roads.length) {
            return false;
        }

        for (let j = 0; j < fLeg.major_roads.length; j++) {
            if (fLeg.major_roads[j] != uLeg.major_roads[j]) {
                return false;
            }
        }
    }

    return true;
}