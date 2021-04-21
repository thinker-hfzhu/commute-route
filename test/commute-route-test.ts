import { accessSync } from 'fs';
import * as cr from '../src/ts/commute-route'
import * as dt from '../src/ts/data-type';

testCommuteRoute();

async function testCommuteRoute() {

    let request = {
        origin: "37.235714,-121.847417,0%7C0,,,,,,,",
        destination: "37.246404,-121.925552,0%7C0,,,,,,,",
        output: "default",
        content_level: "Full",
        start_time: "2021-11-06T19:27:00-08:00", 
        user_id: "changzhengj",
        format: "jsons"
    }   

    let commuteRoute = await cr.planCommuteRoute(request);

    if (request.format == "flatbuffers") {
        let respone = Buffer.from(commuteRoute).toString('utf8');
        console.log(respone);
    } else {
        console.log(JSON.stringify(commuteRoute, null, 2));
    }

}
