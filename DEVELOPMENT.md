# SeekChat 二次开发与架构规范

- **当前基线**：`v7.22.38`（分支策略：`main` 存放正式发布版与基线 Tag；`dev` 分支用于日常测试与实验迭代，验证通过后合并至 `main`）
- **目标平台**：NodeSeek（`https://www.nodeseek.com/*`、`https://nodeseek.com/*`）Tampermonkey / Violentmonkey
- **构建产物**：`dist/nodeseek-chat-ui.user.js`、`dist/nodeseek-chat-ui.meta.js`
- **工程定位**：零运行时依赖、词法模块化、插槽式可扩展、高性能并发安全、macOS 风格美化
- **MCP 调试指南**：浏览器 MCP 搭建、自制扩展桥接与 Agent 联调流程参阅 [MCP_AGENT_GUIDE.md](MCP_AGENT_GUIDE.md)

---

## 1. 核心设计原则与 Agent 开发工作流

### 1.1 五项架构约束

1. **零运行时依赖**  
   不引入第三方 npm 运行时包、前端框架或外部图标库。构建脚本 `build.mjs` 仅使用 Node.js 内置模块（`node:fs`、`node:path`、`node:child_process`）；运行时仅依赖浏览器原生 DOM/Fetch/WebCrypto API、站内已挂载的 CodeMirror / markdown-it 实例及标准 `GM_*` 接口。
2. **有序词法模块化**  
   源码按 `src/00-*.js` 至 `src/09-*.js` 编号拆分，构建时按文件名升序拼接进单一严格模式 IIFE 闭包，兼具单文件部署与模块职责隔离。
3. **非破坏性挂载与零残留退出**  
   脚本新增节点统一使用 `nsc-` 前缀隔离；原生部件（`.user-card`、`.md-editor`）仅做容器迁移，切回原版页面时由 `restoreNativeWidgets()` 归位，不污染原站样式。
4. **高性能与并发安全**  
   `document-start` 注入防闪屏守卫；滚动事件采用 `requestAnimationFrame` 节流；列表检索防抖；黑名单使用 `Set` 实现 `O(1)` 过滤；异步视图切换采用递增序列号（`state.chatViewSeq`、`_unreadFetchSeq`）丢弃过期回写；本地缓存写入采用合并防抖与容量裁剪。
5. **macOS 视觉系统与表面隔离**  
   通过 CSS Custom Properties 维护浅色（Light）、黄昏护眼（Dusk）与分层暗黑（Dark）三套外观；气泡内嵌交互组件（星辰卡片、投票卡片、代码块、魔术标签页）独立声明表面背景与前景色，避免受外层气泡配色反色影响。

### 1.2 Agent 接手与二次开发流程

开发代理（Coding Agent）或贡献者接手新需求时，按以下顺序执行：

1. **核对当前进度**：阅读第 6 节路线图，确认目标任务归属（`- [x]` 已实现模块定位 vs `- [ ]` 待开发规格与约束）。
2. **定位目标模块**：依据第 3 节分层表确认代码落点。新增配置键名统一收口至 `src/01-config-icons.js` 的 `LS` 与 `state`；公共请求与签名逻辑优先下沉至 `src/02-utils-api.js`。
3. **遵循不变量**：
   - 低编号模块不强假设高编号模块符号已定义，跨层晚绑定调用须用 `typeof fn === "function"` 防御；
   - 异步切换帖子、私信或分页时必须校验 `state.chatViewSeq` 与目标 ID；
   - 修改气泡正文渲染管线时严格遵守 `3.2` 节声明的五步执行顺序；
   - 保持零外部依赖与三套主题样式同步。
4. **本地迭代与构建校验**：
   - 本地魔改测试执行 `node build.mjs --local`，输出 `dist/nodeseek-chat-ui.local.user.js`（已 gitignore，不触发上游更新覆写）；
   - 正式发布构建执行 `node build.mjs`，生成 `dist/nodeseek-chat-ui.user.js` 与 `.meta.js` 并自动运行 `node --check` 语法校验。
5. **变更收尾**：同步更新 `src/00-meta.js`、`src/01-config-icons.js`（兜底版本号）、`package.json`、`dist/*` 及本文档第 6 节状态勾选，随后提交推送。

---

## 2. 目录结构、构建与防覆盖机制

