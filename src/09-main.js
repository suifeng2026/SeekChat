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

    setTimeout(() => {
      ensureHeaderSwitch();
      toggleAppMode(state.enabled);
    }, 120);

    setTimeout(() => {
      if (state.enabled && isForumBrowseRoute()) {
        mountNativeWidgetsIntoApp();
      }
    }, 650);

    let t = null;
    const obs = new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (!document.getElementById("nsc-mode-switch-btn")) ensureHeaderSwitch();
        const shouldActive = state.enabled && isForumBrowseRoute();
        if (document.body.classList.contains("nsc-app-active") !== shouldActive) {
          toggleAppMode(state.enabled);
        } else if (shouldActive && !document.querySelector("#nsc-right-user .user-card")) {
          mountNativeWidgetsIntoApp();
        }
      }, 220);
    });
    obs.observe(document.body, { childList: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp, { once: true });
  } else {
    startApp();
  }
