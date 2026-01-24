/**
 * MCP Integration Unit Tests
 * Tests for MCP server tools and functionality
 */

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { SSEServerTransport } = require("@modelcontextprotocol/sdk/server/sse.js");
const { z } = require("zod");

// Mock the dependencies
jest.mock("@modelcontextprotocol/sdk/server/mcp.js");
jest.mock("@modelcontextprotocol/sdk/server/sse.js");
jest.mock("../src/server/rpc-handler");
jest.mock("../src/core/account-manager");

describe("MCP Integration", () => {
  let mcpIntegration;
  let mockRpcHandler;
  let mockAccountManager;
  let mockServer;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock objects
    mockRpcHandler = {
      handleMethod: jest.fn(),
    };

    mockAccountManager = {
      validateWindowAccount: jest.fn(),
    };

    mockServer = {
      registerTool: jest.fn(),
      connect: jest.fn(),
    };

    // Mock the constructors
    McpServer.mockImplementation(() => mockServer);
    SSEServerTransport.mockImplementation((path, res) => ({
      sessionId: "test-session-id",
      handlePostMessage: jest.fn(),
    }));

    // Mock require calls
    jest.doMock("../src/server/rpc-handler", () => mockRpcHandler);
    jest.doMock("../src/core/account-manager", () => mockAccountManager);

    // Import the module after mocking
    delete require.cache[require.resolve("../src/server/mcp-integration")];
    mcpIntegration = require("../src/server/mcp-integration");
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe("Constructor", () => {
    test("should initialize McpServer with correct configuration", () => {
      expect(McpServer).toHaveBeenCalledWith({
        name: "electron-mcp-tools",
        version: "1.0.0",
        description: "Playwright-style browser automation tools for Electron headless browser",
      });
    });

    test("should set up all tool categories", () => {
      expect(mockServer.registerTool).toHaveBeenCalledTimes(expect.any(Number));
    });
  });

  describe("Transport Management", () => {
    test("should create SSE transport correctly", () => {
      const mockRes = {};
      const transport = mcpIntegration.createTransport(mockRes);

      expect(SSEServerTransport).toHaveBeenCalledWith("/messages", mockRes);
      expect(transport.sessionId).toBe("test-session-id");
      expect(mcpIntegration.transports["test-session-id"]).toBe(transport);
    });
  });

  describe("Tool Registration", () => {
    test("should register tool with correct parameters", () => {
      const name = "test_tool";
      const description = "Test tool description";
      const schema = { input: "schema" };
      const handler = jest.fn();

      mcpIntegration.registerTool(name, description, schema, handler);

      expect(mockServer.registerTool).toHaveBeenCalledWith(
        name,
        { title: name, description, inputSchema: schema },
        handler
      );
      expect(mcpIntegration.tools[name]).toEqual({
        description,
        inputSchema: schema,
        handler,
      });
    });
  });

  describe("Window Management Tools", () => {
    describe("open_window", () => {
      test("should open window successfully", async () => {
        const mockResult = { result: { id: 123 } };
        mockRpcHandler.handleMethod.mockResolvedValue(mockResult);

        const result = await mcpIntegration.tools["open_window"].handler({
          url: "https://example.com",
          account_index: 0,
          options: {},
          others: {},
        });

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("openWindow", {
          url: "https://example.com",
          account_index: 0,
          options: {},
          others: {},
        });
        expect(result).toEqual({
          content: [{ type: "text", text: "Opened window with ID: 123" }],
        });
      });

      test("should handle errors gracefully", async () => {
        const error = new Error("Failed to open window");
        mockRpcHandler.handleMethod.mockRejectedValue(error);

        const result = await mcpIntegration.tools["open_window"].handler({
          url: "https://example.com",
        });

        expect(result).toEqual({
          content: [{ type: "text", text: "Error: Failed to open window" }],
          isError: true,
        });
      });
    });

    describe("get_windows", () => {
      test("should get windows list", async () => {
        const mockResult = { result: { "1": { id: 1, title: "Test Window" } } };
        mockRpcHandler.handleMethod.mockResolvedValue(mockResult);

        const result = await mcpIntegration.tools["get_windows"].handler();

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("getWindows", {});
        expect(result).toEqual({
          content: [
            { type: "text", text: JSON.stringify(mockResult.result, null, 2) },
          ],
        });
      });
    });

    describe("close_window", () => {
      test("should close window", async () => {
        mockRpcHandler.handleMethod.mockResolvedValue({});

        const result = await mcpIntegration.tools["close_window"].handler({
          win_id: 123,
        });

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("closeWindow", {
          win_id: 123,
        });
        expect(result).toEqual({
          content: [{ type: "text", text: "Closed window 123" }],
        });
      });
    });
  });

  describe("Input Event Tools", () => {
    describe("send_input_event", () => {
      test("should send input event without account validation", async () => {
        mockRpcHandler.handleMethod.mockResolvedValue({});

        const inputEvent = { type: "click", x: 100, y: 200 };
        const result = await mcpIntegration.tools["send_input_event"].handler({
          win_id: 1,
          inputEvent,
        });

        expect(mockAccountManager.validateWindowAccount).not.toHaveBeenCalled();
        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("sendInputEvent", {
          win_id: 1,
          inputEvent,
        });
        expect(result).toEqual({
          content: [{ type: "text", text: "Sent input event to window 1" }],
        });
      });

      test("should validate account when account_index is provided", async () => {
        mockAccountManager.validateWindowAccount.mockReturnValue(true);
        mockRpcHandler.handleMethod.mockResolvedValue({});

        const inputEvent = { type: "click", x: 100, y: 200 };
        const result = await mcpIntegration.tools["send_input_event"].handler({
          win_id: 1,
          inputEvent,
          account_index: 0,
        });

        expect(mockAccountManager.validateWindowAccount).toHaveBeenCalledWith(1, 0);
        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("sendInputEvent", {
          win_id: 1,
          inputEvent,
        });
        expect(result).toEqual({
          content: [{ type: "text", text: "Sent input event to window 1" }],
        });
      });

      test("should reject when account validation fails", async () => {
        mockAccountManager.validateWindowAccount.mockReturnValue(false);

        const inputEvent = { type: "click", x: 100, y: 200 };
        const result = await mcpIntegration.tools["send_input_event"].handler({
          win_id: 1,
          inputEvent,
          account_index: 0,
        });

        expect(mockAccountManager.validateWindowAccount).toHaveBeenCalledWith(1, 0);
        expect(mockRpcHandler.handleMethod).not.toHaveBeenCalled();
        expect(result).toEqual({
          content: [
            { type: "text", text: "Error: Window 1 does not belong to account 0" },
          ],
          isError: true,
        });
      });
    });

    describe("write_clipboard", () => {
      test("should write text to clipboard", async () => {
        mockRpcHandler.handleMethod.mockResolvedValue({});

        const result = await mcpIntegration.tools["write_clipboard"].handler({
          text: "Hello World",
        });

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("writeClipboard", {
          text: "Hello World",
        });
        expect(result).toEqual({
          content: [{ type: "text", text: 'Wrote "Hello World" to clipboard' }],
        });
      });
    });
  });

  describe("Screenshot Tools", () => {
    describe("capture_screenshot", () => {
      test("should capture screenshot", async () => {
        const mockResult = { result: { format: "png", size: 1024 } };
        mockRpcHandler.handleMethod.mockResolvedValue(mockResult);

        const result = await mcpIntegration.tools["capture_screenshot"].handler({
          win_id: 1,
          format: "png",
          scaleFactor: 2,
          quality: 90,
        });

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("captureScreenshot", {
          win_id: 1,
          format: "png",
          scaleFactor: 2,
          quality: 90,
        });
        expect(result).toEqual({
          content: [
            {
              type: "text",
              text: "Captured screenshot (png, 1024 bytes)",
            },
          ],
        });
      });
    });

    describe("get_display_screen_size", () => {
      test("should get display screen size", async () => {
        const mockResult = { result: { width: 1920, height: 1080 } };
        mockRpcHandler.handleMethod.mockResolvedValue(mockResult);

        const result = await mcpIntegration.tools["get_display_screen_size"].handler();

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("getDisplayScreenSize", {});
        expect(result).toEqual({
          content: [
            { type: "text", text: JSON.stringify(mockResult.result, null, 2) },
          ],
        });
      });
    });
  });

  describe("Account Tools", () => {
    describe("switch_account", () => {
      test("should switch account", async () => {
        mockRpcHandler.handleMethod.mockResolvedValue({});

        const result = await mcpIntegration.tools["switch_account"].handler({
          account_index: 2,
        });

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("switchAccount", {
          account_index: 2,
        });
        expect(result).toEqual({
          content: [{ type: "text", text: "Switched to account 2" }],
        });
      });
    });

    describe("get_account_info", () => {
      test("should get account info", async () => {
        const mockResult = { result: { account_index: 0, windows: [1, 2] } };
        mockRpcHandler.handleMethod.mockResolvedValue(mockResult);

        const result = await mcpIntegration.tools["get_account_info"].handler({
          win_id: 1,
        });

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("getAccountInfo", {
          win_id: 1,
        });
        expect(result).toEqual({
          content: [
            { type: "text", text: JSON.stringify(mockResult.result, null, 2) },
          ],
        });
      });
    });
  });

  describe("Page Tools", () => {
    describe("load_url", () => {
      test("should load URL with default win_id", async () => {
        mockRpcHandler.handleMethod.mockResolvedValue({});

        const result = await mcpIntegration.tools["load_url"].handler({
          url: "https://example.com",
        });

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("loadURL", {
          url: "https://example.com",
          win_id: 1,
        });
        expect(result).toEqual({
          content: [
            { type: "text", text: "Loaded URL https://example.com in window 1" },
          ],
        });
      });

      test("should load URL with custom win_id", async () => {
        mockRpcHandler.handleMethod.mockResolvedValue({});

        const result = await mcpIntegration.tools["load_url"].handler({
          url: "https://example.com",
          win_id: 5,
        });

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("loadURL", {
          url: "https://example.com",
          win_id: 5,
        });
        expect(result).toEqual({
          content: [
            { type: "text", text: "Loaded URL https://example.com in window 5" },
          ],
        });
      });
    });

    describe("execute_javascript", () => {
      test("should execute JavaScript", async () => {
        const mockResult = { result: { data: "test result" } };
        mockRpcHandler.handleMethod.mockResolvedValue(mockResult);

        const result = await mcpIntegration.tools["execute_javascript"].handler({
          code: "document.title",
          win_id: 2,
        });

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("executeJavaScript", {
          code: "document.title",
          win_id: 2,
        });
        expect(result).toEqual({
          content: [
            { type: "text", text: JSON.stringify(mockResult.result, null, 2) },
          ],
        });
      });
    });
  });

  describe("System Tools", () => {
    describe("ping", () => {
      test("should ping server", async () => {
        const mockResult = { result: "pong" };
        mockRpcHandler.handleMethod.mockResolvedValue(mockResult);

        const result = await mcpIntegration.tools["ping"].handler();

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("ping", {});
        expect(result).toEqual({
          content: [{ type: "text", text: "pong" }],
        });
      });
    });

    describe("info", () => {
      test("should get server info", async () => {
        const mockResult = { result: { version: "1.0.0", uptime: 3600 } };
        mockRpcHandler.handleMethod.mockResolvedValue(mockResult);

        const result = await mcpIntegration.tools["info"].handler();

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("info", {});
        expect(result).toEqual({
          content: [
            { type: "text", text: JSON.stringify(mockResult.result, null, 2) },
          ],
        });
      });
    });

    describe("get_methods", () => {
      test("should get available methods", async () => {
        const mockResult = { result: ["ping", "info", "getWindows"] };
        mockRpcHandler.handleMethod.mockResolvedValue(mockResult);

        const result = await mcpIntegration.tools["get_methods"].handler();

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("methods", {});
        expect(result).toEqual({
          content: [
            { type: "text", text: JSON.stringify(mockResult.result, null, 2) },
          ],
        });
      });
    });
  });

  describe("Network Tools", () => {
    describe("get_requests", () => {
      test("should get network requests", async () => {
        const mockResult = { result: [{ url: "https://example.com", method: "GET" }] };
        mockRpcHandler.handleMethod.mockResolvedValue(mockResult);

        const result = await mcpIntegration.tools["get_requests"].handler({
          win_id: 1,
        });

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("getRequests", {
          win_id: 1,
        });
        expect(result).toEqual({
          content: [
            { type: "text", text: JSON.stringify(mockResult.result, null, 2) },
          ],
        });
      });
    });

    describe("clear_requests", () => {
      test("should clear network requests", async () => {
        mockRpcHandler.handleMethod.mockResolvedValue({});

        const result = await mcpIntegration.tools["clear_requests"].handler({
          win_id: 1,
        });

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("clearRequests", {
          win_id: 1,
        });
        expect(result).toEqual({
          content: [{ type: "text", text: "Cleared requests for window 1" }],
        });
      });
    });
  });

  describe("Cookie Tools", () => {
    describe("import_cookies", () => {
      test("should import cookies", async () => {
        mockRpcHandler.handleMethod.mockResolvedValue({});

        const cookies = [{ name: "session", value: "abc123" }];
        const result = await mcpIntegration.tools["import_cookies"].handler({
          win_id: 1,
          cookies,
        });

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("importCookies", {
          win_id: 1,
          cookies,
        });
        expect(result).toEqual({
          content: [
            { type: "text", text: "Imported 1 cookies to window 1" },
          ],
        });
      });
    });

    describe("export_cookies", () => {
      test("should export cookies", async () => {
        const mockResult = { result: [{ name: "session", value: "abc123" }] };
        mockRpcHandler.handleMethod.mockResolvedValue(mockResult);

        const result = await mcpIntegration.tools["export_cookies"].handler({
          win_id: 1,
        });

        expect(mockRpcHandler.handleMethod).toHaveBeenCalledWith("exportCookies", {
          win_id: 1,
          options: undefined,
        });
        expect(result).toEqual({
          content: [
            { type: "text", text: JSON.stringify(mockResult.result, null, 2) },
          ],
        });
      });
    });
  });

  describe("Request Handling", () => {
    test("should handle POST request with valid transport", async () => {
      const mockTransport = {
        handlePostMessage: jest.fn(),
      };
      mcpIntegration.transports["test-session"] = mockTransport;

      const mockReq = {
        body: { method: "ping", params: {}, id: 1 },
        query: { sessionId: "test-session" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await mcpIntegration.handleRequest(mockReq, mockRes);

      expect(mockTransport.handlePostMessage).toHaveBeenCalledWith(
        mockRes,
        mockReq.body
      );
    });

    test("should handle POST request with invalid transport", async () => {
      const mockReq = {
        body: { method: "ping", params: {}, id: 1 },
        query: { sessionId: "invalid-session" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await mcpIntegration.handleRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith("No transport found for sessionId");
    });

    test("should handle SSE connection", async () => {
      const mockRes = {
        on: jest.fn(),
      };
      const mockTransport = {
        sessionId: "new-session",
        handlePostMessage: jest.fn(),
      };

      SSEServerTransport.mockReturnValue(mockTransport);
      mockServer.connect.mockResolvedValue({});

      await mcpIntegration.handleSSEConnection({}, mockRes);

      expect(mockRes.on).toHaveBeenCalledWith("close", expect.any(Function));
      expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
      expect(mcpIntegration.transports["new-session"]).toBe(mockTransport);
    });

    test("should handle SSE connection error", async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        end: jest.fn(),
      };
      const error = new Error("Connection failed");

      SSEServerTransport.mockImplementation(() => {
        throw error;
      });

      await mcpIntegration.handleSSEConnection({}, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.end).toHaveBeenCalled();
    });
  });

  describe("Tool Schema Validation", () => {
    test("should have correct schemas for window management tools", () => {
      const openWindowTool = mcpIntegration.tools["open_window"];
      expect(openWindowTool.inputSchema).toHaveProperty("url");
      expect(openWindowTool.inputSchema).toHaveProperty("account_index");
      expect(openWindowTool.inputSchema).toHaveProperty("options");
      expect(openWindowTool.inputSchema).toHaveProperty("others");

      const closeWindowTool = mcpIntegration.tools["close_window"];
      expect(closeWindowTool.inputSchema).toHaveProperty("win_id");
    });

    test("should have correct schemas for input tools", () => {
      const inputEventTool = mcpIntegration.tools["send_input_event"];
      expect(inputEventTool.inputSchema).toHaveProperty("win_id");
      expect(inputEventTool.inputSchema).toHaveProperty("inputEvent");
      expect(inputEventTool.inputSchema).toHaveProperty("account_index");
    });

    test("should have correct schemas for screenshot tools", () => {
      const screenshotTool = mcpIntegration.tools["capture_screenshot"];
      expect(screenshotTool.inputSchema).toHaveProperty("win_id");
      expect(screenshotTool.inputSchema).toHaveProperty("format");
      expect(screenshotTool.inputSchema).toHaveProperty("scaleFactor");
      expect(screenshotTool.inputSchema).toHaveProperty("quality");
      expect(screenshotTool.inputSchema).toHaveProperty("account_index");
    });
  });

  describe("Error Handling", () => {
    test("should handle RPC handler errors in all tools", async () => {
      const error = new Error("RPC method failed");
      mockRpcHandler.handleMethod.mockRejectedValue(error);

      // Test a few representative tools
      const tools = ["open_window", "get_windows", "capture_screenshot", "ping"];
      
      for (const toolName of tools) {
        const tool = mcpIntegration.tools[toolName];
        const result = await tool.handler({});
        
        expect(result).toEqual({
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        });
      }
    });

    test("should handle account manager validation errors", async () => {
      mockAccountManager.validateWindowAccount.mockImplementation(() => {
        throw new Error("Account manager error");
      });

      const result = await mcpIntegration.tools["send_input_event"].handler({
        win_id: 1,
        inputEvent: { type: "click" },
        account_index: 0,
      });

      expect(result).toEqual({
        content: [{ type: "text", text: "Error: Account manager error" }],
        isError: true,
      });
    });
  });
});