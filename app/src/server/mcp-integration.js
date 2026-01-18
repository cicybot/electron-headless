/**
 * MCP Integration
 * Provides Playwright-style browser automation tools via MCP protocol
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { z } = require('zod');
const transports = {};

class McpIntegration {
  constructor() {
    this.server = new McpServer({
      name: 'electron-headless-ptools',
      version: '1.0.0',
      description: 'Playwright-style browser automation tools for Electron headless browser'
    });

    this.rpcHandler = require('./rpc-handler');
    this.accountManager = require('../core/account-manager');

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
    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    return transport;
  }

  /**
   * Set up all MCP tools
   */
  setupTools() {
    // Navigation Tools
    this.setupNavigationTools();
    // Input Automation Tools
    this.setupInputTools();
    // Debugging Tools
    this.setupDebuggingTools();
    // Network Tools
    this.setupNetworkTools();
    // Performance Tools
    this.setupPerformanceTools();
    // Account Management Tools
    this.setupAccountTools();
  }

  /**
   * Navigation tools
   */
  setupNavigationTools() {
    this.registerTool('new_page', 'Create a new browser window in specified account context', {
      url: z.string().optional().describe('Initial URL'),
      account_index: z.number().optional().describe('Account index for context isolation (default: 0)')
    }, async ({ url = 'about:blank', account_index = 0 }) => {
      try {
        const result = await this.rpcHandler.handleMethod('openWindow', {
          account_index,
          url
        });
        return {
          content: [{
            type: 'text',
            text: `Created new window (ID: ${result.result.id}) in account ${account_index}`
          }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('close_page', 'Close a browser window', {
      win_id: z.number().describe('Window ID to close')
    }, async ({ win_id }) => {
      try {
        const result = await this.rpcHandler.handleMethod('closeWindow', { win_id });
        return {
          content: [{
            type: 'text',
            text: result.ok ? `Closed window ${win_id}` : result.result
          }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('navigate_page', 'Navigate to a URL', {
      win_id: z.number().describe('Window ID'),
      url: z.string().describe('URL to navigate to')
    }, async ({ win_id, url }) => {
      try {
        await this.rpcHandler.handleMethod('loadURL', { win_id, url });
        return {
          content: [{ type: 'text', text: `Navigated window ${win_id} to ${url}` }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('list_pages', 'List all active browser windows across all accounts', {}, async () => {
      try {
        const result = await this.rpcHandler.handleMethod('getWindows', {});
        return {
          content: [{ type: 'text', text: JSON.stringify(result.result, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });
  }

  /**
   * Input automation tools
   */
  setupInputTools() {
    this.registerTool('click', 'Click on an element at coordinates', {
      win_id: z.number().describe('Window ID'),
      x: z.number().describe('X coordinate'),
      y: z.number().describe('Y coordinate'),
      account_index: z.number().optional().describe('Account context verification')
    }, async ({ win_id, x, y, account_index }) => {
      try {
        // Validate account if specified
        if (account_index !== undefined) {
          const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
          if (!isValid) {
            throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
          }
        }

        // Perform click operation
        await this.rpcHandler.handleMethod('sendInputEvent', {
          win_id,
          inputEvent: { type: 'mouseDown', x, y, button: 'left', clickCount: 1 }
        });

        await this.rpcHandler.handleMethod('sendInputEvent', {
          win_id,
          inputEvent: { type: 'mouseUp', x, y, button: 'left', clickCount: 1 }
        });

        return {
          content: [{ type: 'text', text: `Clicked at (${x}, ${y}) in window ${win_id}` }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('fill', 'Fill an input field', {
      win_id: z.number().describe('Window ID'),
      selector: z.string().describe('CSS selector'),
      value: z.string().describe('Value to fill'),
      account_index: z.number().optional().describe('Account context verification')
    }, async ({ win_id, selector, value, account_index }) => {
      try {
        // Validate account if specified
        if (account_index !== undefined) {
          const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
          if (!isValid) {
            throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
          }
        }

        const code = `document.querySelector('${selector}').value = '${value}';`;
        await this.rpcHandler.handleMethod('executeJavaScript', { win_id, code });

        return {
          content: [{ type: 'text', text: `Filled ${selector} with "${value}"` }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('press_key', 'Press a keyboard key', {
      win_id: z.number().describe('Window ID'),
      key: z.string().describe('Key to press'),
      account_index: z.number().optional().describe('Account context verification')
    }, async ({ win_id, key, account_index }) => {
      try {
        // Validate account if specified
        if (account_index !== undefined) {
          const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
          if (!isValid) {
            throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
          }
        }

        await this.rpcHandler.handleMethod('sendInputEvent', {
          win_id,
          inputEvent: { type: 'keyDown', keyCode: key }
        });

        await this.rpcHandler.handleMethod('sendInputEvent', {
          win_id,
          inputEvent: { type: 'keyUp', keyCode: key }
        });

        return {
          content: [{ type: 'text', text: `Pressed key "${key}" in window ${win_id}` }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    // PyAutoGUI tools
    this.registerTool('pyautogui_click', 'Perform mouse click at coordinates using PyAutoGUI', {
      x: z.number().optional().describe('X coordinate (optional, clicks at current position if not specified)'),
      y: z.number().optional().describe('Y coordinate (optional, clicks at current position if not specified)')
    }, async ({ x, y }) => {
      try {
        await this.rpcHandler.handleMethod('pyautoguiClick', { x, y });
        return {
          content: [{ type: 'text', text: `PyAutoGUI clicked at (${x || 'current'}, ${y || 'current'})` }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('pyautogui_move', 'Move mouse to coordinates using PyAutoGUI', {
      x: z.number().describe('X coordinate'),
      y: z.number().describe('Y coordinate')
    }, async ({ x, y }) => {
      try {
        await this.rpcHandler.handleMethod('pyautoguiMove', { x, y });
        return {
          content: [{ type: 'text', text: `PyAutoGUI moved mouse to (${x}, ${y})` }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('pyautogui_type', 'Type text using PyAutoGUI', {
      text: z.string().describe('Text to type')
    }, async ({ text }) => {
      try {
        await this.rpcHandler.handleMethod('pyautoguiType', { text });
        return {
          content: [{ type: 'text', text: `PyAutoGUI typed: "${text}"` }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('pyautogui_press', 'Press a single key using PyAutoGUI. Supports letters, numbers, special keys (enter, space, backspace, esc), function keys (f1-f24), modifier keys (ctrl, alt, shift), and many more.', {
      key: z.string().describe('Key to press (e.g., "a", "enter", "f1", "ctrl", "space", "esc", "backspace", "tab", "up", "down", "left", "right")')
    }, async ({ key }) => {
      try {
        await this.rpcHandler.handleMethod('pyautoguiPress', { key });
        return {
          content: [{ type: 'text', text: `PyAutoGUI pressed key: "${key}"` }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('pyautogui_paste', 'Paste from clipboard using PyAutoGUI', {}, async () => {
      try {
        await this.rpcHandler.handleMethod('pyautoguiPaste', {});
        return {
          content: [{ type: 'text', text: 'PyAutoGUI pasted from clipboard' }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('pyautogui_press_enter', 'Press Enter key using PyAutoGUI', {}, async () => {
      try {
        await this.rpcHandler.handleMethod('pyautoguiPressEnter', {});
        return {
          content: [{ type: 'text', text: 'PyAutoGUI pressed Enter' }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('pyautogui_press_backspace', 'Press Backspace key using PyAutoGUI', {}, async () => {
      try {
        await this.rpcHandler.handleMethod('pyautoguiPressBackspace', {});
        return {
          content: [{ type: 'text', text: 'PyAutoGUI pressed Backspace' }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('pyautogui_press_space', 'Press Space key using PyAutoGUI', {}, async () => {
      try {
        await this.rpcHandler.handleMethod('pyautoguiPressSpace', {});
        return {
          content: [{ type: 'text', text: 'PyAutoGUI pressed Space' }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('pyautogui_press_esc', 'Press Escape key using PyAutoGUI', {}, async () => {
      try {
        await this.rpcHandler.handleMethod('pyautoguiPressEsc', {});
        return {
          content: [{ type: 'text', text: 'PyAutoGUI pressed Escape' }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('pyautogui_screenshot', 'Take a screenshot using PyAutoGUI', {}, async () => {
      try {
        const result = await this.rpcHandler.handleMethod('pyautoguiScreenshot', {});
        const { base64, format } = result.result;
        return {
          content: [{
            type: 'image',
            data: `data:image/${format};base64,${base64}`,
            mimeType: `image/${format}`
          }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });
  }

  /**
   * Debugging tools
   */
  setupDebuggingTools() {
    this.registerTool('evaluate_script', 'Execute JavaScript in a window', {
      win_id: z.number().describe('Window ID'),
      script: z.string().describe('JavaScript code to execute'),
      account_index: z.number().optional().describe('Account context verification')
    }, async ({ win_id, script, account_index }) => {
      try {
        // Validate account if specified
        if (account_index !== undefined) {
          const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
          if (!isValid) {
            throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
          }
        }

        const result = await this.rpcHandler.handleMethod('executeJavaScript', {
          win_id,
          code: script
        });

        return {
          content: [{
            type: 'text',
            text: `Script result: ${JSON.stringify(result.result)}`
          }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('take_screenshot', 'Take a screenshot of a window', {
      win_id: z.number().optional().describe('Window ID (uses main window if not specified)'),
      account_index: z.number().optional().describe('Account context verification')
    }, async ({ win_id, account_index }) => {
      try {
        // Validate account if specified
        if (account_index !== undefined && win_id) {
          const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
          if (!isValid) {
            throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
          }
        }

        const appManager = require('../core/app-manager');
        const screenshotUrl = `http://127.0.0.1:3456/screenshot?id=${win_id || 1}`;

        return {
          content: [{
            type: 'text',
            text: `Screenshot available at: ${screenshotUrl}`
          }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });
  }

  /**
   * Network tools
   */
  setupNetworkTools() {
    this.registerTool('get_network_request', 'Get network request details by index', {
      win_id: z.number().describe('Window ID'),
      index: z.number().describe('Request index'),
      account_index: z.number().optional().describe('Account context verification')
    }, async ({ win_id, index, account_index }) => {
      try {
        // Validate account if specified
        if (account_index !== undefined) {
          const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
          if (!isValid) {
            throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
          }
        }

        const result = await this.rpcHandler.handleMethod('getRequests', { win_id });
        const requests = result.result || [];
        const request = requests.find(r => r.index === index);

        if (!request) {
          throw new Error(`Request with index ${index} not found`);
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(request, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('list_network_requests', 'List all network requests for a window', {
      win_id: z.number().describe('Window ID'),
      account_index: z.number().optional().describe('Account context verification')
    }, async ({ win_id, account_index }) => {
      try {
        // Validate account if specified
        if (account_index !== undefined) {
          const isValid = this.accountManager.validateWindowAccount(win_id, account_index);
          if (!isValid) {
            throw new Error(`Window ${win_id} does not belong to account ${account_index}`);
          }
        }

        const result = await this.rpcHandler.handleMethod('getRequests', { win_id });
        const requests = result.result || [];

        return {
          content: [{
            type: 'text',
            text: `Found ${requests.length} requests:\n${JSON.stringify(requests, null, 2)}`
          }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });
  }

  /**
   * Performance tools (placeholder implementations)
   */
  setupPerformanceTools() {
    this.registerTool('performance_start_trace', 'Start performance tracing', {
      win_id: z.number().describe('Window ID'),
      account_index: z.number().optional().describe('Account context verification')
    }, async ({ win_id, account_index }) => {
      // Placeholder - would need Chrome DevTools Protocol integration
      return {
        content: [{ type: 'text', text: 'Performance tracing started (placeholder implementation)' }]
      };
    });

    this.registerTool('performance_stop_trace', 'Stop performance tracing and return results', {
      win_id: z.number().describe('Window ID'),
      account_index: z.number().optional().describe('Account context verification')
    }, async ({ win_id, account_index }) => {
      // Placeholder - would need Chrome DevTools Protocol integration
      return {
        content: [{ type: 'text', text: 'Performance trace results (placeholder implementation)' }]
      };
    });

    this.registerTool('performance_analyze_insight', 'Analyze performance data for insights', {
      win_id: z.number().describe('Window ID'),
      account_index: z.number().optional().describe('Account context verification')
    }, async ({ win_id, account_index }) => {
      // Placeholder - would need performance analysis logic
      return {
        content: [{ type: 'text', text: 'Performance insights (placeholder implementation)' }]
      };
    });
  }

  /**
   * Account management tools
   */
  setupAccountTools() {
    this.registerTool('switch_account', 'Switch active account context', {
      account_index: z.number().describe('Account index to switch to')
    }, async ({ account_index }) => {
      try {
        const result = this.accountManager.switchAccount(account_index);
        return {
          content: [{ type: 'text', text: `Switched to account ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });

    this.registerTool('get_account_info', 'Get account information for a window', {
      win_id: z.number().describe('Window ID')
    }, async ({ win_id }) => {
      try {
        const accountInfo = this.accountManager.getWindowAccount(win_id);
        return {
          content: [{
            type: 'text',
            text: `Window ${win_id} belongs to account ${accountInfo.accountIndex}`
          }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });
  }

  /**
   * Handle MCP requests (POST)
   */
  async handleRequest(req,res) {

    const { method, params, id } = req.body;

    const sessionId = req.query.sessionId;
    const transport = transports[sessionId];
    console.log({sessionId, method, params, id },JSON.stringify(Object.entries(this.tools),null,2))

    try {
      if(transport){
        await transport.handlePostMessage(req, res, req.body);
      }else{
        res.status(400).send('No transport found for sessionId');
      }
    } catch (error) {
      return { jsonrpc: '2.0', id, error: { code: -32603, message: error.message } };
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
      console.log('[MCP] SSE connection established');
    } catch (error) {
      console.error('[MCP] SSE connection error:', error);
      res.status(500).end();
    }
  }


}

module.exports = new McpIntegration();