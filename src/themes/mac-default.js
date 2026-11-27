  // 内置默认 macOS 主题包（作为 ThemeRegistry 的标准范例，外部主题可放入 src/themes/*.js 自动发现）
  registerTheme({
    id: "light",
    name: "macOS 浅色",
    desc: "经典通透白玻璃与访达蓝点缀",
    baseScheme: "light",
    order: 10,
    tokens: {
      "--nsc-bg-nav": "rgba(242, 244, 247, 0.80)",
      "--nsc-bg-list": "rgba(251, 252, 254, 0.88)",
      "--nsc-bg-chat": "rgba(245, 246, 248, 0.84)",
      "--nsc-bg-right": "rgba(251, 252, 254, 0.88)",
      "--nsc-bg-card": "rgba(255, 255, 255, 0.96)",
      "--nsc-bubble-other": "#ffffff",
      "--nsc-bubble-self": "#007aff",
      "--nsc-bubble-op": "#fffdf6",
      "--nsc-text": "#1d1d1f",
      "--nsc-accent": "#007aff",
    },
  });

  registerTheme({
    id: "dusk",
    name: "黄昏护眼",
    desc: "暖羊皮纸色调，降低夜间阅读对比刺激",
    baseScheme: "light",
    order: 20,
    tokens: {
      "--nsc-bg-nav": "rgba(232, 221, 203, 0.92)",
      "--nsc-bg-list": "rgba(244, 236, 223, 0.96)",
      "--nsc-bg-chat": "rgba(239, 230, 214, 0.96)",
      "--nsc-bg-right": "rgba(244, 236, 223, 0.96)",
      "--nsc-bg-card": "#faf4e8",
      "--nsc-bubble-other": "#faf4e8",
      "--nsc-bubble-self": "#44689e",
      "--nsc-bubble-op": "#f9ebd0",
      "--nsc-text": "#3a3025",
      "--nsc-accent": "#b8621c",
    },
  });

  registerTheme({
    id: "dark",
    name: "macOS 暗黑",
    desc: "分层深灰毛玻璃，拒绝死黑高对比压迫感",
    baseScheme: "dark",
    order: 30,
    tokens: {
      "--nsc-bg-nav": "rgba(42, 45, 53, 0.88)",
      "--nsc-bg-list": "rgba(33, 36, 42, 0.94)",
      "--nsc-bg-chat": "rgba(27, 29, 35, 0.96)",
      "--nsc-bg-right": "rgba(36, 39, 46, 0.94)",
      "--nsc-bg-card": "#2f333d",
      "--nsc-bubble-other": "#2f333d",
      "--nsc-bubble-self": "#0a84ff",
      "--nsc-bubble-op": "#342e23",
      "--nsc-text": "#f2f2f7",
      "--nsc-accent": "#0a84ff",
    },
  });
