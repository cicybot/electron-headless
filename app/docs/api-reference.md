# 🛠️ API 参考手册

## 📖 完整的API接口文档

> 🎯 **目标**: 为开发者提供完整的API参考，即查即用

---

## 🖱️ 窗口管理 API

### 📂 打开窗口
```javascript
const { openWindow } = require('./src/utils');

// 基础用法
await openWindow('https://example.com');

// 完整参数
await openWindow('https://example.com', {
  width: 1200,
  height: 800,
  x: 100,
  y: 100,
  show: true,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true
  }
}, {
  openedVia: 'user-action',
  timestamp: Date.now()
});
```
**参数说明**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|--------|----------|------|
| `url` | string | ✅ | - | 要打开的网页地址 |
| `options` | object | ❌ | `{}` | 窗口配置选项 |
| `others` | object | ❌ | `{}` | 其他附加数据 |

**返回值**
```javascript
{
  ok: true,
  result: {
    id: 1,  // 窗口ID
    bounds: { x: 100, y: 100, width: 1200, height: 800 }
  }
}
```

### 📋 获取所有窗口
```javascript
const { getWindows } = require('./src/utils');

const windows = await getWindows();
console.log('当前窗口列表:', windows);
```
**返回值**
```javascript
{
  "0": {
    "https://github.com": {
      "id": 1,
      "wcId": 1,
      "bounds": { "x": 100, "y": 100, "width": 1200, "height": 800 }
    }
  }
}
```

### 🔴 关闭窗口
```javascript
const { closeWindow } = require('./src/utils');

// 关闭指定窗口
const result = await closeWindow(windowId);
if (result.ok) {
  console.log('窗口关闭成功');
}
```

### 👁️ 显示/隐藏窗口
```javascript
const { showWindow, hideWindow } = require('./src/utils');

// 显示窗口
await showWindow(windowId);

// 隐藏窗口
await hideWindow(windowId);

// 获取窗口状态
const state = await getWindowState(windowId);
console.log('窗口状态:', state);
```

