# SeekChat 二次开发与架构规范文档

版本基线：`v7.20.2`  
目标平台：NodeSeek (`https://www.nodeseek.com/*`) Tampermonkey / Violentmonkey 用户脚本  
构建产物：`dist/nodeseek-chat-ui.user.js`、`dist/nodeseek-chat-ui.meta.js`

---

## 1. 项目定位与核心原则

SeekChat 是一个将 NodeSeek 原生论坛界面重构为 macOS 风格四栏桌面工作台的用户脚本工程。面向二次开发与长期维护，项目遵循以下五项基本约束：

1. **零运行时依赖（Zero Runtime Dependencies）**  
   不引入任何第三方 npm 运行时包、前端框架或外部 CSS/图标库。构建脚本 `build.mjs` 仅依赖 Node.js 内置模块（`node:fs`、`node:path`、`node:child_process`）；脚本运行时仅依赖浏览器原生 DOM/Fetch/WebCrypto API、站内已挂载的 CodeMirror / markdown-it 实例以及标准油猴 `GM_*` 能力。
2. **有序词法模块化（Deterministic Lexical Modularity）**  
   源码按 `src/00-*.js` 至 `src/09-*.js` 编号拆分，构建时按字典序拼接进单一严格模式 IIFE 闭包。单文件内不引入打包器（Webpack/Vite/Rollup）所需的模块语法开销，同时保持清晰的职责边界与单向依赖流。
3. **非破坏性挂载与零残留退出（Non-Destructive Mounting）**  
   所有脚本注入 DOM 均使用 `nsc-` 前缀隔离；原生节点（如 `.user-card`、`.md-editor`）仅做容器迁移而不破坏原有事件绑定，切换回原版论坛时通过 `restoreNativeWidgets()` 完整归位，确保原版页面无样式污染与残留控件。
4. **高性能与并发安全（Performance & Concurrency Safety）**  
   `document-start` 阶段注入防闪屏守卫；滚动监听统一使用 `requestAnimationFrame` 节流；检索输入防抖；黑名单使用 `Set` 实现 `O(1)` 过滤；异步视图切换使用递增序列号（`chatViewSeq`、`_unreadFetchSeq`）丢弃过期请求回写；本地缓存写入采用合并防抖与容量裁剪。
5. **系统级 macOS 视觉一致性（Theme & Surface Consistency）**  
   基于 CSS Custom Properties 定义统一视觉令牌，原生适配浅色（Light）、黄昏护眼（Dusk）与分层暗黑（Dark）三种外观模式；气泡内嵌交互组件（代码块、魔术标签页、星辰卡片、投票面板）独立声明表面背景与前景对比度，不受外层气泡配色反色影响。

---

## 2. 目录结构与构建流程

```text
├── build.mjs                      # 零依赖打包脚本：按序合并 src/01..09 并输出 dist/，执行语法校验
├── package.json                   # 版本元信息与 build / check 脚本入口
├── README.md                      # 安装与基础使用说明
├── DEVELOPMENT.md                 # 本文档：模块规范、接口契约与演进路线图
├── dist/
│   ├── nodeseek-chat-ui.meta.js   # Tampermonkey 元文件（@updateURL 指向此文件）
│   └── nodeseek-chat-ui.user.js   # 最终可安装单文件油猴脚本
└── src/
    ├── 00-meta.js                 # UserScript Header（权限声明、@match、更新地址）
    ├── 01-config-icons.js         # 存储键常量、防闪屏守卫、矢量图标集、频道定义与全局状态树
    ├── 02-utils-api.js            # 通用工具、缓存治理、API 封装、请求签名、名单与更新检测
    ├── 03-styles.js               # 全局 CSS 变量、三套主题、四栏布局与卡片/弹窗样式
    ├── 04-nodeimage.js            # NodeImage 图床授权、上传、图库管理、粘贴与拖拽监听
    ├── 05-shell-composer.js       # 四栏骨架、编辑器调度、发帖弹窗、图库灯箱与气泡内容增强器
    ├── 06-channels-messages.js    # 左侧导航、版块瀑布流、@我/回复我/私信/系统通知(5230)处理
    ├── 07-post-chat.js            # 帖子详情解析、双向瀑布流、楼中楼构建、楼层互动与编辑弹窗
    ├── 08-profile-right.js        # 个人名片、右侧栏（热榜/好友/粉丝/黑名单）、悬浮个人中心与签到
    └── 09-main.js                 # SPA 路由劫持、DOM 观察器与启动入口
```

