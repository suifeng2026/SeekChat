  const LS = {
    ENABLED: "nsc_v7_enabled",
    THEME: "nsc_v7_theme",
    ACTIVE_CHANNEL: "nsc_v7_channel",
    SORT: "nsc_v7_sort",
    HOT_TAB: "nsc_v7_hot_tab",
    HOT_CACHE: "nsc_v7_hot_cache",
    READ_MAP: "nsc_v7_read_map",
    FRIENDS: "nsc_v7_friends",
    REMOVED_FRIENDS: "nsc_v7_removed_friends",
    BLACKLIST: "nsc_v7_blacklist",
    BLACKLIST_TS: "nsc_v7_blacklist_ts",
    COLLECTIONS: "nsc_v7_collections",
    RIGHT_TAB: "nsc_v7_right_tab",
    USER_CACHE: "nsc_v7_user_cache",
    LAST_SPEAK_CACHE: "nsc_v7_last_speak_cache",
    POST_TITLE_CACHE: "nsc_v7_post_title_cache",
    READ_NOTIFS: "nsc_v7_read_notifs",
    AUTO_CHECKIN: "nsc_v7_auto_checkin",
    AUTO_CHECKIN_MODE: "nsc_v7_auto_checkin_mode",
    AUTO_CHECKIN_DATE: "nsc_v7_auto_checkin_date",
    CHECKIN_TODAY: "nsc_v7_checkin_today",
    UPDATE_CHECK: "nsc_v7_update_check",
    PANE_SKINS: "nsc_v7_pane_skins",
    NAV_CONFIG: "nsc_v7_nav_config",
    RIGHT_CONFIG: "nsc_v7_right_config",
    CHAT_PREFS: "nsc_v7_chat_prefs",
    CUSTOM_STICKERS: "nsc_v7_custom_stickers",
    CUSTOM_STYLE_NOTES: "nsc_v7_custom_style_notes",
    JUMP_MODE: "nsc_v7_jump_mode",
    RULING_AUTO: "nsc_v7_ruling_auto",
    RULING_CACHE: "nsc_v7_ruling_cache",
    SEEK_VIEWER_CACHE: "nsc_v7_seek_viewer_cache",
    PANE_COLLAPSED: "nsc_v7_pane_collapsed",
    COMPOSER_PREFS: "nsc_v7_composer_prefs",
  };

  function isBrowsePath(pathname) {
    const p = String(pathname || location.pathname);
    return p === "/" || /^\/page-\d+/.test(p) || /^\/categories\//.test(p) || /^\/post-\d+/.test(p);
  }

  // 防闪屏：document-start 阶段预先隐藏原生 #nsk-frame
  if (localStorage.getItem(LS.ENABLED) !== "0" && isBrowsePath(location.pathname) && window.self === window.top) {
    const preStyle = document.createElement("style");
    preStyle.id = "nsc-preflash-guard";
    preStyle.textContent = `
      html.nsc-prehide body > section#nsk-frame,
      html.nsc-prehide footer,
      html.nsc-prehide #fast-nav-button-group {
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
    document.documentElement.classList.add("nsc-prehide");
    (document.head || document.documentElement).appendChild(preStyle);
  }

  // 在隐藏 iframe 中用于提取动态渲染数据时不运行外层外壳；若为个人中心同源换肤 iframe，则在 document-start 预设防闪屏隐藏
  if (window.self !== window.top) {
    try {
      if (window.frameElement && window.frameElement.classList && window.frameElement.classList.contains("nsc-hub-iframe")) {
        const iframePre = document.createElement("style");
        iframePre.id = "nsc-hub-iframe-prehide";
        iframePre.textContent = `
          header, footer, #nsk-right-panel-container, #fast-nav-button-group, #nsc-app-shell { display: none !important; }
          html, body { background: transparent !important; }
          body > section#nsk-frame { opacity: 0 !important; }
        `;
        (document.head || document.documentElement).appendChild(iframePre);
      }
    } catch (_) {}
    return;
  }

  const ICONS = {
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/></svg>`,
    history: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
    daily: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg>`,
    tech: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>`,
    review: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>`,
    trade: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>`,
    carpool: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    promotion: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11 14v5a2 2 0 0 1-4 0v-4"/></svg>`,
    life: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    dev: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 10l3 2-3 2"/><line x1="12" y1="14" x2="17" y2="14"/></svg>`,
    photo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`,
    expose: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    inside: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    sandbox: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"/><path d="M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/></svg>`,
    eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    award: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    atMe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>`,
    replyMe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    pm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    quote: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6c0 2.5-1.5 4.2-4 5"/><path d="M19 11h-4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6c0 2.5-1.5 4.2-4 5"/></svg>`,
    like: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v10"/><path d="M14 9V5.5a2.5 2.5 0 0 0-2.5-2.5l-4 7v10h9.4a2 2 0 0 0 2-1.6l1.3-6.5A2 2 0 0 0 18.2 9H14z"/></svg>`,
    dislike: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V4"/><path d="M10 15v3.5a2.5 2.5 0 0 0 2.5 2.5l4-7V4H7.1a2 2 0 0 0-2 1.6l-1.3 6.5A2 2 0 0 0 5.8 15H10z"/></svg>`,
    leg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 14.5c2.7-2.7 3.9-6.6 1.6-8.9-2.3-2.3-6.2-1.1-8.9 1.6-1.9 1.9-2.4 4.5-1.5 6.3l-2.9 2.9a1.8 1.8 0 0 0-.4 2.1 1.8 1.8 0 0 0 2.1.4l2.9-2.9c1.8.9 4.4.4 7.1-1.5z"/><circle cx="3.8" cy="18.2" r="1.1"/><circle cx="5.8" cy="20.2" r="1.1"/></svg>`,
    pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`,
    reply: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
    sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    dusk: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10a4 4 0 0 0-4 4h8a4 4 0 0 0-4-4Z"/><path d="M2 18h20"/><path d="M5 21h14"/><path d="M12 3v3"/><path d="m5.6 7.6 2.1 2.1"/><path d="m18.4 7.6-2.1 2.1"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
    ruling: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    partner: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    links: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
    theme: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>`,
    smile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    opOnly: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    update: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    stardust: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(-24 12 12)"/><circle cx="18.6" cy="6.2" r="1" fill="currentColor" stroke="none"/><circle cx="5.8" cy="17.8" r="0.9" fill="currentColor" stroke="none"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
    sliders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
    palette: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16c3.3 0 6-2.7 6-6 0-4.9-4.5-8.6-10-8.6z"/></svg>`,
    up: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`,
    down: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
    undo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>`,
    redo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg>`,
    fullscreen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
    eraser: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21h10"/><path d="M5.5 13.5l8-8a2.1 2.1 0 0 1 3 0l3 3a2.1 2.1 0 0 1 0 3l-6.5 6.5a2 2 0 0 1-1.4.6H7.2a2 2 0 0 1-1.4-.6l-1.3-1.3a2.1 2.1 0 0 1 0-3z"/><path d="M10.5 8.5l5 5"/></svg>`,
    bold: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`,
    italic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
    strike: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>`,
    heading: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/></svg>`,
    listUl: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="5" cy="6" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="18" r="1" fill="currentColor"/></svg>`,
    listOl: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>`,
    codeInline: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="13.5" y1="5" x2="10.5" y2="19"/></svg>`,
    codeBlock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><polyline points="9 9 6.5 12 9 15"/><polyline points="15 9 17.5 12 15 15"/></svg>`,
    terminal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><polyline points="7 9 10.5 12 7 15"/><line x1="12.5" y1="15" x2="17" y2="15"/></svg>`,
    table: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
    hr: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="8" y2="12"/><circle cx="12" cy="12" r="1" fill="currentColor"/><line x1="16" y1="12" x2="20" y2="12"/></svg>`,
    tip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>`,
    note: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="12"/><circle cx="12" cy="8" r="0.8" fill="currentColor"/></svg>`,
    details: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><polyline points="9 13 12 16 15 13"/></svg>`,
    tabs: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="4" x2="9" y2="9"/><line x1="15" y1="4" x2="15" y2="9"/></svg>`,
    imgHost: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    tools: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    insert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><path d="M5 19h14"/></svg>`,
    zoomIn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
  };

  const STICKER_GROUPS = [
    {
      id: "ac",
      label: "AC娘",
      files: Array.from({ length: 54 }, (_, i) => `${String(i + 1).padStart(2, "0")}.png`),
    },
    {
      id: "yct",
      label: "洋葱头",
      files: Array.from({ length: 22 }, (_, i) => `${String(i + 1).padStart(3, "0")}.gif`),
    },
    {
      id: "xhj",
      label: "小黄鸡",
      files: [
        "001.png","002.png","003.png","004.gif","005.png","006.png","007.png","008.gif",
        "009.gif","010.gif","011.png","012.gif","013.gif","014.gif","015.gif","016.gif",
        "017.gif","018.gif","019.gif","020.gif","021.gif","022.png","023.gif","024.png",
        "025.png","026.gif","027.gif","028.gif","029.gif","030.gif","031.png","032.png",
      ],
    },
    {
      id: "emoji",
      label: "Fluent",
      files: Array.from({ length: 49 }, (_, i) => `${String(i).padStart(2, "0")}.png`),
    },
  ];

  const CHANNELS = [
    { id: "home", name: "首页", icon: ICONS.home, path: "/", group: "browse" },
    { id: "history", name: "已读足迹", icon: ICONS.history, path: "__HISTORY__", group: "browse" },
    { id: "award", name: "推荐阅读", icon: ICONS.award, path: "/award", group: "browse" },
    { id: "at-me", name: "@我", icon: ICONS.atMe, path: "__AT_ME__", group: "msg" },
    { id: "reply-me", name: "回复我", icon: ICONS.replyMe, path: "__REPLY_ME__", group: "msg" },
    { id: "pm", name: "私信", icon: ICONS.pm, path: "__PM__", group: "msg" },
    { id: "sys-notice", name: "通知", icon: ICONS.bell, path: "__SYS_NOTICE__", group: "msg" },
    { id: "daily", name: "日常", icon: ICONS.daily, path: "/categories/daily", group: "board" },
    { id: "tech", name: "技术", icon: ICONS.tech, path: "/categories/tech" },
    { id: "info", name: "情报", icon: ICONS.info, path: "/categories/info" },
    { id: "review", name: "测评", icon: ICONS.review, path: "/categories/review" },
    { id: "trade", name: "交易", icon: ICONS.trade, path: "/categories/trade" },
    { id: "carpool", name: "拼车", icon: ICONS.carpool, path: "/categories/carpool" },
    { id: "promotion", name: "推广", icon: ICONS.promotion, path: "/categories/promotion" },
    { id: "life", name: "生活", icon: ICONS.life, path: "/categories/life" },
    { id: "dev", name: "Dev", icon: ICONS.dev, path: "/categories/dev" },
    { id: "photo-share", name: "贴图", icon: ICONS.photo, path: "/categories/photo-share" },
    { id: "expose", name: "曝光", icon: ICONS.expose, path: "/categories/expose" },
    { id: "inside", name: "内版", icon: ICONS.inside, path: "/categories/inside" },
    { id: "sandbox", name: "沙盒", icon: ICONS.sandbox, path: "/categories/sandbox" },
  ];

  const RIGHT_TABS = [
    { id: "hot", name: "热榜" },
    { id: "friends", name: "好友" },
    { id: "fans", name: "粉丝" },
    { id: "blacklist", name: "黑名单" },
  ];

  const PANE_SKIN_SPECS = [
    { id: "nav", label: "导航区", selector: ".nsc-pane-nav", recSize: "360×1080 ~ 450×1440", ratio: "1:3 竖版" },
    { id: "list", label: "帖子区", selector: ".nsc-pane-list", recSize: "600×1200 ~ 720×1440", ratio: "1:2 竖版" },
    { id: "chat", label: "聊天底图", selector: ".nsc-pane-chat", recSize: "1600×1080 ~ 1920×1080", ratio: "16:9 / 3:2 宽幅" },
    { id: "right", label: "个人信息区", selector: ".nsc-pane-right", recSize: "600×1200 ~ 720×1440", ratio: "1:2 竖版" },
  ];


  const state = {
    enabled: localStorage.getItem(LS.ENABLED) !== "0",
    themeMode: localStorage.getItem(LS.THEME) || "auto",
    activeChannel: "home",
    sortMode: localStorage.getItem(LS.SORT) || "reply",
    hotTab: localStorage.getItem(LS.HOT_TAB) || "realtime",
    readMap: loadJson(LS.READ_MAP, {}),
    friends: loadJson(LS.FRIENDS, []),
    removedFriends: new Set(loadJson(LS.REMOVED_FRIENDS, [])),
    blacklist: loadJson(LS.BLACKLIST, []),
    blacklistNameSet: new Set(),
    rightTab: localStorage.getItem(LS.RIGHT_TAB) || "hot",
    userCache: loadJson(LS.USER_CACHE, {}),
    lastSpeakCache: loadJson(LS.LAST_SPEAK_CACHE, {}),
    postTitleCache: loadJson(LS.POST_TITLE_CACHE, {}),
    signatureCache: {},
    channelData: {},
    hotCache: loadJson(LS.HOT_CACHE, {}),
    hotLoading: false,
    hotError: null,
    followData: { items: [], loading: false, loaded: false, error: null, sortByActive: false },
    fansData: { items: [], loading: false, loaded: false, error: null, sortByActive: false },
    blockListState: { items: [], loading: false, loaded: false, error: null },
    batchQuery: { running: false, done: 0, total: 0, stopRequested: false },
    removedFans: new Set(),
    searchKeyword: "",
    readFilterMode: "all",
    lastBrowseChannel: "home",
    currentPostId: null,
    currentPostUrl: null,
    nativePostId: null,
    opAuthor: "",
    currentUser: "",
    currentUserId: 0,
    totalMessageUnread: 0,
    unreadCounts: { atMe: 0, reply: 0, message: 0, sysNotice: 0 },
    unreadLoaded: false,
    _markingNotif: {},
    readNotifs: loadJson(LS.READ_NOTIFS, {}),
    notifData: {
      "at-me": { items: [], loading: false, loaded: false, error: null },
      "reply-me": { items: [], loading: false, loaded: false, error: null },
    },
    pmList: { items: [], loading: false, loaded: false, error: null },
    sysNoticeList: { items: [], loading: false, loaded: false, error: null },
    activePmPeer: null,
    pmMessages: [],
    selectedNotifKey: "",
    onlyOp: false,
    onlyMember: "",
    threadsCollapsed: false,
    members: [],
    shellBuilt: false,
    chatViewSeq: 0,
    currentRoom: null,
    loadedPages: new Set(),
    loadingNextPage: false,
    loadingPrevPage: false,
    collectedSet: new Set(loadJson(LS.COLLECTIONS, [])),
    collectionsLoaded: false,
    hubTab: "notif",
    hubNotifSub: "reply-me",
    _lastRenderedHubTab: "",
    _hubFansMode: "fans",
    _hubFansSortByActive: false,
    _settingAutoSection: "",
    hubCreditView: "list",
    hubStardustView: "list",
    workbenchSection: "theme",
    paneSkins: loadJson(LS.PANE_SKINS, {}),
    paneCollapsed: loadJson(LS.PANE_COLLAPSED, { nav: false, list: false, right: false }),
    composerPrefs: loadJson(LS.COMPOSER_PREFS, { pinned: false, size: "md" }),
    navConfig: loadJson(LS.NAV_CONFIG, { order: [], hidden: [] }),
    rightConfig: loadJson(LS.RIGHT_CONFIG, { order: [], hidden: [] }),
    chatPrefs: loadJson(LS.CHAT_PREFS, { lineHeight: 1.55, msgGap: 12, imgMaxW: 480, imgMaxH: 320 }),
    customStickers: loadJson(LS.CUSTOM_STICKERS, []),
    customStyleNotes: loadJson(LS.CUSTOM_STYLE_NOTES, null),
    jumpLinkMode: localStorage.getItem(LS.JUMP_MODE) || "modal",
    rulingAutoQuery: localStorage.getItem(LS.RULING_AUTO) !== "0",
    rulingCache: loadJson(LS.RULING_CACHE, {}),
    seekViewerCache: loadJson(LS.SEEK_VIEWER_CACHE, { username: "", uid: "" }),
    registry: {
      themes: [],
      hubTabs: [],
      hubSubViews: {},
      bubbleEnhancers: [],
      userActions: [],
      navItems: [],
    },
    autoCheckin: localStorage.getItem(LS.AUTO_CHECKIN) === "1",
    autoCheckinMode: localStorage.getItem(LS.AUTO_CHECKIN_MODE) || "fixed",
    autoCheckinDate: localStorage.getItem(LS.AUTO_CHECKIN_DATE) || "",
    checkinToday: loadJson(LS.CHECKIN_TODAY, { date: "", gain: null, current: null, mode: "" }),
    _autoCheckinAttempted: false,
    updateInfo: {
      current: (typeof GM_info !== "undefined" && GM_info.script && GM_info.script.version) || "7.22.33",
      latest: "",
      installUrl: "",
      hasUpdate: false,
      checking: false,
      error: "",
      justChecked: false,
    },
    hubData: {
      posts: { items: [], page: 0, loading: false, noMore: false, error: null },
      comments: { items: [], page: 0, loading: false, noMore: false, error: null },
      collections: { items: [], page: 0, loading: false, noMore: false, error: null },
      credit: { items: [], page: 0, loading: false, noMore: false, error: null },
      stardust: { items: [], cursor: null, mode: "recv", loading: false, noMore: false, error: null },
      progress: { data: null, loading: false, error: null },
      board: { items: [], page: 0, loading: false, noMore: false, error: null },
      checkinResult: null,
      checkinLoading: false,
    },
  };

