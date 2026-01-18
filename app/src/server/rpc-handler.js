/**
 * RPC Handler
 * Handles all RPC method calls and routes them to appropriate services
 */

const { executeJavaScript, downloadMedia, getAppInfo, setCookies } = require("../helpers");
const { whisperTranscribe } = require("../utils-node");
const { MapArray } = require("../utils");
const screenshotService = require('../services/screenshot-service');
const { spawn } = require('child_process');
const path = require('path');

class RPCHandler {
  constructor() {
    this.appManager = require('../core/app-manager');
    this.windowManager = require('../core/window-manager');
    this.accountManager = require('../core/account-manager');
  }

  /**
   * Handle RPC method call
   */
  async handleMethod(method, params, context = {}) {
    const { server: { req, res } = {} } = context;

    // Skip logging for high-frequency methods
    if (method !== 'getWindows' && method !== 'getWindowState') {
      console.log("[ACT]", method);
      console.log("[PARAMS]", JSON.stringify(params));
    }

    let win, wc, result, ok = true;

    // Resolve window and webContents from params
    if (params) {
      if (params.win_id) {
        win = this.windowManager.getWindow(params.win_id);
        if (win) {
          wc = win.webContents;
        }
      }
      if (params.wc_id) {
        wc = this.windowManager.getWebContents(params.wc_id);
      }
    }

    try {
      switch (method) {
        // System methods
        case 'ping':
          result = 'pong';
          break;

        case 'info':
          result = {
            process: this.appManager.getAppInfo(),
            screen: this.appManager.getScreenInfo(),
          };
          break;

        case 'getScreenSize':
          result = this.appManager.getScreenInfo();
          break;

        // Window management
        case 'openWindow':
          const window = await this.windowManager.createWindow(
            params?.account_index || 0,
            params?.url,
            params?.options || {},
            params?.others || {}
          );
          result = { id: window.id };
          break;

        case 'closeWindow':
          result = this.windowManager.closeWindow(params?.win_id);
          if (!result) {
            ok = false;
            result = 'Window not found or already closed';
          }
          break;

        case 'showWindow':
          if (win) {
            win.show();
          }
          break;

        case 'hideWindow':
          if (win) {
            win.hide();
          }
          break;

        case 'getWindows':
          result = this.windowManager.getAllWindows();
          break;

        case 'getWindowState':
          result = this.windowManager.getWindowState(params?.win_id) || {};
          break;

        // Page operations
        case 'loadURL':
          if (wc) {
            this.windowManager.setWindowState(params.win_id, {});
            wc.loadURL(params?.url);
          }
          break;

        case 'reload':
          if (wc) wc.reload();
          break;

        case 'getURL':
          result = wc ? wc.getURL() : '';
          break;

        case 'getTitle':
          result = wc ? wc.getTitle() : '';
          break;

        case 'getBounds':
          result = win ? win.getBounds() : null;
          break;

        case 'getWindowSize':
          result = win ? win.getSize() : null;
          break;

        case 'setBounds':
          if (win && params?.bounds) {
            win.setBounds(params.bounds);
          }
          break;

        case 'setWindowSize':
          if (win && params?.width && params?.height) {
            win.setSize(params.width, params.height);
          }
          break;

        case 'setWindowWidth':
          if (win && params?.width) {
            const [, height] = win.getSize();
            win.setSize(params.width, height);
          }
          break;

        case 'setWindowPosition':
          if (win && params?.x !== undefined && params?.y !== undefined) {
            win.setPosition(params.x, params.y);
          }
          break;

        // JavaScript execution
        case 'executeJavaScript':
          if (wc) {
            result = await executeJavaScript(wc, params?.code);
          }
          break;

        case 'openDevTools':
          if (wc) {
            await wc.openDevTools();
          }
          break;

        // Input events
        case 'sendInputEvent':
          if (wc) {
            await wc.sendInputEvent(params?.inputEvent);
          }
          break;

        // Cookies
        case 'importCookies':
          if (wc) {
            await setCookies(wc, params?.cookies);
          }
          break;

        case 'exportCookies':
          if (wc) {
            result = await wc.session.cookies.get(params?.options || {});
          }
          break;

        // User agent
        case 'setUserAgent':
          if (wc) {
            result = wc.setUserAgent(params?.userAgent);
          }
          break;

        // Media operations
        case 'downloadMedia':
          if (wc) {
            const { session } = wc;
            result = await downloadMedia(session, {
              mediaUrl: params?.mediaUrl,
              genSubtitles: params?.genSubtitles,
              basePath: params?.basePath,
              id: params?.id,
              MediaDir: this.appManager.getMediaDir()
            });

            if (params?.genSubtitles) {
              result.subtitles = await whisperTranscribe(result.audioPath);
            }
          }
          break;

        case 'getSubTitles':
          result = await whisperTranscribe(params?.mediaPath);
          break;

        // Network monitoring
        case 'getRequests':
          const networkMonitor = require('../services/network-monitor');
          result = networkMonitor.getRequests(params?.win_id);
          break;

        case 'clearRequests':
          const networkMonitorClear = require('../services/network-monitor');
          networkMonitorClear.clearRequests(params?.win_id);
          result = [];
          break;

        // Screenshot operations
        case 'captureScreenshot':
          if (wc) {
            const format = params?.format || 'png';
            const buffer = await screenshotService.getScreenshotBuffer(wc, format, {
              scaleFactor: params?.scaleFactor,
              quality: params?.quality
            });
            result = {
              format,
              data: buffer.toString('base64'),
              size: buffer.length
            };
          }
          break;

        case 'saveScreenshot':
          if (wc) {
            result = await screenshotService.saveScreenshot(
              wc,
              params?.filePath,
              params?.format || 'png',
              {
                scaleFactor: params?.scaleFactor,
                quality: params?.quality
              }
            );
          }
          break;

        case 'getScreenshotInfo':
          if (wc) {
            result = await screenshotService.getScreenshotInfo(wc);
          }
          break;

        case 'captureSystemScreenshot':
          const sysFormat = params?.format || 'png';
          const sysBuffer = await screenshotService.getSystemScreenshotBuffer(sysFormat, {
            scaleFactor: params?.scaleFactor,
            quality: params?.quality
          });
          result = {
            format: sysFormat,
            data: sysBuffer.toString('base64'),
            size: sysBuffer.length
          };
          break;

        case 'saveSystemScreenshot':
          result = await screenshotService.saveSystemScreenshot(
            params?.filePath,
            params?.format || 'png',
            {
              scaleFactor: params?.scaleFactor,
              quality: params?.quality
            }
          );
          break;

        // Account management
        case 'switchAccount':
          result = this.accountManager.switchAccount(params?.account_index);
          break;

        case 'getAccountInfo':
          result = this.accountManager.getWindowAccount(params?.win_id);
          break;

        case 'getAccountWindows':
          result = this.accountManager.getAccountWindows(params?.account_index);
          break;

        // PyAutoGUI methods
        case 'pyautoguiClick':
          await this._runPyAutoGUIScript('click', params);
          break;

        case 'pyautoguiType':
          await this._runPyAutoGUIScript('type', params);
          break;

        case 'pyautoguiPress':
          await this._runPyAutoGUIScript('press', params);
          break;

        case 'pyautoguiPaste':
          await this._runPyAutoGUIScript('paste', params);
          break;

        case 'pyautoguiMove':
          await this._runPyAutoGUIScript('move', params);
          break;

        case 'pyautoguiPressEnter':
          await this._runPyAutoGUIScript('press_enter', params);
          break;

        case 'pyautoguiPressBackspace':
          await this._runPyAutoGUIScript('press_backspace', params);
          break;

        case 'pyautoguiPressSpace':
          await this._runPyAutoGUIScript('press_space', params);
          break;

        case 'pyautoguiPressEsc':
          await this._runPyAutoGUIScript('press_esc', params);
          break;

        case 'pyautoguiScreenshot':
          result = await this._runPyAutoGUIScript('screenshot', params);
          break;

        case 'pyautoguiWrite':
          await this._runPyAutoGUIScript('write', params);
          break;

        case 'methods':
          result = {
            ping: "Check if the server is responding",
            info: "Get server information",
            getScreenSize: "Get the screen size",
            openWindow: "Open a new window",
            closeWindow: "Close a window",
            showWindow: "Show a window",
            hideWindow: "Hide a window",
            getWindows: "Get list of windows",
            getWindowState: "Get window state",
            loadURL: "Load a URL in window",
            reload: "Reload the window",
            getURL: "Get current URL",
            getTitle: "Get window title",
            getBounds: "Get window bounds",
            getWindowSize: "Get window size",
            setBounds: "Set window bounds",
            setWindowSize: "Set window size",
            setWindowWidth: "Set window width",
            setWindowPosition: "Set window position",
            executeJavaScript: "Execute JavaScript in window",
            openDevTools: "Open developer tools",
            sendInputEvent: "Send input event",
            importCookies: "Import cookies",
            exportCookies: "Export cookies",
            setUserAgent: "Set user agent",
            downloadMedia: "Download media",
            getSubTitles: "Get subtitles",
            getRequests: "Get requests",
            clearRequests: "Clear requests",
            captureScreenshot: "Capture screenshot",
            saveScreenshot: "Save screenshot",
            getScreenshotInfo: "Get screenshot info",
            captureSystemScreenshot: "Capture system screenshot",
            saveSystemScreenshot: "Save system screenshot",
            switchAccount: "Switch account",
            getAccountInfo: "Get account info",
            getAccountWindows: "Get account windows",
            pyautoguiClick: "Perform mouse click",
            pyautoguiType: "Type text",
            pyautoguiPress: "Press key",
            pyautoguiPaste: "Paste content",
            pyautoguiMove: "Move mouse to position",
            pyautoguiPressEnter: "Press enter key",
            pyautoguiPressBackspace: "Press backspace key",
            pyautoguiPressSpace: "Press space key",
            pyautoguiPressEsc: "Press escape key",
            pyautoguiScreenshot: "Take screenshot with PyAutoGUI",
            pyautoguiWrite: "Write text with interval"
          };
          break;

        default:
          result = "Unknown method";
          ok = false;
          break;
      }
    } catch (error) {
      console.error(`[RPC Error] ${method}:`, error);
      result = error.message;
      ok = false;
    }

    // Skip response if headers already sent (e.g., for streaming responses)
    if (result && res && result.headersSent) {
      return;
    }

    // Return result via response if available
    if (res) {
      res.json({ ok, result });
    }

    return { ok, result };
  }

  /**
     * Run PyAutoGUI script
     */
    _runPyAutoGUIScript(action, params = {}) {
      return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../py', `pyautogui_${action}.py`);
        const pythonArgs = [scriptPath, JSON.stringify(params)];

        const pythonProcess = spawn('python3', pythonArgs, {
          stdio: action === 'screenshot' ? ['pipe', 'pipe', 'pipe'] : 'inherit'
        });

        let stdout = '';
        let stderr = '';

        if (action === 'screenshot') {
          pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
          });
          pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
          });
        }

        pythonProcess.on('close', (code) => {
          if (code === 0) {
            if (action === 'screenshot') {
              try {
                const result = JSON.parse(stdout.trim());
                resolve(result);
              } catch (e) {
                reject(new Error(`Failed to parse screenshot output: ${e.message}`));
              }
            } else {
              resolve();
            }
          } else {
            reject(new Error(`PyAutoGUI script failed with code ${code}: ${stderr}`));
          }
        });

        pythonProcess.on('error', (error) => {
          reject(error);
        });
      });
    }
}

module.exports = new RPCHandler();