```text
├── build.mjs                      # 零依赖打包脚本：按序合并 src/01..09 并执行 node --check
├── package.json                   # 版本号与 build / build:local / check 脚本入口
├── LICENSE                        # MIT 开源许可证
├── README.md                      # 安装指南与功能概览
├── DEVELOPMENT.md                 # 本文档：架构规范、接口契约与开发路线图
├── MCP_AGENT_GUIDE.md             # 浏览器 MCP 制作、接入与 Agent 联调教程
├── dist/
│   ├── nodeseek-chat-ui.meta.js   # Tampermonkey 更新检测元文件
│   └── nodeseek-chat-ui.user.js   # 正式发布单文件脚本
└── src/
    ├── 00-meta.js                 # UserScript 元信息（@name / @version / @grant / 更新源）
    ├── 01-config-icons.js         # LS 存储键、防闪屏守卫、SVG 图标集、频道表与全局 state
    ├── 02-utils-api.js            # 缓存治理、API 封装、签名、插槽注册表与共享 FeedEngine
    ├── 03-styles.js               # CSS 变量、四分区皮肤底层、三主题与卡片/基座样式
    ├── 04-nodeimage.js            # NodeImage 图床授权、上传、图库管理、粘贴/拖拽监听
    ├── 05-shell-composer.js       # 四栏骨架、动态右栏/主题调度、发帖弹窗、灯箱与内容增强器
    ├── 06-channels-messages.js    # 左侧动态导航、版块瀑布流、@我/回复我/私信/系统通知(5230)
    ├── 07-post-chat.js            # 帖子解析、双向瀑布流、楼中楼构建、楼层互动与编辑弹窗
    ├── 08-profile-right.js        # 名片弹窗、右栏(热榜/好友/粉丝/黑名单)、悬浮个人中心与签到
    ├── themes/                    # 主题插槽目录（build.mjs 自动扫描，custom-* 后置加载）
    │   └── mac-default.js         # 默认 macOS 浅色 / 黄昏护眼 / 分层暗黑主题包
    ├── plugins/                   # 功能插件插槽目录（build.mjs 自动扫描，custom-* 后置加载）
    │   ├── core-hub-analytics.js  # 鸡腿 100 页统计与全量星辰账本分析器插件
    │   └── core-workbench-base.js # 内置基座配置中心（主题/皮肤/调序/排版表情/原版扩展/插槽）
    └── 09-main.js                 # 末位启动：SPA 路由劫持、DOM 观察器与启动入口
```

### 2.1 构建命令

```bash
# 正式发布构建：生成 dist/nodeseek-chat-ui.user.js 与 .meta.js（保留更新源）
node build.mjs

# 本地/魔改构建：生成 dist/nodeseek-chat-ui.local.user.js（剥离更新源并隔离命名空间）
node build.mjs --local
```

### 2.2 Fork 与二次开发防覆盖契约

为防止上游更新静默覆盖二开或魔改代码，更新检测采用**单一权威源（Single Source of Truth）**设计：

- `02-utils-api.js` 中的 `getScriptUpdateTargets()` 动态读取当前运行实例 `GM_info.script`（及 `scriptMetaStr`）中的 `@updateURL` 与 `@downloadURL`，不再硬编码官方仓库路径；更新缓存 `LS.UPDATE_CHECK` 同时绑定 `metaUrl` 校验。
- **本地自用魔改**：使用 `node build.mjs --local`。产物自动移除 `@updateURL`/`@downloadURL`，并将 `@name` 改写为 `SeekChat (Local)`、`@namespace` 改写为 `https://www.nodeseek.com/#seekchat-local`，左下角显示「本地 vX.Y.Z」并禁用远程更新。
- **Fork 后公开分发**：仅需修改 `src/00-meta.js` 的 `@name`、`@namespace`、`@updateURL` 与 `@downloadURL` 为自有仓库地址，`02-utils-api.js` 自动跟随生效；如需隔离本地缓存，在 `01-config-icons.js` 统一为 `LS` 键值增加前缀即可。
- **版本基线管理**：正式发布合并至 `main` 并打 Tag（如 `v7.20.2`）供检出基线；实验性改动在独立分支或 GitHub Pre-release 验证后再合入主线。

---

## 3. 模块职责边界与关键约束

