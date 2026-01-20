# MCP 测试指南

本文档介绍如何测试 Electron Headless Browser 的 MCP (Model Context Protocol) 功能。

## 测试概述

我们提供了两个级别的测试：

1. **单元测试** (`test-mcp-unit.js`) - 测试 MCP 逻辑，不依赖 Electron 运行时
2. **集成测试** (`test-mcp-integration.js`) - 测试完整的 MCP 功能，需要 Electron 应用运行

## 快速测试

### 1. 单元测试 (无需 Electron)

```bash
# 运行单元测试
node test-mcp-unit.js

# 预期输出:
🧪 运行 MCP 单元测试...

账户验证测试: ✅ 通过
参数验证测试: ✅ 通过
MCP 响应格式测试: ✅ 通过
账户切换测试: ✅ 通过
窗口账户信息测试: ✅ 通过

📊 测试结果: 5 通过, 0 失败
🎉 所有 MCP 单元测试通过！
```

### 2. 集成测试 (需要 Electron 运行)

```bash
# 终端 1: 启动 Electron 应用
cd app
npm start

# 终端 2: 运行集成测试
cd ..
node test-mcp-integration.js

# 预期输出:
🚀 开始 MCP 集成测试

==================================================
🏥 检查服务器健康状态...
✅ 服务器运行正常
系统信息: Electron 1.0.0

==================================================
📡 测试 RPC ping...
✅ RPC ping 成功

🖼️ 测试获取窗口列表...
✅ 获取窗口列表成功
当前窗口: X 个账户

🔧 测试 MCP 工具列表...
✅ MCP 工具列表获取成功
发现 X 个工具
  - new_page: 创建新浏览器窗口
  - click: 点击指定坐标
  ...

📄 测试 MCP 创建新页面...
✅ MCP 创建新页面成功
响应: Created new window (ID: X) in account 1

==================================================
📊 测试结果摘要
✅ 服务器连接
✅ RPC Ping
✅ 获取窗口列表
✅ MCP 工具列表
✅ MCP 创建页面

总计: 5/5 通过
🎉 所有测试通过！MCP 集成工作正常。
```

## 详细测试说明

### 单元测试内容

单元测试验证以下核心功能：

1. **账户验证测试** - 验证账户访问控制逻辑
2. **参数验证测试** - 验证工具参数格式和类型
3. **MCP 响应格式测试** - 验证 JSON-RPC 2.0 响应格式
4. **账户切换测试** - 验证账户上下文切换
5. **窗口账户信息测试** - 验证窗口账户关联

### 集成测试内容

集成测试验证完整的端到端功能：

1. **服务器连接测试** - 验证 HTTP 服务器运行状态
2. **RPC Ping 测试** - 验证传统 RPC API 工作正常
3. **窗口列表测试** - 验证窗口管理功能
4. **MCP 工具列表** - 验证 MCP 协议工具发现
5. **MCP 工具调用** - 验证实际的工具执行

## 手动测试 MCP 功能

### 使用 curl 测试

```bash
# 1. 测试 RPC ping
curl -X POST http://127.0.0.1:3456/rpc \
  -H "Content-Type: application/json" \
  -d '{"method": "ping"}'

# 2. 测试 MCP 工具列表
curl -X POST http://127.0.0.1:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'

# 3. 测试创建新页面
curl -X POST http://127.0.0.1:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "new_page",
      "arguments": {
        "url": "https://example.com",
        "account_index": 1
      }
    }
  }'

# 4. 测试点击操作
curl -X POST http://127.0.0.1:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "click",
      "arguments": {
        "win_id": 1,
        "x": 100,
        "y": 200
      }
    }
  }'
```

### 使用 OpenCode 测试

1. 安装 OpenCode 或支持 MCP 的编辑器
2. 配置 `mcp-config.json`:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "electron-mcp-ptools": {
      "type": "local",
      "command": ["curl", "-X", "POST", "http://127.0.0.1:3456/mcp", "-H", "Content-Type: application/json", "-d", "@-"],
      "description": "Playwright风格的浏览器自动化工具"
    }
  }
}
```

3. 在编辑器中使用 MCP 工具

## 故障排除

### 常见问题

#### 1. 连接失败
```
错误: 无法连接到服务器
```
**解决方案:**
- 确保 Electron 应用正在运行 (`npm start`)
- 检查端口 3456 是否被占用
- 确认防火墙设置

#### 2. MCP 工具列表为空
```
错误: tools/list 返回空列表
```
**解决方案:**
- 检查 MCP SDK 是否正确安装
- 查看服务器日志中的错误信息
- 确认 MCP 集成模块已正确加载

#### 3. 工具调用失败
```
错误: 工具执行返回错误
```
**解决方案:**
- 验证参数格式正确
- 检查 `win_id` 是否有效
- 确认账户权限设置

#### 4. 账户验证失败
```
错误: Window does not belong to account
```
**解决方案:**
- 使用正确的 `account_index`
- 确认窗口确实属于指定账户
- 检查账户隔离逻辑

### 调试技巧

#### 启用详细日志
```javascript
// 在 main.js 中添加
console.log = (...args) => {
  const timestamp = new Date().toISOString();
  process.stdout.write(`[${timestamp}] ${args.join(' ')}\n`);
};
```

#### 测试网络连接
```bash
# 检查端口是否监听
netstat -tlnp | grep 3456

# 测试 HTTP 连接
curl -v http://127.0.0.1:3456/rpc \
  -H "Content-Type: application/json" \
  -d '{"method": "ping"}'
```

#### 查看 Electron 日志
```bash
# 启动时启用详细日志
IS_LOCAL=true DEBUG=* npm start
```

## 性能测试

### 负载测试
```bash
# 使用 Apache Bench 测试并发性能
ab -n 1000 -c 10 -T 'application/json' \
  -p payload.json \
  http://127.0.0.1:3456/rpc

# payload.json 内容:
# {"method": "ping"}
```

### 内存使用监控
```bash
# 监控 Electron 进程内存使用
ps aux | grep electron
top -p $(pgrep electron)
```

## 持续集成

### GitHub Actions 示例
```yaml
name: MCP Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd app
          npm install
      - name: Install Electron
        run: npm install -g electron
      - name: Run unit tests
        run: node test-mcp-unit.js
      - name: Run integration tests
        run: |
          cd app
          npm start &
          sleep 5
          cd ..
          node test-mcp-integration.js
```

---

这个测试指南提供了完整的 MCP 功能验证流程。从单元测试到集成测试，再到生产环境的监控，确保了 MCP 集成的稳定性和可靠性。