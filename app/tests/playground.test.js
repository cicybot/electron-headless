const fs = require('fs')
const {openWindow,Site,post_rpc} = require('./utils')

describe('playground', () => {
    it('douyin_js', async () => {
        await openWindow(Site.douyin)
        const code = fs.readFileSync(`${__dirname}/playground/douyin.js`)
        const res = await post_rpc({
            method:"executeJavaScript",
            params:{
                win_id:17,
                code:code.toString()
            }
        })
        console.log(res)
    });

    it('chatgpt', async () => {
        await openWindow(Site.chatgpt);
        const code = fs.readFileSync(`${__dirname}/playground/chatgpt.js`)
        const res = await post_rpc({
            method:"executeJavaScript",
            params:{
                win_id:1,
                code:code.toString()
            }
        })
        console.log(res)
    });

    it('content', async () => {
        await openWindow(Site.chatgpt);
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