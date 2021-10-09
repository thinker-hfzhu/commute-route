import * as fb from '../flatbuffers/fb-encoder';

import * as dt from './data-type';

export abstract class ResponseConverger {

    protected usualResponse: dt.RouteResponse;

    protected fastestResponse: dt.RouteResponse;

    protected format: dt.Format;

    protected abstract fbEncoder(): fb.FlatBufferEncoder;

    protected abstract duration(route: dt.Route): number;
    
    protected abstract isSameMajorRoad(usualRoute: dt.Route, fastestRoute: dt.Route): boolean;
    
    public constructor(usualResponse: dt.RouteResponse|Buffer|string,
            fastestResponse: dt.RouteResponse|Buffer|string, format: dt.Format) {
        this.usualResponse = this.asObject(usualResponse);
        this.fastestResponse = this.asObject(fastestResponse);
        this.format = format;
    }

    public combine(): dt.RouteResponse|Uint8Array {
        let commuteResponse = this.convergeResponse();

        if (this.format == 'flatbuffers') {
            return this.fbEncoder().encode(commuteResponse);
        } else if (this.decoded) {
            return this.fbEncoder().beautify(commuteResponse, this.format);
        } else {
            return commuteResponse;
        }
    }

    protected validateStatus(response: dt.RouteResponse): dt.RouteResponse {
        if (response?.status != "11000") {
            response.message = `${response.message} (${response?.status}) -- cannot find a route`;
            console.warn(response.message);
        }
        return response;
    }

    private decoded = false;
    
    private asObject(response: dt.RouteResponse|Buffer|string): dt.RouteResponse {
        if (response instanceof Buffer) {
            var bytes = Buffer.from(response);
            this.decoded = true;
            return this.validateStatus(this.fbEncoder().decode(bytes));
        } else if (typeof response === "string") {
            return { status: "500", message : response, routes: [] };
        } else {
            return this.validateStatus(response);
        }
    }

    private convergeResponse(): dt.RouteResponse {
        var commuteResponse;

        if (this.usualResponse?.routes?.length > 0) {
            commuteResponse = this.usualResponse;

            let usualRoute = this.usualResponse.routes[0];
            usualRoute.route_style = 'USUAL';
            
            if (this.fastestResponse?.routes?.length > 0) {
                let fastestRoute = this.fastestResponse.routes[0];
                if (this.fastestValuable(fastestRoute, usualRoute)) {
                    commuteResponse.routes.push(fastestRoute);
                } else {
                    this.fastestResponse.message = "Same as or not better than usual route"
                }
            }
        } else {
            commuteResponse = this.fastestResponse; 
        }

        commuteResponse.message = "Usual route: " + this.usualResponse.message
            + " | Fastest route: " + this.fastestResponse.message;
    
        return commuteResponse;
    }

    /**
     * Valuable fastest route: the route is another route and better than usual route. 
     */
    private fastestValuable(fastestRoute: dt.Route, usualRoute: dt.Route): boolean {
        let delay: number = this.duration(usualRoute) - this.duration(fastestRoute);
        
        if (this.isSameMajorRoad(fastestRoute, usualRoute)) {
            let threshold: number = this.duration(usualRoute) * 0.1;
            return delay > (threshold > TWO_MINUTES ? threshold : TWO_MINUTES);
        } else {
            return delay > ONE_MINUTES;
        }
    }

}

const TWO_MINUTES = 2 * 60; // two minutes, in seconds

const ONE_MINUTES = 1 * 60; // one minutes, in seconds
