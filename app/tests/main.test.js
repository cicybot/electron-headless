// Electron is mocked globally in jest config
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

// Mock express server to prevent it from starting
jest.mock('../src/server/express-server', () => ({
  start: jest.fn()
}));

const { loadDefaultCookies } = require('../src/main');

describe('loadDefaultCookies', () => {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  beforeEach(() => {
    jest.clearAllMocks();
    delete global.defaultCookies;
  });

  it('should load cookies when file exists', () => {
    const mockCookies = [
      { name: 'session_id', value: '12345', domain: 'example.com' }
    ];

    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(mockCookies));

    loadDefaultCookies();

    expect(fs.existsSync).toHaveBeenCalledWith(path.join(os.homedir(), 'electron-mcp', 'cookies.json'));
    expect(fs.readFileSync).toHaveBeenCalledWith(path.join(os.homedir(), 'electron-mcp', 'cookies.json'), 'utf8');
    expect(global.defaultCookies).toEqual(mockCookies);
  });

  it('should not set global cookies when file does not exist', () => {
    fs.existsSync.mockReturnValue(false);

    loadDefaultCookies();

    expect(global.defaultCookies).toBeUndefined();
  });

  it('should handle invalid JSON gracefully', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('invalid json');

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    loadDefaultCookies();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load default cookies:', expect.any(SyntaxError));
    expect(global.defaultCookies).toBeUndefined();

    consoleSpy.mockRestore();
  });

  it('should handle file read errors gracefully', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation(() => {
      throw new Error('File read error');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    loadDefaultCookies();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load default cookies:', expect.any(Error));
    expect(global.defaultCookies).toBeUndefined();

    consoleSpy.mockRestore();
  });
});