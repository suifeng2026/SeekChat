import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = import.meta.dirname;
const SRC_DIR = path.join(ROOT, "src");
const DIST_DIR = path.join(ROOT, "dist");
const TEMP_SYNC = "C:/Users/Administrator/Pictures/Temp/nodeseek-chat-ui.user.js";
const isLocalBuild = process.argv.includes("--local") || process.env.SEEKCHAT_LOCAL === "1";

fs.mkdirSync(DIST_DIR, { recursive: true });

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

const moduleFiles = fs
  .readdirSync(SRC_DIR)
  .filter((f) => /^\d{2}-.*\.js$/.test(f) && f !== "00-meta.js")
  .sort();

const parts = moduleFiles.map((file) => {
  const body = fs.readFileSync(path.join(SRC_DIR, file), "utf8").trimEnd();
  return `  // ==========================================================================\n  // Module: ${file}\n  // ==========================================================================\n${body}`;
});

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
  `Built ${outUserJs} (${output.split("\n").length} lines, mode=${isLocalBuild ? "local" : "release"}) from ${moduleFiles.length} modules.`
);
