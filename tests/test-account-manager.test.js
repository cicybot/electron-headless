/**
 * Account Manager Unit Tests
 * Tests for account isolation and window management
 */

const AccountManager = require("../src/core/account-manager");
const WindowManager = require("../src/core/window-manager");

// Mock dependencies
jest.mock("electron");
jest.mock("../src/core/storage-manager");
jest.mock("../src/core/app-manager");

describe("Account Manager", () => {
  let accountManager;
  let mockWindowManager;
  let mockStorageManager;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock window manager
    mockWindowManager = {
      getWindow: jest.fn(),
      getWindows: jest.fn(),
      createWindow: jest.fn(),
      closeWindow: jest.fn(),
    };

    // Mock storage manager
    mockStorageManager = {
      getAccountData: jest.fn(),
      saveAccountData: jest.fn(),
    };

    // Mock require calls
    jest.doMock("../src/core/window-manager", () => mockWindowManager);
    jest.doMock("../src/core/storage-manager", () => mockStorageManager);

    // Import fresh instance
    delete require.cache[require.resolve("../src/core/account-manager")];
    accountManager = new AccountManager();
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe("Constructor", () => {
    test("should initialize with default values", () => {
      expect(accountManager.currentAccountIndex).toBe(0);
      expect(accountManager.accountWindows).toBeInstanceOf(Map);
    });
  });

  describe("Account Validation", () => {
    test("should validate window belongs to account", () => {
      // Setup: window 1 belongs to account 0
      accountManager.accountWindows.set(0, new Set([1]));
      accountManager.accountWindows.set(1, new Set([2, 3]));

      expect(accountManager.validateWindowAccount(1, 0)).toBe(true);
      expect(accountManager.validateWindowAccount(2, 1)).toBe(true);
      expect(accountManager.validateWindowAccount(3, 1)).toBe(true);
    });

    test("should reject when window does not belong to account", () => {
      // Setup: window 1 belongs to account 0
      accountManager.accountWindows.set(0, new Set([1]));

      expect(accountManager.validateWindowAccount(1, 1)).toBe(false);
      expect(accountManager.validateWindowAccount(2, 0)).toBe(false);
    });

    test("should handle undefined account_windows map", () => {
      expect(accountManager.validateWindowAccount(1, 0)).toBe(false);
    });
  });

  describe("Account Switching", () => {
    test("should switch to valid account", async () => {
      const mockWindows = { "1": { id: 1, account: 1 }, "2": { id: 2, account: 1 } };
      mockWindowManager.getWindows.mockReturnValue(mockWindows);

      await accountManager.switchAccount(1);

      expect(accountManager.currentAccountIndex).toBe(1);
      expect(mockStorageManager.saveAccountData).toHaveBeenCalledWith(1);
    });

    test("should initialize account windows map on switch", async () => {
      const mockWindows = { "1": { id: 1, account: 2 }, "2": { id: 2, account: 2 } };
      mockWindowManager.getWindows.mockReturnValue(mockWindows);

      await accountManager.switchAccount(2);

      expect(accountManager.accountWindows.has(2)).toBe(true);
      const accountWindows = accountManager.accountWindows.get(2);
      expect(accountWindows.has(1)).toBe(true);
      expect(accountWindows.has(2)).toBe(true);
    });

    test("should handle account switching errors", async () => {
      const error = new Error("Switch failed");
      mockWindowManager.getWindows.mockImplementation(() => {
        throw error;
      });

      await expect(accountManager.switchAccount(1)).rejects.toThrow("Switch failed");
    });
  });

  describe("Account Information", () => {
    test("should get account info for window", () => {
      // Setup
      accountManager.accountWindows.set(0, new Set([1, 2]));
      accountManager.accountWindows.set(1, new Set([3]));

      const result = accountManager.getAccountInfo(1);

      expect(result.account_index).toBe(0);
      expect(result.windows).toEqual([1, 2]);
    });

    test("should handle window not found in any account", () => {
      // Setup
      accountManager.accountWindows.set(0, new Set([1]));

      const result = accountManager.getAccountInfo(2);

      expect(result.account_index).toBe(-1);
      expect(result.windows).toEqual([]);
    });

    test("should get account windows", () => {
      // Setup
      accountManager.accountWindows.set(1, new Set([3, 4, 5]));

      const result = accountManager.getAccountWindows(1);

      expect(result).toEqual([3, 4, 5]);
    });

    test("should handle non-existent account", () => {
      const result = accountManager.getAccountWindows(999);

      expect(result).toEqual([]);
    });
  });

  describe("Window Assignment", () => {
    test("should assign window to account", () => {
      accountManager.assignWindowToAccount(1, 0);

      const accountWindows = accountManager.accountWindows.get(0);
      expect(accountWindows.has(1)).toBe(true);
    });

    test("should create new account entry if not exists", () => {
      accountManager.assignWindowToAccount(1, 5);

      expect(accountManager.accountWindows.has(5)).toBe(true);
      const accountWindows = accountManager.accountWindows.get(5);
      expect(accountWindows.has(1)).toBe(true);
    });

    test("should remove window from account", () => {
      // Setup
      accountManager.accountWindows.set(0, new Set([1, 2]));

      accountManager.removeWindowFromAccount(1, 0);

      const accountWindows = accountManager.accountWindows.get(0);
      expect(accountWindows.has(1)).toBe(false);
      expect(accountWindows.has(2)).toBe(true);
    });

    test("should handle removing from non-existent account", () => {
      expect(() => {
        accountManager.removeWindowFromAccount(1, 999);
      }).not.toThrow();
    });
  });
});

