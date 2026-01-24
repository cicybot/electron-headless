# AGENTS.md - Development Guidelines for Electron MCP

## Project Overview

This is an Electron-based MCP (Model Context Protocol) application that provides browser window management, database integration, and RPC services. The codebase uses modular architecture with separate concerns for window management, database operations, and server functionality.

## Development Commands

### Build & Run
```bash
npm start              # Start the Electron application
npm run build          # Build the application (node scripts/build.js)
```

### Testing
```bash
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

#### Running Single Tests
```bash
# Run a specific test file
npx jest tests/test-electron-run.test.js

# Run tests matching a pattern
npx jest --testNamePattern="RPC /rpc responds to getWindows"

# Run tests in watch mode for a specific file
npx jest --watch tests/test-electron-run.test.js
```

### Code Quality
```bash
npm run format         # Format all JavaScript files with Prettier
npm run format:check   # Check formatting without modifying files
```

## Code Style Guidelines

### General Principles
- Use modular architecture with clear separation of concerns
- Prefer ES6+ features (async/await, destructuring, arrow functions)
- Follow consistent error handling patterns
- Use JSDoc comments for complex functions and classes

### Import Conventions
```javascript
// Core Node.js modules first
const fs = require("fs");
const path = require("path");

// Third-party dependencies
const { BrowserWindow } = require("electron");
const contextMenu = require("electron-context-menu");

// Local modules (use relative paths)
const appManager = require("./app-manager");
const { MapArray } = require("../common/utils");
```

### Formatting Rules (Prettier Configuration)
- **Semicolons**: Required (`semi: true`)
- **Quotes**: Double quotes (`singleQuote: false`)
- **Trailing Commas**: ES5 compatible (`trailingComma: "es5"`)
- **Line Width**: 100 characters (`printWidth: 100`)
- **Tabs**: 2 spaces (`tabWidth: 2`, `useTabs: false`)
- **Arrow Function Parentheses**: Always include (`arrowParens: "always"`)
- **Line Endings**: LF (`endOfLine: "lf"`)

### Naming Conventions
```javascript
// Classes: PascalCase
class WindowManager { }

// Functions and variables: camelCase
function createWindow() { }
const mainWindowId = 1;

// Constants: UPPER_SNAKE_CASE
const ELECTRON_BASE_API_URL = "http://127.0.0.1:3456";

// File names: kebab-case for utilities, camelCase for modules
// utils-node.js, window-manager.js, app-manager.js
```

### Error Handling Patterns
```javascript
// Use try-catch with async/await
async function fetchData() {
  try {
    const result = await pool.query("SELECT * FROM users");
    return result;
  } catch (error) {
    console.error("[Database] Failed to fetch users:", error);
    throw error;
  }
}

// For Promise-based operations
function fetchUser(id) {
  return pool.query("SELECT * FROM users WHERE id = ?", [id])
    .then(([rows]) => rows[0])
    .catch(error => {
      console.error("[Database] Failed to fetch user:", error);
      throw error;
    });
}
```

### Type Safety and Validation
```javascript
// Use Zod for runtime validation where applicable
const { z } = require("zod");

const userSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
});

// Validate input data
function createUser(userData) {
  const validated = userSchema.parse(userData);
  // ... proceed with validated data
}
```

### Database Operations
```javascript
// Use async/await with connection pooling
const { pool } = require("./db");

const userDB = {
  async createUser(username, email) {
    const [result] = await pool.query(
      "INSERT INTO users (username, email) VALUES (?, ?)",
      [username, email]
    );
    return result.insertId;
  },

  async getUsers() {
    const [rows] = await pool.query("SELECT * FROM users");
    return rows;
  }
};
```

### Electron-Specific Patterns
```javascript
// Browser window management
class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.windowSites = new Map();
  }

  createWindow(options = {}) {
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        // ... other security options
      },
      ...options
    });
    
    return win;
  }
}

// Event handling with proper cleanup
app.on("browser-window-created", (event, win) => {
  win.webContents.on("did-finish-load", async () => {
    console.log(`[WindowManager] Window ${win.id} finished loading`);
  });
  
  win.on("closed", () => {
    console.log(`[WindowManager] Window ${win.id} closed`);
    // Cleanup resources
  });
});
```

### Logging Conventions
```javascript
// Use structured logging with context tags
console.log("[WindowManager] Creating new window:", options);
console.error("[Database] Connection failed:", error.message);
console.warn("[AppManager] Deprecated API used:", methodName);

// For debugging, use conditional logging
if (process.env.NODE_ENV === "development") {
  console.log("[Debug] Detailed information:", debugInfo);
}
```

### Testing Guidelines
```javascript
// Test files should be in tests/ directory with .test.js extension
// Use Jest with node environment
describe("Window Manager functionality", () => {
  test("should create window with correct options", async () => {
    const windowManager = new WindowManager();
    const window = windowManager.createWindow({ width: 800 });
    
    expect(window.getBounds().width).toBe(800);
  });
});
```

## Architecture Notes

### Module Structure
```
src/
├── main.js              # Application entry point
├── core/                # Core application logic
├── server/              # Express server and RPC handlers
├── db/                  # Database models and operations
├── browser/             # Browser-related functionality
├── services/            # Business logic services
├── common/              # Shared utilities
└── helpers.js           # Helper functions
```

### Key Dependencies
- **Electron**: Desktop application framework
- **Express**: HTTP server for RPC API
- **MySQL2**: Database driver with async/await support
- **Zod**: Runtime type validation
- **Jest**: Testing framework
- **Prettier**: Code formatting

### Security Considerations
- Use `contextIsolation: true` and `nodeIntegration: false` in webPreferences
- Validate all user input with Zod schemas
- Use parameterized queries for database operations
- Handle authentication tokens securely

## Common Patterns

### RPC Method Structure
```javascript
// In rpc-handler.js
async function handleRpcCall(method, params) {
  try {
    switch (method) {
      case "getWindows":
        return await windowManager.getWindows();
      case "runCode":
        return await windowManager.runCode(params.win_id, params.code);
      default:
        throw new Error(`Unknown RPC method: ${method}`);
    }
  } catch (error) {
    console.error(`[RPC] Error in ${method}:`, error);
    return { ok: false, error: error.message };
  }
}
```

### Resource Cleanup
```javascript
// Always clean up resources in shutdown handlers
async function shutdown() {
  this.isShuttingDown = true;
  
  // Clear intervals
  if (this.autoSaveInterval) {
    clearInterval(this.autoSaveInterval);
  }
  
  // Close database connections
  await pool.end();
  
  // Close all windows
  for (const win of BrowserWindow.getAllWindows()) {
    win.close();
  }
}
```

This AGENTS.md file provides comprehensive guidelines for working with the Electron MCP codebase while maintaining consistency and quality across the project.