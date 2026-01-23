/**
 * Window Manager
 * Handles browser window creation, management, and account isolation
 */

const { BrowserWindow, webContents, app } = require("electron");
const { MapArray } = require("../utils");
const { setCookies, getGlobalJsCode } = require("../helpers");
const appManager = require("./app-manager");
const storageManager = require("./storage-manager");

class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.windowSites = new Map(); // account_index -> Map<url, {id, wcId, win}>
    this.windowState = new Map(); // win_id -> state
    this.requestIndex = 0;
    this.windowStates = {}; // For persistent storage
    this.isShuttingDown = false;
    this.winIdRemapping = new Map(); // old_id -> new_id (for restoration)

    // Set up auto-save interval
    this.autoSaveInterval = setInterval(() => {
      this.saveWindowStates();
    }, 5000); // Save every 5 seconds

    app.on("browser-window-created", (event, win) => {
      console.log("[WindowManager] browser-window-created:", win.id);

      win.webContents.on("did-finish-load", async () => {
        const globalCode = getGlobalJsCode();
        // Inject initialization script
        let initScript = `
      ${globalCode}
      window.__win_id = ${win.id};
      window.__wc_id = ${win.webContents.id};
      
      console.log("dom-ready")
      if(window._G){
        console.log("_G init")
        window._G.init()
        window._G.utilsExtension.onReady()
        window._G._l("dom-ready")
      }`;
        try {
          console.log("exec initScript ");
          win.webContents.executeJavaScript(globalCode + `;(()=>{${initScript}})();`);
        } catch (e) {
          console.error(e);
        }
      });
    });

    // Handle app shutdown
    app.on("before-quit", () => {
      this.isShuttingDown = true;
      this.saveWindowStates();
    });
  }

  /**
   * Create a new browser window with account isolation
   */
  async createWindow(accountIndex = 0, url = "about:blank", options = {}, others = {}) {
    const { userAgent, cookies, openDevtools, proxy, wrapUrl, showWin = true } = others || {};

    // Check if window already exists for this account+URL
    const existingWindow = this._findExistingWindow(accountIndex, url);
    if (existingWindow) {
      if (showWin) existingWindow.win.show();
      return existingWindow.win;
    }

    // Apply default options
    const defaultOptions = {
      width: 720,
      height: 720,
      x: 0,
      y: 0,
      webPreferences: {},
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Handle user agent override
    if (userAgent && finalOptions.userAgent) {
      delete finalOptions.userAgent;
    }

    // Ensure webPreferences exists
    if (!finalOptions.webPreferences) {
      finalOptions.webPreferences = {};
    }

    // Set up partition for account isolation
    const partition = `persist:p_${accountIndex}`;
    finalOptions.webPreferences.partition = partition;

    let finalUrl = url;

    // Create the window
    const win = new BrowserWindow(finalOptions);
    const wc = win.webContents;
    const winId = win.id;
    const wcId = wc.id;

    // Set up session and proxy if specified
    // await wc.session.setProxy({ proxyRules: "http://localhost:8082" });

    if (proxy) {
      await wc.session.setProxy({ proxyRules: proxy });
      console.log(`[${partition}] Proxy set to: ${proxy}`);
    }

    // Set cookies if provided, otherwise use default cookies
    const cookiesToSet = cookies || global.defaultCookies;
    if (cookiesToSet) {
      await setCookies(wc, cookiesToSet);
    }

    // Open dev tools if requested
    if (openDevtools && openDevtools.mode) {
      wc.openDevTools(openDevtools);
    }

    // Set user agent if specified
    if (userAgent) {
      wc.setUserAgent(userAgent);
    }

    // Track as main window if first window
    if (!this.mainWindow) {
      this.mainWindow = win;
    }

    // Initialize window state
    this.windowState.set(winId, {});

    // Store window reference
    this._registerWindow(accountIndex, finalUrl, win, winId, wcId);

    // Save initial window state
    this._saveWindowState(winId, win, accountIndex);

    // Set up event handlers
    this._setupWindowEvents(win, winId, accountIndex, finalUrl);

    // Load the URL
    win.loadURL(finalUrl);

    return win;
  }

  /**
   * Find existing window for account+URL combination
   */
  _findExistingWindow(accountIndex, url) {
    const accountWindows = this.windowSites.get(accountIndex);
    if (!accountWindows) return null;

    return accountWindows.get(url);
  }

  /**
   * Register window in internal tracking
   */
  _registerWindow(accountIndex, url, win, winId, wcId) {
    const accountWindows = this.windowSites.get(accountIndex) || new Map();
    accountWindows.set(url, { id: winId, wcId, win, initialUrl: url });
    this.windowSites.set(accountIndex, accountWindows);

    // Store initial URL on the window object for easy access
    win._initialUrl = url;
  }

  /**
   * Set up window event handlers
   */
  _setupWindowEvents(win, winId, accountIndex, url) {
    // Handle window close
    win.on("close", (event) => {
      // Save state before closing
      this._saveWindowState(winId, win, accountIndex);

      // Update window state cache and delete window id
      this.windowState.delete(winId);
      delete this.windowStates[winId];
      // Clear network requests cache for this window
      new MapArray(winId).clear();

      // If shutting down unexpectedly, prevent close and save state
      if (!this.isShuttingDown) {
        this._unregisterWindow(accountIndex, url);
      }
    });

    // Handle window state changes
    win.on("resize", () => {
      this._saveWindowState(winId, win, accountIndex);
      if (win.webContents.getURL().indexOf("initWindow") > -1) {
        win.webContents.executeJavaScript(
          `window.__setBounds && window.__setBounds(${JSON.stringify(win.getBounds())});`
        );
      }
    });

    win.on("move", () => {
      this._saveWindowState(winId, win, accountIndex);
      if (win.webContents.getURL().indexOf("initWindow") > -1) {
        win.webContents.executeJavaScript(
          `window.__setBounds && window.__setBounds(${JSON.stringify(win.getBounds())});`
        );
      }
    });

    // Handle navigation events for request tracking
    win.webContents.on("did-start-navigation", async ({ url: navUrl, isMainFrame }) => {
      if (isMainFrame) {
        this.windowState.set(winId, { ready: false });
        // Clear network requests for this window
        new MapArray(winId).clear();
      }
    });

    // Handle page load completion
    win.webContents.on("did-finish-load", async () => {
      console.log(
        `[win_${winId}] DOM ready`,
        {
          account_index: accountIndex,
          id: winId,
          wcId: win.webContents.id,
        },
        win.webContents.getURL()
      );

      this.windowState.set(winId, { ready: true });

      // Update window title with win_id prefix
      this._updateWindowTitle(accountIndex, winId, win);
    });

    // Handle document title changes
    win.webContents.on("page-title-updated", (event, title) => {
      this._updateWindowTitle(accountIndex, winId, win, title);
    });

    // Set up network request monitoring
    this._setupNetworkMonitoring(win, winId);
  }

  /**
   * Set up network request monitoring for a window
   */
  _setupNetworkMonitoring(win, winId) {
    win.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
      const { url, method, requestHeaders } = details;

      // Skip self-referencing RPC calls
      const port = process.env.PORT || "3456";
      if (url.includes("127.0.0.1") && url.includes(port)) {
        callback({ cancel: false });
        return;
      }

      if (win.isDestroyed()) {
        return;
      }

      // Store request in tracking array
      new MapArray(winId).push({
        index: this.requestIndex++,
        url,
        requestHeaders,
        win_id: winId,
        method,
        timestamp: Date.now(),
      });

      callback({ cancel: false });
    });
  }

  /**
   * Unregister window from tracking
   */
  _unregisterWindow(accountIndex, url) {
    const accountWindows = this.windowSites.get(accountIndex);
    if (accountWindows) {
      accountWindows.delete(url);
      this.windowSites.set(accountIndex, accountWindows);
    }
  }

  /**
   * Get window by ID
   */
  getWindow(winId) {
    return BrowserWindow.fromId(Number(winId));
  }

  /**
   * Get webContents by ID
   */
  getWebContents(wcId) {
    return webContents.fromId(wcId);
  }

  /**
   * Get window state
   */
  getWindowState(winId) {
    return this.windowState.get(winId) || {};
  }

  /**
   * Set window state
   */
  setWindowState(winId, state) {
    this.windowState.set(winId, state);
  }

  /**
   * Get all windows organized by account
   */
  getAllWindows() {
    const { windowSitesToJSON } = require("../helpers");
    return windowSitesToJSON(this.windowSites);
  }

  /**
   * Close window by ID
   */
  closeWindow(winId) {
    const win = this.getWindow(winId);
    if (win && !win.isDestroyed()) {
      win.close();
      return true;
    }
    return false;
  }

  /**
   * Update window title with win_id prefix
   */
  _updateWindowTitle(accountIndex, winId, win, documentTitle = null) {
    try {
      if (win && !win.isDestroyed()) {
        const title = documentTitle || win.webContents.getTitle();
        win.setTitle(`# ${accountIndex} - ${winId} | ${title}`);
      }
    } catch (error) {
      console.error(`Failed to update window title for ${winId}:`, error);
    }
  }

  /**
   * Save individual window state
   */
  _saveWindowState(winId, win, accountIndex) {
    try {
      if (win && !win.isDestroyed()) {
        const bounds = win.getBounds();
        // Use the stored initial URL, not the current URL
        const initialUrl = win._initialUrl || "about:blank";
        this.windowStates[winId] = {
          accountIndex,
          url: initialUrl, // Always use the initial URL
          bounds,
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.error(`Failed to save window state for ${winId}:`, error);
    }
  }

  /**
   * Save all window states to persistent storage
   */
  async saveWindowStates() {
    if (Object.keys(this.windowStates).length > 0) {
      await storageManager.saveWindowStates(this.windowStates);
    }
  }

  /**
   * Restore windows from saved state
   */
  async restoreWindows() {
    try {
      const savedStates = await storageManager.loadWindowStates();
      console.log("Restoring windows from saved state:", Object.keys(savedStates));

      // Sort by window ID (as number) to restore in order
      const sortedWinIds = Object.keys(savedStates).sort((a, b) => parseInt(a) - parseInt(b));

      for (const winId of sortedWinIds) {
        const state = savedStates[winId];
        if (state && state.accountIndex !== undefined && state.url) {
          console.log(`Restoring window ${winId}: ${state.url}`);
          const win = await this.createWindow(state.accountIndex, state.url, state.bounds || {}, {
            userAgent: null,
            cookies: null,
            openDevtools: null,
            proxy: null,
            wrapUrl: true,
            showWin: true,
          });

          if (win) {
            const newWinId = win.id;
            this.winIdRemapping.set(parseInt(winId), newWinId);
            console.log(`Mapped old ID ${winId} -> new ID ${newWinId}`);
          }
        }
      }
    } catch (error) {
      console.error("Failed to restore windows:", error);
    }
  }

  /**
   * Initialize window manager and restore previous session
   */
  async init() {
    await this.restoreWindows();
  }
}

module.exports = new WindowManager();
