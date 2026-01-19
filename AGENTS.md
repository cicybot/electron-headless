# AGENTS.md - Electron MCP Browser Automation

This file contains guidelines and commands for coding agents working in this Electron MCP browser automation repository.

## Development Commands

### Core Commands
- `npm start` - Run Electron with trace warnings (production mode)
- `npm run dev` - Run with nodemon for development with auto-restart
- `npm run hot-reload` - Start with hot reloading enabled
- `npm run build` - Build the application using esbuild
- `npm run prod` - Run production build
- `npm run hot-push` - Auto-commit and push changes (use with caution)

### Testing
- `npm test` - Run all Jest tests
- `npm test -- --testNamePattern="test name"` - Run single test by name
- `npm test -- tests/specific-file.test.js` - Run single test file
- `npm test -- --watch` - Run tests in watch mode

**Note:** Jest is installed but uses minimal configuration. Tests are in the `tests/` directory.

## Code Style Guidelines

### File Structure
```
app/
├── src/
│   ├── core/          # Core managers (app, window, account)
│   ├── server/        # Express server and API handlers
│   ├── services/      # Business logic services
│   ├── utils/         # Shared utilities
│   ├── py/           # Python automation scripts
│   └── main.js       # Application entry point
├── tests/            # Jest test files
└── dist/             # Build output (generated)
```

### Module Patterns
- **CommonJS modules** - Use `require()` and `module.exports`
- **Singleton pattern** - Managers are exported as instances: `module.exports = new ClassName()`
- **Class-based architecture** - Use ES6 classes with constructor patterns
- **Async/await** - All asynchronous operations must use async/await

### Naming Conventions
- **Variables and functions:** `camelCase`
- **Classes:** `PascalCase`
- **Files:** `kebab-case.js` for JavaScript, `snake_case.py` for Python
- **Constants:** `UPPER_SNAKE_CASE`
- **Private methods:** Prefix with `_` (e.g., `_privateMethod()`)

### Import/Export Patterns
```javascript
// Import
const SomeService = require('../services/some-service');
const { extractFunction } = require('../utils/helpers');

// Export (singleton pattern)
class SomeManager {
  constructor() {
    // initialization
  }
}
module.exports = new SomeManager();
```

### Error Handling
- **Always use try-catch blocks** for async operations
- **Provide meaningful error messages** with context
- **Log errors appropriately** - use console.error for debugging
- **Graceful degradation** - handle failures without crashing the app

```javascript
try {
  const result = await someOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error.message);
  throw new Error(`Failed to complete operation: ${error.message}`);
}
```

### Documentation
- **JSDoc comments** required for all public methods and classes
- **Document parameters** and return types
- **Include usage examples** for complex methods

```javascript
/**
 * Performs screenshot capture on specified window
 * @param {string} windowId - Window identifier
 * @param {Object} options - Screenshot options
 * @param {string} options.format - Image format ('png', 'jpeg')
 * @returns {Promise<Buffer>} Screenshot image buffer
 */
async function captureScreenshot(windowId, options = {}) {
  // implementation
}
```

## Architecture Guidelines

### Core Principles
1. **Account Isolation** - All operations must be account-aware
2. **Window Management** - Use WindowManager for browser window lifecycle
3. **Service Separation** - Keep business logic in services, not in managers
4. **MCP Integration** - All AI operations go through RPC handler
5. **Validation** - Use Zod schemas for input validation in MCP tools

### MCP Tool Development
When creating new MCP tools:
1. **Define Zod schema** for input validation
2. **Implement in RPC handler** - register in `rpc-handler.js`
3. **Use account manager** - get account context via `accountManager.getAccount(id)`
4. **Return structured data** - follow existing response patterns
5. **Handle errors gracefully** - return error objects, don't throw

### Database Patterns
- **Use MySQL2** for database operations
- **Connection pooling** - manage connections efficiently
- **Parameterized queries** - prevent SQL injection
- **Transaction support** - use transactions for multi-step operations

### Window Management
- **Account-based isolation** - each account gets separate browser session
- **Partition management** - use Chrome partitions for session isolation
- **Lifecycle management** - proper cleanup of windows and resources
- **Network monitoring** - track requests per window/account

## Python Integration

### Python Scripts
- Located in `src/py/` directory
- Use **PyAutoGUI** for desktop automation
- **Named with snake_case** (e.g., `automation_script.py`)
- **Called via child_process** from Node.js

### Integration Pattern
```javascript
const { execFile } = require('child_process');
const path = require('path');

async function runPythonScript(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../py', scriptName);
    execFile('python', [scriptPath, ...args], (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}
```

## Testing Guidelines

### Test Structure
- **Unit tests** for utility functions
- **Integration tests** for service interactions
- **End-to-end tests** for complete workflows
- **Playground scripts** for manual testing

### Test Patterns
```javascript
describe('SomeService', () => {
  beforeEach(() => {
    // setup
  });

  afterEach(() => {
    // cleanup
  });

  it('should perform operation correctly', async () => {
    const result = await someService.someOperation();
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
```

## Development Workflow

### Getting Started
1. `npm install` - Install dependencies
2. `npm run build` - Build the application
3. `npm run dev` - Start development server
4. Open Electron DevTools for debugging

### Making Changes
1. **Create feature branch** for significant changes
2. **Write tests first** for new functionality
3. **Follow code style** guidelines above
4. **Run tests** to ensure nothing breaks
5. **Build project** to verify compilation
6. **Test manually** in Electron environment

### Hot Reload Development
- Use `npm run hot-reload` for development
- Changes to core files may require full restart
- Python scripts require manual restart

## Common Pitfalls

### Avoid These
- **Mixing Node.js and browser code** - know your execution context
- **Blocking the main thread** - keep operations async
- **Memory leaks** - properly clean up windows and listeners
- **Global state** - use managers and proper encapsulation
- **Hardcoded paths** - use path.join() for cross-platform compatibility

### Security Considerations
- **Validate all inputs** - especially from external sources
- **Sanitize file paths** - prevent directory traversal
- **Handle secrets properly** - never log sensitive data
- **Use secure defaults** - disable dangerous features by default

## Build and Deployment

### Build Process
- **esbuild** handles JavaScript bundling
- **Targets:** Node.js environment
- **Outputs:** `dist/main.js`, `dist/content.js`
- **Cross-platform** compatibility maintained

### Production Considerations
- **Environment variables** for configuration
- **Error logging** for production debugging
- **Resource cleanup** on app shutdown
- **Graceful shutdown** handling

## Framework-Specific Notes

### Electron
- **Main process** vs **renderer process** separation
- **IPC communication** for cross-process messaging
- **Security** with context isolation enabled
- **Native APIs** for system integration

### Express.js
- **Middleware pattern** for request processing
- **CORS enabled** for cross-origin requests
- **JSON parsing** for API communication
- **Error handling** middleware

### MCP Integration
- **SSE for real-time** communication
- **Tool-based architecture** with validation
- **Account isolation** for multi-tenancy
- **Zod schemas** for type safety

## Debugging Tips

### Electron DevTools
- Use `Ctrl+Shift+I` (or `Cmd+Option+I`) to open DevTools
- Console logging for runtime debugging
- Network tab for HTTP request debugging
- Sources tab for code stepping

### Common Debugging Patterns
- **Add console.log** statements for flow tracing
- **Use debugger** statements for breakpoints
- **Check error objects** for full stack traces
- **Verify async operations** with proper await usage

---

Remember: This is a browser automation tool with MCP integration. Prioritize stability, security, and maintainability in all code changes.