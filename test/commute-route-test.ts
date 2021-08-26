import { accessSync } from 'fs';
import { planCommuteRoute } from '../src/commute-route-service';
import { RouteRequest, Version } from '../src/data-type';

async function testCommuteRoute() {
    let request = buildRequest(); 

    let commuteRoute = await planCommuteRoute(request);

    let commuteRoute0 = await planCommuteRoute(request);

    if (commuteRoute instanceof Uint8Array) {
        let respone = Buffer.from(commuteRoute).toString('utf8');
        console.log(respone);
    } else {
        // console.log(JSON.stringify(commuteRoute, null, 2));
    }

}

function buildRequest(): RouteRequest {
    let request = <RouteRequest> {
        origin: "37.235714,-121.847417,0%7C0,,,,,,,",
        destination: "37.26404,-121.95552,0%7C0,,,,,,,",
        output: "default",
        content_level: "Full",
        start_time: "2021-11-06T19:27:00-08:00", 
        user_id: "changzhengj",
        format: "flatbuffers",
        version: "v1"
    } 

    return request;
}

function buildRequest2(): RouteRequest {
    let request = <RouteRequest> {
        origin: "37.235714,-121.847417,0%7C0,,,,,,,",
        destination: "37.246404,-121.925552,0%7C0,,,,,,,",
        output: "default",
        content_level: "Full",
        start_time: "2021-11-06T19:27:00-08:00", 
        user_id: "changzhengj",
        format: "jsons",
        version: "v0"
    } 

    return request;
}

testCommuteRoute();
