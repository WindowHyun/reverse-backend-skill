// render.js — Turn a reverse-engineering .md into HTML (always) and PDF (if Chromium is found).
// Usage: node render.js <in.md> [out-basename] ["Title"]
//   e.g. node render.js report.md report "Amuze-Beta 역기획"
//   -> report.html (always), report.pdf (if a Chromium/Chrome binary is available)
// Dependency-free: HTML via the bundled md2html module; PDF via headless Chromium (no npm packages).
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
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
  const pw = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  try {
    for(const d of fs.readdirSync(pw)){
      if(/^chromium(?!_headless)/.test(d)) cands.push(path.join(pw, d, "chrome-linux", "chrome"));
    }
  } catch {}
  cands.push(
    "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    process.env.CHROME_BIN || ""
  );
  return cands.find(p => p && fs.existsSync(p)) || null;
}

const chrome = findChrome();
if(!chrome){
  console.log("PDF: skipped — no Chromium/Chrome binary found.");
  console.log("     Open the HTML in a browser and print to PDF (Ctrl/Cmd+P), or set CHROME_BIN.");
  process.exit(0);
}
let launchErr = null;
try {
  // --headless=new is required for correct pagination; the old headless mode emits a single page.
  execFileSync(chrome, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--no-pdf-header-footer",
    "--print-to-pdf=" + pdfPath, "file://" + path.resolve(htmlPath),
  ], { stdio: ["ignore", "ignore", "ignore"], timeout: 60000 });
} catch (e) {
  launchErr = e; // may be a benign non-zero exit (e.g. dbus warnings) even when the PDF was written
}
// Judge success by the artifact, not the exit code: Chromium can exit non-zero on
// harmless warnings yet still produce a valid PDF.
if (fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 1000) {
  const kb = Math.round(fs.statSync(pdfPath).size / 1024);
  console.log(`PDF:  ${pdfPath} (${kb} KB) via ${chrome}`);
} else {
  console.log("PDF: failed —", launchErr ? launchErr.message : "no output produced");
  console.log("     HTML is still available; print it to PDF manually.");
  process.exitCode = 1;
}
