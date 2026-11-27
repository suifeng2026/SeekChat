# SeekChat 浏览器 MCP 制作与 Agent 二次开发对接指南

本文档面向基于 SeekChat 进行二次开发的开发者与 AI Coding Agent，说明在缺少内置浏览器控制能力时，如何搭建或自制浏览器 MCP（Model Context Protocol）工具，从而实现真实登录态 DOM 审计、计算样式排查、CSS 实时热预览与站内接口调试。

---

## 1. 为什么 SeekChat 二开建议接入浏览器 MCP

1. **绕开外部请求限制**：NodeSeek 启用了 Cloudflare 验证、同源 Cookie 会话及动态请求签名（`x-dynamic-sign`），外部 `curl` 或无状态脚本往往无法直接获取真实帖子 DOM 与接口响应。
2. **获取真实计算样式与原生注入结果**：站内样式表和原生 Vue 组件（如 `.nsk-magic-tabs`、`stardustWrapper`、`vote.js`）会在页面加载后动态改写 DOM。通过连接当前已登录 Chrome 的 MCP，Agent 可以直接读取 `getComputedStyle()`、`getBoundingClientRect()` 与真实 `outerHTML`，避免盲猜选择器或属性。
3. **非破坏性实时调优**：借助热注入 `<style>` 预览工具，可以在不重启脚本、不污染源码的前提下完成布局与主题微调，验证通过后再回写至 `src/03-styles.js` 或 `src/themes/*.js`。

---

## 2. 若本地没有浏览器 MCP：两种搭建方案

### 方案 A：接入 Chrome DevTools 官方调试端口（零代码，最快上手）

适合可接受带调试参数启动独立 Chrome 实例的开发环境，支持完整 DOM 检查、Console 求值测试接口与 Network 抓包。

1. **启动带调试端口的 Chrome**（使用独立用户数据目录避免冲突）：
   ```bash
   # Windows 示例
   "C:/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%/Google/Chrome/SeekChatDev"
   ```
   打开后手动登录 `https://www.nodeseek.com/` 并安装 SeekChat 本地构建版（`dist/nodeseek-chat-ui.local.user.js`）。

2. **在 Agent 客户端注册 MCP 服务**（以支持 stdio MCP 的客户端配置文件为例）：
   ```json
   {
     "mcpServers": {
       "chrome-devtools": {
         "command": "npx",
         "args": [
           "-y",
           "chrome-devtools-mcp@latest",
           "--browserUrl",
           "http://127.0.0.1:9222"
         ]
       }
     }
   }
   ```

3. **适用场景**：需要测试 `/api/*` 返回格式、复现脚本运行报错、或检查 Network 请求头（如 `x-dynamic-sign`、`csrf-token`）。

---

### 方案 B：自制轻量 Chrome 扩展桥接 MCP（无需重启日常浏览器）

如果不希望使用独立调试端口，可按以下三层架构自制一个轻量 Chrome 扩展 + 本地 Node.js MCP Server（即 `chrome-inspector` 模式），直接连接日常使用的已登录 Chrome：

#### 架构拓扑

```text
Agent (Stdio) <---> Node.js MCP Server (WebSocket Server :19222)
                           ^
                           | 本地回环 WebSocket
                           v
                  Chrome 扩展 Service Worker (background.js)
                           |
                           | chrome.scripting.executeScript
                           v
                  目标标签页 DOM (www.nodeseek.com)
```

#### 1) Chrome 扩展清单（`manifest.json`，MV3）

```json
{
  "manifest_version": 3,
  "name": "SeekChat DOM Inspector Bridge",
  "version": "1.0.0",
  "permissions": ["tabs", "scripting", "activeTab"],
  "host_permissions": ["https://www.nodeseek.com/*", "https://nodeseek.com/*"],
  "background": {
    "service_worker": "background.js"
  }
}
```

#### 2) 扩展端核心职责（`background.js`）

