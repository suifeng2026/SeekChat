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

  function renderUserHubIfOpen() {
    const bd = document.getElementById("nsc-hub-backdrop");
    if (bd && bd.classList.contains("is-open")) renderUserHub();
  }

  async function loadHubPosts(reset = false) {
    detectCurrentUser();
    const uid = state.currentUserId;
    const st = state.hubData.posts;
    if (!uid || st.loading) return;
    if (reset) { st.items = []; st.page = 0; st.noMore = false; st.error = null; }
    if (st.noMore) return;
    st.loading = true;
    renderUserHubIfOpen();
    try {
      const nextPage = st.page + 1;
      const resp = await fetch(`/api/content/list-discussions?uid=${uid}&page=${nextPage}`, {
        headers: { Accept: "application/json, text/plain, */*" },
        credentials: "include",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const rows = (json && (json.discussions || json.data || json.list)) || [];
      if (!Array.isArray(rows) || rows.length === 0) st.noMore = true;
      else {
        const seen = new Set(st.items.map((x) => String(x.post_id || x.id)));
        for (const r of rows) {
          const pid = String(r.post_id || r.id || "");
          if (pid && !seen.has(pid)) { st.items.push(r); seen.add(pid); }
        }
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

  async function loadHubComments(reset = false) {
    detectCurrentUser();
    const uid = state.currentUserId;
    const st = state.hubData.comments;
    if (!uid || st.loading) return;
    if (reset) { st.items = []; st.page = 0; st.noMore = false; st.error = null; }
    if (st.noMore) return;
    st.loading = true;
    renderUserHubIfOpen();
    try {
      const nextPage = st.page + 1;
      const resp = await fetch(`/api/content/list-comments?uid=${uid}&page=${nextPage}`, {
        headers: { Accept: "application/json, text/plain, */*" },
        credentials: "include",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const rows = (json && (json.comments || json.data || json.list)) || [];
      if (!Array.isArray(rows) || rows.length === 0) st.noMore = true;
      else {
        st.items.push(...rows);
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

  async function loadHubCollections(reset = false) {
    const st = state.hubData.collections;
    if (st.loading) return;
    if (reset) { st.items = []; st.page = 0; st.noMore = false; st.error = null; }
    if (st.noMore) return;
    st.loading = true;
    renderUserHubIfOpen();
    try {
      const nextPage = st.page + 1;
      const resp = await fetch(`/api/statistics/list-collection?page=${nextPage}`, {
        headers: { Accept: "application/json, text/plain, */*" },
        credentials: "include",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const rows = (json && (json.collections || json.data || json.list)) || [];
      if (!Array.isArray(rows) || rows.length === 0) st.noMore = true;
      else {
        const seen = new Set(st.items.map((x) => String(x.post_id || x.postId || x.id)));
        for (const r of rows) {
          const pid = String(r.post_id || r.postId || r.id || "");
          if (pid) {
            state.collectedSet.add(pid);
            if (!seen.has(pid)) { st.items.push(r); seen.add(pid); }
          }
        }
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

  async function loadHubCredit(reset = false) {
    const st = state.hubData.credit;
    if (st.loading) return;
    if (reset) { st.items = []; st.page = 0; st.noMore = false; st.error = null; }
    if (st.noMore) return;
    st.loading = true;
    renderUserHubIfOpen();
    try {
      const nextPage = st.page + 1;
      const resp = await fetch(`/api/account/credit/page-${nextPage}`, {
        headers: { Accept: "application/json, text/plain, */*" },
        credentials: "include",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      if (json && json.success === false && /max page/i.test(json.message || "")) {
        st.noMore = true;
      } else {
        const rows = (json && (Array.isArray(json.data) ? json.data : json.data?.list || json.data?.records)) || [];
        if (!Array.isArray(rows) || rows.length === 0) st.noMore = true;
        else {
          st.items.push(...rows);
          st.page = nextPage;
          if (rows.length < 15) st.noMore = true;
        }
      }
    } catch (err) {
      st.error = err.message;
    } finally {
      st.loading = false;
      renderUserHubIfOpen();
    }
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

  function renderUserHub() {
    const bd = document.getElementById("nsc-hub-backdrop");
    if (!bd) return;
    const modal = bd.querySelector(".nsc-hub-modal");
    if (!modal) return;

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
    };

    const tabs = [
      { id: "notif", label: "通知中心", cnt: totalNotif },
      { id: "posts", label: "主题帖" },
      { id: "comments", label: "评论" },
      { id: "collections", label: "收藏" },
      { id: "credit", label: "鸡腿账簿" },
      { id: "stardust", label: "星辰记录" },
      { id: "fans", label: "粉丝/关注" },
      { id: "progress", label: "等级额度" },
    ];

    const uInfo = uid && state.userCache[String(uid)];
    modal.innerHTML = `
      <div class="nsc-hub-head">
        <div class="nsc-hub-user">
          <img src="${avatarUrl}" alt="" />
          <div style="min-width:0;">
            <div style="font-size:14.5px;font-weight:700;display:flex;align-items:center;gap:6px;">
              <span>${escHtml(state.currentUser || "个人中心")}</span>
              ${uInfo && uInfo.level ? `<span class="nsc-lv-pill">${escHtml(uInfo.level)}</span>` : ""}
            </div>
            <div style="font-size:11px;color:var(--nsc-muted);">UID: ${uid || "-"} · macOS 工作台个人空间</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <a class="nsc-mini-btn" href="${nativeHrefMap[state.hubTab] || "/notification"}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">原版页面 ↗</a>
          <button type="button" class="nsc-mini-btn" id="nsc-hub-close" style="padding:3px 9px;">✕</button>
        </div>
      </div>
      <div class="nsc-hub-tabs">
        ${tabs.map((t) => `
          <button type="button" class="nsc-hub-tab ${state.hubTab === t.id ? "is-active" : ""}" data-htab="${t.id}">
            <span>${t.label}</span>
            ${t.cnt > 0 ? `<span class="nsc-hub-tab-cnt">${t.cnt > 99 ? "99+" : t.cnt}</span>` : ""}
          </button>
        `).join("")}
      </div>
      <div class="nsc-hub-subbar" id="nsc-hub-subbar"></div>
      <div class="nsc-hub-body" id="nsc-hub-body"></div>
    `;

    const closeHub = () => bd.classList.remove("is-open");
    modal.querySelector("#nsc-hub-close").addEventListener("click", closeHub);
    modal.querySelectorAll("[data-htab]").forEach((btn) => {
      btn.addEventListener("click", () => openUserHubModal(btn.dataset.htab));
    });

    const subbar = modal.querySelector("#nsc-hub-subbar");
    const body = modal.querySelector("#nsc-hub-body");

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
            if (!it.viewed) markNotificationViewed(state.hubNotifSub, it.id, false);
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
      if (!st.noMore) {
        const more = document.createElement("button");
        more.type = "button";
        more.className = "nsc-load-more-btn";
        more.textContent = st.loading ? "加载中..." : "加载更多主题帖";
        more.addEventListener("click", () => loadHubPosts(false));
        body.appendChild(more);
      }
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
        const pageIdx = Math.max(1, Math.ceil(floor / 20));
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
      if (!st.noMore) {
        const more = document.createElement("button");
        more.type = "button";
        more.className = "nsc-load-more-btn";
        more.textContent = st.loading ? "加载中..." : "加载更多评论";
        more.addEventListener("click", () => loadHubComments(false));
        body.appendChild(more);
      }
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
      if (!st.noMore) {
        const more = document.createElement("button");
        more.type = "button";
        more.className = "nsc-load-more-btn";
        more.textContent = st.loading ? "加载中..." : "加载更多收藏";
        more.addEventListener("click", () => loadHubCollections(false));
        body.appendChild(more);
      }
      return;
    }

    if (state.hubTab === "credit") {
      const st = state.hubData.credit;
      subbar.innerHTML = `<span style="font-size:12px;color:var(--nsc-muted);">已加载 ${st.items.length} 条鸡腿明细（第 ${st.page || 1} 页）</span>`;
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
      if (!st.noMore) {
        const more = document.createElement("button");
        more.type = "button";
        more.className = "nsc-load-more-btn";
        more.textContent = st.loading ? "加载中..." : "加载下一页账簿";
        more.addEventListener("click", () => loadHubCredit(false));
        body.appendChild(more);
      }
      return;
    }

    if (state.hubTab === "stardust") {
      const st = state.hubData.stardust;
      const seg = document.createElement("div");
      seg.className = "nsc-seg-tabs";
      [
        { id: "recv", label: "我收到的" },
        { id: "sent", label: "我送出的" },
      ].forEach((m) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "nsc-seg-btn" + (st.mode === m.id ? " is-active" : "");
        b.textContent = m.label;
        b.addEventListener("click", () => loadHubStardust(true, m.id));
        seg.appendChild(b);
      });
      const refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.className = "nsc-mini-btn";
      refBtn.textContent = st.loading ? "加载中..." : "刷新";
      refBtn.addEventListener("click", () => loadHubStardust(true));
      subbar.appendChild(seg);
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
      if (!st.noMore) {
        const more = document.createElement("button");
        more.type = "button";
        more.className = "nsc-load-more-btn";
        more.textContent = st.loading ? "加载中..." : "加载更多记录";
        more.addEventListener("click", () => loadHubStardust(false));
        body.appendChild(more);
      }
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
      const refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.className = "nsc-mini-btn";
      refBtn.textContent = store.loading ? "同步中..." : "刷新";
      refBtn.addEventListener("click", () => fetchFansOrFollow(subMode).then(() => renderUserHubIfOpen()));
      subbar.appendChild(seg);
      subbar.appendChild(refBtn);

      if (store.loading && store.items.length === 0) {
        body.innerHTML = `<div class="nsc-empty-state">正在同步列表...</div>`;
        return;
      }
      if (store.items.length === 0) {
        body.innerHTML = `<div class="nsc-empty-state">暂无记录</div>`;
        return;
      }
      const grid = document.createElement("div");
      grid.className = "nsc-hub-fan-grid";
      store.items.forEach((u) => {
        const cachedSpeak = u.uid ? state.lastSpeakCache[u.uid] : null;
        const card = document.createElement("div");
        card.className = "nsc-hub-row";
        card.style.marginBottom = "0";
        card.innerHTML = `
          <img src="${u.avatar || `/avatar/${u.uid}.png`}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex:0 0 36px;" />
          <div class="nsc-hub-row-main">
            <div class="nsc-hub-row-title">${escHtml(u.name)}</div>
            <div class="nsc-hub-row-sub">${cachedSpeak ? `发言: ${escHtml(cachedSpeak.timeStr)}` : `UID: ${escHtml(u.uid)}`}</div>
          </div>
          <button type="button" class="nsc-icon-btn" title="发私信">${ICONS.pm}</button>
        `;
        card.querySelector("button").addEventListener("click", (e) => {
          e.stopPropagation();
          closeHub();
          switchChannel("pm", false);
          openPmConversation(u);
        });
        card.addEventListener("click", () => openUserProfileModal(u));
        grid.appendChild(card);
      });
      body.appendChild(grid);
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
    } else if (tab === "progress") {
      loadHubProgress(false);
    }

    renderUserHub();
  }