### 3.1 分层定义表

| 层级 | 模块 | 核心职责 | 边界限制 |
| :--- | :--- | :--- | :--- |
| 元数据层 | `00-meta.js` | 声明 `@name`、`@version`、`@author`、`@grant`、`@connect` 与更新源 | 禁止包含可执行逻辑 |
| 基础配置层 | `01-config-icons.js` | 定义 `LS`、`ICONS`、`CHANNELS`、`STICKER_GROUPS` 与单一全局 `state`；执行 `document-start` 防闪屏与 iframe 早退 | 不依赖业务 DOM，不发起网络请求 |
| 基础设施层 | `02-utils-api.js` | 存储防抖与 LRU 裁剪、`escHtml`、`withHiddenIframe`、`apiGetJson` / `apiPostJson`、`computeDynamicSign` / `signedApiFetchJson`、`#temp-script` 提取、时间格式化、黑名单同步、收藏与更新检测 | 不拼接业务卡片或布局 HTML |
| 视觉令牌层 | `03-styles.js` | 通过 `injectStyles()` 注入全局样式、三套主题变量、自适应布局及卡片/弹窗皮肤 | 不包含运行时逻辑或静态业务数据 |
| 独立服务层 | `04-nodeimage.js` | 封装 `NodeImage` 上传、鉴权、图库弹窗及剪贴板/拖拽监听 | 不操作帖子楼层或频道列表状态 |
| 工作台与增强层 | `05-shell-composer.js` | 构建 `#nsc-app-shell`、主题开关、编辑器调度、发帖弹窗、缩放灯箱及气泡内容增强管线 | 不直接管理板块拉取或私信列表分页 |
| 频道与消息流层 | `06-channels-messages.js` | 左侧导航、版块瀑布流、未读计数同步、`markViewed` 探测与持久化、私信收发及 UID 5230 系统通知格式化 | 不解析帖子楼层树与楼中楼互动 |
| 群聊阅读核心层 | `07-post-chat.js` | 帖子解析、楼中楼建树、双向瀑布流、楼层直达、悬停/胶囊互动与无刷新编辑弹窗 | 不负责左侧栏目切换或右侧社交面板 |
| 个人空间与右栏层 | `08-profile-right.js` | 用户名片弹窗、右侧热榜/好友/粉丝/黑名单、眼睛查发言、悬浮个人中心（`#nsc-hub-backdrop`）及每日签到 | 不修改帖子楼层数据模型 |
| 生命周期入口层 | `09-main.js` | 劫持 `history.pushState` / `replaceState` 与 `popstate`，监听 DOM 变化并调度 `toggleAppMode` | 不承担具体视图渲染实现 |

### 3.2 不可破坏的运行时不变量

1. **气泡内容增强管线顺序**（`05-shell-composer.js`、`06`、`07`，可在「基座 → 扩展与兼容」按需开关）：
   ```text
   10: enhanceNsApps(el)              // 解析 nsapp:// 与原生 .stardust-panel / .vote-panel
   20: linkifyFloorReferences(el)     // 识别 #楼层文本（排除 .nsc-sd-card / .nsc-vote-card）
   30: enhanceMagicTabs(el)           // 绑定测评帖直系标签切换（禁止外包父容器）
   35: enhanceAnsiBlocks(el)          // 解析 ANSI 256/16/真彩终端序列并提取纯文本
   38: enhanceTables(el)              // 包装 Markdown 表格容器（圆角边框与横向滚动）
   40: enhanceCodeBlocks(el)          // 挂载代码块复制按钮（ANSI 优先复制纯文本）
   45: enhanceVideos(el)              // 16:9 宽屏自适应视频容器（B站/外链 iframe & video）
   50: processBubbleImages(el)        // 连续纯图宫格画廊与灯箱绑定（避开卡片/表格/标签页）
   ```
2. **Magic Tabs 原生 DOM 结构约束**（`05-shell-composer.js: enhanceMagicTabs`）：  
   `.nsk-magic-tabs` 的直接子元素仅允许为 `.nsk-magic-tab-title` 与 `.nsk-magic-tab-body`；严禁向其内部插入额外包裹节点（如 `.nsc-magic-tab-bar`），否则站内 CSS 校验规则会隐藏标题并渲染 `Only tab item is allowed in tabs` 异常提示。
