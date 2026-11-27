# SeekChat 二次开发与架构规范

- **当前基线**：`v7.22.19`（分支策略：`main` 存放正式发布版与基线 Tag；`dev` 分支用于日常测试与实验迭代，验证通过后合并至 `main`）
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

1. **气泡内容增强管线顺序**（`07-post-chat.js`、`06-channels-messages.js`）：
   ```text
   enhanceNsApps(el)              // 1. 解析 nsapp:// 与原生 .stardust-panel / .vote-panel
     -> linkifyFloorReferences(el)// 2. 识别 #楼层文本（已排除 .nsc-sd-card / .nsc-vote-card）
     -> enhanceMagicTabs(el)      // 3. 绑定测评帖直系标签切换（禁止外包父容器，防触发站点报错）
     -> enhanceAnsiBlocks(el)     // 4. 解析 ANSI 256/16/真彩终端序列并提取纯文本
     -> enhanceTables(el)         // 5. 包装 Markdown 表格容器以支持圆角边框与横向滚动
     -> enhanceCodeBlocks(el)     // 6. 挂载代码块复制按钮（ANSI 块优先复制已剥离转义码的纯文本）
     -> processBubbleImages(el)   // 7. 连续纯图聚合宫格与灯箱绑定（避开卡片头像、表格与标签页图片）
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
| `registerHubTab(tabSpec)` | `08-profile-right.js` | `{ id, label, order, badgeFn?, nativeHref?, onOpen?, onScrollEnd?, renderSubbar, renderBody }` | 已接入 `workbench`（「基座」）插件标签页 |
| `registerBubbleEnhancer(spec)` | `05`、`06`、`07` | `{ id, priority, run(el, ctx) }` | 已全量接管 `nsapp` / `floor-ref` / `magic-tabs` / `code-blocks` / `images` |
| `registerUserAction(spec)` | `02`、`08` | `{ id, places: ["profile"], order?, labelFn, visibleFn?, onClick }` | 名片弹窗已接入，其余位置按需扩展 |
| `registerNavItem(spec)` | `02`、`06` | `{ id, name, icon, path, group, order?, onClick? }` | 左侧栏与调序基座已接入 |

---

## 6. 开发进度与演进路线图

状态约定：`- [x]` 表示已合入主线并随基线构建验证；`- [ ]` 表示规划待实现需求，**开发前需先补全或确认其「实现方式」条目中的接口与交互细节**。

### 6.1 已完成能力清单（基线：`v7.22.19`）

#### 工作台骨架、基座中心与外观主题
- [x] macOS 四栏桌面布局与防闪屏启动守卫，支持「群聊模式 / 原版论坛」零残留切换（`01`、`03`、`05`、`06`、`09`）
- [x] `ThemeRegistry` 主题注册中心与默认 macOS 三态主题抽离（`03-styles.js`、`src/themes/mac-default.js`、`05`、`06`）
- [x] `build.mjs` 目录自动发现（`src/themes/*.js`、`src/plugins/*.js`、`custom-*` 后置隔离与 `NSC_DISCOVERED_MODULES` 清单注入）
- [x] 共享 `FeedEngine`（瀑布流分页 + `mutexGroup` 限频批处理 + `AbortController`）与五大扩展插槽（`02-utils-api.js`、`05`、`06`、`07`、`08`）
- [x] 工作台统一「基座」配置中心（`src/plugins/core-workbench-base.js`，通过个人名片进入浮窗统一管理，保持主界面零冗余入口）：
  - [x] 主题选择中心（自动识别内置与扩展主题）
  - [x] 四分区皮肤基座（导航区 / 帖子区 / 聊天底图 / 个人信息区独立图片 URL/本地图 + 共享透明度/模糊度滑块 + 推荐尺寸提示）
  - [x] 组件调序与显隐基座（左侧导航排序/显隐 + 右侧栏 `热榜/好友/粉丝/黑名单` 排序/显隐）
  - [x] 排版与回复区基座（正文行距 / 消息间距 / 图片最大尺寸滑块 + 自定义表情分组管理器）
  - [x] 原版扩展备忘录基座（内置「80hou预留」萌系封边预设、多段 CSS 备忘管理、一键复制与无闪屏自动跳转定位设置页「论坛扩展」引导）
  - [x] 扩展插槽与目录探测状态面板
- [x] 个人中心「鸡腿 100 页深度统计」与「星辰全量账本分析器」（`src/plugins/core-hub-analytics.js`，基于共享 `FeedEngine` 限频拉取、等高对齐排行、双向点赞/转账 Top 20 排行榜与「复制统计排行」导出、全列正反排序与瀑布流自动加载）
- [x] 个人中心「粉丝 / 关注」列表单人最后发言查询（眼睛图标）、批量查询与按活跃排序（`08-profile-right.js`）
- [x] 个人中心设置 / 幸运抽奖 / 邀请好友同源 iframe 换肤适配（`08-profile-right.js: mountHubThemedIframe`）

#### 频道浏览、帖子阅读与交互
- [x] 全版块瀑布流加载、关键词搜索防抖与自动补页、未读/增量角标、版块内原地切换未读/已读视图与全站「已读足迹」返回导航（`02`、`06`）
- [x] 帖子双向瀑布流（向上回溯 DOM 锚点保活，避免跨页楼中楼聚合造成视口反弹）、楼中楼树聚合与折叠（`jumpToFloor` 跨页预拉父楼层、防瀑布流抢跑与防重绘复折叠）、只看楼主/只看成员、楼层号直达（`05`、`07-post-chat.js`）
- [x] `#temp-script` 元数据水合（点赞/鸡腿/踩/置顶状态）、0.5 秒悬停无边框操作条及底部反应徽章（`02`、`07`）
- [x] 无刷新发表新主题（自动复用官方 `.md-editor` 或对齐版 `内容/预览/对照` + 全套贴图/App/一键清空编辑器）、主贴/评论编辑弹窗（HTML 转 Markdown）、统一全路由看帖与私信编辑器（固定 6 行稳定高度、单行不折行工具栏、点击输入框/外部空白处自动收起表情面板、修复 CodeMirror 含图长行滚动跳动）、跨页稳定引用、帖子收藏同步与点击帖子标题一键复制链接（`01`、`02`、`03`、`04`、`05`、`06`、`07`）
- [x] 零闪屏增量同步与第三方脚本兼容：无刷新发布评论增量追加楼层、切帖轻量过渡态与单次列表选中高亮、启动去延迟、`MutationObserver` 隔离与运行时外部特征探测（`02`、`06`、`07`、`09`、`core-workbench-base.js`）
- [x] 晚高峰按需加载与轻量缓存优化：启动仅拉首页（支持 60s SWR 快照）、移除跨版块与收藏预拉（收藏点击时按需核实）、系统通知/黑名单按需同步、热榜 5 分钟本地缓存、`userCache` 12 小时 TTL、`IntersectionObserver` 视口懒加载等级徽章、10 篇帖子内存 LRU 缓存（保留滚动位置）及头像全量 `loading="lazy" decoding="async"` 异步解码（`01`、`02`、`05`、`06`、`07`、`08`）

#### 富媒体与协议卡片增强
- [x] `nsapp://stardust-receive` 星辰收款卡片：星轨图标视觉升级、待付款/未付款/已打赏状态分化、流水聚合、个人付款态校验、弹窗付款与关闭后自动回刷；官方 `App` 弹出胶囊紧凑锚定适配（`01`、`03`、`05-shell-composer.js`）
- [x] `nsapp://vote` 投票卡片：`x-dynamic-sign` 鉴权、单选/多选、内联二次确认、实时占比条形图（`02`、`05`）
- [x] 测评帖 `.nsk-magic-tabs` 直系结构保留与自适应切换排版（`03`、`05-shell-composer.js: enhanceMagicTabs`）
- [x] ANSI 终端代码块（`language-ansi` / `data-ansicode="27"`）彩色渲染、Markdown 表格边框/滚动包装及正文超链接绿色高亮（`03`、`05`）
- [x] 代码块一键复制、按图片长宽比自适应的多图无裁切宫格画廊（1/2/3 列 + `contain` 等比缩放）、多图灯箱真实像素缩放（左右翻页箭头随图片宽度自适应紧贴边缘、点击任意非交互空白区关闭）与 NodeImage 授权直传（`04`、`05`）

#### 消息中心、社交与个人中心
- [x] `@我`、`回复我` 多页预拉取与 `markViewed` 探测同步、站内私信（含 Markdown 预览）、UID 5230 系统通知结构化标签（`06`）
- [x] 右侧热榜（实时/日榜/周榜及站内降级回退）、关注/粉丝同步、服务器黑名单增删、单人及批量最后发言查询（`02`、`06`、`08`）
- [x] 悬浮个人中心（通知/主题/评论/收藏/鸡腿/星辰/粉丝/等级额度）、名片预加载与 macOS 二级空间主页弹窗（主题帖/历史评论瀑布流、README 签名、右上角「访问原版 ↗」直达）及固定/随机/每日首次访问自动签到（`03`、`05`、`08-profile-right.js`）
- [x] 基于 `GM_info.script` 的单一权威源更新检测（1 小时节流、Tag/SHA 防 Fastly 300s 缓存直达安装）与 `--local` 防覆盖构建模式（`02`、`build.mjs`）

---

### 6.2 待开发路线图（Backlog）

> **开发者与 Agent 协作提示**：本节用于承接后续功能迭代。在认领某项 `- [ ]` 任务并开始编码前，请确认其「实现方式（待补充）」已补齐具体接口或产品交互约束。

- [x] 核心底座前置：插槽注册表、`themes/` 与 `plugins/` 自动扫描、四区皮肤/组件调序/排版表情共享基座与 `FeedEngine` 引擎已落地于 `v7.21.0`（后续具体业务插件按下方条目逐个接入）

- [x] **UI 皮肤系统基础框架（已于 `v7.21.0` 完成基座，待按需微调预设）**：四分区底层 `::before` 隔离渲染、透明度/模糊度/填充方式共享滑块、推荐尺寸标识与本地图片导入已落地于 `src/plugins/core-workbench-base.js`；后续仅需按实际视觉反馈微调默认预设或导出/导入 JSON。

- [x] **主题插件化基础框架（已于 `v7.21.0` 完成基座，后续可扩充更多主题包）**：默认 macOS 三套主题已抽离至 `src/themes/mac-default.js` 并接入 `ThemeRegistry`，在「基座 -> 主题中心」可直接切换任意自动扫描到的主题包。

- [x] **星辰全量账本分析面板（已于 `v7.22.0` 落地 `src/plugins/core-hub-analytics.js`）**：挂载于个人中心「星辰 -> 全量分析」，基于 `FeedEngine` 游标全量拉取与 macOS 风格展示，支持分类筛选、搜索、昵称补全与 `:::: tabs` Markdown 导出。

- [x] **近 100 页鸡腿细粒度统计分析看板（已于 `v7.22.0` 落地 `src/plugins/core-hub-analytics.js`）**：挂载于个人中心「鸡腿 -> 100页深度统计」，支持进度显示/中止、收支分类、签到手气分布条形图与投喂大佬排行榜。

- [ ] **管理处罚记录查询（对接外部查询接口）**
  - **设计约束**：不自行爬取、分页采集或本地持久化原站 `/ruling` 100 页历史记录（采集成本与本地存储开销不可控），直接复用社区已有的管理记录查询脚本/公开接口。
  - **目标范围**：将左侧栏底部「管理」入口（`#nsc-nf-ruling`）由外链升级为工作台内可检索视图，支持按用户/类型筛选并关联跳转涉事帖子。
  - **实现方式（待补充）**：
    - 外部查询接口 URL / 请求方法：`<待补充：第三方管理记录 API 端点与参数格式>`
    - 返回字段映射与缓存策略：`<待补充：记录结构、分页游标、是否走 GM_xmlhttpRequest 跨域>`
    - 展示位置与交互：`<待补充：右侧面板 / 个人中心插槽 / 独立检索弹窗>`

- [ ] **服务端关注/取关同步与快捷关注/屏蔽按钮**
  - **现状与约束**：`02-utils-api.js: toggleFriend` 仅读写本地 `localStorage`（`LS.FRIENDS`），未同步 NodeSeek 服务端关注状态；屏蔽操作当前仅存在于名片弹窗与右侧「黑名单」面板。
  - **目标范围**：打通服务端关注/取关接口使「好友」列表与站内 `/api/fans/follow` 双向同步，并在楼层消息头部/私信头部/右栏列表行内补充快捷「关注 / 屏蔽」按钮（屏蔽操作需防误触确认）。
  - **实现方式（待补充）**：
    - 服务端关注/取关 API：`<待补充：具体接口路径、请求体参数与响应校验>`
    - 快捷按钮挂载位置：`<待补充：气泡作者旁 / 悬停条 / 名片或右栏行内>`

- [ ] **全路由星辰主动转账面板**
  - **现状与约束**：在首页 `/` 等非帖子详情页，原站未挂载转账弹窗组件，导致名片内原生转账入口无响应。
  - **目标范围**：在个人中心或用户名片弹窗内提供不依赖原站隐藏组件的星辰主动转账面板。
  - **实现方式（待补充）**：
    - 转账执行路径：`<待补充：调用 /stardust/payment 弹窗或直连转账接口>`

- [ ] **工程可维护性演进（纯函数回归测试套件）**
  - **目标范围**：在保持零外部测试依赖的前提下，基于 Node.js 内置 `node:test` 补充核心解析器与工具函数回归测试（覆盖 `nsapp://` 解析、系统通知格式化、楼中楼建树、星辰/鸡腿统计聚合与版本比较）。
  - **实现方式（待补充）**：`<待核心与插件目录拆分落地后同步接入>`

<!--
新增待办模板（复制后填入 6.2 节）：
- [ ] **功能标题**
  - **现状与约束**：<现有实现或边界限制>
  - **目标范围**：<预期交付效果>
  - **实现方式（待补充）**：
    - 接口/数据源：<待补充>
    - 挂载位置与交互：<待补充>
-->
