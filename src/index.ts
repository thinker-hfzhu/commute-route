import * as dt from './converger/data-type';
import * as cr from './service/commute-route-service';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
export const handler = async (event: any): Promise<any> => {
    const routeRequest = initializeRequest(event); 
    
    const rouetResponse = await cr.planCommuteRoute(routeRequest);

    const httpResponse = constructResponse(routeRequest, rouetResponse);
    
    return httpResponse;
}

function initializeRequest(event: any): dt.RouteRequest {
    let routeRequest: any;
    
    if ('queryStringParameters' in event) {
        if (event.queryStringParameters) {
            routeRequest = event.queryStringParameters;
        } else {
            routeRequest = { };
        }
    } else {
        routeRequest = event; 
    }
        
    if (event.resource) {
        // resouce example: "/v0/json"
        let parts = event.resource.split('/'); 
        routeRequest.version = parts[1];
        routeRequest.format = parts[2];
    } 
    
    return routeRequest;
}

function constructResponse(routeRequest: dt.RouteRequest, routeResponse: Uint8Array|dt.RouteResponse): any {
    const proxyIntegration = process.env.PROXY_INTEGRATION === "true";
    
    let contentType = 'application/json';
    let body: any;

    if (routeResponse instanceof Uint8Array) {
        contentType = 'application/octet-stream';
        body = Buffer.from(routeResponse).toString('base64');
        // To handle binary payloads for AWS Lambda proxy integrations, you must base64-encode your function's response.
        // https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-payload-encodings.html
    } else { 
        if (proxyIntegration) {
            body = JSON.stringify(routeResponse);
        } else {
            body = routeResponse;
        }
    }

    if (proxyIntegration) {
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': contentType
            },
            'body': body
        } 
    } else {
        return body;
    }
}
