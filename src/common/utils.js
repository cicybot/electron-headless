let ELECTRON_BASE_API_URL = "http://127.0.0.1:3456";
const AI_BASE_API_URL = "https://api.cicy.de5.net";
let TOKEN = "";
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function setBaseApi(url) {
  ELECTRON_BASE_API_URL = url;
}

function getBaseApi() {
  return ELECTRON_BASE_API_URL;
}

function setToken(token) {
  TOKEN = token;
}

function getToken() {
  return TOKEN;
}
const post_rpc = async ({ method, params }) => {
  const url = `${getBaseApi()}/rpc`;
  // console.log(ELECTRON_BASE_API_URL,params)
  const headers = {
    "Content-Type": "application/json",
  };
  if (TOKEN) {
    headers["token"] = TOKEN;
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ method, params }),
  });

  const json = await res.json();
  console.debug(url, { method, params }, res.status, JSON.stringify(json, null, 2));
  return json;
};

function openWindow(url, options, others) {
  console.log(url);
  return post_rpc({
    method: "openWindow",
    params: {
      url: url,
      options: options,
      others: others,
    },
  });
}

function getWindows() {
  return post_rpc({
    method: "getWindows",
    params: {},
  });
}

function closeWindow(win_id) {
  return post_rpc({
    method: "closeWindow",
    params: {
      win_id,
    },
  });
}

function showWindow(win_id) {
  return post_rpc({
    method: "showWindow",
    params: {
      win_id,
    },
  });
}

function hideWindow(win_id) {
  return post_rpc({
    method: "hideWindow",
    params: {
      win_id,
    },
  });
}

function reload(win_id) {
  return post_rpc({
    method: "reload",
    params: {
      win_id,
    },
  });
}

function getBounds(win_id) {
  return post_rpc({
    method: "getBounds",
    params: {
      win_id,
    },
  });
}

function getDisplayScreenSize() {
  return post_rpc({
    method: "getDisplayScreenSize",
    params: {},
  });
}

function displayScreenshot() {
  return post_rpc({
    method: "displayScreenshot",
    params: {},
  });
}

function getWindowScreenshot(win_id) {
  return post_rpc({
    method: "getWindowScreenshot",
    params: {
      win_id,
    },
  });
}



function sendElectronClick(win_id, x, y) {
  return post_rpc({
    method: "sendElectronClick",
    params: {
      win_id,
      x,
      y,
    },
  });
}

function openTerminal(command, showWin) {
  return post_rpc({
    method: "openTerminal",
    params: {
      command,
      showWin,
    },
  });
}

// System methods
function ping() {
  return post_rpc({
    method: "ping",
    params: {},
  });
}

function info() {
  return post_rpc({
    method: "info",
    params: {},
  });
}

// Page operations
function getURL(win_id) {
  return post_rpc({
    method: "getURL",
    params: {
      win_id,
    },
  });
}

function getTitle(win_id) {
  return post_rpc({
    method: "getTitle",
    params: {
      win_id,
    },
  });
}

function getWindowSize(win_id) {
  return post_rpc({
    method: "getWindowSize",
    params: {
      win_id,
    },
  });
}

function setBounds(win_id, bounds) {
  return post_rpc({
    method: "setBounds",
    params: {
      win_id,
      bounds,
    },
  });
}

function setWindowSize(win_id, width, height) {
  return post_rpc({
    method: "setWindowSize",
    params: {
      win_id,
      width,
      height,
    },
  });
}

function setWindowWidth(win_id, width) {
  return post_rpc({
    method: "setWindowWidth",
    params: {
      win_id,
      width,
    },
  });
}

function setWindowPosition(win_id, x, y) {
  return post_rpc({
    method: "setWindowPosition",
    params: {
      win_id,
      x,
      y,
    },
  });
}

// JavaScript execution
function openDevTools(win_id) {
  return post_rpc({
    method: "openDevTools",
    params: {
      win_id,
    },
  });
}

// Input events
function sendElectronCtlV(win_id) {
  return post_rpc({
    method: "sendElectronPaste",
    params: {
      win_id,
    },
  });
}

function sendElectronPaste(win_id) {
  return post_rpc({
    method: "sendElectronPaste",
    params: {
      win_id,
    },
  });
}

