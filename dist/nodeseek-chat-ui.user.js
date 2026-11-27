// ==UserScript==
// @name         NodeSeek macOS 群聊工作台 (无刷新发帖 · 热榜融合 · 粉丝好友 · 眼睛查发言)
// @namespace    https://www.nodeseek.com/
// @version      7.10.0
// @description  macOS 风格四栏桌面聊天界面：无闪屏启动 + 左侧自适应分区导航与消息中心(@我/回复我/私信/系统通知uid5230) + 中间群聊/居中双边楼中楼/悬停赞鸡腿引用回复/NodeImage授权传图 + 右侧热榜/好友/粉丝。
// @author       JeikCode Assistant
// @match        https://www.nodeseek.com/*
// @match        https://nodeseek.com/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @connect      api.nodeimage.com
// @connect      nodeimage.com
// @connect      www.nodeimage.com
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

  // 在隐藏 iframe 中用于提取动态渲染数据时不运行外层外壳
  if (window.self !== window.top) {
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
    quote: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>`,
    ruling: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    partner: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    links: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
    theme: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>`,
    smile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
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


  const state = {
    enabled: localStorage.getItem(LS.ENABLED) !== "0",
    activeChannel: localStorage.getItem(LS.ACTIVE_CHANNEL) || "home",
    sortMode: localStorage.getItem(LS.SORT) || "reply",
    hotTab: localStorage.getItem(LS.HOT_TAB) || "realtime",
    readMap: loadJson(LS.READ_MAP, {}),
    friends: loadJson(LS.FRIENDS, []),
    removedFriends: new Set(loadJson(LS.REMOVED_FRIENDS, [])),
    blacklist: loadJson(LS.BLACKLIST, []),
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
    prioritizeUnread: false,
    currentPostId: null,
    currentPostUrl: null,
    nativePostId: null,
    opAuthor: "",
    currentUser: "",
    currentUserId: 0,
    unreadCounts: { atMe: 0, reply: 0, message: 0, sysNotice: 0 },
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
    currentRoom: null,
    loadedPages: new Set(),
    loadingNextPage: false,
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

  function genCsrfToken(len = 16) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
    return out;
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

  function isBlacklisted(name) {
    return Boolean(name && state.blacklist.some((b) => b.name === name));
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

      body.dark-layout {
        --nsc-bg-nav: rgba(30, 31, 34, 0.84);
        --nsc-bg-list: rgba(36, 37, 41, 0.88);
        --nsc-bg-chat: rgba(24, 25, 28, 0.86);
        --nsc-bg-right: rgba(36, 37, 41, 0.88);
        --nsc-bg-card: rgba(44, 45, 50, 0.94);
        --nsc-bubble-other: #2c2d32;
        --nsc-bubble-self: #0a84ff;
        --nsc-bubble-self-text: #ffffff;
        --nsc-bubble-op: #2f2a20;
        --nsc-thread-bg: rgba(40, 41, 46, 0.88);
        --nsc-quote-bg: rgba(255, 255, 255, 0.07);
        --nsc-border: rgba(255, 255, 255, 0.10);
        --nsc-text: #f5f5f7;
        --nsc-muted: #98989d;
        --nsc-accent: #0a84ff;
        --nsc-accent-soft: rgba(10, 132, 255, 0.18);
        --nsc-green: #30d158;
        --nsc-hover: rgba(255, 255, 255, 0.07);
        --nsc-active-item: rgba(10, 132, 255, 0.22);
        --nsc-shadow: 0 24px 70px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08);
      }

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
        display: flex; align-items: center; gap: 6px; padding: 1px 6px 6px; flex: 0 0 auto;
      }
      .nsc-mac-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; box-shadow: inset 0 0 0 0.5px rgba(0,0,0,0.15); }
      .nsc-mac-dot.red { background: #ff5f56; }
      .nsc-mac-dot.yellow { background: #ffbd2e; }
      .nsc-mac-dot.green { background: #27c93f; }

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
      body.dark-layout .nsc-bubble { border-color: rgba(255, 255, 255, 0.08); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22); }
      .nsc-bubble p { margin: 4px 0; }
      .nsc-bubble > p:first-child { margin-top: 0; }
      .nsc-bubble > p:last-child { margin-bottom: 0; }
      .nsc-msg.is-right .nsc-bubble {
        border-radius: 14px 14px 4px 14px;
      }
      .nsc-msg.is-self .nsc-bubble {
        background: linear-gradient(180deg, #1686ff 0%, #007aff 100%);
        color: var(--nsc-bubble-self-text);
        border-radius: 14px 14px 4px 14px; border-color: transparent;
        box-shadow: 0 2px 8px rgba(0, 122, 255, 0.22);
      }
      .nsc-msg.is-self .nsc-bubble a { color: #e0f2fe; }
      .nsc-msg.is-op-card .nsc-bubble,
      .nsc-msg.is-op-bubble .nsc-bubble {
        background: var(--nsc-bubble-op); border-color: rgba(245, 158, 11, 0.26);
        border-radius: 14px 14px 14px 4px; width: fit-content;
      }

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

      /* TG 风格：默认隐藏，仅在已有赞/鸡腿时显示紧凑 Reaction 药丸 */
      .nsc-reactions { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
      .nsc-reactions:empty { display: none; }
      .nsc-react-pill {
        display: inline-flex; align-items: center; gap: 3px;
        padding: 1px 7px; border-radius: 999px;
        border: 1px solid var(--nsc-border); background: var(--nsc-bg-card);
        color: var(--nsc-muted); font-size: 11px; font-weight: 600; cursor: pointer;
        transition: all 0.14s ease;
      }
      .nsc-react-pill:hover { border-color: var(--nsc-accent); color: var(--nsc-accent); background: var(--nsc-accent-soft); }

      /* 悬停操作条内嵌在元信息行尾，不再飘出或重复数字 */
      .nsc-hover-bar {
        display: inline-flex; align-items: center; gap: 1px; padding: 1px 4px; margin-left: 4px;
        border-radius: 999px; border: 1px solid var(--nsc-border);
        background: var(--nsc-bg-card);
        opacity: 0; pointer-events: none;
        transition: opacity 0.1s linear;
        white-space: nowrap; flex: 0 0 auto;
      }
      .nsc-msg:hover > .nsc-msg-main > .nsc-msg-meta > .nsc-hover-bar,
      .nsc-msg-meta:hover > .nsc-hover-bar,
      .nsc-thread-item:hover > .nsc-thread-body > .nsc-thread-meta > .nsc-hover-bar,
      .nsc-thread-meta:hover > .nsc-hover-bar {
        opacity: 1; pointer-events: auto;
      }
      .nsc-hb-btn {
        border: none; background: transparent; color: var(--nsc-muted);
        height: 20px; min-width: 22px; padding: 0 4px; border-radius: 999px;
        font-size: 11.5px; display: inline-flex; align-items: center; justify-content: center;
        cursor: pointer; line-height: 1;
      }
      .nsc-hb-btn svg { width: 12px; height: 12px; }
      .nsc-hb-btn:hover { background: var(--nsc-accent-soft); color: var(--nsc-accent); }

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
          for (const im of imgs.slice(0, 30)) {
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
              if (typeof openLightbox === "function") openLightbox(directUrl);
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

  function buildShellIfNeeded() {
    if (state.shellBuilt) return;
    state.shellBuilt = true;

    const shell = document.createElement("div");
    shell.id = "nsc-app-shell";
    shell.innerHTML = `
      <nav class="nsc-pane-nav">
        <div class="nsc-mac-traffic" aria-hidden="true">
          <span class="nsc-mac-dot red"></span>
          <span class="nsc-mac-dot yellow"></span>
          <span class="nsc-mac-dot green"></span>
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
          <div class="nsc-chat-title-wrap">
            <div class="nsc-chat-title" id="nsc-chat-title">NodeSeek 群聊阅读</div>
            <div class="nsc-chat-subtitle" id="nsc-chat-subtitle">点击左侧帖子主题开始阅读</div>
          </div>
          <div class="nsc-chat-actions" id="nsc-chat-actions"></div>
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
          <a class="nsc-quick-btn" id="nsc-qb-lucky" href="/lucky" target="_blank" rel="noopener noreferrer" title="幸运抽奖">抽奖</a>
          <a class="nsc-quick-btn" id="nsc-qb-invite" href="/invite" target="_blank" rel="noopener noreferrer" title="邀请好友">邀请</a>
        </div>
        <div class="nsc-right-tabs">
          <button type="button" class="nsc-right-tab ${state.rightTab === "hot" ? "is-active" : ""}" data-rtab="hot">热榜</button>
          <button type="button" class="nsc-right-tab ${state.rightTab === "friends" ? "is-active" : ""}" data-rtab="friends">好友</button>
          <button type="button" class="nsc-right-tab ${state.rightTab === "fans" ? "is-active" : ""}" data-rtab="fans">粉丝</button>
          <button type="button" class="nsc-right-tab ${state.rightTab === "blacklist" ? "is-active" : ""}" data-rtab="blacklist">黑名单</button>
        </div>
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
        <div class="nsc-lb-frame" id="nsc-lb-frame">
          <button type="button" id="nsc-lb-prev" class="nsc-lb-nav prev" title="上一张 (←)">‹</button>
          <img id="nsc-lightbox-img" src="" alt="原图" />
          <button type="button" id="nsc-lb-next" class="nsc-lb-nav next" title="下一张 (→)">›</button>
        </div>
      </div>
      <div class="nsc-lightbox-bar">
        <button type="button" id="nsc-lb-bar-prev" class="nsc-lightbox-btn">‹ 上一张</button>
        <span id="nsc-lb-count" class="nsc-lightbox-count"></span>
        <button type="button" id="nsc-lb-bar-next" class="nsc-lightbox-btn">下一张 ›</button>
        <button type="button" id="nsc-lb-zoom" class="nsc-lightbox-btn" title="点击重置适应窗口">100%</button>
        <button type="button" id="nsc-lb-orig" class="nsc-lightbox-btn" title="按原图 1:1 尺寸查看并可拖拽">原图 1:1</button>
        <button type="button" id="nsc-lb-copy" class="nsc-lightbox-btn">复制链接</button>
        <a id="nsc-lightbox-raw" class="nsc-lightbox-btn" href="" target="_blank" rel="noopener noreferrer">新窗口打开原图</a>
        <button type="button" id="nsc-lightbox-close" class="nsc-lightbox-btn">关闭 (Esc)</button>
      </div>
    `;
    const lbImg = lightbox.querySelector("#nsc-lightbox-img");
    const lbStage = lightbox.querySelector("#nsc-lb-stage");
    const applyLbTransform = () => {
      lbImg.style.transform = `translate(${_lbTx}px, ${_lbTy}px) scale(${_lbScale})`;
      lbImg.classList.toggle("is-pannable", _lbScale > 1.02);
      lbImg.style.cursor = _lbScale > 1.02 ? (_lbDragging ? "grabbing" : "grab") : "zoom-in";
      const zBtn = document.getElementById("nsc-lb-zoom");
      if (zBtn) zBtn.textContent = `${Math.round(_lbScale * 100)}%`;
    };
    window.__nscApplyLbTransform = applyLbTransform;

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox || e.target === lbStage || e.target.id === "nsc-lightbox-close") {
        lightbox.classList.remove("is-open");
      }
    });
    lbStage.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.18 : -0.18;
      _lbScale = Math.min(5, Math.max(0.4, Number((_lbScale + delta).toFixed(2))));
      if (_lbScale <= 1) { _lbTx = 0; _lbTy = 0; }
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
      if (_lbScale > 1.02) {
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
      if (_lbScale > 1.02) {
        _lbScale = 1;
        _lbTx = 0;
        _lbTy = 0;
      } else {
        const natScale = lbImg.naturalWidth && lbImg.clientWidth ? Math.min(3.5, Math.max(1.5, lbImg.naturalWidth / lbImg.clientWidth)) : 1.8;
        _lbScale = Number(natScale.toFixed(2));
        _lbTx = 0;
        _lbTy = 0;
      }
      applyLbTransform();
    });
    lightbox.querySelector("#nsc-lb-zoom").addEventListener("click", (e) => {
      e.stopPropagation();
      _lbScale = 1;
      _lbTx = 0;
      _lbTy = 0;
      applyLbTransform();
    });
    lightbox.querySelector("#nsc-lb-orig").addEventListener("click", (e) => {
      e.stopPropagation();
      if (_lbScale > 1.02) {
        _lbScale = 1;
        _lbTx = 0;
        _lbTy = 0;
      } else {
        const natScale = lbImg.naturalWidth && lbImg.clientWidth ? Math.min(4, Math.max(1.6, lbImg.naturalWidth / lbImg.clientWidth)) : 2;
        _lbScale = Number(natScale.toFixed(2));
        _lbTx = 0;
        _lbTy = 0;
      }
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
            <div class="nsc-mde-toolbar" id="nsc-np-toolbar">
              <button type="button" class="nsc-mde-btn" data-wrap="**" title="加粗">B</button>
              <button type="button" class="nsc-mde-btn" data-wrap="*" title="斜体">I</button>
              <button type="button" class="nsc-mde-btn" data-wrap="~~" title="删除线">S</button>
              <button type="button" class="nsc-mde-btn" data-prefix="> " title="引用">"</button>
              <button type="button" class="nsc-mde-btn" data-wrap="\`" title="行内代码">&lt;/&gt;</button>
              <button type="button" class="nsc-mde-btn" data-tpl="\`\`\`\n\n\`\`\`" title="代码块">{ }</button>
              <button type="button" class="nsc-mde-btn" data-tpl="[链接文字](https://)" title="链接">🔗</button>
              <button type="button" class="nsc-mde-btn" data-tpl="![](https://)" title="图片">🖼</button>
              <button type="button" class="nsc-mde-btn" id="nsc-np-exp-btn" title="插入贴图表情">${ICONS.smile}</button>
              <button type="button" class="nsc-nodeimage-btn" data-ni-btn="newpost" title="NodeImage 图床上传/管理" style="margin-left:auto;"><span class="nsc-ni-dot"></span>图床</button>
            </div>
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

    npBackdrop.querySelectorAll("#nsc-np-toolbar .nsc-mde-btn").forEach((b) => {
      b.addEventListener("click", () => {
        const s = npContent.selectionStart || 0;
        const e = npContent.selectionEnd || 0;
        const sel = npContent.value.slice(s, e);
        let ins = "";
        if (b.dataset.wrap) ins = `${b.dataset.wrap}${sel || "文本"}${b.dataset.wrap}`;
        else if (b.dataset.prefix) ins = `${b.dataset.prefix}${sel}`;
        else if (b.dataset.tpl) ins = b.dataset.tpl;
        npContent.setRangeText(ins, s, e, "end");
        npContent.focus();
      });
    });

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

    initNodeImageUi(npBackdrop);
    const npEditorEl = npBackdrop.querySelector(".nsc-newpost-editor");
    if (npEditorEl) {
      npEditorEl.style.position = "relative";
      attachStickerPicker(npBackdrop.querySelector("#nsc-np-exp-btn"), npContent, npEditorEl);
    }

    shell.querySelector("#nsc-feed-search").addEventListener("input", (e) => {
      state.searchKeyword = e.target.value.trim().toLowerCase();
      renderTopicList();
    });

    shell.querySelectorAll(".nsc-right-tab").forEach((b) => {
      b.addEventListener("click", () => {
        state.rightTab = b.dataset.rtab;
        localStorage.setItem(LS.RIGHT_TAB, state.rightTab);
        shell.querySelectorAll(".nsc-right-tab").forEach((x) => x.classList.toggle("is-active", x === b));
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

    const topicScroll = shell.querySelector("#nsc-topic-scroll");
    topicScroll.addEventListener("scroll", () => {
      if (topicScroll.scrollHeight - topicScroll.scrollTop - topicScroll.clientHeight < 240) {
        tryAutoLoadNextTopicPage();
      }
    });

    const msgsEl = shell.querySelector("#nsc-chat-messages");
    msgsEl.addEventListener("scroll", () => {
      if (msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 220) {
        tryAutoLoadNextPage();
      }
    });

    renderLeftNav();
  }


  function attachStickerPicker(btnEl, textareaEl, hostEl) {
    if (!btnEl || !textareaEl || !hostEl) return;
    const pop = document.createElement("div");
    pop.className = "nsc-fb-exp-pop";
    let activeId = STICKER_GROUPS[0].id;
    pop.innerHTML = `
      <div class="nsc-fb-exp-tabs">
        ${STICKER_GROUPS.map((g) => `<button type="button" class="nsc-fb-exp-tab ${g.id === activeId ? "is-active" : ""}" data-sg="${g.id}">${g.label}</button>`).join("")}
      </div>
      <div class="nsc-fb-exp-grid"></div>
    `;
    const grid = pop.querySelector(".nsc-fb-exp-grid");
    const renderStickers = (gid) => {
      activeId = gid;
      pop.querySelectorAll(".nsc-fb-exp-tab").forEach((t) => t.classList.toggle("is-active", t.dataset.sg === gid));
      const grp = STICKER_GROUPS.find((g) => g.id === gid) || STICKER_GROUPS[0];
      grid.innerHTML = "";
      for (const file of grp.files) {
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
    pop.querySelectorAll(".nsc-fb-exp-tab").forEach((t) => {
      t.addEventListener("click", (e) => {
        e.stopPropagation();
        renderStickers(t.dataset.sg);
      });
    });
    btnEl.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!grid.hasChildNodes()) renderStickers(activeId);
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
      <div class="nsc-mde-toolbar" style="border-radius:10px 10px 0 0;background:var(--nsc-hover);">
        <button type="button" class="nsc-mde-btn" data-wrap="**" title="加粗">B</button>
        <button type="button" class="nsc-mde-btn" data-wrap="*" title="斜体">I</button>
        <button type="button" class="nsc-mde-btn" data-wrap="~~" title="删除线">S</button>
        <button type="button" class="nsc-mde-btn" data-prefix="> " title="引用">"</button>
        <button type="button" class="nsc-mde-btn" data-wrap="\`" title="代码">&lt;/&gt;</button>
        <button type="button" class="nsc-mde-btn" data-tpl="[链接文字](https://)" title="链接">🔗</button>
        <button type="button" class="nsc-mde-btn" data-tpl="![](https://)" title="图片">🖼</button>
        <button type="button" class="nsc-mde-btn" id="nsc-fb-exp-btn" title="插入贴图表情">${ICONS.smile}</button>
      </div>
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
    box.querySelectorAll(".nsc-mde-btn").forEach((b) => {
      b.addEventListener("click", () => {
        const s = ta.selectionStart || 0;
        const e = ta.selectionEnd || 0;
        const sel = ta.value.slice(s, e);
        let ins = "";
        if (b.dataset.wrap) ins = `${b.dataset.wrap}${sel || "文本"}${b.dataset.wrap}`;
        else if (b.dataset.prefix) ins = `${b.dataset.prefix}${sel}`;
        else if (b.dataset.tpl) ins = b.dataset.tpl;
        ta.setRangeText(ins, s, e, "end");
        ta.focus();
      });
    });

    const submitComment = async () => {
      const content = ta.value.trim();
      const pid = state.currentPostId;
      if (!content || !pid) return;
      const btn = box.querySelector("#nsc-fallback-send");
      const status = box.querySelector("#nsc-composer-status");
      btn.disabled = true;
      btn.textContent = "发送中...";
      try {
        const resp = await fetch("/api/content/new-comment", {
          method: "POST",
          credentials: "include",
          headers: getNodeSeekPostHeaders(),
          body: JSON.stringify({ content, mode: "new-comment", postId: Number(pid) }),
        });
        const resJson = await resp.json().catch(() => ({}));
        if (!resp.ok || resJson.success === false) {
          throw new Error(resJson.message || `HTTP ${resp.status}`);
        }
        ta.value = "";
        status.textContent = "评论已发布，正在同步最新楼层...";
        if (state.currentRoom) {
          const lastPage = state.currentRoom.pages.length || 1;
          const targetUrl = `/post-${pid}-${lastPage}`;
          const pResp = await fetch(targetUrl, { credentials: "include" });
          if (pResp.ok) {
            const pDoc = new DOMParser().parseFromString(await pResp.text(), "text/html");
            const seen = new Set(state.currentRoom.flatComments.map((c) => c.floorId));
            for (const el of pDoc.querySelectorAll("ul.comments li.content-item")) {
              const obj = extractCommentObject(el, false, lastPage);
              if (obj.floorId && !seen.has(obj.floorId)) {
                seen.add(obj.floorId);
                if (state.opAuthor && obj.author === state.opAuthor) obj.isOp = true;
                state.currentRoom.flatComments.push(obj);
              }
            }
            renderChatRoom(state.currentRoom, true);
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
      <div class="nsc-mde-toolbar" id="nsc-pm-toolbar">
        <button type="button" class="nsc-mde-btn" data-wrap="**" title="加粗">B</button>
        <button type="button" class="nsc-mde-btn" data-wrap="*" title="斜体">I</button>
        <button type="button" class="nsc-mde-btn" data-wrap="~~" title="删除线">S</button>
        <button type="button" class="nsc-mde-btn" data-prefix="> " title="引用">"</button>
        <button type="button" class="nsc-mde-btn" data-wrap="\`" title="行内代码">&lt;/&gt;</button>
        <button type="button" class="nsc-mde-btn" data-tpl="\`\`\`\n\n\`\`\`" title="代码块">{ }</button>
        <button type="button" class="nsc-mde-btn" data-prefix="- " title="列表">•</button>
        <button type="button" class="nsc-mde-btn" data-tpl="[链接文字](https://)" title="链接">🔗</button>
        <button type="button" class="nsc-mde-btn" data-tpl="![](https://)" title="图片链接">🖼</button>
      </div>
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

    box.querySelectorAll("#nsc-pm-toolbar .nsc-mde-btn").forEach((b) => {
      b.addEventListener("click", () => {
        const s = ta.selectionStart || 0;
        const e = ta.selectionEnd || 0;
        const sel = ta.value.slice(s, e);
        let ins = "";
        if (b.dataset.wrap) ins = `${b.dataset.wrap}${sel || "文本"}${b.dataset.wrap}`;
        else if (b.dataset.prefix) ins = `${b.dataset.prefix}${sel}`;
        else if (b.dataset.tpl) ins = b.dataset.tpl;
        ta.setRangeText(ins, s, e, "end");
        ta.focus();
      });
    });

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
    const composerBody = document.getElementById("nsc-composer-body");
    if (!composerBody) return;
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
        if (!state.currentRoom || state.currentPostId !== state.nativePostId) return;
        const pid = state.currentPostId;
        const syncAfterSubmit = async () => {
          const lastPage = Math.max(1, (state.currentRoom && state.currentRoom.pages.length) || 1);
          try {
            const resp = await fetch(`/post-${pid}-${lastPage}`, { credentials: "include" });
            if (!resp.ok || !state.currentRoom || state.currentPostId !== pid) return;
            const pDoc = new DOMParser().parseFromString(await resp.text(), "text/html");
            const seen = new Set(state.currentRoom.flatComments.map((c) => c.floorId));
            let added = 0;
            for (const el of pDoc.querySelectorAll("ul.comments li.content-item")) {
              const obj = extractCommentObject(el, false, lastPage);
              if (obj.floorId && !seen.has(obj.floorId)) {
                seen.add(obj.floorId);
                if (state.opAuthor && obj.author === state.opAuthor) obj.isOp = true;
                state.currentRoom.flatComments.push(obj);
                added++;
              }
            }
            if (added > 0) {
              renderChatRoom(state.currentRoom, true);
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
  let _lbScale = 1;
  let _lbTx = 0;
  let _lbTy = 0;
  let _lbDragging = false;
  let _lbMoved = false;
  let _lbStartX = 0;
  let _lbStartY = 0;

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
    _lbScale = 1;
    _lbTx = 0;
    _lbTy = 0;
    if (typeof window.__nscApplyLbTransform === "function") window.__nscApplyLbTransform();
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
      _lbGallery = imgs.length > 0 ? Array.from(new Set(imgs)) : [src];
    }
    const idx = _lbGallery.indexOf(src);
    showLightboxAt(idx >= 0 ? idx : 0);
  }

  function enhanceMagicTabs(containerEl) {
    if (!containerEl) return;
    for (const tabBox of containerEl.querySelectorAll(".nsk-magic-tabs")) {
      if (tabBox.dataset.nscTabsInit === "1") continue;
      tabBox.dataset.nscTabsInit = "1";

      const titles = Array.from(tabBox.querySelectorAll(".nsk-magic-tab-title"));
      const bodies = Array.from(tabBox.querySelectorAll(".nsk-magic-tab-body"));
      if (titles.length === 0 || bodies.length === 0) continue;

      if (!tabBox.querySelector(".nsc-magic-tab-bar") && titles[0].parentElement === tabBox) {
        const bar = document.createElement("div");
        bar.className = "nsc-magic-tab-bar";
        tabBox.insertBefore(bar, tabBox.firstChild);
        for (const t of titles) bar.appendChild(t);
      }

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
      if (!img.closest('blockquote, pre, code, table, details, .nsk-magic-tabs, .nsk-magic-tab-body, [class*="magic-tab"], [class*="tab-content"], [class*="tab-body"], [class*="tab-pane"], [role="tabpanel"]')) {
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
      if (el.matches('blockquote, pre, code, table, details, .nsk-magic-tabs, .nsk-magic-tab-body, [class*="magic-tab"], [class*="tab-content"], [class*="tab-body"], [class*="tab-pane"], [role="tabpanel"], .nsc-img-grid')) {
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
        grid.className = "nsc-img-grid" + (imgsInRun.length === 2 || imgsInRun.length === 4 ? " cols-2" : "");
        containerEl.insertBefore(grid, run[0]);
        for (const el of run) {
          if (el.tagName === "IMG") {
            grid.appendChild(el);
          } else {
            for (const im of el.querySelectorAll("img.nsc-zoomable-img")) grid.appendChild(im);
            el.remove();
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

  // ==========================================================================
  // Module: 06-channels-messages.js
  // ==========================================================================
  function renderLeftNav() {
    const nav = document.getElementById("nsc-pane-nav");
    if (!nav) return;
    nav.innerHTML = "";

    CHANNELS.forEach((ch, idx) => {
      if (idx === 3 || idx === 7) {
        const div = document.createElement("div");
        div.className = "nsc-nav-divider";
        nav.appendChild(div);
      }
      const btn = document.createElement("button");
      btn.type = "button";
      const grpCls = `group-${ch.group || "board"}`;
      btn.className = `nsc-nav-item ${grpCls}` + (state.activeChannel === ch.id ? " is-active" : "");
      const unread = getChannelUnreadCount(ch.id);
      btn.innerHTML = `
        <span class="nsc-nav-left">${ch.icon}<span>${ch.name}</span></span>
        ${unread > 0 ? `<span class="nsc-nav-badge">${unread > 99 ? "99+" : unread}</span>` : ""}
      `;
      btn.addEventListener("click", () => switchChannel(ch.id));
      nav.appendChild(btn);
    });
  }

  async function fetchUnreadCounts() {
    try {
      const resp = await fetch("/api/notification/unread-count", {
        headers: { Accept: "application/json, text/plain, */*" },
        credentials: "include",
      });
      if (!resp.ok) return;
      const data = await resp.json().catch(() => null);
      if (data && data.unreadCount) {
        const totalMsg = Number(data.unreadCount.message) || 0;
        const sysUnread = state.sysNoticeList.loaded ? Number(state.unreadCounts.sysNotice) || 0 : 0;
        state.unreadCounts = {
          atMe: Number(data.unreadCount.atMe) || 0,
          reply: Number(data.unreadCount.reply) || 0,
          message: Math.max(0, totalMsg - sysUnread),
          sysNotice: sysUnread,
        };
        renderLeftNav();
      }
    } catch (_) {}
  }

  function mountNativeWidgetsIntoApp() {
    const rightUserHost = document.getElementById("nsc-right-user");
    const nativeUserCard = document.querySelector("#nsk-right-panel-container .user-card");
    if (rightUserHost && nativeUserCard && !rightUserHost.contains(nativeUserCard)) {
      rightUserHost.appendChild(nativeUserCard);
    }

    const themeBtn = document.querySelector('#nsc-right-user .user-card a[title="切换主题模式"]');
    if (themeBtn && themeBtn.dataset.nscThemeFixed !== "1") {
      themeBtn.dataset.nscThemeFixed = "1";
      if (!themeBtn.querySelector("svg")) {
        themeBtn.innerHTML = ICONS.theme;
      }
      themeBtn.addEventListener("click", (e) => {
        const headThemeBtn = document.querySelector("#nsk-head .color-theme-switcher");
        if (headThemeBtn && e.isTrusted) {
          e.preventDefault();
          headThemeBtn.click();
        }
      });
    }

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
    } else {
      syncComposerMode(isPostPath(location.pathname) && (!state.currentPostId || state.currentPostId === state.nativePostId));
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
    const rightPanel = document.getElementById("nsk-right-panel-container");
    const userCard = document.querySelector("#nsc-right-user .user-card");
    if (rightPanel && userCard) {
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
        setTimeout(() => prefetchUnreadBadges(["home", "daily", "tech", "info"]), 1200);
      }

      if (isPostPath(location.pathname)) {
        const pid = getPostIdFromPath(location.pathname);
        state.nativePostId = pid;
        if (!state.activePmPeer && (!state.currentPostId || (firstInit && state.currentPostId === pid))) {
          renderPostDocument(document, location.pathname, true);
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
      if (forceRefresh || !st.loaded) fetchNotifications(channelId);
      else renderTopicList();
      return;
    }

    if (channelId === "pm") {
      if (forceRefresh || !state.pmList.loaded) fetchPmList();
      else renderTopicList();
      return;
    }

    if (channelId === "sys-notice") {
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

    const endpoint = kind === "at-me" ? "/api/notification/at-me/list" : "/api/notification/reply-to-me/list";
    try {
      const resp = await fetch(endpoint, {
        headers: { Accept: "application/json, text/plain, */*" },
        credentials: "include",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const raw = Array.isArray(json.data) ? json.data : Array.isArray(json.notifications) ? json.notifications : [];
      store.items = raw.map((it) => {
        const uid = String(it.commenter_id || it.member_id || it.uid || "");
        const postId = String(it.post_id || "");
        const floorId = Number(it.floor_id) || 0;
        const pageIndex = floorId > 0 ? Math.ceil(floorId / 20) : 1;
        return {
          id: Number(it.id) || 0,
          postId,
          floorId,
          url: `/post-${postId}-${pageIndex}`,
          title: it.title || `帖子 #${postId}`,
          author: it.commenter_name || it.member_name || "Seeker",
          uid,
          avatar: uid ? `/avatar/${uid}.png` : "",
          timeText: formatChineseTime("", it.created_at, ""),
          viewed: it.viewed === 1 || it.viewed === true,
        };
      });
      store.loaded = true;
    } catch (err) {
      store.error = err.message;
    } finally {
      store.loading = false;
      if (state.activeChannel === kind) renderTopicList();
    }
  }

  async function markNotificationViewed(kind, id, all = false) {
    const api = kind === "at-me" ? "/api/notification/at-me/markViewed" : "/api/notification/reply-to-me/markViewed";
    try {
      const url = all ? `${api}?all=true` : api;
      const body = all ? {} : kind === "at-me" ? { atMe: [Number(id)] } : { replyToMe: [Number(id)] };
      await fetch(url, { method: "POST", credentials: "include", headers: getNodeSeekPostHeaders(), body: JSON.stringify(body) });
      const store = state.notifData[kind];
      if (store) {
        if (all) store.items.forEach((x) => { x.viewed = true; });
        else {
          const hit = store.items.find((x) => x.id === Number(id));
          if (hit) hit.viewed = true;
        }
      }
      fetchUnreadCounts();
      if (state.activeChannel === kind) renderTopicList();
    } catch (_) {}
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
    }
  }

  async function openPmConversation(peer) {
    if (!peer || !peer.uid) return;
    detectCurrentUser();
    state.activePmPeer = {
      uid: String(peer.uid),
      name: peer.name || peer.author || `用户 ${peer.uid}`,
      avatar: peer.avatar || `/avatar/${peer.uid}.png`,
    };
    state.currentPostId = null;
    renderTopicList();
    syncComposerMode("pm");

    const titleEl = document.getElementById("nsc-chat-title");
    const subEl = document.getElementById("nsc-chat-subtitle");
    const actionsEl = document.getElementById("nsc-chat-actions");
    const msgsEl = document.getElementById("nsc-chat-messages");
    if (titleEl) titleEl.textContent = `私信：${state.activePmPeer.name}`;
    if (subEl) subEl.innerHTML = `<span>UID: ${state.activePmPeer.uid}</span><span>与 ${state.activePmPeer.name} 的站内对话</span>`;
    if (actionsEl) {
      actionsEl.innerHTML = "";
      const refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.className = "nsc-pill-btn";
      refBtn.textContent = "刷新记录";
      refBtn.addEventListener("click", () => openPmConversation(state.activePmPeer));
      const profBtn = document.createElement("button");
      profBtn.type = "button";
      profBtn.className = "nsc-pill-btn";
      profBtn.textContent = "TA的名片";
      profBtn.addEventListener("click", () => openUserProfileModal(state.activePmPeer));
      actionsEl.appendChild(refBtn);
      actionsEl.appendChild(profBtn);
    }
    if (msgsEl) msgsEl.innerHTML = `<div class="nsc-empty-state">正在读取私信聊天记录...</div>`;

    try {
      const resp = await fetch(`/api/notification/message/with/${peer.uid}`, {
        headers: { Accept: "application/json, text/plain, */*" },
        credentials: "include",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
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
          const hit = state.pmList.items.find((x) => x.uid === String(peer.uid));
          if (hit) hit.unread = false;
          fetchUnreadCounts();
          if (state.activeChannel === "pm") renderTopicList();
        }).catch(() => {});
      }
    } catch (err) {
      if (msgsEl) msgsEl.innerHTML = `<div class="nsc-empty-state">读取私信失败：${err.message}</div>`;
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
      if (pmBubble) processBubbleImages(pmBubble);
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

    btn.disabled = true;
    btn.textContent = "发送中...";
    if (status) status.textContent = "正在发送私信...";
    try {
      const resp = await fetch("/api/notification/message/send", {
        method: "POST",
        credentials: "include",
        headers: getNodeSeekPostHeaders(),
        body: JSON.stringify({ receiverUid: Number(peer.uid), content, markdown: true }),
      });
      const resJson = await resp.json().catch(() => ({}));
      if (!resp.ok || resJson.success === false) {
        throw new Error(resJson.message || `HTTP ${resp.status}`);
      }
      ta.value = "";
      if (status) status.textContent = "发送成功";
      await openPmConversation(peer);
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

  function escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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
              saveJson(LS.POST_TITLE_CACHE, state.postTitleCache);
              for (const item of state.sysNoticeList.items) {
                if (item.firstPost && item.firstPost.postId === pid) {
                  const reParsed = formatSysNoticeHtml(item.content);
                  item.html = reParsed.html;
                  item.firstPost = reParsed.firstPost;
                  item.tag = reParsed.tag;
                }
              }
              if (state.activeChannel === "sys-notice") renderTopicList();
            }
          }
        } catch (_) {}
        await new Promise((r) => setTimeout(r, 260));
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
      state.unreadCounts.sysNotice = items.filter((x) => x.unread).length;
      renderLeftNav();
      if (!silent && state.activeChannel === "sys-notice") {
        setTimeout(() => enrichSysNoticeTitles(), 120);
      }
    } catch (err) {
      state.sysNoticeList.error = err.message;
    } finally {
      state.sysNoticeList.loading = false;
      if (state.activeChannel === "sys-notice") renderTopicList();
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
      state.unreadCounts.sysNotice = state.sysNoticeList.items.filter((x) => x.unread).length;
      renderLeftNav();
      if (state.activeChannel === "sys-notice") renderTopicList();
    } catch (_) {}
  }

  function renderListToolbar() {
    const bar = document.getElementById("nsc-list-toolbar");
    if (!bar) return;
    bar.innerHTML = "";

    if (state.activeChannel === "history") {
      const tip = document.createElement("span");
      tip.style.cssText = "font-size:11px;color:var(--nsc-muted);";
      tip.textContent = "按最近阅读倒序";
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
        state.prioritizeUnread = false;
        renderListToolbar();
        fetchChannelData(state.activeChannel, 1, true, false);
      });
      seg.appendChild(b);
    });

    const rightBtns = document.createElement("div");
    rightBtns.style.cssText = "display:inline-flex;gap:4px;";

    const btnUnread = document.createElement("button");
    btnUnread.type = "button";
    btnUnread.className = "nsc-mini-btn" + (state.prioritizeUnread ? " is-active" : "");
    btnUnread.title = "刷新列表并把未读/有新回复帖子排在最前面";
    btnUnread.textContent = "未读";
    btnUnread.addEventListener("click", () => {
      state.prioritizeUnread = true;
      fetchChannelData(state.activeChannel, 1, true, false);
    });

    const btnReadHistory = document.createElement("button");
    btnReadHistory.type = "button";
    btnReadHistory.className = "nsc-mini-btn";
    btnReadHistory.title = "查看已读历史足迹";
    btnReadHistory.textContent = "已读";
    btnReadHistory.addEventListener("click", () => {
      switchChannel("history");
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
          if (!it.viewed && it.id) markNotificationViewed(kind, it.id, false);
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
            renderTopicList();
            const titleEl = document.getElementById("nsc-chat-title");
            const subChat = document.getElementById("nsc-chat-subtitle");
            const msgsEl = document.getElementById("nsc-chat-messages");
            if (titleEl) titleEl.textContent = `系统通知 · ${it.tag.label}`;
            if (subChat) subChat.textContent = it.timeText || "UID 5230";
            if (msgsEl) {
              msgsEl.innerHTML = `
                <div class="nsc-msg">
                  <div class="nsc-avatar-col"><button type="button" class="nsc-avatar-btn"><img src="/avatar/5230.png" alt="系统通知" /></button></div>
                  <div class="nsc-msg-main">
                    <div class="nsc-msg-meta"><span class="nsc-msg-author">系统通知</span><span class="${it.tag.cls}">${it.tag.label}</span><span>${it.timeText || ""}</span></div>
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

    if (state.activeChannel === "history") {
      items = Object.values(state.readMap).sort((a, b) => (b.ts || 0) - (a.ts || 0));
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

    if (state.prioritizeUnread && state.activeChannel !== "history") {
      items.sort((a, b) => {
        const ra = getReadStatus(a.postId, a.replies).status === "read" ? 1 : 0;
        const rb = getReadStatus(b.postId, b.replies).status === "read" ? 1 : 0;
        return ra - rb;
      });
    }

    if (subEl) subEl.textContent = `${items.length} 条`;

    if (items.length === 0) {
      scrollEl.innerHTML = `<div class="nsc-empty-state">${state.activeChannel === "history" ? "暂无已读足迹，点击打开任意帖子后会记录在这里" : "暂无匹配帖子"}</div>`;
      return;
    }

    scrollEl.innerHTML = "";
    items.forEach((it) => {
      const rs = state.activeChannel === "history" ? { status: "read", delta: 0 } : getReadStatus(it.postId, it.replies);
      const row = document.createElement("div");
      row.className =
        "nsc-topic-item" +
        (rs.status === "read" && state.activeChannel !== "history" ? " is-read" : "") +
        (state.currentPostId === it.postId ? " is-selected" : "");

      const avatarHtml = it.avatar
        ? `<img class="nsc-topic-avatar" src="${it.avatar}" loading="lazy" alt="" />`
        : `<div class="nsc-topic-avatar-fb">${(it.author || "S").slice(0, 1).toUpperCase()}</div>`;

      let badgeHtml = "";
      if (state.activeChannel === "history") {
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

    if (state.activeChannel !== "history") {
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

      // 搜索过滤结果较少时自动向下瀑布流预拉最多至第 4 页
      if (kw && items.length < 8 && chData && !chData.loading && !chData.noMore && page < 4) {
        setTimeout(() => tryAutoLoadNextTopicPage(), 80);
      }
    }
    restoreScroll();
  }

  // ==========================================================================
  // Module: 07-post-chat.js
  // ==========================================================================
  async function openPostInChat(itemMeta) {
    state.activePmPeer = null;
    const url = itemMeta.url || `/post-${itemMeta.postId}-1`;
    const pid = itemMeta.postId || getPostIdFromPath(url);
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
      const resp = await fetch(url, { credentials: "include" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const doc = new DOMParser().parseFromString(await resp.text(), "text/html");
      renderPostDocument(doc, url, pid === state.nativePostId, itemMeta);
      if (itemMeta.targetFloor) {
        setTimeout(() => jumpToFloor(itemMeta.targetFloor), 80);
      }
    } catch (err) {
      if (msgsEl) msgsEl.innerHTML = `<div class="nsc-empty-state">加载失败：${err.message}</div>`;
    }
  }

  function extractCommentObject(el, isOpFloor = false, pageNum = 1) {
    const floorId = isOpFloor ? "0" : String(el.id || "").trim();
    const commentId = String(el.getAttribute("data-comment-id") || "").trim();
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
    let likes = 0;
    let legs = 0;
    if (menu) {
      const likeItem = menu.querySelector('.menu-item[title="点赞"] span');
      const legItem = menu.querySelector('.menu-item[title="加鸡腿"] span');
      if (likeItem) likes = Number(likeItem.textContent.trim()) || 0;
      if (legItem) legs = Number(legItem.textContent.trim()) || 0;
    }

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
    const pid = getPostIdFromPath(url);
    const pageNum = parsePageNumFromUrl(url);
    state.currentPostId = pid;
    state.currentPostUrl = url;
    state.loadedPages = new Set([pageNum]);
    state.loadingNextPage = false;

    const titleEl = doc.querySelector(".nsk-post .post-title h1 a, .nsk-post .post-title h1");
    const title = titleEl ? titleEl.textContent.trim() : (itemHint && itemHint.title) || doc.title || "帖子详情";
    const catEl = doc.querySelector(".nsk-post .content-category a");
    const catName = catEl ? catEl.textContent.trim() : (itemHint && itemHint.category) || "";

    const pages = parsePagesFromDoc(doc, pid);

    const opNode = doc.querySelector(".nsk-post .content-item");
    const opObj = opNode ? extractCommentObject(opNode, true, 1) : null;
    if (opObj) state.opAuthor = opObj.author;
    else if (itemHint && itemHint.author) state.opAuthor = itemHint.author;

    const allCommentEls = Array.from(doc.querySelectorAll("ul.comments li.content-item"));
    const flatComments = [];
    const seenFloors = new Set();
    for (const el of allCommentEls) {
      const obj = extractCommentObject(el, false, pageNum);
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
    if (!room || state.loadingNextPage || !room.pages || room.pages.length <= 1) return;

    const maxLoaded = Math.max(...Array.from(state.loadedPages));
    const nextPageObj = room.pages.find((p) => p.num === maxLoaded + 1);
    if (!nextPageObj) return;

    state.loadingNextPage = true;
    const footerTip = document.getElementById("nsc-waterfall-status");
    if (footerTip) footerTip.textContent = `正在瀑布流预加载第 ${nextPageObj.num} 页...`;

    try {
      const resp = await fetch(nextPageObj.href, { credentials: "include" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const doc = new DOMParser().parseFromString(await resp.text(), "text/html");
      const seenFloors = new Set(room.flatComments.map((c) => c.floorId));
      let added = 0;
      for (const el of doc.querySelectorAll("ul.comments li.content-item")) {
        const obj = extractCommentObject(el, false, nextPageObj.num);
        if (obj.floorId && seenFloors.has(obj.floorId)) continue;
        if (obj.floorId) seenFloors.add(obj.floorId);
        if (state.opAuthor && obj.author === state.opAuthor) obj.isOp = true;
        room.flatComments.push(obj);
        added++;
      }
      state.loadedPages.add(nextPageObj.num);
      for (const np of parsePagesFromDoc(doc, room.pid)) {
        if (!room.pages.some((p) => p.num === np.num)) room.pages.push(np);
      }
      room.pages.sort((a, b) => a.num - b.num);
      if (added > 0) {
        const msgsEl = document.getElementById("nsc-chat-messages");
        const prevScroll = msgsEl ? msgsEl.scrollTop : 0;
        renderChatRoom(room, true);
        if (msgsEl) msgsEl.scrollTop = prevScroll;
      } else if (footerTip) {
        footerTip.textContent = `已加载第 ${Array.from(state.loadedPages).join("/")} 页`;
      }
    } catch (_) {
      if (footerTip) footerTip.textContent = "加载下一页失败";
    } finally {
      state.loadingNextPage = false;
    }
  }

  async function jumpToFloor(floorNumStr) {
    const targetId = String(floorNumStr || "").replace(/[^\d]/g, "");
    if (!targetId) return;

    const msgsEl = document.getElementById("nsc-chat-messages");
    let target =
      (msgsEl && msgsEl.querySelector(`[data-floor="${targetId}"]`)) ||
      document.getElementById(`nsc-floor-${targetId}`);

    if (!target && state.currentRoom && state.currentRoom.pages.length > 1) {
      const room = state.currentRoom;
      for (const p of room.pages) {
        if (state.loadedPages.has(p.num)) continue;
        try {
          const resp = await fetch(p.href, { credentials: "include" });
          if (!resp.ok) continue;
          const doc = new DOMParser().parseFromString(await resp.text(), "text/html");
          const seenFloors = new Set(room.flatComments.map((c) => c.floorId));
          for (const el of doc.querySelectorAll("ul.comments li.content-item")) {
            const obj = extractCommentObject(el, false, p.num);
            if (obj.floorId && !seenFloors.has(obj.floorId)) {
              seenFloors.add(obj.floorId);
              if (state.opAuthor && obj.author === state.opAuthor) obj.isOp = true;
              room.flatComments.push(obj);
            }
          }
          state.loadedPages.add(p.num);
        } catch (_) {}
      }
      room.flatComments.sort((a, b) => Number(a.floorId) - Number(b.floorId));
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
        if (node.parentElement && node.parentElement.closest("a, pre, code, script, style")) {
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

  function renderChatRoom(room, preserveScroll = false) {
    const titleEl = document.getElementById("nsc-chat-title");
    const subEl = document.getElementById("nsc-chat-subtitle");
    const actionsEl = document.getElementById("nsc-chat-actions");
    const msgsEl = document.getElementById("nsc-chat-messages");
    if (!titleEl || !msgsEl) return;

    titleEl.textContent = room.title;
    const totalPages = room.pages.length || 1;
    subEl.innerHTML = `
      ${room.catName ? `<span>版块: ${room.catName}</span>` : ""}
      <span>楼主: ${state.opAuthor || "查看首楼"}</span>
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

    const addBtn = (text, active, onClick) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "nsc-pill-btn" + (active ? " is-active" : "");
      b.textContent = text;
      b.addEventListener("click", () => onClick(b));
      actionsEl.appendChild(b);
      return b;
    };

    if (!room.opObj && room.pages.length > 0 && room.pages[0].href) {
      addBtn("展开首楼", false, async (b) => {
        b.disabled = true;
        b.textContent = "加载中...";
        try {
          const resp = await fetch(room.pages[0].href, { credentials: "include" });
          const doc = new DOMParser().parseFromString(await resp.text(), "text/html");
          const opNode = doc.querySelector(".nsk-post .content-item");
          if (opNode) {
            room.opObj = extractCommentObject(opNode, true, 1);
            state.opAuthor = room.opObj.author;
            renderChatRoom(room, true);
          }
        } catch (_) {
          b.textContent = "加载失败";
        }
      });
    }

    if (room.opObj && state.currentUser && room.opObj.author === state.currentUser) {
      addBtn("编辑主题", false, () => openEditModal(room.opObj, true));
    }

    addBtn("只看楼主", state.onlyOp, (b) => {
      state.onlyOp = !state.onlyOp;
      state.onlyMember = "";
      b.classList.toggle("is-active", state.onlyOp);
      applyMessageFilters();
    });

    addBtn(state.threadsCollapsed ? "展开楼中楼" : "收起楼中楼", state.threadsCollapsed, (b) => {
      state.threadsCollapsed = !state.threadsCollapsed;
      b.textContent = state.threadsCollapsed ? "展开楼中楼" : "收起楼中楼";
      b.classList.toggle("is-active", state.threadsCollapsed);
      for (const w of msgsEl.querySelectorAll(".nsc-thread-wrap")) {
        w.classList.toggle("is-collapsed", state.threadsCollapsed);
      }
      for (const t of msgsEl.querySelectorAll(".nsc-thread-toggle")) {
        t.textContent = state.threadsCollapsed ? `展开 ${t.dataset.count} 条楼中楼` : `收起 ${t.dataset.count} 条楼中楼`;
      }
    });

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
    if (room.opObj) {
      msgsEl.appendChild(createMessageNode(room.opObj, true, room.isNativePage));
    }

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
    const uids = Array.from(new Set(state.members.map((m) => m.uid).filter(Boolean))).slice(0, 15);
    for (const uid of uids) {
      if (state.userCache[uid] && Date.now() - state.userCache[uid].ts < 3600000) {
        syncUserBadgeToChatDom(uid, state.userCache[uid]);
        continue;
      }
      const info = await fetchUserProfile(uid, "");
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

  function renderReactionPills(reactionsEl, obj, isNativePage) {
    if (!reactionsEl) return;
    reactionsEl.innerHTML = "";
    if (obj.likes > 0) {
      const p = document.createElement("button");
      p.type = "button";
      p.className = "nsc-react-pill";
      p.title = "点击点赞";
      p.textContent = `👍 ${obj.likes}`;
      p.addEventListener("click", (e) => {
        e.stopPropagation();
        triggerReplyOrVote(obj, "点赞", isNativePage, reactionsEl);
      });
      reactionsEl.appendChild(p);
    }
    if (obj.legs > 0) {
      const p = document.createElement("button");
      p.type = "button";
      p.className = "nsc-react-pill";
      p.title = "点击加鸡腿";
      p.textContent = `🍗 ${obj.legs}`;
      p.addEventListener("click", (e) => {
        e.stopPropagation();
        triggerReplyOrVote(obj, "加鸡腿", isNativePage, reactionsEl);
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
              <div class="nsc-mde-toolbar" id="nsc-edit-toolbar">
                <button type="button" class="nsc-mde-btn" data-wrap="**" title="加粗">B</button>
                <button type="button" class="nsc-mde-btn" data-wrap="*" title="斜体">I</button>
                <button type="button" class="nsc-mde-btn" data-wrap="~~" title="删除线">S</button>
                <button type="button" class="nsc-mde-btn" data-prefix="> " title="引用">"</button>
                <button type="button" class="nsc-mde-btn" data-wrap="\`" title="行内代码">&lt;/&gt;</button>
                <button type="button" class="nsc-mde-btn" data-tpl="\`\`\`\n\n\`\`\`" title="代码块">{ }</button>
                <button type="button" class="nsc-mde-btn" data-tpl="[链接文字](https://)" title="链接">🔗</button>
                <button type="button" class="nsc-mde-btn" data-tpl="![](https://)" title="图片">🖼</button>
                <button type="button" class="nsc-mde-btn" id="nsc-edit-exp-btn" title="插入贴图表情">${ICONS.smile}</button>
                <button type="button" class="nsc-nodeimage-btn" id="nsc-edit-ni-btn" title="NodeImage 图床上传/管理" style="margin-left:auto;"><span class="nsc-ni-dot"></span>图床</button>
              </div>
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

      bd.querySelectorAll("#nsc-edit-toolbar .nsc-mde-btn[data-wrap], #nsc-edit-toolbar .nsc-mde-btn[data-prefix], #nsc-edit-toolbar .nsc-mde-btn[data-tpl]").forEach((b) => {
        b.addEventListener("click", () => {
          const s = edContent.selectionStart || 0;
          const e = edContent.selectionEnd || 0;
          const sel = edContent.value.slice(s, e);
          let ins = "";
          if (b.dataset.wrap) ins = `${b.dataset.wrap}${sel || "文本"}${b.dataset.wrap}`;
          else if (b.dataset.prefix) ins = `${b.dataset.prefix}${sel}`;
          else if (b.dataset.tpl) ins = b.dataset.tpl;
          edContent.setRangeText(ins, s, e, "end");
          edContent.focus();
        });
      });

      attachStickerPicker(bd.querySelector("#nsc-edit-exp-btn"), edContent, bd.querySelector(".nsc-newpost-editor"));
      bd.querySelector("#nsc-edit-ni-btn").addEventListener("click", () => openNodeImageModal("edit"));
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
          const pResp = await fetch(`/post-${curPid}-${targetPage}`, { credentials: "include" });
          if (pResp.ok && state.currentRoom && state.currentRoom.pid === curPid) {
            const pDoc = new DOMParser().parseFromString(await pResp.text(), "text/html");
            if (curIsTopic) {
              state.currentRoom.title = newTitle;
              const opEl = pDoc.querySelector(".nsk-post .content-item");
              if (opEl) {
                const updatedOp = extractCommentObject(opEl, true, 1);
                state.currentRoom.opObj = updatedOp;
              }
            } else {
              const updatedEl = pDoc.querySelector(`ul.comments li.content-item[id="${curObj.floorId}"]`) ||
                pDoc.querySelector(`ul.comments li.content-item[data-comment-id="${curObj.commentId}"]`);
              if (updatedEl) {
                const updatedObj = extractCommentObject(updatedEl, false, targetPage);
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

  function buildHoverBar(obj, isNativePage, reactionsEl, isThread = false, isOpCard = false) {
    const bar = document.createElement("div");
    bar.className = "nsc-hover-bar" + (isThread ? " is-thread-bar" : "");

    const btnLike = document.createElement("button");
    btnLike.type = "button";
    btnLike.className = "nsc-hb-btn";
    btnLike.title = "点赞";
    btnLike.textContent = "👍";
    btnLike.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerReplyOrVote(obj, "点赞", isNativePage, reactionsEl, bar);
    });

    const btnLeg = document.createElement("button");
    btnLeg.type = "button";
    btnLeg.className = "nsc-hb-btn";
    btnLeg.title = "加鸡腿";
    btnLeg.textContent = "🍗";
    btnLeg.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerReplyOrVote(obj, "加鸡腿", isNativePage, reactionsEl, bar);
    });

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
    btnReply.textContent = "💬";
    btnReply.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerReplyOrVote(obj, "回复", isNativePage, reactionsEl, bar);
    });

    bar.appendChild(btnLike);
    bar.appendChild(btnLeg);
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
    linkifyFloorReferences(bubble);
    enhanceMagicTabs(bubble);
    processBubbleImages(bubble);

    const reactionsEl = document.createElement("div");
    reactionsEl.className = "nsc-reactions";
    renderReactionPills(reactionsEl, obj, isNativePage);

    const hoverBar = buildHoverBar(obj, isNativePage, reactionsEl, false, isOpCard);
    meta.appendChild(hoverBar);
    bubbleRow.appendChild(bubble);

    mainCol.appendChild(meta);
    mainCol.appendChild(bubbleRow);
    mainCol.appendChild(reactionsEl);

    if (obj.children && obj.children.length > 0) {
      wrap.classList.add("has-thread");
      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "nsc-thread-toggle";
      toggleBtn.dataset.count = String(obj.children.length);
      toggleBtn.textContent = state.threadsCollapsed
        ? `展开 ${obj.children.length} 条楼中楼`
        : `收起 ${obj.children.length} 条楼中楼`;

      const threadWrap = document.createElement("div");
      threadWrap.className = "nsc-thread-wrap" + (state.threadsCollapsed ? " is-collapsed" : "");

      toggleBtn.addEventListener("click", () => {
        const collapsed = threadWrap.classList.toggle("is-collapsed");
        toggleBtn.textContent = collapsed
          ? `展开 ${obj.children.length} 条楼中楼`
          : `收起 ${obj.children.length} 条楼中楼`;
      });

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
        linkifyFloorReferences(tc);
        enhanceMagicTabs(tc);
        processBubbleImages(tc);
        const chReactions = ti.querySelector(".nsc-reactions");
        renderReactionPills(chReactions, ch, isNativePage);
        const chBar = buildHoverBar(ch, isNativePage, chReactions, true);
        const chMeta = ti.querySelector(".nsc-thread-meta");
        if (chMeta) chMeta.appendChild(chBar);
        threadWrap.appendChild(ti);
      }

      mainCol.appendChild(toggleBtn);
      mainCol.appendChild(threadWrap);
    }

    wrap.appendChild(avatarCol);
    wrap.appendChild(mainCol);
    return wrap;
  }

  async function triggerReplyOrVote(obj, actionTitle, isNativePage, reactionsEl, hoverBar) {
    const syncBarCnt = () => {
      if (reactionsEl) renderReactionPills(reactionsEl, obj, isNativePage);
    };

    if (isNativePage) {
      const nativeLi = document.querySelector(`#nsk-frame [id="${obj.floorId}"].content-item`);
      if (nativeLi) {
        const menuItems = Array.from(nativeLi.querySelectorAll(".comment-menu .menu-item"));
        const target = menuItems.find(
          (m) => (m.getAttribute("title") || "") === actionTitle || (m.textContent || "").includes(actionTitle)
        );
        if (target) {
          target.click();
          if (actionTitle === "点赞" || actionTitle === "加鸡腿") {
            setTimeout(() => {
              const likeSpan = nativeLi.querySelector('.comment-menu .menu-item[title="点赞"] span');
              const legSpan = nativeLi.querySelector('.comment-menu .menu-item[title="加鸡腿"] span');
              if (likeSpan) obj.likes = Number(likeSpan.textContent.trim()) || obj.likes;
              if (legSpan) obj.legs = Number(legSpan.textContent.trim()) || obj.legs;
              syncBarCnt();
            }, 350);
          } else if (actionTitle === "引用" || actionTitle === "回复") {
            setTimeout(() => {
              const pageWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
              const cmEl =
                (pageWin.document && pageWin.document.querySelector("#nsc-composer-body .md-editor .CodeMirror")) ||
                document.querySelector("#nsc-composer-body .md-editor .CodeMirror");
              const cm = cmEl && (cmEl.CodeMirror || (cmEl.wrappedJSObject && cmEl.wrappedJSObject.CodeMirror));
              if (cm && typeof cm.getValue === "function") {
                let val = cm.getValue();
                if (actionTitle === "引用") {
                  val = val.replace(/\n{2,}$/, "\n");
                  if (!val.endsWith("\n")) val += "\n";
                } else {
                  val = val.replace(/[ \t]+$/, "");
                  if (!val.endsWith("\n")) val += "\n";
                }
                cm.setValue(val);
                cm.setCursor(cm.lineCount(), 0);
                cm.focus();
                return;
              }
              const ta = document.querySelector("#nsc-composer-body .CodeMirror textarea");
              if (ta) ta.focus({ preventScroll: true });
            }, 70);
          }
          return;
        }
      }
    }

    if ((actionTitle === "点赞" || actionTitle === "加鸡腿") && obj.commentId) {
      const apiPath = actionTitle === "点赞" ? "/api/statistics/like" : "/api/statistics/upvote";
      try {
        const resp = await fetch(apiPath, {
          method: "POST",
          credentials: "include",
          headers: getNodeSeekPostHeaders(),
          body: JSON.stringify({ commentId: Number(obj.commentId), action: "add" }),
        });
        const resJson = await resp.json().catch(() => ({}));
        if (resp.ok && resJson.success !== false) {
          if (actionTitle === "点赞") obj.likes += 1;
          else obj.legs += 1;
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
          saveJson(LS.USER_CACHE, state.userCache);
          return info;
        }
      }
    } catch (_) {}

    return info;
  }

  function extractUsersFromTempScript(doc) {
    const out = [];
    const seen = new Set();
    const el = doc.getElementById("temp-script");
    if (!el || !el.textContent) return out;
    try {
      const bin = atob(el.textContent.trim());
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const jsonStr = new TextDecoder("utf-8").decode(bytes);
      const cfg = JSON.parse(jsonStr);

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
    return new Promise((resolve) => {
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:900px;height:600px;opacity:0;pointer-events:none;border:0;";
      iframe.src = url;
      let done = false;
      const finish = (res) => {
        if (done) return;
        done = true;
        try { iframe.remove(); } catch (_) {}
        resolve(res);
      };
      const timer = setTimeout(() => {
        try {
          const idoc = iframe.contentDocument;
          finish(idoc ? extractUsersFromDom(idoc) : []);
        } catch (_) {
          finish([]);
        }
      }, 4500);

      iframe.addEventListener("load", () => {
        const poll = setInterval(() => {
          try {
            const idoc = iframe.contentDocument;
            if (!idoc) return;
            const found = extractUsersFromDom(idoc);
            if (found.length > 0) {
              clearInterval(poll);
              clearTimeout(timer);
              finish(found);
            }
          } catch (_) {}
        }, 250);
        setTimeout(() => clearInterval(poll), 4200);
      });

      document.body.appendChild(iframe);
    });
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
        saveJson(LS.LAST_SPEAK_CACHE, state.lastSpeakCache);
        return emptyObj;
      }

      const first = data.comments[0];
      const postId = String(first.post_id || "");
      const floorId = Number(first.floor_id) || 0;
      const title = first.title || `帖子 #${postId}`;
      const pageIndex = floorId > 0 ? Math.ceil(floorId / 20) : 1;
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
      saveJson(LS.LAST_SPEAK_CACHE, state.lastSpeakCache);
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
      return;
    }
    state.batchQuery = { running: true, done: 0, total: targets.length, stopRequested: false };
    renderRightBody();

    for (const u of targets) {
      if (state.batchQuery.stopRequested) break;
      await fetchUserLastSpeak(u.uid);
      state.batchQuery.done += 1;
      renderRightBody();
      if (!state.batchQuery.stopRequested && state.batchQuery.done < state.batchQuery.total) {
        await new Promise((r) => setTimeout(r, 260));
      }
    }
    state.batchQuery.running = false;
    state.batchQuery.stopRequested = false;
    renderRightBody();
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
