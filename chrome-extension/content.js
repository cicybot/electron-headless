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
      console.log("_G init");
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
      console.log("_G preload");
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

// src/extension/utils-extension.js
var require_utils_extension = __commonJS({
  "src/extension/utils-extension.js"(exports2, module2) {
    function onReady2() {
      console.log("_G extension onReady");
      setInterval(() => {
        console.debug("loop");
        if (location.href.startsWith("https://colab.research.google.com/")) {
          const res = document.querySelector("body > div.notebook-vertical > div.notebook-horizontal > colab-left-pane > colab-resizer");
          if (!res) {
            document.querySelector("#cell-3kzh_tuJISRi > div.main-content > div > div.codecell-input-output > div.inputarea.horizontal.layout.code > div.cell-gutter > div > colab-run-button").shadowRoot.querySelector("#run-button").click();
          }
        }
        if (location.href.startsWith("https://shell.cloud.google.com/")) {
          const container = document.querySelector("cloudshell-view-controls");
          if (!container.querySelector('button[aria-label="\u6253\u5F00\u7F16\u8F91\u5668"]')) {
            return;
          }
          const openBtn = document.querySelector('button[aria-label="\u6253\u5F00\u65B0\u6807\u7B7E\u9875"]');
          if (openBtn) {
            const rows = document.querySelectorAll('button[mattooltip="\u5173\u95ED\u6807\u7B7E"]');
            let i = 0;
            rows.forEach((ele) => {
              i += 1;
              if (i > 1) {
                ele.click();
              }
            });
            openBtn.click();
          }
        }
      }, 2e4);
    }
    module2.exports = { onReady: onReady2 };
  }
});

// src/extension/content.js
var { toggleDiv: toggleDiv2 } = require_utils_browser();
var { onReady } = require_utils_extension();
var toastId = "injector-toast-display";
var handleSelect = async (options) => {
  let { text, mode } = options || {};
  if (!text) {
    const selection = window.getSelection();
    text = selection.toString();
  }
  if (!text) {
    return;
  }
  const apiUrl = "https://api.cicy.de5.net/t";
  let input;
  if (mode === 1) {
    input = `Please correct the following English expression.": 
--------
${text}
--------

Respond ONLY in valid JSON with the single key "text" and nothing else.`;
    showToast("\u7EA0\u6B63\u4E2D...");
  } else {
    showToast("\u7FFB\u8BD1\u4E2D...");
    input = `Translate the sentence below: 
--------
${text}
--------
     into Chinese.
Respond ONLY in valid JSON with the single key "text" and nothing else.`;
  }
  const requestBody = {
    input
  };
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    const result = await response.json();
    console.log("Full API response:", result);
    const messageItem = result.output.find((item) => item.type === "message");
    if (!messageItem) return { error: "No message in response" };
    const outputText = messageItem.content[0].text;
    const res = JSON.parse(outputText);
    console.log("Output text:", res.text);
    if (mode === 1) {
      navigator.clipboard.writeText(res.text).then(() => {
        console.log("Copied to clipboard!");
      }).catch((err) => {
        console.error("Failed to copy: ", err);
      });
      showToast(res.text, { timeout: 10 });
    } else {
      showToast(res.text, { timeout: 4 });
    }
  } catch (err) {
    showToast(err, true);
    console.error("Error calling worker:", err);
  }
};
var showToast = (msg, options) => {
  const { isError, timeout } = options || {};
  const existing = document.getElementById(toastId);
  if (existing) existing.remove();
  const div = document.createElement("div");
  div.id = toastId;
  div.textContent = msg;
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    background: ${isError ? "#ff4444" : "#222"};
    color: white;
    border-radius: 4px;
    z-index: 2147483647;
    font-family: sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: opacity 0.3s ease;
    pointer-events: none;
  `;
  document.body.appendChild(div);
  setTimeout(() => {
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 300);
  }, timeout * 1e3 || 2e3);
};
window.addEventListener("load", () => {
  console.log("load");
  onReady();
});
document.addEventListener("keydown", async (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
    e.preventDefault();
    handleSelect();
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "u") {
    e.preventDefault();
    handleSelect({
      mode: 1
    });
  }
  if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
    if (e.key.toLowerCase() === "p") {
      chrome.runtime.sendMessage({
        type: "copy-domain-cookies"
      });
    }
    if (e.key.toLowerCase() === "l") {
      chrome.runtime.sendMessage({
        type: "open-in-electron"
      });
    }
    e.preventDefault();
  }
});
if (chrome && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "copyTgAuth") {
      let res = "";
      for (let i = 0; i < Object.keys(localStorage).length; i++) {
        const k = Object.keys(localStorage)[i];
        const v = localStorage.getItem(k);
        res += `localStorage.setItem("${k}",\`${v}\`);
`;
      }
      console.log(res);
      navigator.clipboard.writeText(res).then(() => {
        showToast(`localStorage copied`, { timeout: 4 });
      }).catch(() => {
        showToast("localStorage write failed", { isError: true, timeout: 4 });
      });
    }
    if (message.type === "toggleDiv") {
      toggleDiv2();
    }
    if (message.type === "copy-domain-cookies") {
      console.log("copy-domain-cookies", message.domain, message.payload);
      navigator.clipboard.writeText(JSON.stringify(message.payload)).then(() => {
        showToast(`Cookies copied for: ${message.domain}`, { timeout: 4 });
      }).catch(() => {
        showToast("Clipboard write failed", { isError: true, timeout: 4 });
      });
    }
  });
}
//# sourceMappingURL=content.js.map
