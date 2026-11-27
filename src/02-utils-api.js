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

  const SEEKCHAT_META_URL = "https://raw.githubusercontent.com/suifeng2026/SeekChat/main/dist/nodeseek-chat-ui.meta.js";
  const SEEKCHAT_USERJS_URL = "https://raw.githubusercontent.com/suifeng2026/SeekChat/main/dist/nodeseek-chat-ui.user.js";

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
    const u = state.updateInfo;
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
    const url = `${SEEKCHAT_USERJS_URL}?t=${Date.now()}`;
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
    if (u.checking) return;
    if (!manual) {
      const cached = loadJson(LS.UPDATE_CHECK, null);
      if (cached && cached.ts && Date.now() - cached.ts < UPDATE_CHECK_INTERVAL_MS && cached.latest) {
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
      const url = manual ? `${SEEKCHAT_META_URL}?_t=${Date.now()}` : SEEKCHAT_META_URL;
      const text = await fetchRemoteMetaText(url);
      const m = text.match(/\/\/\s*@version\s+([^\s]+)/i);
      const latest = m ? m[1].trim() : "";
      if (!latest) throw new Error("未解析到版本号");
      u.latest = latest;
      u.hasUpdate = compareSemver(latest, u.current) > 0;
      u.justChecked = manual && !u.hasUpdate;
      saveJson(LS.UPDATE_CHECK, { latest, ts: Date.now() });
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

