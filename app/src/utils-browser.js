class Storage {
  static get(key) {
    const res = localStorage.getItem("cicy_" + key);
    if (res) {
      return JSON.parse(res)[0];
    } else {
      return null;
    }
  }

  static set(key, value) {
    localStorage.setItem("cicy_" + key, JSON.stringify([value]));
  }
}

const RECT_ID = "__rect";

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
  }, timeout * 1000);
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
    messages: rows,
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

// 递归遍历所有节点，移除属性并清理空格，同时删除空元素
function cleanNode(node) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    // 移除所有属性
    while (node.attributes.length > 0) {
      node.removeAttribute(node.attributes[0].name);
    }

    // 递归处理子节点（从后往前遍历，方便删除）
    for (let i = node.childNodes.length - 1; i >= 0; i--) {
      cleanNode(node.childNodes[i]);
    }

    // 如果元素没有子节点，或者所有子节点都是空文本，则删除自己
    if (
      node.childNodes.length === 0 ||
      [...node.childNodes].every((n) => n.nodeType === Node.TEXT_NODE && !n.textContent.trim())
    ) {
      node.remove();
    }
  } else if (node.nodeType === Node.TEXT_NODE) {
    // 压缩文本：去除换行和多余空格
    const cleanedText = node.textContent.replace(/\s+/g, " ").trim();
    if (!cleanedText) {
      node.remove(); // 如果是纯空格节点则删除
    } else {
      node.textContent = cleanedText;
    }
  }
}

/**
 * 压缩 HTML 并优化嵌套空标签，同时保留内容
 * @returns {string} 压缩并优化后的 HTML
 */
function getCleanHtml(ele) {
  // 克隆文档，避免破坏页面
  let doc = ele.cloneNode(true);

  // 删除无用标签
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
    "canvas",
  ];
  uselessTags.forEach((tag) => {
    const elements = doc.querySelectorAll(tag);
    elements.forEach((el) => el.remove());
  });
  cleanNode(doc);
  return doc.outerHTML;
}

function regxHTML(html) {
  return (
    html
      // 删除注释
      .replace(/<!--[\s\S]*?-->/g, "")
      //</div></div> ... => </div>
      //<div><div> ... => <div>
      // .replace(/div/g, '')
      .replace(/span/g, "")
      .replace(/<>/g, "")
      .replace(/<\/>/g, "")
      .trim()
  );
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

//showPrompt

const PROMPT_DIV_ID = "__promptDiv";
const PROMPT_ICON_ID = "__promptIcon";

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
  icon.innerHTML = "💬";
  icon.title = "Open Prompt Area (Drag to move)";

  let isDragging = false;
  let hasMoved = false;
  let startX, startY, startLeft, startTop;

  icon.addEventListener("mousedown", (e) => {
    if (e.button === 0) {
      // Left click only
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

      // Check if the mouse has moved more than a few pixels
      if (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3) {
        hasMoved = true;
      }

      // Keep icon within viewport bounds
      const maxLeft = window.innerWidth - icon.offsetWidth;
      const maxTop = window.innerHeight - icon.offsetHeight;

      icon.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
      icon.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
      icon.style.right = "auto"; // Remove right positioning
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
    // Only trigger click if not dragging (no movement occurred)
    if (!hasMoved) {
      const existingPrompt = document.getElementById(PROMPT_DIV_ID);
      if (existingPrompt) {
        // Prompt area is open, close it
        hidePromptArea();
      } else {
        // Prompt area is closed, open it
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
/**
 * Enhanced showPromptArea function with position/size display and visibility toggle
 */

  hidePromptArea();
  hidePromptIcon(); // Hide the small button when prompt area is shown

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

  // Add position/size display to header
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
  
  // Function to update position/size display
  function updatePositionDisplay() {
    const left = parseInt(div.style.left) || div.offsetLeft;
    const top = parseInt(div.style.top) || div.offsetTop;
    const width = parseInt(div.style.width) || div.offsetWidth;
    const height = parseInt(div.style.height) || div.offsetHeight;
    positionDisplay.textContent = `Pos: ${left},${top} | Size: ${width}×${height}`;
  }

  // Initialize position display
  updatePositionDisplay();

  // Add close button to header
  const closeButton = document.createElement("span");
  closeButton.innerHTML = "×";
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

  // Load cached value on startup
  const storageKey = `prompt_area_${window.location.href}`;
  const cachedValue = localStorage.getItem(storageKey);
  if (cachedValue) {
    textarea.value = cachedValue;
  }

  // Save to localStorage on change
  textarea.addEventListener("input", (e) => {
    localStorage.setItem(storageKey, e.target.value);
  });

  textarea.addEventListener("keydown", (e) => {
    // 判断：Ctrl+Enter（Windows/Linux） 或 Cmd+Enter（Mac），且输入内容非空
    const isModifierKey = e.ctrlKey || e.metaKey; // ctrl键 或 cmd键
    if (e.key === "Enter" && isModifierKey && !e.shiftKey && textarea.value.trim() !== "") {
      e.preventDefault(); // 阻止默认换行行为
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

  // Define the action button container
  let actionButtonContainer;

  // Right side: action buttons
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
    window.handleElectronRender(textarea)
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

      // Keep div within viewport bounds
      const maxLeft = window.innerWidth - div.offsetWidth;
      const maxTop = window.innerHeight - div.offsetHeight;

      div.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
      div.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
      
      // Update position display during drag
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
      
      // Update position/size display during resize
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
    showPromptIcon(); // Show the small button again when prompt area is closed
  }
}

const FLOAT_DIV_ID = "__floatDiv";

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

  // Add resize handles
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

  // Add close button
  const closeButton = document.createElement("div");
  closeButton.innerHTML = "×";
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

  // Add text display element
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

  // Initialize text display content
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
    openDB: function () {
      return new Promise((resolve, reject) => {
        // ⬇️ FIXED: removed explicit version
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

    addItem: async function (item) {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const request = store.add(item);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },

    getItem: async function (id) {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },

    getAllItems: async function () {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },
  };
}

const getHtml = () => {
  return document.documentElement.outerHTML;
};
const getBodyText = () => {
  let { textContent } = document.body;

  return (
    textContent
      // 删除注释
      .replace(/\s/g, "")
      .trim()
  );
};
const getLinks = () => {
  const links = Array.from(document.querySelectorAll("a[href]"))
    .map((a) => ({
      url: a.getAttribute("href"),
      a: a.innerText.trim(),
    }))
    .filter((item) => item.url && item.url.trim() !== "" && item.url.trim() !== "undefined");
  return links;
};
const setAutoRunJs = (code) => {
  localStorage.setItem("__AutoRunJs", code);
};
const getTitle = () => {
  return document.title;
};

const init = () => {
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

const preload = async ({ win_id }) => {
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

const _l = (...args) => {
  console.debug("[CICY]", ...args);
};
const d = _l;
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
  hideFloatDiv,
};

// Auto-show icon on page load
if (typeof window !== "undefined" && window.document) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(showPromptIcon, 100); // Small delay to ensure page is ready
    });
  } else {
    setTimeout(showPromptIcon, 100);
  }
}
