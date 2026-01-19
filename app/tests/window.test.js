const {importCookies} = require("../src/utils")
const fs = require("fs")
describe('window', () => {
    it('import cookie', async () => {
        const cookies = fs.readFileSync("/Users/data/electron/electron-mcp/app/tests/playground/cookies.json").toString()
        console.log(cookies)
        const r =await importCookies(JSON.parse(cookies),5)
        console.log(r)
    });
});