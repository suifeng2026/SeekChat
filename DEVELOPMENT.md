# SeekChat 二次开发与架构规范

- **当前基线**：`v7.20.2`
- **目标平台**：NodeSeek（`https://www.nodeseek.com/*`、`https://nodeseek.com/*`）Tampermonkey / Violentmonkey
- **构建产物**：`dist/nodeseek-chat-ui.user.js`、`dist/nodeseek-chat-ui.meta.js`
- **工程定位**：零运行时依赖、词法模块化、高性能并发安全、macOS 风格美化

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
├── dist/
│   ├── nodeseek-chat-ui.meta.js   # Tampermonkey 更新检测元文件
│   └── nodeseek-chat-ui.user.js   # 正式发布单文件脚本
└── src/
    ├── 00-meta.js                 # UserScript 元信息（@name / @version / @grant / 更新源）
    ├── 01-config-icons.js         # LS 存储键、防闪屏守卫、SVG 图标集、频道表与全局 state
    ├── 02-utils-api.js            # 缓存治理、API 封装、x-dynamic-sign 签名、名单与更新检测
    ├── 03-styles.js               # CSS 变量、Light/Dusk/Dark 主题、四栏布局与弹窗/卡片样式
    ├── 04-nodeimage.js            # NodeImage 图床授权、上传、图库管理、粘贴/拖拽监听
    ├── 05-shell-composer.js       # 四栏骨架、外观切换、编辑器调度、发帖弹窗、灯箱与内容增强器
    ├── 06-channels-messages.js    # 左侧导航、版块瀑布流、@我/回复我/私信/系统通知(5230)
    ├── 07-post-chat.js            # 帖子解析、双向瀑布流、楼中楼构建、楼层互动与编辑弹窗
    ├── 08-profile-right.js        # 名片弹窗、右栏(热榜/好友/粉丝/黑名单)、悬浮个人中心与签到
    └── 09-main.js                 # SPA 路由劫持、DOM 观察器与启动入口
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
     -> enhanceCodeBlocks(el)     // 4. 挂载代码块复制按钮
     -> processBubbleImages(el)   // 5. 连续纯图聚合宫格与灯箱绑定（避开卡片头像与标签页图片）
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

### 5.3 插槽化扩展与零冲突升级架构推演（演进设计）

当前 `05`、`06`、`08` 模块内部仍存在硬编码分支（例如 `renderUserHub()` 的标签枚举、`applyThemeMode()` 的三态判断、多处重复的分页与批量抓取逻辑）。当后续新增全量账本统计、UI 分区皮肤、自定义主题或外部二开功能时，直接修改核心文件会导致上游更新与二开分支产生合并冲突。

为实现**「功能即独立模块、共用底层瀑布流、上游升级不覆盖二开代码」**，后续重构按以下三部分推进：

#### 5.3.1 核心与插槽目录分层（Build-Time Isolation）

将现有扁平的 `src/00..09` 演进为「核心底座 + 插件插槽 + 末位启动」拓扑，`build.mjs` 按固定阶段拼接：

```text
src/
├── 00-meta.js                 # 脚本头与更新源
├── 01-config-icons.js         # 核心配置、LS 键前缀、state 与全局插槽容器
├── 02-utils-api.js            # 核心网络、签名、缓存、FeedEngine 调度器与 Registry API
├── 03-styles.js               # 结构骨架 CSS 与主题令牌编译器
├── 04-nodeimage.js            # 图床基础服务
├── 05-shell-composer.js       # 四栏宿主容器、编辑器与插槽挂载点
├── 06-channels-messages.js    # 频道与消息主流程
├── 07-post-chat.js            # 帖子阅读与楼层模型
├── 08-profile-right.js        # 右栏宿主与 Hub 容器框架
├── themes/                    # 主题包插槽（按文件顺序注册）
│   ├── mac-default.js         # 内置 macOS 浅色 / 黄昏 / 分层暗黑主题包
│   └── custom-*.js            # 二开自定义主题包（上游更新不触碰）
├── plugins/                   # 功能模块插槽（按文件顺序注册）
│   ├── core-*.js              # 官方标准功能插件（全量星辰、百页鸡腿、分区皮肤、管理查询等）
│   └── custom-*.js            # 二开自定义功能插件（上游更新不触碰）
└── 09-main.js                 # 末位启动：待所有 themes/ 与 plugins/ 注册完毕后统一挂载
```

