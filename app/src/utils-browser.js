class Storage {
    static get(key) {
        const res = localStorage.getItem("cicy_" + key)
        if (res) {
            return JSON.parse(res)[0]
        } else {
            null
        }
    }

    static set(key, value) {
        localStorage.setItem("cicy_" + key, JSON.stringify([value]))
    }
}

const RECT_ID = "__rect"

function showRect({width, height, left, top}, timeout) {
    const existing = document.getElementById(RECT_ID);
    if (existing) existing.remove();
    if (!timeout) {
        timeout = 2
    }

    const div = document.createElement('div');
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
        div.style.opacity = '0';
        setTimeout(() => div.remove(), 300);
    }, timeout * 1000);
}

function __getChats(chat) {
    const {id, messages, title, updateTime} = chat
    const rows = []
    for (let i = 0; i < messages.length; i++) {
        const {text} = messages[i]
        rows.push(text)
    }
    rows.reverse()
    let reply = null
    if (rows.length > 0) {
        reply = rows[0]
    }
    return {
        id, title, reply, updateTime, messages: rows
    }
}

async function getChatGptChats() {
    const db = window._G.useIndexedDB('ConversationsDatabase', 'conversations');
    const allItems = await db.getAllItems();
    console.log("allItems", allItems)
    if (allItems.length === 0) {
        return null
    }
    allItems.reverse()
    return __getChats(allItems[0])
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
            [...node.childNodes].every(
                n => n.nodeType === Node.TEXT_NODE && !n.textContent.trim()
            )
        ) {
            node.remove();
        }

    } else if (node.nodeType === Node.TEXT_NODE) {
        // 压缩文本：去除换行和多余空格
        const cleanedText = node.textContent.replace(/\s+/g, ' ').trim();
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
        'script', 'style', 'link', 'img', 'video',
        'audio', 'iframe', 'svg', 'noscript', 'canvas'
    ];
    uselessTags.forEach(tag => {
        const elements = doc.querySelectorAll(tag);
        elements.forEach(el => el.remove());
    });
    cleanNode(doc);
    return doc.outerHTML;
}

function regxHTML(html) {
    return html
        // 删除注释
        .replace(/<!--[\s\S]*?-->/g, "")
        //</div></div> ... => </div>
        //<div><div> ... => <div>
        // .replace(/div/g, '')
        .replace(/span/g, '')
        .replace(/<>/g, '')
        .replace(/<\/>/g, '')
        .trim();
}


function regxHTML1(html) {
    let t = html
        .replace(/span/g, 'div')
        .trim();

    while (t.indexOf("<div><div>") > -1) {
        t = t
            .replace(/<div><div>/g, '<div>')
    }
    while (t.indexOf("</div></div>") > -1) {
        t = t
            .replace(/<\/div><\/div>/g, '</div>')
    }
    return t
}


const FLOAT_DIV_ID = '__floatDiv'

