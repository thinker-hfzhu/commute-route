
import config = require("../cfg/cr-config.json");

export const crConfig: CrConfig = config;

interface CrConfig {

    trace: UrlParameters;
    
    matching: UrlParameters;

    tracking: UrlParameters;

    routing: UrlParameters;

}

interface UrlParameters {

    host: string;

    port?: number;

    path: string;

}
