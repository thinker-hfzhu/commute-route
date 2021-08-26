import * as fs from 'fs';
import axios from 'axios';

import * as dt from './data-type';
import * as cfg from './config/url-configs';
import { createResponseConverger } from './route-response/response-converger-factory';

axios.defaults.timeout = 5000;

export class CommuteRouteService {

    private static SERVICES = new Map<dt.Version, CommuteRouteService>();

    static initialize() {
        if (this.SERVICES.size == 0) {
            this.SERVICES.set("v0", new CommuteRouteService("v0"));
            this.SERVICES.set("v1", new CommuteRouteService("v1"));
        }
    }

    public static of(version: dt.Version) {
        return CommuteRouteService.SERVICES.get(version);
    }

    private version: dt.Version;

    private config: cfg.UrlConfig;

    private constructor(version: dt.Version) {
        this.version = version;
        this.config = cfg.getConfig(version);
    }

    public async planCommuteRoute(request: dt.RouteRequest): Promise<Uint8Array|dt.NavResponse> {
        const origin = dt.parseCoordinate(request.origin);
        const destination = dt.parseCoordinate(request.destination);
        
        const usualPromise = this.fetchDrivingTrace(request.user_id, origin, destination, request.start_time) 
        .then((drivingTraces) => {
            return this.matchTraceToMap(drivingTraces);
        })
        .then((matchingPath) => {
            return this.trackUsualRoute(matchingPath.ways, request);
        })
        .catch(error => {
            return error.message;
        });

        const fastestPromise = this.planFastestRoute(request)
        .catch(error => {
            return error.message;
        });
    
        return new Promise((resolve, reject) => {
            Promise.all([usualPromise, fastestPromise]).then((values) => {
                let responseConverger = createResponseConverger(values[0], values[1], request.format, this.version);
                let commuteRoute = responseConverger.process();
                
                resolve(commuteRoute);
            })
            .catch(error => {
                reject(error)
            })
        });     
    }

    private async fetchDrivingTrace(userId: string, origin: dt.Coordinate, destination: dt.Coordinate, 
            time: string): Promise<dt.DrivingTrace> {
        let url = this.config.trace;
        
        return new Promise((resolve, reject) => {
            axios.get(url, { 
                params: {
                    user: userId,
                    lat: origin.lat,
                    lng: origin.lon,
                    dlat: destination.lat, 
                    dlng: destination.lon,
                    time: time 
                }
            })
            .then((response) => {
                if (response.data.route.path) {
                    resolve(response.data.route.path);
                }  else {
                    reject(createError("Cannot fetch usual trace", null));
                }
            })
            .catch(error => {
                reject(createError("Cannot fetch usual trace", error));
            })
        });
    }

    private async matchTraceToMap(drivingTrace: dt.DrivingTrace): Promise<dt.MatchingPath> {
        let url = this.config.matching;

        return new Promise((resolve, reject) => {
            axios.post(url, {
                coordinates: drivingTrace.coordinates,
                coordinates_format: 'polyline' 
            })
            .then(response => {
                if (response.data.matchings) {
                    resolve(response.data.matchings[0]);
                }  else {
                    reject(createError("Cannot match usual trace", null));
                }
            })
            .catch(error => {
                reject(createError("Cannot match usual trace", error));
            })
        });
    }

    private async trackUsualRoute(ways: number[], request: dt.RouteRequest): Promise<dt.NavResponse|Buffer> {
        let url = this.config.tracking;
        let isBuffer = url.endsWith('flatbuffers') ? true : false;

        const params = new URLSearchParams();
        for (let key in request) {
            params.append(key, request[key]);
        }

        params.set('trace_list', ways.toString());
        params.set('trace_type', 'way_id');
        params.set('route_style', 'tracking');

        return new Promise((resolve, reject) => {
            axios.post(url, params, {responseType: isBuffer ? 'arraybuffer' : 'json'}).then(response => {
                if (response.data) {
                    resolve(response.data);
                }  else {
                    reject(createError("Cannot track usual route", null));
                }
            })
            .catch(error => {
                reject(createError("Cannot track usual route", error));
            })
        });
    }

    private async planFastestRoute(request: dt.RouteRequest): Promise<dt.NavResponse|Buffer> {
        let url = this.config.routing;
        let isBuffer = url.endsWith('flatbuffers') ? true : false;
        request.route_style = "fastest";

        return new Promise((resolve, reject) => {
            axios.get(url, {params: request, responseType: isBuffer ? 'arraybuffer' : 'json'}).then(response => {
                if (response.data) {
                    resolve(response.data);
                }  else {
                    reject(createError("Cannot plan fastest route", null));
                }
            })
            .catch(error => {
                reject(createError("Cannot plan fastest route", error));
            })
        });
    }

}

function createError(message: string, error): Error {
    if (error?.response?.data?.message) {
        message += ": " + error.response.data.message;
        console.info(message);
    } else if (error?.message) {
        message += ": " + error.message;
        console.error(message);
    } else {
        message += ": no response data";
        console.error(message);
    }

    return new Error(message);
}

CommuteRouteService.initialize();

export async function planCommuteRoute(request: dt.RouteRequest): Promise<Uint8Array|dt.NavResponse> {
    return CommuteRouteService.of(request.version).planCommuteRoute(request);
}