function sendElectronPressEnter(win_id) {
  return post_rpc({
    method: "sendElectronPressEnter",
    params: {
      win_id,
    },
  });
}

function writeClipboard(text) {
  return post_rpc({
    method: "writeClipboard",
    params: {
      text,
    },
  });
}

function showFloatDiv(win_id, options) {
  return post_rpc({
    method: "showFloatDiv",
    params: {
      win_id,
      options,
    },
  });
}

function hideFloatDiv(win_id) {
  return post_rpc({
    method: "hideFloatDiv",
    params: {
      win_id,
    },
  });
}

// Window state methods
function getWindowState(win_id) {
  return post_rpc({
    method: "getWindowState",
    params: {
      win_id,
    },
  });
}

// Page operations
function loadURL(win_id, url) {
  return post_rpc({
    method: "loadURL",
    params: {
      win_id,
      url,
    },
  });
}

// Input events
function sendInputEvent(win_id, inputEvent) {
  return post_rpc({
    method: "sendInputEvent",
    params: {
      win_id,
      inputEvent,
    },
  });
}

function sendElectronSelectAll(win_id) {
  return post_rpc({
    method: "sendElectronSelectAll",
    params: {
      win_id,
    },
  });
}

function sendElectronCopy(win_id) {
  return post_rpc({
    method: "sendElectronCopy",
    params: {
      win_id,
    },
  });
}

function sendElectronCut(win_id) {
  return post_rpc({
    method: "sendElectronCut",
    params: {
      win_id,
    },
  });
}

// Media operations
function downloadMedia(win_id, mediaUrl, options = {}) {
  return post_rpc({
    method: "downloadMedia",
    params: {
      win_id,
      mediaUrl,
      ...options,
    },
  });
}

function getSubTitles(mediaPath) {
  return post_rpc({
    method: "getSubTitles",
    params: {
      mediaPath,
    },
  });
}

// Network monitoring
function getRequests(win_id) {
  return post_rpc({
    method: "getRequests",
    params: {
      win_id,
    },
  });
}

function clearRequests(win_id) {
  return post_rpc({
    method: "clearRequests",
    params: {
      win_id,
    },
  });
}

// Screenshot operations - extended
function getScreenshotInfo(win_id) {
  return post_rpc({
    method: "getWindowScreenshotInfo",
    params: {
      win_id,
    },
  });
}

function captureSystemScreenshot(options = {}) {
  return post_rpc({
    method: "captureSystemScreenshot",
    params: {
      ...options,
    },
  });
}

function saveSystemScreenshot(filePath, options = {}) {
  return post_rpc({
    method: "saveSystemScreenshot",
    params: {
      filePath,
      ...options,
    },
  });
}

// Account management
function switchAccount(account_index) {
  return post_rpc({
    method: "switchAccount",
    params: {
      account_index,
    },
  });
}

function getAccountInfo(win_id) {
  return post_rpc({
    method: "getAccountInfo",
    params: {
      win_id,
    },
  });
}

function getAccountWindows(account_index) {
  return post_rpc({
    method: "getAccountWindows",
    params: {
      account_index,
    },
  });
}



// Cookies
function exportCookies(win_id, options) {
  return post_rpc({
    method: "exportCookies",
    params: {
      win_id,
      options,
    },
  });
}

// User agent
function setUserAgent(win_id, userAgent) {
  return post_rpc({
    method: "setUserAgent",
    params: {
      win_id,
      userAgent,
    },
  });
}

// Screenshot operations
function captureScreenshot(win_id, options) {
  return post_rpc({
    method: "captureScreenshot",
    params: {
      win_id,
      ...options,
    },
  });
}

function saveScreenshot(win_id, filePath, options) {
  return post_rpc({
    method: "saveScreenshot",
    params: {
      win_id,
      filePath,
      ...options,
    },
  });
}







// Account management
function switchAccount(account_index) {
  return post_rpc({
    method: "switchAccount",
    params: {
      account_index,
    },
  });
}

function getAccountInfo(win_id) {
  return post_rpc({
    method: "getAccountInfo",
    params: {
      win_id,
    },
  });
}

function getAccountWindows(account_index) {
  return post_rpc({
    method: "getAccountWindows",
    params: {
      account_index,
    },
  });
}

// PyAutoGUI methods




function loadURL(url, win_id) {
  return post_rpc({
    method: "loadURL",
    params: {
      win_id: win_id || 1,
      url: url,
    },
  });
}


