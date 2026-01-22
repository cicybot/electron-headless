(()=>{

  const LOG_PREFIX = '%c[Injector]';
  const LOG_STYLE = 'color: blue; font-weight: bold;';

// --- Injection Logic ---

  const injectScript = (isAutoLoad = false) => {
    console.log(`${LOG_PREFIX} injectScript...`, LOG_STYLE);
    showToast("injectScript")
  };

// --- UI Feedback (Toast) ---

  const showToast = (msg, isError = false) => {
    const toastId = 'injector-toast-display';
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
    }, 2000);
  };

// --- Event Listeners ---

// 2. Hot Reload Shortcut (Cmd+I / Ctrl+I)
  window.addEventListener('keydown', (e) => {
    console.log(e)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      injectScript(false);
    }
  });

// 3. Listen for Context Menu Trigger
  if(chrome && chrome.runtime){

// 1. Auto Inject on Page Load
    window.addEventListener('load', () => {
      injectScript(true);
    });

    // --- Constants ---
    const MessageType = {
      TRIGGER_INJECTION: 'TRIGGER_INJECTION'
    };

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === MessageType.TRIGGER_INJECTION) {
        injectScript(false);
      }
    });
  }
  injectScript();
})()