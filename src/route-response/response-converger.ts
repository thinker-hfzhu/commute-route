import * as fb from '../flatbuffers/fb-encoder';
import * as dt from '../data-type';

const TWO_MINUTES = 2 * 60; // two minutes, in seconds

const ONE_MINUTES = 1 * 60; // one minutes, in seconds

export abstract class ResponseConverger {

    protected usualResponse: dt.NavResponse;

    protected fastestResponse: dt.NavResponse;

    protected format: dt.Format;

    protected abstract fbEncoder(): fb.FlatBufferEncoder;

    protected abstract duration(navRoute: dt.NavRoute): number;
    
    protected abstract isSameMajorRoad(usualRoute: dt.NavRoute, fastestRoute: dt.NavRoute): boolean;
    
    public constructor(usualResponse: dt.NavResponse|Buffer|string,
            fastestResponse: dt.NavResponse|Buffer|string, format: dt.Format) {
        this.usualResponse = this.asObject(usualResponse);
        this.fastestResponse = this.asObject(fastestResponse);
        this.format = format;
    }

    public process(): dt.NavResponse|Uint8Array {
        let commuteResponse = this.convergeResponse();

        if (this.format == 'flatbuffers') {
            return this.fbEncoder().encode(commuteResponse);
        } else if (this.decoded) {
            return this.fbEncoder().beautify(commuteResponse, this.format);
        } else {
            return commuteResponse;
        }
    }

    protected validateStatus(response: dt.NavResponse): dt.NavResponse {
        if (response?.status != "11000") {
            console.warn("Cannot get route: " + response.message);
        }
        return response;
    }

    private decoded = false;
    
    private asObject(response: dt.NavResponse|Buffer|string): dt.NavResponse {
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

    private convergeResponse(): dt.NavResponse {
        var commuteResponse;

        if (this.usualResponse?.routes?.length > 0) {
            commuteResponse = this.usualResponse;

            let usualRoute = this.usualResponse.routes[0];
            usualRoute.route_style = 'USUAL';
            
            if (this.fastestResponse?.routes?.length > 0) {
                let fastestRoute = this.fastestResponse.routes[0];
                if (this.fastestValuable(fastestRoute, usualRoute)) {
                    commuteResponse.routes.push(fastestRoute);
                }
            }
        } else {
            commuteResponse = this.fastestResponse; 
        }

        if (this.usualResponse.message != this.fastestResponse.message) {
            commuteResponse.message = this.usualResponse.message + " & " + this.fastestResponse.message;
        }
        
        return commuteResponse;
    }

    private fastestValuable(fastestRoute: dt.NavRoute, usualRoute: dt.NavRoute): boolean {
        let delay: number = this.duration(usualRoute) - this.duration(fastestRoute);
        
        if (this.isSameMajorRoad(fastestRoute, usualRoute)) {
            let threshold: number = this.duration(usualRoute) * 0.1;
            return delay > (threshold > TWO_MINUTES ? threshold : TWO_MINUTES);
        } else {
            return delay > ONE_MINUTES;
        }

        return true;        
    }

}
