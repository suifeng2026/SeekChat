# SeekChat — NodeSeek macOS 群聊工作台

将 NodeSeek 论坛重塑为 **macOS 风格四栏桌面群聊工作台** 的模块化油猴脚本工程。

## 目录结构

```text
├── build.mjs                  # 零依赖打包脚本，合并 src/ 并校验语法
├── package.json
├── dist/
│   ├── nodeseek-chat-ui.meta.js   # Tampermonkey 更新检测元文件
│   └── nodeseek-chat-ui.user.js   # 最终可安装单文件油猴脚本
└── src/
    ├── 00-meta.js             # 油猴头部元信息与 @updateURL/@downloadURL
    ├── 01-config-icons.js     # 存储键、防闪屏守卫、线性 SVG 图标、频道与状态树
    ├── 02-utils-api.js        # 时间格式化、路由守卫、CSRF Header、名单与已读状态
    ├── 03-styles.js           # macOS 四栏样式、分区配色、主题变量与弹窗样式
    ├── 04-nodeimage.js        # NodeImage 图床授权、传图、图库管理、粘贴/拖拽上传
    ├── 05-shell-composer.js   # 四栏骨架、底部编辑器、私信输入框、无刷新发帖弹窗
    ├── 06-channels-messages.js# 左侧导航、版块列表、@我/回复我/私信/系统通知(uid5230)
    ├── 07-post-chat.js        # 帖子解析、瀑布流、楼层直达、悬停赞鸡腿引用回复、楼中楼
    ├── 08-profile-right.js    # 名片与完整签名弹窗、好友/粉丝同步、眼睛查发言、热榜
    └── 09-main.js             # SPA 路由劫持、防闪屏挂载与启动入口
```

## 本地构建

```bash
node build.mjs
```

构建会自动生成 `dist/nodeseek-chat-ui.user.js` 与 `dist/nodeseek-chat-ui.meta.js`，并执行 `node --check` 语法校验。

## Tampermonkey 自动更新（告别复制粘贴）

1. 在 GitHub 新建空仓库（`suifeng2026/SeekChat`）；
2. 将本项目推送到 `main` 分支：
   ```bash
   git init
   git add .
   git commit -m "feat: init modular SeekChat v7.4.0"
   git branch -M main
   git remote add origin https://github.com/suifeng2026/SeekChat.git
   git push -u origin main
   ```
3. 在浏览器打开：`https://raw.githubusercontent.com/suifeng2026/SeekChat/main/dist/nodeseek-chat-ui.user.js`，Tampermonkey 会弹出安装界面，点击安装（覆盖旧脚本请确保停用或删除之前手动粘贴的脚本以免双开冲突）。
4. 以后每次修改 `src/` 并运行 `node build.mjs` 推送到 GitHub 后，只需在 Tampermonkey 面板点击「检查脚本更新」即可一键升级。
