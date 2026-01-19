/**
 * Window Manager
 * Handles browser window creation, management, and account isolation
 */

const { BrowserWindow, webContents, app } = require('electron');
const { MapArray } = require("../utils");
const { setCookies,getGlobalJsCode } = require("../helpers");
const appManager = require('./app-manager');
const storageManager = require('./storage-manager');

class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.windowSites = new Map(); // account_index -> Map<url, {id, wcId, win}>
    this.windowState = new Map(); // win_id -> state
    this.requestIndex = 0;
    this.windowStates = {}; // For persistent storage
    this.isShuttingDown = false;
    
    // Set up auto-save interval
    this.autoSaveInterval = setInterval(() => {
      this.saveWindowStates();
    }, 5000); // Save every 5 seconds

    // Handle app shutdown
    app.on('before-quit', () => {
      this.isShuttingDown = true;
      this.saveWindowStates();
    });
  }

  /**
   * Create a new browser window with account isolation
   */
  async createWindow(accountIndex = 0, url = 'about:blank', options = {}, others = {}) {
    const {
      userAgent,
      cookies,
      openDevtools,
      proxy,
      wrapUrl,
      showWin = true
    } = others || {};

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
      webPreferences: {}
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

    // Handle URL wrapping for local development
    let finalUrl = url;
    if (wrapUrl) {
      const appManager = require('./app-manager');
      const baseUrl = appManager.isLocalMode()
        ? "http://127.0.0.1:3455"
        : "https://render.cicy.de5.net";
      finalUrl = `${baseUrl}/render?u=${encodeURIComponent(url)}`;
    }

    console.log(appManager.isLocalMode(), finalUrl);

    // Create the window
    const win = new BrowserWindow(finalOptions);
    const wc = win.webContents;
    const winId = win.id;
    const wcId = wc.id;

    // Set up session and proxy if specified
    if (proxy) {
      await wc.session.setProxy({ proxyRules: proxy });
      console.log(`[${partition}] Proxy set to: ${proxy}`);
    }

    // Set cookies if provided
    if (cookies) {
      await setCookies(wc, cookies);
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
    accountWindows.set(url, { id: winId, wcId, win });
    this.windowSites.set(accountIndex, accountWindows);
  }

  /**
   * Set up window event handlers
   */
  _setupWindowEvents(win, winId, accountIndex, url) {
    // Handle window close
    win.on("close", (event) => {
      // Save state before closing
      this._saveWindowState(winId, win, accountIndex, url);
      
      // If shutting down unexpectedly, prevent close and save state
      if (!this.isShuttingDown) {
        this._unregisterWindow(accountIndex, url);
      }
    });

    // Handle window state changes
    win.on('resize', () => {
      this._saveWindowState(winId, win, accountIndex, url);
    });

    win.on('move', () => {
      this._saveWindowState(winId, win, accountIndex, url);
    });

    // Handle navigation events for request tracking
    win.webContents.on('did-start-navigation', async ({ url: navUrl, isMainFrame }) => {
      if (isMainFrame) {
        this.windowState.set(winId, { ready: false });
        // Clear network requests for this window
        new MapArray(winId).clear();
      }
    });

    // Handle page load completion
    win.webContents.on('did-finish-load', async () => {
      console.log(`[win_${winId}] DOM ready`, {
        account_index: accountIndex,
        id: winId,
        wcId: win.webContents.id
      }, win.webContents.getURL());

      this.windowState.set(winId, { ready: true });
      const globalCode = getGlobalJsCode()
      // Inject initialization script
      const { executeJavaScript } = require("../helpers");
      executeJavaScript(win.webContents, `
      ${globalCode}
      window.__win_id = ${winId};
      window._G.init()
      window._G.win_id = ${winId};
      window._G._l("dom-ready")
      `);
    });

    // Set up network request monitoring
    this._setupNetworkMonitoring(win, winId);
  }

  /**
   * Set up network request monitoring for a window
   */
  _setupNetworkMonitoring(win, winId) {
    win.webContents.session.webRequest.onBeforeSendHeaders(
      (details, callback) => {
        const { url, method, requestHeaders } = details;

        // Skip self-referencing RPC calls
        const port = process.env.PORT || '3456';
        if (url.includes('127.0.0.1') && url.includes(port)) {
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
          timestamp: Date.now()
        });

        callback({ cancel: false });
      }
    );
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
    return BrowserWindow.fromId(winId);
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
   * Save individual window state
   */
  _saveWindowState(winId, win, accountIndex, url) {
    try {
      if (win && !win.isDestroyed()) {
        const bounds = win.getBounds();
        this.windowStates[winId] = {
          accountIndex,
          url,
          bounds,
          timestamp: Date.now()
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
      console.log('Restoring windows from saved state:', Object.keys(savedStates));
      
      for (const [winId, state] of Object.entries(savedStates)) {
        if (state && state.accountIndex !== undefined && state.url) {
          console.log(`Restoring window ${winId}: ${state.url}`);
          await this.createWindow(
            state.accountIndex,
            state.url,
            state.bounds || {},
            {
              userAgent: null,
              cookies: null,
              openDevtools: null,
              proxy: null,
              wrapUrl: true,
              showWin: true
            }
          );
        }
      }
    } catch (error) {
      console.error('Failed to restore windows:', error);
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