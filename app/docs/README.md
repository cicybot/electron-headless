# Modular Architecture

This document describes the modular architecture of the Electron Headless Browser application.

## Directory Structure

```
src/
├── core/                    # Core application components
│   ├── app-manager.js       # Main app lifecycle and global state
│   ├── window-manager.js    # Window creation and management
│   └── account-manager.js   # Account isolation logic
├── server/                  # HTTP server and API components
│   ├── express-server.js    # Express server setup and routes
│   ├── rpc-handler.js       # RPC method routing and handling
│   └── mcp-integration.js   # MCP server integration
├── services/                # Business logic services
│   ├── screenshot-cache-service.js # Screenshot caching and processing
│   └── network-monitor.js   # Network request tracking
├── utils/                   # Shared utilities
│   ├── utils.js            # General utilities
│   ├── utils-node.js       # Node.js specific utilities
│   ├── utils-browser.js    # Browser-side utilities
│   └── helpers.js          # Helper functions
├── extension/              # Chrome extension files
├── content-inject.js      # Content scripts (runs in browser)
├── main.js                # Application entry point
└── index.js               # Module exports
```

## Module Responsibilities

### Core Modules

#### `app-manager.js`
- Manages global application state
- Handles app lifecycle events
- Provides system information
- Manages media directories

#### `window-manager.js`
- Creates and manages browser windows
- Handles window events and lifecycle
- Manages window state tracking
- Provides window lookup and control

#### `account-manager.js`
- Manages account isolation contexts
- Handles account switching
- Validates account permissions
- Manages resource sharing rules

### Server Modules

#### `express-server.js`
- Sets up Express HTTP server
- Configures middleware and routes
- Handles HTTP requests and responses
- Integrates MCP endpoints

#### `rpc-handler.js`
- Routes RPC method calls to appropriate handlers
- Provides unified interface for all operations
- Handles error responses and logging
- Manages method permissions and validation

#### `mcp-integration.js`
- Implements MCP (Model Context Protocol) server
- Provides Playwright-style automation tools
- Handles MCP request/response protocol
- Manages tool definitions and execution

### Service Modules

#### `screenshot-cache-service.js`
- Multi-threaded caching system for screenshots
- Captures screenshots from browser windows and desktop
- Handles image processing and Mac-specific scaling
- Manages screenshot caching and compression

#### `network-monitor.js`
- Tracks HTTP requests and responses
- Provides request filtering and analysis
- Supports multiple export formats (JSON, CSV, HAR)
- Manages request statistics and insights

## Data Flow

1. **HTTP Request** → Express Server → RPC Handler
2. **RPC Handler** → Core Managers/Services → Browser Operations
3. **Results** → RPC Handler → HTTP Response
4. **MCP Requests** → MCP Integration → Same Core Logic

## Environment Separation

### Node.js Environment (Main Process)
- `app-manager.js`
- `window-manager.js`
- `express-server.js`
- `rpc-handler.js`
- `services/*.js`
- `utils.js`
- `utils-node.js`
- `helpers.js`

### Browser Environment (Renderer Process)
- `utils-browser.js`
- Content scripts in `content-inject.js`
- Chrome extension files

## Key Benefits

### Maintainability
- Single responsibility per module
- Clear separation of concerns
- Easy to test individual components
- Simplified debugging and development

### Scalability
- Easy to add new features/services
- Modular architecture supports growth
- Clear interfaces between components
- Independent deployment of modules

### Testability
- Each module can be unit tested independently
- Mock dependencies for isolated testing
- Clear input/output contracts
- Easy integration testing

### Code Reuse
- Services can be used by both RPC and MCP interfaces
- Browser utilities shared across contexts
- Common patterns abstracted into utilities

## Usage Examples

### Creating a Window
```javascript
const { WindowManager } = require('./core/window-manager');
const win = await WindowManager.createWindow(1, 'https://example.com');
```

### Taking a Screenshot
```javascript
const { ScreenshotCacheService } = require('./services/screenshot-cache-service');
const image = await ScreenshotCacheService.captureWindowLive(windowId);
```

### Handling RPC Calls
```javascript
const { RPCHandler } = require('./server/rpc-handler');
const result = await RPCHandler.handleMethod('openWindow', { url: 'https://example.com' });
```

### MCP Tool Usage
```javascript
const { McpIntegration } = require('./server/mcp-integration');
// MCP server handles tool calls automatically
```

## Future Extensions

### Additional Services
- Performance monitoring service
- Cookie/session management service
- File download service
- Device emulation service

### New Interfaces
- WebSocket API
- GraphQL API
- REST API endpoints
- CLI interface

### Enhanced Features
- Multi-browser support
- Cloud deployment options
- Advanced automation workflows
- Machine learning integrations