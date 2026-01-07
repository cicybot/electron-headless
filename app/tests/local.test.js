const fs = require('fs')
const {openWindow,post_rpc,Site} = require('./utils')

describe('localhost', () => {
    it('8173', async () => {
        const res = await openWindow(Site.localhost_8173,{
            webPreferences:{
                nodeIntegration: true,
                contextIsolation: false,
            }
        })
        console.log(res)
    });
    it('local content', async () => {
        const code = fs.readFileSync(`${__dirname}/playground/content.js`)
        const res = await post_rpc({
            method:"executeJavaScript",
            params:{
                win_id:1,
                code:code.toString()
            }
        })
        console.log(res)
    });
});