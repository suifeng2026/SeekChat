  async function fetchUserProfile(uid, nameFallback) {
    const cached = uid ? state.userCache[uid] : null;
    if (cached && cached.v >= 2 && Date.now() - cached.ts < 12 * 3600000) {
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

  const _userSpaceCache = new Map();
  const MAX_SPACE_CACHE = 15;
  const SPACE_CACHE_TTL_MS = 5 * 60 * 1000;
  const _spaceModalState = { uid: "", info: null, tab: "posts", sigHtml: "" };

  function getOrCreateUserSpaceStore(info) {
    const uid = String((info && info.uid) || "").trim();
    if (!uid) return null;
    const now = Date.now();
    let entry = _userSpaceCache.get(uid);
    if (entry && now - entry.ts < SPACE_CACHE_TTL_MS) {
      _userSpaceCache.delete(uid);
      _userSpaceCache.set(uid, entry);
      if (info && info.name && info.name !== "Seeker") entry.info = { ...entry.info, ...info };
      return entry;
    }
    entry = {
      uid,
      info: info || { uid, name: `用户 #${uid}`, avatar: `/avatar/${uid}.png` },
      posts: { items: [], page: 0, loading: false, noMore: Number(info && info.posts) === 0, error: null },
      comments: { items: [], page: 0, loading: false, noMore: Number(info && info.comments) === 0, error: null },
      ts: now,
    };
    _userSpaceCache.set(uid, entry);
    while (_userSpaceCache.size > MAX_SPACE_CACHE) {
      const oldest = _userSpaceCache.keys().next().value;
      if (oldest === undefined) break;
      _userSpaceCache.delete(oldest);
    }
    return entry;
  }

  async function loadSpaceTabPage(store, kind, reset = false) {
    if (!store || !store.uid) return;
    const st = kind === "comments" ? store.comments : store.posts;
    if (st.loading) return;
    if (reset) {
      st.items = [];
      st.page = 0;
      st.noMore = false;
      st.error = null;
    }
    if (st.noMore) return;
    st.loading = true;
    renderUserSpaceIfOpen(store.uid);
    try {
      const nextPage = st.page + 1;
      const endpoint = kind === "comments"
        ? `/api/content/list-comments?uid=${encodeURIComponent(store.uid)}&page=${nextPage}`
        : `/api/content/list-discussions?uid=${encodeURIComponent(store.uid)}&page=${nextPage}`;
      const json = await apiGetJson(endpoint);
      const rows = kind === "comments"
        ? (json && (json.comments || json.data || json.list)) || []
        : (json && (json.discussions || json.data || json.list)) || [];
      if (!Array.isArray(rows) || rows.length === 0) {
        st.noMore = true;
      } else {
        if (kind === "comments") {
          st.items.push(...rows);
        } else {
          const seen = new Set(st.items.map((x) => String(x.post_id || x.id)));
          for (const r of rows) {
            const pid = String(r.post_id || r.id || "");
            if (pid && !seen.has(pid)) {
              st.items.push(r);
              seen.add(pid);
            }
          }
        }
        st.page = nextPage;
        store.ts = Date.now();
        if (rows.length < 15) st.noMore = true;
      }
    } catch (err) {
      st.error = err.message;
    } finally {
      st.loading = false;
      renderUserSpaceIfOpen(store.uid);
    }
  }

  function preloadUserSpace(info) {
    const store = getOrCreateUserSpaceStore(info);
    if (!store) return;
    if (store.posts.page === 0 && !store.posts.loading && !store.posts.noMore) {
      loadSpaceTabPage(store, "posts", false);
    }
    if (store.comments.page === 0 && !store.comments.loading && !store.comments.noMore) {
      loadSpaceTabPage(store, "comments", false);
    }
  }

  function renderUserSpaceIfOpen(uid) {
    const bd = document.getElementById("nsc-space-backdrop");
    if (!bd || !bd.classList.contains("is-open")) return;
    if (uid && String(uid) !== String(_spaceModalState.uid)) return;
    renderUserSpaceModal();
  }

  function renderUserSpaceModal() {
    const bd = document.getElementById("nsc-space-backdrop");
    if (!bd) return;
    const modal = bd.querySelector(".nsc-space-modal");
    if (!modal) return;
    const store = getOrCreateUserSpaceStore(_spaceModalState.info);
    if (!store) return;
    const info = store.info || _spaceModalState.info;
    const uid = store.uid;
    const tab = _spaceModalState.tab || "posts";

    if (!modal.dataset.nscSpaceInit) {
      modal.dataset.nscSpaceInit = "1";
      modal.innerHTML = `
        <div class="nsc-hub-head">
          <div class="nsc-hub-user" style="gap:9px;">
            <button type="button" class="nsc-mini-btn" id="nsc-space-back" title="返回用户名片">← 返回名片</button>
            <img id="nsc-space-avatar" src="" loading="lazy" decoding="async" alt="" />
            <div style="min-width:0;">
              <div style="font-size:14.5px;font-weight:700;display:flex;align-items:center;gap:6px;">
                <span id="nsc-space-uname"></span>
                <span class="nsc-lv-pill" id="nsc-space-ulv" style="display:none;"></span>
              </div>
              <div id="nsc-space-usub" style="font-size:11px;color:var(--nsc-muted);"></div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex:0 0 auto;">
            <a class="nsc-mini-btn" id="nsc-space-native-link" href="/space/${escHtml(uid)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">访问原版 ↗</a>
            <button type="button" class="nsc-mini-btn" id="nsc-space-close" style="padding:3px 9px;">✕</button>
          </div>
        </div>
        <div class="nsc-hub-tabs" id="nsc-space-tabs"></div>
        <div class="nsc-hub-subbar" id="nsc-space-subbar"></div>
        <div class="nsc-hub-body" id="nsc-space-body"></div>
      `;
      modal.querySelector("#nsc-space-close").addEventListener("click", () => bd.classList.remove("is-open"));
      modal.querySelector("#nsc-space-back").addEventListener("click", () => {
        bd.classList.remove("is-open");
        const pBd = document.getElementById("nsc-profile-backdrop");
        if (pBd) pBd.classList.add("is-open");
      });
      const bodyEl = modal.querySelector("#nsc-space-body");
      let spaceScrollRaf = 0;
      bodyEl.addEventListener("scroll", () => {
        if (spaceScrollRaf) return;
        spaceScrollRaf = requestAnimationFrame(() => {
          spaceScrollRaf = 0;
          if (bodyEl.scrollHeight - bodyEl.scrollTop - bodyEl.clientHeight < 180) {
            const curStore = _userSpaceCache.get(String(_spaceModalState.uid));
            if (!curStore) return;
            if (_spaceModalState.tab === "posts") loadSpaceTabPage(curStore, "posts", false);
            else if (_spaceModalState.tab === "comments") loadSpaceTabPage(curStore, "comments", false);
          }
        });
      });
    }

    const sameTab = modal.dataset.nscSpaceLastTab === tab && modal.dataset.nscSpaceLastUid === uid;
    const bodyEl = modal.querySelector("#nsc-space-body");
    if (sameTab && tab === "native" && bodyEl && bodyEl.querySelector(".nsc-hub-iframe")) {
      return;
    }
    const prevTop = sameTab && bodyEl ? bodyEl.scrollTop : 0;
    modal.dataset.nscSpaceLastTab = tab;
    modal.dataset.nscSpaceLastUid = uid;

    const avImg = modal.querySelector("#nsc-space-avatar");
    if (avImg) avImg.src = info.avatar || `/avatar/${uid}.png`;
    const unameEl = modal.querySelector("#nsc-space-uname");
    if (unameEl) unameEl.textContent = info.name || `用户 #${uid}`;
    const ulvEl = modal.querySelector("#nsc-space-ulv");
    if (ulvEl) {
      if (info.level && info.level !== "--") {
        ulvEl.textContent = info.level;
        ulvEl.style.display = "inline-block";
      } else {
        ulvEl.style.display = "none";
      }
    }
    const usubEl = modal.querySelector("#nsc-space-usub");
    if (usubEl) {
      usubEl.textContent = `UID: ${uid} · 加入 ${info.days || "--"} · 鸡腿 ${info.legs || "--"} · 星辰 ${info.stars || "--"}`;
    }
    const nativeHrefMap = {
      overview: `/space/${uid}#/general`,
      posts: `/space/${uid}#/discussions`,
      comments: `/space/${uid}#/comments`,
      native: `/space/${uid}`,
    };
    const nativeLnk = modal.querySelector("#nsc-space-native-link");
    if (nativeLnk) nativeLnk.href = nativeHrefMap[tab] || `/space/${uid}`;

    const tabsHost = modal.querySelector("#nsc-space-tabs");
    const tabDefs = [
      { id: "posts", label: `主题帖${info.posts !== "--" && info.posts !== undefined ? ` (${info.posts})` : ""}` },
      { id: "comments", label: `历史评论${info.comments !== "--" && info.comments !== undefined ? ` (${info.comments})` : ""}` },
      { id: "overview", label: "主页资料 / README" },
      { id: "native", label: "原版空间 (换肤)" },
    ];
    tabsHost.innerHTML = tabDefs
      .map((t) => `<button type="button" class="nsc-hub-tab ${tab === t.id ? "is-active" : ""}" data-stab="${escHtml(t.id)}">${escHtml(t.label)}</button>`)
      .join("");
    tabsHost.querySelectorAll("[data-stab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        _spaceModalState.tab = btn.dataset.stab;
        if (_spaceModalState.tab === "posts" && store.posts.page === 0 && !store.posts.loading && !store.posts.noMore) {
          loadSpaceTabPage(store, "posts", false);
        } else if (_spaceModalState.tab === "comments" && store.comments.page === 0 && !store.comments.loading && !store.comments.noMore) {
          loadSpaceTabPage(store, "comments", false);
        }
        renderUserSpaceModal();
      });
    });

    const subbar = modal.querySelector("#nsc-space-subbar");
    subbar.innerHTML = "";
    bodyEl.innerHTML = "";
    bodyEl.style.padding = "";
    bodyEl.style.overflow = "";

    const closeAllModals = () => {
      bd.classList.remove("is-open");
      const pBd = document.getElementById("nsc-profile-backdrop");
      if (pBd) pBd.classList.remove("is-open");
    };

    if (tab === "overview") {
      const friendActive = isFriend(info.name);
      const blackActive = isBlacklisted(info.name);
      const lastSp = state.lastSpeakCache[uid];
      const domSig = sanitizeSignatureHtml(_spaceModalState.sigHtml || "");
      const apiSig = info.signature ? renderSimpleMarkdown(info.signature) : "";
      const apiReadme = info.readme && info.readme !== info.signature && info.readme !== info.bio ? renderSimpleMarkdown(info.readme) : "";
      const sigContent = domSig || apiSig || apiReadme;

      subbar.innerHTML = `<span style="font-size:12px;color:var(--nsc-muted);">TA 的社区资料、签名与 README</span>`;
      const ops = document.createElement("div");
      ops.style.cssText = "display:flex;align-items:center;gap:6px;";
      const pmBtn = document.createElement("button");
      pmBtn.type = "button";
      pmBtn.className = "nsc-mini-btn";
      pmBtn.textContent = "发私信";
      pmBtn.addEventListener("click", () => {
        closeAllModals();
        switchChannel("pm", false);
        openPmConversation(info);
      });
      const frBtn = document.createElement("button");
      frBtn.type = "button";
      frBtn.className = "nsc-mini-btn" + (friendActive ? " is-active" : "");
      frBtn.textContent = friendActive ? "已是好友" : "加为好友";
      frBtn.addEventListener("click", () => {
        toggleFriend(info);
        renderUserSpaceModal();
      });
      const bkBtn = document.createElement("button");
      bkBtn.type = "button";
      bkBtn.className = "nsc-mini-btn";
      bkBtn.style.color = "#ff3b30";
      bkBtn.textContent = blackActive ? "移出黑名单" : "加入黑名单";
      bkBtn.addEventListener("click", async () => {
        bkBtn.disabled = true;
        await toggleBlacklist(info);
        renderUserSpaceModal();
      });
      ops.appendChild(pmBtn);
      ops.appendChild(frBtn);
      ops.appendChild(bkBtn);
      subbar.appendChild(ops);

      bodyEl.innerHTML = `
        <div class="nsc-hub-kpi-grid">
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">等级</div><div class="nsc-hub-kpi-val">${escHtml(info.level || "--")}</div></div>
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">加入天数</div><div class="nsc-hub-kpi-val">${escHtml(info.days || "--")}</div></div>
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">鸡腿 / 星辰</div><div class="nsc-hub-kpi-val">${escHtml(info.legs || "--")} / ${escHtml(info.stars || "--")}</div></div>
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">粉丝数</div><div class="nsc-hub-kpi-val">${escHtml(info.fans || "--")}</div></div>
        </div>
        ${info.bio ? `<div class="nsc-space-overview-card"><div class="nsc-profile-sig-label">个人简介</div><div style="font-size:13px;line-height:1.6;">${escHtml(info.bio)}</div></div>` : ""}
        <div class="nsc-space-overview-card">
          <div class="nsc-profile-sig-label">个性签名</div>
          <div class="nsc-profile-sig-body" style="font-size:13px;line-height:1.6;">${sigContent || `<span style="color:var(--nsc-muted);">暂无签名</span>`}</div>
        </div>
        ${apiReadme && (domSig || apiSig) ? `<div class="nsc-space-overview-card"><div class="nsc-profile-sig-label">个人主页 README</div><div style="font-size:13px;line-height:1.6;">${apiReadme}</div></div>` : ""}
        ${lastSp ? `<div class="nsc-space-overview-card"><div class="nsc-profile-sig-label">最后发言记录</div><div style="font-size:12.5px;color:var(--nsc-accent);">${escHtml(lastSp.timeStr)}${lastSp.title ? ` · ${escHtml(lastSp.title)}` : ""}</div></div>` : ""}
      `;
      return;
    }

    if (tab === "posts") {
      const st = store.posts;
      subbar.innerHTML = `<span style="font-size:12px;color:var(--nsc-muted);">已载入 ${st.items.length} 篇主题帖（点击可在工作台阅读）</span>`;
      const refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.className = "nsc-mini-btn";
      refBtn.textContent = st.loading ? "加载中..." : "刷新";
      refBtn.addEventListener("click", () => loadSpaceTabPage(store, "posts", true));
      subbar.appendChild(refBtn);

      if (st.loading && st.items.length === 0) {
        bodyEl.innerHTML = `<div class="nsc-empty-state">正在加载 TA 的主题帖...</div>`;
        return;
      }
      if (st.error && st.items.length === 0) {
        bodyEl.innerHTML = `<div class="nsc-empty-state" style="color:#ff3b30;">加载失败：${escHtml(st.error)}</div>`;
        return;
      }
      if (st.items.length === 0) {
        bodyEl.innerHTML = `<div class="nsc-empty-state">TA 暂未发布主题帖</div>`;
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
          <span class="nsc-badge-read">#${escHtml(pid)}</span>
        `;
        row.addEventListener("click", () => {
          closeAllModals();
          openPostInChat({
            postId: pid,
            url: `/post-${pid}-1`,
            title: it.title || `帖子 #${pid}`,
            author: info.name,
            avatar: info.avatar,
          });
        });
        bodyEl.appendChild(row);
      });
      const wf = document.createElement("div");
      wf.style.cssText = "text-align:center;font-size:11px;color:var(--nsc-muted);padding:10px 4px;";
      wf.textContent = st.noMore ? "已加载全部主题帖" : st.loading ? "正在加载更多..." : "下滑自动加载更多主题帖";
      bodyEl.appendChild(wf);
      if (prevTop > 0) bodyEl.scrollTop = prevTop;
      return;
    }

    if (tab === "comments") {
      const st = store.comments;
      subbar.innerHTML = `<span style="font-size:12px;color:var(--nsc-muted);">已载入 ${st.items.length} 条历史回复（点击可直达对应楼层）</span>`;
      const refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.className = "nsc-mini-btn";
      refBtn.textContent = st.loading ? "加载中..." : "刷新";
      refBtn.addEventListener("click", () => loadSpaceTabPage(store, "comments", true));
      subbar.appendChild(refBtn);

      if (st.loading && st.items.length === 0) {
        bodyEl.innerHTML = `<div class="nsc-empty-state">正在加载 TA 的历史评论...</div>`;
        return;
      }
      if (st.error && st.items.length === 0) {
        bodyEl.innerHTML = `<div class="nsc-empty-state" style="color:#ff3b30;">加载失败：${escHtml(st.error)}</div>`;
        return;
      }
      if (st.items.length === 0) {
        bodyEl.innerHTML = `<div class="nsc-empty-state">TA 暂无公开评论记录</div>`;
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
          closeAllModals();
          openPostInChat({
            postId: pid,
            url: `/post-${pid}-${pageIdx}`,
            title: it.title || `帖子 #${pid}`,
            targetFloor: String(floor),
          });
        });
        bodyEl.appendChild(row);
      });
      const wf = document.createElement("div");
      wf.style.cssText = "text-align:center;font-size:11px;color:var(--nsc-muted);padding:10px 4px;";
      wf.textContent = st.noMore ? "已加载全部评论" : st.loading ? "正在加载更多..." : "下滑自动加载更多评论";
      bodyEl.appendChild(wf);
      if (prevTop > 0) bodyEl.scrollTop = prevTop;
      return;
    }

    subbar.innerHTML = `<span style="font-size:12px;color:var(--nsc-muted);">原版空间页面（已套用 macOS 主题）</span>`;
    const reloadBtn = document.createElement("button");
    reloadBtn.type = "button";
    reloadBtn.className = "nsc-mini-btn";
    reloadBtn.textContent = "重新加载";
    reloadBtn.addEventListener("click", () => mountHubThemedIframe(bodyEl, `/space/${uid}`));
    subbar.appendChild(reloadBtn);
    mountHubThemedIframe(bodyEl, `/space/${uid}`);
  }

  function openUserSpaceModal(info, initialTab = "posts", sigHtml = "") {
    if (!info || !info.uid) return;
    let bd = document.getElementById("nsc-space-backdrop");
    if (!bd) {
      bd = document.createElement("div");
      bd.id = "nsc-space-backdrop";
      bd.innerHTML = `<div class="nsc-space-modal" role="dialog" aria-label="用户空间主页"></div>`;
      bd.addEventListener("click", (e) => {
        if (e.target === bd) bd.classList.remove("is-open");
      });
      document.body.appendChild(bd);
    }
    const pBd = document.getElementById("nsc-profile-backdrop");
    if (pBd) pBd.classList.remove("is-open");

    _spaceModalState.uid = String(info.uid);
    _spaceModalState.info = info;
    _spaceModalState.tab = initialTab || "posts";
    if (sigHtml) _spaceModalState.sigHtml = sigHtml;

    const store = getOrCreateUserSpaceStore(info);
    if (store) {
      if (_spaceModalState.tab === "posts" && store.posts.page === 0 && !store.posts.loading && !store.posts.noMore) {
        loadSpaceTabPage(store, "posts", false);
      } else if (_spaceModalState.tab === "comments" && store.comments.page === 0 && !store.comments.loading && !store.comments.noMore) {
        loadSpaceTabPage(store, "comments", false);
      }
    }
    bd.classList.add("is-open");
    renderUserSpaceModal();
  }

  let _profileModalSeq = 0;

  async function openUserProfileModal(userObj) {
    const backdrop = document.getElementById("nsc-profile-backdrop");
    const modal = document.getElementById("nsc-profile-modal");
    if (!backdrop || !modal) return;
    const modalSeq = ++_profileModalSeq;

    const cachedSigHtml =
      userObj.signatureHtml ||
      (userObj.uid && state.signatureCache[`uid:${userObj.uid}`]) ||
      ((userObj.author || userObj.name) && state.signatureCache[`name:${userObj.author || userObj.name}`]) ||
      "";

    const rulingState = {
      status: "idle",
      targetName: "",
      rows: [],
      source: "",
      error: "",
      retryAfter: 0,
      drawerOpen: false,
      filter: "all",
    };

    const filterRulingRows = (rows, filterKey) => {
      const list = Array.isArray(rows) ? rows : [];
      if (filterKey === "punish") return list.filter((r) => r.kind === "punish");
      if (filterKey === "reward") return list.filter((r) => r.kind === "reward");
      if (filterKey === "mute") return list.filter((r) => r.muteDays > 0);
      if (filterKey === "move") return list.filter((r) => Boolean(r.moveTo));
      return list;
    };

    const renderRulingStrip = (info) => {
      const strip = modal.querySelector("#nsc-p-ruling-strip");
      if (!strip) return;
      const targetName = String((info && info.name) || "").trim();
      const hasValidName = Boolean(targetName && targetName !== "Seeker");

      if (!hasValidName) {
        strip.innerHTML = `<div class="nsc-ruling-row"><span class="nsc-ruling-status">管理记录 待识别用户名</span></div>`;
        return;
      }

      if (rulingState.status === "idle" && !state.rulingAutoQuery) {
        strip.innerHTML = `
          <div class="nsc-ruling-row">
            <span class="nsc-ruling-status">管理记录（已关闭自动查询）</span>
            <button type="button" class="nsc-ruling-link-btn" id="nsc-ruling-manual-btn">查询该用户</button>
          </div>
        `;
        strip.querySelector("#nsc-ruling-manual-btn")?.addEventListener("click", () => {
          triggerRulingQuery(targetName, false);
        });
        return;
      }

      if (rulingState.status === "loading" && rulingState.rows.length === 0) {
        strip.innerHTML = `<div class="nsc-ruling-row"><span class="nsc-ruling-prefix">管理记录</span><span class="nsc-ruling-status">读取中...</span></div>`;
        return;
      }

      if (rulingState.status === "error" && rulingState.rows.length === 0) {
        const isLimited = rulingState.error === "rate_limited";
        const msg = isLimited
          ? `双源均限流中 (${rulingState.retryAfter || 60}s)`
          : "双源均暂不可用";
        strip.innerHTML = `
          <div class="nsc-ruling-row">
            <span class="${isLimited ? "nsc-ruling-warn-text" : "nsc-ruling-status"}"><span class="nsc-ruling-prefix">管理记录</span>${escHtml(msg)}</span>
            <button type="button" class="nsc-ruling-link-btn" id="nsc-ruling-retry-btn">重试</button>
          </div>
        `;
        strip.querySelector("#nsc-ruling-retry-btn")?.addEventListener("click", () => {
          triggerRulingQuery(targetName, true);
        });
        return;
      }

      const rows = rulingState.rows || [];
      if (rows.length === 0) {
        strip.innerHTML = `
          <div class="nsc-ruling-row">
            <div class="nsc-ruling-tags">
              <span class="nsc-ruling-prefix">管理记录</span>
              <span class="nsc-ruling-empty-ok">无管理记录</span>
            </div>
            <button type="button" class="nsc-ruling-link-btn" id="nsc-ruling-ref-btn" title="重新请求最新记录">刷新</button>
          </div>
        `;
        strip.querySelector("#nsc-ruling-ref-btn")?.addEventListener("click", () => {
          triggerRulingQuery(targetName, true);
        });
        return;
      }

      const summary = summarizeRulingRows(rows);
      const tagsHtml = summary.tags
        .map((t) => {
          const isAct = rulingState.drawerOpen && rulingState.filter === t.filter;
          return `<button type="button" class="nsc-ruling-tag tone-${escHtml(t.tone)}${isAct ? " is-active" : ""}" data-rfilter="${escHtml(t.filter)}">${escHtml(t.label)}</button>`;
        })
        .join("");

      const drawerRows = filterRulingRows(rows, rulingState.filter);
      const drawerHtml = rulingState.drawerOpen
        ? `
          <div class="nsc-ruling-drawer is-open">
            <div class="nsc-ruling-filter-row">
              <div class="nsc-ruling-seg">
                <button type="button" class="${rulingState.filter === "all" ? "is-active" : ""}" data-dfilter="all">全部 (${rows.length})</button>
                <button type="button" class="${rulingState.filter === "punish" ? "is-active" : ""}" data-dfilter="punish">处罚 (${summary.punishCount})</button>
                <button type="button" class="${rulingState.filter === "reward" ? "is-active" : ""}" data-dfilter="reward">奖励 (${summary.rewardCount})</button>
              </div>
              <button type="button" class="nsc-ruling-link-btn" id="nsc-ruling-collapse">收起</button>
            </div>
            <div class="nsc-ruling-list">
              ${drawerRows.length === 0
                ? `<div class="nsc-ruling-status" style="padding:8px 4px;">该分类下暂无记录</div>`
                : drawerRows.map((r, idx) => `
                  <div class="nsc-ruling-item">
                    <div class="nsc-ruling-item-top">
                      <span><span class="nsc-ruling-kind ${escHtml(r.kind)}">${escHtml(r.kindLabel)}</span> <span style="color:var(--nsc-muted);">#${escHtml(r.recordId || "-")}</span></span>
                      <span class="nsc-ruling-time" title="${escHtml(r.beijingTime || "")}">${escHtml(r.beijingTime || r.relTime || "-")}</span>
                    </div>
                    <div>原因：${escHtml(r.reasonText)}</div>
                    <div style="color:var(--nsc-muted);">处理：${escHtml(r.cleanActions)}</div>
                    <div class="nsc-ruling-post-row">
                      ${r.postTarget
                        ? `<button type="button" class="nsc-ruling-post-btn" data-rpost-idx="${idx}">打开涉事帖${r.postTarget.floorId !== "" ? ` #${escHtml(r.postTarget.floorId)}` : ""}</button>
                           <a href="${escHtml(r.postTarget.href)}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:var(--nsc-muted);text-decoration:none;">原帖 ↗</a>`
                        : `<span style="font-size:11px;color:var(--nsc-muted);">无关联帖子</span>`}
                    </div>
                  </div>
                `).join("")}
            </div>
          </div>
        `
        : "";

      strip.innerHTML = `
        <div class="nsc-ruling-row">
          <div class="nsc-ruling-tags">
            <span class="nsc-ruling-prefix">管理记录</span>
            ${tagsHtml}
          </div>
          <div class="nsc-ruling-ops">
            ${rulingState.error === "rate_limited" ? `<span class="nsc-ruling-status" style="font-size:10.5px;">冷却 ${rulingState.retryAfter}s</span>` : ""}
            <button type="button" class="nsc-ruling-link-btn" id="nsc-ruling-toggle-btn">${rulingState.drawerOpen ? "收起" : `明细 (${rows.length})`}</button>
            <button type="button" class="nsc-ruling-link-btn" id="nsc-ruling-ref-btn">${rulingState.status === "loading" ? "..." : "刷新"}</button>
          </div>
        </div>
        <div class="nsc-ruling-hover-tip" id="nsc-ruling-hover-tip"></div>
        ${drawerHtml}
      `;

      const hoverTip = strip.querySelector("#nsc-ruling-hover-tip");
      const showHoverPreview = (filterKey) => {
        if (!hoverTip || rulingState.drawerOpen) return;
        const previewList = filterRulingRows(rows, filterKey).slice(0, 4);
        if (previewList.length === 0) return;
        hoverTip.innerHTML = `
          ${previewList.map((r) => `
            <div class="nsc-ruling-hover-item">
              <div style="display:flex;justify-content:space-between;gap:8px;">
                <span><span class="nsc-ruling-kind ${escHtml(r.kind)}">${escHtml(r.kindLabel)}</span> #${escHtml(r.recordId || "-")}</span>
                <span class="nsc-ruling-time">${escHtml(r.beijingTime || r.relTime || "")}</span>
              </div>
              <div>原因：${escHtml(r.reasonText)}</div>
              <div style="color:var(--nsc-muted);">处理：${escHtml(r.cleanActions)}${r.postTarget ? ` · 涉事 ${escHtml(r.postTarget.label)}` : ""}</div>
            </div>
          `).join("")}
          <div style="margin-top:5px;font-size:10.5px;color:var(--nsc-accent);">点击标签可展开完整明细并跳转涉事帖</div>
        `;
        hoverTip.classList.add("is-open");
      };
      const hideHoverPreview = () => {
        if (hoverTip) hoverTip.classList.remove("is-open");
      };

      strip.querySelectorAll(".nsc-ruling-tag").forEach((btn) => {
        const fKey = btn.dataset.rfilter || "all";
        btn.addEventListener("mouseenter", () => showHoverPreview(fKey));
        btn.addEventListener("click", () => {
          hideHoverPreview();
          if (rulingState.drawerOpen && rulingState.filter === fKey) {
            rulingState.drawerOpen = false;
          } else {
            rulingState.drawerOpen = true;
            rulingState.filter = fKey;
          }
          renderRulingStrip(info);
        });
      });
      strip.addEventListener("mouseleave", hideHoverPreview);

      strip.querySelector("#nsc-ruling-toggle-btn")?.addEventListener("click", () => {
        hideHoverPreview();
        rulingState.drawerOpen = !rulingState.drawerOpen;
        renderRulingStrip(info);
      });
      strip.querySelector("#nsc-ruling-collapse")?.addEventListener("click", () => {
        rulingState.drawerOpen = false;
        renderRulingStrip(info);
      });
      strip.querySelector("#nsc-ruling-ref-btn")?.addEventListener("click", () => {
        hideHoverPreview();
        triggerRulingQuery(targetName, true);
      });
      strip.querySelectorAll("[data-dfilter]").forEach((b) => {
        b.addEventListener("click", () => {
          rulingState.filter = b.dataset.dfilter || "all";
          renderRulingStrip(info);
        });
      });
      strip.querySelectorAll("[data-rpost-idx]").forEach((b) => {
        b.addEventListener("click", () => {
          const item = drawerRows[Number(b.dataset.rpostIdx)];
          if (!item || !item.postTarget) return;
          backdrop.classList.remove("is-open");
          openPostInChat({
            postId: item.postTarget.postId,
            url: item.postTarget.href,
            title: `帖子 #${item.postTarget.postId}`,
            targetFloor: item.postTarget.floorId,
          });
        });
      });
    };

    const triggerRulingQuery = async (targetName, force = false) => {
      const cleanName = String(targetName || "").trim();
      if (!cleanName || cleanName === "Seeker") return;
      if (!force && rulingState.targetName === cleanName && rulingState.status !== "idle") return;
      rulingState.targetName = cleanName;
      rulingState.status = "loading";
      rulingState.error = "";
      renderRulingStrip({ name: cleanName });

      const res = await fetchUserRulingRecords(cleanName, force);
      if (modalSeq !== _profileModalSeq || !backdrop.classList.contains("is-open")) return;
      if (res && res.ok) {
        rulingState.status = "ready";
        rulingState.rows = Array.isArray(res.rows) ? res.rows : [];
        rulingState.source = res.source || "";
        rulingState.error = "";
      } else {
        rulingState.error = (res && res.error) || "query_failed";
        rulingState.retryAfter = (res && res.retryAfter) || 0;
        rulingState.rows = Array.isArray(res && res.rows) ? res.rows : [];
        rulingState.source = (res && res.source) || "";
        rulingState.status = rulingState.rows.length > 0 ? "ready" : "error";
      }
      renderRulingStrip({ name: cleanName });
    };

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
            <img src="${info.avatar || "/static/image/favicon/android-chrome-192x192.png"}" loading="lazy" decoding="async" />
            <div>
              <div style="font-size:16px;font-weight:700;"></div>
              <div style="font-size:12px;color:var(--nsc-muted);">ID: ${info.uid || "-"} · ${info.level} · 加入 ${info.days}${loading ? " (读取中...)" : ""}</div>
            </div>
          </div>
          <div class="nsc-ruling-strip" id="nsc-p-ruling-strip"></div>
          <div class="nsc-profile-stats">
            <div><div class="nsc-stat-val">${info.legs}</div><div class="nsc-stat-lbl">鸡腿</div></div>
            <div><div class="nsc-stat-val">${info.stars}</div><div class="nsc-stat-lbl">星辰</div></div>
            <div class="${info.uid ? "nsc-stat-clickable" : ""}" id="nsc-p-stat-posts" title="${info.uid ? "点击查看 TA 的主题帖" : ""}"><div class="nsc-stat-val">${info.posts}</div><div class="nsc-stat-lbl">主题</div></div>
            <div class="${info.uid ? "nsc-stat-clickable" : ""}" id="nsc-p-stat-comments" title="${info.uid ? "点击查看 TA 的历史评论" : ""}"><div class="nsc-stat-val">${info.comments}</div><div class="nsc-stat-lbl">评论</div></div>
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
            ${info.uid ? `<button type="button" id="nsc-p-space">空间主页</button>` : `<button type="button" disabled>空间主页</button>`}
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
      const spaceBtn = modal.querySelector("#nsc-p-space");
      if (spaceBtn && info.uid) {
        spaceBtn.addEventListener("click", () => openUserSpaceModal(info, "posts", cachedSigHtml));
      }
      const statPosts = modal.querySelector("#nsc-p-stat-posts");
      if (statPosts && info.uid) {
        statPosts.addEventListener("click", () => openUserSpaceModal(info, "posts", cachedSigHtml));
      }
      const statComments = modal.querySelector("#nsc-p-stat-comments");
      if (statComments && info.uid) {
        statComments.addEventListener("click", () => openUserSpaceModal(info, "comments", cachedSigHtml));
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
      renderRulingStrip(info);
    };

    backdrop.classList.add("is-open");
    const initName = userObj.author || userObj.name || "Seeker";
    renderModal(
      {
        uid: userObj.uid || "",
        name: initName,
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
    if (state.rulingAutoQuery && initName && initName !== "Seeker") {
      triggerRulingQuery(initName, false);
    }

    const fullInfo = await fetchUserProfile(userObj.uid, initName);
    if (modalSeq !== _profileModalSeq) return;
    if (fullInfo && userObj.uid) {
      syncUserBadgeToChatDom(userObj.uid, fullInfo);
    }
    if (backdrop.classList.contains("is-open")) {
      renderModal(fullInfo, false);
      if (state.rulingAutoQuery && fullInfo && fullInfo.name && fullInfo.name !== "Seeker" && rulingState.status === "idle") {
        triggerRulingQuery(fullInfo.name, false);
      }
      if (fullInfo && fullInfo.uid) {
        preloadUserSpace(fullInfo);
      }
    } else if (fullInfo && fullInfo.uid && String(_spaceModalState.uid) === String(fullInfo.uid)) {
      getOrCreateUserSpaceStore(fullInfo);
      _spaceModalState.info = fullInfo;
      renderUserSpaceIfOpen(fullInfo.uid);
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
          <img class="nsc-qq-avatar" src="${u.avatar || (u.uid ? `/avatar/${u.uid}.png` : "/static/image/favicon/android-chrome-192x192.png")}" loading="lazy" decoding="async" />
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
      refBtn.addEventListener("click", () => fetchHotPosts(state.hotTab, true));
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
          <img class="nsc-qq-avatar" src="${b.avatar || (b.uid ? `/avatar/${b.uid}.png` : "/static/image/favicon/android-chrome-192x192.png")}" loading="lazy" decoding="async" />
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
        state.collectionsLoaded = true;
        saveJson(LS.COLLECTIONS, Array.from(state.collectedSet).slice(0, 300));
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
            <img src="${it.avatar || "/static/image/favicon/android-chrome-192x192.png"}" loading="lazy" decoding="async" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex:0 0 32px;" />
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
            <img src="${it.avatar}" loading="lazy" decoding="async" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex:0 0 32px;" />
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
            <img src="${escHtml(avatarSrc)}" loading="lazy" decoding="async" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex:0 0 36px;" />
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
          <img src="${uidStr ? `/avatar/${uidStr}.png` : "/static/image/favicon/android-chrome-192x192.png"}" loading="lazy" decoding="async" style="width:30px;height:30px;border-radius:50%;object-fit:cover;flex:0 0 30px;" />
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