async function simulateClick(x, y, win_id) {
  // 1. Press the mouse button down
  await sendInputEvent(
    {
      type: "mouseDown",
      x: x,
      y: y,
      button: "left",
      clickCount: 1,
    },
    win_id
  );

  setTimeout(() => {
    // 2. Release the mouse button
    sendInputEvent(
      {
        type: "mouseUp",
        x: x,
        y: y,
        button: "left",
        clickCount: 1,
      },
      win_id
    );
  }, 50);
}

/**
 * Simulates a single key press (Down + Up)
 * @param {Electron.WebContents} contents
 * @param {string} key - e.g., "Enter", "Escape", "A", "F1"
 */
async function sendKey(key, win_id) {
  await sendInputEvent({ type: "keyDown", keyCode: key }, win_id);
  setTimeout(() => {
    sendInputEvent({ type: "keyUp", keyCode: key }, win_id);
  }, 50);
}

const getElementRect = async (sel, win_id) => {
  const { result } = await executeJavaScript(
    `
const ele = document.querySelector("${sel}")
const {width,height,top,left} = ele.getBoundingClientRect()
return {
    width,height,top,left
}
    `,
    win_id
  );
  return result;
};

const executeJavaScript = async (code, win_id) => {
  return post_rpc({
    method: "executeJavaScript",
    params: {
      win_id: win_id || 1,
      code,
    },
  });
};

const importCookies = async (cookies, win_id) => {
  return post_rpc({
    method: "importCookies",
    params: {
      win_id: win_id || 1,
      cookies,
    },
  });
};

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
    
    
    `;
  return post_rpc({
    method: "executeJavaScript",
    params: {
      win_id: win_id || 1,
      code,
    },
  });
};



function waitForResult(cb, timeout = -1, interval = 100) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const checkReply = async () => {
      try {
        const res = await Promise.resolve(cb()); // Ensure cb result is a Promise
        if (res) {
          resolve(res);
          return;
        }
        // Check for timeout
        if (timeout > -1 && Date.now() - startTime > timeout) {
          resolve({ err: "ERR_TIMEOUT" });
          return;
        }
        // Retry after interval
        setTimeout(checkReply, interval);
      } catch (error) {
        console.error("Error in waitForResult callback:", error);
        resolve({ err: `ERR:${error}` });
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
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: prompt,
      }),
    });
    const result = await response.json();

    console.log("Full API response:", result);
    const messageItem = result.output.find((item) => item.type === "message");
    if (!messageItem) return { ok: false, error: "No message in response" };
    // const outputText = messageItem.content[0].text;
    // const res = JSON.parse(outputText)
    console.log("Output text:", messageItem.content);
    return messageItem.content;
  } catch (e) {
    console.error(e);
    return { ok: false };
  }
}

const __MapArray = new Map();

class MapArray {
  constructor(id) {
    this.id = id;
  }

  all() {
    let rows = [];
    if (!__MapArray.has(this.id)) {
      __MapArray.set(this.id, []);
    } else {
      rows = __MapArray.get(this.id);
    }
    return rows;
  }

  push(entity) {
    let rows = this.all();
    rows.push(entity);
    __MapArray.set(this.id, rows);
  }

  clear() {
    __MapArray.set(this.id, []);
  }
}

module.exports = {
  setBaseApi,
  getBaseApi,
  setToken,
  getToken,
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
  getSubTitles,
  getWindows,
  closeWindow,
  showWindow,
  hideWindow,
  reload,
  getBounds,
  getDisplayScreenSize,
  displayScreenshot,
  getWindowScreenshot,
  sendElectronClick,
  openTerminal,
  ping,
  info,
  getURL,
  getTitle,
  getWindowSize,
  setBounds,
  setWindowSize,
  setWindowWidth,
  setWindowPosition,
  openDevTools,
  sendElectronCtlV,
  sendElectronPressEnter,
  writeClipboard,
  showFloatDiv,
  hideFloatDiv,
  exportCookies,
  setUserAgent,
  captureScreenshot,
  saveScreenshot,
  getScreenshotInfo,
  sendElectronPaste,
  captureSystemScreenshot,
  saveSystemScreenshot,
  switchAccount,
  getAccountInfo,
  getAccountWindows,
  sleep,
};
