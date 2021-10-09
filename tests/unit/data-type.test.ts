import * as dt from '../../src/converger/data-type';

describe('Test parsing coordinate string', () => {

    test('The parsing result has lat and lon', () => {
        const destination = dt.parseCoordinate('37.246404,-121.925552');

        expect(destination.lat).toBeCloseTo(37.246404, 6);
        expect(destination.lon).toBeCloseTo(-121.925552, 6);
    });

});