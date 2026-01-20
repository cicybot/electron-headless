# 🎉 OpenCode MCP 配置完成！

## ✅ 配置状态总览

| 项目 | 状态 | 说明 |
|------|------|------|
| **MCP 配置文件** | ✅ 完成 | `mcp-config.json` |
| **MCP 服务器脚本** | ✅ 完成 | `opencode-mcp-server.js` |
| **依赖包** | ✅ 完成 | `@modelcontextprotocol/sdk`, `zod` |
| **工作区配置** | ✅ 完成 | `.opencode/mcp.json` |
| **集成指南** | ✅ 完成 | `OpenCode-MCP-集成指南-完整版.md` |
| **配置验证** | ✅ 完成 | `validate-opencode-mcp.js` |
| **快速测试** | ✅ 完成 | `test-mcp-quick.js` |

## 🚀 如何在 OpenCode 中添加 MCP 配置

### 方法一：自动检测（推荐）

1. **确保配置文件存在**
   ```bash
   # 项目根目录应有此文件
   cat mcp-config.json
   ```

2. **打开 OpenCode**
   - 打开你的项目文件夹
   - OpenCode 会自动检测 `mcp-config.json`
   - MCP 工具将自动可用

### 方法二：手动配置

1. **在 OpenCode 中打开设置**
2. **找到 MCP 配置部分**
3. **添加以下配置**：

```json
{
  "mcp": {
    "electron-mcp-ptools": {
      "type": "local",
      "command": ["node", "opencode-mcp-server.js"],
      "description": "Playwright-style browser automation tools for Electron headless browser with account isolation",
      "capabilities": {
        "tools": {
          "listChanged": true
        }
      },
      "env": {
        "NODE_PATH": "."
      }
    }
  }
}
```

### 方法三：使用工作区配置

1. **使用生成的配置文件**：
   ```bash
   cp .opencode/mcp.json /path/to/your/opencode/workspace/settings.json
   ```

## 🎯 使用示例

配置完成后，你可以在 OpenCode 中使用以下工具：

```javascript
// 创建新浏览器窗口
await mcp.tools.call('new_page', {
  url: 'https://example.com',
  account_index: 1
});

// 自动化操作
await mcp.tools.call('click', {
  win_id: 1,
  x: 100,
  y: 200
});

await mcp.tools.call('fill', {
  win_id: 1,
  selector: '#username',
  value: 'testuser'
});

// 获取结果
const title = await mcp.tools.call('evaluate_script', {
  win_id: 1,
  script: 'document.title'
});
```

## 🛠️ 可用工具列表

| 工具名称 | 功能描述 | 参数示例 |
|---------|---------|---------|
| `new_page` | 创建新浏览器窗口 | `{url: "https://site.com", account_index: 1}` |
| `close_page` | 关闭浏览器窗口 | `{win_id: 1}` |
| `navigate_page` | 导航到指定URL | `{win_id: 1, url: "https://new.com"}` |
| `list_pages` | 列出所有活跃窗口 | `{}` |
| `click` | 点击指定坐标 | `{win_id: 1, x: 100, y: 200}` |
| `fill` | 填写表单字段 | `{win_id: 1, selector: "#input", value: "text"}` |
| `press_key` | 按下键盘按键 | `{win_id: 1, key: "Enter"}` |
| `evaluate_script` | 执行 JavaScript | `{win_id: 1, script: "document.title"}` |
| `take_screenshot` | 截取窗口截图 | `{win_id: 1}` |
| `switch_account` | 切换账户上下文 | `{account_index: 2}` |
| `get_account_info` | 获取账户信息 | `{win_id: 1}` |

## ⚠️ 重要提醒

### 1. **启动 Electron 应用**
在使用 MCP 工具前，必须先启动 Electron 应用：
```bash
cd app
npm start
```

### 2. **账户隔离概念**
- 每个账户都有独立的浏览器沙盒
- 同一账户的窗口共享 cookies 和缓存
- 不同账户完全隔离

### 3. **窗口管理**
- 所有操作都需要有效的 `win_id`
- 使用 `list_pages` 获取可用窗口
- 窗口关闭后 ID 失效

## 🔧 故障排除

### 问题：OpenCode 无法加载 MCP
**解决**：
```bash
# 验证配置
node validate-opencode-mcp.js

# 检查 Electron 应用
curl http://127.0.0.1:3456/rpc -d '{"method": "ping"}'
```

### 问题：工具调用失败
**解决**：
```javascript
// 首先列出可用窗口
const windows = await mcp.tools.call('list_pages');
console.log('Available windows:', windows);
```

## 📚 完整文档

- 📖 **[集成指南](OpenCode-MCP-集成指南-完整版.md)** - 详细的配置和使用说明
- 🧪 **[测试指南](MCP-测试指南.md)** - 各种测试方法和故障排除
- 🔧 **[架构文档](src/README-CN.md)** - 代码结构和技术实现

---

## 🎊 配置完成！

你的 OpenCode MCP 配置已经完全设置好了。现在你可以在 OpenCode 编辑器中享受强大的浏览器自动化功能！

🚀 **开始使用**: 在 OpenCode 中尝试 `await mcp.tools.call('list_pages')`

📞 **需要帮助？** 查看 [OpenCode-MCP-集成指南-完整版.md](OpenCode-MCP-集成指南-完整版.md)