describe("Window Manager Integration", () => {
  let windowManager;
  let mockAccountManager;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock account manager
    mockAccountManager = {
      currentAccountIndex: 0,
      validateWindowAccount: jest.fn(),
      assignWindowToAccount: jest.fn(),
      removeWindowFromAccount: jest.fn(),
    };

    // Mock Electron
    const mockElectron = {
      BrowserWindow: {
        fromId: jest.fn(),
        getAllWindows: jest.fn(),
      },
    };

    // Mock require calls
    jest.doMock("electron", () => mockElectron);
    jest.doMock("../src/core/account-manager", () => mockAccountManager);

    // Import fresh instance
    delete require.cache[require.resolve("../src/core/window-manager")];
    windowManager = new WindowManager();
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe("Window Creation with Account Context", () => {
    test("should create window and assign to account", async () => {
      const mockWindow = {
        id: 1,
        loadURL: jest.fn(),
        on: jest.fn(),
        webContents: { id: 2 },
      };

      const { BrowserWindow } = require("electron");
      BrowserWindow.mockReturnValue(mockWindow);

      const result = await windowManager.createWindow({
        url: "https://example.com",
        account_index: 1,
      });

      expect(mockAccountManager.assignWindowToAccount).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(mockWindow);
    });

    test("should create window without account context", async () => {
      const mockWindow = {
        id: 1,
        loadURL: jest.fn(),
        on: jest.fn(),
        webContents: { id: 2 },
      };

      const { BrowserWindow } = require("electron");
      BrowserWindow.mockReturnValue(mockWindow);

      const result = await windowManager.createWindow({
        url: "https://example.com",
      });

      expect(mockAccountManager.assignWindowToAccount).toHaveBeenCalledWith(1, 0);
      expect(result).toBe(mockWindow);
    });
  });

  describe("Window Operations with Account Validation", () => {
    test("should validate account before window operations", async () => {
      mockAccountManager.validateWindowAccount.mockReturnValue(true);
      const mockWindow = { id: 1, webContents: { id: 2 } };
      windowManager.windowSites.set(0, new Map([["https://example.com", { id: 1, wcId: 2, win: mockWindow }]]));

      await windowManager.sendInputEvent(1, { type: "click" }, 0);

      expect(mockAccountManager.validateWindowAccount).toHaveBeenCalledWith(1, 0);
    });

    test("should reject operations for wrong account", async () => {
      mockAccountManager.validateWindowAccount.mockReturnValue(false);

      await expect(
        windowManager.sendInputEvent(1, { type: "click" }, 1)
      ).rejects.toThrow("Window 1 does not belong to account 1");
    });
  });

  describe("Window Cleanup", () => {
    test("should remove window from account on close", async () => {
      const mockWindow = {
        id: 1,
        webContents: { id: 2 },
        destroy: jest.fn(),
      };
      windowManager.windowSites.set(0, new Map([["https://example.com", { id: 1, wcId: 2, win: mockWindow }]]));

      await windowManager.closeWindow(1);

      expect(mockAccountManager.removeWindowFromAccount).toHaveBeenCalledWith(1, expect.any(Number));
      expect(mockWindow.destroy).toHaveBeenCalled();
    });
  });

  describe("Account Isolation", () => {
    test("should maintain separate window contexts per account", () => {
      // Simulate windows in different accounts
      windowManager.windowSites.set(0, new Map([["site1", { id: 1, wcId: 1, win: {} }]]));
      windowManager.windowSites.set(1, new Map([["site2", { id: 2, wcId: 2, win: {} }]]));

      const account0Windows = windowManager.windowSites.get(0);
      const account1Windows = windowManager.windowSites.get(1);

      expect(account0Windows.size).toBe(1);
      expect(account1Windows.size).toBe(1);
      expect(account0Windows.has("site1")).toBe(true);
      expect(account1Windows.has("site2")).toBe(true);
      expect(account0Windows.has("site2")).toBe(false);
      expect(account1Windows.has("site1")).toBe(false);
    });

    test("should not mix windows between accounts", () => {
      // Add windows to different accounts
      windowManager.accountWindowIds = new Map([
        [0, [1, 2]],
        [1, [3, 4]],
      ]);

      const account0Windows = windowManager.getAccountWindows(0);
      const account1Windows = windowManager.getAccountWindows(1);

      expect(account0Windows).toEqual([1, 2]);
      expect(account1Windows).toEqual([3, 4]);
    });
  });
});

