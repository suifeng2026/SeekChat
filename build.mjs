import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = import.meta.dirname;
const SRC_DIR = path.join(ROOT, "src");
const THEMES_DIR = path.join(SRC_DIR, "themes");
const PLUGINS_DIR = path.join(SRC_DIR, "plugins");
const DIST_DIR = path.join(ROOT, "dist");
const TEMP_SYNC = "C:/Users/Administrator/Pictures/Temp/nodeseek-chat-ui.user.js";
const isLocalBuild = process.argv.includes("--local") || process.env.SEEKCHAT_LOCAL === "1";

fs.mkdirSync(DIST_DIR, { recursive: true });

function readDirJsOrdered(dirPath, prefix = "") {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((f) => /\.js$/i.test(f))
    .sort((a, b) => {
      const aCustom = a.startsWith("custom-") ? 1 : 0;
      const bCustom = b.startsWith("custom-") ? 1 : 0;
      if (aCustom !== bCustom) return aCustom - bCustom;
      return a.localeCompare(b);
    })
    .map((f) => ({
      label: prefix ? `${prefix}/${f}` : f,
      fullPath: path.join(dirPath, f),
    }));
}

let meta = fs.readFileSync(path.join(SRC_DIR, "00-meta.js"), "utf8").trimEnd();
if (isLocalBuild) {
  meta = meta
    .split(/\r?\n/)
    .filter((line) => !/^\/\/\s*@(updateURL|downloadURL)\b/i.test(line))
    .map((line) => {
      if (/^\/\/\s*@name\b/i.test(line)) {
        return line.replace(/^(\/\/\s*@name\s+)(.+)$/, "$1$2 (Local)");
      }
      if (/^\/\/\s*@namespace\b/i.test(line)) {
        return line.replace(/^(\/\/\s*@namespace\s+)(.+)$/, (_, p, val) => {
          const clean = val.trim().replace(/#.*$/, "");
          return `${p}${clean}#seekchat-local`;
        });
      }
      return line;
    })
    .join("\n");
}

const coreFiles = fs
  .readdirSync(SRC_DIR)
  .filter((f) => /^\d{2}-.*\.js$/.test(f) && f !== "00-meta.js" && f !== "09-main.js")
  .sort()
  .map((f) => ({ label: f, fullPath: path.join(SRC_DIR, f) }));

const themeFiles = readDirJsOrdered(THEMES_DIR, "themes");
const pluginFiles = readDirJsOrdered(PLUGINS_DIR, "plugins");
const mainFile = fs.existsSync(path.join(SRC_DIR, "09-main.js"))
  ? [{ label: "09-main.js", fullPath: path.join(SRC_DIR, "09-main.js") }]
  : [];

const manifestStub = {
  label: "build-manifest",
  code: `  const NSC_DISCOVERED_MODULES = ${JSON.stringify({
    mode: isLocalBuild ? "local" : "release",
    themes: themeFiles.map((f) => f.label),
    plugins: pluginFiles.map((f) => f.label),
  })};`,
};

const allOrdered = [...coreFiles, ...themeFiles, ...pluginFiles];
const parts = allOrdered.map(({ label, fullPath }) => {
  const body = fs.readFileSync(fullPath, "utf8").trimEnd();
  return `  // ==========================================================================\n  // Module: ${label}\n  // ==========================================================================\n${body}`;
});

parts.push(`  // ==========================================================================\n  // Build Manifest\n  // ==========================================================================\n${manifestStub.code}`);

for (const { label, fullPath } of mainFile) {
  const body = fs.readFileSync(fullPath, "utf8").trimEnd();
  parts.push(`  // ==========================================================================\n  // Module: ${label}\n  // ==========================================================================\n${body}`);
}

const output = `${meta}\n\n(function () {\n  "use strict";\n\n${parts.join("\n\n")}\n})();\n`;

const outUserJs = path.join(DIST_DIR, isLocalBuild ? "nodeseek-chat-ui.local.user.js" : "nodeseek-chat-ui.user.js");
fs.writeFileSync(outUserJs, output, "utf8");

if (!isLocalBuild) {
  const outMetaJs = path.join(DIST_DIR, "nodeseek-chat-ui.meta.js");
  fs.writeFileSync(outMetaJs, `${meta}\n`, "utf8");
}

if (fs.existsSync(path.dirname(TEMP_SYNC))) {
  fs.writeFileSync(TEMP_SYNC, output, "utf8");
}

execFileSync(process.execPath, ["--check", outUserJs], { stdio: "inherit" });
console.log(
  `Built ${outUserJs} (${output.split("\n").length} lines, mode=${isLocalBuild ? "local" : "release"}) from ${coreFiles.length} core + ${themeFiles.length} themes + ${pluginFiles.length} plugins + ${mainFile.length} main.`
);
