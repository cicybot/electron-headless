const fs = require('fs');
const path = require('path');
const os = require('os');

// Electron is mocked globally in jest config
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

jest.mock('fs');
jest.mock('path');
jest.mock('os');

// Mock the imported modules
jest.mock('../src/core/app-manager', () => ({}), { virtual: true });
jest.mock('../src/core/window-manager', () => ({
  init: jest.fn(),
  createWindow: jest.fn()
}), { virtual: true });
jest.mock('../src/core/menu-manager', () => ({
  createMenu: jest.fn()
}), { virtual: true });
jest.mock('../src/server/express-server', () => ({
  start: jest.fn()
}), { virtual: true });

const { app } = require('electron');

// Import after mocking
const { loadDefaultCookies } = require('../src/main');

describe('loadDefaultCookies', () => {
  let mockCookies;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup path mocks
    os.homedir.mockReturnValue('/home/user');
    path.join.mockImplementation((...args) => args.join('/'));

    mockCookies = [
      { name: 'session_id', value: '12345', domain: 'example.com' },
      { name: 'user_pref', value: 'dark_mode', domain: 'example.com' }
    ];
  });

  it('should load cookies when file exists', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(mockCookies));

    await loadDefaultCookies();

    expect(fs.existsSync).toHaveBeenCalledWith('/home/user/electron-mcp/cookies.json');
    expect(fs.readFileSync).toHaveBeenCalledWith('/home/user/electron-mcp/cookies.json', 'utf8');
    expect(global.defaultCookies).toEqual(mockCookies);
  });

  it('should not set global cookies when file does not exist', async () => {
    fs.existsSync.mockReturnValue(false);

    await loadDefaultCookies();

    expect(fs.existsSync).toHaveBeenCalledWith('/home/user/electron-mcp/cookies.json');
    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(global.defaultCookies).toBeUndefined();
  });

  it('should handle invalid JSON gracefully', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('invalid json');

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await loadDefaultCookies();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load default cookies:', expect.any(SyntaxError));
    expect(global.defaultCookies).toBeUndefined();

    consoleSpy.mockRestore();
  });

  it('should handle file read errors gracefully', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation(() => {
      throw new Error('File read error');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await loadDefaultCookies();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load default cookies:', expect.any(Error));
    expect(global.defaultCookies).toBeUndefined();

    consoleSpy.mockRestore();
  });
});
