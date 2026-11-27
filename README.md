# SeekChat

作者：`80hou`  
定位：零依赖、模块化、macOS 风格的 NodeSeek 四栏群聊工作台用户脚本。

---

## 一键安装指南

### 1. 准备脚本管理器

浏览器需先安装用户脚本管理器（任选其一）：

- Chrome / Edge / Brave：[Tampermonkey](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/)
- Firefox：[Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/) 或 [Violentmonkey](https://violentmonkey.github.io/)

> Chromium 内核浏览器（Chrome / Edge）若首次使用 Tampermonkey，请在浏览器扩展管理页（`chrome://extensions`）确认已开启右上角「开发者模式」或允许运行用户脚本。

### 2. 点击安装脚本

点击下方直链，脚本管理器会自动识别并弹出安装确认页，点击「安装」即可完成部署：

- **[点击直接安装 SeekChat（GitHub Raw）](https://raw.githubusercontent.com/suifeng2026/SeekChat/main/dist/nodeseek-chat-ui.user.js)**

安装注意事项：
- 若此前通过手动复制粘贴安装过旧版脚本，请先在脚本管理器面板中**停用或删除旧脚本**，避免双开冲突。
- 脚本默认仅在 `https://www.nodeseek.com/*` 与 `https://nodeseek.com/*` 下运行，包含 `document-start` 防闪屏守卫。

### 3. 使用与更新

- **启用与切换**：安装完成后刷新任意 NodeSeek 帖子或首页即自动进入群聊工作台；点击顶部导航栏「群聊模式 / 原版论坛」按钮可随时零残留切回原版页面。
- **自动更新**：脚本已配置 `@updateURL` 与 `@downloadURL`。工作台左下角「检查更新」按钮每小时自动静默检测一次版本；发现新版本时会高亮提示，点击即可跳转安装页一键升级。

---

## 核心特性

- **四栏桌面布局与三态外观**：左侧自适应分区导航、中左帖子/消息列表、中右群聊阅读与编辑器、右侧名片与社交热榜；内置浅色、黄昏护眼与分层暗黑三种主题。
- **消息中心与阅读增强**：整合 `@我`、`回复我`、站内私信（含 Markdown 实时预览）与 UID 5230 系统通知结构化标签；支持双向瀑布流、楼中楼聚合、只看楼主、楼层直达、悬停矢量操作条（赞/鸡腿/踩/置顶/引用/回复/编辑）。
- **富交互协议与媒体体验**：原生渲染 `nsapp://stardust-receive` 星辰收款卡片与 `nsapp://vote` 投票卡片；集成代码块一键复制、测评魔术标签页、多图宫格与缩放灯箱、NodeImage 剪贴板粘贴直传。
- **悬浮个人中心**：拦截站内统计与快捷入口，在浮窗内直接查看主题、评论、收藏、鸡腿账簿、星辰记录、粉丝关注、等级额度，并支持固定/随机/每日首次访问自动签到。

---

## 目录结构

```text
├── build.mjs                      # 零依赖打包脚本，按序合并 src/ 并校验语法
├── package.json
├── README.md
├── DEVELOPMENT.md                 # 模块规范、接口契约与演进路线图
├── dist/
│   ├── nodeseek-chat-ui.meta.js   # Tampermonkey 更新检测元文件
│   └── nodeseek-chat-ui.user.js   # 最终可安装单文件油猴脚本
└── src/
    ├── 00-meta.js                 # UserScript 元信息与更新地址
    ├── 01-config-icons.js         # 存储键、防闪屏守卫、线性 SVG 图标、频道与状态树
    ├── 02-utils-api.js            # 工具函数、签名请求、缓存治理、名单与更新检测
    ├── 03-styles.js               # macOS 主题变量、四栏布局与卡片弹窗样式
    ├── 04-nodeimage.js            # NodeImage 图床授权、传图、图库管理、粘贴/拖拽上传
    ├── 05-shell-composer.js       # 四栏骨架、编辑器调度、发帖弹窗、灯箱与内容增强器
    ├── 06-channels-messages.js    # 左侧导航、版块瀑布流、@我/回复我/私信/系统通知(5230)
    ├── 07-post-chat.js            # 帖子解析、双向瀑布流、楼层直达、悬停互动、楼中楼与编辑
    ├── 08-profile-right.js        # 名片与签名弹窗、好友/粉丝同步、热榜、悬浮个人中心与签到
    └── 09-main.js                 # SPA 路由劫持与启动入口
```

---

## 本地构建

```bash
node build.mjs
```

构建会自动生成 `dist/nodeseek-chat-ui.user.js` 与 `dist/nodeseek-chat-ui.meta.js`，并执行 `node --check` 语法校验。

## 二次开发

模块边界定义、NodeSeek 接口契约及演进路线图请参阅 [DEVELOPMENT.md](DEVELOPMENT.md)。
