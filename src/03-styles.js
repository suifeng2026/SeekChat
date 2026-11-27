  function injectStyles() {
    if (document.getElementById("nsc-v7-styles")) return;
    const style = document.createElement("style");
    style.id = "nsc-v7-styles";
    style.textContent = `
      :root {
        --mac-font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", Arial, sans-serif;
        --nsc-bg-nav: rgba(242, 244, 247, 0.80);
        --nsc-bg-list: rgba(251, 252, 254, 0.88);
        --nsc-bg-chat: rgba(245, 246, 248, 0.84);
        --nsc-bg-right: rgba(251, 252, 254, 0.88);
        --nsc-bg-card: rgba(255, 255, 255, 0.96);
        --nsc-bubble-other: #ffffff;
        --nsc-bubble-self: #007aff;
        --nsc-bubble-self-text: #ffffff;
        --nsc-bubble-op: #fffdf6;
        --nsc-thread-bg: rgba(238, 241, 246, 0.85);
        --nsc-quote-bg: rgba(0, 0, 0, 0.045);
        --nsc-border: rgba(0, 0, 0, 0.08);
        --nsc-text: #1d1d1f;
        --nsc-muted: #6e6e73;
        --nsc-accent: #007aff;
        --nsc-accent-soft: rgba(0, 122, 255, 0.12);
        --nsc-green: #34c759;
        --nsc-hover: rgba(0, 0, 0, 0.045);
        --nsc-active-item: rgba(0, 122, 255, 0.13);
        --nsc-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06);
      }

      body.nsc-app-active.dark-layout {
        color-scheme: dark;
        --nsc-bg-nav: rgba(42, 45, 53, 0.88);
        --nsc-bg-list: rgba(33, 36, 42, 0.94);
        --nsc-bg-chat: rgba(27, 29, 35, 0.96);
        --nsc-bg-right: rgba(36, 39, 46, 0.94);
        --nsc-bg-card: #2f333d;
        --nsc-bubble-other: #2f333d;
        --nsc-bubble-self: #0a84ff;
        --nsc-bubble-self-text: #ffffff;
        --nsc-bubble-op: #342e23;
        --nsc-thread-bg: rgba(38, 41, 49, 0.92);
        --nsc-quote-bg: rgba(255, 255, 255, 0.075);
        --nsc-border: rgba(255, 255, 255, 0.105);
        --nsc-text: #f2f2f7;
        --nsc-muted: #a8abb4;
        --nsc-accent: #0a84ff;
        --nsc-accent-soft: rgba(10, 132, 255, 0.20);
        --nsc-green: #30d158;
        --nsc-hover: rgba(255, 255, 255, 0.075);
        --nsc-active-item: rgba(10, 132, 255, 0.24);
        --nsc-shadow: 0 26px 74px rgba(0, 0, 0, 0.60), 0 0 0 1px rgba(255, 255, 255, 0.11), inset 0 1px 0 rgba(255, 255, 255, 0.07);
        background:
          radial-gradient(ellipse at 18% 0%, rgba(56, 132, 255, 0.10), transparent 52%),
          radial-gradient(ellipse at 86% 92%, rgba(120, 118, 255, 0.08), transparent 52%),
          #13151a !important;
      }
      body.nsc-app-active.dark-layout header {
        background: rgba(30, 32, 38, 0.88) !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
      }
      body.nsc-app-active.dark-layout .nsc-bubble code:not(pre code) {
        background: rgba(255, 255, 255, 0.10); color: #e5e7eb; padding: 1px 5px; border-radius: 5px;
      }
      body.nsc-app-active.dark-layout .CodeMirror-cursor { border-left-color: #f2f2f7 !important; }
      body.nsc-app-active.dark-layout .CodeMirror-selected { background: rgba(10, 132, 255, 0.30) !important; }
      body.nsc-app-active.dark-layout .nsc-msg.is-self .nsc-bubble,
      body.nsc-app-active.dark-layout .nsc-thread-item.is-self-thread .nsc-thread-content {
        background: linear-gradient(180deg, #1a8cff 0%, #006ee6 100%);
      }
      body.nsc-app-active.dark-layout .nsc-op-pill { background: rgba(255, 159, 10, 0.18); color: #ffb340; }
      body.nsc-app-active.dark-layout .nsc-pin-pill { background: rgba(255, 69, 58, 0.18); color: #ff6961; }
      body.nsc-app-active.dark-layout .nsc-react-pill.is-leg { color: #ffb340; }
      body.nsc-app-active.dark-layout .nsc-react-pill.is-dislike { color: #ff6961; }

      body.nsc-app-active.nsc-theme-dusk {
        color-scheme: light;
        --nsc-bg-nav: rgba(232, 221, 203, 0.92);
        --nsc-bg-list: rgba(244, 236, 223, 0.96);
        --nsc-bg-chat: rgba(239, 230, 214, 0.96);
        --nsc-bg-right: rgba(244, 236, 223, 0.96);
        --nsc-bg-card: #faf4e8;
        --nsc-bubble-other: #faf4e8;
        --nsc-bubble-self: #44689e;
        --nsc-bubble-self-text: #ffffff;
        --nsc-bubble-op: #f9ebd0;
        --nsc-thread-bg: rgba(228, 217, 198, 0.90);
        --nsc-quote-bg: rgba(120, 88, 52, 0.085);
        --nsc-border: rgba(115, 86, 52, 0.14);
        --nsc-text: #3a3025;
        --nsc-muted: #7b6b59;
        --nsc-accent: #b8621c;
        --nsc-accent-soft: rgba(184, 98, 28, 0.13);
        --nsc-green: #2f9e44;
        --nsc-hover: rgba(120, 88, 52, 0.075);
        --nsc-active-item: rgba(184, 98, 28, 0.15);
        --nsc-shadow: 0 22px 60px rgba(72, 48, 24, 0.15), 0 0 0 1px rgba(115, 86, 52, 0.12);
        background:
          radial-gradient(ellipse at 20% 0%, rgba(245, 158, 11, 0.10), transparent 55%),
          radial-gradient(ellipse at 85% 92%, rgba(217, 119, 6, 0.07), transparent 55%),
          #ded1bc !important;
        color: #3a3025 !important;
      }
      body.nsc-app-active.nsc-theme-dusk header {
        background: rgba(236, 225, 207, 0.92) !important;
        border-bottom: 1px solid rgba(115, 86, 52, 0.14) !important;
        color: #3a3025 !important;
      }
      body.nsc-app-active.nsc-theme-dusk #nsk-head a,
      body.nsc-app-active.nsc-theme-dusk #nsk-head .title-text,
      body.nsc-app-active.nsc-theme-dusk #nsk-head .color-theme-switcher {
        color: #4a3d2f !important;
      }
      body.nsc-app-active.nsc-theme-dusk #nsk-head .search-box input {
        background: rgba(250, 244, 232, 0.85) !important;
        border-color: rgba(115, 86, 52, 0.18) !important;
        color: #3a3025 !important;
      }
      body.nsc-app-active.nsc-theme-dusk #nsk-head .search-hint,
      body.nsc-app-active.dark-layout #nsk-head .search-hint {
        background: var(--nsc-bg-card) !important;
        border: 1px solid var(--nsc-border) !important;
        color: var(--nsc-text) !important;
      }
      body.nsc-app-active.nsc-theme-dusk .nsc-msg.is-self .nsc-bubble,
      body.nsc-app-active.nsc-theme-dusk .nsc-thread-item.is-self-thread .nsc-thread-content {
        background: linear-gradient(180deg, #5177ad 0%, #3d6094 100%);
        box-shadow: 0 2px 8px rgba(61, 96, 148, 0.22);
      }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-browse { color: #9c4e12; }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-browse:hover { background: rgba(184, 98, 28, 0.11); color: #84400c; }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-browse.is-active {
        background: linear-gradient(135deg, #c97329, #a85513); color: #fff;
        box-shadow: 0 2px 8px rgba(184, 98, 28, 0.24);
      }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-browse .nsc-nav-badge { background: rgba(184, 98, 28, 0.14); color: #9c4e12; }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-msg { color: #b34a2f; }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-msg:hover { background: rgba(179, 74, 47, 0.11); color: #963820; }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-msg .nsc-nav-badge { background: rgba(179, 74, 47, 0.14); color: #a84126; }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-msg.is-active {
        background: linear-gradient(135deg, #cf6749, #b34a2f); color: #fff;
        box-shadow: 0 2px 8px rgba(179, 74, 47, 0.24);
      }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-board { color: #594a3a; }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-board:hover { background: rgba(120, 88, 52, 0.09); color: #3a3025; }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-board .nsc-nav-badge { background: rgba(120, 88, 52, 0.13); color: #785834; }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-board.is-active { background: #b8621c; color: #fff; }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-admin { color: #7b6750; }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-admin:hover { background: rgba(120, 88, 52, 0.10); color: #9c4e12; }
      body.nsc-app-active.nsc-theme-dusk .nsc-lv-pill { background: rgba(68, 104, 158, 0.12); color: #3d6094; }

      #nsc-mode-switch-btn {
        font-family: var(--mac-font);
        display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 10px; margin-left: 8px;
        border-radius: 7px; border: 1px solid var(--nsc-border);
        background: var(--nsc-accent-soft); color: var(--nsc-accent);
        font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;
      }
      #nsc-mode-switch-btn:hover { filter: brightness(1.06); }
      body:not(.nsc-app-active) #nsc-mode-switch-btn { background: rgba(128,128,128,0.12); color: inherit; }

      body.nsc-app-active { overflow: hidden !important; height: 100vh !important; font-family: var(--mac-font); }
      body.nsc-app-active header { position: relative; z-index: 600; height: 40px !important; backdrop-filter: blur(18px); }
      body.nsc-app-active footer,
      body.nsc-app-active #fast-nav-button-group,
      body.nsc-app-active #nsk-frame { display: none !important; }

      body:not(.nsc-app-active) #user-setting-panel {
        font-family: var(--mac-font);
        background: var(--nsc-bg-card) !important; backdrop-filter: blur(22px);
        border: 1px solid var(--nsc-border) !important; border-radius: 16px !important;
        box-shadow: var(--nsc-shadow) !important; padding: 22px 28px !important;
        margin: 18px auto 40px !important; max-width: 980px !important; color: var(--nsc-text);
      }
      body:not(.nsc-app-active) #user-setting-panel .head-container {
        border-bottom: 1px solid var(--nsc-border); padding-bottom: 16px; margin-bottom: 16px;
        display: flex; align-items: center; gap: 16px;
      }
      body:not(.nsc-app-active) #user-setting-panel .head-container .avatar { border-radius: 14px !important; box-shadow: 0 4px 14px rgba(0,0,0,0.12); }
      body:not(.nsc-app-active) #user-setting-panel .selector { gap: 8px; border-bottom: 1px solid var(--nsc-border); padding-bottom: 10px; margin-bottom: 16px; }
      body:not(.nsc-app-active) #user-setting-panel .selector > div { padding: 6px 12px !important; border-radius: 8px !important; font-weight: 600; }
      body:not(.nsc-app-active) #user-setting-panel input,
      body:not(.nsc-app-active) #user-setting-panel textarea,
      body:not(.nsc-app-active) #user-setting-panel select { border-radius: 8px !important; border: 1px solid var(--nsc-border) !important; padding: 7px 10px !important; }

      /* 原版个人信息/通知/账簿/空间页面 macOS 轻美化 */
      body:not(.nsc-app-active) #nsk-body-left .nsk-panel,
      body:not(.nsc-app-active) #nsk-body-left .credit-table,
      body:not(.nsc-app-active) #nsk-body-left .stardust-list,
      body:not(.nsc-app-active) #nsk-body-left .notification-container,
      body:not(.nsc-app-active) #nsk-body-left .user-info-panel,
      body:not(.nsc-app-active) #nsk-body-left .progress-container {
        font-family: var(--mac-font);
        border-radius: 14px !important;
        border: 1px solid var(--nsc-border) !important;
        box-shadow: 0 8px 28px rgba(0,0,0,0.06) !important;
      }

      #nsc-app-shell {
        display: none; box-sizing: border-box; width: min(1600px, 98.5vw); height: calc(100vh - 48px);
        margin: 4px auto; border-radius: 16px;
        box-shadow: var(--nsc-shadow); overflow: hidden; color: var(--nsc-text);
        font-family: var(--mac-font);
      }
      body.nsc-app-active #nsc-app-shell { display: flex; }

      #nsc-app-shell ::-webkit-scrollbar { width: 6px; height: 6px; }
      #nsc-app-shell ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.28); border-radius: 999px; }
      #nsc-app-shell ::-webkit-scrollbar-track { background: transparent; }

      .nsc-pane-nav {
        width: 154px; flex: 0 0 154px; box-sizing: border-box;
        background: var(--nsc-bg-nav); backdrop-filter: blur(28px) saturate(180%);
        border-right: 1px solid var(--nsc-border);
        display: flex; flex-direction: column;
        padding: 8px 7px 6px; gap: 2px; overflow: hidden;
        position: relative; isolation: isolate;
      }
      .nsc-pane-list,
      .nsc-pane-chat,
      .nsc-pane-right {
        position: relative; isolation: isolate; overflow: hidden;
      }
      .nsc-pane-nav::before,
      .nsc-pane-list::before,
      .nsc-pane-chat::before,
      .nsc-pane-right::before {
        content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
        background-image: var(--nsc-pane-bg-img, none);
        background-size: var(--nsc-pane-bg-size, cover);
        background-position: center center;
        background-repeat: var(--nsc-pane-bg-repeat, no-repeat);
        opacity: var(--nsc-pane-bg-opacity, 0);
        filter: blur(var(--nsc-pane-bg-blur, 0px));
        transform: scale(1.03);
        transition: opacity 0.18s ease;
      }
      .nsc-mac-traffic {
        display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 1px 4px 6px 6px; flex: 0 0 auto;
      }
      .nsc-mac-dots { display: inline-flex; align-items: center; gap: 6px; }
      .nsc-mac-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; box-shadow: inset 0 0 0 0.5px rgba(0,0,0,0.15); }
      .nsc-mac-dot.red { background: #ff5f56; }
      .nsc-mac-dot.yellow { background: #ffbd2e; }
      .nsc-mac-dot.green { background: #27c93f; }
      .nsc-theme-seg {
        display: inline-flex; align-items: center; gap: 1px; padding: 2px;
        border-radius: 7px; background: var(--nsc-hover); border: 1px solid var(--nsc-border);
      }
      .nsc-theme-btn {
        width: 19px; height: 17px; border: none; border-radius: 5px; padding: 0;
        background: transparent; color: var(--nsc-muted); cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center;
        transition: all 0.12s ease;
      }
      .nsc-theme-btn svg { width: 11px; height: 11px; }
      .nsc-theme-btn:hover { color: var(--nsc-text); }
      .nsc-theme-btn.is-active {
        background: var(--nsc-bg-card); color: var(--nsc-accent);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.14);
      }

      .nsc-nav-main { flex: 1 1 auto; display: flex; flex-direction: column; gap: 2px; min-height: 0; overflow-y: auto; overflow-x: hidden; }
      .nsc-nav-item {
        width: 100%; box-sizing: border-box; flex: 1 1 0; min-height: 24px; max-height: 36px;
        padding: 0 9px; border-radius: 7px;
        display: flex; align-items: center; justify-content: space-between; gap: 6px;
        cursor: pointer; color: var(--nsc-muted); font-size: clamp(12.5px, 1.38vh, 13.5px); font-weight: 500;
        user-select: none; transition: all 0.12s ease; border: none; background: transparent;
        text-decoration: none !important;
      }
      .nsc-nav-left { display: flex; align-items: center; gap: 7px; min-width: 0; }
      .nsc-nav-item svg { width: 15px; height: 15px; flex: 0 0 15px; }
      .nsc-nav-item:hover { background: var(--nsc-hover); color: var(--nsc-text); }
      .nsc-nav-item.is-active { background: var(--nsc-accent); color: #fff; font-weight: 600; box-shadow: 0 2px 8px rgba(0,122,255,0.28); }
      .nsc-nav-item.is-active .nsc-nav-badge { background: rgba(255,255,255,0.28) !important; color: #fff !important; }
      .nsc-nav-badge {
        min-width: 17px; height: 15px; padding: 0 5px; border-radius: 999px;
        background: var(--nsc-accent); color: #fff; font-size: 9.5px; font-weight: 700;
        display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto;
      }
      /* macOS 分区色彩搭配：浏览(访达蓝) / 消息中心(樱花粉) / 版块(清雅靛蓝) / 站务(暖琥珀) */
      .nsc-nav-item.group-browse { color: #007aff; }
      body.dark-layout .nsc-nav-item.group-browse { color: #7bc0ff; }
      .nsc-nav-item.group-browse:hover { background: rgba(0, 122, 255, 0.09); color: #0066d6; }
      body.dark-layout .nsc-nav-item.group-browse:hover { background: rgba(56, 139, 253, 0.14); color: #a8d7ff; }
      .nsc-nav-item.group-browse .nsc-nav-badge { background: rgba(0, 122, 255, 0.13); color: #007aff; }
      body.dark-layout .nsc-nav-item.group-browse .nsc-nav-badge { background: rgba(56, 139, 253, 0.20); color: #8ac9ff; }
      .nsc-nav-item.group-browse.is-active,
      body.dark-layout .nsc-nav-item.group-browse.is-active {
        background: linear-gradient(135deg, #2b7de9, #1f6feb); color: #fff;
        box-shadow: 0 2px 10px rgba(31, 111, 235, 0.30);
      }

      .nsc-nav-item.group-msg { color: #f45b9a; font-weight: 600; }
      body.dark-layout .nsc-nav-item.group-msg { color: #f592ba; }
      .nsc-nav-item.group-msg:hover { background: rgba(244, 114, 182, 0.13); color: #ec4899; }
      body.dark-layout .nsc-nav-item.group-msg:hover { background: rgba(244, 114, 182, 0.14); color: #ffb3d1; }
      .nsc-nav-item.group-msg .nsc-nav-badge { background: rgba(244, 114, 182, 0.18); color: #ec4899; }
      body.dark-layout .nsc-nav-item.group-msg .nsc-nav-badge { background: rgba(244, 114, 182, 0.20); color: #ffaad0; }
      .nsc-nav-item.group-msg.is-active,
      body.dark-layout .nsc-nav-item.group-msg.is-active {
        background: linear-gradient(135deg, #ff7eb3, #f45b9a); color: #fff;
        box-shadow: 0 2px 8px rgba(244, 91, 154, 0.30);
      }

      .nsc-nav-item.group-board .nsc-nav-badge { background: rgba(88, 86, 214, 0.11); color: #5856d6; }
      body.dark-layout .nsc-nav-item.group-board .nsc-nav-badge { background: rgba(120, 118, 255, 0.22); color: #a5a3ff; }

      .nsc-nav-item.group-admin { color: #8b7355; }
      body.dark-layout .nsc-nav-item.group-admin { color: #c4a47c; }
      .nsc-nav-item.group-admin:hover { background: rgba(245, 158, 11, 0.10); color: #d97706; }
      body.dark-layout .nsc-nav-item.group-admin:hover { background: rgba(245, 158, 11, 0.12); color: #fbbf24; }

      .nsc-sn-card {
        display: flex; flex-direction: column; gap: 3px; padding: 6px 8px; margin-bottom: 2px;
        border-radius: 8px; border: 1px solid transparent; cursor: pointer;
        transition: background 0.12s ease, border-color 0.12s ease;
      }
      .nsc-sn-card:hover { background: var(--nsc-hover); border-color: var(--nsc-border); }
      .nsc-sn-card.is-selected { background: var(--nsc-active-item); }
      .nsc-sn-card.is-read { opacity: 0.78; }
      .nsc-sn-row1 {
        display: flex; align-items: center; justify-content: space-between; gap: 6px;
        font-size: 12px; line-height: 1.4; color: var(--nsc-text);
      }
      .nsc-sn-line {
        flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .nsc-sn-time {
        flex: 0 0 auto; font-size: 10.5px; color: var(--nsc-muted);
        display: inline-flex; align-items: center; gap: 4px;
      }
      .nsc-sn-title-row {
        font-size: 11.5px; color: var(--nsc-muted); white-space: nowrap;
        overflow: hidden; text-overflow: ellipsis; padding-left: 2px;
      }
      .nsc-sn-user {
        color: #007aff; font-weight: 600; background: rgba(0, 122, 255, 0.10);
        padding: 0 4px; border-radius: 4px; display: inline;
      }
      body.dark-layout .nsc-sn-user { color: #64b5ff; background: rgba(10, 132, 255, 0.20); }
      .nsc-sn-kw-post {
        color: #15803d; font-weight: 600; background: rgba(52, 199, 89, 0.15);
        padding: 0 4px; border-radius: 4px; display: inline; font-size: 11px;
      }
      body.dark-layout .nsc-sn-kw-post { color: #4ade80; background: rgba(48, 209, 88, 0.20); }
      .nsc-sn-kw-comment {
        color: #c2410c; font-weight: 600; background: rgba(255, 149, 0, 0.16);
        padding: 0 4px; border-radius: 4px; display: inline; font-size: 11px;
      }
      body.dark-layout .nsc-sn-kw-comment { color: #fbbf24; background: rgba(255, 159, 10, 0.22); }
      .nsc-sn-kw-reward {
        color: #be185d; font-weight: 600; background: rgba(255, 45, 85, 0.13);
        padding: 0 4px; border-radius: 4px; display: inline; font-size: 11px;
      }
      body.dark-layout .nsc-sn-kw-reward { color: #ff7aa8; background: rgba(255, 55, 95, 0.22); }
      .nsc-sn-kw-warn {
        color: #dc2626; font-weight: 600; background: rgba(255, 59, 48, 0.14);
        padding: 0 4px; border-radius: 4px; display: inline; font-size: 11px;
      }
      .nsc-sn-post { color: #5856d6; font-weight: 600; text-decoration: none; }
      body.dark-layout .nsc-sn-post { color: #9c9aff; }
      .nsc-sn-post:hover { text-decoration: underline; }
      .nsc-nav-divider { width: 100%; height: 1px; background: var(--nsc-border); margin: 4px 0; flex: 0 0 1px; }
      .nsc-nav-bottom { flex: 0 0 auto; display: flex; flex-direction: column; gap: 2px; margin-top: 2px; }
      .nsc-nav-bottom .nsc-nav-item { flex: 0 0 auto; height: clamp(26px, 3.2vh, 34px); }
      .nsc-update-btn { color: var(--nsc-muted); font-size: 11.5px; }
      .nsc-update-btn.has-update {
        background: var(--nsc-accent-soft); color: var(--nsc-accent); font-weight: 600;
      }
      .nsc-update-btn.has-update .nsc-nav-badge {
        background: var(--nsc-accent); color: #fff; font-size: 9px; padding: 0 4px;
      }

      .nsc-pane-list {
        width: 294px; flex: 0 0 294px; background: var(--nsc-bg-list); backdrop-filter: blur(22px);
        border-right: 1px solid var(--nsc-border); display: flex; flex-direction: column; min-height: 0;
      }
      .nsc-list-head { padding: 10px 10px 8px; border-bottom: 1px solid var(--nsc-border); display: flex; flex-direction: column; gap: 7px; }
      .nsc-list-title-row { display: flex; align-items: center; justify-content: space-between; font-size: 14px; font-weight: 700; }
      .nsc-search-input {
        width: 100%; box-sizing: border-box; height: 28px; padding: 0 10px; border-radius: 8px;
        border: 1px solid var(--nsc-border); background: var(--nsc-hover); color: var(--nsc-text); font-size: 12px; outline: none;
      }
      .nsc-search-input:focus { border-color: var(--nsc-accent); background: var(--nsc-bg-card); }
      .nsc-list-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
      .nsc-seg-tabs { display: inline-flex; background: var(--nsc-hover); border-radius: 8px; padding: 2px; gap: 2px; }
      .nsc-seg-btn {
        border: none; background: transparent; color: var(--nsc-muted);
        font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; cursor: pointer;
      }
      .nsc-seg-btn.is-active { background: var(--nsc-bg-card); color: var(--nsc-text); box-shadow: 0 1px 3px rgba(0,0,0,0.10); }
      .nsc-mini-btn {
        border: 1px solid var(--nsc-border); background: var(--nsc-bg-card); color: var(--nsc-muted);
        font-size: 11px; padding: 3px 7px; border-radius: 6px; cursor: pointer; white-space: nowrap;
        display: inline-flex; align-items: center; justify-content: center; gap: 3px;
      }
      .nsc-mini-btn:hover, .nsc-mini-btn.is-active { color: var(--nsc-accent); border-color: var(--nsc-accent); }

      .nsc-topic-scroll { flex: 1; overflow-y: auto; padding: 6px; }
      .nsc-topic-item {
        display: flex; align-items: flex-start; gap: 8px; padding: 8px 9px; margin-bottom: 2px;
        border-radius: 9px; cursor: pointer; transition: background 0.12s ease;
      }
      .nsc-topic-item:hover { background: var(--nsc-hover); }
      .nsc-topic-item.is-selected { background: var(--nsc-active-item); }
      .nsc-topic-item.is-read .nsc-topic-title { color: var(--nsc-muted); font-weight: 400; }

      .nsc-topic-avatar { width: 32px; height: 32px; border-radius: 50%; flex: 0 0 32px; object-fit: cover; background: var(--nsc-hover); }
      .nsc-topic-avatar-fb {
        width: 32px; height: 32px; border-radius: 50%; flex: 0 0 32px;
        background: linear-gradient(135deg, #007aff, #5ac8fa);
        color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center;
      }
      .nsc-topic-body { flex: 1; min-width: 0; }
      .nsc-topic-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 5px; }
      .nsc-topic-title {
        font-size: 12.5px; font-weight: 600; line-height: 1.38; color: var(--nsc-text);
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      }
      .nsc-topic-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; font-size: 11px; color: var(--nsc-muted); gap: 6px; }
      .nsc-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--nsc-accent); flex: 0 0 7px; margin-top: 5px; }
      .nsc-badge-delta { padding: 1px 5px; border-radius: 999px; background: var(--nsc-accent); color: #fff; font-size: 10px; font-weight: 700; flex: 0 0 auto; }
      .nsc-badge-read { padding: 0 5px; border-radius: 4px; border: 1px solid var(--nsc-border); color: var(--nsc-muted); font-size: 10px; flex: 0 0 auto; }
      .nsc-load-more-btn {
        width: 100%; margin: 6px 0; padding: 6px; border-radius: 8px;
        border: 1px dashed var(--nsc-border); background: transparent;
        color: var(--nsc-muted); font-size: 11.5px; cursor: pointer;
      }
      .nsc-load-more-btn:hover { color: var(--nsc-accent); border-color: var(--nsc-accent); }

      .nsc-pane-chat {
        flex: 1 1 auto; min-width: 0; background: var(--nsc-bg-chat); backdrop-filter: blur(22px);
        display: flex; flex-direction: column; min-height: 0; position: relative;
      }
      .nsc-pane-nav,
      .nsc-pane-list,
      .nsc-pane-right {
        transition: width 0.16s ease, flex-basis 0.16s ease, opacity 0.14s ease, padding 0.16s ease;
      }
      #nsc-app-shell.is-nav-collapsed .nsc-pane-nav,
      #nsc-app-shell.is-list-collapsed .nsc-pane-list,
      #nsc-app-shell.is-right-collapsed .nsc-pane-right {
        width: 0 !important; flex-basis: 0 !important; min-width: 0 !important;
        padding-left: 0 !important; padding-right: 0 !important;
        border-left-width: 0 !important; border-right-width: 0 !important;
        opacity: 0; pointer-events: none;
      }
      .nsc-pane-divider {
        width: 0; flex: 0 0 0; position: relative; z-index: 45; overflow: visible;
      }
      .nsc-pane-toggle {
        position: absolute; top: 50%; left: 0; transform: translate(-50%, -50%);
        width: 14px; height: 42px; padding: 0; border-radius: 5px;
        border: 1px solid var(--nsc-border); background: var(--nsc-bg-card); color: var(--nsc-muted);
        display: inline-flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 700; line-height: 1; cursor: pointer;
        opacity: 0.42; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: opacity 0.14s ease, color 0.14s ease, border-color 0.14s ease, background 0.14s ease;
      }
      .nsc-pane-toggle:hover,
      .nsc-pane-toggle.is-collapsed {
        opacity: 0.96; color: var(--nsc-accent); border-color: var(--nsc-accent);
      }
      .nsc-pane-divider.for-nav .nsc-pane-toggle.is-collapsed {
        left: 2px; transform: translate(0, -50%);
      }
      #nsc-app-shell.is-nav-collapsed.is-list-collapsed .nsc-pane-divider.for-nav .nsc-pane-toggle {
        top: 42%;
      }
      #nsc-app-shell.is-nav-collapsed.is-list-collapsed .nsc-pane-divider.for-list .nsc-pane-toggle {
        top: 58%;
      }
      .nsc-pane-divider.for-list .nsc-pane-toggle.is-collapsed {
        left: 2px; transform: translate(0, -50%);
      }
      .nsc-pane-divider.for-right .nsc-pane-toggle.is-collapsed {
        left: auto; right: 2px; transform: translate(0, -50%);
      }
      #nsc-app-shell.is-list-collapsed .nsc-msg-main,
      #nsc-app-shell.is-right-collapsed .nsc-msg-main {
        max-width: min(86%, 920px);
      }
      #nsc-app-shell.is-list-collapsed .nsc-thread-wrap,
      #nsc-app-shell.is-right-collapsed .nsc-thread-wrap {
        width: min(94%, 820px);
      }
      .nsc-chat-header {
        padding: 8px 16px; border-bottom: 1px solid var(--nsc-border); background: var(--nsc-bg-right);
        display: flex; flex-direction: column; gap: 5px;
      }
      .nsc-chat-title-row { display: flex; align-items: center; gap: 8px; min-width: 0; width: 100%; }
      .nsc-chat-title {
        font-size: 14.5px; font-weight: 700; line-height: 1.38; color: var(--nsc-text);
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        min-width: 0; flex: 0 1 auto; transition: color 0.14s ease;
      }
      .nsc-chat-title.is-copyable { cursor: pointer; }
      .nsc-chat-title.is-copyable:hover { color: var(--nsc-accent); }
      .nsc-chat-copy-tip {
        display: none; flex: 0 0 auto; font-size: 11px; font-weight: 600;
        padding: 1px 7px; border-radius: 999px;
        background: rgba(52, 199, 89, 0.16); color: #16a34a;
      }
      .nsc-chat-copy-tip.is-show { display: inline-flex; align-items: center; }
      .nsc-chat-meta-bar {
        display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; min-width: 0;
      }
      .nsc-chat-subtitle { font-size: 11px; color: var(--nsc-muted); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .nsc-chat-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 3px; margin-left: auto; }
      .nsc-pill-btn {
        padding: 4px 8px; border-radius: 7px; border: 1px solid transparent;
        background: transparent; color: var(--nsc-muted); font-size: 11.5px; font-weight: 500; cursor: pointer;
        display: inline-flex; align-items: center; gap: 4px; transition: background 0.12s ease, color 0.12s ease;
      }
      .nsc-pill-btn svg { width: 12.5px; height: 12.5px; flex: 0 0 12.5px; }
      .nsc-pill-btn:hover { background: var(--nsc-hover); color: var(--nsc-text); }
      .nsc-pill-btn.is-active { background: var(--nsc-accent-soft); color: var(--nsc-accent); font-weight: 600; }
      .nsc-pill-btn.is-collect.is-active { background: rgba(245, 158, 11, 0.15); color: #d97706; font-weight: 600; }
      .nsc-pill-btn.is-collect.is-active svg { fill: currentColor; }

      .nsc-floor-jump-box {
        display: inline-flex; align-items: center; border: 1px solid var(--nsc-border);
        border-radius: 7px; background: var(--nsc-hover); padding: 1px 3px 1px 8px; gap: 3px;
        margin-right: 2px;
      }
      .nsc-floor-jump-input { width: 44px; border: none; background: transparent; color: var(--nsc-text); font-size: 11px; outline: none; }
      .nsc-floor-jump-btn {
        border: none; background: transparent; color: var(--nsc-accent);
        font-size: 11px; font-weight: 600; border-radius: 5px; padding: 2px 6px; cursor: pointer;
      }
      .nsc-floor-jump-btn:hover { background: var(--nsc-accent-soft); }

      .nsc-chat-messages {
        flex: 1; overflow-y: auto; padding: 14px 18px 18px;
        display: flex; flex-direction: column; gap: var(--nsc-chat-msg-gap, 12px); position: relative;
        transition: opacity 0.12s ease;
      }
      .nsc-chat-messages.is-switching {
        opacity: 0.52;
        pointer-events: none;
      }
      .nsc-empty-state { margin: auto; text-align: center; color: var(--nsc-muted); padding: 26px; font-size: 13px; }

      .nsc-page-divider {
        display: flex; align-items: center; justify-content: center; gap: 10px;
        margin: 6px 0; font-size: 11px; color: var(--nsc-muted);
      }
      .nsc-page-divider::before, .nsc-page-divider::after { content: ""; flex: 1; height: 1px; background: var(--nsc-border); }

      .nsc-msg { display: flex; align-items: flex-start; gap: 10px; max-width: 100%; position: relative; }
      .nsc-msg.is-right,
      .nsc-msg.is-self { flex-direction: row-reverse; }
      .nsc-msg.is-hidden-filter { display: none !important; }

      .nsc-avatar-col { flex: 0 0 38px; display: flex; flex-direction: column; align-items: center; }
      .nsc-avatar-btn { padding: 0; border: none; background: transparent; cursor: pointer; border-radius: 50%; overflow: hidden; display: block; }
      .nsc-avatar-btn img {
        width: 36px; height: 36px; border-radius: 50%; object-fit: cover; display: block;
        box-shadow: 0 2px 6px rgba(0,0,0,0.10); transition: transform 0.14s ease;
      }
      .nsc-avatar-btn:hover img { transform: scale(1.06); }

      .nsc-msg-main { flex: 0 1 auto; min-width: 0; max-width: min(82%, 740px); display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
      .nsc-msg.is-op-card .nsc-msg-main { max-width: calc(100% - 48px); }
      .nsc-msg.is-op-card .nsc-bubble-row:has(.nsk-magic-tabs, table, pre),
      .nsc-msg.is-op-card .nsc-bubble:has(.nsk-magic-tabs, table, pre) {
        width: 100%; box-sizing: border-box;
      }
      .nsc-msg.is-right .nsc-msg-main,
      .nsc-msg.is-self .nsc-msg-main { align-items: flex-end; }
      .nsc-msg-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; font-size: 11px; color: var(--nsc-muted); }
      .nsc-msg.is-right .nsc-msg-meta,
      .nsc-msg.is-self .nsc-msg-meta { flex-direction: row-reverse; }
      .nsc-msg-author { font-weight: 600; color: var(--nsc-text); cursor: pointer; border: none; background: transparent; padding: 0; font-size: 12.5px; }
      .nsc-msg-author:hover { color: var(--nsc-accent); text-decoration: underline; }
      .nsc-lv-pill { font-size: 10px; padding: 1px 6px; border-radius: 5px; background: rgba(0, 122, 255, 0.09); color: var(--nsc-accent); font-weight: 600; }
      .nsc-op-pill { font-size: 10px; padding: 1px 6px; border-radius: 5px; background: rgba(245, 158, 11, 0.14); color: #d97706; font-weight: 700; }
      .nsc-pin-pill {
        font-size: 10px; padding: 1px 6px; border-radius: 5px;
        background: rgba(255, 59, 48, 0.13); color: #ff3b30; font-weight: 700;
        display: inline-flex; align-items: center; gap: 3px;
      }
      .nsc-pin-pill svg { width: 10px; height: 10px; }
      .nsc-floor-tag { font-size: 10px; padding: 1px 6px; border-radius: 5px; background: var(--nsc-hover); color: var(--nsc-muted); font-weight: 600; cursor: pointer; }
      .nsc-floor-tag:hover { color: var(--nsc-accent); }
      .nsc-floor-tag.is-op-floor { background: rgba(245, 158, 11, 0.12); color: #d97706; }

      .nsc-bubble-row { display: inline-flex; align-items: flex-end; gap: 6px; max-width: 100%; position: relative; }
      .nsc-msg.is-right .nsc-bubble-row,
      .nsc-msg.is-self .nsc-bubble-row { flex-direction: row-reverse; }

      .nsc-bubble {
        background: var(--nsc-bubble-other); color: var(--nsc-text);
        border: 1px solid rgba(0, 0, 0, 0.06); border-radius: 14px 14px 14px 4px;
        padding: 8px 13px; font-size: 13.5px; line-height: var(--nsc-chat-line-height, 1.55); word-break: break-word;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 3px 10px rgba(0, 0, 0, 0.025);
        width: fit-content; max-width: 100%;
      }
      body.nsc-app-active.dark-layout .nsc-bubble { border-color: rgba(255, 255, 255, 0.10); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.22); }
      .nsc-bubble p { margin: 4px 0; }
      .nsc-bubble > p:first-child { margin-top: 0; }
      .nsc-bubble > p:last-child { margin-bottom: 0; }
      .nsc-msg.is-right .nsc-bubble {
        border-radius: 14px 14px 4px 14px;
      }
      .nsc-msg.is-op-card .nsc-bubble,
      .nsc-msg.is-op-bubble .nsc-bubble {
        background: var(--nsc-bubble-op); color: var(--nsc-text);
        border-color: rgba(245, 158, 11, 0.26);
        border-radius: 14px 14px 14px 4px; width: fit-content;
      }
      .nsc-msg.is-self .nsc-bubble {
        background: linear-gradient(180deg, #1686ff 0%, #007aff 100%);
        color: var(--nsc-bubble-self-text);
        border-radius: 14px 14px 4px 14px; border-color: transparent;
        box-shadow: 0 2px 8px rgba(0, 122, 255, 0.22);
      }

      /* 帖子/评论正文超链接绿色高亮（排除楼层引用、卡片与图片链接） */
      .nsc-bubble a[href]:not(.nsc-floor-ref):not(.nsc-sn-post):not(.nsc-sd-link),
      .nsc-thread-content a[href]:not(.nsc-floor-ref):not(.nsc-sn-post):not(.nsc-sd-link) {
        color: #059669;
        background: rgba(16, 185, 129, 0.10);
        padding: 0 4px;
        border-radius: 5px;
        text-decoration: underline;
        text-underline-offset: 2px;
        text-decoration-color: rgba(5, 150, 105, 0.45);
        font-weight: 500;
        transition: background 0.12s ease, color 0.12s ease;
      }
      .nsc-bubble a[href]:not(.nsc-floor-ref):not(.nsc-sn-post):not(.nsc-sd-link):hover,
      .nsc-thread-content a[href]:not(.nsc-floor-ref):not(.nsc-sn-post):not(.nsc-sd-link):hover {
        color: #047857;
        background: rgba(16, 185, 129, 0.18);
      }
      body.nsc-app-active.dark-layout .nsc-bubble a[href]:not(.nsc-floor-ref):not(.nsc-sn-post):not(.nsc-sd-link),
      body.nsc-app-active.dark-layout .nsc-thread-content a[href]:not(.nsc-floor-ref):not(.nsc-sn-post):not(.nsc-sd-link) {
        color: #34d399;
        background: rgba(52, 211, 153, 0.14);
        text-decoration-color: rgba(52, 211, 153, 0.45);
      }
      body.nsc-app-active.dark-layout .nsc-bubble a[href]:not(.nsc-floor-ref):not(.nsc-sn-post):not(.nsc-sd-link):hover,
      body.nsc-app-active.dark-layout .nsc-thread-content a[href]:not(.nsc-floor-ref):not(.nsc-sn-post):not(.nsc-sd-link):hover {
        color: #6ee7b7;
        background: rgba(52, 211, 153, 0.24);
      }
      body.nsc-app-active .nsc-msg.is-self .nsc-bubble a[href]:not(.nsc-floor-ref):not(.nsc-sn-post):not(.nsc-sd-link),
      body.nsc-app-active .nsc-thread-item.is-self-thread .nsc-thread-content a[href]:not(.nsc-floor-ref):not(.nsc-sn-post):not(.nsc-sd-link) {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.18);
        text-decoration-color: rgba(255, 255, 255, 0.72);
      }
      body.nsc-app-active .nsc-msg.is-self .nsc-bubble a[href]:not(.nsc-floor-ref):not(.nsc-sn-post):not(.nsc-sd-link):hover,
      body.nsc-app-active .nsc-thread-item.is-self-thread .nsc-thread-content a[href]:not(.nsc-floor-ref):not(.nsc-sn-post):not(.nsc-sd-link):hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.28);
      }
      body.nsc-app-active .nsc-msg.is-self .nsc-bubble .nsc-table-wrap a[href],
      body.nsc-app-active .nsc-thread-item.is-self-thread .nsc-thread-content .nsc-table-wrap a[href] {
        color: var(--nsc-accent);
        background: var(--nsc-accent-soft);
        text-decoration-color: currentColor;
      }
      .nsc-bubble a:has(> img),
      .nsc-thread-content a:has(> img) {
        background: transparent !important;
        padding: 0 !important;
        text-decoration: none !important;
      }

      .nsc-bubble img,
      .nsc-bubble img.nsc-zoomable-img,
      .nsc-thread-content img,
      .nsc-thread-content img.nsc-zoomable-img {
        max-width: min(100%, var(--nsc-chat-img-max-w, 480px)) !important; max-height: var(--nsc-chat-img-max-h, 320px) !important;
        width: auto !important; height: auto !important; object-fit: contain;
        border-radius: 10px; display: block; margin: 6px 0; cursor: zoom-in;
        border: 1px solid var(--nsc-border); background: rgba(0, 0, 0, 0.02);
      }
      .nsc-bubble img.emoji,
      .nsc-thread-content img.emoji,
      .nsc-bubble img[src*="/emotion/"],
      .nsc-bubble img[src*="/sticker"],
      .nsc-thread-content img[src*="/emotion/"],
      .nsc-thread-content img[src*="/sticker"] {
        max-width: 44px !important; max-height: 36px !important;
        height: 34px !important; width: auto !important;
        display: inline-block; margin: 0 3px;
        border: none; background: transparent; cursor: default; vertical-align: middle;
      }

      /* 帖子多图自适应宫格画廊（按图片比例动态适配 1/2/3 列与容器比例，完整缩放不裁切、不变形） */
      .nsc-img-grid {
        display: grid; grid-template-columns: repeat(3, 1fr);
        gap: 7px; margin: 6px 0; width: min(100%, 580px);
        --nsc-grid-ar: 4 / 3;
      }
      .nsc-img-grid.cols-1 {
        grid-template-columns: 1fr;
        width: min(100%, 580px);
      }
      .nsc-img-grid.cols-2 {
        grid-template-columns: repeat(2, 1fr);
        width: min(100%, 560px);
      }
      .nsc-img-grid.ratio-wide { --nsc-grid-ar: 16 / 10; }
      .nsc-img-grid.ratio-landscape { --nsc-grid-ar: 4 / 3; }
      .nsc-img-grid.ratio-square { --nsc-grid-ar: 1 / 1; width: min(100%, 520px); }
      .nsc-img-grid.cols-2.ratio-square { width: min(100%, 440px); }
      .nsc-img-grid.ratio-portrait { --nsc-grid-ar: 3 / 4; width: min(100%, 520px); }
      .nsc-img-grid.cols-2.ratio-portrait { width: min(100%, 440px); }

      .nsc-img-grid img.nsc-zoomable-img {
        width: 100% !important; height: auto !important;
        aspect-ratio: var(--nsc-grid-ar, 4 / 3);
        max-width: none !important; max-height: none !important;
        object-fit: contain !important; margin: 0 !important; border-radius: 9px;
        background: rgba(128, 128, 128, 0.06);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .nsc-img-grid.ratio-banner img.nsc-zoomable-img {
        aspect-ratio: auto !important;
        max-height: 280px !important;
      }
      .nsc-img-grid img.nsc-zoomable-img:hover {
        transform: scale(1.015); box-shadow: 0 5px 16px rgba(0,0,0,0.16);
      }

      /* 测评帖魔术标签页 (.nsk-magic-tabs) 适配与交互样式（保持原生直系结构，避免触发站点校验提示） */
      .nsc-bubble .nsk-magic-tabs,
      .nsc-thread-content .nsk-magic-tabs {
        display: flex !important; flex-wrap: wrap !important; align-items: center; gap: 4px;
        width: 100%; box-sizing: border-box;
        margin: 8px 0; padding: 8px 10px 10px !important;
        border: 1px solid var(--nsc-border) !important; border-radius: 12px !important;
        background: var(--nsc-bg-card) !important; color: var(--nsc-text) !important;
        overflow: hidden;
      }
      .nsc-bubble .nsk-magic-tab-title,
      .nsc-thread-content .nsk-magic-tab-title {
        display: inline-flex !important; align-items: center; order: 0 !important;
        padding: 4px 10px !important; margin: 0 !important;
        border-radius: 7px !important; border: 1px solid transparent !important;
        font-size: 12px !important; font-weight: 500;
        color: var(--nsc-muted) !important; background: transparent !important;
        cursor: pointer; user-select: none; transition: all 0.13s ease;
      }
      .nsc-bubble .nsk-magic-tab-title:hover,
      .nsc-thread-content .nsk-magic-tab-title:hover {
        color: var(--nsc-text) !important; background: var(--nsc-hover) !important;
      }
      .nsc-bubble .nsk-magic-tab-title.is-active,
      .nsc-bubble .nsk-magic-tab-title.active,
      .nsc-thread-content .nsk-magic-tab-title.is-active,
      .nsc-thread-content .nsk-magic-tab-title.active {
        color: var(--nsc-accent) !important; background: var(--nsc-accent-soft) !important;
        border-color: rgba(0, 122, 255, 0.22) !important; font-weight: 600 !important;
        box-shadow: none !important;
      }
      .nsc-bubble .nsk-magic-tab-body,
      .nsc-thread-content .nsk-magic-tab-body {
        order: 100 !important; flex: 0 0 100% !important; width: 100% !important;
        box-sizing: border-box !important; margin: 6px 0 0 !important;
        padding: 10px 2px 2px !important;
        border-top: 1px solid var(--nsc-border) !important;
      }
      .nsc-bubble .nsk-magic-tab-body img.nsc-zoomable-img,
      .nsc-thread-content .nsk-magic-tab-body img.nsc-zoomable-img {
        margin: 4px auto !important;
        width: auto !important; max-width: 100% !important;
        height: auto !important; max-height: none !important;
      }
      .nsc-bubble .nsk-magic-tab-body img.nsc-zoomable-img.nsc-magic-tab-img-full,
      .nsc-thread-content .nsk-magic-tab-body img.nsc-zoomable-img.nsc-magic-tab-img-full {
        width: 100% !important;
      }

      .nsc-bubble pre {
        position: relative; max-width: 100%; overflow-x: auto;
        padding: 12px 12px 10px; border-radius: 9px; background: rgba(0,0,0,0.05);
        border: 1px solid var(--nsc-border);
      }
      body.dark-layout .nsc-bubble pre { background: rgba(0,0,0,0.34); }
      .nsc-bubble pre.has-copy-btn { padding-top: 28px; }
      .nsc-copy-code-btn {
        position: absolute; top: 6px; right: 6px; z-index: 2;
        display: inline-flex; align-items: center; gap: 4px;
        height: 20px; padding: 0 7px; border-radius: 6px;
        border: 1px solid var(--nsc-border); background: var(--nsc-bg-card);
        color: var(--nsc-muted); font-size: 10.5px; font-weight: 600;
        cursor: pointer; opacity: 0.78; transition: all 0.14s ease;
        font-family: var(--mac-font);
      }
      .nsc-copy-code-btn svg { width: 11px; height: 11px; }
      .nsc-bubble pre:hover .nsc-copy-code-btn,
      .nsc-thread-content pre:hover .nsc-copy-code-btn { opacity: 1; }
      .nsc-copy-code-btn:hover { color: var(--nsc-accent); border-color: var(--nsc-accent); }
      .nsc-copy-code-btn.is-copied { color: var(--nsc-green); border-color: var(--nsc-green); opacity: 1; }
      .nsc-thread-content pre {
        position: relative; max-width: 100%; overflow-x: auto;
        padding: 10px 10px 8px; border-radius: 8px; background: rgba(0,0,0,0.05);
        border: 1px solid var(--nsc-border);
      }
      body.dark-layout .nsc-thread-content pre { background: rgba(0,0,0,0.34); }
      .nsc-thread-content pre.has-copy-btn { padding-top: 26px; }

      /* ANSI 终端代码块渲染样式 */
      .nsc-bubble pre.nsc-ansi-pre,
      .nsc-thread-content pre.nsc-ansi-pre {
        background: #181b22 !important;
        color: #e5e7eb !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        border-radius: 10px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        font-size: 12.5px;
        line-height: 1.48;
        white-space: pre;
        overflow-x: auto;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
      }
      .nsc-bubble pre.nsc-ansi-pre code,
      .nsc-thread-content pre.nsc-ansi-pre code {
        background: transparent !important;
        color: inherit;
        padding: 0;
        white-space: pre;
        font-family: inherit;
      }
      .nsc-ansi-pre .nsc-copy-code-btn {
        background: rgba(42, 46, 56, 0.92);
        border-color: rgba(255, 255, 255, 0.16);
        color: #cbd5e1;
      }
      .nsc-ansi-pre .nsc-copy-code-btn:hover {
        color: #60a5fa;
        border-color: #60a5fa;
      }

      /* Markdown 表格边框、间距与横向滚动包装器 */
      .nsc-table-wrap {
        width: 100%;
        max-width: 100%;
        overflow-x: auto;
        margin: 8px 0;
        border: 1px solid var(--nsc-border);
        border-radius: 10px;
        background: var(--nsc-bg-card);
        color: var(--nsc-text);
      }
      .nsc-table-wrap table,
      .nsc-bubble table,
      .nsc-thread-content table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12.5px;
        line-height: 1.48;
        color: var(--nsc-text);
        margin: 0;
      }
      .nsc-bubble th,
      .nsc-bubble td,
      .nsc-thread-content th,
      .nsc-thread-content td {
        padding: 7px 11px;
        border-bottom: 1px solid var(--nsc-border);
        border-right: 1px solid var(--nsc-border);
        text-align: left;
        vertical-align: top;
      }
      .nsc-bubble tr th:last-child,
      .nsc-bubble tr td:last-child,
      .nsc-thread-content tr th:last-child,
      .nsc-thread-content tr td:last-child {
        border-right: none;
      }
      .nsc-bubble tbody tr:last-child td,
      .nsc-thread-content tbody tr:last-child td {
        border-bottom: none;
      }
      .nsc-bubble thead th,
      .nsc-thread-content thead th {
        background: var(--nsc-hover);
        font-weight: 700;
        color: var(--nsc-text);
        white-space: nowrap;
      }
      .nsc-bubble tbody tr:nth-child(even) td,
      .nsc-thread-content tbody tr:nth-child(even) td {
        background: rgba(128, 128, 128, 0.035);
      }
      .nsc-bubble blockquote,
      .nsc-thread-content blockquote {
        margin: 0 0 8px; padding: 6px 10px; border-left: 3px solid var(--nsc-accent);
        background: var(--nsc-quote-bg); border-radius: 6px; font-size: 12px; color: var(--nsc-muted);
        max-height: 68px; overflow: hidden; cursor: pointer;
      }
      .nsc-bubble blockquote.is-expanded,
      .nsc-thread-content blockquote.is-expanded { max-height: none; }
      .nsc-msg.is-self .nsc-bubble blockquote,
      .nsc-thread-item.is-self-thread .nsc-thread-content blockquote {
        color: rgba(255, 255, 255, 0.92);
        background: rgba(255, 255, 255, 0.14);
        border-left-color: rgba(255, 255, 255, 0.72);
      }
      .nsc-msg.is-self .nsc-bubble code:not(pre code),
      .nsc-thread-item.is-self-thread .nsc-thread-content code:not(pre code) {
        background: rgba(255, 255, 255, 0.20) !important;
        color: #ffffff !important;
        padding: 1px 5px;
        border-radius: 5px;
      }
      .nsc-msg.is-self .nsc-bubble pre:not(.nsc-ansi-pre),
      .nsc-thread-item.is-self-thread .nsc-thread-content pre:not(.nsc-ansi-pre) {
        background: rgba(15, 23, 42, 0.36);
        color: #f8fafc;
        border-color: rgba(255, 255, 255, 0.20);
      }
      .nsc-msg.is-self .nsc-bubble ::selection,
      .nsc-thread-item.is-self-thread .nsc-thread-content ::selection {
        background: rgba(255, 255, 255, 0.32);
        color: #ffffff;
      }
      a.nsc-floor-ref {
        display: inline-block; padding: 0 5px; margin: 0 1px; border-radius: 5px;
        background: var(--nsc-accent-soft); color: var(--nsc-accent) !important;
        font-weight: 600; font-size: 12px; text-decoration: none !important; cursor: pointer;
      }
      .nsc-msg.is-self a.nsc-floor-ref,
      .nsc-thread-item.is-self-thread a.nsc-floor-ref {
        background: rgba(255, 255, 255, 0.22);
        color: #ffffff !important;
      }
      a.nsc-floor-ref:hover { text-decoration: underline !important; }

      /* TG / macOS 风格：赞/鸡腿/踩/评论有数据时直接显示轻质紧凑徽章 */
      .nsc-reactions { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
      .nsc-reactions:empty { display: none; }
      .nsc-react-pill {
        display: inline-flex; align-items: center; gap: 3.5px;
        padding: 2px 7px; border-radius: 7px;
        border: 1px solid transparent; background: var(--nsc-hover);
        color: var(--nsc-muted); font-size: 11px; font-weight: 600; cursor: pointer;
        transition: all 0.14s ease;
      }
      .nsc-react-pill svg { width: 11.5px; height: 11.5px; flex: 0 0 11.5px; }
      .nsc-react-pill.is-like { color: var(--nsc-accent); }
      .nsc-react-pill.is-leg { color: #d97706; }
      .nsc-react-pill.is-dislike { color: #ff3b30; }
      .nsc-react-pill.is-reply { color: var(--nsc-muted); }
      .nsc-react-pill.is-voted { background: var(--nsc-accent-soft); border-color: var(--nsc-accent); }
      .nsc-react-pill.is-leg.is-voted { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.45); }
      .nsc-react-pill.is-dislike.is-voted { background: rgba(255, 59, 48, 0.12); border-color: rgba(255, 59, 48, 0.35); }
      .nsc-react-pill:hover { border-color: var(--nsc-accent); color: var(--nsc-accent); background: var(--nsc-accent-soft); }
      .nsc-react-pill.is-dislike:hover { border-color: rgba(255, 59, 48, 0.45); color: #ff3b30; background: rgba(255, 59, 48, 0.10); }

      /* 无外框 macOS SF Symbols 悬停操作条：悬停 0.5 秒后自然淡入 */
      .nsc-hover-bar {
        display: inline-flex; align-items: center; gap: 2px; padding: 0; margin-left: 4px;
        background: transparent; border: none; box-shadow: none;
        opacity: 0; visibility: hidden; pointer-events: none;
        transition: opacity 0.12s ease 0s, visibility 0s linear 0.12s;
        white-space: nowrap; flex: 0 0 auto;
      }
      .nsc-msg:hover > .nsc-msg-main > .nsc-msg-meta > .nsc-hover-bar,
      .nsc-msg-meta:hover > .nsc-hover-bar,
      .nsc-thread-item:hover > .nsc-thread-body > .nsc-thread-meta > .nsc-hover-bar,
      .nsc-thread-meta:hover > .nsc-hover-bar {
        opacity: 1; visibility: visible; pointer-events: auto;
        transition: opacity 0.18s ease 0.5s, visibility 0s linear 0.5s;
      }
      .nsc-hb-btn {
        border: none; background: transparent; color: var(--nsc-muted);
        height: 21px; width: 22px; padding: 0; border-radius: 6px;
        display: inline-flex; align-items: center; justify-content: center;
        cursor: pointer; line-height: 1; transition: background 0.12s ease, color 0.12s ease;
      }
      .nsc-hb-btn svg { width: 12.5px; height: 12.5px; }
      .nsc-hb-btn:hover { background: var(--nsc-accent-soft); color: var(--nsc-accent); }
      .nsc-hb-btn.is-leg:hover { background: rgba(245, 158, 11, 0.15); color: #d97706; }
      .nsc-hb-btn.is-dislike:hover,
      .nsc-hb-btn.is-dislike.is-active { background: rgba(255, 59, 48, 0.12); color: #ff3b30; }
      .nsc-hb-btn.is-pin:hover,
      .nsc-hb-btn.is-pin.is-active { background: rgba(255, 59, 48, 0.13); color: #ff3b30; }
      .nsc-hb-btn.is-active { background: var(--nsc-accent-soft); color: var(--nsc-accent); }

      .nsc-msg.has-thread .nsc-msg-main { flex: 1 1 auto; max-width: calc(100% - 54px); }
      .nsc-thread-toggle {
        align-self: flex-start; border: none; background: var(--nsc-accent-soft); color: var(--nsc-accent);
        font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 999px; cursor: pointer; margin-top: 2px;
      }
      .nsc-thread-wrap {
        margin: 6px auto 2px; padding: 10px 12px; background: var(--nsc-thread-bg);
        border: 1px solid var(--nsc-border); border-radius: 14px;
        display: flex; flex-direction: column; gap: 9px;
        width: min(94%, 640px); box-sizing: border-box; align-self: center;
      }
      .nsc-thread-wrap.is-collapsed { display: none; }
      .nsc-thread-item { display: flex; align-items: flex-start; gap: 8px; position: relative; max-width: 100%; }
      .nsc-thread-item.is-right { flex-direction: row-reverse; }
      .nsc-thread-item img.nsc-t-avatar { width: 28px; height: 28px; border-radius: 50%; flex: 0 0 28px; object-fit: cover; margin-top: 2px; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.10); }
      .nsc-thread-body { flex: 0 1 auto; max-width: 82%; min-width: 0; font-size: 13px; line-height: 1.5; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
      .nsc-thread-item.is-right .nsc-thread-body { align-items: flex-end; }
      .nsc-thread-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; font-size: 11px; color: var(--nsc-muted); }
      .nsc-thread-item.is-right .nsc-thread-meta { flex-direction: row-reverse; }
      .nsc-thread-content {
        background: var(--nsc-bg-card); color: var(--nsc-text);
        border: 1px solid var(--nsc-border); border-radius: 12px 12px 12px 4px;
        padding: 6px 10px; width: fit-content; max-width: 100%; word-break: break-word;
      }
      .nsc-thread-item.is-op-thread .nsc-thread-content { background: var(--nsc-bubble-op); border-color: rgba(245, 158, 11, 0.26); }
      .nsc-thread-item.is-right .nsc-thread-content { border-radius: 12px 12px 4px 12px; }
      .nsc-thread-item.is-self-thread .nsc-thread-content {
        background: linear-gradient(180deg, #1686ff 0%, #007aff 100%);
        color: #fff; border-color: transparent;
      }
      .nsc-thread-item.is-self-thread .nsc-thread-content a { color: #ffffff; }
      .nsc-thread-content p { margin: 3px 0; }
      .nsc-thread-content > p:first-child { margin-top: 0; }
      .nsc-thread-content > p:last-child { margin-bottom: 0; }

      .nsc-chat-pager { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 0; flex-wrap: wrap; }

      .nsc-composer-dock {
        border-top: 1px solid var(--nsc-border);
        background: var(--nsc-bg-right);
        padding: 4px 6px 5px;
        flex: 0 0 auto;
        position: relative;
        overflow-anchor: none;
      }
      .nsc-composer-box,
      .nsc-composer-dock .md-editor,
      #nsc-np-editor-host .md-editor {
        border: 1px solid var(--nsc-border) !important;
        border-radius: 10px !important;
        background: var(--nsc-bg-card) !important;
        overflow: visible !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        transition: border-color 0.16s ease, box-shadow 0.16s ease !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        box-sizing: border-box !important;
        position: relative !important;
      }
      .nsc-composer-box:focus-within,
      .nsc-composer-dock .md-editor:focus-within,
      #nsc-np-editor-host .md-editor:focus-within {
        border-color: var(--nsc-accent) !important;
        box-shadow: 0 0 0 2.5px var(--nsc-accent-soft) !important;
      }
      .nsc-composer-dock #editor-body,
      #nsc-np-editor-host #editor-body { background: transparent !important; position: static !important; margin: 0 !important; padding: 0 !important; }
      .nsc-composer-dock #cm-editor-wrapper,
      .nsc-composer-dock .content-area,
      .nsc-composer-dock .split-view-container,
      #nsc-np-editor-host #cm-editor-wrapper,
      #nsc-np-editor-host .content-area,
      #nsc-np-editor-host .split-view-container {
        min-height: 0 !important; height: auto !important; margin: 0 !important; padding: 0 !important;
      }

      .nsc-composer-header,
      .nsc-composer-dock .tab-select.window_header,
      #nsc-np-editor-host .tab-select.window_header {
        display: flex !important; align-items: center !important; flex-wrap: nowrap !important; gap: 3px !important;
        padding: 2px 8px !important; height: auto !important; min-height: 25px !important;
        overflow-x: auto !important; scrollbar-width: none !important;
        background: var(--nsc-hover) !important; border-bottom: 1px solid var(--nsc-border) !important;
        border-radius: 10px 10px 0 0 !important;
      }
      .nsc-composer-dock .tab-select.window_header::-webkit-scrollbar,
      .nsc-composer-dock .mde-toolbar::-webkit-scrollbar,
      #nsc-np-editor-host .tab-select.window_header::-webkit-scrollbar,
      #nsc-np-editor-host .mde-toolbar::-webkit-scrollbar { display: none !important; }
      .nsc-composer-dock .tab-select.window_header .tab-option,
      #nsc-np-editor-host .tab-select.window_header .tab-option { padding: 2px 7px !important; font-size: 11.5px !important; cursor: pointer; white-space: nowrap !important; flex: 0 0 auto !important; }
      .nsc-composer-dock .tab-select.window_header > div[style*="margin-left: auto"],
      #nsc-np-editor-host .tab-select.window_header > div[style*="margin-left: auto"] { display: none !important; }

      .nsc-composer-dock .tab-select.window_header .expression,
      #nsc-np-editor-host .tab-select.window_header .expression {
        display: inline-flex !important; align-items: center !important; flex-wrap: nowrap !important; gap: 2px !important;
        background: transparent !important; border: none !important; padding: 0 !important; margin: 0 auto 0 8px !important;
        flex: 0 0 auto !important;
      }
      .nsc-composer-dock .tab-select.window_header .expression .exp-item,
      #nsc-np-editor-host .tab-select.window_header .expression .exp-item {
        padding: 2px 7px !important;
        border: none !important;
        background: transparent !important;
        border-radius: 0 !important;
        font-size: 11.5px !important;
        font-weight: 500 !important;
        color: var(--nsc-muted) !important;
        cursor: pointer !important;
        border-bottom: 2px solid transparent !important;
        transition: none !important;
        white-space: nowrap !important;
        flex: 0 0 auto !important;
      }
      .nsc-composer-dock .tab-select.window_header .expression .exp-item:hover,
      .nsc-composer-dock .tab-select.window_header .expression .exp-item.active,
      #nsc-np-editor-host .tab-select.window_header .expression .exp-item:hover,
      #nsc-np-editor-host .tab-select.window_header .expression .exp-item.active {
        color: var(--nsc-accent) !important;
        background: transparent !important;
        border-bottom-color: var(--nsc-accent) !important;
        font-weight: 600 !important;
      }

      .nsc-nodeimage-btn {
        display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 6px;
        border: 1px solid var(--nsc-border); background: var(--nsc-bg-card);
        color: var(--nsc-text) !important; font-size: 11px; font-weight: 600; text-decoration: none !important;
        cursor: pointer; margin-left: 0;
      }
      .nsc-nodeimage-btn:hover { border-color: var(--nsc-accent); color: var(--nsc-accent) !important; background: var(--nsc-accent-soft); }

      .nsc-mde-toolbar,
      .nsc-composer-dock .mde-toolbar,
      #nsc-np-editor-host .mde-toolbar {
        display: flex !important; align-items: center !important; flex-wrap: nowrap !important; gap: 2px !important;
        padding: 3px 6px !important; height: auto !important; min-height: 26px !important;
        background: rgba(0, 122, 255, 0.035) !important;
        overflow-x: auto !important; scrollbar-width: none !important;
        border-bottom: 1px solid var(--nsc-border) !important;
      }
      body.nsc-app-active.nsc-theme-dusk .nsc-mde-toolbar,
      body.nsc-app-active.nsc-theme-dusk .nsc-composer-dock .mde-toolbar,
      body.nsc-app-active.nsc-theme-dusk #nsc-np-editor-host .mde-toolbar {
        background: rgba(184, 98, 28, 0.055) !important;
      }
      body.nsc-app-active.dark-layout .nsc-mde-toolbar,
      body.nsc-app-active.dark-layout .nsc-composer-dock .mde-toolbar,
      body.nsc-app-active.dark-layout #nsc-np-editor-host .mde-toolbar {
        background: rgba(255, 255, 255, 0.035) !important;
      }
      .nsc-mde-btn,
      .nsc-composer-dock .mde-toolbar .toolbar-item,
      #nsc-np-editor-host .mde-toolbar .toolbar-item {
        display: inline-flex !important; align-items: center !important; justify-content: center !important;
        width: 24px !important; height: 22px !important; padding: 0 !important; border-radius: 6px !important;
        flex: 0 0 auto !important; position: relative;
        border: none; background: transparent;
        color: rgba(0, 110, 230, 0.88) !important; transition: background 0.12s ease, color 0.12s ease !important; cursor: pointer; font-size: 11.5px; font-weight: 700;
      }
      body.nsc-app-active.nsc-theme-dusk .nsc-mde-btn,
      body.nsc-app-active.nsc-theme-dusk .nsc-composer-dock .mde-toolbar .toolbar-item,
      body.nsc-app-active.nsc-theme-dusk #nsc-np-editor-host .mde-toolbar .toolbar-item {
        color: #a85513 !important;
      }
      body.nsc-app-active.dark-layout .nsc-mde-btn,
      body.nsc-app-active.dark-layout .nsc-composer-dock .mde-toolbar .toolbar-item,
      body.nsc-app-active.dark-layout #nsc-np-editor-host .mde-toolbar .toolbar-item {
        color: #60a5fa !important;
      }
      .nsc-mde-btn:hover,
      .nsc-composer-dock .mde-toolbar .toolbar-item:hover,
      #nsc-np-editor-host .mde-toolbar .toolbar-item:hover {
        background: rgba(0, 122, 255, 0.12) !important; color: #0055cc !important;
      }
      body.nsc-app-active.nsc-theme-dusk .nsc-mde-btn:hover,
      body.nsc-app-active.nsc-theme-dusk .nsc-composer-dock .mde-toolbar .toolbar-item:hover,
      body.nsc-app-active.nsc-theme-dusk #nsc-np-editor-host .mde-toolbar .toolbar-item:hover {
        background: rgba(184, 98, 28, 0.15) !important; color: #84400c !important;
      }
      body.nsc-app-active.dark-layout .nsc-mde-btn:hover,
      body.nsc-app-active.dark-layout .nsc-composer-dock .mde-toolbar .toolbar-item:hover,
      body.nsc-app-active.dark-layout #nsc-np-editor-host .mde-toolbar .toolbar-item:hover {
        background: rgba(56, 139, 253, 0.20) !important; color: #93c5fd !important;
      }
      .nsc-mde-btn[data-snip="tip"],
      .toolbar-item[data-snip="tip"] { color: #16a34a !important; }
      .nsc-mde-btn[data-snip="note"],
      .toolbar-item[data-snip="note"] { color: #0284c7 !important; }
      .nsc-mde-btn[data-snip="warn"],
      .toolbar-item[data-snip="warn"] { color: #ea580c !important; }
      body.nsc-app-active.dark-layout .nsc-mde-btn[data-snip="tip"],
      body.nsc-app-active.dark-layout .toolbar-item[data-snip="tip"] { color: #4ade80 !important; }
      body.nsc-app-active.dark-layout .nsc-mde-btn[data-snip="note"],
      body.nsc-app-active.dark-layout .toolbar-item[data-snip="note"] { color: #38bdf8 !important; }
      body.nsc-app-active.dark-layout .nsc-mde-btn[data-snip="warn"],
      body.nsc-app-active.dark-layout .toolbar-item[data-snip="warn"] { color: #fb923c !important; }
      .nsc-composer-dock .mde-toolbar .toolbar-item svg,
      #nsc-np-editor-host .mde-toolbar .toolbar-item svg,
      .nsc-mde-btn svg { width: 14px !important; height: 14px !important; }
      .nsc-composer-dock .mde-toolbar .sep,
      #nsc-np-editor-host .mde-toolbar .sep {
        width: 1px; height: 13px; background: var(--nsc-border); margin: 0 3px; flex: 0 0 1px;
      }
      .nsc-mde-ni-btn .nsc-ni-dot {
        position: absolute; top: 2px; right: 2px; width: 5px; height: 5px;
        border-radius: 50%; border: 1px solid var(--nsc-bg-card);
      }
      .nsc-composer-dock .md-editor:not(.fullscreen) .CodeMirror {
        height: 132px !important; min-height: 132px !important; max-height: 132px !important;
        font-size: 13px !important; line-height: 1.5 !important;
        background: transparent !important; color: var(--nsc-text) !important;
      }
      #nsc-np-editor-host .md-editor:not(.fullscreen) .CodeMirror {
        height: 220px !important; min-height: 200px !important; max-height: 44vh !important;
        font-size: 13.5px !important; line-height: 1.55 !important;
        background: transparent !important; color: var(--nsc-text) !important;
      }
      .nsc-composer-dock .CodeMirror-lines,
      #nsc-np-editor-host .CodeMirror-lines { padding: 4px 0 !important; }
      #nsc-np-editor-host .nsc-fallback-textarea {
        height: 220px; min-height: 200px; max-height: 44vh; resize: vertical; padding: 10px 12px; font-size: 13.5px; line-height: 1.55;
      }
      #nsc-np-editor-host .nsc-u-preview { height: 220px; min-height: 200px; max-height: 44vh; }
      #nsc-np-editor-host .md-editor .topic-select .submit.btn { display: none !important; }
      .nsc-fallback-textarea {
        width: 100%; box-sizing: border-box; height: 132px; min-height: 132px; max-height: 132px;
        border: none; outline: none; resize: none;
        padding: 7px 10px; font-size: 13px; line-height: 1.5; background: transparent; color: var(--nsc-text);
        font-family: var(--mac-font);
      }
      /* 表情面板：48px 大表情，严格单行高度（68px，row-gap 14px 杜绝第二行露头），自适应铺满宽度并下拉滚动 */
      .nsc-composer-dock .exp-container.cur-sticker-group-null,
      .nsc-composer-dock .exp-container:empty,
      #nsc-np-editor-host .exp-container.cur-sticker-group-null,
      #nsc-np-editor-host .exp-container:empty {
        display: none !important;
      }
      .nsc-composer-dock .exp-container,
      #nsc-np-editor-host .exp-container {
        position: absolute !important; bottom: calc(100% + 4px) !important; left: 6px !important; right: 6px !important;
        z-index: 260 !important; box-sizing: border-box !important;
        display: grid !important; grid-template-columns: repeat(auto-fill, minmax(54px, 1fr)) !important;
        column-gap: 6px !important; row-gap: 14px !important; justify-items: center !important; align-items: center !important;
        padding: 6px 8px !important;
        height: 68px !important; min-height: 68px !important; max-height: 68px !important;
        overflow-y: auto !important; overflow-x: hidden !important;
        background: var(--nsc-bg-card) !important; border: 1px solid var(--nsc-border) !important;
        border-radius: 12px !important; box-shadow: 0 12px 32px rgba(0,0,0,0.18) !important;
        backdrop-filter: blur(20px) !important; animation: none !important; transition: none !important;
      }
      #nsc-np-editor-host .exp-container,
      #nsc-np-editor-host .nsc-u-app-pop {
        top: 32px !important; bottom: auto !important;
      }
      .nsc-composer-dock .exp-container.cur-sticker-group-app,
      #nsc-np-editor-host .exp-container.cur-sticker-group-app {
        left: var(--nsc-app-pop-left, auto) !important;
        right: var(--nsc-app-pop-right, 12px) !important;
        width: fit-content !important; min-width: 0 !important; max-width: calc(100% - 12px) !important;
        height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important;
        display: inline-flex !important; align-items: center !important; flex-wrap: nowrap !important;
        gap: 6px !important; padding: 5px 8px !important; border-radius: 12px !important;
      }
      .nsc-composer-dock .exp-container.cur-sticker-group-app > *,
      #nsc-np-editor-host .exp-container.cur-sticker-group-app > * {
        margin: 0 !important; flex: 0 0 auto !important;
      }
      .nsc-composer-dock .exp-container:not(.cur-sticker-group-app) img,
      .nsc-composer-dock .exp-container:not(.cur-sticker-group-app) video,
      #nsc-np-editor-host .exp-container:not(.cur-sticker-group-app) img,
      #nsc-np-editor-host .exp-container:not(.cur-sticker-group-app) video {
        width: 48px !important; height: 48px !important; max-width: 48px !important; max-height: 48px !important;
        object-fit: contain !important; display: block !important;
      }
      .nsc-composer-dock .exp-container:not(.cur-sticker-group-app) > *,
      #nsc-np-editor-host .exp-container:not(.cur-sticker-group-app) > * {
        width: 54px !important; height: 54px !important; box-sizing: border-box !important;
        padding: 3px !important; margin: 0 !important; border-radius: 8px !important; cursor: pointer !important;
      }
      .nsc-composer-dock .exp-container:not(.cur-sticker-group-app) > *:hover,
      #nsc-np-editor-host .exp-container:not(.cur-sticker-group-app) > *:hover {
        background: var(--nsc-accent-soft) !important;
      }
      /* 阅读区回复框多档高度（小/中/大）与自动紧凑态 */
      #nsc-composer-dock[data-nsc-csize="sm"]:not(.is-compact) .md-editor:not(.fullscreen) .CodeMirror,
      #nsc-composer-dock[data-nsc-csize="sm"]:not(.is-compact) .nsc-fallback-textarea,
      #nsc-composer-dock[data-nsc-csize="sm"]:not(.is-compact) .nsc-u-preview {
        height: 78px !important; min-height: 78px !important; max-height: 78px !important;
      }
      #nsc-composer-dock[data-nsc-csize="lg"]:not(.is-compact) .md-editor:not(.fullscreen) .CodeMirror,
      #nsc-composer-dock[data-nsc-csize="lg"]:not(.is-compact) .nsc-fallback-textarea,
      #nsc-composer-dock[data-nsc-csize="lg"]:not(.is-compact) .nsc-u-preview {
        height: 216px !important; min-height: 216px !important; max-height: 216px !important;
      }
      #nsc-composer-dock.is-compact .mde-toolbar,
      #nsc-composer-dock.is-compact .nsc-mde-toolbar,
      #nsc-composer-dock.is-compact .topic-select,
      #nsc-composer-dock.is-compact .nsc-composer-footer {
        display: none !important;
      }
      #nsc-composer-dock.is-compact .md-editor:not(.fullscreen) .CodeMirror,
      #nsc-composer-dock.is-compact .nsc-fallback-textarea {
        height: 36px !important; min-height: 36px !important; max-height: 36px !important;
      }
      .nsc-composer-ctrl-wrap {
        display: inline-flex; align-items: center; gap: 4px; margin-left: auto; margin-right: 4px; flex: 0 0 auto;
      }
      .nsc-csize-seg {
        display: inline-flex; align-items: center; gap: 1px; padding: 1px;
        border-radius: 5px; background: var(--nsc-hover); border: 1px solid var(--nsc-border);
      }
      .nsc-csize-btn {
        border: none; background: transparent; color: var(--nsc-muted);
        font-size: 10.5px; font-weight: 600; padding: 1px 5px; border-radius: 4px; cursor: pointer;
        line-height: 1.3;
      }
      .nsc-csize-btn:hover { color: var(--nsc-text); }
      .nsc-csize-btn.is-active {
        background: var(--nsc-bg-card); color: var(--nsc-accent);
        box-shadow: 0 1px 2px rgba(0,0,0,0.10);
      }
      .nsc-cpin-btn {
        width: 22px; height: 20px; padding: 0; border-radius: 5px;
        border: 1px solid transparent; background: transparent; color: var(--nsc-muted);
        display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
      }
      .nsc-cpin-btn svg { width: 12.5px; height: 12.5px; }
      .nsc-cpin-btn:hover { background: var(--nsc-hover); color: var(--nsc-text); }
      .nsc-cpin-btn.is-pinned {
        background: var(--nsc-accent-soft); color: var(--nsc-accent); border-color: rgba(0, 122, 255, 0.25);
      }
      .nsc-mde-btn svg { width: 14px; height: 14px; }
      .nsc-mde-sep { width: 1px; height: 14px; background: var(--nsc-border); margin: 0 3px; flex: 0 0 1px; }
      .nsc-u-tab {
        padding: 2px 7px; font-size: 11.5px; font-weight: 500; color: var(--nsc-muted);
        border: none; border-bottom: 2px solid transparent; background: transparent; cursor: pointer;
      }
      .nsc-u-tab:hover { color: var(--nsc-text); }
      .nsc-u-tab.is-active { color: var(--nsc-text); font-weight: 700; border-bottom-color: var(--nsc-text); }
      .nsc-u-exp-tabs { display: inline-flex; align-items: center; flex-wrap: nowrap; gap: 2px; margin: 0 auto 0 8px; flex: 0 0 auto; }
      .nsc-u-exp-tab {
        padding: 2px 7px; border: none; border-bottom: 2px solid transparent; background: transparent;
        font-size: 11.5px; font-weight: 500; color: var(--nsc-muted); cursor: pointer; white-space: nowrap; flex: 0 0 auto;
      }
      .nsc-u-exp-tab:hover,
      .nsc-u-exp-tab.is-active { color: var(--nsc-accent); border-bottom-color: var(--nsc-accent); font-weight: 600; }
      .nsc-u-top-acts { display: inline-flex; align-items: center; gap: 3px; margin-left: auto; flex: 0 0 auto; }
      .nsc-u-body { display: block; position: relative; }
      .nsc-u-body.is-split { display: grid; grid-template-columns: 1fr 1fr; }
      .nsc-u-body.is-split .nsc-u-preview { border-left: 1px solid var(--nsc-border); display: block; }
      .nsc-u-body.is-preview-only .nsc-fallback-textarea { display: none; }
      .nsc-u-body.is-preview-only .nsc-u-preview { display: block; }
      .nsc-u-preview {
        display: none; height: 132px; min-height: 132px; max-height: 132px; overflow-y: auto;
        padding: 7px 11px; font-size: 13px; line-height: 1.5; color: var(--nsc-text); word-break: break-word;
      }
      .nsc-u-preview p { margin: 3px 0; }
      .nsc-u-preview pre { padding: 7px 9px; border-radius: 7px; background: rgba(0,0,0,0.06); overflow-x: auto; }
      body.dark-layout .nsc-u-preview pre { background: rgba(0,0,0,0.34); }
      .nsc-u-preview img { max-width: 100%; max-height: 110px; object-fit: contain; border-radius: 6px; }
      .nsc-u-preview img.sticker { height: 30px; width: auto; vertical-align: middle; }
      .nsc-u-preview blockquote { margin: 3px 0; padding: 3px 9px; border-left: 3px solid var(--nsc-accent); background: var(--nsc-quote-bg); border-radius: 4px; }
      .nsc-u-preview table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .nsc-u-preview th, .nsc-u-preview td { border: 1px solid var(--nsc-border); padding: 4px 7px; }
      .nsc-composer-box.is-fullscreen {
        position: fixed !important; inset: 48px 20px 14px !important; z-index: 9450 !important;
        display: flex !important; flex-direction: column !important;
        box-shadow: var(--nsc-shadow) !important;
      }
      .nsc-composer-box.is-fullscreen .nsc-u-body { flex: 1; min-height: 0; }
      .nsc-composer-box.is-fullscreen .nsc-fallback-textarea,
      .nsc-composer-box.is-fullscreen .nsc-u-preview { height: 100% !important; max-height: none !important; }
      .nsc-u-app-pop {
        position: absolute; bottom: calc(100% + 4px); right: 12px; z-index: 265;
        display: none; flex-direction: column; gap: 6px; width: fit-content; min-width: 196px; max-width: 300px;
        padding: 8px 10px; border-radius: 12px; border: 1px solid var(--nsc-border);
        background: var(--nsc-bg-card); box-shadow: 0 12px 32px rgba(0,0,0,0.18);
        backdrop-filter: blur(20px);
      }
      .nsc-u-app-pop.is-open { display: flex; }
      .nsc-u-app-row { display: inline-flex; align-items: center; gap: 6px; }
      .nsc-u-app-btn {
        display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px;
        border-radius: 8px; border: 1px solid var(--nsc-border); background: var(--nsc-hover);
        color: var(--nsc-text); font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;
      }
      .nsc-u-app-btn svg { width: 14px; height: 14px; color: var(--nsc-accent); }
      .nsc-u-app-btn:hover { border-color: var(--nsc-accent); background: var(--nsc-accent-soft); color: var(--nsc-accent); }
      .nsc-u-sd-form {
        display: none; flex-direction: column; gap: 6px; padding-top: 6px;
        border-top: 1px dashed var(--nsc-border); font-size: 11.5px;
      }
      .nsc-u-sd-form.is-open { display: flex; }
      .nsc-u-sd-form input[type="text"],
      .nsc-u-sd-form input[type="number"] {
        width: 100%; box-sizing: border-box; height: 26px; padding: 0 8px; border-radius: 7px;
        border: 1px solid var(--nsc-border); background: var(--nsc-hover); color: var(--nsc-text); font-size: 12px; outline: none;
      }
      .nsc-fb-exp-pop {
        position: absolute; bottom: calc(100% + 4px); left: 0; right: 0; z-index: 260;
        background: var(--nsc-bg-card); border: 1px solid var(--nsc-border);
        border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,0.18);
        display: none; flex-direction: column; overflow: hidden;
      }
      .nsc-fb-exp-pop.is-open { display: flex; }
      .nsc-fb-exp-tabs {
        display: flex; align-items: center; gap: 4px; padding: 5px 10px;
        border-bottom: 1px solid var(--nsc-border); background: var(--nsc-hover);
      }
      .nsc-fb-exp-tab {
        border: none; background: transparent; color: var(--nsc-muted);
        font-size: 11.5px; font-weight: 600; padding: 2px 8px; border-radius: 6px; cursor: pointer;
      }
      .nsc-fb-exp-tab.is-active { color: var(--nsc-accent); background: var(--nsc-bg-card); }
      .nsc-fb-exp-grid {
        box-sizing: border-box;
        display: grid; grid-template-columns: repeat(auto-fill, minmax(54px, 1fr));
        column-gap: 6px; row-gap: 14px; justify-items: center; align-items: center;
        padding: 6px 8px; height: 66px; min-height: 66px; max-height: 66px;
        overflow-y: auto; overflow-x: hidden;
      }
      .nsc-fb-exp-item {
        width: 54px; height: 54px; padding: 3px; border: none; border-radius: 8px; box-sizing: border-box;
        background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
      }
      .nsc-fb-exp-item:hover { background: var(--nsc-accent-soft); }
      .nsc-fb-exp-item img { width: 48px; height: 48px; object-fit: contain; display: block; }
      .nsc-composer-footer,
      .nsc-composer-dock .topic-select,
      #nsc-np-editor-host .topic-select {
        display: flex !important; align-items: center !important; justify-content: space-between !important;
        padding: 3px 8px !important; min-height: 26px !important; border-top: 1px solid var(--nsc-border) !important;
        background: var(--nsc-hover) !important; border-radius: 0 0 10px 10px !important;
      }
      .nsc-send-btn,
      .nsc-composer-dock .topic-select .submit.btn,
      #nsc-np-editor-host .topic-select .submit.btn {
        height: 23px !important; padding: 0 12px !important; font-size: 11.5px !important; font-weight: 600 !important;
        border-radius: 7px !important; background: var(--nsc-accent) !important; color: #fff !important;
        border: none !important; cursor: pointer;
      }
      .nsc-send-btn:disabled { opacity: 0.5; cursor: wait; }

      .nsc-pane-right {
        width: 288px; flex: 0 0 288px; background: var(--nsc-bg-right); backdrop-filter: blur(22px);
        border-left: 1px solid var(--nsc-border); display: flex; flex-direction: column; min-height: 0;
      }
      .nsc-right-user { padding: 10px 10px 8px; border-bottom: 1px solid var(--nsc-border); }
      .nsc-right-user .user-card {
        border: none !important; box-shadow: none !important; background: transparent !important;
        padding: 0 !important; margin: 0 !important; width: 100% !important;
      }
      .nsc-right-user .user-card .user-head {
        display: flex !important; align-items: center !important; gap: 10px !important;
        background: transparent !important; padding: 0 0 8px !important; margin: 0 !important;
      }
      .nsc-right-user .user-card .user-head .avatar-normal {
        width: 44px !important; height: 44px !important; border-radius: 12px !important;
        border: 2px solid var(--nsc-bg-card) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.10) !important; object-fit: cover;
      }
      .nsc-right-user .user-card .user-head .menu {
        flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px;
      }
      .nsc-right-user .user-card .user-head .Username {
        font-size: 14.5px !important; font-weight: 700 !important; color: var(--nsc-text) !important;
        text-decoration: none !important; line-height: 1.2;
      }
      .nsc-right-user .user-card .user-head .menu > div {
        display: flex !important; align-items: center !important; gap: 5px !important;
      }
      .nsc-right-user .user-card .user-head .menu > div > a[title="切换主题模式"] {
        display: none !important;
      }
      .nsc-right-user .user-card .user-head .menu > div > a,
      .nsc-right-user .user-card .user-head .menu > div > span {
        width: 24px !important; height: 24px !important; border-radius: 7px !important;
        border: 1px solid var(--nsc-border) !important; background: var(--nsc-bg-card) !important;
        display: inline-flex !important; align-items: center !important; justify-content: center !important;
        color: var(--nsc-muted) !important; cursor: pointer; transition: all 0.13s ease !important;
      }
      .nsc-right-user .user-card .user-head .menu > div > a:hover,
      .nsc-right-user .user-card .user-head .menu > div > span:hover {
        border-color: var(--nsc-accent) !important; color: var(--nsc-accent) !important;
        background: var(--nsc-accent-soft) !important; transform: translateY(-1px);
      }
      .nsc-right-user .user-card .user-head .menu > div svg { width: 13px !important; height: 13px !important; }
      .nsc-right-user .user-card .user-stat {
        background: var(--nsc-hover) !important; border: 1px solid var(--nsc-border) !important;
        border-radius: 11px !important; padding: 7px 10px !important; margin: 0 !important;
        display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 6px 10px !important;
      }
      .nsc-right-user .user-card .stat-block { display: flex !important; flex-direction: column !important; gap: 4px !important; }
      .nsc-right-user .user-card .stat-block a {
        font-size: 11.5px !important; color: var(--nsc-text) !important; text-decoration: none !important;
        display: inline-flex !important; align-items: center !important; gap: 5px !important;
        padding: 1px 0 !important;
      }
      .nsc-right-user .user-card .stat-block a:hover { color: var(--nsc-accent) !important; }
      .nsc-right-user .user-card .stat-block svg { width: 13px !important; height: 13px !important; color: var(--nsc-muted) !important; flex: 0 0 13px; }
      .nsc-right-user .user-card .notify-count {
        background: linear-gradient(135deg, #ff5e7e, #ff2d55) !important; color: #fff !important;
        border-radius: 999px !important; padding: 0 6px !important; font-size: 10px !important;
        font-weight: 700 !important; line-height: 16px !important; height: 16px !important;
      }

      .nsc-right-quickbar {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;
        padding: 7px 10px; border-bottom: 1px solid var(--nsc-border);
      }
      .nsc-quick-btn {
        height: 27px; border-radius: 8px; border: 1px solid var(--nsc-border);
        background: var(--nsc-bg-card); color: var(--nsc-text);
        font-size: 11.5px; font-weight: 600; cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center; gap: 3px;
        text-decoration: none !important; box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        transition: all 0.13s ease;
      }
      .nsc-quick-btn:hover { border-color: var(--nsc-accent); color: var(--nsc-accent); background: var(--nsc-accent-soft); }
      .nsc-quick-btn.is-primary {
        background: linear-gradient(180deg, #1a8cff 0%, #007aff 100%);
        color: #fff; border-color: transparent; box-shadow: 0 2px 6px rgba(0, 122, 255, 0.26);
      }
      .nsc-quick-btn.is-primary:hover { filter: brightness(1.06); color: #fff; }
      .nsc-pm-preview { font-size: 11px; color: var(--nsc-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
      .nsc-right-tabs {
        display: flex; gap: 3px; margin: 7px 10px 3px; padding: 3px;
        background: var(--nsc-hover); border-radius: 9px; border: 1px solid var(--nsc-border);
      }
      .nsc-right-tab {
        flex: 1; padding: 4px 2px; text-align: center; font-size: 11.5px; font-weight: 600;
        color: var(--nsc-muted); border: none; background: transparent; border-radius: 6px; cursor: pointer;
        transition: all 0.13s ease;
      }
      .nsc-right-tab.is-active {
        color: var(--nsc-text); background: var(--nsc-bg-card);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.10);
      }
      .nsc-right-scroll { flex: 1; overflow-y: auto; padding: 8px 9px 14px; }

      .nsc-qq-item {
        display: flex; flex-direction: column; gap: 4px; padding: 7px; border-radius: 10px;
        transition: background 0.12s ease; border: 1px solid transparent; margin-bottom: 3px;
      }
      .nsc-qq-item:hover { background: var(--nsc-hover); border-color: var(--nsc-border); }
      .nsc-qq-main { display: flex; align-items: center; gap: 7px; cursor: pointer; }
      .nsc-qq-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex: 0 0 32px; }
      .nsc-qq-info { flex: 1; min-width: 0; }
      .nsc-qq-name { font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .nsc-qq-sub { font-size: 10.5px; color: var(--nsc-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .nsc-eye-btn,
      .nsc-icon-btn {
        width: 24px; height: 24px; padding: 0; border-radius: 6px; border: 1px solid var(--nsc-border);
        background: var(--nsc-bg-card); color: var(--nsc-muted); cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center; flex: 0 0 24px;
        transition: all 0.12s ease;
      }
      .nsc-eye-btn svg,
      .nsc-icon-btn svg { width: 13px; height: 13px; }
      .nsc-eye-btn:hover,
      .nsc-icon-btn:hover { color: var(--nsc-accent); border-color: var(--nsc-accent); background: var(--nsc-accent-soft); }
      .nsc-icon-btn.danger:hover { color: #ff3b30; border-color: rgba(255, 59, 48, 0.45); background: rgba(255, 59, 48, 0.10); }
      .nsc-eye-btn.is-loading { opacity: 0.5; cursor: wait; }

      .nsc-pm-mode-btn {
        border: none; background: transparent; color: var(--nsc-muted);
        font-size: 11.5px; font-weight: 600; padding: 2px 8px; border-radius: 6px; cursor: pointer;
      }
      .nsc-pm-mode-btn.is-active { background: var(--nsc-bg-card); color: var(--nsc-accent); box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
      .nsc-pm-preview-pane {
        display: none; min-height: 54px; max-height: 150px; overflow-y: auto;
        padding: 8px 12px; font-size: 13px; line-height: 1.55; color: var(--nsc-text); word-break: break-word;
      }
      .nsc-pm-preview-pane.is-open { display: block; }
      .nsc-pm-preview-pane img { max-width: 100%; max-height: 120px; border-radius: 8px; object-fit: contain; display: block; margin: 4px 0; }
      .nsc-pm-preview-pane pre { padding: 8px; border-radius: 8px; background: rgba(0,0,0,0.06); overflow-x: auto; }
      .nsc-pm-preview-pane blockquote { margin: 4px 0; padding: 4px 10px; border-left: 3px solid var(--nsc-accent); background: var(--nsc-quote-bg); border-radius: 4px; }
      .nsc-pm-emoji-pop {
        position: absolute; bottom: calc(100% + 4px); left: 10px; z-index: 260;
        display: none; flex-wrap: wrap; gap: 4px; width: min(320px, 90%);
        padding: 8px; border-radius: 12px; border: 1px solid var(--nsc-border);
        background: var(--nsc-bg-card); box-shadow: 0 12px 30px rgba(0,0,0,0.18);
      }
      .nsc-pm-emoji-pop.is-open { display: flex; }
      .nsc-pm-emoji-item {
        width: 28px; height: 28px; border: none; border-radius: 7px; background: transparent;
        font-size: 16px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
      }
      .nsc-pm-emoji-item:hover { background: var(--nsc-accent-soft); }
      .nsc-last-speak-box {
        margin-left: 39px; padding: 4px 8px; border-radius: 7px;
        background: var(--nsc-accent-soft); font-size: 11px; color: var(--nsc-text);
        cursor: pointer; line-height: 1.4;
      }
      .nsc-last-speak-title { color: var(--nsc-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 10.5px; }

      .nsc-hot-row { display: flex; align-items: flex-start; gap: 7px; padding: 7px 6px; border-radius: 9px; cursor: pointer; transition: background 0.12s ease; margin-bottom: 2px; }
      .nsc-hot-row:hover { background: var(--nsc-hover); }
      .nsc-hot-row.is-selected { background: var(--nsc-active-item); }
      .nsc-hot-rank {
        width: 18px; height: 18px; border-radius: 5px; font-size: 10.5px; font-weight: 700;
        background: var(--nsc-hover); color: var(--nsc-muted);
        display: inline-flex; align-items: center; justify-content: center; flex: 0 0 18px; margin-top: 2px;
      }
      .nsc-hot-rank.rank1 { background: #ff3b30; color: #fff; }
      .nsc-hot-rank.rank2 { background: #ff9500; color: #fff; }
      .nsc-hot-rank.rank3 { background: #ffcc00; color: #1d1d1f; }
      .nsc-hot-title {
        font-size: 12.5px; font-weight: 500; line-height: 1.38; color: var(--nsc-text);
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      }

      #nsc-lightbox {
        position: fixed; inset: 0; z-index: 10000; box-sizing: border-box;
        background: rgba(12, 14, 18, 0.88); backdrop-filter: blur(14px);
        display: none; flex-direction: column; align-items: center; justify-content: center; padding: 14px 16px;
        user-select: none; overflow: hidden;
      }
      #nsc-lightbox.is-open { display: flex; }
      .nsc-lightbox-stage {
        position: relative; display: flex; align-items: center; justify-content: center;
        flex: 1 1 auto; width: 100%; min-height: 0; overflow: hidden;
      }
      .nsc-lb-frame {
        position: relative; display: inline-flex; align-items: center; justify-content: center;
        max-width: calc(100% - 136px); max-height: 100%;
      }
      .nsc-lb-frame.is-zoomed { max-width: none; max-height: none; }
      #nsc-lightbox img {
        width: auto; height: auto; min-width: 0; min-height: 0; padding: 0; border: none; margin: 0;
        max-width: 100%; max-height: calc(100vh - 110px); object-fit: contain;
        border-radius: 10px; box-shadow: 0 22px 64px rgba(0, 0, 0, 0.55); cursor: zoom-in;
        transform-origin: center center; display: block;
      }
      #nsc-lightbox img.is-zoomed-raw {
        max-width: none !important; max-height: none !important;
      }
      .nsc-lb-nav {
        position: absolute; top: 50%; transform: translateY(-50%); z-index: 10002;
        width: 44px; height: 44px; border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.28); background: rgba(20,22,28,0.72);
        backdrop-filter: blur(8px);
        color: #fff; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background 0.14s ease, transform 0.14s ease;
      }
      .nsc-lb-nav:hover:not(:disabled) { background: rgba(0,122,255,0.86); transform: translateY(-50%) scale(1.06); }
      .nsc-lb-nav.prev { left: 14px; right: auto; }
      .nsc-lb-nav.next { right: 14px; left: auto; }
      .nsc-lb-nav:disabled { opacity: 0.22; cursor: default; }
      .nsc-lb-top-badge {
        position: fixed; top: 14px; left: 50%; transform: translateX(-50%); z-index: 10002;
        padding: 4px 14px; border-radius: 999px;
        background: rgba(20, 22, 28, 0.72); border: 1px solid rgba(255,255,255,0.18);
        color: #fff; font-size: 12.5px; font-weight: 600; letter-spacing: 0.3px;
        pointer-events: none;
      }
      .nsc-lb-top-badge:empty { display: none; }
      .nsc-lightbox-bar {
        flex: 0 0 auto; margin-top: 10px;
        display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;
      }
      .nsc-lightbox-btn {
        padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.22);
        background: rgba(255,255,255,0.12); color: #fff !important; font-size: 12px;
        text-decoration: none !important; cursor: pointer;
      }
      .nsc-lightbox-btn:hover { background: rgba(255,255,255,0.22); }
      .nsc-lightbox-btn.is-active { background: var(--nsc-accent); border-color: var(--nsc-accent); }
      .nsc-lightbox-count { font-size: 12px; color: rgba(255,255,255,0.78); font-weight: 600; padding: 0 4px; }

      #nsc-profile-backdrop {
        position: fixed; inset: 0; z-index: 9000;
        background: rgba(15, 23, 42, 0.35); backdrop-filter: blur(4px);
        display: none; align-items: center; justify-content: center;
      }
      #nsc-profile-backdrop.is-open { display: flex; }
      .nsc-profile-modal {
        width: min(440px, 92vw); max-height: 88vh;
        background: var(--nsc-bg-card); color: var(--nsc-text);
        border: 1px solid var(--nsc-border); border-radius: 14px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25); overflow: hidden;
        display: flex; flex-direction: column;
      }
      .nsc-profile-banner { height: 54px; flex-shrink: 0; background: linear-gradient(135deg, #007aff, #5ac8fa); position: relative; }
      .nsc-profile-close {
        position: absolute; right: 10px; top: 10px; width: 24px; height: 24px; border-radius: 6px;
        border: none; background: rgba(0,0,0,0.28); color: #fff; cursor: pointer; font-size: 13px;
      }
      .nsc-profile-body { padding: 0 18px 16px; margin-top: -24px; position: relative; overflow-y: auto; flex: 1; min-height: 0; }
      .nsc-profile-head { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 10px; }
      .nsc-profile-head img {
        width: 58px; height: 58px; border-radius: 50%; object-fit: cover;
        border: 3px solid var(--nsc-bg-card); background: var(--nsc-bg-card);
      }
      .nsc-profile-stats {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
        margin: 10px 0; padding: 9px 6px; border-radius: 10px; background: var(--nsc-hover); text-align: center;
      }
      .nsc-stat-clickable {
        cursor: pointer; border-radius: 8px; padding: 3px 2px; transition: background 0.12s ease;
      }
      .nsc-stat-clickable:hover { background: var(--nsc-accent-soft); }
      .nsc-stat-clickable:hover .nsc-stat-val { color: var(--nsc-accent); }
      #nsc-space-backdrop {
        position: fixed; inset: 0; z-index: 9420;
        background: rgba(15, 23, 42, 0.42); backdrop-filter: blur(8px);
        display: none; align-items: center; justify-content: center; padding: 18px;
      }
      #nsc-space-backdrop.is-open { display: flex; }
      .nsc-space-modal {
        width: min(840px, 94vw); height: min(80vh, 720px);
        background: var(--nsc-bg-list); color: var(--nsc-text);
        border: 1px solid var(--nsc-border); border-radius: 16px;
        box-shadow: var(--nsc-shadow); font-family: var(--mac-font);
        display: flex; flex-direction: column; overflow: hidden;
      }
      .nsc-space-overview-card {
        padding: 13px 15px; border-radius: 12px; margin-bottom: 10px;
        background: var(--nsc-bg-card); border: 1px solid var(--nsc-border);
      }
      .nsc-space-overview-card img { max-width: 100%; max-height: 220px; border-radius: 8px; object-fit: contain; }
      .nsc-stat-val { font-size: 13.5px; font-weight: 700; color: var(--nsc-text); }
      .nsc-stat-lbl { font-size: 10.5px; color: var(--nsc-muted); margin-top: 2px; }
      .nsc-profile-bio { font-size: 12px; color: var(--nsc-muted); line-height: 1.5; margin-bottom: 10px; }
      .nsc-profile-sig {
        margin-bottom: 12px; padding: 9px 11px; border-radius: 10px;
        background: var(--nsc-hover); border: 1px solid var(--nsc-border);
        font-size: 12px; color: var(--nsc-text); line-height: 1.55;
        max-height: 190px; overflow-y: auto; word-break: break-word;
      }
      .nsc-profile-sig-label { font-size: 10.5px; font-weight: 600; color: var(--nsc-muted); margin-bottom: 4px; }
      .nsc-profile-sig p { margin: 3px 0; }
      .nsc-profile-sig p:first-child { margin-top: 0; }
      .nsc-profile-sig p:last-child { margin-bottom: 0; }
      .nsc-profile-sig img { max-width: 100%; max-height: 120px; border-radius: 6px; object-fit: contain; vertical-align: middle; }
      .nsc-profile-sig a { color: var(--nsc-accent); text-decoration: none; }
      .nsc-profile-sig a:hover { text-decoration: underline; }
      .nsc-profile-btns { display: flex; flex-wrap: wrap; gap: 7px; }
      .nsc-profile-btns button, .nsc-profile-btns a {
        flex: 1 1 44%; padding: 7px 10px; border-radius: 8px; font-size: 12px; font-weight: 600;
        text-align: center; text-decoration: none; cursor: pointer;
        border: 1px solid var(--nsc-border); background: var(--nsc-bg-card); color: var(--nsc-text);
      }
      .nsc-profile-btns button.primary { background: var(--nsc-accent); color: #fff; border-color: var(--nsc-accent); }
      .nsc-profile-btns button.danger { color: #ff3b30; border-color: rgba(255,59,48,0.35); }

      .nsc-newpost-btn {
        border: none; border-radius: 7px;
        background: var(--nsc-accent); color: #fff;
        font-size: 11.5px; font-weight: 600; padding: 3px 9px;
        cursor: pointer; display: inline-flex; align-items: center; gap: 3px;
        box-shadow: 0 1px 4px rgba(0, 122, 255, 0.22); transition: filter 0.14s ease;
      }
      .nsc-newpost-btn:hover { filter: brightness(1.08); }

      #nsc-newpost-backdrop {
        position: fixed; inset: 0; z-index: 9500;
        background: rgba(15, 23, 42, 0.40); backdrop-filter: blur(5px);
        display: none; align-items: center; justify-content: center; padding: 16px;
      }
      #nsc-newpost-backdrop.is-open { display: flex; }
      .nsc-newpost-modal {
        width: min(740px, 94vw); max-height: 90vh;
        background: var(--nsc-bg-card); color: var(--nsc-text);
        border: 1px solid var(--nsc-border); border-radius: 16px;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
        display: flex; flex-direction: column; overflow: visible;
      }
      .nsc-newpost-head {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        padding: 12px 16px; border-bottom: 1px solid var(--nsc-border);
        background: var(--nsc-hover); border-radius: 16px 16px 0 0;
      }
      .nsc-newpost-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; overflow: visible; }
      .nsc-newpost-row { display: flex; gap: 8px; align-items: center; }
      .nsc-newpost-select {
        height: 34px; padding: 0 10px; border-radius: 9px;
        border: 1px solid var(--nsc-border); background: var(--nsc-bg-card); color: var(--nsc-text);
        font-size: 13px; font-weight: 500; outline: none; flex: 0 0 116px;
      }
      .nsc-newpost-title {
        flex: 1; min-width: 0; height: 34px; padding: 0 12px; border-radius: 9px;
        border: 1px solid var(--nsc-border); background: var(--nsc-bg-card); color: var(--nsc-text);
        font-size: 13.5px; font-weight: 500; outline: none;
      }
      .nsc-newpost-title:focus, .nsc-newpost-select:focus { border-color: var(--nsc-accent); }
      .nsc-newpost-editor {
        border: 1px solid var(--nsc-border); border-radius: 10px; overflow: visible;
        background: var(--nsc-bg-card); position: relative;
      }
      .nsc-newpost-editor .nsc-fb-exp-pop {
        top: 32px; bottom: auto;
      }
      .nsc-np-editor-host {
        position: relative; width: 100%;
      }
      .nsc-newpost-ta {
        width: 100%; box-sizing: border-box; min-height: 210px; max-height: 44vh;
        border: none; outline: none; resize: vertical; padding: 10px 12px;
        font-size: 13.5px; line-height: 1.6; background: transparent; color: var(--nsc-text);
        font-family: var(--mac-font);
      }
      .nsc-newpost-foot {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        padding: 10px 16px; border-top: 1px solid var(--nsc-border); background: var(--nsc-hover);
        border-radius: 0 0 16px 16px;
      }

      .nsc-ni-dot { width: 6px; height: 6px; border-radius: 50%; background: #ff3b30; display: inline-block; }
      .nsc-ni-dot.is-ok { background: #34c759; }

      #nsc-ni-backdrop {
        position: fixed; inset: 0; z-index: 9600;
        background: rgba(15, 23, 42, 0.40); backdrop-filter: blur(5px);
        display: none; align-items: center; justify-content: center; padding: 16px;
      }
      #nsc-ni-backdrop.is-open { display: flex; }
      .nsc-ni-modal {
        width: min(880px, 95vw); max-height: 88vh;
        background: var(--nsc-bg-card); color: var(--nsc-text);
        border: 1px solid var(--nsc-border); border-radius: 14px;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
        display: flex; flex-direction: column; overflow: hidden;
      }
      .nsc-ni-settings {
        display: none; flex-direction: column; gap: 8px;
        padding: 10px 12px; border-radius: 9px;
        background: var(--nsc-hover); border: 1px solid var(--nsc-border);
      }
      .nsc-ni-settings.is-open { display: flex; }
      .nsc-ni-toolbar {
        display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
        min-height: 28px;
      }
      .nsc-ni-batch-bar {
        display: none; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
        padding: 6px 10px; border-radius: 8px;
        background: var(--nsc-accent-soft); border: 1px solid rgba(0, 122, 255, 0.22);
        font-size: 12px;
      }
      .nsc-ni-batch-bar.is-open { display: flex; }
      .nsc-ni-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
        gap: 11px; max-height: 58vh; overflow-y: auto; padding: 2px;
        contain: layout style;
      }
      .nsc-ni-dropcard {
        border: 1.5px dashed var(--nsc-border); border-radius: 10px; min-height: 186px;
        background: var(--nsc-hover); color: var(--nsc-muted);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 6px; padding: 12px; text-align: center; cursor: pointer;
        transition: border-color 0.14s ease, color 0.14s ease, background 0.14s ease;
      }
      .nsc-ni-dropcard:hover {
        border-color: var(--nsc-accent); color: var(--nsc-accent); background: var(--nsc-accent-soft);
      }
      .nsc-ni-dropcard svg { width: 26px; height: 26px; }
      .nsc-ni-card {
        position: relative; border: 1px solid var(--nsc-border); border-radius: 10px; overflow: hidden;
        background: var(--nsc-bg-card); display: flex; flex-direction: column;
        content-visibility: auto; contain-intrinsic-size: 168px 186px;
        transition: border-color 0.14s ease;
      }
      .nsc-ni-card:hover { border-color: var(--nsc-accent); }
      .nsc-ni-card.is-selected { border-color: var(--nsc-accent); box-shadow: 0 0 0 2px var(--nsc-accent-soft); }
      .nsc-ni-thumb-wrap {
        position: relative; height: 124px; background: rgba(128, 128, 128, 0.06);
        overflow: hidden; cursor: pointer;
      }
      .nsc-ni-thumb-wrap img {
        width: 100%; height: 100%; box-sizing: border-box; padding: 4px;
        object-fit: contain; display: block;
      }
      .nsc-ni-chk {
        position: absolute; top: 6px; left: 6px; z-index: 2;
        width: 16px; height: 16px; margin: 0; cursor: pointer; accent-color: var(--nsc-accent);
      }
      .nsc-ni-overlay-btn {
        position: absolute; z-index: 2; width: 24px; height: 24px; padding: 0;
        border-radius: 6px; border: 1px solid var(--nsc-border);
        background: var(--nsc-bg-card); color: var(--nsc-muted);
        display: inline-flex; align-items: center; justify-content: center;
        cursor: pointer; opacity: 0.88; transition: all 0.12s ease;
      }
      .nsc-ni-overlay-btn svg { width: 13px; height: 13px; }
      .nsc-ni-overlay-btn:hover { opacity: 1; }
      .nsc-ni-del { top: 6px; right: 6px; }
      .nsc-ni-del:hover { color: #ff3b30; border-color: rgba(255, 59, 48, 0.45); background: rgba(255, 59, 48, 0.10); }
      .nsc-ni-zoom { bottom: 6px; left: 6px; }
      .nsc-ni-zoom:hover { color: var(--nsc-text); border-color: var(--nsc-accent); }
      .nsc-ni-ins {
        bottom: 6px; right: 6px;
        color: var(--nsc-accent); border-color: rgba(0, 122, 255, 0.30);
      }
      .nsc-ni-ins:hover { background: var(--nsc-accent); color: #fff; border-color: var(--nsc-accent); }
      .nsc-ni-meta {
        padding: 6px 8px 7px; border-top: 1px solid var(--nsc-border);
        display: flex; flex-direction: column; gap: 4px;
      }
      .nsc-ni-fname {
        font-size: 11px; font-weight: 600; color: var(--nsc-text);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .nsc-ni-sub {
        display: flex; align-items: center; justify-content: space-between; gap: 6px;
        font-size: 10px; color: var(--nsc-muted);
      }
      .nsc-ni-fmts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 1px; }
      .nsc-ni-fmt-btn {
        height: 21px; padding: 0; border-radius: 5px;
        border: 1px solid var(--nsc-border); background: var(--nsc-hover); color: var(--nsc-muted);
        font-size: 10.5px; font-weight: 600; cursor: pointer;
      }
      .nsc-ni-fmt-btn:hover { color: var(--nsc-accent); border-color: var(--nsc-accent); background: var(--nsc-accent-soft); }
      .nsc-ni-more-row {
        grid-column: 1 / -1; display: flex; align-items: center; justify-content: center;
        padding: 6px 0 2px;
      }

      #nsc-hub-backdrop {
        position: fixed; inset: 0; z-index: 9400;
        background: rgba(15, 23, 42, 0.42); backdrop-filter: blur(8px);
        display: none; align-items: center; justify-content: center; padding: 18px;
      }
      #nsc-hub-backdrop.is-open { display: flex; }
      .nsc-hub-modal {
        width: min(880px, 95vw); height: min(82vh, 760px);
        background: var(--nsc-bg-list); color: var(--nsc-text);
        border: 1px solid var(--nsc-border); border-radius: 16px;
        box-shadow: var(--nsc-shadow); font-family: var(--mac-font);
        display: flex; flex-direction: column; overflow: hidden;
      }
      .nsc-hub-head {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        padding: 12px 16px; background: var(--nsc-bg-nav); border-bottom: 1px solid var(--nsc-border);
      }
      .nsc-hub-user { display: flex; align-items: center; gap: 10px; min-width: 0; }
      .nsc-hub-user img { width: 34px; height: 34px; border-radius: 9px; object-fit: cover; border: 1px solid var(--nsc-border); }
      .nsc-hub-tabs {
        display: flex; align-items: center; gap: 4px; padding: 8px 14px;
        background: var(--nsc-bg-right); border-bottom: 1px solid var(--nsc-border);
        overflow-x: auto; flex: 0 0 auto;
      }
      .nsc-hub-tab {
        border: none; background: transparent; color: var(--nsc-muted);
        font-size: 12px; font-weight: 600; padding: 5px 11px; border-radius: 8px;
        cursor: pointer; white-space: nowrap; transition: all 0.12s ease;
        display: inline-flex; align-items: center; gap: 5px;
      }
      .nsc-hub-tab:hover { background: var(--nsc-hover); color: var(--nsc-text); }
      .nsc-hub-tab.is-active { background: var(--nsc-accent); color: #fff; box-shadow: 0 2px 6px rgba(0, 122, 255, 0.25); }
      .nsc-hub-tab-cnt {
        font-size: 10px; padding: 0 5px; border-radius: 999px;
        background: rgba(255, 59, 48, 0.16); color: #ff3b30; font-weight: 700;
      }
      .nsc-hub-tab.is-active .nsc-hub-tab-cnt { background: rgba(255,255,255,0.28); color: #fff; }
      .nsc-hub-subbar {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        padding: 8px 16px; border-bottom: 1px solid var(--nsc-border);
        background: var(--nsc-bg-chat); flex-wrap: wrap;
      }
      .nsc-hub-body { flex: 1; overflow-y: auto; padding: 12px 16px; background: var(--nsc-bg-chat); }
      .nsc-hub-row {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        padding: 10px 12px; margin-bottom: 6px; border-radius: 11px;
        background: var(--nsc-bg-card); border: 1px solid var(--nsc-border);
        cursor: pointer; transition: border-color 0.12s ease, transform 0.12s ease;
      }
      .nsc-hub-row:hover { border-color: var(--nsc-accent); }
      .nsc-hub-row.is-read { opacity: 0.72; }
      .nsc-hub-row-main { flex: 1; min-width: 0; }
      .nsc-hub-row-title { font-size: 13px; font-weight: 600; color: var(--nsc-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .nsc-hub-row-sub { font-size: 11.5px; color: var(--nsc-muted); margin-top: 3px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .nsc-hub-delta {
        font-size: 12px; font-weight: 700; padding: 2px 9px; border-radius: 999px; flex: 0 0 auto;
      }
      .nsc-hub-delta.pos { background: rgba(52, 199, 89, 0.15); color: #16a34a; }
      .nsc-hub-delta.neg { background: rgba(255, 59, 48, 0.14); color: #ff3b30; }
      .nsc-hub-kpi-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; margin-bottom: 14px;
      }
      .nsc-hub-kpi {
        padding: 12px 14px; border-radius: 12px;
        background: var(--nsc-bg-card); border: 1px solid var(--nsc-border);
      }
      .nsc-hub-kpi-val { font-size: 20px; font-weight: 700; color: var(--nsc-text); margin-top: 4px; }
      .nsc-hub-kpi-lbl { font-size: 11.5px; color: var(--nsc-muted); }
      .nsc-hub-fan-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; }
      .nsc-hub-iframe {
        width: 100%; height: 100%; min-height: 460px; border: none; border-radius: 10px;
        background: transparent; display: block;
      }
      .nsc-checkin-card {
        display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
        padding: 12px 14px; border-radius: 10px; margin-bottom: 12px;
        background: var(--nsc-bg-card); border: 1px solid var(--nsc-border);
      }
      .nsc-checkin-actions { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
      .nsc-checkin-btn {
        height: 29px; padding: 0 13px; border-radius: 7px; font-size: 12px; font-weight: 600;
        border: 1px solid var(--nsc-border); background: var(--nsc-hover); color: var(--nsc-text);
        cursor: pointer; transition: all 0.13s ease;
      }
      .nsc-checkin-btn:hover:not(:disabled) { border-color: var(--nsc-accent); color: var(--nsc-accent); background: var(--nsc-accent-soft); }
      .nsc-checkin-btn.primary { background: var(--nsc-accent); color: #fff; border-color: transparent; }
      .nsc-checkin-btn.primary:hover:not(:disabled) { filter: brightness(1.07); color: #fff; background: var(--nsc-accent); }
      .nsc-checkin-btn:disabled { opacity: 0.58; cursor: default; }
      .nsc-checkin-btn.is-loading:disabled { cursor: wait; }
      .nsc-checkin-auto-row {
        display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
        width: 100%; padding-top: 10px; margin-top: 2px; border-top: 1px dashed var(--nsc-border);
        font-size: 12px; color: var(--nsc-text);
      }
      .nsc-checkin-auto-seg.is-dim { opacity: 0.55; }
      .nsc-switch {
        position: relative; display: inline-flex; align-items: center; width: 34px; height: 19px;
        border-radius: 999px; background: rgba(128, 128, 128, 0.28); border: none; padding: 2px;
        cursor: pointer; transition: background 0.16s ease;
      }
      .nsc-switch.is-on { background: var(--nsc-green); }
      .nsc-switch-knob {
        width: 15px; height: 15px; border-radius: 50%; background: #fff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.22); transition: transform 0.16s ease;
      }
      .nsc-switch.is-on .nsc-switch-knob { transform: translateX(15px); }

      /* 原生弹框（如 Stardust 转账 / mscDialog）macOS 视觉兼容与层级抬升 */
      body.nsc-app-active #nsc-app-shell:has(.msc-overlay, .msc-dialog, .el-dialog, [class*="transfer"], [class*="stardust"][style*="fixed"]),
      body.nsc-app-active .nsc-pane-right:has(.msc-overlay, .msc-dialog, .el-dialog, [class*="transfer"], [class*="stardust"][style*="fixed"]) {
        overflow: visible !important;
        backdrop-filter: none !important;
      }
      body.nsc-app-active .msc-overlay,
      body.nsc-app-active .el-overlay,
      body.nsc-app-active [class*="stardust"][style*="fixed"],
      body.nsc-app-active [class*="modal"][style*="fixed"] {
        z-index: 9800 !important;
      }
      body.nsc-app-active .msc-dialog {
        font-family: var(--mac-font) !important;
        border-radius: 14px !important;
        background: var(--nsc-bg-card) !important;
        color: var(--nsc-text) !important;
        border: 1px solid var(--nsc-border) !important;
        box-shadow: var(--nsc-shadow) !important;
      }

      /* macOS 风格 nsapp:// 星辰收款卡与投票卡片 */
      .nsc-sd-card,
      .nsc-vote-card {
        position: relative; overflow: hidden;
        margin: 8px 0; padding: 13px 15px; border-radius: 15px; box-sizing: border-box;
        background: var(--nsc-bg-card); color: var(--nsc-text); text-align: left;
        border: 1px solid var(--nsc-border);
        box-shadow: 0 3px 14px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.45);
        font-family: var(--mac-font);
      }
      .nsc-sd-card::before {
        content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2.5px;
        background: linear-gradient(90deg, rgba(0, 122, 255, 0.55), rgba(88, 86, 214, 0.55), rgba(52, 199, 89, 0.45));
        opacity: 0.72; pointer-events: none;
      }
      body.nsc-theme-dusk .nsc-sd-card::before {
        background: linear-gradient(90deg, rgba(184, 98, 28, 0.65), rgba(68, 104, 158, 0.55));
      }
      .nsc-sd-card.is-empty::before { opacity: 0.42; }
      body.nsc-app-active.dark-layout .nsc-sd-card,
      body.nsc-app-active.dark-layout .nsc-vote-card {
        box-shadow: 0 5px 18px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.06);
      }
      .nsc-sd-card { width: min(100%, 364px); }
      .nsc-vote-card { width: min(100%, 400px); padding: 13px 15px; }
      .nsc-sd-card a,
      .nsc-vote-card a { color: var(--nsc-accent) !important; text-decoration: none; }
      .nsc-sd-card a:hover,
      .nsc-vote-card a:hover { text-decoration: underline; }

      .nsc-sd-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .nsc-sd-peer { display: flex; align-items: center; gap: 10px; min-width: 0; cursor: pointer; }
      .nsc-bubble img.nsc-sd-avatar,
      .nsc-thread-content img.nsc-sd-avatar {
        width: 40px !important; height: 40px !important;
        max-width: 40px !important; max-height: 40px !important;
        margin: 0 !important; border-radius: 11px !important;
        object-fit: cover !important; cursor: pointer !important;
        flex: 0 0 40px; border: 1px solid var(--nsc-border);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      }
      .nsc-sd-peer-info { min-width: 0; }
      .nsc-sd-name-row { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
      .nsc-sd-name {
        font-size: 13.5px; font-weight: 700; color: var(--nsc-text);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 148px;
      }
      .nsc-sd-tag {
        font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 5px;
        background: rgba(245, 158, 11, 0.14); color: #d97706;
      }
      body.dark-layout .nsc-sd-tag { background: rgba(255, 159, 10, 0.20); color: #ffb340; }
      .nsc-sd-ref { font-size: 11px; color: var(--nsc-muted); margin-top: 2px; }
      .nsc-sd-amount-pill {
        display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px;
        border-radius: 9px; font-size: 12px; font-weight: 700; flex: 0 0 auto;
        background: linear-gradient(135deg, rgba(0, 122, 255, 0.10), rgba(88, 86, 214, 0.12));
        color: var(--nsc-accent); border: 1px solid rgba(0, 122, 255, 0.22);
      }
      .nsc-sd-amount-pill svg { width: 14px; height: 14px; }
      body.dark-layout .nsc-sd-amount-pill {
        background: linear-gradient(135deg, rgba(10, 132, 255, 0.20), rgba(94, 92, 230, 0.22));
        color: #7cc0ff; border-color: rgba(10, 132, 255, 0.34);
      }
      body.nsc-theme-dusk .nsc-sd-amount-pill {
        background: linear-gradient(135deg, rgba(184, 98, 28, 0.13), rgba(68, 104, 158, 0.13));
        border-color: rgba(184, 98, 28, 0.26);
      }
      .nsc-sd-amount-pill.is-invalid {
        background: var(--nsc-hover); color: var(--nsc-muted); border-color: var(--nsc-border);
        font-weight: 600; font-size: 11px;
      }
      .nsc-sd-desc {
        margin-top: 9px; padding: 8px 11px; border-radius: 9px;
        background: var(--nsc-hover); border-left: 2.5px solid var(--nsc-accent);
        font-size: 12.5px; line-height: 1.5; color: var(--nsc-text);
      }
      .nsc-sd-foot {
        margin-top: 10px; padding-top: 9px; border-top: 1px solid var(--nsc-border);
        display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
      }
      .nsc-sd-status {
        display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap;
        font-size: 11px; color: var(--nsc-muted); min-width: 0;
      }
      .nsc-sd-dot {
        width: 6px; height: 6px; border-radius: 50%; background: var(--nsc-muted);
        display: inline-block; margin-right: 4px; vertical-align: 1px; opacity: 0.7;
      }
      .nsc-sd-dot.is-paid { background: var(--nsc-green); opacity: 1; }
      .nsc-sd-dot.is-pending { background: #f59e0b; opacity: 1; }
      .nsc-sd-state { font-weight: 600; color: var(--nsc-muted); }
      .nsc-sd-state.is-paid { color: var(--nsc-green); }
      .nsc-sd-link { font-size: 11px; font-weight: 600; }
      .nsc-sd-refresh {
        width: 22px; height: 22px; padding: 0; border-radius: 6px;
        border: 1px solid transparent; background: transparent; color: var(--nsc-muted);
        display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
        flex: 0 0 22px; transition: all 0.12s ease;
      }
      .nsc-sd-refresh svg { width: 12px; height: 12px; }
      .nsc-sd-refresh:hover { background: var(--nsc-hover); color: var(--nsc-accent); border-color: var(--nsc-border); }
      @keyframes nscSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .nsc-sd-refresh.is-spinning svg { animation: nscSpin 0.8s linear infinite; }
      .nsc-sd-pay-btn {
        height: 27px; padding: 0 11px; border-radius: 8px; border: none;
        background: var(--nsc-accent); color: #fff; font-size: 11.5px; font-weight: 600;
        cursor: pointer; transition: filter 0.12s ease, opacity 0.12s ease;
        font-family: var(--mac-font);
      }
      .nsc-sd-pay-btn:hover:not(:disabled) { filter: brightness(1.08); }
      .nsc-sd-pay-btn.is-paid {
        background: var(--nsc-accent-soft); color: var(--nsc-accent);
        border: 1px solid rgba(0, 122, 255, 0.26);
      }
      .nsc-sd-pay-btn.is-done,
      .nsc-sd-pay-btn:disabled {
        background: var(--nsc-hover); color: var(--nsc-muted);
        border: 1px solid var(--nsc-border); cursor: default;
      }

      .nsc-vote-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
      .nsc-vote-title-wrap { min-width: 0; flex: 1; }
      .nsc-vote-title { font-size: 13.5px; font-weight: 700; line-height: 1.42; color: var(--nsc-text); }
      .nsc-vote-badges { display: flex; align-items: center; gap: 6px; margin-top: 4px; flex-wrap: wrap; }
      .nsc-vote-badge {
        font-size: 10.5px; font-weight: 600; padding: 1px 7px; border-radius: 999px;
        background: var(--nsc-hover); color: var(--nsc-muted); border: 1px solid var(--nsc-border);
      }
      .nsc-vote-id { font-size: 10.5px; color: var(--nsc-muted); font-weight: 500; }
      .nsc-vote-body { display: flex; flex-direction: column; gap: 6px; }
      .nsc-vote-opt {
        width: 100%; display: flex; align-items: center; gap: 9px; padding: 8px 10px;
        border-radius: 10px; border: 1px solid var(--nsc-border); background: var(--nsc-hover);
        color: var(--nsc-text); font-size: 12.5px; font-weight: 500; text-align: left;
        cursor: pointer; transition: all 0.13s ease; font-family: var(--mac-font);
      }
      .nsc-vote-opt:hover:not(:disabled) { border-color: var(--nsc-accent); background: var(--nsc-accent-soft); }
      .nsc-vote-opt.is-selected { border-color: var(--nsc-accent); background: var(--nsc-accent-soft); font-weight: 600; }
      .nsc-vote-opt:disabled { opacity: 0.68; cursor: default; }
      .nsc-vote-indicator {
        width: 16px; height: 16px; flex: 0 0 16px; border-radius: 50%;
        border: 1.5px solid var(--nsc-muted); background: var(--nsc-bg-card);
        display: inline-flex; align-items: center; justify-content: center;
        transition: all 0.13s ease;
      }
      .nsc-vote-opt.is-multi .nsc-vote-indicator { border-radius: 5px; }
      .nsc-vote-opt.is-selected .nsc-vote-indicator {
        border-color: var(--nsc-accent); background: var(--nsc-accent); color: #fff;
      }
      .nsc-vote-indicator svg { width: 11px; height: 11px; }
      .nsc-vote-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; display: block; }
      .nsc-vote-opt-text { flex: 1; min-width: 0; line-height: 1.4; word-break: break-word; }

      .nsc-vote-res-row {
        padding: 7px 10px; border-radius: 10px;
        border: 1px solid var(--nsc-border); background: var(--nsc-hover);
      }
      .nsc-vote-res-row.is-mine { border-color: var(--nsc-accent); background: var(--nsc-accent-soft); }
      .nsc-vote-res-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12.5px; font-weight: 500; }
      .nsc-vote-res-row.is-mine .nsc-vote-opt-text { font-weight: 600; }
      .nsc-vote-res-meta {
        display: inline-flex; align-items: center; gap: 5px; flex: 0 0 auto;
        font-size: 11px; color: var(--nsc-muted); font-weight: 600;
      }
      .nsc-vote-mine-tag {
        font-size: 10px; padding: 0 5px; border-radius: 5px;
        background: var(--nsc-accent); color: #fff; font-weight: 600;
      }
      .nsc-vote-bar-track {
        height: 6px; border-radius: 999px; background: rgba(128, 128, 128, 0.16);
        overflow: hidden; margin-top: 6px;
      }
      .nsc-vote-bar-fill {
        height: 100%; border-radius: 999px; background: rgba(128, 128, 128, 0.44);
        transition: width 0.25s ease;
      }
      .nsc-vote-bar-fill.is-mine { background: var(--nsc-accent); }

      .nsc-vote-foot {
        margin-top: 10px; padding-top: 9px; border-top: 1px solid var(--nsc-border);
        display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
      }
      .nsc-vote-note { font-size: 11px; color: var(--nsc-muted); line-height: 1.4; }
      .nsc-vote-note.is-error { color: #ff3b30; font-weight: 600; }
      .nsc-vote-confirm-bar {
        width: 100%; display: flex; align-items: center; justify-content: space-between;
        gap: 8px; flex-wrap: wrap;
      }
      .nsc-vote-confirm-btns { display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto; }

      /* 工作台共享基座配置中心样式 */

      .nsc-base-section {
        margin-bottom: 12px; padding: 12px 14px; border-radius: 12px;
        background: var(--nsc-bg-card); border: 1px solid var(--nsc-border);
      }
      .nsc-base-title {
        font-size: 13px; font-weight: 700; color: var(--nsc-text);
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        margin-bottom: 8px;
      }
      .nsc-base-sub { font-size: 11.5px; color: var(--nsc-muted); line-height: 1.45; margin-bottom: 10px; }
      .nsc-base-grid-2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 10px; }
      .nsc-base-theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 9px; }
      .nsc-base-theme-card {
        display: flex; flex-direction: column; gap: 6px; padding: 10px 12px;
        border-radius: 11px; border: 1px solid var(--nsc-border); background: var(--nsc-hover);
        cursor: pointer; text-align: left; transition: all 0.13s ease; font-family: var(--mac-font);
      }
      .nsc-base-theme-card:hover { border-color: var(--nsc-accent); }
      .nsc-base-theme-card.is-active {
        border-color: var(--nsc-accent); background: var(--nsc-accent-soft);
        box-shadow: 0 2px 8px rgba(0, 122, 255, 0.14);
      }
      .nsc-base-swatch-row { display: flex; align-items: center; gap: 4px; }
      .nsc-base-swatch {
        width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(128,128,128,0.28);
        display: inline-block;
      }
      .nsc-base-ctrl-row {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        margin-top: 7px; font-size: 12px; color: var(--nsc-text);
      }
      .nsc-base-ctrl-row label { color: var(--nsc-muted); font-size: 11.5px; flex: 0 0 74px; }
      .nsc-base-range { flex: 1; accent-color: var(--nsc-accent); cursor: pointer; }
      .nsc-base-val { width: 46px; text-align: right; font-size: 11px; color: var(--nsc-muted); font-variant-numeric: tabular-nums; }
      .nsc-base-order-list { display: flex; flex-direction: column; gap: 5px; }
      .nsc-base-order-row {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        padding: 7px 10px; border-radius: 9px; border: 1px solid var(--nsc-border);
        background: var(--nsc-hover); font-size: 12.5px; color: var(--nsc-text);
      }
      .nsc-base-order-ops { display: inline-flex; align-items: center; gap: 5px; }
      .nsc-base-sticker-preview {
        display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;
      }
      .nsc-base-sticker-chip {
        display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px;
        border-radius: 8px; border: 1px solid var(--nsc-border); background: var(--nsc-hover);
        font-size: 11px; color: var(--nsc-text);
      }
      .nsc-base-sticker-chip img { width: 22px; height: 22px; object-fit: contain; border-radius: 4px; }

      /* 个人中心统计分析面板、进度条、备忘录卡片与全量表格样式 */
      .nsc-ana-banner {
        display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
        padding: 11px 14px; border-radius: 12px; margin-bottom: 12px;
        background: var(--nsc-bg-card); border: 1px solid var(--nsc-border);
      }
      .nsc-ana-progress-track {
        width: 100%; height: 6px; border-radius: 999px; background: var(--nsc-hover);
        overflow: hidden; margin-top: 8px;
      }
      .nsc-ana-progress-fill {
        height: 100%; border-radius: 999px; background: var(--nsc-accent);
        transition: width 0.18s ease;
      }
      .nsc-ana-split {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 10px; margin-bottom: 12px;
      }
      .nsc-ana-card {
        padding: 12px 14px; border-radius: 12px;
        background: var(--nsc-bg-card); border: 1px solid var(--nsc-border);
        display: flex; flex-direction: column;
      }
      .nsc-ana-feeder-list {
        flex: 1 1 auto; min-height: 0; overflow-y: auto;
        display: flex; flex-direction: column; gap: 6px;
      }
      .nsc-ana-card-title {
        font-size: 13px; font-weight: 700; color: var(--nsc-text);
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        margin-bottom: 9px;
      }
      .nsc-ana-bar-row {
        display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; font-size: 12px;
      }
      .nsc-ana-bar-row:last-child { margin-bottom: 0; }
      .nsc-ana-bar-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .nsc-ana-bar-track {
        height: 7px; border-radius: 999px; background: var(--nsc-hover); overflow: hidden;
      }
      .nsc-ana-bar-fill {
        height: 100%; border-radius: 999px; background: var(--nsc-accent); transition: width 0.22s ease;
      }
      .nsc-ana-table-wrap {
        border: 1px solid var(--nsc-border); border-radius: 12px; overflow: hidden;
        background: var(--nsc-bg-card);
      }
      .nsc-ana-table {
        width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;
      }
      .nsc-ana-table th {
        padding: 8px 11px; background: var(--nsc-hover); color: var(--nsc-muted);
        font-weight: 600; border-bottom: 1px solid var(--nsc-border); white-space: nowrap;
      }
      .nsc-ana-sort-th {
        cursor: pointer; user-select: none; transition: color 0.12s ease, background 0.12s ease;
      }
      .nsc-ana-sort-th:hover { color: var(--nsc-text); background: var(--nsc-accent-soft); }
      .nsc-ana-sort-th.is-sorted { color: var(--nsc-accent); }
      .nsc-ana-sort-ind { margin-left: 4px; font-size: 10px; opacity: 0.75; }
      .nsc-ana-table td {
        padding: 8px 11px; border-bottom: 1px solid var(--nsc-border); color: var(--nsc-text);
        vertical-align: middle;
      }
      .nsc-ana-table tbody tr:last-child td { border-bottom: none; }
      .nsc-ana-table tbody tr:hover td { background: var(--nsc-hover); }
      .nsc-ana-badge {
        display: inline-flex; align-items: center; padding: 1px 7px; border-radius: 999px;
        font-size: 11px; font-weight: 600;
      }
      .nsc-ana-badge.in { background: rgba(52, 199, 89, 0.14); color: #16a34a; }
      .nsc-ana-badge.out { background: rgba(255, 59, 48, 0.14); color: #ff3b30; }
      .nsc-ana-badge.star { background: var(--nsc-accent-soft); color: var(--nsc-accent); }
      .nsc-ext-code {
        width: 100%; box-sizing: border-box; min-height: 180px; padding: 10px 12px;
        border-radius: 10px; border: 1px solid var(--nsc-border);
        background: var(--nsc-hover); color: var(--nsc-text);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11.5px; line-height: 1.5; resize: vertical; outline: none;
      }
      .nsc-ext-code:focus { border-color: var(--nsc-accent); background: var(--nsc-bg-card); }
      .nsc-ext-guide-box {
        padding: 10px 12px; border-radius: 10px; margin-bottom: 10px;
        background: var(--nsc-accent-soft); border: 1px solid rgba(0, 122, 255, 0.22);
        font-size: 12px; color: var(--nsc-text); line-height: 1.55;
      }

      @keyframes nscFlash {
        0% { box-shadow: 0 0 0 3px var(--nsc-accent); }
        100% { box-shadow: 0 0 0 0 transparent; }
      }
      .nsc-flash .nsc-bubble,
      .nsc-flash > .nsc-thread-body > .nsc-thread-content { animation: nscFlash 1.5s ease; }

      /* 外链跳转提醒二级弹窗（macOS 对话框风格） */
      #nsc-jump-backdrop {
        position: fixed; inset: 0; z-index: 9600;
        background: rgba(15, 23, 42, 0.38); backdrop-filter: blur(5px);
        display: none; align-items: center; justify-content: center; padding: 16px;
      }
      #nsc-jump-backdrop.is-open { display: flex; }
      .nsc-jump-modal {
        width: min(460px, 92vw);
        background: var(--nsc-bg-card); color: var(--nsc-text);
        border: 1px solid var(--nsc-border); border-radius: 12px;
        box-shadow: 0 22px 56px rgba(0, 0, 0, 0.28); overflow: hidden;
        font-family: var(--mac-font);
      }
      .nsc-jump-head {
        display: flex; align-items: center; justify-content: space-between;
        padding: 11px 15px; border-bottom: 1px solid var(--nsc-border);
        background: var(--nsc-hover);
      }
      .nsc-jump-title { font-size: 13.5px; font-weight: 700; color: var(--nsc-text); }
      .nsc-jump-close {
        width: 24px; height: 24px; border-radius: 6px; border: none;
        background: transparent; color: var(--nsc-muted); cursor: pointer; font-size: 14px;
      }
      .nsc-jump-close:hover { background: var(--nsc-border); color: var(--nsc-text); }
      .nsc-jump-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
      .nsc-jump-hint { font-size: 12px; color: var(--nsc-muted); line-height: 1.5; }
      .nsc-jump-host {
        padding: 8px 11px; border-radius: 7px; border: 1px solid var(--nsc-border);
        background: var(--nsc-hover); display: flex; align-items: center; justify-content: space-between; gap: 8px;
      }
      .nsc-jump-host-name {
        font-size: 13.5px; font-weight: 700; color: var(--nsc-accent);
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .nsc-jump-url-box {
        padding: 8px 10px; border-radius: 7px; border: 1px solid var(--nsc-border);
        background: var(--nsc-bg-chat); color: var(--nsc-text);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11.5px; line-height: 1.5; word-break: break-all; max-height: 108px; overflow-y: auto;
      }
      .nsc-jump-foot {
        padding: 11px 16px; border-top: 1px solid var(--nsc-border);
        display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
        background: var(--nsc-hover);
      }
      .nsc-jump-skip-label {
        display: inline-flex; align-items: center; gap: 6px; font-size: 12px;
        color: var(--nsc-muted); cursor: pointer; user-select: none;
      }
      .nsc-jump-skip-label input { accent-color: var(--nsc-accent); cursor: pointer; }
      .nsc-mac-btn {
        height: 28px; padding: 0 12px; border-radius: 6px;
        border: 1px solid var(--nsc-border); background: var(--nsc-bg-card); color: var(--nsc-text);
        font-size: 12px; font-weight: 600; cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center; gap: 4px;
        transition: background 0.12s ease, border-color 0.12s ease;
      }
      .nsc-mac-btn:hover { background: var(--nsc-hover); }
      .nsc-mac-btn.primary {
        background: var(--nsc-accent); color: #fff; border-color: var(--nsc-accent);
      }
      .nsc-mac-btn.primary:hover { filter: brightness(1.06); background: var(--nsc-accent); }

      /* 名片管理记录条（macOS 纯文字染色标签 + 悬停预览 + 展开详情，非胶囊） */
      .nsc-ruling-strip {
        margin: 8px 0 4px; padding: 7px 10px; border-radius: 7px;
        background: var(--nsc-hover); border: 1px solid var(--nsc-border);
        position: relative;
      }
      .nsc-ruling-row {
        display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; flex-wrap: nowrap;
      }
      .nsc-ruling-tags {
        display: flex; align-items: center; flex-wrap: wrap; gap: 4px 6px; min-width: 0; flex: 1 1 auto;
      }
      .nsc-ruling-prefix { font-size: 11px; color: var(--nsc-muted); font-weight: 600; margin-right: 2px; }
      .nsc-ruling-tag {
        border: none; background: transparent; padding: 2px 5px; border-radius: 4px;
        font-size: 11.5px; font-weight: 600; line-height: 1.35; cursor: pointer;
        transition: background 0.12s ease;
      }
      .nsc-ruling-tag:hover, .nsc-ruling-tag.is-active { background: rgba(128, 128, 128, 0.14); }
      .nsc-ruling-tag.tone-danger { color: #d93025; }
      .nsc-ruling-tag.tone-warn { color: #c25900; }
      .nsc-ruling-tag.tone-indigo { color: #4f46e5; }
      .nsc-ruling-tag.tone-success { color: #15803d; }
      .nsc-ruling-tag.tone-neutral { color: var(--nsc-muted); }
      body.nsc-app-active[data-nsc-theme="dark"] .nsc-ruling-tag.tone-danger { color: #ff5a52; }
      body.nsc-app-active[data-nsc-theme="dark"] .nsc-ruling-tag.tone-warn { color: #ff9f0a; }
      body.nsc-app-active[data-nsc-theme="dark"] .nsc-ruling-tag.tone-indigo { color: #818cf8; }
      body.nsc-app-active[data-nsc-theme="dark"] .nsc-ruling-tag.tone-success { color: #30d158; }
      .nsc-ruling-ops { display: inline-flex; align-items: center; gap: 4px; flex: 0 0 auto; white-space: nowrap; padding-top: 1px; }
      .nsc-ruling-link-btn {
        border: none; background: transparent; color: var(--nsc-muted);
        font-size: 11px; font-weight: 600; padding: 2px 5px; border-radius: 4px; cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center;
      }
      .nsc-ruling-link-btn svg { width: 12.5px; height: 12.5px; }
      .nsc-ruling-link-btn:hover { background: rgba(128, 128, 128, 0.12); color: var(--nsc-text); }
      .nsc-ruling-status { font-size: 11.5px; color: var(--nsc-muted); }
      .nsc-ruling-empty-ok {
        display: inline-block; padding: 1px 6px; border-radius: 4px;
        font-size: 11.5px; font-weight: 600;
        color: #15803d; background: rgba(21, 128, 61, 0.10);
      }
      body.nsc-app-active[data-nsc-theme="dark"] .nsc-ruling-empty-ok {
        color: #30d158; background: rgba(48, 209, 88, 0.14);
      }
      .nsc-ruling-warn-text {
        font-size: 11.5px; font-weight: 600; color: #c25900;
      }
      body.nsc-app-active[data-nsc-theme="dark"] .nsc-ruling-warn-text { color: #ff9f0a; }
      .nsc-ruling-hover-tip {
        position: absolute; left: 0; right: 0; top: calc(100% + 5px); z-index: 30;
        background: var(--nsc-bg-card); color: var(--nsc-text);
        border: 1px solid var(--nsc-border); border-radius: 8px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22);
        padding: 8px 10px; font-size: 11.5px; line-height: 1.5;
        display: none;
      }
      .nsc-ruling-hover-tip.is-open { display: block; }
      .nsc-ruling-hover-item {
        padding: 5px 0; border-bottom: 1px dashed var(--nsc-border);
      }
      .nsc-ruling-hover-item:last-child { border-bottom: none; padding-bottom: 0; }
      .nsc-ruling-hover-item:first-child { padding-top: 0; }
      .nsc-ruling-drawer {
        margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--nsc-border);
        display: none;
      }
      .nsc-ruling-drawer.is-open { display: block; }
      .nsc-ruling-filter-row {
        display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 7px;
      }
      .nsc-ruling-seg {
        display: inline-flex; gap: 2px; padding: 2px; border-radius: 6px;
        background: var(--nsc-bg-card); border: 1px solid var(--nsc-border);
      }
      .nsc-ruling-seg button {
        border: none; background: transparent; color: var(--nsc-muted);
        font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; cursor: pointer;
      }
      .nsc-ruling-seg button.is-active {
        background: var(--nsc-accent); color: #fff;
      }
      .nsc-ruling-list {
        max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;
      }
      .nsc-ruling-item {
        padding: 7px 9px; border-radius: 6px;
        background: var(--nsc-bg-card); border: 1px solid var(--nsc-border);
        font-size: 11.5px; line-height: 1.5;
      }
      .nsc-ruling-item-top {
        display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 3px;
      }
      .nsc-ruling-kind { font-weight: 700; }
      .nsc-ruling-kind.punish { color: #d93025; }
      .nsc-ruling-kind.reward { color: #15803d; }
      .nsc-ruling-kind.other { color: var(--nsc-muted); }
      body.nsc-app-active[data-nsc-theme="dark"] .nsc-ruling-kind.punish { color: #ff5a52; }
      body.nsc-app-active[data-nsc-theme="dark"] .nsc-ruling-kind.reward { color: #30d158; }
      .nsc-ruling-time { font-size: 10.5px; color: var(--nsc-muted); }
      .nsc-ruling-post-row {
        margin-top: 4px; display: flex; align-items: center; justify-content: space-between; gap: 8px;
      }
      .nsc-ruling-post-btn {
        border: none; background: transparent; padding: 1px 4px; border-radius: 4px;
        color: var(--nsc-accent); font-size: 11px; font-weight: 600; cursor: pointer;
      }
      .nsc-ruling-post-btn:hover { background: var(--nsc-accent-soft); }
    `;
    document.head.appendChild(style);
    if (typeof syncRegisteredThemesCss === "function") syncRegisteredThemesCss();
  }

  function syncRegisteredThemesCss() {
    if (!document.head) return;
    let st = document.getElementById("nsc-registered-themes-style");
    if (!st) {
      st = document.createElement("style");
      st.id = "nsc-registered-themes-style";
      document.head.appendChild(st);
    }
    const rules = [];
    for (const theme of state.registry.themes || []) {
      const safeId = String(theme.id || "").replace(/[^a-z0-9_-]/gi, "");
      if (!safeId) continue;
      const entries = Object.entries(theme.tokens || {});
      if (entries.length > 0) {
        const decls = entries.map(([k, v]) => `${k}: ${v};`).join(" ");
        rules.push(`body.nsc-app-active[data-nsc-theme="${safeId}"] { ${decls} }`);
      }
      if (theme.extraCss) {
        rules.push(String(theme.extraCss));
      }
    }
    st.textContent = rules.join("\n");
  }
