// Mock fs first
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn()
  }
}));

// Mock helpers
jest.mock('../src/helpers', () => ({
  setCookies: jest.fn()
}));

const MenuManager = require('../src/core/menu-manager');
const { BrowserWindow } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn()
  }
}));

jest.mock('path');
jest.mock('os');

describe('MenuManager', () => {
  let menuManager;
  let mockWindow;
  let mockWebContents;
  let mockSession;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    menuManager = require('../src/core/menu-manager');

    // Mock OS and path
    os.homedir.mockReturnValue('/home/user');
    path.join.mockImplementation((...args) => args.join('/'));
    path.dirname.mockImplementation((p) => p.split('/').slice(0, -1).join('/'));

    // Mock window and session
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
      isDestroyed: jest.fn(() => false)
    };

    const { BrowserWindow } = require('electron');
    BrowserWindow.getFocusedWindow.mockReturnValue(mockWindow);
  });

  describe('exportCookies', () => {
    it('should export cookies successfully', async () => {
      const mockCookies = [
        { name: 'session_id', value: '12345', domain: 'example.com' },
        { name: 'user_pref', value: 'dark_mode', domain: 'example.com' }
      ];

      mockSession.cookies.get.mockResolvedValue(mockCookies);

      await menuManager.exportCookies();

      expect(mockSession.cookies.get).toHaveBeenCalledWith({});
    });

    it('should handle no focused window', async () => {
      BrowserWindow.getFocusedWindow.mockReturnValue(null);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await menuManager.exportCookies();

      expect(consoleSpy).toHaveBeenCalledWith('No focused window to export cookies from');

      consoleSpy.mockRestore();
    });

    it('should handle destroyed window', async () => {
      mockWindow.isDestroyed.mockReturnValue(true);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await menuManager.exportCookies();

      expect(consoleSpy).toHaveBeenCalledWith('No focused window to export cookies from');

      consoleSpy.mockRestore();
    });

    it('should handle export errors', async () => {
      mockSession.cookies.get.mockRejectedValue(new Error('Export failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await menuManager.exportCookies();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to export cookies:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('importCookies', () => {
    const mockDialogResult = {
      canceled: false,
      filePaths: ['/path/to/cookies.json']
    };

    const mockCookies = [
      { name: 'test_cookie', value: 'test_value', domain: 'example.com' }
    ];

    beforeEach(() => {
      // Mock the helpers module
      jest.doMock('../src/helpers', () => ({
        setCookies: jest.fn()
      }));
    });

    it('should import cookies successfully', async () => {
      const { dialog } = require('electron');
      const { setCookies } = require('../src/helpers');

      dialog.showOpenDialog.mockResolvedValue(mockDialogResult);
      fs.promises.readFile.mockResolvedValue(JSON.stringify(mockCookies));
      setCookies.mockResolvedValue();

      await menuManager.importCookies();

      expect(dialog.showOpenDialog).toHaveBeenCalledWith(mockWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      expect(fs.promises.readFile).toHaveBeenCalledWith('/path/to/cookies.json', 'utf8');
      expect(setCookies).toHaveBeenCalledWith(mockWebContents, mockCookies);
      expect(mockWebContents.reload).toHaveBeenCalled();
    });

    it('should handle dialog cancellation', async () => {
      const { dialog } = require('electron');

      dialog.showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] });

      await menuManager.importCookies();

      expect(dialog.showOpenDialog).toHaveBeenCalled();
      expect(fs.promises.readFile).not.toHaveBeenCalled();
    });

    it('should handle no focused window', async () => {
      BrowserWindow.getFocusedWindow.mockReturnValue(null);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await menuManager.importCookies();

      expect(consoleSpy).toHaveBeenCalledWith('No focused window to import cookies to');

      consoleSpy.mockRestore();
    });

    it('should handle destroyed window', async () => {
      mockWindow.isDestroyed.mockReturnValue(true);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await menuManager.importCookies();

      expect(consoleSpy).toHaveBeenCalledWith('No focused window to import cookies to');

      consoleSpy.mockRestore();
    });

    it('should handle import errors', async () => {
      const { dialog } = require('electron');

      dialog.showOpenDialog.mockResolvedValue(mockDialogResult);
      fs.promises.readFile.mockRejectedValue(new Error('File read failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await menuManager.importCookies();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to import cookies:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON', async () => {
      const { dialog } = require('electron');

      dialog.showOpenDialog.mockResolvedValue(mockDialogResult);
      fs.promises.readFile.mockResolvedValue('invalid json');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await menuManager.importCookies();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to import cookies:', expect.any(SyntaxError));

      consoleSpy.mockRestore();
    });
  });
});