### 构建与校验命令

```bash
# 标准发布构建：输出 dist/nodeseek-chat-ui.user.js 与 .meta.js（保留上游更新地址）
node build.mjs

# 本地/魔改构建：输出 dist/nodeseek-chat-ui.local.user.js（自动剥离 @updateURL/@downloadURL 并隔离命名空间）
node build.mjs --local
```

`build.mjs` 执行以下确定性步骤：
1. 读取 `src/00-meta.js` 作为文件头；若指定 `--local`（或环境变量 `SEEKCHAT_LOCAL=1`），自动移除 `@updateURL`/`@downloadURL` 并在 `@name` 与 `@namespace` 中注入本地隔离标识。
2. 扫描 `src/` 下所有匹配 `/^\d{2}-.*\.js$/` 且非 `00-meta.js` 的文件并按文件名升序拼接至 `(function () { "use strict"; ... })();`。
3. 写入对应产物（标准模式下同步生成 `dist/nodeseek-chat-ui.meta.js`；若本地存在 `Temp` 同步目录则一并覆盖）。
4. 调用 `node --check` 完成语法静态校验。

修改 `src/` 后必须重新执行 `node build.mjs`，并同步提交 `src/*`、`package.json` 与 `dist/*`。

---

## 2.1 Fork 与二次开发防覆盖规范（必读）

为避免二次开发或本地魔改版本在原仓库更新后被 Tampermonkey 静默覆盖，项目遵循**更新源单一权威源（Single Source of Truth）**原则：

1. **应用内更新检测自动跟随脚本头**  
   `02-utils-api.js` 中的 `getScriptUpdateTargets()` 动态读取当前实例 `GM_info.script` 的 `updateURL` / `downloadURL`，不再硬编码官方仓库地址。若未配置远程更新地址，工作台左下角自动显示为「本地 vX.Y.Z」并禁用远程覆写检测。
2. **两种二次开发场景的操作约定**：
   - **本地魔改自用（不公开发布）**：执行 `npm run build:local`（即 `node build.mjs --local`）生成 `dist/nodeseek-chat-ui.local.user.js` 安装。该构建自动移除更新地址并改写 `@name` / `@namespace`，既可与原版共存，也不会被上游新版覆盖或污染 Git 跟踪目录。
   - **Fork 后独立发布分发**：修改 `src/00-meta.js` 中的 `@name`、`@namespace`、`@updateURL` 与 `@downloadURL` 为你的自有仓库地址即可（`02-utils-api.js` 会自动同步指向你的仓库）；如需与原版完全隔离本地缓存，可在 `01-config-icons.js` 中为 `LS` 常量值统一增加前缀。
3. **基线版本与正式/预览分支建议**：
   - 使用 Git 标签（如 `v7.20.1`）在 GitHub Releases 固定基线版本源码包，方便二开者按 Tag 检出稳定基线；
   - 正式版保留在 `main` 分支（`@updateURL` 指向 `main/dist/`），日常实验性改动可在 `dev` 分支或 GitHub Pre-release 验证稳定后再合并至 `main`。

---

## 3. 模块化优雅定义与职责边界

为保证单一闭包内百余个内部函数不产生循环耦合或状态污染，各模块严格遵循**自上而下的单向可见性约束**：低编号模块不得强假设高编号模块必然已加载；跨模块晚绑定调用（如 `02` 或 `06` 调用 `08` 的弹窗刷新）须采用 `typeof fn === "function"` 防御或由状态驱动重绘。

### 3.1 分层定义表

