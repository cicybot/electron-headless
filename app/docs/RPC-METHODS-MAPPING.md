# RPC Methods Mapping Guide

## Overview
This document maps all RPC methods to their corresponding utility functions in `utils.js` and MCP tools in `mcp-integration.js`.

## System Tools

| RPC Method | Utils.js Function | MCP Tool | Description |
|-------------|------------------|-----------|-------------|
| `ping` | `ping()` | `ping` | System ping/pong test |
| `info` | `info()` | `get_system_info` | Get system and process information |
| `getDisplayScreenSize` | `getDisplayScreenSize()` | `get_display_screen_size` | Get display screen dimensions |

## Window Management Tools

| RPC Method | Utils.js Function | MCP Tool | Description |
|-------------|------------------|-----------|-------------|
| `openWindow` | `openWindow(url, options, others)` | `open_window` | Open new browser window |
| `closeWindow` | `closeWindow(win_id)` | `close_window` | Close browser window |
| `showWindow` | `showWindow(win_id)` | `show_window` | Show/hide browser window |
| `hideWindow` | `hideWindow(win_id)` | `hide_window` | Hide browser window |
| `getWindows` | `getWindows()` | `get_windows` | Get list of all windows |
| `getWindowState` | `getWindowState(win_id)` | `get_window_state` | Get window state information |
| `loadURL` | `loadURL(url, win_id)` | `load_url` | Load URL in window |
| `reload` | `reload(win_id)` | `reload_window` | Reload window |
| `getURL` | `getURL(win_id)` | `get_url` | Get current window URL |
| `getTitle` | `getTitle(win_id)` | `get_title` | Get window title |
| `getBounds` | `getBounds(win_id)` | `get_bounds` | Get window bounds |
| `getWindowSize` | `getWindowSize(win_id)` | `get_window_size` | Get window size |
| `setBounds` | `setBounds(win_id, bounds)` | `set_bounds` | Set window bounds |
| `setWindowSize` | `setWindowSize(win_id, width, height)` | `set_window_size` | Set window size |
| `setWindowWidth` | `setWindowWidth(win_id, width)` | `set_window_width` | Set window width |
| `setWindowPosition` | `setWindowPosition(win_id, x, y)` | `set_window_position` | Set window position |
| `openDevTools` | `openDevTools(win_id)` | `open_dev_tools` | Open developer tools |

## Input Event Tools

| RPC Method | Utils.js Function | MCP Tool | Description |
|-------------|------------------|-----------|-------------|
| `sendInputEvent` | `sendInputEvent(inputEvent, win_id)` | `send_input_event` | Send input event to window |
| `sendElectronClick` | `sendElectronClick(win_id, x, y)` | `send_electron_click` | Send click event to window |
| `sendElectronPressEnter` | `sendElectronPressEnter(win_id)` | `send_electron_press_enter` | Send Enter key to window |
| `sendElectronCtlV` | `sendElectronCtlV(win_id)` | `send_electron_ctl_v` | Send Ctrl+V to window |
| `sendElectronCtlC` | `sendElectronCtlC(win_id)` | `send_electron_ctl_c` | Send Ctrl+C to window |
| `sendElectronCtlX` | `sendElectronCtlX(win_id)` | `send_electron_ctl_x` | Send Ctrl+X to window |
| `sendElectronCtlA` | `sendElectronCtlA(win_id)` | `send_electron_ctl_a` | Send Ctrl+A to window |
| `writeClipboard` | `writeClipboard(text)` | `write_clipboard` | Write text to clipboard |
| `simulateClick` | `simulateClick(x, y, win_id)` | `simulate_click` | Simulate mouse click |
| `sendKey` | `sendKey(key, win_id)` | `send_key` | Send key to window |

## Input Event Tools (Electron-based)

| RPC Method | Utils.js Function | MCP Tool | Description |
|-------------|------------------|-----------|-------------|
| `sendElectronClick` | `sendElectronClick(win_id, x, y)` | `send_electron_click` | Send click event to window |
| `sendElectronPaste` | `sendElectronPaste(win_id)` | `send_electron_paste` | Paste text in window |
| `sendElectronPressEnter` | `sendElectronPressEnter(win_id)` | `send_electron_press_enter` | Press Enter in window |
| `writeClipboard` | `writeClipboard(text)` | `write_clipboard` | Write text to clipboard |

## Cookie Tools

| RPC Method | Utils.js Function | MCP Tool | Description |
|-------------|------------------|-----------|-------------|
| `importCookies` | `importCookies(cookies, win_id)` | `import_cookies` | Import cookies to window |
| `exportCookies` | `exportCookies(win_id, options)` | `export_cookies` | Export cookies from window |

