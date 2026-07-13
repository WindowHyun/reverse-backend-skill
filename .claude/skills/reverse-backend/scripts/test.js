// test.js — regression tests for md2html.js + structural checks for render.js.
// Run: node scripts/test.js   (exit 0 = all pass, 1 = failure). No dependencies.
"use strict";
const fs = require("fs");
const path = require("path");
const { convert } = require("./md2html.js");

let pass = 0, fail = 0;
function check(name, cond){
  if(cond){ pass++; console.log("  ok   " + name); }
  else    { fail++; console.log("  FAIL " + name); }
}
function body(md, title){ return convert(md, title).split("<body>")[1].split("</body>")[0]; }
function head(md, title){ return convert(md, title).split("<body>")[0]; }

console.log("md2html — rendering regressions:");

// 1. Fenced code block -> <pre><code>, newlines/indentation preserved, no inline processing.
{
  const b = body("```python\ndef foo():\n    return 1  # c\n```", "t");
  check("fenced code -> <pre><code>", b.includes("<pre><code"));
  check("fenced code preserves newline+indent", b.includes("def foo():\n    return 1"));
}
// 2. Link text that is itself a URL must not produce nested anchors.
{
  const b = body("[https://ex.com/a](https://ex.com/a)", "t");
  check("no nested <a><a>", !/<a\b[^>]*>\s*<a\b/.test(b));
}
// 3. Inline code content stays literal (no bold/link/autolink inside).
{
  const b = body("`a**b**c` and `see https://ex.com/x`", "t");
  check("inline code keeps ** literal", b.includes("<code>a**b**c</code>"));
  check("inline code keeps URL literal", b.includes("<code>see https://ex.com/x</code>"));
}
// 4. Autolink trims trailing punctuation, keeps balanced parens.
{
  const b = body("see https://ex.com/page. and https://en.wikipedia.org/wiki/Foo_(bar) end", "t");
  check("autolink trims trailing period", b.includes('href="https://ex.com/page"'));
  check("autolink keeps balanced parens", b.includes('href="https://en.wikipedia.org/wiki/Foo_(bar)"'));
}
// 5. <title> fully escaped.
{
  const h = head("x", "A & B <C>");
  check("title escapes & and <", h.includes("<title>A &amp; B &lt;C&gt;</title>"));
}
// 6. URL directly followed by inline code: URL stops at the code boundary.
{
  const b = body("go https://ex.com/y`code`then", "t");
  check("URL-adjacent code not swallowed into href", b.includes('<a href="https://ex.com/y">') && b.includes("<code>code</code>"));
}
// 7. Task-list checkbox renders as a real <input>, not literal text.
{
  const b = body("- [ ] todo\n- [x] done", "t");
  check("checkbox renders <input>", b.includes('<input type="checkbox" disabled>') && b.includes('<input type="checkbox" checked disabled>'));
  check("checkbox not literal &lt;input&gt;", !b.includes("&lt;input"));
}
// 8. Empty table cell renders as <td></td>.
{
  const b = body("| A | B |\n|---|---|\n| 1 |  |", "t");
  check("empty table cell ok", b.includes("<td></td>"));
}
// 9. No NUL placeholder leaks into output.
{
  const full = convert("`code1` mid `code2`", "t");
  check("no NUL placeholder leak", !full.includes("\x00"));
}

console.log("\nrender.js — structural invariants:");
{
  const src = fs.readFileSync(path.join(__dirname, "render.js"), "utf8");
  check("deletes stale PDF before render", /fs\.rmSync\(pdfPath/.test(src));
  check("CHROME_BIN has top priority", /if\(process\.env\.CHROME_BIN\)\s*cands\.push/.test(src));
  check("uses pathToFileURL for file arg", /pathToFileURL\(/.test(src));
  check("searches ms-playwright cache", /ms-playwright/.test(src));
  check("forces --headless=new pagination", /--headless=new/.test(src));
  check("judges success by artifact size", /statSync\(pdfPath\)\.size\s*>\s*1000/.test(src));
}

console.log(`\n${fail ? "FAIL" : "PASS"}: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
