import * as ns from './nav-services';
import * as dt from './data-type';

import * as fs from 'fs';
import * as fc from '../fb/fb-coder';
import { format } from 'path';

export async function planCommuteRoute(request: dt.RouteRequest): Promise<any> {
    const origin = dt.parseCoordinate(request.origin);
    const destination = dt.parseCoordinate(request.destination);
    let errorMessage = '';

    const usualPromise = ns.fetchDrivingTrace(request.user_id, origin, destination, request.start_time) 
    .then((drivingTraces) => {
        return ns.matchTraceToMap(drivingTraces);
    })
    .then((matchingPath) => {
        return ns.trackUsualRoute(matchingPath.ways, request);
    })
    .then((routeResponse) => {
        return asJsonFormat(routeResponse, request.format);
    })
    .catch(error => {
        errorMessage = error.message;
        return null;
    });

    const fastestPromise = ns.planFastestRoute(request)
    .then((routeResponse) => {
        return asJsonFormat(routeResponse, request.format);
    })
    .catch(error => {
        errorMessage = error.message;
        return null;
    });
   
    return new Promise((resolve, reject) => {
        Promise.all([fastestPromise, usualPromise]).then((values) => {
            let fastestRoute: dt.RouteResponse = values[0];
            let usualRoute: dt.RouteResponse = values[1];
            if (usualRoute != null) {
                usualRoute.routes[0].route_style = 'USUAL';
            }

            if (usualRoute?.status && usualRoute.status != "11000") {
                console.warn("Can't find usual route: " + usualRoute.message);
            }

            if (fastestRoute?.status && fastestRoute.status != "11000") {
                console.warn("Can't find fastest route: " + fastestRoute.message);
            }

            let commuteRoute: dt.RouteResponse = usualRoute;
            if (commuteRoute == null) {
                commuteRoute = fastestRoute;
            } else if (fastestRoute != null && isObviousFaster(fastestRoute.routes[0], usualRoute.routes[0])) {
                commuteRoute.routes.push(fastestRoute.routes[0]);
            };

            if (errorMessage) {
                commuteRoute.message += " & " + errorMessage;
            }

            if (request.format == 'flatbuffers') {
                resolve(FB_CODER.encode(commuteRoute));
            } else {
                resolve(commuteRoute);
            }
        })
        .catch(error => {
            reject(error)
        })
    });
    
}

function asJsonFormat(routeResponse: any, format: string): dt.RouteResponse {
    let isBuffer = routeResponse.buffer != null && routeResponse.byteLength != null;
    if (isBuffer) {
        var bytes = Buffer.from(routeResponse);
        var jsonResponse = FB_CODER.decode(bytes);
        return FB_CODER.beautify(jsonResponse, format);
    } else {
        return routeResponse;
    }
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

        if (fLeg.major_roads_names.length != uLeg.major_roads_names.length) {
            return false;
        }

        for (let j = 0; j < fLeg.major_roads_names.length; j++) {
            if (fLeg.major_roads_names[j] != uLeg.major_roads_names[j]) {
                return false;
            }
        }
    }

    return true;
}