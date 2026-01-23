"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/utils-browser.js
var require_utils_browser = __commonJS({
  "src/utils-browser.js"(exports, module) {
    "use strict";
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
        if (node.childNodes.length === 0 || [...node.childNodes].every((n) => n.nodeType === Node.TEXT_NODE && !n.textContent.trim())) {
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
    var PROMPT_DIV_ID = "__promptDiv";
    var PROMPT_ICON_ID = "__promptIcon";
    function showPromptIcon() {
      hidePromptIcon();
      const icon = document.createElement("div");
      icon.id = PROMPT_ICON_ID;
      icon.style.cssText = `
    position: fixed;
    top: 50%;
    right: 20px;
    width: 40px;
    height: 40px;
    background: #1a1a1a;
    border: 2px solid #444;
    border-radius: 50%;
    z-index: 2147483646;
    cursor: move;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
    user-select: none;
  `;
      icon.innerHTML = "\u{1F4AC}";
      icon.title = "Open Prompt Area (Drag to move)";
      let isDragging = false;
      let hasMoved = false;
      let startX, startY, startLeft, startTop;
      icon.addEventListener("mousedown", (e) => {
        if (e.button === 0) {
          isDragging = true;
          hasMoved = false;
          startX = e.clientX;
          startY = e.clientY;
          startLeft = icon.offsetLeft;
          startTop = icon.offsetTop;
          icon.style.cursor = "grabbing";
          icon.style.transition = "none";
          e.preventDefault();
        }
      });
      document.addEventListener("mousemove", (e) => {
        if (isDragging) {
          const newLeft = startLeft + (e.clientX - startX);
          const newTop = startTop + (e.clientY - startY);
          if (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3) {
            hasMoved = true;
          }
          const maxLeft = window.innerWidth - icon.offsetWidth;
          const maxTop = window.innerHeight - icon.offsetHeight;
          icon.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
          icon.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
          icon.style.right = "auto";
        }
      });
      document.addEventListener("mouseup", () => {
        if (isDragging) {
          isDragging = false;
          icon.style.cursor = "move";
          icon.style.transition = "all 0.3s ease";
        }
      });
      icon.addEventListener("click", (e) => {
        if (!hasMoved) {
          const existingPrompt = document.getElementById(PROMPT_DIV_ID);
          if (existingPrompt) {
            hidePromptArea();
          } else {
            showPromptArea();
          }
        }
      });
      icon.addEventListener("mouseenter", () => {
        if (!isDragging) {
          icon.style.transform = "scale(1.1)";
          icon.style.background = "#2a2a2a";
        }
      });
      icon.addEventListener("mouseleave", () => {
        if (!isDragging) {
          icon.style.transform = "scale(1)";
          icon.style.background = "#1a1a1a";
        }
      });
      document.body.appendChild(icon);
    }
    function hidePromptIcon() {
      const icon = document.getElementById(PROMPT_ICON_ID);
      if (icon) icon.remove();
    }
    function showPromptArea() {
      hidePromptArea();
      hidePromptIcon();
      const div = document.createElement("div");
      div.id = PROMPT_DIV_ID;
      div.style.cssText = `
        position: fixed;
        width: 600px;
        height: 200px;
        top: 50px;
        left: 50px;
        background: #1a1a1a;
        border: 2px solid #444;
        border-radius: 4px;
        z-index: 2147483647;
        box-shadow: 0 4px 6px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
    `;
      const header = document.createElement("div");
      header.style.cssText = `
        background: #2a2a2a;
        color: white;
        padding: 8px;
        border-bottom: 1px solid #444;
        cursor: move;
        font-weight: bold;
        user-select: none;
        position: relative;
    `;
      header.textContent = "Prompt Area";
      const positionDisplay = document.createElement("div");
      positionDisplay.style.cssText = `
        position: absolute;
        right: 30px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 11px;
        color: #888;
        font-family: monospace;
        pointer-events: none;
        white-space: nowrap;
    `;
      function updatePositionDisplay() {
        const left = parseInt(div.style.left) || div.offsetLeft;
        const top = parseInt(div.style.top) || div.offsetTop;
        const width = parseInt(div.style.width) || div.offsetWidth;
        const height = parseInt(div.style.height) || div.offsetHeight;
        positionDisplay.textContent = `Pos: ${left},${top} | Size: ${width}\xD7${height}`;
      }
      updatePositionDisplay();
      const closeButton = document.createElement("span");
      closeButton.innerHTML = "\xD7";
      closeButton.style.cssText = `
    float: right;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    color: #ccc;
    margin-right: 5px;
  `;
      closeButton.addEventListener("click", (e) => {
        e.stopPropagation();
        hidePromptArea();
      });
      header.appendChild(closeButton);
      header.appendChild(positionDisplay);
      const content = document.createElement("div");
      content.style.cssText = `
        flex: 1;
        padding: 10px;
        display: flex;
        flex-direction: column;
    `;
      const textarea = document.createElement("textarea");
      textarea.style.cssText = `
        width: 100%;
        height: calc(100% - 40px);
        resize: none;
        border: 1px solid #444;
        background: #0a0a0a;
        color: white;
        padding: 8px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        box-sizing: border-box;
        outline: none;
    `;
      textarea.placeholder = "Enter your prompt here...";
      textarea.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey && textarea.value.trim() !== "") {
          e.preventDefault();
          window.handleElectronRender(textarea);
        }
      });
      const buttonContainer = document.createElement("div");
      buttonContainer.style.cssText = `
        display: flex;
        gap: 10px;
        margin-top: 10px;
        justify-content: space-between;
        align-items: center;
    `;
      const visibilityContainer = document.createElement("div");
      visibilityContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        color: #ccc;
        font-size: 12px;
    `;
      const visibilityCheckbox = document.createElement("input");
      visibilityCheckbox.type = "checkbox";
      visibilityCheckbox.id = "prompt-visibility";
      visibilityCheckbox.checked = true;
      visibilityCheckbox.style.cssText = `
        cursor: pointer;
    `;
      const visibilityLabel = document.createElement("label");
      visibilityLabel.htmlFor = "prompt-visibility";
      visibilityLabel.textContent = "Visible";
      visibilityLabel.style.cssText = `
        cursor: pointer;
        user-select: none;
    `;
      let actionButtonContainer;
      visibilityCheckbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          textarea.style.display = "block";
          if (actionButtonContainer) actionButtonContainer.style.display = "flex";
          visibilityLabel.textContent = "Visible";
        } else {
          textarea.style.display = "none";
          if (actionButtonContainer) actionButtonContainer.style.display = "none";
          visibilityLabel.textContent = "Hidden";
        }
      });
      visibilityContainer.appendChild(visibilityCheckbox);
      visibilityContainer.appendChild(visibilityLabel);
      actionButtonContainer = document.createElement("div");
      actionButtonContainer.style.cssText = `
        display: flex;
        gap: 10px;
    `;
      const submitButton = document.createElement("button");
      submitButton.textContent = "Submit";
      submitButton.style.cssText = `
        padding: 6px 16px;
        background: #007acc;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    `;
      submitButton.addEventListener("click", () => {
        window.handleElectronRender(textarea);
      });
      const cancelButton = document.createElement("button");
      cancelButton.textContent = "Cancel";
      cancelButton.style.cssText = `
        padding: 6px 16px;
        background: #555;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    `;
      cancelButton.addEventListener("click", hidePromptArea);
      actionButtonContainer.appendChild(submitButton);
      actionButtonContainer.appendChild(cancelButton);
      buttonContainer.appendChild(visibilityContainer);
      buttonContainer.appendChild(actionButtonContainer);
      content.appendChild(textarea);
      content.appendChild(buttonContainer);
      const resizeHandles = ["nw", "ne", "sw", "se"];
      resizeHandles.forEach((pos) => {
        const handle = document.createElement("div");
        handle.className = `resize-handle ${pos}`;
        handle.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background: #666;
            ${pos.includes("n") ? "top: -5px;" : "bottom: -5px;"}
            ${pos.includes("w") ? "left: -5px;" : "right: -5px;"}
            cursor: ${pos}-resize;
        `;
        div.appendChild(handle);
      });
      div.appendChild(header);
      div.appendChild(content);
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
        } else if (e.target === header || header.contains(e.target)) {
          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;
          startLeft = div.offsetLeft;
          startTop = div.offsetTop;
          header.style.cursor = "grabbing";
          e.preventDefault();
        }
      });
      document.addEventListener("mousemove", (e) => {
        if (isDragging) {
          const newLeft = startLeft + (e.clientX - startX);
          const newTop = startTop + (e.clientY - startY);
          const maxLeft = window.innerWidth - div.offsetWidth;
          const maxTop = window.innerHeight - div.offsetHeight;
          div.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
          div.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
          updatePositionDisplay();
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
          const finalWidth = Math.max(300, newWidth);
          const finalHeight = Math.max(100, newHeight);
          div.style.width = `${finalWidth}px`;
          div.style.height = `${finalHeight}px`;
          div.style.left = `${newLeft}px`;
          div.style.top = `${newTop}px`;
          updatePositionDisplay();
        }
      });
      document.addEventListener("mouseup", () => {
        isDragging = false;
        isResizing = false;
      });
    }
    function hidePromptArea() {
      const div = document.getElementById(PROMPT_DIV_ID);
      if (div) {
        div.remove();
        showPromptIcon();
      }
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
      })).filter((item) => item.url && item.url.trim() !== "" && item.url.trim() !== "undefined");
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
        window._G.preload({ win_id: window.__win_id });
      }
      const autoRunJs = localStorage.getItem("__AutoRunJs");
      if (autoRunJs) {
        d("autoRunJs");
        eval(atob(autoRunJs));
      }
    };
    var preload = async ({ win_id }) => {
      console.log("_G preload");
      window.addEventListener(
        "keydown",
        async (e) => {
          const cmdKeyPressed = (k) => {
            return (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === k;
          };
          if (cmdKeyPressed("\\")) {
            e.preventDefault();
            console.log(e.key);
          }
        },
        true
      );
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
      showPromptArea,
      hidePromptArea,
      showPromptIcon,
      hidePromptIcon,
      showFloatDiv,
      hideFloatDiv
    };
    if (typeof window !== "undefined" && window.document) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          setTimeout(showPromptIcon, 100);
        });
      } else {
        setTimeout(showPromptIcon, 100);
      }
    }
  }
});

// src/utils.js
var require_utils = __commonJS({
  "src/utils.js"(exports2, module2) {
    "use strict";
    var ELECTRON_BASE_API_URL = "http://127.0.0.1:3456";
    var AI_BASE_API_URL = "https://api.cicy.de5.net";
    var TOKEN = "";
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
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
        method: "sendElectronPaste",
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
    function pyautoguiHotkey(keys) {
      return post_rpc({
        method: "pyautoguiHotkey",
        params: {
          keys
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
      await sendInputEvent(
        {
          type: "mouseDown",
          x,
          y,
          button: "left",
          clickCount: 1
        },
        win_id
      );
      setTimeout(() => {
        sendInputEvent(
          {
            type: "mouseUp",
            x,
            y,
            button: "left",
            clickCount: 1
          },
          win_id
        );
      }, 50);
    }
    async function sendKey(key, win_id) {
      await sendInputEvent({ type: "keyDown", keyCode: key }, win_id);
      setTimeout(() => {
        sendInputEvent({ type: "keyUp", keyCode: key }, win_id);
      }, 50);
    }
    var getElementRect = async (sel, win_id) => {
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
      pyautoguiHotkey,
      pyautoguiPaste,
      pyautoguiMove,
      pyautoguiPressEnter,
      pyautoguiPressBackspace,
      pyautoguiPressSpace,
      pyautoguiPressEsc,
      pyautoguiScreenshot,
      pyautoguiWrite,
      pyautoguiText,
      sleep
    };
  }
});

// src/extension/utils-extension.js
var require_utils_extension = __commonJS({
  "src/extension/utils-extension.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    var utilsBrowser = require_utils_browser();
    function onReady2() {
      utilsBrowser.showPromptIcon();
      console.log("_G extension onReady");
      setInterval(() => {
        console.debug("loop");
        if (location.href.startsWith("https://colab.research.google.com/")) {
          const res = document.querySelector(
            "body > div.notebook-vertical > div.notebook-horizontal > colab-left-pane > colab-resizer"
          );
          if (!res) {
            document.querySelector(
              "#cell-3kzh_tuJISRi > div.main-content > div > div.codecell-input-output > div.inputarea.horizontal.layout.code > div.cell-gutter > div > colab-run-button"
            ).shadowRoot.querySelector("#run-button").click();
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
      regVncEvent();
    }
    window.handleElectronRender = async (textarea) => {
      const value = textarea.value;
      const uri = new URL(location.href);
      let win_id = uri.searchParams.get("win_id");
      const active_rpc_url = localStorage.getItem("active_rpc_url");
      if (!active_rpc_url || !win_id) {
        return;
      }
      win_id = Number(win_id);
      const uri1 = new URL(active_rpc_url);
      const token = uri1.searchParams.get("token") || "";
      const apiUrl = active_rpc_url.split("/rpc")[0];
      utils.setBaseApi(apiUrl);
      utils.setToken(token);
      await utils.writeClipboard(value);
      await utils.sendElectronClick(Number(win_id), 314, 159);
      await utils.sendElectronCtlV(Number(win_id));
      await utils.sendElectronPressEnter(Number(win_id));
    };
    window.regVncEvent__ = false;
    function regVncEvent() {
      if (window.regVncEvent__) {
        return;
      }
      window.regVncEvent__ = true;
      document.addEventListener(
        "keydown",
        async (e) => {
          const url = location.href;
          const vnc_port = "-6080.";
          if (url.indexOf(vnc_port) === -1) return;
          const api = url.replace(vnc_port, "-3456.");
          const uri = new URL(api);
          utils.setBaseApi(`${uri.origin}`);
          utils.setToken(localStorage.getItem("__token"));
          try {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
              if (!localStorage.getItem("__passwd")) {
                alert("__passwd is null");
              } else {
                document.querySelector("#noVNC_password_input").value = localStorage.getItem("__passwd");
              }
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "v") {
              try {
                const clipboardData = await navigator.clipboard.readText();
                if (clipboardData) {
                  console.log("clipboardData", clipboardData);
                  await utils.post_rpc({
                    method: "writeClipboard",
                    params: {
                      text: clipboardData
                    }
                  });
                  console.log("clear clipboardData");
                  await navigator.clipboard.writeText("");
                }
              } catch (err) {
                console.log(err);
              }
              await utils.post_rpc({
                method: "pyautoguiHotkey",
                params: {
                  hot: "ctrl",
                  key: "v"
                }
              });
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
              await utils.post_rpc({
                method: "pyautoguiHotkey",
                params: {
                  hot: "ctrl",
                  key: "c"
                }
              });
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
              await utils.post_rpc({
                method: "pyautoguiHotkey",
                params: {
                  hot: "ctrl",
                  key: "a"
                }
              });
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "x") {
              await utils.post_rpc({
                method: "pyautoguiHotkey",
                params: {
                  hot: "ctrl",
                  key: "x"
                }
              });
            }
          } catch (e2) {
            console.error(e2);
          }
        },
        true
      );
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
