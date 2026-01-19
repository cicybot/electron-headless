/**
 * Main Electron Application Entry Point
 * Refactored with modular architecture
 */

const { app,session,BrowserWindow } = require('electron');
const contextMenu = require('electron-context-menu').default || require('electron-context-menu');

// Import modular components
const appManager = require('./core/app-manager');
const winManager = require('./core/window-manager');
const expressServer = require('./server/express-server');

// Initialize context menu
contextMenu({
  showSaveImageAs: true
});

/**
 * Application ready handler
 */
app.whenReady().then(async () => {
  console.log('Electron app ready');
  console.log("session path:",session.defaultSession.getStoragePath())

  // Initialize window manager and restore previous session
  await winManager.init();

  // Start Express server (includes MCP integration)
  expressServer.start();
  
   if (BrowserWindow.getAllWindows().length === 0) {
     // Could create a default window here if needed
     winManager.createWindow(0,"http://localhost:3456/",{})
   }
  // Handle app activation (macOS)
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.

  });
});

/**
 * Prevent app quit on window close (keep running in background)
 */
app.on('before-quit', (event) => {
  console.log("Application before-quit");
  // Uncomment to prevent quit and keep app running
  // event.preventDefault();
});

/**
 * Window-all-closed handler (except on macOS)
 */
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


// Export for testing
module.exports = { appManager, expressServer };