const {toggleDiv} = require("../utils-browser")
const {onReady} = require("./utils-extension")
// --- Constants ---
const toastId = 'injector-toast-display';

const handleSelect = async (options) => {
    let {text, mode} = options || {};
    if (!text) {
        const selection = window.getSelection();
        text = selection.toString(); // The actual text that is selected
    }
    if (!text) {
        return
    }

    const apiUrl = "https://api.cicy.de5.net/t";


    let input
    if (mode === 1) {

        input = `Please correct the following English expression.": 
--------
${text}
--------

Respond ONLY in valid JSON with the single key "text" and nothing else.`
        showToast("纠正中...")
    } else {
        showToast("翻译中...")
        input = `Translate the sentence below: 
--------
${text}
--------
     into Chinese.
Respond ONLY in valid JSON with the single key "text" and nothing else.`

    }
    const requestBody = {
        input
    }

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
        const messageItem = result.output.find(item => item.type === "message");
        if (!messageItem) return {error: "No message in response"};
        const outputText = messageItem.content[0].text;
        const res = JSON.parse(outputText)
        console.log("Output text:", res.text);

        if (mode === 1) {
            navigator.clipboard.writeText(res.text)
                .then(() => {
                    console.log("Copied to clipboard!");

                })
                .catch((err) => {
                    console.error("Failed to copy: ", err);
                });
            showToast(res.text, {timeout: 10})
        } else {
            showToast(res.text, {timeout: 4})
        }

    } catch (err) {
        showToast(err, true)
        console.error("Error calling worker:", err);
    }

};

// --- UI Feedback (Toast) ---

const showToast = (msg, options) => {
    const {isError, timeout} = options || {}
    const existing = document.getElementById(toastId);
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = toastId;
    div.textContent = msg;
    div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    background: ${isError ? '#ff4444' : '#222'};
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
        div.style.opacity = '0';
        setTimeout(() => div.remove(), 300);
    }, timeout * 1000 || 2000);
};

// --- Event Listeners ---

// 1. Auto Inject on Page Load
window.addEventListener('load', () => {
    console.log("load")
    onReady()
});

// 2. Hot Reload Shortcut (Cmd+I / Ctrl+I)
document.addEventListener('keydown', async (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handleSelect();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        handleSelect({
            mode: 1
        });
    }
    // Cmd/Ctrl + Shift + P
    if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        if (e.key.toLowerCase() === 'p') {
            chrome.runtime.sendMessage({
                type: "copy-domain-cookies"
            });
        }
        if (e.key.toLowerCase() === 'l') {
            chrome.runtime.sendMessage({
                type: "open-in-electron"
            });
        }

        e.preventDefault();
    }
});

// 3. Listen for Context Menu Trigger
if (chrome && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "copyTgAuth") {
            let res = ""
            for (let i = 0; i < Object.keys(localStorage).length; i++) {
                const k = Object.keys(localStorage)[i]
                const v = localStorage.getItem(k)
                res += `localStorage.setItem("${k}",\`${v}\`);\n`
            }
            console.log(res)

            navigator.clipboard.writeText(res)
                .then(() => {
                    showToast(`localStorage copied`, {timeout: 4});
                })
                .catch(() => {
                    showToast("localStorage write failed", {isError: true, timeout: 4});
                });
        }

        if (message.type === "toggleDiv") {
            toggleDiv()
        }
        if (message.type === "copy-domain-cookies") {
            console.log("copy-domain-cookies", message.domain, message.payload)
            navigator.clipboard.writeText(JSON.stringify(message.payload))
                .then(() => {
                    showToast(`Cookies copied for: ${message.domain}`, {timeout: 4});
                })
                .catch(() => {
                    showToast("Clipboard write failed", {isError: true, timeout: 4});
                });
        }
    });
}
