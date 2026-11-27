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
    const el = document.querySelector("#nsk-right-panel-container .user-card .Username, .nsc-right-user .Username, .menu a.Username[href*=\"/space/\"]");
    if (el) {
      const name = el.textContent.trim();
      const m = (el.getAttribute("href") || "").match(/\/space\/(\d+)/);
      if (name) state.currentUser = name;
      if (m) state.currentUserId = Number(m[1]);
      if (name || m) {
        const nextViewer = { username: state.currentUser || "", uid: state.currentUserId ? String(state.currentUserId) : "" };
        if (
          !state.seekViewerCache ||
          state.seekViewerCache.username !== nextViewer.username ||
          state.seekViewerCache.uid !== nextViewer.uid
        ) {
          state.seekViewerCache = nextViewer;
          scheduleSaveJson(LS.SEEK_VIEWER_CACHE, nextViewer);
        }
      }
    }
  }

  function getSeekViewerIdentity() {
    detectCurrentUser();
    if (state.currentUser || state.currentUserId) {
      return {
        username: state.currentUser || "",
        uid: state.currentUserId ? String(state.currentUserId) : "",
      };
    }
    const exact = document.querySelector('.menu a.Username[href*="/space/"]');
    if (exact) {
      const username = (exact.textContent || "").trim();
      const m = (exact.getAttribute("href") || "").match(/\/space\/(\d+)/);
      const v = { username, uid: m ? m[1] : "" };
      if (v.username || v.uid) {
        state.seekViewerCache = v;
        scheduleSaveJson(LS.SEEK_VIEWER_CACHE, v);
        return v;
      }
    }
    const cached = state.seekViewerCache || loadJson(LS.SEEK_VIEWER_CACHE, {});
    if (cached && (cached.username || cached.uid)) {
      return { username: String(cached.username || ""), uid: String(cached.uid || "") };
    }
    return { username: "", uid: "" };
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

  async function fetchServerBlockList(silent = false, force = false) {
    if (state.blockListState.loading) return state.blacklist;
    const lastSyncTs = Number(localStorage.getItem(LS.BLACKLIST_TS)) || 0;
    if (silent && !force && lastSyncTs > 0 && Date.now() - lastSyncTs < 30 * 60 * 1000) {
      state.blockListState.items = state.blacklist;
      state.blockListState.loaded = true;
      return state.blacklist;
    }
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
      localStorage.setItem(LS.BLACKLIST_TS, String(Date.now()));
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
        await fetchServerBlockList(true, true);
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
    await fetchServerBlockList(true, true);
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

  let _collectionsPromise = null;
  async function ensureCollectionsLoaded(force = false) {
    if (state.collectionsLoaded && !force) return;
    if (_collectionsPromise) return _collectionsPromise;
    _collectionsPromise = (async () => {
      try {
        const nextSet = new Set();
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
            if (pid) nextSet.add(pid);
          }
          if (rows.length < 15) break;
        }
        state.collectedSet = nextSet;
        state.collectionsLoaded = true;
        saveJson(LS.COLLECTIONS, Array.from(nextSet).slice(0, 300));
        if (state.currentRoom && state.currentPostId) {
          const colBtn = document.getElementById("nsc-collect-post-btn");
          if (colBtn) {
            const on = state.collectedSet.has(String(state.currentPostId));
            colBtn.classList.toggle("is-active", on);
            colBtn.innerHTML = `${ICONS.bookmark}<span>${on ? "已收藏" : "收藏"}</span>`;
          }
        }
      } catch (_) {
      } finally {
        _collectionsPromise = null;
      }
    })();
    return _collectionsPromise;
  }

  async function togglePostCollection(postId, btnEl = null) {
    const pid = String(postId || "").trim();
    if (!pid) return { ok: false };
    if (btnEl) btnEl.disabled = true;
    try {
      if (!state.collectionsLoaded) {
        await ensureCollectionsLoaded(false);
      }
      const isCollected = state.collectedSet.has(pid);
      const action = isCollected ? "remove" : "add";
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
      saveJson(LS.COLLECTIONS, Array.from(state.collectedSet).slice(0, 300));
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

  async function resolveFreshGithubInstallUrl(downloadUrl, latestVersion) {
    const rawUrl = String(downloadUrl || "").trim();
    if (!rawUrl) return "";
    const m = rawUrl.match(/^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/i);
    if (!m) return rawUrl;
    const owner = m[1];
    const repo = m[2];
    const branch = m[3];
    const restPath = m[4].replace(/[?#].*$/, "");
    const cleanVer = String(latestVersion || "").replace(/^v/i, "").trim();

    if (cleanVer) {
      for (const tagRef of [`v${cleanVer}`, cleanVer]) {
        const tagUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${tagRef}/${restPath}`;
        try {
          const text = await fetchRemoteMetaText(tagUrl);
          const vm = text.match(/\/\/\s*@version\s+([^\s]+)/i);
          if (vm && compareSemver(vm[1].trim(), cleanVer) >= 0) {
            return tagUrl;
          }
        } catch (_) {}
      }
    }

    try {
      const apiText = await fetchRemoteMetaText(`https://api.github.com/repos/${owner}/${repo}/commits/${encodeURIComponent(branch)}`);
      const json = JSON.parse(apiText);
      if (json && json.sha) {
        return `https://raw.githubusercontent.com/${owner}/${repo}/${json.sha}/${restPath}`;
      }
    } catch (_) {}

    return rawUrl;
  }

  async function openSeekChatUpdateInstall() {
    const targets = getScriptUpdateTargets();
    if (!targets.downloadUrl) return;
    const u = state.updateInfo;
    let url = u.installUrl || "";
    if (!url || url === targets.downloadUrl) {
      url = await resolveFreshGithubInstallUrl(targets.downloadUrl, u.latest);
      u.installUrl = url;
    }
    if (!url) url = targets.downloadUrl;
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
        u.installUrl = cached.installUrl || "";
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
      u.installUrl = u.hasUpdate
        ? await resolveFreshGithubInstallUrl(targets.downloadUrl, latest)
        : targets.downloadUrl;
      u.justChecked = manual && !u.hasUpdate;
      saveJson(LS.UPDATE_CHECK, { latest, metaUrl: targets.metaUrl, installUrl: u.installUrl, ts: Date.now() });
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

  function detectThirdPartyEnv() {
    const items = [];
    if (document.getElementById("hanabi-toggle-btn") || document.getElementById("hanabi-emoji-panel") || document.getElementById("hanabi-custom-styles")) {
      items.push({ id: "hanabi", name: "花火表情面板", kind: "DOM 特征", detail: "检测到 #hanabi-emoji-panel，保留原生光标插入兼容" });
    }
    const userCss = Array.from(document.querySelectorAll('link[rel="stylesheet"][href*="/userstyle/"]'));
    if (userCss.length > 0) {
      items.push({ id: "userstyle", name: "论坛扩展自定义样式", kind: "CSS", detail: "已加载 /userstyle/*.css，原版论坛与顶栏保持协同" });
    }
    const extScripts = Array.from(document.querySelectorAll('script[src^="http"]'))
      .map((s) => s.getAttribute("src") || "")
      .filter((src) => src && !src.includes("nodeseek.com") && !src.includes("stat.nodeseek.org") && !src.includes("cloudflareinsights.com"));
    if (extScripts.length > 0) {
      items.push({
        id: "ext-scripts",
        name: `外部注入脚本 (${extScripts.length})`,
        kind: "Script",
        detail: extScripts.map((u) => { try { return new URL(u).hostname; } catch (_) { return u; } }).join(", "),
      });
    }
    if (document.querySelector("read-frog, [wxt-shadow-root-document-styles]")) {
      items.push({ id: "browser-ext", name: "浏览器扩展浮层", kind: "Extension", detail: "检测到 Shadow/WXT 扩展节点，MutationObserver 已自动隔离" });
    }
    return items;
  }

  function stripThirdPartyArtifacts(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll(
      '[id^="hanabi-"], [class*="hanabi-"], read-frog, [data-wxt-shadow-root], .nsc-hover-bar, .nsc-copy-code-btn'
    ).forEach((n) => n.remove());
  }

  const JUMP_WHITELIST = new Set([
    "github.com",
    "gitlab.com",
    "docker.com",
    "mozilla.org",
    "stackoverflow.com",
    "t.me",
    "bilibili.com",
    "youtube.com",
    "twitter.com",
    "facebook.com",
    "wikipedia.org",
    "google.com",
    "nodeseek.com",
    "nodehatch.com",
    "namatra.de",
    "deepflood.com",
    "nodequality.com",
  ]);

  function isJumpWhitelisted(targetUrl) {
    try {
      const host = new URL(targetUrl).hostname.toLowerCase();
      const parts = host.split(".");
      const rootDomain = parts.length >= 2 ? parts.slice(-2).join(".") : host;
      return JUMP_WHITELIST.has(host) || JUMP_WHITELIST.has(rootDomain);
    } catch (_) {
      return false;
    }
  }

  function parseJumpTargetUrl(rawHref) {
    if (!rawHref) return null;
    try {
      const parsed = new URL(rawHref, location.origin);
      const host = parsed.hostname.toLowerCase();
      const isNodeSeek = host === "www.nodeseek.com" || host === "nodeseek.com";
      if (!isNodeSeek || parsed.pathname !== "/jump") return null;
      let to = parsed.searchParams.get("to") || "";
      if (!to) return null;
      if (/^https?%3A/i.test(to)) {
        try { to = decodeURIComponent(to); } catch (_) {}
      }
      const targetParsed = new URL(to);
      if (targetParsed.protocol !== "http:" && targetParsed.protocol !== "https:") return null;
      return {
        rawHref,
        targetUrl: targetParsed.toString(),
        host: targetParsed.hostname,
        isWhitelisted: isJumpWhitelisted(targetParsed.toString()),
      };
    } catch (_) {
      return null;
    }
  }

  function formatUtcMsToBeijingStr(utcMs) {
    if (!utcMs || Number.isNaN(utcMs)) return "";
    const bj = new Date(utcMs + 8 * 3600000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${bj.getUTCFullYear()}-${pad(bj.getUTCMonth() + 1)}-${pad(bj.getUTCDate())} ${pad(bj.getUTCHours())}:${pad(bj.getUTCMinutes())}:${pad(bj.getUTCSeconds())}`;
  }

  function parseRulingPostTarget(postUrl) {
    if (!postUrl || typeof postUrl !== "string") return null;
    const m = postUrl.match(/\/post-(\d+)(?:-(\d+))?(?:#(-?\d+))?/);
    if (!m) return null;
    const pid = m[1];
    if (!pid || Number(pid) <= 0) return null;
    const page = m[2] && Number(m[2]) > 0 ? m[2] : "1";
    const floorRaw = m[3];
    const floorId = floorRaw !== undefined && Number(floorRaw) >= 0 ? String(floorRaw) : "";
    const href = `/post-${pid}-${page}${floorId !== "" ? `#${floorId}` : ""}`;
    return {
      postId: pid,
      page,
      floorId,
      href,
      label: floorId !== "" ? `帖子 #${pid} · #${floorId}` : `帖子 #${pid}`,
    };
  }

  function normalizeRulingRow(row) {
    const rawActions = String((row && row.actions_text) || "").replace(/\s*\n+\s*/g, " ").trim();
    const timeRe = /(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i;
    const tm = rawActions.match(timeRe);
    let utcMs = 0;
    let beijingTime = "";
    let relTime = "";
    let cleanActions = rawActions;
    if (tm) {
      const month = Number(tm[1]);
      const day = Number(tm[2]);
      const year = Number(tm[3]);
      let hour = Number(tm[4]);
      const minute = Number(tm[5]);
      const second = Number(tm[6]);
      const ampm = tm[7].toUpperCase();
      if (ampm === "PM" && hour < 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;
      utcMs = Date.UTC(year, month - 1, day, hour, minute, second);
      beijingTime = formatUtcMsToBeijingStr(utcMs);
      relTime = formatRelativeFromMs(utcMs);
      cleanActions = rawActions.replace(tm[0], "").replace(/\s{2,}/g, " ").trim();
    }
    const delta = typeof (row && row.action_points_delta) === "number" ? row.action_points_delta : null;
    const cat = String((row && row.action_category) || "");
    let kind = "other";
    let kindLabel = "管理";
    if (cat === "punish" || (delta !== null && delta < 0) || (row && row.action_mute_days > 0)) {
      kind = "punish";
      kindLabel = "处罚";
    } else if (cat === "reward" || (delta !== null && delta > 0)) {
      kind = "reward";
      kindLabel = "奖励";
    }
    return {
      recordId: row && row.record_id ? String(row.record_id) : "",
      reasonText: String((row && row.reason_text) || "-").trim(),
      cleanActions: cleanActions || "-",
      pointsDelta: delta,
      muteDays: typeof (row && row.action_mute_days) === "number" ? row.action_mute_days : 0,
      moveTo: row && row.action_move_to ? String(row.action_move_to) : "",
      readLevel: row && row.action_read_level !== null && row.action_read_level !== undefined ? row.action_read_level : null,
      postTarget: parseRulingPostTarget(row && row.post_url),
      utcMs,
      beijingTime,
      relTime,
      kind,
      kindLabel,
    };
  }

  function summarizeRulingRows(rows) {
    const list = Array.isArray(rows) ? rows : [];
    let punishCount = 0;
    let rewardCount = 0;
    let otherCount = 0;
    let muteCount = 0;
    let muteDaysTotal = 0;
    let moveCount = 0;
    let pointsDeltaNet = 0;
    let hasPoints = false;

    for (const r of list) {
      if (r.kind === "punish") punishCount += 1;
      else if (r.kind === "reward") rewardCount += 1;
      else otherCount += 1;
      if (r.muteDays > 0) {
        muteCount += 1;
        muteDaysTotal += r.muteDays;
      }
      if (r.moveTo) moveCount += 1;
      if (typeof r.pointsDelta === "number") {
        hasPoints = true;
        pointsDeltaNet += r.pointsDelta;
      }
    }

    const tags = [];
    if (punishCount > 0) tags.push({ key: "punish", label: `处罚 ${punishCount}`, tone: "danger", filter: "punish" });
    if (muteCount > 0) tags.push({ key: "mute", label: muteDaysTotal > 0 ? `禁言 ${muteCount} (${muteDaysTotal}天)` : `禁言 ${muteCount}`, tone: "warn", filter: "mute" });
    if (moveCount > 0) tags.push({ key: "move", label: `移版 ${moveCount}`, tone: "indigo", filter: "move" });
    if (rewardCount > 0) tags.push({ key: "reward", label: `奖励 ${rewardCount}`, tone: "success", filter: "reward" });
    if (otherCount > 0 && punishCount === 0 && rewardCount === 0) {
      tags.push({ key: "other", label: `记录 ${otherCount}`, tone: "neutral", filter: "all" });
    }
    if (hasPoints && pointsDeltaNet !== 0) {
      tags.push({
        key: "points",
        label: `鸡腿 ${pointsDeltaNet > 0 ? "+" : ""}${pointsDeltaNet}`,
        tone: pointsDeltaNet < 0 ? "warn" : "success",
        filter: "all",
      });
    }
    return {
      total: list.length,
      punishCount,
      rewardCount,
      otherCount,
      muteCount,
      muteDaysTotal,
      moveCount,
      pointsDeltaNet,
      tags,
    };
  }

  let _rulingCooldownUntil = 0;
  const _rulingInFlight = new Map();
  const RULING_CACHE_TTL_MS = 60 * 60 * 1000;

  function gmFetchJson(url) {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== "function") {
        reject(new Error("GM_xmlhttpRequest 不可用"));
        return;
      }
      GM_xmlhttpRequest({
        method: "GET",
        url,
        timeout: 12000,
        headers: { Accept: "application/json" },
        onload: (res) => {
          try {
            const json = JSON.parse(res.responseText || "{}");
            resolve(json);
          } catch (err) {
            reject(err);
          }
        },
        onerror: () => reject(new Error("网络请求失败")),
        ontimeout: () => reject(new Error("请求超时")),
      });
    });
  }

  async function fetchUserRulingRecords(username, force = false) {
    const cleanName = String(username || "").trim();
    if (!cleanName || cleanName === "Seeker") {
      return { ok: false, error: "invalid_username", rows: [] };
    }
    const cacheKey = cleanName.toLowerCase();
    const cached = state.rulingCache && state.rulingCache[cacheKey];
    if (!force && cached && Array.isArray(cached.rows) && Date.now() - (cached.ts || 0) < RULING_CACHE_TTL_MS) {
      return { ok: true, rows: cached.rows, fromCache: true, ts: cached.ts };
    }

    if (_rulingCooldownUntil > Date.now()) {
      const waitSec = Math.max(1, Math.ceil((_rulingCooldownUntil - Date.now()) / 1000));
      return {
        ok: false,
        error: "rate_limited",
        retryAfter: waitSec,
        rows: cached && Array.isArray(cached.rows) ? cached.rows : [],
        fromCache: Boolean(cached && Array.isArray(cached.rows)),
      };
    }

    if (!force && _rulingInFlight.has(cacheKey)) {
      return _rulingInFlight.get(cacheKey);
    }

    const reqPromise = (async () => {
      const viewer = getSeekViewerIdentity();
      const url = `https://api.xxboxx.de/api/seek?username=${encodeURIComponent(cleanName)}&limit=100000&viewer=${encodeURIComponent(viewer.username)}&viewer_uid=${encodeURIComponent(viewer.uid)}`;
      let data = null;
      try {
        const resp = await fetch(url, { cache: "no-store" });
        data = await resp.json();
      } catch (_) {
        data = await gmFetchJson(url);
      }

      if (!data || !data.ok) {
        if (data && data.error === "rate_limited") {
          const retryAfter = Math.max(5, Number(data.retry_after) || 60);
          _rulingCooldownUntil = Date.now() + retryAfter * 1000;
          return {
            ok: false,
            error: "rate_limited",
            retryAfter,
            rows: cached && Array.isArray(cached.rows) ? cached.rows : [],
            fromCache: Boolean(cached && Array.isArray(cached.rows)),
          };
        }
        throw new Error((data && data.error) || "query_failed");
      }

      const normalized = (Array.isArray(data.rows) ? data.rows : []).map(normalizeRulingRow);
      state.rulingCache[cacheKey] = {
        ts: Date.now(),
        username: cleanName,
        rows: normalized,
      };
      pruneTimedCache(state.rulingCache, 180, 120);
      scheduleSaveJson(LS.RULING_CACHE, state.rulingCache);
      return { ok: true, rows: normalized, fromCache: false, ts: Date.now() };
    })()
      .catch((err) => ({
        ok: false,
        error: err && err.message ? err.message : "query_failed",
        rows: cached && Array.isArray(cached.rows) ? cached.rows : [],
        fromCache: Boolean(cached && Array.isArray(cached.rows)),
      }))
      .finally(() => {
        _rulingInFlight.delete(cacheKey);
      });

    _rulingInFlight.set(cacheKey, reqPromise);
    return reqPromise;
  }

