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
        <div class="nsc-ana-feeder-list" style="max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;"></div>
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
    }

    registerHubSubView("credit", {
      render(body, subbar) {
        renderCreditAnalytics(body, subbar);
      },
    });

    // =========================================================================
    // 2. 全量星辰账本分析器
    // =========================================================================
    const stardustUi = {
      filter: "all",
      search: "",
      page: 1,
      resolveSeq: 0,
      failedUids: new Set(),
      myUid: null,
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
        "floor", "balance", "remain", "type",
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
      const rawCreatedAt = typeof r.created_at === "number"
        ? (r.created_at > 1e11 ? r.created_at : r.created_at * 1000)
        : new Date(r.created_at).getTime();
      return r.id || `${rawCreatedAt || 0}_${r.peer_id || ""}_${r.member_id || ""}`;
    }

    function normalizeStardustRecords(rawRows, selfUid) {
      const uidNum = Number(selfUid) || 0;
      const list = (rawRows || []).map((r) => {
        const rawCreatedAt = typeof r.created_at === "number"
          ? (r.created_at > 1e11 ? r.created_at : r.created_at * 1000)
          : new Date(r.created_at).getTime();
        const mId = r.member_id ? parseInt(r.member_id, 10) : 0;
        const pId = r.peer_id ? parseInt(r.peer_id, 10) : 0;
        const rawType = String(r.type || "").toLowerCase();
        const refId = parseInt(r.ref_id || r.refId || 0, 10);

        const extractedNum = extractAmount(r);
        const isUpvote = (refId === 10) || rawType.includes("upvote") || rawType.includes("like") || Boolean(r.comment_id);

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

        return {
          id: stardustRecordKey(r),
          rawCreatedAt: rawCreatedAt || 0,
          amount: finalAmount,
          targetUid: targetUid ? String(targetUid) : "",
          memo: r.memo || r.reason || r.description || r.note || "",
          balance: extractBalance(r),
          category,
          time: formatExactTime(r.created_at),
        };
      });

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
      let transferOutCount = 0;
      let transferOutStardust = 0;
      let transferInCount = 0;
      let transferInStardust = 0;

      for (const item of records) {
        if (item.category === "upvote_in") {
          upvoteInCount += 1;
          upvoteInStardust += item.amount;
          totalIncome += item.amount;
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
        let url = `/api/stardust/list?count=1000&member_id=${encodeURIComponent(String(uid))}`;
        if (cursor) url += `&before_id=${encodeURIComponent(String(cursor))}`;

        const resp = await fetch(url, { credentials: "include", signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json().catch(() => null);
        if (!data || data.success === false || !Array.isArray(data.records) || data.records.length === 0) {
          return { rows: [], nextCursor: null, hasMore: false };
        }
        return {
          rows: data.records || [],
          nextCursor: data.cursor,
          hasMore: Boolean(data.exist_more && data.cursor),
        };
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
        await new Promise((r) => setTimeout(r, 90));
      }
    }

    function buildMarkdownTable(list) {
      if (!list || list.length === 0) return "*(暂无相关记录)*\n\n";

      let md = "| 时间 | 类型 | 数额 | 对方 UID | 明细信息 (@对方用户名 / 变动后余额 / 留言) |\n";
      md += "| :--- | :--- | :--- | :--- | :--- |\n";

      for (const item of list) {
        let typeLabel = "星辰流水";
        if (item.category === "upvote_in") typeLabel = "💖 收到点赞";
        else if (item.category === "transfer_out") typeLabel = "💸 送出转账";
        else if (item.category === "transfer_in") typeLabel = "💰 收到转账";

        const amountLabel = item.amount > 0 ? `+${item.amount}` : String(item.amount);
        const uidLabel = item.targetUid
          ? `[UID: ${item.targetUid}](https://www.nodeseek.com/space/${item.targetUid}#/general)`
          : "-";

        const detailParts = [];
        if (item.targetUid) {
          const handle = getDisplayUserHandle(item.targetUid);
          detailParts.push(`[${handle}](https://www.nodeseek.com/space/${item.targetUid}#/general)`);
        }
        if (item.balance !== null && item.balance !== undefined) {
          detailParts.push(`余额: ${item.balance}`);
        }
        if (item.memo) {
          detailParts.push(`留言: ${String(item.memo).replace(/\|/g, "/")}`);
        }

        const detailLabel = detailParts.length > 0 ? detailParts.join(" · ") : "-";
        md += `| ${item.time} | ${typeLabel} | ${amountLabel} | ${uidLabel} | ${detailLabel} |\n`;
      }
      md += "\n";
      return md;
    }

    function buildUserSummaryTable(list, actionText) {
      if (!list || list.length === 0) return "";

      const userMap = new Map();
      for (const item of list) {
        if (!item.targetUid) continue;
        if (!userMap.has(item.targetUid)) {
          userMap.set(item.targetUid, {
            uid: item.targetUid,
            name: getDisplayUserHandle(item.targetUid),
            count: 0,
            totalAmount: 0,
          });
        }
        const stat = userMap.get(item.targetUid);
        stat.count += 1;
        stat.totalAmount += Math.abs(item.amount);
      }

      const sortedUsers = Array.from(userMap.values()).sort(
        (a, b) => b.count - a.count || b.totalAmount - a.totalAmount
      );
      if (sortedUsers.length === 0) return "";

      let md = `### 👑 贡献者统计排行 (小计共 ${sortedUsers.length} 位用户)\n\n`;
      md += `| 排名 | 用户 (@昵称) | 对方 UID | ${actionText}次数 | 累计星辰 |\n`;
      md += "| :--- | :--- | :--- | :--- | :--- |\n";

      sortedUsers.forEach((u, index) => {
        const rank = index + 1;
        const rankIcon = rank === 1 ? "🥇 1" : rank === 2 ? "🥈 2" : rank === 3 ? "🥉 3" : String(rank);
        md += `| ${rankIcon} | [${u.name}](https://www.nodeseek.com/space/${u.uid}#/general) | [UID: ${u.uid}](https://www.nodeseek.com/space/${u.uid}#/general) | **${u.count} 次** | **${u.totalAmount}** |\n`;
      });
      md += "\n";
      return md;
    }

    async function exportStardustMarkdown(records, btnEl) {
      if (!records || records.length === 0) return;
      const origText = btnEl ? btnEl.textContent : "📋 导出 Markdown (含小计)";

      const distinctUids = Array.from(new Set(records.map((r) => r.targetUid).filter(Boolean)));
      const uncachedUids = distinctUids.filter((uid) => !getResolvedStardustUserName(uid));

      if (uncachedUids.length > 0) {
        if (btnEl) btnEl.disabled = true;
        let done = 0;
        const total = uncachedUids.length;
        for (let i = 0; i < total; i += STARDUST_BATCH_CONCURRENCY) {
          const batch = uncachedUids.slice(i, i + STARDUST_BATCH_CONCURRENCY);
          await Promise.all(batch.map((uid) => fetchUserProfile(String(uid), "")));
          done += batch.length;
          if (btnEl) {
            btnEl.textContent = `⏳ 正在解析全量昵称 (${done}/${total})...`;
          }
          await new Promise((r) => setTimeout(r, 60));
        }
        if (btnEl) btnEl.disabled = false;
      }

      const upvoteInList = records.filter((r) => r.category === "upvote_in");
      const transferOutList = records.filter((r) => r.category === "transfer_out");
      const transferInList = records.filter((r) => r.category === "transfer_in");
      const summary = computeStardustSummary(records);

      let fullMd = ":::: tabs\n";

      fullMd += "::: tab-item 💖 收到的点赞\n";
      fullMd += buildUserSummaryTable(upvoteInList, "获赠点赞");
      fullMd += "### 📜 点赞明细记录\n\n";
      fullMd += buildMarkdownTable(upvoteInList);
      fullMd += ":::\n";

      fullMd += "::: tab-item 💸 送出的转账\n";
      fullMd += buildUserSummaryTable(transferOutList, "转出");
      fullMd += "### 📜 送出转账明细\n\n";
      fullMd += buildMarkdownTable(transferOutList);
      fullMd += ":::\n";

      fullMd += "::: tab-item 💰 收到的转账\n";
      fullMd += buildUserSummaryTable(transferInList, "转入");
      fullMd += "### 📜 收到转账明细\n\n";
      fullMd += buildMarkdownTable(transferInList);
      fullMd += ":::\n";

      fullMd += "::: tab-item 🎁 全部流水\n";
      fullMd += "### 📊 账本总览汇总\n\n";
      fullMd += `- **当前星辰余额**: ${summary.displayBal}\n`;
      fullMd += `- **真实总流水**: ${records.length} 条\n`;
      fullMd += `- **累计收入**: +${summary.totalIncome}\n`;
      fullMd += `- **累计支出**: -${summary.totalExpense}\n`;
      fullMd += `- **收到点赞**: ${summary.upvoteInCount} 次 (+${summary.upvoteInStardust})\n`;
      fullMd += `- **送出转账**: ${summary.transferOutCount} 笔 (-${summary.transferOutStardust})\n`;
      fullMd += `- **收到转账**: ${summary.transferInCount} 笔 (+${summary.transferInStardust})\n\n`;
      fullMd += "### 📜 全部流水明细\n\n";
      fullMd += buildMarkdownTable(records);
      fullMd += ":::\n";

      fullMd += "::::\n";

      const ok = await copyTextToClipboard(fullMd);
      if (btnEl) {
        btnEl.textContent = ok ? "✅ 已复制全量 MD" : "❌ 复制失败";
        setTimeout(() => {
          btnEl.textContent = origText;
        }, 2500);
      }

      document.querySelectorAll("[data-nsc-sd-uid]").forEach((el) => {
        const u = el.getAttribute("data-nsc-sd-uid");
        const name = getResolvedStardustUserName(u);
        if (name) el.textContent = `@${name}`;
      });
    }

    function renderStardustTableSection(hostEl, records) {
      const kw = stardustUi.search.trim().toLowerCase();
      const filtered = records.filter((item) => {
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
      });

      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / STARDUST_PAGE_SIZE) || 1;
      if (stardustUi.page > totalPages) stardustUi.page = totalPages;
      if (stardustUi.page < 1) stardustUi.page = 1;

      const startIdx = (stardustUi.page - 1) * STARDUST_PAGE_SIZE;
      const pageRecords = filtered.slice(startIdx, startIdx + STARDUST_PAGE_SIZE);

      hostEl.innerHTML = "";

      if (pageRecords.length === 0) {
        hostEl.innerHTML = `<div class="nsc-empty-state">未找到符合条件的星辰流水记录</div>`;
        return;
      }

      const wrap = document.createElement("div");
      wrap.className = "nsc-ana-table-wrap";

      const visibleUids = [];
      const rowsHtml = pageRecords.map((item) => {
        const amountHtml = item.amount > 0
          ? `<span style="color:#16a34a;font-weight:700;">+${item.amount}</span>`
          : item.amount < 0
            ? `<span style="color:#ff3b30;font-weight:700;">${item.amount}</span>`
            : `<span>0</span>`;

        let badgeHtml = `<span class="nsc-ana-badge out">💸 送出转账</span>`;
        if (item.category === "upvote_in") {
          badgeHtml = `<span class="nsc-ana-badge in">💖 收到点赞</span>`;
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
                <th style="width:155px;">时间 (精确秒级)</th>
                <th style="width:105px;">类型</th>
                <th style="width:74px;">数额</th>
                <th style="width:96px;">对方 UID</th>
                <th>明细信息 (@对方用户名 / 变动后余额 / 转账留言)</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      `;

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

      const pager = document.createElement("div");
      pager.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 4px 2px;font-size:12px;color:var(--nsc-muted);";
      pager.innerHTML = `
        <span>第 ${stardustUi.page} / ${totalPages} 页 (共 ${totalItems} 条)</span>
        <div style="display:flex;align-items:center;gap:6px;">
          <button type="button" class="nsc-mini-btn" data-sd-page="prev" ${stardustUi.page <= 1 ? "disabled" : ""}>上一页</button>
          <button type="button" class="nsc-mini-btn" data-sd-page="next" ${stardustUi.page >= totalPages ? "disabled" : ""}>下一页</button>
        </div>
      `;
      pager.querySelector('[data-sd-page="prev"]').addEventListener("click", () => {
        if (stardustUi.page > 1) {
          stardustUi.page -= 1;
          renderStardustTableSection(hostEl, records);
        }
      });
      pager.querySelector('[data-sd-page="next"]').addEventListener("click", () => {
        if (stardustUi.page < totalPages) {
          stardustUi.page += 1;
          renderStardustTableSection(hostEl, records);
        }
      });

      hostEl.appendChild(wrap);
      hostEl.appendChild(pager);

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
        ? `正在拉取第 ${snap.page + 1} 批（已去重 ${records.length} 条流水）...`
        : records.length > 0
          ? `已就绪 · 全量共 ${records.length} 条流水（按时间倒序）`
          : "点击「开始全量拉取」获取个人完整星辰收支账本";
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
          stardustUi.page = 1;
          stardustEngine.runBatch({ maxPages: 200, delayMs: 300 });
        });
        btnGroup.appendChild(fetchBtn);
      }

      const exportBtn = document.createElement("button");
      exportBtn.type = "button";
      exportBtn.className = "nsc-checkin-btn";
      exportBtn.textContent = "📋 导出 Markdown (含小计)";
      exportBtn.disabled = records.length === 0 || snap.running;
      exportBtn.addEventListener("click", () => exportStardustMarkdown(records, exportBtn));
      btnGroup.appendChild(exportBtn);

      topRow.appendChild(statusBox);
      topRow.appendChild(btnGroup);
      banner.appendChild(topRow);

      // 筛选栏与搜索框
      const filterRow = document.createElement("div");
      filterRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;width:100%;padding-top:8px;border-top:1px dashed var(--nsc-border);";

      const seg = document.createElement("div");
      seg.className = "nsc-seg-tabs";
      const filterDefs = [
        { id: "all", label: "全部" },
        { id: "upvote_in", label: "收到点赞" },
        { id: "transfer_out", label: "送出转账" },
        { id: "transfer_in", label: "收到转账" },
      ];
      const tableHost = document.createElement("div");

      filterDefs.forEach((f) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "nsc-seg-btn" + (stardustUi.filter === f.id ? " is-active" : "");
        b.textContent = f.label;
        b.addEventListener("click", () => {
          stardustUi.filter = f.id;
          stardustUi.page = 1;
          seg.querySelectorAll(".nsc-seg-btn").forEach((el) => el.classList.remove("is-active"));
          b.classList.add("is-active");
          if (records.length > 0) renderStardustTableSection(tableHost, records);
        });
        seg.appendChild(b);
      });

      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.placeholder = "搜索 UID / 用户名 / 留言 / 时间...";
      searchInput.value = stardustUi.search;
      searchInput.style.cssText = "height:28px;padding:0 10px;border-radius:8px;border:1px solid var(--nsc-border);background:var(--nsc-hover);color:var(--nsc-text);font-size:12px;outline:none;min-width:210px;";
      searchInput.addEventListener("input", () => {
        stardustUi.search = searchInput.value;
        stardustUi.page = 1;
        if (records.length > 0) renderStardustTableSection(tableHost, records);
      });

      filterRow.appendChild(seg);
      filterRow.appendChild(searchInput);
      banner.appendChild(filterRow);
      body.appendChild(banner);

      if (records.length === 0) {
        if (!snap.running) {
          const empty = document.createElement("div");
          empty.className = "nsc-empty-state";
          empty.textContent = "尚未拉取星辰账本数据，点击「开始全量拉取」即可完整核算收支与点赞。";
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
          <div class="nsc-hub-kpi-lbl">总流水</div>
          <div class="nsc-hub-kpi-val">${records.length} 条</div>
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
          <div class="nsc-hub-kpi-lbl">送出转账</div>
          <div class="nsc-hub-kpi-val" style="color:#ff3b30;">${summary.transferOutCount} 笔 (-${summary.transferOutStardust})</div>
        </div>
        <div class="nsc-hub-kpi">
          <div class="nsc-hub-kpi-lbl">收到转账</div>
          <div class="nsc-hub-kpi-val" style="color:var(--nsc-accent);">${summary.transferInCount} 笔 (+${summary.transferInStardust})</div>
        </div>
      `;
      body.appendChild(kpi);
      body.appendChild(tableHost);

      renderStardustTableSection(tableHost, records);
    }

    registerHubSubView("stardust", {
      render(body, subbar) {
        renderStardustAnalytics(body, subbar);
      },
    });
  })();
