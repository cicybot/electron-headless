/**
 * RPC Handler Unit Tests
 * Tests for RPC method handling and routing
 */

const RPCHandler = require("../src/server/rpc-handler");

// Mock dependencies
jest.mock("../src/helpers");
jest.mock("../src/common/utils-node");
jest.mock("../src/services/screenshot-cache-service");

// Mock Electron
const mockElectron = {
  BrowserWindow: {
    fromId: jest.fn(),
    getAllWindows: jest.fn(),
  },
  screen: {
    getPrimaryDisplay: jest.fn(),
  },
  app: {
    getPath: jest.fn(),
  },
};

// Mock the core modules
const mockAppManager = {
  getMainWindow: jest.fn(),
  openTerminal: jest.fn(),
  getAppInfo: jest.fn(),
};

const mockWindowManager = {
  getWindow: jest.fn(),
  getWebContents: jest.fn(),
  createWindow: jest.fn(),
  closeWindow: jest.fn(),
  showWindow: jest.fn(),
  hideWindow: jest.fn(),
  getWindows: jest.fn(),
  reload: jest.fn(),
  getBounds: jest.fn(),
  setBounds: jest.fn(),
  getWindowSize: jest.fn(),
  setWindowSize: jest.fn(),
  setWindowWidth: jest.fn(),
  setWindowPosition: jest.fn(),
  sendInputEvent: jest.fn(),
  sendElectronClick: jest.fn(),
  sendElectronPressEnter: jest.fn(),
  writeClipboard: jest.fn(),
  showFloatDiv: jest.fn(),
  hideFloatDiv: jest.fn(),
  sendElectronPaste: jest.fn(),
  importCookies: jest.fn(),
  exportCookies: jest.fn(),
  captureScreenshot: jest.fn(),
  saveScreenshot: jest.fn(),
  getScreenshotInfo: jest.fn(),
  captureSystemScreenshot: jest.fn(),
  saveSystemScreenshot: jest.fn(),
  getDisplayScreenSize: jest.fn(),
  displayScreenshot: jest.fn(),
  getWindowScreenshot: jest.fn(),
  switchAccount: jest.fn(),
  getAccountInfo: jest.fn(),
  getAccountWindows: jest.fn(),
  loadURL: jest.fn(),
  getURL: jest.fn(),
  getTitle: jest.fn(),
  executeJavaScript: jest.fn(),
  openDevTools: jest.fn(),
  setUserAgent: jest.fn(),
  getWindowState: jest.fn(),
  getRequests: jest.fn(),
  clearRequests: jest.fn(),
  downloadMedia: jest.fn(),
  getSubTitles: jest.fn(),
  ping: jest.fn(),
  info: jest.fn(),
  methods: jest.fn(),
};

const mockAccountManager = {
  validateWindowAccount: jest.fn(),
  switchAccount: jest.fn(),
  getAccountInfo: jest.fn(),
  getAccountWindows: jest.fn(),
};

