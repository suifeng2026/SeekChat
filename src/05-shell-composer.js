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
          <button type="button" class="nsc-quick-btn" id="nsc-qb-checkin" title="每日签到与自动签到设置">签到</button>
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
    _applyLbTransform = applyLbTransform;

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
            ${buildMarkdownToolbarHtml({ id: "nsc-np-toolbar", expBtnId: "nsc-np-exp-btn", niTarget: "newpost" })}
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

    bindMarkdownToolbar(npBackdrop.querySelector("#nsc-np-toolbar"), npContent);

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
    const npEditorEl = npBackdrop.querySelector(".nsc-newpost-editor");
    if (npEditorEl) {
      npEditorEl.style.position = "relative";
      attachStickerPicker(npBackdrop.querySelector("#nsc-np-exp-btn"), npContent, npEditorEl);
    }

    let searchTimer = null;
    shell.querySelector("#nsc-feed-search").addEventListener("input", (e) => {
      const val = e.target.value.trim().toLowerCase();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.searchKeyword = val;
        renderTopicList();
      }, 140);
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
    if (state.themeMode === "dusk") {
      applyThemeMode("dusk");
    } else {
      syncThemeButtons();
    }

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
      ${buildMarkdownToolbarHtml({ id: "nsc-fb-toolbar", expBtnId: "nsc-fb-exp-btn" })}
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
    bindMarkdownToolbar(box.querySelector("#nsc-fb-toolbar"), ta);

    const submitComment = async () => {
      const content = ta.value.trim();
      const pid = state.currentPostId;
      if (!content || !pid || state.activePmPeer) return;
      const btn = box.querySelector("#nsc-fallback-send");
      const status = box.querySelector("#nsc-composer-status");
      btn.disabled = true;
      btn.textContent = "发送中...";
      try {
        await apiPostJson("/api/content/new-comment", { content, mode: "new-comment", postId: Number(pid) });
        ta.value = "";
        status.textContent = "评论已发布，正在同步最新楼层...";
        const room = state.currentRoom;
        if (!state.activePmPeer && room && room.pid === pid && state.currentPostId === pid) {
          const lastPage = room.pages.length || 1;
          const pDoc = await fetchPostPageDoc(`/post-${pid}-${lastPage}`);
          if (!state.activePmPeer && state.currentRoom === room && state.currentPostId === pid) {
            mergePostPageComments(room, pDoc, lastPage);
            renderChatRoom(room, true);
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
      ${buildMarkdownToolbarHtml({ id: "nsc-pm-toolbar", includeList: true })}
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

    bindMarkdownToolbar(toolbar, ta);

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
    const dock = document.getElementById("nsc-composer-dock");
    const composerBody = document.getElementById("nsc-composer-body");
    if (!composerBody) return;
    if (modeOrNative === "none") {
      if (dock) dock.style.display = "none";
      return;
    }
    if (dock) dock.style.display = "";
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
        if (state.activePmPeer || !state.currentRoom || state.currentPostId !== state.nativePostId) return;
        const pid = state.currentPostId;
        const room = state.currentRoom;
        const syncAfterSubmit = async () => {
          if (state.activePmPeer || state.currentRoom !== room || state.currentPostId !== pid) return;
          const lastPage = Math.max(1, (room && room.pages.length) || 1);
          try {
            const pDoc = await fetchPostPageDoc(`/post-${pid}-${lastPage}`);
            if (state.activePmPeer || state.currentRoom !== room || state.currentPostId !== pid) return;
            const added = mergePostPageComments(room, pDoc, lastPage);
            if (added > 0) {
              renderChatRoom(room, true);
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
    _lbScale = 1;
    _lbTx = 0;
    _lbTy = 0;
    if (typeof _applyLbTransform === "function") _applyLbTransform();
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
          <img class="nsc-sd-avatar" src="/avatar/${escHtml(receipt.memberId)}.png" alt="" loading="lazy" />
          <div class="nsc-sd-peer-info">
            <div class="nsc-sd-name-row">
              <span class="nsc-sd-name">${escHtml(initName)}</span>
              ${receipt.onetime ? `<span class="nsc-sd-tag">一次性</span>` : ""}
            </div>
            <div class="nsc-sd-ref">星辰收款 · Ref #${escHtml(receipt.refId)}</div>
          </div>
        </div>
        <div class="nsc-sd-amount-pill${validAmount ? "" : " is-invalid"}">
          ${ICONS.stardust}
          <span>${validAmount ? escHtml(String(receipt.diff)) : "无效"}</span>
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
          ${validAmount ? `打赏 ${receipt.diff} 星辰` : "数额无效"}
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
        const statusPrefix = st.guest
          ? "未登录"
          : st.paid
            ? `<span class="nsc-sd-state is-paid">已付款</span>`
            : `<span class="nsc-sd-state">未付款</span>`;
        statusTextEl.innerHTML = `${statusPrefix} · ${st.count} 人共 ${st.total} 星辰`;
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

