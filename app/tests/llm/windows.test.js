const {post_rpc,setBaseApi,getBaseApi, openWindow,} = require("../../src/utils")
const fs = require("fs")
setBaseApi("https://ga-win-electron-3456-v1.cicy.de5.net")

describe('windows open', () => {
    it('local jupyter1', async () => {
        const res = await openWindow("http://127.0.0.1:8888",{})
        console.log(res)
    });

    it('gcs', async () => {
        const res = await openWindow("https://gcs-8888.cicy.de5.net/lab?",{})
        console.log(res)
    });
    //
    // it('google', async () => {
    //     const res = await openWindow("https://www.google.com",{})
    //     console.log(res)
    // });
    //
    //
    // it('colab', async () => {
    //     const res = await openWindow("https://colab.research.google.com/",{})
    //     console.log(res)
    // });
    //
    // it('aistudio', async () => {
    //     const res = await openWindow("https://aistudio.google.com/apps",{})
    //     console.log(res)
    // });
});