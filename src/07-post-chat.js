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

  function buildHoverBar(obj, isNativePage, reactionsEl, isThread = false) {
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

    const hoverBar = buildHoverBar(obj, isNativePage, reactionsEl, false);
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

