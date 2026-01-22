const {MapArray} = require("../src/utils")

describe('utils', () => {
    it('Map', async () => {
        const r = new MapArray(1)
        console.log(r.all())
    });
});
