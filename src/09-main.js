  function hookSpaRouteDetection() {
    const pageWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
    let lastPath = location.pathname;
    const onRouteCheck = () => {
      setTimeout(() => {
        ensureHeaderSwitch();
        if (location.pathname !== lastPath) {
          lastPath = location.pathname;
          toggleAppMode(state.enabled);
        }
      }, 120);
    };
    window.addEventListener("popstate", onRouteCheck);
    const origPush = pageWin.history.pushState;
    const origReplace = pageWin.history.replaceState;
    pageWin.history.pushState = function () {
      const r = origPush.apply(this, arguments);
      onRouteCheck();
      return r;
    };
    pageWin.history.replaceState = function () {
      const r = origReplace.apply(this, arguments);
      onRouteCheck();
      return r;
    };
  }

  function startApp() {
    injectStyles();
    hookSpaRouteDetection();
    ensureHeaderSwitch();
    toggleAppMode(state.enabled);

    setTimeout(() => {
      if (!state.enabled || !isForumBrowseRoute()) return;
      const needUserCard = !document.querySelector("#nsc-right-user .user-card") && Boolean(document.querySelector("#nsk-right-panel-container .user-card"));
      const needEditor = !document.querySelector("#nsc-composer-body .md-editor:not(.nsc-unified-editor)") && Boolean(document.querySelector("#nsk-frame .md-editor"));
      if (needUserCard || needEditor) {
        mountNativeWidgetsIntoApp();
      }
    }, 450);

    const isIgnoredMutationNode = (node) => {
      if (!node || node.nodeType !== 1) return true;
      const id = node.id || "";
      if (id.startsWith("nsc-") || id.startsWith("hanabi-")) return true;
      const tag = node.tagName ? node.tagName.toLowerCase() : "";
      if (tag === "read-frog" || tag === "script" || tag === "style") return true;
      if (node.classList && (node.classList.contains("hover-user-card") || node.classList.contains("image-box"))) return true;
      return false;
    };

    let t = null;
    const obs = new MutationObserver((mutations) => {
      const hasRelevant = mutations.some((m) => {
        for (const n of m.addedNodes) { if (!isIgnoredMutationNode(n)) return true; }
        for (const n of m.removedNodes) { if (!isIgnoredMutationNode(n)) return true; }
        return false;
      });
      if (!hasRelevant) return;
      clearTimeout(t);
      t = setTimeout(() => {
        if (!document.getElementById("nsc-mode-switch-btn")) ensureHeaderSwitch();
        const shouldActive = state.enabled && isForumBrowseRoute();
        if (document.body.classList.contains("nsc-app-active") !== shouldActive) {
          toggleAppMode(state.enabled);
        } else if (shouldActive) {
          const needUserCard = !document.querySelector("#nsc-right-user .user-card") && Boolean(document.querySelector("#nsk-right-panel-container .user-card"));
          const needEditor = !document.querySelector("#nsc-composer-body .md-editor:not(.nsc-unified-editor)") && Boolean(document.querySelector("#nsk-frame .md-editor"));
          if (needUserCard || needEditor) mountNativeWidgetsIntoApp();
        }
      }, 180);
    });
    obs.observe(document.body, { childList: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp, { once: true });
  } else {
    startApp();
  }
