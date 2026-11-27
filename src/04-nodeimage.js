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
        const ta = document.getElementById("nsc-np-content");
        if (ta) smartWrapTa(ta);
        return;
      }
      if (targetMode === "edit") {
        const ta = document.getElementById("nsc-edit-content");
        if (ta) smartWrapTa(ta);
        return;
      }
      const pmBox = document.getElementById("nsc-pm-composer");
      if (targetMode === "pm" || (pmBox && pmBox.style.display !== "none")) {
        const ta = document.getElementById("nsc-pm-ta");
        if (ta) smartWrapTa(ta);
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
      const ta = document.getElementById("nsc-fallback-ta");
      if (ta) smartWrapTa(ta);
    },
    bindPasteAndDrop(containerEl, targetMode, statusSelector) {
      if (!containerEl || containerEl.dataset.nscNiBound === "1") return;
      containerEl.dataset.nscNiBound = "1";
      const resolveMode = () => {
        if (targetMode === "chat") {
          const pmBox = document.getElementById("nsc-pm-composer");
          if (pmBox && pmBox.style.display !== "none") return "pm";
        }
        return targetMode;
      };
      const getStatusEl = (effMode) => {
        if (effMode === "pm") return document.getElementById("nsc-pm-status");
        if (effMode === "newpost") return document.getElementById("nsc-np-status");
        if (effMode === "edit") return document.getElementById("nsc-edit-status");
        return (
          (statusSelector && document.querySelector(statusSelector)) ||
          document.getElementById("nsc-composer-status") ||
          document.querySelector("#nsc-composer-body .nsc-ni-status")
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

  function openNodeImageModal(targetMode = "chat") {
    niTargetMode = targetMode;
    if (!niBackdrop) {
      niBackdrop = document.createElement("div");
      niBackdrop.id = "nsc-ni-backdrop";
      niBackdrop.innerHTML = `
        <div class="nsc-ni-modal" role="dialog" aria-label="NodeImage 图床关联与上传">
          <div class="nsc-newpost-head">
            <span style="font-size:14px;font-weight:700;">NodeImage 图床 · 授权与传图</span>
            <button type="button" id="nsc-ni-close" style="border:none;background:transparent;color:var(--nsc-muted);font-size:16px;cursor:pointer;">✕</button>
          </div>
          <div class="nsc-newpost-body" style="gap:10px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:8px 10px;border-radius:10px;background:var(--nsc-hover);">
              <div style="font-size:12px;">
                状态：<strong id="nsc-ni-auth-state">检测中...</strong>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <button type="button" class="nsc-mini-btn" id="nsc-ni-detect">自动检测授权</button>
                <a class="nsc-mini-btn" href="https://www.nodeimage.com/" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">去 NodeImage 登录授权 ↗</a>
              </div>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="password" id="nsc-ni-key-input" class="nsc-search-input" placeholder="或直接粘贴 NodeImage API Key..." style="flex:1;" />
              <button type="button" class="nsc-mini-btn" id="nsc-ni-save-key">保存 Key</button>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
              <div style="display:flex;gap:6px;">
                <button type="button" class="nsc-newpost-btn" id="nsc-ni-pick-btn">选择图片上传</button>
                <button type="button" class="nsc-mini-btn" id="nsc-ni-load-list">加载我的图床</button>
              </div>
              <span id="nsc-ni-tip" style="font-size:11px;color:var(--nsc-muted);">授权后支持在任意编辑框 Ctrl+V 粘贴图片直传</span>
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

      const refreshAuthUi = () => {
        const k = NodeImage.getKey();
        const stEl = niBackdrop.querySelector("#nsc-ni-auth-state");
        const inp = niBackdrop.querySelector("#nsc-ni-key-input");
        if (stEl) {
          stEl.textContent = k ? "已关联授权（支持 Ctrl+V 粘贴上传）" : "未授权（请先登录 NodeImage 后点自动检测）";
          stEl.style.color = k ? "var(--nsc-green)" : "#ff3b30";
        }
        if (inp && k && !inp.value) inp.value = k;
        NodeImage.syncDots();
      };

      niBackdrop.querySelector("#nsc-ni-detect").addEventListener("click", async () => {
        const tip = niBackdrop.querySelector("#nsc-ni-tip");
        if (tip) tip.textContent = "正在连接 api.nodeimage.com 获取授权...";
        const k = await NodeImage.checkAuth();
        refreshAuthUi();
        if (tip) tip.textContent = k ? "授权关联成功！" : "未检测到登录态，请先点击「去 NodeImage 登录授权」完成关联";
      });

      niBackdrop.querySelector("#nsc-ni-save-key").addEventListener("click", () => {
        const val = niBackdrop.querySelector("#nsc-ni-key-input").value.trim();
        NodeImage.setKey(val);
        refreshAuthUi();
      });

      niBackdrop.querySelector("#nsc-ni-pick-btn").addEventListener("click", () => niFileInput.click());
      niFileInput.addEventListener("change", async () => {
        const files = Array.from(niFileInput.files || []);
        niFileInput.value = "";
        if (files.length === 0) return;
        const tip = niBackdrop.querySelector("#nsc-ni-tip");
        for (const f of files) {
          if (tip) tip.textContent = `正在上传 ${f.name}...`;
          try {
            const md = await NodeImage.uploadFile(f);
            NodeImage.insertToTarget(niTargetMode, md);
            if (tip) tip.textContent = "上传并插入成功！";
            closeNi();
          } catch (err) {
            if (tip) tip.textContent = "上传失败: " + err.message;
          }
        }
      });

      niBackdrop.querySelector("#nsc-ni-load-list").addEventListener("click", async () => {
        const grid = niBackdrop.querySelector("#nsc-ni-grid");
        const tip = niBackdrop.querySelector("#nsc-ni-tip");
        grid.innerHTML = `<div style="padding:12px;font-size:12px;color:var(--nsc-muted);">加载中...</div>`;
        try {
          const imgs = await NodeImage.listImages();
          grid.innerHTML = "";
          if (imgs.length === 0) {
            grid.innerHTML = `<div style="padding:12px;font-size:12px;color:var(--nsc-muted);">暂无已上传图片</div>`;
            return;
          }
          const sliced = imgs.slice(0, 30);
          const galleryUrls = sliced.map((im) => (im.links && im.links.direct) || im.url || `https://cdn.nodeimage.com/i/${im.image_id}.png`);
          for (const im of sliced) {
            const directUrl = (im.links && im.links.direct) || im.url || `https://cdn.nodeimage.com/i/${im.image_id}.png`;
            const md = (im.links && im.links.markdown) || `![image](${directUrl})`;
            const card = document.createElement("div");
            card.className = "nsc-ni-card";
            card.innerHTML = `
              <img src="${directUrl}" loading="lazy" title="点击插入到编辑器" />
              <div class="nsc-ni-card-ops">
                <button type="button" class="nsc-mini-btn" style="padding:2px 8px;font-size:11px;">插入</button>
                <div style="display:inline-flex;gap:4px;">
                  <button type="button" class="nsc-mini-btn" style="padding:2px 6px;font-size:11px;" title="放大查看">看图</button>
                  <button type="button" class="nsc-mini-btn" style="padding:2px 6px;font-size:11px;color:#ff3b30;">删除</button>
                </div>
              </div>
            `;
            const insFn = () => { NodeImage.insertToTarget(niTargetMode, md); closeNi(); };
            const niImg = card.querySelector("img");
            niImg.addEventListener("click", insFn);
            card.querySelectorAll("button")[0].addEventListener("click", insFn);
            card.querySelectorAll("button")[1].addEventListener("click", () => {
              if (typeof openLightbox === "function") openLightbox(directUrl, galleryUrls);
            });
            card.querySelectorAll("button")[2].addEventListener("click", async () => {
              if (!im.image_id) return;
              await NodeImage.deleteImage(im.image_id);
              card.remove();
            });
            grid.appendChild(card);
          }
          if (tip) tip.textContent = `已加载 ${imgs.length} 张图片，点击即可插入`;
        } catch (err) {
          grid.innerHTML = `<div style="padding:12px;font-size:12px;color:#ff3b30;">加载失败: ${err.message}</div>`;
        }
      });
    }

    const stEl = niBackdrop.querySelector("#nsc-ni-auth-state");
    const k = NodeImage.getKey();
    if (stEl) {
      stEl.textContent = k ? "已关联授权（支持 Ctrl+V 粘贴上传）" : "未授权（正在检测登录态...）";
      stEl.style.color = k ? "var(--nsc-green)" : "#ff3b30";
    }
    NodeImage.syncDots();
    niBackdrop.classList.add("is-open");
    const gridEl = niBackdrop.querySelector("#nsc-ni-grid");
    if (k && gridEl && !gridEl.hasChildNodes()) {
      niBackdrop.querySelector("#nsc-ni-load-list").click();
    }
    if (!k) {
      NodeImage.checkAuth().then((newK) => {
        if (newK && stEl) {
          stEl.textContent = "已关联授权（支持 Ctrl+V 粘贴上传）";
          stEl.style.color = "var(--nsc-green)";
          const inp = niBackdrop.querySelector("#nsc-ni-key-input");
          if (inp) inp.value = newK;
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
      const npBtn = npBackdropEl.querySelector('[data-ni-btn="newpost"]');
      if (npBtn) npBtn.addEventListener("click", () => openNodeImageModal("newpost"));
      NodeImage.bindPasteAndDrop(npBackdropEl.querySelector("#nsc-np-content"), "newpost", "#nsc-np-status");
    }
    const dock = document.getElementById("nsc-composer-dock");
    if (dock) NodeImage.bindPasteAndDrop(dock, "chat", "#nsc-composer-status");
  }

