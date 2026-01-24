/**
 * MCP Server Integration Tests
 * Tests for MCP server with Express integration
 */

const express = require("express");
const request = require("supertest");

// Mock dependencies
jest.mock("@modelcontextprotocol/sdk/server/mcp.js");
jest.mock("@modelcontextprotocol/sdk/server/sse.js");
jest.mock("../src/server/rpc-handler");
jest.mock("../src/core/account-manager");

describe("MCP Server Integration", () => {
  let app;
  let mockMcpIntegration;
  let mockRpcHandler;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock MCP integration
    mockMcpIntegration = {
      handleRequest: jest.fn(),
      handleSSEConnection: jest.fn(),
      tools: {
        ping: { handler: jest.fn().mockResolvedValue({ content: [{ type: "text", text: "pong" }] }) },
        get_windows: { handler: jest.fn().mockResolvedValue({ content: [{ type: "text", text: "[]" }] }) },
      },
    };

    // Mock RPC handler
    mockRpcHandler = {
      handleMethod: jest.fn(),
    };

    // Mock the MCP integration module
    jest.doMock("../src/server/mcp-integration", () => mockMcpIntegration);
    jest.doMock("../src/server/rpc-handler", () => mockRpcHandler);

    // Create Express app with MCP routes
    app = express();
    app.use(express.json());

    // MCP routes
    app.post("/rpc", async (req, res) => {
      try {
        const result = await mockMcpIntegration.handleRequest(req, res);
        if (result) {
          res.json(result);
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/messages", async (req, res) => {
      try {
        await mockMcpIntegration.handleSSEConnection(req, res);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe("POST /rpc", () => {
    test("should handle valid RPC request", async () => {
      mockMcpIntegration.handleRequest.mockResolvedValue({
        jsonrpc: "2.0",
        id: 1,
        result: { content: [{ type: "text", text: "pong" }] },
      });

      const response = await request(app)
        .post("/rpc")
        .send({
          method: "ping",
          params: {},
          id: 1,
        })
        .expect(200);

      expect(response.body).toEqual({
        jsonrpc: "2.0",
        id: 1,
        result: { content: [{ type: "text", text: "pong" }] },
      });
      expect(mockMcpIntegration.handleRequest).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object)
      );
    });

    test("should handle RPC request with error", async () => {
      const error = new Error("RPC method failed");
      mockMcpIntegration.handleRequest.mockRejectedValue(error);

      const response = await request(app)
        .post("/rpc")
        .send({
          method: "unknown_method",
          params: {},
          id: 1,
        })
        .expect(500);

      expect(response.body.error).toBe("RPC method failed");
    });

    test("should handle malformed JSON", async () => {
      const response = await request(app)
        .post("/rpc")
        .send("invalid json")
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test("should handle missing required fields", async () => {
      const response = await request(app)
        .post("/rpc")
        .send({
          params: {},
        })
        .expect(200);

      // Should still reach the handler, validation happens at MCP level
      expect(mockMcpIntegration.handleRequest).toHaveBeenCalled();
    });

    test("should handle batch requests", async () => {
      mockMcpIntegration.handleRequest.mockResolvedValue({
        jsonrpc: "2.0",
        id: 1,
        result: { content: [{ type: "text", text: "pong" }] },
      });

      const batch = [
        { method: "ping", params: {}, id: 1 },
        { method: "ping", params: {}, id: 2 },
      ];

      const response = await request(app)
        .post("/rpc")
        .send(batch)
        .expect(200);

      // Each request should be handled separately
      expect(mockMcpIntegration.handleRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe("GET /messages", () => {
    test("should establish SSE connection", async () => {
      mockMcpIntegration.handleSSEConnection.mockImplementation((req, res) => {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        });
        res.write("data: connected\n\n");
        res.end();
      });

      const response = await request(app)
        .get("/messages")
        .expect(200);

      expect(response.headers["content-type"]).toContain("text/event-stream");
      expect(mockMcpIntegration.handleSSEConnection).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object)
      );
    });

    test("should handle SSE connection error", async () => {
      const error = new Error("SSE connection failed");
      mockMcpIntegration.handleSSEConnection.mockRejectedValue(error);

      const response = await request(app)
        .get("/messages")
        .expect(500);

      expect(response.body.error).toBe("SSE connection failed");
    });

    test("should handle SSE connection with query parameters", async () => {
      mockMcpIntegration.handleSSEConnection.mockImplementation((req, res) => {
        expect(req.query).toBeDefined();
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
        });
        res.end();
      });

      await request(app)
        .get("/messages?sessionId=test-session")
        .expect(200);

      expect(mockMcpIntegration.handleSSEConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { sessionId: "test-session" },
        }),
        expect.any(Object)
      );
    });
  });

  describe("MCP Tool Integration", () => {
    test("should register and call tools correctly", async () => {
      const mockToolHandler = jest.fn().mockResolvedValue({
        content: [{ type: "text", text: "Tool executed successfully" }],
      });

      // Add tool to mock MCP integration
      mockMcpIntegration.tools.test_tool = {
        handler: mockToolHandler,
      };

      // Mock the handleRequest to call the tool directly
      mockMcpIntegration.handleRequest.mockImplementation((req, res) => {
        const { method, params } = req.body;
        if (method === "tools/call" && params.name === "test_tool") {
          return mockToolHandler(params.arguments);
        }
        throw new Error("Method not found");
      });

      const response = await request(app)
        .post("/rpc")
        .send({
          method: "tools/call",
          params: {
            name: "test_tool",
            arguments: { param1: "value1" },
          },
          id: 1,
        })
        .expect(200);

      expect(mockToolHandler).toHaveBeenCalledWith({ param1: "value1" });
      expect(response.body.result).toEqual({
        content: [{ type: "text", text: "Tool executed successfully" }],
      });
    });

    test("should list available tools", async () => {
      // Mock tools list response
      mockMcpIntegration.handleRequest.mockImplementation((req, res) => {
        const { method } = req.body;
        if (method === "tools/list") {
          return {
            tools: [
              {
                name: "ping",
                description: "Check if server is responding",
                inputSchema: { type: "object", properties: {} },
              },
              {
                name: "get_windows",
                description: "Get list of all windows",
                inputSchema: { type: "object", properties: {} },
              },
            ],
          };
        }
        throw new Error("Method not found");
      });

      const response = await request(app)
        .post("/rpc")
        .send({
          method: "tools/list",
          params: {},
          id: 1,
        })
        .expect(200);

      expect(response.body.tools).toHaveLength(2);
      expect(response.body.tools[0].name).toBe("ping");
      expect(response.body.tools[1].name).toBe("get_windows");
    });
  });

  describe("Error Handling", () => {
    test("should handle timeout errors", async () => {
      mockMcpIntegration.handleRequest.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(resolve, 5000); // Longer than test timeout
        });
      });

      // This should timeout and return an error
      const response = await request(app)
        .post("/rpc")
        .send({
          method: "ping",
          params: {},
          id: 1,
        })
        .timeout(1000);

      expect(response.status).toBe(500);
    });

    test("should handle validation errors", async () => {
      mockMcpIntegration.handleRequest.mockImplementation((req) => {
        const { method, params } = req.body;
        if (method === "test_validation") {
          if (!params.required_field) {
            throw new Error("required_field is required");
          }
          return { success: true };
        }
        throw new Error("Method not found");
      });

      const response = await request(app)
        .post("/rpc")
        .send({
          method: "test_validation",
          params: {},
          id: 1,
        })
        .expect(500);

      expect(response.body.error).toBe("required_field is required");
    });

    test("should handle malformed tool parameters", async () => {
      mockMcpIntegration.handleRequest.mockImplementation((req) => {
        const { method, params } = req.body;
        if (method === "tools/call") {
          if (!params.name || !params.arguments) {
            throw new Error("Tool name and arguments are required");
          }
          return { success: true };
        }
        throw new Error("Method not found");
      });

      const response = await request(app)
        .post("/rpc")
        .send({
          method: "tools/call",
          params: {
            name: "ping",
            // Missing arguments
          },
          id: 1,
        })
        .expect(500);

      expect(response.body.error).toBe("Tool name and arguments are required");
    });
  });

  describe("Content-Type Handling", () => {
    test("should handle application/json", async () => {
      mockMcpIntegration.handleRequest.mockResolvedValue({
        jsonrpc: "2.0",
        id: 1,
        result: { success: true },
      });

      const response = await request(app)
        .post("/rpc")
        .set("Content-Type", "application/json")
        .send({
          method: "ping",
          params: {},
          id: 1,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test("should handle missing content-type", async () => {
      const response = await request(app)
        .post("/rpc")
        .send("ping")
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test("should handle unsupported content-type", async () => {
      const response = await request(app)
        .post("/rpc")
        .set("Content-Type", "text/plain")
        .send("ping")
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe("CORS and Headers", () => {
    test("should include CORS headers", async () => {
      // Add CORS middleware
      app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type");
        next();
      });

      mockMcpIntegration.handleRequest.mockResolvedValue({
        jsonrpc: "2.0",
        id: 1,
        result: { success: true },
      });

      const response = await request(app)
        .post("/rpc")
        .send({
          method: "ping",
          params: {},
          id: 1,
        })
        .expect(200);

      expect(response.headers["access-control-allow-origin"]).toBe("*");
      expect(response.headers["access-control-allow-methods"]).toBe("GET, POST, OPTIONS");
      expect(response.headers["access-control-allow-headers"]).toBe("Content-Type");
    });

    test("should handle OPTIONS requests", async () => {
      // Add OPTIONS handler
      app.options("/rpc", (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type");
        res.send(200);
      });

      const response = await request(app)
        .options("/rpc")
        .expect(200);

      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });
  });

  describe("Rate Limiting", () => {
    test("should implement basic rate limiting", async () => {
      const requestCounts = new Map();

      // Add rate limiting middleware
      app.use((req, res, next) => {
        const ip = req.ip || "127.0.0.1";
        const count = requestCounts.get(ip) || 0;
        
        if (count > 10) {
          return res.status(429).json({ error: "Too many requests" });
        }
        
        requestCounts.set(ip, count + 1);
        next();
      });

      mockMcpIntegration.handleRequest.mockResolvedValue({
        jsonrpc: "2.0",
        id: 1,
        result: { success: true },
      });

      // Make multiple requests quickly
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(
          request(app)
            .post("/rpc")
            .send({
              method: "ping",
              params: {},
              id: i,
            })
        );
      }

      const results = await Promise.all(promises);
      const rateLimitedRequests = results.filter(res => res.status === 429);
      const successfulRequests = results.filter(res => res.status === 200);

      expect(rateLimitedRequests.length).toBeGreaterThan(0);
      expect(successfulRequests.length).toBeGreaterThan(0);
    });
  });

  describe("Health Check", () => {
    test("should provide health check endpoint", async () => {
      app.get("/health", (req, res) => {
        res.json({
          status: "healthy",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        });
      });

      const response = await request(app)
        .get("/health")
        .expect(200);

      expect(response.body.status).toBe("healthy");
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });
});