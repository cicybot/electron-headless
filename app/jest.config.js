module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(electron-context-menu)/)',
  ],
  testEnvironment: 'node',

  moduleNameMapper: {
    '^electron$': '<rootDir>/tests/__mocks__/electron.js'
  }
};