3. **HTML 安全转义**：所有接口或用户输入的纯文本进入 `innerHTML` 前必须经 `escHtml()` 处理；用户签名与简易 Markdown 输出须经 `sanitizeSignatureHtml()` 净化。

---

## 4. 已验证的 NodeSeek 接口契约

| 业务域 | 方法与路径 | 请求头/参数要点 | 用途 |
| :--- | :--- | :--- | :--- |
| 帖子与编辑 | `POST /api/content/new-discussion` | `getNodeSeekPostHeaders()` (`csrf-token`) | 发布新主题 |
| 帖子与编辑 | `POST /api/content/edit-discussion` | `getNodeSeekPostHeaders()` | 编辑主题标题与正文 |
| 评论与编辑 | `POST /api/content/new-comment` | `getNodeSeekPostHeaders()` | 发布评论回复 |
| 评论与编辑 | `POST /api/content/edit-comment` | `getNodeSeekPostHeaders()` | 编辑指定 `commentId` |
| 内容列表 | `GET /api/content/list-discussions?uid=&page=` | Cookie 会话 | 获取用户主题列表 |
| 内容列表 | `GET /api/content/list-comments?uid=&page=` | Cookie 会话 | 获取用户历史评论 |
| 互动统计 | `POST /api/statistics/upvote` | `{ commentId, action: "add" }` | 点赞（星辰 +1） |
| 互动统计 | `POST /api/statistics/like` | `{ commentId, action: "add" }` | 加鸡腿 |
| 互动统计 | `POST /api/statistics/dislike` | `{ commentId, action: "add" }` | 反对（踩） |
| 收藏管理 | `GET /api/statistics/list-collection?page=` | Cookie 会话 | 获取收藏夹分页 |
| 收藏管理 | `POST /api/statistics/collection` | `{ postId, action: "add" \| "remove" }` | 收藏/取消收藏 |
| 投票协议 | `GET /api/vote/info/:voteId` | `signedApiFetchJson`（带 `x-dynamic-sign`） | 读取投票配置与实时票数 |
| 投票协议 | `POST /api/vote/voteforitem` | `signedApiFetchJson`，`{ ids: number[] }` | 提交单选/多选投票 |
| 星辰体系 | `GET /api/stardust/list` | `member_id`、`peer_id`、`ref_id`、`before_id`、`count` | 星辰账簿与收款卡片状态校验 |
| 星辰付款页 | `GET /stardust/payment` | 须保留 `window.opener` 与 `callback-origin` | 拉起官方星辰打赏弹窗 |
| 账号与额度 | `GET /api/account/getInfo/:uid?readme=1` | Cookie 会话 | 用户资料、余额与签名/README |
| 鸡腿账簿 | `GET /api/account/credit/page-:page` | Cookie 会话 | 分页鸡腿收支明细 |
| 每日额度 | `GET /api/progress/today?scope=freelike` | Cookie 会话 | 查询当日免费投喂鸡腿额度 |
| 签到与榜单 | `POST /api/attendance?random=true\|false` | Cookie 会话 | 执行随机或固定签到 |
| 签到与榜单 | `GET /api/attendance/board?page=` | Cookie 会话 | 今日签到排行榜 |
| 通知与私信 | `GET /api/notification/unread-count` | `cache: "no-store"` | 获取各通道未读计数 |
| 通知与私信 | `GET /api/notification/(at-me\|reply-to-me)/list` | Cookie 会话 | 获取艾特与回复通知列表 |
| 通知与私信 | `POST /api/notification/(at-me\|reply-to-me)/markViewed` | 支持 `?all=true` 或多载荷探测 | 标记通知已读 |
| 通知与私信 | `GET /api/notification/message/list?page=1` | Cookie 会话 | 私信会话列表 |
| 通知与私信 | `GET /api/notification/message/with/:uid` | Cookie 会话 | 与指定用户对话（`5230` 为系统通知） |
| 通知与私信 | `POST /api/notification/message/send` | `{ receiverUid, content, markdown: true }` | 发送站内私信 |
| 通知与私信 | `POST /api/notification/message/markViewed` | `{ messages: number[] }` | 批量标记私信/系统通知已读 |
| 社交与屏蔽 | `GET /api/fans/(follow\|fans)` | Cookie 会话 | 关注列表与粉丝列表 |
| 社交与屏蔽 | `GET /api/block-list/list` | Cookie 会话 | 获取服务器黑名单 |
| 社交与屏蔽 | `POST /api/block-list/(add\|del)` | `add` 传 `block_member_name`，`del` 传 `block_member_id` | 添加或移出黑名单 |

