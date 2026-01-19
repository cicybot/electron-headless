# OpenCode MCP 集成完整指南

## 🎯 集成步骤

### 1. 确保配置文件正确

你的 `mcp-config.json` 应该包含：

```json
{
  "$schema": "https://opencode.ai/config.json",
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

### 2. 启动 Electron 应用

```bash
cd app
npm start
```

### 3. 在 OpenCode 中配置

1. 打开 OpenCode 设置
2. 找到 MCP 配置部分
3. 指向你的 `mcp-config.json` 文件
4. 或者直接将配置内容复制到 OpenCode 的 MCP 设置中

### 4. 验证集成

在 OpenCode 中使用 MCP 工具：

```javascript
// 创建新页面
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

// 执行 JavaScript
await mcp.tools.call('evaluate_script', {
  win_id: 1,
  script: 'document.title'
});
```

## 🔧 可用工具列表

| 工具名称 | 功能描述 | 参数示例 |
|---------|---------|---------|
| `new_page` | 创建新浏览器窗口 | `{ url: "https://example.com", account_index: 1 }` |
| `close_page` | 关闭浏览器窗口 | `{ win_id: 1 }` |
| `navigate_page` | 导航到指定URL | `{ win_id: 1, url: "https://new.com" }` |
| `list_pages` | 列出所有窗口 | `{}` |
| `click` | 点击指定坐标 | `{ win_id: 1, x: 100, y: 200 }` |
| `fill` | 填写表单字段 | `{ win_id: 1, selector: "#username", value: "test" }` |
| `evaluate_script` | 执行 JavaScript | `{ win_id: 1, script: "document.title" }` |
| `take_screenshot` | 截取屏幕截图 | `{ win_id: 1 }` |

## ⚠️ 注意事项

1. **确保 Electron 应用运行**: MCP 服务器需要 Electron 应用在后台运行
2. **端口占用**: 默认使用 3456 端口，确保不被其他应用占用
3. **权限设置**: 确保 OpenCode 有权限执行 Node.js 脚本
4. **路径配置**: `NODE_PATH: "."` 确保模块正确解析

## 🐛 故障排除

### 问题：OpenCode 无法连接到 MCP 服务器

**解决方案：**
1. 检查 Electron 应用是否在运行
2. 验证 mcp-config.json 路径是否正确
3. 查看 OpenCode 的开发者控制台错误信息

### 问题：工具调用失败

**解决方案：**
1. 确保 `win_id` 参数正确（使用 `list_pages` 查看可用窗口）
2. 检查账户权限设置
3. 验证 JavaScript 代码语法

### 问题：MCP 服务器启动失败

**解决方案：**
1. 检查 Node.js 依赖是否完整安装
2. 验证 opencode-mcp-server.js 文件存在
3. 查看终端错误输出

## 🚀 高级配置

### 自定义环境变量

```json
{
  "env": {
    "NODE_PATH": ".",
    "DEBUG": "true",
    "CUSTOM_CONFIG": "value"
  }
}
```

### 多服务器配置

```json
{
  "mcp": {
    "electron-mcp-ptools": {
      // 主服务器配置
    },
    "another-mcp-server": {
      // 其他 MCP 服务器
    }
  }
}
```

## 📞 技术支持

如果遇到集成问题：

1. 运行配置验证脚本：`node validate-opencode-mcp.js`
2. 检查 OpenCode 版本兼容性
3. 查看项目文档：[使用文档](使用文档-详细版.md)
4. 提交问题时请包含完整的错误信息和配置

---

🎉 现在你可以享受在 OpenCode 中进行浏览器自动化的强大功能了！