| 层级 | 模块 | 核心职责 | 禁止跨越的边界 |
| :--- | :--- | :--- | :--- |
| 元数据层 | `00-meta.js` | 声明 `@version`、`@grant`、`@connect` 与更新 URL | 不包含任何可执行逻辑 |
| 基础配置层 | `01-config-icons.js` | 定义 `LS` 键名、`ICONS`、`CHANNELS`、`STICKER_GROUPS` 与单一全局 `state` 对象；执行 `document-start` 防闪屏守卫及 iframe 早退 | 不依赖 DOM 业务节点，不发起网络请求 |
| 基础设施层 | `02-utils-api.js` | 本地存储防抖与 LRU 裁剪、`escHtml`、`withHiddenIframe`、`apiGetJson` / `apiPostJson`、`computeDynamicSign` / `signedApiFetchJson`、`#temp-script` 元数据提取、时间格式化、黑名单读写、收藏状态与脚本更新检测 | 不直接拼接业务卡片或页面布局 HTML |
| 视觉令牌层 | `03-styles.js` | 通过 `injectStyles()` 注入全部样式、Light/Dusk/Dark 主题变量、自适应布局及弹窗/卡片皮肤 | 不包含运行时逻辑或硬编码数据 |
| 独立服务层 | `04-nodeimage.js` | 封装 `NodeImage` 对象与图床授权弹窗，对接 `api.nodeimage.com` | 不直接操作帖子楼层或消息列表状态 |
| 工作台与增强层 | `05-shell-composer.js` | 构建 `#nsc-app-shell`、管理外观切换、原生/兜底/私信编辑器切换、发帖弹窗、图片灯箱，以及气泡内容增强管线（`enhanceNsApps`、`enhanceMagicTabs`、`enhanceCodeBlocks`、`processBubbleImages`） | 不直接管理板块数据拉取或私信列表分页 |
| 频道与消息流层 | `06-channels-messages.js` | 渲染左侧导航、版块帖子瀑布流、未读计数同步、`markViewed` 探测与持久化、私信收发及 UID 5230 系统通知结构化格式化 | 不解析帖子楼层树与楼中楼互动逻辑 |
| 群聊阅读核心层 | `07-post-chat.js` | 解析帖子 HTML 与 `#temp-script`、构建楼中楼树、双向瀑布流、楼层跳转、悬停/胶囊互动（赞/鸡腿/踩/置顶/引用/回复）与无刷新编辑弹窗 | 不负责左侧栏目切换或右侧社交列表 |
| 个人空间与右栏层 | `08-profile-right.js` | 用户名片弹窗、右侧热榜/好友/粉丝/黑名单、眼睛查最后发言、批量查询、悬浮个人中心（`#nsc-hub-backdrop`）及每日签到调度 | 不直接修改帖子楼层解析模型 |
| 生命周期入口层 | `09-main.js` | 劫持 `history.pushState` / `replaceState` 与 `popstate`，监听路由与原生挂载点变化并触发 `toggleAppMode` | 不承担具体业务渲染实现 |

### 3.2 关键设计约束

1. **命名空间与 DOM 隔离**  
   - 全局 CSS 类名、元素 ID 与 `dataset` 状态统一采用 `nsc-` / `nsc` 前缀。  
   - `localStorage` 键名统一收口在 `01-config-icons.js` 的 `LS` 常量表中，禁止散落硬编码键名。
2. **异步竞态防护（Sequence Guard）**  
   - 任何跨网络请求的聊天视图切换（打开帖子、加载上下页、跳转楼层、打开私信、打开纯文本通知）必须递增并校验 `state.chatViewSeq`，并在 `await` 返回后同时复核当前目标 ID（如 `state.currentPostId` 或 `state.activePmPeer.uid`）。  
   - 未读数同步使用 `_unreadFetchSeq` 校验，避免旧请求覆盖新状态。
3. **气泡内嵌组件增强管线顺序**  
   在 `07-post-chat.js` 与 `06-channels-messages.js` 渲染消息正文后，增强器按以下固定顺序执行，禁止调换顺序：
   ```text
   enhanceNsApps(el)         // 1. 先解析 nsapp:// 与原生 .stardust-panel / .vote-panel
     -> linkifyFloorReferences(el) // 2. 再识别文本 #楼层（已排除 .nsc-sd-card / .nsc-vote-card）
     -> enhanceMagicTabs(el)       // 3. 激活测评帖多标签页
     -> enhanceCodeBlocks(el)      // 4. 挂载代码块复制按钮
     -> processBubbleImages(el)    // 5. 识别连续纯图块为宫格并绑定灯箱（须避开卡片内头像）
   ```
   顺序约束原因：若 `linkifyFloorReferences` 先运行，文本中的 `#数字` 可能截断 `nsapp://` 查询串或误改卡片内的 `Ref #ID` / `#VoteID`。
