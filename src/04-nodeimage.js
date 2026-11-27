  const NodeImage = {
    getKey() {
      try {
        if (typeof GM_getValue === "function") return GM_getValue("nsc_nodeimage_api_key", "") || "";
      } catch (_) {}
      return localStorage.getItem("nsc_nodeimage_api_key") || "";
    },
    setKey(key) {
      const k = String(key || "").trim();
      try {
        if (typeof GM_setValue === "function") GM_setValue("nsc_nodeimage_api_key", k);
      } catch (_) {}
      try { localStorage.setItem("nsc_nodeimage_api_key", k); } catch (_) {}
      NodeImage.syncDots();
    },
    syncDots() {
      const ok = Boolean(NodeImage.getKey());
      document.querySelectorAll(".nsc-ni-dot").forEach((d) => d.classList.toggle("is-ok", ok));
    },
    gmRequest({ url, method = "GET", data = null, headers = {}, withAuth = false }) {
      return new Promise((resolve, reject) => {
        const key = NodeImage.getKey();
        const hdrs = {
          Accept: "application/json",
          ...(withAuth && key ? { "X-API-Key": key } : {}),
          ...headers,
        };
        if (typeof GM_xmlhttpRequest === "function") {
          GM_xmlhttpRequest({
            method,
            url,
            headers: hdrs,
            data,
            withCredentials: true,
            responseType: "json",
            onload: (resp) => {
              let body = resp.response;
              if (!body && resp.responseText) {
                try { body = JSON.parse(resp.responseText); } catch (_) {}
              }
              if (resp.status >= 200 && resp.status < 300 && body) resolve(body);
              else reject(new Error((body && (body.error || body.message)) || `HTTP ${resp.status}`));
            },
            onerror: () => reject(new Error("网络请求失败")),
          });
        } else {
          fetch(url, { method, headers: hdrs, body: data, credentials: "include" })
            .then((r) => r.json().then((j) => (r.ok ? resolve(j) : reject(new Error(j.error || `HTTP ${r.status}`)))))
            .catch(reject);
        }
      });
    },
    async checkAuth() {
      try {
        const res = await NodeImage.gmRequest({ url: "https://api.nodeimage.com/api/user/api-key" });
        if (res && res.api_key) {
          NodeImage.setKey(res.api_key);
          return res.api_key;
        }
      } catch (_) {}
      return "";
    },
    async uploadFile(file) {
      if (!NodeImage.getKey()) {
        await NodeImage.checkAuth();
      }
      if (!NodeImage.getKey()) {
        throw new Error("未关联 NodeImage 授权，请点击下方「图床」完成授权");
      }
      const fd = new FormData();
      fd.append("image", file);
      const res = await NodeImage.gmRequest({
        url: "https://api.nodeimage.com/api/upload",
        method: "POST",
        data: fd,
        withAuth: true,
      });
      if (res && res.success && res.links) {
        return res.links.markdown || `![image](${res.links.direct})`;
      }
      throw new Error((res && res.error) || "上传失败");
    },
    async listImages() {
      const res = await NodeImage.gmRequest({
        url: "https://api.nodeimage.com/api/v1/list",
        method: "GET",
        withAuth: true,
      });
      return (res && res.success && Array.isArray(res.images)) ? res.images : [];
    },
    async deleteImage(imageId) {
      const res = await NodeImage.gmRequest({
        url: `https://api.nodeimage.com/api/v1/delete/${encodeURIComponent(imageId)}`,
        method: "DELETE",
        withAuth: true,
      });
      return Boolean(res && res.success);
    },
    insertToTarget(targetMode, markdown) {
      const smartWrapTa = (ta) => {
        const s = ta.selectionStart || 0;
        const e = ta.selectionEnd || 0;
        const before = ta.value.slice(0, s);
        const prefix = before.length > 0 && !before.endsWith("\n") ? "\n" : "";
        const text = `${prefix}${markdown}\n`;
        ta.setRangeText(text, s, e, "end");
        ta.dispatchEvent(new Event("input", { bubbles: true }));
        ta.focus({ preventScroll: true });
      };
      if (targetMode === "newpost") {
        const npWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
        const npCmEl =
          (npWin.document && npWin.document.querySelector("#nsc-np-editor-host .md-editor .CodeMirror")) ||
          document.querySelector("#nsc-np-editor-host .md-editor .CodeMirror");
        if (npCmEl && npCmEl.offsetParent !== null) {
          const npCm = npCmEl.CodeMirror || (npCmEl.wrappedJSObject && npCmEl.wrappedJSObject.CodeMirror);
          if (npCm && typeof npCm.replaceSelection === "function") {
            const cur = npCm.getCursor();
            const lineTxt = npCm.getLine(cur.line) || "";
            const prefix = cur.ch > 0 && lineTxt.slice(0, cur.ch).trim() !== "" ? "\n" : "";
            npCm.replaceSelection(`${prefix}${markdown}\n`);
            if (typeof npCm.refresh === "function") npCm.refresh();
            npCm.focus();
            return;
          }
        }
        const ta = document.getElementById("nsc-np-unified-ta") || document.getElementById("nsc-np-content");
        if (ta) smartWrapTa(ta);
        return;
      }
      if (targetMode === "edit") {
        const ta = document.getElementById("nsc-edit-content");
        if (ta) smartWrapTa(ta);
        return;
      }
      const npBd = document.getElementById("nsc-newpost-backdrop");
      if (npBd && npBd.classList.contains("is-open")) {
        NodeImage.insertToTarget("newpost", markdown);
        return;
      }
      const pageWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
      const cmEl =
        (pageWin.document && pageWin.document.querySelector("#nsc-composer-body .md-editor .CodeMirror")) ||
        document.querySelector("#nsc-composer-body .md-editor .CodeMirror");
      if (cmEl && cmEl.offsetParent !== null) {
        const cm = cmEl.CodeMirror || (cmEl.wrappedJSObject && cmEl.wrappedJSObject.CodeMirror);
        if (cm && typeof cm.replaceSelection === "function") {
          const cur = cm.getCursor();
          const lineTxt = cm.getLine(cur.line) || "";
          const prefix = cur.ch > 0 && lineTxt.slice(0, cur.ch).trim() !== "" ? "\n" : "";
          cm.replaceSelection(`${prefix}${markdown}\n`);
          if (typeof cm.refresh === "function") cm.refresh();
          cm.focus();
          return;
        }
        const cmTa = cmEl.querySelector("textarea");
        if (cmTa) {
          cmTa.focus({ preventScroll: true });
          try {
            if (document.execCommand("insertText", false, `${markdown}\n`)) return;
          } catch (_) {}
          smartWrapTa(cmTa);
          return;
        }
      }
      const uTa = document.getElementById("nsc-unified-ta") || document.getElementById("nsc-pm-ta") || document.getElementById("nsc-fallback-ta");
      if (uTa) smartWrapTa(uTa);
    },
    bindPasteAndDrop(containerEl, targetMode, statusSelector) {
      if (!containerEl || containerEl.dataset.nscNiBound === "1") return;
      containerEl.dataset.nscNiBound = "1";
      const resolveMode = () => {
        const npBd = document.getElementById("nsc-newpost-backdrop");
        if (npBd && npBd.classList.contains("is-open") && containerEl.closest("#nsc-newpost-backdrop")) return "newpost";
        if (targetMode === "chat" && state.activePmPeer) return "pm";
        return targetMode;
      };
      const getStatusEl = (effMode) => {
        if (effMode === "newpost") return document.getElementById("nsc-np-status") || document.getElementById("nsc-np-unified-status");
        if (effMode === "edit") return document.getElementById("nsc-edit-status");
        return (
          document.querySelector("#nsc-composer-body .nsc-ni-status") ||
          document.getElementById("nsc-unified-status") ||
          (statusSelector && document.querySelector(statusSelector)) ||
          document.getElementById("nsc-composer-status")
        );
      };
      const handleFiles = async (files) => {
        const imgs = Array.from(files || []).filter((f) => f && f.type && f.type.startsWith("image/"));
        if (imgs.length === 0) return false;
        const effMode = resolveMode();
        const statusEl = getStatusEl(effMode);
        for (const f of imgs) {
          if (statusEl) statusEl.textContent = "正在上传图片到 NodeImage...";
          try {
            const md = await NodeImage.uploadFile(f);
            NodeImage.insertToTarget(effMode, md);
            if (statusEl) statusEl.textContent = "图片已上传并插入";
          } catch (err) {
            if (statusEl) statusEl.textContent = err.message;
            openNodeImageModal(effMode);
            break;
          }
        }
        return true;
      };
      containerEl.addEventListener("paste", (e) => {
        const cd = e.clipboardData;
        if (!cd) return;
        const files = [];
        if (cd.files && cd.files.length > 0) {
          for (const f of cd.files) {
            if (f && f.type && f.type.startsWith("image/")) files.push(f);
          }
        }
        if (files.length === 0 && cd.items) {
          for (const it of cd.items) {
            if (it.kind === "file" && it.type && it.type.startsWith("image/")) {
              const f = it.getAsFile();
              if (f) files.push(f);
            }
          }
        }
        if (files.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          handleFiles(files);
        }
      }, true);
      containerEl.addEventListener("drop", (e) => {
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && Array.from(files).some((f) => f.type && f.type.startsWith("image/"))) {
          e.preventDefault();
          e.stopPropagation();
          handleFiles(files);
        }
      }, true);
    },
  };

  let niBackdrop = null;
  let niTargetMode = "chat";
  let niFileInput = null;

  function formatNiBytes(bytes) {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  }

  function formatNiDate(raw) {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw).slice(0, 10);
    const pad = (x) => String(x).padStart(2, "0");
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
  }

  function openNodeImageModal(targetMode = "chat") {
    niTargetMode = targetMode;
    if (!niBackdrop) {
      niBackdrop = document.createElement("div");
      niBackdrop.id = "nsc-ni-backdrop";
      niBackdrop.innerHTML = `
        <div class="nsc-ni-modal" role="dialog" aria-label="NodeImage 图床管理">
          <div class="nsc-newpost-head">
            <div style="display:flex;align-items:center;gap:8px;min-width:0;">
              <span style="font-size:14px;font-weight:700;">NodeImage 图床</span>
              <span class="nsc-badge-read" id="nsc-ni-auth-pill" style="font-weight:600;">检测中</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              <button type="button" class="nsc-mini-btn" id="nsc-ni-toggle-settings">设置</button>
              <button type="button" class="nsc-mini-btn" id="nsc-ni-load-list">刷新</button>
              <button type="button" id="nsc-ni-close" style="border:none;background:transparent;color:var(--nsc-muted);font-size:16px;cursor:pointer;padding:0 4px;">✕</button>
            </div>
          </div>
          <div class="nsc-newpost-body" style="gap:9px;overflow:hidden;">
            <div class="nsc-ni-settings" id="nsc-ni-settings">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
                <span style="font-size:12px;">状态：<strong id="nsc-ni-auth-state">检测中...</strong></span>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  <button type="button" class="nsc-mini-btn" id="nsc-ni-detect">自动检测授权</button>
                  <a class="nsc-mini-btn" href="https://www.nodeimage.com/" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">去 NodeImage 登录授权 ↗</a>
                </div>
              </div>
              <div style="display:flex;gap:6px;align-items:center;">
                <input type="password" id="nsc-ni-key-input" class="nsc-search-input" placeholder="或直接粘贴 NodeImage API Key..." style="flex:1;" />
                <button type="button" class="nsc-mini-btn" id="nsc-ni-save-key">保存 Key</button>
              </div>
            </div>
            <div class="nsc-ni-toolbar">
              <span id="nsc-ni-tip" style="font-size:11.5px;color:var(--nsc-muted);">支持拖拽或 Ctrl+V 粘贴传图，默认仅加载最近 12 张</span>
              <button type="button" class="nsc-mini-btn" id="nsc-ni-pick-btn">选择图片上传</button>
            </div>
            <div class="nsc-ni-batch-bar" id="nsc-ni-batch-bar">
              <span id="nsc-ni-batch-count" style="font-weight:600;color:var(--nsc-text);">已选 0 张</span>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <button type="button" class="nsc-mini-btn" id="nsc-ni-sel-all">全选已加载</button>
                <button type="button" class="nsc-mac-btn primary" id="nsc-ni-batch-ins" style="height:24px;padding:0 10px;font-size:11.5px;">批量插入</button>
                <button type="button" class="nsc-mini-btn" id="nsc-ni-batch-del" style="color:#ff3b30;border-color:rgba(255,59,48,0.35);">批量删除</button>
                <button type="button" class="nsc-mini-btn" id="nsc-ni-sel-clear">取消</button>
              </div>
            </div>
            <div class="nsc-ni-grid" id="nsc-ni-grid"></div>
          </div>
        </div>
      `;
      document.body.appendChild(niBackdrop);
      niFileInput = document.createElement("input");
      niFileInput.type = "file";
      niFileInput.accept = "image/*";
      niFileInput.multiple = true;
      niFileInput.style.display = "none";
      document.body.appendChild(niFileInput);

      const closeNi = () => niBackdrop.classList.remove("is-open");
      niBackdrop.addEventListener("click", (e) => { if (e.target === niBackdrop) closeNi(); });
      niBackdrop.querySelector("#nsc-ni-close").addEventListener("click", closeNi);

      const settingsPanel = niBackdrop.querySelector("#nsc-ni-settings");
      const toggleSettingsBtn = niBackdrop.querySelector("#nsc-ni-toggle-settings");
      const batchBar = niBackdrop.querySelector("#nsc-ni-batch-bar");
      const batchCountEl = niBackdrop.querySelector("#nsc-ni-batch-count");
      const batchDelBtn = niBackdrop.querySelector("#nsc-ni-batch-del");
      const grid = niBackdrop.querySelector("#nsc-ni-grid");
      const tip = niBackdrop.querySelector("#nsc-ni-tip");

      let _niImages = [];
      let _niDisplayCount = 12;
      const _niSelected = new Set();
      let _batchDelConfirm = false;

      const syncBatchBar = () => {
        const cnt = _niSelected.size;
        batchBar.classList.toggle("is-open", cnt > 0);
        if (batchCountEl) batchCountEl.textContent = `已选 ${cnt} 张`;
        if (cnt === 0) {
          _batchDelConfirm = false;
          if (batchDelBtn) batchDelBtn.textContent = "批量删除";
        }
      };

      const refreshAuthUi = (forceShowSettings = false) => {
        const k = NodeImage.getKey();
        const stEl = niBackdrop.querySelector("#nsc-ni-auth-state");
        const pillEl = niBackdrop.querySelector("#nsc-ni-auth-pill");
        const inp = niBackdrop.querySelector("#nsc-ni-key-input");
        if (stEl) {
          stEl.textContent = k ? "已关联授权（支持 Ctrl+V 粘贴上传）" : "未授权（请先登录 NodeImage 后点自动检测）";
          stEl.style.color = k ? "var(--nsc-green)" : "#ff3b30";
        }
        if (pillEl) {
          pillEl.textContent = k ? "已授权" : "未授权";
          pillEl.style.color = k ? "var(--nsc-green)" : "#ff3b30";
          pillEl.style.borderColor = k ? "rgba(52,199,89,0.45)" : "rgba(255,59,48,0.4)";
        }
        if (settingsPanel) {
          settingsPanel.classList.toggle("is-open", forceShowSettings || !k);
        }
        if (inp && k && !inp.value) inp.value = k;
        NodeImage.syncDots();
      };

      toggleSettingsBtn.addEventListener("click", () => {
        settingsPanel.classList.toggle("is-open");
      });

      const getImgUrls = (im) => {
        const directUrl = (im.links && im.links.direct) || im.url || `https://cdn.nodeimage.com/i/${im.image_id}.png`;
        const apiThumb = (im.links && (im.links.thumb || im.links.thumbnail)) || im.thumbnail_url || im.thumb_url || "";
        const md = (im.links && im.links.markdown) || `![image](${directUrl})`;
        const htmlTag = (im.links && im.links.html) || `<img src="${directUrl}" alt="image" />`;
        return { directUrl, apiThumb, md, htmlTag };
      };

      const renderNiGrid = () => {
        grid.innerHTML = "";

        const dropCard = document.createElement("button");
        dropCard.type = "button";
        dropCard.className = "nsc-ni-dropcard";
        dropCard.innerHTML = `
          ${ICONS.imgHost}
          <span style="font-size:12px;font-weight:700;">上传或拖拽图片</span>
          <span style="font-size:10.5px;opacity:0.85;">支持多选 · Ctrl+V 粘贴直传</span>
        `;
        dropCard.addEventListener("click", () => niFileInput.click());
        grid.appendChild(dropCard);

        const visible = _niImages.slice(0, _niDisplayCount);
        const galleryUrls = visible.map((im) => getImgUrls(im).directUrl);

        for (const im of visible) {
          const idKey = String(im.image_id || "");
          const { directUrl, apiThumb, md, htmlTag } = getImgUrls(im);
          const isSel = _niSelected.has(idKey);
          const fname = im.filename || im.name || `${idKey || "image"}`;
          const sizeStr = formatNiBytes(im.size || im.file_size || 0);
          const dateStr = formatNiDate(im.created_at || im.uploaded_at || "");

          const card = document.createElement("div");
          card.className = "nsc-ni-card" + (isSel ? " is-selected" : "");
          card.innerHTML = `
            <div class="nsc-ni-thumb-wrap" title="点击直接插入到编辑器">
              <input type="checkbox" class="nsc-ni-chk" ${isSel ? "checked" : ""} title="多选" />
              <button type="button" class="nsc-ni-overlay-btn nsc-ni-del" title="删除图片">${ICONS.trash}</button>
              <img src="${escHtml(apiThumb || directUrl)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" alt="" />
              <button type="button" class="nsc-ni-overlay-btn nsc-ni-zoom" title="查看大图">${ICONS.zoomIn}</button>
              <button type="button" class="nsc-ni-overlay-btn nsc-ni-ins" title="插入 Markdown">${ICONS.insert}</button>
            </div>
            <div class="nsc-ni-meta">
              <div class="nsc-ni-fname" title="${escHtml(fname)}">${escHtml(fname)}</div>
              <div class="nsc-ni-sub">
                <span>${escHtml(dateStr || "NodeImage")}</span>
                <span>${escHtml(sizeStr || "")}</span>
              </div>
              <div class="nsc-ni-fmts">
                <button type="button" class="nsc-ni-fmt-btn" data-fmt="md" title="复制 Markdown">MD</button>
                <button type="button" class="nsc-ni-fmt-btn" data-fmt="url" title="复制图片直链">URL</button>
                <button type="button" class="nsc-ni-fmt-btn" data-fmt="html" title="复制 HTML 代码">HTML</button>
              </div>
            </div>
          `;

          const chk = card.querySelector(".nsc-ni-chk");
          chk.addEventListener("click", (e) => e.stopPropagation());
          chk.addEventListener("change", () => {
            if (!idKey) return;
            if (chk.checked) _niSelected.add(idKey);
            else _niSelected.delete(idKey);
            card.classList.toggle("is-selected", chk.checked);
            syncBatchBar();
          });

          const insFn = () => {
            NodeImage.insertToTarget(niTargetMode, md);
            closeNi();
          };
          card.querySelector(".nsc-ni-thumb-wrap").addEventListener("click", (e) => {
            if (e.target.closest("button, input")) return;
            insFn();
          });
          card.querySelector(".nsc-ni-ins").addEventListener("click", (e) => {
            e.stopPropagation();
            insFn();
          });
          card.querySelector(".nsc-ni-zoom").addEventListener("click", (e) => {
            e.stopPropagation();
            if (typeof openLightbox === "function") openLightbox(directUrl, galleryUrls);
          });

          const delBtn = card.querySelector(".nsc-ni-del");
          let delConfirmTimer = 0;
          delBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (!idKey) return;
            if (delBtn.dataset.armed !== "1") {
              delBtn.dataset.armed = "1";
              delBtn.style.width = "auto";
              delBtn.style.padding = "0 6px";
              delBtn.style.fontSize = "10.5px";
              delBtn.style.fontWeight = "700";
              delBtn.style.color = "#ff3b30";
              delBtn.textContent = "删?";
              clearTimeout(delConfirmTimer);
              delConfirmTimer = setTimeout(() => {
                if (!delBtn.isConnected) return;
                delBtn.dataset.armed = "";
                delBtn.style.width = "";
                delBtn.style.padding = "";
                delBtn.innerHTML = ICONS.trash;
              }, 2600);
              return;
            }
            delBtn.disabled = true;
            const ok = await NodeImage.deleteImage(idKey).catch(() => false);
            if (ok) {
              _niImages = _niImages.filter((x) => String(x.image_id || "") !== idKey);
              _niSelected.delete(idKey);
              syncBatchBar();
              renderNiGrid();
              if (tip) tip.textContent = `已删除图片，当前共 ${_niImages.length} 张`;
            } else {
              delBtn.disabled = false;
              if (tip) tip.textContent = "删除失败，请稍后重试";
            }
          });

          card.querySelectorAll(".nsc-ni-fmt-btn").forEach((fb) => {
            fb.addEventListener("click", async () => {
              const fmt = fb.dataset.fmt;
              const txt = fmt === "url" ? directUrl : fmt === "html" ? htmlTag : md;
              const copied = await copyTextToClipboard(txt);
              if (copied) {
                const orig = fb.textContent;
                fb.textContent = "已复制";
                setTimeout(() => { fb.textContent = orig; }, 1000);
              }
            });
          });

          grid.appendChild(card);
        }

        if (_niImages.length > _niDisplayCount) {
          const remain = _niImages.length - _niDisplayCount;
          const moreRow = document.createElement("div");
          moreRow.className = "nsc-ni-more-row";
          moreRow.innerHTML = `<button type="button" class="nsc-mini-btn" id="nsc-ni-more-btn">显示更多（再加载 ${Math.min(12, remain)} 张 · 剩余 ${remain} 张）</button>`;
          moreRow.querySelector("#nsc-ni-more-btn").addEventListener("click", () => {
            _niDisplayCount += 12;
            renderNiGrid();
          });
          grid.appendChild(moreRow);
        }
      };

      const loadNiImages = async () => {
        grid.innerHTML = `<div style="padding:18px;font-size:12px;color:var(--nsc-muted);">正在加载图床列表...</div>`;
        try {
          _niImages = await NodeImage.listImages();
          _niDisplayCount = 12;
          _niSelected.clear();
          syncBatchBar();
          renderNiGrid();
          if (tip) {
            tip.textContent = _niImages.length > 0
              ? `共 ${_niImages.length} 张 · 默认仅预览最近 ${Math.min(12, _niImages.length)} 张（点击图片插入，右上角垃圾桶删除）`
              : "暂无图片，点击首格卡片或 Ctrl+V 即可上传";
          }
        } catch (err) {
          grid.innerHTML = `<div style="padding:18px;font-size:12px;color:#ff3b30;">加载失败: ${escHtml(err.message)}</div>`;
        }
      };

      const handleUploadFiles = async (files) => {
        const imgs = Array.from(files || []).filter((f) => f && f.type && f.type.startsWith("image/"));
        if (imgs.length === 0) return;
        const insertedMds = [];
        for (const f of imgs) {
          if (tip) tip.textContent = `正在上传 ${f.name}...`;
          try {
            const md = await NodeImage.uploadFile(f);
            insertedMds.push(md);
          } catch (err) {
            if (tip) tip.textContent = "上传失败: " + err.message;
          }
        }
        if (insertedMds.length > 0) {
          NodeImage.insertToTarget(niTargetMode, insertedMds.join("\n"));
          if (tip) tip.textContent = `已上传并插入 ${insertedMds.length} 张图片`;
          closeNi();
        }
      };

      niBackdrop.querySelector(".nsc-ni-modal").addEventListener("drop", (e) => {
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          handleUploadFiles(files);
        }
      });
      niBackdrop.querySelector(".nsc-ni-modal").addEventListener("dragover", (e) => {
        if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files")) {
          e.preventDefault();
        }
      });

      niBackdrop.querySelector("#nsc-ni-detect").addEventListener("click", async () => {
        if (tip) tip.textContent = "正在连接 api.nodeimage.com 获取授权...";
        const k = await NodeImage.checkAuth();
        refreshAuthUi(!k);
        if (tip) tip.textContent = k ? "授权关联成功！" : "未检测到登录态，请先点击「去 NodeImage 登录授权」完成关联";
        if (k) loadNiImages();
      });

      niBackdrop.querySelector("#nsc-ni-save-key").addEventListener("click", () => {
        const val = niBackdrop.querySelector("#nsc-ni-key-input").value.trim();
        NodeImage.setKey(val);
        refreshAuthUi(!val);
        if (val) loadNiImages();
      });

      niBackdrop.querySelector("#nsc-ni-pick-btn").addEventListener("click", () => niFileInput.click());
      niFileInput.addEventListener("change", () => {
        const files = Array.from(niFileInput.files || []);
        niFileInput.value = "";
        handleUploadFiles(files);
      });

      niBackdrop.querySelector("#nsc-ni-load-list").addEventListener("click", loadNiImages);

      niBackdrop.querySelector("#nsc-ni-sel-all").addEventListener("click", () => {
        const visible = _niImages.slice(0, _niDisplayCount);
        for (const im of visible) {
          if (im.image_id) _niSelected.add(String(im.image_id));
        }
        syncBatchBar();
        renderNiGrid();
      });
      niBackdrop.querySelector("#nsc-ni-sel-clear").addEventListener("click", () => {
        _niSelected.clear();
        syncBatchBar();
        renderNiGrid();
      });
      niBackdrop.querySelector("#nsc-ni-batch-ins").addEventListener("click", () => {
        const mds = _niImages
          .filter((im) => _niSelected.has(String(im.image_id || "")))
          .map((im) => getImgUrls(im).md);
        if (mds.length === 0) return;
        NodeImage.insertToTarget(niTargetMode, mds.join("\n"));
        _niSelected.clear();
        syncBatchBar();
        closeNi();
      });
      batchDelBtn.addEventListener("click", async () => {
        if (_niSelected.size === 0) return;
        if (!_batchDelConfirm) {
          _batchDelConfirm = true;
          batchDelBtn.textContent = `确认删除 ${_niSelected.size} 张?`;
          return;
        }
        const ids = Array.from(_niSelected);
        batchDelBtn.disabled = true;
        batchDelBtn.textContent = "删除中...";
        let deleted = 0;
        for (const id of ids) {
          const ok = await NodeImage.deleteImage(id).catch(() => false);
          if (ok) {
            deleted += 1;
            _niSelected.delete(id);
            _niImages = _niImages.filter((x) => String(x.image_id || "") !== id);
          }
        }
        batchDelBtn.disabled = false;
        _batchDelConfirm = false;
        batchDelBtn.textContent = "批量删除";
        syncBatchBar();
        renderNiGrid();
        if (tip) tip.textContent = `已批量删除 ${deleted} 张图片`;
      });

      niBackdrop._refreshAuthUi = refreshAuthUi;
      niBackdrop._loadNiImages = loadNiImages;
    }

    const k = NodeImage.getKey();
    if (niBackdrop._refreshAuthUi) niBackdrop._refreshAuthUi(!k);
    niBackdrop.classList.add("is-open");
    const gridEl = niBackdrop.querySelector("#nsc-ni-grid");
    if (k && gridEl && !gridEl.hasChildNodes() && niBackdrop._loadNiImages) {
      niBackdrop._loadNiImages();
    }
    if (!k) {
      NodeImage.checkAuth().then((newK) => {
        if (newK) {
          if (niBackdrop._refreshAuthUi) niBackdrop._refreshAuthUi(false);
          if (niBackdrop._loadNiImages) niBackdrop._loadNiImages();
        }
      });
    }
  }

  function initNodeImageUi(npBackdropEl) {
    if (!NodeImage.getKey()) {
      NodeImage.checkAuth();
    } else {
      NodeImage.syncDots();
    }
    if (npBackdropEl) {
      const npHost = npBackdropEl.querySelector("#nsc-np-editor-host");
      if (npHost) NodeImage.bindPasteAndDrop(npHost, "newpost", "#nsc-np-status");
    }
    const dock = document.getElementById("nsc-composer-dock");
    if (dock) NodeImage.bindPasteAndDrop(dock, "chat", "#nsc-composer-status");
  }

