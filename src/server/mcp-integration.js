/**
 * MCP Integration
 * Provides Playwright-style browser automation tools via MCP protocol
 */

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { SSEServerTransport } = require("@modelcontextprotocol/sdk/server/sse.js");
const { z } = require("zod");
const transports = {};

class McpIntegration {
  constructor() {
    this.server = new McpServer({
      name: "electron-mcp-tools",
      version: "1.0.0",
      description: "Playwright-style browser automation tools for Electron headless browser",
    });

    this.rpcHandler = require("./rpc-handler");
    this.accountManager = require("../core/account-manager");

    this.tools = {};

    this.setupTools();
  }

  registerTool(name, description, schema, handler) {
    this.server.registerTool(name, { title: name, description, inputSchema: schema }, handler);
    this.tools[name] = { description, inputSchema: schema, handler };
  }

  /**
   * Create SSE transport for a session
   */
  createTransport(res) {
    const transport = new SSEServerTransport("/messages", res);
    transports[transport.sessionId] = transport;
    return transport;
  }

  /**
   * Set up all MCP tools
   */
  setupTools() {
    this.setupSystemTools();
    this.setupWindowManagementTools();
    this.setupInputEventTools();
    this.setupCookieTools();
    this.setupScreenshotTools();
    this.setupAccountTools();
    this.setupPageTools();
    this.setupPyAutoGUITools();
    this.setupNetworkTools();
    this.setupMediaTools();
  }

