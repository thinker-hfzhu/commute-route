import * as dt from "../data-type";
import { ResponseConverger } from "./response-converger";
import { ResponseConvergerV8 } from "./response-converger-v8";
import { ResponseConvergerV9 } from "./response-converger-v9";

export function createResponseConverger(usualResponse: dt.NavResponse|Buffer|string, fastestResponse: dt.NavResponse|Buffer|string, 
    format: dt.Format, version: dt.Version): ResponseConverger {
    switch (version) {
        case 'v0': return new ResponseConvergerV8(usualResponse, fastestResponse, format);
        case 'v1': return new ResponseConvergerV9(usualResponse, fastestResponse, format);
        default: return new ResponseConvergerV9(usualResponse, fastestResponse, format);
    }
}