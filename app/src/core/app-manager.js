/**
 * Core App Manager
 * Handles main Electron application lifecycle and global state
 */

const { app, screen } = require('electron');
const path = require('path');

class AppManager {
  constructor() {
    this.isLocal = process.env.IS_LOCAL === "true";
    this.mediaDir = path.join(app.getPath('home'), "assets");
    this.appName = process.env.APP_NAME || "Electron Mcp";

    this.init();
  }

  init() {
    console.log("IS_LOCAL", this.isLocal, process.env.IS_LOCAL === 'true');
    app.setName(this.appName);
  }

  getDisplayScreenSize() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.bounds;
    return { width, height };
  }

  getAppInfo() {
    return {
      name: this.appName,
      version: app.getVersion(),
      electron: process.versions.electron,
      node: process.versions.node,
      platform: process.platform,
      arch: process.arch
    };
  }

  getMediaDir() {
    return this.mediaDir;
  }

  isLocalMode() {
    return this.isLocal;
  }
}

module.exports = new AppManager();