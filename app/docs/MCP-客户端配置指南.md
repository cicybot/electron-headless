# MCP 配置指南：支持各种工具

## 🎯 不同工具的 MCP 配置方法

### 1️⃣ Cursor 编辑器
Cursor 是最受欢迎的 MCP 支持工具之一。

**配置文件位置**: `~/.config/cursor/mcp.json` 或项目根目录 `.cursor/mcp.json`

**配置内容**:
```json
{
  "mcpServers": {
    "electron-mcp-ptools": {
      "command": "node",
      "args": ["/absolute/path/to/your/project/opencode-mcp-server.js"],
      "cwd": "/absolute/path/to/your/project",
      "env": {
        "NODE_PATH": "."
      }
    }
  }
}
```

**Cursor 配置步骤**:
1. 打开 Cursor 设置
2. 找到 MCP 配置部分
3. 添加服务器配置
4. 重启 Cursor

### 2️⃣ Claude Desktop
Claude Desktop 原生支持 MCP。

**配置文件位置**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
或 `~/.config/Claude/claude_desktop_config.json` (Linux)

**配置内容**:
```json
{
  "mcpServers": {
    "electron-mcp-ptools": {
      "command": "node",
      "args": ["/path/to/your/project/opencode-mcp-server.js"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

### 3️⃣ VS Code with MCP 扩展
需要安装 MCP 扩展。

**配置文件位置**: 项目根目录 `.vscode/mcp.json`

**配置内容**:
```json
{
  "servers": {
    "electron-mcp-ptools": {
      "command": "node",
      "args": ["opencode-mcp-server.js"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

### 4️⃣ Windsurf 编辑器
Windsurf 也支持 MCP。

**配置文件位置**: `~/.config/windsurf/mcp.json`

**配置内容**:
```json
{
  "mcpServers": {
    "electron-mcp-ptools": {
      "command": "node",
      "args": ["opencode-mcp-server.js"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

### 5️⃣ 通用 MCP 配置文件
对于其他支持 MCP 的工具，使用标准格式：

**配置文件位置**: `mcp.json` 或 `.mcp.json`

**配置内容**:
```json
{
  "mcpServers": {
    "electron-mcp-ptools": {
      "command": "node",
      "args": ["opencode-mcp-server.js"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

## 🔧 为不同工具创建配置

我将为每个主要工具创建对应的配置文件。

### 创建 Cursor 配置
```bash
# 为 Cursor 创建配置
mkdir -p ~/.config/cursor
cat > ~/.config/cursor/mcp.json << 'EOF'
{
  "mcpServers": {
    "electron-mcp-ptools": {
      "command": "node",
      "args": ["/Users/data/electron/electron-mcp/opencode-mcp-server.js"],
      "cwd": "/Users/data/electron/electron-mcp",
      "env": {
        "NODE_PATH": "."
      }
    }
  }
}
EOF
```

### 创建 Claude Desktop 配置
```bash
# 为 Claude Desktop 创建配置 (macOS)
mkdir -p ~/Library/Application\ Support/Claude
cat > ~/Library/Application\ Support/Claude/claude_desktop_config.json << 'EOF'
{
  "mcpServers": {
    "electron-mcp-ptools": {
      "command": "node",
      "args": ["/Users/data/electron/electron-mcp/opencode-mcp-server.js"],
      "cwd": "/Users/data/electron/electron-mcp"
    }
  }
}
EOF
```

### 创建 VS Code 配置
```bash
# 为 VS Code 创建配置
mkdir -p .vscode
cat > .vscode/mcp.json << 'EOF'
{
  "servers": {
    "electron-mcp-ptools": {
      "command": "node",
      "args": ["../opencode-mcp-server.js"],
      "cwd": "${workspaceFolder}"
    }
  }
}
EOF
```

## 🧪 测试不同工具的配置

### 测试脚本
```javascript
// test-mcp-clients.js - 测试不同 MCP 客户端的配置
const { spawn } = require('child_process');
const path = require('path');

const clients = {
  cursor: {
    configPath: '~/.config/cursor/mcp.json',
    processName: 'Cursor'
  },
  claude: {
    configPath: '~/Library/Application Support/Claude/claude_desktop_config.json',
    processName: 'Claude'
  },
  vscode: {
    configPath: '.vscode/mcp.json',
    processName: 'VS Code'
  }
};

function testClientConfig(clientName) {
  const client = clients[clientName];
  if (!client) {
    console.log(`❌ 不支持的客户端: ${clientName}`);
    return;
  }

  console.log(`🧪 测试 ${client.processName} 配置...`);

  // 检查配置文件是否存在
  const fs = require('fs');
  const os = require('os');
  const configPath = client.configPath.replace('~', os.homedir());

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.mcpServers && config.mcpServers['electron-mcp-ptools']) {
      console.log(`✅ ${client.processName} 配置存在`);

      // 测试服务器是否可以启动
      const serverPath = path.join(__dirname, 'opencode-mcp-server.js');
      if (fs.existsSync(serverPath)) {
        console.log(`✅ MCP 服务器文件存在: ${serverPath}`);
      } else {
        console.log(`❌ MCP 服务器文件不存在: ${serverPath}`);
      }
    } else {
      console.log(`❌ ${client.processName} 配置不完整`);
    }
  } catch (error) {
    console.log(`❌ ${client.processName} 配置读取失败: ${error.message}`);
  }
}

// 使用示例
console.log('🎯 MCP 客户端配置测试工具');
console.log('支持的客户端: cursor, claude, vscode');
console.log();

// 测试所有客户端
Object.keys(clients).forEach(clientName => {
  testClientConfig(clientName);
  console.log();
});

console.log('💡 使用方法:');
console.log('1. 运行: node test-mcp-clients.js');
console.log('2. 检查输出中是否有 ✅ 标记');
console.log('3. 如果配置缺失，按上述方法创建');
```

## 🎯 推荐配置流程

### 对于 Cursor 用户：
1. 创建 `~/.config/cursor/mcp.json`
2. 添加我们的服务器配置
3. 重启 Cursor
4. 在 Cursor 中测试 MCP 工具

### 对于 Claude Desktop 用户：
1. 创建 `~/Library/Application Support/Claude/claude_desktop_config.json`
2. 添加服务器配置
3. 重启 Claude Desktop
4. 使用 MCP 工具进行对话

### 对于 VS Code 用户：
1. 安装 MCP 扩展
2. 创建 `.vscode/mcp.json`
3. 配置服务器
4. 在 VS Code 中使用

## ❓ 关于 "OpenCode"

我之前提到的 "OpenCode" 可能是指：
1. **Cursor** - 最流行的 AI 编程助手
2. **Claude Desktop** - 支持 MCP 的桌面应用
3. **其他 MCP 兼容工具**

如果您指的是其他工具，请告诉我具体名称，我会为您创建相应的配置！

## 🚀 快速开始

无论您使用哪个工具，基本步骤都是一样的：

1. **启动 Electron 应用**:
   ```bash
   cd app && npm start
   ```

2. **配置 MCP**:
   - 选择您的编辑器/工具
   - 使用上述对应的配置文件

3. **开始使用**:
   ```javascript
   // 在您的工具中使用
   await mcp.tools.call('list_pages');
   await mcp.tools.call('new_page', { url: 'https://example.com' });
   ```

需要我为您配置特定工具吗？