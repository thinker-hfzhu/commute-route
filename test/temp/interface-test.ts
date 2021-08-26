interface Route {

    duration : number

}

interface RouteV1 extends Route {

    distance : number;

}

interface RouteV2 extends Route {

    length : number;

}

interface Response {

    message : string;
    
    routes : Route[];

}

// var route1 : RouteV1 = new RouteV1(20);
// var route2 : Route = <RouteV2> {length : 20};

// console.log(route1.getDistance())
// //console.log(route1.shorterThan(route2))not