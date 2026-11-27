  // 官方内置基座配置中心插件：主题中心 / 四区皮肤透明度基座 / 组件调序基座 / 排版与自定义表情基座 / 插槽探测
  (function initWorkbenchBasePlugin() {
    const SECTIONS = [
      { id: "theme", label: "外观主题", desc: "切换浅色、黄昏护眼、分层暗黑及自定义主题包", icon: () => ICONS.palette },
      { id: "skin", label: "分区皮肤", desc: "为工作台四个分区独立设置背景图、透明度与模糊度", icon: () => ICONS.photo },
      { id: "layout", label: "导航与栏位", desc: "自定义左侧导航及右侧热榜/好友/粉丝/黑名单排序与显隐", icon: () => ICONS.layers },
      { id: "chat", label: "排版与交互", desc: "调节阅读行高、图片上限、外链跳转、名片记录与自定义表情", icon: () => ICONS.sliders },
      { id: "ext", label: "原版扩展", desc: "管理原版论坛「自定义 style」CSS 预设与一键引导", icon: () => ICONS.edit },
      { id: "slots", label: "扩展与兼容", desc: "按需开关正文增强功能，查看共存插件与运行环境兼容状态", icon: () => ICONS.tools },
    ];

    const DEFAULT_STYLE_PRESETS = [
      {
        id: "preset_kawaii_border",
        title: "原版论坛 · 萌系半透明封边（80hou预留）",
        note: "包含白色圆角头像投影、斜纹滚动条、自定义指针、全屏背景图与 #nsk-body-left 封边；切回原版论坛时依然生效。",
        code: `/* ============================================================
   1. 组件基础样式：统一图标与按钮风格
   ============================================================ */
.avatar { border: 3px solid #fff !important; } /* 给头像增加一圈白色边框，更醒目 */
.avatar + .icon { display: none !important; } /* 隐藏掉头像旁边的小等级图标，让画面更简洁 */
.avatar-normal, .sorter, .btn { box-shadow: 1px 1px 3px #000 !important; } /* 给头像、排序栏、按钮加上淡淡的黑色投影，看起来有立体感 */
.avatar-normal { border-radius: 20px; } /* 设置头像为圆角矩形 */

/* ============================================================
   2. 滚动条美化：让滚动条不再是原生那种丑丑的样子
   ============================================================ */
::-webkit-scrollbar { width: 8px; height: 8px; } /* 设置滚动条的厚度 */
::-webkit-scrollbar-track { background-color: rgba(200, 200, 200, 0.2); border-radius: 2em; } /* 设置滚动条轨道的颜色为浅灰半透明，并带圆角 */
::-webkit-scrollbar-thumb {
    background-color: #ccc; /* 设置滑块本身的颜色 */
    background-image: -webkit-linear-gradient(45deg, rgba(255,255,255,0.4) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.4) 75%, transparent 75%, transparent); /* 给滑块加上漂亮的斜纹装饰 */
    border-radius: 2em; /* 滑块两端变圆润 */
}

/* ============================================================
   3. 自定义鼠标指针：让点击交互更有趣
   ============================================================ */
body { cursor: url('https://npm.elemecdn.com/kang-static/Hexo/img/default.cur'), auto !important; } /* 设置页面空白处的默认鼠标箭头 */
a, button, img, .transition { cursor: url('https://npm.elemecdn.com/kang-static/Hexo/img/pointer.cur'), auto !important; } /* 设置鼠标移到链接、按钮、图片等可点击物体上的指针 */

/* ============================================================
   4. 页面背景与透明度布局：核心视觉美化
   ============================================================ */
body::before {
    content: "";
    position: fixed; /* 把背景图固定住，页面滚动时背景不动 */
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: -1; /* 把背景图放到最底层，确保不遮挡文字 */
    background: #f0f0f0 url(https://cdn.nodeimage.com/i/qAdktUUKq1wrLwlSuYIbhHDiZtf3lXCp.png) center/cover no-repeat; /* 设置自动拉伸的随机背景图 */
}

#nsk-body, header { background-color: rgba(255, 255, 255, 0.7) !important; } /* 设置主体内容区和顶栏为 70% 透明的白色，隐约透出背景 */
footer { background-color: rgba(255, 255, 255, 0.15) !important; } /* 页脚更透一点，只有 15% 透明度 */

/* ============================================================
   5. 帖子列表：自定义可爱封边 (带调试指南)
   ============================================================ */
#nsk-body-left {
    background: rgba(255, 255, 255, 0.2) !important; /* 背景更通透 (0.2透明度) */
    /* backdrop-filter: blur(10px); */ /* 注释掉以防与 Pro 脚本的弹窗层级及渲染冲突 */
    border-radius: 20px; /* 设置帖子区域的大圆角 */
    
    /* 1. 图案厚度：数值越大，边框图案越宽 (觉得太窄就改大这里) */
    border: 25px solid transparent; 
    
    /* 2. 图片设置：55为切片数值，若图案被切断，微调此数字 (每次增减 5-10) */
    border-image: url('https://cdn.nodeimage.com/i/wXSGm50JBUZj8j3wobqzgleqht7Fa2uq.png') 55 round;
    
    /* 3. 偏移距离：图案离帖子内容的距离 (如果图案压到字了，就把 10 改大) */
    border-image-outset: 10px;
    
    /* 设置内容与边缘的空隙 */
    padding: 10px;
    margin-right: 15px;
}`,
      },
    ];

    function getStyleNotes() {
      if (state.customStyleNotes === null) {
        state.customStyleNotes = DEFAULT_STYLE_PRESETS.map((p) => ({ ...p }));
        saveJson(LS.CUSTOM_STYLE_NOTES, state.customStyleNotes);
      } else if (Array.isArray(state.customStyleNotes)) {
        let migrated = false;
        for (const n of state.customStyleNotes) {
          if (n && n.id === "preset_kawaii_border" && n.title === "原版论坛 · 萌系半透明封边（官方扩展预设）") {
            n.title = DEFAULT_STYLE_PRESETS[0].title;
            migrated = true;
          }
        }
        if (migrated) saveJson(LS.CUSTOM_STYLE_NOTES, state.customStyleNotes);
      }
      return Array.isArray(state.customStyleNotes) ? state.customStyleNotes : [];
    }

    let selectedExtId = "";
    let showExtGuideBox = false;

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
        renderBaseModalIfOpen();
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
          renderBaseModalIfOpen();
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
        renderBaseModalIfOpen();
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
          if (rerender) renderBaseModalIfOpen();
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
          renderBaseModalIfOpen();
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
            renderBaseModalIfOpen();
          },
          onReset: () => {
            state.rightConfig = { order: [], hidden: [] };
            saveJson(LS.RIGHT_CONFIG, state.rightConfig);
            renderRightTabs();
            renderRightBody();
            renderBaseModalIfOpen();
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
            renderBaseModalIfOpen();
          },
          onReset: () => {
            state.navConfig = { order: [], hidden: [] };
            saveJson(LS.NAV_CONFIG, state.navConfig);
            renderLeftNav();
            renderBaseModalIfOpen();
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
        renderBaseModalIfOpen();
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
        renderBaseModalIfOpen();
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
            renderBaseModalIfOpen();
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
              renderBaseModalIfOpen();
            });
            prevEl.appendChild(chip);
          });
          listEl.appendChild(gRow);
        });
      }
      body.appendChild(stkBox);

      const interBox = document.createElement("div");
      interBox.className = "nsc-base-section";
      const cachedCount = Object.keys(state.rulingCache || {}).length;
      interBox.innerHTML = `
        <div class="nsc-base-title">
          <span>外链跳转与名片管理记录基座</span>
        </div>
        <div class="nsc-base-sub">控制 /jump 外链的页内确认交互，以及点击头像打开单个用户名片时的管理记录查询行为（仅按次按人查询，不作批量预拉取）。</div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
          <span style="font-size:12px;font-weight:600;color:var(--nsc-text);">外链跳转提醒方式</span>
          <div class="nsc-seg-tabs" id="nsc-jump-mode-seg">
            <button type="button" class="nsc-seg-btn ${state.jumpLinkMode === "modal" ? "is-active" : ""}" data-jmode="modal">页内二次确认</button>
            <button type="button" class="nsc-seg-btn ${state.jumpLinkMode === "direct" ? "is-active" : ""}" data-jmode="direct">直接跳转（免提醒）</button>
            <button type="button" class="nsc-seg-btn ${state.jumpLinkMode === "native" ? "is-active" : ""}" data-jmode="native">跟随原站</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:8px;">
            <button type="button" class="nsc-switch ${state.rulingAutoQuery ? "is-on" : ""}" id="nsc-ruling-auto-sw" aria-pressed="${state.rulingAutoQuery ? "true" : "false"}"><span class="nsc-switch-knob"></span></button>
            <span style="font-size:12px;font-weight:600;color:var(--nsc-text);">点击头像打开名片时自动查询该用户管理记录</span>
          </div>
          <button type="button" class="nsc-mini-btn" id="nsc-ruling-clear-cache">清空记录缓存 (${cachedCount})</button>
        </div>
      `;
      interBox.querySelectorAll("[data-jmode]").forEach((b) => {
        b.addEventListener("click", () => {
          state.jumpLinkMode = b.dataset.jmode || "modal";
          localStorage.setItem(LS.JUMP_MODE, state.jumpLinkMode);
          renderBaseModalIfOpen();
        });
      });
      interBox.querySelector("#nsc-ruling-auto-sw").addEventListener("click", () => {
        state.rulingAutoQuery = !state.rulingAutoQuery;
        localStorage.setItem(LS.RULING_AUTO, state.rulingAutoQuery ? "1" : "0");
        renderBaseModalIfOpen();
      });
      interBox.querySelector("#nsc-ruling-clear-cache").addEventListener("click", () => {
        state.rulingCache = {};
        saveJson(LS.RULING_CACHE, {});
        renderBaseModalIfOpen();
      });
      body.appendChild(interBox);
    }

    function renderExtSection(body) {
      const notes = getStyleNotes();
      if (notes.length > 0 && !notes.some((n) => n.id === selectedExtId)) {
        selectedExtId = notes[0].id;
      }
      const cur = notes.find((n) => n.id === selectedExtId) || null;

      const intro = document.createElement("div");
      intro.className = "nsc-base-section";
      intro.innerHTML = `
        <div class="nsc-base-title">
          <span>原版论坛扩展样式备忘录（自定义 style 预设与引导）</span>
          <div style="display:inline-flex;gap:6px;">
            <button type="button" class="nsc-mini-btn" id="nsc-ext-new">+ 新建备忘</button>
            <button type="button" class="nsc-mini-btn" id="nsc-ext-restore">恢复默认预设</button>
          </div>
        </div>
        <div class="nsc-base-sub">
          用于收藏和切换 NodeSeek 原站「设置 → 论坛扩展 → 自定义style」CSS 代码（切换回原版论坛模式时同样生效）。
          注：NodeSeek 对「论坛扩展」功能存在社区等级限制，部分未达对应等级的账号可能无法在设置页看到该入口。
        </div>
        <div id="nsc-ext-tabs" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;"></div>
      `;

      intro.querySelector("#nsc-ext-new").addEventListener("click", () => {
        const nid = `memo_${Date.now().toString(36)}`;
        notes.push({
          id: nid,
          title: `自定义扩展 #${notes.length + 1}`,
          note: "",
          code: "/* 在此粘贴原版论坛自定义 CSS 代码 */\n",
        });
        state.customStyleNotes = notes;
        selectedExtId = nid;
        showExtGuideBox = false;
        saveJson(LS.CUSTOM_STYLE_NOTES, notes);
        renderBaseModalIfOpen();
      });

      intro.querySelector("#nsc-ext-restore").addEventListener("click", () => {
        const preset = DEFAULT_STYLE_PRESETS[0];
        const idx = notes.findIndex((n) => n.id === preset.id);
        if (idx >= 0) notes[idx] = { ...preset };
        else notes.unshift({ ...preset });
        state.customStyleNotes = notes;
        selectedExtId = preset.id;
        showExtGuideBox = false;
        saveJson(LS.CUSTOM_STYLE_NOTES, notes);
        renderBaseModalIfOpen();
      });

      const tabsEl = intro.querySelector("#nsc-ext-tabs");
      if (notes.length === 0) {
        tabsEl.innerHTML = `<span style="font-size:11.5px;color:var(--nsc-muted);">暂无扩展备忘，点击右上角「+ 新建备忘」或「恢复默认预设」。</span>`;
      } else {
        notes.forEach((n) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "nsc-pill-btn" + (cur && cur.id === n.id ? " is-active" : "");
          b.textContent = n.title || "未命名扩展";
          b.addEventListener("click", () => {
            selectedExtId = n.id;
            showExtGuideBox = false;
            renderBaseModalIfOpen();
          });
          tabsEl.appendChild(b);
        });
      }
      body.appendChild(intro);

      if (!cur) return;

      const edBox = document.createElement("div");
      edBox.className = "nsc-base-section";
      edBox.innerHTML = `
        <div class="nsc-base-title">
          <input type="text" id="nsc-ext-title" class="nsc-search-input" value="${escHtml(cur.title || "")}" placeholder="扩展名称..." style="flex:1;max-width:360px;height:28px;font-weight:600;" />
          <div style="display:inline-flex;gap:6px;">
            <button type="button" class="nsc-mini-btn" id="nsc-ext-save">保存备忘</button>
            <button type="button" class="nsc-mini-btn" id="nsc-ext-del" style="color:#ff3b30;">删除</button>
            <button type="button" class="nsc-send-btn" id="nsc-ext-apply" style="height:26px;">复制并前往配置</button>
          </div>
        </div>
        ${cur.note ? `<div class="nsc-base-sub">${escHtml(cur.note)}</div>` : ""}
        <div id="nsc-ext-guide-slot"></div>
        <textarea id="nsc-ext-code" class="nsc-ext-code" spellcheck="false" placeholder="在此编写或粘贴自定义 CSS..."></textarea>
        <div id="nsc-ext-msg" style="font-size:11.5px;color:var(--nsc-muted);margin-top:6px;">提示：保存后将持久化至本地备忘录，点击「复制并前往配置」一键复制代码并引导跳转至设置页。</div>
      `;

      const titleInp = edBox.querySelector("#nsc-ext-title");
      const codeTa = edBox.querySelector("#nsc-ext-code");
      const msgEl = edBox.querySelector("#nsc-ext-msg");
      const guideSlot = edBox.querySelector("#nsc-ext-guide-slot");
      codeTa.value = cur.code || "";

      const renderGuide = () => {
        if (!showExtGuideBox) {
          guideSlot.innerHTML = "";
          return;
        }
        guideSlot.innerHTML = `
          <div class="nsc-ext-guide-box">
            <div style="font-weight:700;margin-bottom:4px;">CSS 代码已复制到剪贴板</div>
            <div>请点击下方确认按钮进入个人设置，在左侧选择「<strong>论坛扩展</strong>」，将代码粘贴到「<strong>自定义style</strong>」输入框后点击绿色「<strong>确定</strong>」即可生效（该入口受站点社区等级限制，未达等级时原版设置页不会显示该项）。</div>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <button type="button" class="nsc-send-btn" id="nsc-ext-go-setting">确认前往「论坛扩展」配置 ↗</button>
              <button type="button" class="nsc-mini-btn" id="nsc-ext-hide-guide">暂不跳转</button>
            </div>
          </div>
        `;
        guideSlot.querySelector("#nsc-ext-go-setting").addEventListener("click", () => {
          showExtGuideBox = false;
          const baseBd = document.getElementById("nsc-base-backdrop");
          if (baseBd) baseBd.classList.remove("is-open");
          state._settingAutoSection = "论坛扩展";
          if (typeof openUserHubModal === "function") openUserHubModal("setting");
        });
        guideSlot.querySelector("#nsc-ext-hide-guide").addEventListener("click", () => {
          showExtGuideBox = false;
          renderGuide();
        });
      };
      renderGuide();

      edBox.querySelector("#nsc-ext-save").addEventListener("click", () => {
        cur.title = titleInp.value.trim() || "未命名扩展";
        cur.code = codeTa.value;
        state.customStyleNotes = notes;
        saveJson(LS.CUSTOM_STYLE_NOTES, notes);
        msgEl.textContent = "已保存至扩展备忘录";
        msgEl.style.color = "var(--nsc-green)";
        renderBaseModalIfOpen();
      });

      edBox.querySelector("#nsc-ext-del").addEventListener("click", () => {
        const idx = notes.findIndex((n) => n.id === cur.id);
        if (idx >= 0) notes.splice(idx, 1);
        state.customStyleNotes = notes;
        selectedExtId = notes[0] ? notes[0].id : "";
        showExtGuideBox = false;
        saveJson(LS.CUSTOM_STYLE_NOTES, notes);
        renderBaseModalIfOpen();
      });

      edBox.querySelector("#nsc-ext-apply").addEventListener("click", async () => {
        cur.title = titleInp.value.trim() || cur.title;
        cur.code = codeTa.value;
        state.customStyleNotes = notes;
        saveJson(LS.CUSTOM_STYLE_NOTES, notes);
        const copied = await copyTextToClipboard(cur.code);
        if (copied) {
          showExtGuideBox = true;
          renderGuide();
          msgEl.textContent = "已复制代码，请确认下方引导前往设置";
          msgEl.style.color = "var(--nsc-accent)";
        } else {
          msgEl.textContent = "自动复制失败，请手动全选文本框内容复制";
          msgEl.style.color = "#ff3b30";
        }
      });

      body.appendChild(edBox);
    }

    const ENHANCER_META = {
      nsapp: { name: "协议卡片解析", desc: "将星辰打赏与投票链接转为工作台内交互卡片" },
      "floor-ref": { name: "楼层直达引用", desc: "将正文里的 #楼层 与 12# 转为可点击定位链接" },
      "magic-tabs": { name: "测评标签页", desc: "保留并激活测评帖的多标签页切换排版" },
      "ansi-blocks": { name: "终端彩色代码", desc: "解析 ANSI 终端转义序列并渲染彩色高亮块" },
      tables: { name: "表格容器优化", desc: "为 Markdown 表格增加圆角边框与横向滚动" },
      "code-blocks": { name: "代码块一键复制", desc: "在代码块右上角挂载快捷复制按钮" },
      videos: { name: "视频播放器适配", desc: "放大 B站与内嵌视频至 16:9 宽屏并随阅读区自适应" },
      images: { name: "宫格画廊与灯箱", desc: "连续多图自动排列宫格并支持原图缩放灯箱" },
    };

    const PLUGIN_NAME_MAP = {
      "plugins/core-hub-analytics.js": "鸡腿百页统计与星辰账本分析",
      "plugins/core-workbench-base.js": "工作台基座与独立悬浮设置",
      "themes/mac-default.js": "macOS 浅色 / 黄昏 / 暗黑默认主题包",
    };

    function renderSlotsSection(body) {
      const manifest = typeof NSC_DISCOVERED_MODULES !== "undefined" ? NSC_DISCOVERED_MODULES : { mode: "unknown", themes: [], plugins: [] };
      const reg = state.registry;
      const extEnv = typeof detectThirdPartyEnv === "function" ? detectThirdPartyEnv() : [];

      const modBox = document.createElement("div");
      modBox.className = "nsc-base-section";
      const allMods = [...(manifest.themes || []), ...(manifest.plugins || [])];
      modBox.innerHTML = `
        <div class="nsc-base-title">
          <span>已挂载主题与扩展模块</span>
          <span class="nsc-badge-read">${escHtml(manifest.mode === "local" ? "本地构建" : "正式构建")} · ${allMods.length} 个模块</span>
        </div>
        <div class="nsc-base-sub">二开或自研文件放入 src/themes/custom-*.js 或 src/plugins/custom-*.js 后打包即可自动识别挂载，升级主线时不冲突。</div>
        <div class="nsc-base-order-list">
          ${allMods.map((f) => {
            const label = PLUGIN_NAME_MAP[f] || (f.includes("custom-") ? "自定义扩展模块" : f);
            const isTheme = f.startsWith("themes/");
            return `
              <div class="nsc-compat-row">
                <div class="nsc-compat-left">
                  <div class="nsc-compat-title">
                    <span>${escHtml(label)}</span>
                    <span class="nsc-compat-tag">${isTheme ? "主题" : "插件"}</span>
                  </div>
                  <div class="nsc-compat-desc">${escHtml(f)}</div>
                </div>
                ${isTheme
                  ? `<button type="button" class="nsc-mini-btn nsc-mod-go-theme">切换主题</button>`
                  : `<span class="nsc-compat-status">已启用</span>`}
              </div>
            `;
          }).join("")}
        </div>
      `;
      modBox.querySelectorAll(".nsc-mod-go-theme").forEach((b) => {
        b.addEventListener("click", () => {
          state.workbenchSection = "theme";
          renderBaseModalIfOpen();
        });
      });
      body.appendChild(modBox);

      const enhBox = document.createElement("div");
      enhBox.className = "nsc-base-section";
      const enhancers = reg.bubbleEnhancers || [];
      enhBox.innerHTML = `
        <div class="nsc-base-title">
          <span>正文增强流水线（按需独立开关）</span>
          <span class="nsc-badge-read">共 ${enhancers.length} 项能力</span>
        </div>
        <div class="nsc-base-sub">每一项正文处理能力按顺序依次执行；关闭暂不需要的模块可进一步降低渲染开销，新打开帖子立即生效。</div>
        <div class="nsc-base-order-list" id="nsc-enh-switch-list"></div>
      `;
      const enhListEl = enhBox.querySelector("#nsc-enh-switch-list");
      for (const enh of enhancers) {
        const meta = ENHANCER_META[enh.id] || { name: enh.id, desc: `自定义增强插件（执行权重 ${enh.priority}）` };
        const on = typeof isBubbleEnhancerEnabled === "function" ? isBubbleEnhancerEnabled(enh.id) : true;
        const row = document.createElement("div");
        row.className = "nsc-compat-row";
        row.innerHTML = `
          <div class="nsc-compat-left">
            <div class="nsc-compat-title">
              <span>${escHtml(meta.name)}</span>
              <span class="nsc-compat-tag">#${enh.priority}</span>
            </div>
            <div class="nsc-compat-desc">${escHtml(meta.desc)}</div>
          </div>
          <button type="button" class="nsc-switch ${on ? "is-on" : ""}" aria-pressed="${on ? "true" : "false"}" title="${on ? "点击停用此项增强" : "点击启用此项增强"}"><span class="nsc-switch-knob"></span></button>
        `;
        row.querySelector(".nsc-switch").addEventListener("click", () => {
          if (typeof setBubbleEnhancerEnabled === "function") {
            setBubbleEnhancerEnabled(enh.id, !on);
          }
          renderBaseModalIfOpen();
        });
        enhListEl.appendChild(row);
      }
      body.appendChild(enhBox);

      const compatBox = document.createElement("div");
      compatBox.className = "nsc-base-section";
      compatBox.innerHTML = `
        <div class="nsc-base-title">
          <span>共存脚本与浏览器扩展兼容状态</span>
          <span class="nsc-badge-read">${extEnv.length > 0 ? `已识别 ${extEnv.length} 项` : "纯净环境"}</span>
        </div>
        <div class="nsc-base-sub">仅在打开此面板时按需检测当前页面上的其他扩展与样式特征，自动隔离干扰节点，不在后台轮询占用资源。</div>
        <div class="nsc-base-order-list">
          ${extEnv.length === 0
            ? `<div class="nsc-compat-row"><div class="nsc-compat-left"><div class="nsc-compat-title">运行环境纯净</div><div class="nsc-compat-desc">当前页面未检测到可能互相干扰的第三方脚本或浏览器扩展浮层。</div></div><span class="nsc-compat-status">正常</span></div>`
            : extEnv.map((it) => `
              <div class="nsc-compat-row" title="${escHtml(it.techHint || "")}">
                <div class="nsc-compat-left">
                  <div class="nsc-compat-title">
                    <span>${escHtml(it.name)}</span>
                    <span class="nsc-compat-tag">${escHtml(it.kind)}</span>
                  </div>
                  <div class="nsc-compat-desc">${escHtml(it.detail)}</div>
                </div>
                <span class="nsc-compat-status">${escHtml(it.status || "已兼容")}</span>
              </div>
            `).join("")}
        </div>
      `;
      body.appendChild(compatBox);
    }

    function renderBaseModal() {
      const bd = document.getElementById("nsc-base-backdrop");
      if (!bd) return;
      const modal = bd.querySelector(".nsc-base-modal");
      if (!modal) return;
      const curSecId = state.workbenchSection || "theme";
      const curSec = SECTIONS.find((s) => s.id === curSecId) || SECTIONS[0];

      if (!modal.dataset.nscBaseInit) {
        modal.dataset.nscBaseInit = "1";
        modal.innerHTML = `
          <aside class="nsc-base-sidebar">
            <div class="nsc-base-side-head">
              <div class="nsc-mac-dots" aria-hidden="true">
                <span class="nsc-mac-dot red"></span>
                <span class="nsc-mac-dot yellow"></span>
                <span class="nsc-mac-dot green"></span>
              </div>
              <span class="nsc-base-side-title">工作台基座</span>
            </div>
            <div class="nsc-base-nav-list" id="nsc-base-nav-list"></div>
            <div class="nsc-base-side-foot">
              <div style="display:flex;align-items:center;gap:6px;">
                <button type="button" class="nsc-switch ${state.baseOrbVisible ? "is-on" : ""}" id="nsc-base-orb-sw" title="显示/隐藏桌面可拖动悬浮球"><span class="nsc-switch-knob"></span></button>
                <span>悬浮球</span>
              </div>
              <span>v${escHtml((state.updateInfo && state.updateInfo.current) || "")}</span>
            </div>
          </aside>
          <section class="nsc-base-main">
            <div class="nsc-base-topbar">
              <div style="min-width:0;">
                <div id="nsc-base-sec-title" style="font-size:14px;font-weight:700;color:var(--nsc-text);"></div>
                <div id="nsc-base-sec-desc" style="font-size:11.5px;color:var(--nsc-muted);margin-top:2px;"></div>
              </div>
              <button type="button" class="nsc-mini-btn" id="nsc-base-close" style="padding:3px 9px;">✕</button>
            </div>
            <div class="nsc-base-scroll" id="nsc-base-scroll"></div>
          </section>
        `;
        modal.querySelector("#nsc-base-close").addEventListener("click", () => bd.classList.remove("is-open"));
        const orbSw = modal.querySelector("#nsc-base-orb-sw");
        orbSw.addEventListener("click", () => {
          state.baseOrbVisible = !state.baseOrbVisible;
          localStorage.setItem(LS.BASE_ORB_VISIBLE, state.baseOrbVisible ? "1" : "0");
          orbSw.classList.toggle("is-on", state.baseOrbVisible);
          syncBaseOrbVisibility();
        });
      }

      const navList = modal.querySelector("#nsc-base-nav-list");
      if (navList) {
        navList.innerHTML = "";
        for (const s of SECTIONS) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "nsc-base-nav-item" + (s.id === curSec.id ? " is-active" : "");
          btn.innerHTML = `${s.icon()}<span>${escHtml(s.label)}</span>`;
          btn.addEventListener("click", () => {
            state.workbenchSection = s.id;
            renderBaseModal();
          });
          navList.appendChild(btn);
        }
      }

      const titleEl = modal.querySelector("#nsc-base-sec-title");
      const descEl = modal.querySelector("#nsc-base-sec-desc");
      if (titleEl) titleEl.textContent = curSec.label;
      if (descEl) descEl.textContent = curSec.desc;

      const orbSw = modal.querySelector("#nsc-base-orb-sw");
      if (orbSw) orbSw.classList.toggle("is-on", Boolean(state.baseOrbVisible));

      const body = modal.querySelector("#nsc-base-scroll");
      if (body) {
        const prevTop = body.dataset.lastSec === curSec.id ? body.scrollTop : 0;
        body.dataset.lastSec = curSec.id;
        body.innerHTML = "";
        if (curSec.id === "theme") renderThemeSection(body);
        else if (curSec.id === "skin") renderSkinSection(body);
        else if (curSec.id === "layout") renderLayoutSection(body);
        else if (curSec.id === "chat") renderChatAndComposerSection(body);
        else if (curSec.id === "ext") renderExtSection(body);
        else renderSlotsSection(body);
        if (prevTop > 0) body.scrollTop = prevTop;
      }
    }

    function renderBaseModalIfOpen() {
      const bd = document.getElementById("nsc-base-backdrop");
      if (bd && bd.classList.contains("is-open")) renderBaseModal();
    }

    function openWorkbenchBaseModal(sectionId = "") {
      if (sectionId) state.workbenchSection = sectionId;
      let bd = document.getElementById("nsc-base-backdrop");
      if (!bd) {
        bd = document.createElement("div");
        bd.id = "nsc-base-backdrop";
        bd.innerHTML = `<div class="nsc-base-modal" role="dialog" aria-label="工作台基座设置"></div>`;
        bd.addEventListener("click", (e) => {
          if (e.target === bd) bd.classList.remove("is-open");
        });
        document.body.appendChild(bd);
      }
      bd.classList.add("is-open");
      renderBaseModal();
    }
    state._openWorkbenchBase = openWorkbenchBaseModal;

    function syncBaseOrbVisibility() {
      const orb = document.getElementById("nsc-base-orb");
      if (orb) orb.classList.toggle("is-visible", Boolean(state.baseOrbVisible));
    }

    function mountBaseFloatingOrb() {
      if (document.getElementById("nsc-base-orb")) return;
      if (!document.body) {
        document.addEventListener("DOMContentLoaded", mountBaseFloatingOrb, { once: true });
        return;
      }
      const orb = document.createElement("button");
      orb.id = "nsc-base-orb";
      orb.type = "button";
      orb.title = "工作台基座设置（按住可拖动位置）";
      orb.innerHTML = ICONS.sliders;
      const saved = state.baseOrbPos || { right: 20, bottom: 136 };
      const rVal = Math.max(10, Math.min((window.innerWidth || 1200) - 52, Number(saved.right) || 20));
      const bVal = Math.max(10, Math.min((window.innerHeight || 800) - 52, Number(saved.bottom) || 136));
      orb.style.right = `${rVal}px`;
      orb.style.bottom = `${bVal}px`;
      orb.classList.toggle("is-visible", Boolean(state.baseOrbVisible));

      let dragging = false;
      let hasMoved = false;
      let startX = 0;
      let startY = 0;
      let initRight = rVal;
      let initBottom = bVal;

      orb.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        dragging = true;
        hasMoved = false;
        startX = e.clientX;
        startY = e.clientY;
        const rect = orb.getBoundingClientRect();
        initRight = window.innerWidth - rect.right;
        initBottom = window.innerHeight - rect.bottom;
        try { orb.setPointerCapture(e.pointerId); } catch (_) {}

        const onMove = (ev) => {
          if (!dragging) return;
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          if (Math.hypot(dx, dy) > 5) hasMoved = true;
          const nr = Math.max(10, Math.min(window.innerWidth - 50, initRight - dx));
          const nb = Math.max(10, Math.min(window.innerHeight - 50, initBottom - dy));
          orb.style.right = `${nr}px`;
          orb.style.bottom = `${nb}px`;
        };
        const onUp = () => {
          if (!dragging) return;
          dragging = false;
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
          if (hasMoved) {
            const rect = orb.getBoundingClientRect();
            const pos = {
              right: Math.round(window.innerWidth - rect.right),
              bottom: Math.round(window.innerHeight - rect.bottom),
            };
            state.baseOrbPos = pos;
            saveJson(LS.BASE_ORB_POS, pos);
          }
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
      });

      orb.addEventListener("click", () => {
        if (hasMoved) return;
        openWorkbenchBaseModal();
      });

      document.body.appendChild(orb);
    }

    mountBaseFloatingOrb();
  })();
