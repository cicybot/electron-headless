# OpenCode MCP 操作指南

## 🎯 快速开始

### 1. 启动服务
```bash
# 启动 Electron Headless Browser
cd app && npm start
```

### 2. 打开 OpenCode
确保项目根目录包含 `mcp-config.json` 文件

### 3. 开始使用 MCP 工具

## 🔧 MCP 工具使用方法

### 基本语法
```javascript
// 在 OpenCode 中使用 MCP 工具
await mcp.tools.call('tool_name', {
  parameter1: 'value1',
  parameter2: 'value2'
});
```

### 工作流程示例

#### 网页自动化任务
```javascript
// 1. 创建新浏览器窗口
await mcp.tools.call('new_page', {
  url: 'https://example.com',
  account_index: 1
});

// 2. 查看可用窗口
const windows = await mcp.tools.call('list_pages');
console.log('可用窗口:', windows);

// 3. 执行自动化操作
await mcp.tools.call('click', {
  win_id: 1,  // 从 list_pages 获取的窗口 ID
  x: 100,
  y: 200
});

await mcp.tools.call('fill', {
  win_id: 1,
  selector: '#username',
  value: 'testuser'
});

// 4. 执行 JavaScript
const title = await mcp.tools.call('evaluate_script', {
  win_id: 1,
  script: 'document.title'
});
console.log('页面标题:', title);

// 5. 截图保存
await mcp.tools.call('take_screenshot', {
  win_id: 1
});
```

## 📋 完整工具列表

### 导航工具

#### `new_page` - 创建新浏览器窗口
```javascript
await mcp.tools.call('new_page', {
  url: 'https://example.com',     // 可选：初始 URL
  account_index: 1               // 可选：账户索引，默认 0
});
```

#### `close_page` - 关闭浏览器窗口
```javascript
await mcp.tools.call('close_page', {
  win_id: 1,                     // 必需：窗口 ID
  account_index: 1               // 可选：账户验证
});
```

#### `navigate_page` - 导航到新页面
```javascript
await mcp.tools.call('navigate_page', {
  win_id: 1,                     // 必需：窗口 ID
  url: 'https://new-site.com',   // 必需：目标 URL
  account_index: 1               // 可选：账户验证
});
```

#### `list_pages` - 列出所有窗口
```javascript
const result = await mcp.tools.call('list_pages');
console.log(result.content[0].text);
```

### 输入自动化工具

#### `click` - 点击指定坐标
```javascript
await mcp.tools.call('click', {
  win_id: 1,     // 必需：窗口 ID
  x: 100,        // 必需：X 坐标
  y: 200,        // 必需：Y 坐标
  account_index: 1 // 可选：账户验证
});
```

#### `fill` - 填写表单字段
```javascript
await mcp.tools.call('fill', {
  win_id: 1,           // 必需：窗口 ID
  selector: '#email',  // 必需：CSS 选择器
  value: 'user@example.com', // 必需：填写值
  account_index: 1     // 可选：账户验证
});
```

#### `press_key` - 按下键盘按键
```javascript
await mcp.tools.call('press_key', {
  win_id: 1,     // 必需：窗口 ID
  key: 'Enter',  // 必需：按键名称
  account_index: 1 // 可选：账户验证
});
```

### 调试工具

#### `evaluate_script` - 执行 JavaScript
```javascript
const result = await mcp.tools.call('evaluate_script', {
  win_id: 1,     // 必需：窗口 ID
  script: `      // 必需：JavaScript 代码
    (() => {
      return {
        title: document.title,
        url: window.location.href,
        userAgent: navigator.userAgent
      };
    })()
  `,
  account_index: 1 // 可选：账户验证
});

console.log('执行结果:', result.content[0].text);
```

#### `take_screenshot` - 截取屏幕截图
```javascript
await mcp.tools.call('take_screenshot', {
  win_id: 1,     // 可选：窗口 ID，默认使用第一个
  account_index: 1 // 可选：账户验证
});
```

### 账户管理工具

#### `switch_account` - 切换账户上下文
```javascript
await mcp.tools.call('switch_account', {
  account_index: 2  // 必需：新账户索引
});
```

#### `get_account_info` - 获取账户信息
```javascript
const info = await mcp.tools.call('get_account_info', {
  win_id: 1  // 必需：窗口 ID
});
```

## 🎯 实际使用场景