**上游更新与二开同步保障机制**：
1. 约定 `src/themes/custom-*.js` 与 `src/plugins/custom-*.js` 为**二开保留命名空间**，上游主线永不创建或修改 `custom-*` 前缀文件；
2. 宿主层（`03`、`05`、`07`、`08`）不再硬编码功能列表，仅通过统一注册表遍历已挂载插件；
3. 当主线发布新版（例如新增 `plugins/core-stardust-ledger.js` 或修复 `07-post-chat.js`）时，二开者只需同步主线代码（`git pull` 或覆盖 `01..08` 与 `core-*.js`）再运行 `node build.mjs --local`，其自研的 `custom-*.js` 自动接入新版本宿主，无需逐行解决代码冲突。

#### 5.3.2 共享深度模块：`FeedEngine`（统一瀑布流与限频批处理）

针对「版块列表、Hub 瀑布流、近 100 页鸡腿统计、全量星辰账本、管理记录查询」共用的分页与抓取需求，在 `02-utils-api.js` 抽象单一深度模块 `createFeedEngine(spec)`，收敛所有并发、节流与状态机细节：

```text
┌───────────────────────────────────────────────────────────────────┐
│ Small Interface: createFeedEngine({ key, mode, fetchPage, ... })  │
│   Methods: loadNext() | runBatch(opts) | abort() | reset()        │
│   State:   { items, page, cursor, hasMore, running, progress }    │
├───────────────────────────────────────────────────────────────────┤
│ Deep Implementation (隐藏全部防冲突细节):                          │
│   1. 单例互斥锁：同域重度任务（如百页统计 / 全量星辰）共享限频队列 │
│   2. 序列号 + AbortController：切换标签或取消时立即中断在途请求    │
│   3. 通用去重与分页适配：同时兼容 page 页码翻页与 before_id 游标   │
│   4. 统一 rAF 触底监听绑定器：bindWaterfallScroll(scrollEl, engine)│
│   5. 结果 TTL 内存缓存与防抖渲染回调（onUpdate）                   │
└───────────────────────────────────────────────────────────────────┘
```

**防冲突要点**：
- 任何触底瀑布流只需声明 `fetchPage({ page, cursor, signal }) -> { rows, nextCursor, hasMore }` 即可复用，消除各模块自写 `scroll` 监听与 `loading` 锁；
- 重度批处理任务（如 100 页鸡腿拉取与全量星辰拉取）通过共享限频队列串行/可控并发执行，防止同时触发站内请求频控导致 `403` / `429`。

#### 5.3.3 五大标准扩展插槽（Extension Seams）

| 插槽接口 | 宿主位置 | 适配器契约（Adapter Shape） | 用途示例 |
| :--- | :--- | :--- | :--- |
| `registerTheme(manifest)` | `03-styles.js` | `{ id, name, scheme: "light"\|"dark", tokens, extraCss? }` | 抽离默认 macOS 主题为专有主题模块，第三方主题零侵入接入设置列表 |
| `PaneSkinManager` | `03-styles.js`、`05` | `panes: { nav, list, chat, right } -> { url, opacity, blur, fit }` | 四分区独立背景图、透明度滑块与尺寸推荐校验 |
| `registerHubTab(tabSpec)` | `08-profile-right.js` | `{ id, label, order, badgeFn?, feed?, renderSubbar, renderBody }` | 鸡腿深度统计、全量星辰账本、管理记录均作为独立插件挂载至个人中心 |
| `registerBubbleEnhancer(fn)` | `05`、`06`、`07` | `{ id, priority, run(el, ctx) }` | 按优先级接管气泡渲染，避免增删增强器时修改 `createMessageNode` |
| `registerUserAction(act)` | `07`、`08` | `{ id, places: ["profile","hover","pm"], labelFn, visibleFn, onClick }` | 快捷关注/取关、屏蔽按钮按声明位置自动渲染，无需改动弹窗或气泡模板 |

---

## 6. 开发进度与演进路线图

状态约定：`- [x]` 表示已合入主线并随基线构建验证；`- [ ]` 表示规划待实现需求，**开发前需先补全或确认其「实现方式」条目中的接口与交互细节**。

### 6.1 已完成能力清单（基线：`v7.20.2`）

