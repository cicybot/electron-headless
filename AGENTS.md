# AGENTS.md - Electron MCP Browser Automation

This file contains guidelines and commands for coding agents working in this Electron MCP browser automation repository.

## Development Commands

### Electron Backend (app/)
- `cd app && npm start` - Run Electron with trace warnings (production mode)
- `cd app && npm run dev` - Run with nodemon for development with auto-restart
- `cd app && npm run hot-reload` - Start with hot reloading enabled
- `cd app && npm run build` - Build using esbuild
- `cd app && npm run prod` - Run production build

### React Frontend (render/)
- `cd render && npm run dev` - Start Vite dev server with hot reload
- `cd render && npm run build` - Build for production with TypeScript compilation
- `cd render && npm run lint` - Run ESLint
- `cd render && npm run preview` - Preview production build

### Testing
- `cd app && npm test` - Run all Jest tests
- `cd app && npm test -- --testNamePattern="test name"` - Run single test by name
- `cd app && npm test -- tests/specific-file.test.js` - Run single test file
- `cd app && npm test -- --watch` - Run tests in watch mode

**Note:** Jest is installed in the backend. Tests are in `app/tests/` directory.

## Code Style Guidelines

### File Structure
```
app/                          # Electron main process (Node.js)
├── src/
│   ├── core/                 # Core managers (app, window, account)
│   ├── server/               # Express server and MCP handlers
│   ├── services/             # Business logic services
│   ├── utils/                # Shared utilities
│   └── main.js               # Application entry point
├── tests/                    # Jest test files
└── dist/                     # Build output (generated)

render/                       # React renderer process (TypeScript)
├── src/
│   ├── components/           # React components
│   ├── types.ts              # TypeScript type definitions
│   └── main.tsx              # React entry point
├── public/                   # Static assets
└── dist/                     # Vite build output (generated)
```

### Backend (Node.js/CommonJS)
- **CommonJS modules** - Use `require()` and `module.exports`
- **Singleton pattern** - Managers exported as instances: `module.exports = new ClassName()`
- **Class-based architecture** - Use ES6 classes with constructor patterns
- **Async/await** - All asynchronous operations must use async/await

### Frontend (TypeScript/React)
- **ES modules** - Use `import`/`export` syntax
- **Functional components** - Prefer React functional components with hooks
- **TypeScript strict** - Use strict TypeScript configuration
- **Component naming** - PascalCase for components, camelCase for hooks/utilities

### Naming Conventions
- **Variables and functions:** `camelCase`
- **Classes:** `PascalCase`
- **Files:** `kebab-case.js` (backend), `PascalCase.tsx` (frontend), `snake_case.py` (Python)
- **Constants:** `UPPER_SNAKE_CASE`
- **Private methods:** Prefix with `_` (e.g., `_privateMethod()`)
- **React hooks:** Prefix with `use` (e.g., `useCustomHook`)

### Import/Export Patterns

**Backend (CommonJS):**
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

**Frontend (ES modules):**
```typescript
// Import
import React from 'react';
import { SomeService } from '../services/some-service';
import type { UserType } from '../types';

// Export
export const MyComponent: React.FC = () => { /* ... */ };
export default MyComponent;
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

### TypeScript Guidelines
- **Strict mode enabled** - All TypeScript files must pass strict checks
- **Interface definitions** - Use interfaces for object shapes, types for unions
- **Generic constraints** - Use generics for reusable components/utilities
- **Type assertions** - Avoid `as` casts; prefer proper typing

```typescript
// Good: Proper interface definition
interface User {
  id: number;
  name: string;
  email?: string;
}

// Good: Generic component
interface Props<T> {
  data: T;
  onSelect: (item: T) => void;
}
```

### React Patterns
- **Hooks over classes** - Use functional components with hooks
- **Custom hooks** - Extract reusable logic into custom hooks
- **Context for state** - Use React Context for app-wide state
- **Memoization** - Use `React.memo`, `useMemo`, `useCallback` for performance

```typescript
// Custom hook example
const useWindowState = (windowId: string) => {
  const [isOpen, setIsOpen] = useState(false);
  // ... hook logic
  return { isOpen, toggle: () => setIsOpen(!isOpen) };
};
```

### Documentation
- **JSDoc comments** required for all public methods and classes
- **TSDoc for TypeScript** - Use TSDoc syntax in TypeScript files
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
async function captureScreenshot(windowId: string, options: ScreenshotOptions = {}): Promise<Buffer> {
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

### Testing Guidelines
- **Unit tests** for utility functions
- **Integration tests** for service interactions
- **Jest setup** with proper cleanup between tests

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
1. `npm install` in both `app/` and `render/` directories
2. `cd render && npm run dev` - Start frontend dev server
3. `cd app && npm run dev` - Start Electron backend
4. Open Electron DevTools for debugging

### Making Changes
1. **Create feature branch** for significant changes
2. **Write tests first** for new functionality
3. **Follow code style** guidelines above
4. **Run lint/typecheck** - `npm run lint` (frontend), `npm test` (backend)
5. **Build and test** both frontend and backend
6. **Test manually** in Electron environment

### Hot Reload Development
- Frontend: Vite provides automatic hot reload
- Backend: Use `npm run hot-reload` for development
- Changes to core files may require full restart

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

## Framework-Specific Notes

### Electron
- **Main process** vs **renderer process** separation
- **IPC communication** for cross-process messaging
- **Security** with context isolation enabled
- **Native APIs** for system integration

### React/TypeScript
- **Vite** for fast development and building
- **ESLint** with React and TypeScript rules
- **Strict TypeScript** configuration
- **React hooks** for state management

### Express.js/MCP
- **Middleware pattern** for request processing
- **Zod schemas** for type safety and validation
- **SSE for real-time** communication
- **Tool-based architecture** with validation

---

Remember: This is a browser automation tool with MCP integration. Prioritize stability, security, and maintainability in all code changes.