## Screenshot Tools

| RPC Method | Utils.js Function | MCP Tool | Description |
|-------------|------------------|-----------|-------------|
| `captureScreenshot` | `captureScreenshot(win_id, options)` | `capture_screenshot` | Capture window screenshot |
| `saveScreenshot` | `saveScreenshot(win_id, filePath, options)` | `save_screenshot` | Save screenshot to file |
| `getWindowScreenshotInfo` | `getScreenshotInfo(win_id)` | `get_screenshot_info` | Get screenshot info |
| `captureSystemScreenshot` | `captureSystemScreenshot(options)` | `capture_system_screenshot` | Capture system screenshot |
| `saveSystemScreenshot` | `saveSystemScreenshot(filePath, options)` | `save_system_screenshot` | Save system screenshot |

## Account Tools

| RPC Method | Utils.js Function | MCP Tool | Description |
|-------------|------------------|-----------|-------------|
| `switchAccount` | `switchAccount(account_index)` | `switch_account` | Switch user account |
| `getAccountInfo` | `getAccountInfo(win_id)` | `get_account_info` | Get account information |
| `getAccountWindows` | `getAccountWindows(account_index)` | `get_account_windows` | Get windows for account |

## Page Tools

| RPC Method | Utils.js Function | MCP Tool | Description |
|-------------|------------------|-----------|-------------|
| `executeJavaScript` | `executeJavaScript(code, win_id)` | `execute_javascript` | Execute JavaScript in window |
| `getHtmlPageInfo` | `getHtmlPageInfo(win_id)` | `get_html_page_info` | Get HTML page information |
| `getElementRect` | `getElementRect(sel, win_id)` | `get_element_rect` | Get element rectangle |
| `getSubTitles` | `getSubTitles({mediaPath}, win_id)` | `get_subtitles` | Get subtitles from media |
| `downloadMedia` | `downloadMedia(params, win_id)` | `download_media` | Download media from page |

## Network Tools

| RPC Method | Utils.js Function | MCP Tool | Description |
|-------------|------------------|-----------|-------------|
| `getRequests` | `getRequests(win_id)` | `get_requests` | Get network requests |
| `clearRequests` | `clearRequests(win_id)` | `clear_requests` | Clear network requests |

## Terminal & System Tools

| RPC Method | Utils.js Function | MCP Tool | Description |
|-------------|------------------|-----------|-------------|
| `openTerminal` | `openTerminal(command, showWin)` | `open_terminal` | Open terminal command |
| `setUserAgent` | `setUserAgent(win_id, userAgent)` | `set_user_agent` | Set user agent for window |
| `showFloatDiv` | `showFloatDiv(win_id, options)` | `show_float_div` | Show floating div |
| `hideFloatDiv` | `hideFloatDiv(win_id)` | `hide_float_div` | Hide floating div |

## Utility Functions

| Utils.js Function | RPC Method | Description |
|------------------|-------------|-------------|
| `post_rpc({ method, params })` | *Core* | Core RPC communication function |
| `setBaseApi(url)` | *Config* | Set API base URL |
| `getBaseApi()` | *Config* | Get API base URL |
| `setToken(token)` | *Auth* | Set authentication token |
| `getToken()` | *Auth* | Get authentication token |
| `waitForResult(cb, timeout, interval)` | *Utility* | Wait for asynchronous result |
| `chatgptAsk(prompt)` | *AI* | Ask ChatGPT via API |
| `MapArray` | *Data Structure* | Custom Map-based array structure |

## Missing Mappings (Need Implementation)

The following RPC methods need utils.js functions added:

| RPC Method | Status | Required Implementation |
|-------------|---------|-----------------------|

## Usage Examples

### Using Utils.js Functions
```javascript

// Open a window
await openWindow('https://example.com');

// Click at coordinates

// Take screenshot
const screenshot = await captureScreenshot(windowId);
```

### Using MCP Tools
```javascript
// MCP tool call example
{
  "tool": "open_window",
  "arguments": {
    "url": "https://example.com",
    "account_index": 0
  }
}

{
  "arguments": {
    "x": 100,
    "y": 200
  }
}
```

## Notes

1. All utils.js functions use the `post_rpc` core function to communicate with the Electron backend
2. MCP tools provide the same functionality but with standardized input schemas for AI integration
4. All mappings maintain backward compatibility with existing code
5. Parameter ordering may differ between utils.js and MCP tools for better UX