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
        --nsc-bg-nav: rgba(42, 45, 53, 0.88);
        --nsc-bg-list: rgba(33, 36, 42, 0.94);
        --nsc-bg-chat: rgba(27, 29, 35, 0.96);
        --nsc-bg-right: rgba(36, 39, 46, 0.94);
        --nsc-bg-card: #2f333d;
        --nsc-bubble-other: #2f333d;
        --nsc-bubble-self: #0a84ff;
        --nsc-bubble-self-text: #ffffff;
        --nsc-bubble-op: #362f23;
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
        background: rgba(30, 32, 38, 0.86) !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
      }

      body.nsc-app-active.nsc-theme-dusk {
        --nsc-bg-nav: rgba(231, 219, 199, 0.90);
        --nsc-bg-list: rgba(244, 236, 222, 0.95);
        --nsc-bg-chat: rgba(238, 229, 212, 0.95);
        --nsc-bg-right: rgba(244, 236, 222, 0.95);
        --nsc-bg-card: #fbf6ec;
        --nsc-bubble-other: #fbf6ec;
        --nsc-bubble-self: #3568c4;
        --nsc-bubble-self-text: #ffffff;
        --nsc-bubble-op: #fdf0d5;
        --nsc-thread-bg: rgba(227, 216, 197, 0.88);
        --nsc-quote-bg: rgba(120, 88, 52, 0.08);
        --nsc-border: rgba(115, 86, 52, 0.14);
        --nsc-text: #382f25;
        --nsc-muted: #786958;
        --nsc-accent: #c86d1f;
        --nsc-accent-soft: rgba(200, 109, 31, 0.14);
        --nsc-green: #2f9e44;
        --nsc-hover: rgba(120, 88, 52, 0.075);
        --nsc-active-item: rgba(200, 109, 31, 0.15);
        --nsc-shadow: 0 22px 60px rgba(72, 48, 24, 0.16), 0 0 0 1px rgba(115, 86, 52, 0.12);
        background:
          radial-gradient(ellipse at 20% 0%, rgba(245, 158, 11, 0.11), transparent 55%),
          radial-gradient(ellipse at 85% 92%, rgba(217, 119, 6, 0.08), transparent 55%),
          #ddd0ba !important;
        color: #382f25 !important;
      }
      body.nsc-app-active.nsc-theme-dusk header {
        background: rgba(236, 225, 206, 0.90) !important;
        border-bottom: 1px solid rgba(115, 86, 52, 0.14) !important;
        color: #382f25 !important;
      }
      body.nsc-app-active.nsc-theme-dusk .nsc-msg.is-self .nsc-bubble,
      body.nsc-app-active.nsc-theme-dusk .nsc-thread-item.is-self-thread .nsc-thread-content {
        background: linear-gradient(180deg, #4378d6 0%, #2f62bf 100%);
        box-shadow: 0 2px 8px rgba(47, 98, 191, 0.22);
      }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-browse { color: #b45309; }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-browse.is-active { background: #c86d1f; color: #fff; }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-browse .nsc-nav-badge { background: rgba(200, 109, 31, 0.14); color: #b45309; }

      #nsc-mode-switch-btn {
        font-family: var(--mac-font);
        display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 11px; margin-left: 8px;
        border-radius: 999px; border: 1px solid var(--nsc-border);
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
        width: 148px; flex: 0 0 148px;
        background: var(--nsc-bg-nav); backdrop-filter: blur(28px) saturate(180%);
        border-right: 1px solid var(--nsc-border);
        display: flex; flex-direction: column;
        padding: 8px 7px 6px; gap: 2px; overflow-y: auto;
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

      .nsc-nav-main { flex: 1 1 auto; display: flex; flex-direction: column; gap: 2px; min-height: 0; }
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
      body.dark-layout .nsc-nav-item.group-browse { color: #4da3ff; }
      .nsc-nav-item.group-browse:hover { background: rgba(0, 122, 255, 0.09); color: #0066d6; }
      .nsc-nav-item.group-browse .nsc-nav-badge { background: rgba(0, 122, 255, 0.13); color: #007aff; }
      body.dark-layout .nsc-nav-item.group-browse .nsc-nav-badge { background: rgba(10, 132, 255, 0.22); color: #64b5ff; }
      .nsc-nav-item.group-browse.is-active { background: #007aff; color: #fff; }

      .nsc-nav-item.group-msg { color: #f45b9a; font-weight: 600; }
      body.dark-layout .nsc-nav-item.group-msg { color: #ff85b8; }
      .nsc-nav-item.group-msg:hover { background: rgba(244, 114, 182, 0.13); color: #ec4899; }
      body.dark-layout .nsc-nav-item.group-msg:hover { color: #ffa6cb; }
      .nsc-nav-item.group-msg .nsc-nav-badge { background: rgba(244, 114, 182, 0.18); color: #ec4899; }
      body.dark-layout .nsc-nav-item.group-msg .nsc-nav-badge { background: rgba(255, 133, 184, 0.24); color: #ff9ec7; }
      .nsc-nav-item.group-msg.is-active {
        background: linear-gradient(135deg, #ff7eb3, #f45b9a); color: #fff;
        box-shadow: 0 2px 8px rgba(244, 91, 154, 0.30);
      }

      .nsc-nav-item.group-board .nsc-nav-badge { background: rgba(88, 86, 214, 0.11); color: #5856d6; }
      body.dark-layout .nsc-nav-item.group-board .nsc-nav-badge { background: rgba(120, 118, 255, 0.22); color: #a5a3ff; }

      .nsc-nav-item.group-admin { color: #8b7355; }
      body.dark-layout .nsc-nav-item.group-admin { color: #c4a47c; }
      .nsc-nav-item.group-admin:hover { background: rgba(245, 158, 11, 0.10); color: #d97706; }
      body.dark-layout .nsc-nav-item.group-admin:hover { color: #fbbf24; }

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
      .nsc-chat-header {
        padding: 9px 16px; border-bottom: 1px solid var(--nsc-border); background: var(--nsc-bg-right);
        display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
      }
      .nsc-chat-title-wrap { min-width: 0; flex: 1 1 200px; }
      .nsc-chat-title { font-size: 14.5px; font-weight: 700; color: var(--nsc-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .nsc-chat-subtitle { font-size: 11px; color: var(--nsc-muted); margin-top: 2px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .nsc-chat-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; }
      .nsc-pill-btn {
        padding: 4px 10px; border-radius: 999px; border: 1px solid var(--nsc-border);
        background: var(--nsc-bg-card); color: var(--nsc-text); font-size: 11px; font-weight: 500; cursor: pointer;
      }
      .nsc-pill-btn:hover { border-color: var(--nsc-accent); color: var(--nsc-accent); }
      .nsc-pill-btn.is-active { background: var(--nsc-accent); border-color: var(--nsc-accent); color: #fff; }

      .nsc-floor-jump-box {
        display: inline-flex; align-items: center; border: 1px solid var(--nsc-border);
        border-radius: 999px; background: var(--nsc-bg-card); padding: 1px 4px 1px 9px; gap: 3px;
      }
      .nsc-floor-jump-input { width: 46px; border: none; background: transparent; color: var(--nsc-text); font-size: 11px; outline: none; }
      .nsc-floor-jump-btn {
        border: none; background: var(--nsc-accent-soft); color: var(--nsc-accent);
        font-size: 10.5px; font-weight: 600; border-radius: 999px; padding: 2px 8px; cursor: pointer;
      }

      .nsc-chat-messages {
        flex: 1; overflow-y: auto; padding: 14px 18px 18px;
        display: flex; flex-direction: column; gap: 12px; position: relative;
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
        padding: 8px 13px; font-size: 13.5px; line-height: 1.55; word-break: break-word;
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
      .nsc-msg.is-self .nsc-bubble a { color: #e0f2fe; }

      .nsc-bubble img,
      .nsc-bubble img.nsc-zoomable-img,
      .nsc-thread-content img,
      .nsc-thread-content img.nsc-zoomable-img {
        max-width: min(100%, 480px) !important; max-height: 320px !important;
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

      /* 帖子多图朋友圈宫格画廊（2/4图两列，3/5+图三列九宫格） */
      .nsc-img-grid {
        display: grid; grid-template-columns: repeat(3, 1fr);
        gap: 6px; margin: 6px 0; width: min(100%, 396px);
      }
      .nsc-img-grid.cols-2 {
        grid-template-columns: repeat(2, 1fr);
        width: min(100%, 300px);
      }
      .nsc-img-grid img.nsc-zoomable-img {
        width: 100% !important; height: auto !important; aspect-ratio: 1 / 1;
        max-width: none !important; max-height: none !important;
        object-fit: cover !important; margin: 0 !important; border-radius: 8px;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .nsc-img-grid img.nsc-zoomable-img:hover {
        transform: scale(1.02); box-shadow: 0 5px 16px rgba(0,0,0,0.16);
      }

      /* 测评帖魔术标签页 (.nsk-magic-tabs) 适配与交互样式 */
      .nsc-bubble .nsk-magic-tabs {
        margin: 8px 0; border: 1px solid var(--nsc-border); border-radius: 10px;
        background: var(--nsc-bg-card); overflow: hidden;
      }
      .nsc-magic-tab-bar {
        display: flex; align-items: center; flex-wrap: wrap; gap: 3px;
        padding: 5px 8px; background: var(--nsc-hover);
        border-bottom: 1px solid var(--nsc-border);
      }
      .nsc-bubble .nsk-magic-tab-title {
        display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 7px;
        font-size: 12px; font-weight: 500; color: var(--nsc-muted); cursor: pointer;
        user-select: none; transition: all 0.13s ease;
      }
      .nsc-bubble .nsk-magic-tab-title:hover { color: var(--nsc-text); background: var(--nsc-bg-card); }
      .nsc-bubble .nsk-magic-tab-title.is-active,
      .nsc-bubble .nsk-magic-tab-title.active {
        color: var(--nsc-accent); background: var(--nsc-bg-card); font-weight: 600;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }
      .nsc-bubble .nsk-magic-tab-body { padding: 10px 12px; }
      .nsc-bubble .nsk-magic-tab-body img.nsc-zoomable-img { margin: 4px 0 !important; }

      .nsc-bubble pre { max-width: 100%; overflow-x: auto; padding: 10px; border-radius: 8px; background: rgba(0,0,0,0.05); }
      body.dark-layout .nsc-bubble pre { background: rgba(0,0,0,0.35); }
      .nsc-bubble blockquote {
        margin: 0 0 8px; padding: 6px 10px; border-left: 3px solid var(--nsc-accent);
        background: var(--nsc-quote-bg); border-radius: 6px; font-size: 12px; color: var(--nsc-muted);
        max-height: 68px; overflow: hidden; cursor: pointer;
      }
      .nsc-bubble blockquote.is-expanded { max-height: none; }
      a.nsc-floor-ref {
        display: inline-block; padding: 0 5px; margin: 0 1px; border-radius: 5px;
        background: var(--nsc-accent-soft); color: var(--nsc-accent) !important;
        font-weight: 600; font-size: 12px; text-decoration: none !important; cursor: pointer;
      }
      .nsc-msg.is-self a.nsc-floor-ref { background: rgba(255,255,255,0.22); color: #fff !important; }
      a.nsc-floor-ref:hover { text-decoration: underline !important; }

      /* TG 风格：赞/鸡腿/踩/评论有数据时直接显示紧凑 Reaction 药丸 */
      .nsc-reactions { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
      .nsc-reactions:empty { display: none; }
      .nsc-react-pill {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 2px 8px; border-radius: 999px;
        border: 1px solid var(--nsc-border); background: var(--nsc-bg-card);
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
      .nsc-thread-item.is-self-thread .nsc-thread-content a { color: #e0f2fe; }
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
      }
      .nsc-composer-box,
      .nsc-composer-dock .md-editor {
        border: 1px solid var(--nsc-border) !important;
        border-radius: 10px !important;
        background: var(--nsc-bg-card) !important;
        overflow: visible !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        transition: none !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .nsc-composer-dock #editor-body { background: transparent !important; position: static !important; margin: 0 !important; padding: 0 !important; }
      .nsc-composer-dock #cm-editor-wrapper,
      .nsc-composer-dock .content-area,
      .nsc-composer-dock .split-view-container {
        min-height: 0 !important; height: auto !important; margin: 0 !important; padding: 0 !important;
      }

      .nsc-composer-header,
      .nsc-composer-dock .tab-select.window_header {
        display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 3px !important;
        padding: 2px 8px !important; height: auto !important; min-height: 25px !important;
        background: var(--nsc-hover) !important; border-bottom: 1px solid var(--nsc-border) !important;
        border-radius: 10px 10px 0 0 !important;
      }
      .nsc-composer-dock .tab-select.window_header .tab-option { padding: 2px 7px !important; font-size: 11.5px !important; cursor: pointer; }
      .nsc-composer-dock .tab-select.window_header > div[style*="margin-left: auto"] { display: none !important; }

      .nsc-composer-dock .tab-select.window_header .expression {
        display: inline-flex !important; align-items: center !important; gap: 2px !important;
        background: transparent !important; border: none !important; padding: 0 !important; margin: 0 auto 0 8px !important;
      }
      .nsc-composer-dock .tab-select.window_header .expression .exp-item {
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
      }
      .nsc-composer-dock .tab-select.window_header .expression .exp-item:hover,
      .nsc-composer-dock .tab-select.window_header .expression .exp-item.active {
        color: var(--nsc-accent) !important;
        background: transparent !important;
        border-bottom-color: var(--nsc-accent) !important;
        font-weight: 600 !important;
      }

      .nsc-nodeimage-btn {
        display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 6px;
        border: none; background: transparent;
        color: var(--nsc-accent) !important; font-size: 11.5px; font-weight: 600; text-decoration: none !important;
        cursor: pointer; margin-left: auto;
      }
      .nsc-nodeimage-btn:hover { background: var(--nsc-accent-soft); }

      .nsc-mde-toolbar,
      .nsc-composer-dock .mde-toolbar {
        display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 2px !important;
        padding: 2px 6px !important; height: auto !important; min-height: 24px !important; background: transparent !important;
        border-bottom: 1px solid var(--nsc-border) !important;
      }
      .nsc-mde-btn,
      .nsc-composer-dock .mde-toolbar .toolbar-item {
        display: inline-flex !important; align-items: center !important; justify-content: center !important;
        width: 23px !important; height: 21px !important; padding: 0 !important; border-radius: 5px !important;
        border: none; background: transparent;
        color: var(--nsc-muted) !important; transition: none !important; cursor: pointer; font-size: 11.5px; font-weight: 700;
      }
      .nsc-mde-btn:hover,
      .nsc-composer-dock .mde-toolbar .toolbar-item:hover {
        background: var(--nsc-accent-soft) !important; color: var(--nsc-accent) !important;
      }
      .nsc-composer-dock .mde-toolbar .toolbar-item svg { width: 13px !important; height: 13px !important; }
      .nsc-composer-dock .CodeMirror {
        height: 68px !important; min-height: 64px !important; max-height: 130px !important;
        font-size: 13px !important; line-height: 1.45 !important;
        background: transparent !important; color: var(--nsc-text) !important;
      }
      .nsc-composer-dock .CodeMirror-scroll { min-height: 64px !important; max-height: 130px !important; padding-bottom: 0 !important; }
      .nsc-composer-dock .CodeMirror-lines { padding: 4px 0 !important; }
      .nsc-fallback-textarea {
        width: 100%; box-sizing: border-box; height: 70px; border: none; outline: none; resize: none;
        padding: 7px 10px; font-size: 13px; line-height: 1.45; background: transparent; color: var(--nsc-text);
        font-family: var(--mac-font);
      }
      /* 表情面板改为贴底悬浮层（最多约 2 行高度），AC娘仅显示前 32 个热门经典贴图 */
      .nsc-composer-dock .exp-container.cur-sticker-group-null,
      .nsc-composer-dock .exp-container:empty {
        display: none !important;
      }
      .nsc-composer-dock .exp-container {
        position: absolute !important; bottom: calc(100% + 4px) !important; left: 6px !important; right: 6px !important;
        z-index: 260 !important; max-height: 92px !important; overflow-y: auto !important;
        padding: 6px 8px !important; flex-wrap: wrap !important; align-content: flex-start !important;
        background: var(--nsc-bg-card) !important; border: 1px solid var(--nsc-border) !important;
        border-radius: 12px !important; box-shadow: 0 12px 32px rgba(0,0,0,0.18) !important;
        backdrop-filter: blur(20px) !important; animation: none !important; transition: none !important;
      }
      .nsc-composer-dock .exp-container.cur-sticker-group-ac > *:nth-child(n+33) {
        display: none !important;
      }
      .nsc-composer-dock .exp-container img,
      .nsc-composer-dock .exp-container video {
        width: 34px !important; height: 34px !important; max-width: 34px !important; max-height: 34px !important;
        object-fit: contain !important; display: block !important;
      }
      .nsc-composer-dock .exp-container > *,
      .nsc-composer-dock .exp-container .exp-list > *,
      .nsc-composer-dock .exp-container span,
      .nsc-composer-dock .exp-container button,
      .nsc-composer-dock .exp-container a {
        padding: 2px !important; margin: 2px !important; border-radius: 7px !important;
      }
      .nsc-mde-btn svg { width: 14px; height: 14px; }
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
        display: grid; grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
        gap: 3px; padding: 6px 8px; max-height: 88px; overflow-y: auto;
      }
      .nsc-fb-exp-item {
        width: 40px; height: 40px; padding: 3px; border: none; border-radius: 7px;
        background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
      }
      .nsc-fb-exp-item:hover { background: var(--nsc-accent-soft); }
      .nsc-fb-exp-item img { width: 32px; height: 32px; object-fit: contain; display: block; }
      .nsc-composer-footer,
      .nsc-composer-dock .topic-select {
        display: flex !important; align-items: center !important; justify-content: space-between !important;
        padding: 3px 8px !important; min-height: 26px !important; border-top: 1px solid var(--nsc-border) !important;
        background: var(--nsc-hover) !important; border-radius: 0 0 10px 10px !important;
      }
      .nsc-send-btn,
      .nsc-composer-dock .topic-select .submit.btn {
        height: 23px !important; padding: 0 13px !important; font-size: 11.5px !important; font-weight: 600 !important;
        border-radius: 999px !important; background: var(--nsc-accent) !important; color: #fff !important;
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
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
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
        position: fixed; inset: 0; z-index: 10000;
        background: rgba(12, 14, 18, 0.88); backdrop-filter: blur(14px);
        display: none; flex-direction: column; align-items: center; justify-content: center; padding: 16px;
        user-select: none;
      }
      #nsc-lightbox.is-open { display: flex; }
      .nsc-lightbox-stage {
        position: relative; display: flex; align-items: center; justify-content: center;
        width: 96vw; height: 82vh; overflow: hidden;
      }
      .nsc-lb-frame {
        position: relative; display: inline-flex; align-items: center; justify-content: center;
        max-width: calc(94vw - 128px); max-height: 82vh;
      }
      #nsc-lightbox img {
        max-width: calc(94vw - 128px); max-height: 82vh; object-fit: contain;
        border-radius: 10px; box-shadow: 0 22px 64px rgba(0, 0, 0, 0.55); cursor: zoom-in;
        transform-origin: center center; will-change: transform; display: block;
      }
      #nsc-lightbox img.is-pannable { cursor: grab; }
      #nsc-lightbox img.is-pannable:active { cursor: grabbing; }
      .nsc-lb-nav {
        position: absolute; top: 50%; transform: translateY(-50%); z-index: 10002;
        width: 44px; height: 44px; border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.28); background: rgba(20,22,28,0.68);
        color: #fff; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background 0.14s ease, transform 0.14s ease;
      }
      .nsc-lb-nav:hover:not(:disabled) { background: rgba(0,122,255,0.82); transform: translateY(-50%) scale(1.06); }
      .nsc-lb-nav.prev { right: calc(100% + 14px); left: auto; }
      .nsc-lb-nav.next { left: calc(100% + 14px); right: auto; }
      .nsc-lb-nav:disabled { opacity: 0.22; cursor: default; }
      .nsc-lb-top-badge {
        position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 10002;
        padding: 4px 14px; border-radius: 999px;
        background: rgba(20, 22, 28, 0.72); border: 1px solid rgba(255,255,255,0.18);
        color: #fff; font-size: 12.5px; font-weight: 600; letter-spacing: 0.3px;
      }
      .nsc-lb-top-badge:empty { display: none; }
      .nsc-lightbox-bar { margin-top: 14px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .nsc-lightbox-btn {
        padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.22);
        background: rgba(255,255,255,0.12); color: #fff !important; font-size: 12px;
        text-decoration: none !important; cursor: pointer;
      }
      .nsc-lightbox-btn:hover { background: rgba(255,255,255,0.22); }
      .nsc-lightbox-count { font-size: 12px; color: rgba(255,255,255,0.78); font-weight: 600; padding: 0 4px; }

      #nsc-profile-backdrop {
        position: fixed; inset: 0; z-index: 9000;
        background: rgba(15, 23, 42, 0.35); backdrop-filter: blur(4px);
        display: none; align-items: center; justify-content: center;
      }
      #nsc-profile-backdrop.is-open { display: flex; }
      .nsc-profile-modal {
        width: min(420px, 92vw);
        background: var(--nsc-bg-card); color: var(--nsc-text);
        border: 1px solid var(--nsc-border); border-radius: 16px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25); overflow: hidden;
      }
      .nsc-profile-banner { height: 58px; background: linear-gradient(135deg, #007aff, #5ac8fa); position: relative; }
      .nsc-profile-close {
        position: absolute; right: 10px; top: 10px; width: 26px; height: 26px; border-radius: 50%;
        border: none; background: rgba(0,0,0,0.28); color: #fff; cursor: pointer; font-size: 13px;
      }
      .nsc-profile-body { padding: 0 18px 18px; margin-top: -26px; position: relative; }
      .nsc-profile-head { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 10px; }
      .nsc-profile-head img {
        width: 58px; height: 58px; border-radius: 50%; object-fit: cover;
        border: 3px solid var(--nsc-bg-card); background: var(--nsc-bg-card);
      }
      .nsc-profile-stats {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
        margin: 10px 0; padding: 9px 6px; border-radius: 10px; background: var(--nsc-hover); text-align: center;
      }
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
        border: none; border-radius: 999px;
        background: var(--nsc-accent); color: #fff;
        font-size: 11.5px; font-weight: 600; padding: 3px 10px;
        cursor: pointer; display: inline-flex; align-items: center; gap: 3px;
        box-shadow: 0 2px 6px rgba(0, 122, 255, 0.25); transition: filter 0.14s ease;
      }
      .nsc-newpost-btn:hover { filter: brightness(1.08); }

      #nsc-newpost-backdrop {
        position: fixed; inset: 0; z-index: 9500;
        background: rgba(15, 23, 42, 0.40); backdrop-filter: blur(5px);
        display: none; align-items: center; justify-content: center; padding: 16px;
      }
      #nsc-newpost-backdrop.is-open { display: flex; }
      .nsc-newpost-modal {
        width: min(640px, 94vw); max-height: 88vh;
        background: var(--nsc-bg-card); color: var(--nsc-text);
        border: 1px solid var(--nsc-border); border-radius: 16px;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
        display: flex; flex-direction: column; overflow: hidden;
      }
      .nsc-newpost-head {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        padding: 12px 16px; border-bottom: 1px solid var(--nsc-border);
        background: var(--nsc-hover);
      }
      .nsc-newpost-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
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
        border: 1px solid var(--nsc-border); border-radius: 10px; overflow: hidden;
        background: var(--nsc-bg-card);
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
      }

      .nsc-ni-dot { width: 6px; height: 6px; border-radius: 50%; background: #ff3b30; display: inline-block; }
      .nsc-ni-dot.is-ok { background: #34c759; }
      .nsc-nodeimage-btn {
        display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 6px;
        border: 1px solid var(--nsc-border); background: var(--nsc-bg-card);
        color: var(--nsc-text) !important; font-size: 11px; font-weight: 600; text-decoration: none !important;
        cursor: pointer; margin-left: 0;
      }
      .nsc-nodeimage-btn:hover { border-color: var(--nsc-accent); color: var(--nsc-accent) !important; background: var(--nsc-accent-soft); }

      #nsc-ni-backdrop {
        position: fixed; inset: 0; z-index: 9600;
        background: rgba(15, 23, 42, 0.40); backdrop-filter: blur(5px);
        display: none; align-items: center; justify-content: center; padding: 16px;
      }
      #nsc-ni-backdrop.is-open { display: flex; }
      .nsc-ni-modal {
        width: min(820px, 94vw); max-height: 88vh;
        background: var(--nsc-bg-card); color: var(--nsc-text);
        border: 1px solid var(--nsc-border); border-radius: 16px;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
        display: flex; flex-direction: column; overflow: hidden;
      }
      .nsc-ni-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 12px; max-height: 52vh; overflow-y: auto; padding: 4px;
      }
      .nsc-ni-card {
        border: 1px solid var(--nsc-border); border-radius: 10px; overflow: hidden;
        background: var(--nsc-hover); display: flex; flex-direction: column;
        transition: border-color 0.14s ease, box-shadow 0.14s ease;
      }
      .nsc-ni-card:hover { border-color: var(--nsc-accent); box-shadow: 0 4px 14px rgba(0,0,0,0.08); }
      .nsc-ni-card img {
        width: 100%; height: 138px; box-sizing: border-box; padding: 4px;
        object-fit: contain; cursor: pointer; display: block;
        background: rgba(128, 128, 128, 0.06); image-rendering: auto;
      }
      .nsc-ni-card-ops { display: flex; justify-content: space-between; align-items: center; padding: 5px 8px; gap: 6px; font-size: 11px; border-top: 1px solid var(--nsc-border); }

      @keyframes nscFlash {
        0% { box-shadow: 0 0 0 3px var(--nsc-accent); }
        100% { box-shadow: 0 0 0 0 transparent; }
      }
      .nsc-flash .nsc-bubble { animation: nscFlash 1.5s ease; }
    `;
    document.head.appendChild(style);
  }

