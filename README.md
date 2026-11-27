<div align="center">

# 💬 SeekChat

**零依赖、模块化、macOS 风格的 NodeSeek 四栏群聊工作台用户脚本。**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/suifeng2026/SeekChat/blob/main/LICENSE)
[![Zero Deps](https://img.shields.io/badge/Dependencies-Zero-34c759.svg)](https://github.com/suifeng2026/SeekChat)
[![Platform](https://img.shields.io/badge/Platform-NodeSeek-ff6b4a.svg)](https://www.nodeseek.com/)
[![Themes](https://img.shields.io/badge/Themes-Light%20%7C%20Dusk%20%7C%20Dark-5856d6.svg)](https://github.com/suifeng2026/SeekChat)

[GitHub 仓库](https://github.com/suifeng2026/SeekChat) · [二次开发规范 (DEVELOPMENT.md)](https://github.com/suifeng2026/SeekChat/blob/main/DEVELOPMENT.md) · [MCP 联调指南 (MCP_AGENT_GUIDE.md)](https://github.com/suifeng2026/SeekChat/blob/main/MCP_AGENT_GUIDE.md)

</div>

---

## 🚀 安装使用

1. 安装浏览器脚本管理器：[Tampermonkey](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/)（Chromium 浏览器请在 `chrome://extensions` 开启开发者模式或允许运行用户脚本）。
2. 点击直链一键安装：
   - 👉 **[点击安装 SeekChat（GitHub Raw）](https://raw.githubusercontent.com/suifeng2026/SeekChat/main/dist/nodeseek-chat-ui.user.js)**
3. 安装后刷新任意 NodeSeek 页面即可启用；点击顶栏「群聊模式 / 原版论坛」可随时零残留切换。

---

## ✨ 精炼特性

- **🖥️ 四栏可收缩桌面**：导航栏、帖子列表、阅读区、热榜/社交栏自由伸缩，内置浅色 / 黄昏护眼 / 分层暗黑三套主题。
- **💬 沉浸式看帖与回复**：居中楼中楼聚合、双向瀑布流、名片管理记录查询、统一 SVG 扩展工具栏与 NodeImage 图床管理。
- **🧩 轻量化与插槽扩展**：启动按需惰性加载，支持四区皮肤、正文增强流水线按需开关与 `custom-*` 无冲突二次开发。

---

## 📁 目录结构

```text
├── build.mjs                      # 零依赖打包与语法校验脚本
├── package.json
├── README.md
├── DEVELOPMENT.md                 # 架构规范、接口契约与开发路线图
├── MCP_AGENT_GUIDE.md             # 浏览器 MCP 调试与 Agent 联调指南
├── dist/
│   ├── nodeseek-chat-ui.meta.js   # 更新检测元文件
│   └── nodeseek-chat-ui.user.js   # 正式发布单文件脚本
└── src/
    ├── 00-meta.js                 # 脚本元信息与更新源配置
    ├── 01-config-icons.js         # 全局状态、存储键、SVG 图标与防闪屏守卫
    ├── 02-utils-api.js            # 缓存治理、签名请求、FeedEngine 与插槽注册表
    ├── 03-styles.js               # 全局样式令牌与三主题外观底座
    ├── 04-nodeimage.js            # NodeImage 图床授权、传图与图库管理
    ├── 05-shell-composer.js       # 四栏骨架、编辑器调度、灯箱与正文增强管线
    ├── 06-channels-messages.js    # 频道瀑布流、@我/回复我/私信与系统通知
    ├── 07-post-chat.js            # 帖子解析、楼中楼、楼层直达与悬停互动
    ├── 08-profile-right.js        # 名片空间、管理记录查询、个人中心与每日签到
    ├── themes/                    # 主题插槽目录（支持 custom-*.js）
    ├── plugins/                   # 插件插槽目录（悬浮基座与统计分析）
    └── 09-main.js                 # 路由监听与启动入口
```

---

## 🛠️ 本地构建

```bash
node build.mjs          # 正式发布构建
node build.mjs --local  # 本地魔改防覆盖构建
```

---

## 📄 开源许可证

本项目基于 **MIT** 协议开源。