### 场景 1: 网页数据抓取
```javascript
// 1. 创建窗口并导航
await mcp.tools.call('new_page', {
  url: 'https://news-site.com',
  account_index: 1
});

// 2. 等待页面加载
await new Promise(resolve => setTimeout(resolve, 2000));

// 3. 提取数据
const headlines = await mcp.tools.call('evaluate_script', {
  win_id: 1,
  script: `
    (() => {
      const titles = Array.from(document.querySelectorAll('h2'))
        .map(h2 => h2.textContent)
        .filter(title => title.length > 10);
      return titles.slice(0, 5);
    })()
  `
});

console.log('新闻标题:', JSON.parse(headlines.content[0].text));
```

### 场景 2: 表单自动化
```javascript
// 1. 导航到登录页面
await mcp.tools.call('navigate_page', {
  win_id: 1,
  url: 'https://login-site.com'
});

// 2. 填写登录表单
await mcp.tools.call('fill', {
  win_id: 1,
  selector: '#username',
  value: 'myusername'
});

await mcp.tools.call('fill', {
  win_id: 1,
  selector: '#password',
  value: 'mypassword'
});

// 3. 点击登录按钮
await mcp.tools.call('click', {
  win_id: 1,
  x: 500,  // 登录按钮坐标
  y: 400
});
```

### 场景 3: 多账户操作
```javascript
// 账户1：用户A的操作
await mcp.tools.call('new_page', {
  url: 'https://site1.com',
  account_index: 1
});

// 账户2：用户B的操作
await mcp.tools.call('new_page', {
  url: 'https://site2.com',
  account_index: 2
});

// 在账户1中操作
await mcp.tools.call('fill', {
  win_id: 1,  // 账户1的窗口
  selector: '#input1',
  value: 'data for account 1',
  account_index: 1
});

// 在账户2中操作
await mcp.tools.call('fill', {
  win_id: 2,  // 账户2的窗口
  selector: '#input2',
  value: 'data for account 2',
  account_index: 2
});
```

## ⚠️ 注意事项

### 1. 窗口 ID 管理
- 每次创建新窗口都会获得一个唯一的 `win_id`
- 使用 `list_pages` 查看所有可用窗口
- 关闭窗口后，该窗口的 ID 不再有效

### 2. 账户隔离
- 不同账户的窗口完全隔离
- 同一账户的窗口共享 cookies 和缓存
- 操作时可指定 `account_index` 进行验证

### 3. 坐标定位
- `click` 工具使用绝对坐标
- 坐标原点是浏览器窗口的左上角
- 建议使用开发者工具获取准确坐标

### 4. 选择器使用
- `fill` 工具使用 CSS 选择器
- 确保选择器在页面加载后可用
- 可以使用 `evaluate_script` 验证选择器

### 5. 异步操作
- 页面加载、网络请求都需要时间
- 建议在操作之间添加适当的延迟
- 可以使用 `evaluate_script` 检查页面就绪状态

## 🔧 调试技巧

### 查看可用窗口
```javascript
const windows = await mcp.tools.call('list_pages');
console.log('当前窗口:', windows);
```

### 检查页面状态
```javascript
const status = await mcp.tools.call('evaluate_script', {
  win_id: 1,
  script: `
    (() => ({
      url: window.location.href,
      title: document.title,
      readyState: document.readyState,
      userAgent: navigator.userAgent
    }))()
  `
});
console.log('页面状态:', status);
```

### 验证元素存在
```javascript
const elementExists = await mcp.tools.call('evaluate_script', {
  win_id: 1,
  script: `
    (() => {
      const element = document.querySelector('#my-element');
      return {
        exists: !!element,
        visible: element ? element.offsetWidth > 0 : false,
        text: element ? element.textContent : null
      };
    })()
  `
});
console.log('元素检查:', elementExists);
```

## 🚨 常见错误及解决

### 错误：窗口不存在
```
❌ Failed to find window with id: 999
```
**解决**: 使用 `list_pages` 检查可用窗口 ID

### 错误：元素未找到
```
❌ Failed to find element with selector: #nonexistent
```
**解决**: 使用开发者工具验证选择器，或添加等待时间

### 错误：账户不匹配
```
❌ Window does not belong to account
```
**解决**: 确保 `win_id` 和 `account_index` 匹配

### 错误：页面未加载完成
```
❌ Element not interactable
```
**解决**: 添加延迟等待，或检查页面就绪状态

---

现在你可以开始在 OpenCode 中使用强大的浏览器自动化功能了！

💡 **提示**: 先运行 `node validate-opencode-mcp.js` 确保配置正确，然后尝试简单的 `list_pages` 命令开始使用。