  async function fetchPostPageDoc(url) {
    const resp = await fetch(url, { credentials: "include" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return new DOMParser().parseFromString(await resp.text(), "text/html");
  }

  function mergePostPageComments(room, doc, pageNum, outAdded = null) {
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
      if (Array.isArray(outAdded)) outAdded.push(obj);
      added++;
    }
    state.loadedPages.add(pageNum);
    for (const np of parsePagesFromDoc(doc, room.pid)) {
      if (!room.pages.some((p) => p.num === np.num)) room.pages.push(np);
    }
    room.pages.sort((a, b) => a.num - b.num);
    return added;
  }

  function appendRoomCommentsIncrementally(room, doc, pageNum) {
    if (!room || !doc || state.activePmPeer || state.currentRoom !== room) return 0;
    const newObjs = [];
    const added = mergePostPageComments(room, doc, pageNum, newObjs);
    if (added <= 0) return 0;

    const msgsEl = document.getElementById("nsc-chat-messages");
    if (!msgsEl || !msgsEl.querySelector(".nsc-msg")) {
      renderChatRoom(room, true);
      return added;
    }

    room.flatComments.sort((a, b) => (a.pageNum - b.pageNum) || (Number(a.floorId) - Number(b.floorId)));
    const roots = buildThreadedComments(room.flatComments);
    const rootByFloor = new Map(roots.map((r) => [String(r.floorId), r]));
    const pagerEl = msgsEl.querySelector(".nsc-chat-pager");
    const insertBeforeEl = pagerEl || msgsEl.querySelector("#nsc-waterfall-status") || null;

    const existingDividers = new Set(
      Array.from(msgsEl.querySelectorAll(".nsc-page-divider")).map((d) => d.textContent.trim())
    );

    const updatedRoots = new Set();
    for (const obj of newObjs) {
      if (rootByFloor.has(String(obj.floorId))) {
        if (room.pages.length > 1 && obj.pageNum) {
          const divTxt = `第 ${obj.pageNum} 页`;
          if (!existingDividers.has(divTxt)) {
            existingDividers.add(divTxt);
            const div = document.createElement("div");
            div.className = "nsc-page-divider";
            div.textContent = divTxt;
            msgsEl.insertBefore(div, insertBeforeEl);
          }
        }
        if (!document.getElementById(`nsc-floor-${obj.floorId}`)) {
          msgsEl.insertBefore(createMessageNode(obj, false, room.isNativePage), insertBeforeEl);
        }
      } else {
        const parentRoot = roots.find((r) => r.children && r.children.some((ch) => String(ch.floorId) === String(obj.floorId)));
        if (parentRoot && !updatedRoots.has(parentRoot.floorId)) {
          updatedRoots.add(parentRoot.floorId);
          const oldEl = document.getElementById(`nsc-floor-${parentRoot.floorId}`);
          if (oldEl) oldEl.replaceWith(createMessageNode(parentRoot, false, room.isNativePage));
        }
      }
    }

    const totalPages = room.pages.length || 1;
    const subEl = document.getElementById("nsc-chat-subtitle");
    if (subEl) {
      subEl.innerHTML = `
        ${room.catName ? `<span>版块: ${escHtml(room.catName)}</span>` : ""}
        <span>楼主: ${escHtml(state.opAuthor || "查看首楼")}</span>
        <span>已加载 ${room.flatComments.length} 条回复 (${state.loadedPages.size}/${totalPages} 页)</span>
      `;
    }
    const wfTip = document.getElementById("nsc-waterfall-status");
    if (wfTip) {
      const maxLoaded = Math.max(...Array.from(state.loadedPages));
      wfTip.textContent = maxLoaded < totalPages ? `继续下滑自动预加载第 ${maxLoaded + 1} 页` : "已加载全部楼层";
    }
    applyMessageFilters();
    enrichVisibleMemberBadges();
    return added;
  }

  const _postRoomCache = new Map();
  const MAX_POST_ROOM_CACHE = 10;
  const _expandedThreadFloors = new Set();
  let _activeJumpTarget = { pid: "", floorId: "", ts: 0 };

  function isThreadCollapsedForFloor(floorId) {
    return Boolean(state.threadsCollapsed && !_expandedThreadFloors.has(String(floorId)));
  }

  async function ensureThreadParentLoadedForFloor(room, targetFloorId, reqSeq) {
    if (!room || !targetFloorId) return;
    let curId = String(targetFloorId);
    for (let hop = 0; hop < 3; hop++) {
      const curObj = room.flatComments.find((c) => String(c.floorId) === curId);
      if (!curObj || !curObj.replyToFloor || curObj.replyToFloor === "0") break;
      const parentId = String(curObj.replyToFloor);
      const parentLoaded = room.flatComments.some((c) => String(c.floorId) === parentId);
      if (parentLoaded) {
        curId = parentId;
        continue;
      }
      const pPage = Math.max(1, Math.ceil(Number(parentId) / 10));
      if (state.loadedPages.has(pPage)) break;
      try {
        const pDoc = await fetchPostPageDoc(`/post-${room.pid}-${pPage}`);
        if (reqSeq !== state.chatViewSeq || state.activePmPeer || state.currentPostId !== room.pid || state.currentRoom !== room) return;
        mergePostPageComments(room, pDoc, pPage);
        room.flatComments.sort((a, b) => (a.pageNum - b.pageNum) || (Number(a.floorId) - Number(b.floorId)));
        curId = parentId;
      } catch (_) {
        break;
      }
    }
  }

  function saveCurrentRoomToCache() {
    if (state.activePmPeer || !state.currentRoom || !state.currentRoom.pid) return;
    const pid = String(state.currentRoom.pid);
    const msgsEl = document.getElementById("nsc-chat-messages");
    const scrollTop = msgsEl ? msgsEl.scrollTop : 0;
    if (_postRoomCache.has(pid)) _postRoomCache.delete(pid);
    _postRoomCache.set(pid, {
      room: state.currentRoom,
      loadedPages: Array.from(state.loadedPages),
      opAuthor: state.opAuthor,
      scrollTop,
      ts: Date.now(),
    });
    while (_postRoomCache.size > MAX_POST_ROOM_CACHE) {
      const oldestKey = _postRoomCache.keys().next().value;
      if (oldestKey === undefined) break;
      _postRoomCache.delete(oldestKey);
    }
  }

  async function openPostInChat(itemMeta) {
    saveCurrentRoomToCache();
    const prevPid = state.currentPostId;
    const reqSeq = ++state.chatViewSeq;
    state.activePmPeer = null;
    const url = itemMeta.url || `/post-${itemMeta.postId}-1`;
    const pid = String(itemMeta.postId || getPostIdFromPath(url) || "");
    if (pid !== prevPid) _expandedThreadFloors.clear();
    const reqPage = parsePageNumFromUrl(url);
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
    if (typeof updateTopicListSelection === "function") updateTopicListSelection(pid);

    const msgsEl = document.getElementById("nsc-chat-messages");
    const subEl = document.getElementById("nsc-chat-subtitle");

    const cached = !itemMeta.forceRefresh && !itemMeta.targetFloor && pid ? _postRoomCache.get(pid) : null;
    if (cached && cached.room && cached.loadedPages.includes(reqPage)) {
      _postRoomCache.delete(pid);
      _postRoomCache.set(pid, cached);
      cached.room.isNativePage = (pid === state.nativePostId);
      state.currentRoom = cached.room;
      state.loadedPages = new Set(cached.loadedPages);
      state.opAuthor = cached.opAuthor || "";
      if (msgsEl) msgsEl.classList.remove("is-switching");
      renderChatRoom(cached.room, true);
      if (msgsEl) msgsEl.scrollTop = cached.scrollTop || 0;
      if (Date.now() - cached.ts > 20000) {
        const lastPage = Math.max(1, (cached.room.pages && cached.room.pages.length) || 1);
        fetchPostPageDoc(`/post-${pid}-${lastPage}`).then((pDoc) => {
          if (reqSeq !== state.chatViewSeq || state.activePmPeer || state.currentPostId !== pid || state.currentRoom !== cached.room) return;
          const prevTop = msgsEl ? msgsEl.scrollTop : 0;
          const added = appendRoomCommentsIncrementally(cached.room, pDoc, lastPage);
          cached.ts = Date.now();
          cached.loadedPages = Array.from(state.loadedPages);
          if (added > 0 && msgsEl) msgsEl.scrollTop = prevTop;
        }).catch(() => {});
      }
      return;
    }

    if (subEl) subEl.innerHTML = `<span>正在载入帖子...</span>`;
    if (msgsEl) {
      if (msgsEl.children.length > 0 && !msgsEl.querySelector(".nsc-empty-state")) {
        msgsEl.classList.add("is-switching");
      } else {
        msgsEl.innerHTML = `<div class="nsc-empty-state">正在载入帖子群聊内容...</div>`;
      }
    }

    try {
      const doc = await fetchPostPageDoc(url);
      if (reqSeq !== state.chatViewSeq || state.activePmPeer || state.currentPostId !== pid) return;
      if (msgsEl) msgsEl.classList.remove("is-switching");
      renderPostDocument(doc, url, pid === state.nativePostId, itemMeta);
      if (itemMeta.targetFloor && state.currentRoom) {
        state._suppressWaterfallUntil = Date.now() + 900;
        const beforePages = state.loadedPages.size;
        await ensureThreadParentLoadedForFloor(state.currentRoom, itemMeta.targetFloor, reqSeq);
        if (reqSeq !== state.chatViewSeq || state.activePmPeer || state.currentPostId !== pid) return;
        if (state.loadedPages.size > beforePages) {
          renderChatRoom(state.currentRoom, true);
        }
        jumpToFloor(itemMeta.targetFloor, { instant: true });
      }
      saveCurrentRoomToCache();
    } catch (err) {
      if (reqSeq !== state.chatViewSeq || state.activePmPeer || state.currentPostId !== pid) return;
      if (msgsEl) {
        msgsEl.classList.remove("is-switching");
        msgsEl.innerHTML = `<div class="nsc-empty-state">加载失败：${escHtml(err.message)}</div>`;
      }
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
    let bodyHtml = "";
    if (article) {
      const artClone = article.cloneNode(true);
      if (typeof stripThirdPartyArtifacts === "function") stripThirdPartyArtifacts(artClone);
      bodyHtml = artClone.innerHTML;
    }

    const sigEl = el.querySelector(":scope > .signature, .signature");
    let signatureHtml = "";
    if (sigEl) {
      const sigClone = sigEl.cloneNode(true);
      if (typeof stripThirdPartyArtifacts === "function") stripThirdPartyArtifacts(sigClone);
      signatureHtml = sigClone.innerHTML.trim();
    }
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
    if (state.activeChannel === "history" || state.readFilterMode === "read") {
      renderTopicList();
    } else if (typeof updateTopicListSelection === "function") {
      updateTopicListSelection(pid);
    }

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
      const added = appendRoomCommentsIncrementally(room, doc, nextPageObj.num);
      if (added === 0 && footerTip) {
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
        let anchorFloorId = "";
        let anchorOffset = 0;
        if (msgsEl) {
          const cTop = msgsEl.getBoundingClientRect().top;
          for (const node of msgsEl.querySelectorAll(".nsc-msg[data-floor]")) {
            const r = node.getBoundingClientRect();
            if (r.bottom > cTop + 8) {
              anchorFloorId = node.dataset.floor || "";
              anchorOffset = r.top - cTop;
              break;
            }
          }
        }
        const prevH = msgsEl ? msgsEl.scrollHeight : 0;
        const prevTop = msgsEl ? msgsEl.scrollTop : 0;
        renderChatRoom(room, true);
        if (msgsEl) {
          if (_activeJumpTarget.floorId && _activeJumpTarget.pid === room.pid && Date.now() - _activeJumpTarget.ts < 3000) {
            jumpToFloor(_activeJumpTarget.floorId, { instant: true });
          } else {
            const anchorEl = anchorFloorId ? document.getElementById(`nsc-floor-${anchorFloorId}`) : null;
            if (anchorEl) {
              const curOffset = anchorEl.getBoundingClientRect().top - msgsEl.getBoundingClientRect().top;
              msgsEl.scrollTop = Math.max(0, msgsEl.scrollTop + (curOffset - anchorOffset));
            } else {
              const delta = msgsEl.scrollHeight - prevH;
              msgsEl.scrollTop = Math.max(0, prevTop + delta);
            }
          }
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

  async function jumpToFloor(floorNumStr, { instant = false } = {}) {
    const targetId = String(floorNumStr || "").replace(/[^\d]/g, "");
    if (!targetId || state.activePmPeer) return;

    state._suppressWaterfallUntil = Date.now() + 900;
    _activeJumpTarget = { pid: String(state.currentPostId || ""), floorId: targetId, ts: Date.now() };

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
      await ensureThreadParentLoadedForFloor(room, targetId, jumpSeq);
      if (jumpSeq !== state.chatViewSeq || state.activePmPeer || state.currentRoom !== room || state.currentPostId !== room.pid) return;
      renderChatRoom(room, true);
      target =
        (msgsEl && msgsEl.querySelector(`[data-floor="${targetId}"]`)) ||
        document.getElementById(`nsc-floor-${targetId}`);
    }

    if (!target) return;
    const hiddenThread = target.closest(".nsc-thread-wrap.is-collapsed");
    if (hiddenThread) {
      hiddenThread.classList.remove("is-collapsed");
      const parentMsg = hiddenThread.closest(".nsc-msg");
      if (parentMsg) {
        if (parentMsg.dataset.floor) _expandedThreadFloors.add(String(parentMsg.dataset.floor));
        const pill = parentMsg.querySelector('.nsc-react-pill.is-reply[data-thread-toggle="1"]');
        const sp = pill && pill.querySelector("span");
        if (sp) sp.textContent = `${pill.dataset.count} 条回复 ▾`;
      }
    }
    const hiddenMsg = target.closest(".nsc-msg.is-hidden-filter");
    if (hiddenMsg || target.classList.contains("is-hidden-filter")) {
      state.onlyOp = false;
      state.onlyMember = "";
      applyMessageFilters();
    }
    const scrollToTarget = (behaviorMode) => {
      if (!msgsEl || !target.isConnected) return;
      const cRect = msgsEl.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      const targetTop = msgsEl.scrollTop + (tRect.top - cRect.top) - Math.max(24, (msgsEl.clientHeight - tRect.height) / 2);
      msgsEl.scrollTo({ top: Math.max(0, targetTop), behavior: behaviorMode });
    };
    scrollToTarget(instant ? "auto" : "smooth");
    if (instant) {
      requestAnimationFrame(() => scrollToTarget("auto"));
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
      _expandedThreadFloors.clear();
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

    syncComposerMode("post");

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

  let _badgeIo = null;
  let _badgeQueue = [];
  let _badgeActive = 0;
  const _badgeQueuedSet = new Set();

  function pumpBadgeQueue(room, seq) {
    if (state.activePmPeer || state.currentRoom !== room || seq !== state.chatViewSeq) {
      _badgeQueue = [];
      _badgeQueuedSet.clear();
      return;
    }
    while (_badgeActive < 2 && _badgeQueue.length > 0) {
      const uid = _badgeQueue.shift();
      _badgeQueuedSet.delete(uid);
      if (!uid) continue;
      if (state.userCache[uid] && Date.now() - state.userCache[uid].ts < 12 * 3600000) {
        syncUserBadgeToChatDom(uid, state.userCache[uid]);
        continue;
      }
      _badgeActive++;
      fetchUserProfile(uid, "").then((info) => {
        if (!state.activePmPeer && state.currentRoom === room && seq === state.chatViewSeq && info) {
          syncUserBadgeToChatDom(uid, info);
        }
      }).catch(() => {}).finally(() => {
        _badgeActive = Math.max(0, _badgeActive - 1);
        setTimeout(() => pumpBadgeQueue(room, seq), 120);
      });
    }
  }

  function enrichVisibleMemberBadges() {
    if (_badgeIo) {
      _badgeIo.disconnect();
      _badgeIo = null;
    }
    _badgeQueue = [];
    _badgeQueuedSet.clear();

    const room = state.currentRoom;
    const seq = state.chatViewSeq;
    const msgsEl = document.getElementById("nsc-chat-messages");
    if (!room || !msgsEl) return;

    const nodes = Array.from(msgsEl.querySelectorAll(".nsc-msg[data-uid], .nsc-thread-item[data-uid]"));
    const pendingNodes = [];
    const seenCached = new Set();
    for (const node of nodes) {
      const uid = node.dataset.uid;
      if (!uid) continue;
      const uc = state.userCache[uid];
      if (uc && Date.now() - uc.ts < 12 * 3600000) {
        if (!seenCached.has(uid)) {
          seenCached.add(uid);
          syncUserBadgeToChatDom(uid, uc);
        }
        continue;
      }
      if (!node.querySelector(".nsc-lv-pill")) {
        pendingNodes.push(node);
      }
    }
    if (pendingNodes.length === 0) return;

    const enqueueUid = (uid) => {
      if (!uid || _badgeQueuedSet.has(uid)) return;
      if (state.userCache[uid] && Date.now() - state.userCache[uid].ts < 12 * 3600000) {
        syncUserBadgeToChatDom(uid, state.userCache[uid]);
        return;
      }
      _badgeQueuedSet.add(uid);
      _badgeQueue.push(uid);
      pumpBadgeQueue(room, seq);
    };

    if (typeof IntersectionObserver !== "function") {
      for (const n of pendingNodes.slice(0, 8)) enqueueUid(n.dataset.uid);
      return;
    }

    _badgeIo = new IntersectionObserver((entries) => {
      if (state.activePmPeer || state.currentRoom !== room || seq !== state.chatViewSeq) {
        if (_badgeIo) { _badgeIo.disconnect(); _badgeIo = null; }
        return;
      }
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const uid = entry.target.dataset.uid;
        if (_badgeIo) _badgeIo.unobserve(entry.target);
        enqueueUid(uid);
      }
    }, { root: msgsEl, rootMargin: "120px 0px" });

    for (const node of pendingNodes) {
      _badgeIo.observe(node);
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
        : `${ICONS.reply}<span>${replyCnt} 条回复 ${isThreadCollapsedForFloor(obj.floorId) ? "▸" : "▾"}</span>`;
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
          if (collapsed) _expandedThreadFloors.delete(String(obj.floorId));
          else _expandedThreadFloors.add(String(obj.floorId));
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
    avBtn.innerHTML = `<img src="${obj.avatar || "/static/image/favicon/android-chrome-192x192.png"}" loading="lazy" decoding="async" alt="${obj.author}" />`;
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
      threadWrap.className = "nsc-thread-wrap" + (isThreadCollapsedForFloor(obj.floorId) ? " is-collapsed" : "");

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
          <img class="nsc-t-avatar" src="${ch.avatar || "/static/image/favicon/android-chrome-192x192.png"}" loading="lazy" decoding="async" alt="${ch.author}" />
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

  function buildQuoteSnippetForFloor(obj, actionTitle) {
    if (!obj) return "";
    if (actionTitle === "回复") {
      return `@${obj.author} #${obj.floorId} `;
    }
    const tpl = document.createElement("template");
    tpl.innerHTML = obj.bodyHtml || "";
    tpl.content.querySelectorAll("blockquote, script, style, .nsc-sd-card, .nsc-vote-card").forEach((n) => n.remove());
    tpl.content.querySelectorAll("br").forEach((br) => br.replaceWith(" "));
    const rawText = (tpl.content.textContent || "").replace(/\s+/g, " ").trim();
    const excerpt = rawText.length > 100 ? `${rawText.slice(0, 100)}...` : rawText;
    return excerpt
      ? `> @${obj.author} #${obj.floorId}\n> ${excerpt}\n\n`
      : `> @${obj.author} #${obj.floorId}\n\n`;
  }

  async function triggerReplyOrVote(obj, actionTitle, isNativePage, reactionsEl, hoverBar) {
    const syncBarCnt = () => {
      if (reactionsEl) renderReactionPills(reactionsEl, obj, isNativePage, obj.floorId === "0");
    };

    if (actionTitle === "引用" || actionTitle === "回复") {
      syncComposerMode("post");
      const snippet = buildQuoteSnippetForFloor(obj, actionTitle);
      if (typeof insertTextToActiveComposer === "function" && insertTextToActiveComposer(snippet, { asLine: true })) {
        return;
      }
    }

    if (isNativePage) {
      const nativeLi = (_nativeFloorMap && _nativeFloorMap.get(String(obj.floorId))) || document.querySelector(`#nsk-frame [id="${obj.floorId}"].content-item`);
      if (nativeLi) {
        const menuItems = Array.from(nativeLi.querySelectorAll(".comment-menu .menu-item"));
        const target = menuItems.find(
          (m) => (m.getAttribute("title") || "") === actionTitle || (m.textContent || "").includes(actionTitle)
        );
        if (target) {
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

