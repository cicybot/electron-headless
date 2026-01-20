/**
 * Express Server
 * Handles HTTP server setup, routes, and MCP integration
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const serveIndex = require('serve-index');

class ExpressServer {
  constructor() {
    this.app = null;
    this.server = null;
    this.rpcHandler = require('./rpc-handler');
    this.appManager = require('../core/app-manager');
    this.apiToken = this.loadOrGenerateToken();

    // Print token on startup
    console.log(`[API Token] ${this.apiToken}`);
  }

  /**
   * Load or generate a random API token
   */
  loadOrGenerateToken() {
    const tokenPath = path.join(os.homedir(), 'electron-mcp', 'token.txt');

    // Ensure directory exists
    const dir = path.dirname(tokenPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(tokenPath)) {
      // Read existing token
      return fs.readFileSync(tokenPath, 'utf8').trim();
    } else {
      // Generate new token
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');

      // Save to file
      fs.writeFileSync(tokenPath, token, 'utf8');
      return token;
    }
  }

  /**
   * Initialize and start Express server
   */
  start() {
    this.app = express();
    // Trust proxy for forwarded requests
    this.app.set('trust proxy', true);
    this.setupMiddleware();
    this.setupRoutes();
    this.startServer();

    // Start screenshot cache service
    this.startScreenshotCache();

    return this.app;
  }

  /**
   * Start screenshot cache service
   */
  startScreenshotCache() {
    try {
      const screenshotCache = require('../services/screenshot-cache-service');
      screenshotCache.start();
      console.log('[ExpressServer] Screenshot cache service started');
    } catch (error) {
      console.error('[ExpressServer] Failed to start screenshot cache:', error);
    }
  }

   /**
    * Set up Express middleware
    */
   setupMiddleware() {
     // API authentication middleware
     this.app.use(this.authMiddleware.bind(this));

      // Request logging middleware
      this.app.use((req, res, next) => {
        if (req.method !== 'OPTIONS') {
          const timestamp = new Date().toISOString();
          console.log(`[${timestamp}] ${req.method} ${req.url}`);
        }
        next();
      });

     // Enable CORS for all origins
     this.app.use(cors({ origin: '*' }));

     // Parse JSON bodies
     this.app.use(express.json({ limit: '50mb' }));
   }

  /**
   * Authentication middleware
   * Allows local requests (127.0.0.1/localhost) without token
   * Requires token for external requests
   */
  authMiddleware(req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const hostname = req.hostname;
    const host = req.get('Host') || '';
    const forwardedHost = req.get('X-Forwarded-Host') || '';

    // Check if request is from localhost/127.0.0.1
    const isLocalRequest = clientIP === '127.0.0.1' ||
                          clientIP === '::1' ||
                          clientIP === '::ffff:127.0.0.1' ||
                          hostname === 'localhost' ||
                          hostname === '127.0.0.1' ||
                          host.includes('localhost') ||
                          host.includes('127.0.0.1') ||
                          forwardedHost.includes('localhost') ||
                          forwardedHost.includes('127.0.0.1');

    if (isLocalRequest) {
      // Allow local requests without token
      return next();
    }

      // For external requests, check for token
      const authHeader = req.headers.authorization || req.headers['x-api-token'] || req.headers['token'];
      let token = null;
      if (authHeader) {
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.replace('Bearer ', '');
        } else if (authHeader.startsWith('Token ')) {
          token = authHeader.replace('Token ', '');
        } else {
          // Assume it's the raw token (for 'token' header)
          token = authHeader;
        }
      }

     if (!token) {
       return res.status(401).json({
         error: 'API token required for external requests',
         message: 'Include token in Authorization header: Bearer <token> or X-API-Token header'
       });
     }

     if (token !== this.apiToken) {
       return res.status(403).json({
         error: 'Invalid API token'
       });
     }

     // Token is valid, proceed
     next();
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

    // Token endpoint for external clients
    this.app.get('/token', (req, res) => {
      res.json({
        token: this.apiToken,
        message: 'Use this token in Authorization header: Bearer <token> or X-API-Token header'
      });
    });

     // Screenshot endpoint
     this.app.get('/windowScreenshot', this.handleScreenshot.bind(this));

      // PyAutoGUI Desktop disply Screenshot endpoint
      this.app.get('/displayScreenshot', this.handlePyAutoGUIScreenshot.bind(this));



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
     * Handle window screenshot requests
     */
   async handleScreenshot(req, res) {
     try {
       const winId = req.query.id ? Number(req.query.id) : null;
       const isLive = req.query.live === '1';
       
       if (!winId) {
         return res.status(400).json({ error: 'Window ID is required' });
       }

       const screenshotCache = require('../services/screenshot-cache-service');
       let imgBuffer;
       
       if (isLive) {
         // Live capture
         imgBuffer = await screenshotCache.captureLiveScreenshot('window', winId);
         // console.log(`[screenshot] Live screenshot captured for window ${winId}`);
       } else {
         // Cached version
         imgBuffer = await screenshotCache.getCachedScreenshot('window', winId);
         if (!imgBuffer) {
           // Fallback to live if cache not available
           imgBuffer = await screenshotCache.captureLiveScreenshot('window', winId);
           // console.log(`[screenshot] Cache miss, using live capture for window ${winId}`);
         } else {
           // console.log(`[screenshot] Cached screenshot served for window ${winId}`);
         }
       }

       res.setHeader('Content-Type', 'image/png');
       res.send(imgBuffer);
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
  async getWindowScreenshot(wc) {
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
   * Stop the Express server
   */
  stop() {
    // Stop screenshot cache service
    try {
      const screenshotCache = require('../services/screenshot-cache-service');
      screenshotCache.stop();
      console.log('[ExpressServer] Screenshot cache service stopped');
    } catch (error) {
      console.error('[ExpressServer] Failed to stop screenshot cache:', error);
    }

    if (this.server) {
      this.server.close(() => {
        console.log('[ExpressServer] Server stopped');
      });
    }
  }

  /**
   * Get Express app instance
   */
  getApp() {
    return this.app;
  }
}

module.exports = new ExpressServer();