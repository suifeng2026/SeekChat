  // 官方内置基座配置中心插件：主题中心 / 四区皮肤透明度基座 / 组件调序基座 / 排版与自定义表情基座 / 插槽探测
  (function initWorkbenchBasePlugin() {
    const SECTIONS = [
      { id: "theme", label: "主题中心" },
      { id: "skin", label: "分区皮肤" },
      { id: "layout", label: "组件调序" },
      { id: "chat", label: "排版与回复" },
      { id: "slots", label: "扩展插槽" },
    ];

    function buildRangeControl({ label, min, max, step, value, unit = "", onLive, onCommit }) {
      const row = document.createElement("div");
      row.className = "nsc-base-ctrl-row";
      row.innerHTML = `
        <label>${escHtml(label)}</label>
        <input type="range" class="nsc-base-range" min="${min}" max="${max}" step="${step}" value="${value}" />
        <span class="nsc-base-val">${escHtml(String(value))}${escHtml(unit)}</span>
      `;
      const inp = row.querySelector("input");
      const valEl = row.querySelector(".nsc-base-val");
      inp.addEventListener("input", () => {
        valEl.textContent = `${inp.value}${unit}`;
        if (typeof onLive === "function") onLive(Number(inp.value));
      });
      inp.addEventListener("change", () => {
        if (typeof onCommit === "function") onCommit(Number(inp.value));
      });
      return row;
    }

    function buildOrderedListCard({ title, subtitle, items, protectedIds = [], minVisible = 1, onChange, onReset }) {
      const box = document.createElement("div");
      box.className = "nsc-base-section";
      box.innerHTML = `
        <div class="nsc-base-title">
          <span>${escHtml(title)}</span>
          <button type="button" class="nsc-mini-btn nsc-ord-reset">恢复默认</button>
        </div>
        ${subtitle ? `<div class="nsc-base-sub">${escHtml(subtitle)}</div>` : ""}
        <div class="nsc-base-order-list"></div>
      `;
      box.querySelector(".nsc-ord-reset").addEventListener("click", () => onReset());
      const listEl = box.querySelector(".nsc-base-order-list");

      const visibleCount = items.filter((x) => !x.hidden).length;
      items.forEach((it, idx) => {
        const isProtected = protectedIds.includes(it.id);
        const canHide = !isProtected && (it.hidden || visibleCount > minVisible);
        const row = document.createElement("div");
        row.className = "nsc-base-order-row";
        row.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;min-width:0;">
            <span style="font-size:11px;color:var(--nsc-muted);width:18px;">${idx + 1}.</span>
            <span style="font-weight:600;${it.hidden ? "opacity:0.5;text-decoration:line-through;" : ""}">${escHtml(it.name || it.label || it.id)}</span>
            ${isProtected ? `<span class="nsc-badge-read">必留</span>` : ""}
          </div>
          <div class="nsc-base-order-ops">
            <button type="button" class="nsc-icon-btn" data-dir="-1" title="上移" ${idx === 0 ? "disabled" : ""}>${ICONS.up}</button>
            <button type="button" class="nsc-icon-btn" data-dir="1" title="下移" ${idx === items.length - 1 ? "disabled" : ""}>${ICONS.down}</button>
            <button type="button" class="nsc-switch ${!it.hidden ? "is-on" : ""}" ${!canHide ? "disabled style=\"opacity:0.45;cursor:not-allowed;\"" : ""} title="${!it.hidden ? "点击隐藏" : "点击启用"}"><span class="nsc-switch-knob"></span></button>
          </div>
        `;
        row.querySelectorAll("[data-dir]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const dir = Number(btn.dataset.dir);
            const targetIdx = idx + dir;
            if (targetIdx < 0 || targetIdx >= items.length) return;
            const nextOrder = items.map((x) => x.id);
            const tmp = nextOrder[idx];
            nextOrder[idx] = nextOrder[targetIdx];
            nextOrder[targetIdx] = tmp;
            const nextHidden = items.filter((x) => x.hidden).map((x) => x.id);
            onChange({ order: nextOrder, hidden: nextHidden });
          });
        });
        const sw = row.querySelector(".nsc-switch");
        sw.addEventListener("click", () => {
          if (!canHide) return;
          const nextHiddenSet = new Set(items.filter((x) => x.hidden).map((x) => x.id));
          if (nextHiddenSet.has(it.id)) nextHiddenSet.delete(it.id);
          else nextHiddenSet.add(it.id);
          onChange({ order: items.map((x) => x.id), hidden: Array.from(nextHiddenSet) });
        });
        listEl.appendChild(row);
      });
      return box;
    }

    function renderThemeSection(body) {
      const themes = state.registry.themes || [];
      const curId = getEffectiveThemeMode();
      const sec = document.createElement("div");
      sec.className = "nsc-base-section";
      sec.innerHTML = `
        <div class="nsc-base-title">
          <span>外观主题注册中心（已识别 ${themes.length} 套）</span>
          <button type="button" class="nsc-mini-btn" id="nsc-base-theme-auto">跟随原站 (${state.themeMode === "auto" ? "当前" : "重置"})</button>
        </div>
        <div class="nsc-base-sub">默认提供 macOS 浅色、黄昏护眼与分层暗黑三套主题；后续放入 src/themes/*.js 的自定义主题会自动出现在下方列表中。</div>
        <div class="nsc-base-theme-grid"></div>
      `;
      sec.querySelector("#nsc-base-theme-auto").addEventListener("click", () => {
        applyThemeMode("auto");
        renderUserHubIfOpen();
      });
      const grid = sec.querySelector(".nsc-base-theme-grid");
      for (const th of themes) {
        const isAct = curId === th.id;
        const tk = th.tokens || {};
        const card = document.createElement("button");
        card.type = "button";
        card.className = "nsc-base-theme-card" + (isAct ? " is-active" : "");
        card.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
            <span style="font-size:13px;font-weight:700;color:var(--nsc-text);">${escHtml(th.name)}</span>
            <span class="nsc-badge-read">${th.baseScheme === "dark" ? "暗色基调" : "浅色基调"}</span>
          </div>
          <div style="font-size:11px;color:var(--nsc-muted);line-height:1.4;">${escHtml(th.desc || th.id)}</div>
          <div class="nsc-base-swatch-row">
            <span class="nsc-base-swatch" style="background:${escHtml(tk["--nsc-bg-nav"] || "#eee")};"></span>
            <span class="nsc-base-swatch" style="background:${escHtml(tk["--nsc-bg-chat"] || "#f5f5f5")};"></span>
            <span class="nsc-base-swatch" style="background:${escHtml(tk["--nsc-bubble-self"] || "#007aff")};"></span>
            <span class="nsc-base-swatch" style="background:${escHtml(tk["--nsc-accent"] || "#007aff")};"></span>
          </div>
        `;
        card.addEventListener("click", () => {
          applyThemeMode(th.id);
          renderUserHubIfOpen();
        });
        grid.appendChild(card);
      }
      body.appendChild(sec);
    }

    function renderSkinSection(body) {
      const intro = document.createElement("div");
      intro.className = "nsc-base-section";
      intro.innerHTML = `
        <div class="nsc-base-title">
          <span>四分区背景皮肤与透明度调节基座</span>
          <button type="button" class="nsc-mini-btn" id="nsc-skin-clear-all">一键还原默认磨砂</button>
        </div>
        <div class="nsc-base-sub">未设置背景图时保持原版 macOS 半透明磨砂效果；支持为导航、帖子、聊天底图、个人信息四个区域分别输入图片 URL 或上传本地图片，并独立微调透明度与模糊度。</div>
      `;
      intro.querySelector("#nsc-skin-clear-all").addEventListener("click", () => {
        state.paneSkins = {};
        saveJson(LS.PANE_SKINS, state.paneSkins);
        applyPaneSkinsToDom();
        renderUserHubIfOpen();
      });
      body.appendChild(intro);

      const grid = document.createElement("div");
      grid.className = "nsc-base-grid-2";

      for (const spec of PANE_SKIN_SPECS) {
        const cfg = state.paneSkins[spec.id] || {};
        const opVal = Math.round(Math.min(1, Math.max(0, Number(cfg.opacity ?? 0.25))) * 100);
        const blurVal = Math.min(24, Math.max(0, Number(cfg.blur ?? 0)));
        const fitVal = cfg.fit || "cover";

        const card = document.createElement("div");
        card.className = "nsc-base-section";
        card.style.marginBottom = "0";
        card.innerHTML = `
          <div class="nsc-base-title">
            <span>${escHtml(spec.label)}</span>
            <span class="nsc-badge-read" title="推荐图片尺寸与比例">${escHtml(spec.ratio)} · ${escHtml(spec.recSize)}</span>
          </div>
          <div style="display:flex;gap:5px;align-items:center;">
            <input type="text" class="nsc-search-input nsc-skin-url" placeholder="输入背景图 URL（支持图床直链）..." value="${escHtml(cfg.url || "")}" style="flex:1;height:27px;" />
            <button type="button" class="nsc-mini-btn nsc-skin-pick">本地图</button>
            <button type="button" class="nsc-mini-btn nsc-skin-clear">清除</button>
            <input type="file" accept="image/*" class="nsc-skin-file" style="display:none;" />
          </div>
          <div class="nsc-base-ctrl-row" style="margin-top:8px;">
            <label>填充方式</label>
            <div class="nsc-seg-tabs">
              <button type="button" class="nsc-seg-btn ${fitVal === "cover" ? "is-active" : ""}" data-fit="cover">铺满</button>
              <button type="button" class="nsc-seg-btn ${fitVal === "contain" ? "is-active" : ""}" data-fit="contain">完整</button>
              <button type="button" class="nsc-seg-btn ${fitVal === "repeat" ? "is-active" : ""}" data-fit="repeat">平铺</button>
            </div>
            <span class="nsc-base-val"></span>
          </div>
        `;

        const updatePaneSkin = (patch, rerender = false) => {
          state.paneSkins[spec.id] = { opacity: 0.25, blur: 0, fit: "cover", ...(state.paneSkins[spec.id] || {}), ...patch };
          saveJson(LS.PANE_SKINS, state.paneSkins);
          applyPaneSkinsToDom();
          if (rerender) renderUserHubIfOpen();
        };

        const urlInp = card.querySelector(".nsc-skin-url");
        urlInp.addEventListener("change", () => updatePaneSkin({ url: urlInp.value.trim() }));

        const fileInp = card.querySelector(".nsc-skin-file");
        card.querySelector(".nsc-skin-pick").addEventListener("click", () => fileInp.click());
        fileInp.addEventListener("change", () => {
          const f = fileInp.files && fileInp.files[0];
          fileInp.value = "";
          if (!f) return;
          if (f.size > 1.5 * 1024 * 1024) {
            urlInp.value = "";
            urlInp.placeholder = "图片超过 1.5MB，建议先上传图床后粘贴直链";
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              urlInp.value = reader.result;
              updatePaneSkin({ url: reader.result });
            }
          };
          reader.readAsDataURL(f);
        });

        card.querySelector(".nsc-skin-clear").addEventListener("click", () => {
          delete state.paneSkins[spec.id];
          saveJson(LS.PANE_SKINS, state.paneSkins);
          applyPaneSkinsToDom();
          renderUserHubIfOpen();
        });

        card.querySelectorAll("[data-fit]").forEach((fb) => {
          fb.addEventListener("click", () => {
            updatePaneSkin({ fit: fb.dataset.fit }, true);
          });
        });

        card.appendChild(
          buildRangeControl({
            label: "图片透明度",
            min: 0,
            max: 100,
            step: 2,
            value: opVal,
            unit: "%",
            onLive: (v) => {
              state.paneSkins[spec.id] = { ...(state.paneSkins[spec.id] || {}), opacity: v / 100 };
              applyPaneSkinsToDom();
            },
            onCommit: (v) => updatePaneSkin({ opacity: v / 100 }),
          })
        );

        card.appendChild(
          buildRangeControl({
            label: "背景模糊度",
            min: 0,
            max: 24,
            step: 1,
            value: blurVal,
            unit: "px",
            onLive: (v) => {
              state.paneSkins[spec.id] = { ...(state.paneSkins[spec.id] || {}), blur: v };
              applyPaneSkinsToDom();
            },
            onCommit: (v) => updatePaneSkin({ blur: v }),
          })
        );

        grid.appendChild(card);
      }
      body.appendChild(grid);
    }

    function renderLayoutSection(body) {
      const rightItems = getOrderedRightTabs(true);
      body.appendChild(
        buildOrderedListCard({
          title: "右侧栏标签顺序与显隐控制",
          subtitle: "调整右侧栏（热榜 / 好友 / 粉丝 / 黑名单）排列位置或关闭暂不需要的面板（至少保留一项）。",
          items: rightItems,
          minVisible: 1,
          onChange: (cfg) => {
            state.rightConfig = cfg;
            saveJson(LS.RIGHT_CONFIG, cfg);
            renderRightTabs();
            renderRightBody();
            renderUserHubIfOpen();
          },
          onReset: () => {
            state.rightConfig = { order: [], hidden: [] };
            saveJson(LS.RIGHT_CONFIG, state.rightConfig);
            renderRightTabs();
            renderRightBody();
            renderUserHubIfOpen();
          },
        })
      );

      const navItems = getOrderedChannels(true);
      body.appendChild(
        buildOrderedListCard({
          title: "左侧导航功能顺序与显隐控制",
          subtitle: "支持调整版块与消息入口排序，或隐藏不常逛的版块（「首页」保持必留）。",
          items: navItems,
          protectedIds: ["home"],
          minVisible: 1,
          onChange: (cfg) => {
            state.navConfig = cfg;
            saveJson(LS.NAV_CONFIG, cfg);
            renderLeftNav();
            renderUserHubIfOpen();
          },
          onReset: () => {
            state.navConfig = { order: [], hidden: [] };
            saveJson(LS.NAV_CONFIG, state.navConfig);
            renderLeftNav();
            renderUserHubIfOpen();
          },
        })
      );
    }

    function renderChatAndComposerSection(body) {
      const p = state.chatPrefs || { lineHeight: 1.55, msgGap: 12, imgMaxW: 480, imgMaxH: 320 };
      const typoBox = document.createElement("div");
      typoBox.className = "nsc-base-section";
      typoBox.innerHTML = `
        <div class="nsc-base-title">
          <span>聊天区排版与图片尺寸基座</span>
          <button type="button" class="nsc-mini-btn" id="nsc-chat-pref-reset">恢复默认</button>
        </div>
        <div class="nsc-base-sub">实时调整消息行高、楼层间距及聊天框内普通图片显示上限（不影响灯箱原图查看与魔术标签页长图）。</div>
      `;
      typoBox.querySelector("#nsc-chat-pref-reset").addEventListener("click", () => {
        state.chatPrefs = { lineHeight: 1.55, msgGap: 12, imgMaxW: 480, imgMaxH: 320 };
        saveJson(LS.CHAT_PREFS, state.chatPrefs);
        applyChatPrefsToDom();
        renderUserHubIfOpen();
      });

      const commitPref = (patch) => {
        state.chatPrefs = { ...state.chatPrefs, ...patch };
        saveJson(LS.CHAT_PREFS, state.chatPrefs);
        applyChatPrefsToDom();
      };

      typoBox.appendChild(buildRangeControl({
        label: "正文行间距",
        min: 1.25, max: 2.0, step: 0.05, value: Number(p.lineHeight || 1.55),
        onLive: (v) => { state.chatPrefs.lineHeight = v; applyChatPrefsToDom(); },
        onCommit: (v) => commitPref({ lineHeight: v }),
      }));
      typoBox.appendChild(buildRangeControl({
        label: "消息间距",
        min: 4, max: 24, step: 1, value: Number(p.msgGap || 12), unit: "px",
        onLive: (v) => { state.chatPrefs.msgGap = v; applyChatPrefsToDom(); },
        onCommit: (v) => commitPref({ msgGap: v }),
      }));
      typoBox.appendChild(buildRangeControl({
        label: "图片最大宽",
        min: 260, max: 700, step: 20, value: Number(p.imgMaxW || 480), unit: "px",
        onLive: (v) => { state.chatPrefs.imgMaxW = v; applyChatPrefsToDom(); },
        onCommit: (v) => commitPref({ imgMaxW: v }),
      }));
      typoBox.appendChild(buildRangeControl({
        label: "图片最大高",
        min: 180, max: 640, step: 20, value: Number(p.imgMaxH || 320), unit: "px",
        onLive: (v) => { state.chatPrefs.imgMaxH = v; applyChatPrefsToDom(); },
        onCommit: (v) => commitPref({ imgMaxH: v }),
      }));
      body.appendChild(typoBox);

      const stkBox = document.createElement("div");
      stkBox.className = "nsc-base-section";
      stkBox.innerHTML = `
        <div class="nsc-base-title">
          <span>回复区自定义表情分组基座</span>
          <span class="nsc-badge-read">共 ${state.customStickers.length} 个自定义分组</span>
        </div>
        <div class="nsc-base-sub">新增的表情分组会自动同步至发帖、编辑与评论回复表情选择器中（格式为标准 Markdown 图片，支持外链贴图与 NodeImage 图床链接）。</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
          <input type="text" id="nsc-stk-grp-name" class="nsc-search-input" placeholder="分组名称（如：常用梗图）" style="flex:1;min-width:140px;height:27px;" />
          <input type="text" id="nsc-stk-item-name" class="nsc-search-input" placeholder="表情名称（可选）" style="width:120px;height:27px;" />
          <input type="text" id="nsc-stk-item-url" class="nsc-search-input" placeholder="粘贴图片 URL（https://...）" style="flex:2;min-width:190px;height:27px;" />
          <button type="button" class="nsc-send-btn" id="nsc-stk-add-btn" style="height:27px;">添加表情</button>
        </div>
        <div id="nsc-stk-list"></div>
      `;
      stkBox.querySelector("#nsc-stk-add-btn").addEventListener("click", () => {
        const gLabel = stkBox.querySelector("#nsc-stk-grp-name").value.trim() || "自定义表情";
        const iName = stkBox.querySelector("#nsc-stk-item-name").value.trim() || "sticker";
        const iUrl = stkBox.querySelector("#nsc-stk-item-url").value.trim();
        if (!/^https?:\/\//i.test(iUrl)) return;
        let grp = state.customStickers.find((g) => g.label === gLabel);
        if (!grp) {
          grp = { id: `custom_${Date.now().toString(36)}`, label: gLabel, items: [] };
          state.customStickers.push(grp);
        }
        grp.items.push({ name: iName, url: iUrl });
        saveJson(LS.CUSTOM_STICKERS, state.customStickers);
        renderUserHubIfOpen();
      });

      const listEl = stkBox.querySelector("#nsc-stk-list");
      if (state.customStickers.length === 0) {
        listEl.innerHTML = `<div style="font-size:11.5px;color:var(--nsc-muted);">暂无自定义表情分组，可在上方输入分组名与图片 URL 添加。</div>`;
      } else {
        state.customStickers.forEach((grp, gIdx) => {
          const gRow = document.createElement("div");
          gRow.className = "nsc-base-section";
          gRow.style.cssText = "padding:8px 10px;margin-bottom:6px;background:var(--nsc-hover);";
          gRow.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <strong style="font-size:12px;">${escHtml(grp.label)} (${grp.items.length})</strong>
              <button type="button" class="nsc-mini-btn nsc-stk-del-grp" style="color:#ff3b30;">删除分组</button>
            </div>
            <div class="nsc-base-sticker-preview"></div>
          `;
          gRow.querySelector(".nsc-stk-del-grp").addEventListener("click", () => {
            state.customStickers.splice(gIdx, 1);
            saveJson(LS.CUSTOM_STICKERS, state.customStickers);
            renderUserHubIfOpen();
          });
          const prevEl = gRow.querySelector(".nsc-base-sticker-preview");
          grp.items.forEach((it, iIdx) => {
            const chip = document.createElement("span");
            chip.className = "nsc-base-sticker-chip";
            chip.innerHTML = `<img src="${escHtml(it.url)}" alt="" /><span>${escHtml(it.name || "贴图")}</span><button type="button" style="border:none;background:transparent;color:var(--nsc-muted);cursor:pointer;padding:0 2px;">✕</button>`;
            chip.querySelector("button").addEventListener("click", () => {
              grp.items.splice(iIdx, 1);
              if (grp.items.length === 0) state.customStickers.splice(gIdx, 1);
              saveJson(LS.CUSTOM_STICKERS, state.customStickers);
              renderUserHubIfOpen();
            });
            prevEl.appendChild(chip);
          });
          listEl.appendChild(gRow);
        });
      }
      body.appendChild(stkBox);
    }

    function renderSlotsSection(body) {
      const manifest = typeof NSC_DISCOVERED_MODULES !== "undefined" ? NSC_DISCOVERED_MODULES : { mode: "unknown", themes: [], plugins: [] };
      const reg = state.registry;
      const box = document.createElement("div");
      box.className = "nsc-base-section";
      box.innerHTML = `
        <div class="nsc-base-title">
          <span>目录自动发现与扩展插槽状态</span>
          <span class="nsc-badge-read">构建模式：${escHtml(manifest.mode || "release")}</span>
        </div>
        <div class="nsc-base-sub">build.mjs 在构建时自动扫描 src/themes/*.js 与 src/plugins/*.js。二开者使用 custom-*.js 命名插件或主题，可在上游更新后无冲突保留扩展能力。</div>
        <div class="nsc-hub-kpi-grid">
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">已发现主题文件</div><div class="nsc-hub-kpi-val">${manifest.themes.length}</div></div>
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">已发现插件文件</div><div class="nsc-hub-kpi-val">${manifest.plugins.length}</div></div>
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">注册主题 / Hub 插槽</div><div class="nsc-hub-kpi-val">${reg.themes.length} / ${reg.hubTabs.length}</div></div>
          <div class="nsc-hub-kpi"><div class="nsc-hub-kpi-lbl">气泡增强器 / 动作插槽</div><div class="nsc-hub-kpi-val">${reg.bubbleEnhancers.length} / ${reg.userActions.length}</div></div>
        </div>
        <div class="nsc-base-order-list">
          <div class="nsc-base-order-row"><span>themes/ 目录模块</span><span class="nsc-vote-note">${escHtml(manifest.themes.join(", ") || "无")}</span></div>
          <div class="nsc-base-order-row"><span>plugins/ 目录模块</span><span class="nsc-vote-note">${escHtml(manifest.plugins.join(", ") || "无")}</span></div>
          <div class="nsc-base-order-row"><span>已注册气泡增强管线（按优先级）</span><span class="nsc-vote-note">${escHtml(reg.bubbleEnhancers.map((e) => `${e.priority}:${e.id}`).join(" → "))}</span></div>
        </div>
      `;
      body.appendChild(box);
    }

    registerHubTab({
      id: "workbench",
      label: "基座",
      order: 95,
      nativeHref: "/setting",
      renderSubbar(subbar) {
        const seg = document.createElement("div");
        seg.className = "nsc-seg-tabs";
        for (const s of SECTIONS) {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "nsc-seg-btn" + (state.workbenchSection === s.id ? " is-active" : "");
          b.textContent = s.label;
          b.addEventListener("click", () => {
            state.workbenchSection = s.id;
            renderUserHub();
          });
          seg.appendChild(b);
        }
        subbar.appendChild(seg);
        const tip = document.createElement("span");
        tip.style.cssText = "font-size:11px;color:var(--nsc-muted);";
        tip.textContent = "零依赖共享基座 · 所有配置即时保存本地";
        subbar.appendChild(tip);
      },
      renderBody(body) {
        const sec = state.workbenchSection || "theme";
        if (sec === "theme") renderThemeSection(body);
        else if (sec === "skin") renderSkinSection(body);
        else if (sec === "layout") renderLayoutSection(body);
        else if (sec === "chat") renderChatAndComposerSection(body);
        else renderSlotsSection(body);
      },
    });
  })();