function showFloatDiv(options) {
    const {width,height,top,left} = options||{}
    if(!width) width = 200
    if(!height) height = 80
    if(!top) top = 50
    if(!left) left = 50
    const existing = document.getElementById(FLOAT_DIV_ID)
    if (existing) existing.remove()

    const div = document.createElement('div')
    div.id = FLOAT_DIV_ID
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
  `

    // Add resize handles
    const handles = ['nw', 'ne', 'sw', 'se']
    handles.forEach(pos => {
        const handle = document.createElement('div')
        handle.className = `resize-handle ${pos}`
        handle.style.cssText = `
      position: absolute;
      width: 10px;
      height: 10px;
      background: #333;
      ${pos.includes('n') ? 'top: -5px;' : 'bottom: -5px;'}
      ${pos.includes('w') ? 'left: -5px;' : 'right: -5px;'}
      cursor: ${pos}-resize;
    `
        div.appendChild(handle)
    })

    document.body.appendChild(div)

    let isDragging = false
    let isResizing = false
    let startX, startY, startLeft, startTop, startWidth, startHeight, resizeHandle

    div.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('resize-handle')) {
            isResizing = true
            resizeHandle = e.target.className.split(' ')[1]
            startX = e.clientX
            startY = e.clientY
            startWidth = div.offsetWidth
            startHeight = div.offsetHeight
            startLeft = div.offsetLeft
            startTop = div.offsetTop
            e.preventDefault()
        } else {
            isDragging = true
            startX = e.clientX
            startY = e.clientY
            startLeft = div.offsetLeft
            startTop = div.offsetTop
            e.preventDefault()
        }
    })

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const newLeft = startLeft + (e.clientX - startX)
            const newTop = startTop + (e.clientY - startY)
            div.style.left = `${newLeft}px`
            div.style.top = `${newTop}px`
            div.innerHTML = `Pos: ${newLeft},${newTop}<br>Size: ${div.offsetWidth}x${div.offsetHeight}`
        } else if (isResizing) {
            let newWidth = startWidth
            let newHeight = startHeight
            let newLeft = startLeft
            let newTop = startTop

            if (resizeHandle.includes('e')) {
                newWidth = startWidth + (e.clientX - startX)
            }
            if (resizeHandle.includes('s')) {
                newHeight = startHeight + (e.clientY - startY)
            }
            if (resizeHandle.includes('w')) {
                newWidth = startWidth - (e.clientX - startX)
                newLeft = startLeft + (e.clientX - startX)
            }
            if (resizeHandle.includes('n')) {
                newHeight = startHeight - (e.clientY - startY)
                newTop = startTop + (e.clientY - startY)
            }

            const finalWidth = Math.max(50, newWidth)
            const finalHeight = Math.max(50, newHeight)
            div.style.width = `${finalWidth}px`
            div.style.height = `${finalHeight}px`
            div.style.left = `${newLeft}px`
            div.style.top = `${newTop}px`
            div.innerHTML = `Pos: ${newLeft},${newTop}<br>Size: ${finalWidth}x${finalHeight}`
        }
    })

    document.addEventListener('mouseup', () => {
        isDragging = false
        isResizing = false
    })
}

function hideFloatDiv() {
    const div = document.getElementById(FLOAT_DIV_ID)
    if (div) div.remove()
}

function toggleDiv() {
    const existing = document.getElementById(FLOAT_DIV_ID)
    if (existing) {
        existing.remove()
    } else {
        showFloatDiv({})
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
                        db.createObjectStore(storeName, {keyPath: 'id', autoIncrement: true});
                    }
                };

                request.onsuccess = (event) => resolve(event.target.result);
                request.onerror = (event) => reject(event.target.error);
            });
        },

        addItem: async function (item) {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const request = store.add(item);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        },

        getItem: async function (id) {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const request = store.get(id);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        },

        getAllItems: async function () {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
    };
}

const getHtml = () => {
    return document.documentElement.outerHTML
}
const getBodyText = () => {
    let {textContent} = document.body

    return textContent
        // 删除注释
        .replace(/\s/g, "")
        .trim();
}
const getLinks = () => {
    const links = Array.from(document.querySelectorAll('a[href]'))
        .map(a => ({
            url: a.getAttribute('href'),
            a: a.innerText.trim()
        }))
        .filter(item =>
            item.url &&
            item.url.trim() !== '' &&
            item.url.trim() !== 'undefined'
        );
    return links
}
const setAutoRunJs = (code) => {
    localStorage.setItem("__AutoRunJs", code)
}
const getTitle = () => {
    return document.title
}


const init = () => {
    if (window._G.preload) {
        window._G.preload({win_id: window._G.win_id})
    }
    const autoRunJs = localStorage.getItem("__AutoRunJs")
    if (autoRunJs) {
        d("autoRunJs")
        eval(atob(autoRunJs))
    }
}

const preload = async ({win_id}) => {
    window.addEventListener('keydown', async (e) => {
        const cmdKeyPressed = (k) => {
            return (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === k
        }
        if (cmdKeyPressed("\\")) {
            e.preventDefault();
            console.log(e.key)
        }
    }, true)
    d("preload win_id:",win_id)

}

const _l = (...args) => {
    console.debug('[CICY]', ...args);
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
    showFloatDiv,
    hideFloatDiv
}