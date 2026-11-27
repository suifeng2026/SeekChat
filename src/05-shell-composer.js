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
    if (state.themeMode === "dusk") return "dusk";
    return document.body.classList.contains("dark-layout") ? "dark" : "light";
  }

  function syncThemeButtons() {
    const cur = getEffectiveThemeMode();
    document.querySelectorAll("#nsc-theme-seg .nsc-theme-btn").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.theme === cur);
    });
  }

  function applyThemeMode(mode) {
    state.themeMode = mode;
    localStorage.setItem(LS.THEME, mode);
    const headThemeBtn = document.querySelector("#nsk-head .color-theme-switcher");
    const isDark = document.body.classList.contains("dark-layout");

    if (mode === "dusk") {
      document.body.classList.add("nsc-theme-dusk");
      if (isDark) {
        if (headThemeBtn) headThemeBtn.click();
        else {
          document.body.classList.remove("dark-layout");
          document.body.classList.add("light-layout");
        }
      }
    } else if (mode === "dark") {
      document.body.classList.remove("nsc-theme-dusk");
      if (!isDark) {
        if (headThemeBtn) headThemeBtn.click();
        else {
          document.body.classList.remove("light-layout");
          document.body.classList.add("dark-layout");
        }
      }
    } else {
      document.body.classList.remove("nsc-theme-dusk");
      if (isDark) {
        if (headThemeBtn) headThemeBtn.click();
        else {
          document.body.classList.remove("dark-layout");
          document.body.classList.add("light-layout");
        }
      }
    }
    syncThemeButtons();
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
      if (msgsEl.scrollTop < 120) {
        tryAutoLoadPrevPage();
      }
      if (msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 220) {
        tryAutoLoadNextPage();
      }
    });
    msgsEl.addEventListener("wheel", (e) => {
      if (e.deltaY < 0 && msgsEl.scrollTop <= 2) {
        tryAutoLoadPrevPage();
      }
    }, { passive: true });

    shell.querySelectorAll("#nsc-theme-seg .nsc-theme-btn").forEach((b) => {
      b.addEventListener("click", () => applyThemeMode(b.dataset.theme));
    });
    if (state.themeMode === "dusk") {
      applyThemeMode("dusk");
    } else {
      syncThemeButtons();
    }

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
            const tempMetaMap = extractPostMetaFromTempScript(pDoc);
            const seen = new Set(state.currentRoom.flatComments.map((c) => c.floorId));
            for (const el of pDoc.querySelectorAll("ul.comments li.content-item")) {
              const obj = extractCommentObject(el, false, lastPage, tempMetaMap);
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
            const tempMetaMap = extractPostMetaFromTempScript(pDoc);
            const seen = new Set(state.currentRoom.flatComments.map((c) => c.floorId));
            let added = 0;
            for (const el of pDoc.querySelectorAll("ul.comments li.content-item")) {
              const obj = extractCommentObject(el, false, lastPage, tempMetaMap);
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

  function enhanceCodeBlocks(containerEl) {
    if (!containerEl) return;
    for (const pre of containerEl.querySelectorAll("pre")) {
      if (pre.dataset.nscCopyInit === "1") continue;
      pre.dataset.nscCopyInit = "1";
      const codeEl = pre.querySelector("code");
      const rawText = ((codeEl ? codeEl.textContent : pre.textContent) || "").replace(/\n+$/, "");
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