- 维持连接至 `ws://127.0.0.1:19222`（带断线重连心跳）；
- 根据 MCP Server 下发的 JSON-RPC 指令分发操作：
  - `list_tabs`：调用 `chrome.tabs.query({})` 返回 `{ id, title, url, active }`；
  - `inspect_dom`：调用 `chrome.scripting.executeScript` 在目标 `tabId` 执行只读 DOM 采集函数（`document.querySelectorAll(selector)`），返回匹配数量、类名、`getBoundingClientRect()`、`getComputedStyle()` 指定属性与截断后的 `outerHTML`；
  - `preview_css`：向目标 `tabId` 注入或更新 `<style id="nsc-mcp-preview">`，实时预览样式修改；
  - `remove_preview`：移除注入的预览 `<style>` 节点。

#### 3) Node.js MCP Server 暴露的四个核心工具

使用 `@modelcontextprotocol/sdk` 与 `ws` 编写约百行的桥接入口，向 Agent 暴露以下四个只读/临时预览工具即可满足绝大多数 UI 与结构排查需求：

| 工具名 | 关键参数 | 用途说明 |
| :--- | :--- | :--- |
| `list_tabs` | `url_filter?` | 定位当前打开的 NodeSeek 标签页 `tab_id` |
| `inspect_dom` | `tab_id`, `selector`, `styles[]`, `include_html`, `max_elements` | 检查目标节点是否存在、结构是否被改写及计算样式值 |
| `preview_css` | `tab_id`, `css`, `style_id?` | 在页面中热注入 CSS 验证布局与三主题效果 |
| `remove_preview` | `tab_id`, `style_id?` | 清除临时注入的样式标签 |

注册到客户端配置：

```json
{
  "mcpServers": {
    "chrome-inspector": {
      "command": "node",
      "args": ["C:/path/to/your-bridge/server.mjs"]
    }
  }
}
```

---

## 3. Agent 对接 SeekChat 二开标准工作流

接入浏览器 MCP 后，推荐按以下五步推进二次开发与排障：

1. **定位现场标签页**：调用 `list_tabs(url_filter="nodeseek.com")` 确认当前活跃标签页 ID。
2. **先查真实 DOM，不靠猜**：
   - 使用 `inspect_dom` 读取目标容器（如 `.nsc-bubble`、`.nsk-magic-tabs`、`#nsc-hub-backdrop`）；
   - 示例：排查测评帖标签异常时，通过同时请求 `styles: ["display", "order", "flexWrap", "color"]` 与 `include_html: true`，可直接观测到被原站规则赋予 `order: 1000` 和 `display: none` 的节点，快速锁定结构破坏根因。
3. **热预览验证样式**：
   - 调整四分区皮肤、卡片或主题变量时，先用 `preview_css` 注入临时样式观察效果；
   - 确认无误后 `remove_preview`，将最终规则写入 `src/03-styles.js` 或 `src/themes/custom-*.js`。
4. **本地防覆盖构建与刷新验证**：
   - 运行 `node build.mjs --local` 生成 `dist/nodeseek-chat-ui.local.user.js`；
   - 在 Tampermonkey 中安装或重载本地构建版，刷新浏览器页面并用 `inspect_dom` 二次确认生效。
5. **接口联调（如接入新外部查询源）**：
   - 若使用方案 A（`chrome-devtools-mcp`），可在已登录标签页上下文中直接试跑 `fetch()` 验证接口返回字段与状态码；
   - 确认字段契约后，接入 `src/02-utils-api.js`（`createFeedEngine` / `signedApiFetchJson`）及 `src/plugins/custom-*.js`。

---

## 4. 安全与合规约定

- **禁止采集或落盘凭据**：不得将个人 Cookie、CSRF Token、NodeImage API Key 写入任何代码、配置文件或 Markdown 文档。
- **最小权限原则**：自制桥接扩展的 `host_permissions` 应仅限于 `nodeseek.com` 域名，且生产环境不暴露外网监听端口（严格绑定 `127.0.0.1`）。
- **控制请求频次**：通过 MCP 调试站内分页或批量统计接口（如近 100 页账簿、全量星辰流水）时，必须复用 `createFeedEngine` 的限频与中止守卫，避免高频并发请求触发风控。
