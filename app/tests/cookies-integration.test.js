const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { BrowserWindow, dialog } = require('electron');

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn()
  }
}));

jest.mock('path');
jest.mock('os');
jest.mock('../src/helpers', () => ({
  setCookies: jest.fn()
}));

// Mock fs before importing main
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  createWriteStream: jest.fn(() => ({
    write: jest.fn()
  })),
  mkdirSync: jest.fn()
}));

// Import after mocking
const MenuManager = require('../src/core/menu-manager');
const { loadDefaultCookies } = require('../src/main');

describe('Cookie Integration Tests', () => {
  let menuManager;
  let windowManager;
  let mockWindow;
  let mockWebContents;
  let mockSession;

  const sampleCookies = [
    {
      name: 'session_id',
      value: 'abc123',
      domain: 'example.com',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'lax'
    },
    {
      name: 'user_pref',
      value: 'dark_mode',
      domain: 'example.com',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'strict'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup path mocks
    os.homedir.mockReturnValue('/home/user');
    path.join.mockImplementation((...args) => args.join('/'));
    path.dirname.mockImplementation((p) => p.split('/').slice(0, -1).join('/'));

    // Setup session mock
    mockSession = {
      cookies: {
        get: jest.fn(),
        set: jest.fn()
      }
    };

    mockWebContents = {
      session: mockSession,
      reload: jest.fn()
    };

    mockWindow = {
      webContents: mockWebContents,
      isDestroyed: jest.fn().returns(false)
    };

    BrowserWindow.getFocusedWindow.mockReturnValue(mockWindow);

    menuManager = new MenuManager();
    windowManager = new WindowManager();
  });

  afterEach(() => {
    delete global.defaultCookies;
  });

  describe('Complete Cookie Workflow', () => {
    it('should export cookies, save to file, and auto-load on startup', async () => {
      // Step 1: Export cookies
      mockSession.cookies.get.mockResolvedValue(sampleCookies);
      fs.promises.mkdir.mockResolvedValue();
      fs.promises.writeFile.mockResolvedValue();

      await menuManager.exportCookies();

      expect(mockSession.cookies.get).toHaveBeenCalledWith({});
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        '/home/user/electron-mcp/cookies.json',
        JSON.stringify(sampleCookies, null, 2)
      );

      // Step 2: Auto-load on startup
      const fs = require('fs');
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(sampleCookies));

      await loadDefaultCookies();

      expect(global.defaultCookies).toEqual(sampleCookies);

      // Step 3: New windows should get default cookies
      const { setCookies } = require('../src/helpers');
      BrowserWindow.mockImplementation(() => mockWindow);

      await windowManager.createWindow(0, 'https://example.com');

      expect(setCookies).toHaveBeenCalledWith(mockWebContents, sampleCookies);
    });

    it('should import cookies from file and apply to window', async () => {
      const { setCookies } = require('../src/helpers');

      // Mock dialog response
      dialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/imported-cookies.json']
      });

      // Mock file read
      fs.promises.readFile.mockResolvedValue(JSON.stringify(sampleCookies));

      await menuManager.importCookies();

      expect(dialog.showOpenDialog).toHaveBeenCalledWith(mockWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      expect(fs.promises.readFile).toHaveBeenCalledWith('/path/to/imported-cookies.json', 'utf8');
      expect(setCookies).toHaveBeenCalledWith(mockWebContents, sampleCookies);
      expect(mockWebContents.reload).toHaveBeenCalled();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle export failures gracefully', async () => {
      mockSession.cookies.get.mockRejectedValue(new Error('Session error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await menuManager.exportCookies();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to export cookies:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle import failures gracefully', async () => {
      dialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/cookies.json']
      });

      fs.promises.readFile.mockRejectedValue(new Error('File read error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await menuManager.importCookies();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to import cookies:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle invalid cookie JSON gracefully', async () => {
      dialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/cookies.json']
      });

      fs.promises.readFile.mockResolvedValue('invalid json content');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await menuManager.importCookies();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to import cookies:', expect.any(SyntaxError));

      consoleSpy.mockRestore();
    });
  });

  describe('File Path Handling', () => {
    it('should create export directory if it does not exist', async () => {
      mockSession.cookies.get.mockResolvedValue(sampleCookies);

      await menuManager.exportCookies();

      expect(fs.promises.mkdir).toHaveBeenCalledWith('/home/user/electron-mcp', { recursive: true });
    });

    it('should use correct export path', async () => {
      mockSession.cookies.get.mockResolvedValue(sampleCookies);

      await menuManager.exportCookies();

      expect(path.join).toHaveBeenCalledWith(os.homedir(), 'electron-mcp', 'cookies.json');
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        '/home/user/electron-mcp/cookies.json',
        expect.any(String)
      );
    });
  });

  afterEach(() => {
    delete global.defaultCookies;
  });
});