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
            displayScreen: this.appManager.getDisplayScreenSize(),
          };
          break;

        case 'getDisplayScreenSize':
          result = this.appManager.getDisplayScreenSize();
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

        case 'sendElectronClick':
          if (wc && params?.x !== undefined && params?.y !== undefined) {
            await wc.sendInputEvent({
              type: 'mouseDown',
              x: params.x,
              y: params.y,
              button: params.button || 'left',
              clickCount: params.clickCount || 1
            });
            
            // Wait 300ms then send mouse up
            setTimeout(async () => {
              await wc.sendInputEvent({
                type: 'mouseUp',
                x: params.x,
                y: params.y,
                button: params.button || 'left',
                clickCount: params.clickCount || 1
              });
            }, 300);
          }
          break;

        case 'sendElectronPressEnter':
          if (wc) {
            await wc.sendInputEvent({
              type: 'keyDown',
              keyCode: 'Return'
            });
            await wc.sendInputEvent({
              type: 'keyUp',
              keyCode: 'Return'
            });
          }
          break;

        case 'writeClipboard':
          if (params?.text) {
            const { clipboard } = require('electron');
            
            try {
              clipboard.writeText(params.text);
            } catch (error) {
              console.error('Failed to write to clipboard:', error);
              throw new Error(`Clipboard write failed: ${error.message}`);
            }
          }
          break;

        case 'showFloatDiv':
          if (wc) {
            const options = params || {};
            await wc.executeJavaScript(`window._G.showFloatDiv(${JSON.stringify(options)})`);
          }
          break;

        case 'hideFloatDiv':
          if (wc) {
            await wc.executeJavaScript("window._G.hideFloatDiv()");
          }
          break;

        case 'sendElectronCtlV':
          if (wc) {
            // Send Ctrl+V (Control key + V key) for paste
            await wc.sendInputEvent({
              type: 'keyDown',
              keyCode: 'V',
              modifiers: ['control']
            });
            await wc.sendInputEvent({
              type: 'keyUp',
              keyCode: 'V',
              modifiers: ['control']
            });
            await wc.sendInputEvent({
              type: 'keyUp',
              keyCode: 'Control'
            });
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
            const buffer = await screenshotService.getWindowScreenshotBuffer(wc, format, {
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

        case 'getWindowScreenshotInfo':
          if (wc) {
            result = await screenshotService.getWindowScreenshotInfo(wc);
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

        case 'pyautoguiText':
           await this._runPyAutoGUIScript('text', params);
           break;

        case 'openTerminal':
           result = require('../utils-node').openTerminal(params?.command || '', params?.showWin !== false);
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