describe("RPC Handler", () => {
  let rpcHandler;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock require calls
    jest.doMock("../src/core/app-manager", () => mockAppManager);
    jest.doMock("../src/core/window-manager", () => mockWindowManager);
    jest.doMock("../src/core/account-manager", () => mockAccountManager);

    // Import fresh instance
    delete require.cache[require.resolve("../src/server/rpc-handler")];
    rpcHandler = new RPCHandler();
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe("Constructor", () => {
    test("should initialize with correct dependencies", () => {
      expect(rpcHandler.appManager).toBeDefined();
      expect(rpcHandler.windowManager).toBeDefined();
      expect(rpcHandler.accountManager).toBeDefined();
    });
  });

  describe("Method Routing", () => {
    describe("System Methods", () => {
      test("should handle ping method", async () => {
        mockWindowManager.ping.mockReturnValue("pong");

        const result = await rpcHandler.handleMethod("ping", {});

        expect(result.ok).toBe(true);
        expect(result.result).toBe("pong");
      });

      test("should handle info method", async () => {
        const mockInfo = { version: "1.0.0", uptime: 3600 };
        mockAppManager.getAppInfo.mockReturnValue(mockInfo);

        const result = await rpcHandler.handleMethod("info", {});

        expect(result.ok).toBe(true);
        expect(result.result).toBe(mockInfo);
      });

      test("should handle methods method", async () => {
        const mockMethods = ["ping", "info", "getWindows"];
        mockWindowManager.methods.mockReturnValue(mockMethods);

        const result = await rpcHandler.handleMethod("methods", {});

        expect(result.ok).toBe(true);
        expect(result.result).toBe(mockMethods);
      });

      test("should handle openTerminal method", async () => {
        const mockTerminalResult = { pid: 12345 };
        mockAppManager.openTerminal.mockResolvedValue(mockTerminalResult);

        const result = await rpcHandler.handleMethod("openTerminal", {
          command: "ls -la",
          showWin: true,
        });

        expect(mockAppManager.openTerminal).toHaveBeenCalledWith({
          command: "ls -la",
          showWin: true,
        });
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockTerminalResult);
      });
    });

    describe("Window Management Methods", () => {
      test("should handle openWindow method", async () => {
        const mockWindow = { id: 1, url: "https://example.com" };
        mockWindowManager.createWindow.mockResolvedValue(mockWindow);

        const result = await rpcHandler.handleMethod("openWindow", {
          url: "https://example.com",
          account_index: 0,
        });

        expect(mockWindowManager.createWindow).toHaveBeenCalledWith({
          url: "https://example.com",
          account_index: 0,
        });
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockWindow);
      });

      test("should handle getWindows method", async () => {
        const mockWindows = { "1": { id: 1, title: "Test Window" } };
        mockWindowManager.getWindows.mockReturnValue(mockWindows);

        const result = await rpcHandler.handleMethod("getWindows", {});

        expect(mockWindowManager.getWindows).toHaveBeenCalled();
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockWindows);
      });

      test("should handle closeWindow method", async () => {
        mockWindowManager.closeWindow.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("closeWindow", {
          win_id: 1,
        });

        expect(mockWindowManager.closeWindow).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
      });

      test("should handle showWindow method", async () => {
        mockWindowManager.showWindow.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("showWindow", {
          win_id: 1,
        });

        expect(mockWindowManager.showWindow).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
      });

      test("should handle hideWindow method", async () => {
        mockWindowManager.hideWindow.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("hideWindow", {
          win_id: 1,
        });

        expect(mockWindowManager.hideWindow).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
      });

      test("should handle reload method", async () => {
        mockWindowManager.reload.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("reload", {
          win_id: 1,
        });

        expect(mockWindowManager.reload).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
      });

      test("should handle getBounds method", async () => {
        const mockBounds = { x: 100, y: 200, width: 800, height: 600 };
        mockWindowManager.getBounds.mockReturnValue(mockBounds);

        const result = await rpcHandler.handleMethod("getBounds", {
          win_id: 1,
        });

        expect(mockWindowManager.getBounds).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockBounds);
      });

      test("should handle setBounds method", async () => {
        const bounds = { x: 100, y: 200, width: 800, height: 600 };
        mockWindowManager.setBounds.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("setBounds", {
          win_id: 1,
          bounds,
        });

        expect(mockWindowManager.setBounds).toHaveBeenCalledWith(1, bounds);
        expect(result.ok).toBe(true);
      });

      test("should handle getWindowSize method", async () => {
        const mockSize = { width: 800, height: 600 };
        mockWindowManager.getWindowSize.mockReturnValue(mockSize);

        const result = await rpcHandler.handleMethod("getWindowSize", {
          win_id: 1,
        });

        expect(mockWindowManager.getWindowSize).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockSize);
      });

      test("should handle setWindowSize method", async () => {
        mockWindowManager.setWindowSize.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("setWindowSize", {
          win_id: 1,
          width: 800,
          height: 600,
        });

        expect(mockWindowManager.setWindowSize).toHaveBeenCalledWith(1, 800, 600);
        expect(result.ok).toBe(true);
      });

      test("should handle setWindowWidth method", async () => {
        mockWindowManager.setWindowWidth.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("setWindowWidth", {
          win_id: 1,
          width: 800,
        });

        expect(mockWindowManager.setWindowWidth).toHaveBeenCalledWith(1, 800);
        expect(result.ok).toBe(true);
      });

      test("should handle setWindowPosition method", async () => {
        mockWindowManager.setWindowPosition.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("setWindowPosition", {
          win_id: 1,
          x: 100,
          y: 200,
        });

        expect(mockWindowManager.setWindowPosition).toHaveBeenCalledWith(1, 100, 200);
        expect(result.ok).toBe(true);
      });
    });

    describe("Input Event Methods", () => {
      test("should handle sendInputEvent method", async () => {
        const inputEvent = { type: "click", x: 100, y: 200 };
        mockWindowManager.sendInputEvent.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("sendInputEvent", {
          win_id: 1,
          inputEvent,
        });

        expect(mockWindowManager.sendInputEvent).toHaveBeenCalledWith(1, inputEvent);
        expect(result.ok).toBe(true);
      });

      test("should handle sendElectronClick method", async () => {
        mockWindowManager.sendElectronClick.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("sendElectronClick", {
          win_id: 1,
          x: 100,
          y: 200,
          button: "left",
          clickCount: 1,
        });

        expect(mockWindowManager.sendElectronClick).toHaveBeenCalledWith(
          1,
          100,
          200,
          "left",
          1
        );
        expect(result.ok).toBe(true);
      });

      test("should handle sendElectronPressEnter method", async () => {
        mockWindowManager.sendElectronPressEnter.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("sendElectronPressEnter", {
          win_id: 1,
        });

        expect(mockWindowManager.sendElectronPressEnter).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
      });

      test("should handle writeClipboard method", async () => {
        mockWindowManager.writeClipboard.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("writeClipboard", {
          text: "Hello World",
        });

        expect(mockWindowManager.writeClipboard).toHaveBeenCalledWith("Hello World");
        expect(result.ok).toBe(true);
      });

      test("should handle showFloatDiv method", async () => {
        const options = { x: 100, y: 200, content: "Test" };
        mockWindowManager.showFloatDiv.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("showFloatDiv", {
          win_id: 1,
          ...options,
        });

        expect(mockWindowManager.showFloatDiv).toHaveBeenCalledWith(1, options);
        expect(result.ok).toBe(true);
      });

      test("should handle hideFloatDiv method", async () => {
        mockWindowManager.hideFloatDiv.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("hideFloatDiv", {
          win_id: 1,
        });

        expect(mockWindowManager.hideFloatDiv).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
      });

      test("should handle sendElectronPaste method", async () => {
        mockWindowManager.sendElectronPaste.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("sendElectronPaste", {
          win_id: 1,
        });

        expect(mockWindowManager.sendElectronPaste).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
      });
    });

    describe("Cookie Methods", () => {
      test("should handle importCookies method", async () => {
        const cookies = [{ name: "session", value: "abc123" }];
        mockWindowManager.importCookies.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("importCookies", {
          win_id: 1,
          cookies,
        });

        expect(mockWindowManager.importCookies).toHaveBeenCalledWith(1, cookies);
        expect(result.ok).toBe(true);
      });

      test("should handle exportCookies method", async () => {
        const mockCookies = [{ name: "session", value: "abc123" }];
        mockWindowManager.exportCookies.mockReturnValue(mockCookies);

        const result = await rpcHandler.handleMethod("exportCookies", {
          win_id: 1,
          options: {},
        });

        expect(mockWindowManager.exportCookies).toHaveBeenCalledWith(1, {});
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockCookies);
      });
    });

    describe("Screenshot Methods", () => {
      test("should handle captureScreenshot method", async () => {
        const mockScreenshot = { format: "png", size: 1024 };
        mockWindowManager.captureScreenshot.mockResolvedValue(mockScreenshot);

        const result = await rpcHandler.handleMethod("captureScreenshot", {
          win_id: 1,
          format: "png",
          scaleFactor: 2,
          quality: 90,
        });

        expect(mockWindowManager.captureScreenshot).toHaveBeenCalledWith(1, {
          format: "png",
          scaleFactor: 2,
          quality: 90,
        });
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockScreenshot);
      });

      test("should handle saveScreenshot method", async () => {
        mockWindowManager.saveScreenshot.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("saveScreenshot", {
          win_id: 1,
          filePath: "/path/to/screenshot.png",
          format: "png",
        });

        expect(mockWindowManager.saveScreenshot).toHaveBeenCalledWith(1, {
          filePath: "/path/to/screenshot.png",
          format: "png",
        });
        expect(result.ok).toBe(true);
      });

      test("should handle getScreenshotInfo method", async () => {
        const mockInfo = { width: 800, height: 600, format: "png" };
        mockWindowManager.getScreenshotInfo.mockReturnValue(mockInfo);

        const result = await rpcHandler.handleMethod("getScreenshotInfo", {
          win_id: 1,
        });

        expect(mockWindowManager.getScreenshotInfo).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockInfo);
      });

      test("should handle captureSystemScreenshot method", async () => {
        const mockScreenshot = { format: "png", size: 2048 };
        mockWindowManager.captureSystemScreenshot.mockResolvedValue(mockScreenshot);

        const result = await rpcHandler.handleMethod("captureSystemScreenshot", {
          format: "png",
          scaleFactor: 1,
        });

        expect(mockWindowManager.captureSystemScreenshot).toHaveBeenCalledWith({
          format: "png",
          scaleFactor: 1,
        });
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockScreenshot);
      });

      test("should handle saveSystemScreenshot method", async () => {
        mockWindowManager.saveSystemScreenshot.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("saveSystemScreenshot", {
          filePath: "/path/to/system.png",
          format: "jpeg",
        });

        expect(mockWindowManager.saveSystemScreenshot).toHaveBeenCalledWith({
          filePath: "/path/to/system.png",
          format: "jpeg",
        });
        expect(result.ok).toBe(true);
      });

      test("should handle getDisplayScreenSize method", async () => {
        const mockSize = { width: 1920, height: 1080 };
        mockWindowManager.getDisplayScreenSize.mockReturnValue(mockSize);

        const result = await rpcHandler.handleMethod("getDisplayScreenSize", {});

        expect(mockWindowManager.getDisplayScreenSize).toHaveBeenCalled();
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockSize);
      });
    });

    describe("Account Methods", () => {
      test("should handle switchAccount method", async () => {
        mockAccountManager.switchAccount.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("switchAccount", {
          account_index: 2,
        });

        expect(mockAccountManager.switchAccount).toHaveBeenCalledWith(2);
        expect(result.ok).toBe(true);
      });

      test("should handle getAccountInfo method", async () => {
        const mockInfo = { account_index: 0, windows: [1, 2] };
        mockAccountManager.getAccountInfo.mockReturnValue(mockInfo);

        const result = await rpcHandler.handleMethod("getAccountInfo", {
          win_id: 1,
        });

        expect(mockAccountManager.getAccountInfo).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockInfo);
      });

      test("should handle getAccountWindows method", async () => {
        const mockWindows = [1, 2, 3];
        mockAccountManager.getAccountWindows.mockReturnValue(mockWindows);

        const result = await rpcHandler.handleMethod("getAccountWindows", {
          account_index: 0,
        });

        expect(mockAccountManager.getAccountWindows).toHaveBeenCalledWith(0);
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockWindows);
      });
    });

    describe("Page Methods", () => {
      test("should handle loadURL method", async () => {
        mockWindowManager.loadURL.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("loadURL", {
          win_id: 1,
          url: "https://example.com",
        });

        expect(mockWindowManager.loadURL).toHaveBeenCalledWith(1, "https://example.com");
        expect(result.ok).toBe(true);
      });

      test("should handle getURL method", async () => {
        const mockUrl = "https://example.com";
        mockWindowManager.getURL.mockReturnValue(mockUrl);

        const result = await rpcHandler.handleMethod("getURL", {
          win_id: 1,
        });

        expect(mockWindowManager.getURL).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockUrl);
      });

      test("should handle getTitle method", async () => {
        const mockTitle = "Example Page";
        mockWindowManager.getTitle.mockReturnValue(mockTitle);

        const result = await rpcHandler.handleMethod("getTitle", {
          win_id: 1,
        });

        expect(mockWindowManager.getTitle).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockTitle);
      });

      test("should handle executeJavaScript method", async () => {
        const mockResult = { data: "test result" };
        mockWindowManager.executeJavaScript.mockResolvedValue(mockResult);

        const result = await rpcHandler.handleMethod("executeJavaScript", {
          win_id: 1,
          code: "document.title",
        });

        expect(mockWindowManager.executeJavaScript).toHaveBeenCalledWith(
          1,
          "document.title"
        );
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockResult);
      });

      test("should handle openDevTools method", async () => {
        mockWindowManager.openDevTools.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("openDevTools", {
          win_id: 1,
        });

        expect(mockWindowManager.openDevTools).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
      });

      test("should handle setUserAgent method", async () => {
        mockWindowManager.setUserAgent.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("setUserAgent", {
          win_id: 1,
          userAgent: "Custom User Agent",
        });

        expect(mockWindowManager.setUserAgent).toHaveBeenCalledWith(
          1,
          "Custom User Agent"
        );
        expect(result.ok).toBe(true);
      });

      test("should handle getWindowState method", async () => {
        const mockState = { id: 1, url: "https://example.com", title: "Test" };
        mockWindowManager.getWindowState.mockReturnValue(mockState);

        const result = await rpcHandler.handleMethod("getWindowState", {
          win_id: 1,
        });

        expect(mockWindowManager.getWindowState).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockState);
      });
    });

    describe("Network Methods", () => {
      test("should handle getRequests method", async () => {
        const mockRequests = [{ url: "https://example.com", method: "GET" }];
        mockWindowManager.getRequests.mockReturnValue(mockRequests);

        const result = await rpcHandler.handleMethod("getRequests", {
          win_id: 1,
        });

        expect(mockWindowManager.getRequests).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockRequests);
      });

      test("should handle clearRequests method", async () => {
        mockWindowManager.clearRequests.mockResolvedValue({});

        const result = await rpcHandler.handleMethod("clearRequests", {
          win_id: 1,
        });

        expect(mockWindowManager.clearRequests).toHaveBeenCalledWith(1);
        expect(result.ok).toBe(true);
      });
    });

    describe("Media Methods", () => {
      test("should handle downloadMedia method", async () => {
        const mockResult = { filePath: "/path/to/media.mp4" };
        mockWindowManager.downloadMedia.mockResolvedValue(mockResult);

        const result = await rpcHandler.handleMethod("downloadMedia", {
          win_id: 1,
          mediaUrl: "https://example.com/video.mp4",
          genSubtitles: true,
        });

        expect(mockWindowManager.downloadMedia).toHaveBeenCalledWith(1, {
          mediaUrl: "https://example.com/video.mp4",
          genSubtitles: true,
        });
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockResult);
      });

      test("should handle getSubTitles method", async () => {
        const mockSubtitles = [{ text: "Hello", start: 0, end: 2 }];
        mockWindowManager.getSubTitles.mockResolvedValue(mockSubtitles);

        const result = await rpcHandler.handleMethod("getSubTitles", {
          mediaPath: "/path/to/video.mp4",
        });

        expect(mockWindowManager.getSubTitles).toHaveBeenCalledWith("/path/to/video.mp4");
        expect(result.ok).toBe(true);
        expect(result.result).toEqual(mockSubtitles);
      });
    });
  });

  describe("Error Handling", () => {
    test("should handle unknown method", async () => {
      const result = await rpcHandler.handleMethod("unknownMethod", {});

      expect(result.ok).toBe(false);
      expect(result.error).toContain("Unknown RPC method: unknownMethod");
    });

    test("should handle window not found", async () => {
      mockWindowManager.getWindow.mockReturnValue(null);

      const result = await rpcHandler.handleMethod("getURL", {
        win_id: 999,
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain("Window 999 not found");
    });

    test("should handle method execution errors", async () => {
      const error = new Error("Method execution failed");
      mockWindowManager.getURL.mockImplementation(() => {
        throw error;
      });

      const result = await rpcHandler.handleMethod("getURL", {
        win_id: 1,
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain("Method execution failed");
    });

    test("should handle async method errors", async () => {
      const error = new Error("Async method failed");
      mockWindowManager.loadURL.mockRejectedValue(error);

      const result = await rpcHandler.handleMethod("loadURL", {
        win_id: 1,
        url: "https://example.com",
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain("Async method failed");
    });
  });

  describe("Parameter Validation", () => {
    test("should handle missing win_id gracefully", async () => {
      const result = await rpcHandler.handleMethod("getURL", {});

      expect(result.ok).toBe(false);
      expect(result.error).toContain("win_id is required");
    });

    test("should handle missing required parameters", async () => {
      const result = await rpcHandler.handleMethod("openWindow", {});

      expect(result.ok).toBe(false);
      expect(result.error).toContain("url is required");
    });

    test("should handle invalid parameter types", async () => {
      const result = await rpcHandler.handleMethod("closeWindow", {
        win_id: "invalid",
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain("win_id must be a number");
    });
  });

  describe("Window Resolution", () => {
    test("should resolve window and webContents from win_id", async () => {
      const mockWindow = {
        id: 1,
        webContents: { id: 2 },
      };
      mockWindowManager.getWindow.mockReturnValue(mockWindow);
      mockWindowManager.getURL.mockReturnValue("https://example.com");

      const result = await rpcHandler.handleMethod("getURL", {
        win_id: 1,
      });

      expect(mockWindowManager.getWindow).toHaveBeenCalledWith(1);
      expect(result.ok).toBe(true);
    });

    test("should resolve webContents from wc_id", async () => {
      const mockWebContents = { id: 2 };
      mockWindowManager.getWebContents.mockReturnValue(mockWebContents);
      // Mock a method that uses wc_id directly

      const result = await rpcHandler.handleMethod("getURL", {
        wc_id: 2,
        win_id: 1,
      });

      expect(mockWindowManager.getWebContents).toHaveBeenCalledWith(2);
    });
  });

  describe("Logging", () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = {
        log: jest.spyOn(console, "log").mockImplementation(),
        error: jest.spyOn(console, "error").mockImplementation(),
      };
    });

    afterEach(() => {
      consoleSpy.log.mockRestore();
      consoleSpy.error.mockRestore();
    });

    test("should log method calls except high-frequency ones", async () => {
      mockWindowManager.ping.mockReturnValue("pong");

      await rpcHandler.handleMethod("ping", {});

      expect(consoleSpy.log).toHaveBeenCalledWith("[ACT]", "ping");
      expect(consoleSpy.log).toHaveBeenCalledWith("[PARAMS]", "{}");
    });

    test("should not log high-frequency methods", async () => {
      mockWindowManager.getWindows.mockReturnValue({});

      await rpcHandler.handleMethod("getWindows", {});

      expect(consoleSpy.log).not.toHaveBeenCalledWith("[ACT]", "getWindows");
      expect(consoleSpy.log).not.toHaveBeenCalledWith("[ACT]", "getWindowState");
    });

    test("should log errors", async () => {
      const error = new Error("Test error");
      mockWindowManager.getURL.mockImplementation(() => {
        throw error;
      });

      await rpcHandler.handleMethod("getURL", { win_id: 1 });

      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });
});