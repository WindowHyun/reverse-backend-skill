// render.js — Turn a reverse-engineering .md into HTML (always) and PDF (if Chromium is found).
// Usage: node render.js <in.md> [out-basename] ["Title"]
//   e.g. node render.js report.md report "Amuze-Beta 역기획"
//   -> report.html (always), report.pdf (if a Chromium/Chrome binary is available)
// Dependency-free: HTML via the bundled md2html module; PDF via headless Chromium (no npm packages).
// PDF text is rendered at generation time — install CJK fonts (e.g. `fonts-noto-cjk`) in bare
// CI containers or Korean/CJK glyphs will render as blank boxes in the PDF (the HTML is unaffected).
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { pathToFileURL } = require("url");
const { convert } = require("./md2html.js");

const [,, inPath, outBaseArg, titleArg] = process.argv;
if(!inPath){ console.error('usage: node render.js <in.md> [out-basename] ["Title"]'); process.exit(1); }
const outBase = outBaseArg || inPath.replace(/\.md$/i, "");
const title = titleArg || path.basename(outBase);
const htmlPath = outBase + ".html";
const pdfPath  = outBase + ".pdf";

// 1) HTML — always
fs.writeFileSync(htmlPath, convert(fs.readFileSync(inPath, "utf8"), title));
console.log("HTML:", htmlPath);

// 2) PDF — best effort. Discover a Chrome/Chromium binary.
function findChrome(){
  const cands = [];
  // Explicit override wins over everything else.
  if(process.env.CHROME_BIN) cands.push(process.env.CHROME_BIN);
  // Playwright browser caches (session default + the real per-user default).
  const pwDirs = [process.env.PLAYWRIGHT_BROWSERS_PATH, "/opt/pw-browsers",
    path.join(os.homedir(), ".cache", "ms-playwright"),
    path.join(os.homedir(), "Library", "Caches", "ms-playwright")].filter(Boolean);
  const subs = ["chrome-linux/chrome", "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
    "chrome-win/chrome.exe"];
  for(const pw of pwDirs){
    let entries = [];
    try { entries = fs.readdirSync(pw); } catch { continue; }
    for(const d of entries){
      if(/^chromium(?!_headless)/.test(d)) for(const s of subs) cands.push(path.join(pw, d, s));
    }
  }
  // Common system install locations across OSes.
  cands.push(
    "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable", "/snap/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  );
  return cands.find(p => p && fs.existsSync(p)) || null;
}

const chrome = findChrome();
if(!chrome){
  console.log("PDF: skipped — no Chromium/Chrome binary found.");
  console.log("     Open the HTML in a browser and print to PDF (Ctrl/Cmd+P), or set CHROME_BIN.");
  process.exit(0);
}
// Remove any stale PDF first, so a previous run's file can never be mistaken for fresh output.
try { fs.rmSync(pdfPath, { force: true }); } catch {}
let launchErr = null, stderr = "";
try {
  // --headless=new is required for correct pagination; the old headless mode emits a single page.
  const out = execFileSync(chrome, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--no-pdf-header-footer",
    "--print-to-pdf=" + pdfPath, pathToFileURL(path.resolve(htmlPath)).href,
  ], { stdio: ["ignore", "ignore", "pipe"], timeout: 60000 });
  void out;
} catch (e) {
  launchErr = e; // may be a benign non-zero exit (e.g. dbus warnings) even when the PDF was written
  stderr = (e && e.stderr && e.stderr.toString()) || "";
}
// Judge success by the artifact, not the exit code: Chromium can exit non-zero on
// harmless warnings yet still produce a valid PDF.
if (fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 1000) {
  const kb = Math.round(fs.statSync(pdfPath).size / 1024);
  console.log(`PDF:  ${pdfPath} (${kb} KB) via ${chrome}`);
} else {
  console.log("PDF: failed —", launchErr ? launchErr.message : "no output produced");
  if (stderr.trim()) console.log("     chromium stderr:", stderr.trim().split("\n").slice(-5).join(" | "));
  console.log("     HTML is still available; print it to PDF manually.");
  process.exitCode = 1;
}
