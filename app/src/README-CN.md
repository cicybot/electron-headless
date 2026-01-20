# 模块化架构文档

本文档描述 Electron Headless Browser 应用的模块化架构。

## 目录结构

```
src/
├── core/                    # 核心应用组件
│   ├── app-manager.js       # 主应用生命周期和全局状态
│   ├── window-manager.js    # 窗口创建和管理
│   └── account-manager.js   # 账户隔离逻辑
├── server/                  # HTTP 服务器和 API 组件
│   ├── express-server.js    # Express 服务器设置和路由
│   ├── rpc-handler.js       # RPC 方法路由和处理
│   └── mcp-integration.js   # MCP 服务器集成
├── services/                # 业务逻辑服务
│   ├── screenshot-service.js # 截图捕获和处理
│   └── network-monitor.js   # 网络请求跟踪
├── utils/                   # 共享工具
│   ├── utils.js            # 通用工具
│   ├── utils-node.js       # Node.js 特定工具
│   ├── utils-browser.js    # 浏览器端工具
│   └── helpers.js          # 助手函数
├── extension/              # Chrome 扩展文件
├── content-inject.js      # 内容脚本（在浏览器中运行）
├── main.js                # 应用入口点
└── index.js               # 模块导出
```

## 模块职责

### 核心模块

#### `app-manager.js`
- 管理全局应用状态
- 处理应用生命周期事件
- 提供系统信息
- 管理媒体目录

#### `window-manager.js`
- 创建和管理浏览器窗口
- 处理窗口事件和生命周期
- 管理窗口状态跟踪
- 提供窗口查找和控制

#### `account-manager.js`
- 管理账户隔离上下文
- 处理账户切换
- 验证账户权限
- 管理资源共享规则

### 服务器模块

#### `express-server.js`
- 设置 Express HTTP 服务器
- 配置中间件和路由
- 处理 HTTP 请求和响应
- 集成 MCP 端点

#### `rpc-handler.js`
- 将 RPC 方法调用路由到适当的处理程序
- 为所有操作提供统一接口
- 处理错误响应和日志记录
- 管理方法权限和验证

#### `mcp-integration.js`
- 实现 MCP（Model Context Protocol）服务器
- 提供 Playwright 风格的自动化工具
- 处理 MCP 请求/响应协议
- 管理工具定义和执行

### 服务模块

#### `screenshot-service.js`
- 从浏览器窗口捕获截图
- 处理图像处理和缩放
- 支持多种输出格式
- 管理截图文件操作

#### `network-monitor.js`
- 跟踪 HTTP 请求和响应
- 提供请求过滤和分析
- 支持多种导出格式（JSON、CSV、HAR）
- 管理请求统计和洞察

## 数据流

1. **HTTP 请求** → Express 服务器 → RPC 处理程序
2. **RPC 处理程序** → 核心管理器/服务 → 浏览器操作
3. **结果** → RPC 处理程序 → HTTP 响应
4. **MCP 请求** → MCP 集成 → 相同核心逻辑

## 环境分离

### Node.js 环境（主进程）
- `app-manager.js`
- `window-manager.js`
- `express-server.js`
- `rpc-handler.js`
- `services/*.js`
- `utils.js`
- `utils-node.js`
- `helpers.js`

### 浏览器环境（渲染进程）
- `utils-browser.js`
- `content-inject.js` 中的内容脚本
- Chrome 扩展文件

## 关键优势

### 可维护性
- 每个模块职责单一
- 关注点清晰分离
- 易于测试单个组件
- 简化调试和开发

### 可扩展性
- 易于添加新功能/服务
- 模块化架构支持增长
- 组件间接口清晰
- 模块独立部署

### 可测试性
- 每个模块可独立进行单元测试
- 为隔离测试模拟依赖
- 输入/输出合约清晰
- 易于集成测试

### 代码复用
- 服务可被 RPC 和 MCP 接口使用
- 浏览器工具跨上下文共享
- 通用模式抽象为工具

## 使用示例

### 创建窗口
```javascript
const { WindowManager } = require('./core/window-manager');
const win = await WindowManager.createWindow(1, 'https://example.com');
```

### 截图
```javascript
const { ScreenshotService } = require('./services/screenshot-service');
const image = await ScreenshotService.captureScreenshot(webContents);
```

### 处理 RPC 调用
```javascript
const { RPCHandler } = require('./server/rpc-handler');
const result = await RPCHandler.handleMethod('openWindow', { url: 'https://example.com' });
```

### MCP 工具使用
```javascript
const { McpIntegration } = require('./server/mcp-integration');
// MCP 服务器自动处理工具调用
```

## 未来扩展

### 额外服务
- 性能监控服务
- Cookie/会话管理服务
- 文件下载服务
- 设备模拟服务

### 新接口
- WebSocket API
- GraphQL API
- REST API 端点
- CLI 接口

### 增强功能
- 多浏览器支持
- 云部署选项
- 高级自动化工作流
- 机器学习集成