---

## 5. 二次开发接入模式

### 5.1 新增气泡协议卡片

1. 在 `src/01-config-icons.js` 的 `ICONS` 中补充线性 SVG（`viewBox="0 0 24 24"`、`stroke="currentColor"`）。
2. 在 `src/05-shell-composer.js` 中参照 `createStardustCardElement` / `createVoteCardElement` 编写解析器与自包含渲染器；需签名接口复用 `signedApiFetchJson()`，卡片根节点需阻止点击冒泡以防误触 `blockquote` 折叠。
3. 在 `src/03-styles.js` 补全 Light / Dusk / Dark 样式，显式设置 `background: var(--nsc-bg-card); color: var(--nsc-text);`，卡片内头像需显式覆写 `.nsc-bubble img` 的全局尺寸。
4. 在 `enhanceNsApps()` 接入原始链接、纯文本节点与原生预渲染节点三种输入分支。

### 5.2 新增个人中心悬浮窗标签页

1. 在 `src/01-config-icons.js` 的 `state.hubData` 初始化对应数据存储。
2. 在 `src/08-profile-right.js` 编写加载函数（分页场景复用 `loadPaginatedHubStore`）。
3. 在 `renderUserHub()` 的 `nativeHrefMap`、`tabs`、`persistentBody` 触底瀑布流分发器及 `openUserHubModal()` 中完成注册。

### 5.3 插槽化扩展与零冲突升级架构（已落地基础底座）

自 `v7.21.0` 起，核心底座已落地「目录自动发现 + 插槽注册表 + 共享 `FeedEngine` + 末位启动」基础架构：

#### 5.3.1 核心与插槽目录分层（Build-Time Isolation）

`build.mjs` 按固定四阶段拼接源码：`01..08` 核心 -> `src/themes/*.js` -> `src/plugins/*.js`（同目录下非 `custom-` 文件先加载，`custom-*` 文件后加载）-> 自动注入 `NSC_DISCOVERED_MODULES` 清单 -> `09-main.js` 末位启动。

**上游更新与二开同步保障机制**：
1. `src/themes/custom-*.js` 与 `src/plugins/custom-*.js` 为**二开保留命名空间**，上游主线永不创建或修改 `custom-*` 前缀文件；
2. 宿主层（`03`、`05`、`06`、`07`、`08`）通过统一注册表遍历已挂载插件与主题；
3. 当主线发布新版时，二开者同步主线代码后执行 `node build.mjs --local`，自研 `custom-*.js` 自动挂载生效，避免直接改动核心文件造成的合并冲突。

#### 5.3.2 共享深度模块：`FeedEngine`（统一瀑布流与限频批处理）

`02-utils-api.js` 已提供 `createFeedEngine(spec)` 与 `bindWaterfallScroll(scrollEl, getEngineFn)`：

```text
┌───────────────────────────────────────────────────────────────────┐
│ Small Interface: createFeedEngine({ key, mode, fetchPage, ... })  │
│   Methods: loadNext() | runBatch(opts) | abort() | reset()        │
│   State:   { items, page, cursor, hasMore, running, progress }    │
├───────────────────────────────────────────────────────────────────┤
│ Deep Implementation (隐藏全部防冲突细节):                          │
│   1. mutexGroup 单例互斥锁：同域重度批处理任务避免并发触发风控     │
│   2. runSeq + AbortController：切换视图或取消立即中断在途请求      │
│   3. 通用去重与分页适配：同时兼容 page 页码翻页与 before_id 游标   │
│   4. 统一 rAF 触底监听绑定与状态更新回调                           │
└───────────────────────────────────────────────────────────────────┘
```

#### 5.3.3 标准扩展插槽（Extension Seams）

