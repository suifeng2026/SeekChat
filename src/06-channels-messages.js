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
          openUserHubModal(tab);
        }
      });
    }
    const signBtn = userCard.querySelector('.menu span[title="签到"]');
    if (signBtn && signBtn.dataset.nscHubBound !== "1") {
      signBtn.dataset.nscHubBound = "1";
      signBtn.addEventListener("click", (e) => {
        if (!document.body.classList.contains("nsc-app-active")) return;
        if (typeof openUserHubModal === "function") {
          e.preventDefault();
          e.stopPropagation();
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
          openUserHubModal("setting");
        }
      });
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
        setTimeout(() => {
          document.body.classList.remove("nsc-theme-dusk");
          const nextMode = document.body.classList.contains("dark-layout") ? "dark" : "light";
          state.themeMode = nextMode;
          localStorage.setItem(LS.THEME, nextMode);
          syncThemeButtons();
        }, 40);
      });
    }

    if (state.themeMode === "dusk") {
      document.body.classList.add("nsc-theme-dusk");
    }
    syncThemeButtons();
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
        const floorId = Number(it.floor_id ?? it.floorId ?? 0) || 0;
        const pageIndex = floorId > 0 ? Math.ceil(floorId / 20) : 1;
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
    if (titleEl) titleEl.textContent = `私信：${state.activePmPeer.name}`;
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
        enhanceCodeBlocks(pmBubble);
        processBubbleImages(pmBubble);
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
            syncComposerMode(false);
            renderTopicList();
            const titleEl = document.getElementById("nsc-chat-title");
            const subChat = document.getElementById("nsc-chat-subtitle");
            const actionsEl = document.getElementById("nsc-chat-actions");
            const msgsEl = document.getElementById("nsc-chat-messages");
            if (titleEl) titleEl.textContent = `系统通知 · ${it.tag.label}`;
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

      // 搜索过滤结果较少时自动向下瀑布流预拉最多至第 4 页（仅在无错误时）
      if (kw && items.length < 8 && chData && !chData.loading && !chData.noMore && !chData.error && page < 4) {
        setTimeout(() => tryAutoLoadNextTopicPage(), 80);
      }
    }
    restoreScroll();
  }

