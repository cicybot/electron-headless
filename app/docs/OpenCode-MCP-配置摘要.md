# OpenCode MCP 配置摘要

## 🎯 配置状态

✅ **MCP 配置文件**: `mcp-config.json` ✓  
✅ **MCP 服务器脚本**: `opencode-mcp-server.js` ✓  
✅ **依赖包**: `@modelcontextprotocol/sdk`, `zod` ✓  
✅ **工作区配置**: `.opencode/mcp.json` ✓  
✅ **集成指南**: `OpenCode-MCP-集成指南-完整版.md` ✓  

## 🚀 快速开始

### 1. 启动 Electron 应用
```bash
cd app
npm start
```

### 2. 在 OpenCode 中配置

#### 方法一：使用项目配置文件
1. 打开 OpenCode
2. 确保项目根目录有 `mcp-config.json`
3. OpenCode 会自动检测并加载配置

#### 方法二：手动配置
1. 在 OpenCode 设置中找到 MCP 配置
2. 添加以下配置：

```json
{
  "mcp": {
    "electron-mcp-ptools": {
      "type": "local",
      "command": ["node", "opencode-mcp-server.js"],
      "description": "Playwright-style browser automation tools for Electron headless browser with account isolation"
    }
  }
}
```

### 3. 开始使用

```javascript
// 在 OpenCode 中创建浏览器窗口
await mcp.tools.call('new_page', {
  url: 'https://example.com',
  account_index: 1
});

// 自动化点击
await mcp.tools.call('click', {
  win_id: 1,
  x: 100,
  y: 200
});

// 填写表单
await mcp.tools.call('fill', {
  win_id: 1,
  selector: '#username',
  value: 'testuser'
});

// 执行 JavaScript
const title = await mcp.tools.call('evaluate_script', {
  win_id: 1,
  script: 'document.title'
});
```

## 🛠️ 可用工具

| 工具 | 功能 | 示例 |
|------|------|------|
| `new_page` | 创建窗口 | `{url: "https://site.com", account_index: 1}` |
| `close_page` | 关闭窗口 | `{win_id: 1}` |
| `navigate_page` | 导航页面 | `{win_id: 1, url: "https://new.com"}` |
| `list_pages` | 列出窗口 | `{}` |
| `click` | 点击操作 | `{win_id: 1, x: 100, y: 200}` |
| `fill` | 填写表单 | `{win_id: 1, selector: "#input", value: "text"}` |
| `evaluate_script` | 执行 JS | `{win_id: 1, script: "document.title"}` |
| `take_screenshot` | 截图 | `{win_id: 1}` |

## 🔧 故障排除

### 问题：OpenCode 无法连接 MCP
**检查：**
- Electron 应用是否运行 (`curl http://127.0.0.1:3456/rpc`)
- 配置文件路径是否正确
- OpenCode 版本是否支持 MCP

### 问题：工具调用失败
**检查：**
- 使用 `list_pages` 获取正确的 `win_id`
- 验证账户权限设置
- 检查 JavaScript 语法

### 问题：依赖缺失
**解决：**
```bash
cd app
npm install @modelcontextprotocol/sdk zod
```

## 📊 配置验证

运行验证脚本检查配置：
```bash
node validate-opencode-mcp.js
```

预期输出：
```
✅ MCP 配置文件存在
✅ 配置文件格式正确
✅ MCP 服务器脚本存在
✅ Node.js 依赖完整

🎉 所有验证通过！
```

## 🎉 配置完成！

你的 OpenCode MCP 配置已经完成。现在你可以在 OpenCode 编辑器中享受强大的浏览器自动化功能了！

📚 **详细文档**: [OpenCode-MCP-集成指南-完整版.md](OpenCode-MCP-集成指南-完整版.md)
🧪 **测试工具**: `node test-mcp-quick.js`
📋 **配置验证**: `node validate-opencode-mcp.js`