#### 工作台骨架与外观主题
- [x] macOS 四栏桌面布局与防闪屏启动守卫，支持「群聊模式 / 原版论坛」零残留切换（`01`、`03`、`05`、`06`、`09`）
- [x] 浅色（Light）、黄昏护眼（Dusk）、分层暗黑（Dark）三态主题与左侧栏快捷切换开关（`01`、`03`、`05`）
- [x] 个人中心设置 / 幸运抽奖 / 邀请好友同源 iframe 换肤适配（`08-profile-right.js: mountHubThemedIframe`）

#### 频道浏览、帖子阅读与交互
- [x] 全版块瀑布流加载、关键词搜索防抖与自动补页、未读/增量角标、已读足迹本地持久化（`02`、`06`）
- [x] 帖子双向瀑布流（向上回溯保留滚动锚点）、楼中楼树聚合与折叠、只看楼主/只看成员、楼层号直达（`07-post-chat.js`）
- [x] `#temp-script` 元数据水合（点赞/鸡腿/踩/置顶状态）、0.5 秒悬停无边框操作条及底部反应徽章（`02`、`07`）
- [x] 无刷新发表新主题、主贴/评论编辑弹窗（HTML 转 Markdown）、贴图表情选择器与帖子收藏同步（`02`、`05`、`07`）

#### 富媒体与协议卡片增强
- [x] `nsapp://stardust-receive` 星辰收款卡片：流水聚合、个人付款态校验、弹窗付款与关闭后自动回刷（`05-shell-composer.js`）
- [x] `nsapp://vote` 投票卡片：`x-dynamic-sign` 鉴权、单选/多选、内联二次确认、实时占比条形图（`02`、`05`）
- [x] 测评帖 `.nsk-magic-tabs` 直系结构保留与自适应切换排版（`03`、`05-shell-composer.js: enhanceMagicTabs`）
- [x] 代码块一键复制、连续纯图朋友圈宫格、多图灯箱缩放画廊、NodeImage 授权与粘贴/拖拽传图（`04`、`05`）

#### 消息中心、社交与个人中心
- [x] `@我`、`回复我` 多页预拉取与 `markViewed` 探测同步、站内私信（含 Markdown 预览）、UID 5230 系统通知结构化标签（`06`）
- [x] 右侧热榜（实时/日榜/周榜及站内降级回退）、关注/粉丝同步、服务器黑名单增删、单人及批量最后发言查询（`02`、`06`、`08`）
- [x] 悬浮个人中心（通知/主题/评论/收藏/鸡腿/星辰/粉丝/等级额度）及固定/随机/每日首次访问自动签到（`08-profile-right.js`）
- [x] 基于 `GM_info.script` 的单一权威源更新检测（1 小时节流）与 `--local` 防覆盖构建模式（`02`、`build.mjs`）

---

### 6.2 待开发路线图（Backlog）

> **开发者与 Agent 协作提示**：本节用于承接后续功能迭代。在认领某项 `- [ ]` 任务并开始编码前，请确认其「实现方式（待补充）」已补齐具体接口或产品交互约束。

- [ ] **架构前置：插槽注册表与共享 `FeedEngine` 底座**
  - **现状与约束**：当前功能直接硬编码在 `03`、`05`、`06`、`08` 中，`build.mjs` 仅平铺扫描 `src/\d{2}-*.js`；各分页加载与批量拉取缺乏统一的限频互斥与中止机制。
  - **目标范围**：按 5.3 节方案升级 `build.mjs`（支持 `src/themes/*.js`、`src/plugins/*.js` 与 `09-main.js` 末位启动），在 `02-utils-api.js` 落地 `createFeedEngine` 与 `registerTheme` / `registerHubTab` / `registerBubbleEnhancer` / `registerUserAction` 五个插槽接口，确保后续功能与二开模块零冲突热插拔。
  - **实现方式（待补充）**：
    - 迁移节奏：`<待确认：一次性重构核心挂载点，或随首个插件模块渐进迁出>`