4. **HTML 注入安全**  
   所有来自接口或用户输入的纯文本在拼入 `innerHTML` 前必须经 `escHtml()` 转义；用户签名与简易 Markdown 输出须经 `sanitizeSignatureHtml()` 剥离高危标签及事件属性。

---

## 4. 已验证的 NodeSeek 接口与协议契约

以下接口均已在现有代码及实机通信中验证可用，供二次开发直接复用：

| 业务域 | 方法与路径 | 请求头/参数要点 | 用途 |
| :--- | :--- | :--- | :--- |
| 帖子与编辑 | `POST /api/content/new-discussion` | `getNodeSeekPostHeaders()` (`csrf-token`) | 发布新主题 |
| 帖子与编辑 | `POST /api/content/edit-discussion` | `getNodeSeekPostHeaders()` | 编辑主题标题与正文 |
| 评论与编辑 | `POST /api/content/new-comment` | `getNodeSeekPostHeaders()` | 发布回复 |
| 评论与编辑 | `POST /api/content/edit-comment` | `getNodeSeekPostHeaders()` | 编辑指定 `commentId` |
| 用户内容列表 | `GET /api/content/list-discussions?uid=&page=` | Cookie 会话 | 获取用户主题列表 |
| 用户内容列表 | `GET /api/content/list-comments?uid=&page=` | Cookie 会话 | 获取用户历史评论 |
| 互动统计 | `POST /api/statistics/upvote` | `{ commentId, action: "add" }` | 点赞（星辰 +1） |
| 互动统计 | `POST /api/statistics/like` | `{ commentId, action: "add" }` | 加鸡腿 |
| 互动统计 | `POST /api/statistics/dislike` | `{ commentId, action: "add" }` | 反对（踩） |
| 收藏管理 | `GET /api/statistics/list-collection?page=` | Cookie 会话 | 获取收藏夹分页 |
| 收藏管理 | `POST /api/statistics/collection` | `{ postId, action: "add" \| "remove" }` | 收藏/取消收藏 |
| 投票协议 | `GET /api/vote/info/:voteId` | 须携带 `x-dynamic-sign` (`signedApiFetchJson`) | 读取投票配置与实时票数 |
| 投票协议 | `POST /api/vote/voteforitem` | 须携带 `x-dynamic-sign`，`{ ids: number[] }` | 提交单选/多选投票 |
| 星辰体系 | `GET /api/stardust/list` | 支持 `member_id`、`peer_id`、`ref_id`、`before_id`、`count` | 星辰账簿与收款卡片流水校验 |
| 星辰付款页 | `GET /stardust/payment` | 须保留 `window.opener` 并附带 `callback-origin` | 拉起官方星辰打赏确认窗口 |
| 账号与额度 | `GET /api/account/getInfo/:uid?readme=1` | Cookie 会话 | 用户资料、余额与签名/README |
| 鸡腿账簿 | `GET /api/account/credit/page-:page` | Cookie 会话 | 分页鸡腿收支明细 |
| 每日额度 | `GET /api/progress/today?scope=freelike` | Cookie 会话 | 查询当日免费投喂鸡腿额度 |
| 签到与榜单 | `POST /api/attendance?random=true\|false` | Cookie 会话 | 执行随机或固定签到 |
| 签到与榜单 | `GET /api/attendance/board?page=` | Cookie 会话 | 今日签到排行榜 |
| 通知与私信 | `GET /api/notification/unread-count` | `cache: "no-store"` | 获取各通道未读计数 |
| 通知与私信 | `GET /api/notification/(at-me\|reply-to-me)/list` | Cookie 会话 | 获取艾特与回复通知列表 |
| 通知与私信 | `POST /api/notification/(at-me\|reply-to-me)/markViewed` | 支持 `?all=true` 或多载荷策略探测 | 标记通知已读 |
| 通知与私信 | `GET /api/notification/message/list?page=1` | Cookie 会话 | 私信会话列表 |
| 通知与私信 | `GET /api/notification/message/with/:uid` | Cookie 会话 | 与指定用户对话（`5230` 为系统通知） |
| 通知与私信 | `POST /api/notification/message/send` | `{ receiverUid, content, markdown: true }` | 发送站内私信 |
| 通知与私信 | `POST /api/notification/message/markViewed` | `{ messages: number[] }` | 批量标记私信/系统通知已读 |
| 社交与屏蔽 | `GET /api/fans/(follow\|fans)` | Cookie 会话 | 关注列表与粉丝列表 |
| 社交与屏蔽 | `GET /api/block-list/list` | Cookie 会话 | 获取服务器黑名单 |
| 社交与屏蔽 | `POST /api/block-list/(add\|del)` | `add` 传 `block_member_name`，`del` 传 `block_member_id` | 添加或移出黑名单 |

