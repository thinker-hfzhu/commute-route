import { Version } from "../converger/data-type";

export interface UrlConfig {

    traceUrl: string;
    
    matchingUrl: string;

    trackingUrl: string;

    routingUrl: string;

}

export function getConfig(version: Version): UrlConfig {
    return CONFIGS.get(version);
}

const CONFIGS = new Map<Version, UrlConfig>();
initializeConfig();

function initializeConfig(){
    const trace_ = process.env.TRACE_URL;
    const matching_ = process.env.MATCHING_URL;
    const tracking_ = process.env.TRACKING_URL;
    const routing_ = process.env.ROUTING_URL;
    
    const v0Config = {
        traceUrl: trace_ + "/api/v0/route/",
        matchingUrl: matching_ + "/matchingtrace/v1/driving",
        trackingUrl: tracking_ + "/v8/route/json",
        routingUrl: routing_ + "/v8/route/json",
    }
    
    const v1Config = {
        traceUrl: trace_ + "/api/v0/route/",
        matchingUrl: matching_ + "/matchingtrace/v1/driving",
        trackingUrl: tracking_ + "/v9/route/flatbuffers",
        routingUrl: routing_ + "/v9/route/flatbuffers",
    }
    
    CONFIGS.set("v0", v0Config);
    CONFIGS.set("v1", v1Config);
}
