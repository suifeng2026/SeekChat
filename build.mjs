import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = import.meta.dirname;
const SRC_DIR = path.join(ROOT, "src");
const DIST_DIR = path.join(ROOT, "dist");
const TEMP_SYNC = "C:/Users/Administrator/Pictures/Temp/nodeseek-chat-ui.user.js";

fs.mkdirSync(DIST_DIR, { recursive: true });

const meta = fs.readFileSync(path.join(SRC_DIR, "00-meta.js"), "utf8").trimEnd();
const moduleFiles = fs
  .readdirSync(SRC_DIR)
  .filter((f) => /^\d{2}-.*\.js$/.test(f) && f !== "00-meta.js")
  .sort();

const parts = moduleFiles.map((file) => {
  const body = fs.readFileSync(path.join(SRC_DIR, file), "utf8").trimEnd();
  return `  // ==========================================================================\n  // Module: ${file}\n  // ==========================================================================\n${body}`;
});

const output = `${meta}\n\n(function () {\n  "use strict";\n\n${parts.join("\n\n")}\n})();\n`;

const outUserJs = path.join(DIST_DIR, "nodeseek-chat-ui.user.js");
const outMetaJs = path.join(DIST_DIR, "nodeseek-chat-ui.meta.js");

fs.writeFileSync(outUserJs, output, "utf8");
fs.writeFileSync(outMetaJs, `${meta}\n`, "utf8");

if (fs.existsSync(path.dirname(TEMP_SYNC))) {
  fs.writeFileSync(TEMP_SYNC, output, "utf8");
}

execFileSync(process.execPath, ["--check", outUserJs], { stdio: "inherit" });
console.log(`Built ${outUserJs} (${output.split("\n").length} lines) from ${moduleFiles.length} modules.`);
