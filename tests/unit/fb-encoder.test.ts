import * as fs from 'fs';
import * as fc from '../../src/flatbuffers/fb-encoder';

describe('Test Flatbuffers encoding and decoding', () => {

    let fbEncoder: fc.FlatBufferEncoder;
    let testData;

    beforeAll(() => {
        const bfbs = fs.readFileSync('./schema/direction-v9.bfbs'); 
        fbEncoder = new fc.FlatBufferEncoder(bfbs);
        testData = fs.readFileSync('./tests/fb-data/usual-route.dat');
    })

    test('Decode flatbuffers', async () => {
        let object = fbEncoder.decode(testData);

        expect(object.status).toEqual(11000);
        expect(object.metadata.api_version).toEqual('v9.1');
        expect(object.routes[0].duration).toBeCloseTo(999.07, 2);
        expect(object.routes[0].route_style).toEqual('USUAL');
        expect(object.routes[0].legs[0].has_guidance).toEqual(true);
        expect(object.routes[0].legs[0].steps[2].maneuver).toBeDefined();
    });

    test('Encode flatbuffers', async () => {
        let object = fbEncoder.decode(testData);

        let encoded = fbEncoder.encode(object);

        expect(encoded[0]).toEqual(24);

        let decoded = fbEncoder.decode(encoded);

        expect(decoded.status).toEqual(object.status);
        expect(decoded.metadata.api_version).toEqual(object.metadata.api_version);
        
        object.status = 11021;
        object.metadata.api_version = 'v8.1';

        expect(decoded.status).not.toEqual(object.status);
        expect(decoded.metadata.api_version).not.toEqual(object.metadata.api_version);

        expect(decoded.routes[0].duration).toBeCloseTo(999.07, 2);
        expect(decoded.routes[0].route_style).toEqual('USUAL');
        expect(decoded.routes[0].legs[0].has_guidance).toEqual(true);
        expect(decoded.routes[0].legs[0].steps[2].maneuver).toBeDefined();
    });

    test('Beautify jsons', async () => {
        var object = fbEncoder.decode(testData);
        expect(object.routes[0].time_restrictions).toBeDefined();

        fbEncoder.beautify(object, 'jsons');
        expect(object.routes[0].time_restrictions).not.toBeDefined();
    });

});