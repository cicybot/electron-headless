# Electron Headless Browser

基于 Electron 的多账户浏览器自动化工具，提供完整的 Playwright 风格 API 和 MCP 集成。

## 🚀 特性

- 🏢 **多账户隔离** - 每个账户拥有独立的浏览器沙盒环境
- 🎯 **Playwright API** - 兼容的浏览器自动化接口
- 🤖 **MCP 集成** - 原生 OpenCode 编辑器支持
- 🖥️ **多窗口管理** - 高效的并发浏览器实例管理
- 🔒 **安全隔离** - 账户级别的资源和会话隔离
- 📊 **网络监控** - 完整的 HTTP 请求跟踪和分析

## 📊 Electron Account vs Chrome 窗口

### 🏠 通俗比喻
| 概念 | Chrome 多窗口 | Electron 多账户 | Chrome 多TAB | Electron 同一账户多窗口 |
|------|---------------|----------------|-------------|----------------------|
| **比喻** | 不同家庭 | 同一个大家庭 | 同一个房间不同抽屉 | 同一个家庭不同房间 |
| **资源共享** | ❌ 完全独立 | ✅ 共享登录状态 | ✅ 完全共享 | ✅ 共享登录状态 |
| **UI独立性** | ✅ 完全独立 | ✅ 完全独立 | ❌ 同一窗口切换 | ✅ 完全独立 |
| **适用场景** | 多用户隔离 | 单用户多任务 | 快速切换浏览 | 并行工作 |

详细说明请查看：[通俗解释](Electron-Account-vs-Chrome-通俗解释.md) | [比喻解释](Electron-Account-比喻解释.md)

## 📊 与 Chrome MCP 的对比

| 特性 | Electron MCP | Chrome MCP |
|------|-------------|------------|
| **账户隔离** | ✅ 原生多账户 | ❌ 需要手动配置 |
| **窗口管理** | ✅ 多窗口原生 | ⚠️ 多实例复杂 |
| **Node.js 集成** | ✅ 深度集成 | ❌ 需额外桥接 |
| **桌面功能** | ✅ 完整支持 | ❌ 仅浏览器 |
| **启动速度** | ⚡ 快速 | 🐌 较慢 |
| **资源占用** | 📊 中等 | 📊📊 较高 |
| **部署复杂度** | 📦 中等 | 📦 简单 |

详细对比请查看：[架构对比图表](Electron-vs-Chrome-MCP-架构图.md)

## 🛠️ 安装使用

```bash
# 1. 安装依赖
cd app
npm install

# 2. 全局安装 Electron
npm install -g electron

# 3. 构建项目
cd ..
./build.sh

# 4. 启动应用
cd app
npm start
```

## 🔧 MCP 配置 (OpenCode)

将以下配置添加到你的 `mcp-config.json`：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "electron-mcp-ptools": {
      "type": "local",
      "command": ["node", "opencode-mcp-server.js"],
      "description": "Playwright-style browser automation tools"
    }
  }
}
```

## 📚 文档

- [详细使用文档](使用文档-详细版.md) - 完整的使用指南
- [OpenCode MCP 集成](OpenCode-MCP-集成指南.md) - MCP 配置和使用
- [API 参考](Docs.md) - HTTP API 文档
- [架构说明](src/README-CN.md) - 代码结构和设计理念

## 🧪 测试

```bash
# 单元测试
node test-mcp-unit.js

# 集成测试
node test-mcp-integration.js

# OpenCode MCP 测试
node test-opencode-mcp.js
```

## 🐳 Docker 部署

```bash
# 构建镜像
docker build -t electron-mcp .

# 运行容器
docker run --name electron-mcp \
  -p 3456:3456 \
  -v $(pwd)/assets:/home/electron/.config/electron-mcp \
  electron-mcp
```

    docker restart electron
    
