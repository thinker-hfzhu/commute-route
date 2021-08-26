import { Version } from "../data-type";

export interface UrlConfig {

    trace: string;
    
    matching: string;

    tracking: string;

    routing: string;

}

export function getConfig(version: Version): UrlConfig {
    return CONFIGS.get(version);
}

const CONFIGS = new Map<Version, UrlConfig>();
CONFIGS.set("v0", require("./url-config-v0.json"));
CONFIGS.set("v1", require("./url-config-v1.json"));