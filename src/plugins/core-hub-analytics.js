  // 个人中心统计分析插件：鸡腿 100 页统计 / 全量星辰账本分析器
  (function initHubAnalyticsPlugin() {
    const CREDIT_MAX_PAGES = 100;
    const STARDUST_PAGE_SIZE = 50;
    const STARDUST_BATCH_CONCURRENCY = 5;

    // =========================================================================
    // 1. 鸡腿 100 页账簿统计
    // =========================================================================
    function extractCreditRows(json) {
      if (!json || json.success === false) return [];
      if (Array.isArray(json.data)) return json.data;
      if (json.data && Array.isArray(json.data.list)) return json.data.list;
      if (json.data && Array.isArray(json.data.records)) return json.data.records;
      if (Array.isArray(json.list)) return json.list;
      if (Array.isArray(json.records)) return json.records;
      return [];
    }

    function aggregateCreditStats(items) {
      const stats = {
        totalGain: 0,
        totalSpend: 0,
        net: 0,
        replyReward: 0,
        replyCount: 0,
        postReward: 0,
        postCount: 0,
        signReward: 0,
        signDays: 0,
        avgSign: "0",
        signAmounts: {},
        feedReceived: 0,
        feedSent: 0,
        otherGain: 0,
        feeders: {},
      };

      for (const item of items || []) {
        const val = Number(
          Array.isArray(item)
            ? item[0]
            : (item && (item.amount ?? item.change ?? item.delta))
        );
        const reason = String(
          Array.isArray(item)
            ? (item[2] ?? "")
            : ((item && (item.reason ?? item.description ?? item.note)) ?? "")
        ).trim();

        if (Number.isNaN(val)) continue;

        if (val > 0) {
          stats.totalGain += val;
          if (reason.includes("回帖")) {
            stats.replyReward += val;
            stats.replyCount += 1;
          } else if (reason.includes("发帖")) {
            stats.postReward += val;
            stats.postCount += 1;
          } else if (reason.includes("签到")) {
            stats.signReward += val;
            stats.signDays += 1;
            stats.signAmounts[val] = (stats.signAmounts[val] || 0) + 1;
          } else if (reason.includes("投喂")) {
            stats.feedReceived += val;
            const m = reason.match(/^被(.+?)投喂鸡腿$/);
            const sender = m ? m[1] : reason;
            stats.feeders[sender] = (stats.feeders[sender] || 0) + val;
          } else {
            stats.otherGain += val;
          }
        } else {
          stats.totalSpend += Math.abs(val);
          if (reason.includes("投喂")) {
            stats.feedSent += Math.abs(val);
          }
        }
      }

      stats.net = stats.totalGain - stats.totalSpend;
      stats.avgSign = stats.signDays > 0 ? (stats.signReward / stats.signDays).toFixed(2) : "0";
      return stats;
    }

    function findCachedUidByName(name) {
      if (!name || !state.userCache) return "";
      for (const [uid, info] of Object.entries(state.userCache)) {
        if (info && info.name === name) return String(uid);
      }
      return "";
    }

    const creditEngine = createFeedEngine({
      key: "hub-credit-100p",
      mutexGroup: "nodeseek-heavy-scan",
      delayMs: 150,
      async fetchPage({ page, signal }) {
        const resp = await fetch(`/api/account/credit/page-${page}`, {
          credentials: "include",
          signal,
        });
        if (!resp.ok) return { rows: [], hasMore: false };
        const json = await resp.json().catch(() => null);
        if (!json || json.success === false) return { rows: [], hasMore: false };
        const rows = extractCreditRows(json);
        if (!rows || rows.length === 0) return { rows: [], hasMore: false };
        return { rows, hasMore: rows.length >= 15 };
      },
      onUpdate() {
        if (state.hubTab === "credit" && state.hubCreditView === "analytics") {
          renderUserHubIfOpen();
        }
      },
    });

    function renderCreditAnalytics(body, subbar) {
      const snap = creditEngine.getState();
      const items = snap.items || [];
      const donePages = snap.progress ? snap.progress.done : snap.page;
      const totalPages = (snap.progress && snap.progress.total) || CREDIT_MAX_PAGES;
      const pct = totalPages > 0 ? Math.min(100, Math.round((donePages / totalPages) * 100)) : 0;

      const banner = document.createElement("div");
      banner.className = "nsc-ana-banner";

      const leftInfo = document.createElement("div");
      leftInfo.style.cssText = "flex:1;min-width:220px;";
      const statusTitle = snap.running
        ? `正在拉取第 ${donePages} / ${totalPages} 页...（已获取 ${items.length} 条明细）`
        : items.length > 0
          ? `已汇总 ${snap.page} 页 · 共 ${items.length} 条明细`
          : "点击右侧按钮拉取最多 100 页鸡腿账簿明细并生成统计报告";
      leftInfo.innerHTML = `
        <div style="font-size:13px;font-weight:700;color:var(--nsc-text);">${escHtml(statusTitle)}</div>
        ${snap.error ? `<div style="font-size:11.5px;color:#ff3b30;margin-top:4px;">${escHtml(snap.error)}</div>` : ""}
        ${snap.running ? `
          <div class="nsc-ana-progress-track">
            <div class="nsc-ana-progress-fill" style="width:${pct}%;"></div>
          </div>
        ` : ""}
      `;

      const actions = document.createElement("div");
      actions.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap;";
      if (snap.running) {
        const stopBtn = document.createElement("button");
        stopBtn.type = "button";
        stopBtn.className = "nsc-checkin-btn";
        stopBtn.style.color = "#ff3b30";
        stopBtn.textContent = "停止";
        stopBtn.addEventListener("click", () => creditEngine.abort());
        actions.appendChild(stopBtn);
      } else {
        const startBtn = document.createElement("button");
        startBtn.type = "button";
        startBtn.className = "nsc-checkin-btn primary";
        startBtn.textContent = items.length > 0 ? "重新统计" : "开始 100 页统计";
        startBtn.addEventListener("click", () => {
          creditEngine.runBatch({ maxPages: CREDIT_MAX_PAGES, delayMs: 150 });
        });
        actions.appendChild(startBtn);
      }

      banner.appendChild(leftInfo);
      banner.appendChild(actions);
      body.appendChild(banner);

      if (items.length === 0) {
        if (!snap.running) {
          const empty = document.createElement("div");
          empty.className = "nsc-empty-state";
          empty.textContent = "尚未拉取统计数据，点击「开始 100 页统计」即可在后台快速汇总。";
          body.appendChild(empty);
        }
        return;
      }

      const stats = aggregateCreditStats(items);
      const netColor = stats.net >= 0 ? "#16a34a" : "#ff3b30";
      const netText = stats.net >= 0 ? `+${stats.net}` : String(stats.net);

      const kpi = document.createElement("div");
      kpi.className = "nsc-hub-kpi-grid";
      kpi.innerHTML = `
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">总计获得鸡腿</div>
          <div class="nsc-hub-kpi-val" style="color:#16a34a;">+${stats.totalGain}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">总计消耗鸡腿</div>
          <div class="nsc-hub-kpi-val" style="color:#ff3b30;">-${stats.totalSpend}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">净增鸡腿</div>
          <div class="nsc-hub-kpi-val" style="color:${netColor};">${escHtml(netText)}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">回帖奖励 (${stats.replyCount}次)</div>
          <div class="nsc-hub-kpi-val">+${stats.replyReward}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">发帖奖励 (${stats.postCount}次)</div>
          <div class="nsc-hub-kpi-val">+${stats.postReward}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">签到累计 (${stats.signDays}天 · 均${escHtml(stats.avgSign)})</div>
          <div class="nsc-hub-kpi-val">+${stats.signReward}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">被投喂总计</div>
          <div class="nsc-hub-kpi-val" style="color:#16a34a;">+${stats.feedReceived}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">投喂支出总计</div>
          <div class="nsc-hub-kpi-val" style="color:#ff3b30;">-${stats.feedSent}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">其他收入</div>
          <div class="nsc-hub-kpi-val">+${stats.otherGain}</div>
        </div>
      `;
      body.appendChild(kpi);

      const split = document.createElement("div");
      split.className = "nsc-ana-split";

      // 左卡片：签到手气分布
      const signCard = document.createElement("div");
      signCard.className = "nsc-ana-card";
      const signEntries = Object.entries(stats.signAmounts).sort((a, b) => Number(b[0]) - Number(a[0]));
      const maxSignTimes = signEntries.reduce((mx, [, t]) => Math.max(mx, t), 1);

      let signBodyHtml = "";
      if (signEntries.length === 0) {
        signBodyHtml = `<div style="font-size:12px;color:var(--nsc-muted);padding:12px 0;">暂无签到记录</div>`;
      } else {
        signBodyHtml = signEntries.map(([legs, times]) => {
          const sharePct = stats.signDays > 0 ? ((times / stats.signDays) * 100).toFixed(1) : "0.0";
          const barPct = Math.max(4, Math.round((times / maxSignTimes) * 100));
          return `
            <div class="nsc-ana-bar-row">
              <div class="nsc-ana-bar-top">
                <span style="font-weight:600;color:var(--nsc-text);">+${escHtml(legs)} 鸡腿</span>
                <span style="color:var(--nsc-muted);font-variant-numeric:tabular-nums;">${times} 天 (${sharePct}%)</span>
              </div>
              <div class="nsc-ana-bar-track">
                <div class="nsc-ana-bar-fill" style="width:${barPct}%;"></div>
              </div>
            </div>
          `;
        }).join("");
      }

      signCard.innerHTML = `
        <div class="nsc-ana-card-title">
          <span>🎲 签到手气分布</span>
          <span style="font-size:11.5px;font-weight:500;color:var(--nsc-muted);">共 ${stats.signDays} 天 · 均 ${escHtml(stats.avgSign)}/天</span>
        </div>
        <div>${signBodyHtml}</div>
      `;

      // 右卡片：投喂大佬排行榜
      const feederCard = document.createElement("div");
      feederCard.className = "nsc-ana-card";
      const sortedFeeders = Object.entries(stats.feeders).sort((a, b) => b[1] - a[1]);
      const topFeeders = sortedFeeders.slice(0, 20);

      feederCard.innerHTML = `
        <div class="nsc-ana-card-title">
          <span>🏆 投喂大佬排行榜</span>
          <span style="font-size:11.5px;font-weight:500;color:var(--nsc-muted);">共 ${sortedFeeders.length} 位${sortedFeeders.length > 20 ? " (Top 20)" : ""}</span>
        </div>
        <div class="nsc-ana-feeder-list"></div>
      `;

      const feederListEl = feederCard.querySelector(".nsc-ana-feeder-list");
      if (topFeeders.length === 0) {
        feederListEl.innerHTML = `<div style="font-size:12px;color:var(--nsc-muted);padding:12px 0;">暂无投喂收入记录</div>`;
      } else {
        topFeeders.forEach(([user, count], idx) => {
          const rank = idx + 1;
          const rankLabel = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
          const row = document.createElement("div");
          row.className = "nsc-hub-row";
          row.style.marginBottom = "0";
          row.style.padding = "7px 10px";
          row.title = "点击查看资料或复制用户名";
          row.innerHTML = `
            <span style="width:28px;text-align:center;font-weight:700;font-size:12px;flex:0 0 28px;">${rankLabel}</span>
            <div class="nsc-hub-row-main">
              <div class="nsc-hub-row-title">${escHtml(user)}</div>
            </div>
            <span class="nsc-hub-delta pos" data-feeder-amt>+${count} 🍗</span>
          `;
          row.addEventListener("click", async () => {
            const cachedUid = findCachedUidByName(user);
            if (cachedUid && typeof openUserProfileModal === "function") {
              openUserProfileModal({ uid: cachedUid, name: user });
              return;
            }
            const ok = await copyTextToClipboard(user);
            if (ok) {
              const badge = row.querySelector("[data-feeder-amt]");
              if (badge) {
                const orig = badge.textContent;
                badge.textContent = "已复制用户名";
                setTimeout(() => {
                  badge.textContent = orig;
                }, 1400);
              }
            }
          });
          feederListEl.appendChild(row);
        });
      }

      split.appendChild(signCard);
      split.appendChild(feederCard);
      body.appendChild(split);

      requestAnimationFrame(() => {
        const h = signCard.clientHeight;
        if (h > 180) {
          feederListEl.style.maxHeight = `${Math.max(240, h - 54)}px`;
        }
      });
    }

    registerHubSubView("credit", {
      render(body, subbar) {
        renderCreditAnalytics(body, subbar);
      },
    });

    // =========================================================================
    // 2. 全量星辰账本分析器（收到/送出点赞 + 转账收支 + 全列排序 + 瀑布流 + 排行榜）
    // =========================================================================
    const stardustUi = {
      filter: "all",
      search: "",
      sortKey: "time",
      sortDir: "desc",
      visibleCount: STARDUST_PAGE_SIZE,
      rankCat: "upvote_in",
      showRank: true,
      resolveSeq: 0,
      failedUids: new Set(),
      myUid: null,
      lastTableHost: null,
      lastRecords: [],
    };

    function formatExactTime(val) {
      if (!val) return "-";
      const d = typeof val === "number"
        ? new Date(val > 1e11 ? val : val * 1000)
        : new Date(val);
      if (Number.isNaN(d.getTime())) return String(val);

      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    function extractAmount(r) {
      const priorityKeys = [
        "diff", "amount", "stardust", "stardusts", "count", "delta", "value", "points",
        "num", "quantity", "change", "trade_stardust", "credit", "score", "gain",
      ];
      for (const k of priorityKeys) {
        if (r[k] !== undefined && r[k] !== null && r[k] !== "") {
          const num = parseFloat(String(r[k]).replace(/[^\d.-]/g, ""));
          if (!Number.isNaN(num) && num !== 0) return num;
        }
      }

      const ignoreKeys = new Set([
        "id", "_id", "member_id", "peer_id", "ref_id", "post_id", "comment_id",
        "created_at", "updated_at", "timestamp", "time", "status", "code",
        "floor", "balance", "remain", "type", "_querySide",
      ]);
      for (const [k, v] of Object.entries(r)) {
        if (!ignoreKeys.has(k)) {
          if (typeof v === "number" && v !== 0) return v;
          if (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim())) {
            const parsed = parseFloat(v.trim());
            if (!Number.isNaN(parsed) && parsed !== 0) return parsed;
          }
        }
      }
      return 0;
    }

    function extractBalance(r) {
      const keys = [
        "balance", "current_balance", "remain", "remain_stardust", "after_balance",
        "user_balance", "stardust_balance", "current_stardust", "after", "current",
        "user_stardust", "total", "cur_balance", "post_balance", "remained", "available",
        "total_stardust",
      ];
      for (const k of keys) {
        if (r[k] !== undefined && r[k] !== null && r[k] !== "") {
          const num = parseFloat(String(r[k]).replace(/[^\d.-]/g, ""));
          if (!Number.isNaN(num) && num >= 0) return num;
        }
      }
      return null;
    }

    function stardustRecordKey(r) {
      const side = r._querySide || "recv";
      const rawCreatedAt = typeof r.created_at === "number"
        ? (r.created_at > 1e11 ? r.created_at : r.created_at * 1000)
        : new Date(r.created_at).getTime();
      const base = r.id || `${rawCreatedAt || 0}_${r.peer_id || ""}_${r.member_id || ""}`;
      return `${side}:${base}`;
    }

    function normalizeStardustRecords(rawRows, selfUid) {
      const uidNum = Number(selfUid) || 0;
      const list = [];
      for (const r of rawRows || []) {
        const rawCreatedAt = typeof r.created_at === "number"
          ? (r.created_at > 1e11 ? r.created_at : r.created_at * 1000)
          : new Date(r.created_at).getTime();
        const mId = r.member_id ? parseInt(r.member_id, 10) : 0;
        const pId = r.peer_id ? parseInt(r.peer_id, 10) : 0;
        const rawType = String(r.type || "").toLowerCase();
        const refId = parseInt(r.ref_id || r.refId || 0, 10);
        const extractedNum = extractAmount(r);
        const isUpvote = (refId === 10) || rawType.includes("upvote") || rawType.includes("like") || Boolean(r.comment_id);

        if (r._querySide === "sent") {
          // peer_id=uid 查询仅提取「送出点赞」，转账支出已由 member_id=uid 完整覆盖以防重复计账
          if (!isUpvote) continue;
          const targetUid = mId && mId !== uidNum ? mId : (pId && pId !== uidNum ? pId : 0);
          list.push({
            id: stardustRecordKey(r),
            rawCreatedAt: rawCreatedAt || 0,
            amount: Math.abs(extractedNum || 1),
            targetUid: targetUid ? String(targetUid) : "",
            memo: r.memo || r.reason || r.description || r.note || "",
            balance: null,
            category: "upvote_out",
            postId: r.post_id ? String(r.post_id) : "",
            refId: refId > 0 ? String(refId) : "",
            time: formatExactTime(r.created_at),
          });
          continue;
        }

        let category = "transfer_out";
        let finalAmount = 0;

        if (isUpvote) {
          category = "upvote_in";
          finalAmount = extractedNum > 0 ? extractedNum : 1;
        } else {
          if (extractedNum > 0 || rawType.includes("in") || rawType.includes("receive") || (uidNum > 0 && mId !== uidNum && mId > 0)) {
            category = "transfer_in";
            finalAmount = Math.abs(extractedNum || 1);
          } else if (extractedNum < 0 || rawType.includes("out") || rawType.includes("send") || rawType.includes("pay")) {
            category = "transfer_out";
            finalAmount = -Math.abs(extractedNum || 1);
          } else {
            category = (mId === uidNum && pId) ? "transfer_out" : "transfer_in";
            finalAmount = category === "transfer_out" ? -1 : 1;
          }
        }

        const targetUid = (pId && pId !== uidNum)
          ? pId
          : ((mId && mId !== uidNum) ? mId : (pId || mId || null));

        list.push({
          id: stardustRecordKey(r),
          rawCreatedAt: rawCreatedAt || 0,
          amount: finalAmount,
          targetUid: targetUid ? String(targetUid) : "",
          memo: r.memo || r.reason || r.description || r.note || "",
          balance: extractBalance(r),
          category,
          postId: r.post_id ? String(r.post_id) : "",
          refId: refId > 0 ? String(refId) : "",
          time: formatExactTime(r.created_at),
        });
      }

      list.sort((a, b) => b.rawCreatedAt - a.rawCreatedAt);
      return list;
    }

    function getResolvedStardustUserName(uid) {
      const key = String(uid || "");
      if (!key) return "";
      const cached = state.userCache && state.userCache[key];
      if (cached && cached.name && cached.name !== "Seeker") {
        return cached.name;
      }
      return "";
    }

    function getDisplayUserHandle(uid) {
      const name = getResolvedStardustUserName(uid);
      return name ? `@${name}` : `@UID:${uid}`;
    }

    function getBalanceFallback() {
      const uid = stardustUi.myUid || state.currentUserId;
      if (uid && state.userCache && state.userCache[String(uid)]) {
        const parsed = Number(state.userCache[String(uid)].stars);
        if (!Number.isNaN(parsed) && parsed > 0) return parsed;
      }
      try {
        const card = document.querySelector("#nsk-right-panel-container .user-card, .nsc-right-user .user-card");
        const text = card ? card.innerText : "";
        const m = text.match(/星辰\s*[:：]?\s*([0-9]+)/);
        if (m && m[1]) {
          const num = parseInt(m[1], 10);
          if (!Number.isNaN(num) && num > 0) return num;
        }
      } catch (_) {}
      return 0;
    }

    function computeStardustSummary(records) {
      let totalIncome = 0;
      let totalExpense = 0;
      let upvoteInCount = 0;
      let upvoteInStardust = 0;
      let upvoteOutCount = 0;
      let transferOutCount = 0;
      let transferOutStardust = 0;
      let transferInCount = 0;
      let transferInStardust = 0;

      for (const item of records) {
        if (item.category === "upvote_in") {
          upvoteInCount += 1;
          upvoteInStardust += item.amount;
          totalIncome += item.amount;
        } else if (item.category === "upvote_out") {
          upvoteOutCount += 1;
        } else if (item.category === "transfer_in") {
          transferInCount += 1;
          transferInStardust += item.amount;
          totalIncome += item.amount;
        } else if (item.category === "transfer_out") {
          const absVal = Math.abs(item.amount);
          transferOutCount += 1;
          transferOutStardust += absVal;
          totalExpense += absVal;
        }
      }

      const netCalculated = totalIncome - totalExpense;
      const displayBal = netCalculated > 0 ? netCalculated : (getBalanceFallback() || netCalculated);

      return {
        displayBal,
        totalIncome,
        totalExpense,
        upvoteInCount,
        upvoteInStardust,
        upvoteOutCount,
        transferOutCount,
        transferOutStardust,
        transferInCount,
        transferInStardust,
      };
    }

    async function ensureStardustUid(signal) {
      detectCurrentUser();
      if (state.currentUserId) {
        stardustUi.myUid = Number(state.currentUserId);
        return stardustUi.myUid;
      }
      if (stardustUi.myUid) return stardustUi.myUid;

      const resp = await fetch("/api/account/getInfo", { credentials: "include", signal });
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        if (data && data.success && data.detail) {
          const parsed = parseInt(data.detail.member_id || data.detail.id || data.detail.uid, 10);
          if (parsed) {
            stardustUi.myUid = parsed;
            state.currentUserId = parsed;
            if (data.detail.member_name) state.currentUser = data.detail.member_name;
            return parsed;
          }
        }
      }
      throw new Error("未能识别当前登录 UID，请先登录或刷新页面");
    }

    const stardustEngine = createFeedEngine({
      key: "hub-stardust-full",
      mutexGroup: "nodeseek-heavy-scan",
      delayMs: 300,
      keyOf: stardustRecordKey,
      async fetchPage({ cursor, signal }) {
        const uid = await ensureStardustUid(signal);
        let side = "recv";
        let beforeId = "";
        if (typeof cursor === "string" && cursor.includes(":")) {
          const parts = cursor.split(":");
          side = parts[0] === "sent" ? "sent" : "recv";
          beforeId = parts[1] || "";
        }

        const paramKey = side === "sent" ? "peer_id" : "member_id";
        let url = `/api/stardust/list?count=1000&${paramKey}=${encodeURIComponent(String(uid))}`;
        if (beforeId) url += `&before_id=${encodeURIComponent(beforeId)}`;

        const resp = await fetch(url, { credentials: "include", signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json().catch(() => null);
        const rows = (data && data.success !== false && Array.isArray(data.records))
          ? data.records.map((r) => ({ ...r, _querySide: side }))
          : [];

        if (side === "recv") {
          if (data && data.exist_more && data.cursor && rows.length > 0) {
            return { rows, nextCursor: `recv:${data.cursor}`, hasMore: true };
          }
          // 第一阶段（收到/账户主流水）结束后无缝切换第二阶段（peer_id 送出点赞）
          return { rows, nextCursor: "sent:", hasMore: true };
        }

        if (data && data.exist_more && data.cursor && rows.length > 0) {
          return { rows, nextCursor: `sent:${data.cursor}`, hasMore: true };
        }
        return { rows, nextCursor: null, hasMore: false };
      },
      onUpdate() {
        if (state.hubTab === "stardust" && state.hubStardustView === "analytics") {
          renderUserHubIfOpen();
        }
      },
    });

    async function resolveVisibleStardustUids(uids) {
      const seq = ++stardustUi.resolveSeq;
      const missing = Array.from(new Set(uids.filter((id) => (
        id && !getResolvedStardustUserName(id) && !stardustUi.failedUids.has(String(id))
      ))));
      if (missing.length === 0) return;

      for (const uid of missing) {
        if (seq !== stardustUi.resolveSeq) return;
        if (state.hubTab !== "stardust" || state.hubStardustView !== "analytics") return;
        const bd = document.getElementById("nsc-hub-backdrop");
        if (!bd || !bd.classList.contains("is-open")) return;

        await fetchUserProfile(String(uid), "");
        if (seq !== stardustUi.resolveSeq) return;
        if (state.hubTab !== "stardust" || state.hubStardustView !== "analytics") return;

        const name = getResolvedStardustUserName(uid);
        if (!name) {
          stardustUi.failedUids.add(String(uid));
        } else {
          document.querySelectorAll(`[data-nsc-sd-uid="${CSS.escape(String(uid))}"]`).forEach((el) => {
            el.textContent = `@${name}`;
          });
        }
        await new Promise((r) => setTimeout(r, 80));
      }
    }

    function buildStardustRankList(records, category) {
      const map = new Map();
      for (const item of records) {
        if (item.category !== category || !item.targetUid) continue;
        const cur = map.get(item.targetUid) || {
          uid: item.targetUid,
          count: 0,
          totalAmount: 0,
          latestTs: 0,
        };
        cur.count += 1;
        cur.totalAmount += Math.abs(item.amount);
        if (item.rawCreatedAt > cur.latestTs) cur.latestTs = item.rawCreatedAt;
        map.set(item.targetUid, cur);
      }
      return Array.from(map.values()).sort(
        (a, b) => b.totalAmount - a.totalAmount || b.count - a.count || b.latestTs - a.latestTs
      );
    }

    function buildMarkdownTopRankTable(rankList, category, limit = 20) {
      if (!rankList || rankList.length === 0) return "*(暂无排行记录)*\n\n";
      const totalAmt = rankList.reduce((s, u) => s + u.totalAmount, 0);
      const isTransfer = category === "transfer_in" || category === "transfer_out";
      const actionHdr = isTransfer ? "转账笔数" : "点赞次数";
      const top = rankList.slice(0, limit);

      let md = `| 排名 | 用户 | UID | ${actionHdr} | 累计星辰 | 占比 |\n`;
      md += "| :--- | :--- | :--- | :--- | :--- | :--- |\n";
      top.forEach((u, idx) => {
        const rank = idx + 1;
        const rankLabel = rank === 1 ? "🥇 1" : rank === 2 ? "🥈 2" : rank === 3 ? "🥉 3" : String(rank);
        const handle = getDisplayUserHandle(u.uid);
        const pct = totalAmt > 0 ? `${((u.totalAmount / totalAmt) * 100).toFixed(1)}%` : "0%";
        md += `| ${rankLabel} | [${handle}](https://www.nodeseek.com/space/${u.uid}#/general) | ${u.uid} | ${u.count} 次 | **${u.totalAmount}** | ${pct} |\n`;
      });
      md += `\n`;
      return md;
    }

    async function exportStardustSummaryMarkdown(records, btnEl) {
      if (!records || records.length === 0) return;
      const origText = btnEl ? btnEl.textContent : "📋 复制统计排行";

      const rankUpIn = buildStardustRankList(records, "upvote_in");
      const rankUpOut = buildStardustRankList(records, "upvote_out");
      const rankTrIn = buildStardustRankList(records, "transfer_in");
      const rankTrOut = buildStardustRankList(records, "transfer_out");

      const topUids = Array.from(new Set([
        ...rankUpIn.slice(0, 20).map((u) => u.uid),
        ...rankUpOut.slice(0, 20).map((u) => u.uid),
        ...rankTrIn.slice(0, 20).map((u) => u.uid),
        ...rankTrOut.slice(0, 20).map((u) => u.uid),
      ])).filter((uid) => uid && !getResolvedStardustUserName(uid));

      if (topUids.length > 0) {
        if (btnEl) btnEl.disabled = true;
        let done = 0;
        for (let i = 0; i < topUids.length; i += STARDUST_BATCH_CONCURRENCY) {
          const batch = topUids.slice(i, i + STARDUST_BATCH_CONCURRENCY);
          await Promise.all(batch.map((uid) => fetchUserProfile(String(uid), "")));
          done += batch.length;
          if (btnEl) btnEl.textContent = `⏳ 补全榜上昵称 (${done}/${topUids.length})...`;
          await new Promise((r) => setTimeout(r, 60));
        }
        if (btnEl) btnEl.disabled = false;
      }

      const summary = computeStardustSummary(records);
      let fullMd = ":::: tabs\n";

      fullMd += "::: tab-item 📊 统计总览\n";
      fullMd += "| 统计维度 | 笔数 / 次数 | 合计星辰 |\n";
      fullMd += "| :--- | :--- | :--- |\n";
      fullMd += `| 当前核算余额 | - | **${summary.displayBal}** |\n`;
      fullMd += `| 收到点赞（他人赠予） | ${summary.upvoteInCount} 次 | **+${summary.upvoteInStardust}** |\n`;
      fullMd += `| 送出点赞（赞赏他人） | ${summary.upvoteOutCount} 次 | - |\n`;
      fullMd += `| 收到转账 | ${summary.transferInCount} 笔 | **+${summary.transferInStardust}** |\n`;
      fullMd += `| 送出转账 | ${summary.transferOutCount} 笔 | **-${summary.transferOutStardust}** |\n`;
      fullMd += `| 累计净收支 | ${summary.upvoteInCount + summary.transferInCount + summary.transferOutCount} 笔 | +${summary.totalIncome} / -${summary.totalExpense} |\n\n`;
      fullMd += ":::\n";

      fullMd += `::: tab-item 💖 获赞排行 Top 20\n`;
      fullMd += `共 ${rankUpIn.length} 位社区好友为你点赞（合计 +${summary.upvoteInStardust} 星辰）\n\n`;
      fullMd += buildMarkdownTopRankTable(rankUpIn, "upvote_in", 20);
      fullMd += ":::\n";

      fullMd += `::: tab-item 👍 送赞排行 Top 20\n`;
      fullMd += `共为 ${rankUpOut.length} 位用户送出点赞（合计 ${summary.upvoteOutCount} 次）\n\n`;
      fullMd += buildMarkdownTopRankTable(rankUpOut, "upvote_out", 20);
      fullMd += ":::\n";

      fullMd += `::: tab-item 💰 收到转账 Top 20\n`;
      fullMd += `共 ${rankTrIn.length} 位用户向你转账（合计 +${summary.transferInStardust} 星辰）\n\n`;
      fullMd += buildMarkdownTopRankTable(rankTrIn, "transfer_in", 20);
      fullMd += ":::\n";

      fullMd += `::: tab-item 💸 送出转账 Top 20\n`;
      fullMd += `共向 ${rankTrOut.length} 位用户转账（合计 -${summary.transferOutStardust} 星辰）\n\n`;
      fullMd += buildMarkdownTopRankTable(rankTrOut, "transfer_out", 20);
      fullMd += ":::\n";

      fullMd += "::::\n";

      const ok = await copyTextToClipboard(fullMd);
      if (btnEl) {
        btnEl.textContent = ok ? "✅ 已复制统计排行" : "❌ 复制失败";
        setTimeout(() => {
          btnEl.textContent = origText;
        }, 2400);
      }

      document.querySelectorAll("[data-nsc-sd-uid]").forEach((el) => {
        const u = el.getAttribute("data-nsc-sd-uid");
        const name = getResolvedStardustUserName(u);
        if (name) el.textContent = `@${name}`;
      });
    }

    function sortStardustList(list) {
      const dir = stardustUi.sortDir === "asc" ? 1 : -1;
      const key = stardustUi.sortKey || "time";
      return [...list].sort((a, b) => {
        if (key === "time") return (a.rawCreatedAt - b.rawCreatedAt) * dir;
        if (key === "category") return a.category.localeCompare(b.category) * dir || (b.rawCreatedAt - a.rawCreatedAt);
        if (key === "amount") return (a.amount - b.amount) * dir || (b.rawCreatedAt - a.rawCreatedAt);
        if (key === "uid") return ((Number(a.targetUid) || 0) - (Number(b.targetUid) || 0)) * dir || (b.rawCreatedAt - a.rawCreatedAt);
        if (key === "detail") {
          const da = `${getDisplayUserHandle(a.targetUid)} ${a.memo || ""}`;
          const db = `${getDisplayUserHandle(b.targetUid)} ${b.memo || ""}`;
          return da.localeCompare(db, "zh-CN") * dir || (b.rawCreatedAt - a.rawCreatedAt);
        }
        return (b.rawCreatedAt - a.rawCreatedAt);
      });
    }

    function renderStardustTableSection(hostEl, records) {
      stardustUi.lastTableHost = hostEl;
      stardustUi.lastRecords = records;
      const kw = stardustUi.search.trim().toLowerCase();
      const filtered = sortStardustList(
        records.filter((item) => {
          if (stardustUi.filter !== "all" && item.category !== stardustUi.filter) return false;
          if (kw) {
            const uidStr = String(item.targetUid || "");
            const nameStr = getResolvedStardustUserName(item.targetUid).toLowerCase();
            const memoStr = String(item.memo || "").toLowerCase();
            const timeStr = String(item.time || "").toLowerCase();
            return (
              uidStr.includes(kw) ||
              nameStr.includes(kw) ||
              memoStr.includes(kw) ||
              timeStr.includes(kw)
            );
          }
          return true;
        })
      );

      hostEl.innerHTML = "";

      if (filtered.length === 0) {
        hostEl.innerHTML = `<div class="nsc-empty-state">未找到符合条件的星辰流水记录</div>`;
        return;
      }

      const sliceCount = Math.min(filtered.length, stardustUi.visibleCount);
      const visibleRecords = filtered.slice(0, sliceCount);
      const selfUid = stardustUi.myUid || state.currentUserId || "";

      const wrap = document.createElement("div");
      wrap.className = "nsc-ana-table-wrap";

      const sortInd = (key) => {
        if (stardustUi.sortKey !== key) return `<span class="nsc-ana-sort-ind">↕</span>`;
        return `<span class="nsc-ana-sort-ind">${stardustUi.sortDir === "asc" ? "↑" : "↓"}</span>`;
      };
      const sortCls = (key) => "nsc-ana-sort-th" + (stardustUi.sortKey === key ? " is-sorted" : "");

      const visibleUids = [];
      const rowsHtml = visibleRecords.map((item) => {
        let amountHtml = `<span>0</span>`;
        if (item.category === "upvote_out") {
          amountHtml = `<span style="color:var(--nsc-muted);font-weight:600;">👍 赞</span>`;
        } else if (item.amount > 0) {
          amountHtml = `<span style="color:#16a34a;font-weight:700;">+${item.amount}</span>`;
        } else if (item.amount < 0) {
          amountHtml = `<span style="color:#ff3b30;font-weight:700;">${item.amount}</span>`;
        }

        let badgeHtml = `<span class="nsc-ana-badge out">💸 送出转账</span>`;
        if (item.category === "upvote_in") {
          badgeHtml = `<span class="nsc-ana-badge in">💖 收到点赞</span>`;
        } else if (item.category === "upvote_out") {
          badgeHtml = `<span class="nsc-ana-badge star">👍 送出点赞</span>`;
        } else if (item.category === "transfer_in") {
          badgeHtml = `<span class="nsc-ana-badge star">💰 收到转账</span>`;
        }

        let uidCellHtml = "-";
        const detailParts = [];
        if (item.targetUid) {
          visibleUids.push(item.targetUid);
          const handle = getDisplayUserHandle(item.targetUid);
          const spaceUrl = `https://www.nodeseek.com/space/${encodeURIComponent(item.targetUid)}#/general`;
          uidCellHtml = `<a href="${spaceUrl}" target="_blank" rel="noopener noreferrer" data-sd-profile="${escHtml(item.targetUid)}" style="color:var(--nsc-accent);text-decoration:none;font-family:ui-monospace,monospace;">UID: ${escHtml(item.targetUid)}</a>`;
          detailParts.push(`<a href="${spaceUrl}" target="_blank" rel="noopener noreferrer" data-sd-profile="${escHtml(item.targetUid)}" data-nsc-sd-uid="${escHtml(item.targetUid)}" style="color:var(--nsc-accent);font-weight:600;text-decoration:none;">${escHtml(handle)}</a>`);
        }
        if (item.balance !== null && item.balance !== undefined) {
          detailParts.push(`<span class="nsc-badge-read">余额: ${escHtml(String(item.balance))}</span>`);
        }
        if (item.postId) {
          detailParts.push(`<button type="button" class="nsc-mini-btn" data-sd-post="${escHtml(item.postId)}" style="padding:0 6px;font-size:10.5px;">帖子 #${escHtml(item.postId)}</button>`);
        } else if (selfUid && item.targetUid && (item.category === "transfer_in" || item.category === "transfer_out")) {
          const ledgerUrl = `/stardust/list?member_id=${encodeURIComponent(String(selfUid))}&peer_id=${encodeURIComponent(item.targetUid)}${item.refId ? `&ref_id=${encodeURIComponent(item.refId)}` : ""}`;
          detailParts.push(`<a class="nsc-mini-btn" href="${ledgerUrl}" target="_blank" rel="noopener noreferrer" style="padding:0 6px;font-size:10.5px;text-decoration:none;">流水 ↗</a>`);
        }
        if (item.memo) {
          detailParts.push(`<span style="color:var(--nsc-text);">📝 ${escHtml(item.memo)}</span>`);
        }

        return `
          <tr>
            <td style="font-family:ui-monospace,monospace;font-size:11.5px;color:var(--nsc-muted);white-space:nowrap;">${escHtml(item.time)}</td>
            <td>${badgeHtml}</td>
            <td>${amountHtml}</td>
            <td>${uidCellHtml}</td>
            <td style="line-height:1.5;">${detailParts.length > 0 ? detailParts.join(" ") : "-"}</td>
          </tr>
        `;
      }).join("");

      wrap.innerHTML = `
        <div style="overflow-x:auto;">
          <table class="nsc-ana-table">
            <thead>
              <tr>
                <th class="${sortCls("time")}" data-sd-sort="time" style="width:155px;" title="按时间排序">时间${sortInd("time")}</th>
                <th class="${sortCls("category")}" data-sd-sort="category" style="width:105px;" title="按类型排序">类型${sortInd("category")}</th>
                <th class="${sortCls("amount")}" data-sd-sort="amount" style="width:78px;" title="按数额排序">数额${sortInd("amount")}</th>
                <th class="${sortCls("uid")}" data-sd-sort="uid" style="width:98px;" title="按 UID 排序">对方 UID${sortInd("uid")}</th>
                <th class="${sortCls("detail")}" data-sd-sort="detail" title="按用户名/明细排序">明细信息${sortInd("detail")}</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      `;

      wrap.querySelectorAll("[data-sd-sort]").forEach((th) => {
        th.addEventListener("click", () => {
          const k = th.getAttribute("data-sd-sort");
          if (stardustUi.sortKey === k) {
            stardustUi.sortDir = stardustUi.sortDir === "desc" ? "asc" : "desc";
          } else {
            stardustUi.sortKey = k;
            stardustUi.sortDir = (k === "uid" || k === "detail" || k === "category") ? "asc" : "desc";
          }
          stardustUi.visibleCount = STARDUST_PAGE_SIZE;
          renderStardustTableSection(hostEl, records);
        });
      });

      wrap.querySelectorAll("[data-sd-profile]").forEach((lnk) => {
        lnk.addEventListener("click", (e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
          const uid = lnk.getAttribute("data-sd-profile");
          if (uid && typeof openUserProfileModal === "function") {
            e.preventDefault();
            const resolved = getResolvedStardustUserName(uid);
            openUserProfileModal({ uid, name: resolved || `用户 #${uid}` });
          }
        });
      });

      wrap.querySelectorAll("[data-sd-post]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const pid = btn.getAttribute("data-sd-post");
          if (!pid) return;
          const bd = document.getElementById("nsc-hub-backdrop");
          if (bd) bd.classList.remove("is-open");
          if (typeof openPostInChat === "function") {
            openPostInChat({ postId: pid, url: `/post-${pid}-1`, title: `帖子 #${pid}` });
          }
        });
      });

      const wfFoot = document.createElement("div");
      wfFoot.style.cssText = "text-align:center;font-size:11.5px;color:var(--nsc-muted);padding:10px 4px;";
      if (sliceCount < filtered.length) {
        wfFoot.textContent = `继续下滑自动瀑布流加载更多（当前显示 ${sliceCount} / ${filtered.length} 条）`;
      } else {
        wfFoot.textContent = `已加载全部 ${filtered.length} 条流水`;
      }

      hostEl.appendChild(wrap);
      hostEl.appendChild(wfFoot);

      resolveVisibleStardustUids(visibleUids);
    }

    function renderStardustAnalytics(body, subbar) {
      const snap = stardustEngine.getState();
      const rawItems = snap.items || [];
      const selfUid = stardustUi.myUid || state.currentUserId || 0;
      const records = normalizeStardustRecords(rawItems, selfUid);

      const banner = document.createElement("div");
      banner.className = "nsc-ana-banner";

      const topRow = document.createElement("div");
      topRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;width:100%;";

      const statusBox = document.createElement("div");
      statusBox.style.cssText = "min-width:200px;flex:1;";
      const statusText = snap.running
        ? `正在全量拉取第 ${snap.page + 1} 批（已去重 ${records.length} 条记录）...`
        : records.length > 0
          ? `已就绪 · 共分析 ${records.length} 条交互与转账记录`
          : "点击「开始全量拉取」获取完整星辰收支与双向点赞统计";
      statusBox.innerHTML = `
        <div style="font-size:13px;font-weight:700;color:var(--nsc-text);">${escHtml(statusText)}</div>
        ${snap.error ? `<div style="font-size:11.5px;color:#ff3b30;margin-top:3px;">${escHtml(snap.error)}</div>` : ""}
      `;

      const btnGroup = document.createElement("div");
      btnGroup.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap;";

      if (snap.running) {
        const stopBtn = document.createElement("button");
        stopBtn.type = "button";
        stopBtn.className = "nsc-checkin-btn";
        stopBtn.style.color = "#ff3b30";
        stopBtn.textContent = "停止";
        stopBtn.addEventListener("click", () => stardustEngine.abort());
        btnGroup.appendChild(stopBtn);
      } else {
        const fetchBtn = document.createElement("button");
        fetchBtn.type = "button";
        fetchBtn.className = "nsc-checkin-btn primary";
        fetchBtn.textContent = records.length > 0 ? "🔄 重新抓取" : "开始全量拉取";
        fetchBtn.addEventListener("click", () => {
          stardustUi.visibleCount = STARDUST_PAGE_SIZE;
          stardustEngine.runBatch({ maxPages: 300, delayMs: 300 });
        });
        btnGroup.appendChild(fetchBtn);
      }

      const exportBtn = document.createElement("button");
      exportBtn.type = "button";
      exportBtn.className = "nsc-checkin-btn";
      exportBtn.textContent = "📋 复制统计排行";
      exportBtn.disabled = records.length === 0 || snap.running;
      exportBtn.addEventListener("click", () => exportStardustSummaryMarkdown(records, exportBtn));
      btnGroup.appendChild(exportBtn);

      topRow.appendChild(statusBox);
      topRow.appendChild(btnGroup);
      banner.appendChild(topRow);

      // 筛选栏与搜索框
      const filterRow = document.createElement("div");
      filterRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;width:100%;padding-top:8px;border-top:1px dashed var(--nsc-border);";

      const seg = document.createElement("div");
      seg.className = "nsc-ns-switch";
      const filterDefs = [
        { id: "all", label: "全部" },
        { id: "upvote_in", label: "收到点赞" },
        { id: "upvote_out", label: "送出点赞" },
        { id: "transfer_out", label: "送出转账" },
        { id: "transfer_in", label: "收到转账" },
      ];
      const tableHost = document.createElement("div");

      filterDefs.forEach((f) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "nsc-ns-switch-item" + (stardustUi.filter === f.id ? " is-active" : "");
        b.textContent = f.label;
        b.addEventListener("click", () => {
          stardustUi.filter = f.id;
          stardustUi.visibleCount = STARDUST_PAGE_SIZE;
          seg.querySelectorAll(".nsc-ns-switch-item").forEach((el) => el.classList.remove("is-active"));
          b.classList.add("is-active");
          if (records.length > 0) renderStardustTableSection(tableHost, records);
        });
        seg.appendChild(b);
      });

      const searchWrap = document.createElement("div");
      searchWrap.className = "nsc-search-wrap";
      searchWrap.style.cssText = "width:auto;min-width:220px;";
      searchWrap.innerHTML = `<input type="text" class="nsc-search-input" placeholder="搜索 UID / 用户名 / 留言 / 时间..." /><button type="button" class="nsc-search-clear" title="清空搜索">${ICONS.eraser}</button>`;
      const searchInput = searchWrap.querySelector(".nsc-search-input");
      const searchClearBtn = searchWrap.querySelector(".nsc-search-clear");
      const syncSearchClear = () => {
        searchClearBtn.classList.toggle("is-visible", Boolean(searchInput.value));
      };
      searchInput.value = stardustUi.search;
      syncSearchClear();
      searchInput.addEventListener("input", () => {
        syncSearchClear();
        stardustUi.search = searchInput.value;
        stardustUi.visibleCount = STARDUST_PAGE_SIZE;
        if (records.length > 0) renderStardustTableSection(tableHost, records);
      });
      searchClearBtn.addEventListener("click", () => {
        searchInput.value = "";
        syncSearchClear();
        stardustUi.search = "";
        stardustUi.visibleCount = STARDUST_PAGE_SIZE;
        if (records.length > 0) renderStardustTableSection(tableHost, records);
        searchInput.focus();
      });

      filterRow.appendChild(seg);
      filterRow.appendChild(searchWrap);
      banner.appendChild(filterRow);
      body.appendChild(banner);

      if (records.length === 0) {
        if (!snap.running) {
          const empty = document.createElement("div");
          empty.className = "nsc-empty-state";
          empty.textContent = "尚未拉取星辰账本数据，点击「开始全量拉取」即可完整核算双向点赞与转账排行。";
          body.appendChild(empty);
        }
        return;
      }

      const summary = computeStardustSummary(records);
      const kpi = document.createElement("div");
      kpi.className = "nsc-hub-kpi-grid";
      kpi.innerHTML = `
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">核算余额</div>
          <div class="nsc-hub-kpi-val" style="color:var(--nsc-accent);">${escHtml(String(summary.displayBal))}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">累计收入</div>
          <div class="nsc-hub-kpi-val" style="color:#16a34a;">+${summary.totalIncome}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">累计支出</div>
          <div class="nsc-hub-kpi-val" style="color:#ff3b30;">-${summary.totalExpense}</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">收到点赞</div>
          <div class="nsc-hub-kpi-val" style="color:#16a34a;">${summary.upvoteInCount} 次 (+${summary.upvoteInStardust})</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">送出点赞</div>
          <div class="nsc-hub-kpi-val" style="color:var(--nsc-accent);">${summary.upvoteOutCount} 次</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">送出转账</div>
          <div class="nsc-hub-kpi-val" style="color:#ff3b30;">${summary.transferOutCount} 笔 (-${summary.transferOutStardust})</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">收到转账</div>
          <div class="nsc-hub-kpi-val" style="color:var(--nsc-accent);">${summary.transferInCount} 笔 (+${summary.transferInStardust})</div>
        </div>
      `;
      body.appendChild(kpi);

      // 星辰互动排行榜卡片（可点击直接定位该用户的星辰转账/互动记录）
      const rankCard = document.createElement("div");
      rankCard.className = "nsc-ana-card";
      rankCard.style.marginBottom = "12px";
      const rankCats = [
        { id: "upvote_in", label: "💖 获赞排行", unit: "星辰", sign: "+" },
        { id: "upvote_out", label: "👍 送赞排行", unit: "次", sign: "" },
        { id: "transfer_in", label: "💰 收到转账", unit: "星辰", sign: "+" },
        { id: "transfer_out", label: "💸 送出转账", unit: "星辰", sign: "-" },
      ];
      const activeRankDef = rankCats.find((c) => c.id === stardustUi.rankCat) || rankCats[0];
      const rankList = buildStardustRankList(records, activeRankDef.id);
      const topRank = rankList.slice(0, 20);

      rankCard.innerHTML = `
        <div class="nsc-ana-card-title" style="flex-wrap:wrap;">
          <span>🏆 星辰互动排行榜（点击用户直达其明细记录）</span>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <div class="nsc-ns-switch" id="nsc-sd-rank-tabs"></div>
            <button type="button" class="nsc-mini-btn" id="nsc-sd-rank-toggle">${stardustUi.showRank ? "收起" : "展开"}</button>
          </div>
        </div>
        <div id="nsc-sd-rank-list" style="display:${stardustUi.showRank ? "grid" : "none"};grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:6px;"></div>
      `;
      const rTabs = rankCard.querySelector("#nsc-sd-rank-tabs");
      rankCats.forEach((rc) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "nsc-ns-switch-item" + (activeRankDef.id === rc.id ? " is-active" : "");
        b.textContent = rc.label;
        b.addEventListener("click", () => {
          stardustUi.rankCat = rc.id;
          stardustUi.showRank = true;
          renderUserHub();
        });
        rTabs.appendChild(b);
      });
      rankCard.querySelector("#nsc-sd-rank-toggle").addEventListener("click", () => {
        stardustUi.showRank = !stardustUi.showRank;
        renderUserHub();
      });

      const rListEl = rankCard.querySelector("#nsc-sd-rank-list");
      if (stardustUi.showRank) {
        if (topRank.length === 0) {
          rListEl.innerHTML = `<div style="font-size:12px;color:var(--nsc-muted);padding:8px 2px;">暂无该分类排行数据</div>`;
        } else {
          const rankUidsToResolve = [];
          topRank.forEach((u, idx) => {
            rankUidsToResolve.push(u.uid);
            const rank = idx + 1;
            const rankLabel = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
            const handle = getDisplayUserHandle(u.uid);
            const valText = activeRankDef.id === "upvote_out"
              ? `${u.count} 次`
              : `${activeRankDef.sign}${u.totalAmount} (${u.count}次)`;
            const badgeCls = activeRankDef.sign === "-" ? "neg" : "pos";
            const ledgerHref = selfUid
              ? `/stardust/list?member_id=${encodeURIComponent(String(selfUid))}&peer_id=${encodeURIComponent(u.uid)}`
              : `/stardust/list?member_id=${encodeURIComponent(u.uid)}`;

            const row = document.createElement("div");
            row.className = "nsc-hub-row";
            row.style.marginBottom = "0";
            row.style.padding = "7px 10px";
            row.title = "点击筛选并跳转到该用户的星辰往来明细";
            row.innerHTML = `
              <span style="width:26px;text-align:center;font-weight:700;font-size:12px;flex:0 0 26px;">${rankLabel}</span>
              <div class="nsc-hub-row-main">
                <div class="nsc-hub-row-title" data-nsc-sd-uid="${escHtml(u.uid)}">${escHtml(handle)}</div>
                <div class="nsc-hub-row-sub"><span>UID: ${escHtml(u.uid)}</span><a href="${ledgerHref}" target="_blank" rel="noopener noreferrer" data-sd-ext style="color:var(--nsc-accent);text-decoration:none;">原版流水 ↗</a></div>
              </div>
              <span class="nsc-hub-delta ${badgeCls}">${escHtml(valText)}</span>
            `;
            row.querySelector("[data-sd-ext]").addEventListener("click", (e) => e.stopPropagation());
            row.addEventListener("click", () => {
              stardustUi.search = String(u.uid);
              stardustUi.filter = activeRankDef.id;
              stardustUi.visibleCount = STARDUST_PAGE_SIZE;
              searchInput.value = String(u.uid);
              syncSearchClear();
              seg.querySelectorAll(".nsc-ns-switch-item").forEach((el, sIdx) => {
                el.classList.toggle("is-active", filterDefs[sIdx] && filterDefs[sIdx].id === activeRankDef.id);
              });
              renderStardustTableSection(tableHost, records);
              tableHost.scrollIntoView({ behavior: "smooth", block: "start" });
            });
            rListEl.appendChild(row);
          });
          resolveVisibleStardustUids(rankUidsToResolve);
        }
      }
      body.appendChild(rankCard);
      body.appendChild(tableHost);

      renderStardustTableSection(tableHost, records);
    }

    registerHubSubView("stardust", {
      render(body, subbar) {
        renderStardustAnalytics(body, subbar);
      },
      onScrollEnd() {
        if (state.hubTab !== "stardust" || state.hubStardustView !== "analytics") return;
        const host = stardustUi.lastTableHost;
        const recs = stardustUi.lastRecords;
        if (!host || !host.isConnected || !recs || recs.length === 0) return;
        const kw = stardustUi.search.trim().toLowerCase();
        const totalFiltered = recs.filter((item) => {
          if (stardustUi.filter !== "all" && item.category !== stardustUi.filter) return false;
          if (!kw) return true;
          return (
            String(item.targetUid || "").includes(kw) ||
            getResolvedStardustUserName(item.targetUid).toLowerCase().includes(kw) ||
            String(item.memo || "").toLowerCase().includes(kw) ||
            String(item.time || "").toLowerCase().includes(kw)
          );
        }).length;
        if (stardustUi.visibleCount < totalFiltered) {
          stardustUi.visibleCount += STARDUST_PAGE_SIZE;
          const hubBody = document.getElementById("nsc-hub-body");
          const prevTop = hubBody ? hubBody.scrollTop : 0;
          renderStardustTableSection(host, recs);
          if (hubBody) hubBody.scrollTop = prevTop;
        }
      },
    });
  })();