![窗口操作](https://via.placeholder.com/600x300/4A90E2/FFFFFF?text=窗口管理+操作+示意图)

---

## 🎯 页面操作 API

### 🔄 加载URL
```javascript
const { loadURL } = require('./src/utils');

// 在指定窗口加载新页面
await loadURL('https://new-page.com', windowId);

// 刷新当前页面
await loadURL(window.webContents.getURL(), windowId);
```

### 📄 获取页面信息
```javascript
const { getURL, getTitle } = require('./src/utils');

// 获取当前URL
const url = await getURL(windowId);

// 获取页面标题
const title = await getTitle(windowId);

// 获取窗口尺寸
const size = await getWindowSize(windowId);
// => { width: 1200, height: 800 }

// 获取窗口位置
const bounds = await getBounds(windowId);
// => { x: 100, y: 100, width: 1200, height: 800 }
```

### ⚙️ 设置窗口属性
```javascript
const { setBounds, setWindowSize, setWindowPosition } = require('./src/utils');

// 设置窗口位置和大小
await setBounds(windowId, { x: 200, y: 200, width: 1000, height: 700 });

// 只设置尺寸
await setWindowSize(windowId, 1000, 700);

// 只设置位置
await setWindowPosition(windowId, 200, 200);
```

### 🔧 执行JavaScript
```javascript
const { executeJavaScript } = require('./src/utils');

// 执行页面脚本
const result = await executeJavaScript(`
  return {
    title: document.title,
    url: location.href,
    content: document.body.innerText.substring(0, 100)
  }
`, windowId);

console.log('页面数据:', result.result);
```

![页面操作](https://via.placeholder.com/600x300/7B68EE/FFFFFF?text=页面操作+执行流程)

---

## 🖱️ 屏幕自动化 API

### 👆 鼠标点击
```javascript

// 点击当前鼠标位置

// 点击指定坐标

// 批量点击
const clickPoints = [
  [100, 100], [200, 200], [300, 300]
];

for (const [x, y] of clickPoints) {
  await sleep(500); // 延迟500ms
}
```

### ⌨️ 键盘输入
```javascript

// 输入文本

// 按单个键

// 组合键（需要新增函数）
```

### 🖱️ 鼠标移动
```javascript

// 移动到指定位置

// 绘制矩形轨迹
const rectangle = [
  [100, 100], [300, 100], [300, 300], [100, 300], [100, 100]
];

for (const [x, y] of rectangle) {
  await sleep(1000); // 每个点停留1秒
}
```

### 📸 截图操作
```javascript

// 截取指定窗口
const screenshot = await captureScreenshot(windowId);
fs.writeFileSync('window.png', Buffer.from(screenshot.result.base64, 'base64'));

// 全屏截图
fs.writeFileSync('fullscreen.png', Buffer.from(fullScreenshot.result.base64, 'base64'));
```

![屏幕自动化](https://via.placeholder.com/600x300/4CAF50/FFFFFF?text=屏幕自动化+操作示例)

---

## 🔐 Cookie 管理 API

### 📥 导入Cookie
```javascript
const { importCookies } = require('./src/utils');

// 导入Cookie到窗口
const cookies = [
  {
    name: 'session_id',
    value: 'abc123',
    domain: 'example.com',
    path: '/',
    secure: true,
    httpOnly: false
  }
];

await importCookies(cookies, windowId);
console.log('Cookie导入成功');
```

### 📤 导出Cookie
```javascript
const { exportCookies } = require('./src/utils');

// 导出Cookie
const result = await exportCookies(windowId, {
  format: 'json'  // 或 'netscape'
});

// 保存到文件
fs.writeFileSync('cookies.json', JSON.stringify(result.result, null, 2));
```

![Cookie管理](https://via.placeholder.com/600x300/FF9800/FFFFFF?text=Cookie+导入导出+流程)

---

## 🌐 网络请求 API

### 📋 获取请求列表
```javascript
const { getRequests, clearRequests } = require('./src/utils');

// 获取网络请求历史
const requests = await getRequests(windowId);
console.log('网络请求:', requests.result);

// 清空请求历史
await clearRequests(windowId);
```

### 📄 请求信息结构
```javascript
// 单个请求对象结构
{
  "url": "https://api.example.com/data",
  "method": "GET",
  "status": 200,
  "responseHeaders": {
    "content-type": "application/json",
    "content-length": "1234"
  },
  "timestamp": 1640995200000,
  "resourceType": "xhr"
}
```

---

## 📋 事件监听 API

### 🔄 窗口事件
```javascript
// 监听窗口状态变化
const { onWindowStateChanged } = require('./src/utils');

onWindowStateChanged((event) => {
  console.log('窗口事件:', event);
  // { type: 'focus', windowId: 1, timestamp: 1640995200000 }
});
```

### 📝 自定义事件
```javascript
// 触发自定义事件
const { emitCustomEvent } = require('./src/utils');

await emitCustomEvent('automation-complete', {
  taskId: 123,
  result: 'success',
  duration: 5000
});
```

---

## 🔧 系统配置 API

### 📊 系统信息
```javascript
const { info, getDisplayScreenSize, ping } = require('./src/utils');

// 获取系统信息
const systemInfo = await info();
console.log('系统信息:', systemInfo);

// 获取屏幕尺寸
const screenSize = await getDisplayScreenSize();
console.log('屏幕尺寸:', screenSize);
// => { width: 1920, height: 1080 }

// 测试连接
const pong = await ping();
console.log('连接测试:', pong); // => "pong"
```

### 🌟 显示屏截图
```javascript
const { displayScreenshot } = require('./src/utils');

// 截取整个显示屏
const screen = await displayScreenshot();
fs.writeFileSync('screen.png', Buffer.from(screen.result.base64, 'base64'));
```

---

## 🚨 错误处理

### 📝 统一错误格式
```javascript
// 所有API返回统一格式
{
  ok: boolean,        // 操作是否成功
  result: any,       // 成功时的结果数据
  error?: string     // 失败时的错误信息
}
```

### 🛡️ 安全处理
```javascript
// 安全的API调用模式
async function safeApiCall(apiFunction, ...args) {
  try {
    const result = await apiFunction(...args);
    
    if (result.ok) {
      return result.result;
    } else {
      console.error('API调用失败:', result.error);
      return null;
    }
  } catch (error) {
    console.error('API调用异常:', error.message);
    return null;
  }
}

// 使用示例
const windows = await safeApiCall(getWindows);
if (windows) {
  console.log('获取到窗口列表');
}
```

---

## 📊 性能优化

### ⚡ 批量操作
```javascript
// 批量创建窗口（性能优化）
const urls = ['https://site1.com', 'https://site2.com', 'https://site3.com'];

// 并发创建
const windows = await Promise.all(
  urls.map(url => openWindow(url))
);

console.log('批量创建完成:', windows);
```

### 💾 缓存机制
```javascript
// 带缓存的截图
const screenshot = await captureScreenshot(windowId, {
  cache: true,        // 启用缓存
  ttl: 60000,       // 缓存60秒
  quality: 80        // 压缩质量80%
});
```

---

## 🎯 实用工具函数

### ⏱️ 延迟函数
```javascript
// 系统内置延迟
const { sleep } = require('./src/utils');

await sleep(1000); // 延迟1秒
await sleep(500);  // 延迟0.5秒
```

### 🔄 等待结果
```javascript
// 等待异步操作完成
const { waitForResult } = require('./src/utils');

const result = await waitForResult(
  () => document.querySelector('.loaded'), // 检查条件
  10000,                                     // 超时10秒
  100                                         // 检查间隔100ms
);

if (result) {
  console.log('元素加载完成');
} else {
  console.log('等待超时');
}
```

---

## 📝 代码模板

### 🏗️ 基础模板
```javascript

async function basicTemplate() {
  try {
    // 1. 打开页面
    const win = await openWindow('https://example.com');
    
    // 2. 等待加载
    await sleep(2000);
    
    // 3. 执行操作
    
    // 4. 截图记录
    const screenshot = await captureScreenshot(win.result.id);
    
    console.log('✅ 任务完成');
    return screenshot;
    
  } catch (error) {
    console.error('❌ 任务失败:', error.message);
    throw error;
  }
}
```

### 🎮 交互式模板
```javascript
// 带用户交互的自动化
async function interactiveTemplate() {
  const readline = require('readline');
  
  // 获取用户输入
  const question = (prompt) => new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, answer => {
      rl.close();
      resolve(answer);
    });
  });
  
  const url = await question('请输入网址: ');
  const clicks = parseInt(await question('点击次数: '));
  
  // 执行自动化
  const win = await openWindow(url);
  await sleep(2000);
  
  for (let i = 0; i < clicks; i++) {
    await sleep(500);
  }
  
  console.log('🎉 自动化完成!');
}
```

---

## 🔗 相关文档

- 📖 [窗口管理详解](./window-management.md)
- 🤖 [屏幕自动化指南](./screen-automation.md)
- 🍪 [Cookie管理](./cookie-management.md)
- 🌐 [网络请求监控](./network-monitoring.md)

---

**💡 提示**: 所有API都支持Promise，推荐使用async/await语法

> 🚀 **开始你的自动化项目吧！**

---

*API文档持续更新，最新版本请查看在线文档*