---

## 5. 二次开发接入指引

### 5.1 新增气泡内容增强器（如新的 `nsapp://` 协议卡片）

1. 在 `src/01-config-icons.js` 的 `ICONS` 中补充所需线性 SVG 图标（保持 `viewBox="0 0 24 24"` 与 `stroke="currentColor"`）。
2. 在 `src/05-shell-composer.js` 中参照 `parseStardustReceiveUrl` / `createStardustCardElement` 编写解析器与自包含卡片组件：
   - 若涉及签名校验接口，复用 `02-utils-api.js` 的 `signedApiFetchJson()`。
   - 若卡片允许出现在 `blockquote` 内，须在卡片根节点阻止点击事件冒泡，避免误触引用折叠。
   - 卡片内若包含用户头像，样式须显式覆盖 `.nsc-bubble img` 的全局尺寸限制。
3. 在 `src/03-styles.js` 末尾为新组件补齐 Light、Dusk（`body.nsc-theme-dusk`）与 Dark（`body.dark-layout`）三套主题样式，并显式设置 `background: var(--nsc-bg-card); color: var(--nsc-text);` 以兼容自己发送的蓝底气泡（`.nsc-msg.is-self`）。
4. 在 `enhanceNsApps()` 内接入识别分支（同时兼容原始 `<a>` 链接、纯文本节点与原生已预渲染组件）。

### 5.2 新增个人中心悬浮窗标签页

1. 在 `src/01-config-icons.js` 的 `state.hubData` 中初始化对应分页/状态结构。
2. 在 `src/08-profile-right.js` 中编写数据加载函数（分页接口建议直接复用 `loadPaginatedHubStore`）。
3. 在 `renderUserHub()` 的 `nativeHrefMap`、`tabs` 数组、`persistentBody` 滚动瀑布流分发器及 `openUserHubModal()` 初始化分支中注册新标签页。

### 5.3 模块拆分建议

若后续新增功能导致 `03-styles.js`（当前约 1500 行）或 `08-profile-right.js`（当前约 1890 行）继续膨胀，可在 `src/` 下引入两位小数或细分前缀命名（例如将 `08` 拆分为 `08a-profile-right.js`、`08b-user-hub.js`）并微调 `build.mjs` 的排序过滤正则，保持零构建工具依赖的同时控制单文件可读性。

---

## 6. 功能演进路线图

### 6.1 已完成能力（截至 `v7.20.2`）

- **桌面化工作台与外观系统**：四栏 macOS 布局、浅色 / 黄昏护眼 / 分层暗黑三态切换、无闪屏启动守卫、零残留退出恢复。
- **频道浏览与进度追踪**：全部版块瀑布流加载、关键词搜索防抖与自动补页、未读/新回复增量标记、已读足迹本地记录、未读优先排序。
- **帖子群聊与楼中楼**：双向瀑布流分页（向上回溯保留滚动锚点）、楼中楼聚合与折叠控制、只看楼主/只看指定成员、楼层直达与引用高亮、无刷新发帖与主贴/评论编辑弹窗、`#temp-script` 元数据水合。
- **楼层互动与媒体增强**：0.5 秒悬停无边框 SF 矢量操作条（点赞/加鸡腿/反对/置顶/引用/回复/编辑）、底部实时反应计数胶囊、顶部收藏按钮、代码块一键复制、测评帖魔术标签页、连续纯图朋友圈宫格、多图灯箱缩放画廊、NodeImage 图床授权与粘贴/拖拽直传。
- **富交互 `nsapp://` 卡片化**：
  - `nsapp://stardust-receive` 星辰收款卡：自动解析收款人/数额/备注/一次性标记，实时查询 `/api/stardust/list` 汇总付款人数与总额及个人付款状态，支持拉起官方打赏弹窗并在结束后自动刷新流水。
  - `nsapp://vote` 投票组件：完整支持 `x-dynamic-sign` 签名鉴权，兼容原始链接与原生预渲染 `.vote-panel`，提供单选/多选卡片、内联二次确认提交、公开/匿名提示与实时占比条形图。
