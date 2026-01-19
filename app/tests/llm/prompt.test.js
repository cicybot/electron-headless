const {post_rpc,setBaseApi,getBaseApi, openWindow,} = require("../../src/utils")
const fs = require("fs")
setBaseApi("https://ga-win-electron-3456-v1.cicy.de5.net")

/**
 ping: 'Check if the server is responding',
 info: 'Get server information',
 getScreenSize: 'Get the screen size',
 openWindow: 'Open a new window',
 closeWindow: 'Close a window',
 showWindow: 'Show a window',
 hideWindow: 'Hide a window',
 getWindows: 'Get list of windows',
 getWindowState: 'Get window state',
 loadURL: 'Load a URL in window',
 reload: 'Reload the window',
 getURL: 'Get current URL',
 getTitle: 'Get window title',
 getBounds: 'Get window bounds',
 getWindowSize: 'Get window size',
 setBounds: 'Set window bounds',
 setWindowSize: 'Set window size',
 setWindowWidth: 'Set window width',
 setWindowPosition: 'Set window position',
 executeJavaScript: 'Execute JavaScript in window',
 openDevTools: 'Open developer tools',
 sendInputEvent: 'Send input event',
 importCookies: 'Import cookies',
 exportCookies: 'Export cookies',
 setUserAgent: 'Set user agent',
 downloadMedia: 'Download media',
 getSubTitles: 'Get subtitles',
 getRequests: 'Get requests',
 clearRequests: 'Clear requests',
 captureScreenshot: 'Capture screenshot',
 saveScreenshot: 'Save screenshot',
 getScreenshotInfo: 'Get screenshot info',
 captureSystemScreenshot: 'Capture system screenshot',
 saveSystemScreenshot: 'Save system screenshot',
 switchAccount: 'Switch account',
 getAccountInfo: 'Get account info',
 getAccountWindows: 'Get account windows',
 pyautoguiClick: 'Perform mouse click',
 pyautoguiType: 'Type text',
 pyautoguiPress: 'Press key',
 pyautoguiPaste: 'Paste content',
 pyautoguiMove: 'Move mouse to position'
 */
describe('llm', () => {
    it('local jupyter', async () => {
        const res = await openWindow("http://127.0.0.1:8888",{})
        console.log(res)
    });

    it('gcs', async () => {
        const res = await openWindow("https://gcs-8888.cicy.de5.net/lab?",{})
        console.log(res)
    });

    it('google', async () => {
        const res = await openWindow("https://www.google.com",{})
        console.log(res)
    });


    it('colab', async () => {
        const res = await openWindow("https://colab.research.google.com/",{})
        console.log(res)
    });

    it('aistudio', async () => {
        const res = await openWindow("https://aistudio.google.com/apps",{})
        console.log(res)
    });
    it('openRect', async () => {
        const res = await openWindow("https://www.google.com",{
            width:100,height:100,x:100,y:100
        })
        console.log(res)
    });
    it('click', async () => {
        const res = await post_rpc({
            method: "pyautoguiClick",
            params: {
                win_id:1,
                x:289,
                y:20
            }
        })
        console.log(res)
    });
    it('run', async () => {
        const res = await post_rpc({
            method: "pyautoguiWrite",
            params: {
                win_id:1,
                text:"hi"
            }
        })
        console.log(res)
    });
    it('prompt', async () => {
        let prompt = fs.readFileSync("/Users/data/electron/electron-mcp/app/tests/llm/prompt.md").toString()
        prompt = prompt.split("---")[0]
        console.log(prompt)

        await post_rpc({
            method: "pyautoguiText",
            params: {
                win_id:1,
                text:prompt.trim(),
            }
        })
        await post_rpc({
            method: "pyautoguiPress",
            params: {
                win_id:1,
                key:"enter",
            }
        })
    });

    it('prompt local jupyter', async () => {
        let prompt = fs.readFileSync("/Users/data/electron/electron-mcp/app/tests/llm/prompt_local_jupyter.md").toString()
        prompt = prompt.split("---")[0]
        console.log(prompt)
        // await post_rpc({
        //     method: "showWindow",
        //     params: {
        //         win_id:2,
        //     }
        // })
        await post_rpc({
            method: "pyautoguiText",
            params: {
                win_id:2,
                text:prompt.trim(),
            }
        })
        await post_rpc({
            method: "pyautoguiPress",
            params: {
                win_id:2,
                key:"enter",
            }
        })
    });
});



describe('open windows', () => {
    it('local jupyter1', async () => {
        const res = await openWindow("http://127.0.0.1:8888",{})
        console.log(res)
    });

    it('gcs', async () => {
        const res = await openWindow("https://gcs-8888.cicy.de5.net/lab?",{})
        console.log(res)
    });

    it('google', async () => {
        const res = await openWindow("https://www.google.com",{})
        console.log(res)
    });


    it('colab', async () => {
        const res = await openWindow("https://colab.research.google.com/",{})
        console.log(res)
    });

    it('aistudio', async () => {
        const res = await openWindow("https://aistudio.google.com/apps",{})
        console.log(res)
    });
});