describe("Account-Window Integration Tests", () => {
  let accountManager;
  let windowManager;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create instances that work together
    const mockElectron = {
      BrowserWindow: {
        fromId: jest.fn(),
        getAllWindows: jest.fn(),
      },
    };

    jest.doMock("electron", () => mockElectron);
    
    delete require.cache[require.resolve("../src/core/account-manager")];
    delete require.cache[require.resolve("../src/core/window-manager")];
    
    accountManager = new AccountManager();
    windowManager = new WindowManager();
    
    // Connect them
    windowManager.accountManager = accountManager;
    accountManager.windowManager = windowManager;
  });

  test("should maintain account isolation across operations", async () => {
    // Create windows in different accounts
    const mockWindow1 = { id: 1, webContents: { id: 1 } };
    const mockWindow2 = { id: 2, webContents: { id: 2 } };

    // Simulate window creation with account assignment
    accountManager.assignWindowToAccount(1, 0);
    accountManager.assignWindowToAccount(2, 1);

    // Test validation
    expect(accountManager.validateWindowAccount(1, 0)).toBe(true);
    expect(accountManager.validateWindowAccount(2, 1)).toBe(true);
    expect(accountManager.validateWindowAccount(1, 1)).toBe(false);
    expect(accountManager.validateWindowAccount(2, 0)).toBe(false);
  });

  test("should handle account switching correctly", async () => {
    // Setup windows in different accounts
    accountManager.assignWindowToAccount(1, 0);
    accountManager.assignWindowToAccount(2, 0);
    accountManager.assignWindowToAccount(3, 1);

    // Switch accounts
    const mockWindows = { "1": { id: 1, account: 1 }, "2": { id: 2, account: 1 } };
    windowManager.getWindows = jest.fn().mockReturnValue(mockWindows);
    accountManager.saveAccountData = jest.fn();

    await accountManager.switchAccount(1);

    expect(accountManager.currentAccountIndex).toBe(1);
  });

  test("should maintain window state during account operations", () => {
    // Test that window state is preserved
    accountManager.assignWindowToAccount(1, 0);
    accountManager.assignWindowToAccount(2, 0);

    const account0Windows = accountManager.getAccountWindows(0);
    expect(account0Windows).toContain(1);
    expect(account0Windows).toContain(2);

    // Remove one window
    accountManager.removeWindowFromAccount(1, 0);

    const updatedWindows = accountManager.getAccountWindows(0);
    expect(updatedWindows).not.toContain(1);
    expect(updatedWindows).toContain(2);
  });
});