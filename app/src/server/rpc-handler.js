/**
 * RPC Handler
 * Handles all RPC method calls and routes them to appropriate services
 */

const { executeJavaScript, downloadMedia, getAppInfo, setCookies } = require("../helpers");
const { whisperTranscribe } = require("../utils-node");

const screenshotCacheService = require("../services/screenshot-cache-service");

class RPCHandler {
  constructor() {
    this.appManager = require("../core/app-manager");
    this.windowManager = require("../core/window-manager");
    this.accountManager = require("../core/account-manager");
  }

  /**
   * Handle RPC method call
   */
  async handleMethod(method, params, context = {}) {
    const { server: { req, res } = {} } = context;

    // Skip logging for high-frequency methods
    if (method !== "getWindows" && method !== "getWindowState") {
      console.log("[ACT]", method);
      console.log("[PARAMS]", JSON.stringify(params));
    }

    let win,
      wc,
      result,
      ok = true;

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
        case "ping":
          result = "pong";
          break;

        case "info":
          result = {
            process: this.appManager.getAppInfo(),
            displayScreen: this.appManager.getDisplayScreenSize(),
          };
          break;

        case "getDisplayScreenSize":
          result = this.appManager.getDisplayScreenSize();
          break;

        // Window management
        case "openWindow":
          const window = await this.windowManager.createWindow(
            params?.account_index || 0,
            params?.url,
            params?.options || {},
            params?.others || {}
          );
          result = { id: window.id };
          break;

        case "closeWindow":
          result = this.windowManager.closeWindow(params?.win_id);
          if (!result) {
            ok = false;
            result = "Window not found or already closed";
          }
          break;

        case "showWindow":
          if (win) {
            win.show();
          }
          break;

        case "hideWindow":
          if (win) {
            win.hide();
          }
          break;

        case "getWindows":
          result = this.windowManager.getAllWindows();
          break;

        case "getWindowState":
          result = this.windowManager.getWindowState(params?.win_id) || {};
          break;

        // Page operations
        case "loadURL":
          if (wc) {
            this.windowManager.setWindowState(params.win_id, {});
            wc.loadURL(params?.url);
          }
          break;

        case "reload":
          if (wc) wc.reload();
          break;

        case "getURL":
          result = wc ? wc.getURL() : "";
          break;

        case "getTitle":
          result = wc ? wc.getTitle() : "";
          break;

        case "getBounds":
          result = win ? win.getBounds() : null;
          break;

        case "getWindowSize":
          result = win ? win.getSize() : null;
          break;

        case "setBounds":
          if (win && params?.bounds) {
            win.setBounds(params.bounds);
          }
          break;

        case "setWindowSize":
          if (win && params?.width && params?.height) {
            win.setSize(params.width, params.height);
          }
          break;

        case "setWindowWidth":
          if (win && params?.width) {
            const [, height] = win.getSize();
            win.setSize(params.width, height);
          }
          break;

        case "setWindowPosition":
          if (win && params?.x !== undefined && params?.y !== undefined) {
            win.setPosition(params.x, params.y);
          }
          break;

        // JavaScript execution
        case "executeJavaScript":
          if (wc) {
            result = await executeJavaScript(wc, params?.code);
          }
          break;

        case "openDevTools":
          if (wc) {
            await wc.openDevTools();
          }
          break;

        // Input events
        case "sendInputEvent":
          if (wc) {
            await wc.sendInputEvent(params?.inputEvent);
          }
          break;
        case "sendElectronClick":
          wc.focus();
          // 2. 鼠标按下
          await wc.sendInputEvent({
            type: "mouseDown",
            x: params.x,
            y: params.y,
            button: params.button || "left",
            clickCount: params.clickCount || 1,
          });

          setTimeout(async () => {
            await wc.sendInputEvent({
              type: "mouseDown",
              x: params.x,
              y: params.y,
              button: params.button || "left",
              clickCount: params.clickCount || 1,
            });

          }, 100); // 调整延迟为100ms
          break;

        case "sendElectronPressEnter":
          if (wc) {
            await wc.sendInputEvent({
              type: "rawKeyDown",
              keyCode: "Enter",
            });

            // Key up
            await wc.sendInputEvent({
              type: "keyUp",
              keyCode: "Enter",
            });

          }
          break;

        case "sendElectronPressEsc":
          if (wc) {
            await wc.sendInputEvent({
              type: "rawKeyDown",
              keyCode: "Esc",
            });

            // Key up
            await wc.sendInputEvent({
              type: "keyUp",
              keyCode: "Esc",
            });

          }
          break;

        case "writeClipboard":
          if (params?.text) {
            const { clipboard } = require("electron");

            try {
              clipboard.writeText(params.text);
            } catch (error) {
              console.error("Failed to write to clipboard:", error);
              throw new Error(`Clipboard write failed: ${error.message}`);
            }
          }
          break;
        case "sendElectronSelectAll":
          if (wc) {
            wc.focus();
            win.webContents.selectAll();
          }
          break;
        case "sendElectronPaste":
          if (wc) {
            wc.focus();
            win.webContents.paste();
          }
          break;
        case "sendElectronCopy":
          if (wc) {
            wc.focus();
            win.webContents.copy();
          }
          break;
        case "sendElectronCut":
          if (wc) {
            wc.focus();
            win.webContents.cut();
          }
          break;
        // Cookies
        case "importCookies":
          if (wc) {
            await setCookies(wc, params?.cookies);
          }
          break;

        case "exportCookies":
          if (wc) {
            result = await wc.session.cookies.get(params?.options || {});
          }
          break;

        // User agent
        case "setUserAgent":
          if (wc) {
            result = wc.setUserAgent(params?.userAgent);
          }
          break;

        // Media operations
        case "downloadMedia":
          if (wc) {
            const { session } = wc;
            result = await downloadMedia(session, {
              mediaUrl: params?.mediaUrl,
              genSubtitles: params?.genSubtitles,
              basePath: params?.basePath,
              id: params?.id,
              MediaDir: this.appManager.getMediaDir(),
            });

            if (params?.genSubtitles) {
              result.subtitles = await whisperTranscribe(result.audioPath);
            }
          }
          break;

        case "getSubTitles":
          result = await whisperTranscribe(params?.mediaPath);
          break;

        // Network monitoring
        case "getRequests":
          const networkMonitor = require("../services/network-monitor");
          result = networkMonitor.getRequests(params?.win_id);
          break;

        case "clearRequests":
          const networkMonitorClear = require("../services/network-monitor");
          networkMonitorClear.clearRequests(params?.win_id);
          result = [];
          break;

        // Screenshot operations
        case "captureScreenshot":
          if (wc) {
            const format = params?.format || "png";
            const buffer = await screenshotCacheService.captureWindowLive(params?.win_id);
            result = {
              format,
              data: buffer.toString("base64"),
              size: buffer.length,
            };
          }
          break;

        case "saveScreenshot":
          if (wc) {
            const buffer = await screenshotCacheService.captureWindowLive(params?.win_id);
            const fs = require("fs").promises;
            await fs.writeFile(params?.filePath, buffer);
            result = {
              success: true,
              filePath: params?.filePath,
              size: buffer.length,
              format: params?.format || "png",
            };
          }
          break;

        case "getWindowScreenshotInfo":
          if (wc) {
            const win = this.windowManager.getWindow(params?.win_id);
            if (win && !win.isDestroyed()) {
              const bounds = win.getBounds();
              result = {
                width: bounds.width,
                height: bounds.height,
                aspectRatio: bounds.width / bounds.height,
              };
            } else {
              result = null;
            }
          }
          break;

        case "captureSystemScreenshot":
          const sysFormat = params?.format || "png";
          const sysBuffer = await screenshotCacheService.captureSystemDisplayLive();
          result = {
            format: sysFormat,
            data: sysBuffer.toString("base64"),
            size: sysBuffer.length,
          };
          break;

        case "saveSystemScreenshot":
          const sysBufferSave = await screenshotCacheService.captureSystemDisplayLive();
          const fsSave = require("fs").promises;
          await fsSave.writeFile(params?.filePath, sysBufferSave);
          result = {
            success: true,
            filePath: params?.filePath,
            size: sysBufferSave.length,
            format: params?.format || "png",
          };
          break;

        // Account management
        case "switchAccount":
          result = this.accountManager.switchAccount(params?.account_index);
          break;

        case "getAccountInfo":
          result = this.accountManager.getWindowAccount(params?.win_id);
          break;

        case "getAccountWindows":
          result = this.accountManager.getAccountWindows(params?.account_index);
          break;

        

        case "openTerminal":
          result = require("../utils-node").openTerminal(
            params?.command || "",
            params?.showWin !== false
          );
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
}

module.exports = new RPCHandler();