| 插槽接口 | 宿主位置 | 适配器契约（Adapter Shape） | 当前状态 |
| :--- | :--- | :--- | :--- |
| `registerTheme(manifest)` | `03-styles.js`、`05` | `{ id, name, desc?, baseScheme: "light"\|"dark", order?, tokens, extraCss? }` | 已接入并运行于 `src/themes/mac-default.js` |
| `PaneSkinManager` (`applyPaneSkinsToDom`) | `02`、`03`、`plugins/core-workbench-base.js` | `panes: { nav, list, chat, right } -> { url, opacity, blur, fit }` | 已接入四分区 `::before` 底层与统一调节面板 |
| `registerHubTab(tabSpec)` | `08-profile-right.js` | `{ id, label, order, badgeFn?, nativeHref?, onOpen?, onScrollEnd?, renderSubbar, renderBody }` | 已接入个人中心扩展与账本子视图 |
| `registerBubbleEnhancer(spec)` | `02`、`05`、`06`、`07` | `{ id, priority, run(el, ctx) }` | 已接管 8 项正文增强并支持独立开关 |
| `registerUserAction(spec)` | `02`、`08` | `{ id, places: ["profile"], order?, labelFn, visibleFn?, onClick }` | 名片弹窗已接入，其余位置按需扩展 |
| `registerNavItem(spec)` | `02`、`06` | `{ id, name, icon, path, group, order?, onClick? }` | 左侧栏与调序基座已接入 |

---

## 6. 开发进度与演进路线图

状态约定：`- [x]` 已合入主线并随基线构建验证；`- [ ]` 规划待开发项（开工前先补齐实现方式）。

### 6.1 已完成能力清单（基线：`v7.22.38`）

#### 工作台骨架、独立基座与外观主题
- [x] **四栏可收缩桌面**：macOS 风格布局、防闪屏守卫、群聊/原版零残留切换，导航/列表/右侧栏居中收缩扩展阅读区（`01`、`03`、`05`、`06`、`09`）
- [x] **插槽化扩展底座**：`build.mjs` 自动扫描 `themes/` 与 `plugins/`（`custom-*` 后置隔离）、`ThemeRegistry` 三态主题、共享 `FeedEngine` 与五大扩展插槽（`02`、`03`、`05`、`08`）
- [x] **独立惰性「基座」悬浮窗**：可拖动记忆位置悬浮球懒加载开启，含外观主题、四区皮肤、栏位调序、排版与交互、原版 CSS 备忘录及 8 项正文增强/扩展兼容开关（`core-workbench-base.js`）
- [x] **同源界面换肤**：个人中心「设置 / 幸运抽奖 / 邀请好友」同源 iframe 套用 macOS 主题并自动定位扩展区（`08`）

#### 频道浏览、阅读体验与编辑器
- [x] **版块与足迹导航**：全版块瀑布流、关键词检索与自动补页、未读/增量角标、原地未读过滤与「已读足迹」（`02`、`06`）
- [x] **楼层阅读与互动**：双向瀑布流（DOM 锚点防反弹）、居中楼中楼聚合与防复折叠、只看楼主/成员、楼层与 `commentId` 直达、`#temp-script` 水合、悬停操作条及蓝气泡全主题对比度隔离（`02`、`03`、`07`）
- [x] **双路由编辑器体系**：帖子页借调复用官方 `.md-editor`（`MutationObserver` 同步增强工具栏），非帖子页兜底 `buildUnifiedComposer()`；支持三主题线性 SVG 工具栏、常用模板光标定位、48px 严格单行宽适应表情网格、`- / +` 五档高度步进、实心图钉固定、居中全屏编辑与跨页引用（`01`、`03`、`05`、`07`）
- [x] **外链安全跳转**：拦截 `/jump?to=` 提供页内 macOS 二级确认弹窗，支持官方白名单直跳、就地勾选免提醒与基座三档配置（`02`、`03`、`05`）
- [x] **零闪屏与抗卡顿**：评论增量追加、切帖轻量过渡、启动仅拉首页 SWR 快照、`userCache` 12h TTL、`IntersectionObserver` 懒加载徽章、10 篇帖子 LRU 缓存与第三方浮层隔离（`01`、`02`、`05`–`09`）

