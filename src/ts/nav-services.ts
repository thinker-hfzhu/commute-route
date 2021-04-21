import axios from 'axios';
import { crConfig as config } from './cr-config';
import * as dt from './data-type';

export async function fetchDrivingTrace(userId: string, origin: dt.Coordinate, destination: dt.Coordinate, 
        time: string): Promise<dt.DrivingTrace> {
    let conf = config.trace;
    let url = `http://${conf.host}:${conf.port}${conf.path}`;
    
    axios.defaults.timeout = 1000;

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
                reject(new Error("No driving trace!"));
            }
        })
        .catch(error => {
            reject(error);
        })
    });

}

export async function matchTraceToMap(drivingTrace: dt.DrivingTrace): Promise<dt.MatchingPath> {
    let conf = config.matching;
    let url = `http://${conf.host}${conf.path}`;

    return new Promise((resolve, reject) => {
        axios.post(url, {
            coordinates: drivingTrace.coordinates,
            coordinates_format: 'polyline' 
        })
        .then(response => {
            if (response.data.matchings) {
                resolve(response.data.matchings[0]);
            }  else {
                reject(new Error("Cannot match trace!"));
            }
        })
        .catch(error => {
            reject(error);
        })
    });

}

export async function trackUsualRoute(ways: number[], request: dt.RouteRequest): Promise<Buffer> {
    let conf = config.tracking;
    let url = `http://${conf.host}${conf.path}`;

    const params = new URLSearchParams();
    for (let key in request) {
        params.append(key, request[key]);
    }

    params.append('trace_list', ways.toString());
    params.append('trace_type', 'way_id');
    params.set('route_style', 'tracking');

    return new Promise((resolve, reject) => {
        axios.post(url, params, {responseType: 'arraybuffer'}).then(response => {
            if (response.data) {
                resolve(response.data);
            }  else {
                reject(new Error("Cannot track path!"));
            }
        })
        .catch(error => {
            reject(error);
        })
    });

}

export async function planFastestRoute(request: dt.RouteRequest): Promise<Buffer> {
    let conf = config.routing;
    let url = `http://${conf.host}${conf.path}`;
    request.route_style = "fastest";

    return new Promise((resolve, reject) => {
        axios.get(url, {params: request, responseType: 'arraybuffer'}).then(response => {
            if (response.data) {
                resolve(response.data);
            }  else {
                reject(new Error(response.data.message));
            }
        })
        .catch(error => {
            reject(error);
        })
    });

}