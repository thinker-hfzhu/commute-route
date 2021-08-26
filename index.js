const cr = require('./dist/src/commute-route-service')

exports.handler = async (event) => {
    let request = null; 

    console.log('event: ' + JSON.stringify(event));
    if (event.queryParams) {
        request = event.queryParams;
        console.log('query params: ' + JSON.stringify(request));
    } else {
        request = event;
        console.log('test event: ' + JSON.stringify(request));
    }
    
    let routeResponse = await cr.planCommuteRoute(request);
    
    if (request.format == 'flatbuffers') {
        let response = Buffer.from(routeResponse).toString('base64');
        return response;
    } else {
        return routeResponse;
    }
} 