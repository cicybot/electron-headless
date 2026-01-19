/**
 * Express Server
 * Handles HTTP server setup, routes, and MCP integration
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const serveIndex = require('serve-index');

class ExpressServer {
  constructor() {
    this.app = null;
    this.server = null;
    this.rpcHandler = require('./rpc-handler');
    this.appManager = require('../core/app-manager');
  }

  /**
   * Initialize and start the Express server
   */
  start() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.startServer();

    return this.app;
  }

   /**
    * Set up Express middleware
    */
   setupMiddleware() {
     // Request logging middleware
     this.app.use((req, res, next) => {
       const timestamp = new Date().toISOString();
       console.log(`[${timestamp}] ${req.method} ${req.url}`);
       next();
     });

     // Enable CORS for all origins
     this.app.use(cors());

     // Parse JSON bodies
     this.app.use(express.json({ limit: '50mb' }));
   }

  /**
   * Set up routes
   */
  setupRoutes() {
    const mediaDir = this.appManager.getMediaDir();

    // Static file serving for media assets
    this.app.use("/assets", express.static(mediaDir), serveIndex(mediaDir, { icons: true }));

    // Health check
    this.app.get('/', async (req, res) => {
      res.status(200).json({ message: "pong" });
    });

     // Screenshot endpoint
     this.app.get('/screenshot', this.handleScreenshot.bind(this));

      // PyAutoGUI screenshot endpoint
      this.app.get('/screen', this.handlePyAutoGUIScreenshot.bind(this));



    // Legacy RPC endpoint
    this.app.post('/rpc', this.handleRpc.bind(this));

     // MCP endpoint
     this.app.get('/mcp', this.handleMcpSSE.bind(this));
     this.app.post('/messages', this.handleMcp.bind(this));
  }

    /**
      * Handle system screenshot requests
      */
     async handlePyAutoGUIScreenshot(req, res) {
       try {
         const screenshotCache = require('../services/screenshot-cache-service');
         const isLive = req.query.live === '1';
         
         let imgBuffer;
         
         if (isLive) {
           // Live capture
           imgBuffer = await screenshotCache.captureLiveScreenshot('system');
           console.log('[screen] Live screenshot captured');
         } else {
           // Cached version
           imgBuffer = await screenshotCache.getCachedScreenshot('system');
           if (!imgBuffer) {
             // Fallback to live if cache not available
             imgBuffer = await screenshotCache.captureLiveScreenshot('system');
             console.log('[screen] Cache miss, using live capture');
           } else {
             console.log('[screen] Cached screenshot served');
           }
         }

         res.set('Content-Type', 'image/png');
         res.send(imgBuffer);
       } catch (err) {
         console.error('[screen]', err.stack);
         res.status(500).json({ error: err.message });
       }
     }

        const { base64 } = result.result;
        const imgBuffer = Buffer.from(base64, 'base64');

        res.set('Content-Type', 'image/png');
        res.send(imgBuffer);
      } catch (err) {
        console.error('[screen]', err.stack);
        res.status(500).json({ error: err.message });
      }
    }

    /**
     * Handle PyAutoGUI screenshot requests with path parameter
     */
    async handlePyAutoGUIScreenshotPath(req, res) {
      try {
        const filename = req.params.filename || 'screen.png';
        const filePath = `c:\\${filename}`;

        const result = await this.rpcHandler.handleMethod('pyautoguiScreenshot', {});
        if (!result.ok) {
          return res.status(500).json({ error: result.result });
        }

        const { base64 } = result.result;
        const imgBuffer = Buffer.from(base64, 'base64');

        // Save to file
        const fs = require('fs').promises;
        await fs.writeFile(filePath, imgBuffer);

        res.json({ message: `Screenshot saved to ${filePath}` });
      } catch (err) {
        console.error('[screenpath]', err);
        res.status(500).json({ error: err.message });
      }
    }

   /**
    * Handle screenshot requests
    */
   async handleScreenshot(req, res) {
    try {
      const winId = req.query.id ? Number(req.query.id) : null;
      const win = winId ? require('../core/window-manager').getWindow(winId) : null;

      if (!win) {
        return res.status(404).json({ error: 'Window not found' });
      }

      const scaled = await this.getScreenshot(win.webContents);
      const buffer = scaled.toPNG();
      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);
    } catch (err) {
      console.error('[screenshot]', err);
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Handle legacy RPC requests
   */
  async handleRpc(req, res) {
    const { method, params } = req.body || {};

    if (!method) {
      return res.status(400).json({ error: 'method is required' });
    }

    try {
      await this.rpcHandler.handleMethod(method, params, {
        server: { req, res }
      });
    } catch (err) {
      console.error('[rpc] error', err);
      res.status(500).json({
        ok: false,
        error: err.message
      });
    }
  }

    /**
     * Handle MCP SSE connection
     */
    async handleMcpSSE(req, res) {
      try {
        const mcpIntegration = require('./mcp-integration');
        await mcpIntegration.handleSSEConnection(req, res);
      } catch (err) {
        console.error('[mcp] SSE error', err);
        res.status(500).end();
      }
    }

    /**
     * Handle MCP requests
     */
    async handleMcp(req, res) {
      try {
        const mcpIntegration = require('./mcp-integration');
        await mcpIntegration.handleRequest(req,res);
      } catch (err) {
        console.error('[mcp] error', err);
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: err.message },
          id: req.body.id
        });
      }
    }



  /**
   * Generate screenshot from webContents
   */
  async getScreenshot(wc) {
    const screenshotService = require('../services/screenshot-service');
    return await screenshotService.captureScreenshot(wc);
  }

  /**
   * Start the HTTP server
   */
  startServer() {
    const port = process.env.PORT || 3456;
    this.server = this.app.listen(port, '0.0.0.0', () => {
      const url = `http://127.0.0.1:${port}`;
      console.log(`[express] listening on ${url}`);
    });
  }

  /**
   * Stop the server
   */
  stop() {
    if (this.server) {
      this.server.close();
    }
  }

  /**
   * Get the Express app instance
   */
  getApp() {
    return this.app;
  }
}

module.exports = new ExpressServer();