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
    const updateLbNavPositions = (dispW) => {
      const prevBtn = document.getElementById("nsc-lb-prev");
      const nextBtn = document.getElementById("nsc-lb-next");
      if (!prevBtn || !nextBtn) return;
      const sr = lbStage.getBoundingClientRect();
      const stageW = sr.width || window.innerWidth;
      if (!dispW || dispW <= 0) {
        prevBtn.style.left = "";
        nextBtn.style.right = "";
        return;
      }
      const btnW = 44;
      const gap = 18;
      const leftPos = Math.max(14, Math.round(stageW / 2 - dispW / 2 + _lbTx - gap - btnW));
      const rightPos = Math.max(14, Math.round(stageW / 2 - dispW / 2 - _lbTx - gap - btnW));
      const maxPos = Math.max(14, Math.round(stageW / 2 - btnW - gap));
      prevBtn.style.left = `${Math.min(maxPos, leftPos)}px`;
      nextBtn.style.right = `${Math.min(maxPos, rightPos)}px`;
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
        updateLbNavPositions(nw > 0 ? Math.round(nw * fitScale) : 0);
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
      updateLbNavPositions(targetW);
    };
    _applyLbTransform = applyLbTransform;
    lbImg.addEventListener("load", () => {
      if (lightbox.classList.contains("is-open")) applyLbTransform();
    });
    window.addEventListener("resize", () => {
      if (lightbox.classList.contains("is-open")) applyLbTransform();
    });

    lightbox.addEventListener("click", (e) => {
      if (_lbMoved) {
        _lbMoved = false;
        return;
      }
      if (e.target && e.target.id === "nsc-lightbox-close") {
        lightbox.classList.remove("is-open");
        return;
      }
      if (e.target === lbImg || (e.target && e.target.closest(".nsc-lightbox-btn, .nsc-lb-nav"))) {
        return;
      }
      lightbox.classList.remove("is-open");
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
        if (_lbMoved) {
          setTimeout(() => { _lbMoved = false; }, 0);
        }
      }
    });
    lbImg.addEventListener("click", (e) => {
      e.stopPropagation();
      if (_lbMoved) {
        _lbMoved = false;
        return;
      }
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
        if (npBackdrop.classList.contains("is-open")) closeNp();
        const editBd = document.getElementById("nsc-edit-backdrop");
        if (editBd) editBd.classList.remove("is-open");
        const hubBd = document.getElementById("nsc-hub-backdrop");
        if (hubBd) hubBd.classList.remove("is-open");
        const spaceBd = document.getElementById("nsc-space-backdrop");
        if (spaceBd) spaceBd.classList.remove("is-open");
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
          <div class="nsc-np-editor-host" id="nsc-np-editor-host"></div>
        </div>
        <div class="nsc-newpost-foot">
          <span id="nsc-np-status" style="font-size:11.5px;color:var(--nsc-muted);">无刷新直发社区，支持完整 Markdown / 表情 / 图床</span>
          <div style="display:flex;gap:8px;">
            <button type="button" class="nsc-pill-btn" id="nsc-np-cancel">取消</button>
            <button type="button" class="nsc-send-btn" id="nsc-np-submit">发布帖子</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(npBackdrop);

    const npCat = npBackdrop.querySelector("#nsc-np-cat");
    const npTitle = npBackdrop.querySelector("#nsc-np-title");
    const npHost = npBackdrop.querySelector("#nsc-np-editor-host");
    const npNativeLink = npBackdrop.querySelector("#nsc-np-native-link");
    const npStatus = npBackdrop.querySelector("#nsc-np-status");
    const npSubmit = npBackdrop.querySelector("#nsc-np-submit");

    const getNpEditorVal = () => {
      const nat = npHost.querySelector(".md-editor:not(.nsc-unified-editor)");
      if (nat) return getNativeEditorValue(nat);
      const uTa = npHost.querySelector("#nsc-np-unified-ta");
      return uTa ? uTa.value : "";
    };
    const clearNpEditorVal = () => {
      const nat = npHost.querySelector(".md-editor:not(.nsc-unified-editor)");
      if (nat) setNativeEditorValue(nat, "");
      const uTa = npHost.querySelector("#nsc-np-unified-ta");
      if (uTa) {
        uTa.value = "";
        uTa.dispatchEvent(new Event("input", { bubbles: true }));
      }
      _composerDrafts.delete("newpost");
    };
    const mountNpEditor = () => {
      const nat =
        document.querySelector("#nsc-composer-body .md-editor:not(.nsc-unified-editor)") ||
        document.querySelector("#nsk-frame .md-editor:not(.nsc-unified-editor)") ||
        npHost.querySelector(".md-editor:not(.nsc-unified-editor)");
      let npUni = npHost.querySelector("#nsc-np-unified-composer");
      if (nat) {
        if (!npHost.contains(nat)) {
          const curCtx = getActiveComposerContextKey();
          if (curCtx) _composerDrafts.set(curCtx, getNativeEditorValue(nat));
          npHost.appendChild(nat);
          enhanceNativeEditor(nat);
        }
        nat.style.display = "block";
        if (npUni) npUni.style.display = "none";
        setNativeEditorValue(nat, _composerDrafts.get("newpost") || "");
        syncNativeEditorContextUi(nat);
        requestAnimationFrame(() => {
          const cm = getNativeCodeMirror(nat);
          if (cm && typeof cm.refresh === "function") cm.refresh();
        });
        return;
      }
      if (!npUni) {
        npUni = buildUnifiedComposer({
          prefix: "nsc-np",
          hideFooterSubmit: true,
          placeholder: "支持完整 Markdown 语法、Ctrl+V 粘贴图片 · Ctrl+Enter 发布...",
          onCtrlEnter: () => submitNewPost(),
        });
        npHost.appendChild(npUni);
      }
      npUni.style.display = "block";
      const uTa = npUni.querySelector("#nsc-np-unified-ta");
      if (uTa) {
        uTa.value = _composerDrafts.get("newpost") || "";
        uTa.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };
    const closeNp = () => {
      if (!npBackdrop.classList.contains("is-open")) return;
      const nat = npHost.querySelector(".md-editor:not(.nsc-unified-editor)");
      if (nat) {
        _composerDrafts.set("newpost", getNativeEditorValue(nat));
        const composerBody = document.getElementById("nsc-composer-body");
        if (composerBody) composerBody.appendChild(nat);
        const dockMode = state.activePmPeer
          ? "pm"
          : (state.currentPostId || isPostPath(location.pathname)) ? "post" : "none";
        syncComposerMode(dockMode);
      } else {
        const uTa = npHost.querySelector("#nsc-np-unified-ta");
        if (uTa) _composerDrafts.set("newpost", uTa.value);
      }
      npBackdrop.classList.remove("is-open");
    };
    npBackdrop._nscCloseNp = closeNp;

    npBackdrop.addEventListener("click", (e) => {
      if (e.target === npBackdrop) closeNp();
    });
    npBackdrop.querySelector("#nsc-np-close").addEventListener("click", closeNp);
    npBackdrop.querySelector("#nsc-np-cancel").addEventListener("click", closeNp);

    npCat.addEventListener("change", () => {
      npNativeLink.href = `/new-discussion?category=${encodeURIComponent(npCat.value)}`;
    });

    const submitNewPost = async () => {
      const category = npCat.value || "daily";
      const title = npTitle.value.trim();
      const content = getNpEditorVal().trim();
      if (!title) {
        npStatus.textContent = "请输入帖子标题";
        npTitle.focus();
        return;
      }
      if (!content) {
        npStatus.textContent = "请输入帖子内容";
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
        clearNpEditorVal();
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

    shell.querySelector("#nsc-newpost-open-btn").addEventListener("click", () => {
      const defCat = postableChannels.some((c) => c.id === state.activeChannel) ? state.activeChannel : "daily";
      npCat.value = defCat;
      npNativeLink.href = `/new-discussion?category=${encodeURIComponent(defCat)}`;
      npStatus.textContent = "无刷新直发社区，支持完整 Markdown / 表情 / 图床";
      npBackdrop.classList.add("is-open");
      mountNpEditor();
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
        if (Date.now() < (state._suppressWaterfallUntil || 0)) return;
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
    document.addEventListener("pointerdown", (e) => {
      if (!pop.classList.contains("is-open")) return;
      if (!pop.contains(e.target) && e.target !== btnEl && !btnEl.contains(e.target)) {
        pop.classList.remove("is-open");
      }
    }, true);
    hostEl.appendChild(pop);
  }

  let _activeComposerCtxKey = "";
  const _composerDrafts = new Map();

  function getActiveComposerContextKey() {
    if (state.activePmPeer && state.activePmPeer.uid) return `pm:${state.activePmPeer.uid}`;
    if (state.currentPostId) return `post:${state.currentPostId}`;
    return "";
  }

  function getNativeCodeMirror(editor) {
    if (!editor) return null;
    const pageWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
    const inNp = Boolean(editor.closest && editor.closest("#nsc-np-editor-host"));
    const sel = inNp ? "#nsc-np-editor-host .md-editor .CodeMirror" : "#nsc-composer-body .md-editor .CodeMirror";
    const cmEl =
      (pageWin.document && pageWin.document.querySelector(sel)) ||
      editor.querySelector(".CodeMirror");
    if (!cmEl) return null;
    return cmEl.CodeMirror || (cmEl.wrappedJSObject && cmEl.wrappedJSObject.CodeMirror) || null;
  }

  function getNativeEditorValue(editor) {
    const cm = getNativeCodeMirror(editor);
    if (cm && typeof cm.getValue === "function") return cm.getValue();
    const ta = editor && editor.querySelector(".CodeMirror textarea, textarea");
    return ta ? ta.value : "";
  }

  function setNativeEditorValue(editor, val) {
    const cm = getNativeCodeMirror(editor);
    if (cm && typeof cm.setValue === "function") {
      cm.setValue(String(val || ""));
      if (typeof cm.clearHistory === "function" && !val) {
        try { cm.clearHistory(); } catch (_) {}
      }
      return;
    }
    const ta = editor && editor.querySelector(".CodeMirror textarea, textarea");
    if (ta) {
      ta.value = String(val || "");
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function ensureNativeEditorWriteTab(editor) {
    if (!editor) return;
    const prevTab = editor.querySelector(".tab-select.window_header .tab-option-item-1");
    const editTab = editor.querySelector(".tab-select.window_header .tab-option-item-0");
    const splitTab = editor.querySelector(".tab-select.window_header .tab-option-item-2");
    const cmWrap = editor.querySelector("#cm-editor-wrapper, .CodeMirror");
    const isPrevActive = prevTab && prevTab.style && prevTab.style.borderBottomStyle === "solid";
    const isSplitActive = splitTab && splitTab.style && splitTab.style.borderBottomStyle === "solid";
    if (!isSplitActive && (isPrevActive || (cmWrap && cmWrap.offsetParent === null)) && editTab) {
      editTab.click();
    }
  }

  function insertTextToActiveComposer(snippet, { asLine = true } = {}) {
    const text = String(snippet || "");
    if (!text) return false;
    const nativeEditor = document.querySelector("#nsc-composer-body .md-editor:not(.nsc-unified-editor)");
    if (nativeEditor && nativeEditor.style.display !== "none") {
      ensureNativeEditorWriteTab(nativeEditor);
      const cm = getNativeCodeMirror(nativeEditor);
      if (cm && typeof cm.getValue === "function") {
        cm.operation(() => {
          const curVal = cm.getValue();
          if (asLine && curVal && !curVal.endsWith("\n")) {
            const last = cm.lastLine();
            cm.replaceRange("\n", { line: last, ch: cm.getLine(last).length });
          }
          const endLine = cm.lastLine();
          const endCh = cm.getLine(endLine).length;
          cm.replaceRange(text, { line: endLine, ch: endCh });
          const nextEnd = cm.lastLine();
          cm.setCursor({ line: nextEnd, ch: cm.getLine(nextEnd).length });
          cm.scrollIntoView({ line: nextEnd, ch: 0 }, 8);
        });
        if (typeof cm.refresh === "function") cm.refresh();
        const inputField = typeof cm.getInputField === "function" ? cm.getInputField() : null;
        if (inputField && typeof inputField.focus === "function") {
          inputField.focus({ preventScroll: true });
        } else if (typeof cm.focus === "function") {
          cm.focus();
        }
        return true;
      }
    }

    const uBox = document.getElementById("nsc-unified-composer");
    const uTa = document.getElementById("nsc-unified-ta");
    if (uBox && uTa && uBox.style.display !== "none") {
      if (typeof uBox._ensureWriteMode === "function") uBox._ensureWriteMode();
      const curVal = uTa.value || "";
      const prefix = asLine && curVal && !curVal.endsWith("\n") ? "\n" : "";
      const ins = prefix + text;
      const pos = curVal.length;
      uTa.setRangeText(ins, pos, pos, "end");
      uTa.dispatchEvent(new Event("input", { bubbles: true }));
      uTa.focus({ preventScroll: true });
      return true;
    }
    return false;
  }

  async function submitUnifiedComposerContent(rawContent, { clearFn, setStatusFn, setBusyFn } = {}) {
    const content = String(rawContent || "").trim();
    if (!content) return;
    const submitCtxKey = getActiveComposerContextKey();
    const isSameCtx = () => getActiveComposerContextKey() === submitCtxKey;

    if (state.activePmPeer) {
      const peer = state.activePmPeer;
      const seq = state.chatViewSeq;
      if (setBusyFn) setBusyFn(true, "发送中...");
      if (setStatusFn) setStatusFn("正在发送私信...");
      try {
        await apiPostJson("/api/notification/message/send", {
          receiverUid: Number(peer.uid),
          content,
          markdown: true,
        });
        _composerDrafts.delete(`pm:${peer.uid}`);
        if (isSameCtx()) {
          if (clearFn) clearFn();
          if (setStatusFn) setStatusFn("私信发送成功");
        }
        if (seq === state.chatViewSeq && state.activePmPeer && state.activePmPeer.uid === peer.uid) {
          if (typeof openPmConversation === "function") await openPmConversation(peer, { silent: true });
        }
        if (typeof fetchPmList === "function") fetchPmList();
      } catch (err) {
        if (isSameCtx() && setStatusFn) setStatusFn("发送失败: " + err.message);
      } finally {
        if (setBusyFn) setBusyFn(false, state.activePmPeer ? "发送私信" : "发布评论");
      }
      return;
    }

    const pid = state.currentPostId;
    if (!pid) return;
    const room = state.currentRoom;
    if (setBusyFn) setBusyFn(true, "发送中...");
    if (setStatusFn) setStatusFn("正在发布评论...");
    try {
      await apiPostJson("/api/content/new-comment", {
        content,
        mode: "new-comment",
        postId: Number(pid),
      });
      _composerDrafts.delete(`post:${pid}`);
      if (isSameCtx()) {
        if (clearFn) clearFn();
        if (setStatusFn) setStatusFn("评论已发布，正在同步楼层...");
      }
      if (!state.activePmPeer && room && room.pid === pid && state.currentPostId === pid) {
        const lastPage = Math.max(1, (room.pages && room.pages.length) || 1);
        let pDoc = await fetchPostPageDoc(`/post-${pid}-${lastPage}`);
        if (!state.activePmPeer && state.currentRoom === room && state.currentPostId === pid) {
          let added = typeof appendRoomCommentsIncrementally === "function"
            ? appendRoomCommentsIncrementally(room, pDoc, lastPage)
            : 0;
          const totalAfter = room.pages.length || 1;
          if (added === 0 && totalAfter > lastPage) {
            pDoc = await fetchPostPageDoc(`/post-${pid}-${totalAfter}`);
            if (!state.activePmPeer && state.currentRoom === room && state.currentPostId === pid) {
              added = typeof appendRoomCommentsIncrementally === "function"
                ? appendRoomCommentsIncrementally(room, pDoc, totalAfter)
                : 0;
            }
          }
          if (added === 0 && typeof appendRoomCommentsIncrementally !== "function") {
            mergePostPageComments(room, pDoc, lastPage);
            renderChatRoom(room, true);
          }
          const msgsEl = document.getElementById("nsc-chat-messages");
          if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
        }
      }
      if (isSameCtx() && setStatusFn) setStatusFn("发布成功");
    } catch (err) {
      if (isSameCtx() && setStatusFn) setStatusFn("发送失败: " + err.message);
    } finally {
      if (setBusyFn) setBusyFn(false, state.activePmPeer ? "发送私信" : "发布评论");
    }
  }

  function renderUnifiedPreviewHtml(md) {
    const raw = String(md || "").trim();
    if (!raw) return `<span style="color:var(--nsc-muted);">（暂无预览内容）</span>`;
    let html = renderSimpleMarkdown(raw);
    html = html.replace(/:(ac|yct|xhj|emoji)(\d{2,3}):/gi, (full, grp, num) => {
      const g = STICKER_GROUPS.find((x) => x.id === grp.toLowerCase());
      if (!g) return full;
      const hit = (g.files || []).find((f) => f.replace(/\.[^.]+$/, "") === num);
      if (!hit) return full;
      return `<img class="sticker" src="/static/image/sticker/${g.id}/${hit}" alt="${escHtml(full)}" />`;
    });
    return html;
  }

  function buildUnifiedComposer(opts = {}) {
    const prefix = opts.prefix || "nsc";
    const box = document.createElement("div");
    box.className = "nsc-composer-box md-editor nsc-unified-editor";
    box.id = `${prefix}-unified-composer`;
    box.style.position = "relative";

    const groups = getEffectiveStickerGroups();
    box.innerHTML = `
      <div class="tab-select window_header">
        <div style="display:flex;align-items:center;">
          <button type="button" class="nsc-u-tab is-active" data-umode="write">内容</button>
          <button type="button" class="nsc-u-tab" data-umode="preview">预览</button>
          <button type="button" class="nsc-u-tab" data-umode="split">对照</button>
        </div>
        <div class="nsc-u-exp-tabs">
          ${groups.map((g) => `<button type="button" class="nsc-u-exp-tab" data-ugroup="${escHtml(g.id)}">${escHtml(g.label)}</button>`).join("")}
          <button type="button" class="nsc-u-exp-tab sticker-group-app" data-ugroup="app">App</button>
        </div>
        <div class="nsc-u-top-acts">
          <button type="button" class="nsc-mde-btn" data-role="toggle-tb" title="显示/隐藏工具栏">🛠</button>
          <button type="button" class="nsc-mde-btn" data-role="toggle-fs" title="全屏编辑">${ICONS.fullscreen}</button>
        </div>
      </div>
      <div class="nsc-mde-toolbar">
        <button type="button" class="nsc-mde-btn" data-wrap="**" title="加粗">B</button>
        <button type="button" class="nsc-mde-btn" data-wrap="*" title="斜体">I</button>
        <button type="button" class="nsc-mde-btn" data-wrap="~~" title="删除线">S</button>
        <span class="nsc-mde-sep"></span>
        <button type="button" class="nsc-mde-btn" data-prefix="## " title="标题">H</button>
        <button type="button" class="nsc-mde-btn" data-prefix="- " title="无序列表">•</button>
        <button type="button" class="nsc-mde-btn" data-prefix="1. " title="有序列表">1.</button>
        <button type="button" class="nsc-mde-btn" data-prefix="> " title="引用">"</button>
        <span class="nsc-mde-sep"></span>
        <button type="button" class="nsc-mde-btn" data-tpl="[链接文字](https://)" title="链接">🔗</button>
        <button type="button" class="nsc-mde-btn" data-tpl="![](https://)" title="图片">🖼</button>
        <button type="button" class="nsc-mde-btn" data-wrap="\`" title="行内代码">&lt;/&gt;</button>
        <button type="button" class="nsc-mde-btn" data-tpl="\`\`\`\n\n\`\`\`" title="代码块">{ }</button>
        <span class="nsc-mde-sep"></span>
        <button type="button" class="nsc-mde-btn" data-tpl="\n| 列1 | 列2 |\n| :--- | :--- |\n| 内容 | 内容 |\n" title="表格">田</button>
        <button type="button" class="nsc-mde-btn" data-tpl="\n---\n" title="分割线">—</button>
        <span class="nsc-mde-sep"></span>
        <button type="button" class="nsc-mde-btn" data-role="undo" title="撤销">${ICONS.undo}</button>
        <button type="button" class="nsc-mde-btn" data-role="redo" title="重做">${ICONS.redo}</button>
        <button type="button" class="nsc-mde-btn" data-role="clear" title="清空内容">${ICONS.eraser}</button>
      </div>
      <div class="nsc-u-body">
        <textarea class="nsc-fallback-textarea" id="${prefix}-unified-ta" placeholder="${escHtml(opts.placeholder || "支持完整 Markdown 语法、Ctrl+V 粘贴图片 · Ctrl+Enter 发送")}"></textarea>
        <div class="nsc-u-preview"></div>
      </div>
      <div class="exp-container cur-sticker-group-null"></div>
      <div class="nsc-u-app-pop">
        <div class="nsc-u-app-row">
          <button type="button" class="nsc-u-app-btn" data-role="app-stardust">${ICONS.stardust}<span>星辰收款</span></button>
          <button type="button" class="nsc-u-app-btn" data-role="app-vote">${ICONS.review}<span>发起投票</span></button>
        </div>
        <div class="nsc-u-sd-form">
          <div style="display:flex;gap:5px;align-items:center;">
            <input type="number" data-role="sd-diff" min="1" max="1000" value="1" placeholder="星辰数" style="width:74px;" />
            <label style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--nsc-muted);white-space:nowrap;">
              <input type="checkbox" data-role="sd-once" />一次性
            </label>
          </div>
          <input type="text" data-role="sd-desc" placeholder="收款说明（可选）..." />
          <div style="display:flex;justify-content:flex-end;gap:6px;">
            <button type="button" class="nsc-mini-btn" data-role="sd-cancel">取消</button>
            <button type="button" class="nsc-send-btn" data-role="sd-ins">插入收款码</button>
          </div>
        </div>
      </div>
      <div class="topic-select nsc-composer-footer">
        <div style="display:inline-flex;align-items:center;gap:8px;min-width:0;">
          <button type="button" class="nsc-nodeimage-btn" data-role="ni-btn" title="NodeImage 图床上传/管理"><span class="nsc-ni-dot"></span>图床</button>
          <span id="${prefix}-unified-status" class="nsc-ni-status" style="font-size:11px;color:var(--nsc-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">支持完整 Markdown · Ctrl+V 贴图 · Ctrl+Enter 发送</span>
        </div>
        <button type="button" class="submit btn nsc-send-btn" id="${prefix}-unified-send" ${opts.hideFooterSubmit ? 'style="display:none;"' : ""}>发布评论</button>
      </div>
    `;

    const ta = box.querySelector(`#${prefix}-unified-ta`);
    const bodyEl = box.querySelector(".nsc-u-body");
    const previewEl = box.querySelector(".nsc-u-preview");
    const toolbarEl = box.querySelector(".nsc-mde-toolbar");
    const stickerPop = box.querySelector(".exp-container");
    const appPop = box.querySelector(".nsc-u-app-pop");
    const sdForm = box.querySelector(".nsc-u-sd-form");
    const statusEl = box.querySelector(`#${prefix}-unified-status`);
    const sendBtn = box.querySelector(`#${prefix}-unified-send`);

    const undoStack = [""];
    const redoStack = [];
    let lastSnap = "";
    const pushSnap = (v) => {
      if (v === lastSnap) return;
      undoStack.push(v);
      if (undoStack.length > 60) undoStack.shift();
      redoStack.length = 0;
      lastSnap = v;
    };

    const syncPreview = () => {
      if (bodyEl.classList.contains("is-preview-only") || bodyEl.classList.contains("is-split")) {
        previewEl.innerHTML = renderUnifiedPreviewHtml(ta.value);
      }
    };

    let snapTimer = 0;
    ta.addEventListener("input", () => {
      syncPreview();
      clearTimeout(snapTimer);
      snapTimer = setTimeout(() => pushSnap(ta.value), 260);
    });

    box.querySelector('[data-role="undo"]').addEventListener("click", () => {
      if (undoStack.length <= 1) return;
      const cur = undoStack.pop();
      redoStack.push(cur);
      const prev = undoStack[undoStack.length - 1] || "";
      lastSnap = prev;
      ta.value = prev;
      syncPreview();
      ta.focus({ preventScroll: true });
    });
    box.querySelector('[data-role="redo"]').addEventListener("click", () => {
      if (redoStack.length === 0) return;
      const nxt = redoStack.pop();
      undoStack.push(nxt);
      lastSnap = nxt;
      ta.value = nxt;
      syncPreview();
      ta.focus({ preventScroll: true });
    });
    box.querySelector('[data-role="clear"]').addEventListener("click", () => {
      if (!ta.value) return;
      pushSnap(ta.value);
      ta.value = "";
      pushSnap("");
      syncPreview();
      ta.focus({ preventScroll: true });
    });

    const setMode = (mode) => {
      box.querySelectorAll("[data-umode]").forEach((b) => b.classList.toggle("is-active", b.dataset.umode === mode));
      bodyEl.classList.toggle("is-preview-only", mode === "preview");
      bodyEl.classList.toggle("is-split", mode === "split");
      toolbarEl.style.display = mode === "preview" ? "none" : "flex";
      syncPreview();
      if (mode !== "preview") ta.focus({ preventScroll: true });
    };
    box._ensureWriteMode = () => {
      if (bodyEl.classList.contains("is-preview-only")) setMode("write");
    };
    box.querySelectorAll("[data-umode]").forEach((b) => {
      b.addEventListener("click", () => setMode(b.dataset.umode));
    });

    box.querySelector('[data-role="toggle-tb"]').addEventListener("click", () => {
      toolbarEl.style.display = toolbarEl.style.display === "none" ? "flex" : "none";
    });
    box.querySelector('[data-role="toggle-fs"]').addEventListener("click", () => {
      box.classList.toggle("is-fullscreen");
      ta.focus({ preventScroll: true });
    });

    bindMarkdownToolbar(toolbarEl, ta);

    let activeStickerGroup = "";
    const closePopovers = () => {
      activeStickerGroup = "";
      stickerPop.className = "exp-container cur-sticker-group-null";
      stickerPop.innerHTML = "";
      appPop.classList.remove("is-open");
      box.querySelectorAll(".nsc-u-exp-tab").forEach((t) => t.classList.remove("active"));
    };

    const renderGroupPop = (gid, tabBtn) => {
      if (activeStickerGroup === gid) {
        closePopovers();
        return;
      }
      closePopovers();
      activeStickerGroup = gid;
      if (tabBtn) tabBtn.classList.add("active");
      if (gid === "app") {
        const dockRect = box.getBoundingClientRect();
        const btnRect = tabBtn ? tabBtn.getBoundingClientRect() : null;
        if (btnRect && dockRect.width > 0) {
          const leftPx = Math.max(8, Math.min(btnRect.left - dockRect.left, dockRect.width - 220));
          appPop.style.left = `${Math.round(leftPx)}px`;
          appPop.style.right = "auto";
        }
        sdForm.classList.remove("is-open");
        appPop.classList.add("is-open");
        return;
      }
      const grp = getEffectiveStickerGroups().find((g) => g.id === gid);
      if (!grp) return;
      stickerPop.className = `exp-container cur-sticker-group-${escHtml(gid)}`;
      stickerPop.innerHTML = "";
      const list = Array.isArray(grp.items)
        ? grp.items.map((it) => ({ src: it.url, ins: `![${it.name || "sticker"}](${it.url})`, title: it.name || it.url }))
        : (grp.files || []).slice(0, gid === "ac" ? 32 : 99).map((file) => {
            const codeNum = file.replace(/\.[^.]+$/, "");
            const sc = `:${grp.id}${codeNum}:`;
            return { src: `/static/image/sticker/${grp.id}/${file}`, ins: sc, title: sc };
          });
      for (const item of list) {
        const b = document.createElement("button");
        b.type = "button";
        b.style.cssText = "border:none;background:transparent;cursor:pointer;";
        b.title = item.title;
        b.innerHTML = `<img src="${escHtml(item.src)}" loading="lazy" alt="" />`;
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          pushSnap(ta.value);
          const s = ta.selectionStart || 0;
          const end = ta.selectionEnd || 0;
          ta.setRangeText(item.ins, s, end, "end");
          ta.dispatchEvent(new Event("input", { bubbles: true }));
          closePopovers();
          ta.focus({ preventScroll: true });
        });
        stickerPop.appendChild(b);
      }
    };

    box.querySelectorAll(".nsc-u-exp-tab").forEach((tb) => {
      tb.addEventListener("click", (e) => {
        e.stopPropagation();
        renderGroupPop(tb.dataset.ugroup, tb);
      });
    });

    box.querySelector('[data-role="app-stardust"]').addEventListener("click", (e) => {
      e.stopPropagation();
      sdForm.classList.toggle("is-open");
    });
    box.querySelector('[data-role="sd-cancel"]').addEventListener("click", (e) => {
      e.stopPropagation();
      sdForm.classList.remove("is-open");
    });
    box.querySelector('[data-role="sd-ins"]').addEventListener("click", (e) => {
      e.stopPropagation();
      detectCurrentUser();
      const uid = state.currentUserId;
      if (!uid) {
        if (statusEl) statusEl.textContent = "请先登录后生成星辰收款码";
        return;
      }
      const diff = Math.min(1000, Math.max(1, parseInt(box.querySelector('[data-role="sd-diff"]').value, 10) || 1));
      const desc = box.querySelector('[data-role="sd-desc"]').value.trim() || "Pay with Stardust";
      const onetime = box.querySelector('[data-role="sd-once"]').checked;
      const refId = Math.floor(10000000 + Math.random() * 89999999);
      const url = `nsapp://stardust-receive?member_id=${uid}&ref_id=${refId}&description=${encodeURIComponent(desc)}&diff=${diff}&onetime=${onetime}`;
      pushSnap(ta.value);
      const s = ta.selectionStart || 0;
      const end = ta.selectionEnd || 0;
      const prefixStr = s > 0 && !ta.value.slice(0, s).endsWith("\n") ? "\n" : "";
      ta.setRangeText(`${prefixStr}${url}\n`, s, end, "end");
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      closePopovers();
      ta.focus({ preventScroll: true });
    });
    box.querySelector('[data-role="app-vote"]').addEventListener("click", (e) => {
      e.stopPropagation();
      closePopovers();
      if (prefix === "nsc-np") {
        const lnk = document.getElementById("nsc-np-native-link");
        if (statusEl) {
          statusEl.innerHTML = `点击右上角 <a href="${escHtml((lnk && lnk.href) || "/new-discussion")}" style="color:var(--nsc-accent);font-weight:600;">原版编辑器 ↗</a> 可在发帖页发起官方投票`;
        }
        return;
      }
      if (state.activePmPeer) {
        if (statusEl) statusEl.textContent = "私信暂不支持创建帖子投票，请在帖子页使用投票卡片";
        return;
      }
      if (state.currentPostId && statusEl) {
        statusEl.innerHTML = `在当前标签直接打开 <a href="/post-${escHtml(state.currentPostId)}-1" style="color:var(--nsc-accent);font-weight:600;">原帖页</a> 可使用官方投票向导`;
      }
    });

    document.addEventListener("pointerdown", (e) => {
      if (!activeStickerGroup) return;
      const t = e.target;
      if (t && t.closest && (t.closest(".nsc-u-exp-tabs") || t.closest(".exp-container") || t.closest(".nsc-u-app-pop"))) {
        if (box.contains(t)) return;
      }
      closePopovers();
    }, true);

    box.querySelector('[data-role="ni-btn"]').addEventListener("click", () => {
      openNodeImageModal(prefix === "nsc-np" ? "newpost" : (state.activePmPeer ? "pm" : "chat"));
    });
    NodeImage.syncDots();

    const doSubmit = () => {
      if (typeof opts.onCtrlEnter === "function") {
        opts.onCtrlEnter();
        return;
      }
      if (sendBtn.disabled) return;
      box.classList.remove("is-fullscreen");
      setMode("write");
      submitUnifiedComposerContent(ta.value, {
        clearFn: () => {
          ta.value = "";
          pushSnap("");
          syncPreview();
        },
        setStatusFn: (msg) => {
          if (statusEl) statusEl.textContent = msg;
        },
        setBusyFn: (busy, label) => {
          sendBtn.disabled = busy;
          if (label) sendBtn.textContent = label;
        },
      });
    };
    sendBtn.addEventListener("click", doSubmit);
    ta.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        doSubmit();
      }
    });
    return box;
  }

  function syncNativeEditorContextUi(editor) {
    if (!editor) return;
    const submitBtn = editor.querySelector("button.submit.btn");
    const statusEl = editor.querySelector(".topic-select .nsc-ni-status");
    if (editor.closest("#nsc-newpost-backdrop")) {
      if (statusEl) statusEl.textContent = "发帖模式 · 支持完整 Markdown / 贴图 / App · Ctrl+Enter 发布";
      return;
    }
    if (state.activePmPeer) {
      if (submitBtn && !submitBtn.disabled) submitBtn.textContent = "发送私信";
      if (statusEl) {
        statusEl.textContent = `私信 ${state.activePmPeer.name} · 支持完整 Markdown / 贴图 / 对照 · Ctrl+Enter 发送`;
      }
    } else {
      if (submitBtn && !submitBtn.disabled) submitBtn.textContent = "发布评论";
      if (statusEl) {
        statusEl.textContent = "支持 Ctrl+V 粘贴图片 · Ctrl+Enter 发布";
      }
    }
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

    const nativeEditor = composerBody.querySelector(".md-editor:not(.nsc-unified-editor)") || document.querySelector("#nsk-frame .md-editor");
    let unified = document.getElementById("nsc-unified-composer");

    const nextCtxKey = getActiveComposerContextKey();
    if (_activeComposerCtxKey && nextCtxKey !== _activeComposerCtxKey) {
      if (nativeEditor && nativeEditor.style.display !== "none") {
        _composerDrafts.set(_activeComposerCtxKey, getNativeEditorValue(nativeEditor));
      } else if (unified && unified.style.display !== "none") {
        const uTa = unified.querySelector("#nsc-unified-ta");
        if (uTa) _composerDrafts.set(_activeComposerCtxKey, uTa.value);
      }
    }
    const ctxChanged = nextCtxKey !== _activeComposerCtxKey;
    _activeComposerCtxKey = nextCtxKey;

    if (nativeEditor) {
      if (!composerBody.contains(nativeEditor)) {
        composerBody.appendChild(nativeEditor);
        enhanceNativeEditor(nativeEditor);
      }
      nativeEditor.style.display = "block";
      if (unified) unified.style.display = "none";
      syncNativeEditorContextUi(nativeEditor);
      if (ctxChanged && nextCtxKey && _composerDrafts.has(nextCtxKey)) {
        setNativeEditorValue(nativeEditor, _composerDrafts.get(nextCtxKey) || "");
      } else if (ctxChanged && state.activePmPeer) {
        setNativeEditorValue(nativeEditor, "");
      }
      requestAnimationFrame(() => {
        const cm = getNativeCodeMirror(nativeEditor);
        if (cm && typeof cm.refresh === "function") cm.refresh();
      });
      return;
    }

    if (!unified) {
      unified = buildUnifiedComposer();
      composerBody.appendChild(unified);
    }
    unified.style.display = "block";
    const uSend = unified.querySelector("#nsc-unified-send");
    const uStatus = unified.querySelector("#nsc-unified-status");
    const uTa = unified.querySelector("#nsc-unified-ta");
    if (state.activePmPeer) {
      if (uSend && !uSend.disabled) uSend.textContent = "发送私信";
      if (uStatus) uStatus.textContent = `私信 ${state.activePmPeer.name} · 支持完整 Markdown / 贴图 / 对照 · Ctrl+Enter 发送`;
    } else {
      if (uSend && !uSend.disabled) uSend.textContent = "发布评论";
      if (uStatus) uStatus.textContent = "支持完整 Markdown · Ctrl+V 贴图 · Ctrl+Enter 发送";
    }
    if (ctxChanged && uTa) {
      uTa.value = (nextCtxKey && _composerDrafts.get(nextCtxKey)) || "";
      uTa.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function positionAppPopover(editor) {
    if (!editor) return;
    const dock = editor.closest("#nsc-np-editor-host, #nsc-composer-dock") || document.getElementById("nsc-composer-dock") || editor;
    const pop = editor.querySelector(".exp-container.cur-sticker-group-app");
    const appBtn = editor.querySelector(".expression .sticker-group-app");
    if (!pop || !appBtn || !dock) return;
    requestAnimationFrame(() => {
      const dockRect = dock.getBoundingClientRect();
      const btnRect = appBtn.getBoundingClientRect();
      const popW = pop.offsetWidth || 130;
      if (dockRect.width <= 0 || btnRect.width <= 0) return;
      const centerLeft = (btnRect.left - dockRect.left) + (btnRect.width - popW) / 2;
      const clampedLeft = Math.max(8, Math.min(centerLeft, dockRect.width - popW - 8));
      pop.style.setProperty("--nsc-app-pop-left", `${Math.round(clampedLeft)}px`);
      pop.style.setProperty("--nsc-app-pop-right", "auto");
    });
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

    const expContainer = editor.querySelector(".exp-container");
    if (expContainer) {
      const appObs = new MutationObserver(() => {
        if (expContainer.classList.contains("cur-sticker-group-app")) {
          positionAppPopover(editor);
        }
      });
      appObs.observe(expContainer, { attributes: true, attributeFilter: ["class"] });

      document.addEventListener("pointerdown", (e) => {
        if (!editor.isConnected || editor.style.display === "none") return;
        const m = (expContainer.className || "").match(/\bcur-sticker-group-([a-z0-9_-]+)/i);
        const grp = m ? m[1] : "";
        if (!grp || grp === "null") return;
        const t = e.target;
        if (t && t.closest && (
          t.closest(".expression") ||
          t.closest(".exp-container") ||
          t.closest(".vote-panel, .stardust-panel")
        )) {
          return;
        }
        const activeTab =
          editor.querySelector(`.expression .exp-item.sticker-group-${grp}`) ||
          editor.querySelector(".expression .exp-item.active");
        if (activeTab) activeTab.click();
      }, true);
    }
    const appTabBtn = editor.querySelector(".expression .sticker-group-app");
    if (appTabBtn) {
      appTabBtn.addEventListener("click", () => positionAppPopover(editor));
    }

    const topicFooter = editor.querySelector(".topic-select");
    if (topicFooter && !topicFooter.querySelector(".nsc-nodeimage-btn")) {
      const leftSlot = topicFooter.querySelector("div:first-child");
      const imgHostBtn = document.createElement("button");
      imgHostBtn.type = "button";
      imgHostBtn.className = "nsc-nodeimage-btn";
      imgHostBtn.title = "NodeImage 图床上传与授权";
      imgHostBtn.innerHTML = `<span class="nsc-ni-dot"></span>图床`;
      imgHostBtn.addEventListener("click", () => {
        const mode = editor.closest("#nsc-newpost-backdrop") ? "newpost" : (state.activePmPeer ? "pm" : "chat");
        openNodeImageModal(mode);
      });
      if (leftSlot) {
        leftSlot.style.cssText = "display:inline-flex;align-items:center;gap:8px;font-size:11px;color:var(--nsc-muted);min-width:0;";
        leftSlot.innerHTML = "";
        leftSlot.appendChild(imgHostBtn);
        const hint = document.createElement("span");
        hint.className = "nsc-ni-status";
        hint.style.cssText = "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
        hint.textContent = "支持 Ctrl+V 粘贴图片 · Ctrl+Enter 发布";
        leftSlot.appendChild(hint);
      } else {
        topicFooter.insertBefore(imgHostBtn, topicFooter.firstChild);
      }
      NodeImage.syncDots();
    }

    editor.addEventListener("keydown", (e) => {
      if (!document.body.classList.contains("nsc-app-active")) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (editor.closest("#nsc-newpost-backdrop")) {
          const npBtn = document.getElementById("nsc-np-submit");
          if (npBtn) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            npBtn.click();
          }
          return;
        }
        const btn = editor.querySelector("button.submit.btn");
        if (btn) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          btn.click();
        }
      }
    }, true);

    const submitBtn = editor.querySelector("button.submit.btn");
    if (submitBtn) {
      submitBtn.addEventListener("click", (e) => {
        if (!document.body.classList.contains("nsc-app-active")) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (submitBtn.disabled) return;
        const val = getNativeEditorValue(editor);
        const statusEl = editor.querySelector(".topic-select .nsc-ni-status");
        submitUnifiedComposerContent(val, {
          clearFn: () => setNativeEditorValue(editor, ""),
          setStatusFn: (msg) => {
            if (statusEl) statusEl.textContent = msg;
          },
          setBusyFn: (busy, label) => {
            submitBtn.disabled = busy;
            if (label) submitBtn.textContent = label;
          },
        });
      }, true);
    }

    const topicLeft = editor.querySelector(".topic-select > div:first-child");
    if (topicLeft && !topicLeft.textContent.trim()) {
      topicLeft.style.cssText = "font-size:11px;color:var(--nsc-muted);";
      topicLeft.textContent = "Ctrl + Enter 快捷发布";
    }
    const dock = document.getElementById("nsc-composer-dock");
    if (dock) NodeImage.bindPasteAndDrop(dock, "chat", "#nsc-composer-status");
    syncNativeEditorContextUi(editor);
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
          <img class="nsc-sd-avatar" src="/avatar/${escHtml(receipt.memberId)}.png" alt="" loading="lazy" decoding="async" />
          <div class="nsc-sd-peer-info">
            <div class="nsc-sd-name-row">
              <span class="nsc-sd-name">${escHtml(initName)}</span>
              ${receipt.onetime ? `<span class="nsc-sd-tag">一次性</span>` : ""}
            </div>
            <div class="nsc-sd-ref">星辰收款 · #${escHtml(receipt.refId)}</div>
          </div>
        </div>
        <div class="nsc-sd-amount-pill${validAmount ? "" : " is-invalid"}">
          ${validAmount ? `${ICONS.stardust}<span>${escHtml(String(receipt.diff))} 星辰</span>` : `<span>数额未定</span>`}
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
          ${validAmount ? `打赏 ${receipt.diff} 星辰` : "暂不可付"}
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
        card.classList.toggle("is-empty", st.count === 0);
        if (st.guest) {
          statusTextEl.innerHTML = `<span class="nsc-sd-dot"></span><span class="nsc-sd-state">未登录</span> · ${st.count} 人共 ${st.total} 星辰`;
        } else if (st.paid) {
          statusTextEl.innerHTML = `<span class="nsc-sd-dot is-paid"></span><span class="nsc-sd-state is-paid">已打赏</span> · ${st.count} 人共 ${st.total} 星辰`;
        } else if (st.count === 0) {
          statusTextEl.innerHTML = `<span class="nsc-sd-dot"></span><span class="nsc-sd-state">待付款</span> · 暂无打赏`;
        } else {
          statusTextEl.innerHTML = `<span class="nsc-sd-dot is-pending"></span><span class="nsc-sd-state">未付款</span> · ${st.count} 人共 ${st.total} 星辰`;
        }
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

