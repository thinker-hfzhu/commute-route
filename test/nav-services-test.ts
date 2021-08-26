// import * as ns from '../src/service/nav-services'
// import * as dt from '../src/service/data-type';

// testNavServices();

// async function testNavServices() {

//     let request: dt.RouteRequest = {
//         origin: "37.235714,-121.847417",
//         destination: "37.246404,-121.925552",
//         start_time: "2020-11-06T11:27:00-08:00",
//         user_id: "changzhengj"
//     }

//     let origin = dt.parseCoordinate(request.origin);
//     let destination = dt.parseCoordinate(request.destination);

//     // let promise: Promise<dt.RouteResponse> = ns.planFastestRoute(request);

//     // let drivingTraces: dt.DrivingTrace = await ns.fetchDrivingTrace(request.user_id, origin, destination, request.start_time);
//     // let matchingPath: dt.MatchingPath = await ns.matchTraceToMap(drivingTraces);

//     // let routeResponse: dt.RouteResponse = await ns.trackUsualRoute(matchingPath.ways, request);

//     // const navRoute = routeResponse.routes[0];

//     // console.log(navRoute); 
//     // console.log(JSON.stringify(navRoute));

//     // promise.then(response => {
//     //     response.routes.push(navRoute);
//     //     console.log("promise resolve");
//     //     console.log(response);
//     // })
//     // .catch(error => {
//     //     console.log("promise reject");
//     //     console.log(error);
//     // })
// }
