// Mock for Electron APIs used in tests
module.exports = {
  app: {
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    quit: jest.fn(),
    commandLine: {
      appendSwitch: jest.fn()
    },
    disableHardwareAcceleration: jest.fn(),
    getPath: jest.fn((name) => `/mock/path/${name}`),
    setName: jest.fn()
  },
  BrowserWindow: {
    getFocusedWindow: jest.fn(),
    getAllWindows: jest.fn(() => [])
  },
  Menu: {
    buildFromTemplate: jest.fn(),
    setApplicationMenu: jest.fn()
  },
  dialog: {
    showOpenDialog: jest.fn()
  },
  session: {
    defaultSession: {
      getStoragePath: jest.fn(() => '/mock/session/path')
    }
  },
  screen: {
    getAllDisplays: jest.fn(() => []),
    getPrimaryDisplay: jest.fn(() => ({ bounds: { width: 1920, height: 1080 } }))
  },
  webContents: {
    fromId: jest.fn()
  }
};