#### 富媒体与协议卡片
- [x] **星辰与投票卡片**：`nsapp://stardust-receive` 状态校验与弹窗打赏回刷；`nsapp://vote` 动态签名鉴权与实时占比条（`01`–`03`、`05`）
- [x] **富媒体排版增强**：测评 `.nsk-magic-tabs` 直系结构保留、ANSI 终端彩色块、表格圆角滚动包装、代码块复制、16:9 宽屏自适应视频播放器（解除 `300×169` 锁死并随侧边栏收缩扩宽至 `1080px`）、宫格画廊与灯箱真实像素缩放（`03`、`05`）
- [x] **NodeImage 图床直传**：授权检测、拖拽/粘贴上传、最近 12 张分页图库、对角防误触删除/插入图标与批量插删（`04`）

#### 消息中心、社交、个人中心与更新
- [x] **全通道消息中心**：`@我`、`回复我` 多页同步与 `markViewed` 探测、站内私信（含预览）及 UID 5230 系统通知结构化标签（`06`）
- [x] **右栏与社交关系**：热榜（实时/日/周榜）、关注/粉丝、黑名单同步与单人/批量最后发言查询（`02`、`06`、`08`）
- [x] **名片与空间系统**：名片预加载、双源管理记录查询（`api.xxboxx.de` + `nodeseek-rulings.898252.xyz` 限流回退、UTC+8 换算、关键字高亮与悬停/锁定浮层直达关联内容）、查最后发言自动定位与 macOS 二级空间弹窗（`02`、`03`、`08`）
- [x] **个人资产与签到**：百页鸡腿统计与全量星辰账本分析（`core-hub-analytics.js`）、固定/随机/每日自动签到与信用账簿今日收益同步（`08`）
- [x] **零缓存更新检测**：基于 `GM_info.script` 单一权威源，优先经 `github.com/.../info/refs` 零限流零缓存解析最新 Commit SHA 与不可变安装直链，支持 `--local` 防覆盖构建（`02`、`build.mjs`）

---

### 6.2 待开发路线图（Backlog）

- [ ] **NodeSeek 邮箱联动（`https://seek.li/login`）**
  - **目标范围**：在右侧个人信息区快捷图标栏最前方（`.nsc-right-user .user-card .user-head .menu > div`）插入 `✉` 邮箱图标，一键快速查看或跳转 NodeSeek 邮件。
  - **实现方式（待补充）**：
    - 接入路径：`<待补充：新标签页直达 / 页内浮窗嵌入 / seek.li 登录态与未读邮件拉取接口>`
    - 挂载位置：`src/08-profile-right.js` 右侧个人信息卡片操作图标栏首位

- [ ] **服务端关注/取关同步与快捷关注/屏蔽按钮**
  - **现状与约束**：`02-utils-api.js: toggleFriend` 仅读写本地 `LS.FRIENDS`，未同步服务端 `/api/fans/follow`；屏蔽操作仅在名片与右栏「黑名单」提供。
  - **目标范围**：打通关注/取关服务端双向同步，并在楼层头部、私信头部或右栏行内补充防误触快捷「关注 / 屏蔽」按钮。
  - **实现方式（待补充）**：
    - 服务端接口：`<待补充：关注/取关接口路径、载荷格式与响应校验>`
    - 挂载位置：`<待补充：气泡作者旁 / 悬停条 / 右栏列表行内>`

- [ ] **全路由星辰主动转账面板**
  - **现状与约束**：非帖子页原站未挂载转账弹窗组件，导致名片内原生转账入口无响应。
  - **目标范围**：在个人中心或用户名片内提供不依赖原站隐藏组件的星辰主动转账面板。
  - **实现方式（待补充）**：
    - 转账路径：`<待补充：拉起 /stardust/payment 弹窗或直连转账接口>`

- [ ] **纯函数回归测试套件（`node:test`）**
  - **目标范围**：基于 Node.js 内置 `node:test` 为核心纯函数补充零依赖回归测试（覆盖 `nsapp://` 解析、系统通知格式化、楼中楼建树、管理记录时间换算、统计聚合与版本比较）。
  - **实现方式（待补充）**：`<待纯函数导出 seam 收敛后同步接入>`

<!--
新增待办模板（复制后填入 6.2 节）：
- [ ] **功能标题**
  - **现状与约束**：<现有实现或边界限制>
  - **目标范围**：<预期交付效果>
  - **实现方式（待补充）**：
    - 接口/数据源：<待补充>
    - 挂载位置与交互：<待补充>
-->
