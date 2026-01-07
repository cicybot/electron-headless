const fs = require('fs')
const {openWindow,post_rpc,Site} = require('./utils')

describe('chatgpt', () => {
    it('inject_chatgpt', async () => {
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
});