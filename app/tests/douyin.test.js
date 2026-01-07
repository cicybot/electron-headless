const fs = require('fs')
const {openWindow,loadURL,post_rpc,Site} = require('./utils')

describe('douyin', () => {
    it('douyin_getRequests', async () => {
        const res = await post_rpc({
            method:"getRequests",
            params:{
            }
        })
        const {result} = res
        const rows = result.filter(row=>row.win_id === 1)
        const rows1 = rows.filter(row=>row.url.indexOf("https://v3-dy-o.zjcdn.com")> -1)
        rows1.reverse()
        console.log(rows1)
    });

    it('douyin_inject', async () => {
        //console.log(await openWindow("https://www.douyin.com/video/7590026299834502454"));
        const code = fs.readFileSync(`${__dirname}/playground/douyin.js`)
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