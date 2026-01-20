(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/utils-browser.js
  var require_utils_browser = __commonJS({
    "src/utils-browser.js"(exports, module) {
      var Storage = class {
        static get(key) {
          const res = localStorage.getItem("cicy_" + key);
          if (res) {
            return JSON.parse(res)[0];
          } else {
            null;
          }
        }
        static set(key, value) {
          localStorage.setItem("cicy_" + key, JSON.stringify([value]));
        }
      };
      var RECT_ID = "__rect";
      function showRect({ width, height, left, top }, timeout) {
        const existing = document.getElementById(RECT_ID);
        if (existing) existing.remove();
        if (!timeout) {
          timeout = 2;
        }
        const div = document.createElement("div");
        div.id = RECT_ID;
        div.style.cssText = `
    position: fixed;
    width: ${width}px;
    height: ${height}px;
    top: ${top}px;
    left: ${left}px;
    padding: 10px 20px;
    background: #ff4444;
    color: white;
    border-radius: 4px;
    z-index: 2147483647;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: opacity 0.3s ease;
    pointer-events: none;
  `;
        document.body.appendChild(div);
        setTimeout(() => {
          div.style.opacity = "0";
          setTimeout(() => div.remove(), 300);
        }, timeout * 1e3);
      }
      function __getChats(chat) {
        const { id, messages, title, updateTime } = chat;
        const rows = [];
        for (let i = 0; i < messages.length; i++) {
          const { text } = messages[i];
          rows.push(text);
        }
        rows.reverse();
        let reply = null;
        if (rows.length > 0) {
          reply = rows[0];
        }
        return {
          id,
          title,
          reply,
          updateTime,
          messages: rows
        };
      }
      async function getChatGptChats() {
        const db = window._G.useIndexedDB("ConversationsDatabase", "conversations");
        const allItems = await db.getAllItems();
        console.log("allItems", allItems);
        if (allItems.length === 0) {
          return null;
        }
        allItems.reverse();
        return __getChats(allItems[0]);
      }
      function cleanNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          while (node.attributes.length > 0) {
            node.removeAttribute(node.attributes[0].name);
          }
          for (let i = node.childNodes.length - 1; i >= 0; i--) {
            cleanNode(node.childNodes[i]);
          }
          if (node.childNodes.length === 0 || [...node.childNodes].every(
            (n) => n.nodeType === Node.TEXT_NODE && !n.textContent.trim()
          )) {
            node.remove();
          }
        } else if (node.nodeType === Node.TEXT_NODE) {
          const cleanedText = node.textContent.replace(/\s+/g, " ").trim();
          if (!cleanedText) {
            node.remove();
          } else {
            node.textContent = cleanedText;
          }
        }
      }
      function getCleanHtml(ele) {
        let doc = ele.cloneNode(true);
        const uselessTags = [
          "script",
          "style",
          "link",
          "img",
          "video",
          "audio",
          "iframe",
          "svg",
          "noscript",
          "canvas"
        ];
        uselessTags.forEach((tag) => {
          const elements = doc.querySelectorAll(tag);
          elements.forEach((el) => el.remove());
        });
        cleanNode(doc);
        return doc.outerHTML;
      }
      function regxHTML(html) {
        return html.replace(/<!--[\s\S]*?-->/g, "").replace(/span/g, "").replace(/<>/g, "").replace(/<\/>/g, "").trim();
      }
      function regxHTML1(html) {
        let t = html.replace(/span/g, "div").trim();
        while (t.indexOf("<div><div>") > -1) {
          t = t.replace(/<div><div>/g, "<div>");
        }
        while (t.indexOf("</div></div>") > -1) {
          t = t.replace(/<\/div><\/div>/g, "</div>");
        }
        return t;
      }
      var FLOAT_DIV_ID = "__floatDiv";
      function showFloatDiv(options) {
        let { width, height, top, left } = options || {};
        if (!width) width = 200;
        if (!height) height = 80;
        if (!top) top = 50;
        if (!left) left = 50;
        const existing = document.getElementById(FLOAT_DIV_ID);
        if (existing) existing.remove();
        const div = document.createElement("div");
        div.id = FLOAT_DIV_ID;
        div.style.cssText = `
    position: fixed;
    width: ${width}px;
    height: ${height}px;
    top: ${top}px;
    left: ${left}px;
    background: rgba(255, 255, 255, 0.9);
    border: 2px solid #333;
    border-radius: 4px;
    z-index: 2147483647;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    cursor: move;
  `;
        const handles = ["nw", "ne", "sw", "se"];
        handles.forEach((pos) => {
          const handle = document.createElement("div");
          handle.className = `resize-handle ${pos}`;
          handle.style.cssText = `
      position: absolute;
      width: 10px;
      height: 10px;
      background: #333;
      ${pos.includes("n") ? "top: -5px;" : "bottom: -5px;"}
      ${pos.includes("w") ? "left: -5px;" : "right: -5px;"}
      cursor: ${pos}-resize;
    `;
          div.appendChild(handle);
        });
        const closeButton = document.createElement("div");
        closeButton.innerHTML = "\xD7";
        closeButton.style.cssText = `
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 16px;
        height: 16px;
        background: rgba(255, 0, 0, 0.8);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        z-index: 1;
        opacity: 1;
    `;
        closeButton.addEventListener("click", () => {
          hideFloatDiv();
        });
        div.appendChild(closeButton);
        const textDisplay = document.createElement("div");
        textDisplay.style.cssText = `
        position: absolute;
        top: 2px;
        left: 2px;
        font-size: 14px;
        font-family: monospace;
        color: red;
        opacity: 1;
        background: rgba(255, 255, 255, 0.8);
        padding: 2px 4px;
        border-radius: 2px;
        pointer-events: none;
        z-index: 2;
    `;
        div.appendChild(textDisplay);
        textDisplay.innerHTML = `Pos: ${left},${top}<br>Size: ${width}x${height}`;
        document.body.appendChild(div);
        let isDragging = false;
        let isResizing = false;
        let startX, startY, startLeft, startTop, startWidth, startHeight, resizeHandle;
        div.addEventListener("mousedown", (e) => {
          if (e.target.classList.contains("resize-handle")) {
            isResizing = true;
            resizeHandle = e.target.className.split(" ")[1];
            startX = e.clientX;
            startY = e.clientY;
            startWidth = div.offsetWidth;
            startHeight = div.offsetHeight;
            startLeft = div.offsetLeft;
            startTop = div.offsetTop;
            e.preventDefault();
          } else {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = div.offsetLeft;
            startTop = div.offsetTop;
            e.preventDefault();
          }
        });
        document.addEventListener("mousemove", (e) => {
          if (isDragging) {
            const newLeft = startLeft + (e.clientX - startX);
            const newTop = startTop + (e.clientY - startY);
            div.style.left = `${newLeft}px`;
            div.style.top = `${newTop}px`;
            textDisplay.innerHTML = `Pos: ${newLeft},${newTop}<br>Size: ${div.offsetWidth}x${div.offsetHeight}`;
          } else if (isResizing) {
            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;
            if (resizeHandle.includes("e")) {
              newWidth = startWidth + (e.clientX - startX);
            }
            if (resizeHandle.includes("s")) {
              newHeight = startHeight + (e.clientY - startY);
            }
            if (resizeHandle.includes("w")) {
              newWidth = startWidth - (e.clientX - startX);
              newLeft = startLeft + (e.clientX - startX);
            }
            if (resizeHandle.includes("n")) {
              newHeight = startHeight - (e.clientY - startY);
              newTop = startTop + (e.clientY - startY);
            }
            const finalWidth = Math.max(50, newWidth);
            const finalHeight = Math.max(50, newHeight);
            div.style.width = `${finalWidth}px`;
            div.style.height = `${finalHeight}px`;
            div.style.left = `${newLeft}px`;
            div.style.top = `${newTop}px`;
            textDisplay.innerHTML = `Pos: ${newLeft},${newTop}<br>Size: ${finalWidth}x${finalHeight}`;
          }
        });
        document.addEventListener("mouseup", () => {
          isDragging = false;
          isResizing = false;
        });
      }
      function hideFloatDiv() {
        const div = document.getElementById(FLOAT_DIV_ID);
        if (div) div.remove();
      }
      function toggleDiv() {
        const existing = document.getElementById(FLOAT_DIV_ID);
        if (existing) {
          existing.remove();
        } else {
          showFloatDiv({});
        }
      }
      function useIndexedDB(dbName, storeName) {
        return {
          openDB: function() {
            return new Promise((resolve, reject) => {
              const request = indexedDB.open(dbName);
              request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                  db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
                }
              };
              request.onsuccess = (event) => resolve(event.target.result);
              request.onerror = (event) => reject(event.target.error);
            });
          },
          addItem: async function(item) {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
              const tx = db.transaction(storeName, "readwrite");
              const store = tx.objectStore(storeName);
              const request = store.add(item);
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
          },
          getItem: async function(id) {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
              const tx = db.transaction(storeName, "readonly");
              const store = tx.objectStore(storeName);
              const request = store.get(id);
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
          },
          getAllItems: async function() {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
              const tx = db.transaction(storeName, "readonly");
              const store = tx.objectStore(storeName);
              const request = store.getAll();
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
          }
        };
      }
      var getHtml = () => {
        return document.documentElement.outerHTML;
      };
      var getBodyText = () => {
        let { textContent } = document.body;
        return textContent.replace(/\s/g, "").trim();
      };
      var getLinks = () => {
        const links = Array.from(document.querySelectorAll("a[href]")).map((a) => ({
          url: a.getAttribute("href"),
          a: a.innerText.trim()
        })).filter(
          (item) => item.url && item.url.trim() !== "" && item.url.trim() !== "undefined"
        );
        return links;
      };
      var setAutoRunJs = (code) => {
        localStorage.setItem("__AutoRunJs", code);
      };
      var getTitle = () => {
        return document.title;
      };
      var init = () => {
        if (window._G.preload) {
          window._G.preload({ win_id: window._G.win_id });
        }
        const autoRunJs = localStorage.getItem("__AutoRunJs");
        if (autoRunJs) {
          d("autoRunJs");
          eval(atob(autoRunJs));
        }
      };
      var preload = async ({ win_id }) => {
        window.addEventListener("keydown", async (e) => {
          const cmdKeyPressed = (k) => {
            return (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === k;
          };
          if (cmdKeyPressed("\\")) {
            e.preventDefault();
            console.log(e.key);
          }
        }, true);
        d("preload win_id:", win_id);
      };
      var _l = (...args) => {
        console.debug("[CICY]", ...args);
      };
      var d = _l;
      module.exports = {
        _l,
        preload,
        init,
        useIndexedDB,
        getHtml,
        getBodyText,
        getLinks,
        setAutoRunJs,
        getTitle,
        regxHTML1,
        toggleDiv,
        regxHTML,
        cleanNode,
        getCleanHtml,
        showRect,
        getChatGptChats,
        Storage,
        showFloatDiv,
        hideFloatDiv
      };
    }
  });

  // src/utils.js
  var require_utils = __commonJS({
    "src/utils.js"(exports2, module2) {
      var ELECTRON_BASE_API_URL = "http://127.0.0.1:3456";
      var AI_BASE_API_URL = "https://api.cicy.de5.net";
      var TOKEN = "";
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
      var post_rpc = async ({ method, params }) => {
        const url = `${getBaseApi()}/rpc`;
        const headers = {
          "Content-Type": "application/json"
        };
        if (TOKEN) {
          headers["token"] = TOKEN;
        }
        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({ method, params })
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
            url,
            options,
            others
          }
        });
      }
      function getWindows() {
        return post_rpc({
          method: "getWindows",
          params: {}
        });
      }
      function closeWindow(win_id) {
        return post_rpc({
          method: "closeWindow",
          params: {
            win_id
          }
        });
      }
      function showWindow(win_id) {
        return post_rpc({
          method: "showWindow",
          params: {
            win_id
          }
        });
      }
      function hideWindow(win_id) {
        return post_rpc({
          method: "hideWindow",
          params: {
            win_id
          }
        });
      }
      function reload(win_id) {
        return post_rpc({
          method: "reload",
          params: {
            win_id
          }
        });
      }
      function getBounds(win_id) {
        return post_rpc({
          method: "getBounds",
          params: {
            win_id
          }
        });
      }
      function getDisplayScreenSize() {
        return post_rpc({
          method: "getDisplayScreenSize",
          params: {}
        });
      }
      function displayScreenshot() {
        return post_rpc({
          method: "displayScreenshot",
          params: {}
        });
      }
      function getWindowScreenshot(win_id) {
        return post_rpc({
          method: "getWindowScreenshot",
          params: {
            win_id
          }
        });
      }
      function pyautoguiClick(x, y) {
        return post_rpc({
          method: "pyautoguiClick",
          params: {
            x,
            y
          }
        });
      }
      function sendElectronClick(win_id, x, y) {
        return post_rpc({
          method: "sendElectronClick",
          params: {
            win_id,
            x,
            y
          }
        });
      }
      function openTerminal(command, showWin) {
        return post_rpc({
          method: "openTerminal",
          params: {
            command,
            showWin
          }
        });
      }
      function ping() {
        return post_rpc({
          method: "ping",
          params: {}
        });
      }
      function info() {
        return post_rpc({
          method: "info",
          params: {}
        });
      }
      function getURL(win_id) {
        return post_rpc({
          method: "getURL",
          params: {
            win_id
          }
        });
      }
      function getTitle2(win_id) {
        return post_rpc({
          method: "getTitle",
          params: {
            win_id
          }
        });
      }
      function getWindowSize(win_id) {
        return post_rpc({
          method: "getWindowSize",
          params: {
            win_id
          }
        });
      }
      function setBounds(win_id, bounds) {
        return post_rpc({
          method: "setBounds",
          params: {
            win_id,
            bounds
          }
        });
      }
      function setWindowSize(win_id, width, height) {
        return post_rpc({
          method: "setWindowSize",
          params: {
            win_id,
            width,
            height
          }
        });
      }
      function setWindowWidth(win_id, width) {
        return post_rpc({
          method: "setWindowWidth",
          params: {
            win_id,
            width
          }
        });
      }
      function setWindowPosition(win_id, x, y) {
        return post_rpc({
          method: "setWindowPosition",
          params: {
            win_id,
            x,
            y
          }
        });
      }
      function openDevTools(win_id) {
        return post_rpc({
          method: "openDevTools",
          params: {
            win_id
          }
        });
      }
      function sendElectronCtlV(win_id) {
        return post_rpc({
          method: "sendElectronCtlV",
          params: {
            win_id
          }
        });
      }
      function sendElectronPressEnter(win_id) {
        return post_rpc({
          method: "sendElectronPressEnter",
          params: {
            win_id
          }
        });
      }
      function writeClipboard(text) {
        return post_rpc({
          method: "writeClipboard",
          params: {
            text
          }
        });
      }
      function showFloatDiv2(win_id, options) {
        return post_rpc({
          method: "showFloatDiv",
          params: {
            win_id,
            options
          }
        });
      }
      function hideFloatDiv2(win_id) {
        return post_rpc({
          method: "hideFloatDiv",
          params: {
            win_id
          }
        });
      }
      function exportCookies(win_id, options) {
        return post_rpc({
          method: "exportCookies",
          params: {
            win_id,
            options
          }
        });
      }
      function setUserAgent(win_id, userAgent) {
        return post_rpc({
          method: "setUserAgent",
          params: {
            win_id,
            userAgent
          }
        });
      }
      function captureScreenshot(win_id, options) {
        return post_rpc({
          method: "captureScreenshot",
          params: {
            win_id,
            ...options
          }
        });
      }
      function saveScreenshot(win_id, filePath, options) {
        return post_rpc({
          method: "saveScreenshot",
          params: {
            win_id,
            filePath,
            ...options
          }
        });
      }
      function getScreenshotInfo(win_id) {
        return post_rpc({
          method: "getScreenshotInfo",
          params: {
            win_id
          }
        });
      }
      function captureSystemScreenshot(options) {
        return post_rpc({
          method: "captureSystemScreenshot",
          params: {
            ...options
          }
        });
      }
      function saveSystemScreenshot(filePath, options) {
        return post_rpc({
          method: "saveSystemScreenshot",
          params: {
            filePath,
            ...options
          }
        });
      }
      function switchAccount(account_index) {
        return post_rpc({
          method: "switchAccount",
          params: {
            account_index
          }
        });
      }
      function getAccountInfo(win_id) {
        return post_rpc({
          method: "getAccountInfo",
          params: {
            win_id
          }
        });
      }
      function getAccountWindows(account_index) {
        return post_rpc({
          method: "getAccountWindows",
          params: {
            account_index
          }
        });
      }
      function pyautoguiType(text) {
        return post_rpc({
          method: "pyautoguiType",
          params: {
            text
          }
        });
      }
      function pyautoguiPress(key) {
        return post_rpc({
          method: "pyautoguiPress",
          params: {
            key
          }
        });
      }
      function pyautoguiPaste() {
        return post_rpc({
          method: "pyautoguiPaste",
          params: {}
        });
      }
      function pyautoguiMove(x, y) {
        return post_rpc({
          method: "pyautoguiMove",
          params: {
            x,
            y
          }
        });
      }
      function pyautoguiPressEnter() {
        return post_rpc({
          method: "pyautoguiPressEnter",
          params: {}
        });
      }
      function pyautoguiPressBackspace() {
        return post_rpc({
          method: "pyautoguiPressBackspace",
          params: {}
        });
      }
      function pyautoguiPressSpace() {
        return post_rpc({
          method: "pyautoguiPressSpace",
          params: {}
        });
      }
      function pyautoguiPressEsc() {
        return post_rpc({
          method: "pyautoguiPressEsc",
          params: {}
        });
      }
      function pyautoguiScreenshot() {
        return post_rpc({
          method: "pyautoguiScreenshot",
          params: {}
        });
      }
      function pyautoguiWrite(text, interval) {
        return post_rpc({
          method: "pyautoguiWrite",
          params: {
            text,
            interval
          }
        });
      }
      function pyautoguiText(text) {
        return post_rpc({
          method: "pyautoguiText",
          params: {
            text
          }
        });
      }
      function loadURL(url, win_id) {
        return post_rpc({
          method: "loadURL",
          params: {
            win_id: win_id || 1,
            url
          }
        });
      }
      var sendInputEvent = async (inputEvent, win_id) => {
        return post_rpc({
          method: "sendInputEvent",
          params: {
            win_id: win_id || 1,
            inputEvent
          }
        });
      };
      async function simulateClick(x, y, win_id) {
        await sendInputEvent({
          type: "mouseDown",
          x,
          y,
          button: "left",
          clickCount: 1
        }, win_id);
        setTimeout(() => {
          sendInputEvent({
            type: "mouseUp",
            x,
            y,
            button: "left",
            clickCount: 1
          }, win_id);
        }, 50);
      }
      async function sendKey(key, win_id) {
        await sendInputEvent({ type: "keyDown", keyCode: key }, win_id);
        setTimeout(() => {
          sendInputEvent({ type: "keyUp", keyCode: key }, win_id);
        }, 50);
      }
      var getElementRect = async (sel, win_id) => {
        const { result } = await executeJavaScript(`
const ele = document.querySelector("${sel}")
const {width,height,top,left} = ele.getBoundingClientRect()
return {
    width,height,top,left
}
    `, win_id);
        return result;
      };
      var executeJavaScript = async (code, win_id) => {
        return post_rpc({
          method: "executeJavaScript",
          params: {
            win_id: win_id || 1,
            code
          }
        });
      };
      var importCookies = async (cookies, win_id) => {
        return post_rpc({
          method: "importCookies",
          params: {
            win_id: win_id || 1,
            cookies
          }
        });
      };
      var getHtmlPageInfo = async (win_id) => {
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
            code
          }
        });
      };
      var clearRequests = async (win_id) => {
        return post_rpc({
          method: "clearRequests",
          params: {
            win_id: win_id || 1
          }
        });
      };
      var getWindowState = async (win_id) => {
        return post_rpc({
          method: "getWindowState",
          params: {
            win_id: win_id || 1
          }
        });
      };
      var getRequests = async (win_id) => {
        return post_rpc({
          method: "getRequests",
          params: {
            win_id: win_id || 1
          }
        });
      };
      var downloadMedia = async (params, win_id) => {
        return post_rpc({
          method: "downloadMedia",
          params: {
            win_id: win_id || 1,
            ...params
          }
        });
      };
      var getSubTitles = async ({ mediaPath }, win_id) => {
        return post_rpc({
          method: "getSubTitles",
          params: {
            win_id: win_id || 1,
            mediaPath
          }
        });
      };
      function waitForResult(cb, timeout = -1, interval = 100) {
        const startTime = Date.now();
        return new Promise((resolve) => {
          const checkReply = async () => {
            try {
              const res = await Promise.resolve(cb());
              if (res) {
                resolve(res);
                return;
              }
              if (timeout > -1 && Date.now() - startTime > timeout) {
                resolve({ err: "ERR_TIMEOUT" });
                return;
              }
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
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              input: prompt
            })
          });
          const result = await response.json();
          console.log("Full API response:", result);
          const messageItem = result.output.find((item) => item.type === "message");
          if (!messageItem) return { ok: false, error: "No message in response" };
          console.log("Output text:", messageItem.content);
          return messageItem.content;
        } catch (e) {
          console.error(e);
          return { ok: false };
        }
      }
      var __MapArray = /* @__PURE__ */ new Map();
      var MapArray = class {
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
      };
      module2.exports = {
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
        pyautoguiClick,
        sendElectronClick,
        openTerminal,
        ping,
        info,
        getURL,
        getTitle: getTitle2,
        getWindowSize,
        setBounds,
        setWindowSize,
        setWindowWidth,
        setWindowPosition,
        openDevTools,
        sendElectronCtlV,
        sendElectronPressEnter,
        writeClipboard,
        showFloatDiv: showFloatDiv2,
        hideFloatDiv: hideFloatDiv2,
        exportCookies,
        setUserAgent,
        captureScreenshot,
        saveScreenshot,
        getScreenshotInfo,
        captureSystemScreenshot,
        saveSystemScreenshot,
        switchAccount,
        getAccountInfo,
        getAccountWindows,
        pyautoguiType,
        pyautoguiPress,
        pyautoguiPaste,
        pyautoguiMove,
        pyautoguiPressEnter,
        pyautoguiPressBackspace,
        pyautoguiPressSpace,
        pyautoguiPressEsc,
        pyautoguiScreenshot,
        pyautoguiWrite,
        pyautoguiText
      };
    }
  });

  // src/content-inject.js
  var utilsBrowser = require_utils_browser();
  var utils = require_utils();
  window._G = utilsBrowser;
  window._G.utils = utils;
})();
