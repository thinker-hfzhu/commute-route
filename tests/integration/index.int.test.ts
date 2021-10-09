import * as index from '../../src/index';
import * as dt from '../../src/converger/data-type';

describe('Test commute route service', () => {

    let onlyUsual: dt.RouteRequest;
    let onlyFastest: dt.RouteRequest;
    let usualFastest: dt.RouteRequest;
    let noRoute: dt.RouteRequest;
    let httpRequest: dt.RouteRequest;

    beforeAll(() => {
        onlyUsual = require('../events/only-usual.json');
        onlyFastest = require('../events/only-fastest.json');
        usualFastest = require('../events/usual-fastest.json');
        noRoute = require('../events/no-route.json');
        httpRequest = require('../events/http-request.json');
    })

    test('The result should be only usual route.', async () => {
        const result = await index.handler(onlyUsual);

        expect(result.status).toBeDefined();
        expect(result.message).toBeDefined();
        expect(result.routes.length).toEqual(1);
        expect(result.routes[0].route_style).toEqual('USUAL');
        expect(result.routes[0].length).toBeCloseTo(12411.69, 2);
    });

    test('The result should be only fastest route', async () => {
        const result = await index.handler(onlyFastest);

        expect(result.status).toBeDefined();
        expect(result.message).toBeDefined();
        expect(result.routes.length).toEqual(1);
        expect(result.routes[0].route_style).toEqual('FASTEST');
        expect(result.routes[0].length).toBeCloseTo(11690.33, 2);
    });

    test('The result should be both usual route and fastest route', async () => {
        const result = await index.handler(usualFastest);

        expect(result.status).toBeDefined();
        expect(result.message).toBeDefined();
        expect(result.routes.length).toEqual(2);
        expect(result.routes[0].route_style).toEqual('USUAL');
        expect(result.routes[1].route_style).toEqual('FASTEST');
        expect(result.routes[0].length).toBeCloseTo(5625.03, 2);
        expect(result.routes[1].length).toBeCloseTo(4951.52, 2);
    });

    test('The result should be no route', async () => {
        const result = await index.handler(noRoute);

        expect(result.status).toBeDefined();
        expect(result.message).toBeDefined();
        expect(result.routes).toBeUndefined();
    });

    test('The event is http request', async () => {
        const result = await index.handler(httpRequest);

        expect(result.status).toBeDefined();
        expect(result.message).toBeDefined();
        expect(result.routes.length).toEqual(1);
        expect(result.routes[0].route_style).toEqual('USUAL');
        expect(result.routes[0].length).toBeCloseTo(12411.69, 2);
    });

    test('The api version is v0', async () => {
        let v0Event = JSON.parse(JSON.stringify(onlyUsual));
        v0Event.version = 'v0';
        const result = await index.handler(v0Event);

        expect(result.status).toBeDefined();
        expect(result.message).toBeDefined();
        expect(result.routes.length).toEqual(1);
        expect(result.routes[0].route_style).toEqual('USUAL');
        expect(result.routes[0].distance).toBeCloseTo(12411.69, 2);
    });

    test('The request format is flatbuffers', async () => {
        let fbEvent = JSON.parse(JSON.stringify(onlyUsual));
        fbEvent.format = 'flatbuffers';
        const result = await index.handler(fbEvent);

        expect(result).toBeDefined();
        expect(result.status).toBeUndefined();
    });

    test('The process.env.PROXY_INTEGRATION is true', async () => {
        process.env.PROXY_INTEGRATION = 'true';

        let result = await index.handler(onlyUsual);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toBeDefined();
        expect(result.headers['Content-Type']).toEqual('application/json');

        let fbEvent = JSON.parse(JSON.stringify(onlyUsual));
        fbEvent.format = 'flatbuffers';
        result = await index.handler(fbEvent);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toBeDefined();
        expect(result.headers['Content-Type']).toEqual('application/octet-stream');
    });

});