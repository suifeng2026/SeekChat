// ==UserScript==
// @name         SeekChat
// @namespace    https://www.nodeseek.com/
// @version      7.22.9
// @description  将 NodeSeek 重构为零依赖 macOS 四栏群聊工作台：频道瀑布流、居中楼中楼、消息中心、热榜社交、星辰与投票卡片及个人中心悬浮窗。
// @author       80hou
// @match        https://www.nodeseek.com/*
// @match        https://nodeseek.com/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_info
// @grant        GM_openInTab
// @grant        unsafeWindow
// @connect      api.nodeimage.com
// @connect      nodeimage.com
// @connect      www.nodeimage.com
// @connect      raw.githubusercontent.com
// @updateURL    https://raw.githubusercontent.com/suifeng2026/SeekChat/main/dist/nodeseek-chat-ui.meta.js
// @downloadURL  https://raw.githubusercontent.com/suifeng2026/SeekChat/main/dist/nodeseek-chat-ui.user.js
// ==/UserScript==

(function () {
  "use strict";

  // ==========================================================================
  // Module: 01-config-icons.js
  // ==========================================================================
  const LS = {
    ENABLED: "nsc_v7_enabled",
    THEME: "nsc_v7_theme",
    ACTIVE_CHANNEL: "nsc_v7_channel",
    SORT: "nsc_v7_sort",
    HOT_TAB: "nsc_v7_hot_tab",
    READ_MAP: "nsc_v7_read_map",
    FRIENDS: "nsc_v7_friends",
    REMOVED_FRIENDS: "nsc_v7_removed_friends",
    BLACKLIST: "nsc_v7_blacklist",
    RIGHT_TAB: "nsc_v7_right_tab",
    USER_CACHE: "nsc_v7_user_cache",
    LAST_SPEAK_CACHE: "nsc_v7_last_speak_cache",
    POST_TITLE_CACHE: "nsc_v7_post_title_cache",
    READ_NOTIFS: "nsc_v7_read_notifs",
    AUTO_CHECKIN: "nsc_v7_auto_checkin",
    AUTO_CHECKIN_MODE: "nsc_v7_auto_checkin_mode",
    AUTO_CHECKIN_DATE: "nsc_v7_auto_checkin_date",
    UPDATE_CHECK: "nsc_v7_update_check",
    PANE_SKINS: "nsc_v7_pane_skins",
    NAV_CONFIG: "nsc_v7_nav_config",
    RIGHT_CONFIG: "nsc_v7_right_config",
    CHAT_PREFS: "nsc_v7_chat_prefs",
    CUSTOM_STICKERS: "nsc_v7_custom_stickers",
    CUSTOM_STYLE_NOTES: "nsc_v7_custom_style_notes",
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
    stardust: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.2 5.3L19.5 10l-5.3 2.2L12 17.5l-2.2-5.3L4.5 10l5.3-1.7L12 3z"/><path d="M19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16z"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
    sliders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
    palette: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16c3.3 0 6-2.7 6-6 0-4.9-4.5-8.6-10-8.6z"/></svg>`,
    up: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`,
    down: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  };

  const STICKER_GROUPS = [
    {
      id: "ac",
      label: "AC娘",
      files: [
        "01.png","02.png","03.png","04.png","05.png","06.png","07.png","08.png",
        "09.png","10.png","11.png","12.png","13.png","14.png","15.png","16.png",
        "17.png","18.png","19.png","20.png","21.png","22.png","23.png","24.png",
        "25.png","26.png","27.png","28.png","29.png","30.png","31.png","32.png",
      ],
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
    activeChannel: localStorage.getItem(LS.ACTIVE_CHANNEL) || "home",
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
    hotCache: {},
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
    collectedSet: new Set(),
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
    navConfig: loadJson(LS.NAV_CONFIG, { order: [], hidden: [] }),
    rightConfig: loadJson(LS.RIGHT_CONFIG, { order: [], hidden: [] }),
    chatPrefs: loadJson(LS.CHAT_PREFS, { lineHeight: 1.55, msgGap: 12, imgMaxW: 480, imgMaxH: 320 }),
    customStickers: loadJson(LS.CUSTOM_STICKERS, []),
    customStyleNotes: loadJson(LS.CUSTOM_STYLE_NOTES, null),
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
    _autoCheckinAttempted: false,
    updateInfo: {
      current: (typeof GM_info !== "undefined" && GM_info.script && GM_info.script.version) || "7.22.9",
      latest: "",
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

  // ==========================================================================
  // Module: 02-utils-api.js
  // ==========================================================================
  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveJson(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (_) {}
  }

  const _saveJsonTimers = new Map();
  function scheduleSaveJson(key, val, delayMs = 600) {
    if (_saveJsonTimers.has(key)) clearTimeout(_saveJsonTimers.get(key));
    _saveJsonTimers.set(key, setTimeout(() => {
      _saveJsonTimers.delete(key);
      saveJson(key, val);
    }, delayMs));
  }

  function pruneTimedCache(mapObj, maxKeys = 400, keepKeys = 300) {
    if (!mapObj || typeof mapObj !== "object") return;
    const keys = Object.keys(mapObj);
    if (keys.length <= maxKeys) return;
    keys
      .sort((a, b) => ((mapObj[a] && mapObj[a].ts) || 0) - ((mapObj[b] && mapObj[b].ts) || 0))
      .slice(0, keys.length - keepKeys)
      .forEach((k) => delete mapObj[k]);
  }

  function escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function withHiddenIframe(url, { pollMs = 220, timeoutMs = 6000, onPoll } = {}) {
    return new Promise((resolve) => {
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:900px;height:600px;opacity:0;pointer-events:none;border:0;";
      iframe.src = url;
      let done = false;
      let poll = null;
      let timer = null;
      const finish = (res) => {
        if (done) return;
        done = true;
        if (poll) { clearInterval(poll); poll = null; }
        if (timer) { clearTimeout(timer); timer = null; }
        try { iframe.remove(); } catch (_) {}
        resolve(res);
      };
      timer = setTimeout(() => finish(null), timeoutMs);
      iframe.addEventListener("load", () => {
        let attempts = 0;
        poll = setInterval(() => {
          attempts++;
          try {
            const idoc = iframe.contentDocument;
            if (!idoc) return;
            if (typeof onPoll === "function") {
              onPoll(idoc, attempts, finish);
            }
          } catch (_) {}
        }, pollMs);
      });
      document.body.appendChild(iframe);
    });
  }

  async function apiGetJson(url) {
    const resp = await fetch(url, {
      headers: { Accept: "application/json, text/plain, */*" },
      credentials: "include",
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  }

  async function apiPostJson(url, bodyObj) {
    const resp = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: getNodeSeekPostHeaders(),
      body: JSON.stringify(bodyObj || {}),
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json.success === false) {
      throw new Error(json.message || `HTTP ${resp.status}`);
    }
    return json;
  }

  async function computeDynamicSign(method, absUrl, bodyText = "") {
    try {
      if (!(window.crypto && window.crypto.subtle)) return "";
      const raw = [
        String(method || "GET").toUpperCase(),
        String(absUrl || ""),
        navigator.userAgent || "",
        String(bodyText || ""),
      ].join("\n\n");
      const digest = await window.crypto.subtle.digest("SHA-1", new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    } catch (_) {
      return "";
    }
  }

  async function signedApiFetchJson(path, { method = "GET", bodyObj = null } = {}) {
    const absUrl = new URL(path, location.origin).href;
    const upperMethod = String(method || "GET").toUpperCase();
    const hasBody = upperMethod !== "GET" && bodyObj !== null && bodyObj !== undefined;
    const bodyText = hasBody ? JSON.stringify(bodyObj) : "";
    const sign = await computeDynamicSign(upperMethod, absUrl, bodyText);
    const headers = upperMethod === "GET"
      ? {
          Accept: "application/json, text/plain, */*",
          "X-Requested-With": "XMLHttpRequest",
          ...(sign ? { "x-dynamic-sign": sign } : {}),
        }
      : {
          ...getNodeSeekPostHeaders(),
          Accept: "application/json, text/plain, */*",
          "X-Requested-With": "XMLHttpRequest",
          ...(sign ? { "x-dynamic-sign": sign } : {}),
        };
    const resp = await fetch(absUrl, {
      method: upperMethod,
      credentials: "include",
      cache: "no-store",
      headers,
      ...(hasBody ? { body: bodyText } : {}),
    });
    const json = await resp.json().catch(() => null);
    if (!resp.ok || !json || json.success === false) {
      const msg = (json && json.message) || (resp.status === 401 ? "请先登录后操作" : `HTTP ${resp.status}`);
      const err = new Error(msg);
      err.status = resp.status;
      throw err;
    }
    return json;
  }

  function genCsrfToken(len = 16) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
    return out;
  }

  function parseTempScriptConfig(doc) {
    const el = doc && doc.getElementById("temp-script");
    if (!el || !el.textContent) return null;
    const raw = el.textContent.trim();
    if (!raw) return null;
    try {
      if (raw.startsWith("{")) return JSON.parse(raw);
      const bin = atob(raw);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return JSON.parse(new TextDecoder("utf-8").decode(bytes));
    } catch (_) {
      return null;
    }
  }

  function extractPostMetaFromTempScript(doc) {
    const map = new Map();
    const cfg = parseTempScriptConfig(doc);
    const comments = cfg && cfg.postData && Array.isArray(cfg.postData.comments) ? cfg.postData.comments : [];
    for (const c of comments) {
      const floorNum = c.floorIndex !== undefined && c.floorIndex !== null ? Number(c.floorIndex) : NaN;
      const floorKey = Number.isFinite(floorNum) ? String(floorNum) : "";
      if (!floorKey) continue;
      map.set(floorKey, {
        commentId: String(c.commentId || c.id || ""),
        likes: Number(c.upvoteCount) || 0,
        legs: Number(c.likeCount) || 0,
        dislikes: Number(c.dislikeCount) || 0,
        pinned: Boolean(c.pined === true || c.pined === 1 || c.pinned === true || c.pinned === 1),
        upvoted: Boolean(c.upvoted),
        liked: Boolean(c.liked),
        disliked: Boolean(c.disliked),
      });
    }
    return map;
  }

  function getNodeSeekPostHeaders() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    const cookieMatch = document.cookie.match(/(?:^|;\s*)(?:csrf_token|csrfToken)=([^;]+)/i);
    const token = (meta && meta.getAttribute("content")) || (cookieMatch && cookieMatch[1]) || genCsrfToken(16);
    return {
      "Content-Type": "application/json",
      "csrf-token": token,
    };
  }


  function formatRelativeFromMs(tsMs) {
    if (!tsMs || Number.isNaN(tsMs)) return "";
    const sec = Math.max(0, Math.floor((Date.now() - tsMs) / 1000));
    if (sec < 60) return "刚刚";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}分钟前`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}小时前`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day}天前`;
    const mon = Math.floor(day / 30);
    if (mon < 12) return `${mon}个月前`;
    return `${Math.floor(day / 365)}年前`;
  }

  function formatChineseTime(rawText, datetimeAttr, titleAttr) {
    if (datetimeAttr) {
      const ms = new Date(datetimeAttr).getTime();
      if (!Number.isNaN(ms) && ms > 0) return formatRelativeFromMs(ms);
    }
    if (titleAttr) {
      const norm = titleAttr.replace(/\//g, "-").trim();
      const ms = new Date(norm).getTime();
      if (!Number.isNaN(ms) && ms > 0) return formatRelativeFromMs(ms);
    }
    const s = String(rawText || "").trim();
    if (!s) return "";
    if (/just\s*now/i.test(s)) return "刚刚";

    let totalSec = 0;
    let matched = false;
    const re = /(\d+)\s*(y|yr|years?|mo|mon|months?|w|weeks?|d|days?|h|hr|hrs|hours?|m|min|mins|minutes?|s|sec|secs|seconds?)/gi;
    let m;
    while ((m = re.exec(s)) !== null) {
      matched = true;
      const val = Number(m[1]);
      const unit = m[2].toLowerCase();
      if (unit.startsWith("y")) totalSec += val * 31536000;
      else if (unit.startsWith("mo")) totalSec += val * 2592000;
      else if (unit.startsWith("w")) totalSec += val * 604800;
      else if (unit.startsWith("d")) totalSec += val * 86400;
      else if (unit.startsWith("h")) totalSec += val * 3600;
      else if (unit.startsWith("m")) totalSec += val * 60;
      else if (unit.startsWith("s")) totalSec += val;
    }
    if (matched) {
      if (totalSec < 60) return "刚刚";
      if (totalSec < 3600) return `${Math.floor(totalSec / 60)}分钟前`;
      if (totalSec < 86400) return `${Math.floor(totalSec / 3600)}小时前`;
      if (totalSec < 2592000) return `${Math.floor(totalSec / 86400)}天前`;
      if (totalSec < 31536000) return `${Math.floor(totalSec / 2592000)}个月前`;
      return `${Math.floor(totalSec / 31536000)}年前`;
    }
    return s;
  }

  function getTimeFromEl(timeEl) {
    if (!timeEl) return { text: "", title: "" };
    const title = timeEl.getAttribute("title") || "";
    const dt = timeEl.getAttribute("datetime") || "";
    const text = formatChineseTime(timeEl.textContent, dt, title);
    return { text, title };
  }

  function getPostIdFromPath(pathname) {
    const m = String(pathname || "").match(/\/post-(\d+)/);
    return m ? m[1] : null;
  }

  function isPostPath(pathname) {
    return /^\/post-\d+/.test(String(pathname || ""));
  }

  function isForumBrowseRoute() {
    if (document.getElementById("user-setting-panel")) return false;
    return isBrowsePath(location.pathname);
  }

  function detectCurrentUser() {
    const el = document.querySelector("#nsk-right-panel-container .user-card .Username, .nsc-right-user .Username");
    if (el) {
      state.currentUser = el.textContent.trim();
      const m = (el.getAttribute("href") || "").match(/\/space\/(\d+)/);
      if (m) state.currentUserId = Number(m[1]);
    }
  }

  function isFriend(name) {
    if (!name) return false;
    if (state.friends.some((f) => f.name === name)) return true;
    return state.followData.items.some((f) => f.name === name) && !state.removedFriends.has(name);
  }

  function rebuildBlacklistSet() {
    state.blacklistNameSet = new Set((state.blacklist || []).map((b) => b.name).filter(Boolean));
  }
  rebuildBlacklistSet();

  function isBlacklisted(name) {
    return Boolean(name && state.blacklistNameSet.has(name));
  }

  function isMemberHidden(name) {
    return isBlacklisted(name) || state.removedFans.has(name);
  }

  function toggleFriend(member) {
    if (!member || !member.name) return;
    if (isFriend(member.name)) {
      state.friends = state.friends.filter((f) => f.name !== member.name);
      state.removedFriends.add(member.name);
      saveJson(LS.REMOVED_FRIENDS, Array.from(state.removedFriends));
    } else {
      state.removedFriends.delete(member.name);
      saveJson(LS.REMOVED_FRIENDS, Array.from(state.removedFriends));
      if (!state.friends.some((f) => f.name === member.name)) {
        state.friends.unshift({ uid: member.uid || "", name: member.name, avatar: member.avatar || "" });
      }
      state.blacklist = state.blacklist.filter((b) => b.name !== member.name);
      rebuildBlacklistSet();
      saveJson(LS.BLACKLIST, state.blacklist);
    }
    saveJson(LS.FRIENDS, state.friends);
    renderRightBody();
  }

  async function fetchServerBlockList(silent = false) {
    if (state.blockListState.loading) return state.blacklist;
    state.blockListState.loading = true;
    state.blockListState.error = null;
    if (!silent && state.rightTab === "blacklist") renderRightBody();

    try {
      const resp = await fetch("/api/block-list/list", {
        headers: { Accept: "application/json, text/plain, */*" },
        credentials: "include",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const raw =
        (json && Array.isArray(json.data) && json.data) ||
        (json && Array.isArray(json.list) && json.list) ||
        [];
      const mapped = [];
      const seen = new Set();
      for (const it of raw) {
        const uid = String(it.block_member_id || it.member_id || it.uid || "").trim();
        const name = String(it.block_member_name || it.member_name || it.username || it.name || "").trim();
        if (!name && !uid) continue;
        const key = name || uid;
        if (seen.has(key)) continue;
        seen.add(key);
        mapped.push({
          uid,
          name: name || `用户#${uid}`,
          avatar: uid ? `/avatar/${uid}.png` : "",
        });
      }
      state.blockListState.items = mapped;
      state.blockListState.loaded = true;
      state.blacklist = mapped;
      rebuildBlacklistSet();
      saveJson(LS.BLACKLIST, state.blacklist);
      renderTopicList();
      applyMessageFilters();
    } catch (err) {
      state.blockListState.error = err.message;
    } finally {
      state.blockListState.loading = false;
      if (state.rightTab === "blacklist") renderRightBody();
    }
    return state.blacklist;
  }

  async function toggleBlacklist(member) {
    if (!member || (!member.name && !member.uid)) return { ok: false, message: "无效用户" };
    const name = String(member.name || "").trim();
    const currentlyBlocked = isBlacklisted(name) || (member.uid && state.blacklist.some((b) => String(b.uid) === String(member.uid)));

    if (currentlyBlocked) {
      let targetUid = member.uid;
      if (!targetUid) {
        const hit = state.blacklist.find((b) => b.name === name);
        if (hit && hit.uid) targetUid = hit.uid;
      }
      if (!targetUid) {
        await fetchServerBlockList(true);
        const hit = state.blacklist.find((b) => b.name === name);
        if (hit && hit.uid) targetUid = hit.uid;
      }
      if (targetUid) {
        try {
          const resp = await fetch("/api/block-list/del", {
            method: "POST",
            credentials: "include",
            headers: getNodeSeekPostHeaders(),
            body: JSON.stringify({ block_member_id: Number(targetUid) }),
          });
          const resJson = await resp.json().catch(() => ({}));
          if (!resp.ok || resJson.success === false) {
            return { ok: false, message: resJson.message || `HTTP ${resp.status}` };
          }
        } catch (err) {
          return { ok: false, message: err.message };
        }
      }
      state.blacklist = state.blacklist.filter((b) => b.name !== name && (!targetUid || String(b.uid) !== String(targetUid)));
      rebuildBlacklistSet();
      state.removedFans.delete(name);
      saveJson(LS.BLACKLIST, state.blacklist);
      renderRightBody();
      renderTopicList();
      applyMessageFilters();
      return { ok: true, action: "removed" };
    }

    if (!name) return { ok: false, message: "请输入用户名" };
    try {
      const resp = await fetch("/api/block-list/add", {
        method: "POST",
        credentials: "include",
        headers: getNodeSeekPostHeaders(),
        body: JSON.stringify({ block_member_name: name }),
      });
      const resJson = await resp.json().catch(() => ({}));
      if (!resp.ok || resJson.success === false) {
        return { ok: false, message: resJson.message || `HTTP ${resp.status}` };
      }
    } catch (err) {
      return { ok: false, message: err.message };
    }

    state.friends = state.friends.filter((f) => f.name !== name);
    saveJson(LS.FRIENDS, state.friends);
    if (!state.blacklist.some((b) => b.name === name)) {
      state.blacklist.unshift({ uid: member.uid || "", name, avatar: member.avatar || (member.uid ? `/avatar/${member.uid}.png` : "") });
      rebuildBlacklistSet();
      saveJson(LS.BLACKLIST, state.blacklist);
    }
    await fetchServerBlockList(true);
    renderRightBody();
    renderTopicList();
    applyMessageFilters();
    return { ok: true, action: "added" };
  }

  function markPostOpenedAsRead(meta) {
    if (!meta || !meta.postId) return;
    const prev = state.readMap[meta.postId] || {};
    const replies = Math.max(Number(prev.replies) || 0, Number(meta.replies) || 0);
    state.readMap[meta.postId] = {
      postId: meta.postId,
      url: meta.url || prev.url || `/post-${meta.postId}-1`,
      title: meta.title || prev.title || `帖子 #${meta.postId}`,
      author: meta.author || prev.author || "",
      avatar: meta.avatar || prev.avatar || "",
      category: meta.category || prev.category || "",
      replies,
      ts: Date.now(),
    };
    const keys = Object.keys(state.readMap);
    if (keys.length > 800) {
      keys
        .sort((a, b) => (state.readMap[a].ts || 0) - (state.readMap[b].ts || 0))
        .slice(0, keys.length - 600)
        .forEach((k) => delete state.readMap[k]);
    }
    saveJson(LS.READ_MAP, state.readMap);
    renderLeftNav();
  }

  function getReadStatus(postId, repliesCount) {
    const rec = state.readMap[postId];
    if (!rec) return { status: "unread", delta: 0 };
    const delta = (Number(repliesCount) || 0) - (Number(rec.replies) || 0);
    if (delta > 0) return { status: "updated", delta };
    return { status: "read", delta: 0 };
  }

  function syncUserCardNotifyBadge() {
    const total =
      (Number(state.unreadCounts.atMe) || 0) +
      (Number(state.unreadCounts.reply) || 0) +
      (Number(state.unreadCounts.message) || 0) +
      (Number(state.unreadCounts.sysNotice) || 0);
    for (const el of document.querySelectorAll(".user-card .notify-count")) {
      el.textContent = String(total);
      el.style.display = total > 0 ? "inline" : "none";
    }
  }

  async function prefetchCollectionsSet() {
    if (state.collectionsLoaded) return;
    state.collectionsLoaded = true;
    try {
      for (let page = 1; page <= 3; page++) {
        const resp = await fetch(`/api/statistics/list-collection?page=${page}`, {
          headers: { Accept: "application/json, text/plain, */*" },
          credentials: "include",
        });
        if (!resp.ok) break;
        const json = await resp.json().catch(() => null);
        const rows = (json && (json.collections || json.data || json.list)) || [];
        if (!Array.isArray(rows) || rows.length === 0) break;
        for (const it of rows) {
          const pid = String(it.post_id || it.postId || it.id || "").trim();
          if (pid) state.collectedSet.add(pid);
        }
        if (rows.length < 15) break;
      }
      if (state.currentRoom && state.currentPostId) {
        const colBtn = document.getElementById("nsc-collect-post-btn");
        if (colBtn) {
          const on = state.collectedSet.has(String(state.currentPostId));
          colBtn.classList.toggle("is-active", on);
          colBtn.innerHTML = `${ICONS.bookmark}<span>${on ? "已收藏" : "收藏"}</span>`;
        }
      }
    } catch (_) {}
  }

  async function togglePostCollection(postId, btnEl = null) {
    const pid = String(postId || "").trim();
    if (!pid) return { ok: false };
    const isCollected = state.collectedSet.has(pid);
    const action = isCollected ? "remove" : "add";
    if (btnEl) btnEl.disabled = true;
    try {
      const resp = await fetch("/api/statistics/collection", {
        method: "POST",
        credentials: "include",
        headers: getNodeSeekPostHeaders(),
        body: JSON.stringify({ action, postId: Number(pid) }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json.success === false) {
        throw new Error(json.message || `HTTP ${resp.status}`);
      }
      if (action === "add") state.collectedSet.add(pid);
      else state.collectedSet.delete(pid);
      state.hubData.collections = { items: [], page: 0, loading: false, noMore: false, error: null };

      if (btnEl) {
        const on = state.collectedSet.has(pid);
        btnEl.classList.toggle("is-active", on);
        btnEl.innerHTML = `${ICONS.bookmark}<span>${on ? "已收藏" : "收藏"}</span>`;
      }
      const colStatSpan = document.querySelector('.user-card .user-stat a[href*="#collections"] span');
      if (colStatSpan) {
        const m = colStatSpan.textContent.match(/(\d+)/);
        if (m) {
          const nextCnt = Math.max(0, Number(m[1]) + (action === "add" ? 1 : -1));
          colStatSpan.textContent = `收藏 ${nextCnt}`;
        }
      }
      return { ok: true, collected: action === "add" };
    } catch (err) {
      return { ok: false, message: err.message };
    } finally {
      if (btnEl) btnEl.disabled = false;
    }
  }

  function getScriptUpdateTargets() {
    const script = typeof GM_info !== "undefined" && GM_info.script ? GM_info.script : null;
    const metaStr = typeof GM_info !== "undefined" && GM_info.scriptMetaStr ? GM_info.scriptMetaStr : "";
    const parseMetaField = (field) => {
      const m = metaStr.match(new RegExp(`^\\s*//\\s*@${field}\\s+([^\\s]+)`, "im"));
      return m ? m[1].trim() : "";
    };
    const updateUrl = String((script && script.updateURL) || parseMetaField("updateURL") || "").trim();
    const downloadUrl = String((script && script.downloadURL) || parseMetaField("downloadURL") || updateUrl || "").trim();
    const isHttp = (u) => /^https?:\/\//i.test(u);
    return {
      metaUrl: isHttp(updateUrl) ? updateUrl : (isHttp(downloadUrl) ? downloadUrl : ""),
      downloadUrl: isHttp(downloadUrl) ? downloadUrl : (isHttp(updateUrl) ? updateUrl : ""),
    };
  }

  function compareSemver(a, b) {
    const pa = String(a || "0").replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
    const pb = String(b || "0").replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const va = pa[i] || 0;
      const vb = pb[i] || 0;
      if (va > vb) return 1;
      if (va < vb) return -1;
    }
    return 0;
  }

  function renderUpdateButton() {
    const btn = document.getElementById("nsc-update-btn");
    if (!btn) return;
    const targets = getScriptUpdateTargets();
    const u = state.updateInfo;
    if (!targets.metaUrl) {
      btn.classList.remove("has-update");
      btn.disabled = true;
      btn.style.opacity = "0.72";
      btn.style.cursor = "default";
      btn.title = `当前 v${u.current} · 未配置 @updateURL（本地/独立构建模式，已禁用远程覆盖更新）`;
      btn.innerHTML = `<span class="nsc-nav-left">${ICONS.update}<span>本地 v${escHtml(u.current)}</span></span>`;
      return;
    }
    btn.disabled = false;
    btn.style.opacity = "";
    btn.style.cursor = "";
    btn.classList.toggle("has-update", Boolean(u.hasUpdate));
    if (u.checking) {
      btn.title = `正在检查更新（当前 v${u.current}）...`;
      btn.innerHTML = `<span class="nsc-nav-left">${ICONS.update}<span>检测中...</span></span>`;
      return;
    }
    if (u.hasUpdate && u.latest) {
      btn.title = `发现新版本 v${u.latest}（当前 v${u.current}），点击一键更新`;
      btn.innerHTML = `<span class="nsc-nav-left">${ICONS.update}<span>更新 v${escHtml(u.latest)}</span></span><span class="nsc-nav-badge">新</span>`;
      return;
    }
    if (u.error) {
      btn.title = `检测失败 (${u.error})，点击重试`;
      btn.innerHTML = `<span class="nsc-nav-left">${ICONS.update}<span>检测失败</span></span>`;
      return;
    }
    if (u.justChecked) {
      btn.title = `当前已是最新版本 v${u.current}`;
      btn.innerHTML = `<span class="nsc-nav-left">${ICONS.check}<span>已是最新</span></span>`;
      return;
    }
    btn.title = `当前 v${u.current} · 每小时自动检测一次，点击立即检查更新`;
    btn.innerHTML = `<span class="nsc-nav-left">${ICONS.update}<span>检查更新</span></span>`;
  }

  function openSeekChatUpdateInstall() {
    const targets = getScriptUpdateTargets();
    if (!targets.downloadUrl) return;
    const sep = targets.downloadUrl.includes("?") ? "&" : "?";
    const url = `${targets.downloadUrl}${sep}t=${Date.now()}`;
    try {
      if (typeof GM_openInTab === "function") {
        GM_openInTab(url, { active: true, insert: true, setParent: true });
        return;
      }
    } catch (_) {}
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function fetchRemoteMetaText(url) {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest === "function") {
        GM_xmlhttpRequest({
          method: "GET",
          url,
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          timeout: 10000,
          onload: (res) => {
            if (res.status >= 200 && res.status < 300) resolve(res.responseText || "");
            else reject(new Error(`HTTP ${res.status}`));
          },
          onerror: () => reject(new Error("网络请求失败")),
          ontimeout: () => reject(new Error("请求超时")),
        });
        return;
      }
      fetch(url, { cache: "no-store" })
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then(resolve, reject);
    });
  }

  const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

  async function checkSeekChatUpdate(manual = false) {
    const u = state.updateInfo;
    const targets = getScriptUpdateTargets();
    if (!targets.metaUrl) {
      u.hasUpdate = false;
      u.checking = false;
      renderUpdateButton();
      return;
    }
    if (u.checking) return;
    if (!manual) {
      const cached = loadJson(LS.UPDATE_CHECK, null);
      if (
        cached &&
        cached.ts &&
        cached.metaUrl === targets.metaUrl &&
        Date.now() - cached.ts < UPDATE_CHECK_INTERVAL_MS &&
        cached.latest
      ) {
        u.latest = cached.latest;
        u.hasUpdate = compareSemver(cached.latest, u.current) > 0;
        renderUpdateButton();
        return;
      }
    }
    u.checking = true;
    u.error = "";
    u.justChecked = false;
    renderUpdateButton();
    try {
      const sep = targets.metaUrl.includes("?") ? "&" : "?";
      const url = manual ? `${targets.metaUrl}${sep}_t=${Date.now()}` : targets.metaUrl;
      const text = await fetchRemoteMetaText(url);
      const m = text.match(/\/\/\s*@version\s+([^\s]+)/i);
      const latest = m ? m[1].trim() : "";
      if (!latest) throw new Error("未解析到版本号");
      u.latest = latest;
      u.hasUpdate = compareSemver(latest, u.current) > 0;
      u.justChecked = manual && !u.hasUpdate;
      saveJson(LS.UPDATE_CHECK, { latest, metaUrl: targets.metaUrl, ts: Date.now() });
      if (u.justChecked) {
        setTimeout(() => {
          u.justChecked = false;
          renderUpdateButton();
        }, 2000);
      }
    } catch (err) {
      u.error = err.message || "检测失败";
    } finally {
      u.checking = false;
      renderUpdateButton();
    }
  }

  function getChannelUnreadCount(channelId) {
    if (channelId === "history") return 0;
    if (channelId === "at-me") return Number(state.unreadCounts.atMe) || 0;
    if (channelId === "reply-me") return Number(state.unreadCounts.reply) || 0;
    if (channelId === "pm") return Number(state.unreadCounts.message) || 0;
    if (channelId === "sys-notice") return Number(state.unreadCounts.sysNotice) || 0;
    const data = state.channelData[channelId];
    if (!data || !data.items) return 0;
    let count = 0;
    for (const it of data.items) {
      if (isBlacklisted(it.author)) continue;
      const st = getReadStatus(it.postId, it.replies).status;
      if (st === "unread" || st === "updated") count++;
    }
    return count;
  }

  // =========================================================================
  // 扩展插槽注册表与共享 FeedEngine 底座
  // =========================================================================
  function upsertRegistryItem(list, item, sortFn = null) {
    if (!item || !item.id) return;
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...item };
    else list.push(item);
    if (typeof sortFn === "function") list.sort(sortFn);
  }

  function registerTheme(manifest) {
    if (!manifest || !manifest.id || !manifest.name) return;
    upsertRegistryItem(state.registry.themes, {
      baseScheme: "light",
      tokens: {},
      extraCss: "",
      order: 50,
      ...manifest,
    }, (a, b) => (a.order ?? 50) - (b.order ?? 50));
    if (typeof syncRegisteredThemesCss === "function") syncRegisteredThemesCss();
  }

  function registerHubTab(tabSpec) {
    if (!tabSpec || !tabSpec.id || !tabSpec.label) return;
    upsertRegistryItem(state.registry.hubTabs, { order: 80, ...tabSpec }, (a, b) => (a.order ?? 80) - (b.order ?? 80));
  }

  function registerHubSubView(tabId, handler) {
    if (!tabId || !handler) return;
    state.registry.hubSubViews[tabId] = handler;
  }

  async function copyTextToClipboard(text) {
    const val = String(text || "");
    if (!val) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(val);
        return true;
      }
    } catch (_) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = val;
      ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0;";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return Boolean(ok);
    } catch (_) {
      return false;
    }
  }

  function registerBubbleEnhancer(spec) {
    if (!spec || !spec.id || typeof spec.run !== "function") return;
    upsertRegistryItem(state.registry.bubbleEnhancers, { priority: 50, ...spec }, (a, b) => (a.priority ?? 50) - (b.priority ?? 50));
  }

  function registerUserAction(spec) {
    if (!spec || !spec.id || typeof spec.onClick !== "function") return;
    upsertRegistryItem(state.registry.userActions, { order: 50, places: ["profile"], ...spec }, (a, b) => (a.order ?? 50) - (b.order ?? 50));
  }

  function registerNavItem(spec) {
    if (!spec || !spec.id || !spec.name) return;
    upsertRegistryItem(state.registry.navItems, { order: 90, group: "board", ...spec }, (a, b) => (a.order ?? 90) - (b.order ?? 90));
  }

  function runBubbleEnhancers(containerEl, ctx = {}) {
    if (!containerEl) return;
    for (const enh of state.registry.bubbleEnhancers) {
      try {
        enh.run(containerEl, ctx);
      } catch (_) {}
    }
  }

  function applyOrderedConfig(baseList, cfg, protectedIds = []) {
    const order = Array.isArray(cfg && cfg.order) ? cfg.order : [];
    const hiddenSet = new Set(Array.isArray(cfg && cfg.hidden) ? cfg.hidden : []);
    for (const pid of protectedIds) hiddenSet.delete(pid);
    const rankMap = new Map(order.map((id, idx) => [id, idx]));
    const sorted = [...baseList].sort((a, b) => {
      const ra = rankMap.has(a.id) ? rankMap.get(a.id) : 10000 + baseList.indexOf(a);
      const rb = rankMap.has(b.id) ? rankMap.get(b.id) : 10000 + baseList.indexOf(b);
      return ra - rb;
    });
    return sorted.map((item) => ({ ...item, hidden: hiddenSet.has(item.id) }));
  }

  function getOrderedChannels(includeHidden = false) {
    const merged = [...CHANNELS, ...state.registry.navItems];
    const items = applyOrderedConfig(merged, state.navConfig, ["home"]);
    return includeHidden ? items : items.filter((x) => !x.hidden);
  }

  function getOrderedRightTabs(includeHidden = false) {
    const items = applyOrderedConfig(RIGHT_TABS, state.rightConfig, []);
    if (includeHidden) return items;
    const visible = items.filter((x) => !x.hidden);
    return visible.length > 0 ? visible : [items[0]].filter(Boolean);
  }

  function getEffectiveStickerGroups() {
    const custom = Array.isArray(state.customStickers) ? state.customStickers : [];
    const validCustom = custom
      .filter((g) => g && g.id && g.label && Array.isArray(g.items) && g.items.length > 0)
      .map((g) => ({ ...g, isCustom: true }));
    return [...STICKER_GROUPS, ...validCustom];
  }

  const _feedMutexLocks = new Map();
  const _feedEngines = new Map();

  function createFeedEngine(spec) {
    if (!spec || !spec.key || typeof spec.fetchPage !== "function") {
      throw new Error("createFeedEngine requires key and fetchPage");
    }
    if (_feedEngines.has(spec.key)) return _feedEngines.get(spec.key);

    const st = {
      items: [],
      seenKeys: new Set(),
      page: 0,
      cursor: null,
      hasMore: true,
      loading: false,
      running: false,
      error: null,
      progress: { done: 0, total: 0 },
      runSeq: 0,
      abortCtrl: null,
      lastDoneAt: 0,
    };

    const notify = () => {
      if (typeof spec.onUpdate === "function") {
        try { spec.onUpdate(getSnapshot()); } catch (_) {}
      }
    };

    const getSnapshot = () => ({
      items: st.items,
      page: st.page,
      cursor: st.cursor,
      hasMore: st.hasMore,
      loading: st.loading,
      running: st.running,
      error: st.error,
      progress: { ...st.progress },
      lastDoneAt: st.lastDoneAt,
    });

    const abort = () => {
      st.runSeq += 1;
      if (st.abortCtrl) {
        try { st.abortCtrl.abort(); } catch (_) {}
        st.abortCtrl = null;
      }
      st.loading = false;
      st.running = false;
      if (spec.mutexGroup && _feedMutexLocks.get(spec.mutexGroup) === spec.key) {
        _feedMutexLocks.delete(spec.mutexGroup);
      }
      notify();
    };

    const reset = () => {
      abort();
      st.items = [];
      st.seenKeys.clear();
      st.page = 0;
      st.cursor = null;
      st.hasMore = true;
      st.error = null;
      st.progress = { done: 0, total: 0 };
      st.lastDoneAt = 0;
      notify();
    };

    const appendRows = (rows) => {
      let added = 0;
      for (const r of rows || []) {
        const k = typeof spec.keyOf === "function" ? spec.keyOf(r) : null;
        if (k !== null && k !== undefined) {
          const sk = String(k);
          if (st.seenKeys.has(sk)) continue;
          st.seenKeys.add(sk);
        }
        st.items.push(r);
        added++;
      }
      return added;
    };

    const loadNext = async () => {
      if (st.loading || !st.hasMore) return getSnapshot();
      const seq = ++st.runSeq;
      st.loading = true;
      st.error = null;
      st.abortCtrl = new AbortController();
      notify();
      try {
        const nextPage = st.page + 1;
        const res = await spec.fetchPage({ page: nextPage, cursor: st.cursor, signal: st.abortCtrl.signal });
        if (seq !== st.runSeq) return getSnapshot();
        const rows = (res && Array.isArray(res.rows)) ? res.rows : [];
        const added = appendRows(rows);
        st.page = nextPage;
        st.cursor = res && res.nextCursor !== undefined ? res.nextCursor : st.cursor;
        st.hasMore = Boolean(res && res.hasMore) && rows.length > 0 && (typeof spec.keyOf !== "function" || added > 0);
      } catch (err) {
        if (seq !== st.runSeq || (err && err.name === "AbortError")) return getSnapshot();
        st.error = err && err.message ? err.message : "加载失败";
      } finally {
        if (seq === st.runSeq) {
          st.loading = false;
          st.abortCtrl = null;
          notify();
        }
      }
      return getSnapshot();
    };

    const runBatch = async ({ maxPages = 100, delayMs = spec.delayMs ?? 150 } = {}) => {
      if (st.running) return getSnapshot();
      if (spec.mutexGroup) {
        const holder = _feedMutexLocks.get(spec.mutexGroup);
        if (holder && holder !== spec.key) {
          st.error = `已有同类扫描任务运行中 (${holder})，请稍候`;
          notify();
          return getSnapshot();
        }
        _feedMutexLocks.set(spec.mutexGroup, spec.key);
      }
      const seq = ++st.runSeq;
      st.items = [];
      st.seenKeys.clear();
      st.page = 0;
      st.cursor = null;
      st.hasMore = true;
      st.running = true;
      st.loading = true;
      st.error = null;
      st.progress = { done: 0, total: maxPages };
      st.abortCtrl = new AbortController();
      notify();

      try {
        for (let p = 1; p <= maxPages; p++) {
          if (seq !== st.runSeq) break;
          const res = await spec.fetchPage({ page: p, cursor: st.cursor, signal: st.abortCtrl.signal });
          if (seq !== st.runSeq) break;
          const rows = (res && Array.isArray(res.rows)) ? res.rows : [];
          if (rows.length === 0) {
            st.hasMore = false;
            st.progress.done = p;
            break;
          }
          appendRows(rows);
          st.page = p;
          st.cursor = res && res.nextCursor !== undefined ? res.nextCursor : st.cursor;
          st.hasMore = Boolean(res && res.hasMore);
          st.progress.done = p;
          notify();
          if (!st.hasMore || p >= maxPages) break;
          if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
        }
        if (seq === st.runSeq) st.lastDoneAt = Date.now();
      } catch (err) {
        if (seq === st.runSeq && !(err && err.name === "AbortError")) {
          st.error = err && err.message ? err.message : "批量拉取失败";
        }
      } finally {
        if (seq === st.runSeq) {
          st.loading = false;
          st.running = false;
          st.abortCtrl = null;
          if (spec.mutexGroup && _feedMutexLocks.get(spec.mutexGroup) === spec.key) {
            _feedMutexLocks.delete(spec.mutexGroup);
          }
          notify();
        }
      }
      return getSnapshot();
    };

    const api = { loadNext, runBatch, abort, reset, getState: getSnapshot };
    _feedEngines.set(spec.key, api);
    return api;
  }

  function bindWaterfallScroll(scrollEl, getEngineFn, thresholdPx = 200) {
    if (!scrollEl || scrollEl.dataset.nscWfBound === "1") return;
    scrollEl.dataset.nscWfBound = "1";
    let rafId = 0;
    scrollEl.addEventListener("scroll", () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const eng = typeof getEngineFn === "function" ? getEngineFn() : getEngineFn;
        if (!eng) return;
        if (scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < thresholdPx) {
          eng.loadNext();
        }
      });
    });
  }

  function applyPaneSkinsToDom() {
    const skins = state.paneSkins || {};
    for (const spec of PANE_SKIN_SPECS) {
      const el = document.querySelector(spec.selector);
      if (!el) continue;
      const cfg = skins[spec.id] || {};
      const url = String(cfg.url || "").trim();
      const safeCssUrl = url && !/[()"'\n\r]/.test(url) ? `url("${url}")` : (url ? `url("${url.replace(/"/g, "%22")}")` : "none");
      const opacity = url ? Math.min(1, Math.max(0, Number(cfg.opacity ?? 0.25))) : 0;
      const blur = Math.min(24, Math.max(0, Number(cfg.blur ?? 0)));
      const fit = cfg.fit === "contain" ? "contain" : cfg.fit === "repeat" ? "auto" : "cover";
      const rep = cfg.fit === "repeat" ? "repeat" : "no-repeat";
      el.classList.toggle("has-pane-skin", Boolean(url && opacity > 0));
      el.style.setProperty("--nsc-pane-bg-img", url ? safeCssUrl : "none");
      el.style.setProperty("--nsc-pane-bg-opacity", String(opacity));
      el.style.setProperty("--nsc-pane-bg-blur", `${blur}px`);
      el.style.setProperty("--nsc-pane-bg-size", fit);
      el.style.setProperty("--nsc-pane-bg-repeat", rep);
    }
  }

  function applyChatPrefsToDom() {
    const p = state.chatPrefs || {};
    const root = document.documentElement;
    if (!root) return;
    const lh = Math.min(2.2, Math.max(1.2, Number(p.lineHeight || 1.55)));
    const gap = Math.min(28, Math.max(4, Number(p.msgGap || 12)));
    const mw = Math.min(720, Math.max(220, Number(p.imgMaxW || 480)));
    const mh = Math.min(680, Math.max(160, Number(p.imgMaxH || 320)));
    root.style.setProperty("--nsc-chat-line-height", String(lh));
    root.style.setProperty("--nsc-chat-msg-gap", `${gap}px`);
    root.style.setProperty("--nsc-chat-img-max-w", `${mw}px`);
    root.style.setProperty("--nsc-chat-img-max-h", `${mh}px`);
  }

  // ==========================================================================
  // Module: 03-styles.js
  // ==========================================================================
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
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-browse { color: #a85513; }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-browse.is-active { background: #b8621c; color: #fff; box-shadow: 0 2px 8px rgba(184, 98, 28, 0.25); }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-browse .nsc-nav-badge { background: rgba(184, 98, 28, 0.14); color: #a85513; }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-msg { color: #c2497a; }
      body.nsc-app-active.nsc-theme-dusk .nsc-nav-item.group-msg.is-active { background: linear-gradient(135deg, #d66793, #bf4777); }
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
      .nsc-msg.is-self .nsc-bubble a[href]:not(.nsc-floor-ref):not(.nsc-sn-post):not(.nsc-sd-link),
      .nsc-thread-item.is-self-thread .nsc-thread-content a[href]:not(.nsc-floor-ref):not(.nsc-sn-post):not(.nsc-sd-link) {
        color: #a7f3d0;
        background: rgba(6, 78, 59, 0.28);
        text-decoration-color: rgba(167, 243, 208, 0.70);
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
        overflow-anchor: none;
      }
      .nsc-composer-box,
      .nsc-composer-dock .md-editor {
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
      }
      .nsc-composer-box:focus-within,
      .nsc-composer-dock .md-editor:focus-within {
        border-color: var(--nsc-accent) !important;
        box-shadow: 0 0 0 2.5px var(--nsc-accent-soft) !important;
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
        display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 6px;
        border: 1px solid var(--nsc-border); background: var(--nsc-bg-card);
        color: var(--nsc-text) !important; font-size: 11px; font-weight: 600; text-decoration: none !important;
        cursor: pointer; margin-left: 0;
      }
      .nsc-nodeimage-btn:hover { border-color: var(--nsc-accent); color: var(--nsc-accent) !important; background: var(--nsc-accent-soft); }

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
        padding: 12px 14px; border-radius: 12px; margin-bottom: 12px;
        background: var(--nsc-bg-card); border: 1px solid var(--nsc-border);
      }
      .nsc-checkin-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .nsc-checkin-btn {
        height: 30px; padding: 0 13px; border-radius: 8px; font-size: 12px; font-weight: 600;
        border: 1px solid var(--nsc-border); background: var(--nsc-hover); color: var(--nsc-text);
        cursor: pointer; transition: all 0.13s ease;
      }
      .nsc-checkin-btn:hover:not(:disabled) { border-color: var(--nsc-accent); color: var(--nsc-accent); background: var(--nsc-accent-soft); }
      .nsc-checkin-btn.primary { background: var(--nsc-accent); color: #fff; border-color: transparent; }
      .nsc-checkin-btn.primary:hover:not(:disabled) { filter: brightness(1.07); color: #fff; background: var(--nsc-accent); }
      .nsc-checkin-btn:disabled { opacity: 0.55; cursor: wait; }
      .nsc-checkin-auto-row {
        display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
        width: 100%; padding-top: 10px; margin-top: 2px; border-top: 1px dashed var(--nsc-border);
        font-size: 12px; color: var(--nsc-text);
      }
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
        margin: 8px 0; padding: 12px 14px; border-radius: 14px; box-sizing: border-box;
        background: var(--nsc-bg-card); color: var(--nsc-text); text-align: left;
        border: 1px solid var(--nsc-border);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.045), inset 0 1px 0 rgba(255, 255, 255, 0.35);
        font-family: var(--mac-font);
      }
      body.nsc-app-active.dark-layout .nsc-sd-card,
      body.nsc-app-active.dark-layout .nsc-vote-card {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.06);
      }
      .nsc-sd-card { width: min(100%, 352px); }
      .nsc-vote-card { width: min(100%, 400px); padding: 13px 15px; }
      .nsc-sd-card a,
      .nsc-vote-card a { color: var(--nsc-accent) !important; text-decoration: none; }
      .nsc-sd-card a:hover,
      .nsc-vote-card a:hover { text-decoration: underline; }

      .nsc-sd-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .nsc-sd-peer { display: flex; align-items: center; gap: 9px; min-width: 0; cursor: pointer; }
      .nsc-bubble img.nsc-sd-avatar,
      .nsc-thread-content img.nsc-sd-avatar {
        width: 38px !important; height: 38px !important;
        max-width: 38px !important; max-height: 38px !important;
        margin: 0 !important; border-radius: 10px !important;
        object-fit: cover !important; cursor: pointer !important;
        flex: 0 0 38px; border: 1px solid var(--nsc-border);
      }
      .nsc-sd-peer-info { min-width: 0; }
      .nsc-sd-name-row { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
      .nsc-sd-name {
        font-size: 13px; font-weight: 700; color: var(--nsc-text);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 148px;
      }
      .nsc-sd-tag {
        font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 5px;
        background: rgba(245, 158, 11, 0.14); color: #d97706;
      }
      body.dark-layout .nsc-sd-tag { background: rgba(255, 159, 10, 0.20); color: #ffb340; }
      .nsc-sd-ref { font-size: 11px; color: var(--nsc-muted); margin-top: 2px; }
      .nsc-sd-amount-pill {
        display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px;
        border-radius: 999px; font-size: 13px; font-weight: 700; flex: 0 0 auto;
        background: linear-gradient(135deg, rgba(0, 122, 255, 0.12), rgba(88, 86, 214, 0.14));
        color: var(--nsc-accent); border: 1px solid rgba(0, 122, 255, 0.20);
      }
      .nsc-sd-amount-pill svg { width: 13.5px; height: 13.5px; }
      body.dark-layout .nsc-sd-amount-pill {
        background: linear-gradient(135deg, rgba(10, 132, 255, 0.22), rgba(94, 92, 230, 0.24));
        color: #7cc0ff; border-color: rgba(10, 132, 255, 0.34);
      }
      body.nsc-theme-dusk .nsc-sd-amount-pill {
        background: linear-gradient(135deg, rgba(184, 98, 28, 0.14), rgba(68, 104, 158, 0.14));
        border-color: rgba(184, 98, 28, 0.26);
      }
      .nsc-sd-amount-pill.is-invalid { background: var(--nsc-hover); color: var(--nsc-muted); border-color: var(--nsc-border); }
      .nsc-sd-desc {
        margin-top: 9px; padding: 7px 10px; border-radius: 9px;
        background: var(--nsc-hover); font-size: 12.5px; line-height: 1.48; color: var(--nsc-text);
      }
      .nsc-sd-foot {
        margin-top: 10px; padding-top: 9px; border-top: 1px solid var(--nsc-border);
        display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
      }
      .nsc-sd-status {
        display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap;
        font-size: 11px; color: var(--nsc-muted); min-width: 0;
      }
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

  // ==========================================================================
  // Module: 04-nodeimage.js
  // ==========================================================================
  const NodeImage = {
    getKey() {
      try {
        if (typeof GM_getValue === "function") return GM_getValue("nsc_nodeimage_api_key", "") || "";
      } catch (_) {}
      return localStorage.getItem("nsc_nodeimage_api_key") || "";
    },
    setKey(key) {
      const k = String(key || "").trim();
      try {
        if (typeof GM_setValue === "function") GM_setValue("nsc_nodeimage_api_key", k);
      } catch (_) {}
      try { localStorage.setItem("nsc_nodeimage_api_key", k); } catch (_) {}
      NodeImage.syncDots();
    },
    syncDots() {
      const ok = Boolean(NodeImage.getKey());
      document.querySelectorAll(".nsc-ni-dot").forEach((d) => d.classList.toggle("is-ok", ok));
    },
    gmRequest({ url, method = "GET", data = null, headers = {}, withAuth = false }) {
      return new Promise((resolve, reject) => {
        const key = NodeImage.getKey();
        const hdrs = {
          Accept: "application/json",
          ...(withAuth && key ? { "X-API-Key": key } : {}),
          ...headers,
        };
        if (typeof GM_xmlhttpRequest === "function") {
          GM_xmlhttpRequest({
            method,
            url,
            headers: hdrs,
            data,
            withCredentials: true,
            responseType: "json",
            onload: (resp) => {
              let body = resp.response;
              if (!body && resp.responseText) {
                try { body = JSON.parse(resp.responseText); } catch (_) {}
              }
              if (resp.status >= 200 && resp.status < 300 && body) resolve(body);
              else reject(new Error((body && (body.error || body.message)) || `HTTP ${resp.status}`));
            },
            onerror: () => reject(new Error("网络请求失败")),
          });
        } else {
          fetch(url, { method, headers: hdrs, body: data, credentials: "include" })
            .then((r) => r.json().then((j) => (r.ok ? resolve(j) : reject(new Error(j.error || `HTTP ${r.status}`)))))
            .catch(reject);
        }
      });
    },
    async checkAuth() {
      try {
        const res = await NodeImage.gmRequest({ url: "https://api.nodeimage.com/api/user/api-key" });
        if (res && res.api_key) {
          NodeImage.setKey(res.api_key);
          return res.api_key;
        }
      } catch (_) {}
      return "";
    },
    async uploadFile(file) {
      if (!NodeImage.getKey()) {
        await NodeImage.checkAuth();
      }
      if (!NodeImage.getKey()) {
        throw new Error("未关联 NodeImage 授权，请点击下方「图床」完成授权");
      }
      const fd = new FormData();
      fd.append("image", file);
      const res = await NodeImage.gmRequest({
        url: "https://api.nodeimage.com/api/upload",
        method: "POST",
        data: fd,
        withAuth: true,
      });
      if (res && res.success && res.links) {
        return res.links.markdown || `![image](${res.links.direct})`;
      }
      throw new Error((res && res.error) || "上传失败");
    },
    async listImages() {
      const res = await NodeImage.gmRequest({
        url: "https://api.nodeimage.com/api/v1/list",
        method: "GET",
        withAuth: true,
      });
      return (res && res.success && Array.isArray(res.images)) ? res.images : [];
    },
    async deleteImage(imageId) {
      const res = await NodeImage.gmRequest({
        url: `https://api.nodeimage.com/api/v1/delete/${encodeURIComponent(imageId)}`,
        method: "DELETE",
        withAuth: true,
      });
      return Boolean(res && res.success);
    },
    insertToTarget(targetMode, markdown) {
      const smartWrapTa = (ta) => {
        const s = ta.selectionStart || 0;
        const e = ta.selectionEnd || 0;
        const before = ta.value.slice(0, s);
        const prefix = before.length > 0 && !before.endsWith("\n") ? "\n" : "";
        const text = `${prefix}${markdown}\n`;
        ta.setRangeText(text, s, e, "end");
        ta.dispatchEvent(new Event("input", { bubbles: true }));
        ta.focus({ preventScroll: true });
      };
      if (targetMode === "newpost") {
        const ta = document.getElementById("nsc-np-content");
        if (ta) smartWrapTa(ta);
        return;
      }
      if (targetMode === "edit") {
        const ta = document.getElementById("nsc-edit-content");
        if (ta) smartWrapTa(ta);
        return;
      }
      const pmBox = document.getElementById("nsc-pm-composer");
      if (targetMode === "pm" || (pmBox && pmBox.style.display !== "none")) {
        const ta = document.getElementById("nsc-pm-ta");
        if (ta) smartWrapTa(ta);
        return;
      }
      const pageWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
      const cmEl =
        (pageWin.document && pageWin.document.querySelector("#nsc-composer-body .md-editor .CodeMirror")) ||
        document.querySelector("#nsc-composer-body .md-editor .CodeMirror");
      if (cmEl && cmEl.offsetParent !== null) {
        const cm = cmEl.CodeMirror || (cmEl.wrappedJSObject && cmEl.wrappedJSObject.CodeMirror);
        if (cm && typeof cm.replaceSelection === "function") {
          const cur = cm.getCursor();
          const lineTxt = cm.getLine(cur.line) || "";
          const prefix = cur.ch > 0 && lineTxt.slice(0, cur.ch).trim() !== "" ? "\n" : "";
          cm.replaceSelection(`${prefix}${markdown}\n`);
          cm.focus();
          return;
        }
        const cmTa = cmEl.querySelector("textarea");
        if (cmTa) {
          cmTa.focus({ preventScroll: true });
          try {
            if (document.execCommand("insertText", false, `${markdown}\n`)) return;
          } catch (_) {}
          smartWrapTa(cmTa);
          return;
        }
      }
      const ta = document.getElementById("nsc-fallback-ta");
      if (ta) smartWrapTa(ta);
    },
    bindPasteAndDrop(containerEl, targetMode, statusSelector) {
      if (!containerEl || containerEl.dataset.nscNiBound === "1") return;
      containerEl.dataset.nscNiBound = "1";
      const resolveMode = () => {
        if (targetMode === "chat") {
          const pmBox = document.getElementById("nsc-pm-composer");
          if (pmBox && pmBox.style.display !== "none") return "pm";
        }
        return targetMode;
      };
      const getStatusEl = (effMode) => {
        if (effMode === "pm") return document.getElementById("nsc-pm-status");
        if (effMode === "newpost") return document.getElementById("nsc-np-status");
        if (effMode === "edit") return document.getElementById("nsc-edit-status");
        return (
          (statusSelector && document.querySelector(statusSelector)) ||
          document.getElementById("nsc-composer-status") ||
          document.querySelector("#nsc-composer-body .nsc-ni-status")
        );
      };
      const handleFiles = async (files) => {
        const imgs = Array.from(files || []).filter((f) => f && f.type && f.type.startsWith("image/"));
        if (imgs.length === 0) return false;
        const effMode = resolveMode();
        const statusEl = getStatusEl(effMode);
        for (const f of imgs) {
          if (statusEl) statusEl.textContent = "正在上传图片到 NodeImage...";
          try {
            const md = await NodeImage.uploadFile(f);
            NodeImage.insertToTarget(effMode, md);
            if (statusEl) statusEl.textContent = "图片已上传并插入";
          } catch (err) {
            if (statusEl) statusEl.textContent = err.message;
            openNodeImageModal(effMode);
            break;
          }
        }
        return true;
      };
      containerEl.addEventListener("paste", (e) => {
        const cd = e.clipboardData;
        if (!cd) return;
        const files = [];
        if (cd.files && cd.files.length > 0) {
          for (const f of cd.files) {
            if (f && f.type && f.type.startsWith("image/")) files.push(f);
          }
        }
        if (files.length === 0 && cd.items) {
          for (const it of cd.items) {
            if (it.kind === "file" && it.type && it.type.startsWith("image/")) {
              const f = it.getAsFile();
              if (f) files.push(f);
            }
          }
        }
        if (files.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          handleFiles(files);
        }
      }, true);
      containerEl.addEventListener("drop", (e) => {
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && Array.from(files).some((f) => f.type && f.type.startsWith("image/"))) {
          e.preventDefault();
          e.stopPropagation();
          handleFiles(files);
        }
      }, true);
    },
  };

  let niBackdrop = null;
  let niTargetMode = "chat";
  let niFileInput = null;

  function openNodeImageModal(targetMode = "chat") {
    niTargetMode = targetMode;
    if (!niBackdrop) {
      niBackdrop = document.createElement("div");
      niBackdrop.id = "nsc-ni-backdrop";
      niBackdrop.innerHTML = `
        <div class="nsc-ni-modal" role="dialog" aria-label="NodeImage 图床关联与上传">
          <div class="nsc-newpost-head">
            <span style="font-size:14px;font-weight:700;">NodeImage 图床 · 授权与传图</span>
            <button type="button" id="nsc-ni-close" style="border:none;background:transparent;color:var(--nsc-muted);font-size:16px;cursor:pointer;">✕</button>
          </div>
          <div class="nsc-newpost-body" style="gap:10px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:8px 10px;border-radius:10px;background:var(--nsc-hover);">
              <div style="font-size:12px;">
                状态：<strong id="nsc-ni-auth-state">检测中...</strong>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <button type="button" class="nsc-mini-btn" id="nsc-ni-detect">自动检测授权</button>
                <a class="nsc-mini-btn" href="https://www.nodeimage.com/" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">去 NodeImage 登录授权 ↗</a>
              </div>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="password" id="nsc-ni-key-input" class="nsc-search-input" placeholder="或直接粘贴 NodeImage API Key..." style="flex:1;" />
              <button type="button" class="nsc-mini-btn" id="nsc-ni-save-key">保存 Key</button>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
              <div style="display:flex;gap:6px;">
                <button type="button" class="nsc-newpost-btn" id="nsc-ni-pick-btn">选择图片上传</button>
                <button type="button" class="nsc-mini-btn" id="nsc-ni-load-list">加载我的图床</button>
              </div>
              <span id="nsc-ni-tip" style="font-size:11px;color:var(--nsc-muted);">授权后支持在任意编辑框 Ctrl+V 粘贴图片直传</span>
            </div>
            <div class="nsc-ni-grid" id="nsc-ni-grid"></div>
          </div>
        </div>
      `;
      document.body.appendChild(niBackdrop);
      niFileInput = document.createElement("input");
      niFileInput.type = "file";
      niFileInput.accept = "image/*";
      niFileInput.multiple = true;
      niFileInput.style.display = "none";
      document.body.appendChild(niFileInput);

      const closeNi = () => niBackdrop.classList.remove("is-open");
      niBackdrop.addEventListener("click", (e) => { if (e.target === niBackdrop) closeNi(); });
      niBackdrop.querySelector("#nsc-ni-close").addEventListener("click", closeNi);

      const refreshAuthUi = () => {
        const k = NodeImage.getKey();
        const stEl = niBackdrop.querySelector("#nsc-ni-auth-state");
        const inp = niBackdrop.querySelector("#nsc-ni-key-input");
        if (stEl) {
          stEl.textContent = k ? "已关联授权（支持 Ctrl+V 粘贴上传）" : "未授权（请先登录 NodeImage 后点自动检测）";
          stEl.style.color = k ? "var(--nsc-green)" : "#ff3b30";
        }
        if (inp && k && !inp.value) inp.value = k;
        NodeImage.syncDots();
      };

      niBackdrop.querySelector("#nsc-ni-detect").addEventListener("click", async () => {
        const tip = niBackdrop.querySelector("#nsc-ni-tip");
        if (tip) tip.textContent = "正在连接 api.nodeimage.com 获取授权...";
        const k = await NodeImage.checkAuth();
        refreshAuthUi();
        if (tip) tip.textContent = k ? "授权关联成功！" : "未检测到登录态，请先点击「去 NodeImage 登录授权」完成关联";
      });

      niBackdrop.querySelector("#nsc-ni-save-key").addEventListener("click", () => {
        const val = niBackdrop.querySelector("#nsc-ni-key-input").value.trim();
        NodeImage.setKey(val);
        refreshAuthUi();
      });

      niBackdrop.querySelector("#nsc-ni-pick-btn").addEventListener("click", () => niFileInput.click());
      niFileInput.addEventListener("change", async () => {
        const files = Array.from(niFileInput.files || []);
        niFileInput.value = "";
        if (files.length === 0) return;
        const tip = niBackdrop.querySelector("#nsc-ni-tip");
        for (const f of files) {
          if (tip) tip.textContent = `正在上传 ${f.name}...`;
          try {
            const md = await NodeImage.uploadFile(f);
            NodeImage.insertToTarget(niTargetMode, md);
            if (tip) tip.textContent = "上传并插入成功！";
            closeNi();
          } catch (err) {
            if (tip) tip.textContent = "上传失败: " + err.message;
          }
        }
      });

      niBackdrop.querySelector("#nsc-ni-load-list").addEventListener("click", async () => {
        const grid = niBackdrop.querySelector("#nsc-ni-grid");
        const tip = niBackdrop.querySelector("#nsc-ni-tip");
        grid.innerHTML = `<div style="padding:12px;font-size:12px;color:var(--nsc-muted);">加载中...</div>`;
        try {
          const imgs = await NodeImage.listImages();
          grid.innerHTML = "";
          if (imgs.length === 0) {
            grid.innerHTML = `<div style="padding:12px;font-size:12px;color:var(--nsc-muted);">暂无已上传图片</div>`;
            return;
          }
          const sliced = imgs.slice(0, 30);
          const galleryUrls = sliced.map((im) => (im.links && im.links.direct) || im.url || `https://cdn.nodeimage.com/i/${im.image_id}.png`);
          for (const im of sliced) {
            const directUrl = (im.links && im.links.direct) || im.url || `https://cdn.nodeimage.com/i/${im.image_id}.png`;
            const md = (im.links && im.links.markdown) || `![image](${directUrl})`;
            const card = document.createElement("div");
            card.className = "nsc-ni-card";
            card.innerHTML = `
              <img src="${directUrl}" loading="lazy" title="点击插入到编辑器" />
              <div class="nsc-ni-card-ops">
                <button type="button" class="nsc-mini-btn" style="padding:2px 8px;font-size:11px;">插入</button>
                <div style="display:inline-flex;gap:4px;">
                  <button type="button" class="nsc-mini-btn" style="padding:2px 6px;font-size:11px;" title="放大查看">看图</button>
                  <button type="button" class="nsc-mini-btn" style="padding:2px 6px;font-size:11px;color:#ff3b30;">删除</button>
                </div>
              </div>
            `;
            const insFn = () => { NodeImage.insertToTarget(niTargetMode, md); closeNi(); };
            const niImg = card.querySelector("img");
            niImg.addEventListener("click", insFn);
            card.querySelectorAll("button")[0].addEventListener("click", insFn);
            card.querySelectorAll("button")[1].addEventListener("click", () => {
              if (typeof openLightbox === "function") openLightbox(directUrl, galleryUrls);
            });
            card.querySelectorAll("button")[2].addEventListener("click", async () => {
              if (!im.image_id) return;
              await NodeImage.deleteImage(im.image_id);
              card.remove();
            });
            grid.appendChild(card);
          }
          if (tip) tip.textContent = `已加载 ${imgs.length} 张图片，点击即可插入`;
        } catch (err) {
          grid.innerHTML = `<div style="padding:12px;font-size:12px;color:#ff3b30;">加载失败: ${err.message}</div>`;
        }
      });
    }

    const stEl = niBackdrop.querySelector("#nsc-ni-auth-state");
    const k = NodeImage.getKey();
    if (stEl) {
      stEl.textContent = k ? "已关联授权（支持 Ctrl+V 粘贴上传）" : "未授权（正在检测登录态...）";
      stEl.style.color = k ? "var(--nsc-green)" : "#ff3b30";
    }
    NodeImage.syncDots();
    niBackdrop.classList.add("is-open");
    const gridEl = niBackdrop.querySelector("#nsc-ni-grid");
    if (k && gridEl && !gridEl.hasChildNodes()) {
      niBackdrop.querySelector("#nsc-ni-load-list").click();
    }
    if (!k) {
      NodeImage.checkAuth().then((newK) => {
        if (newK && stEl) {
          stEl.textContent = "已关联授权（支持 Ctrl+V 粘贴上传）";
          stEl.style.color = "var(--nsc-green)";
          const inp = niBackdrop.querySelector("#nsc-ni-key-input");
          if (inp) inp.value = newK;
        }
      });
    }
  }

  function initNodeImageUi(npBackdropEl) {
    if (!NodeImage.getKey()) {
      NodeImage.checkAuth();
    } else {
      NodeImage.syncDots();
    }
    if (npBackdropEl) {
      const npBtn = npBackdropEl.querySelector('[data-ni-btn="newpost"]');
      if (npBtn) npBtn.addEventListener("click", () => openNodeImageModal("newpost"));
      NodeImage.bindPasteAndDrop(npBackdropEl.querySelector("#nsc-np-content"), "newpost", "#nsc-np-status");
    }
    const dock = document.getElementById("nsc-composer-dock");
    if (dock) NodeImage.bindPasteAndDrop(dock, "chat", "#nsc-composer-status");
  }

  // ==========================================================================
  // Module: 05-shell-composer.js
  // ==========================================================================
  function buildMarkdownToolbarHtml({ id = "", expBtnId = "", niTarget = "", includeList = false } = {}) {
    return `
      <div class="nsc-mde-toolbar"${id ? ` id="${id}"` : ""}>
        <button type="button" class="nsc-mde-btn" data-wrap="**" title="加粗">B</button>
        <button type="button" class="nsc-mde-btn" data-wrap="*" title="斜体">I</button>
        <button type="button" class="nsc-mde-btn" data-wrap="~~" title="删除线">S</button>
        <button type="button" class="nsc-mde-btn" data-prefix="> " title="引用">"</button>
        <button type="button" class="nsc-mde-btn" data-wrap="\`" title="行内代码">&lt;/&gt;</button>
        <button type="button" class="nsc-mde-btn" data-tpl="\`\`\`\n\n\`\`\`" title="代码块">{ }</button>
        ${includeList ? `<button type="button" class="nsc-mde-btn" data-prefix="- " title="列表">•</button>` : ""}
        <button type="button" class="nsc-mde-btn" data-tpl="[链接文字](https://)" title="链接">🔗</button>
        <button type="button" class="nsc-mde-btn" data-tpl="![](https://)" title="图片">🖼</button>
        ${expBtnId ? `<button type="button" class="nsc-mde-btn" id="${expBtnId}" title="插入贴图表情">${ICONS.smile}</button>` : ""}
        ${niTarget ? `<button type="button" class="nsc-nodeimage-btn" data-ni-btn="${niTarget}" title="NodeImage 图床上传/管理" style="margin-left:auto;"><span class="nsc-ni-dot"></span>图床</button>` : ""}
      </div>
    `;
  }

  function bindMarkdownToolbar(toolbarEl, textareaEl) {
    if (!toolbarEl || !textareaEl) return;
    toolbarEl.querySelectorAll(".nsc-mde-btn[data-wrap], .nsc-mde-btn[data-prefix], .nsc-mde-btn[data-tpl]").forEach((b) => {
      b.addEventListener("click", () => {
        const s = textareaEl.selectionStart || 0;
        const e = textareaEl.selectionEnd || 0;
        const sel = textareaEl.value.slice(s, e);
        let ins = "";
        if (b.dataset.wrap) ins = `${b.dataset.wrap}${sel || "文本"}${b.dataset.wrap}`;
        else if (b.dataset.prefix) ins = `${b.dataset.prefix}${sel}`;
        else if (b.dataset.tpl) ins = b.dataset.tpl;
        textareaEl.setRangeText(ins, s, e, "end");
        textareaEl.dispatchEvent(new Event("input", { bubbles: true }));
        textareaEl.focus({ preventScroll: true });
      });
    });
  }

  function ensureHeaderSwitch() {
    const head = document.getElementById("nsk-head");
    if (!head || document.getElementById("nsc-mode-switch-btn")) return;

    const btn = document.createElement("button");
    btn.id = "nsc-mode-switch-btn";
    btn.type = "button";
    const syncLabel = () => {
      if (!isForumBrowseRoute()) {
        btn.textContent = "返回群聊";
      } else {
        btn.textContent = state.enabled ? "群聊模式" : "原版论坛";
      }
    };
    syncLabel();

    btn.addEventListener("click", () => {
      if (!isForumBrowseRoute()) {
        state.enabled = true;
        localStorage.setItem(LS.ENABLED, "1");
        location.href = "/";
        return;
      }
      state.enabled = !state.enabled;
      localStorage.setItem(LS.ENABLED, state.enabled ? "1" : "0");
      syncLabel();
      toggleAppMode(state.enabled);
    });

    const colorBtn = head.querySelector(".color-theme-switcher");
    if (colorBtn && colorBtn.parentNode) {
      colorBtn.parentNode.insertBefore(btn, colorBtn);
    } else {
      head.appendChild(btn);
    }
  }

  function getEffectiveThemeMode() {
    if (state.themeMode && state.themeMode !== "auto") return state.themeMode;
    return document.body.classList.contains("dark-layout") ? "dark" : "light";
  }

  function syncThemeButtons() {
    const cur = getEffectiveThemeMode();
    document.querySelectorAll("#nsc-theme-seg .nsc-theme-btn").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.theme === cur);
    });
  }

  function applyThemeMode(mode) {
    const targetMode = String(mode || "auto");
    state.themeMode = targetMode;
    localStorage.setItem(LS.THEME, targetMode);
    const headThemeBtn = document.querySelector("#nsk-head .color-theme-switcher");
    const isDark = document.body.classList.contains("dark-layout");
    const regTheme = (state.registry.themes || []).find((t) => t.id === targetMode);
    const effId = targetMode === "auto" ? (isDark ? "dark" : "light") : targetMode;

    document.body.dataset.nscTheme = effId;
    document.body.classList.toggle("nsc-theme-dusk", effId === "dusk");

    const wantDark = regTheme ? regTheme.baseScheme === "dark" : effId === "dark";
    if (targetMode !== "auto" && wantDark !== isDark) {
      state._suppressThemeObsUntil = Date.now() + 260;
      if (headThemeBtn) headThemeBtn.click();
      else {
        document.body.classList.toggle("dark-layout", wantDark);
        document.body.classList.toggle("light-layout", !wantDark);
      }
    }
    syncThemeButtons();
    if (typeof renderUserHubIfOpen === "function" && state.hubTab === "workbench") {
      renderUserHubIfOpen();
    }
  }

  function openWorkbenchBase(section = "theme") {
    state.workbenchSection = section || "theme";
    if (typeof openUserHubModal === "function") openUserHubModal("workbench");
  }

  function renderRightTabs() {
    const host = document.getElementById("nsc-right-tabs");
    if (!host) return;
    const tabs = getOrderedRightTabs(false);
    if (tabs.length > 0 && !tabs.some((t) => t.id === state.rightTab)) {
      state.rightTab = tabs[0].id;
      localStorage.setItem(LS.RIGHT_TAB, state.rightTab);
    }
    host.innerHTML = tabs
      .map((t) => `<button type="button" class="nsc-right-tab ${state.rightTab === t.id ? "is-active" : ""}" data-rtab="${escHtml(t.id)}">${escHtml(t.name)}</button>`)
      .join("");
    host.querySelectorAll(".nsc-right-tab").forEach((b) => {
      b.addEventListener("click", () => {
        state.rightTab = b.dataset.rtab;
        localStorage.setItem(LS.RIGHT_TAB, state.rightTab);
        host.querySelectorAll(".nsc-right-tab").forEach((x) => x.classList.toggle("is-active", x === b));
        if (state.rightTab === "hot" && !state.hotCache[state.hotTab] && !state.hotLoading) {
          fetchHotPosts(state.hotTab);
        } else if (state.rightTab === "friends" && !state.followData.loaded && !state.followData.loading) {
          fetchFansOrFollow("follow");
        } else if (state.rightTab === "fans" && !state.fansData.loaded && !state.fansData.loading) {
          fetchFansOrFollow("fans");
        } else if (state.rightTab === "blacklist" && !state.blockListState.loaded && !state.blockListState.loading) {
          fetchServerBlockList(false);
        } else {
          renderRightBody();
        }
      });
    });
  }

  function buildShellIfNeeded() {
    if (state.shellBuilt) return;
    state.shellBuilt = true;

    const shell = document.createElement("div");
    shell.id = "nsc-app-shell";
    shell.innerHTML = `
      <nav class="nsc-pane-nav">
        <div class="nsc-mac-traffic">
          <div class="nsc-mac-dots" aria-hidden="true">
            <span class="nsc-mac-dot red"></span>
            <span class="nsc-mac-dot yellow"></span>
            <span class="nsc-mac-dot green"></span>
          </div>
          <div class="nsc-theme-seg" id="nsc-theme-seg" title="切换外观模式">
            <button type="button" class="nsc-theme-btn" data-theme="light" title="浅色模式">${ICONS.sun}</button>
            <button type="button" class="nsc-theme-btn" data-theme="dusk" title="黄昏护眼模式">${ICONS.dusk}</button>
            <button type="button" class="nsc-theme-btn" data-theme="dark" title="macOS 暗黑模式">${ICONS.moon}</button>
          </div>
        </div>
        <div id="nsc-pane-nav" class="nsc-nav-main"></div>
        <div class="nsc-nav-bottom" id="nsc-nav-footer">
          <div class="nsc-nav-divider"></div>
          <a class="nsc-nav-item group-admin" id="nsc-nf-ruling" href="/ruling" target="_blank" rel="noopener noreferrer" title="管理记录">
            <span class="nsc-nav-left">${ICONS.ruling}<span>管理</span></span>
          </a>
          <a class="nsc-nav-item group-admin" id="nsc-nf-partner" href="/categories/promotion" target="_blank" rel="noopener noreferrer" title="合作商家">
            <span class="nsc-nav-left">${ICONS.partner}<span>商家</span></span>
          </a>
          <a class="nsc-nav-item group-admin" id="nsc-nf-links" href="/award" target="_blank" rel="noopener noreferrer" title="友站链接">
            <span class="nsc-nav-left">${ICONS.links}<span>友链</span></span>
          </a>
          <button type="button" class="nsc-nav-item nsc-update-btn" id="nsc-update-btn" title="检查脚本更新">
            <span class="nsc-nav-left">${ICONS.update}<span>检查更新</span></span>
          </button>
        </div>
      </nav>

      <aside class="nsc-pane-list">
        <div class="nsc-list-head">
          <div class="nsc-list-title-row">
            <span id="nsc-channel-title">首页</span>
            <div style="display:inline-flex;align-items:center;gap:6px;">
              <span id="nsc-channel-sub" style="font-size:11px;color:var(--nsc-muted);font-weight:500;"></span>
              <button type="button" class="nsc-newpost-btn" id="nsc-newpost-open-btn" title="发布新主题帖">+ 发帖</button>
            </div>
          </div>
          <input type="text" class="nsc-search-input" id="nsc-feed-search" placeholder="搜索当前列表标题或作者..." />
          <div class="nsc-list-toolbar" id="nsc-list-toolbar"></div>
        </div>
        <div class="nsc-topic-scroll" id="nsc-topic-scroll"></div>
      </aside>

      <main class="nsc-pane-chat">
        <div class="nsc-chat-header">
          <div class="nsc-chat-title-row">
            <div class="nsc-chat-title" id="nsc-chat-title">NodeSeek 群聊阅读</div>
            <span class="nsc-chat-copy-tip" id="nsc-chat-copy-tip">已复制链接</span>
          </div>
          <div class="nsc-chat-meta-bar">
            <div class="nsc-chat-subtitle" id="nsc-chat-subtitle">点击左侧帖子主题开始阅读</div>
            <div class="nsc-chat-actions" id="nsc-chat-actions"></div>
          </div>
        </div>
        <div class="nsc-chat-messages" id="nsc-chat-messages">
          <div class="nsc-empty-state">点击左侧任意版块与帖子主题，即可在中间窗口阅读与讨论</div>
        </div>
        <div class="nsc-composer-dock" id="nsc-composer-dock">
          <div id="nsc-composer-body"></div>
        </div>
      </main>

      <aside class="nsc-pane-right">
        <div class="nsc-right-user" id="nsc-right-user"></div>
        <div class="nsc-right-quickbar" id="nsc-right-quickbar">
          <button type="button" class="nsc-quick-btn is-primary" id="nsc-qb-post" title="发布新主题帖">+ 发帖</button>
          <button type="button" class="nsc-quick-btn" id="nsc-qb-checkin" title="每日签到与自动签到设置">签到</button>
          <a class="nsc-quick-btn" id="nsc-qb-lucky" href="/lucky" target="_blank" rel="noopener noreferrer" title="幸运抽奖">抽奖</a>
          <a class="nsc-quick-btn" id="nsc-qb-invite" href="/invite" target="_blank" rel="noopener noreferrer" title="邀请好友">邀请</a>
        </div>
        <div class="nsc-right-tabs" id="nsc-right-tabs"></div>
        <div class="nsc-right-scroll" id="nsc-right-scroll"></div>
      </aside>
    `;

    const frame = document.getElementById("nsk-frame");
    document.body.insertBefore(shell, frame);

    const lightbox = document.createElement("div");
    lightbox.id = "nsc-lightbox";
    lightbox.innerHTML = `
      <div id="nsc-lb-top-badge" class="nsc-lb-top-badge"></div>
      <div class="nsc-lightbox-stage" id="nsc-lb-stage">
        <button type="button" id="nsc-lb-prev" class="nsc-lb-nav prev" title="上一张 (←)">‹</button>
        <div class="nsc-lb-frame" id="nsc-lb-frame">
          <img id="nsc-lightbox-img" src="" alt="原图" />
        </div>
        <button type="button" id="nsc-lb-next" class="nsc-lb-nav next" title="下一张 (→)">›</button>
      </div>
      <div class="nsc-lightbox-bar">
        <button type="button" id="nsc-lb-bar-prev" class="nsc-lightbox-btn">‹ 上一张</button>
        <span id="nsc-lb-count" class="nsc-lightbox-count"></span>
        <button type="button" id="nsc-lb-bar-next" class="nsc-lightbox-btn">下一张 ›</button>
        <button type="button" id="nsc-lb-zoom" class="nsc-lightbox-btn" title="点击重置适应窗口">100%</button>
        <button type="button" id="nsc-lb-orig" class="nsc-lightbox-btn" title="按原图 1:1 真实像素查看并可拖拽">原图 1:1</button>
        <button type="button" id="nsc-lb-copy" class="nsc-lightbox-btn">复制链接</button>
        <a id="nsc-lightbox-raw" class="nsc-lightbox-btn" href="" target="_blank" rel="noopener noreferrer">新窗口打开原图</a>
        <button type="button" id="nsc-lightbox-close" class="nsc-lightbox-btn">关闭 (Esc)</button>
      </div>
    `;
    const lbImg = lightbox.querySelector("#nsc-lightbox-img");
    const lbStage = lightbox.querySelector("#nsc-lb-stage");
    const lbFrame = lightbox.querySelector("#nsc-lb-frame");
    const getFitScale = () => {
      const nw = lbImg.naturalWidth || 0;
      const nh = lbImg.naturalHeight || 0;
      if (!nw || !nh) return 1;
      const sr = lbStage.getBoundingClientRect();
      const maxW = Math.max(200, (sr.width || window.innerWidth) - 136);
      const maxH = Math.max(200, (sr.height || window.innerHeight - 110) - 8);
      return Math.min(1, maxW / nw, maxH / nh);
    };
    const applyLbTransform = () => {
      const nw = lbImg.naturalWidth || 0;
      const nh = lbImg.naturalHeight || 0;
      const fitScale = getFitScale();
      const zBtn = document.getElementById("nsc-lb-zoom");
      const origBtn = document.getElementById("nsc-lb-orig");

      if (_lbZoomMode === "fit" || !nw || !nh) {
        _lbScale = fitScale;
        _lbTx = 0;
        _lbTy = 0;
        lbImg.classList.remove("is-zoomed-raw", "is-pannable");
        if (lbFrame) lbFrame.classList.remove("is-zoomed");
        lbImg.style.width = "";
        lbImg.style.height = "";
        lbImg.style.transform = "";
        lbImg.style.setProperty("cursor", "zoom-in", "important");
        if (zBtn) zBtn.textContent = `${nw > 0 ? Math.round(fitScale * 100) : 100}%`;
        if (origBtn) {
          origBtn.classList.remove("is-active");
          origBtn.textContent = "原图 1:1";
        }
        return;
      }

      const targetW = Math.max(24, Math.round(nw * _lbScale));
      const targetH = Math.max(24, Math.round(nh * _lbScale));
      lbImg.classList.add("is-zoomed-raw");
      if (lbFrame) lbFrame.classList.add("is-zoomed");
      lbImg.style.width = `${targetW}px`;
      lbImg.style.height = `${targetH}px`;

      const sr = lbStage.getBoundingClientRect();
      const canPan = targetW > (sr.width - 12) || targetH > (sr.height - 12) || _lbScale > fitScale + 0.02;
      lbImg.classList.toggle("is-pannable", canPan);
      lbImg.style.transform = `translate3d(${_lbTx}px, ${_lbTy}px, 0)`;
      lbImg.style.setProperty("cursor", canPan ? (_lbDragging ? "grabbing" : "grab") : "zoom-out", "important");
      if (zBtn) zBtn.textContent = `${Math.round(_lbScale * 100)}%`;
      if (origBtn) {
        const isOrig = Math.abs(_lbScale - 1) < 0.02;
        origBtn.classList.toggle("is-active", isOrig);
        origBtn.textContent = isOrig ? "适应窗口" : "原图 1:1";
      }
    };
    _applyLbTransform = applyLbTransform;
    lbImg.addEventListener("load", () => {
      if (lightbox.classList.contains("is-open")) applyLbTransform();
    });
    window.addEventListener("resize", () => {
      if (lightbox.classList.contains("is-open") && _lbZoomMode === "fit") applyLbTransform();
    });

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox || e.target === lbStage || e.target.id === "nsc-lightbox-close") {
        lightbox.classList.remove("is-open");
      }
    });
    lbStage.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (!lbImg.naturalWidth) return;
      const fitScale = getFitScale();
      const baseScale = _lbZoomMode === "fit" ? fitScale : _lbScale;
      const factor = e.deltaY < 0 ? 1.16 : 1 / 1.16;
      const minScale = Math.min(0.25, fitScale);
      const next = Math.min(5, Math.max(minScale, Number((baseScale * factor).toFixed(3))));
      if (e.deltaY > 0 && next <= fitScale + 0.015) {
        _lbZoomMode = "fit";
        _lbTx = 0;
        _lbTy = 0;
      } else {
        _lbZoomMode = Math.abs(next - 1) < 0.02 ? "orig" : "custom";
        _lbScale = next;
      }
      applyLbTransform();
    }, { passive: false });

    lbImg.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      _lbDragging = true;
      _lbMoved = false;
      _lbStartX = e.clientX - _lbTx;
      _lbStartY = e.clientY - _lbTy;
      applyLbTransform();
    });
    window.addEventListener("mousemove", (e) => {
      if (!_lbDragging) return;
      const nx = e.clientX - _lbStartX;
      const ny = e.clientY - _lbStartY;
      if (Math.abs(nx - _lbTx) > 3 || Math.abs(ny - _lbTy) > 3) _lbMoved = true;
      if (lbImg.classList.contains("is-pannable")) {
        _lbTx = nx;
        _lbTy = ny;
        applyLbTransform();
      }
    });
    window.addEventListener("mouseup", () => {
      if (_lbDragging) {
        _lbDragging = false;
        applyLbTransform();
      }
    });
    lbImg.addEventListener("click", (e) => {
      e.stopPropagation();
      if (_lbMoved) return;
      if (_lbZoomMode !== "fit") {
        _lbZoomMode = "fit";
        _lbTx = 0;
        _lbTy = 0;
      } else {
        const fitScale = getFitScale();
        if (fitScale < 0.95) {
          _lbZoomMode = "orig";
          _lbScale = 1;
        } else {
          _lbZoomMode = "custom";
          _lbScale = 2;
        }
        _lbTx = 0;
        _lbTy = 0;
      }
      applyLbTransform();
    });
    lightbox.querySelector("#nsc-lb-zoom").addEventListener("click", (e) => {
      e.stopPropagation();
      _lbZoomMode = "fit";
      _lbTx = 0;
      _lbTy = 0;
      applyLbTransform();
    });
    lightbox.querySelector("#nsc-lb-orig").addEventListener("click", (e) => {
      e.stopPropagation();
      if (_lbZoomMode !== "fit" && Math.abs(_lbScale - 1) < 0.02) {
        _lbZoomMode = "fit";
      } else {
        _lbZoomMode = "orig";
        _lbScale = 1;
      }
      _lbTx = 0;
      _lbTy = 0;
      applyLbTransform();
    });
    lightbox.querySelector("#nsc-lb-prev").addEventListener("click", (e) => {
      e.stopPropagation();
      stepLightbox(-1);
    });
    lightbox.querySelector("#nsc-lb-next").addEventListener("click", (e) => {
      e.stopPropagation();
      stepLightbox(1);
    });
    lightbox.querySelector("#nsc-lb-bar-prev").addEventListener("click", (e) => {
      e.stopPropagation();
      stepLightbox(-1);
    });
    lightbox.querySelector("#nsc-lb-bar-next").addEventListener("click", (e) => {
      e.stopPropagation();
      stepLightbox(1);
    });
    lightbox.querySelector("#nsc-lb-copy").addEventListener("click", (e) => {
      e.stopPropagation();
      const src = lbImg.getAttribute("src") || "";
      if (src && navigator.clipboard) {
        navigator.clipboard.writeText(src).then(() => {
          e.target.textContent = "已复制";
          setTimeout(() => { e.target.textContent = "复制链接"; }, 1200);
        }).catch(() => {});
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        lightbox.classList.remove("is-open");
        backdrop.classList.remove("is-open");
        npBackdrop.classList.remove("is-open");
        const editBd = document.getElementById("nsc-edit-backdrop");
        if (editBd) editBd.classList.remove("is-open");
        const hubBd = document.getElementById("nsc-hub-backdrop");
        if (hubBd) hubBd.classList.remove("is-open");
        if (niBackdrop) niBackdrop.classList.remove("is-open");
      } else if (lightbox.classList.contains("is-open")) {
        if (e.key === "ArrowLeft") stepLightbox(-1);
        else if (e.key === "ArrowRight") stepLightbox(1);
      }
    });
    document.body.appendChild(lightbox);

    const backdrop = document.createElement("div");
    backdrop.id = "nsc-profile-backdrop";
    backdrop.innerHTML = `<div class="nsc-profile-modal" id="nsc-profile-modal"></div>`;
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.classList.remove("is-open");
    });
    document.body.appendChild(backdrop);

    const npBackdrop = document.createElement("div");
    npBackdrop.id = "nsc-newpost-backdrop";
    const postableChannels = CHANNELS.filter((c) => c.path.startsWith("/categories/"));
    npBackdrop.innerHTML = `
      <div class="nsc-newpost-modal" role="dialog" aria-label="发表新主题">
        <div class="nsc-newpost-head">
          <span style="font-size:14.5px;font-weight:700;">发表新主题</span>
          <div style="display:flex;align-items:center;gap:10px;">
            <a id="nsc-np-native-link" href="/new-discussion?category=daily" style="font-size:12px;color:var(--nsc-accent);text-decoration:none;font-weight:600;">原版编辑器 ↗</a>
            <button type="button" id="nsc-np-close" style="border:none;background:transparent;color:var(--nsc-muted);font-size:16px;cursor:pointer;padding:0 4px;">✕</button>
          </div>
        </div>
        <div class="nsc-newpost-body">
          <div class="nsc-newpost-row">
            <select class="nsc-newpost-select" id="nsc-np-cat">
              ${postableChannels.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}
            </select>
            <input type="text" class="nsc-newpost-title" id="nsc-np-title" placeholder="请输入帖子标题..." />
          </div>
          <div class="nsc-newpost-editor">
            ${buildMarkdownToolbarHtml({ id: "nsc-np-toolbar", expBtnId: "nsc-np-exp-btn", niTarget: "newpost" })}
            <textarea class="nsc-newpost-ta" id="nsc-np-content" placeholder="支持 Markdown 语法，Ctrl + Enter 快捷发布..."></textarea>
          </div>
        </div>
        <div class="nsc-newpost-foot">
          <span id="nsc-np-status" style="font-size:11.5px;color:var(--nsc-muted);">无刷新直发社区，或右上角切原版编辑器</span>
          <div style="display:flex;gap:8px;">
            <button type="button" class="nsc-pill-btn" id="nsc-np-cancel">取消</button>
            <button type="button" class="nsc-send-btn" id="nsc-np-submit">发布帖子</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(npBackdrop);

    const closeNp = () => npBackdrop.classList.remove("is-open");
    npBackdrop.addEventListener("click", (e) => {
      if (e.target === npBackdrop) closeNp();
    });
    npBackdrop.querySelector("#nsc-np-close").addEventListener("click", closeNp);
    npBackdrop.querySelector("#nsc-np-cancel").addEventListener("click", closeNp);

    const npCat = npBackdrop.querySelector("#nsc-np-cat");
    const npTitle = npBackdrop.querySelector("#nsc-np-title");
    const npContent = npBackdrop.querySelector("#nsc-np-content");
    const npNativeLink = npBackdrop.querySelector("#nsc-np-native-link");
    const npStatus = npBackdrop.querySelector("#nsc-np-status");
    const npSubmit = npBackdrop.querySelector("#nsc-np-submit");

    npCat.addEventListener("change", () => {
      npNativeLink.href = `/new-discussion?category=${encodeURIComponent(npCat.value)}`;
    });

    bindMarkdownToolbar(npBackdrop.querySelector("#nsc-np-toolbar"), npContent);

    const submitNewPost = async () => {
      const category = npCat.value || "daily";
      const title = npTitle.value.trim();
      const content = npContent.value.trim();
      if (!title) {
        npStatus.textContent = "请输入帖子标题";
        npTitle.focus();
        return;
      }
      if (!content) {
        npStatus.textContent = "请输入帖子内容";
        npContent.focus();
        return;
      }
      npSubmit.disabled = true;
      npSubmit.textContent = "发布中...";
      npStatus.textContent = "正在提交到 NodeSeek...";
      try {
        const resp = await fetch("/api/content/new-discussion", {
          method: "POST",
          credentials: "include",
          headers: getNodeSeekPostHeaders(),
          body: JSON.stringify({ content, mode: "new-discussion", title, category, rank: 0 }),
        });
        const resJson = await resp.json().catch(() => ({}));
        if (!resp.ok || resJson.success === false) {
          throw new Error(resJson.message || `HTTP ${resp.status}`);
        }
        npTitle.value = "";
        npContent.value = "";
        npStatus.textContent = "发布成功！";
        closeNp();
        const targetCh = state.activeChannel === "home" ? "home" : category;
        switchChannel(targetCh, true);
        const redirect = resJson.redirect || "";
        const m = redirect.match(/\/post-(\d+)/);
        if (m) {
          openPostInChat({
            postId: m[1],
            url: redirect,
            title,
            author: state.currentUser || "我",
            category,
            replies: 0,
          });
        }
      } catch (err) {
        npStatus.textContent = "发布失败: " + err.message;
      } finally {
        npSubmit.disabled = false;
        npSubmit.textContent = "发布帖子";
      }
    };

    npSubmit.addEventListener("click", submitNewPost);
    npContent.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        submitNewPost();
      }
    });

    shell.querySelector("#nsc-newpost-open-btn").addEventListener("click", () => {
      const defCat = postableChannels.some((c) => c.id === state.activeChannel) ? state.activeChannel : "daily";
      npCat.value = defCat;
      npNativeLink.href = `/new-discussion?category=${encodeURIComponent(defCat)}`;
      npStatus.textContent = "无刷新直发社区，或右上角切原版编辑器";
      npBackdrop.classList.add("is-open");
      setTimeout(() => npTitle.focus(), 40);
    });

    shell.querySelector("#nsc-qb-post").addEventListener("click", () => {
      shell.querySelector("#nsc-newpost-open-btn").click();
    });
    const qbCheckin = shell.querySelector("#nsc-qb-checkin");
    if (qbCheckin) {
      qbCheckin.addEventListener("click", () => {
        if (typeof openUserHubModal === "function") openUserHubModal("attendance");
      });
    }
    const qbLucky = shell.querySelector("#nsc-qb-lucky");
    if (qbLucky) {
      qbLucky.addEventListener("click", (e) => {
        if (typeof openUserHubModal === "function") {
          e.preventDefault();
          openUserHubModal("lucky");
        }
      });
    }
    const qbInvite = shell.querySelector("#nsc-qb-invite");
    if (qbInvite) {
      qbInvite.addEventListener("click", (e) => {
        if (typeof openUserHubModal === "function") {
          e.preventDefault();
          openUserHubModal("invite");
        }
      });
    }

    initNodeImageUi(npBackdrop);
    const npEditorEl = npBackdrop.querySelector(".nsc-newpost-editor");
    if (npEditorEl) {
      npEditorEl.style.position = "relative";
      attachStickerPicker(npBackdrop.querySelector("#nsc-np-exp-btn"), npContent, npEditorEl);
    }

    let searchTimer = null;
    shell.querySelector("#nsc-feed-search").addEventListener("input", (e) => {
      const val = e.target.value.trim().toLowerCase();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.searchKeyword = val;
        renderTopicList();
      }, 140);
    });

    renderRightTabs();

    const chatTitleEl = shell.querySelector("#nsc-chat-title");
    const chatCopyTip = shell.querySelector("#nsc-chat-copy-tip");
    let chatCopyTimer = 0;
    if (chatTitleEl) {
      chatTitleEl.addEventListener("click", async () => {
        if (state.activePmPeer) return;
        const pid = state.currentPostId || (isPostPath(location.pathname) ? getPostIdFromPath(location.pathname) : null);
        if (!pid) return;
        const postUrl = `${location.origin}/post-${pid}-1`;
        const ok = await copyTextToClipboard(postUrl);
        if (ok && chatCopyTip) {
          chatCopyTip.classList.add("is-show");
          clearTimeout(chatCopyTimer);
          chatCopyTimer = setTimeout(() => chatCopyTip.classList.remove("is-show"), 1500);
        }
      });
    }

    const topicScroll = shell.querySelector("#nsc-topic-scroll");
    let topicScrollRaf = 0;
    topicScroll.addEventListener("scroll", () => {
      if (topicScrollRaf) return;
      topicScrollRaf = requestAnimationFrame(() => {
        topicScrollRaf = 0;
        if (topicScroll.scrollHeight - topicScroll.scrollTop - topicScroll.clientHeight < 240) {
          tryAutoLoadNextTopicPage();
        }
      });
    });

    const msgsEl = shell.querySelector("#nsc-chat-messages");
    let chatScrollRaf = 0;
    msgsEl.addEventListener("scroll", () => {
      if (state.activePmPeer || !state.currentRoom) return;
      if (chatScrollRaf) return;
      chatScrollRaf = requestAnimationFrame(() => {
        chatScrollRaf = 0;
        if (state.activePmPeer || !state.currentRoom) return;
        if (msgsEl.scrollTop < 120) {
          tryAutoLoadPrevPage();
        }
        if (msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 220) {
          tryAutoLoadNextPage();
        }
      });
    });
    msgsEl.addEventListener("wheel", (e) => {
      if (state.activePmPeer || !state.currentRoom) return;
      if (e.deltaY < 0 && msgsEl.scrollTop <= 2) {
        tryAutoLoadPrevPage();
      }
    }, { passive: true });

    shell.querySelectorAll("#nsc-theme-seg .nsc-theme-btn").forEach((b) => {
      b.addEventListener("click", () => applyThemeMode(b.dataset.theme));
    });
    if (state.themeMode && state.themeMode !== "auto") {
      applyThemeMode(state.themeMode);
    } else {
      syncThemeButtons();
    }
    applyPaneSkinsToDom();
    applyChatPrefsToDom();

    const updBtn = shell.querySelector("#nsc-update-btn");
    if (updBtn) {
      updBtn.addEventListener("click", () => {
        if (state.updateInfo.hasUpdate) {
          openSeekChatUpdateInstall();
        } else {
          checkSeekChatUpdate(true);
        }
      });
      renderUpdateButton();
    }

    renderLeftNav();
  }


  function attachStickerPicker(btnEl, textareaEl, hostEl) {
    if (!btnEl || !textareaEl || !hostEl) return;
    const pop = document.createElement("div");
    pop.className = "nsc-fb-exp-pop";
    pop.innerHTML = `<div class="nsc-fb-exp-tabs"></div><div class="nsc-fb-exp-grid"></div>`;
    const tabsEl = pop.querySelector(".nsc-fb-exp-tabs");
    const grid = pop.querySelector(".nsc-fb-exp-grid");
    let activeId = "";

    const renderStickers = (gid) => {
      const groups = getEffectiveStickerGroups();
      const grp = groups.find((g) => g.id === gid) || groups[0];
      if (!grp) return;
      activeId = grp.id;
      tabsEl.innerHTML = groups
        .map((g) => `<button type="button" class="nsc-fb-exp-tab ${g.id === activeId ? "is-active" : ""}" data-sg="${escHtml(g.id)}">${escHtml(g.label)}</button>`)
        .join("");
      tabsEl.querySelectorAll(".nsc-fb-exp-tab").forEach((t) => {
        t.addEventListener("click", (e) => {
          e.stopPropagation();
          renderStickers(t.dataset.sg);
        });
      });
      grid.innerHTML = "";
      if (Array.isArray(grp.items)) {
        for (const it of grp.items) {
          if (!it || !it.url) continue;
          const b = document.createElement("button");
          b.type = "button";
          b.className = "nsc-fb-exp-item";
          b.title = it.name || it.url;
          b.innerHTML = `<img src="${escHtml(it.url)}" loading="lazy" alt="" />`;
          b.addEventListener("click", () => {
            const md = `![${it.name || "sticker"}](${it.url})`;
            const s = textareaEl.selectionStart || 0;
            const e = textareaEl.selectionEnd || 0;
            textareaEl.setRangeText(md, s, e, "end");
            textareaEl.dispatchEvent(new Event("input", { bubbles: true }));
            pop.classList.remove("is-open");
            textareaEl.focus({ preventScroll: true });
          });
          grid.appendChild(b);
        }
        return;
      }
      for (const file of grp.files || []) {
        const codeNum = file.replace(/\.[^.]+$/, "");
        const shortcode = `:${grp.id}${codeNum}:`;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "nsc-fb-exp-item";
        b.title = shortcode;
        b.innerHTML = `<img src="/static/image/sticker/${grp.id}/${file}" loading="lazy" alt="${shortcode}" />`;
        b.addEventListener("click", () => {
          const s = textareaEl.selectionStart || 0;
          const e = textareaEl.selectionEnd || 0;
          textareaEl.setRangeText(shortcode, s, e, "end");
          textareaEl.dispatchEvent(new Event("input", { bubbles: true }));
          pop.classList.remove("is-open");
          textareaEl.focus({ preventScroll: true });
        });
        grid.appendChild(b);
      }
    };
    btnEl.addEventListener("click", (e) => {
      e.stopPropagation();
      renderStickers(activeId);
      pop.classList.toggle("is-open");
    });
    document.addEventListener("click", (e) => {
      if (!pop.contains(e.target) && e.target !== btnEl && !btnEl.contains(e.target)) {
        pop.classList.remove("is-open");
      }
    });
    hostEl.appendChild(pop);
  }

  function buildFallbackComposer() {
    const box = document.createElement("div");
    box.className = "nsc-composer-box";
    box.id = "nsc-fallback-composer";
    box.style.position = "relative";
    box.innerHTML = `
      ${buildMarkdownToolbarHtml({ id: "nsc-fb-toolbar", expBtnId: "nsc-fb-exp-btn" })}
      <textarea class="nsc-fallback-textarea" id="nsc-fallback-ta" placeholder="输入评论内容，支持 Ctrl+V 粘贴图片 · Ctrl+Enter 发布"></textarea>
      <div class="nsc-composer-footer">
        <div style="display:flex;align-items:center;gap:8px;">
          <button type="button" class="nsc-nodeimage-btn" id="nsc-fb-ni-btn" title="NodeImage 图床上传/授权"><span class="nsc-ni-dot"></span>图床</button>
          <span id="nsc-composer-status" style="font-size:11px;color:var(--nsc-muted);">Ctrl + Enter 发布</span>
        </div>
        <button type="button" class="nsc-send-btn" id="nsc-fallback-send">发布评论</button>
      </div>
    `;
    box.querySelector("#nsc-fb-ni-btn").addEventListener("click", () => openNodeImageModal("chat"));
    NodeImage.syncDots();
    const ta = box.querySelector("#nsc-fallback-ta");
    attachStickerPicker(box.querySelector("#nsc-fb-exp-btn"), ta, box);
    bindMarkdownToolbar(box.querySelector("#nsc-fb-toolbar"), ta);

    const submitComment = async () => {
      const content = ta.value.trim();
      const pid = state.currentPostId;
      if (!content || !pid || state.activePmPeer) return;
      const btn = box.querySelector("#nsc-fallback-send");
      const status = box.querySelector("#nsc-composer-status");
      btn.disabled = true;
      btn.textContent = "发送中...";
      try {
        await apiPostJson("/api/content/new-comment", { content, mode: "new-comment", postId: Number(pid) });
        ta.value = "";
        status.textContent = "评论已发布，正在同步最新楼层...";
        const room = state.currentRoom;
        if (!state.activePmPeer && room && room.pid === pid && state.currentPostId === pid) {
          const lastPage = room.pages.length || 1;
          const pDoc = await fetchPostPageDoc(`/post-${pid}-${lastPage}`);
          if (!state.activePmPeer && state.currentRoom === room && state.currentPostId === pid) {
            mergePostPageComments(room, pDoc, lastPage);
            renderChatRoom(room, true);
            const msgsEl = document.getElementById("nsc-chat-messages");
            if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
          }
        }
        status.textContent = "发布成功";
      } catch (err) {
        status.textContent = "发送失败: " + err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = "发布评论";
      }
    };

    box.querySelector("#nsc-fallback-send").addEventListener("click", submitComment);
    ta.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        submitComment();
      }
    });
    return box;
  }

  function buildPmComposer() {
    const box = document.createElement("div");
    box.className = "nsc-composer-box";
    box.id = "nsc-pm-composer";
    box.style.position = "relative";
    const emojis = ["🤝", "👍", "🍗", "✅", "❌", "👌", "🙏", "💰", "📦", "🔥", "😂", "😅", "🥳", "❤️", "🎉", "👀", "⚡", "🛡️"];
    box.innerHTML = `
      <div class="nsc-composer-header" style="justify-content:space-between;">
        <div style="display:inline-flex;align-items:center;gap:4px;">
          <button type="button" class="nsc-pm-mode-btn is-active" data-pmmode="write">撰写</button>
          <button type="button" class="nsc-pm-mode-btn" data-pmmode="preview">预览</button>
          <span id="nsc-pm-target-lbl" style="font-size:11.5px;font-weight:600;color:var(--nsc-muted);margin-left:6px;">发送私信</span>
        </div>
        <div style="display:inline-flex;align-items:center;gap:8px;">
          <button type="button" class="nsc-mini-btn" id="nsc-pm-emoji-btn" style="padding:1px 7px;">😊 表情</button>
          <a id="nsc-pm-native-link" class="nsc-nodeimage-btn" href="/notification#/message" target="_blank" rel="noopener noreferrer" style="border:none;background:transparent;">原版 ↗</a>
        </div>
      </div>
      <div class="nsc-pm-emoji-pop" id="nsc-pm-emoji-pop">
        ${emojis.map((em) => `<button type="button" class="nsc-pm-emoji-item">${em}</button>`).join("")}
      </div>
      ${buildMarkdownToolbarHtml({ id: "nsc-pm-toolbar", includeList: true })}
      <textarea class="nsc-fallback-textarea" id="nsc-pm-ta" placeholder="支持完整 Markdown · 截图 Ctrl+V 直接上传图床 · Ctrl+Enter 发送"></textarea>
      <div class="nsc-pm-preview-pane" id="nsc-pm-preview-pane"></div>
      <div class="nsc-composer-footer">
        <div style="display:flex;align-items:center;gap:8px;">
          <button type="button" class="nsc-nodeimage-btn" id="nsc-pm-ni-btn" title="NodeImage 图床上传/图库"><span class="nsc-ni-dot"></span>图床</button>
          <span id="nsc-pm-status" style="font-size:11px;color:var(--nsc-muted);">支持 Markdown 与图床传图 · Ctrl+Enter 发送</span>
        </div>
        <button type="button" class="nsc-send-btn" id="nsc-pm-send">发送私信</button>
      </div>
    `;
    const ta = box.querySelector("#nsc-pm-ta");
    const previewPane = box.querySelector("#nsc-pm-preview-pane");
    const emojiPop = box.querySelector("#nsc-pm-emoji-pop");
    const toolbar = box.querySelector("#nsc-pm-toolbar");

    NodeImage.bindPasteAndDrop(ta, "pm", "#nsc-pm-status");
    box.querySelector("#nsc-pm-ni-btn").addEventListener("click", () => openNodeImageModal("pm"));
    NodeImage.syncDots();

    box.querySelectorAll("[data-pmmode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const isPrev = btn.dataset.pmmode === "preview";
        box.querySelectorAll("[data-pmmode]").forEach((b) => b.classList.toggle("is-active", b === btn));
        if (isPrev) {
          previewPane.innerHTML = renderSimpleMarkdown(ta.value.trim() || "*（暂无内容）*");
          previewPane.classList.add("is-open");
          ta.style.display = "none";
          toolbar.style.display = "none";
        } else {
          previewPane.classList.remove("is-open");
          ta.style.display = "block";
          toolbar.style.display = "flex";
          ta.focus();
        }
      });
    });

    box.querySelector("#nsc-pm-emoji-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      emojiPop.classList.toggle("is-open");
    });
    box.querySelectorAll(".nsc-pm-emoji-item").forEach((eb) => {
      eb.addEventListener("click", () => {
        const s = ta.selectionStart || 0;
        const e = ta.selectionEnd || 0;
        ta.setRangeText(eb.textContent, s, e, "end");
        emojiPop.classList.remove("is-open");
        ta.focus();
      });
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#nsc-pm-composer")) emojiPop.classList.remove("is-open");
    });

    bindMarkdownToolbar(toolbar, ta);

    const doSend = () => {
      box.querySelector('[data-pmmode="write"]').click();
      sendPmMessage();
    };
    box.querySelector("#nsc-pm-send").addEventListener("click", doSend);
    ta.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        doSend();
      }
    });
    return box;
  }

  function syncComposerMode(modeOrNative) {
    const dock = document.getElementById("nsc-composer-dock");
    const composerBody = document.getElementById("nsc-composer-body");
    if (!composerBody) return;
    if (modeOrNative === "none") {
      if (dock) dock.style.display = "none";
      return;
    }
    if (dock) dock.style.display = "";
    const mode = modeOrNative === "pm" ? "pm" : modeOrNative ? "native" : "fallback";
    const nativeEditor = composerBody.querySelector(".md-editor") || document.querySelector("#nsk-frame .md-editor");
    let fallback = document.getElementById("nsc-fallback-composer");
    let pmBox = document.getElementById("nsc-pm-composer");

    if (mode === "pm") {
      if (nativeEditor) nativeEditor.style.display = "none";
      if (fallback) fallback.style.display = "none";
      if (!pmBox) {
        pmBox = buildPmComposer();
        composerBody.appendChild(pmBox);
      }
      if (state.activePmPeer) {
        const lbl = pmBox.querySelector("#nsc-pm-target-lbl");
        const lnk = pmBox.querySelector("#nsc-pm-native-link");
        if (lbl) lbl.textContent = `私信 ${state.activePmPeer.name}`;
        if (lnk) lnk.href = `/notification#/message?mode=talk&to=${state.activePmPeer.uid}`;
      }
      pmBox.style.display = "block";
      return;
    }

    if (pmBox) pmBox.style.display = "none";
    if (mode === "native" && nativeEditor) {
      if (!composerBody.contains(nativeEditor)) {
        composerBody.appendChild(nativeEditor);
        enhanceNativeEditor(nativeEditor);
      }
      nativeEditor.style.display = "block";
      if (fallback) fallback.style.display = "none";
    } else {
      if (nativeEditor) nativeEditor.style.display = "none";
      if (!fallback) {
        fallback = buildFallbackComposer();
        composerBody.appendChild(fallback);
      }
      fallback.style.display = "block";
    }
  }

  function enhanceNativeEditor(editor) {
    if (!editor || editor.dataset.nscEnhanced === "1") return;
    editor.dataset.nscEnhanced = "1";

    const header = editor.querySelector(".tab-select.window_header");
    const expr = editor.querySelector("#editor-body > .expression, .expression");
    if (header && expr && !header.contains(expr)) {
      const firstTopBtn = header.querySelector(".editor-top-button");
      if (firstTopBtn) header.insertBefore(expr, firstTopBtn);
      else header.appendChild(expr);
    }

    const topicFooter = editor.querySelector(".topic-select");
    if (topicFooter && !topicFooter.querySelector(".nsc-nodeimage-btn")) {
      const leftSlot = topicFooter.querySelector("div:first-child");
      const imgHostBtn = document.createElement("button");
      imgHostBtn.type = "button";
      imgHostBtn.className = "nsc-nodeimage-btn";
      imgHostBtn.title = "NodeImage 图床上传与授权";
      imgHostBtn.innerHTML = `<span class="nsc-ni-dot"></span>图床`;
      imgHostBtn.addEventListener("click", () => openNodeImageModal("chat"));
      if (leftSlot) {
        leftSlot.style.cssText = "display:inline-flex;align-items:center;gap:8px;font-size:11px;color:var(--nsc-muted);";
        leftSlot.innerHTML = "";
        leftSlot.appendChild(imgHostBtn);
        const hint = document.createElement("span");
        hint.className = "nsc-ni-status";
        hint.textContent = "支持 Ctrl+V 粘贴图片 · Ctrl+Enter 发布";
        leftSlot.appendChild(hint);
      } else {
        topicFooter.insertBefore(imgHostBtn, topicFooter.firstChild);
      }
      NodeImage.syncDots();
    }

    editor.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        const btn = editor.querySelector("button.submit.btn");
        if (btn) {
          e.preventDefault();
          btn.click();
        }
      }
    });

    const submitBtn = editor.querySelector("button.submit.btn");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        if (state.activePmPeer || !state.currentRoom || state.currentPostId !== state.nativePostId) return;
        const pid = state.currentPostId;
        const room = state.currentRoom;
        const syncAfterSubmit = async () => {
          if (state.activePmPeer || state.currentRoom !== room || state.currentPostId !== pid) return;
          const lastPage = Math.max(1, (room && room.pages.length) || 1);
          try {
            const pDoc = await fetchPostPageDoc(`/post-${pid}-${lastPage}`);
            if (state.activePmPeer || state.currentRoom !== room || state.currentPostId !== pid) return;
            const added = mergePostPageComments(room, pDoc, lastPage);
            if (added > 0) {
              renderChatRoom(room, true);
              const msgsEl = document.getElementById("nsc-chat-messages");
              if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
            }
          } catch (_) {}
        };
        setTimeout(syncAfterSubmit, 900);
        setTimeout(syncAfterSubmit, 2200);
      });
    }

    const topicLeft = editor.querySelector(".topic-select > div:first-child");
    if (topicLeft && !topicLeft.textContent.trim()) {
      topicLeft.style.cssText = "font-size:11px;color:var(--nsc-muted);";
      topicLeft.textContent = "Ctrl + Enter 快捷发布";
    }
    const dock = document.getElementById("nsc-composer-dock");
    if (dock) NodeImage.bindPasteAndDrop(dock, "chat", "#nsc-composer-status");
  }

  let _lbGallery = [];
  let _lbIndex = 0;
  let _lbZoomMode = "fit";
  let _lbScale = 1;
  let _lbTx = 0;
  let _lbTy = 0;
  let _lbDragging = false;
  let _lbMoved = false;
  let _lbStartX = 0;
  let _lbStartY = 0;
  let _applyLbTransform = null;

  function showLightboxAt(idx) {
    const lb = document.getElementById("nsc-lightbox");
    const img = document.getElementById("nsc-lightbox-img");
    const raw = document.getElementById("nsc-lightbox-raw");
    const cnt = document.getElementById("nsc-lb-count");
    const topBadge = document.getElementById("nsc-lb-top-badge");
    const prevBtn = document.getElementById("nsc-lb-prev");
    const nextBtn = document.getElementById("nsc-lb-next");
    const barPrev = document.getElementById("nsc-lb-bar-prev");
    const barNext = document.getElementById("nsc-lb-bar-next");
    if (!lb || !img || !raw || _lbGallery.length === 0) return;
    _lbIndex = Math.max(0, Math.min(idx, _lbGallery.length - 1));
    const src = _lbGallery[_lbIndex];
    _lbZoomMode = "fit";
    _lbScale = 1;
    _lbTx = 0;
    _lbTy = 0;
    img.src = src;
    raw.href = src;
    const multi = _lbGallery.length > 1;
    const countStr = multi ? `第 ${_lbIndex + 1} 张 / 共 ${_lbGallery.length} 张` : "";
    if (cnt) cnt.textContent = multi ? `${_lbIndex + 1} / ${_lbGallery.length}` : "";
    if (topBadge) topBadge.textContent = countStr;
    if (prevBtn) { prevBtn.style.display = multi ? "flex" : "none"; prevBtn.disabled = _lbIndex <= 0; }
    if (nextBtn) { nextBtn.style.display = multi ? "flex" : "none"; nextBtn.disabled = _lbIndex >= _lbGallery.length - 1; }
    if (barPrev) { barPrev.style.display = multi ? "inline-block" : "none"; barPrev.disabled = _lbIndex <= 0; }
    if (barNext) { barNext.style.display = multi ? "inline-block" : "none"; barNext.disabled = _lbIndex >= _lbGallery.length - 1; }
    lb.classList.add("is-open");
    if (typeof _applyLbTransform === "function") _applyLbTransform();
  }

  function stepLightbox(delta) {
    if (_lbGallery.length <= 1) return;
    const next = _lbIndex + delta;
    if (next >= 0 && next < _lbGallery.length) showLightboxAt(next);
  }

  function openLightbox(src, scopeUrls = null) {
    if (Array.isArray(scopeUrls) && scopeUrls.length > 0) {
      _lbGallery = Array.from(new Set(scopeUrls));
    } else {
      const imgs = Array.from(document.querySelectorAll("#nsc-chat-messages img.nsc-zoomable-img")).map(
        (el) => el.currentSrc || el.getAttribute("src") || ""
      ).filter(Boolean);
      const uniqueImgs = Array.from(new Set(imgs));
      _lbGallery = uniqueImgs.includes(src) ? uniqueImgs : [src];
    }
    const idx = _lbGallery.indexOf(src);
    showLightboxAt(idx >= 0 ? idx : 0);
  }

  function enhanceMagicTabs(containerEl) {
    if (!containerEl) return;
    for (const tabBox of containerEl.querySelectorAll(".nsk-magic-tabs")) {
      if (tabBox.dataset.nscTabsInit === "1") continue;
      tabBox.dataset.nscTabsInit = "1";

      for (const oldBar of Array.from(tabBox.querySelectorAll(":scope > .nsc-magic-tab-bar"))) {
        while (oldBar.firstChild) tabBox.insertBefore(oldBar.firstChild, oldBar);
        oldBar.remove();
      }
      for (const child of Array.from(tabBox.children)) {
        if (
          !child.classList.contains("nsk-magic-tab-title") &&
          !child.classList.contains("nsk-magic-tab-body") &&
          (child.tagName === "BR" || (child.tagName === "P" && (child.textContent || "").trim() === "" && !child.querySelector("img")))
        ) {
          child.remove();
        }
      }

      const titles = Array.from(tabBox.querySelectorAll(":scope > .nsk-magic-tab-title"));
      const bodies = Array.from(tabBox.querySelectorAll(":scope > .nsk-magic-tab-body"));
      if (titles.length === 0 || bodies.length === 0) continue;

      let activeIdx = titles.findIndex((t) => t.classList.contains("active") || t.classList.contains("is-active"));
      if (activeIdx < 0) activeIdx = 0;

      const activate = (idx) => {
        titles.forEach((t, i) => {
          const on = i === idx;
          t.classList.toggle("is-active", on);
          t.classList.toggle("active", on);
        });
        bodies.forEach((b, i) => {
          b.style.display = i === idx ? "block" : "none";
        });
      };

      titles.forEach((t, i) => {
        t.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          activate(i);
        });
      });
      activate(activeIdx);
    }
  }

  function processBubbleImages(containerEl) {
    if (!containerEl) return;
    const gridImgs = [];
    for (const img of containerEl.querySelectorAll("img")) {
      if (img.closest(".nsc-sd-card, .nsc-vote-card")) continue;
      const src = img.getAttribute("src") || "";
      if (
        src.includes("/emotion/") ||
        src.includes("/sticker") ||
        src.includes("emoji") ||
        img.classList.contains("emoji") ||
        (img.width > 0 && img.width <= 48 && img.height > 0 && img.height <= 48)
      ) {
        continue;
      }
      img.classList.add("nsc-zoomable-img");
      img.title = "点击打开画廊（支持 ←/→ 切换与滚轮缩放）";
      if (img.closest(".nsk-magic-tab-body")) {
        const markFullTabImg = () => {
          if (/\.svg(?:[?#]|$)/i.test(src) || img.naturalWidth >= 320) {
            img.classList.add("nsc-magic-tab-img-full");
          }
        };
        if (/\.svg(?:[?#]|$)/i.test(src) || (img.complete && img.naturalWidth > 0)) {
          markFullTabImg();
        } else {
          img.addEventListener("load", markFullTabImg, { once: true });
        }
      }
      if (!img.closest('blockquote, pre, code, table, .nsc-table-wrap, details, .nsk-magic-tabs, .nsk-magic-tab-body, [class*="magic-tab"], [class*="tab-content"], [class*="tab-body"], [class*="tab-pane"], [role="tabpanel"]')) {
        gridImgs.push(img);
      }
    }

    const scopeUrls = gridImgs.map((el) => el.currentSrc || el.getAttribute("src") || "").filter(Boolean);
    for (const img of containerEl.querySelectorAll("img.nsc-zoomable-img")) {
      const src = img.getAttribute("src") || "";
      img.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const tabBox = img.closest(".nsk-magic-tabs");
        if (tabBox) {
          const tabUrls = Array.from(tabBox.querySelectorAll("img.nsc-zoomable-img"))
            .map((el) => el.currentSrc || el.getAttribute("src") || "")
            .filter(Boolean);
          openLightbox(img.currentSrc || src, tabUrls.length >= 2 ? tabUrls : null);
          return;
        }
        openLightbox(img.currentSrc || src, scopeUrls.length >= 2 ? scopeUrls : null);
      });
    }

    // 仅合并「连续相邻的无文字纯图块」为朋友圈宫格，绝不跨文字段落抽图，完整保留图文混排原始顺序
    const isPureImgBlock = (el) => {
      if (!el || el.nodeType !== 1) return false;
      if (el.matches('blockquote, pre, code, table, .nsc-table-wrap, details, .nsk-magic-tabs, .nsk-magic-tab-body, [class*="magic-tab"], [class*="tab-content"], [class*="tab-body"], [class*="tab-pane"], [role="tabpanel"], .nsc-img-grid, .nsc-sd-card, .nsc-vote-card')) {
        return false;
      }
      if (el.tagName === "IMG") return el.classList.contains("nsc-zoomable-img");
      if (el.tagName !== "P" && el.tagName !== "FIGURE" && el.tagName !== "A" && el.tagName !== "DIV") return false;
      const imgs = Array.from(el.querySelectorAll("img.nsc-zoomable-img")).filter(
        (im) => !im.closest("blockquote, pre, code")
      );
      return imgs.length > 0 && (el.textContent || "").trim() === "" && !el.querySelector("video, iframe");
    };

    let run = [];
    const flushRun = () => {
      if (run.length === 0) return;
      const imgsInRun = [];
      for (const el of run) {
        if (el.tagName === "IMG") imgsInRun.push(el);
        else imgsInRun.push(...el.querySelectorAll("img.nsc-zoomable-img"));
      }
      if (imgsInRun.length >= 2) {
        const grid = document.createElement("div");
        const cnt = imgsInRun.length;
        const applyGridAspectLayout = () => {
          const ratios = imgsInRun
            .map((im) => (im.naturalWidth > 0 && im.naturalHeight > 0 ? im.naturalWidth / im.naturalHeight : 0))
            .filter((r) => r > 0)
            .sort((a, b) => a - b);
          const medianRatio = ratios.length > 0 ? ratios[Math.floor(ratios.length / 2)] : 1.33;

          grid.classList.remove("cols-1", "cols-2", "ratio-banner", "ratio-wide", "ratio-landscape", "ratio-square", "ratio-portrait");
          if (medianRatio >= 2.2) {
            grid.classList.add("cols-1", "ratio-banner");
          } else {
            if (cnt === 2 || cnt === 4) grid.classList.add("cols-2");
            if (medianRatio >= 1.55) grid.classList.add("ratio-wide");
            else if (medianRatio >= 1.15) grid.classList.add("ratio-landscape");
            else if (medianRatio >= 0.82) grid.classList.add("ratio-square");
            else grid.classList.add("ratio-portrait");
          }
        };

        containerEl.insertBefore(grid, run[0]);
        for (const el of run) {
          if (el.tagName === "IMG") {
            grid.appendChild(el);
          } else {
            for (const im of el.querySelectorAll("img.nsc-zoomable-img")) grid.appendChild(im);
            el.remove();
          }
        }
        applyGridAspectLayout();
        for (const im of imgsInRun) {
          if (!(im.complete && im.naturalWidth > 0)) {
            im.addEventListener("load", applyGridAspectLayout, { once: true });
          }
        }
      }
      run = [];
    };

    for (const node of Array.from(containerEl.childNodes)) {
      if (node.nodeType === 3 && !node.nodeValue.trim()) continue;
      if (isPureImgBlock(node)) {
        run.push(node);
      } else {
        flushRun();
      }
    }
    flushRun();
  }

  function ansi256ToCssColor(n) {
    const std16 = [
      "#4b5563", "#ef4444", "#22c55e", "#eab308", "#3b82f6", "#d946ef", "#06b6d4", "#e5e7eb",
      "#9ca3af", "#f87171", "#4ade80", "#facc15", "#60a5fa", "#e879f9", "#22d3ee", "#ffffff",
    ];
    if (n < 0 || n > 255) return "";
    if (n < 16) return std16[n];
    if (n >= 232) {
      const g = 8 + (n - 232) * 10;
      return `rgb(${g}, ${g}, ${g})`;
    }
    const idx = n - 16;
    const r = Math.floor(idx / 36);
    const g = Math.floor((idx % 36) / 6);
    const b = idx % 6;
    const ch = (v) => (v === 0 ? 0 : 55 + v * 40);
    return `rgb(${ch(r)}, ${ch(g)}, ${ch(b)})`;
  }

  function renderAnsiToFragment(rawText) {
    const frag = document.createDocumentFragment();
    let plainOut = "";
    let stateStyle = { fg: "", bg: "", bold: false, dim: false, italic: false, underline: false };
    const fgStd = ["#4b5563", "#ef4444", "#22c55e", "#eab308", "#3b82f6", "#d946ef", "#06b6d4", "#e5e7eb"];
    const fgBright = ["#9ca3af", "#f87171", "#4ade80", "#facc15", "#60a5fa", "#e879f9", "#22d3ee", "#ffffff"];
    const bgStd = ["#111827", "#b91c1c", "#15803d", "#a16207", "#1d4ed8", "#a21caf", "#0e7490", "#d1d5db"];
    const bgBright = ["#4b5563", "#ef4444", "#22c55e", "#eab308", "#3b82f6", "#d946ef", "#06b6d4", "#f9fafb"];

    const pushSegment = (txt) => {
      if (!txt) return;
      plainOut += txt;
      const hasStyle = stateStyle.fg || stateStyle.bg || stateStyle.bold || stateStyle.dim || stateStyle.italic || stateStyle.underline;
      if (!hasStyle) {
        frag.appendChild(document.createTextNode(txt));
        return;
      }
      const sp = document.createElement("span");
      if (stateStyle.fg) sp.style.color = stateStyle.fg;
      if (stateStyle.bg) sp.style.backgroundColor = stateStyle.bg;
      if (stateStyle.bold) sp.style.fontWeight = "700";
      if (stateStyle.dim) sp.style.opacity = "0.7";
      if (stateStyle.italic) sp.style.fontStyle = "italic";
      if (stateStyle.underline) sp.style.textDecoration = "underline";
      sp.textContent = txt;
      frag.appendChild(sp);
    };

    const re = /\x1b\[([0-9;]*)m/g;
    let lastIdx = 0;
    let m;
    while ((m = re.exec(rawText)) !== null) {
      if (m.index > lastIdx) pushSegment(rawText.slice(lastIdx, m.index));
      const codes = m[1] === "" ? [0] : m[1].split(";").map((x) => parseInt(x, 10));
      for (let i = 0; i < codes.length; i++) {
        const c = Number.isFinite(codes[i]) ? codes[i] : 0;
        if (c === 0) {
          stateStyle = { fg: "", bg: "", bold: false, dim: false, italic: false, underline: false };
        } else if (c === 1) stateStyle.bold = true;
        else if (c === 2) stateStyle.dim = true;
        else if (c === 3) stateStyle.italic = true;
        else if (c === 4) stateStyle.underline = true;
        else if (c === 22) { stateStyle.bold = false; stateStyle.dim = false; }
        else if (c === 23) stateStyle.italic = false;
        else if (c === 24) stateStyle.underline = false;
        else if (c === 39) stateStyle.fg = "";
        else if (c === 49) stateStyle.bg = "";
        else if (c >= 30 && c <= 37) stateStyle.fg = fgStd[c - 30];
        else if (c >= 90 && c <= 97) stateStyle.fg = fgBright[c - 90];
        else if (c >= 40 && c <= 47) stateStyle.bg = bgStd[c - 40];
        else if (c >= 100 && c <= 107) stateStyle.bg = bgBright[c - 100];
        else if (c === 38 || c === 48) {
          const isBg = c === 48;
          const mode = codes[i + 1];
          if (mode === 5 && i + 2 < codes.length) {
            const col = ansi256ToCssColor(codes[i + 2]);
            if (isBg) stateStyle.bg = col;
            else stateStyle.fg = col;
            i += 2;
          } else if (mode === 2 && i + 4 < codes.length) {
            const r = Math.min(255, Math.max(0, codes[i + 2] || 0));
            const g = Math.min(255, Math.max(0, codes[i + 3] || 0));
            const b = Math.min(255, Math.max(0, codes[i + 4] || 0));
            const col = `rgb(${r}, ${g}, ${b})`;
            if (isBg) stateStyle.bg = col;
            else stateStyle.fg = col;
            i += 4;
          }
        }
      }
      lastIdx = re.lastIndex;
    }
    if (lastIdx < rawText.length) pushSegment(rawText.slice(lastIdx));
    return { frag, plainText: plainOut };
  }

  function enhanceAnsiBlocks(containerEl) {
    if (!containerEl) return;
    for (const pre of containerEl.querySelectorAll("pre")) {
      if (pre.dataset.nscAnsiInit === "1") continue;
      const codeEl = pre.querySelector("code");
      const target = codeEl || pre;
      const hasMarker =
        (codeEl && codeEl.classList.contains("language-ansi")) ||
        Boolean(target.querySelector("[data-ansicode]")) ||
        /\x1b\[[0-9;]*m/.test(target.textContent || "");
      if (!hasMarker) continue;
      pre.dataset.nscAnsiInit = "1";

      const clone = target.cloneNode(true);
      for (const sp of clone.querySelectorAll("[data-ansicode]")) {
        const ch = Number(sp.getAttribute("data-ansicode"));
        sp.replaceWith(document.createTextNode(Number.isFinite(ch) ? String.fromCharCode(ch) : ""));
      }
      const rawText = clone.textContent || "";
      if (!/\x1b\[[0-9;]*m/.test(rawText)) continue;

      const { frag, plainText } = renderAnsiToFragment(rawText);
      pre.dataset.nscPlainText = plainText;
      target.innerHTML = "";
      target.appendChild(frag);
      pre.classList.add("nsc-ansi-pre");
    }
  }

  function enhanceTables(containerEl) {
    if (!containerEl) return;
    for (const tbl of Array.from(containerEl.querySelectorAll("table"))) {
      if (tbl.closest(".nsc-table-wrap, pre, code")) continue;
      const wrap = document.createElement("div");
      wrap.className = "nsc-table-wrap";
      tbl.parentNode.insertBefore(wrap, tbl);
      wrap.appendChild(tbl);
    }
  }

  function enhanceCodeBlocks(containerEl) {
    if (!containerEl) return;
    for (const pre of containerEl.querySelectorAll("pre")) {
      if (pre.dataset.nscCopyInit === "1") continue;
      pre.dataset.nscCopyInit = "1";
      const codeEl = pre.querySelector("code");
      const rawText = (pre.dataset.nscPlainText || (codeEl ? codeEl.textContent : pre.textContent) || "").replace(/\n+$/, "");
      if (!rawText.trim()) continue;
      pre.classList.add("has-copy-btn");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nsc-copy-code-btn";
      btn.title = "复制代码";
      btn.innerHTML = `${ICONS.copy}<span>复制</span>`;
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(rawText);
          } else {
            const ta = document.createElement("textarea");
            ta.value = rawText;
            ta.style.cssText = "position:fixed;left:-9999px;opacity:0;";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
          }
          btn.classList.add("is-copied");
          btn.innerHTML = `${ICONS.check}<span>已复制</span>`;
          setTimeout(() => {
            btn.classList.remove("is-copied");
            btn.innerHTML = `${ICONS.copy}<span>复制</span>`;
          }, 1500);
        } catch (_) {}
      });
      pre.appendChild(btn);
    }
  }

  const _nsVoteCache = new Map();
  const _nsStardustCache = new Map();

  function parseStardustReceiveUrl(rawUrl) {
    try {
      let s = String(rawUrl || "").trim();
      if (!/^nsapp:\/\/stardust-receive\?/i.test(s)) return null;
      s = s.replace(/([&?]onetime=(?:true|false))[^&\s]*$/i, "$1");
      const qIdx = s.indexOf("?");
      if (qIdx < 0) return null;
      const params = new URLSearchParams(s.slice(qIdx + 1));
      const memberId = Number(params.get("member_id"));
      const refId = Number(params.get("ref_id"));
      if (!Number.isSafeInteger(memberId) || memberId <= 0) return null;
      if (!Number.isSafeInteger(refId) || refId <= 0) return null;
      const rawDiff = params.get("diff");
      const diffNum = rawDiff === null || rawDiff === "" || rawDiff === "null" ? NaN : Number(rawDiff);
      const validDiff = Number.isSafeInteger(diffNum) && diffNum > 0 && diffNum <= 1000 ? diffNum : null;
      return {
        memberId: String(memberId),
        refId: String(refId),
        diff: validDiff,
        rawDiff: rawDiff || "",
        description: String(params.get("description") || "").trim(),
        onetime: String(params.get("onetime") || "").toLowerCase() === "true",
        rawUrl: s,
      };
    } catch (_) {
      return null;
    }
  }

  function parseVoteUrl(rawUrl) {
    try {
      const s = String(rawUrl || "").trim();
      const m = s.match(/^nsapp:\/\/vote\?id=(\d+)/i);
      if (!m) return null;
      const id = Number(m[1]);
      return Number.isSafeInteger(id) && id > 0 ? id : null;
    } catch (_) {
      return null;
    }
  }

  function extractStardustFromNativePanel(panelEl) {
    if (!panelEl) return null;
    const link = panelEl.querySelector('a[href^="nsapp://stardust-receive"], a[data-href^="nsapp://stardust-receive"]');
    if (link) {
      const parsed = parseStardustReceiveUrl(link.getAttribute("data-href") || link.getAttribute("href"));
      if (parsed) return parsed;
    }
    const svg = panelEl.querySelector("svg.stardust-pay-abstract");
    if (!svg) return null;
    const img = svg.querySelector("image");
    const imgHref = (img && (img.getAttribute("href") || img.getAttribute("xlink:href"))) || "";
    const mm = imgHref.match(/\/avatar\/(\d+)/);
    const texts = Array.from(svg.querySelectorAll("text")).map((t) => (t.textContent || "").trim()).filter(Boolean);
    let refId = "";
    let onetime = false;
    let diff = null;
    const descParts = [];
    for (const t of texts) {
      const rm = t.match(/^Ref\s*ID\s*(\d+)$/i);
      if (rm) { refId = rm[1]; continue; }
      if (/^Onetime$/i.test(t)) { onetime = true; continue; }
      if (diff === null && /^\d+$/.test(t)) { diff = Number(t); continue; }
      descParts.push(t);
    }
    if (!mm || !refId) return null;
    return {
      memberId: mm[1],
      refId,
      diff: diff && diff > 0 && diff <= 1000 ? diff : null,
      rawDiff: diff ? String(diff) : "",
      description: descParts.join(" ").trim(),
      onetime,
      rawUrl: `nsapp://stardust-receive?member_id=${mm[1]}&ref_id=${refId}&description=${encodeURIComponent(descParts.join(" ").trim())}&diff=${diff || 1}&onetime=${onetime}`,
    };
  }

  function extractVoteIdFromNativePanel(panelEl) {
    if (!panelEl) return null;
    const rawId = panelEl.dataset.xnsVoteId || panelEl.dataset.voteId || "";
    if (/^\d+$/.test(rawId)) return Number(rawId);
    const link = panelEl.querySelector('a[href^="nsapp://vote"], a[data-href^="nsapp://vote"]');
    if (link) {
      const id = parseVoteUrl(link.getAttribute("data-href") || link.getAttribute("href"));
      if (id) return id;
    }
    const textMatch = (panelEl.textContent || "").match(/nsapp:\/\/vote\?id=(\d+)/i);
    if (textMatch) return Number(textMatch[1]);
    for (const inp of panelEl.querySelectorAll("input[id]")) {
      const m = (inp.id || "").match(/^vote-item-(\d+)-(\d+)$/);
      if (m) return Number(m[1]);
    }
    return null;
  }

  async function fetchStardustReceiptStatus(memberId, refId, force = false) {
    const key = `${memberId}:${refId}`;
    const existing = _nsStardustCache.get(key);
    if (!force && existing) {
      if (existing.promise) return existing.promise;
      if (existing.data && Date.now() - existing.ts < 20000) return existing.data;
    }
    const work = (async () => {
      detectCurrentUser();
      const myUid = Number(state.currentUserId) || 0;
      let count = 0;
      let total = 0;
      let cursor = "";
      let paid = false;
      for (let page = 0; page < 5; page++) {
        const qs = new URLSearchParams({ member_id: memberId, ref_id: refId, count: "100" });
        if (cursor) qs.set("before_id", cursor);
        const json = await apiGetJson(`/api/stardust/list?${qs.toString()}`);
        const rows = Array.isArray(json.records) ? json.records : [];
        for (const r of rows) {
          const amt = Number(r.diff ?? r.amount ?? r.stardust ?? 0);
          if (amt > 0) {
            total += amt;
            count += 1;
          }
          if (myUid && Number(r.peer_id) === myUid) paid = true;
        }
        if (!json.exist_more || !json.cursor || json.cursor === cursor) break;
        cursor = String(json.cursor);
      }
      if (!paid && myUid > 0 && count >= 100) {
        try {
          const pJson = await apiGetJson(`/api/stardust/list?member_id=${encodeURIComponent(memberId)}&ref_id=${encodeURIComponent(refId)}&peer_id=${myUid}&count=5`);
          if (Array.isArray(pJson.records) && pJson.records.length > 0) paid = true;
        } catch (_) {}
      }
      const res = { count, total, paid, guest: !myUid };
      _nsStardustCache.set(key, { ts: Date.now(), data: res });
      return res;
    })();
    _nsStardustCache.set(key, { ts: Date.now(), promise: work });
    try {
      return await work;
    } catch (err) {
      _nsStardustCache.delete(key);
      throw err;
    }
  }

  function createStardustCardElement(receipt) {
    const card = document.createElement("div");
    card.className = "nsc-sd-card";
    card.addEventListener("click", (e) => e.stopPropagation());

    const ledgerHref = `/stardust/list?member_id=${encodeURIComponent(receipt.memberId)}&ref_id=${encodeURIComponent(receipt.refId)}`;
    const cachedUser = state.userCache[receipt.memberId];
    const initName = (cachedUser && cachedUser.name) || `用户 #${receipt.memberId}`;
    const validAmount = receipt.diff !== null;
    const isSelfReceiver = Boolean(state.currentUserId && String(state.currentUserId) === receipt.memberId);

    card.innerHTML = `
      <div class="nsc-sd-head">
        <div class="nsc-sd-peer">
          <img class="nsc-sd-avatar" src="/avatar/${escHtml(receipt.memberId)}.png" alt="" loading="lazy" />
          <div class="nsc-sd-peer-info">
            <div class="nsc-sd-name-row">
              <span class="nsc-sd-name">${escHtml(initName)}</span>
              ${receipt.onetime ? `<span class="nsc-sd-tag">一次性</span>` : ""}
            </div>
            <div class="nsc-sd-ref">星辰收款 · Ref #${escHtml(receipt.refId)}</div>
          </div>
        </div>
        <div class="nsc-sd-amount-pill${validAmount ? "" : " is-invalid"}">
          ${ICONS.stardust}
          <span>${validAmount ? escHtml(String(receipt.diff)) : "无效"}</span>
        </div>
      </div>
      ${receipt.description ? `<div class="nsc-sd-desc">${escHtml(receipt.description)}</div>` : ""}
      <div class="nsc-sd-foot">
        <div class="nsc-sd-status">
          <span class="nsc-sd-status-text">正在读取收款记录...</span>
          <a class="nsc-sd-link" href="${ledgerHref}" target="_blank" rel="noopener noreferrer" title="查看此 Ref ID 星辰流水">明细 ↗</a>
          <button type="button" class="nsc-sd-refresh" title="刷新收款状态">${ICONS.refresh}</button>
        </div>
        <button type="button" class="nsc-sd-pay-btn"${validAmount ? "" : " disabled"}>
          ${validAmount ? `打赏 ${receipt.diff} 星辰` : "数额无效"}
        </button>
      </div>
    `;

    const nameEl = card.querySelector(".nsc-sd-name");
    const statusTextEl = card.querySelector(".nsc-sd-status-text");
    const refreshBtn = card.querySelector(".nsc-sd-refresh");
    const payBtn = card.querySelector(".nsc-sd-pay-btn");

    if (!cachedUser && typeof fetchUserProfile === "function") {
      fetchUserProfile(receipt.memberId, "").then((u) => {
        if (card.isConnected && u && u.name && nameEl) nameEl.textContent = u.name;
      }).catch(() => {});
    }

    card.querySelector(".nsc-sd-peer").addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof openUserProfileModal === "function") {
        openUserProfileModal({ uid: receipt.memberId, name: (nameEl && nameEl.textContent) || initName });
      }
    });

    const loadStatus = async (force = false) => {
      if (refreshBtn) refreshBtn.classList.add("is-spinning");
      try {
        const st = await fetchStardustReceiptStatus(receipt.memberId, receipt.refId, force);
        if (!card.isConnected) return;
        const statusPrefix = st.guest
          ? "未登录"
          : st.paid
            ? `<span class="nsc-sd-state is-paid">已付款</span>`
            : `<span class="nsc-sd-state">未付款</span>`;
        statusTextEl.innerHTML = `${statusPrefix} · ${st.count} 人共 ${st.total} 星辰`;
        if (validAmount) {
          if (receipt.onetime && st.count > 0) {
            payBtn.textContent = st.paid ? "已付款 (一次性)" : "已被支付";
            payBtn.classList.add("is-done");
            payBtn.disabled = true;
          } else if (isSelfReceiver) {
            payBtn.textContent = "本人收款码";
            payBtn.classList.add("is-done");
            payBtn.disabled = true;
          } else if (st.paid) {
            payBtn.textContent = `再次打赏 ${receipt.diff}`;
            payBtn.classList.add("is-paid");
            payBtn.disabled = false;
          } else {
            payBtn.textContent = `打赏 ${receipt.diff} 星辰`;
            payBtn.classList.remove("is-paid", "is-done");
            payBtn.disabled = false;
          }
        }
      } catch (_) {
        if (!card.isConnected) return;
        statusTextEl.textContent = "状态读取失败，点击刷新重试";
      } finally {
        if (refreshBtn) refreshBtn.classList.remove("is-spinning");
      }
    };

    refreshBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      loadStatus(true);
    });

    payBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!validAmount || payBtn.disabled) return;
      const payUrl = new URL("/stardust/payment", location.origin);
      payUrl.searchParams.set("member_id", receipt.memberId);
      payUrl.searchParams.set("ref_id", receipt.refId);
      payUrl.searchParams.set("diff", String(receipt.diff));
      payUrl.searchParams.set("onetime", String(receipt.onetime));
      payUrl.searchParams.set("description", receipt.description || "Pay with Stardust");
      payUrl.searchParams.set("callback-origin", location.origin);

      const w = 500;
      const h = 640;
      const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - w) / 2));
      const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - h) / 2));
      const popup = window.open(
        payUrl.toString(),
        "nsc_stardust_pay",
        `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
      if (popup) {
        const startedAt = Date.now();
        const timer = setInterval(() => {
          if (popup.closed || Date.now() - startedAt > 180000) {
            clearInterval(timer);
            if (card.isConnected) loadStatus(true);
          }
        }, 550);
      }
    });

    loadStatus(false);
    return card;
  }

  async function fetchVoteDetail(voteId, force = false) {
    const existing = _nsVoteCache.get(voteId);
    if (!force && existing) {
      if (existing.promise) return existing.promise;
      if (existing.data && Date.now() - existing.ts < 30000) return existing.data;
    }
    const work = (async () => {
      const json = await signedApiFetchJson(`/api/vote/info/${voteId}`, { method: "GET" });
      if (!json || !json.vote || !Array.isArray(json.vote.items)) {
        throw new Error((json && json.message) || "投票数据格式异常");
      }
      _nsVoteCache.set(voteId, { ts: Date.now(), data: json.vote });
      return json.vote;
    })();
    _nsVoteCache.set(voteId, { ts: Date.now(), promise: work });
    try {
      return await work;
    } catch (err) {
      _nsVoteCache.delete(voteId);
      throw err;
    }
  }

  function createVoteCardElement(voteId) {
    const card = document.createElement("div");
    card.className = "nsc-vote-card";
    card.dataset.voteId = String(voteId);
    card.addEventListener("click", (e) => e.stopPropagation());

    const selectedIds = new Set();
    let confirming = false;
    let submitting = false;
    let statusMsg = "";

    const renderState = (vote, loading = false, errorMsg = "") => {
      if (loading && !vote) {
        card.innerHTML = `
          <div class="nsc-vote-head">
            <div class="nsc-vote-title">正在读取投票 #${escHtml(String(voteId))}...</div>
          </div>
          <div class="nsc-vote-note">正在同步实时选项与票数</div>
        `;
        return;
      }
      if (errorMsg && !vote) {
        const postHref = state.currentPostId ? `/post-${state.currentPostId}-1` : "/";
        card.innerHTML = `
          <div class="nsc-vote-head">
            <div class="nsc-vote-title">投票 #${escHtml(String(voteId))} 加载失败</div>
            <button type="button" class="nsc-sd-refresh" title="重试">${ICONS.refresh}</button>
          </div>
          <div class="nsc-vote-note is-error">${escHtml(errorMsg)}</div>
          <div class="nsc-vote-foot">
            <button type="button" class="nsc-mini-btn nsc-vote-retry">重试加载</button>
            <a class="nsc-mini-btn" href="${postHref}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">原帖查看 ↗</a>
          </div>
        `;
        card.querySelector(".nsc-sd-refresh").addEventListener("click", () => loadVote(true));
        card.querySelector(".nsc-vote-retry").addEventListener("click", () => loadVote(true));
        return;
      }

      const items = Array.isArray(vote.items) ? vote.items : [];
      const hasVoted = items.some((it) => Boolean(it.voted));
      const hasCounts = items.some((it) => typeof it.count === "number");
      const showResults = hasVoted || hasCounts;
      const canSubmit = !vote.locked && !hasVoted && items.length > 0;
      const totalVotes = items.reduce((sum, it) => sum + (typeof it.count === "number" ? it.count : 0), 0);
      const modeText = `${vote.isPublic ? "公开投票" : "匿名投票"} · ${vote.multiple ? "多选" : "单选"}${vote.locked ? " · 已结束" : ""}`;

      card.innerHTML = `
        <div class="nsc-vote-head">
          <div class="nsc-vote-title-wrap">
            <div class="nsc-vote-title">${escHtml(vote.title || `投票 #${voteId}`)}</div>
            <div class="nsc-vote-badges">
              <span class="nsc-vote-badge">${escHtml(modeText)}</span>
              <span class="nsc-vote-id">#${escHtml(String(vote.id || voteId))}</span>
            </div>
          </div>
          <button type="button" class="nsc-sd-refresh" title="刷新投票状态">${ICONS.refresh}</button>
        </div>
        <div class="nsc-vote-body"></div>
        <div class="nsc-vote-foot"></div>
      `;
      card.querySelector(".nsc-sd-refresh").addEventListener("click", () => loadVote(true));

      const bodyEl = card.querySelector(".nsc-vote-body");
      const footEl = card.querySelector(".nsc-vote-foot");

      if (showResults) {
        items.forEach((it) => {
          const cnt = typeof it.count === "number" ? it.count : null;
          const pct = cnt !== null && totalVotes > 0 ? Math.round((cnt / totalVotes) * 100) : 0;
          const row = document.createElement("div");
          row.className = "nsc-vote-res-row" + (it.voted ? " is-mine" : "");
          row.innerHTML = `
            <div class="nsc-vote-res-top">
              <span class="nsc-vote-opt-text">${escHtml(it.text || "")}</span>
              <span class="nsc-vote-res-meta">
                ${it.voted ? `<span class="nsc-vote-mine-tag">已选</span>` : ""}
                ${cnt !== null ? `<span>${cnt} 票 (${pct}%)</span>` : ""}
              </span>
            </div>
            ${cnt !== null ? `
              <div class="nsc-vote-bar-track">
                <div class="nsc-vote-bar-fill${it.voted ? " is-mine" : ""}" style="width:${pct}%"></div>
              </div>
            ` : ""}
          `;
          bodyEl.appendChild(row);
        });
        footEl.innerHTML = `
          <span class="nsc-vote-note">
            ${hasCounts ? (vote.multiple ? `累计 ${totalVotes} 票次` : `共 ${totalVotes} 票`) : ""}
            ${hasVoted ? (hasCounts ? " · 你已参与投票" : "你已参与投票") : vote.locked ? " · 投票已截止" : ""}
          </span>
        `;
      } else {
        items.forEach((it) => {
          const itemId = Number(it.vote_item_id);
          const isSelected = selectedIds.has(itemId);
          const row = document.createElement("button");
          row.type = "button";
          row.className = "nsc-vote-opt" + (isSelected ? " is-selected" : "") + (vote.multiple ? " is-multi" : "");
          row.disabled = !canSubmit || submitting;
          row.innerHTML = `
            <span class="nsc-vote-indicator">${isSelected ? (vote.multiple ? ICONS.check : `<span class="nsc-vote-dot"></span>`) : ""}</span>
            <span class="nsc-vote-opt-text">${escHtml(it.text || "")}</span>
          `;
          row.addEventListener("click", () => {
            if (!canSubmit || submitting) return;
            confirming = false;
            statusMsg = "";
            if (vote.multiple) {
              if (selectedIds.has(itemId)) selectedIds.delete(itemId);
              else selectedIds.add(itemId);
            } else {
              selectedIds.clear();
              selectedIds.add(itemId);
            }
            renderState(vote);
          });
          bodyEl.appendChild(row);
        });

        if (confirming && canSubmit) {
          const pickedLabels = items.filter((it) => selectedIds.has(Number(it.vote_item_id))).map((it) => it.text).join("、");
          footEl.innerHTML = `
            <div class="nsc-vote-confirm-bar">
              <div class="nsc-vote-note">确认投给「${escHtml(pickedLabels)}」？${vote.isPublic ? "公开投票，" : ""}提交后不可修改。</div>
              <div class="nsc-vote-confirm-btns">
                <button type="button" class="nsc-mini-btn nsc-vote-cancel">取消</button>
                <button type="button" class="nsc-send-btn nsc-vote-do-submit">${submitting ? "提交中..." : "确认提交"}</button>
              </div>
            </div>
          `;
          footEl.querySelector(".nsc-vote-cancel").addEventListener("click", () => {
            confirming = false;
            renderState(vote);
          });
          footEl.querySelector(".nsc-vote-do-submit").addEventListener("click", async () => {
            if (submitting || selectedIds.size === 0) return;
            submitting = true;
            statusMsg = "";
            renderState(vote);
            try {
              await signedApiFetchJson("/api/vote/voteforitem", {
                method: "POST",
                bodyObj: { ids: Array.from(selectedIds) },
              });
              confirming = false;
              await loadVote(true);
            } catch (err) {
              submitting = false;
              confirming = false;
              statusMsg = err.message || "投票提交失败";
              renderState(vote);
            }
          });
        } else if (canSubmit) {
          const tip = statusMsg || (vote.isPublic ? "公开投票，选项对他人可见 · 提交后不可修改" : "提交后不可修改");
          footEl.innerHTML = `
            <span class="nsc-vote-note${statusMsg ? " is-error" : ""}">${escHtml(tip)}</span>
            <button type="button" class="nsc-send-btn nsc-vote-submit-btn"${selectedIds.size === 0 || submitting ? " disabled" : ""}>投票</button>
          `;
          footEl.querySelector(".nsc-vote-submit-btn").addEventListener("click", () => {
            if (selectedIds.size === 0 || submitting) return;
            confirming = true;
            renderState(vote);
          });
        } else {
          footEl.innerHTML = `<span class="nsc-vote-note">${vote.locked ? "投票已结束" : "当前不可投票"}</span>`;
        }
      }
    };

    const loadVote = async (force = false) => {
      renderState(null, true);
      try {
        const vote = await fetchVoteDetail(voteId, force);
        submitting = false;
        if (card.isConnected) renderState(vote);
      } catch (err) {
        submitting = false;
        if (card.isConnected) renderState(null, false, err.message || "加载失败");
      }
    };

    loadVote(false);
    return card;
  }

  function enhanceNsApps(containerEl) {
    if (!containerEl) return;

    for (const panel of Array.from(containerEl.querySelectorAll(".stardust-panel"))) {
      if (panel.dataset.nscNsappInit === "1") continue;
      const receipt = extractStardustFromNativePanel(panel);
      if (receipt) {
        const card = createStardustCardElement(receipt);
        card.dataset.nscNsappInit = "1";
        panel.replaceWith(card);
      }
    }

    for (const panel of Array.from(containerEl.querySelectorAll(".vote-panel"))) {
      if (panel.dataset.nscNsappInit === "1") continue;
      const voteId = extractVoteIdFromNativePanel(panel);
      if (voteId) {
        const card = createVoteCardElement(voteId);
        card.dataset.nscNsappInit = "1";
        panel.replaceWith(card);
      }
    }

    const replaceLinkWithCard = (linkEl, card) => {
      const parent = linkEl.parentElement;
      if (
        parent &&
        parent.tagName === "P" &&
        parent.children.length === 1 &&
        (parent.textContent || "").trim() === (linkEl.textContent || "").trim()
      ) {
        parent.replaceWith(card);
      } else {
        linkEl.replaceWith(card);
      }
    };

    for (const a of Array.from(containerEl.querySelectorAll('a[href^="nsapp://"], a[data-href^="nsapp://"]'))) {
      if (a.closest("pre, code, script, style, textarea, .nsc-sd-card, .nsc-vote-card")) continue;
      const rawUrl = a.getAttribute("data-href") || a.getAttribute("href") || "";
      const receipt = parseStardustReceiveUrl(rawUrl);
      if (receipt) {
        replaceLinkWithCard(a, createStardustCardElement(receipt));
        continue;
      }
      const voteId = parseVoteUrl(rawUrl);
      if (voteId) {
        replaceLinkWithCard(a, createVoteCardElement(voteId));
      }
    }

    const walker = document.createTreeWalker(containerEl, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !/nsapp:\/\/(?:stardust-receive|vote)\?/i.test(node.nodeValue)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (
          node.parentElement &&
          node.parentElement.closest("a, pre, code, script, style, textarea, .nsc-sd-card, .nsc-vote-card, .stardust-panel, .vote-panel")
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    for (const tn of textNodes) {
      const text = tn.nodeValue;
      const re = /(nsapp:\/\/(?:stardust-receive|vote)\?[^\s<>"'`\u3000]+)/gi;
      let m;
      let lastIdx = 0;
      const frag = document.createDocumentFragment();
      let replacedAny = false;
      while ((m = re.exec(text)) !== null) {
        const rawMatch = m[1];
        const receipt = parseStardustReceiveUrl(rawMatch);
        const voteId = !receipt ? parseVoteUrl(rawMatch.replace(/[),.;!?。，；！？]+$/, "")) : null;
        if (!receipt && !voteId) continue;
        replacedAny = true;
        if (m.index > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
        }
        frag.appendChild(receipt ? createStardustCardElement(receipt) : createVoteCardElement(voteId));
        lastIdx = m.index + rawMatch.length;
      }
      if (replacedAny) {
        if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
        const parent = tn.parentElement;
        if (parent && parent.tagName === "P" && parent.childNodes.length === 1 && frag.childNodes.length === 1) {
          parent.replaceWith(frag);
        } else {
          tn.parentNode.replaceChild(frag, tn);
        }
      }
    }
  }

  registerBubbleEnhancer({ id: "nsapp", priority: 10, run: enhanceNsApps });
  registerBubbleEnhancer({ id: "magic-tabs", priority: 30, run: enhanceMagicTabs });
  registerBubbleEnhancer({ id: "ansi-blocks", priority: 35, run: enhanceAnsiBlocks });
  registerBubbleEnhancer({ id: "tables", priority: 38, run: enhanceTables });
  registerBubbleEnhancer({ id: "code-blocks", priority: 40, run: enhanceCodeBlocks });
  registerBubbleEnhancer({ id: "images", priority: 50, run: processBubbleImages });

  // ==========================================================================
  // Module: 06-channels-messages.js
  // ==========================================================================
  function renderLeftNav() {
    const nav = document.getElementById("nsc-pane-nav");
    if (!nav) return;
    nav.innerHTML = "";

    const items = getOrderedChannels(false);
    let lastGroup = null;
    items.forEach((ch, idx) => {
      const grp = ch.group || "board";
      if (idx > 0 && grp !== lastGroup && (grp === "msg" || lastGroup === "msg")) {
        const div = document.createElement("div");
        div.className = "nsc-nav-divider";
        nav.appendChild(div);
      }
      lastGroup = grp;
      const btn = document.createElement("button");
      btn.type = "button";
      const grpCls = `group-${grp}`;
      btn.className = `nsc-nav-item ${grpCls}` + (state.activeChannel === ch.id ? " is-active" : "");
      const unread = getChannelUnreadCount(ch.id);
      btn.innerHTML = `
        <span class="nsc-nav-left">${ch.icon || ICONS.layers}<span>${escHtml(ch.name)}</span></span>
        ${unread > 0 ? `<span class="nsc-nav-badge">${unread > 99 ? "99+" : unread}</span>` : ""}
      `;
      btn.addEventListener("click", () => {
        if (typeof ch.onClick === "function") ch.onClick();
        else switchChannel(ch.id);
      });
      nav.appendChild(btn);
    });
  }

  let _unreadFetchSeq = 0;
  async function fetchUnreadCounts() {
    const seq = ++_unreadFetchSeq;
    try {
      const resp = await fetch("/api/notification/unread-count", {
        headers: { Accept: "application/json, text/plain, */*" },
        credentials: "include",
        cache: "no-store",
      });
      if (!resp.ok || seq !== _unreadFetchSeq) return;
      const data = await resp.json().catch(() => null);
      if (seq !== _unreadFetchSeq) return;
      if (data && data.unreadCount) {
        const totalMsg = Number(data.unreadCount.message) || 0;
        state.totalMessageUnread = totalMsg;
        const sysUnread = state.sysNoticeList.loaded ? Number(state.unreadCounts.sysNotice) || 0 : 0;
        state.unreadCounts = {
          atMe: Number(data.unreadCount.atMe) || 0,
          reply: Number(data.unreadCount.reply) || 0,
          message: Math.max(0, totalMsg - sysUnread),
          sysNotice: sysUnread,
        };
        state.unreadLoaded = true;
        renderLeftNav();
        syncUserCardNotifyBadge();
        if (typeof renderUserHubIfOpen === "function") renderUserHubIfOpen();
      }
    } catch (_) {}
  }

  function bindUserCardStatLinks(userCard) {
    if (!userCard) return;
    for (const a of userCard.querySelectorAll(".user-stat a")) {
      if (a.dataset.nscHubBound === "1") continue;
      a.dataset.nscHubBound = "1";
      a.addEventListener("click", (e) => {
        if (!document.body.classList.contains("nsc-app-active")) return;
        const href = a.getAttribute("href") || "";
        let tab = "";
        if (href.includes("/notification")) tab = "notif";
        else if (href.includes("#discussions")) tab = "posts";
        else if (href.includes("#comments")) tab = "comments";
        else if (href.includes("#collections")) tab = "collections";
        else if (href.includes("/credit")) tab = "credit";
        else if (href.includes("/stardust")) tab = "stardust";
        else if (href.includes("/fans")) tab = "fans";
        else if (href.includes("/progress")) tab = "progress";
        if (tab && typeof openUserHubModal === "function") {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          openUserHubModal(tab);
        }
      }, true);
    }
    const signBtn = userCard.querySelector('.menu span[title="签到"]');
    if (signBtn && signBtn.dataset.nscHubBound !== "1") {
      signBtn.dataset.nscHubBound = "1";
      signBtn.addEventListener("click", (e) => {
        if (!document.body.classList.contains("nsc-app-active")) return;
        if (typeof openUserHubModal === "function") {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          openUserHubModal("attendance");
        }
      }, true);
    }
    const setBtn = userCard.querySelector('.menu a[title="设置"]');
    if (setBtn && setBtn.dataset.nscHubBound !== "1") {
      setBtn.dataset.nscHubBound = "1";
      setBtn.addEventListener("click", (e) => {
        if (!document.body.classList.contains("nsc-app-active")) return;
        if (typeof openUserHubModal === "function") {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          openUserHubModal("setting");
        }
      }, true);
    }
  }

  function mountNativeWidgetsIntoApp() {
    const rightUserHost = document.getElementById("nsc-right-user");
    const nativeUserCard = document.querySelector("#nsk-right-panel-container .user-card");
    if (rightUserHost && nativeUserCard && !rightUserHost.contains(nativeUserCard)) {
      rightUserHost.appendChild(nativeUserCard);
    }
    bindUserCardStatLinks(document.querySelector("#nsc-right-user .user-card"));

    const headThemeBtn = document.querySelector("#nsk-head .color-theme-switcher");
    if (headThemeBtn && headThemeBtn.dataset.nscThemeObs !== "1") {
      headThemeBtn.dataset.nscThemeObs = "1";
      headThemeBtn.addEventListener("click", () => {
        if (Date.now() < (state._suppressThemeObsUntil || 0)) return;
        setTimeout(() => {
          if (Date.now() < (state._suppressThemeObsUntil || 0)) return;
          document.body.classList.remove("nsc-theme-dusk");
          const nextMode = document.body.classList.contains("dark-layout") ? "dark" : "light";
          state.themeMode = nextMode;
          document.body.dataset.nscTheme = nextMode;
          localStorage.setItem(LS.THEME, nextMode);
          syncThemeButtons();
        }, 40);
      });
    }

    if (state.themeMode && state.themeMode !== "auto") {
      applyThemeMode(state.themeMode);
    } else {
      syncThemeButtons();
    }
    applyPaneSkinsToDom();
    applyChatPrefsToDom();
    if (typeof renderRightTabs === "function") renderRightTabs();
    syncUserCardNotifyBadge();

    const syncPanelLink = (panelSelector, targetId, fallbackHref) => {
      const src = document.querySelector(panelSelector);
      const dst = document.getElementById(targetId);
      if (dst) dst.href = (src && src.getAttribute("href")) || fallbackHref;
    };
    syncPanelLink('#nsk-right-panel-container a[href*="ruling"]', "nsc-nf-ruling", "/ruling");
    syncPanelLink('#nsk-right-panel-container a[href*="partner"], #nsk-right-panel-container a[href*="merchant"]', "nsc-nf-partner", "/categories/promotion");
    syncPanelLink('#nsk-right-panel-container a[href*="friend"], #nsk-right-panel-container a[href*="link"]', "nsc-nf-links", "/award");
    for (const a of document.querySelectorAll("#nsk-right-panel-container a")) {
      const txt = (a.textContent || "").trim();
      const href = a.getAttribute("href") || "";
      if (!href) continue;
      if (txt.includes("管理记录") && document.getElementById("nsc-nf-ruling")) document.getElementById("nsc-nf-ruling").href = href;
      if (txt.includes("合作商家") && document.getElementById("nsc-nf-partner")) document.getElementById("nsc-nf-partner").href = href;
      if (txt.includes("友站链接") && document.getElementById("nsc-nf-links")) document.getElementById("nsc-nf-links").href = href;
      if (txt.includes("幸运抽奖") && document.getElementById("nsc-qb-lucky")) document.getElementById("nsc-qb-lucky").href = href;
      if (txt.includes("邀请好友") && document.getElementById("nsc-qb-invite")) document.getElementById("nsc-qb-invite").href = href;
    }

    if (state.activePmPeer) {
      syncComposerMode("pm");
    } else if (!state.currentPostId && !isPostPath(location.pathname)) {
      syncComposerMode("none");
    } else {
      syncComposerMode(isPostPath(location.pathname) && (!state.currentPostId || state.currentPostId === state.nativePostId));
    }
    if (typeof refreshNativeFloorCountsIfNeeded === "function") {
      refreshNativeFloorCountsIfNeeded();
    }

    if (state.rightTab === "hot" && !state.hotCache[state.hotTab]) {
      fetchHotPosts(state.hotTab);
    } else if (state.rightTab === "friends" && !state.followData.loaded) {
      fetchFansOrFollow("follow");
    } else if (state.rightTab === "fans" && !state.fansData.loaded) {
      fetchFansOrFollow("fans");
    } else if (state.rightTab === "blacklist" && !state.blockListState.loaded) {
      fetchServerBlockList(false);
    } else {
      renderRightBody();
    }
  }

  function restoreNativeWidgets() {
    document.body.classList.remove("nsc-theme-dusk");
    delete document.body.dataset.nscTheme;
    const rightPanel = document.getElementById("nsk-right-panel-container");
    const userCard = document.querySelector("#nsc-right-user .user-card");
    if (rightPanel && userCard) {
      const legacyThemeBtn = userCard.querySelector('a[title="切换主题模式"][data-nsc-theme-fixed="1"]');
      if (legacyThemeBtn) {
        legacyThemeBtn.removeAttribute("data-nsc-theme-fixed");
        legacyThemeBtn.innerHTML = "";
      }
      rightPanel.insertBefore(userCard, rightPanel.firstChild);
    }
    const commentContainer = document.querySelector("#nsk-frame .comment-container");
    const nativeEditor = document.querySelector("#nsc-composer-body .md-editor");
    if (commentContainer && nativeEditor) {
      nativeEditor.style.display = "block";
      commentContainer.appendChild(nativeEditor);
    }
  }

  function toggleAppMode(enable) {
    const canShowApp = enable && isForumBrowseRoute();
    const wasActive = document.body.classList.contains("nsc-app-active");
    document.body.classList.toggle("nsc-app-active", canShowApp);
    document.documentElement.classList.remove("nsc-prehide");

    if (canShowApp) {
      const firstInit = !state.shellBuilt;
      buildShellIfNeeded();
      detectCurrentUser();
      mountNativeWidgetsIntoApp();
      if (firstInit || !wasActive) {
        switchChannel(state.activeChannel, false);
        fetchUnreadCounts();
        setTimeout(() => fetchSysNotices(true), 600);
        setTimeout(() => fetchServerBlockList(true), 800);
        setTimeout(() => prefetchCollectionsSet(), 950);
        setTimeout(() => prefetchUnreadBadges(["home", "daily", "tech", "info"]), 1200);
        setTimeout(() => {
          if (typeof maybeRunAutoCheckin === "function") maybeRunAutoCheckin();
        }, 1600);
        if (firstInit) {
          setTimeout(() => {
            if (typeof checkSeekChatUpdate === "function") checkSeekChatUpdate(false);
          }, 5000);
        }
      }

      if (isPostPath(location.pathname)) {
        const pid = getPostIdFromPath(location.pathname);
        state.nativePostId = pid;
        if (!state.activePmPeer && (!state.currentPostId || (firstInit && state.currentPostId === pid))) {
          renderPostDocument(document, location.pathname, true);
        } else if (state.currentPostId === pid && typeof refreshNativeFloorCountsIfNeeded === "function") {
          refreshNativeFloorCountsIfNeeded();
        }
      }
    } else {
      restoreNativeWidgets();
    }
  }

  async function prefetchUnreadBadges(channelIds) {
    for (const cid of channelIds) {
      if (state.channelData[cid]) continue;
      await fetchChannelData(cid, 1, true, true);
    }
  }

  function switchChannel(channelId, forceRefresh = false) {
    if (channelId !== "history") {
      state.lastBrowseChannel = channelId;
    }
    if (state.activeChannel !== channelId) {
      state.readFilterMode = "all";
    }
    state.activeChannel = channelId;
    localStorage.setItem(LS.ACTIVE_CHANNEL, channelId);
    renderLeftNav();
    renderListToolbar();

    const topicScroll = document.getElementById("nsc-topic-scroll");
    if (topicScroll) topicScroll.scrollTop = 0;

    const ch = CHANNELS.find((c) => c.id === channelId) || CHANNELS[0];
    const titleEl = document.getElementById("nsc-channel-title");
    if (titleEl) titleEl.textContent = ch.name;

    if (channelId === "history") {
      renderTopicList();
      return;
    }

    if (channelId === "at-me" || channelId === "reply-me") {
      const st = state.notifData[channelId];
      const countKey = channelId === "at-me" ? "atMe" : "reply";
      const markInflight = state._markingNotif[channelId];
      const syncThenCheck = async () => {
        if (markInflight) {
          try { await markInflight; } catch (_) {}
        }
        await fetchUnreadCounts();
        const srvCnt = Number(state.unreadCounts[countKey]) || 0;
        const localCnt = st.items.filter((x) => !x.viewed).length;
        if (forceRefresh || !st.loaded || (srvCnt > 0 && localCnt === 0)) {
          fetchNotifications(channelId);
        }
      };
      if (forceRefresh || !st.loaded) fetchNotifications(channelId);
      else renderTopicList();
      syncThenCheck();
      return;
    }

    if (channelId === "pm") {
      fetchUnreadCounts();
      if (forceRefresh || !state.pmList.loaded) fetchPmList();
      else renderTopicList();
      return;
    }

    if (channelId === "sys-notice") {
      fetchUnreadCounts();
      if (forceRefresh || !state.sysNoticeList.loaded) {
        fetchSysNotices(false);
      } else {
        renderTopicList();
        setTimeout(() => enrichSysNoticeTitles(), 120);
      }
      return;
    }

    if (channelId === "home" && !forceRefresh && !state.channelData.home && !isPostPath(location.pathname) && document.querySelector(".post-list-item")) {
      state.channelData.home = {
        items: parsePostListFromDoc(document),
        page: 1,
        loading: false,
        error: null,
      };
      renderLeftNav();
      renderTopicList();
      return;
    }

    if (forceRefresh || !state.channelData[channelId]) {
      fetchChannelData(channelId, 1, true, false);
    } else {
      renderTopicList();
    }
  }

  async function fetchNotifications(kind) {
    const store = state.notifData[kind];
    if (!store || store.loading) return;
    store.loading = true;
    store.error = null;
    if (state.activeChannel === kind) renderTopicList();

    const endpointBase = kind === "at-me" ? "/api/notification/at-me/list" : "/api/notification/reply-to-me/list";
    const countKey = kind === "at-me" ? "atMe" : "reply";
    if (!state.unreadLoaded) {
      await fetchUnreadCounts();
    }
    const mapItems = (raw) =>
      raw.map((it) => {
        const uid = String(it.commenter_id || it.member_id || it.uid || "");
        const postId = String(it.post_id || it.postId || "");
        const floorId = Number(it.floor_id ?? it.floorId ?? it.floor_index ?? it.floorIndex ?? it.floor ?? 0) || 0;
        const pageIndex = floorId > 0 ? Math.ceil(floorId / 10) : 1;
        const rawId = Number(
          it.id || it.notification_id || it.notify_id || it.nid || it.msg_id || it.reply_id || it.comment_id || it.commentId || 0
        ) || 0;
        const srvViewed = it.viewed === 1 || it.viewed === "1" || it.viewed === true || it.viewed === "true";
        const localKey = `${kind}:${rawId}:${postId}:${floorId}`;
        if (srvViewed && state.readNotifs[localKey]) {
          delete state.readNotifs[localKey];
        }
        return {
          id: rawId,
          commentId: Number(it.comment_id || it.commentId || 0) || 0,
          postId,
          floorId,
          localKey,
          url: `/post-${postId}-${pageIndex}`,
          title: it.title || `帖子 #${postId}`,
          author: it.commenter_name || it.member_name || "Seeker",
          uid,
          avatar: uid ? `/avatar/${uid}.png` : "",
          timeText: formatChineseTime("", it.created_at, ""),
          viewed: srvViewed || Boolean(state.readNotifs[localKey]),
          serverViewed: srvViewed,
        };
      });

    try {
      const merged = [];
      const seenKeys = new Set();
      for (let page = 1; page <= 3; page++) {
        const resp = await fetch(`${endpointBase}${page > 1 ? `?page=${page}` : ""}`, {
          headers: { Accept: "application/json, text/plain, */*" },
          credentials: "include",
        });
        if (!resp.ok) {
          if (page === 1) throw new Error(`HTTP ${resp.status}`);
          break;
        }
        const json = await resp.json();
        const raw = Array.isArray(json.data) ? json.data : Array.isArray(json.notifications) ? json.notifications : [];
        if (raw.length === 0) break;
        const pageItems = mapItems(raw);
        let added = 0;
        for (const it of pageItems) {
          const k = `${it.id}:${it.postId}:${it.floorId}`;
          if (!seenKeys.has(k)) {
            seenKeys.add(k);
            merged.push(it);
            added++;
          }
        }
        const localUnread = merged.filter((x) => !x.viewed).length;
        const serverUnread = Number(state.unreadCounts[countKey]) || 0;
        if (added === 0 || serverUnread === 0 || localUnread >= serverUnread || raw.length < 20) break;
      }
      store.items = merged;
      store.loaded = true;
    } catch (err) {
      store.error = err.message;
    } finally {
      store.loading = false;
      if (state.activeChannel === kind) renderTopicList();
      if (typeof renderUserHubIfOpen === "function") renderUserHubIfOpen();
    }
  }

  async function readServerUnreadCountFor(countKey) {
    try {
      const resp = await fetch("/api/notification/unread-count", {
        headers: { Accept: "application/json, text/plain, */*" },
        credentials: "include",
        cache: "no-store",
      });
      if (!resp.ok) return null;
      const data = await resp.json().catch(() => null);
      if (data && data.unreadCount) {
        return Number(data.unreadCount[countKey]) || 0;
      }
    } catch (_) {}
    return null;
  }

  async function markNotificationViewed(kind, itemOrId, all = false) {
    const api = kind === "at-me" ? "/api/notification/at-me/markViewed" : "/api/notification/reply-to-me/markViewed";
    const countKey = kind === "at-me" ? "atMe" : "reply";
    const store = state.notifData[kind];
    const item = typeof itemOrId === "object" && itemOrId !== null ? itemOrId : null;
    const numId = item ? (Number(item.id) || 0) : (Number(itemOrId) || 0);
    const postIdNum = item ? (Number(item.postId) || 0) : 0;
    const floorIdNum = item ? (Number(item.floorId) || 0) : 0;
    const commentIdNum = item ? (Number(item.commentId) || 0) : 0;

    if (store) {
      if (all) {
        store.items.forEach((x) => {
          x.viewed = true;
          if (x.localKey) delete state.readNotifs[x.localKey];
        });
        saveJson(LS.READ_NOTIFS, state.readNotifs);
        state.unreadCounts[countKey] = 0;
      } else {
        const hit = item || (numId > 0 ? store.items.find((x) => x.id === numId) : null);
        if (hit && !hit.viewed) {
          hit.viewed = true;
          if (hit.localKey) {
            state.readNotifs[hit.localKey] = Date.now();
            const rk = Object.keys(state.readNotifs);
            if (rk.length > 300) {
              rk.sort((a, b) => state.readNotifs[a] - state.readNotifs[b]).slice(0, rk.length - 200).forEach((k) => delete state.readNotifs[k]);
            }
            saveJson(LS.READ_NOTIFS, state.readNotifs);
          }
          state.unreadCounts[countKey] = Math.max(0, (Number(state.unreadCounts[countKey]) || 0) - 1);
        }
      }
      renderLeftNav();
      syncUserCardNotifyBadge();
      if (state.activeChannel === kind) renderTopicList();
      if (typeof renderUserHubIfOpen === "function") renderUserHubIfOpen();
    }

    const workPromise = (async () => {
      try {
        const serverBefore = await readServerUnreadCountFor(countKey);
        const beforeCount = serverBefore !== null ? serverBefore : (Number(state.unreadCounts[countKey]) || 0);
        let ok = false;

        if (all) {
          const attempts = [
            () => fetch(`${api}?all=true`, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders(), body: "{}" }),
            () => fetch(`${api}?all=true`, { method: "POST", credentials: "include", headers: { Accept: "application/json, text/plain, */*" } }),
            () => fetch(api, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders(), body: JSON.stringify({ all: true }) }),
            () => fetch(`${api}?all=true`, { method: "GET", credentials: "include", headers: { Accept: "application/json, text/plain, */*" } }),
          ];
          for (const run of attempts) {
            try {
              const resp = await run();
              const resJson = await resp.json().catch(() => null);
              if (!resp.ok || (resJson && resJson.success === false)) continue;
              const after = await readServerUnreadCountFor(countKey);
              if (after === 0 || after === null) {
                ok = true;
                break;
              }
            } catch (_) {}
          }
        } else {
          const strategyKey = `nsc_v7_mv_strategy_${kind}`;
          const candidates = [];
          if (numId > 0) {
            if (kind === "at-me") {
              candidates.push({ name: "atMeArr", run: () => fetch(api, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders(), body: JSON.stringify({ atMe: [numId] }) }) });
              candidates.push({ name: "atMesArr", run: () => fetch(api, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders(), body: JSON.stringify({ atMes: [numId] }) }) });
            } else {
              candidates.push({ name: "replyToMeArr", run: () => fetch(api, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders(), body: JSON.stringify({ replyToMe: [numId] }) }) });
              candidates.push({ name: "replyArr", run: () => fetch(api, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders(), body: JSON.stringify({ reply: [numId] }) }) });
              candidates.push({ name: "repliesArr", run: () => fetch(api, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders(), body: JSON.stringify({ replies: [numId] }) }) });
            }
            candidates.push({ name: "notificationsArr", run: () => fetch(api, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders(), body: JSON.stringify({ notifications: [numId] }) }) });
            candidates.push({ name: "idListArr", run: () => fetch(api, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders(), body: JSON.stringify({ idList: [numId] }) }) });
            candidates.push({ name: "idsArr", run: () => fetch(api, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders(), body: JSON.stringify({ ids: [numId] }) }) });
            candidates.push({ name: "idScalar", run: () => fetch(api, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders(), body: JSON.stringify({ id: numId }) }) });
            candidates.push({ name: "idQueryPost", run: () => fetch(`${api}?id=${numId}`, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders() }) });
            candidates.push({ name: "idQueryGet", run: () => fetch(`${api}?id=${numId}`, { method: "GET", credentials: "include", headers: { Accept: "application/json, text/plain, */*" } }) });
          }
          if (commentIdNum > 0 && commentIdNum !== numId) {
            candidates.push({ name: "commentId", run: () => fetch(api, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders(), body: JSON.stringify({ commentId: commentIdNum }) }) });
          }
          if (postIdNum > 0) {
            candidates.push({ name: "postFloorCamel", run: () => fetch(api, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders(), body: JSON.stringify({ postId: postIdNum, floorId: floorIdNum }) }) });
            candidates.push({ name: "postFloorSnake", run: () => fetch(api, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders(), body: JSON.stringify({ post_id: postIdNum, floor_id: floorIdNum }) }) });
            candidates.push({ name: "postFloorQuery", run: () => fetch(`${api}?postId=${postIdNum}&floorId=${floorIdNum}`, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders() }) });
          }

          const cachedName = localStorage.getItem(strategyKey) || "";
          if (cachedName) {
            const hitCand = candidates.find((c) => c.name === cachedName);
            if (hitCand) {
              try {
                const resp = await hitCand.run();
                const resJson = await resp.json().catch(() => null);
                if (resp.ok && (!resJson || resJson.success !== false) && beforeCount > 0) {
                  const after = await readServerUnreadCountFor(countKey);
                  if (after !== null && after < beforeCount) {
                    ok = true;
                  } else {
                    localStorage.removeItem(strategyKey);
                  }
                } else {
                  localStorage.removeItem(strategyKey);
                }
              } catch (_) {
                localStorage.removeItem(strategyKey);
              }
            }
          }

          if (!ok && beforeCount > 0) {
            for (const cand of candidates) {
              if (cand.name === cachedName) continue;
              try {
                const resp = await cand.run();
                const resJson = await resp.json().catch(() => null);
                if (!resp.ok || (resJson && resJson.success === false)) continue;
                const after = await readServerUnreadCountFor(countKey);
                if (after !== null && after < beforeCount) {
                  localStorage.setItem(strategyKey, cand.name);
                  ok = true;
                  break;
                }
              } catch (_) {}
            }
          }
        }

        if (!ok && !all && store) {
          const allLocallyRead = store.items.every((x) => x.viewed);
          if (allLocallyRead && beforeCount > 0 && beforeCount <= store.items.length) {
            const attempts = [
              () => fetch(`${api}?all=true`, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders(), body: "{}" }),
              () => fetch(`${api}?all=true`, { method: "POST", credentials: "include", headers: { Accept: "application/json, text/plain, */*" } }),
            ];
            for (const run of attempts) {
              try {
                const r = await run();
                if (r && r.ok) {
                  const after = await readServerUnreadCountFor(countKey);
                  if (after === 0) { ok = true; break; }
                }
              } catch (_) {}
            }
          }
        }

        await fetchUnreadCounts();
        if (typeof renderUserHubIfOpen === "function") renderUserHubIfOpen();
      } catch (_) {}
    })();

    state._markingNotif[kind] = workPromise;
    await workPromise;
    if (state._markingNotif[kind] === workPromise) delete state._markingNotif[kind];
  }

  async function fetchPmList() {
    if (state.pmList.loading) return;
    state.pmList.loading = true;
    state.pmList.error = null;
    if (state.activeChannel === "pm") renderTopicList();

    detectCurrentUser();
    try {
      const resp = await fetch("/api/notification/message/list?page=1", {
        headers: { Accept: "application/json, text/plain, */*" },
        credentials: "include",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const rows = Array.isArray(json.msgArray) ? json.msgArray : [];
      const myId = state.currentUserId;
      const map = new Map();
      for (const r of rows) {
        const sid = Number(r.sender_id);
        const rid = Number(r.receiver_id);
        const peerId = myId && sid === myId ? rid : myId && rid === myId ? sid : sid || rid;
        if (!peerId || peerId === 5230 || (myId && peerId === myId)) continue;
        const peerName = (sid === peerId ? r.sender_name : r.receiver_name) || `用户 ${peerId}`;
        if (String(peerName).trim() === "系统通知") continue;
        const isUnread = (!myId || rid === myId) && (r.viewed === false || r.viewed === 0 || r.viewed === "0");
        const prev = map.get(peerId);
        const ts = new Date(r.created_at || 0).getTime() || 0;
        if (!prev || ts >= prev.ts) {
          map.set(peerId, {
            uid: String(peerId),
            name: String(peerName).trim(),
            avatar: `/avatar/${peerId}.png`,
            content: String(r.content || ""),
            timeText: formatChineseTime("", r.created_at, ""),
            ts,
            unread: isUnread || (prev ? prev.unread : false),
          });
        }
      }
      state.pmList.items = Array.from(map.values()).sort((a, b) => b.ts - a.ts);
      state.pmList.loaded = true;
    } catch (err) {
      state.pmList.error = err.message;
    } finally {
      state.pmList.loading = false;
      if (state.activeChannel === "pm") renderTopicList();
      if (typeof renderUserHubIfOpen === "function") renderUserHubIfOpen();
    }
  }

  function clearPostRoomState() {
    state.currentRoom = null;
    state.loadedPages.clear();
    state.loadingNextPage = false;
    state.loadingPrevPage = false;
    state.currentPostId = null;
    state.currentPostUrl = null;
    state.opAuthor = "";
    state.members = [];
  }

  async function openPmConversation(peer) {
    if (!peer || !peer.uid) return;
    detectCurrentUser();
    const reqSeq = ++state.chatViewSeq;
    const peerUid = String(peer.uid);
    clearPostRoomState();
    state.activePmPeer = {
      uid: peerUid,
      name: peer.name || peer.author || `用户 ${peerUid}`,
      avatar: peer.avatar || `/avatar/${peerUid}.png`,
    };
    renderTopicList();
    syncComposerMode("pm");

    const titleEl = document.getElementById("nsc-chat-title");
    const subEl = document.getElementById("nsc-chat-subtitle");
    const actionsEl = document.getElementById("nsc-chat-actions");
    const msgsEl = document.getElementById("nsc-chat-messages");
    if (titleEl) {
      titleEl.textContent = `私信：${state.activePmPeer.name}`;
      titleEl.classList.remove("is-copyable");
      titleEl.removeAttribute("title");
    }
    const copyTipEl = document.getElementById("nsc-chat-copy-tip");
    if (copyTipEl) copyTipEl.classList.remove("is-show");
    if (subEl) subEl.innerHTML = `<span>UID: ${escHtml(state.activePmPeer.uid)}</span><span>与 ${escHtml(state.activePmPeer.name)} 的站内对话</span>`;
    if (actionsEl) {
      actionsEl.innerHTML = "";
      const refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.className = "nsc-pill-btn";
      refBtn.textContent = "刷新记录";
      refBtn.addEventListener("click", () => {
        if (state.activePmPeer) openPmConversation(state.activePmPeer);
      });
      const profBtn = document.createElement("button");
      profBtn.type = "button";
      profBtn.className = "nsc-pill-btn";
      profBtn.textContent = "TA的名片";
      profBtn.addEventListener("click", () => {
        if (state.activePmPeer) openUserProfileModal(state.activePmPeer);
      });
      actionsEl.appendChild(refBtn);
      actionsEl.appendChild(profBtn);
    }
    if (msgsEl) msgsEl.innerHTML = `<div class="nsc-empty-state">正在读取私信聊天记录...</div>`;

    try {
      const json = await apiGetJson(`/api/notification/message/with/${peerUid}`);
      if (reqSeq !== state.chatViewSeq || !state.activePmPeer || state.activePmPeer.uid !== peerUid) return;
      if (json.talkTo && json.talkTo.member_name) {
        state.activePmPeer.name = json.talkTo.member_name;
        if (titleEl) titleEl.textContent = `私信：${state.activePmPeer.name}`;
      }
      const rows = Array.isArray(json.msgArray) ? json.msgArray : [];
      rows.sort((a, b) => (new Date(a.created_at).getTime() || 0) - (new Date(b.created_at).getTime() || 0) || (Number(a.id) || 0) - (Number(b.id) || 0));
      state.pmMessages = rows;
      renderPmMessages();

      const myId = state.currentUserId;
      const unreadIds = rows
        .filter((r) => (!myId || Number(r.receiver_id) === myId) && (r.viewed === false || r.viewed === 0 || r.viewed === "0") && r.id)
        .map((r) => Number(r.id));
      if (unreadIds.length > 0) {
        fetch("/api/notification/message/markViewed", {
          method: "POST",
          credentials: "include",
          headers: getNodeSeekPostHeaders(),
          body: JSON.stringify({ messages: unreadIds }),
        }).then(() => {
          const hit = state.pmList.items.find((x) => x.uid === peerUid);
          if (hit) hit.unread = false;
          fetchUnreadCounts();
          if (state.activeChannel === "pm") renderTopicList();
        }).catch(() => {});
      }
    } catch (err) {
      if (reqSeq !== state.chatViewSeq || !state.activePmPeer || state.activePmPeer.uid !== peerUid) return;
      if (msgsEl) msgsEl.innerHTML = `<div class="nsc-empty-state">读取私信失败：${escHtml(err.message)}</div>`;
    }
  }

  function renderPmMessages() {
    const msgsEl = document.getElementById("nsc-chat-messages");
    if (!msgsEl || !state.activePmPeer) return;
    msgsEl.innerHTML = "";
    if (state.pmMessages.length === 0) {
      msgsEl.innerHTML = `<div class="nsc-empty-state">暂无私信记录，发一条消息开始对话吧</div>`;
      return;
    }
    const myId = state.currentUserId;
    const peer = state.activePmPeer;
    for (const m of state.pmMessages) {
      const isMine = myId ? Number(m.sender_id) === myId : Number(m.sender_id) !== Number(peer.uid);
      const wrap = document.createElement("div");
      wrap.className = "nsc-msg" + (isMine ? " is-self" : "");
      const av = isMine ? (myId ? `/avatar/${myId}.png` : "/static/image/favicon/android-chrome-192x192.png") : peer.avatar;
      const nm = isMine ? (state.currentUser || "我") : peer.name;
      const tm = formatChineseTime("", m.created_at, "");
      wrap.innerHTML = `
        <div class="nsc-avatar-col">
          <button type="button" class="nsc-avatar-btn"><img src="${av}" loading="lazy" alt="" /></button>
        </div>
        <div class="nsc-msg-main">
          <div class="nsc-msg-meta">
            <button type="button" class="nsc-msg-author"></button>
            ${tm ? `<span>${tm}</span>` : ""}
          </div>
          <div class="nsc-bubble-row">
            <div class="nsc-bubble">${renderSimpleMarkdown(m.content || "")}</div>
          </div>
        </div>
      `;
      wrap.querySelector(".nsc-msg-author").textContent = nm;
      wrap.querySelector(".nsc-avatar-btn").addEventListener("click", () => {
        if (!isMine) openUserProfileModal(peer);
      });
      const pmBubble = wrap.querySelector(".nsc-bubble");
      if (pmBubble) {
        runBubbleEnhancers(pmBubble, { isPm: true });
      }
      msgsEl.appendChild(wrap);
    }
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  async function sendPmMessage() {
    const peer = state.activePmPeer;
    const ta = document.getElementById("nsc-pm-ta");
    const btn = document.getElementById("nsc-pm-send");
    const status = document.getElementById("nsc-pm-status");
    if (!peer || !ta || !btn) return;
    const content = ta.value.trim();
    if (!content) return;

    const seq = state.chatViewSeq;
    btn.disabled = true;
    btn.textContent = "发送中...";
    if (status) status.textContent = "正在发送私信...";
    try {
      await apiPostJson("/api/notification/message/send", { receiverUid: Number(peer.uid), content, markdown: true });
      ta.value = "";
      if (status) status.textContent = "发送成功";
      if (seq === state.chatViewSeq && state.activePmPeer && state.activePmPeer.uid === peer.uid) {
        await openPmConversation(peer);
      }
      fetchPmList();
    } catch (err) {
      if (status) status.textContent = "发送失败: " + err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = "发送私信";
    }
  }

  function resolveKnownPostTitle(postId) {
    if (!postId) return "";
    const pid = String(postId);
    if (state.postTitleCache[pid]) return state.postTitleCache[pid];
    if (state.readMap[pid] && state.readMap[pid].title) return state.readMap[pid].title;
    for (const ch of Object.values(state.channelData)) {
      const hit = ch && ch.items && ch.items.find((x) => x.postId === pid && x.title);
      if (hit) return hit.title;
    }
    for (const h of Object.values(state.hotCache)) {
      const hit = h && h.items && h.items.find((x) => x.postId === pid && x.title);
      if (hit) return hit.title;
    }
    return "";
  }

  function formatSysNoticeHtml(rawContent) {
    const src = String(rawContent || "").trim();
    const tokenRe = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)|((?:https?:\/\/(?:www\.)?nodeseek\.com)?\/(?:post-\d+(?:-\d+)?(?:#\d+)?|space\/\d+))/g;

    let userInfo = null;
    let firstPost = null;
    let plain = "";
    let last = 0;
    let m;

    while ((m = tokenRe.exec(src)) !== null) {
      plain += src.slice(last, m.index);
      const rawLabel = (m[1] || m[3] || "").trim();
      const url = (m[2] || m[3] || "").trim();
      const spaceMatch = url.match(/\/space\/(\d+)/);
      const postMatch = url.match(/\/post-(\d+)(?:-(\d+))?(?:#(\d+))?/);

      if (spaceMatch) {
        if (!userInfo) userInfo = { uid: spaceMatch[1], name: rawLabel };
        plain += rawLabel;
      } else if (postMatch) {
        const pid = postMatch[1];
        const postHref = `/post-${pid}-${postMatch[2] || 1}`;
        const isGeneric = /^(?:新的帖子|新帖子|帖子|评论|点击查看|https?:\/\/|\/post-)/.test(rawLabel);
        const cleanRawTitle = rawLabel.replace(/^[#『《\s]+|[』》\s]+$/g, "").trim();
        const resolvedTitle = isGeneric ? resolveKnownPostTitle(pid) : cleanRawTitle;
        if (!firstPost) {
          firstPost = {
            postId: pid,
            url: postHref,
            title: resolvedTitle || (isGeneric ? `帖子 #${pid}` : cleanRawTitle),
            needsTitle: !resolvedTitle && isGeneric,
            targetFloor: postMatch[3] || "",
          };
        }
        plain += isGeneric ? rawLabel : cleanRawTitle;
      } else {
        plain += rawLabel;
      }
      last = tokenRe.lastIndex;
    }
    plain += src.slice(last);

    const makeUserHtml = (name, uid) =>
      uid
        ? `<span class="nsc-sn-user" data-uid="${escHtml(uid)}">${escHtml(name)}</span>`
        : `<span class="nsc-sn-user">${escHtml(name)}</span>`;
    const makePostHtml = (post) =>
      `<a class="nsc-sn-post" href="${escHtml(post.url)}" data-pid="${escHtml(post.postId)}">${escHtml(post.title)}</a>`;

    // 模板 1：关注的人发了新帖
    if (/新的帖子|发布了?一篇新/.test(src)) {
      let uname = userInfo ? userInfo.name : "";
      if (!uname) {
        const um = plain.match(/(?:[您你]关注的用户\s*)?([^\s，,:：]+)\s*发布了/);
        if (um) uname = um[1];
      }
      const userPart = uname ? makeUserHtml(uname, userInfo && userInfo.uid) : "";
      const hasResolvedTitle = firstPost && !firstPost.needsTitle;
      const html = hasResolvedTitle
        ? `${userPart} 发布 ${makePostHtml(firstPost)}`
        : `${userPart} 发布了新帖`;
      return {
        html: html.trim(),
        firstPost,
        tag: { label: "新帖", cls: "nsc-sn-kw-post" },
      };
    }

    // 模板 2：投喂鸡腿 / 星辰点赞（评论或帖子）
    const isChicken = /投喂鸡腿/.test(src);
    const isStarLike = /星辰点赞/.test(src);
    if (isChicken || isStarLike) {
      const tag = isChicken
        ? { label: "🍗 鸡腿", cls: "nsc-sn-kw-reward" }
        : { label: "⭐ 点赞", cls: "nsc-sn-kw-comment" };
      let uname = userInfo ? userInfo.name : "";
      if (!uname) {
        const um = plain.match(/被用户\s*([^\s，。]+)\s*(?:投喂鸡腿|星辰点赞)/);
        if (um) uname = um[1];
      }
      const userPart = uname ? makeUserHtml(uname, userInfo && userInfo.uid) : "";
      const isCommentTarget = /您的\s*评论\s*被用户/.test(plain);
      if (isCommentTarget) {
        const verb = isChicken ? "投喂了评论" : "赞了评论";
        return { html: `${userPart} ${verb}`.trim(), firstPost, tag };
      }
      if (firstPost) {
        return { html: `${userPart} · ${makePostHtml(firstPost)}`.trim(), firstPost, tag };
      }
    }

    // 模板 3：管理扣分 / 违规警告
    if (/警告|封禁|禁言|违规|删除|-\d+\s*鸡腿/.test(src)) {
      let clean = plain
        .replace(/您的帖子『#?\s*/g, "")
        .replace(/』\s*/g, " ")
        .replace(/详细信息\s*$/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (firstPost && firstPost.title && clean.includes(firstPost.title)) {
        clean = escHtml(clean).replace(escHtml(firstPost.title), makePostHtml(firstPost));
      } else {
        clean = escHtml(clean);
      }
      return { html: clean, firstPost, tag: { label: "⚠️ 管理", cls: "nsc-sn-kw-warn" } };
    }

    // 模板 4：其他通用通知
    let clean = plain
      .replace(/您的帖子『#?\s*/g, "")
      .replace(/』\s*/g, " ")
      .replace(/[您你]关注的用户\s*/g, "")
      .replace(/\s+/g, " ")
      .trim();
    let html = escHtml(clean);
    if (userInfo && userInfo.name) {
      html = html.replace(escHtml(userInfo.name), makeUserHtml(userInfo.name, userInfo.uid));
    }
    if (firstPost && firstPost.title && !firstPost.needsTitle) {
      html = html.replace(escHtml(firstPost.title), makePostHtml(firstPost));
    }
    return { html, firstPost, tag: { label: "通知", cls: "nsc-sn-user" } };
  }

  let _snTitleQueueRunning = false;
  async function enrichSysNoticeTitles() {
    if (_snTitleQueueRunning) return;
    const targets = state.sysNoticeList.items
      .filter((it) => it.firstPost && it.firstPost.needsTitle && it.firstPost.postId && !resolveKnownPostTitle(it.firstPost.postId))
      .slice(0, 35);
    if (targets.length === 0) return;
    _snTitleQueueRunning = true;
    try {
      const seenPids = new Set();
      let resolvedBatch = 0;
      for (const it of targets) {
        if (state.activeChannel !== "sys-notice") break;
        const pid = it.firstPost.postId;
        if (seenPids.has(pid)) continue;
        seenPids.add(pid);
        try {
          const resp = await fetch(`/post-${pid}-1`, { credentials: "include" });
          if (resp.ok) {
            const doc = new DOMParser().parseFromString(await resp.text(), "text/html");
            const h1 = doc.querySelector(".nsk-post .post-title h1 a, .nsk-post .post-title h1");
            const title = (h1 ? h1.textContent.trim() : (doc.title || "").replace(/\s*-\s*NodeSeek.*$/i, "").trim());
            if (title) {
              state.postTitleCache[pid] = title;
              for (const item of state.sysNoticeList.items) {
                if (item.firstPost && item.firstPost.postId === pid) {
                  const reParsed = formatSysNoticeHtml(item.content);
                  item.html = reParsed.html;
                  item.firstPost = reParsed.firstPost;
                  item.tag = reParsed.tag;
                }
              }
              resolvedBatch++;
              if (resolvedBatch % 5 === 0 && state.activeChannel === "sys-notice") {
                renderTopicList();
              }
            }
          }
        } catch (_) {}
        await new Promise((r) => setTimeout(r, 260));
      }
      if (resolvedBatch > 0) {
        const ptKeys = Object.keys(state.postTitleCache);
        if (ptKeys.length > 500) {
          ptKeys.slice(0, ptKeys.length - 350).forEach((k) => delete state.postTitleCache[k]);
        }
        scheduleSaveJson(LS.POST_TITLE_CACHE, state.postTitleCache);
        if (state.activeChannel === "sys-notice") renderTopicList();
      }
    } finally {
      _snTitleQueueRunning = false;
    }
  }

  async function fetchSysNotices(silent = false) {
    if (state.sysNoticeList.loading) return;
    state.sysNoticeList.loading = true;
    state.sysNoticeList.error = null;
    if (!silent && state.activeChannel === "sys-notice") renderTopicList();

    detectCurrentUser();
    try {
      const resp = await fetch("/api/notification/message/with/5230", {
        headers: { Accept: "application/json, text/plain, */*" },
        credentials: "include",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const rows = Array.isArray(json.msgArray) ? json.msgArray : [];
      const myId = state.currentUserId;
      const items = rows.map((r) => {
        const parsed = formatSysNoticeHtml(r.content || "");
        const isUnread = (!myId || Number(r.receiver_id) === myId) && (r.viewed === false || r.viewed === 0 || r.viewed === "0");
        return {
          id: Number(r.id) || 0,
          content: String(r.content || ""),
          html: parsed.html,
          firstPost: parsed.firstPost,
          tag: parsed.tag,
          timeText: formatChineseTime("", r.created_at, ""),
          ts: new Date(r.created_at || 0).getTime() || 0,
          unread: isUnread,
        };
      });
      items.sort((a, b) => b.ts - a.ts || b.id - a.id);
      state.sysNoticeList.items = items;
      state.sysNoticeList.loaded = true;
      const sysCnt = items.filter((x) => x.unread).length;
      state.unreadCounts.sysNotice = sysCnt;
      if (state.totalMessageUnread > 0) {
        state.unreadCounts.message = Math.max(0, state.totalMessageUnread - sysCnt);
      }
      renderLeftNav();
      syncUserCardNotifyBadge();
      if (!silent && state.activeChannel === "sys-notice") {
        setTimeout(() => enrichSysNoticeTitles(), 120);
      }
    } catch (err) {
      state.sysNoticeList.error = err.message;
    } finally {
      state.sysNoticeList.loading = false;
      if (state.activeChannel === "sys-notice") renderTopicList();
      if (typeof renderUserHubIfOpen === "function") renderUserHubIfOpen();
    }
  }

  async function markSysNoticesRead(ids) {
    const validIds = (ids || []).filter((id) => Number(id) > 0).map(Number);
    if (validIds.length === 0) return;
    try {
      await fetch("/api/notification/message/markViewed", {
        method: "POST",
        credentials: "include",
        headers: getNodeSeekPostHeaders(),
        body: JSON.stringify({ messages: validIds }),
      });
      const idSet = new Set(validIds);
      state.sysNoticeList.items.forEach((x) => {
        if (idSet.has(x.id)) x.unread = false;
      });
      const sysCnt = state.sysNoticeList.items.filter((x) => x.unread).length;
      state.unreadCounts.sysNotice = sysCnt;
      if (state.totalMessageUnread > 0) {
        state.unreadCounts.message = Math.max(0, state.totalMessageUnread - sysCnt);
      }
      renderLeftNav();
      syncUserCardNotifyBadge();
      if (state.activeChannel === "sys-notice") renderTopicList();
      if (typeof renderUserHubIfOpen === "function") renderUserHubIfOpen();
    } catch (_) {}
  }

  function renderListToolbar() {
    const bar = document.getElementById("nsc-list-toolbar");
    if (!bar) return;
    bar.innerHTML = "";

    if (state.activeChannel === "history") {
      const backChId = state.lastBrowseChannel && state.lastBrowseChannel !== "history" ? state.lastBrowseChannel : "home";
      const backCh = CHANNELS.find((c) => c.id === backChId) || CHANNELS[0];
      const backBtn = document.createElement("button");
      backBtn.type = "button";
      backBtn.className = "nsc-mini-btn";
      backBtn.title = `返回 ${backCh.name}`;
      backBtn.textContent = `← 返回${backCh.name}`;
      backBtn.addEventListener("click", () => switchChannel(backCh.id, false));

      const tip = document.createElement("span");
      tip.style.cssText = "font-size:11px;color:var(--nsc-muted);";
      tip.textContent = "全站按最近阅读倒序";

      const clr = document.createElement("button");
      clr.type = "button";
      clr.className = "nsc-mini-btn";
      clr.textContent = "清空足迹";
      clr.addEventListener("click", () => {
        state.readMap = {};
        saveJson(LS.READ_MAP, {});
        renderLeftNav();
        renderTopicList();
      });
      bar.appendChild(backBtn);
      bar.appendChild(tip);
      bar.appendChild(clr);
      return;
    }

    if (state.activeChannel === "at-me" || state.activeChannel === "reply-me") {
      const kind = state.activeChannel;
      const btnAll = document.createElement("button");
      btnAll.type = "button";
      btnAll.className = "nsc-mini-btn";
      btnAll.textContent = "全部标为已读";
      btnAll.addEventListener("click", () => markNotificationViewed(kind, 0, true));

      const btnRef = document.createElement("button");
      btnRef.type = "button";
      btnRef.className = "nsc-mini-btn";
      btnRef.textContent = "刷新";
      btnRef.addEventListener("click", () => {
        fetchNotifications(kind);
        fetchUnreadCounts();
      });
      bar.appendChild(btnAll);
      bar.appendChild(btnRef);
      return;
    }

    if (state.activeChannel === "pm") {
      const btnRef = document.createElement("button");
      btnRef.type = "button";
      btnRef.className = "nsc-mini-btn";
      btnRef.textContent = "刷新会话";
      btnRef.addEventListener("click", () => {
        fetchPmList();
        fetchUnreadCounts();
      });
      const linkOrig = document.createElement("a");
      linkOrig.className = "nsc-mini-btn";
      linkOrig.style.textDecoration = "none";
      linkOrig.href = "/notification#/message";
      linkOrig.target = "_blank";
      linkOrig.textContent = "原版私信 ↗";
      bar.appendChild(btnRef);
      bar.appendChild(linkOrig);
      return;
    }

    if (state.activeChannel === "sys-notice") {
      const btnAll = document.createElement("button");
      btnAll.type = "button";
      btnAll.className = "nsc-mini-btn";
      btnAll.textContent = "全部标为已读";
      btnAll.addEventListener("click", () => {
        const unreadIds = state.sysNoticeList.items.filter((x) => x.unread && x.id).map((x) => x.id);
        markSysNoticesRead(unreadIds);
      });
      const btnRef = document.createElement("button");
      btnRef.type = "button";
      btnRef.className = "nsc-mini-btn";
      btnRef.textContent = "刷新";
      btnRef.addEventListener("click", () => fetchSysNotices(false));
      const linkOrig = document.createElement("a");
      linkOrig.className = "nsc-mini-btn";
      linkOrig.style.textDecoration = "none";
      linkOrig.href = "/notification#/message?mode=talk&to=5230";
      linkOrig.target = "_blank";
      linkOrig.textContent = "原版 ↗";
      bar.appendChild(btnAll);
      bar.appendChild(btnRef);
      bar.appendChild(linkOrig);
      return;
    }

    const seg = document.createElement("div");
    seg.className = "nsc-seg-tabs";
    [
      { id: "reply", label: "最新回复" },
      { id: "post", label: "最新帖子" },
    ].forEach((opt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "nsc-seg-btn" + (state.sortMode === opt.id ? " is-active" : "");
      b.textContent = opt.label;
      b.addEventListener("click", () => {
        state.sortMode = opt.id;
        localStorage.setItem(LS.SORT, opt.id);
        state.readFilterMode = "all";
        renderListToolbar();
        fetchChannelData(state.activeChannel, 1, true, false);
      });
      seg.appendChild(b);
    });

    const rightBtns = document.createElement("div");
    rightBtns.style.cssText = "display:inline-flex;gap:4px;";

    const btnUnread = document.createElement("button");
    btnUnread.type = "button";
    btnUnread.className = "nsc-mini-btn" + (state.readFilterMode === "unread" ? " is-active" : "");
    btnUnread.title = "刷新当前版块并将未读/有新回复帖子排在最前（再次点击取消）";
    btnUnread.textContent = "未读";
    btnUnread.addEventListener("click", () => {
      if (state.readFilterMode === "unread") {
        state.readFilterMode = "all";
        renderListToolbar();
        renderTopicList();
        return;
      }
      state.readFilterMode = "unread";
      renderListToolbar();
      fetchChannelData(state.activeChannel, 1, true, false);
    });

    const btnReadHistory = document.createElement("button");
    btnReadHistory.type = "button";
    btnReadHistory.className = "nsc-mini-btn" + (state.readFilterMode === "read" ? " is-active" : "");
    btnReadHistory.title = "仅看当前版块已读帖子足迹（不离开当前版块，再次点击返回）";
    btnReadHistory.textContent = "已读";
    btnReadHistory.addEventListener("click", () => {
      state.readFilterMode = state.readFilterMode === "read" ? "all" : "read";
      renderListToolbar();
      renderTopicList();
    });

    rightBtns.appendChild(btnUnread);
    rightBtns.appendChild(btnReadHistory);

    bar.appendChild(seg);
    bar.appendChild(rightBtns);
  }

  function parsePostListFromDoc(doc) {
    const items = [];
    const nodes = doc.querySelectorAll(".post-list-item, ul.post-list > li");
    for (const li of nodes) {
      const titleLink = li.querySelector(".post-title a[href*='/post-'], a[href*='/post-']");
      if (!titleLink) continue;
      const href = titleLink.getAttribute("href") || "";
      const m = href.match(/\/post-(\d+)/);
      if (!m) continue;
      const postId = m[1];
      const title = titleLink.textContent.trim();

      const img = li.querySelector("img[src*='/avatar/'], img.avatar-normal, img");
      const avatar = img ? img.getAttribute("src") : "";

      const authorLink = li.querySelector(".post-info a[href*='/space/'], .info-author a, a[href*='/space/'], a[href*='/member']");
      let author = authorLink ? authorLink.textContent.trim() : "";
      let uid = "";
      if (authorLink) {
        const um = (authorLink.getAttribute("href") || "").match(/\/space\/(\d+)/);
        if (um) uid = um[1];
      }
      if (!author) {
        const authorSpan = li.querySelector(".info-author");
        if (authorSpan) author = authorSpan.textContent.trim();
      }

      const catEl = li.querySelector("a[href*='/categories/']");
      const category = catEl ? catEl.textContent.trim() : "";

      const timeEl = li.querySelector("time");
      const { text: timeText } = getTimeFromEl(timeEl);

      let replies = 0;
      let views = 0;
      const infoEl = li.querySelector(".post-info") || li;
      const commentUse = infoEl.querySelector('use[href*="comment"], use[xlink\\:href*="comment"]');
      if (commentUse) {
        const sp = commentUse.closest("span, div, a");
        if (sp) {
          const nm = sp.textContent.match(/(\d+)/);
          if (nm) replies = Number(nm[1]);
        }
      }
      const viewUse = infoEl.querySelector('use[href*="eye"], use[href*="preview"], use[xlink\\:href*="eye"]');
      if (viewUse) {
        const sp = viewUse.closest("span, div, a");
        if (sp) {
          const nm = sp.textContent.match(/(\d+)/);
          if (nm) views = Number(nm[1]);
        }
      }
      if (replies === 0 && views === 0) {
        const nums = Array.from(infoEl.querySelectorAll("span")).map((s) => s.textContent.trim()).filter((t) => /^\d+$/.test(t));
        if (nums.length >= 2) {
          views = Number(nums[0]);
          replies = Number(nums[1]);
        } else if (nums.length === 1) {
          replies = Number(nums[0]);
        }
      }

      items.push({
        postId,
        url: href,
        title,
        avatar: avatar || (uid ? `/avatar/${uid}.png` : ""),
        author: author || "Seeker",
        uid,
        category,
        timeText,
        replies,
        views,
      });
    }
    return items;
  }

  async function fetchChannelData(channelId, page = 1, reset = false, silent = false) {
    const ch = CHANNELS.find((c) => c.id === channelId);
    if (!ch || ch.path.startsWith("__")) return;

    const cur = state.channelData[channelId] || { items: [], page: 0, loading: false, error: null, noMore: false };
    if (cur.loading) return;
    cur.loading = true;
    cur.error = null;
    if (reset || page === 1) cur.noMore = false;
    state.channelData[channelId] = cur;
    if (!silent && state.activeChannel === channelId) renderTopicList();

    const topicScroll = document.getElementById("nsc-topic-scroll");
    const prevTop = topicScroll && page > 1 ? topicScroll.scrollTop : 0;

    try {
      const base = ch.path === "/" ? "" : ch.path;
      const pagePart = page > 1 ? `${base}/page-${page}` : ch.path;
      const sortQuery = ch.id === "award" ? "" : state.sortMode === "post" ? "?sortBy=postTime" : "";
      const resp = await fetch(pagePart + sortQuery, { credentials: "include" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const doc = new DOMParser().parseFromString(await resp.text(), "text/html");
      const parsed = parsePostListFromDoc(doc);
      if (parsed.length === 0) cur.noMore = true;
      if (reset || page === 1) {
        cur.items = parsed;
      } else {
        const seen = new Set(cur.items.map((x) => x.postId));
        let added = 0;
        for (const it of parsed) {
          if (!seen.has(it.postId)) {
            cur.items.push(it);
            added++;
          }
        }
        if (added === 0) cur.noMore = true;
      }
      cur.page = page;
    } catch (err) {
      cur.error = err.message;
    } finally {
      cur.loading = false;
      renderLeftNav();
      if (state.activeChannel === channelId) {
        renderTopicList();
        if (topicScroll && page > 1) topicScroll.scrollTop = prevTop;
      }
    }
  }

  function tryAutoLoadNextTopicPage() {
    if (state.readFilterMode === "read") return;
    const chId = state.activeChannel;
    const ch = CHANNELS.find((c) => c.id === chId);
    if (!ch || ch.path.startsWith("__")) return;
    const data = state.channelData[chId];
    if (!data || data.loading || data.noMore) return;
    const nextPage = (data.page || 1) + 1;
    fetchChannelData(chId, nextPage, false, false);
  }

  async function fetchHotPosts(tabType = state.hotTab) {
    if (state.hotLoading) return;
    state.hotLoading = true;
    state.hotError = null;
    if (state.rightTab === "hot") renderRightBody();

    const apiMap = {
      realtime: "https://api.bimg.eu.org/hot.json",
      daily: "https://api.bimg.eu.org/daily.json",
      weekly: "https://api.bimg.eu.org/weekly.json",
    };

    try {
      const url = `${apiMap[tabType] || apiMap.realtime}?t=${Date.now()}`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const resp = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      if (json && Array.isArray(json.posts)) {
        const items = json.posts.map((item) => {
          const p = item.post || item;
          return {
            postId: String(p.id),
            url: `/post-${p.id}-1`,
            title: p.title || "",
            author: p.author || "Seeker",
            uid: p.author_id ? String(p.author_id) : "",
            avatar: p.author_id ? `/avatar/${p.author_id}.png` : "",
            views: Number(p.views) || 0,
            replies: Number(p.comments) || 0,
            score: Math.floor(Number(item.score) || 0),
          };
        });
        state.hotCache[tabType] = { items, updatedAt: json.updated_at || Math.floor(Date.now() / 1000) };
      } else {
        throw new Error("Invalid hot json");
      }
    } catch (err) {
      try {
        const map = new Map();
        for (const pUrl of ["/", "/page-2"]) {
          const r = await fetch(pUrl, { credentials: "include" });
          if (!r.ok) continue;
          const doc = new DOMParser().parseFromString(await r.text(), "text/html");
          for (const it of parsePostListFromDoc(doc)) {
            if (!map.has(it.postId)) {
              it.score = it.replies * 4 + Math.round(it.views / 25);
              map.set(it.postId, it);
            }
          }
        }
        const items = Array.from(map.values()).sort((a, b) => b.score - a.score);
        state.hotCache[tabType] = { items, updatedAt: Math.floor(Date.now() / 1000) };
      } catch (_) {
        state.hotError = err.message;
      }
    } finally {
      state.hotLoading = false;
      if (state.rightTab === "hot") renderRightBody();
    }
  }

  function renderTopicList() {
    const scrollEl = document.getElementById("nsc-topic-scroll");
    const subEl = document.getElementById("nsc-channel-sub");
    if (!scrollEl) return;

    const prevScrollTop = scrollEl.scrollTop;
    const restoreScroll = () => {
      if (prevScrollTop > 0) scrollEl.scrollTop = prevScrollTop;
    };
    const kw = state.searchKeyword;

    if (state.activeChannel === "at-me" || state.activeChannel === "reply-me") {
      const kind = state.activeChannel;
      const st = state.notifData[kind];
      if (st.loading && st.items.length === 0) {
        scrollEl.innerHTML = `<div class="nsc-empty-state">正在同步消息通知...</div>`;
        return;
      }
      if (st.error && st.items.length === 0) {
        scrollEl.innerHTML = `<div class="nsc-empty-state" style="color:#ff3b30;">加载失败: ${st.error}</div>`;
        return;
      }
      const list = st.items.filter((it) => {
        if (isMemberHidden(it.author)) return false;
        if (!kw) return true;
        return (it.title || "").toLowerCase().includes(kw) || (it.author || "").toLowerCase().includes(kw);
      });
      if (subEl) subEl.textContent = `${list.length} 条`;
      if (list.length === 0) {
        scrollEl.innerHTML = `<div class="nsc-empty-state">暂无${kind === "at-me" ? "@我的通知" : "回复我的消息"}</div>`;
        return;
      }
      scrollEl.innerHTML = "";
      const srvUnread = Number(state.unreadCounts[kind === "at-me" ? "atMe" : "reply"]) || 0;
      const visibleUnread = list.filter((x) => !x.viewed).length;
      if (srvUnread > 0 && visibleUnread === 0) {
        const hint = document.createElement("div");
        hint.style.cssText =
          "display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 9px;margin:2px 2px 6px;border-radius:8px;background:var(--nsc-accent-soft);font-size:11px;color:var(--nsc-accent);";
        hint.innerHTML = `<span>服务端仍有 ${srvUnread} 条较早未读</span>`;
        const clrBtn = document.createElement("button");
        clrBtn.type = "button";
        clrBtn.className = "nsc-mini-btn";
        clrBtn.textContent = "全部标为已读";
        clrBtn.addEventListener("click", () => markNotificationViewed(kind, 0, true));
        hint.appendChild(clrBtn);
        scrollEl.appendChild(hint);
      }
      list.forEach((it) => {
        const rowKey = `${kind}:${it.id}:${it.postId}:${it.floorId}`;
        const row = document.createElement("div");
        row.className = "nsc-topic-item" + (it.viewed ? " is-read" : "") + (state.selectedNotifKey === rowKey ? " is-selected" : "");
        row.innerHTML = `
          ${it.avatar ? `<img class="nsc-topic-avatar" src="${it.avatar}" loading="lazy" alt="" />` : `<div class="nsc-topic-avatar-fb">${(it.author || "S").slice(0, 1).toUpperCase()}</div>`}
          <div class="nsc-topic-body">
            <div class="nsc-topic-top">
              <div class="nsc-topic-title"></div>
              ${!it.viewed ? `<span class="nsc-badge-dot" title="未读"></span>` : `<span class="nsc-badge-read">已读</span>`}
            </div>
            <div class="nsc-topic-meta">
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px;"></span>
              <span>#${it.floorId || 0}楼${it.timeText ? " · " + it.timeText : ""}</span>
            </div>
          </div>
        `;
        row.querySelector(".nsc-topic-title").textContent = it.title;
        row.querySelector(".nsc-topic-meta span:first-child").textContent = `${it.author} ${kind === "at-me" ? "@了你" : "回复了你"}`;
        row.addEventListener("click", () => {
          state.selectedNotifKey = rowKey;
          if (!it.viewed) {
            markNotificationViewed(kind, it, false);
          }
          openPostInChat({
            postId: it.postId,
            url: it.url,
            title: it.title,
            author: it.author,
            avatar: it.avatar,
            targetFloor: it.floorId ? String(it.floorId) : "",
          });
        });
        scrollEl.appendChild(row);
      });
      restoreScroll();
      return;
    }

    if (state.activeChannel === "pm") {
      const st = state.pmList;
      if (st.loading && st.items.length === 0) {
        scrollEl.innerHTML = `<div class="nsc-empty-state">正在读取私信会话...</div>`;
        return;
      }
      if (st.error && st.items.length === 0) {
        scrollEl.innerHTML = `<div class="nsc-empty-state" style="color:#ff3b30;">加载失败: ${st.error}</div>`;
        return;
      }
      const list = st.items.filter((it) => {
        if (isMemberHidden(it.name)) return false;
        if (!kw) return true;
        return (it.name || "").toLowerCase().includes(kw) || (it.content || "").toLowerCase().includes(kw);
      });
      if (subEl) subEl.textContent = `${list.length} 位`;
      if (list.length === 0) {
        scrollEl.innerHTML = `<div class="nsc-empty-state">暂无站内私信会话</div>`;
        return;
      }
      scrollEl.innerHTML = "";
      list.forEach((it) => {
        const row = document.createElement("div");
        const isSel = state.activePmPeer && state.activePmPeer.uid === it.uid;
        row.className = "nsc-topic-item" + (isSel ? " is-selected" : "");
        row.innerHTML = `
          <img class="nsc-topic-avatar" src="${it.avatar}" loading="lazy" alt="" />
          <div class="nsc-topic-body">
            <div class="nsc-topic-top">
              <div class="nsc-topic-title" style="-webkit-line-clamp:1;"></div>
              ${it.unread ? `<span class="nsc-badge-dot" title="未读私信"></span>` : `<span class="nsc-badge-read">${it.timeText || ""}</span>`}
            </div>
            <div class="nsc-pm-preview"></div>
          </div>
        `;
        row.querySelector(".nsc-topic-title").textContent = it.name;
        row.querySelector(".nsc-pm-preview").textContent = it.content || "(无正文)";
        row.addEventListener("click", () => openPmConversation(it));
        scrollEl.appendChild(row);
      });
      restoreScroll();
      return;
    }

    if (state.activeChannel === "sys-notice") {
      const st = state.sysNoticeList;
      if (st.loading && st.items.length === 0) {
        scrollEl.innerHTML = `<div class="nsc-empty-state">正在读取系统通知...</div>`;
        return;
      }
      if (st.error && st.items.length === 0) {
        scrollEl.innerHTML = `<div class="nsc-empty-state" style="color:#ff3b30;">加载失败: ${st.error}</div>`;
        return;
      }
      const list = st.items.filter((it) => !kw || (it.content || "").toLowerCase().includes(kw));
      if (subEl) subEl.textContent = `${list.length} 条`;
      if (list.length === 0) {
        scrollEl.innerHTML = `<div class="nsc-empty-state">暂无系统通知</div>`;
        return;
      }
      scrollEl.innerHTML = "";
      list.forEach((it) => {
        const rowKey = `sys:${it.id}`;
        const card = document.createElement("div");
        card.className =
          "nsc-sn-card" +
          (!it.unread ? " is-read" : "") +
          (state.selectedNotifKey === rowKey ? " is-selected" : "");
        card.innerHTML = `
          <div class="nsc-sn-row1">
            <div class="nsc-sn-line">
              <span class="${it.tag.cls}" style="margin-right:4px;">${it.tag.label}</span><span class="nsc-sn-text">${it.html}</span>
            </div>
            <span class="nsc-sn-time">
              ${it.timeText || ""}
              ${it.unread ? `<span class="nsc-badge-dot" style="margin-top:0;" title="未读"></span>` : ""}
            </span>
          </div>
        `;
        card.querySelectorAll(".nsc-sn-user[data-uid]").forEach((uEl) => {
          uEl.style.cursor = "pointer";
          uEl.addEventListener("click", (e) => {
            e.stopPropagation();
            openUserProfileModal({ uid: uEl.dataset.uid, name: uEl.textContent.trim() });
          });
        });
        card.querySelectorAll(".nsc-sn-post[data-pid]").forEach((pEl) => {
          pEl.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            state.selectedNotifKey = rowKey;
            if (it.unread && it.id) markSysNoticesRead([it.id]);
            openPostInChat({
              postId: pEl.dataset.pid,
              url: pEl.getAttribute("href"),
              title: pEl.textContent.trim(),
            });
          });
        });
        card.addEventListener("click", () => {
          state.selectedNotifKey = rowKey;
          if (it.unread && it.id) markSysNoticesRead([it.id]);
          if (it.firstPost) {
            openPostInChat(it.firstPost);
          } else {
            ++state.chatViewSeq;
            state.activePmPeer = null;
            clearPostRoomState();
            syncComposerMode("none");
            renderTopicList();
            const titleEl = document.getElementById("nsc-chat-title");
            const subChat = document.getElementById("nsc-chat-subtitle");
            const actionsEl = document.getElementById("nsc-chat-actions");
            const msgsEl = document.getElementById("nsc-chat-messages");
            if (titleEl) {
              titleEl.textContent = `系统通知 · ${it.tag.label}`;
              titleEl.classList.remove("is-copyable");
              titleEl.removeAttribute("title");
            }
            const copyTipEl = document.getElementById("nsc-chat-copy-tip");
            if (copyTipEl) copyTipEl.classList.remove("is-show");
            if (subChat) subChat.textContent = it.timeText || "UID 5230";
            if (actionsEl) actionsEl.innerHTML = "";
            if (msgsEl) {
              msgsEl.innerHTML = `
                <div class="nsc-msg">
                  <div class="nsc-avatar-col"><button type="button" class="nsc-avatar-btn"><img src="/avatar/5230.png" alt="系统通知" /></button></div>
                  <div class="nsc-msg-main">
                    <div class="nsc-msg-meta"><span class="nsc-msg-author">系统通知</span><span class="${it.tag.cls}">${it.tag.label}</span><span>${escHtml(it.timeText || "")}</span></div>
                    <div class="nsc-bubble-row"><div class="nsc-bubble">${it.html}</div></div>
                  </div>
                </div>
              `;
            }
          }
        });
        scrollEl.appendChild(card);
      });
      restoreScroll();
      return;
    }

    let items = [];
    let isLoading = false;
    let error = null;
    let page = 1;
    const isHistoryChannel = state.activeChannel === "history";
    const isBoardReadView = !isHistoryChannel && state.readFilterMode === "read";

    if (isHistoryChannel) {
      items = Object.values(state.readMap).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    } else if (isBoardReadView) {
      const curCh = CHANNELS.find((c) => c.id === state.activeChannel);
      const data = state.channelData[state.activeChannel];
      const byPid = new Map();
      if (data && Array.isArray(data.items)) {
        for (const it of data.items) {
          const rec = state.readMap[it.postId];
          if (rec) {
            byPid.set(it.postId, { ...it, ts: rec.ts || 0 });
          }
        }
      }
      for (const rec of Object.values(state.readMap)) {
        if (!rec || !rec.postId || byPid.has(rec.postId)) continue;
        if (state.activeChannel === "home" || state.activeChannel === "award" || (curCh && rec.category === curCh.name)) {
          byPid.set(rec.postId, rec);
        }
      }
      items = Array.from(byPid.values()).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    } else {
      const data = state.channelData[state.activeChannel];
      if (!data) {
        scrollEl.innerHTML = `<div class="nsc-empty-state">加载中...</div>`;
        return;
      }
      isLoading = data.loading;
      error = data.error;
      page = data.page || 1;
      items = [...(data.items || [])];
    }

    if (isLoading && items.length === 0) {
      scrollEl.innerHTML = `<div class="nsc-empty-state">正在加载列表...</div>`;
      return;
    }
    if (error && items.length === 0) {
      scrollEl.innerHTML = `<div class="nsc-empty-state" style="color:#ff3b30;">加载失败: ${error}</div>`;
      return;
    }

    items = items.filter((it) => {
      if (isMemberHidden(it.author)) return false;
      if (!kw) return true;
      return (it.title || "").toLowerCase().includes(kw) || (it.author || "").toLowerCase().includes(kw);
    });

    if (state.readFilterMode === "unread" && !isHistoryChannel) {
      items.sort((a, b) => {
        const ra = getReadStatus(a.postId, a.replies).status === "read" ? 1 : 0;
        const rb = getReadStatus(b.postId, b.replies).status === "read" ? 1 : 0;
        return ra - rb;
      });
    }

    if (subEl) subEl.textContent = `${items.length} 条`;

    if (items.length === 0) {
      scrollEl.innerHTML = `<div class="nsc-empty-state">${
        isHistoryChannel
          ? "暂无已读足迹，点击打开任意帖子后会记录在这里"
          : isBoardReadView
            ? "当前版块暂无已读记录，点击「已读」或打开任意帖子后可在此回溯"
            : "暂无匹配帖子"
      }</div>`;
      return;
    }

    scrollEl.innerHTML = "";
    items.forEach((it) => {
      const rs = (isHistoryChannel || isBoardReadView) ? { status: "read", delta: 0 } : getReadStatus(it.postId, it.replies);
      const row = document.createElement("div");
      row.className =
        "nsc-topic-item" +
        (rs.status === "read" && !isHistoryChannel && !isBoardReadView ? " is-read" : "") +
        (state.currentPostId === it.postId ? " is-selected" : "");

      const avatarHtml = it.avatar
        ? `<img class="nsc-topic-avatar" src="${it.avatar}" loading="lazy" alt="" />`
        : `<div class="nsc-topic-avatar-fb">${(it.author || "S").slice(0, 1).toUpperCase()}</div>`;

      let badgeHtml = "";
      if (isHistoryChannel || isBoardReadView) {
        badgeHtml = `<span class="nsc-badge-read">${formatRelativeFromMs(it.ts)}</span>`;
      } else if (rs.status === "unread") {
        badgeHtml = `<span class="nsc-badge-dot" title="未读"></span>`;
      } else if (rs.status === "updated") {
        badgeHtml = `<span class="nsc-badge-delta" title="有 ${rs.delta} 条新回复">+${rs.delta}</span>`;
      } else {
        badgeHtml = `<span class="nsc-badge-read">已读</span>`;
      }

      row.innerHTML = `
        ${avatarHtml}
        <div class="nsc-topic-body">
          <div class="nsc-topic-top">
            <div class="nsc-topic-title"></div>
            ${badgeHtml}
          </div>
          <div class="nsc-topic-meta">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px;"></span>
            <span>回复 ${it.replies || 0}${it.timeText ? " · " + it.timeText : ""}</span>
          </div>
        </div>
      `;
      row.querySelector(".nsc-topic-title").textContent = it.title;
      row.querySelector(".nsc-topic-meta span:first-child").textContent =
        `${it.author || "Seeker"}${it.category ? " · " + it.category : ""}`;

      row.addEventListener("click", () => openPostInChat(it));
      scrollEl.appendChild(row);
    });

    if (!isHistoryChannel && !isBoardReadView) {
      const chData = state.channelData[state.activeChannel];
      const wf = document.createElement("div");
      wf.style.cssText = "text-align:center;font-size:11px;color:var(--nsc-muted);padding:8px 4px;";
      if (chData && chData.noMore) {
        wf.textContent = "已加载全部帖子";
      } else if (isLoading) {
        wf.textContent = `正在瀑布流加载第 ${page + 1} 页...`;
      } else {
        wf.textContent = `下滑自动加载第 ${page + 1} 页`;
      }
      scrollEl.appendChild(wf);

      // 搜索过滤结果较少时自动向下瀑布流预拉最多至第 4 页（仅在无错误时）
      if (kw && items.length < 8 && chData && !chData.loading && !chData.noMore && !chData.error && page < 4) {
        setTimeout(() => tryAutoLoadNextTopicPage(), 80);
      }
    }
    restoreScroll();
  }

  // ==========================================================================
  // Module: 07-post-chat.js
  // ==========================================================================
  async function fetchPostPageDoc(url) {
    const resp = await fetch(url, { credentials: "include" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return new DOMParser().parseFromString(await resp.text(), "text/html");
  }

  function mergePostPageComments(room, doc, pageNum) {
    if (!room || !doc) return 0;
    const tempMetaMap = extractPostMetaFromTempScript(doc);
    if (pageNum === 1 && !room.opObj) {
      const opNode = doc.querySelector(".nsk-post .content-item");
      if (opNode) {
        room.opObj = extractCommentObject(opNode, true, 1, tempMetaMap);
        state.opAuthor = room.opObj.author;
      }
    }
    const seenFloors = new Set(room.flatComments.map((c) => c.floorId));
    let added = 0;
    for (const el of doc.querySelectorAll("ul.comments li.content-item")) {
      const obj = extractCommentObject(el, false, pageNum, tempMetaMap);
      if (obj.floorId && seenFloors.has(obj.floorId)) continue;
      if (obj.floorId) seenFloors.add(obj.floorId);
      if (state.opAuthor && obj.author === state.opAuthor) obj.isOp = true;
      room.flatComments.push(obj);
      added++;
    }
    state.loadedPages.add(pageNum);
    for (const np of parsePagesFromDoc(doc, room.pid)) {
      if (!room.pages.some((p) => p.num === np.num)) room.pages.push(np);
    }
    room.pages.sort((a, b) => a.num - b.num);
    return added;
  }

  async function openPostInChat(itemMeta) {
    const reqSeq = ++state.chatViewSeq;
    state.activePmPeer = null;
    const url = itemMeta.url || `/post-${itemMeta.postId}-1`;
    const pid = itemMeta.postId || getPostIdFromPath(url);
    state.currentRoom = null;
    state.loadedPages.clear();
    state.loadingNextPage = false;
    state.loadingPrevPage = false;
    state.currentPostId = pid;
    state.currentPostUrl = url;
    state.onlyOp = false;
    state.onlyMember = "";

    markPostOpenedAsRead({
      postId: pid,
      url,
      title: itemMeta.title,
      author: itemMeta.author,
      avatar: itemMeta.avatar,
      category: itemMeta.category,
      replies: itemMeta.replies || 0,
    });
    renderTopicList();

    const msgsEl = document.getElementById("nsc-chat-messages");
    if (msgsEl) msgsEl.innerHTML = `<div class="nsc-empty-state">正在载入帖子群聊内容...</div>`;

    try {
      const doc = await fetchPostPageDoc(url);
      if (reqSeq !== state.chatViewSeq || state.activePmPeer || state.currentPostId !== pid) return;
      renderPostDocument(doc, url, pid === state.nativePostId, itemMeta);
      if (itemMeta.targetFloor) {
        const postRenderSeq = state.chatViewSeq;
        setTimeout(() => {
          if (postRenderSeq !== state.chatViewSeq || state.activePmPeer || state.currentPostId !== pid) return;
          jumpToFloor(itemMeta.targetFloor);
        }, 60);
      }
    } catch (err) {
      if (reqSeq !== state.chatViewSeq || state.activePmPeer || state.currentPostId !== pid) return;
      if (msgsEl) msgsEl.innerHTML = `<div class="nsc-empty-state">加载失败：${escHtml(err.message)}</div>`;
    }
  }

  function extractCommentObject(el, isOpFloor = false, pageNum = 1, tempMetaMap = null) {
    const floorId = isOpFloor ? "0" : String(el.id || "").trim();
    const tempMeta = tempMetaMap ? tempMetaMap.get(floorId) : null;
    const commentId = String(el.getAttribute("data-comment-id") || (tempMeta && tempMeta.commentId) || "").trim();
    const meta = el.querySelector(".nsk-content-meta-info");
    const authorEl = meta ? meta.querySelector(".author-name") : null;
    const author = authorEl ? authorEl.textContent.trim() : "匿名";
    const authorHref = authorEl ? authorEl.getAttribute("href") || "" : "";
    const uidMatch = authorHref.match(/\/space\/(\d+)/);
    const uid = uidMatch ? uidMatch[1] : "";

    const avatarImg = meta ? meta.querySelector(".avatar-wrapper img") : null;
    const avatar = avatarImg ? avatarImg.getAttribute("src") : uid ? `/avatar/${uid}.png` : "";

    let level = "";
    if (uid && state.userCache[uid]) {
      const uc = state.userCache[uid];
      level = uc.days && uc.days !== "--" ? `${uc.level} · ${uc.days}` : uc.level;
    }

    const hasOpBadge = meta
      ? Array.from(meta.querySelectorAll(".nsk-badge, .role-tag, span")).some((s) => s.textContent.trim() === "楼主")
      : false;

    const timeEl = meta ? meta.querySelector(".date-created time") : null;
    const { text: timeText, title: timeTitle } = getTimeFromEl(timeEl);

    const article = el.querySelector(":scope > article.post-content, article.post-content");
    const bodyHtml = article ? article.innerHTML : "";

    const sigEl = el.querySelector(":scope > .signature, .signature");
    const signatureHtml = sigEl ? sigEl.innerHTML.trim() : "";
    if (signatureHtml) {
      if (uid) state.signatureCache[`uid:${uid}`] = signatureHtml;
      if (author) state.signatureCache[`name:${author}`] = signatureHtml;
    }

    const menu = el.querySelector(":scope > .comment-menu, .comment-menu");
    let domLikes = 0;
    let domLegs = 0;
    let domDislikes = 0;
    let domUpvoted = false;
    let domLiked = false;
    let domDisliked = false;
    let domPinned = Boolean(
      meta && meta.querySelector('.pined-comment-badge, .floor-link-wrapper use[href="#pin"]')
    );
    if (menu) {
      const likeMenu = menu.querySelector('.menu-item[title="点赞"]');
      const legMenu = menu.querySelector('.menu-item[title="加鸡腿"]');
      const dislikeMenu = menu.querySelector('.menu-item[title="反对"]');
      const likeItem = likeMenu && likeMenu.querySelector("span");
      const legItem = legMenu && legMenu.querySelector("span");
      const dislikeItem = dislikeMenu && dislikeMenu.querySelector("span");
      if (likeItem) domLikes = Number(likeItem.textContent.trim()) || 0;
      if (legItem) domLegs = Number(legItem.textContent.trim()) || 0;
      if (dislikeItem) domDislikes = Number(dislikeItem.textContent.trim()) || 0;
      if (likeMenu && likeMenu.classList.contains("clicked")) domUpvoted = true;
      if (legMenu && legMenu.classList.contains("clicked")) domLiked = true;
      if (dislikeMenu && dislikeMenu.classList.contains("clicked")) domDisliked = true;
      if (!domPinned) {
        domPinned = Array.from(menu.querySelectorAll(".menu-item")).some(
          (m) => (m.textContent || "").trim() === "取消置顶"
        );
      }
    }
    const likes = Math.max(domLikes, (tempMeta && tempMeta.likes) || 0);
    const legs = Math.max(domLegs, (tempMeta && tempMeta.legs) || 0);
    const dislikes = Math.max(domDislikes, (tempMeta && tempMeta.dislikes) || 0);
    const upvoted = domUpvoted || Boolean(tempMeta && tempMeta.upvoted);
    const liked = domLiked || Boolean(tempMeta && tempMeta.liked);
    const disliked = domDisliked || Boolean(tempMeta && tempMeta.disliked);
    const pinned = domPinned || Boolean(tempMeta && tempMeta.pinned);

    let replyToFloor = null;
    if (!isOpFloor && article) {
      const refLinks = article.querySelectorAll('blockquote a[href*="#"], p:first-child a[href*="#"]');
      for (const a of refLinks) {
        const m = (a.getAttribute("href") || "").match(/#(\d+)$/);
        if (m && m[1] !== floorId) {
          replyToFloor = m[1];
          break;
        }
      }
      if (!replyToFloor) {
        const txt = (article.textContent || "").slice(0, 120);
        const m = txt.match(/(?:@\S+\s+#(\d+))|(?:^|[^\d#])(\d{1,4})#|#(\d{1,4})/);
        const matchedFloor = m && (m[1] || m[2] || m[3]);
        if (matchedFloor && matchedFloor !== floorId) replyToFloor = matchedFloor;
      }
    }

    return {
      floorId,
      commentId,
      pageNum,
      author,
      uid,
      avatar,
      level,
      isOp: isOpFloor || hasOpBadge,
      timeText,
      timeTitle,
      bodyHtml,
      signatureHtml,
      likes,
      legs,
      dislikes,
      upvoted,
      liked,
      disliked,
      pinned,
      replyToFloor,
      children: [],
    };
  }

  function parsePageNumFromUrl(url) {
    const m = String(url || "").match(/\/post-\d+-(\d+)/);
    return m ? Number(m[1]) : 1;
  }

  function parsePagesFromDoc(doc, pid) {
    const pages = [];
    const seen = new Set();
    for (const a of doc.querySelectorAll(".post-top-pager a.pager-pos, .post-top-pager span.pager-pos")) {
      const label = a.textContent.trim();
      if (!/^\d+$/.test(label)) continue;
      const num = Number(label);
      if (seen.has(num)) continue;
      seen.add(num);
      const href = a.getAttribute("href") || `/post-${pid}-${num}`;
      pages.push({ num, label, href, cur: a.classList.contains("pager-cur") });
    }
    pages.sort((a, b) => a.num - b.num);
    return pages;
  }

  function renderPostDocument(doc, url, isNativePage, itemHint = null) {
    ++state.chatViewSeq;
    state.activePmPeer = null;
    const pid = getPostIdFromPath(url);
    const pageNum = parsePageNumFromUrl(url);
    state.currentPostId = pid;
    state.currentPostUrl = url;
    state.loadedPages = new Set([pageNum]);
    state.loadingNextPage = false;
    state.loadingPrevPage = false;

    const titleEl = doc.querySelector(".nsk-post .post-title h1 a, .nsk-post .post-title h1");
    const title = titleEl ? titleEl.textContent.trim() : (itemHint && itemHint.title) || doc.title || "帖子详情";
    const catEl = doc.querySelector(".nsk-post .content-category a");
    const catName = catEl ? catEl.textContent.trim() : (itemHint && itemHint.category) || "";

    const pages = parsePagesFromDoc(doc, pid);
    const tempMetaMap = extractPostMetaFromTempScript(doc);

    const opNode = doc.querySelector(".nsk-post .content-item");
    const opObj = opNode ? extractCommentObject(opNode, true, 1, tempMetaMap) : null;
    if (opObj) state.opAuthor = opObj.author;
    else if (itemHint && itemHint.author) state.opAuthor = itemHint.author;

    const allCommentEls = Array.from(doc.querySelectorAll("ul.comments li.content-item"));
    const flatComments = [];
    const seenFloors = new Set();
    for (const el of allCommentEls) {
      const obj = extractCommentObject(el, false, pageNum, tempMetaMap);
      if (obj.floorId && seenFloors.has(obj.floorId)) continue;
      if (obj.floorId) seenFloors.add(obj.floorId);
      if (!state.opAuthor && obj.isOp) state.opAuthor = obj.author;
      flatComments.push(obj);
    }

    for (const c of flatComments) {
      if (state.opAuthor && c.author === state.opAuthor) c.isOp = true;
    }

    let maxFloor = (itemHint && itemHint.replies) || 0;
    for (const c of flatComments) {
      const n = Number(c.floorId);
      if (!Number.isNaN(n) && n > maxFloor) maxFloor = n;
    }

    markPostOpenedAsRead({
      postId: pid,
      url,
      title,
      author: (opObj && opObj.author) || state.opAuthor || (itemHint && itemHint.author) || "",
      avatar: (opObj && opObj.avatar) || (itemHint && itemHint.avatar) || "",
      category: catName,
      replies: maxFloor,
    });
    renderTopicList();

    state.currentRoom = { pid, url, title, catName, pages, opObj, flatComments, isNativePage };
    renderChatRoom(state.currentRoom);
  }

  async function tryAutoLoadNextPage() {
    const room = state.currentRoom;
    if (state.activePmPeer || !room || state.currentPostId !== room.pid || state.loadingNextPage || !room.pages || room.pages.length <= 1) return;

    const maxLoaded = Math.max(...Array.from(state.loadedPages));
    const nextPageObj = room.pages.find((p) => p.num === maxLoaded + 1);
    if (!nextPageObj) return;

    state.loadingNextPage = true;
    const footerTip = document.getElementById("nsc-waterfall-status");
    if (footerTip) footerTip.textContent = `正在瀑布流预加载第 ${nextPageObj.num} 页...`;

    try {
      const doc = await fetchPostPageDoc(nextPageObj.href);
      if (state.activePmPeer || state.currentRoom !== room || state.currentPostId !== room.pid) return;
      const added = mergePostPageComments(room, doc, nextPageObj.num);
      if (added > 0) {
        const msgsEl = document.getElementById("nsc-chat-messages");
        const prevScroll = msgsEl ? msgsEl.scrollTop : 0;
        renderChatRoom(room, true);
        if (msgsEl) msgsEl.scrollTop = prevScroll;
      } else if (footerTip) {
        footerTip.textContent = `已加载第 ${Array.from(state.loadedPages).join("/")} 页`;
      }
    } catch (_) {
      if (!state.activePmPeer && state.currentRoom === room && footerTip) footerTip.textContent = "加载下一页失败";
    } finally {
      state.loadingNextPage = false;
    }
  }

  async function tryAutoLoadPrevPage() {
    const room = state.currentRoom;
    if (state.activePmPeer || !room || state.currentPostId !== room.pid || state.loadingPrevPage || !room.pages || room.pages.length <= 1) return;

    const minLoaded = Math.min(...Array.from(state.loadedPages));
    if (minLoaded <= 1) return;
    const prevPageObj = room.pages.find((p) => p.num === minLoaded - 1) || {
      num: minLoaded - 1,
      href: `/post-${room.pid}-${minLoaded - 1}`,
    };

    state.loadingPrevPage = true;
    const prevTip = document.getElementById("nsc-prev-waterfall-status");
    if (prevTip) prevTip.textContent = `正在瀑布流加载第 ${prevPageObj.num} 页...`;

    try {
      const doc = await fetchPostPageDoc(prevPageObj.href);
      if (state.activePmPeer || state.currentRoom !== room || state.currentPostId !== room.pid) return;
      const hadOp = Boolean(room.opObj);
      const added = mergePostPageComments(room, doc, prevPageObj.num);
      room.flatComments.sort((a, b) => (a.pageNum - b.pageNum) || (Number(a.floorId) - Number(b.floorId)));
      if (added > 0 || (prevPageObj.num === 1 && !hadOp && room.opObj)) {
        const msgsEl = document.getElementById("nsc-chat-messages");
        const prevH = msgsEl ? msgsEl.scrollHeight : 0;
        const prevTop = msgsEl ? msgsEl.scrollTop : 0;
        renderChatRoom(room, true);
        if (msgsEl) {
          const delta = msgsEl.scrollHeight - prevH;
          msgsEl.scrollTop = Math.max(0, prevTop + delta);
        }
      } else if (prevTip) {
        prevTip.textContent = `已加载至第 ${prevPageObj.num} 页`;
      }
    } catch (_) {
      if (!state.activePmPeer && state.currentRoom === room && prevTip) prevTip.textContent = "加载上一页失败，点击重试";
    } finally {
      state.loadingPrevPage = false;
    }
  }

  async function jumpToFloor(floorNumStr) {
    const targetId = String(floorNumStr || "").replace(/[^\d]/g, "");
    if (!targetId || state.activePmPeer) return;

    const msgsEl = document.getElementById("nsc-chat-messages");
    let target =
      (msgsEl && msgsEl.querySelector(`[data-floor="${targetId}"]`)) ||
      document.getElementById(`nsc-floor-${targetId}`);

    if (!target && state.currentRoom) {
      const room = state.currentRoom;
      const jumpSeq = state.chatViewSeq;
      const expectedPage = Math.max(1, Math.ceil(Number(targetId) / 10));
      let foundDuringLoad = false;

      if (!state.loadedPages.has(expectedPage)) {
        try {
          const doc = await fetchPostPageDoc(`/post-${room.pid}-${expectedPage}`);
          if (jumpSeq !== state.chatViewSeq || state.activePmPeer || state.currentRoom !== room || state.currentPostId !== room.pid) return;
          mergePostPageComments(room, doc, expectedPage);
          foundDuringLoad = room.flatComments.some((c) => String(c.floorId) === targetId);
        } catch (_) {}
      }

      if (!foundDuringLoad && room.pages.length > 1) {
        for (const p of room.pages) {
          if (jumpSeq !== state.chatViewSeq || state.activePmPeer || state.currentRoom !== room || state.currentPostId !== room.pid) return;
          if (state.loadedPages.has(p.num)) continue;
          try {
            const doc = await fetchPostPageDoc(p.href);
            if (jumpSeq !== state.chatViewSeq || state.activePmPeer || state.currentRoom !== room || state.currentPostId !== room.pid) return;
            mergePostPageComments(room, doc, p.num);
            if (room.flatComments.some((c) => String(c.floorId) === targetId)) break;
          } catch (_) {}
        }
      }

      if (jumpSeq !== state.chatViewSeq || state.activePmPeer || state.currentRoom !== room || state.currentPostId !== room.pid) return;
      room.flatComments.sort((a, b) => (a.pageNum - b.pageNum) || (Number(a.floorId) - Number(b.floorId)));
      renderChatRoom(room, true);
      target =
        (msgsEl && msgsEl.querySelector(`[data-floor="${targetId}"]`)) ||
        document.getElementById(`nsc-floor-${targetId}`);
    }

    if (!target) return;
    const hiddenThread = target.closest(".nsc-thread-wrap.is-collapsed");
    if (hiddenThread) hiddenThread.classList.remove("is-collapsed");
    if (target.classList.contains("is-hidden-filter")) {
      state.onlyOp = false;
      state.onlyMember = "";
      applyMessageFilters();
    }
    if (msgsEl) {
      const cRect = msgsEl.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      const targetTop = msgsEl.scrollTop + (tRect.top - cRect.top) - Math.max(24, (msgsEl.clientHeight - tRect.height) / 2);
      msgsEl.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    }
    target.classList.remove("nsc-flash");
    void target.offsetWidth;
    target.classList.add("nsc-flash");
  }

  function linkifyFloorReferences(containerEl) {
    if (!containerEl) return;
    for (const a of containerEl.querySelectorAll('a[href*="#"]')) {
      const m = (a.getAttribute("href") || "").match(/#(\d+)$/);
      if (m) {
        a.classList.add("nsc-floor-ref");
        a.addEventListener("click", (e) => {
          e.preventDefault();
          jumpToFloor(m[1]);
        });
      }
    }
    const walker = document.createTreeWalker(containerEl, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !/(\d{1,4}#|#\d{1,4})/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        if (node.parentElement && node.parentElement.closest("a, pre, code, script, style, .nsc-sd-card, .nsc-vote-card")) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    for (const tn of textNodes) {
      const text = tn.nodeValue;
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      const re = /(^|[^\d#])(\d{1,4}#|#\d{1,4})(?!\d)/g;
      let m;
      while ((m = re.exec(text)) !== null) {
        const prefix = m[1];
        const token = m[2];
        const num = token.replace("#", "");
        const start = m.index + prefix.length;
        if (start > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, start)));
        const link = document.createElement("a");
        link.className = "nsc-floor-ref";
        link.href = `#${num}`;
        link.textContent = token;
        link.title = `点击直达 ${num} 楼`;
        link.addEventListener("click", (e) => {
          e.preventDefault();
          jumpToFloor(num);
        });
        frag.appendChild(link);
        lastIdx = start + token.length;
      }
      if (lastIdx > 0) {
        if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
        tn.parentNode.replaceChild(frag, tn);
      }
    }
  }

  function buildThreadedComments(flatComments) {
    const byFloor = new Map();
    for (const c of flatComments) {
      c.children = [];
      if (c.floorId) byFloor.set(c.floorId, c);
    }
    const roots = [];
    for (const c of flatComments) {
      if (c.replyToFloor && c.replyToFloor !== "0" && byFloor.has(c.replyToFloor)) {
        let parent = byFloor.get(c.replyToFloor);
        let guard = 0;
        while (parent.replyToFloor && parent.replyToFloor !== "0" && byFloor.has(parent.replyToFloor) && guard < 10) {
          parent = byFloor.get(parent.replyToFloor);
          guard++;
        }
        if (parent !== c) {
          parent.children.push(c);
          continue;
        }
      }
      roots.push(c);
    }
    return roots;
  }

  let _nativeFloorMap = null;
  function buildNativeFloorIndex() {
    const map = new Map();
    for (const el of document.querySelectorAll("#nsk-frame ul.comments li.content-item[id]")) {
      map.set(String(el.id), el);
    }
    const opEl = document.querySelector("#nsk-frame .nsk-post .content-item");
    if (opEl) map.set("0", opEl);
    return map;
  }

  function renderChatRoom(room, preserveScroll = false) {
    if (!room || state.activePmPeer) return;
    _nativeFloorMap = room.isNativePage ? buildNativeFloorIndex() : null;
    const titleEl = document.getElementById("nsc-chat-title");
    const subEl = document.getElementById("nsc-chat-subtitle");
    const actionsEl = document.getElementById("nsc-chat-actions");
    const msgsEl = document.getElementById("nsc-chat-messages");
    if (!titleEl || !msgsEl) return;

    titleEl.textContent = room.title;
    titleEl.classList.add("is-copyable");
    titleEl.title = `点击复制帖子链接 (${location.origin}/post-${room.pid}-1)`;
    const copyTipEl = document.getElementById("nsc-chat-copy-tip");
    if (copyTipEl) copyTipEl.classList.remove("is-show");
    const totalPages = room.pages.length || 1;
    subEl.innerHTML = `
      ${room.catName ? `<span>版块: ${escHtml(room.catName)}</span>` : ""}
      <span>楼主: ${escHtml(state.opAuthor || "查看首楼")}</span>
      <span>已加载 ${room.flatComments.length} 条回复 (${state.loadedPages.size}/${totalPages} 页)</span>
    `;

    actionsEl.innerHTML = "";

    const jumpBox = document.createElement("div");
    jumpBox.className = "nsc-floor-jump-box";
    jumpBox.innerHTML = `<input type="text" class="nsc-floor-jump-input" placeholder="楼层#" title="输入楼层号回车直达（如 4）" /><button type="button" class="nsc-floor-jump-btn">直达</button>`;
    const jInput = jumpBox.querySelector("input");
    const jBtn = jumpBox.querySelector("button");
    jBtn.addEventListener("click", () => jumpToFloor(jInput.value));
    jInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") jumpToFloor(jInput.value);
    });
    actionsEl.appendChild(jumpBox);

    const addBtn = (text, active, onClick, iconHtml = "") => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "nsc-pill-btn" + (active ? " is-active" : "");
      b.innerHTML = `${iconHtml}<span>${text}</span>`;
      b.addEventListener("click", () => onClick(b));
      actionsEl.appendChild(b);
      return b;
    };

    if (!room.opObj && room.pages.length > 0 && room.pages[0].href) {
      addBtn("展开首楼", false, async (b) => {
        b.disabled = true;
        b.textContent = "加载中...";
        try {
          const doc = await fetchPostPageDoc(room.pages[0].href);
          if (state.activePmPeer || state.currentRoom !== room || state.currentPostId !== room.pid) return;
          const tempMetaMap = extractPostMetaFromTempScript(doc);
          const opNode = doc.querySelector(".nsk-post .content-item");
          if (opNode) {
            room.opObj = extractCommentObject(opNode, true, 1, tempMetaMap);
            state.opAuthor = room.opObj.author;
            renderChatRoom(room, true);
          }
        } catch (_) {
          b.textContent = "加载失败";
        }
      });
    }

    if (room.opObj && state.currentUser && room.opObj.author === state.currentUser) {
      addBtn("编辑主题", false, () => openEditModal(room.opObj, true), ICONS.edit);
    }

    addBtn("只看楼主", state.onlyOp, (b) => {
      state.onlyOp = !state.onlyOp;
      state.onlyMember = "";
      b.classList.toggle("is-active", state.onlyOp);
      applyMessageFilters();
    }, ICONS.opOnly);

    addBtn(state.threadsCollapsed ? "展开楼中楼" : "收起楼中楼", state.threadsCollapsed, (b) => {
      state.threadsCollapsed = !state.threadsCollapsed;
      const lbl = b.querySelector("span");
      if (lbl) lbl.textContent = state.threadsCollapsed ? "展开楼中楼" : "收起楼中楼";
      b.classList.toggle("is-active", state.threadsCollapsed);
      for (const w of msgsEl.querySelectorAll(".nsc-thread-wrap")) {
        w.classList.toggle("is-collapsed", state.threadsCollapsed);
      }
      for (const t of msgsEl.querySelectorAll(".nsc-react-pill.is-reply[data-thread-toggle='1']")) {
        const sp = t.querySelector("span");
        if (sp) sp.textContent = `${t.dataset.count} 条回复 ${state.threadsCollapsed ? "▸" : "▾"}`;
      }
    }, ICONS.layers);

    const isCollected = state.collectedSet.has(String(room.pid));
    const colBtn = document.createElement("button");
    colBtn.type = "button";
    colBtn.id = "nsc-collect-post-btn";
    colBtn.className = "nsc-pill-btn is-collect" + (isCollected ? " is-active" : "");
    colBtn.innerHTML = `${ICONS.bookmark}<span>${isCollected ? "已收藏" : "收藏"}</span>`;
    colBtn.title = isCollected ? "点击取消收藏该帖子" : "点击收藏该帖子";
    colBtn.addEventListener("click", () => togglePostCollection(room.pid, colBtn));
    actionsEl.appendChild(colBtn);

    syncComposerMode(room.isNativePage);

    const memberMap = new Map();
    const recordMember = (obj) => {
      if (!obj || !obj.author) return;
      const cur = memberMap.get(obj.author) || {
        name: obj.author,
        uid: obj.uid,
        avatar: obj.avatar,
        level: obj.level,
        isOp: obj.isOp,
        count: 0,
      };
      cur.count += 1;
      if (obj.isOp) cur.isOp = true;
      if (!cur.level && obj.level) cur.level = obj.level;
      memberMap.set(obj.author, cur);
    };
    if (room.opObj) recordMember(room.opObj);
    for (const c of room.flatComments) recordMember(c);
    state.members = Array.from(memberMap.values()).sort((a, b) => (b.isOp - a.isOp) || (b.count - a.count));

    msgsEl.innerHTML = "";
    const minLoaded = state.loadedPages.size > 0 ? Math.min(...Array.from(state.loadedPages)) : 1;
    if (room.pages.length > 1 && minLoaded > 1) {
      const prevTip = document.createElement("button");
      prevTip.type = "button";
      prevTip.id = "nsc-prev-waterfall-status";
      prevTip.className = "nsc-load-more-btn";
      prevTip.style.marginTop = "0";
      prevTip.textContent = `↑ 向上滚动或点击加载第 ${minLoaded - 1} 页`;
      prevTip.addEventListener("click", () => tryAutoLoadPrevPage());
      msgsEl.appendChild(prevTip);
    }
    if (room.opObj) {
      msgsEl.appendChild(createMessageNode(room.opObj, true, room.isNativePage));
    }

    room.flatComments.sort((a, b) => (a.pageNum - b.pageNum) || (Number(a.floorId) - Number(b.floorId)));
    const roots = buildThreadedComments(room.flatComments);
    let lastPageShown = room.opObj ? 1 : 0;
    for (const r of roots) {
      if (r.pageNum && r.pageNum !== lastPageShown && room.pages.length > 1) {
        const div = document.createElement("div");
        div.className = "nsc-page-divider";
        div.textContent = `第 ${r.pageNum} 页`;
        msgsEl.appendChild(div);
        lastPageShown = r.pageNum;
      }
      msgsEl.appendChild(createMessageNode(r, false, room.isNativePage));
    }

    if (room.pages.length > 1) {
      const pager = document.createElement("div");
      pager.className = "nsc-chat-pager";
      for (const p of room.pages) {
        const pb = document.createElement("button");
        pb.type = "button";
        const isLoaded = state.loadedPages.has(p.num);
        pb.className = "nsc-pill-btn" + (isLoaded ? " is-active" : "");
        pb.textContent = `第 ${p.label} 页`;
        pb.addEventListener("click", () => {
          openPostInChat({
            postId: room.pid,
            url: p.href,
            title: room.title,
            author: state.opAuthor,
            category: room.catName,
            replies: room.flatComments.length,
          });
        });
        pager.appendChild(pb);
      }
      const wfTip = document.createElement("div");
      wfTip.id = "nsc-waterfall-status";
      wfTip.style.cssText = "text-align:center;font-size:11px;color:var(--nsc-muted);padding-bottom:4px;";
      const maxLoaded = Math.max(...Array.from(state.loadedPages));
      wfTip.textContent = maxLoaded < totalPages ? `继续下滑自动预加载第 ${maxLoaded + 1} 页` : "已加载全部楼层";
      msgsEl.appendChild(pager);
      msgsEl.appendChild(wfTip);
    }

    applyMessageFilters();
    if (!preserveScroll) msgsEl.scrollTop = 0;
    enrichVisibleMemberBadges();
  }

  async function enrichVisibleMemberBadges() {
    const room = state.currentRoom;
    const uids = Array.from(new Set(state.members.map((m) => m.uid).filter(Boolean))).slice(0, 15);
    for (const uid of uids) {
      if (state.activePmPeer || state.currentRoom !== room) break;
      if (state.userCache[uid] && Date.now() - state.userCache[uid].ts < 3600000) {
        syncUserBadgeToChatDom(uid, state.userCache[uid]);
        continue;
      }
      const info = await fetchUserProfile(uid, "");
      if (state.activePmPeer || state.currentRoom !== room) break;
      if (info) syncUserBadgeToChatDom(uid, info);
    }
  }

  function syncUserBadgeToChatDom(uid, info) {
    if (!uid || !info || !info.level || info.level === "--") return;
    const text = info.days && info.days !== "--" ? `${info.level} · ${info.days}` : info.level;
    for (const node of document.querySelectorAll(`.nsc-msg[data-uid="${uid}"], .nsc-thread-item[data-uid="${uid}"]`)) {
      const meta = node.querySelector(".nsc-msg-meta, .nsc-thread-meta");
      if (!meta) continue;
      let pill = meta.querySelector(".nsc-lv-pill");
      if (!pill) {
        pill = document.createElement("span");
        pill.className = "nsc-lv-pill";
        const authorBtn = meta.querySelector(".nsc-msg-author");
        if (authorBtn && authorBtn.nextSibling) meta.insertBefore(pill, authorBtn.nextSibling);
        else meta.appendChild(pill);
      }
      pill.textContent = text;
    }
  }

  function sanitizeSignatureHtml(html) {
    if (!html) return "";
    const tpl = document.createElement("template");
    tpl.innerHTML = html;
    tpl.content.querySelectorAll("script, iframe, object, embed, style").forEach((n) => n.remove());
    tpl.content.querySelectorAll("*").forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        const nm = attr.name.toLowerCase();
        const val = (attr.value || "").trim().toLowerCase();
        if (nm.startsWith("on") || ((nm === "href" || nm === "src") && val.startsWith("javascript:"))) {
          el.removeAttribute(attr.name);
        }
      }
      if (el.tagName === "A") {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
    });
    return tpl.innerHTML.trim();
  }

  let _nscMdParser = null;
  function renderSimpleMarkdown(md) {
    if (!md) return "";
    const src = String(md);
    try {
      const pageWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
      const mdCtor = pageWin.markdownit || window.markdownit;
      if (typeof mdCtor === "function") {
        if (!_nscMdParser) _nscMdParser = mdCtor({ html: false, linkify: true, breaks: true });
        return sanitizeSignatureHtml(_nscMdParser.render(src));
      }
    } catch (_) {}
    let s = src
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    s = s.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.replace(/^\n+|\n+$/g, "")}</code></pre>`);
    s = s.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    s = s.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />');
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    s = s.replace(/^&gt;\s?(.*)$/gm, "<blockquote>$1</blockquote>");
    s = s.replace(/\n/g, "<br>");
    return s;
  }

  function renderReactionPills(reactionsEl, obj, isNativePage, isOpCard = false) {
    if (!reactionsEl) return;
    reactionsEl.innerHTML = "";
    if (obj.likes > 0) {
      const p = document.createElement("button");
      p.type = "button";
      p.className = "nsc-react-pill is-like" + (obj.upvoted ? " is-voted" : "");
      p.title = "点击点赞";
      p.innerHTML = `${ICONS.like}<span>${obj.likes}</span>`;
      p.addEventListener("click", (e) => {
        e.stopPropagation();
        triggerReplyOrVote(obj, "点赞", isNativePage, reactionsEl);
      });
      reactionsEl.appendChild(p);
    }
    if (obj.legs > 0) {
      const p = document.createElement("button");
      p.type = "button";
      p.className = "nsc-react-pill is-leg" + (obj.liked ? " is-voted" : "");
      p.title = "点击加鸡腿";
      p.innerHTML = `${ICONS.leg}<span>${obj.legs}</span>`;
      p.addEventListener("click", (e) => {
        e.stopPropagation();
        triggerReplyOrVote(obj, "加鸡腿", isNativePage, reactionsEl);
      });
      reactionsEl.appendChild(p);
    }
    if (obj.dislikes > 0) {
      const p = document.createElement("button");
      p.type = "button";
      p.className = "nsc-react-pill is-dislike" + (obj.disliked ? " is-voted" : "");
      p.title = "点击踩（反对）";
      p.innerHTML = `${ICONS.dislike}<span>${obj.dislikes}</span>`;
      p.addEventListener("click", (e) => {
        e.stopPropagation();
        triggerReplyOrVote(obj, "反对", isNativePage, reactionsEl);
      });
      reactionsEl.appendChild(p);
    }
    const replyCnt = isOpCard
      ? (state.currentRoom && state.currentRoom.flatComments ? state.currentRoom.flatComments.length : 0)
      : (obj.children ? obj.children.length : 0);
    if (replyCnt > 0) {
      const p = document.createElement("button");
      p.type = "button";
      p.className = "nsc-react-pill is-reply";
      if (!isOpCard) {
        p.dataset.threadToggle = "1";
        p.dataset.count = String(replyCnt);
      }
      p.title = isOpCard ? `共 ${replyCnt} 条评论` : `${replyCnt} 条楼中楼回复（点击展开/收起）`;
      p.innerHTML = isOpCard
        ? `${ICONS.reply}<span>${replyCnt}</span>`
        : `${ICONS.reply}<span>${replyCnt} 条回复 ${state.threadsCollapsed ? "▸" : "▾"}</span>`;
      p.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isOpCard) {
          const firstReply = document.querySelector("#nsc-chat-messages .nsc-msg:not(.is-op-card)");
          if (firstReply) firstReply.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        const msgWrap = reactionsEl.closest(".nsc-msg");
        const threadWrap = msgWrap && msgWrap.querySelector(".nsc-thread-wrap");
        if (threadWrap) {
          const collapsed = threadWrap.classList.toggle("is-collapsed");
          const sp = p.querySelector("span");
          if (sp) sp.textContent = `${replyCnt} 条回复 ${collapsed ? "▸" : "▾"}`;
        }
      });
      reactionsEl.appendChild(p);
    }
  }

  function htmlToMarkdown(html) {
    if (!html) return "";
    const tpl = document.createElement("template");
    tpl.innerHTML = html;
    const walk = (node) => {
      if (!node) return "";
      if (node.nodeType === 3) return node.nodeValue || "";
      if (node.nodeType !== 1) return "";
      const tag = node.tagName.toLowerCase();
      if (tag === "br") return "\n";
      if (tag === "hr") return "\n---\n";
      if (tag === "img") {
        const src = node.getAttribute("src") || "";
        const stickerMatch = src.match(/\/static\/image\/sticker\/([a-z]+)\/([0-9]+)\./i);
        if (stickerMatch) return `:${stickerMatch[1]}${stickerMatch[2]}:`;
        const alt = node.getAttribute("alt") || "image";
        return `![${alt}](${src})`;
      }
      if (tag === "pre") {
        const code = node.textContent || "";
        return `\n\`\`\`\n${code.replace(/^\n+|\n+$/g, "")}\n\`\`\`\n`;
      }
      if (tag === "code") {
        if (node.parentElement && node.parentElement.tagName.toLowerCase() === "pre") return node.textContent || "";
        return `\`${node.textContent || ""}\``;
      }
      const inner = Array.from(node.childNodes).map(walk).join("");
      if (tag === "a") {
        const href = node.getAttribute("href") || "";
        const txt = inner.trim() || href;
        if (!href || href.startsWith("#")) return txt;
        return `[${txt}](${href})`;
      }
      if (tag === "strong" || tag === "b") return `**${inner}**`;
      if (tag === "em" || tag === "i") return `*${inner}*`;
      if (tag === "del" || tag === "s") return `~~${inner}~~`;
      if (/^h([1-6])$/.test(tag)) return `\n${"#".repeat(Number(RegExp.$1))} ${inner.trim()}\n`;
      if (tag === "blockquote") {
        const lines = inner.trim().split(/\n/).map((l) => `> ${l}`).join("\n");
        return `\n${lines}\n`;
      }
      if (tag === "li") {
        const parentTag = node.parentElement && node.parentElement.tagName.toLowerCase();
        const prefix = parentTag === "ol" ? "1. " : "- ";
        return `${prefix}${inner.trim()}\n`;
      }
      if (tag === "ul" || tag === "ol") return `\n${inner}`;
      if (tag === "p" || tag === "div") return `${inner.trim()}\n\n`;
      return inner;
    };
    return Array.from(tpl.content.childNodes)
      .map(walk)
      .join("")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  let _editModalCtx = null;
  function openEditModal(obj, isTopic = false) {
    if (!obj || !state.currentPostId) return;
    const pid = state.currentPostId;
    const room = state.currentRoom;
    let bd = document.getElementById("nsc-edit-backdrop");
    if (!bd) {
      bd = document.createElement("div");
      bd.id = "nsc-edit-backdrop";
      bd.style.cssText =
        "position:fixed;inset:0;z-index:9550;background:rgba(15,23,42,0.40);backdrop-filter:blur(5px);display:none;align-items:center;justify-content:center;padding:16px;";
      bd.innerHTML = `
        <div class="nsc-newpost-modal" role="dialog" aria-label="编辑内容">
          <div class="nsc-newpost-head">
            <span id="nsc-edit-head-title" style="font-size:14.5px;font-weight:700;">编辑内容</span>
            <div style="display:flex;align-items:center;gap:10px;">
              <a id="nsc-edit-orig-link" href="#" target="_blank" rel="noopener noreferrer" style="font-size:12px;color:var(--nsc-accent);text-decoration:none;font-weight:600;">原帖查看 ↗</a>
              <button type="button" id="nsc-edit-close" style="border:none;background:transparent;color:var(--nsc-muted);font-size:16px;cursor:pointer;padding:0 4px;">✕</button>
            </div>
          </div>
          <div class="nsc-newpost-body">
            <div class="nsc-newpost-row" id="nsc-edit-title-row">
              <input type="text" class="nsc-newpost-title" id="nsc-edit-title" placeholder="请输入帖子标题..." />
            </div>
            <div class="nsc-newpost-editor" style="position:relative;">
              ${buildMarkdownToolbarHtml({ id: "nsc-edit-toolbar", expBtnId: "nsc-edit-exp-btn", niTarget: "edit" })}
              <textarea class="nsc-newpost-ta" id="nsc-edit-content" placeholder="支持 Markdown 语法，Ctrl+V 可直接粘贴传图，Ctrl+Enter 保存..."></textarea>
            </div>
          </div>
          <div class="nsc-newpost-foot">
            <span id="nsc-edit-status" style="font-size:11.5px;color:var(--nsc-muted);">由原贴 HTML 还原为 Markdown，保存前请核对格式</span>
            <div style="display:flex;gap:8px;">
              <button type="button" class="nsc-pill-btn" id="nsc-edit-cancel">取消</button>
              <button type="button" class="nsc-send-btn" id="nsc-edit-submit">保存修改</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(bd);

      const closeEdit = () => { bd.style.display = "none"; bd.classList.remove("is-open"); };
      bd.addEventListener("click", (e) => { if (e.target === bd) closeEdit(); });
      bd.querySelector("#nsc-edit-close").addEventListener("click", closeEdit);
      bd.querySelector("#nsc-edit-cancel").addEventListener("click", closeEdit);

      const edContent = bd.querySelector("#nsc-edit-content");
      const edTitle = bd.querySelector("#nsc-edit-title");
      const edStatus = bd.querySelector("#nsc-edit-status");
      const edSubmit = bd.querySelector("#nsc-edit-submit");

      bindMarkdownToolbar(bd.querySelector("#nsc-edit-toolbar"), edContent);

      attachStickerPicker(bd.querySelector("#nsc-edit-exp-btn"), edContent, bd.querySelector(".nsc-newpost-editor"));
      initNodeImageUi(bd);
      NodeImage.bindPasteAndDrop(edContent, "edit", "#nsc-edit-status");

      const doSaveEdit = async () => {
        if (!_editModalCtx) return;
        const { obj: curObj, isTopic: curIsTopic, pid: curPid } = _editModalCtx;
        const newContent = edContent.value.trim();
        const newTitle = edTitle.value.trim();
        if (!newContent) {
          edStatus.textContent = "正文内容不能为空";
          edContent.focus();
          return;
        }
        if (curIsTopic && !newTitle) {
          edStatus.textContent = "主题标题不能为空";
          edTitle.focus();
          return;
        }
        if (!curIsTopic && !curObj.commentId) {
          edStatus.textContent = "未获取到 commentId，请点击右上角「原帖查看」修改";
          return;
        }
        edSubmit.disabled = true;
        edSubmit.textContent = "保存中...";
        edStatus.textContent = "正在提交修改...";
        try {
          const endpoint = curIsTopic ? "/api/content/edit-discussion" : "/api/content/edit-comment";
          const payload = curIsTopic
            ? { content: newContent, mode: "edit-discussion", title: newTitle, postId: Number(curPid), rank: 0 }
            : { content: newContent, mode: "edit-comment", commentId: Number(curObj.commentId) };
          const resp = await fetch(endpoint, {
            method: "POST",
            credentials: "include",
            headers: getNodeSeekPostHeaders(),
            body: JSON.stringify(payload),
          });
          const resJson = await resp.json().catch(() => ({}));
          if (!resp.ok || resJson.success === false) {
            throw new Error(resJson.message || `HTTP ${resp.status}`);
          }
          edStatus.textContent = "修改成功，正在刷新内容...";
          const targetPage = curIsTopic ? 1 : curObj.pageNum || 1;
          const pDoc = await fetchPostPageDoc(`/post-${curPid}-${targetPage}`);
          if (!state.activePmPeer && state.currentRoom && state.currentRoom.pid === curPid && state.currentPostId === curPid) {
            const tempMetaMap = extractPostMetaFromTempScript(pDoc);
            if (curIsTopic) {
              state.currentRoom.title = newTitle;
              const opEl = pDoc.querySelector(".nsk-post .content-item");
              if (opEl) {
                const updatedOp = extractCommentObject(opEl, true, 1, tempMetaMap);
                state.currentRoom.opObj = updatedOp;
              }
            } else {
              const updatedEl = pDoc.querySelector(`ul.comments li.content-item[id="${curObj.floorId}"]`) ||
                pDoc.querySelector(`ul.comments li.content-item[data-comment-id="${curObj.commentId}"]`);
              if (updatedEl) {
                const updatedObj = extractCommentObject(updatedEl, false, targetPage, tempMetaMap);
                const idx = state.currentRoom.flatComments.findIndex((c) => c.floorId === curObj.floorId);
                if (idx >= 0) {
                  updatedObj.isOp = state.currentRoom.flatComments[idx].isOp;
                  state.currentRoom.flatComments[idx] = updatedObj;
                }
              }
            }
            const msgsEl = document.getElementById("nsc-chat-messages");
            const prevTop = msgsEl ? msgsEl.scrollTop : 0;
            renderChatRoom(state.currentRoom, true);
            if (msgsEl) msgsEl.scrollTop = prevTop;
          }
          closeEdit();
        } catch (err) {
          edStatus.textContent = "保存失败: " + err.message;
        } finally {
          edSubmit.disabled = false;
          edSubmit.textContent = "保存修改";
        }
      };

      edSubmit.addEventListener("click", doSaveEdit);
      edContent.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          doSaveEdit();
        }
      });
    }

    _editModalCtx = { obj, isTopic, pid };
    bd.querySelector("#nsc-edit-head-title").textContent = isTopic ? `编辑主题 #${pid}` : `编辑 #${obj.floorId}楼 评论`;
    bd.querySelector("#nsc-edit-orig-link").href = isTopic ? `/post-${pid}-1` : `/post-${pid}-${obj.pageNum || 1}#${obj.floorId}`;
    const titleRow = bd.querySelector("#nsc-edit-title-row");
    const titleInp = bd.querySelector("#nsc-edit-title");
    titleRow.style.display = isTopic ? "flex" : "none";
    titleInp.value = isTopic ? (room && room.title) || "" : "";
    bd.querySelector("#nsc-edit-content").value = htmlToMarkdown(obj.bodyHtml || "");
    bd.querySelector("#nsc-edit-status").textContent = "由原贴 HTML 还原为 Markdown，保存前请核对格式";
    NodeImage.syncDots();
    bd.style.display = "flex";
    bd.classList.add("is-open");
    setTimeout(() => bd.querySelector(isTopic ? "#nsc-edit-title" : "#nsc-edit-content").focus(), 40);
  }

  function findNativePinMenuItem(nativeLi) {
    if (!nativeLi) return null;
    return Array.from(nativeLi.querySelectorAll(".comment-menu .menu-item")).find((m) => {
      const txt = (m.textContent || "").trim();
      const ttl = (m.getAttribute("title") || "").trim();
      const hasPushpin = Boolean(m.querySelector('use[href*="pushpin"], use[xlink\\:href*="pushpin"], use[href="#pin"], use[xlink\\:href="#pin"]'));
      return hasPushpin || txt === "置顶" || txt === "取消置顶" || ttl.includes("置顶");
    }) || null;
  }

  function syncPinBadgeInDom(floorId, isPinned) {
    const node = document.getElementById(`nsc-floor-${floorId}`);
    if (!node) return;
    const meta = node.querySelector(".nsc-msg-meta, .nsc-thread-meta");
    if (meta) {
      let pill = meta.querySelector(".nsc-pin-pill");
      if (isPinned && !pill) {
        pill = document.createElement("span");
        pill.className = "nsc-pin-pill";
        pill.innerHTML = `${ICONS.pin}<span>置顶</span>`;
        const floorTag = meta.querySelector(".nsc-floor-tag");
        if (floorTag && floorTag.nextSibling) meta.insertBefore(pill, floorTag.nextSibling);
        else meta.appendChild(pill);
      } else if (!isPinned && pill) {
        pill.remove();
      }
    }
    const barBtn = node.querySelector(".nsc-hover-bar .nsc-hb-btn.is-pin");
    if (barBtn) {
      barBtn.classList.toggle("is-active", isPinned);
      barBtn.title = isPinned ? `取消置顶 #${floorId}楼` : `置顶 #${floorId}楼`;
    }
  }

  function triggerPinViaHiddenIframe(postId, pageNum, floorId) {
    return withHiddenIframe(`/post-${postId}-${pageNum || 1}`, {
      pollMs: 220,
      timeoutMs: 7000,
      onPoll(idoc, attempts, finish) {
        const li = idoc.querySelector(`[id="${floorId}"].content-item`);
        const pinItem = findNativePinMenuItem(li);
        if (pinItem) {
          const wasPinned = (pinItem.textContent || "").trim() === "取消置顶";
          pinItem.click();
          setTimeout(() => finish({ ok: true, nextPinned: !wasPinned }), 750);
        } else if (attempts > 16) {
          finish({ ok: false, nextPinned: null });
        }
      },
    }).then((res) => res || { ok: false, nextPinned: null });
  }

  async function togglePinComment(obj, isNativePage, pinBtn) {
    if (!obj || !obj.floorId || obj.floorId === "0") return;
    if (isNativePage) {
      const nativeLi = document.querySelector(`#nsk-frame [id="${obj.floorId}"].content-item`);
      const pinItem = findNativePinMenuItem(nativeLi);
      if (pinItem) {
        const wasPinned = (pinItem.textContent || "").trim() === "取消置顶" || obj.pinned;
        pinItem.click();
        setTimeout(() => {
          const afterItem = findNativePinMenuItem(nativeLi);
          const nowPinned = afterItem ? (afterItem.textContent || "").trim() === "取消置顶" : !wasPinned;
          obj.pinned = nowPinned;
          syncPinBadgeInDom(obj.floorId, obj.pinned);
        }, 450);
        return;
      }
    }
    if (state.currentPostId && pinBtn) {
      pinBtn.disabled = true;
      pinBtn.style.opacity = "0.5";
      const res = await triggerPinViaHiddenIframe(state.currentPostId, obj.pageNum || 1, obj.floorId);
      pinBtn.disabled = false;
      pinBtn.style.opacity = "";
      if (res.ok && res.nextPinned !== null) {
        obj.pinned = res.nextPinned;
        syncPinBadgeInDom(obj.floorId, obj.pinned);
      } else if (state.currentPostUrl) {
        location.href = `/post-${state.currentPostId}-${obj.pageNum || 1}#${obj.floorId}`;
      }
    }
  }

  function buildHoverBar(obj, isNativePage, reactionsEl, isThread = false, isOpCard = false) {
    const bar = document.createElement("div");
    bar.className = "nsc-hover-bar" + (isThread ? " is-thread-bar" : "");

    const btnLike = document.createElement("button");
    btnLike.type = "button";
    btnLike.className = "nsc-hb-btn" + (obj.upvoted ? " is-active" : "");
    btnLike.title = "点赞";
    btnLike.innerHTML = ICONS.like;
    btnLike.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerReplyOrVote(obj, "点赞", isNativePage, reactionsEl, bar);
    });

    const btnLeg = document.createElement("button");
    btnLeg.type = "button";
    btnLeg.className = "nsc-hb-btn is-leg" + (obj.liked ? " is-active" : "");
    btnLeg.title = "加鸡腿";
    btnLeg.innerHTML = ICONS.leg;
    btnLeg.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerReplyOrVote(obj, "加鸡腿", isNativePage, reactionsEl, bar);
    });

    const btnDislike = document.createElement("button");
    btnDislike.type = "button";
    btnDislike.className = "nsc-hb-btn is-dislike" + (obj.disliked ? " is-active" : "");
    btnDislike.title = "踩（反对）";
    btnDislike.innerHTML = ICONS.dislike;
    btnDislike.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerReplyOrVote(obj, "反对", isNativePage, reactionsEl, bar);
    });

    const isMyPost = Boolean(state.currentUser && state.opAuthor && state.currentUser === state.opAuthor && !isOpCard && obj.floorId !== "0");
    let hasNativePin = false;
    if (isNativePage && !isOpCard && obj.floorId !== "0") {
      const nativeLi = (_nativeFloorMap && _nativeFloorMap.get(String(obj.floorId))) || document.querySelector(`#nsk-frame [id="${obj.floorId}"].content-item`);
      hasNativePin = Boolean(findNativePinMenuItem(nativeLi));
    }

    const btnQuote = document.createElement("button");
    btnQuote.type = "button";
    btnQuote.className = "nsc-hb-btn";
    btnQuote.title = `引用 #${obj.floorId}楼`;
    btnQuote.innerHTML = ICONS.quote;
    btnQuote.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerReplyOrVote(obj, "引用", isNativePage, reactionsEl, bar);
    });

    const btnReply = document.createElement("button");
    btnReply.type = "button";
    btnReply.className = "nsc-hb-btn";
    btnReply.title = `回复 #${obj.floorId}楼`;
    btnReply.innerHTML = ICONS.reply;
    btnReply.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerReplyOrVote(obj, "回复", isNativePage, reactionsEl, bar);
    });

    bar.appendChild(btnLike);
    bar.appendChild(btnLeg);
    bar.appendChild(btnDislike);
    if (hasNativePin || isMyPost) {
      const btnPin = document.createElement("button");
      btnPin.type = "button";
      btnPin.className = "nsc-hb-btn is-pin" + (obj.pinned ? " is-active" : "");
      btnPin.title = obj.pinned ? `取消置顶 #${obj.floorId}楼` : `置顶 #${obj.floorId}楼`;
      btnPin.innerHTML = ICONS.pin;
      btnPin.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePinComment(obj, isNativePage, btnPin);
      });
      bar.appendChild(btnPin);
    }
    bar.appendChild(btnQuote);
    bar.appendChild(btnReply);

    const isMine = state.currentUser && obj.author === state.currentUser;
    if (isMine) {
      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.className = "nsc-hb-btn";
      btnEdit.title = isOpCard || obj.floorId === "0" ? "编辑主题" : `编辑 #${obj.floorId}楼`;
      btnEdit.innerHTML = ICONS.edit;
      btnEdit.addEventListener("click", (e) => {
        e.stopPropagation();
        openEditModal(obj, isOpCard || obj.floorId === "0");
      });
      bar.appendChild(btnEdit);
    }

    return bar;
  }

  function createMessageNode(obj, isOpCard, isNativePage) {
    const wrap = document.createElement("div");
    const isSelf = state.currentUser && obj.author === state.currentUser;
    const isOpSide = isOpCard || obj.isOp;
    const hasOpInThread = obj.isOp || (obj.children && obj.children.some((c) => c.isOp));
    wrap.className =
      "nsc-msg" +
      (isSelf && !isOpCard ? " is-self" : "") +
      (isOpCard ? " is-op-card" : "") +
      (isOpSide && !isOpCard ? " is-op-bubble" : "") +
      (hasOpInThread ? " nsc-has-op" : "");
    wrap.id = `nsc-floor-${obj.floorId}`;
    wrap.dataset.floor = obj.floorId;
    wrap.dataset.author = obj.author;
    wrap.dataset.uid = obj.uid || "";

    const avatarCol = document.createElement("div");
    avatarCol.className = "nsc-avatar-col";
    const avBtn = document.createElement("button");
    avBtn.type = "button";
    avBtn.className = "nsc-avatar-btn";
    avBtn.title = `查看 ${obj.author} 的名片与签名`;
    avBtn.innerHTML = `<img src="${obj.avatar || "/static/image/favicon/android-chrome-192x192.png"}" loading="lazy" alt="${obj.author}" />`;
    avBtn.addEventListener("click", () => openUserProfileModal(obj));
    avatarCol.appendChild(avBtn);

    const mainCol = document.createElement("div");
    mainCol.className = "nsc-msg-main";

    const meta = document.createElement("div");
    meta.className = "nsc-msg-meta";
    meta.innerHTML = `
      <button type="button" class="nsc-msg-author"></button>
      ${obj.level ? `<span class="nsc-lv-pill">${obj.level}</span>` : ""}
      ${obj.isOp ? `<span class="nsc-op-pill">楼主</span>` : ""}
      <span class="nsc-floor-tag ${obj.isOp ? "is-op-floor" : ""}">#${obj.floorId}楼</span>
      ${obj.pinned ? `<span class="nsc-pin-pill">${ICONS.pin}<span>置顶</span></span>` : ""}
      ${obj.timeText ? `<span title="${obj.timeTitle}">${obj.timeText}</span>` : ""}
    `;
    const authorBtn = meta.querySelector(".nsc-msg-author");
    authorBtn.textContent = obj.author;
    authorBtn.addEventListener("click", () => openUserProfileModal(obj));
    meta.querySelector(".nsc-floor-tag").addEventListener("click", () => jumpToFloor(obj.floorId));

    const bubbleRow = document.createElement("div");
    bubbleRow.className = "nsc-bubble-row";

    const bubble = document.createElement("div");
    bubble.className = "nsc-bubble";
    bubble.innerHTML = obj.bodyHtml;
    for (const bq of bubble.querySelectorAll("blockquote")) {
      bq.title = "点击展开/收起引用内容";
      bq.addEventListener("click", (e) => {
        if (e.target && e.target.closest("a")) return;
        bq.classList.toggle("is-expanded");
      });
    }
    runBubbleEnhancers(bubble, { isThread: false, isOpCard, obj });

    const reactionsEl = document.createElement("div");
    reactionsEl.className = "nsc-reactions";
    renderReactionPills(reactionsEl, obj, isNativePage, isOpCard);

    const hoverBar = buildHoverBar(obj, isNativePage, reactionsEl, false, isOpCard);
    meta.appendChild(hoverBar);
    bubbleRow.appendChild(bubble);

    mainCol.appendChild(meta);
    mainCol.appendChild(bubbleRow);
    mainCol.appendChild(reactionsEl);

    if (obj.children && obj.children.length > 0) {
      wrap.classList.add("has-thread");
      const threadWrap = document.createElement("div");
      threadWrap.className = "nsc-thread-wrap" + (state.threadsCollapsed ? " is-collapsed" : "");

      for (const ch of obj.children) {
        const chIsSelf = state.currentUser && ch.author === state.currentUser;
        const chIsRight = !ch.isOp;
        const ti = document.createElement("div");
        ti.className =
          "nsc-thread-item" +
          (chIsRight ? " is-right" : "") +
          (ch.isOp ? " is-op-thread" : "") +
          (chIsSelf && chIsRight ? " is-self-thread" : "");
        ti.id = `nsc-floor-${ch.floorId}`;
        ti.dataset.floor = ch.floorId;
        ti.dataset.author = ch.author;
        ti.dataset.uid = ch.uid || "";
        ti.innerHTML = `
          <img class="nsc-t-avatar" src="${ch.avatar || "/static/image/favicon/android-chrome-192x192.png"}" loading="lazy" alt="${ch.author}" />
          <div class="nsc-thread-body">
            <div class="nsc-thread-meta">
              <button type="button" class="nsc-msg-author"></button>
              ${ch.level ? `<span class="nsc-lv-pill">${ch.level}</span>` : ""}
              ${ch.isOp ? `<span class="nsc-op-pill">楼主</span>` : ""}
              <span class="nsc-floor-tag">#${ch.floorId}楼</span>
              ${ch.pinned ? `<span class="nsc-pin-pill">${ICONS.pin}<span>置顶</span></span>` : ""}
              <span>${ch.timeText || ""}</span>
            </div>
            <div class="nsc-thread-content">${ch.bodyHtml}</div>
            <div class="nsc-reactions" style="margin-top:3px;"></div>
          </div>
        `;
        ti.querySelector(".nsc-msg-author").textContent = ch.author;
        ti.querySelector(".nsc-t-avatar").addEventListener("click", () => openUserProfileModal(ch));
        ti.querySelector(".nsc-msg-author").addEventListener("click", () => openUserProfileModal(ch));
        ti.querySelector(".nsc-floor-tag").addEventListener("click", () => jumpToFloor(ch.floorId));
        const tc = ti.querySelector(".nsc-thread-content");
        runBubbleEnhancers(tc, { isThread: true, isOpCard: false, obj: ch });
        const chReactions = ti.querySelector(".nsc-reactions");
        renderReactionPills(chReactions, ch, isNativePage);
        const chBar = buildHoverBar(ch, isNativePage, chReactions, true);
        const chMeta = ti.querySelector(".nsc-thread-meta");
        if (chMeta) chMeta.appendChild(chBar);
        threadWrap.appendChild(ti);
      }

      mainCol.appendChild(threadWrap);
    }

    wrap.appendChild(avatarCol);
    wrap.appendChild(mainCol);
    return wrap;
  }

  function refreshNativeFloorCountsIfNeeded() {
    if (state.activePmPeer || !state.currentRoom || !state.currentPostId || state.currentPostId !== state.nativePostId) return;
    const room = state.currentRoom;
    const floorIdx = buildNativeFloorIndex();
    _nativeFloorMap = floorIdx;
    const syncObjFromEl = (obj, el) => {
      if (!obj || !el) return;
      const menu = el.querySelector(":scope > .comment-menu, .comment-menu");
      if (!menu) return;
      const likeMenu = menu.querySelector('.menu-item[title="点赞"]');
      const legMenu = menu.querySelector('.menu-item[title="加鸡腿"]');
      const dislikeMenu = menu.querySelector('.menu-item[title="反对"]');
      const nextLikes = likeMenu && likeMenu.querySelector("span") ? Number(likeMenu.querySelector("span").textContent.trim()) || 0 : obj.likes;
      const nextLegs = legMenu && legMenu.querySelector("span") ? Number(legMenu.querySelector("span").textContent.trim()) || 0 : obj.legs;
      const nextDislikes = dislikeMenu && dislikeMenu.querySelector("span") ? Number(dislikeMenu.querySelector("span").textContent.trim()) || 0 : obj.dislikes;
      const nextUpvoted = Boolean(likeMenu && likeMenu.classList.contains("clicked"));
      const nextLiked = Boolean(legMenu && legMenu.classList.contains("clicked"));
      const nextDisliked = Boolean(dislikeMenu && dislikeMenu.classList.contains("clicked"));
      const pinItem = findNativePinMenuItem(el);
      const nextPinned = Boolean(
        el.querySelector('.pined-comment-badge, .floor-link-wrapper use[href="#pin"]') ||
        (pinItem && (pinItem.textContent || "").trim() === "取消置顶")
      );
      if (
        nextLikes !== obj.likes ||
        nextLegs !== obj.legs ||
        nextDislikes !== obj.dislikes ||
        nextUpvoted !== obj.upvoted ||
        nextLiked !== obj.liked ||
        nextDisliked !== obj.disliked
      ) {
        obj.likes = Math.max(obj.likes, nextLikes);
        obj.legs = Math.max(obj.legs, nextLegs);
        obj.dislikes = Math.max(obj.dislikes, nextDislikes);
        obj.upvoted = obj.upvoted || nextUpvoted;
        obj.liked = obj.liked || nextLiked;
        obj.disliked = obj.disliked || nextDisliked;
        const floorNode = document.getElementById(`nsc-floor-${obj.floorId}`);
        const reactEl = floorNode && floorNode.querySelector(":scope > .nsc-msg-main > .nsc-reactions, :scope > .nsc-thread-body > .nsc-reactions");
        if (reactEl) renderReactionPills(reactEl, obj, room.isNativePage, obj.floorId === "0");
      }
      if (nextPinned !== obj.pinned) {
        obj.pinned = nextPinned;
        syncPinBadgeInDom(obj.floorId, obj.pinned);
      }
    };
    if (room.opObj) syncObjFromEl(room.opObj, floorIdx.get("0") || document.querySelector("#nsk-frame .nsk-post .content-item"));
    for (const c of room.flatComments) {
      syncObjFromEl(c, floorIdx.get(String(c.floorId)) || document.querySelector(`#nsk-frame ul.comments li.content-item[id="${c.floorId}"]`));
    }
  }

  const _origScrollIntoView = Element.prototype.scrollIntoView;
  let _suppressComposerScrollUntil = 0;
  if (typeof _origScrollIntoView === "function" && !Element.prototype._nscScrollGuardInstalled) {
    Element.prototype._nscScrollGuardInstalled = true;
    Element.prototype.scrollIntoView = function () {
      if (Date.now() < _suppressComposerScrollUntil) {
        const dockEl = document.getElementById("nsc-composer-dock");
        if (dockEl && dockEl.contains(this)) return;
      }
      return _origScrollIntoView.apply(this, arguments);
    };
  }

  async function triggerReplyOrVote(obj, actionTitle, isNativePage, reactionsEl, hoverBar) {
    const syncBarCnt = () => {
      if (reactionsEl) renderReactionPills(reactionsEl, obj, isNativePage, obj.floorId === "0");
    };

    if (isNativePage) {
      const nativeLi = (_nativeFloorMap && _nativeFloorMap.get(String(obj.floorId))) || document.querySelector(`#nsk-frame [id="${obj.floorId}"].content-item`);
      if (nativeLi) {
        const menuItems = Array.from(nativeLi.querySelectorAll(".comment-menu .menu-item"));
        const target = menuItems.find(
          (m) => (m.getAttribute("title") || "") === actionTitle || (m.textContent || "").includes(actionTitle)
        );
        if (target) {
          const isQuoteOrReply = actionTitle === "引用" || actionTitle === "回复";
          const msgsEl = document.getElementById("nsc-chat-messages");
          const savedMsgScroll = msgsEl ? msgsEl.scrollTop : 0;
          if (isQuoteOrReply) {
            _suppressComposerScrollUntil = Date.now() + 180;
          }
          target.click();
          if (actionTitle === "点赞" || actionTitle === "加鸡腿" || actionTitle === "反对") {
            setTimeout(() => {
              const likeMenu = nativeLi.querySelector('.comment-menu .menu-item[title="点赞"]');
              const legMenu = nativeLi.querySelector('.comment-menu .menu-item[title="加鸡腿"]');
              const dislikeMenu = nativeLi.querySelector('.comment-menu .menu-item[title="反对"]');
              const likeSpan = likeMenu && likeMenu.querySelector("span");
              const legSpan = legMenu && legMenu.querySelector("span");
              const dislikeSpan = dislikeMenu && dislikeMenu.querySelector("span");
              if (likeSpan) obj.likes = Number(likeSpan.textContent.trim()) || obj.likes;
              if (legSpan) obj.legs = Number(legSpan.textContent.trim()) || obj.legs;
              if (dislikeSpan) obj.dislikes = Number(dislikeSpan.textContent.trim()) || obj.dislikes;
              if (likeMenu && likeMenu.classList.contains("clicked")) obj.upvoted = true;
              if (legMenu && legMenu.classList.contains("clicked")) obj.liked = true;
              if (dislikeMenu && dislikeMenu.classList.contains("clicked")) obj.disliked = true;
              syncBarCnt();
            }, 350);
          } else if (isQuoteOrReply) {
            if (msgsEl) msgsEl.scrollTop = savedMsgScroll;
            requestAnimationFrame(() => {
              if (msgsEl) msgsEl.scrollTop = savedMsgScroll;
              const pageWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
              const cmEl =
                (pageWin.document && pageWin.document.querySelector("#nsc-composer-body .md-editor .CodeMirror")) ||
                document.querySelector("#nsc-composer-body .md-editor .CodeMirror");
              const cm = cmEl && (cmEl.CodeMirror || (cmEl.wrappedJSObject && cmEl.wrappedJSObject.CodeMirror));
              if (cm && typeof cm.getValue === "function") {
                cm.operation(() => {
                  const lastIdx = cm.lastLine();
                  const tailStart = Math.max(0, lastIdx - 2);
                  const tailText = cm.getRange({ line: tailStart, ch: 0 }, { line: lastIdx, ch: cm.getLine(lastIdx).length });
                  const normalizedTail = actionTitle === "引用"
                    ? tailText.replace(/\n{2,}$/, "\n")
                    : tailText.replace(/[ \t]+$/, "");
                  const finalTail = normalizedTail.endsWith("\n") ? normalizedTail : normalizedTail + "\n";
                  if (tailText && finalTail !== tailText) {
                    cm.replaceRange(finalTail, { line: tailStart, ch: 0 }, { line: lastIdx, ch: cm.getLine(lastIdx).length });
                  }
                  const endLine = cm.lastLine();
                  cm.setCursor({ line: endLine, ch: cm.getLine(endLine).length });
                  cm.scrollIntoView({ line: endLine, ch: 0 }, 8);
                });
                const inputField = typeof cm.getInputField === "function" ? cm.getInputField() : null;
                if (inputField && typeof inputField.focus === "function") {
                  inputField.focus({ preventScroll: true });
                } else {
                  cm.focus();
                }
                return;
              }
              const ta = document.querySelector("#nsc-composer-body .CodeMirror textarea");
              if (ta) ta.focus({ preventScroll: true });
            });
          }
          return;
        }
      }
    }

    if ((actionTitle === "点赞" || actionTitle === "加鸡腿" || actionTitle === "反对") && obj.commentId) {
      if (actionTitle === "反对" && !window.confirm("确定要踩（反对）该楼层吗？NodeSeek 将消耗 2 个鸡腿")) {
        return;
      }
      const apiPath =
        actionTitle === "点赞"
          ? "/api/statistics/upvote"
          : actionTitle === "加鸡腿"
            ? "/api/statistics/like"
            : "/api/statistics/dislike";
      try {
        const resp = await fetch(apiPath, {
          method: "POST",
          credentials: "include",
          headers: getNodeSeekPostHeaders(),
          body: JSON.stringify({ commentId: Number(obj.commentId), action: "add" }),
        });
        const resJson = await resp.json().catch(() => ({}));
        if (resp.ok && resJson.success !== false) {
          if (actionTitle === "点赞") {
            obj.upvoted = true;
            obj.likes = Number.isFinite(Number(resJson.current)) ? Number(resJson.current) : obj.likes + 1;
          } else if (actionTitle === "加鸡腿") {
            obj.liked = true;
            obj.legs = Number.isFinite(Number(resJson.current)) ? Number(resJson.current) : obj.legs + 1;
          } else {
            obj.disliked = true;
            obj.dislikes = Number.isFinite(Number(resJson.current)) ? Number(resJson.current) : obj.dislikes + 1;
          }
          syncBarCnt();
        }
      } catch (_) {}
      return;
    }

    const ta = document.getElementById("nsc-fallback-ta");
    if (ta && (actionTitle === "引用" || actionTitle === "回复")) {
      const plain = (obj.bodyHtml || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
      const snippet =
        actionTitle === "引用"
          ? `> @${obj.author} #${obj.floorId} ${plain}\n`
          : `@${obj.author} #${obj.floorId}\n`;
      const existing = ta.value.replace(/^\n+/, "");
      ta.value = snippet + existing;
      ta.focus({ preventScroll: true });
      ta.setSelectionRange(snippet.length, snippet.length);
      return;
    }

    if (state.currentPostUrl) {
      location.href = `${state.currentPostUrl}#${obj.floorId}`;
    }
  }

  function applyMessageFilters() {
    const msgsEl = document.getElementById("nsc-chat-messages");
    if (!msgsEl) return;
    for (const msg of msgsEl.querySelectorAll(".nsc-msg")) {
      if (isMemberHidden(msg.dataset.author)) {
        msg.classList.add("is-hidden-filter");
        continue;
      }
      if (msg.classList.contains("is-op-card")) {
        msg.classList.remove("is-hidden-filter");
        continue;
      }
      let hide = false;
      if (state.onlyOp && !msg.classList.contains("nsc-has-op")) hide = true;
      if (state.onlyMember) {
        const hasMember =
          msg.dataset.author === state.onlyMember ||
          Array.from(msg.querySelectorAll(".nsc-thread-item")).some((t) => t.dataset.author === state.onlyMember);
        if (!hasMember) hide = true;
      }
      msg.classList.toggle("is-hidden-filter", hide);
    }
  }

  registerBubbleEnhancer({ id: "floor-ref", priority: 20, run: linkifyFloorReferences });

  // ==========================================================================
  // Module: 08-profile-right.js
  // ==========================================================================
  async function fetchUserProfile(uid, nameFallback) {
    const cached = uid ? state.userCache[uid] : null;
    if (cached && cached.v >= 2 && Date.now() - cached.ts < 3600000) {
      return cached;
    }
    const info = {
      v: 2,
      uid: uid || "",
      name: nameFallback || "Seeker",
      avatar: uid ? `/avatar/${uid}.png` : "",
      level: "--",
      days: "--",
      legs: "--",
      stars: "--",
      posts: "--",
      comments: "--",
      fans: "--",
      bio: "",
      signature: "",
      readme: "",
      ts: Date.now(),
    };
    if (!uid) return info;

    try {
      const resp = await fetch(`/api/account/getInfo/${uid}?readme=1`, { credentials: "include" });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.success && data.detail) {
          const d = data.detail;
          info.name = d.member_name || info.name;
          info.level = d.rank !== undefined ? `Lv ${d.rank}` : "--";
          info.legs = d.coin !== undefined ? String(d.coin) : "--";
          info.stars = d.stardust !== undefined ? String(d.stardust) : "--";
          info.posts = d.nPost !== undefined ? String(d.nPost) : "--";
          info.comments = d.nComment !== undefined ? String(d.nComment) : "--";
          info.fans = d.fans !== undefined ? String(d.fans) : "--";
          info.bio = d.bio || "";
          info.signature = d.signature || d.sign || "";
          info.readme = d.readme || "";
          if (d.created_at) {
            const days = Math.max(1, Math.floor((Date.now() - new Date(d.created_at).getTime()) / 86400000));
            info.days = `${days}天`;
          }
          state.userCache[uid] = info;
          pruneTimedCache(state.userCache, 400, 300);
          scheduleSaveJson(LS.USER_CACHE, state.userCache);
          return info;
        }
      }
    } catch (_) {}

    return info;
  }

  function extractUsersFromTempScript(doc) {
    const out = [];
    const seen = new Set();
    const cfg = parseTempScriptConfig(doc);
    if (!cfg) return out;
    try {

      const walk = (node) => {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) {
          for (const item of node) walk(item);
          return;
        }
        const uid = node.member_id || node.uid || node.user_id || node.follow_id || node.fan_id;
        const name = node.member_name || node.username || node.name || node.nick;
        if (uid && name && typeof name === "string" && String(uid) !== String(cfg.user && cfg.user.member_id)) {
          const suid = String(uid);
          if (!seen.has(suid)) {
            seen.add(suid);
            out.push({ uid: suid, name: name.trim(), avatar: `/avatar/${suid}.png` });
          }
        }
        for (const k of Object.keys(node)) {
          if (k === "user") continue;
          walk(node[k]);
        }
      };
      walk(cfg);
    } catch (_) {}
    return out;
  }

  function extractUsersFromDom(doc) {
    const out = [];
    const seen = new Set();
    const scopes = doc.querySelectorAll("#nsk-frame-block a[href*='/space/'], #nsk-body-left a[href*='/space/'], .nsk-container a[href*='/space/']");
    for (const a of scopes) {
      if (a.closest(".user-card, header, .hover-user-card, .nsk-new-member-board")) continue;
      const m = (a.getAttribute("href") || "").match(/\/space\/(\d+)/);
      if (!m) continue;
      const uid = m[1];
      if (seen.has(uid)) continue;
      const card = a.closest("li, .fan-item, .follow-item, .item, div") || a.parentElement;
      const img = card ? card.querySelector("img") : null;
      const avatar = img ? img.getAttribute("src") : `/avatar/${uid}.png`;
      let name = a.textContent.trim();
      if (!name && card) {
        const nmEl = card.querySelector("a[href*='/space/']:not(:empty), .username, .Username");
        if (nmEl) name = nmEl.textContent.trim();
      }
      if (!name) name = a.getAttribute("title") || `用户#${uid}`;
      seen.add(uid);
      out.push({ uid, name, avatar });
    }
    return out;
  }

  function fetchFansViaHiddenIframe(url) {
    return withHiddenIframe(url, {
      pollMs: 250,
      timeoutMs: 4500,
      onPoll(idoc, attempts, finish) {
        const found = extractUsersFromDom(idoc);
        if (found.length > 0 || attempts > 16) finish(found);
      },
    }).then((res) => res || []);
  }

  async function fetchFansOrFollow(type) {
    const store = type === "follow" ? state.followData : state.fansData;
    if (store.loading) return;
    store.loading = true;
    store.error = null;
    renderRightBody();

    try {
      let list = [];
      // 首选 NodeSeek 官方 JSON 接口：/api/fans/follow 与 /api/fans/fans
      const apiResp = await fetch(`/api/fans/${type}`, {
        headers: { Accept: "application/json, text/plain, */*" },
        credentials: "include",
      });
      if (apiResp.ok) {
        const data = await apiResp.json().catch(() => null);
        const rawList =
          (data && Array.isArray(data.memberList) && data.memberList) ||
          (data && Array.isArray(data.list) && data.list) ||
          (data && Array.isArray(data.data) && data.data) ||
          [];
        if (rawList.length > 0) {
          const seen = new Set();
          for (const m of rawList) {
            const uid = String(m.member_id || m.uid || m.user_id || m.id || "").trim();
            const name = String(m.member_name || m.username || m.name || m.nick || "").trim();
            if (!uid && !name) continue;
            const key = uid || name;
            if (seen.has(key)) continue;
            seen.add(key);
            list.push({
              uid,
              name: name || `用户#${uid}`,
              avatar: uid ? `/avatar/${uid}.png` : "",
            });
          }
        }
      }

      if (list.length === 0) {
        const url = `/fans?type=${type}`;
        const resp = await fetch(url, { credentials: "include" });
        if (resp.ok) {
          const doc = new DOMParser().parseFromString(await resp.text(), "text/html");
          list = extractUsersFromDom(doc);
          if (list.length === 0) {
            list = extractUsersFromTempScript(doc);
          }
        }
        if (list.length === 0) {
          list = await fetchFansViaHiddenIframe(url);
        }
      }
      store.items = list;
      store.loaded = true;
    } catch (err) {
      store.error = err.message;
    } finally {
      store.loading = false;
      renderRightBody();
    }
  }

  async function fetchUserLastSpeak(uid) {
    if (!uid) return null;
    const cached = state.lastSpeakCache[uid];
    if (cached && Date.now() - cached.ts < 30 * 60 * 1000) {
      return cached;
    }

    try {
      const res = await fetch(`/api/content/list-comments?uid=${uid}&page=1`, {
        headers: { Accept: "application/json, text/plain, */*" },
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data || !data.success || !Array.isArray(data.comments) || data.comments.length === 0) {
        const emptyObj = { timeStr: "暂无发言", timestampMs: 0, title: "", link: "", postId: "", ts: Date.now() };
        state.lastSpeakCache[uid] = emptyObj;
        pruneTimedCache(state.lastSpeakCache, 500, 350);
        scheduleSaveJson(LS.LAST_SPEAK_CACHE, state.lastSpeakCache);
        return emptyObj;
      }

      const first = data.comments[0];
      const postId = String(first.post_id || "");
      const floorId = Number(first.floor_id) || 0;
      const title = first.title || `帖子 #${postId}`;
      const pageIndex = floorId > 0 ? Math.ceil(floorId / 10) : 1;
      const postUrl = `/post-${postId}-${pageIndex}`;

      let timeStr = "近期发言";
      let timestampMs = 0;

      if (first.created_at || first.createdAt) {
        const ms = new Date(first.created_at || first.createdAt).getTime();
        if (!Number.isNaN(ms) && ms > 0) {
          timestampMs = ms;
          timeStr = formatRelativeFromMs(ms);
        }
      }

      if (!timestampMs && postId) {
        const pRes = await fetch(postUrl, { credentials: "include" });
        if (pRes.ok) {
          const pDoc = new DOMParser().parseFromString(await pRes.text(), "text/html");
          const targetLi = floorId > 0 ? pDoc.getElementById(String(floorId)) : null;
          const timeEl = targetLi ? targetLi.querySelector(".date-created time") : null;
          if (timeEl) {
            const dt = timeEl.getAttribute("datetime") || "";
            const ttl = timeEl.getAttribute("title") || "";
            const ms = dt ? new Date(dt).getTime() : ttl ? new Date(ttl.replace(/\//g, "-")).getTime() : 0;
            if (ms > 0 && !Number.isNaN(ms)) timestampMs = ms;
            timeStr = formatChineseTime(timeEl.textContent, dt, ttl) || "近期发言";
          }
        }
      }

      const result = {
        timeStr,
        timestampMs,
        title,
        postId,
        floorId,
        link: `${postUrl}#${floorId}`,
        postUrl,
        ts: Date.now(),
      };
      state.lastSpeakCache[uid] = result;
      pruneTimedCache(state.lastSpeakCache, 500, 350);
      scheduleSaveJson(LS.LAST_SPEAK_CACHE, state.lastSpeakCache);
      return result;
    } catch (_) {
      return { timeStr: "查询失败", timestampMs: 0, title: "", link: "", postId: "", ts: 0 };
    }
  }

  async function openUserProfileModal(userObj) {
    const backdrop = document.getElementById("nsc-profile-backdrop");
    const modal = document.getElementById("nsc-profile-modal");
    if (!backdrop || !modal) return;

    const cachedSigHtml =
      userObj.signatureHtml ||
      (userObj.uid && state.signatureCache[`uid:${userObj.uid}`]) ||
      ((userObj.author || userObj.name) && state.signatureCache[`name:${userObj.author || userObj.name}`]) ||
      "";

    const renderModal = (info, loading) => {
      const friendActive = isFriend(info.name);
      const blackActive = isBlacklisted(info.name);
      const lastSp = info.uid ? state.lastSpeakCache[info.uid] : null;
      const domSig = sanitizeSignatureHtml(cachedSigHtml);
      const apiSig = info.signature ? renderSimpleMarkdown(info.signature) : "";
      const apiReadme = info.readme && info.readme !== info.signature && info.readme !== info.bio ? renderSimpleMarkdown(info.readme) : "";
      const sigContent = domSig || apiSig || apiReadme;

      modal.innerHTML = `
        <div class="nsc-profile-banner">
          <button type="button" class="nsc-profile-close" id="nsc-p-close">✕</button>
        </div>
        <div class="nsc-profile-body">
          <div class="nsc-profile-head">
            <img src="${info.avatar || "/static/image/favicon/android-chrome-192x192.png"}" />
            <div>
              <div style="font-size:16px;font-weight:700;"></div>
              <div style="font-size:12px;color:var(--nsc-muted);">ID: ${info.uid || "-"} · ${info.level} · 加入 ${info.days}${loading ? " (读取中...)" : ""}</div>
            </div>
          </div>
          <div class="nsc-profile-stats">
            <div><div class="nsc-stat-val">${info.legs}</div><div class="nsc-stat-lbl">鸡腿</div></div>
            <div><div class="nsc-stat-val">${info.stars}</div><div class="nsc-stat-lbl">星辰</div></div>
            <div><div class="nsc-stat-val">${info.posts}</div><div class="nsc-stat-lbl">主题</div></div>
            <div><div class="nsc-stat-val">${info.comments}</div><div class="nsc-stat-lbl">评论</div></div>
          </div>
          ${info.bio ? `<div class="nsc-profile-bio">简介：${info.bio.replace(/</g, "&lt;")}</div>` : ""}
          <div class="nsc-profile-sig">
            <div class="nsc-profile-sig-label">个性签名</div>
            <div class="nsc-profile-sig-body">${sigContent || `<span style="color:var(--nsc-muted);">暂无签名</span>`}</div>
            ${apiReadme && (domSig || apiSig) ? `<div style="margin-top:8px;padding-top:6px;border-top:1px dashed var(--nsc-border);"><div class="nsc-profile-sig-label">个人主页 README</div><div>${apiReadme}</div></div>` : ""}
            ${lastSp ? `<div style="margin-top:8px;padding-top:6px;border-top:1px dashed var(--nsc-border);color:var(--nsc-accent);">最后发言：${lastSp.timeStr}${lastSp.title ? ` (${lastSp.title.replace(/</g, "&lt;")})` : ""}</div>` : ""}
          </div>
          <div class="nsc-profile-btns">
            <button type="button" class="${friendActive ? "primary" : ""}" id="nsc-p-friend">${friendActive ? "已是好友" : "加为好友"}</button>
            <button type="button" class="danger" id="nsc-p-black">${blackActive ? "移出黑名单" : "加入黑名单"}</button>
            <button type="button" id="nsc-p-only">本帖只看TA</button>
            <button type="button" id="nsc-p-last">查最后发言</button>
            ${info.uid ? `<button type="button" id="nsc-p-pm">发私信</button>` : `<button type="button" disabled>发私信</button>`}
            ${info.uid ? `<a href="/space/${info.uid}" target="_blank">空间主页</a>` : ""}
          </div>
        </div>
      `;
      const btnsEl = modal.querySelector(".nsc-profile-btns");
      for (const act of state.registry.userActions || []) {
        if (!act.places || !act.places.includes("profile")) continue;
        if (typeof act.visibleFn === "function" && !act.visibleFn(info)) continue;
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = typeof act.labelFn === "function" ? act.labelFn(info) : (act.label || act.id);
        b.addEventListener("click", () => act.onClick(info, { refresh: () => renderModal(info, false) }));
        btnsEl.appendChild(b);
      }
      modal.querySelector(".nsc-profile-head div div:first-child").textContent = info.name;
      modal.querySelector("#nsc-p-close").addEventListener("click", () => backdrop.classList.remove("is-open"));
      const pmBtn = modal.querySelector("#nsc-p-pm");
      if (pmBtn && info.uid) {
        pmBtn.addEventListener("click", () => {
          backdrop.classList.remove("is-open");
          switchChannel("pm", false);
          openPmConversation(info);
        });
      }
      modal.querySelector("#nsc-p-friend").addEventListener("click", () => {
        toggleFriend(info);
        renderModal(info, false);
      });
      modal.querySelector("#nsc-p-black").addEventListener("click", async (e) => {
        e.target.disabled = true;
        await toggleBlacklist(info);
        renderModal(info, false);
      });
      modal.querySelector("#nsc-p-only").addEventListener("click", () => {
        state.onlyMember = state.onlyMember === info.name ? "" : info.name;
        state.onlyOp = false;
        applyMessageFilters();
        backdrop.classList.remove("is-open");
      });
      modal.querySelector("#nsc-p-last").addEventListener("click", async (e) => {
        if (!info.uid) return;
        e.target.textContent = "查询中...";
        await fetchUserLastSpeak(info.uid);
        renderModal(info, false);
        renderRightBody();
      });
    };

    backdrop.classList.add("is-open");
    renderModal(
      {
        uid: userObj.uid || "",
        name: userObj.author || userObj.name || "Seeker",
        avatar: userObj.avatar || "",
        level: userObj.level || "--",
        days: "--",
        legs: "--",
        stars: "--",
        posts: "--",
        comments: "--",
        bio: "",
        signature: "",
        readme: "",
      },
      true
    );

    const fullInfo = await fetchUserProfile(userObj.uid, userObj.author || userObj.name);
    if (fullInfo && userObj.uid) {
      syncUserBadgeToChatDom(userObj.uid, fullInfo);
    }
    if (backdrop.classList.contains("is-open")) {
      renderModal(fullInfo, false);
    }
  }

  async function runBatchLastSpeakQuery(items) {
    if (state.batchQuery.running) {
      state.batchQuery.stopRequested = true;
      return;
    }
    const targets = (items || []).filter((u) => {
      if (!u.uid) return false;
      const c = state.lastSpeakCache[u.uid];
      return !(c && Date.now() - c.ts < 30 * 60 * 1000);
    });
    if (targets.length === 0) {
      renderRightBody();
      renderUserHubIfOpen();
      return;
    }
    state.batchQuery = { running: true, done: 0, total: targets.length, stopRequested: false };
    renderRightBody();
    renderUserHubIfOpen();

    for (const u of targets) {
      if (state.batchQuery.stopRequested) break;
      await fetchUserLastSpeak(u.uid);
      state.batchQuery.done += 1;
      if (state.batchQuery.done % 4 === 0 || state.batchQuery.done === state.batchQuery.total) {
        renderRightBody();
        renderUserHubIfOpen();
      }
      if (!state.batchQuery.stopRequested && state.batchQuery.done < state.batchQuery.total) {
        await new Promise((r) => setTimeout(r, 260));
      }
    }
    state.batchQuery.running = false;
    state.batchQuery.stopRequested = false;
    renderRightBody();
    renderUserHubIfOpen();
  }

  function renderUserListPane(container, listItems, storeObj, typeLabel, onRemove) {
    const toolbar = document.createElement("div");
    toolbar.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:5px;";
    const sortBtn = document.createElement("button");
    sortBtn.type = "button";
    sortBtn.className = "nsc-mini-btn" + (storeObj.sortByActive ? " is-active" : "");
    sortBtn.style.flex = "1";
    sortBtn.title = "按最后发言时间排序";
    sortBtn.textContent = "排序";
    sortBtn.addEventListener("click", () => {
      storeObj.sortByActive = !storeObj.sortByActive;
      renderRightBody();
    });

    const batchBtn = document.createElement("button");
    batchBtn.type = "button";
    batchBtn.className = "nsc-mini-btn" + (state.batchQuery.running ? " is-active" : "");
    batchBtn.style.flex = "1";
    batchBtn.title = state.batchQuery.running ? "点击停止批量查询" : "一键查询当前列表全部用户的最后发言时间";
    batchBtn.textContent = state.batchQuery.running ? `${state.batchQuery.done}/${state.batchQuery.total}` : "查询";
    batchBtn.addEventListener("click", () => runBatchLastSpeakQuery(listItems));

    const refBtn = document.createElement("button");
    refBtn.type = "button";
    refBtn.className = "nsc-mini-btn";
    refBtn.style.flex = "1";
    refBtn.title = `刷新${typeLabel}列表`;
    refBtn.textContent = storeObj.loading ? "同步" : "刷新";
    refBtn.addEventListener("click", () => {
      fetchFansOrFollow(typeLabel === "好友" ? "follow" : "fans");
    });

    toolbar.appendChild(sortBtn);
    toolbar.appendChild(batchBtn);
    toolbar.appendChild(refBtn);
    container.appendChild(toolbar);

    if (storeObj.loading && listItems.length === 0) {
      const tip = document.createElement("div");
      tip.style.cssText = "padding:18px 8px;text-align:center;font-size:12px;color:var(--nsc-muted);";
      tip.textContent = `正在同步${typeLabel}列表...`;
      container.appendChild(tip);
      return;
    }

    let items = [...listItems];
    if (storeObj.sortByActive) {
      items.sort((a, b) => {
        const ta = (state.lastSpeakCache[a.uid] && state.lastSpeakCache[a.uid].timestampMs) || 0;
        const tb = (state.lastSpeakCache[b.uid] && state.lastSpeakCache[b.uid].timestampMs) || 0;
        return tb - ta;
      });
    }

    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.style.cssText = "padding:18px 8px;text-align:center;font-size:12px;color:var(--nsc-muted);";
      empty.textContent = typeLabel === "好友" ? "暂无关注好友，可在名片中加好友或点刷新" : "暂无粉丝记录，可点刷新";
      container.appendChild(empty);
      return;
    }

    for (const u of items) {
      const cachedSpeak = u.uid ? state.lastSpeakCache[u.uid] : null;
      const row = document.createElement("div");
      row.className = "nsc-qq-item";
      row.innerHTML = `
        <div class="nsc-qq-main">
          <img class="nsc-qq-avatar" src="${u.avatar || (u.uid ? `/avatar/${u.uid}.png` : "/static/image/favicon/android-chrome-192x192.png")}" />
          <div class="nsc-qq-info">
            <div class="nsc-qq-name"></div>
            <div class="nsc-qq-sub">${cachedSpeak ? `最后发言: ${cachedSpeak.timeStr}` : "点右侧眼睛查最后发言"}</div>
          </div>
          <button type="button" class="nsc-eye-btn" title="查询最后发言时间">${ICONS.eye}</button>
          <button type="button" class="nsc-icon-btn nsc-u-pm" title="发送私信">${ICONS.pm}</button>
          <button type="button" class="nsc-icon-btn danger nsc-u-rm" title="移除">${ICONS.trash}</button>
        </div>
        ${cachedSpeak && cachedSpeak.title ? `<div class="nsc-last-speak-box" title="点击在聊天窗口打开该帖子"><div class="nsc-last-speak-title">${cachedSpeak.title}</div></div>` : ""}
      `;
      row.querySelector(".nsc-qq-name").textContent = u.name;

      row.querySelector(".nsc-qq-main").addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        openUserProfileModal(u);
      });

      const eyeBtn = row.querySelector(".nsc-eye-btn");
      eyeBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!u.uid || eyeBtn.classList.contains("is-loading")) return;
        eyeBtn.classList.add("is-loading");
        delete state.lastSpeakCache[u.uid];
        await fetchUserLastSpeak(u.uid);
        renderRightBody();
      });

      row.querySelector(".nsc-u-pm").addEventListener("click", (e) => {
        e.stopPropagation();
        if (u.uid) {
          switchChannel("pm", false);
          openPmConversation(u);
        }
      });

      row.querySelector(".nsc-u-rm").addEventListener("click", (e) => {
        e.stopPropagation();
        onRemove(u);
      });

      const speakBox = row.querySelector(".nsc-last-speak-box");
      if (speakBox && cachedSpeak && cachedSpeak.postUrl) {
        speakBox.addEventListener("click", () => {
          openPostInChat({
            postId: cachedSpeak.postId,
            url: cachedSpeak.postUrl,
            title: cachedSpeak.title,
            author: u.name,
            avatar: u.avatar,
            targetFloor: cachedSpeak.floorId ? String(cachedSpeak.floorId) : "",
          });
        });
      }

      container.appendChild(row);
    }
  }

  function renderRightBody() {
    const container = document.getElementById("nsc-right-scroll");
    if (!container) return;
    container.innerHTML = "";

    if (state.rightTab === "hot") {
      const toolbar = document.createElement("div");
      toolbar.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:4px;";
      const seg = document.createElement("div");
      seg.className = "nsc-seg-tabs";
      [
        { id: "realtime", label: "实时" },
        { id: "daily", label: "日榜" },
        { id: "weekly", label: "周榜" },
      ].forEach((opt) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "nsc-seg-btn" + (state.hotTab === opt.id ? " is-active" : "");
        b.textContent = opt.label;
        b.addEventListener("click", () => {
          state.hotTab = opt.id;
          localStorage.setItem(LS.HOT_TAB, opt.id);
          if (!state.hotCache[opt.id]) fetchHotPosts(opt.id);
          else renderRightBody();
        });
        seg.appendChild(b);
      });
      const refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.className = "nsc-mini-btn";
      refBtn.textContent = state.hotLoading ? "刷新中" : "刷新";
      refBtn.addEventListener("click", () => fetchHotPosts(state.hotTab));
      toolbar.appendChild(seg);
      toolbar.appendChild(refBtn);
      container.appendChild(toolbar);

      const cached = state.hotCache[state.hotTab];
      if (state.hotLoading && !cached) {
        const tip = document.createElement("div");
        tip.style.cssText = "padding:20px 8px;text-align:center;font-size:12px;color:var(--nsc-muted);";
        tip.textContent = "正在加载 NodeSeek 热榜...";
        container.appendChild(tip);
        return;
      }

      const list = ((cached && cached.items) || []).filter((x) => !isMemberHidden(x.author));
      if (list.length === 0) {
        const empty = document.createElement("div");
        empty.style.cssText = "padding:18px 8px;text-align:center;font-size:12px;color:var(--nsc-muted);";
        empty.textContent = state.hotError ? `热榜加载失败 (${state.hotError})` : "暂无热榜数据，点击刷新";
        container.appendChild(empty);
        return;
      }

      list.forEach((it, idx) => {
        const row = document.createElement("div");
        row.className = "nsc-hot-row" + (state.currentPostId === it.postId ? " is-selected" : "");
        const rankCls = idx === 0 ? "rank1" : idx === 1 ? "rank2" : idx === 2 ? "rank3" : "";
        row.innerHTML = `
          <span class="nsc-hot-rank ${rankCls}">${idx + 1}</span>
          <div style="flex:1;min-width:0;">
            <div class="nsc-hot-title"></div>
            <div style="font-size:10.5px;color:var(--nsc-muted);margin-top:2px;">${it.author} · 回复 ${it.replies} · 热度 ${it.score}</div>
          </div>
        `;
        row.querySelector(".nsc-hot-title").textContent = it.title;
        row.addEventListener("click", () => openPostInChat(it));
        container.appendChild(row);
      });
      return;
    }

    if (state.rightTab === "friends") {
      const mergedMap = new Map();
      for (const f of state.friends) {
        if (!isBlacklisted(f.name)) mergedMap.set(f.name, f);
      }
      for (const f of state.followData.items) {
        if (!state.removedFriends.has(f.name) && !isBlacklisted(f.name) && !mergedMap.has(f.name)) {
          mergedMap.set(f.name, f);
        }
      }
      renderUserListPane(container, Array.from(mergedMap.values()), state.followData, "好友", (u) => {
        toggleFriend(u);
      });
      return;
    }

    if (state.rightTab === "fans") {
      const visibleFans = state.fansData.items.filter((u) => !isMemberHidden(u.name));
      renderUserListPane(container, visibleFans, state.fansData, "粉丝", (u) => {
        state.removedFans.add(u.name);
        applyMessageFilters();
        renderRightBody();
      });
      return;
    }

    const addBox = document.createElement("div");
    addBox.style.cssText = "display:flex;align-items:center;gap:5px;margin-bottom:7px;";
    addBox.innerHTML = `
      <input type="text" class="nsc-search-input" id="nsc-blk-input" placeholder="输入用户名添加屏蔽..." style="flex:1;height:26px;" />
      <button type="button" class="nsc-mini-btn" id="nsc-blk-add-btn" style="height:26px;padding:0 10px;">屏蔽</button>
    `;
    container.appendChild(addBox);

    const toolbar = document.createElement("div");
    toolbar.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:5px;";
    toolbar.innerHTML = `
      <span id="nsc-blk-status" style="font-size:11px;color:var(--nsc-muted);">共 ${state.blacklist.length} 人</span>
      <div style="display:inline-flex;gap:5px;">
        <button type="button" class="nsc-mini-btn" id="nsc-blk-ref">${state.blockListState.loading ? "同步" : "刷新"}</button>
        <a class="nsc-mini-btn" href="/setting#block" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">设置 ↗</a>
      </div>
    `;
    container.appendChild(toolbar);

    const blkInput = addBox.querySelector("#nsc-blk-input");
    const blkAddBtn = addBox.querySelector("#nsc-blk-add-btn");
    const blkStatus = toolbar.querySelector("#nsc-blk-status");
    const doAddBlock = async () => {
      const targetName = blkInput.value.trim();
      if (!targetName) return;
      blkAddBtn.disabled = true;
      blkAddBtn.textContent = "提交";
      const res = await toggleBlacklist({ name: targetName });
      blkAddBtn.disabled = false;
      blkAddBtn.textContent = "屏蔽";
      if (res && !res.ok) {
        blkStatus.textContent = res.message || "屏蔽失败";
        blkStatus.style.color = "#ff3b30";
      } else {
        blkInput.value = "";
      }
    };
    blkAddBtn.addEventListener("click", doAddBlock);
    blkInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doAddBlock();
      }
    });
    toolbar.querySelector("#nsc-blk-ref").addEventListener("click", () => fetchServerBlockList(false));

    if (state.blockListState.loading && state.blacklist.length === 0) {
      const tip = document.createElement("div");
      tip.style.cssText = "padding:18px 8px;text-align:center;font-size:12px;color:var(--nsc-muted);";
      tip.textContent = "正在同步服务器黑名单...";
      container.appendChild(tip);
      return;
    }

    if (state.blockListState.error && state.blacklist.length === 0) {
      const errTip = document.createElement("div");
      errTip.style.cssText = "padding:14px 8px;text-align:center;font-size:12px;color:#ff3b30;";
      errTip.textContent = `加载黑名单失败: ${state.blockListState.error}`;
      container.appendChild(errTip);
      return;
    }

    if (state.blacklist.length === 0) {
      const empty = document.createElement("div");
      empty.style.cssText = "padding:18px 8px;text-align:center;font-size:12px;color:var(--nsc-muted);";
      empty.textContent = "黑名单为空，可上方输入用户名或在名片中添加屏蔽";
      container.appendChild(empty);
      return;
    }
    for (const b of state.blacklist) {
      const row = document.createElement("div");
      row.className = "nsc-qq-item";
      row.innerHTML = `
        <div class="nsc-qq-main">
          <img class="nsc-qq-avatar" src="${b.avatar || (b.uid ? `/avatar/${b.uid}.png` : "/static/image/favicon/android-chrome-192x192.png")}" />
          <div class="nsc-qq-info">
            <div class="nsc-qq-name"></div>
            <div class="nsc-qq-sub">${b.uid ? `UID: ${b.uid} · 已屏蔽` : "已屏蔽"}</div>
          </div>
          <button type="button" class="nsc-mini-btn">解除</button>
        </div>
      `;
      row.querySelector(".nsc-qq-name").textContent = b.name;
      const unblkBtn = row.querySelector("button");
      unblkBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        unblkBtn.disabled = true;
        unblkBtn.textContent = "...";
        const res = await toggleBlacklist(b);
        if (res && !res.ok) {
          unblkBtn.disabled = false;
          unblkBtn.textContent = "解除";
          blkStatus.textContent = res.message || "移出失败";
          blkStatus.style.color = "#ff3b30";
        }
      });
      row.querySelector(".nsc-qq-main").addEventListener("click", (e) => {
        if (!e.target.closest("button")) openUserProfileModal(b);
      });
      container.appendChild(row);
    }
  }

  function renderUserHubIfOpen() {
    const bd = document.getElementById("nsc-hub-backdrop");
    if (bd && bd.classList.contains("is-open")) renderUserHub();
  }

  async function loadPaginatedHubStore(st, buildUrl, extractRows, onRows, reset = false, needUid = false) {
    detectCurrentUser();
    const uid = state.currentUserId;
    if ((needUid && !uid) || st.loading) return;
    if (reset) { st.items = []; st.page = 0; st.noMore = false; st.error = null; }
    if (st.noMore) return;
    st.loading = true;
    renderUserHubIfOpen();
    try {
      const nextPage = st.page + 1;
      const json = await apiGetJson(buildUrl(uid, nextPage));
      const rows = extractRows(json);
      if (rows === null) {
        st.noMore = true;
      } else if (!Array.isArray(rows) || rows.length === 0) {
        st.noMore = true;
      } else {
        onRows(rows, st);
        st.page = nextPage;
        if (rows.length < 15) st.noMore = true;
      }
    } catch (err) {
      st.error = err.message;
    } finally {
      st.loading = false;
      renderUserHubIfOpen();
    }
  }

  function loadHubPosts(reset = false) {
    return loadPaginatedHubStore(
      state.hubData.posts,
      (uid, p) => `/api/content/list-discussions?uid=${uid}&page=${p}`,
      (json) => (json && (json.discussions || json.data || json.list)) || [],
      (rows, st) => {
        const seen = new Set(st.items.map((x) => String(x.post_id || x.id)));
        for (const r of rows) {
          const pid = String(r.post_id || r.id || "");
          if (pid && !seen.has(pid)) { st.items.push(r); seen.add(pid); }
        }
      },
      reset,
      true
    );
  }

  function loadHubComments(reset = false) {
    return loadPaginatedHubStore(
      state.hubData.comments,
      (uid, p) => `/api/content/list-comments?uid=${uid}&page=${p}`,
      (json) => (json && (json.comments || json.data || json.list)) || [],
      (rows, st) => { st.items.push(...rows); },
      reset,
      true
    );
  }

  function loadHubCollections(reset = false) {
    return loadPaginatedHubStore(
      state.hubData.collections,
      (_, p) => `/api/statistics/list-collection?page=${p}`,
      (json) => (json && (json.collections || json.data || json.list)) || [],
      (rows, st) => {
        const seen = new Set(st.items.map((x) => String(x.post_id || x.postId || x.id)));
        for (const r of rows) {
          const pid = String(r.post_id || r.postId || r.id || "");
          if (pid) {
            state.collectedSet.add(pid);
            if (!seen.has(pid)) { st.items.push(r); seen.add(pid); }
          }
        }
      },
      reset,
      false
    );
  }

  function loadHubCredit(reset = false) {
    return loadPaginatedHubStore(
      state.hubData.credit,
      (_, p) => `/api/account/credit/page-${p}`,
      (json) => {
        if (json && json.success === false && /max page/i.test(json.message || "")) return null;
        return (json && (Array.isArray(json.data) ? json.data : json.data?.list || json.data?.records)) || [];
      },
      (rows, st) => { st.items.push(...rows); },
      reset,
      false
    );
  }

  async function loadHubStardust(reset = false, modeOverride = null) {
    detectCurrentUser();
    const uid = state.currentUserId;
    const st = state.hubData.stardust;
    if (modeOverride) st.mode = modeOverride;
    if (!uid || st.loading) return;
    if (reset) { st.items = []; st.cursor = null; st.noMore = false; st.error = null; }
    if (st.noMore) return;
    st.loading = true;
    renderUserHubIfOpen();
    try {
      const paramKey = st.mode === "sent" ? "peer_id" : "member_id";
      const url = `/api/stardust/list?${paramKey}=${uid}&count=40${st.cursor ? `&before_id=${encodeURIComponent(st.cursor)}` : ""}`;
      const resp = await fetch(url, {
        headers: { Accept: "application/json, text/plain, */*" },
        credentials: "include",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const rows = (json && Array.isArray(json.records) && json.records) || [];
      if (rows.length === 0) st.noMore = true;
      else {
        st.items.push(...rows);
        st.cursor = json.cursor || null;
        if (!json.exist_more) st.noMore = true;
      }
    } catch (err) {
      st.error = err.message;
    } finally {
      st.loading = false;
      renderUserHubIfOpen();
    }
  }

  async function loadHubProgress(force = false) {
    detectCurrentUser();
    const uid = state.currentUserId;
    const st = state.hubData.progress;
    if (!uid || st.loading) return;
    if (st.data && !force) return;
    st.loading = true;
    st.error = null;
    renderUserHubIfOpen();
    try {
      const [info, quotaResp] = await Promise.all([
        fetchUserProfile(String(uid), state.currentUser),
        fetch("/api/progress/today?scope=freelike", {
          headers: { Accept: "application/json, text/plain, */*" },
          credentials: "include",
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      st.data = { info, quota: quotaResp };
    } catch (err) {
      st.error = err.message;
    } finally {
      st.loading = false;
      renderUserHubIfOpen();
    }
  }

  function loadHubAttendanceBoard(reset = false) {
    return loadPaginatedHubStore(
      state.hubData.board,
      (_, p) => `/api/attendance/board?page=${p}`,
      (json) => (json && (json.list || json.data || json.records)) || [],
      (rows, st) => { st.items.push(...rows); },
      reset,
      false
    );
  }

  function getBeijingDateStr() {
    const d = new Date(Date.now() + (new Date().getTimezoneOffset() + 480) * 60000);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  }

  async function maybeRunAutoCheckin() {
    if (!state.autoCheckin || state._autoCheckinAttempted) return;
    detectCurrentUser();
    if (!state.currentUserId) return;
    const today = getBeijingDateStr();
    if (state.autoCheckinDate === today) return;
    state._autoCheckinAttempted = true;
    await performAttendance(state.autoCheckinMode === "random", true);
  }

  async function performAttendance(randomMode = false, silent = false) {
    if (state.hubData.checkinLoading) return;
    state.hubData.checkinLoading = true;
    if (!silent) renderUserHubIfOpen();
    try {
      const resp = await fetch(`/api/attendance?random=${randomMode ? "true" : "false"}`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json, text/plain, */*", "Content-Type": "application/json" },
      });
      const json = await resp.json().catch(() => ({}));
      const msg = (json && json.message) || (resp.ok ? "签到请求已处理" : `HTTP ${resp.status}`);
      const ok = Boolean(resp.ok && json && json.success !== false);
      const alreadyDone = /已完成|已经签到|重复/.test(msg);
      if (ok || alreadyDone) {
        const today = getBeijingDateStr();
        state.autoCheckinDate = today;
        localStorage.setItem(LS.AUTO_CHECKIN_DATE, today);
      }
      state.hubData.checkinResult = {
        ok,
        message: msg,
        gain: json && json.gain,
        current: json && json.current,
        mode: randomMode ? "随机签到" : "固定签到",
      };
      if (json && json.current !== undefined) {
        const legSpan = document.querySelector('.user-card .user-stat a[href="/credit"] span');
        if (legSpan) legSpan.textContent = `鸡腿 ${json.current}`;
      }
      if (ok && !silent) {
        loadHubAttendanceBoard(true);
      }
    } catch (err) {
      state.hubData.checkinResult = { ok: false, message: err.message, mode: randomMode ? "随机签到" : "固定签到" };
    } finally {
      state.hubData.checkinLoading = false;
      renderUserHubIfOpen();
    }
  }

  function mountHubThemedIframe(bodyEl, srcPath) {
    if (!bodyEl) return;
    bodyEl.style.padding = "8px 10px";
    bodyEl.style.overflow = "hidden";
    bodyEl.style.position = "relative";

    const loadingTip = document.createElement("div");
    loadingTip.className = "nsc-empty-state";
    loadingTip.style.cssText = "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;margin:0;";
    loadingTip.textContent = "正在载入页面...";

    const iframe = document.createElement("iframe");
    iframe.className = "nsc-hub-iframe";
    iframe.style.opacity = "0";
    iframe.style.transition = "opacity 0.14s ease";
    iframe.src = srcPath;

    let revealed = false;
    const revealIframe = () => {
      if (revealed) return;
      revealed = true;
      try { loadingTip.remove(); } catch (_) {}
      requestAnimationFrame(() => {
        iframe.style.opacity = "1";
      });
    };
    setTimeout(revealIframe, 3500);

    iframe.addEventListener("load", () => {
      try {
        const idoc = iframe.contentDocument;
        if (!idoc) { revealIframe(); return; }
        if (!idoc.getElementById("nsc-hub-iframe-style")) {
          const isDark = document.body.classList.contains("dark-layout");
          const isDusk = document.body.classList.contains("nsc-theme-dusk");
          if (isDark) {
            idoc.body.classList.remove("light-layout");
            idoc.body.classList.add("dark-layout");
          } else {
            idoc.body.classList.remove("dark-layout");
            idoc.body.classList.add("light-layout");
          }
          const st = idoc.createElement("style");
          st.id = "nsc-hub-iframe-style";
          st.textContent = `
            header, footer, #nsk-right-panel-container, #fast-nav-button-group, #nsc-app-shell { display: none !important; }
            html, body {
              background: transparent !important;
              color: ${isDark ? "#f2f2f7" : isDusk ? "#3a3025" : "#1d1d1f"} !important;
              font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif !important;
              margin: 0 !important; padding: 6px !important;
            }
            body > section#nsk-frame { opacity: 1 !important; }
            #nsk-frame, #nsk-body, #nsk-body-left {
              width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important;
              float: none !important;
            }
            #user-setting-panel, .nsk-panel, .board-container, .lucky-container, .invite-container {
              background: ${isDark ? "#2f333d" : isDusk ? "#faf4e8" : "#ffffff"} !important;
              color: ${isDark ? "#f2f2f7" : isDusk ? "#3a3025" : "#1d1d1f"} !important;
              border: 1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"} !important;
              border-radius: 12px !important;
              box-shadow: none !important;
              margin: 0 auto !important;
              padding: 16px 20px !important;
            }
            input, textarea, select {
              border-radius: 8px !important;
              border: 1px solid ${isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)"} !important;
              background: ${isDark ? "#22252c" : isDusk ? "#f4ecdf" : "#f8f9fb"} !important;
              color: ${isDark ? "#f2f2f7" : "#1d1d1f"} !important;
            }
            .btn, button[type="submit"] { border-radius: 8px !important; }
          `;
          (idoc.head || idoc.documentElement).appendChild(st);
          const preHide = idoc.getElementById("nsc-hub-iframe-prehide");
          if (preHide) preHide.remove();
        }
        if (state._settingAutoSection) {
          const targetSec = String(state._settingAutoSection);
          state._settingAutoSection = "";
          const trySelectSection = () => {
            const items = Array.from(idoc.querySelectorAll("#user-setting-panel .selector > div, .selector > div"));
            const secEl = items.find((el) => (el.textContent || "").trim().includes(targetSec));
            if (secEl) {
              secEl.click();
              const panel = idoc.getElementById("user-setting-panel");
              if (panel && typeof panel.scrollIntoView === "function") {
                panel.scrollIntoView({ behavior: "auto", block: "start" });
              }
              return true;
            }
            return false;
          };
          if (trySelectSection()) {
            revealIframe();
          } else {
            setTimeout(() => {
              try {
                if (!trySelectSection()) {
                  const subbarTip = document.querySelector("#nsc-hub-subbar span");
                  if (subbarTip) {
                    subbarTip.textContent = `当前账号可能暂未达到「${targetSec}」所需社区等级，未检测到该入口`;
                    subbarTip.style.color = "#f59e0b";
                  }
                }
              } catch (_) {}
              revealIframe();
            }, 320);
          }
        } else {
          revealIframe();
        }
      } catch (_) {
        revealIframe();
      }
    });
    bodyEl.innerHTML = "";
    bodyEl.appendChild(loadingTip);
    bodyEl.appendChild(iframe);
  }

  function renderUserHub() {
    const bd = document.getElementById("nsc-hub-backdrop");
    if (!bd) return;
    const modal = bd.querySelector(".nsc-hub-modal");
    if (!modal) return;

    const sameTab = state._lastRenderedHubTab === state.hubTab;
    const oldBody = modal.querySelector("#nsc-hub-body");
    if (sameTab && oldBody && oldBody.querySelector(".nsc-hub-iframe")) {
      return;
    }
    const prevScrollTop = sameTab && oldBody ? oldBody.scrollTop : 0;
    state._lastRenderedHubTab = state.hubTab;

    detectCurrentUser();
    const uid = state.currentUserId || "";
    const avatarUrl = uid ? `/avatar/${uid}.png` : "/static/image/favicon/android-chrome-192x192.png";
    const totalNotif =
      (Number(state.unreadCounts.atMe) || 0) +
      (Number(state.unreadCounts.reply) || 0) +
      (Number(state.unreadCounts.message) || 0) +
      (Number(state.unreadCounts.sysNotice) || 0);

    const nativeHrefMap = {
      notif: "/notification",
      posts: `/space/${uid}#discussions`,
      comments: `/space/${uid}#comments`,
      collections: `/space/${uid}#collections`,
      credit: "/credit",
      stardust: `/stardust/list?member_id=${uid}`,
      fans: "/fans?type=fans",
      progress: "/progress",
      attendance: "/board",
      setting: "/setting",
      lucky: "/lucky",
      invite: "/invite",
    };

    const baseTabs = [
      { id: "notif", label: "通知", order: 10, cnt: totalNotif },
      { id: "posts", label: "主题帖", order: 20 },
      { id: "comments", label: "评论", order: 30 },
      { id: "collections", label: "收藏", order: 40 },
      { id: "credit", label: "鸡腿", order: 50 },
      { id: "stardust", label: "星辰", order: 60 },
      { id: "fans", label: "粉丝", order: 70 },
      { id: "attendance", label: "签到", order: 80 },
      { id: "progress", label: "等级", order: 90 },
      { id: "setting", label: "设置", order: 100 },
    ];
    const tabs = [...baseTabs, ...(state.registry.hubTabs || [])].sort((a, b) => (a.order ?? 80) - (b.order ?? 80));
    const tabSig = tabs.map((t) => t.id).join(",");

    const uInfo = uid && state.userCache[String(uid)];
    if (!modal.dataset.nscShellInit) {
      modal.dataset.nscShellInit = "1";
      modal.innerHTML = `
        <div class="nsc-hub-head">
          <div class="nsc-hub-user">
            <img id="nsc-hub-avatar" src="${avatarUrl}" alt="" />
            <div style="min-width:0;">
              <div style="font-size:14.5px;font-weight:700;display:flex;align-items:center;gap:6px;">
                <span id="nsc-hub-uname"></span>
                <span class="nsc-lv-pill" id="nsc-hub-ulv" style="display:none;"></span>
              </div>
              <div id="nsc-hub-usub" style="font-size:11px;color:var(--nsc-muted);"></div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <a class="nsc-mini-btn" id="nsc-hub-native-link" href="/notification" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">原版页面 ↗</a>
            <button type="button" class="nsc-mini-btn" id="nsc-hub-close" style="padding:3px 9px;">✕</button>
          </div>
        </div>
        <div class="nsc-hub-tabs" id="nsc-hub-tabs"></div>
        <div class="nsc-hub-subbar" id="nsc-hub-subbar"></div>
        <div class="nsc-hub-body" id="nsc-hub-body"></div>
      `;
      modal.querySelector("#nsc-hub-close").addEventListener("click", () => bd.classList.remove("is-open"));
      const persistentBody = modal.querySelector("#nsc-hub-body");
      let hubScrollRaf = 0;
      persistentBody.addEventListener("scroll", () => {
        if (hubScrollRaf) return;
        hubScrollRaf = requestAnimationFrame(() => {
          hubScrollRaf = 0;
          if (persistentBody.scrollHeight - persistentBody.scrollTop - persistentBody.clientHeight < 180) {
            if (state.hubTab === "posts") loadHubPosts(false);
            else if (state.hubTab === "comments") loadHubComments(false);
            else if (state.hubTab === "collections") loadHubCollections(false);
            else if (state.hubTab === "credit") loadHubCredit(false);
            else if (state.hubTab === "stardust") {
              if (state.hubStardustView === "analytics") {
                const sv = state.registry.hubSubViews && state.registry.hubSubViews.stardust;
                if (sv && typeof sv.onScrollEnd === "function") sv.onScrollEnd(persistentBody);
              } else {
                loadHubStardust(false);
              }
            }
            else if (state.hubTab === "attendance") loadHubAttendanceBoard(false);
            else {
              const regTab = (state.registry.hubTabs || []).find((t) => t.id === state.hubTab);
              if (regTab && typeof regTab.onScrollEnd === "function") regTab.onScrollEnd(persistentBody);
            }
          }
        });
      });
    }

    if (modal.dataset.nscTabSig !== tabSig) {
      modal.dataset.nscTabSig = tabSig;
      const tabsHost = modal.querySelector("#nsc-hub-tabs");
      if (tabsHost) {
        tabsHost.innerHTML = tabs
          .map(
            (t) => `
            <button type="button" class="nsc-hub-tab" data-htab="${escHtml(t.id)}">
              <span>${escHtml(t.label)}</span>
              <span class="nsc-hub-tab-cnt" style="display:none;"></span>
            </button>
          `
          )
          .join("");
        tabsHost.querySelectorAll("[data-htab]").forEach((btn) => {
          btn.addEventListener("click", () => openUserHubModal(btn.dataset.htab));
        });
      }
    }

    const closeHub = () => bd.classList.remove("is-open");
    const avImg = modal.querySelector("#nsc-hub-avatar");
    if (avImg) avImg.src = avatarUrl;
    const uNameEl = modal.querySelector("#nsc-hub-uname");
    if (uNameEl) uNameEl.textContent = state.currentUser || "个人中心";
    const uLvEl = modal.querySelector("#nsc-hub-ulv");
    if (uLvEl) {
      if (uInfo && uInfo.level) { uLvEl.textContent = uInfo.level; uLvEl.style.display = "inline-block"; }
      else uLvEl.style.display = "none";
    }
    const uSubEl = modal.querySelector("#nsc-hub-usub");
    if (uSubEl) uSubEl.textContent = `UID: ${uid || "-"} · macOS 工作台个人空间`;
    const nativeLnk = modal.querySelector("#nsc-hub-native-link");
    const customHubTab = (state.registry.hubTabs || []).find((t) => t.id === state.hubTab);
    if (nativeLnk) nativeLnk.href = (customHubTab && customHubTab.nativeHref) || nativeHrefMap[state.hubTab] || "/notification";

    modal.querySelectorAll("[data-htab]").forEach((btn) => {
      const tid = btn.dataset.htab;
      const tSpec = tabs.find((t) => t.id === tid);
      btn.classList.toggle("is-active", state.hubTab === tid);
      const cntEl = btn.querySelector(".nsc-hub-tab-cnt");
      if (cntEl) {
        const cntVal = tid === "notif" ? totalNotif : (tSpec && typeof tSpec.badgeFn === "function" ? Number(tSpec.badgeFn()) || 0 : 0);
        if (cntVal > 0) {
          cntEl.textContent = cntVal > 99 ? "99+" : String(cntVal);
          cntEl.style.display = "inline-block";
        } else {
          cntEl.style.display = "none";
        }
      }
    });

    const subbar = modal.querySelector("#nsc-hub-subbar");
    const body = modal.querySelector("#nsc-hub-body");
    subbar.innerHTML = "";
    body.innerHTML = "";
    body.style.padding = "";
    body.style.overflow = "";

    const restoreHubScroll = () => {
      if (prevScrollTop > 0) body.scrollTop = prevScrollTop;
    };
    const appendWaterfallFooter = (stObj, loadFn, label = "记录") => {
      const wf = document.createElement("div");
      wf.style.cssText = "text-align:center;font-size:11px;color:var(--nsc-muted);padding:10px 4px;";
      if (stObj.noMore) wf.textContent = `已加载全部${label}`;
      else if (stObj.loading) wf.textContent = "正在瀑布流加载更多...";
      else wf.textContent = `下滑自动加载更多${label}`;
      body.appendChild(wf);
    };

    if (state.hubTab === "notif") {
      const subTabs = [
        { id: "reply-me", label: "回复我", cnt: Number(state.unreadCounts.reply) || 0 },
        { id: "at-me", label: "@我", cnt: Number(state.unreadCounts.atMe) || 0 },
        { id: "pm", label: "私信", cnt: Number(state.unreadCounts.message) || 0 },
        { id: "sys-notice", label: "系统通知", cnt: Number(state.unreadCounts.sysNotice) || 0 },
      ];
      const seg = document.createElement("div");
      seg.className = "nsc-seg-tabs";
      subTabs.forEach((st) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "nsc-seg-btn" + (state.hubNotifSub === st.id ? " is-active" : "");
        b.textContent = st.cnt > 0 ? `${st.label} (${st.cnt})` : st.label;
        b.addEventListener("click", () => {
          state.hubNotifSub = st.id;
          if ((st.id === "at-me" || st.id === "reply-me") && !state.notifData[st.id].loaded) fetchNotifications(st.id);
          else if (st.id === "pm" && !state.pmList.loaded) fetchPmList();
          else if (st.id === "sys-notice" && !state.sysNoticeList.loaded) fetchSysNotices(false);
          renderUserHub();
        });
        seg.appendChild(b);
      });
      const ops = document.createElement("div");
      ops.style.cssText = "display:flex;align-items:center;gap:6px;";
      if (state.hubNotifSub === "at-me" || state.hubNotifSub === "reply-me" || state.hubNotifSub === "sys-notice") {
        const readAllBtn = document.createElement("button");
        readAllBtn.type = "button";
        readAllBtn.className = "nsc-mini-btn";
        readAllBtn.textContent = "全部标为已读";
        readAllBtn.addEventListener("click", () => {
          if (state.hubNotifSub === "sys-notice") {
            const ids = state.sysNoticeList.items.filter((x) => x.unread && x.id).map((x) => x.id);
            markSysNoticesRead(ids);
          } else {
            markNotificationViewed(state.hubNotifSub, 0, true);
          }
        });
        ops.appendChild(readAllBtn);
      }
      const refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.className = "nsc-mini-btn";
      refBtn.textContent = "刷新";
      refBtn.addEventListener("click", () => {
        fetchUnreadCounts();
        if (state.hubNotifSub === "pm") fetchPmList();
        else if (state.hubNotifSub === "sys-notice") fetchSysNotices(false);
        else fetchNotifications(state.hubNotifSub);
      });
      ops.appendChild(refBtn);
      subbar.appendChild(seg);
      subbar.appendChild(ops);

      if (state.hubNotifSub === "at-me" || state.hubNotifSub === "reply-me") {
        const st = state.notifData[state.hubNotifSub];
        if (st.loading && st.items.length === 0) {
          body.innerHTML = `<div class="nsc-empty-state">正在加载通知...</div>`;
          return;
        }
        if (st.items.length === 0) {
          body.innerHTML = `<div class="nsc-empty-state">暂无通知记录</div>`;
          return;
        }
        const srvUnread = Number(state.unreadCounts[state.hubNotifSub === "at-me" ? "atMe" : "reply"]) || 0;
        const visUnread = st.items.filter((x) => !x.viewed).length;
        if (srvUnread > 0 && visUnread === 0) {
          const hint = document.createElement("div");
          hint.style.cssText =
            "display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;margin-bottom:8px;border-radius:9px;background:var(--nsc-accent-soft);font-size:12px;color:var(--nsc-accent);";
          hint.innerHTML = `<span>服务端仍有 ${srvUnread} 条较早未读（超出列表展示范围）</span>`;
          const clrBtn = document.createElement("button");
          clrBtn.type = "button";
          clrBtn.className = "nsc-mini-btn";
          clrBtn.textContent = "全部标为已读";
          clrBtn.addEventListener("click", () => markNotificationViewed(state.hubNotifSub, 0, true));
          hint.appendChild(clrBtn);
          body.appendChild(hint);
        }
        st.items.forEach((it) => {
          const row = document.createElement("div");
          row.className = "nsc-hub-row" + (it.viewed ? " is-read" : "");
          row.innerHTML = `
            <img src="${it.avatar || "/static/image/favicon/android-chrome-192x192.png"}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex:0 0 32px;" />
            <div class="nsc-hub-row-main">
              <div class="nsc-hub-row-title">${escHtml(it.title)}</div>
              <div class="nsc-hub-row-sub">
                <span>${escHtml(it.author)} ${state.hubNotifSub === "at-me" ? "@了你" : "回复了你"}</span>
                <span>#${it.floorId || 0}楼</span>
                ${it.timeText ? `<span>${escHtml(it.timeText)}</span>` : ""}
              </div>
            </div>
            ${!it.viewed ? `<span class="nsc-badge-dot" style="margin-top:0;"></span>` : `<span class="nsc-badge-read">已读</span>`}
          `;
          row.addEventListener("click", () => {
            if (!it.viewed) markNotificationViewed(state.hubNotifSub, it, false);
            closeHub();
            switchChannel(state.hubNotifSub, false);
            openPostInChat({
              postId: it.postId,
              url: it.url,
              title: it.title,
              author: it.author,
              avatar: it.avatar,
              targetFloor: it.floorId ? String(it.floorId) : "",
            });
          });
          body.appendChild(row);
        });
      } else if (state.hubNotifSub === "pm") {
        const st = state.pmList;
        if (st.loading && st.items.length === 0) {
          body.innerHTML = `<div class="nsc-empty-state">正在读取私信会话...</div>`;
          return;
        }
        if (st.items.length === 0) {
          body.innerHTML = `<div class="nsc-empty-state">暂无私信记录</div>`;
          return;
        }
        st.items.forEach((it) => {
          const row = document.createElement("div");
          row.className = "nsc-hub-row" + (!it.unread ? " is-read" : "");
          row.innerHTML = `
            <img src="${it.avatar}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex:0 0 32px;" />
            <div class="nsc-hub-row-main">
              <div class="nsc-hub-row-title">${escHtml(it.name)}</div>
              <div class="nsc-hub-row-sub"><span>${escHtml(it.content || "(无正文)")}</span><span>${escHtml(it.timeText || "")}</span></div>
            </div>
            ${it.unread ? `<span class="nsc-badge-dot" style="margin-top:0;"></span>` : `<span class="nsc-badge-read">已读</span>`}
          `;
          row.addEventListener("click", () => {
            closeHub();
            switchChannel("pm", false);
            openPmConversation(it);
          });
          body.appendChild(row);
        });
      } else {
        const st = state.sysNoticeList;
        if (st.loading && st.items.length === 0) {
          body.innerHTML = `<div class="nsc-empty-state">正在读取系统通知...</div>`;
          return;
        }
        if (st.items.length === 0) {
          body.innerHTML = `<div class="nsc-empty-state">暂无系统通知</div>`;
          return;
        }
        st.items.slice(0, 80).forEach((it) => {
          const row = document.createElement("div");
          row.className = "nsc-hub-row" + (!it.unread ? " is-read" : "");
          row.innerHTML = `
            <div class="nsc-hub-row-main">
              <div class="nsc-hub-row-title"><span class="${it.tag.cls}" style="margin-right:6px;">${it.tag.label}</span>${it.html}</div>
              <div class="nsc-hub-row-sub"><span>${escHtml(it.timeText || "")}</span></div>
            </div>
            ${it.unread ? `<span class="nsc-badge-dot" style="margin-top:0;"></span>` : `<span class="nsc-badge-read">已读</span>`}
          `;
          row.addEventListener("click", () => {
            if (it.unread && it.id) markSysNoticesRead([it.id]);
            if (it.firstPost) {
              closeHub();
              switchChannel("sys-notice", false);
              openPostInChat(it.firstPost);
            }
          });
          body.appendChild(row);
        });
      }
      return;
    }

    if (state.hubTab === "posts") {
      const st = state.hubData.posts;
      subbar.innerHTML = `<span style="font-size:12px;color:var(--nsc-muted);">已加载 ${st.items.length} 篇主题帖</span>`;
      const refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.className = "nsc-mini-btn";
      refBtn.textContent = st.loading ? "加载中..." : "刷新";
      refBtn.addEventListener("click", () => loadHubPosts(true));
      subbar.appendChild(refBtn);

      if (st.loading && st.items.length === 0) {
        body.innerHTML = `<div class="nsc-empty-state">正在加载我的主题帖...</div>`;
        return;
      }
      if (st.error && st.items.length === 0) {
        body.innerHTML = `<div class="nsc-empty-state" style="color:#ff3b30;">加载失败：${escHtml(st.error)}</div>`;
        return;
      }
      if (st.items.length === 0) {
        body.innerHTML = `<div class="nsc-empty-state">暂无主题帖记录</div>`;
        return;
      }
      st.items.forEach((it) => {
        const pid = String(it.post_id || it.id || "");
        const row = document.createElement("div");
        row.className = "nsc-hub-row";
        row.innerHTML = `
          <div class="nsc-hub-row-main">
            <div class="nsc-hub-row-title">${escHtml(it.title || `帖子 #${pid}`)}</div>
            <div class="nsc-hub-row-sub">
              ${it.category ? `<span>版块: ${escHtml(it.category)}</span>` : ""}
              ${it.created_at ? `<span>${escHtml(formatChineseTime("", it.created_at, ""))}</span>` : ""}
            </div>
          </div>
          <span class="nsc-badge-read">#${pid}</span>
        `;
        row.addEventListener("click", () => {
          closeHub();
          openPostInChat({ postId: pid, url: `/post-${pid}-1`, title: it.title || `帖子 #${pid}`, author: state.currentUser });
        });
        body.appendChild(row);
      });
      if (!st.noMore) appendWaterfallFooter(st, loadHubPosts, "主题帖");
      restoreHubScroll();
      return;
    }

    if (state.hubTab === "comments") {
      const st = state.hubData.comments;
      subbar.innerHTML = `<span style="font-size:12px;color:var(--nsc-muted);">已加载 ${st.items.length} 条历史回复</span>`;
      const refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.className = "nsc-mini-btn";
      refBtn.textContent = st.loading ? "加载中..." : "刷新";
      refBtn.addEventListener("click", () => loadHubComments(true));
      subbar.appendChild(refBtn);

      if (st.loading && st.items.length === 0) {
        body.innerHTML = `<div class="nsc-empty-state">正在加载我的评论...</div>`;
        return;
      }
      if (st.items.length === 0) {
        body.innerHTML = `<div class="nsc-empty-state">${st.error ? escHtml(st.error) : "暂无评论记录"}</div>`;
        return;
      }
      st.items.forEach((it) => {
        const pid = String(it.post_id || "");
        const floor = Number(it.floor_id) || 1;
        const pageIdx = Math.max(1, Math.ceil(floor / 10));
        const row = document.createElement("div");
        row.className = "nsc-hub-row";
        row.innerHTML = `
          <div class="nsc-hub-row-main">
            <div class="nsc-hub-row-title">${escHtml(it.title || `帖子 #${pid}`)}</div>
            <div class="nsc-hub-row-sub">
              <span>#${floor}楼</span>
              ${it.text ? `<span style="max-width:460px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(it.text)}</span>` : ""}
              ${it.created_at ? `<span>${escHtml(formatChineseTime("", it.created_at, ""))}</span>` : ""}
            </div>
          </div>
          <span class="nsc-badge-read">直达 #${floor}</span>
        `;
        row.addEventListener("click", () => {
          closeHub();
          openPostInChat({
            postId: pid,
            url: `/post-${pid}-${pageIdx}`,
            title: it.title || `帖子 #${pid}`,
            targetFloor: String(floor),
          });
        });
        body.appendChild(row);
      });
      if (!st.noMore) appendWaterfallFooter(st, loadHubComments, "评论");
      restoreHubScroll();
      return;
    }

    if (state.hubTab === "collections") {
      const st = state.hubData.collections;
      subbar.innerHTML = `<span style="font-size:12px;color:var(--nsc-muted);">已加载 ${st.items.length} 条收藏帖子</span>`;
      const refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.className = "nsc-mini-btn";
      refBtn.textContent = st.loading ? "加载中..." : "刷新";
      refBtn.addEventListener("click", () => loadHubCollections(true));
      subbar.appendChild(refBtn);

      if (st.loading && st.items.length === 0) {
        body.innerHTML = `<div class="nsc-empty-state">正在读取收藏夹...</div>`;
        return;
      }
      if (st.items.length === 0) {
        body.innerHTML = `<div class="nsc-empty-state">${st.error ? escHtml(st.error) : "暂无收藏帖子"}</div>`;
        return;
      }
      st.items.forEach((it) => {
        const pid = String(it.post_id || it.postId || it.id || "");
        const row = document.createElement("div");
        row.className = "nsc-hub-row";
        row.innerHTML = `
          <div class="nsc-hub-row-main">
            <div class="nsc-hub-row-title">${escHtml(it.title || `帖子 #${pid}`)}</div>
            <div class="nsc-hub-row-sub">
              ${it.author || it.member_name ? `<span>作者: ${escHtml(it.author || it.member_name)}</span>` : ""}
              ${it.category ? `<span>${escHtml(it.category)}</span>` : ""}
              ${it.created_at ? `<span>${escHtml(formatChineseTime("", it.created_at, ""))}</span>` : ""}
            </div>
          </div>
          <button type="button" class="nsc-mini-btn" data-uncol="${pid}">取消收藏</button>
        `;
        row.querySelector("[data-uncol]").addEventListener("click", async (e) => {
          e.stopPropagation();
          const btn = e.currentTarget;
          btn.disabled = true;
          btn.textContent = "...";
          const res = await togglePostCollection(pid);
          if (res.ok) {
            st.items = st.items.filter((x) => String(x.post_id || x.postId || x.id) !== pid);
            renderUserHub();
          } else {
            btn.disabled = false;
            btn.textContent = "取消收藏";
          }
        });
        row.addEventListener("click", () => {
          closeHub();
          openPostInChat({ postId: pid, url: `/post-${pid}-1`, title: it.title || `帖子 #${pid}` });
        });
        body.appendChild(row);
      });
      appendWaterfallFooter(st, loadHubCollections, "收藏");
      restoreHubScroll();
      return;
    }

    if (state.hubTab === "credit") {
      const st = state.hubData.credit;
      const creditSubView = state.registry.hubSubViews && state.registry.hubSubViews.credit;
      const isAnalytics = Boolean(creditSubView && state.hubCreditView === "analytics");

      if (creditSubView) {
        const seg = document.createElement("div");
        seg.className = "nsc-seg-tabs";
        [
          { id: "list", label: "明细流水" },
          { id: "analytics", label: "100页深度统计" },
        ].forEach((m) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "nsc-seg-btn" + ((isAnalytics ? "analytics" : "list") === m.id ? " is-active" : "");
          b.textContent = m.label;
          b.addEventListener("click", () => {
            state.hubCreditView = m.id;
            renderUserHub();
          });
          seg.appendChild(b);
        });
        subbar.appendChild(seg);
      }

      if (isAnalytics) {
        if (typeof creditSubView.render === "function") creditSubView.render(body, subbar);
        else if (typeof creditSubView === "function") creditSubView(body, subbar);
        restoreHubScroll();
        return;
      }

      const infoSpan = document.createElement("span");
      infoSpan.style.cssText = "font-size:12px;color:var(--nsc-muted);";
      infoSpan.textContent = `已加载 ${st.items.length} 条鸡腿明细（第 ${st.page || 1} 页）`;
      subbar.appendChild(infoSpan);

      const refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.className = "nsc-mini-btn";
      refBtn.textContent = st.loading ? "加载中..." : "刷新";
      refBtn.addEventListener("click", () => loadHubCredit(true));
      subbar.appendChild(refBtn);

      if (st.loading && st.items.length === 0) {
        body.innerHTML = `<div class="nsc-empty-state">正在读取鸡腿账簿...</div>`;
        return;
      }
      if (st.items.length === 0) {
        body.innerHTML = `<div class="nsc-empty-state">${st.error ? escHtml(st.error) : "暂无鸡腿记录"}</div>`;
        return;
      }
      let gain = 0;
      let spend = 0;
      let latestBal = "--";
      st.items.forEach((row, idx) => {
        const delta = Number(Array.isArray(row) ? row[0] : (row.amount ?? row.change ?? row.delta ?? 0));
        const bal = Array.isArray(row) ? row[1] : (row.balance ?? "--");
        if (idx === 0 && bal !== undefined) latestBal = String(bal);
        if (delta > 0) gain += delta;
        else if (delta < 0) spend += Math.abs(delta);
      });
      const kpi = document.createElement("div");
      kpi.className = "nsc-hub-kpi-grid";
      kpi.innerHTML = `
        <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">当前余额</div><div class="nsc-hub-kpi-val">${escHtml(latestBal)}</div></div>
        <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">已载收入</div><div class="nsc-hub-kpi-val" style="color:#16a34a;">+${gain}</div></div>
        <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">已载支出</div><div class="nsc-hub-kpi-val" style="color:#ff3b30;">-${spend}</div></div>
      `;
      body.appendChild(kpi);

      st.items.forEach((it) => {
        const delta = Number(Array.isArray(it) ? it[0] : (it.amount ?? it.change ?? it.delta ?? 0));
        const bal = Array.isArray(it) ? it[1] : (it.balance ?? "--");
        const reason = String(Array.isArray(it) ? it[2] : (it.reason ?? it.description ?? "明细")).trim();
        const tm = Array.isArray(it) ? it[3] : (it.created_at || "");
        const row = document.createElement("div");
        row.className = "nsc-hub-row";
        row.style.cursor = "default";
        row.innerHTML = `
          <div class="nsc-hub-row-main">
            <div class="nsc-hub-row-title">${escHtml(reason)}</div>
            <div class="nsc-hub-row-sub"><span>余额 ${escHtml(String(bal))}</span>${tm ? `<span>${escHtml(formatChineseTime("", tm, ""))}</span>` : ""}</div>
          </div>
          <span class="nsc-hub-delta ${delta >= 0 ? "pos" : "neg"}">${delta >= 0 ? `+${delta}` : delta}</span>
        `;
        body.appendChild(row);
      });
      appendWaterfallFooter(st, loadHubCredit, "账簿明细");
      restoreHubScroll();
      return;
    }

    if (state.hubTab === "stardust") {
      const st = state.hubData.stardust;
      const stardustSubView = state.registry.hubSubViews && state.registry.hubSubViews.stardust;
      const isAnalytics = Boolean(stardustSubView && state.hubStardustView === "analytics");

      const seg = document.createElement("div");
      seg.className = "nsc-seg-tabs";
      [
        { id: "recv", label: "我收到的" },
        { id: "sent", label: "我送出的" },
      ].forEach((m) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "nsc-seg-btn" + (!isAnalytics && st.mode === m.id ? " is-active" : "");
        b.textContent = m.label;
        b.addEventListener("click", () => {
          state.hubStardustView = "list";
          loadHubStardust(true, m.id);
        });
        seg.appendChild(b);
      });
      if (stardustSubView) {
        const ab = document.createElement("button");
        ab.type = "button";
        ab.className = "nsc-seg-btn" + (isAnalytics ? " is-active" : "");
        ab.textContent = "全量分析";
        ab.addEventListener("click", () => {
          state.hubStardustView = "analytics";
          renderUserHub();
        });
        seg.appendChild(ab);
      }
      subbar.appendChild(seg);

      if (isAnalytics) {
        if (typeof stardustSubView.render === "function") stardustSubView.render(body, subbar);
        else if (typeof stardustSubView === "function") stardustSubView(body, subbar);
        restoreHubScroll();
        return;
      }

      const refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.className = "nsc-mini-btn";
      refBtn.textContent = st.loading ? "加载中..." : "刷新";
      refBtn.addEventListener("click", () => loadHubStardust(true));
      subbar.appendChild(refBtn);

      if (st.loading && st.items.length === 0) {
        body.innerHTML = `<div class="nsc-empty-state">正在读取星辰记录...</div>`;
        return;
      }
      if (st.items.length === 0) {
        body.innerHTML = `<div class="nsc-empty-state">${st.error ? escHtml(st.error) : "暂无星辰明细"}</div>`;
        return;
      }
      st.items.forEach((it) => {
        const amt = Number(it.amount || it.stardust || it.count || 1);
        const isRecv = st.mode === "recv";
        const peerId = String(isRecv ? (it.peer_id || "") : (it.member_id || ""));
        const peerName = (isRecv ? it.peer_name : it.member_name) || (peerId ? `用户 #${peerId}` : "系统");
        const typeLbl = it.type === "upvote" ? "点赞互动" : it.type === "transfer" ? "星辰转账" : (it.type || "星辰变动");
        const row = document.createElement("div");
        row.className = "nsc-hub-row";
        row.innerHTML = `
          <div class="nsc-hub-row-main">
            <div class="nsc-hub-row-title">${escHtml(typeLbl)} · ${escHtml(peerName)}</div>
            <div class="nsc-hub-row-sub">
              ${it.post_id ? `<span>帖子 #${escHtml(String(it.post_id))}</span>` : ""}
              ${it.created_at ? `<span>${escHtml(formatChineseTime("", it.created_at, ""))}</span>` : ""}
            </div>
          </div>
          <span class="nsc-hub-delta ${isRecv ? "pos" : "neg"}">${isRecv ? `+${amt}` : `-${amt}`}</span>
        `;
        row.addEventListener("click", () => {
          if (it.post_id) {
            closeHub();
            openPostInChat({ postId: String(it.post_id), url: `/post-${it.post_id}-1`, title: `帖子 #${it.post_id}` });
          } else if (peerId) {
            openUserProfileModal({ uid: peerId, name: peerName });
          }
        });
        body.appendChild(row);
      });
      appendWaterfallFooter(st, loadHubStardust, "星辰记录");
      restoreHubScroll();
      return;
    }

    if (state.hubTab === "fans") {
      const subMode = state._hubFansMode || "fans";
      const store = subMode === "follow" ? state.followData : state.fansData;
      const seg = document.createElement("div");
      seg.className = "nsc-seg-tabs";
      [
        { id: "fans", label: `我的粉丝 (${state.fansData.items.length})` },
        { id: "follow", label: `我的关注 (${state.followData.items.length})` },
      ].forEach((m) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "nsc-seg-btn" + (subMode === m.id ? " is-active" : "");
        b.textContent = m.label;
        b.addEventListener("click", () => {
          state._hubFansMode = m.id;
          const tStore = m.id === "follow" ? state.followData : state.fansData;
          if (!tStore.loaded && !tStore.loading) fetchFansOrFollow(m.id).then(() => renderUserHubIfOpen());
          renderUserHub();
        });
        seg.appendChild(b);
      });

      const ops = document.createElement("div");
      ops.style.cssText = "display:flex;align-items:center;gap:6px;";

      const sortBtn = document.createElement("button");
      sortBtn.type = "button";
      sortBtn.className = "nsc-mini-btn" + (state._hubFansSortByActive ? " is-active" : "");
      sortBtn.title = "按最后发言时间排序";
      sortBtn.textContent = "排序";
      sortBtn.addEventListener("click", () => {
        state._hubFansSortByActive = !state._hubFansSortByActive;
        renderUserHub();
      });

      const batchBtn = document.createElement("button");
      batchBtn.type = "button";
      batchBtn.className = "nsc-mini-btn" + (state.batchQuery.running ? " is-active" : "");
      batchBtn.title = state.batchQuery.running ? "点击停止批量查询" : "一键查询当前列表全部用户的最后发言时间";
      batchBtn.textContent = state.batchQuery.running ? `${state.batchQuery.done}/${state.batchQuery.total}` : "查询";
      batchBtn.addEventListener("click", () => runBatchLastSpeakQuery(store.items));

      const refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.className = "nsc-mini-btn";
      refBtn.textContent = store.loading ? "同步中..." : "刷新";
      refBtn.addEventListener("click", () => fetchFansOrFollow(subMode).then(() => renderUserHubIfOpen()));

      ops.appendChild(sortBtn);
      ops.appendChild(batchBtn);
      ops.appendChild(refBtn);
      subbar.appendChild(seg);
      subbar.appendChild(ops);

      if (store.loading && store.items.length === 0) {
        body.innerHTML = `<div class="nsc-empty-state">正在同步列表...</div>`;
        return;
      }
      if (store.items.length === 0) {
        body.innerHTML = `<div class="nsc-empty-state">暂无记录</div>`;
        return;
      }
      let items = [...store.items];
      if (state._hubFansSortByActive) {
        items.sort((a, b) => {
          const ta = (a.uid && state.lastSpeakCache[a.uid] && state.lastSpeakCache[a.uid].timestampMs) || 0;
          const tb = (b.uid && state.lastSpeakCache[b.uid] && state.lastSpeakCache[b.uid].timestampMs) || 0;
          return tb - ta;
        });
      }
      const grid = document.createElement("div");
      grid.className = "nsc-hub-fan-grid";
      items.forEach((u) => {
        const cachedSpeak = u.uid ? state.lastSpeakCache[u.uid] : null;
        const card = document.createElement("div");
        card.className = "nsc-hub-row";
        card.style.marginBottom = "0";
        card.style.flexDirection = "column";
        card.style.alignItems = "stretch";
        card.style.gap = "6px";
        const avatarSrc = u.avatar || (u.uid ? `/avatar/${u.uid}.png` : "/static/image/favicon/android-chrome-192x192.png");
        card.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px;min-width:0;">
            <img src="${escHtml(avatarSrc)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex:0 0 36px;" />
            <div class="nsc-hub-row-main">
              <div class="nsc-hub-row-title">${escHtml(u.name)}</div>
              <div class="nsc-hub-row-sub">${cachedSpeak ? `发言: ${escHtml(cachedSpeak.timeStr)}` : `UID: ${escHtml(u.uid)}`}</div>
            </div>
            <button type="button" class="nsc-eye-btn" title="查询最后发言时间">${ICONS.eye}</button>
            <button type="button" class="nsc-icon-btn nsc-fan-pm" title="发私信">${ICONS.pm}</button>
          </div>
          ${cachedSpeak && cachedSpeak.title ? `<div class="nsc-last-speak-box" style="margin-left:0;" title="点击在聊天窗口打开该帖子"><div class="nsc-last-speak-title">${escHtml(cachedSpeak.title)}</div></div>` : ""}
        `;
        const eyeBtn = card.querySelector(".nsc-eye-btn");
        eyeBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!u.uid || eyeBtn.classList.contains("is-loading")) return;
          eyeBtn.classList.add("is-loading");
          delete state.lastSpeakCache[u.uid];
          await fetchUserLastSpeak(u.uid);
          renderUserHubIfOpen();
        });
        card.querySelector(".nsc-fan-pm").addEventListener("click", (e) => {
          e.stopPropagation();
          closeHub();
          switchChannel("pm", false);
          openPmConversation(u);
        });
        const speakBox = card.querySelector(".nsc-last-speak-box");
        if (speakBox && cachedSpeak && cachedSpeak.postUrl) {
          speakBox.addEventListener("click", (e) => {
            e.stopPropagation();
            closeHub();
            openPostInChat({
              postId: cachedSpeak.postId,
              url: cachedSpeak.postUrl,
              title: cachedSpeak.title,
              author: u.name,
              avatar: u.avatar,
              targetFloor: cachedSpeak.floorId ? String(cachedSpeak.floorId) : "",
            });
          });
        }
        card.addEventListener("click", () => openUserProfileModal(u));
        grid.appendChild(card);
      });
      body.appendChild(grid);
      return;
    }

    if (state.hubTab === "attendance") {
      const st = state.hubData.board;
      subbar.innerHTML = `<span style="font-size:12px;color:var(--nsc-muted);">每日签到（固定 5 鸡腿 / 随机试试手气）与今日排行榜</span>`;
      const refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.className = "nsc-mini-btn";
      refBtn.textContent = st.loading ? "同步中..." : "刷新榜单";
      refBtn.addEventListener("click", () => loadHubAttendanceBoard(true));
      subbar.appendChild(refBtn);

      const res = state.hubData.checkinResult;
      const todayStr = getBeijingDateStr();
      const signedToday = state.autoCheckinDate === todayStr;
      const ckCard = document.createElement("div");
      ckCard.className = "nsc-checkin-card";
      ckCard.innerHTML = `
        <div style="min-width:0;">
          <div style="font-size:13.5px;font-weight:700;color:var(--nsc-text);display:flex;align-items:center;gap:8px;">
            <span>每日签到领取鸡腿</span>
            <span class="nsc-badge-read" style="${signedToday ? "color:var(--nsc-green);border-color:var(--nsc-green);" : ""}">${signedToday ? "今日已签" : "今日待签"}</span>
          </div>
          <div style="font-size:11.5px;color:${res ? (res.ok ? "var(--nsc-green)" : "#ff9f0a") : "var(--nsc-muted)"};margin-top:3px;">
            ${res ? `${escHtml(res.mode)}：${escHtml(res.message)}${res.gain !== undefined ? ` (+${res.gain} 🍗)` : ""}${res.current !== undefined ? ` · 当前 ${res.current} 🍗` : ""}` : "固定签到稳定 +5 鸡腿；随机签到拼手气（1~10+ 鸡腿）"}
          </div>
        </div>
        <div class="nsc-checkin-actions">
          <button type="button" class="nsc-checkin-btn primary" id="nsc-ck-fixed" ${state.hubData.checkinLoading ? "disabled" : ""}>固定签到 (+5🍗)</button>
          <button type="button" class="nsc-checkin-btn" id="nsc-ck-random" ${state.hubData.checkinLoading ? "disabled" : ""}>随机签到 (拼手气)</button>
        </div>
        <div class="nsc-checkin-auto-row">
          <div style="display:flex;align-items:center;gap:8px;">
            <button type="button" class="nsc-switch ${state.autoCheckin ? "is-on" : ""}" id="nsc-auto-ck-toggle" aria-pressed="${state.autoCheckin ? "true" : "false"}" title="开启后每日首次打开论坛自动执行签到"><span class="nsc-switch-knob"></span></button>
            <span style="font-weight:600;">每日首次访问自动签到</span>
          </div>
          <div class="nsc-seg-tabs" id="nsc-auto-ck-mode">
            <button type="button" class="nsc-seg-btn ${state.autoCheckinMode !== "random" ? "is-active" : ""}" data-ckmode="fixed">自动固定 (+5🍗)</button>
            <button type="button" class="nsc-seg-btn ${state.autoCheckinMode === "random" ? "is-active" : ""}" data-ckmode="random">自动随机 (拼手气)</button>
          </div>
        </div>
      `;
      ckCard.querySelector("#nsc-ck-fixed").addEventListener("click", () => performAttendance(false));
      ckCard.querySelector("#nsc-ck-random").addEventListener("click", () => performAttendance(true));
      ckCard.querySelector("#nsc-auto-ck-toggle").addEventListener("click", () => {
        state.autoCheckin = !state.autoCheckin;
        localStorage.setItem(LS.AUTO_CHECKIN, state.autoCheckin ? "1" : "0");
        renderUserHub();
        if (state.autoCheckin) maybeRunAutoCheckin();
      });
      ckCard.querySelectorAll("[data-ckmode]").forEach((b) => {
        b.addEventListener("click", () => {
          state.autoCheckinMode = b.dataset.ckmode;
          localStorage.setItem(LS.AUTO_CHECKIN_MODE, state.autoCheckinMode);
          renderUserHub();
        });
      });
      body.appendChild(ckCard);

      if (st.loading && st.items.length === 0) {
        const tip = document.createElement("div");
        tip.className = "nsc-empty-state";
        tip.textContent = "正在加载今日签到排行榜...";
        body.appendChild(tip);
        return;
      }
      if (st.items.length === 0) {
        const tip = document.createElement("div");
        tip.className = "nsc-empty-state";
        tip.textContent = st.error ? `加载失败: ${st.error}` : "暂无今日签到排行数据";
        body.appendChild(tip);
        return;
      }
      st.items.forEach((it, idx) => {
        const rank = idx + 1;
        const rankCls = rank === 1 ? "rank1" : rank === 2 ? "rank2" : rank === 3 ? "rank3" : "";
        const uidStr = String(it.member_id || "");
        const row = document.createElement("div");
        row.className = "nsc-hub-row";
        row.innerHTML = `
          <span class="nsc-hot-rank ${rankCls}" style="margin-top:0;">${rank}</span>
          <img src="${uidStr ? `/avatar/${uidStr}.png` : "/static/image/favicon/android-chrome-192x192.png"}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;flex:0 0 30px;" />
          <div class="nsc-hub-row-main">
            <div class="nsc-hub-row-title">${escHtml(it.member_name || `用户 #${uidStr}`)}</div>
            <div class="nsc-hub-row-sub">${it.created_at ? `<span>${escHtml(formatChineseTime("", it.created_at, ""))}</span>` : ""}</div>
          </div>
          <span class="nsc-hub-delta pos">+${Number(it.gain) || 0} 🍗</span>
        `;
        row.addEventListener("click", () => {
          if (uidStr) openUserProfileModal({ uid: uidStr, name: it.member_name || `用户 #${uidStr}` });
        });
        body.appendChild(row);
      });
      appendWaterfallFooter(st, loadHubAttendanceBoard, "排行榜");
      restoreHubScroll();
      return;
    }

    if (state.hubTab === "setting" || state.hubTab === "lucky" || state.hubTab === "invite") {
      const titleMap = {
        setting: "账号设置（已套用 macOS 主题，含签名/README/安全/偏好）",
        lucky: "幸运抽奖（已套用 macOS 主题）",
        invite: "邀请好友与邀请码（已套用 macOS 主题）",
      };
      subbar.innerHTML = `<span style="font-size:12px;color:var(--nsc-muted);">${titleMap[state.hubTab]}</span>`;
      const reloadBtn = document.createElement("button");
      reloadBtn.type = "button";
      reloadBtn.className = "nsc-mini-btn";
      reloadBtn.textContent = "重新加载";
      reloadBtn.addEventListener("click", () => mountHubThemedIframe(body, nativeHrefMap[state.hubTab]));
      subbar.appendChild(reloadBtn);
      mountHubThemedIframe(body, nativeHrefMap[state.hubTab]);
      return;
    }

    if (state.hubTab === "progress") {
      const st = state.hubData.progress;
      subbar.innerHTML = `<span style="font-size:12px;color:var(--nsc-muted);">账号等级与每日互动额度</span>`;
      const refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.className = "nsc-mini-btn";
      refBtn.textContent = st.loading ? "读取中..." : "刷新";
      refBtn.addEventListener("click", () => loadHubProgress(true));
      subbar.appendChild(refBtn);

      if (st.loading && !st.data) {
        body.innerHTML = `<div class="nsc-empty-state">正在读取账号进度...</div>`;
        return;
      }
      const info = (st.data && st.data.info) || {};
      const quota = (st.data && st.data.quota) || {};
      const maxFree = Number(quota.maxFreeLike) || 0;
      const usedFree = Number(quota.freeLikeUsed) || 0;
      const pct = maxFree > 0 ? Math.min(100, Math.round((usedFree / maxFree) * 100)) : 0;
      body.innerHTML = `
        <div class="nsc-hub-kpi-grid">
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">当前等级</div><div class="nsc-hub-kpi-val">${escHtml(info.level || "--")}</div></div>
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">加入天数</div><div class="nsc-hub-kpi-val">${escHtml(info.days || "--")}</div></div>
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">鸡腿余额</div><div class="nsc-hub-kpi-val">${escHtml(info.legs || "--")}</div></div>
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">星辰余额</div><div class="nsc-hub-kpi-val">${escHtml(info.stars || "--")}</div></div>
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">主题帖</div><div class="nsc-hub-kpi-val">${escHtml(info.posts || "--")}</div></div>
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">评论数</div><div class="nsc-hub-kpi-val">${escHtml(info.comments || "--")}</div></div>
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">粉丝数</div><div class="nsc-hub-kpi-val">${escHtml(info.fans || "--")}</div></div>
        </div>
        ${maxFree > 0 ? `
          <div class="nsc-hub-kpi">
            <div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:600;">
              <span>今日免费投喂鸡腿额度</span>
              <span>${usedFree} / ${maxFree}</span>
            </div>
            <div style="height:8px;border-radius:999px;background:var(--nsc-hover);overflow:hidden;margin-top:8px;">
              <div style="height:100%;width:${pct}%;background:var(--nsc-accent);border-radius:999px;"></div>
            </div>
          </div>
        ` : ""}
      `;
      return;
    }

    if (customHubTab) {
      if (typeof customHubTab.renderSubbar === "function") customHubTab.renderSubbar(subbar, body);
      if (typeof customHubTab.renderBody === "function") customHubTab.renderBody(body, subbar);
      restoreHubScroll();
    }
  }

  function openUserHubModal(tab = "notif") {
    let bd = document.getElementById("nsc-hub-backdrop");
    if (!bd) {
      bd = document.createElement("div");
      bd.id = "nsc-hub-backdrop";
      bd.innerHTML = `<div class="nsc-hub-modal" role="dialog" aria-label="个人中心"></div>`;
      bd.addEventListener("click", (e) => {
        if (e.target === bd) bd.classList.remove("is-open");
      });
      document.body.appendChild(bd);
    }
    state.hubTab = tab;
    bd.classList.add("is-open");

    if (tab === "notif") {
      if ((Number(state.unreadCounts.reply) || 0) > 0) state.hubNotifSub = "reply-me";
      else if ((Number(state.unreadCounts.atMe) || 0) > 0) state.hubNotifSub = "at-me";
      else if ((Number(state.unreadCounts.message) || 0) > 0) state.hubNotifSub = "pm";
      else if ((Number(state.unreadCounts.sysNotice) || 0) > 0) state.hubNotifSub = "sys-notice";
      fetchUnreadCounts();
      if (!state.notifData["reply-me"].loaded) fetchNotifications("reply-me");
      if (!state.notifData["at-me"].loaded) fetchNotifications("at-me");
      if (!state.pmList.loaded) fetchPmList();
      if (!state.sysNoticeList.loaded) fetchSysNotices(false);
    } else if (tab === "posts" && state.hubData.posts.items.length === 0) {
      loadHubPosts(true);
    } else if (tab === "comments" && state.hubData.comments.items.length === 0) {
      loadHubComments(true);
    } else if (tab === "collections" && state.hubData.collections.items.length === 0) {
      loadHubCollections(true);
    } else if (tab === "credit" && state.hubData.credit.items.length === 0) {
      loadHubCredit(true);
    } else if (tab === "stardust" && state.hubData.stardust.items.length === 0) {
      loadHubStardust(true);
    } else if (tab === "fans") {
      if (!state.fansData.loaded && !state.fansData.loading) fetchFansOrFollow("fans").then(() => renderUserHubIfOpen());
      if (!state.followData.loaded && !state.followData.loading) fetchFansOrFollow("follow").then(() => renderUserHubIfOpen());
    } else if (tab === "attendance" && state.hubData.board.items.length === 0) {
      loadHubAttendanceBoard(true);
    } else if (tab === "progress") {
      loadHubProgress(false);
    } else {
      const customTab = (state.registry.hubTabs || []).find((t) => t.id === tab);
      if (customTab && typeof customTab.onOpen === "function") customTab.onOpen();
    }

    renderUserHub();
  }

  // ==========================================================================
  // Module: themes/mac-default.js
  // ==========================================================================
  // 内置默认 macOS 主题包（作为 ThemeRegistry 的标准范例，外部主题可放入 src/themes/*.js 自动发现）
  registerTheme({
    id: "light",
    name: "macOS 浅色",
    desc: "经典通透白玻璃与访达蓝点缀",
    baseScheme: "light",
    order: 10,
    tokens: {
      "--nsc-bg-nav": "rgba(242, 244, 247, 0.80)",
      "--nsc-bg-list": "rgba(251, 252, 254, 0.88)",
      "--nsc-bg-chat": "rgba(245, 246, 248, 0.84)",
      "--nsc-bg-right": "rgba(251, 252, 254, 0.88)",
      "--nsc-bg-card": "rgba(255, 255, 255, 0.96)",
      "--nsc-bubble-other": "#ffffff",
      "--nsc-bubble-self": "#007aff",
      "--nsc-bubble-op": "#fffdf6",
      "--nsc-text": "#1d1d1f",
      "--nsc-accent": "#007aff",
    },
  });

  registerTheme({
    id: "dusk",
    name: "黄昏护眼",
    desc: "暖羊皮纸色调，降低夜间阅读对比刺激",
    baseScheme: "light",
    order: 20,
    tokens: {
      "--nsc-bg-nav": "rgba(232, 221, 203, 0.92)",
      "--nsc-bg-list": "rgba(244, 236, 223, 0.96)",
      "--nsc-bg-chat": "rgba(239, 230, 214, 0.96)",
      "--nsc-bg-right": "rgba(244, 236, 223, 0.96)",
      "--nsc-bg-card": "#faf4e8",
      "--nsc-bubble-other": "#faf4e8",
      "--nsc-bubble-self": "#44689e",
      "--nsc-bubble-op": "#f9ebd0",
      "--nsc-text": "#3a3025",
      "--nsc-accent": "#b8621c",
    },
  });

  registerTheme({
    id: "dark",
    name: "macOS 暗黑",
    desc: "分层深灰毛玻璃，拒绝死黑高对比压迫感",
    baseScheme: "dark",
    order: 30,
    tokens: {
      "--nsc-bg-nav": "rgba(42, 45, 53, 0.88)",
      "--nsc-bg-list": "rgba(33, 36, 42, 0.94)",
      "--nsc-bg-chat": "rgba(27, 29, 35, 0.96)",
      "--nsc-bg-right": "rgba(36, 39, 46, 0.94)",
      "--nsc-bg-card": "#2f333d",
      "--nsc-bubble-other": "#2f333d",
      "--nsc-bubble-self": "#0a84ff",
      "--nsc-bubble-op": "#342e23",
      "--nsc-text": "#f2f2f7",
      "--nsc-accent": "#0a84ff",
    },
  });

  // ==========================================================================
  // Module: plugins/core-hub-analytics.js
  // ==========================================================================
  // 个人中心统计分析插件：鸡腿 100 页统计 / 全量星辰账本分析器
  (function initHubAnalyticsPlugin() {
    const CREDIT_MAX_PAGES = 100;
    const STARDUST_PAGE_SIZE = 50;
    const STARDUST_BATCH_CONCURRENCY = 5;

    // =========================================================================
    // 1. 鸡腿 100 页账簿统计
    // =========================================================================
    function extractCreditRows(json) {
      if (!json || json.success === false) return [];
      if (Array.isArray(json.data)) return json.data;
      if (json.data && Array.isArray(json.data.list)) return json.data.list;
      if (json.data && Array.isArray(json.data.records)) return json.data.records;
      if (Array.isArray(json.list)) return json.list;
      if (Array.isArray(json.records)) return json.records;
      return [];
    }

    function aggregateCreditStats(items) {
      const stats = {
        totalGain: 0,
        totalSpend: 0,
        net: 0,
        replyReward: 0,
        replyCount: 0,
        postReward: 0,
        postCount: 0,
        signReward: 0,
        signDays: 0,
        avgSign: "0",
        signAmounts: {},
        feedReceived: 0,
        feedSent: 0,
        otherGain: 0,
        feeders: {},
      };

      for (const item of items || []) {
        const val = Number(
          Array.isArray(item)
            ? item[0]
            : (item && (item.amount ?? item.change ?? item.delta))
        );
        const reason = String(
          Array.isArray(item)
            ? (item[2] ?? "")
            : ((item && (item.reason ?? item.description ?? item.note)) ?? "")
        ).trim();

        if (Number.isNaN(val)) continue;

        if (val > 0) {
          stats.totalGain += val;
          if (reason.includes("回帖")) {
            stats.replyReward += val;
            stats.replyCount += 1;
          } else if (reason.includes("发帖")) {
            stats.postReward += val;
            stats.postCount += 1;
          } else if (reason.includes("签到")) {
            stats.signReward += val;
            stats.signDays += 1;
            stats.signAmounts[val] = (stats.signAmounts[val] || 0) + 1;
          } else if (reason.includes("投喂")) {
            stats.feedReceived += val;
            const m = reason.match(/^被(.+?)投喂鸡腿$/);
            const sender = m ? m[1] : reason;
            stats.feeders[sender] = (stats.feeders[sender] || 0) + val;
          } else {
            stats.otherGain += val;
          }
        } else {
          stats.totalSpend += Math.abs(val);
          if (reason.includes("投喂")) {
            stats.feedSent += Math.abs(val);
          }
        }
      }

      stats.net = stats.totalGain - stats.totalSpend;
      stats.avgSign = stats.signDays > 0 ? (stats.signReward / stats.signDays).toFixed(2) : "0";
      return stats;
    }

    function findCachedUidByName(name) {
      if (!name || !state.userCache) return "";
      for (const [uid, info] of Object.entries(state.userCache)) {
        if (info && info.name === name) return String(uid);
      }
      return "";
    }

    const creditEngine = createFeedEngine({
      key: "hub-credit-100p",
      mutexGroup: "nodeseek-heavy-scan",
      delayMs: 150,
      async fetchPage({ page, signal }) {
        const resp = await fetch(`/api/account/credit/page-${page}`, {
          credentials: "include",
          signal,
        });
        if (!resp.ok) return { rows: [], hasMore: false };
        const json = await resp.json().catch(() => null);
        if (!json || json.success === false) return { rows: [], hasMore: false };
        const rows = extractCreditRows(json);
        if (!rows || rows.length === 0) return { rows: [], hasMore: false };
        return { rows, hasMore: rows.length >= 15 };
      },
      onUpdate() {
        if (state.hubTab === "credit" && state.hubCreditView === "analytics") {
          renderUserHubIfOpen();
        }
      },
    });

    function renderCreditAnalytics(body, subbar) {
      const snap = creditEngine.getState();
      const items = snap.items || [];
      const donePages = snap.progress ? snap.progress.done : snap.page;
      const totalPages = (snap.progress && snap.progress.total) || CREDIT_MAX_PAGES;
      const pct = totalPages > 0 ? Math.min(100, Math.round((donePages / totalPages) * 100)) : 0;

      const banner = document.createElement("div");
      banner.className = "nsc-ana-banner";

      const leftInfo = document.createElement("div");
      leftInfo.style.cssText = "flex:1;min-width:220px;";
      const statusTitle = snap.running
        ? `正在拉取第 ${donePages} / ${totalPages} 页...（已获取 ${items.length} 条明细）`
        : items.length > 0
          ? `已汇总 ${snap.page} 页 · 共 ${items.length} 条明细`
          : "点击右侧按钮拉取最多 100 页鸡腿账簿明细并生成统计报告";
      leftInfo.innerHTML = `
        <div style="font-size:13px;font-weight:700;color:var(--nsc-text);">${escHtml(statusTitle)}</div>
        ${snap.error ? `<div style="font-size:11.5px;color:#ff3b30;margin-top:4px;">${escHtml(snap.error)}</div>` : ""}
        ${snap.running ? `
          <div class="nsc-ana-progress-track">
            <div class="nsc-ana-progress-fill" style="width:${pct}%;"></div>
          </div>
        ` : ""}
      `;

      const actions = document.createElement("div");
      actions.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap;";
      if (snap.running) {
        const stopBtn = document.createElement("button");
        stopBtn.type = "button";
        stopBtn.className = "nsc-checkin-btn";
        stopBtn.style.color = "#ff3b30";
        stopBtn.textContent = "停止";
        stopBtn.addEventListener("click", () => creditEngine.abort());
        actions.appendChild(stopBtn);
      } else {
        const startBtn = document.createElement("button");
        startBtn.type = "button";
        startBtn.className = "nsc-checkin-btn primary";
        startBtn.textContent = items.length > 0 ? "重新统计" : "开始 100 页统计";
        startBtn.addEventListener("click", () => {
          creditEngine.runBatch({ maxPages: CREDIT_MAX_PAGES, delayMs: 150 });
        });
        actions.appendChild(startBtn);
      }

      banner.appendChild(leftInfo);
      banner.appendChild(actions);
      body.appendChild(banner);

      if (items.length === 0) {
        if (!snap.running) {
          const empty = document.createElement("div");
          empty.className = "nsc-empty-state";
          empty.textContent = "尚未拉取统计数据，点击「开始 100 页统计」即可在后台快速汇总。";
          body.appendChild(empty);
        }
        return;
      }

      const stats = aggregateCreditStats(items);
      const netColor = stats.net >= 0 ? "#16a34a" : "#ff3b30";
      const netText = stats.net >= 0 ? `+${stats.net}` : String(stats.net);

      const kpi = document.createElement("div");
      kpi.className = "nsc-hub-kpi-grid";
      kpi.innerHTML = `
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">总计获得鸡腿</div>
          <div class="nsc-hub-kpi-val" style="color:#16a34a;">+${stats.totalGain}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">总计消耗鸡腿</div>
          <div class="nsc-hub-kpi-val" style="color:#ff3b30;">-${stats.totalSpend}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">净增鸡腿</div>
          <div class="nsc-hub-kpi-val" style="color:${netColor};">${escHtml(netText)}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">回帖奖励 (${stats.replyCount}次)</div>
          <div class="nsc-hub-kpi-val">+${stats.replyReward}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">发帖奖励 (${stats.postCount}次)</div>
          <div class="nsc-hub-kpi-val">+${stats.postReward}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">签到累计 (${stats.signDays}天 · 均${escHtml(stats.avgSign)})</div>
          <div class="nsc-hub-kpi-val">+${stats.signReward}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">被投喂总计</div>
          <div class="nsc-hub-kpi-val" style="color:#16a34a;">+${stats.feedReceived}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">投喂支出总计</div>
          <div class="nsc-hub-kpi-val" style="color:#ff3b30;">-${stats.feedSent}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">其他收入</div>
          <div class="nsc-hub-kpi-val">+${stats.otherGain}</div>
        </div>
      `;
      body.appendChild(kpi);

      const split = document.createElement("div");
      split.className = "nsc-ana-split";

      // 左卡片：签到手气分布
      const signCard = document.createElement("div");
      signCard.className = "nsc-ana-card";
      const signEntries = Object.entries(stats.signAmounts).sort((a, b) => Number(b[0]) - Number(a[0]));
      const maxSignTimes = signEntries.reduce((mx, [, t]) => Math.max(mx, t), 1);

      let signBodyHtml = "";
      if (signEntries.length === 0) {
        signBodyHtml = `<div style="font-size:12px;color:var(--nsc-muted);padding:12px 0;">暂无签到记录</div>`;
      } else {
        signBodyHtml = signEntries.map(([legs, times]) => {
          const sharePct = stats.signDays > 0 ? ((times / stats.signDays) * 100).toFixed(1) : "0.0";
          const barPct = Math.max(4, Math.round((times / maxSignTimes) * 100));
          return `
            <div class="nsc-ana-bar-row">
              <div class="nsc-ana-bar-top">
                <span style="font-weight:600;color:var(--nsc-text);">+${escHtml(legs)} 鸡腿</span>
                <span style="color:var(--nsc-muted);font-variant-numeric:tabular-nums;">${times} 天 (${sharePct}%)</span>
              </div>
              <div class="nsc-ana-bar-track">
                <div class="nsc-ana-bar-fill" style="width:${barPct}%;"></div>
              </div>
            </div>
          `;
        }).join("");
      }

      signCard.innerHTML = `
        <div class="nsc-ana-card-title">
          <span>🎲 签到手气分布</span>
          <span style="font-size:11.5px;font-weight:500;color:var(--nsc-muted);">共 ${stats.signDays} 天 · 均 ${escHtml(stats.avgSign)}/天</span>
        </div>
        <div>${signBodyHtml}</div>
      `;

      // 右卡片：投喂大佬排行榜
      const feederCard = document.createElement("div");
      feederCard.className = "nsc-ana-card";
      const sortedFeeders = Object.entries(stats.feeders).sort((a, b) => b[1] - a[1]);
      const topFeeders = sortedFeeders.slice(0, 20);

      feederCard.innerHTML = `
        <div class="nsc-ana-card-title">
          <span>🏆 投喂大佬排行榜</span>
          <span style="font-size:11.5px;font-weight:500;color:var(--nsc-muted);">共 ${sortedFeeders.length} 位${sortedFeeders.length > 20 ? " (Top 20)" : ""}</span>
        </div>
        <div class="nsc-ana-feeder-list"></div>
      `;

      const feederListEl = feederCard.querySelector(".nsc-ana-feeder-list");
      if (topFeeders.length === 0) {
        feederListEl.innerHTML = `<div style="font-size:12px;color:var(--nsc-muted);padding:12px 0;">暂无投喂收入记录</div>`;
      } else {
        topFeeders.forEach(([user, count], idx) => {
          const rank = idx + 1;
          const rankLabel = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
          const row = document.createElement("div");
          row.className = "nsc-hub-row";
          row.style.marginBottom = "0";
          row.style.padding = "7px 10px";
          row.title = "点击查看资料或复制用户名";
          row.innerHTML = `
            <span style="width:28px;text-align:center;font-weight:700;font-size:12px;flex:0 0 28px;">${rankLabel}</span>
            <div class="nsc-hub-row-main">
              <div class="nsc-hub-row-title">${escHtml(user)}</div>
            </div>
            <span class="nsc-hub-delta pos" data-feeder-amt>+${count} 🍗</span>
          `;
          row.addEventListener("click", async () => {
            const cachedUid = findCachedUidByName(user);
            if (cachedUid && typeof openUserProfileModal === "function") {
              openUserProfileModal({ uid: cachedUid, name: user });
              return;
            }
            const ok = await copyTextToClipboard(user);
            if (ok) {
              const badge = row.querySelector("[data-feeder-amt]");
              if (badge) {
                const orig = badge.textContent;
                badge.textContent = "已复制用户名";
                setTimeout(() => {
                  badge.textContent = orig;
                }, 1400);
              }
            }
          });
          feederListEl.appendChild(row);
        });
      }

      split.appendChild(signCard);
      split.appendChild(feederCard);
      body.appendChild(split);

      requestAnimationFrame(() => {
        const h = signCard.clientHeight;
        if (h > 180) {
          feederListEl.style.maxHeight = `${Math.max(240, h - 54)}px`;
        }
      });
    }

    registerHubSubView("credit", {
      render(body, subbar) {
        renderCreditAnalytics(body, subbar);
      },
    });

    // =========================================================================
    // 2. 全量星辰账本分析器（收到/送出点赞 + 转账收支 + 全列排序 + 瀑布流 + 排行榜）
    // =========================================================================
    const stardustUi = {
      filter: "all",
      search: "",
      sortKey: "time",
      sortDir: "desc",
      visibleCount: STARDUST_PAGE_SIZE,
      rankCat: "upvote_in",
      showRank: true,
      resolveSeq: 0,
      failedUids: new Set(),
      myUid: null,
      lastTableHost: null,
      lastRecords: [],
    };

    function formatExactTime(val) {
      if (!val) return "-";
      const d = typeof val === "number"
        ? new Date(val > 1e11 ? val : val * 1000)
        : new Date(val);
      if (Number.isNaN(d.getTime())) return String(val);

      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    function extractAmount(r) {
      const priorityKeys = [
        "diff", "amount", "stardust", "stardusts", "count", "delta", "value", "points",
        "num", "quantity", "change", "trade_stardust", "credit", "score", "gain",
      ];
      for (const k of priorityKeys) {
        if (r[k] !== undefined && r[k] !== null && r[k] !== "") {
          const num = parseFloat(String(r[k]).replace(/[^\d.-]/g, ""));
          if (!Number.isNaN(num) && num !== 0) return num;
        }
      }

      const ignoreKeys = new Set([
        "id", "_id", "member_id", "peer_id", "ref_id", "post_id", "comment_id",
        "created_at", "updated_at", "timestamp", "time", "status", "code",
        "floor", "balance", "remain", "type", "_querySide",
      ]);
      for (const [k, v] of Object.entries(r)) {
        if (!ignoreKeys.has(k)) {
          if (typeof v === "number" && v !== 0) return v;
          if (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim())) {
            const parsed = parseFloat(v.trim());
            if (!Number.isNaN(parsed) && parsed !== 0) return parsed;
          }
        }
      }
      return 0;
    }

    function extractBalance(r) {
      const keys = [
        "balance", "current_balance", "remain", "remain_stardust", "after_balance",
        "user_balance", "stardust_balance", "current_stardust", "after", "current",
        "user_stardust", "total", "cur_balance", "post_balance", "remained", "available",
        "total_stardust",
      ];
      for (const k of keys) {
        if (r[k] !== undefined && r[k] !== null && r[k] !== "") {
          const num = parseFloat(String(r[k]).replace(/[^\d.-]/g, ""));
          if (!Number.isNaN(num) && num >= 0) return num;
        }
      }
      return null;
    }

    function stardustRecordKey(r) {
      const side = r._querySide || "recv";
      const rawCreatedAt = typeof r.created_at === "number"
        ? (r.created_at > 1e11 ? r.created_at : r.created_at * 1000)
        : new Date(r.created_at).getTime();
      const base = r.id || `${rawCreatedAt || 0}_${r.peer_id || ""}_${r.member_id || ""}`;
      return `${side}:${base}`;
    }

    function normalizeStardustRecords(rawRows, selfUid) {
      const uidNum = Number(selfUid) || 0;
      const list = [];
      for (const r of rawRows || []) {
        const rawCreatedAt = typeof r.created_at === "number"
          ? (r.created_at > 1e11 ? r.created_at : r.created_at * 1000)
          : new Date(r.created_at).getTime();
        const mId = r.member_id ? parseInt(r.member_id, 10) : 0;
        const pId = r.peer_id ? parseInt(r.peer_id, 10) : 0;
        const rawType = String(r.type || "").toLowerCase();
        const refId = parseInt(r.ref_id || r.refId || 0, 10);
        const extractedNum = extractAmount(r);
        const isUpvote = (refId === 10) || rawType.includes("upvote") || rawType.includes("like") || Boolean(r.comment_id);

        if (r._querySide === "sent") {
          // peer_id=uid 查询仅提取「送出点赞」，转账支出已由 member_id=uid 完整覆盖以防重复计账
          if (!isUpvote) continue;
          const targetUid = mId && mId !== uidNum ? mId : (pId && pId !== uidNum ? pId : 0);
          list.push({
            id: stardustRecordKey(r),
            rawCreatedAt: rawCreatedAt || 0,
            amount: Math.abs(extractedNum || 1),
            targetUid: targetUid ? String(targetUid) : "",
            memo: r.memo || r.reason || r.description || r.note || "",
            balance: null,
            category: "upvote_out",
            postId: r.post_id ? String(r.post_id) : "",
            refId: refId > 0 ? String(refId) : "",
            time: formatExactTime(r.created_at),
          });
          continue;
        }

        let category = "transfer_out";
        let finalAmount = 0;

        if (isUpvote) {
          category = "upvote_in";
          finalAmount = extractedNum > 0 ? extractedNum : 1;
        } else {
          if (extractedNum > 0 || rawType.includes("in") || rawType.includes("receive") || (uidNum > 0 && mId !== uidNum && mId > 0)) {
            category = "transfer_in";
            finalAmount = Math.abs(extractedNum || 1);
          } else if (extractedNum < 0 || rawType.includes("out") || rawType.includes("send") || rawType.includes("pay")) {
            category = "transfer_out";
            finalAmount = -Math.abs(extractedNum || 1);
          } else {
            category = (mId === uidNum && pId) ? "transfer_out" : "transfer_in";
            finalAmount = category === "transfer_out" ? -1 : 1;
          }
        }

        const targetUid = (pId && pId !== uidNum)
          ? pId
          : ((mId && mId !== uidNum) ? mId : (pId || mId || null));

        list.push({
          id: stardustRecordKey(r),
          rawCreatedAt: rawCreatedAt || 0,
          amount: finalAmount,
          targetUid: targetUid ? String(targetUid) : "",
          memo: r.memo || r.reason || r.description || r.note || "",
          balance: extractBalance(r),
          category,
          postId: r.post_id ? String(r.post_id) : "",
          refId: refId > 0 ? String(refId) : "",
          time: formatExactTime(r.created_at),
        });
      }

      list.sort((a, b) => b.rawCreatedAt - a.rawCreatedAt);
      return list;
    }

    function getResolvedStardustUserName(uid) {
      const key = String(uid || "");
      if (!key) return "";
      const cached = state.userCache && state.userCache[key];
      if (cached && cached.name && cached.name !== "Seeker") {
        return cached.name;
      }
      return "";
    }

    function getDisplayUserHandle(uid) {
      const name = getResolvedStardustUserName(uid);
      return name ? `@${name}` : `@UID:${uid}`;
    }

    function getBalanceFallback() {
      const uid = stardustUi.myUid || state.currentUserId;
      if (uid && state.userCache && state.userCache[String(uid)]) {
        const parsed = Number(state.userCache[String(uid)].stars);
        if (!Number.isNaN(parsed) && parsed > 0) return parsed;
      }
      try {
        const card = document.querySelector("#nsk-right-panel-container .user-card, .nsc-right-user .user-card");
        const text = card ? card.innerText : "";
        const m = text.match(/星辰\s*[:：]?\s*([0-9]+)/);
        if (m && m[1]) {
          const num = parseInt(m[1], 10);
          if (!Number.isNaN(num) && num > 0) return num;
        }
      } catch (_) {}
      return 0;
    }

    function computeStardustSummary(records) {
      let totalIncome = 0;
      let totalExpense = 0;
      let upvoteInCount = 0;
      let upvoteInStardust = 0;
      let upvoteOutCount = 0;
      let transferOutCount = 0;
      let transferOutStardust = 0;
      let transferInCount = 0;
      let transferInStardust = 0;

      for (const item of records) {
        if (item.category === "upvote_in") {
          upvoteInCount += 1;
          upvoteInStardust += item.amount;
          totalIncome += item.amount;
        } else if (item.category === "upvote_out") {
          upvoteOutCount += 1;
        } else if (item.category === "transfer_in") {
          transferInCount += 1;
          transferInStardust += item.amount;
          totalIncome += item.amount;
        } else if (item.category === "transfer_out") {
          const absVal = Math.abs(item.amount);
          transferOutCount += 1;
          transferOutStardust += absVal;
          totalExpense += absVal;
        }
      }

      const netCalculated = totalIncome - totalExpense;
      const displayBal = netCalculated > 0 ? netCalculated : (getBalanceFallback() || netCalculated);

      return {
        displayBal,
        totalIncome,
        totalExpense,
        upvoteInCount,
        upvoteInStardust,
        upvoteOutCount,
        transferOutCount,
        transferOutStardust,
        transferInCount,
        transferInStardust,
      };
    }

    async function ensureStardustUid(signal) {
      detectCurrentUser();
      if (state.currentUserId) {
        stardustUi.myUid = Number(state.currentUserId);
        return stardustUi.myUid;
      }
      if (stardustUi.myUid) return stardustUi.myUid;

      const resp = await fetch("/api/account/getInfo", { credentials: "include", signal });
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        if (data && data.success && data.detail) {
          const parsed = parseInt(data.detail.member_id || data.detail.id || data.detail.uid, 10);
          if (parsed) {
            stardustUi.myUid = parsed;
            state.currentUserId = parsed;
            if (data.detail.member_name) state.currentUser = data.detail.member_name;
            return parsed;
          }
        }
      }
      throw new Error("未能识别当前登录 UID，请先登录或刷新页面");
    }

    const stardustEngine = createFeedEngine({
      key: "hub-stardust-full",
      mutexGroup: "nodeseek-heavy-scan",
      delayMs: 300,
      keyOf: stardustRecordKey,
      async fetchPage({ cursor, signal }) {
        const uid = await ensureStardustUid(signal);
        let side = "recv";
        let beforeId = "";
        if (typeof cursor === "string" && cursor.includes(":")) {
          const parts = cursor.split(":");
          side = parts[0] === "sent" ? "sent" : "recv";
          beforeId = parts[1] || "";
        }

        const paramKey = side === "sent" ? "peer_id" : "member_id";
        let url = `/api/stardust/list?count=1000&${paramKey}=${encodeURIComponent(String(uid))}`;
        if (beforeId) url += `&before_id=${encodeURIComponent(beforeId)}`;

        const resp = await fetch(url, { credentials: "include", signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json().catch(() => null);
        const rows = (data && data.success !== false && Array.isArray(data.records))
          ? data.records.map((r) => ({ ...r, _querySide: side }))
          : [];

        if (side === "recv") {
          if (data && data.exist_more && data.cursor && rows.length > 0) {
            return { rows, nextCursor: `recv:${data.cursor}`, hasMore: true };
          }
          // 第一阶段（收到/账户主流水）结束后无缝切换第二阶段（peer_id 送出点赞）
          return { rows, nextCursor: "sent:", hasMore: true };
        }

        if (data && data.exist_more && data.cursor && rows.length > 0) {
          return { rows, nextCursor: `sent:${data.cursor}`, hasMore: true };
        }
        return { rows, nextCursor: null, hasMore: false };
      },
      onUpdate() {
        if (state.hubTab === "stardust" && state.hubStardustView === "analytics") {
          renderUserHubIfOpen();
        }
      },
    });

    async function resolveVisibleStardustUids(uids) {
      const seq = ++stardustUi.resolveSeq;
      const missing = Array.from(new Set(uids.filter((id) => (
        id && !getResolvedStardustUserName(id) && !stardustUi.failedUids.has(String(id))
      ))));
      if (missing.length === 0) return;

      for (const uid of missing) {
        if (seq !== stardustUi.resolveSeq) return;
        if (state.hubTab !== "stardust" || state.hubStardustView !== "analytics") return;
        const bd = document.getElementById("nsc-hub-backdrop");
        if (!bd || !bd.classList.contains("is-open")) return;

        await fetchUserProfile(String(uid), "");
        if (seq !== stardustUi.resolveSeq) return;
        if (state.hubTab !== "stardust" || state.hubStardustView !== "analytics") return;

        const name = getResolvedStardustUserName(uid);
        if (!name) {
          stardustUi.failedUids.add(String(uid));
        } else {
          document.querySelectorAll(`[data-nsc-sd-uid="${CSS.escape(String(uid))}"]`).forEach((el) => {
            el.textContent = `@${name}`;
          });
        }
        await new Promise((r) => setTimeout(r, 80));
      }
    }

    function buildStardustRankList(records, category) {
      const map = new Map();
      for (const item of records) {
        if (item.category !== category || !item.targetUid) continue;
        const cur = map.get(item.targetUid) || {
          uid: item.targetUid,
          count: 0,
          totalAmount: 0,
          latestTs: 0,
        };
        cur.count += 1;
        cur.totalAmount += Math.abs(item.amount);
        if (item.rawCreatedAt > cur.latestTs) cur.latestTs = item.rawCreatedAt;
        map.set(item.targetUid, cur);
      }
      return Array.from(map.values()).sort(
        (a, b) => b.totalAmount - a.totalAmount || b.count - a.count || b.latestTs - a.latestTs
      );
    }

    function buildMarkdownTopRankTable(rankList, category, limit = 20) {
      if (!rankList || rankList.length === 0) return "*(暂无排行记录)*\n\n";
      const totalAmt = rankList.reduce((s, u) => s + u.totalAmount, 0);
      const isTransfer = category === "transfer_in" || category === "transfer_out";
      const actionHdr = isTransfer ? "转账笔数" : "点赞次数";
      const top = rankList.slice(0, limit);

      let md = `| 排名 | 用户 | UID | ${actionHdr} | 累计星辰 | 占比 |\n`;
      md += "| :--- | :--- | :--- | :--- | :--- | :--- |\n";
      top.forEach((u, idx) => {
        const rank = idx + 1;
        const rankLabel = rank === 1 ? "🥇 1" : rank === 2 ? "🥈 2" : rank === 3 ? "🥉 3" : String(rank);
        const handle = getDisplayUserHandle(u.uid);
        const pct = totalAmt > 0 ? `${((u.totalAmount / totalAmt) * 100).toFixed(1)}%` : "0%";
        md += `| ${rankLabel} | [${handle}](https://www.nodeseek.com/space/${u.uid}#/general) | ${u.uid} | ${u.count} 次 | **${u.totalAmount}** | ${pct} |\n`;
      });
      md += `\n`;
      return md;
    }

    async function exportStardustSummaryMarkdown(records, btnEl) {
      if (!records || records.length === 0) return;
      const origText = btnEl ? btnEl.textContent : "📋 复制统计排行";

      const rankUpIn = buildStardustRankList(records, "upvote_in");
      const rankUpOut = buildStardustRankList(records, "upvote_out");
      const rankTrIn = buildStardustRankList(records, "transfer_in");
      const rankTrOut = buildStardustRankList(records, "transfer_out");

      const topUids = Array.from(new Set([
        ...rankUpIn.slice(0, 20).map((u) => u.uid),
        ...rankUpOut.slice(0, 20).map((u) => u.uid),
        ...rankTrIn.slice(0, 20).map((u) => u.uid),
        ...rankTrOut.slice(0, 20).map((u) => u.uid),
      ])).filter((uid) => uid && !getResolvedStardustUserName(uid));

      if (topUids.length > 0) {
        if (btnEl) btnEl.disabled = true;
        let done = 0;
        for (let i = 0; i < topUids.length; i += STARDUST_BATCH_CONCURRENCY) {
          const batch = topUids.slice(i, i + STARDUST_BATCH_CONCURRENCY);
          await Promise.all(batch.map((uid) => fetchUserProfile(String(uid), "")));
          done += batch.length;
          if (btnEl) btnEl.textContent = `⏳ 补全榜上昵称 (${done}/${topUids.length})...`;
          await new Promise((r) => setTimeout(r, 60));
        }
        if (btnEl) btnEl.disabled = false;
      }

      const summary = computeStardustSummary(records);
      let fullMd = ":::: tabs\n";

      fullMd += "::: tab-item 📊 统计总览\n";
      fullMd += "| 统计维度 | 笔数 / 次数 | 合计星辰 |\n";
      fullMd += "| :--- | :--- | :--- |\n";
      fullMd += `| 当前核算余额 | - | **${summary.displayBal}** |\n`;
      fullMd += `| 收到点赞（他人赠予） | ${summary.upvoteInCount} 次 | **+${summary.upvoteInStardust}** |\n`;
      fullMd += `| 送出点赞（赞赏他人） | ${summary.upvoteOutCount} 次 | - |\n`;
      fullMd += `| 收到转账 | ${summary.transferInCount} 笔 | **+${summary.transferInStardust}** |\n`;
      fullMd += `| 送出转账 | ${summary.transferOutCount} 笔 | **-${summary.transferOutStardust}** |\n`;
      fullMd += `| 累计净收支 | ${summary.upvoteInCount + summary.transferInCount + summary.transferOutCount} 笔 | +${summary.totalIncome} / -${summary.totalExpense} |\n\n`;
      fullMd += ":::\n";

      fullMd += `::: tab-item 💖 获赞排行 Top 20\n`;
      fullMd += `共 ${rankUpIn.length} 位社区好友为你点赞（合计 +${summary.upvoteInStardust} 星辰）\n\n`;
      fullMd += buildMarkdownTopRankTable(rankUpIn, "upvote_in", 20);
      fullMd += ":::\n";

      fullMd += `::: tab-item 👍 送赞排行 Top 20\n`;
      fullMd += `共为 ${rankUpOut.length} 位用户送出点赞（合计 ${summary.upvoteOutCount} 次）\n\n`;
      fullMd += buildMarkdownTopRankTable(rankUpOut, "upvote_out", 20);
      fullMd += ":::\n";

      fullMd += `::: tab-item 💰 收到转账 Top 20\n`;
      fullMd += `共 ${rankTrIn.length} 位用户向你转账（合计 +${summary.transferInStardust} 星辰）\n\n`;
      fullMd += buildMarkdownTopRankTable(rankTrIn, "transfer_in", 20);
      fullMd += ":::\n";

      fullMd += `::: tab-item 💸 送出转账 Top 20\n`;
      fullMd += `共向 ${rankTrOut.length} 位用户转账（合计 -${summary.transferOutStardust} 星辰）\n\n`;
      fullMd += buildMarkdownTopRankTable(rankTrOut, "transfer_out", 20);
      fullMd += ":::\n";

      fullMd += "::::\n";

      const ok = await copyTextToClipboard(fullMd);
      if (btnEl) {
        btnEl.textContent = ok ? "✅ 已复制统计排行" : "❌ 复制失败";
        setTimeout(() => {
          btnEl.textContent = origText;
        }, 2400);
      }

      document.querySelectorAll("[data-nsc-sd-uid]").forEach((el) => {
        const u = el.getAttribute("data-nsc-sd-uid");
        const name = getResolvedStardustUserName(u);
        if (name) el.textContent = `@${name}`;
      });
    }

    function sortStardustList(list) {
      const dir = stardustUi.sortDir === "asc" ? 1 : -1;
      const key = stardustUi.sortKey || "time";
      return [...list].sort((a, b) => {
        if (key === "time") return (a.rawCreatedAt - b.rawCreatedAt) * dir;
        if (key === "category") return a.category.localeCompare(b.category) * dir || (b.rawCreatedAt - a.rawCreatedAt);
        if (key === "amount") return (a.amount - b.amount) * dir || (b.rawCreatedAt - a.rawCreatedAt);
        if (key === "uid") return ((Number(a.targetUid) || 0) - (Number(b.targetUid) || 0)) * dir || (b.rawCreatedAt - a.rawCreatedAt);
        if (key === "detail") {
          const da = `${getDisplayUserHandle(a.targetUid)} ${a.memo || ""}`;
          const db = `${getDisplayUserHandle(b.targetUid)} ${b.memo || ""}`;
          return da.localeCompare(db, "zh-CN") * dir || (b.rawCreatedAt - a.rawCreatedAt);
        }
        return (b.rawCreatedAt - a.rawCreatedAt);
      });
    }

    function renderStardustTableSection(hostEl, records) {
      stardustUi.lastTableHost = hostEl;
      stardustUi.lastRecords = records;
      const kw = stardustUi.search.trim().toLowerCase();
      const filtered = sortStardustList(
        records.filter((item) => {
          if (stardustUi.filter !== "all" && item.category !== stardustUi.filter) return false;
          if (kw) {
            const uidStr = String(item.targetUid || "");
            const nameStr = getResolvedStardustUserName(item.targetUid).toLowerCase();
            const memoStr = String(item.memo || "").toLowerCase();
            const timeStr = String(item.time || "").toLowerCase();
            return (
              uidStr.includes(kw) ||
              nameStr.includes(kw) ||
              memoStr.includes(kw) ||
              timeStr.includes(kw)
            );
          }
          return true;
        })
      );

      hostEl.innerHTML = "";

      if (filtered.length === 0) {
        hostEl.innerHTML = `<div class="nsc-empty-state">未找到符合条件的星辰流水记录</div>`;
        return;
      }

      const sliceCount = Math.min(filtered.length, stardustUi.visibleCount);
      const visibleRecords = filtered.slice(0, sliceCount);
      const selfUid = stardustUi.myUid || state.currentUserId || "";

      const wrap = document.createElement("div");
      wrap.className = "nsc-ana-table-wrap";

      const sortInd = (key) => {
        if (stardustUi.sortKey !== key) return `<span class="nsc-ana-sort-ind">↕</span>`;
        return `<span class="nsc-ana-sort-ind">${stardustUi.sortDir === "asc" ? "↑" : "↓"}</span>`;
      };
      const sortCls = (key) => "nsc-ana-sort-th" + (stardustUi.sortKey === key ? " is-sorted" : "");

      const visibleUids = [];
      const rowsHtml = visibleRecords.map((item) => {
        let amountHtml = `<span>0</span>`;
        if (item.category === "upvote_out") {
          amountHtml = `<span style="color:var(--nsc-muted);font-weight:600;">👍 赞</span>`;
        } else if (item.amount > 0) {
          amountHtml = `<span style="color:#16a34a;font-weight:700;">+${item.amount}</span>`;
        } else if (item.amount < 0) {
          amountHtml = `<span style="color:#ff3b30;font-weight:700;">${item.amount}</span>`;
        }

        let badgeHtml = `<span class="nsc-ana-badge out">💸 送出转账</span>`;
        if (item.category === "upvote_in") {
          badgeHtml = `<span class="nsc-ana-badge in">💖 收到点赞</span>`;
        } else if (item.category === "upvote_out") {
          badgeHtml = `<span class="nsc-ana-badge star">👍 送出点赞</span>`;
        } else if (item.category === "transfer_in") {
          badgeHtml = `<span class="nsc-ana-badge star">💰 收到转账</span>`;
        }

        let uidCellHtml = "-";
        const detailParts = [];
        if (item.targetUid) {
          visibleUids.push(item.targetUid);
          const handle = getDisplayUserHandle(item.targetUid);
          const spaceUrl = `https://www.nodeseek.com/space/${encodeURIComponent(item.targetUid)}#/general`;
          uidCellHtml = `<a href="${spaceUrl}" target="_blank" rel="noopener noreferrer" data-sd-profile="${escHtml(item.targetUid)}" style="color:var(--nsc-accent);text-decoration:none;font-family:ui-monospace,monospace;">UID: ${escHtml(item.targetUid)}</a>`;
          detailParts.push(`<a href="${spaceUrl}" target="_blank" rel="noopener noreferrer" data-sd-profile="${escHtml(item.targetUid)}" data-nsc-sd-uid="${escHtml(item.targetUid)}" style="color:var(--nsc-accent);font-weight:600;text-decoration:none;">${escHtml(handle)}</a>`);
        }
        if (item.balance !== null && item.balance !== undefined) {
          detailParts.push(`<span class="nsc-badge-read">余额: ${escHtml(String(item.balance))}</span>`);
        }
        if (item.postId) {
          detailParts.push(`<button type="button" class="nsc-mini-btn" data-sd-post="${escHtml(item.postId)}" style="padding:0 6px;font-size:10.5px;">帖子 #${escHtml(item.postId)}</button>`);
        } else if (selfUid && item.targetUid && (item.category === "transfer_in" || item.category === "transfer_out")) {
          const ledgerUrl = `/stardust/list?member_id=${encodeURIComponent(String(selfUid))}&peer_id=${encodeURIComponent(item.targetUid)}${item.refId ? `&ref_id=${encodeURIComponent(item.refId)}` : ""}`;
          detailParts.push(`<a class="nsc-mini-btn" href="${ledgerUrl}" target="_blank" rel="noopener noreferrer" style="padding:0 6px;font-size:10.5px;text-decoration:none;">流水 ↗</a>`);
        }
        if (item.memo) {
          detailParts.push(`<span style="color:var(--nsc-text);">📝 ${escHtml(item.memo)}</span>`);
        }

        return `
          <tr>
            <td style="font-family:ui-monospace,monospace;font-size:11.5px;color:var(--nsc-muted);white-space:nowrap;">${escHtml(item.time)}</td>
            <td>${badgeHtml}</td>
            <td>${amountHtml}</td>
            <td>${uidCellHtml}</td>
            <td style="line-height:1.5;">${detailParts.length > 0 ? detailParts.join(" ") : "-"}</td>
          </tr>
        `;
      }).join("");

      wrap.innerHTML = `
        <div style="overflow-x:auto;">
          <table class="nsc-ana-table">
            <thead>
              <tr>
                <th class="${sortCls("time")}" data-sd-sort="time" style="width:155px;" title="按时间排序">时间${sortInd("time")}</th>
                <th class="${sortCls("category")}" data-sd-sort="category" style="width:105px;" title="按类型排序">类型${sortInd("category")}</th>
                <th class="${sortCls("amount")}" data-sd-sort="amount" style="width:78px;" title="按数额排序">数额${sortInd("amount")}</th>
                <th class="${sortCls("uid")}" data-sd-sort="uid" style="width:98px;" title="按 UID 排序">对方 UID${sortInd("uid")}</th>
                <th class="${sortCls("detail")}" data-sd-sort="detail" title="按用户名/明细排序">明细信息${sortInd("detail")}</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      `;

      wrap.querySelectorAll("[data-sd-sort]").forEach((th) => {
        th.addEventListener("click", () => {
          const k = th.getAttribute("data-sd-sort");
          if (stardustUi.sortKey === k) {
            stardustUi.sortDir = stardustUi.sortDir === "desc" ? "asc" : "desc";
          } else {
            stardustUi.sortKey = k;
            stardustUi.sortDir = (k === "uid" || k === "detail" || k === "category") ? "asc" : "desc";
          }
          stardustUi.visibleCount = STARDUST_PAGE_SIZE;
          renderStardustTableSection(hostEl, records);
        });
      });

      wrap.querySelectorAll("[data-sd-profile]").forEach((lnk) => {
        lnk.addEventListener("click", (e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
          const uid = lnk.getAttribute("data-sd-profile");
          if (uid && typeof openUserProfileModal === "function") {
            e.preventDefault();
            const resolved = getResolvedStardustUserName(uid);
            openUserProfileModal({ uid, name: resolved || `用户 #${uid}` });
          }
        });
      });

      wrap.querySelectorAll("[data-sd-post]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const pid = btn.getAttribute("data-sd-post");
          if (!pid) return;
          const bd = document.getElementById("nsc-hub-backdrop");
          if (bd) bd.classList.remove("is-open");
          if (typeof openPostInChat === "function") {
            openPostInChat({ postId: pid, url: `/post-${pid}-1`, title: `帖子 #${pid}` });
          }
        });
      });

      const wfFoot = document.createElement("div");
      wfFoot.style.cssText = "text-align:center;font-size:11.5px;color:var(--nsc-muted);padding:10px 4px;";
      if (sliceCount < filtered.length) {
        wfFoot.textContent = `继续下滑自动瀑布流加载更多（当前显示 ${sliceCount} / ${filtered.length} 条）`;
      } else {
        wfFoot.textContent = `已加载全部 ${filtered.length} 条流水`;
      }

      hostEl.appendChild(wrap);
      hostEl.appendChild(wfFoot);

      resolveVisibleStardustUids(visibleUids);
    }

    function renderStardustAnalytics(body, subbar) {
      const snap = stardustEngine.getState();
      const rawItems = snap.items || [];
      const selfUid = stardustUi.myUid || state.currentUserId || 0;
      const records = normalizeStardustRecords(rawItems, selfUid);

      const banner = document.createElement("div");
      banner.className = "nsc-ana-banner";

      const topRow = document.createElement("div");
      topRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;width:100%;";

      const statusBox = document.createElement("div");
      statusBox.style.cssText = "min-width:200px;flex:1;";
      const statusText = snap.running
        ? `正在全量拉取第 ${snap.page + 1} 批（已去重 ${records.length} 条记录）...`
        : records.length > 0
          ? `已就绪 · 共分析 ${records.length} 条交互与转账记录`
          : "点击「开始全量拉取」获取完整星辰收支与双向点赞统计";
      statusBox.innerHTML = `
        <div style="font-size:13px;font-weight:700;color:var(--nsc-text);">${escHtml(statusText)}</div>
        ${snap.error ? `<div style="font-size:11.5px;color:#ff3b30;margin-top:3px;">${escHtml(snap.error)}</div>` : ""}
      `;

      const btnGroup = document.createElement("div");
      btnGroup.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap;";

      if (snap.running) {
        const stopBtn = document.createElement("button");
        stopBtn.type = "button";
        stopBtn.className = "nsc-checkin-btn";
        stopBtn.style.color = "#ff3b30";
        stopBtn.textContent = "停止";
        stopBtn.addEventListener("click", () => stardustEngine.abort());
        btnGroup.appendChild(stopBtn);
      } else {
        const fetchBtn = document.createElement("button");
        fetchBtn.type = "button";
        fetchBtn.className = "nsc-checkin-btn primary";
        fetchBtn.textContent = records.length > 0 ? "🔄 重新抓取" : "开始全量拉取";
        fetchBtn.addEventListener("click", () => {
          stardustUi.visibleCount = STARDUST_PAGE_SIZE;
          stardustEngine.runBatch({ maxPages: 300, delayMs: 300 });
        });
        btnGroup.appendChild(fetchBtn);
      }

      const exportBtn = document.createElement("button");
      exportBtn.type = "button";
      exportBtn.className = "nsc-checkin-btn";
      exportBtn.textContent = "📋 复制统计排行";
      exportBtn.disabled = records.length === 0 || snap.running;
      exportBtn.addEventListener("click", () => exportStardustSummaryMarkdown(records, exportBtn));
      btnGroup.appendChild(exportBtn);

      topRow.appendChild(statusBox);
      topRow.appendChild(btnGroup);
      banner.appendChild(topRow);

      // 筛选栏与搜索框
      const filterRow = document.createElement("div");
      filterRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;width:100%;padding-top:8px;border-top:1px dashed var(--nsc-border);";

      const seg = document.createElement("div");
      seg.className = "nsc-seg-tabs";
      const filterDefs = [
        { id: "all", label: "全部" },
        { id: "upvote_in", label: "收到点赞" },
        { id: "upvote_out", label: "送出点赞" },
        { id: "transfer_out", label: "送出转账" },
        { id: "transfer_in", label: "收到转账" },
      ];
      const tableHost = document.createElement("div");

      filterDefs.forEach((f) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "nsc-seg-btn" + (stardustUi.filter === f.id ? " is-active" : "");
        b.textContent = f.label;
        b.addEventListener("click", () => {
          stardustUi.filter = f.id;
          stardustUi.visibleCount = STARDUST_PAGE_SIZE;
          seg.querySelectorAll(".nsc-seg-btn").forEach((el) => el.classList.remove("is-active"));
          b.classList.add("is-active");
          if (records.length > 0) renderStardustTableSection(tableHost, records);
        });
        seg.appendChild(b);
      });

      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.placeholder = "搜索 UID / 用户名 / 留言 / 时间...";
      searchInput.value = stardustUi.search;
      searchInput.style.cssText = "height:28px;padding:0 10px;border-radius:8px;border:1px solid var(--nsc-border);background:var(--nsc-hover);color:var(--nsc-text);font-size:12px;outline:none;min-width:210px;";
      searchInput.addEventListener("input", () => {
        stardustUi.search = searchInput.value;
        stardustUi.visibleCount = STARDUST_PAGE_SIZE;
        if (records.length > 0) renderStardustTableSection(tableHost, records);
      });

      filterRow.appendChild(seg);
      filterRow.appendChild(searchInput);
      banner.appendChild(filterRow);
      body.appendChild(banner);

      if (records.length === 0) {
        if (!snap.running) {
          const empty = document.createElement("div");
          empty.className = "nsc-empty-state";
          empty.textContent = "尚未拉取星辰账本数据，点击「开始全量拉取」即可完整核算双向点赞与转账排行。";
          body.appendChild(empty);
        }
        return;
      }

      const summary = computeStardustSummary(records);
      const kpi = document.createElement("div");
      kpi.className = "nsc-hub-kpi-grid";
      kpi.innerHTML = `
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">核算余额</div>
          <div class="nsc-hub-kpi-val" style="color:var(--nsc-accent);">${escHtml(String(summary.displayBal))}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">累计收入</div>
          <div class="nsc-hub-kpi-val" style="color:#16a34a;">+${summary.totalIncome}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">累计支出</div>
          <div class="nsc-hub-kpi-val" style="color:#ff3b30;">-${summary.totalExpense}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">收到点赞</div>
          <div class="nsc-hub-kpi-val" style="color:#16a34a;">${summary.upvoteInCount} 次 (+${summary.upvoteInStardust})</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">送出点赞</div>
          <div class="nsc-hub-kpi-val" style="color:var(--nsc-accent);">${summary.upvoteOutCount} 次</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">送出转账</div>
          <div class="nsc-hub-kpi-val" style="color:#ff3b30;">${summary.transferOutCount} 笔 (-${summary.transferOutStardust})</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">收到转账</div>
          <div class="nsc-hub-kpi-val" style="color:var(--nsc-accent);">${summary.transferInCount} 笔 (+${summary.transferInStardust})</div>
        </div>
      `;
      body.appendChild(kpi);

      // 星辰互动排行榜卡片（可点击直接定位该用户的星辰转账/互动记录）
      const rankCard = document.createElement("div");
      rankCard.className = "nsc-ana-card";
      rankCard.style.marginBottom = "12px";
      const rankCats = [
        { id: "upvote_in", label: "💖 获赞排行", unit: "星辰", sign: "+" },
        { id: "upvote_out", label: "👍 送赞排行", unit: "次", sign: "" },
        { id: "transfer_in", label: "💰 收到转账", unit: "星辰", sign: "+" },
        { id: "transfer_out", label: "💸 送出转账", unit: "星辰", sign: "-" },
      ];
      const activeRankDef = rankCats.find((c) => c.id === stardustUi.rankCat) || rankCats[0];
      const rankList = buildStardustRankList(records, activeRankDef.id);
      const topRank = rankList.slice(0, 20);

      rankCard.innerHTML = `
        <div class="nsc-ana-card-title" style="flex-wrap:wrap;">
          <span>🏆 星辰互动排行榜（点击用户直达其明细记录）</span>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <div class="nsc-seg-tabs" id="nsc-sd-rank-tabs"></div>
            <button type="button" class="nsc-mini-btn" id="nsc-sd-rank-toggle">${stardustUi.showRank ? "收起" : "展开"}</button>
          </div>
        </div>
        <div id="nsc-sd-rank-list" style="display:${stardustUi.showRank ? "grid" : "none"};grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:6px;"></div>
      `;
      const rTabs = rankCard.querySelector("#nsc-sd-rank-tabs");
      rankCats.forEach((rc) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "nsc-seg-btn" + (activeRankDef.id === rc.id ? " is-active" : "");
        b.textContent = rc.label;
        b.addEventListener("click", () => {
          stardustUi.rankCat = rc.id;
          stardustUi.showRank = true;
          renderUserHub();
        });
        rTabs.appendChild(b);
      });
      rankCard.querySelector("#nsc-sd-rank-toggle").addEventListener("click", () => {
        stardustUi.showRank = !stardustUi.showRank;
        renderUserHub();
      });

      const rListEl = rankCard.querySelector("#nsc-sd-rank-list");
      if (stardustUi.showRank) {
        if (topRank.length === 0) {
          rListEl.innerHTML = `<div style="font-size:12px;color:var(--nsc-muted);padding:8px 2px;">暂无该分类排行数据</div>`;
        } else {
          const rankUidsToResolve = [];
          topRank.forEach((u, idx) => {
            rankUidsToResolve.push(u.uid);
            const rank = idx + 1;
            const rankLabel = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
            const handle = getDisplayUserHandle(u.uid);
            const valText = activeRankDef.id === "upvote_out"
              ? `${u.count} 次`
              : `${activeRankDef.sign}${u.totalAmount} (${u.count}次)`;
            const badgeCls = activeRankDef.sign === "-" ? "neg" : "pos";
            const ledgerHref = selfUid
              ? `/stardust/list?member_id=${encodeURIComponent(String(selfUid))}&peer_id=${encodeURIComponent(u.uid)}`
              : `/stardust/list?member_id=${encodeURIComponent(u.uid)}`;

            const row = document.createElement("div");
            row.className = "nsc-hub-row";
            row.style.marginBottom = "0";
            row.style.padding = "7px 10px";
            row.title = "点击筛选并跳转到该用户的星辰往来明细";
            row.innerHTML = `
              <span style="width:26px;text-align:center;font-weight:700;font-size:12px;flex:0 0 26px;">${rankLabel}</span>
              <div class="nsc-hub-row-main">
                <div class="nsc-hub-row-title" data-nsc-sd-uid="${escHtml(u.uid)}">${escHtml(handle)}</div>
                <div class="nsc-hub-row-sub"><span>UID: ${escHtml(u.uid)}</span><a href="${ledgerHref}" target="_blank" rel="noopener noreferrer" data-sd-ext style="color:var(--nsc-accent);text-decoration:none;">原版流水 ↗</a></div>
              </div>
              <span class="nsc-hub-delta ${badgeCls}">${escHtml(valText)}</span>
            `;
            row.querySelector("[data-sd-ext]").addEventListener("click", (e) => e.stopPropagation());
            row.addEventListener("click", () => {
              stardustUi.search = String(u.uid);
              stardustUi.filter = activeRankDef.id;
              stardustUi.visibleCount = STARDUST_PAGE_SIZE;
              searchInput.value = String(u.uid);
              seg.querySelectorAll(".nsc-seg-btn").forEach((el, sIdx) => {
                el.classList.toggle("is-active", filterDefs[sIdx] && filterDefs[sIdx].id === activeRankDef.id);
              });
              renderStardustTableSection(tableHost, records);
              tableHost.scrollIntoView({ behavior: "smooth", block: "start" });
            });
            rListEl.appendChild(row);
          });
          resolveVisibleStardustUids(rankUidsToResolve);
        }
      }
      body.appendChild(rankCard);
      body.appendChild(tableHost);

      renderStardustTableSection(tableHost, records);
    }

    registerHubSubView("stardust", {
      render(body, subbar) {
        renderStardustAnalytics(body, subbar);
      },
      onScrollEnd() {
        if (state.hubTab !== "stardust" || state.hubStardustView !== "analytics") return;
        const host = stardustUi.lastTableHost;
        const recs = stardustUi.lastRecords;
        if (!host || !host.isConnected || !recs || recs.length === 0) return;
        const kw = stardustUi.search.trim().toLowerCase();
        const totalFiltered = recs.filter((item) => {
          if (stardustUi.filter !== "all" && item.category !== stardustUi.filter) return false;
          if (!kw) return true;
          return (
            String(item.targetUid || "").includes(kw) ||
            getResolvedStardustUserName(item.targetUid).toLowerCase().includes(kw) ||
            String(item.memo || "").toLowerCase().includes(kw) ||
            String(item.time || "").toLowerCase().includes(kw)
          );
        }).length;
        if (stardustUi.visibleCount < totalFiltered) {
          stardustUi.visibleCount += STARDUST_PAGE_SIZE;
          const hubBody = document.getElementById("nsc-hub-body");
          const prevTop = hubBody ? hubBody.scrollTop : 0;
          renderStardustTableSection(host, recs);
          if (hubBody) hubBody.scrollTop = prevTop;
        }
      },
    });
  })();

  // ==========================================================================
  // Module: plugins/core-workbench-base.js
  // ==========================================================================
  // 官方内置基座配置中心插件：主题中心 / 四区皮肤透明度基座 / 组件调序基座 / 排版与自定义表情基座 / 插槽探测
  (function initWorkbenchBasePlugin() {
    const SECTIONS = [
      { id: "theme", label: "主题中心" },
      { id: "skin", label: "分区皮肤" },
      { id: "layout", label: "组件调序" },
      { id: "chat", label: "排版与回复" },
      { id: "ext", label: "原版扩展" },
      { id: "slots", label: "扩展插槽" },
    ];

    const DEFAULT_STYLE_PRESETS = [
      {
        id: "preset_kawaii_border",
        title: "原版论坛 · 萌系半透明封边（80hou预留）",
        note: "包含白色圆角头像投影、斜纹滚动条、自定义指针、全屏背景图与 #nsk-body-left 封边；切回原版论坛时依然生效。",
        code: `/* ============================================================
   1. 组件基础样式：统一图标与按钮风格
   ============================================================ */
.avatar { border: 3px solid #fff !important; } /* 给头像增加一圈白色边框，更醒目 */
.avatar + .icon { display: none !important; } /* 隐藏掉头像旁边的小等级图标，让画面更简洁 */
.avatar-normal, .sorter, .btn { box-shadow: 1px 1px 3px #000 !important; } /* 给头像、排序栏、按钮加上淡淡的黑色投影，看起来有立体感 */
.avatar-normal { border-radius: 20px; } /* 设置头像为圆角矩形 */

/* ============================================================
   2. 滚动条美化：让滚动条不再是原生那种丑丑的样子
   ============================================================ */
::-webkit-scrollbar { width: 8px; height: 8px; } /* 设置滚动条的厚度 */
::-webkit-scrollbar-track { background-color: rgba(200, 200, 200, 0.2); border-radius: 2em; } /* 设置滚动条轨道的颜色为浅灰半透明，并带圆角 */
::-webkit-scrollbar-thumb {
    background-color: #ccc; /* 设置滑块本身的颜色 */
    background-image: -webkit-linear-gradient(45deg, rgba(255,255,255,0.4) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.4) 75%, transparent 75%, transparent); /* 给滑块加上漂亮的斜纹装饰 */
    border-radius: 2em; /* 滑块两端变圆润 */
}

/* ============================================================
   3. 自定义鼠标指针：让点击交互更有趣
   ============================================================ */
body { cursor: url('https://npm.elemecdn.com/kang-static/Hexo/img/default.cur'), auto !important; } /* 设置页面空白处的默认鼠标箭头 */
a, button, img, .transition { cursor: url('https://npm.elemecdn.com/kang-static/Hexo/img/pointer.cur'), auto !important; } /* 设置鼠标移到链接、按钮、图片等可点击物体上的指针 */

/* ============================================================
   4. 页面背景与透明度布局：核心视觉美化
   ============================================================ */
body::before {
    content: "";
    position: fixed; /* 把背景图固定住，页面滚动时背景不动 */
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: -1; /* 把背景图放到最底层，确保不遮挡文字 */
    background: #f0f0f0 url(https://cdn.nodeimage.com/i/qAdktUUKq1wrLwlSuYIbhHDiZtf3lXCp.png) center/cover no-repeat; /* 设置自动拉伸的随机背景图 */
}

#nsk-body, header { background-color: rgba(255, 255, 255, 0.7) !important; } /* 设置主体内容区和顶栏为 70% 透明的白色，隐约透出背景 */
footer { background-color: rgba(255, 255, 255, 0.15) !important; } /* 页脚更透一点，只有 15% 透明度 */

/* ============================================================
   5. 帖子列表：自定义可爱封边 (带调试指南)
   ============================================================ */
#nsk-body-left {
    background: rgba(255, 255, 255, 0.2) !important; /* 背景更通透 (0.2透明度) */
    /* backdrop-filter: blur(10px); */ /* 注释掉以防与 Pro 脚本的弹窗层级及渲染冲突 */
    border-radius: 20px; /* 设置帖子区域的大圆角 */
    
    /* 1. 图案厚度：数值越大，边框图案越宽 (觉得太窄就改大这里) */
    border: 25px solid transparent; 
    
    /* 2. 图片设置：55为切片数值，若图案被切断，微调此数字 (每次增减 5-10) */
    border-image: url('https://cdn.nodeimage.com/i/wXSGm50JBUZj8j3wobqzgleqht7Fa2uq.png') 55 round;
    
    /* 3. 偏移距离：图案离帖子内容的距离 (如果图案压到字了，就把 10 改大) */
    border-image-outset: 10px;
    
    /* 设置内容与边缘的空隙 */
    padding: 10px;
    margin-right: 15px;
}`,
      },
    ];

    function getStyleNotes() {
      if (state.customStyleNotes === null) {
        state.customStyleNotes = DEFAULT_STYLE_PRESETS.map((p) => ({ ...p }));
        saveJson(LS.CUSTOM_STYLE_NOTES, state.customStyleNotes);
      } else if (Array.isArray(state.customStyleNotes)) {
        let migrated = false;
        for (const n of state.customStyleNotes) {
          if (n && n.id === "preset_kawaii_border" && n.title === "原版论坛 · 萌系半透明封边（官方扩展预设）") {
            n.title = DEFAULT_STYLE_PRESETS[0].title;
            migrated = true;
          }
        }
        if (migrated) saveJson(LS.CUSTOM_STYLE_NOTES, state.customStyleNotes);
      }
      return Array.isArray(state.customStyleNotes) ? state.customStyleNotes : [];
    }

    let selectedExtId = "";
    let showExtGuideBox = false;

    function buildRangeControl({ label, min, max, step, value, unit = "", onLive, onCommit }) {
      const row = document.createElement("div");
      row.className = "nsc-base-ctrl-row";
      row.innerHTML = `
        <label>${escHtml(label)}</label>
        <input type="range" class="nsc-base-range" min="${min}" max="${max}" step="${step}" value="${value}" />
        <span class="nsc-base-val">${escHtml(String(value))}${escHtml(unit)}</span>
      `;
      const inp = row.querySelector("input");
      const valEl = row.querySelector(".nsc-base-val");
      inp.addEventListener("input", () => {
        valEl.textContent = `${inp.value}${unit}`;
        if (typeof onLive === "function") onLive(Number(inp.value));
      });
      inp.addEventListener("change", () => {
        if (typeof onCommit === "function") onCommit(Number(inp.value));
      });
      return row;
    }

    function buildOrderedListCard({ title, subtitle, items, protectedIds = [], minVisible = 1, onChange, onReset }) {
      const box = document.createElement("div");
      box.className = "nsc-base-section";
      box.innerHTML = `
        <div class="nsc-base-title">
          <span>${escHtml(title)}</span>
          <button type="button" class="nsc-mini-btn nsc-ord-reset">恢复默认</button>
        </div>
        ${subtitle ? `<div class="nsc-base-sub">${escHtml(subtitle)}</div>` : ""}
        <div class="nsc-base-order-list"></div>
      `;
      box.querySelector(".nsc-ord-reset").addEventListener("click", () => onReset());
      const listEl = box.querySelector(".nsc-base-order-list");

      const visibleCount = items.filter((x) => !x.hidden).length;
      items.forEach((it, idx) => {
        const isProtected = protectedIds.includes(it.id);
        const canHide = !isProtected && (it.hidden || visibleCount > minVisible);
        const row = document.createElement("div");
        row.className = "nsc-base-order-row";
        row.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;min-width:0;">
            <span style="font-size:11px;color:var(--nsc-muted);width:18px;">${idx + 1}.</span>
            <span style="font-weight:600;${it.hidden ? "opacity:0.5;text-decoration:line-through;" : ""}">${escHtml(it.name || it.label || it.id)}</span>
            ${isProtected ? `<span class="nsc-badge-read">必留</span>` : ""}
          </div>
          <div class="nsc-base-order-ops">
            <button type="button" class="nsc-icon-btn" data-dir="-1" title="上移" ${idx === 0 ? "disabled" : ""}>${ICONS.up}</button>
            <button type="button" class="nsc-icon-btn" data-dir="1" title="下移" ${idx === items.length - 1 ? "disabled" : ""}>${ICONS.down}</button>
            <button type="button" class="nsc-switch ${!it.hidden ? "is-on" : ""}" ${!canHide ? "disabled style=\"opacity:0.45;cursor:not-allowed;\"" : ""} title="${!it.hidden ? "点击隐藏" : "点击启用"}"><span class="nsc-switch-knob"></span></button>
          </div>
        `;
        row.querySelectorAll("[data-dir]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const dir = Number(btn.dataset.dir);
            const targetIdx = idx + dir;
            if (targetIdx < 0 || targetIdx >= items.length) return;
            const nextOrder = items.map((x) => x.id);
            const tmp = nextOrder[idx];
            nextOrder[idx] = nextOrder[targetIdx];
            nextOrder[targetIdx] = tmp;
            const nextHidden = items.filter((x) => x.hidden).map((x) => x.id);
            onChange({ order: nextOrder, hidden: nextHidden });
          });
        });
        const sw = row.querySelector(".nsc-switch");
        sw.addEventListener("click", () => {
          if (!canHide) return;
          const nextHiddenSet = new Set(items.filter((x) => x.hidden).map((x) => x.id));
          if (nextHiddenSet.has(it.id)) nextHiddenSet.delete(it.id);
          else nextHiddenSet.add(it.id);
          onChange({ order: items.map((x) => x.id), hidden: Array.from(nextHiddenSet) });
        });
        listEl.appendChild(row);
      });
      return box;
    }

    function renderThemeSection(body) {
      const themes = state.registry.themes || [];
      const curId = getEffectiveThemeMode();
      const sec = document.createElement("div");
      sec.className = "nsc-base-section";
      sec.innerHTML = `
        <div class="nsc-base-title">
          <span>外观主题注册中心（已识别 ${themes.length} 套）</span>
          <button type="button" class="nsc-mini-btn" id="nsc-base-theme-auto">跟随原站 (${state.themeMode === "auto" ? "当前" : "重置"})</button>
        </div>
        <div class="nsc-base-sub">默认提供 macOS 浅色、黄昏护眼与分层暗黑三套主题；后续放入 src/themes/*.js 的自定义主题会自动出现在下方列表中。</div>
        <div class="nsc-base-theme-grid"></div>
      `;
      sec.querySelector("#nsc-base-theme-auto").addEventListener("click", () => {
        applyThemeMode("auto");
        renderUserHubIfOpen();
      });
      const grid = sec.querySelector(".nsc-base-theme-grid");
      for (const th of themes) {
        const isAct = curId === th.id;
        const tk = th.tokens || {};
        const card = document.createElement("button");
        card.type = "button";
        card.className = "nsc-base-theme-card" + (isAct ? " is-active" : "");
        card.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
            <span style="font-size:13px;font-weight:700;color:var(--nsc-text);">${escHtml(th.name)}</span>
            <span class="nsc-badge-read">${th.baseScheme === "dark" ? "暗色基调" : "浅色基调"}</span>
          </div>
          <div style="font-size:11px;color:var(--nsc-muted);line-height:1.4;">${escHtml(th.desc || th.id)}</div>
          <div class="nsc-base-swatch-row">
            <span class="nsc-base-swatch" style="background:${escHtml(tk["--nsc-bg-nav"] || "#eee")};"></span>
            <span class="nsc-base-swatch" style="background:${escHtml(tk["--nsc-bg-chat"] || "#f5f5f5")};"></span>
            <span class="nsc-base-swatch" style="background:${escHtml(tk["--nsc-bubble-self"] || "#007aff")};"></span>
            <span class="nsc-base-swatch" style="background:${escHtml(tk["--nsc-accent"] || "#007aff")};"></span>
          </div>
        `;
        card.addEventListener("click", () => {
          applyThemeMode(th.id);
          renderUserHubIfOpen();
        });
        grid.appendChild(card);
      }
      body.appendChild(sec);
    }

    function renderSkinSection(body) {
      const intro = document.createElement("div");
      intro.className = "nsc-base-section";
      intro.innerHTML = `
        <div class="nsc-base-title">
          <span>四分区背景皮肤与透明度调节基座</span>
          <button type="button" class="nsc-mini-btn" id="nsc-skin-clear-all">一键还原默认磨砂</button>
        </div>
        <div class="nsc-base-sub">未设置背景图时保持原版 macOS 半透明磨砂效果；支持为导航、帖子、聊天底图、个人信息四个区域分别输入图片 URL 或上传本地图片，并独立微调透明度与模糊度。</div>
      `;
      intro.querySelector("#nsc-skin-clear-all").addEventListener("click", () => {
        state.paneSkins = {};
        saveJson(LS.PANE_SKINS, state.paneSkins);
        applyPaneSkinsToDom();
        renderUserHubIfOpen();
      });
      body.appendChild(intro);

      const grid = document.createElement("div");
      grid.className = "nsc-base-grid-2";

      for (const spec of PANE_SKIN_SPECS) {
        const cfg = state.paneSkins[spec.id] || {};
        const opVal = Math.round(Math.min(1, Math.max(0, Number(cfg.opacity ?? 0.25))) * 100);
        const blurVal = Math.min(24, Math.max(0, Number(cfg.blur ?? 0)));
        const fitVal = cfg.fit || "cover";

        const card = document.createElement("div");
        card.className = "nsc-base-section";
        card.style.marginBottom = "0";
        card.innerHTML = `
          <div class="nsc-base-title">
            <span>${escHtml(spec.label)}</span>
            <span class="nsc-badge-read" title="推荐图片尺寸与比例">${escHtml(spec.ratio)} · ${escHtml(spec.recSize)}</span>
          </div>
          <div style="display:flex;gap:5px;align-items:center;">
            <input type="text" class="nsc-search-input nsc-skin-url" placeholder="输入背景图 URL（支持图床直链）..." value="${escHtml(cfg.url || "")}" style="flex:1;height:27px;" />
            <button type="button" class="nsc-mini-btn nsc-skin-pick">本地图</button>
            <button type="button" class="nsc-mini-btn nsc-skin-clear">清除</button>
            <input type="file" accept="image/*" class="nsc-skin-file" style="display:none;" />
          </div>
          <div class="nsc-base-ctrl-row" style="margin-top:8px;">
            <label>填充方式</label>
            <div class="nsc-seg-tabs">
              <button type="button" class="nsc-seg-btn ${fitVal === "cover" ? "is-active" : ""}" data-fit="cover">铺满</button>
              <button type="button" class="nsc-seg-btn ${fitVal === "contain" ? "is-active" : ""}" data-fit="contain">完整</button>
              <button type="button" class="nsc-seg-btn ${fitVal === "repeat" ? "is-active" : ""}" data-fit="repeat">平铺</button>
            </div>
            <span class="nsc-base-val"></span>
          </div>
        `;

        const updatePaneSkin = (patch, rerender = false) => {
          state.paneSkins[spec.id] = { opacity: 0.25, blur: 0, fit: "cover", ...(state.paneSkins[spec.id] || {}), ...patch };
          saveJson(LS.PANE_SKINS, state.paneSkins);
          applyPaneSkinsToDom();
          if (rerender) renderUserHubIfOpen();
        };

        const urlInp = card.querySelector(".nsc-skin-url");
        urlInp.addEventListener("change", () => updatePaneSkin({ url: urlInp.value.trim() }));

        const fileInp = card.querySelector(".nsc-skin-file");
        card.querySelector(".nsc-skin-pick").addEventListener("click", () => fileInp.click());
        fileInp.addEventListener("change", () => {
          const f = fileInp.files && fileInp.files[0];
          fileInp.value = "";
          if (!f) return;
          if (f.size > 1.5 * 1024 * 1024) {
            urlInp.value = "";
            urlInp.placeholder = "图片超过 1.5MB，建议先上传图床后粘贴直链";
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              urlInp.value = reader.result;
              updatePaneSkin({ url: reader.result });
            }
          };
          reader.readAsDataURL(f);
        });

        card.querySelector(".nsc-skin-clear").addEventListener("click", () => {
          delete state.paneSkins[spec.id];
          saveJson(LS.PANE_SKINS, state.paneSkins);
          applyPaneSkinsToDom();
          renderUserHubIfOpen();
        });

        card.querySelectorAll("[data-fit]").forEach((fb) => {
          fb.addEventListener("click", () => {
            updatePaneSkin({ fit: fb.dataset.fit }, true);
          });
        });

        card.appendChild(
          buildRangeControl({
            label: "图片透明度",
            min: 0,
            max: 100,
            step: 2,
            value: opVal,
            unit: "%",
            onLive: (v) => {
              state.paneSkins[spec.id] = { ...(state.paneSkins[spec.id] || {}), opacity: v / 100 };
              applyPaneSkinsToDom();
            },
            onCommit: (v) => updatePaneSkin({ opacity: v / 100 }),
          })
        );

        card.appendChild(
          buildRangeControl({
            label: "背景模糊度",
            min: 0,
            max: 24,
            step: 1,
            value: blurVal,
            unit: "px",
            onLive: (v) => {
              state.paneSkins[spec.id] = { ...(state.paneSkins[spec.id] || {}), blur: v };
              applyPaneSkinsToDom();
            },
            onCommit: (v) => updatePaneSkin({ blur: v }),
          })
        );

        grid.appendChild(card);
      }
      body.appendChild(grid);
    }

    function renderLayoutSection(body) {
      const rightItems = getOrderedRightTabs(true);
      body.appendChild(
        buildOrderedListCard({
          title: "右侧栏标签顺序与显隐控制",
          subtitle: "调整右侧栏（热榜 / 好友 / 粉丝 / 黑名单）排列位置或关闭暂不需要的面板（至少保留一项）。",
          items: rightItems,
          minVisible: 1,
          onChange: (cfg) => {
            state.rightConfig = cfg;
            saveJson(LS.RIGHT_CONFIG, cfg);
            renderRightTabs();
            renderRightBody();
            renderUserHubIfOpen();
          },
          onReset: () => {
            state.rightConfig = { order: [], hidden: [] };
            saveJson(LS.RIGHT_CONFIG, state.rightConfig);
            renderRightTabs();
            renderRightBody();
            renderUserHubIfOpen();
          },
        })
      );

      const navItems = getOrderedChannels(true);
      body.appendChild(
        buildOrderedListCard({
          title: "左侧导航功能顺序与显隐控制",
          subtitle: "支持调整版块与消息入口排序，或隐藏不常逛的版块（「首页」保持必留）。",
          items: navItems,
          protectedIds: ["home"],
          minVisible: 1,
          onChange: (cfg) => {
            state.navConfig = cfg;
            saveJson(LS.NAV_CONFIG, cfg);
            renderLeftNav();
            renderUserHubIfOpen();
          },
          onReset: () => {
            state.navConfig = { order: [], hidden: [] };
            saveJson(LS.NAV_CONFIG, state.navConfig);
            renderLeftNav();
            renderUserHubIfOpen();
          },
        })
      );
    }

    function renderChatAndComposerSection(body) {
      const p = state.chatPrefs || { lineHeight: 1.55, msgGap: 12, imgMaxW: 480, imgMaxH: 320 };
      const typoBox = document.createElement("div");
      typoBox.className = "nsc-base-section";
      typoBox.innerHTML = `
        <div class="nsc-base-title">
          <span>聊天区排版与图片尺寸基座</span>
          <button type="button" class="nsc-mini-btn" id="nsc-chat-pref-reset">恢复默认</button>
        </div>
        <div class="nsc-base-sub">实时调整消息行高、楼层间距及聊天框内普通图片显示上限（不影响灯箱原图查看与魔术标签页长图）。</div>
      `;
      typoBox.querySelector("#nsc-chat-pref-reset").addEventListener("click", () => {
        state.chatPrefs = { lineHeight: 1.55, msgGap: 12, imgMaxW: 480, imgMaxH: 320 };
        saveJson(LS.CHAT_PREFS, state.chatPrefs);
        applyChatPrefsToDom();
        renderUserHubIfOpen();
      });

      const commitPref = (patch) => {
        state.chatPrefs = { ...state.chatPrefs, ...patch };
        saveJson(LS.CHAT_PREFS, state.chatPrefs);
        applyChatPrefsToDom();
      };

      typoBox.appendChild(buildRangeControl({
        label: "正文行间距",
        min: 1.25, max: 2.0, step: 0.05, value: Number(p.lineHeight || 1.55),
        onLive: (v) => { state.chatPrefs.lineHeight = v; applyChatPrefsToDom(); },
        onCommit: (v) => commitPref({ lineHeight: v }),
      }));
      typoBox.appendChild(buildRangeControl({
        label: "消息间距",
        min: 4, max: 24, step: 1, value: Number(p.msgGap || 12), unit: "px",
        onLive: (v) => { state.chatPrefs.msgGap = v; applyChatPrefsToDom(); },
        onCommit: (v) => commitPref({ msgGap: v }),
      }));
      typoBox.appendChild(buildRangeControl({
        label: "图片最大宽",
        min: 260, max: 700, step: 20, value: Number(p.imgMaxW || 480), unit: "px",
        onLive: (v) => { state.chatPrefs.imgMaxW = v; applyChatPrefsToDom(); },
        onCommit: (v) => commitPref({ imgMaxW: v }),
      }));
      typoBox.appendChild(buildRangeControl({
        label: "图片最大高",
        min: 180, max: 640, step: 20, value: Number(p.imgMaxH || 320), unit: "px",
        onLive: (v) => { state.chatPrefs.imgMaxH = v; applyChatPrefsToDom(); },
        onCommit: (v) => commitPref({ imgMaxH: v }),
      }));
      body.appendChild(typoBox);

      const stkBox = document.createElement("div");
      stkBox.className = "nsc-base-section";
      stkBox.innerHTML = `
        <div class="nsc-base-title">
          <span>回复区自定义表情分组基座</span>
          <span class="nsc-badge-read">共 ${state.customStickers.length} 个自定义分组</span>
        </div>
        <div class="nsc-base-sub">新增的表情分组会自动同步至发帖、编辑与评论回复表情选择器中（格式为标准 Markdown 图片，支持外链贴图与 NodeImage 图床链接）。</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
          <input type="text" id="nsc-stk-grp-name" class="nsc-search-input" placeholder="分组名称（如：常用梗图）" style="flex:1;min-width:140px;height:27px;" />
          <input type="text" id="nsc-stk-item-name" class="nsc-search-input" placeholder="表情名称（可选）" style="width:120px;height:27px;" />
          <input type="text" id="nsc-stk-item-url" class="nsc-search-input" placeholder="粘贴图片 URL（https://...）" style="flex:2;min-width:190px;height:27px;" />
          <button type="button" class="nsc-send-btn" id="nsc-stk-add-btn" style="height:27px;">添加表情</button>
        </div>
        <div id="nsc-stk-list"></div>
      `;
      stkBox.querySelector("#nsc-stk-add-btn").addEventListener("click", () => {
        const gLabel = stkBox.querySelector("#nsc-stk-grp-name").value.trim() || "自定义表情";
        const iName = stkBox.querySelector("#nsc-stk-item-name").value.trim() || "sticker";
        const iUrl = stkBox.querySelector("#nsc-stk-item-url").value.trim();
        if (!/^https?:\/\//i.test(iUrl)) return;
        let grp = state.customStickers.find((g) => g.label === gLabel);
        if (!grp) {
          grp = { id: `custom_${Date.now().toString(36)}`, label: gLabel, items: [] };
          state.customStickers.push(grp);
        }
        grp.items.push({ name: iName, url: iUrl });
        saveJson(LS.CUSTOM_STICKERS, state.customStickers);
        renderUserHubIfOpen();
      });

      const listEl = stkBox.querySelector("#nsc-stk-list");
      if (state.customStickers.length === 0) {
        listEl.innerHTML = `<div style="font-size:11.5px;color:var(--nsc-muted);">暂无自定义表情分组，可在上方输入分组名与图片 URL 添加。</div>`;
      } else {
        state.customStickers.forEach((grp, gIdx) => {
          const gRow = document.createElement("div");
          gRow.className = "nsc-base-section";
          gRow.style.cssText = "padding:8px 10px;margin-bottom:6px;background:var(--nsc-hover);";
          gRow.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <strong style="font-size:12px;">${escHtml(grp.label)} (${grp.items.length})</strong>
              <button type="button" class="nsc-mini-btn nsc-stk-del-grp" style="color:#ff3b30;">删除分组</button>
            </div>
            <div class="nsc-base-sticker-preview"></div>
          `;
          gRow.querySelector(".nsc-stk-del-grp").addEventListener("click", () => {
            state.customStickers.splice(gIdx, 1);
            saveJson(LS.CUSTOM_STICKERS, state.customStickers);
            renderUserHubIfOpen();
          });
          const prevEl = gRow.querySelector(".nsc-base-sticker-preview");
          grp.items.forEach((it, iIdx) => {
            const chip = document.createElement("span");
            chip.className = "nsc-base-sticker-chip";
            chip.innerHTML = `<img src="${escHtml(it.url)}" alt="" /><span>${escHtml(it.name || "贴图")}</span><button type="button" style="border:none;background:transparent;color:var(--nsc-muted);cursor:pointer;padding:0 2px;">✕</button>`;
            chip.querySelector("button").addEventListener("click", () => {
              grp.items.splice(iIdx, 1);
              if (grp.items.length === 0) state.customStickers.splice(gIdx, 1);
              saveJson(LS.CUSTOM_STICKERS, state.customStickers);
              renderUserHubIfOpen();
            });
            prevEl.appendChild(chip);
          });
          listEl.appendChild(gRow);
        });
      }
      body.appendChild(stkBox);
    }

    function renderExtSection(body) {
      const notes = getStyleNotes();
      if (notes.length > 0 && !notes.some((n) => n.id === selectedExtId)) {
        selectedExtId = notes[0].id;
      }
      const cur = notes.find((n) => n.id === selectedExtId) || null;

      const intro = document.createElement("div");
      intro.className = "nsc-base-section";
      intro.innerHTML = `
        <div class="nsc-base-title">
          <span>原版论坛扩展样式备忘录（自定义 style 预设与引导）</span>
          <div style="display:inline-flex;gap:6px;">
            <button type="button" class="nsc-mini-btn" id="nsc-ext-new">+ 新建备忘</button>
            <button type="button" class="nsc-mini-btn" id="nsc-ext-restore">恢复默认预设</button>
          </div>
        </div>
        <div class="nsc-base-sub">
          用于收藏和切换 NodeSeek 原站「设置 → 论坛扩展 → 自定义style」CSS 代码（切换回原版论坛模式时同样生效）。
          注：NodeSeek 对「论坛扩展」功能存在社区等级限制，部分未达对应等级的账号可能无法在设置页看到该入口。
        </div>
        <div id="nsc-ext-tabs" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;"></div>
      `;

      intro.querySelector("#nsc-ext-new").addEventListener("click", () => {
        const nid = `memo_${Date.now().toString(36)}`;
        notes.push({
          id: nid,
          title: `自定义扩展 #${notes.length + 1}`,
          note: "",
          code: "/* 在此粘贴原版论坛自定义 CSS 代码 */\n",
        });
        state.customStyleNotes = notes;
        selectedExtId = nid;
        showExtGuideBox = false;
        saveJson(LS.CUSTOM_STYLE_NOTES, notes);
        renderUserHubIfOpen();
      });

      intro.querySelector("#nsc-ext-restore").addEventListener("click", () => {
        const preset = DEFAULT_STYLE_PRESETS[0];
        const idx = notes.findIndex((n) => n.id === preset.id);
        if (idx >= 0) notes[idx] = { ...preset };
        else notes.unshift({ ...preset });
        state.customStyleNotes = notes;
        selectedExtId = preset.id;
        showExtGuideBox = false;
        saveJson(LS.CUSTOM_STYLE_NOTES, notes);
        renderUserHubIfOpen();
      });

      const tabsEl = intro.querySelector("#nsc-ext-tabs");
      if (notes.length === 0) {
        tabsEl.innerHTML = `<span style="font-size:11.5px;color:var(--nsc-muted);">暂无扩展备忘，点击右上角「+ 新建备忘」或「恢复默认预设」。</span>`;
      } else {
        notes.forEach((n) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "nsc-pill-btn" + (cur && cur.id === n.id ? " is-active" : "");
          b.textContent = n.title || "未命名扩展";
          b.addEventListener("click", () => {
            selectedExtId = n.id;
            showExtGuideBox = false;
            renderUserHubIfOpen();
          });
          tabsEl.appendChild(b);
        });
      }
      body.appendChild(intro);

      if (!cur) return;

      const edBox = document.createElement("div");
      edBox.className = "nsc-base-section";
      edBox.innerHTML = `
        <div class="nsc-base-title">
          <input type="text" id="nsc-ext-title" class="nsc-search-input" value="${escHtml(cur.title || "")}" placeholder="扩展名称..." style="flex:1;max-width:360px;height:28px;font-weight:600;" />
          <div style="display:inline-flex;gap:6px;">
            <button type="button" class="nsc-mini-btn" id="nsc-ext-save">保存备忘</button>
            <button type="button" class="nsc-mini-btn" id="nsc-ext-del" style="color:#ff3b30;">删除</button>
            <button type="button" class="nsc-send-btn" id="nsc-ext-apply" style="height:26px;">复制并前往配置</button>
          </div>
        </div>
        ${cur.note ? `<div class="nsc-base-sub">${escHtml(cur.note)}</div>` : ""}
        <div id="nsc-ext-guide-slot"></div>
        <textarea id="nsc-ext-code" class="nsc-ext-code" spellcheck="false" placeholder="在此编写或粘贴自定义 CSS..."></textarea>
        <div id="nsc-ext-msg" style="font-size:11.5px;color:var(--nsc-muted);margin-top:6px;">提示：保存后将持久化至本地备忘录，点击「复制并前往配置」一键复制代码并引导跳转至设置页。</div>
      `;

      const titleInp = edBox.querySelector("#nsc-ext-title");
      const codeTa = edBox.querySelector("#nsc-ext-code");
      const msgEl = edBox.querySelector("#nsc-ext-msg");
      const guideSlot = edBox.querySelector("#nsc-ext-guide-slot");
      codeTa.value = cur.code || "";

      const renderGuide = () => {
        if (!showExtGuideBox) {
          guideSlot.innerHTML = "";
          return;
        }
        guideSlot.innerHTML = `
          <div class="nsc-ext-guide-box">
            <div style="font-weight:700;margin-bottom:4px;">CSS 代码已复制到剪贴板</div>
            <div>请点击下方确认按钮进入个人设置，在左侧选择「<strong>论坛扩展</strong>」，将代码粘贴到「<strong>自定义style</strong>」输入框后点击绿色「<strong>确定</strong>」即可生效（该入口受站点社区等级限制，未达等级时原版设置页不会显示该项）。</div>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <button type="button" class="nsc-send-btn" id="nsc-ext-go-setting">确认前往「论坛扩展」配置 ↗</button>
              <button type="button" class="nsc-mini-btn" id="nsc-ext-hide-guide">暂不跳转</button>
            </div>
          </div>
        `;
        guideSlot.querySelector("#nsc-ext-go-setting").addEventListener("click", () => {
          showExtGuideBox = false;
          state._settingAutoSection = "论坛扩展";
          if (typeof openUserHubModal === "function") openUserHubModal("setting");
        });
        guideSlot.querySelector("#nsc-ext-hide-guide").addEventListener("click", () => {
          showExtGuideBox = false;
          renderGuide();
        });
      };
      renderGuide();

      edBox.querySelector("#nsc-ext-save").addEventListener("click", () => {
        cur.title = titleInp.value.trim() || "未命名扩展";
        cur.code = codeTa.value;
        state.customStyleNotes = notes;
        saveJson(LS.CUSTOM_STYLE_NOTES, notes);
        msgEl.textContent = "已保存至扩展备忘录";
        msgEl.style.color = "var(--nsc-green)";
        renderUserHubIfOpen();
      });

      edBox.querySelector("#nsc-ext-del").addEventListener("click", () => {
        const idx = notes.findIndex((n) => n.id === cur.id);
        if (idx >= 0) notes.splice(idx, 1);
        state.customStyleNotes = notes;
        selectedExtId = notes[0] ? notes[0].id : "";
        showExtGuideBox = false;
        saveJson(LS.CUSTOM_STYLE_NOTES, notes);
        renderUserHubIfOpen();
      });

      edBox.querySelector("#nsc-ext-apply").addEventListener("click", async () => {
        cur.title = titleInp.value.trim() || cur.title;
        cur.code = codeTa.value;
        state.customStyleNotes = notes;
        saveJson(LS.CUSTOM_STYLE_NOTES, notes);
        const copied = await copyTextToClipboard(cur.code);
        if (copied) {
          showExtGuideBox = true;
          renderGuide();
          msgEl.textContent = "已复制代码，请确认下方引导前往设置";
          msgEl.style.color = "var(--nsc-accent)";
        } else {
          msgEl.textContent = "自动复制失败，请手动全选文本框内容复制";
          msgEl.style.color = "#ff3b30";
        }
      });

      body.appendChild(edBox);
    }

    function renderSlotsSection(body) {
      const manifest = typeof NSC_DISCOVERED_MODULES !== "undefined" ? NSC_DISCOVERED_MODULES : { mode: "unknown", themes: [], plugins: [] };
      const reg = state.registry;
      const box = document.createElement("div");
      box.className = "nsc-base-section";
      box.innerHTML = `
        <div class="nsc-base-title">
          <span>目录自动发现与扩展插槽状态</span>
          <span class="nsc-badge-read">构建模式：${escHtml(manifest.mode || "release")}</span>
        </div>
        <div class="nsc-base-sub">build.mjs 在构建时自动扫描 src/themes/*.js 与 src/plugins/*.js。二开者使用 custom-*.js 命名插件或主题，可在上游更新后无冲突保留扩展能力。</div>
        <div class="nsc-hub-kpi-grid">
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">已发现主题文件</div><div class="nsc-hub-kpi-val">${manifest.themes.length}</div></div>
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">已发现插件文件</div><div class="nsc-hub-kpi-val">${manifest.plugins.length}</div></div>
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">注册主题 / Hub 插槽</div><div class="nsc-hub-kpi-val">${reg.themes.length} / ${reg.hubTabs.length}</div></div>
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">气泡增强器 / 动作插槽</div><div class="nsc-hub-kpi-val">${reg.bubbleEnhancers.length} / ${reg.userActions.length}</div></div>
        </div>
        <div class="nsc-base-order-list">
          <div class="nsc-base-order-row"><span>themes/ 目录模块</span><span class="nsc-vote-note">${escHtml(manifest.themes.join(", ") || "无")}</span></div>
          <div class="nsc-base-order-row"><span>plugins/ 目录模块</span><span class="nsc-vote-note">${escHtml(manifest.plugins.join(", ") || "无")}</span></div>
          <div class="nsc-base-order-row"><span>已注册气泡增强管线（按优先级）</span><span class="nsc-vote-note">${escHtml(reg.bubbleEnhancers.map((e) => `${e.priority}:${e.id}`).join(" → "))}</span></div>
        </div>
      `;
      body.appendChild(box);
    }

    registerHubTab({
      id: "workbench",
      label: "基座",
      order: 95,
      nativeHref: "/setting",
      renderSubbar(subbar) {
        const seg = document.createElement("div");
        seg.className = "nsc-seg-tabs";
        for (const s of SECTIONS) {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "nsc-seg-btn" + (state.workbenchSection === s.id ? " is-active" : "");
          b.textContent = s.label;
          b.addEventListener("click", () => {
            state.workbenchSection = s.id;
            renderUserHub();
          });
          seg.appendChild(b);
        }
        subbar.appendChild(seg);
        const tip = document.createElement("span");
        tip.style.cssText = "font-size:11px;color:var(--nsc-muted);";
        tip.textContent = "零依赖共享基座 · 所有配置即时保存本地";
        subbar.appendChild(tip);
      },
      renderBody(body) {
        const sec = state.workbenchSection || "theme";
        if (sec === "theme") renderThemeSection(body);
        else if (sec === "skin") renderSkinSection(body);
        else if (sec === "layout") renderLayoutSection(body);
        else if (sec === "chat") renderChatAndComposerSection(body);
        else if (sec === "ext") renderExtSection(body);
        else renderSlotsSection(body);
      },
    });
  })();

  // ==========================================================================
  // Build Manifest
  // ==========================================================================
  const NSC_DISCOVERED_MODULES = {"mode":"release","themes":["themes/mac-default.js"],"plugins":["plugins/core-hub-analytics.js","plugins/core-workbench-base.js"]};

  // ==========================================================================
  // Module: 09-main.js
  // ==========================================================================
  function hookSpaRouteDetection() {
    const pageWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
    let lastPath = location.pathname;
    const onRouteCheck = () => {
      setTimeout(() => {
        ensureHeaderSwitch();
        if (location.pathname !== lastPath) {
          lastPath = location.pathname;
          toggleAppMode(state.enabled);
        }
      }, 120);
    };
    window.addEventListener("popstate", onRouteCheck);
    const origPush = pageWin.history.pushState;
    const origReplace = pageWin.history.replaceState;
    pageWin.history.pushState = function () {
      const r = origPush.apply(this, arguments);
      onRouteCheck();
      return r;
    };
    pageWin.history.replaceState = function () {
      const r = origReplace.apply(this, arguments);
      onRouteCheck();
      return r;
    };
  }

  function startApp() {
    injectStyles();
    hookSpaRouteDetection();
    ensureHeaderSwitch();

    setTimeout(() => {
      ensureHeaderSwitch();
      toggleAppMode(state.enabled);
    }, 120);

    setTimeout(() => {
      if (state.enabled && isForumBrowseRoute()) {
        mountNativeWidgetsIntoApp();
      }
    }, 650);

    let t = null;
    const obs = new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (!document.getElementById("nsc-mode-switch-btn")) ensureHeaderSwitch();
        const shouldActive = state.enabled && isForumBrowseRoute();
        if (document.body.classList.contains("nsc-app-active") !== shouldActive) {
          toggleAppMode(state.enabled);
        } else if (shouldActive && !document.querySelector("#nsc-right-user .user-card")) {
          mountNativeWidgetsIntoApp();
        }
      }, 220);
    });
    obs.observe(document.body, { childList: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp, { once: true });
  } else {
    startApp();
  }
})();