- [ ] **UI 皮肤系统：四分区独立背景图、透明度调节与尺寸建议**
  - **目标范围**：支持对工作台四个独立区域分别配置背景图、透明度（`0% ~ 100%`）、背景模糊度与填充方式（铺满 `cover` / 完整 `contain` / 平铺），并在设置界面标注各区推荐分辨率与宽高比：
    1. **导航区（`.nsc-pane-nav`，154px 窄竖栏）**：建议竖屏尺寸 `360×1080` ~ `450×1440`（约 `1:3`）
    2. **帖子列表区（`.nsc-pane-list`，294px 竖栏）**：建议竖屏尺寸 `600×1200` ~ `720×1440`（约 `1:2`）
    3. **聊天主视区（`.nsc-pane-chat`，弹性主区）**：建议横屏或宽幅底图 `1600×1080` ~ `1920×1080`（`16:9` / `3:2`）
    4. **个人信息与右栏区（`.nsc-pane-right`，288px 竖栏）**：建议竖屏尺寸 `600×1200` ~ `720×1440`（约 `1:2`）
  - **技术约束**：背景图须渲染于独立底层伪元素（`::before`），其上叠加半透明遮罩与 `backdrop-filter`，保证浅色/黄昏/暗黑三套文字对比度不被图片花纹破坏；支持图床直链或本地文件转压缩 DataURL 存储。
  - **实现方式（待补充）**：
    - 设置入口位置：`<待补充：个人中心设置页新增「外观皮肤」子面板或独立皮肤弹窗>`
    - 预设/重置策略：`<待补充：是否内置少量默认壁纸或支持一键导出/导入皮肤配置 JSON>`

- [ ] **主题插件化：默认 macOS 专有主题抽离与可扩展主题中心**
  - **现状与约束**：当前浅色、黄昏、暗黑样式分散写死在 `03-styles.js` 的 CSS 选择器与 `05-shell-composer.js` 的三态开关中，不便于新增第四套及以上主题。
  - **目标范围**：将默认 macOS 主题（Light / Dusk / Dark）拆分为独立 `themes/mac-default.js` 主题包；构建统一 `ThemeRegistry` 选择器，二开者或用户后续放入自定义主题包（如极简纸墨、高对比暗色、莫兰迪等）即可直接在外观设置下拉/卡片列表中切换生效。
  - **实现方式（待补充）**：
    - 主题包标准字段：`<待补充：是否允许主题附带自定义圆角/字体/气泡配色覆盖>`
    - 左侧栏快捷按钮交互：`<待补充：保留三态快切，或扩展主题后切换为弹窗/菜单选取>`

- [ ] **星辰全量账本分析面板（macOS 风格重构）**
  - **参考原型**：`.jeikcode_store/全量星辰账本分析.txt`（已核对核心算法与统计口径）。
  - **核心逻辑复用**：
    - 游标分页全量拉取 `/api/stardust/list?count=1000&member_id=<uid>&before_id=<cursor>`（300ms 限频、ID 去重、兼容多种数值/余额字段名）；
    - 按 `upvote_in`（收到点赞）、`transfer_in`（收到转账）、`transfer_out`（送出转账）分类统计累计收支、笔数与核算净余额；
    - 懒加载补齐可见行对方用户名（复用 `state.userCache`），导出前并发补全全量昵称（5 并发 / 60ms 节流）；
    - 支持按类型筛选、UID/昵称/留言/时间搜索，以及导出带贡献者排行榜小计的 `:::: tabs` Markdown 报表。
  - **macOS 视觉重构要求**：不采用原型中的独立深色悬浮表格弹窗，改为挂载至个人中心 `stardust` 插槽，使用 `--nsc-*` 三主题令牌渲染 macOS KPI 卡片组、胶囊分段筛选器、圆角明细列表与原生提示态。
  - **实现方式（待补充）**：
    - 入口形态：`<待补充：替换现有星辰记录页签，或作为「全量分析」子视图与常规流水切换>`

- [ ] **近 100 页鸡腿细粒度统计分析看板**
  - **参考原型**：`.jeikcode_store/鸡腿统计数据分析.txt`（已核对分类规则与统计维度）。
  - **核心逻辑复用**：
    - 基于共享 `FeedEngine` 批处理模式拉取 `/api/account/credit/page-1` 至 `page-100`（150ms 间隔防风控，支持进度回调与随时中止），兼容数组 `[val, bal, reason, time]` 与对象返回格式；
    - 细粒度分类统计：总收入、总支出、净增鸡腿、回帖奖励（金额与次数）、发帖奖励（金额与次数）、签到统计（累计天数、累计鸡腿、日均鸡腿）、被投喂总计、投喂支出总计、其他收入；
    - 聚合输出「签到手气分布」（按单次鸡腿数降序统计出现天数与占比条）与「投喂用户排行榜」（提取 `^被(.+?)投喂鸡腿$` 用户名与累计数量，支持点击打开名片）。
  - **实现方式（待补充）**：
    - 触发与缓存策略：`<待补充：个人中心「鸡腿」页签内增加「100 页深度统计」子视图，是否按天/小时缓存汇总结果>`

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
