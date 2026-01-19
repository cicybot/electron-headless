let ELECTRON_BASE_API_URL = "http://127.0.0.1:3456"
const AI_BASE_API_URL = "https://api.cicy.de5.net";

function setBaseApi(url){
    ELECTRON_BASE_API_URL = url
}

function getBaseApi(){
     return ELECTRON_BASE_API_URL
}
const post_rpc = async ({method, params}) => {
    const url = `${getBaseApi()}/rpc`
    // console.log(ELECTRON_BASE_API_URL,params)
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({method, params})
    })
    console.log(res.status)
    return res.json()
}

function openWindow(url, options, others) {
    console.log(url)
    return post_rpc({
        method: "openWindow",
        params: {
            url,
            options: {
                width: 1024,
                height: 768,
                ...options,
                webPreferences: {
                    ...options?.webPreferences
                }
            },
            others
        }
    })

}

const loadURL = async (url, win_id) => {
    return post_rpc({
        method: "loadURL",
        params: {
            win_id: win_id || 1,
            url: url
        }
    })
}


const sendInputEvent = async (inputEvent, win_id) => {
    return post_rpc({
        method: "sendInputEvent",
        params: {
            win_id: win_id || 1,
            inputEvent
        }
    })
}

/**
 * Simulates a mouse click at specific coordinates
 * @param {Electron.WebContents} webContents
 * @param {number} x
 * @param {number} y
 */
async function simulateClick(x, y, win_id) {
    // 1. Press the mouse button down
    await sendInputEvent({
        type: 'mouseDown',
        x: x,
        y: y,
        button: 'left',
        clickCount: 1
    }, win_id);


    setTimeout(() => {
        // 2. Release the mouse button
        sendInputEvent({
            type: 'mouseUp',
            x: x,
            y: y,
            button: 'left',
            clickCount: 1
        }, win_id);
    }, 50);
}

/**
 * Simulates a single key press (Down + Up)
 * @param {Electron.WebContents} contents
 * @param {string} key - e.g., "Enter", "Escape", "A", "F1"
 */
async function sendKey(key, win_id) {
    await sendInputEvent({type: 'keyDown', keyCode: key}, win_id);
    setTimeout(() => {
        sendInputEvent({type: 'keyUp', keyCode: key}, win_id);
    }, 50);

}

const getElementRect = async (sel, win_id) => {
    const {result} = await executeJavaScript(`
const ele = document.querySelector("${sel}")
const {width,height,top,left} = ele.getBoundingClientRect()
return {
    width,height,top,left
}
    `, win_id)
    return result;
}


const executeJavaScript = async (code, win_id) => {
    return post_rpc({
        method: "executeJavaScript",
        params: {
            win_id: win_id || 1,
            code
        }
    })
}

const importCookies = async (cookies, win_id) => {
    return post_rpc({
        method: "importCookies",
        params: {
            win_id: win_id || 1,
            cookies
        }
    })
}


const getHtmlPageInfo = async (win_id) => {
    const code = `
(async ()=>{
  const {getCleanHtml,getTitle} = window._G;
  const cleanHtml = getCleanHtml();
      
  return {
    t:Date.now(),
    title:document.title,
    url:location.href,
    html:cleanHtml,
  }
})()
    
    
    `
    return post_rpc({
        method: "executeJavaScript",
        params: {
            win_id: win_id || 1,
            code
        }
    })
}

const clearRequests = async (win_id) => {
    return post_rpc({
        method: "clearRequests",
        params: {
            win_id: win_id || 1,
        }
    })
}

const getWindowState = async (win_id) => {
    return post_rpc({
        method: "getWindowState",
        params: {
            win_id: win_id || 1,
        }
    })
}
const getRequests = async (win_id) => {
    return post_rpc({
        method: "getRequests",
        params: {
            win_id: win_id || 1,
        }
    })
}

const downloadMedia = async (params, win_id) => {
    return post_rpc({
        method: "downloadMedia",
        params: {
            win_id: win_id || 1,
            ...params
        }
    })
}


const getSubTitles = async ({mediaPath}, win_id) => {
    return post_rpc({
        method: "getSubTitles",
        params: {
            win_id: win_id || 1,
            mediaPath
        }
    })
}


function waitForResult(cb, timeout = -1, interval = 100) {
    const startTime = Date.now();
    return new Promise(resolve => {
        const checkReply = async () => {
            try {
                const res = await Promise.resolve(cb()); // Ensure cb result is a Promise
                if (res) {
                    resolve(res);
                    return;
                }
                // Check for timeout
                if (timeout > -1 && Date.now() - startTime > timeout) {
                    resolve({err: 'ERR_TIMEOUT'});
                    return;
                }
                // Retry after interval
                setTimeout(checkReply, interval);
            } catch (error) {
                console.error('Error in waitForResult callback:', error);
                resolve({err: `ERR:${error}`});
            }
        };
        checkReply();
    });
}

async function chatgptAsk(prompt) {
    try {
        const response = await fetch(`${AI_BASE_API_URL}/chatgpt/ask`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                input: prompt
            })
        });
        const result = await response.json();

        console.log("Full API response:", result);
        const messageItem = result.output.find(item => item.type === "message");
        if (!messageItem) return {ok: false, error: "No message in response"};
        // const outputText = messageItem.content[0].text;
        // const res = JSON.parse(outputText)
        console.log("Output text:", messageItem.content);
        return messageItem.content
    } catch (e) {
        console.error(e)
        return {ok: false}
    }
}


const __MapArray = new Map();

class MapArray {
    constructor(id) {
        this.id = id
    }

    all() {
        let rows = []
        if (!__MapArray.has(this.id)) {
            __MapArray.set(this.id, [])
        } else {
            rows = __MapArray.get(this.id)
        }
        return rows
    }

    push(entity) {
        let rows = this.all()
        rows.push(entity)
        __MapArray.set(this.id, rows)
    }

    clear() {
        __MapArray.set(this.id, [])
    }
}

module.exports = {
    setBaseApi,getBaseApi,
    chatgptAsk,
    sendKey,
    downloadMedia,
    getWindowState,
    getHtmlPageInfo,
    waitForResult,
    getRequests,
    clearRequests,
    executeJavaScript,
    post_rpc,
    MapArray,
    importCookies,
    openWindow,
    loadURL,
    getElementRect,
    sendInputEvent,
    simulateClick,
    getSubTitles
};
