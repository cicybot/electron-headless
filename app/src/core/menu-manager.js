/**
 * Application Menu Manager
 * Handles Electron menu with navigation functionality
 */

const { Menu, BrowserWindow } = require('electron');
const winManager = require('./window-manager');
const storageManager = require('./storage-manager');
const isMac = process.platform === 'darwin'

// 递归处理菜单配置，绑定点击事件
const processMenuItems = (menuItems) => {
  return menuItems.map(item => {
    // 如果有子菜单，递归处理
    if (item.submenu) {
      return {
        ...item,
        submenu: processMenuItems(item.submenu)
      };
    }

    if (item.action && winManager[item.action]) {
      const {params} = item
      delete item.params
      return {
        ...item,
        click: () => {
          winManager[item.action](params.index||0,params.url, params.options||{}, params.other||{});
        }
      };
    }

    // 没有 action 的项直接返回
    return item;
  });
};


class MenuManager {
  constructor() {
    this.menu = null;
  }

  /**
   * Create the application menu
   */
  createMenu() {

    const menus = processMenuItems(storageManager.loadMenu())
    console.log(menus)
    const template = [
      ...(process.platform === 'darwin'
          ? [{ role: 'appMenu' }]
          : []),
        ...menus,
      {

        label: 'Navigation',
        submenu: [
          {
            label: 'Go Back',
            accelerator: 'CmdOrCtrl+[',
            click: () => {
              this.goBack();
            }
          },
          {
            label: 'Go Forward',
            accelerator: 'CmdOrCtrl+]',
            click: () => {
              this.goForward();
            }
          },
          { type: 'separator' },
          {
            label: 'Cookies',
            submenu: [
              {
                label: 'Export Cookies',
                click: () => {
                  this.exportCookies();
                }
              },
              {
                label: 'Import Cookies',
                click: () => {
                  this.importCookies();
                }
              }
            ]
          }
        ]
      },
      { role: 'fileMenu' },
      { role: 'editMenu' },
      { role: 'viewMenu' },
      { role: 'windowMenu' },
      {
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click: async () => {
              const { shell } = require('electron')
              await shell.openExternal('https://electronjs.org')
            }
          }
        ]
      }
    ];

    this.menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(this.menu);
  }

  /**
   * Go back in the focused window
   */
  goBack() {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow && !focusedWindow.isDestroyed()) {
      if (focusedWindow.webContents.canGoBack()) {
        focusedWindow.webContents.goBack();
      }
    }
  }

  /**
   * Go forward in the focused window
   */
  goForward() {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow && !focusedWindow.isDestroyed()) {
      if (focusedWindow.webContents.canGoForward()) {
        focusedWindow.webContents.goForward();
      }
    }
  }

  /**
   * Reload the focused window
   */
  reload() {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow && !focusedWindow.isDestroyed()) {
      focusedWindow.webContents.reload();
    }
  }

  /**
   * Force reload the focused window (ignoring cache)
   */
  forceReload() {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow && !focusedWindow.isDestroyed()) {
      focusedWindow.webContents.reloadIgnoringCache();
    }
  }

  /**
   * Export cookies from the focused window's session
   */
  async exportCookies() {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow || focusedWindow.isDestroyed()) {
      console.log('No focused window to export cookies from');
      return;
    }

    try {
      const cookies = await focusedWindow.webContents.session.cookies.get({});
      const fs = require('fs').promises;
      const path = require('path');
      const os = require('os');

      const exportPath = path.join(os.homedir(), 'electron-mcp', 'cookies.json');
      await fs.mkdir(path.dirname(exportPath), { recursive: true });
      await fs.writeFile(exportPath, JSON.stringify(cookies, null, 2));
      console.log(`Cookies exported to ${exportPath}`);
    } catch (error) {
      console.error('Failed to export cookies:', error);
    }
  }

  /**
   * Import cookies to the focused window's session
   */
  async importCookies() {
    const { dialog } = require('electron');
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow || focusedWindow.isDestroyed()) {
      console.log('No focused window to import cookies to');
      return;
    }

    const result = await dialog.showOpenDialog(focusedWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return;
    }

    const filePath = result.filePaths[0];

    try {
      const fs = require('fs').promises;
      const cookiesData = await fs.readFile(filePath, 'utf8');
      const cookies = JSON.parse(cookiesData);

      const { setCookies } = require('../helpers');
      await setCookies(focusedWindow.webContents, cookies);
      console.log(`Cookies imported from ${filePath}`);

      // Reload the window to apply cookies
      focusedWindow.webContents.reload();
    } catch (error) {
      console.error('Failed to import cookies:', error);
    }
  }
}

module.exports = new MenuManager();