# AGENTS.md - Electron MCP Browser Automation

This file contains guidelines and commands for coding agents working in this Electron MCP browser automation repository.

## Development Commands

### Electron Backend (app/)
- `cd app && npm start` - Run Electron with trace warnings (production mode)
- `cd app && npm run dev` - Run with nodemon for development with auto-restart
- `cd app && npm run hot-reload` - Start with hot reloading enabled
- `cd app && npm run build` - Build using esbuild
- `cd app && npm run prod` - Run production build
- `cd app && npm run format` - Format code with Prettier
- `cd app && npm run format:check` - Check code formatting

### React Frontend (render/)
- `cd render && npm run dev` - Start Vite dev server with hot reload
- `cd render && npm run build` - Build for production with TypeScript compilation
- `cd render && npm run lint` - Run ESLint
- `cd render && npm run preview` - Preview production build
- `cd render && npm run format` - Format code with Prettier

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
- **Prettier configured** - Use .prettierrc for formatting (semi, es5 trailing commas, 100 width)

### Frontend (TypeScript/React)
- **ES modules** - Use `import`/`export` syntax
- **Functional components** - Prefer React functional components with hooks
- **TypeScript strict** - Use strict TypeScript configuration
- **Component naming** - PascalCase for components, camelCase for hooks/utilities
- **ESLint configured** - Run `npm run lint` to check code quality

### Naming Conventions
- **Variables and functions:** `camelCase`
- **Classes:** `PascalCase`
- **Files:** `kebab-case.js` (backend), `PascalCase.tsx` (frontend)
- **Constants:** `UPPER_SNAKE_CASE`
- **Private methods:** Prefix with `_` (e.g., `_privateMethod()`)
- **React hooks:** Prefix with `use` (e.g., `useCustomHook`)

### Import/Export Patterns

**Backend (CommonJS):** Use `require()` and `module.exports`. Export managers as singleton instances.

**Frontend (ES modules):** Use `import`/`export` syntax with TypeScript types and React functional components.

### Error Handling
- **Always use try-catch blocks** for async operations
- **Provide meaningful error messages** with context
- **Log errors appropriately** - use console.error for debugging
- **Graceful degradation** - handle failures without crashing the app

### TypeScript & React Guidelines
- **Strict mode enabled** - All TypeScript files must pass strict checks
- **Functional components** - Prefer React functional components with hooks
- **Custom hooks** - Extract reusable logic into custom hooks
- **JSDoc comments** required for all public methods and classes

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

### Development Workflow
1. `npm install` in both `app/` and `render/` directories
2. `cd render && npm run dev` - Start frontend dev server
3. `cd app && npm run dev` - Start Electron backend
4. Follow code style guidelines and run lint/test commands before committing

## Changelog Workflow

### 📝 **Changelog Management**
- **Directory**: `app/changelog/`
- **Current Development**: `app/changelog/current.md` - Records ongoing work
- **Final Entries**: `app/changelog/YYYY-MM-DD_HH-MM-SS_changelog.md` - After commit

### 🔄 **Development Process**
1. **For each request/bugfix**: Update `app/changelog/current.md` with:
   - Issue description
   - Solution implemented
   - Technical changes
   - Component affected (render/app)
   - Status updates

2. **When you say "提交代码"**: I will:
   - Run `node app/commit-changes.js` which will:
     - Move `current.md` to dated filename in `app/changelog/`
     - Create new empty `current.md`
     - Git add, commit, and push to `origin mcp`

### 📊 **Watch Script**
- **Command**: `npm run watch-changelog` watches `app/changelog/*.md` changes
- **Action**: Runs `npm start` when changelog files are modified
- **Purpose**: Auto-restart development server on changelog updates

---

Remember: This is a browser automation tool with MCP integration. Prioritize stability, security, and maintainability in all code changes.