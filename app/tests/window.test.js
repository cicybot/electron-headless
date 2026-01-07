const fs = require('fs')
const {Site,post_rpc, openWindow} = require('./utils')

describe('window', () => {
    it('importCookies', async () => {
        // await openWindow("https://gemini.google.com/")
        const cookies = fs.readFileSync(`${__dirname}/playground/cookies.json`)
        const res = await post_rpc({
            method:"importCookies",
            params:{
                cookies:JSON.parse(cookies),
                win_id:2
            }
        })
        console.log(res)
    });
    it('exportCookies', async () => {
        const res = await post_rpc({
            method:"exportCookies",
            params:{
                win_id:1,
                options:{
                    domain:".tiktok.com"
                }
            }
        })
        console.log(res)
    });

    it('openWindow', async () => {
        const res = await openWindow(Site.codespace)
        console.log(res)
    });

    it('loadURL', async () => {
        const res = await post_rpc({
            method:"loadURL",
            params:{
                win_id:2,
                url:Site.codespace
            }
        })
        console.log(res)
    });

    it('reload', async () => {
        const res = await post_rpc({
            method:"reload",
            params:{
                win_id:2,
            }
        })
        console.log(res)
    });
    it('getRequests', async () => {
        const res = await post_rpc({
            method:"getRequests",
            params:{
            }
        })
        console.log(JSON.stringify(res))
    });

    it('getWindows', async () => {
        const res = await post_rpc({
            method:"getWindows",
            params:{
            }
        })
        console.log(JSON.stringify(res))
    });
});