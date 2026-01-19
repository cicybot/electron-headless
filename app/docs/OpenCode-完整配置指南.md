# OpenCode MCP 配置指南

## 🎯 快速配置

### 1. 创建配置文件

在项目根目录创建 `opencode.json` 文件：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "electron-mcp-ptools": {
      "type": "local",
      "command": ["node", "opencode-mcp-server.js"],
      "enabled": true,
      "description": "Playwright-style browser automation tools for Electron headless browser with account isolation",
      "environment": {
        "NODE_PATH": "."
      },
      "timeout": 10000
    }
  }
}
```

### 2. 启动 Electron 应用

```bash
cd app && npm start
```

### 3. 在 OpenCode 中使用

现在你可以在 OpenCode 中使用 MCP 工具了！

```javascript
// 列出所有窗口
await mcp.tools.call('list_pages');

// 创建新窗口
await mcp.tools.call('new_page', {
  url: 'https://example.com',
  account_index: 1
});

// 点击操作
await mcp.tools.call('click', {
  win_id: 1,
  x: 100,
  y: 200
});
```

## 📋 完整配置选项

根据 OpenCode 文档，以下是所有可用选项：

| 选项 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `type` | String | ✅ | MCP 服务器连接类型，必须是 "local" |
| `command` | Array | ✅ | 运行 MCP 服务器的命令和参数 |
| `enabled` | Boolean | ❌ | 启动时启用或禁用 MCP 服务器 |
| `environment` | Object | ❌ | 运行服务器时设置的环境变量 |
| `timeout` | Number | ❌ | 从 MCP 服务器获取工具的超时时间（毫秒），默认 5000 |

## 🔧 高级配置

### 条件启用

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "electron-mcp-ptools": {
      "type": "local",
      "command": ["node", "opencode-mcp-server.js"],
      "enabled": true,
      "description": "Playwright-style browser automation tools",
      "environment": {
        "NODE_PATH": ".",
        "DEBUG": "true"
      },
      "timeout": 15000
    }
  }
}
```

### 全局禁用特定工具

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "electron-mcp-ptools": {
      "type": "local",
      "command": ["node", "opencode-mcp-server.js"],
      "enabled": true
    }
  },
  "tools": {
    "electron-mcp-ptools_*": false
  }
}
```

### 按 Agent 启用

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "electron-mcp-ptools": {
      "type": "local",
      "command": ["node", "opencode-mcp-server.js"],
      "enabled": true
    }
  },
  "tools": {
    "electron-mcp-ptools_*": false
  },
  "agent": {
    "my-agent": {
      "tools": {
        "electron-mcp-ptools_*": true
      }
    }
  }
}
```

## 🧪 测试配置

### 验证配置

```bash
# 运行配置验证
node validate-opencode-mcp.js
```

### 测试工具功能

```bash
# 运行功能演示
node mcp-demo.js
```

### 检查 OpenCode 状态

```bash
# 查看 MCP 服务器状态
opencode mcp list

# 查看认证状态
opencode mcp auth list
```

## 📖 使用方法

### 基本用法

在 OpenCode 中，你可以直接在对话中使用 MCP 工具：

```
请帮我创建一个浏览器窗口访问百度，然后截个图
```

OpenCode 会自动调用相应的 MCP 工具。

### 明确指定工具

```
use electron-mcp-ptools to navigate to https://example.com and take a screenshot
```

### 编程方式调用

```javascript
// 在 OpenCode 的代码块中
const result = await mcp.tools.call('new_page', {
  url: 'https://example.com',
  account_index: 1
});

console.log('创建的窗口:', result);
```

## 🛠️ 故障排除

### 问题：OpenCode 找不到 MCP 服务器

**检查：**
1. 确认 `opencode.json` 文件在项目根目录
2. 确认 Electron 应用正在运行
3. 检查文件路径是否正确

```bash
# 验证配置
cat opencode.json

# 检查 Electron 应用
curl http://127.0.0.1:3456/rpc -d '{"method": "ping"}'
```

### 问题：工具调用失败

**检查：**
1. 使用 `list_pages` 获取有效的 `win_id`
2. 确认账户权限设置
3. 检查 JavaScript 代码语法

```javascript
// 调试步骤
await mcp.tools.call('list_pages');  // 获取窗口列表
```

### 问题：MCP 服务器启动失败

**检查：**
1. 确认 Node.js 依赖已安装
2. 验证 `opencode-mcp-server.js` 文件存在
3. 查看 OpenCode 的错误日志

```bash
# 检查依赖
cd app && npm ls @modelcontextprotocol/sdk zod

# 检查服务器文件
ls -la opencode-mcp-server.js
```

## 🔐 安全注意事项

1. **账户隔离**：不同账户的窗口完全隔离，保护敏感数据
2. **权限控制**：只在需要时启用 MCP 工具
3. **超时设置**：合理设置超时时间避免长时间等待

## 📚 相关文档

- [OpenCode MCP 文档](https://opencode.ai/docs/mcp)
- [Electron Headless 使用文档](使用文档-详细版.md)
- [MCP 协议规范](https://modelcontextprotocol.io/specification)

## 🎯 配置完成！

按照上述步骤配置完成后，你的 OpenCode 就可以使用强大的浏览器自动化功能了！

需要帮助？查看 [OpenCode-MCP-操作指南.md](OpenCode-MCP-操作指南.md)