- **消息中心与个人中心**：`@我`、`回复我`、站内私信（含 Markdown 实时预览与贴图发送）、UID 5230 系统通知标签化排版与标题补全；悬浮个人中心集成通知、主题帖、评论、收藏、鸡腿账簿、星辰记录、粉丝关注、固定/随机/每日首次访问自动签到、等级额度以及同源换肤设置/抽奖/邀请嵌入。
- **社交侧栏与版本管理**：热榜（实时/日榜/周榜，支持站内降级回退）、关注与粉丝同步、服务器黑名单增删同步、单人及批量最后发言时间查询、每小时自动节流的静默更新检测与一键跳转升级。

### 6.2 待完成与规划路线图

以下能力尚未合入主线，按优先度与技术可行性列为后续迭代目标：

1. **100 页鸡腿账簿批量统计与可视化看板（高优先级）**  
   - **现状**：`08-profile-right.js` 的 `loadHubCredit` 仅支持单页瀑布流浏览，KPI 仅统计当前已手动滚动加载的条目。  
   - **目标**：在个人中心「鸡腿」标签页增加「深度统计（近 100 页）」触发入口，后台按可控并发节流（例如 150ms 间隔 + 可随时中止的 Abort 守卫）拉取 `/api/account/credit/page-1` 至 `page-100`，汇总展示：
     - 累计收入、累计支出、净增长及各渠道占比（发帖、回帖、签到、被投喂、打赏支出）；
     - 签到手气分布直方图（对比固定 5 鸡腿与随机签到期望收益）；
     - 投喂人排行榜（支持点击直接查看名片）。

2. **管理处罚记录接口接入（高优先级）**  
   - **现状**：左侧栏底部「管理」入口（`#nsc-nf-ruling`）目前仅作为外链跳转至原版 `/ruling` 页面，未实现工作台内原生展示与过滤。  
   - **目标**：调研并接入 `/ruling` 对应数据接口（或 DOM 降级解析器），在右侧栏或个人中心新增「管理记录」视图，支持分页瀑布流加载、按处罚类型/用户名检索，以及直接关联跳转涉事帖子。

3. **服务端关注/取关与快捷屏蔽操作按钮（高优先级）**  
   - **现状**：
     - `02-utils-api.js` 中的 `toggleFriend` 目前仅维护本地 `localStorage`（`LS.FRIENDS` / `LS.REMOVED_FRIENDS`），未调用 NodeSeek 服务端关注/取关接口与社区账号同步；
     - 屏蔽操作仅存在于用户名片弹窗与右侧栏「黑名单」输入框，帖子楼层列表、回复气泡及右侧好友/粉丝行内缺少直接的关注与屏蔽快捷按钮。  
   - **目标**：
     - 补全服务端关注/取关 API 绑定，使「好友」列表与站内 `/api/fans/follow` 双向同步；
     - 在楼层用户区、私信头部或名片快捷操作区补充轻量「关注 / 屏蔽」按钮（屏蔽前增加二次确认防误触），操作后实时刷新 `blacklistNameSet` 与消息流过滤状态。

4. **全路由星辰主动转账面板（中优先级）**  
   - **现状**：非帖子详情页（如首页 `/`）下原生论坛未挂载转账模态框组件，点击名片内原生转账入口可能无响应。  
   - **目标**：在个人中心或名片弹窗内补齐独立的星辰转账面板，直接对接星辰转账接口或 `/stardust/payment` 确认流，摆脱对原生页面隐藏组件的依赖。

5. **工程可维护性与可选增强（低优先级）**  
   - 对 `03-styles.js` 与 `08-profile-right.js` 按子域进一步拆分（如拆出独立个人中心子模块），在保持零构建依赖的前提下降低单文件体积；
   - 增加基于 Node.js 内置 `node:test` 的轻量纯函数回归测试套件（覆盖 `nsapp://` 解析、系统通知格式化、楼中楼建树与版本比较逻辑），无需引入外部测试框架。