  /**
   * Window management tools
   */
  setupWindowManagementTools() {
    this.registerTool(
      "open_window",
      "Open a new browser window",
      {
        url: z.string().describe("URL to open"),
        account_index: z.number().optional().describe("Account index for the window"),
        options: z.object({}).optional().describe("Window options"),
        others: z.object({}).optional().describe("Additional options"),
      },
      async ({ url, account_index, options, others }) => {
        try {
          const result = await this.rpcHandler.handleMethod("openWindow", {
            url,
            account_index,
            options,
            others,
          });
          return {
            content: [{ type: "text", text: `Opened window with ID: ${result.result.id}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool("get_windows", "Get list of all windows", {}, async () => {
      try {
        const result = await this.rpcHandler.handleMethod("getWindows", {});
        return {
          content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });

    this.registerTool(
      "close_window",
      "Close a window",
      {
        win_id: z.number().describe("Window ID"),
      },
      async ({ win_id }) => {
        try {
          await this.rpcHandler.handleMethod("closeWindow", { win_id });
          return {
            content: [{ type: "text", text: `Closed window ${win_id}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "show_window",
      "Show a hidden window",
      {
        win_id: z.number().describe("Window ID"),
      },
      async ({ win_id }) => {
        try {
          await this.rpcHandler.handleMethod("showWindow", { win_id });
          return {
            content: [{ type: "text", text: `Showed window ${win_id}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "hide_window",
      "Hide a window",
      {
        win_id: z.number().describe("Window ID"),
      },
      async ({ win_id }) => {
        try {
          await this.rpcHandler.handleMethod("hideWindow", { win_id });
          return {
            content: [{ type: "text", text: `Hid window ${win_id}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "reload_window",
      "Reload a window",
      {
        win_id: z.number().describe("Window ID"),
      },
      async ({ win_id }) => {
        try {
          await this.rpcHandler.handleMethod("reload", { win_id });
          return {
            content: [{ type: "text", text: `Reloaded window ${win_id}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "get_bounds",
      "Get window bounds",
      {
        win_id: z.number().describe("Window ID"),
      },
      async ({ win_id }) => {
        try {
          const result = await this.rpcHandler.handleMethod("getBounds", { win_id });
          return {
            content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "set_bounds",
      "Set window bounds",
      {
        win_id: z.number().describe("Window ID"),
        bounds: z
          .object({
            x: z.number().optional(),
            y: z.number().optional(),
            width: z.number().optional(),
            height: z.number().optional(),
          })
          .describe("Window bounds"),
      },
      async ({ win_id, bounds }) => {
        try {
          await this.rpcHandler.handleMethod("setBounds", { win_id, bounds });
          return {
            content: [{ type: "text", text: `Set bounds for window ${win_id}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "get_window_size",
      "Get window size",
      {
        win_id: z.number().describe("Window ID"),
      },
      async ({ win_id }) => {
        try {
          const result = await this.rpcHandler.handleMethod("getWindowSize", { win_id });
          return {
            content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "set_window_size",
      "Set window size",
      {
        win_id: z.number().describe("Window ID"),
        width: z.number().describe("Window width"),
        height: z.number().describe("Window height"),
      },
      async ({ win_id, width, height }) => {
        try {
          await this.rpcHandler.handleMethod("setWindowSize", { win_id, width, height });
          return {
            content: [
              { type: "text", text: `Set size for window ${win_id} to ${width}x${height}` },
            ],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "set_window_width",
      "Set window width",
      {
        win_id: z.number().describe("Window ID"),
        width: z.number().describe("Window width"),
      },
      async ({ win_id, width }) => {
        try {
          await this.rpcHandler.handleMethod("setWindowWidth", { win_id, width });
          return {
            content: [{ type: "text", text: `Set width for window ${win_id} to ${width}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "set_window_position",
      "Set window position",
      {
        win_id: z.number().describe("Window ID"),
        x: z.number().describe("X coordinate"),
        y: z.number().describe("Y coordinate"),
      },
      async ({ win_id, x, y }) => {
        try {
          await this.rpcHandler.handleMethod("setWindowPosition", { win_id, x, y });
          return {
            content: [{ type: "text", text: `Set position for window ${win_id} to (${x}, ${y})` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Input event tools
   */
  setupInputEventTools() {
    this.registerTool(
      "send_input_event",
      "Send input event",
      {
        win_id: z.number().describe("Window ID"),
        inputEvent: z
          .object({
            type: z.string().describe("Event type"),
            x: z.number().optional().describe("X coordinate"),
            y: z.number().optional().describe("Y coordinate"),
            button: z.string().optional().describe("Mouse button"),
            clickCount: z.number().optional().describe("Click count"),
            keyCode: z.string().optional().describe("Key code"),
            modifiers: z.array(z.string()).optional().describe("Key modifiers"),
          })
          .describe("Input event object"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, inputEvent, account_index }) => {
        try {
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
            if (!isValid) {
              throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
            }
          }
          await this.rpcHandler.handleMethod("sendInputEvent", { win_id, inputEvent });
          return {
            content: [{ type: "text", text: `Sent input event to window ${win_id}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "send_electron_click",
      "Send electron click event",
      {
        win_id: z.number().describe("Window ID"),
        x: z.number().describe("X coordinate"),
        y: z.number().describe("Y coordinate"),
        button: z.string().optional().describe("Mouse button"),
        clickCount: z.number().optional().describe("Click count"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, x, y, button, clickCount, account_index }) => {
        try {
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
            if (!isValid) {
              throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
            }
          }
          await this.rpcHandler.handleMethod("sendElectronClick", {
            win_id,
            x,
            y,
            button,
            clickCount,
          });
          return {
            content: [
              { type: "text", text: `Sent click event to window ${win_id} at (${x}, ${y})` },
            ],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "send_electron_press_enter",
      "Send enter key press event",
      {
        win_id: z.number().describe("Window ID"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, account_index }) => {
        try {
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
            if (!isValid) {
              throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
            }
          }
          await this.rpcHandler.handleMethod("sendElectronPressEnter", { win_id });
          return {
            content: [{ type: "text", text: `Sent enter key press to window ${win_id}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "write_clipboard",
      "Write text to clipboard",
      {
        text: z.string().describe("Text to write to clipboard"),
      },
      async ({ text }) => {
        try {
          await this.rpcHandler.handleMethod("writeClipboard", { text });
          return {
            content: [{ type: "text", text: `Wrote "${text}" to clipboard` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "show_float_div",
      "Show floating div overlay",
      {
        win_id: z.number().describe("Window ID"),
        options: z.object({}).optional().describe("Options for the floating div"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, options, account_index }) => {
        try {
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
            if (!isValid) {
              throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
            }
          }
          await this.rpcHandler.handleMethod("showFloatDiv", { win_id, ...options });
          return {
            content: [{ type: "text", text: `Showed floating div in window ${win_id}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "hide_float_div",
      "Hide floating div overlay",
      {
        win_id: z.number().describe("Window ID"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, account_index }) => {
        try {
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
            if (!isValid) {
              throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
            }
          }
          await this.rpcHandler.handleMethod("hideFloatDiv", { win_id });
          return {
            content: [{ type: "text", text: `Hid floating div in window ${win_id}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "send_electron_ctl_v",
      "Send Ctrl+V paste event",
      {
        win_id: z.number().describe("Window ID"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, account_index }) => {
        try {
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
            if (!isValid) {
              throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
            }
          }
          await this.rpcHandler.handleMethod("sendElectronPaste", { win_id });
          return {
            content: [{ type: "text", text: `Sent Ctrl+V to window ${win_id}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Cookie tools
   */
  setupCookieTools() {
    this.registerTool(
      "import_cookies",
      "Import cookies",
      {
        win_id: z.number().describe("Window ID"),
        cookies: z.array(z.object({})).describe("Cookies to import"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, cookies, account_index }) => {
        try {
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
            if (!isValid) {
              throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
            }
          }
          await this.rpcHandler.handleMethod("importCookies", { win_id, cookies });
          return {
            content: [
              { type: "text", text: `Imported ${cookies.length} cookies to window ${win_id}` },
            ],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "export_cookies",
      "Export cookies",
      {
        win_id: z.number().describe("Window ID"),
        options: z.object({}).optional().describe("Export options"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, options, account_index }) => {
        try {
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
            if (!isValid) {
              throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
            }
          }
          const result = await this.rpcHandler.handleMethod("exportCookies", { win_id, options });
          return {
            content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Screenshot tools
   */
  setupScreenshotTools() {
    this.registerTool(
      "capture_screenshot",
      "Capture screenshot of window",
      {
        win_id: z.number().describe("Window ID"),
        format: z.enum(["png", "jpeg"]).optional().describe("Image format"),
        scaleFactor: z.number().optional().describe("Scale factor"),
        quality: z.number().optional().describe("Quality (for jpeg)"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, format, scaleFactor, quality, account_index }) => {
        try {
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
            if (!isValid) {
              throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
            }
          }
          const result = await this.rpcHandler.handleMethod("captureScreenshot", {
            win_id,
            format,
            scaleFactor,
            quality,
          });
          return {
            content: [
              {
                type: "text",
                text: `Captured screenshot (${result.result.format}, ${result.result.size} bytes)`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "save_screenshot",
      "Save screenshot to file",
      {
        win_id: z.number().describe("Window ID"),
        filePath: z.string().describe("File path to save screenshot"),
        format: z.enum(["png", "jpeg"]).optional().describe("Image format"),
        scaleFactor: z.number().optional().describe("Scale factor"),
        quality: z.number().optional().describe("Quality (for jpeg)"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, filePath, format, scaleFactor, quality, account_index }) => {
        try {
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
            if (!isValid) {
              throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
            }
          }
          await this.rpcHandler.handleMethod("saveScreenshot", {
            win_id,
            filePath,
            format,
            scaleFactor,
            quality,
          });
          return {
            content: [{ type: "text", text: `Saved screenshot to ${filePath}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "get_screenshot_info",
      "Get screenshot information",
      {
        win_id: z.number().describe("Window ID"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, account_index }) => {
        try {
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
            if (!isValid) {
              throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
            }
          }
          const result = await this.rpcHandler.handleMethod("getScreenshotInfo", { win_id });
          return {
            content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "capture_system_screenshot",
      "Capture system screenshot",
      {
        format: z.enum(["png", "jpeg"]).optional().describe("Image format"),
        scaleFactor: z.number().optional().describe("Scale factor"),
        quality: z.number().optional().describe("Quality (for jpeg)"),
      },
      async ({ format, scaleFactor, quality }) => {
        try {
          const result = await this.rpcHandler.handleMethod("captureSystemScreenshot", {
            format,
            scaleFactor,
            quality,
          });
          return {
            content: [
              {
                type: "text",
                text: `Captured system screenshot (${result.result.format}, ${result.result.size} bytes)`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "save_system_screenshot",
      "Save system screenshot to file",
      {
        filePath: z.string().describe("File path to save screenshot"),
        format: z.enum(["png", "jpeg"]).optional().describe("Image format"),
        scaleFactor: z.number().optional().describe("Scale factor"),
        quality: z.number().optional().describe("Quality (for jpeg)"),
      },
      async ({ filePath, format, scaleFactor, quality }) => {
        try {
          await this.rpcHandler.handleMethod("saveSystemScreenshot", {
            filePath,
            format,
            scaleFactor,
            quality,
          });
          return {
            content: [{ type: "text", text: `Saved system screenshot to ${filePath}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool("get_display_screen_size", "Get display screen size", {}, async () => {
      try {
        const result = await this.rpcHandler.handleMethod("getDisplayScreenSize", {});
        return {
          content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });

    this.registerTool("display_screenshot", "Take display screenshot (legacy)", {}, async () => {
      try {
        await this.rpcHandler.handleMethod("displayScreenshot", {});
        return {
          content: [{ type: "text", text: "Display screenshot captured" }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });

    this.registerTool(
      "get_window_screenshot",
      "Get window screenshot (legacy)",
      {
        win_id: z.number().describe("Window ID"),
      },
      async ({ win_id }) => {
        try {
          await this.rpcHandler.handleMethod("getWindowScreenshot", { win_id });
          return {
            content: [{ type: "text", text: `Window ${win_id} screenshot captured` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Account management tools
   */
  setupAccountTools() {
    this.registerTool(
      "switch_account",
      "Switch to a different account",
      {
        account_index: z.number().describe("Account index"),
      },
      async ({ account_index }) => {
        try {
          await this.rpcHandler.handleMethod("switchAccount", { account_index });
          return {
            content: [{ type: "text", text: `Switched to account ${account_index}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "get_account_info",
      "Get account information for a window",
      {
        win_id: z.number().describe("Window ID"),
      },
      async ({ win_id }) => {
        try {
          const result = await this.rpcHandler.handleMethod("getAccountInfo", { win_id });
          return {
            content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "get_account_windows",
      "Get all windows for an account",
      {
        account_index: z.number().describe("Account index"),
      },
      async ({ account_index }) => {
        try {
          const result = await this.rpcHandler.handleMethod("getAccountWindows", { account_index });
          return {
            content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Page operations tools
   */
  setupPageTools() {
    this.registerTool(
      "load_url",
      "Load URL in window",
      {
        url: z.string().describe("URL to load"),
        win_id: z.number().optional().describe("Window ID (defaults to 1)"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ url, win_id, account_index }) => {
        try {
          const actualWinId = win_id || 1;
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(actualWinId, account_index);
            if (!isValid) {
              throw new Error(`Window ${actualWinId} does not belong to account ${account_index}`);
            }
          }
          await this.rpcHandler.handleMethod("loadURL", { url, win_id: actualWinId });
          return {
            content: [{ type: "text", text: `Loaded URL ${url} in window ${actualWinId}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "get_url",
      "Get current URL",
      {
        win_id: z.number().describe("Window ID"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, account_index }) => {
        try {
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
            if (!isValid) {
              throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
            }
          }
          const result = await this.rpcHandler.handleMethod("getURL", { win_id });
          return {
            content: [{ type: "text", text: result.result }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "get_title",
      "Get window title",
      {
        win_id: z.number().describe("Window ID"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, account_index }) => {
        try {
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
            if (!isValid) {
              throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
            }
          }
          const result = await this.rpcHandler.handleMethod("getTitle", { win_id });
          return {
            content: [{ type: "text", text: result.result }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "execute_javascript",
      "Execute JavaScript in window",
      {
        code: z.string().describe("JavaScript code to execute"),
        win_id: z.number().optional().describe("Window ID (defaults to 1)"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ code, win_id, account_index }) => {
        try {
          const actualWinId = win_id || 1;
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(actualWinId, account_index);
            if (!isValid) {
              throw new Error(`Window ${actualWinId} does not belong to account ${account_index}`);
            }
          }
          const result = await this.rpcHandler.handleMethod("executeJavaScript", {
            code,
            win_id: actualWinId,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "open_devtools",
      "Open developer tools for window",
      {
        win_id: z.number().describe("Window ID"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, account_index }) => {
        try {
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
            if (!isValid) {
              throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
            }
          }
          await this.rpcHandler.handleMethod("openDevTools", { win_id });
          return {
            content: [{ type: "text", text: `Opened DevTools for window ${win_id}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "set_user_agent",
      "Set user agent for window",
      {
        win_id: z.number().describe("Window ID"),
        userAgent: z.string().describe("User agent string"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, userAgent, account_index }) => {
        try {
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
            if (!isValid) {
              throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
            }
          }
          await this.rpcHandler.handleMethod("setUserAgent", { win_id, userAgent });
          return {
            content: [{ type: "text", text: `Set user agent for window ${win_id}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "get_window_state",
      "Get window state",
      {
        win_id: z.number().optional().describe("Window ID (defaults to 1)"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, account_index }) => {
        try {
          const actualWinId = win_id || 1;
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(actualWinId, account_index);
            if (!isValid) {
              throw new Error(`Window ${actualWinId} does not belong to account ${account_index}`);
            }
          }
          const result = await this.rpcHandler.handleMethod("getWindowState", {
            win_id: actualWinId,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * PyAutoGUI automation tools
   */
  setupPyAutoGUITools() {
    this.registerTool(
      "Perform mouse click with PyAutoGUI",
      {
        x: z.number().describe("X coordinate"),
        y: z.number().describe("Y coordinate"),
      },
      async ({ x, y }) => {
        try {
          return {
            content: [{ type: "text", text: `Clicked at (${x}, ${y})` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "Type text with PyAutoGUI",
      {
        text: z.string().describe("Text to type"),
      },
      async ({ text }) => {
        try {
          return {
            content: [{ type: "text", text: `Typed: "${text}"` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "Press hotkey combination with PyAutoGUI",
      {
        keys: z.array(z.string()).describe("Array of keys to press as hotkey combination"),
      },
      async ({ keys }) => {
        try {
          return {
            content: [{ type: "text", text: `Pressed hotkey: ${keys.join(" + ")}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "Press key with PyAutoGUI",
      {
        key: z.string().describe("Key to press"),
      },
      async ({ key }) => {
        try {
          return {
            content: [{ type: "text", text: `Pressed key: ${key}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
     );

    this.registerTool(
      "Move mouse with PyAutoGUI",
      {
        x: z.number().describe("X coordinate"),
        y: z.number().describe("Y coordinate"),
      },
      async ({ x, y }) => {
        try {
          return {
            content: [{ type: "text", text: `Moved mouse to (${x}, ${y})` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    // Removed stray block (previously caused syntax error)

    this.registerTool(
      "Press Backspace key with PyAutoGUI",
      {},
      async () => {
        try {
          return {
            content: [{ type: "text", text: "Pressed Backspace" }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    // Removed stray block (previously caused syntax error)

    this.registerTool(
      "Write text with interval with PyAutoGUI",
      {
        text: z.string().describe("Text to write"),
        interval: z.number().optional().describe("Interval between keystrokes"),
      },
      async ({ text, interval }) => {
        try {
          return {
            content: [{ type: "text", text: `Wrote: "${text}"` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "Type text using PyAutoGUI",
      {
        text: z.string().describe("Text to type"),
      },
      async ({ text }) => {
        try {
          return {
            content: [{ type: "text", text: `Typed: "${text}"` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Network monitoring tools
   */
  setupNetworkTools() {
    this.registerTool(
      "get_requests",
      "Get network requests for window",
      {
        win_id: z.number().optional().describe("Window ID (defaults to 1)"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, account_index }) => {
        try {
          const actualWinId = win_id || 1;
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(actualWinId, account_index);
            if (!isValid) {
              throw new Error(`Window ${actualWinId} does not belong to account ${account_index}`);
            }
          }
          const result = await this.rpcHandler.handleMethod("getRequests", { win_id: actualWinId });
          return {
            content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "clear_requests",
      "Clear network requests for window",
      {
        win_id: z.number().optional().describe("Window ID (defaults to 1)"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ win_id, account_index }) => {
        try {
          const actualWinId = win_id || 1;
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(actualWinId, account_index);
            if (!isValid) {
              throw new Error(`Window ${actualWinId} does not belong to account ${account_index}`);
            }
          }
          await this.rpcHandler.handleMethod("clearRequests", { win_id: actualWinId });
          return {
            content: [{ type: "text", text: `Cleared requests for window ${actualWinId}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Media tools
   */
  setupMediaTools() {
    this.registerTool(
      "download_media",
      "Download media from URL",
      {
        mediaUrl: z.string().describe("Media URL to download"),
        genSubtitles: z.boolean().optional().describe("Generate subtitles"),
        basePath: z.string().optional().describe("Base path for download"),
        id: z.string().optional().describe("Media ID"),
        win_id: z.number().optional().describe("Window ID (defaults to 1)"),
        account_index: z.number().optional().describe("Account context verification"),
      },
      async ({ mediaUrl, genSubtitles, basePath, id, win_id, account_index }) => {
        try {
          const actualWinId = win_id || 1;
          if (account_index !== undefined) {
            const isValid = this.accountManager.validateWindowAccount(actualWinId, account_index);
            if (!isValid) {
              throw new Error(`Window ${actualWinId} does not belong to account ${account_index}`);
            }
          }
          const result = await this.rpcHandler.handleMethod("downloadMedia", {
            mediaUrl,
            genSubtitles,
            basePath,
            id,
            win_id: actualWinId,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.registerTool(
      "get_subtitles",
      "Get subtitles for media file",
      {
        mediaPath: z.string().describe("Path to media file"),
      },
      async ({ mediaPath }) => {
        try {
          const result = await this.rpcHandler.handleMethod("getSubTitles", { mediaPath });
          return {
            content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * System tools
   */
  setupSystemTools() {
    this.registerTool("ping", "Check if server is responding", {}, async () => {
      try {
        const result = await this.rpcHandler.handleMethod("ping", {});
        return {
          content: [{ type: "text", text: result.result }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });

    this.registerTool("info", "Get server information", {}, async () => {
      try {
        const result = await this.rpcHandler.handleMethod("info", {});
        return {
          content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });

    this.registerTool("get_methods", "Get list of available RPC methods", {}, async () => {
      try {
        const result = await this.rpcHandler.handleMethod("methods", {});
        return {
          content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });

    this.registerTool(
      "open_terminal",
      "Open a terminal and execute command",
      {
        command: z.string().optional().describe("Command to execute"),
        showWin: z.boolean().optional().describe("Show terminal window"),
      },
      async ({ command, showWin }) => {
        try {
          const result = await this.rpcHandler.handleMethod("openTerminal", { command, showWin });
          return {
            content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Handle MCP requests (POST)
   */
  async handleRequest(req, res) {
    const { method, params, id } = req.body;

    const sessionId = req.query.sessionId;
    const transport = transports[sessionId];
    console.log(
      { sessionId, method, params, id },
      JSON.stringify(Object.entries(this.tools), null, 2)
    );

    try {
      if (transport) {
        await transport.handlePostMessage(req, res, req.body);
      } else {
        res.status(400).send("No transport found for sessionId");
      }
    } catch (error) {
      return { jsonrpc: "2.0", id, error: { code: -32603, message: error.message } };
    }
  }

  /**
   * Handle SSE connection (GET)
   */
  async handleSSEConnection(req, res) {
    try {
      const transport = this.createTransport(res);
      res.on("close", () => {
        delete transports[transport.sessionId];
      });
      await this.server.connect(transport);
      console.log("[MCP] SSE connection established");
    } catch (error) {
      console.error("[MCP] SSE connection error:", error);
      res.status(500).end();
    }
  }
}

module.exports = new McpIntegration();
