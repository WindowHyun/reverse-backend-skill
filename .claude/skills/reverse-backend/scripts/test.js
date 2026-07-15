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
const count = (s, re) => (s.match(re) || []).length;

console.log("md2html — rendering regressions:");

// 1. Fenced code block -> <pre><code>, newlines/indentation preserved, no inline processing.
{
  const b = body("```python\ndef foo():\n    return 1  # c\n```", "t");
  check("fenced code -> <pre><code>", b.includes("<pre><code"));
  check("fenced code preserves newline+indent", b.includes("def foo():\n    return 1"));
}
// 2. Link text that is itself a URL: exactly one anchor, no nesting (non-vacuous).
{
  const b = body("[https://ex.com/a](https://ex.com/a)", "t");
  check("link produces exactly one anchor", count(b, /<a\b/g) === 1);
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
  check("checkbox unchecked <input>", b.includes('<li><input type="checkbox" disabled> todo</li>'));
  check("checkbox checked <input>", b.includes('<li><input type="checkbox" checked disabled> done</li>'));
  check("checkbox not literal &lt;input&gt;", !b.includes("&lt;input"));
}
// 8. Bold renders <strong> (core inline path — previously untested).
{
  const b = body("this is **very** bold", "t");
  check("bold -> <strong>", b.includes("this is <strong>very</strong> bold"));
}
// 9. Markdown link href correctness.
{
  const b = body("see [docs](https://ex.com/d) now", "t");
  check("link href + text correct", b.includes('<a href="https://ex.com/d">docs</a>'));
}
// 10. Headings h1..h3 and hr.
{
  const b = body("# H1\n\n## H2\n\n### H3\n\n---", "t");
  check("headings h1/h2/h3", b.includes("<h1>H1</h1>") && b.includes("<h2>H2</h2>") && b.includes("<h3>H3</h3>"));
  check("thematic break -> <hr>", b.includes("<hr>"));
}
// 11. Table structure: thead/th, body td count, inline inside cells.
{
  const b = body("| Name | Note |\n|---|---|\n| a | **x** |", "t");
  check("table has thead + 2 th", count(b, /<th>/g) === 2 && b.includes("<thead>"));
  check("table body row has 2 td", count(b.split("<tbody>")[1] || "", /<td>/g) === 2);
  check("inline rendered inside cell", b.includes("<td><strong>x</strong></td>"));
}
// 12. Empty table cell renders as <td></td>.
{
  const b = body("| A | B |\n|---|---|\n| 1 |  |", "t");
  check("empty table cell ok", b.includes("<td></td>"));
}
// 13. Pipe inside inline code / escaped pipe does not split a table cell.
{
  const b = body("| f | t |\n|---|---|\n| s | `a\\|b` |\n| k | x\\|y |", "t");
  const rows = (b.split("<tbody>")[1] || "").match(/<tr>.*?<\/tr>/g) || [];
  check("code-pipe cell keeps 2 columns", rows.length === 2 && count(rows[0], /<td>/g) === 2);
  check("pipe preserved inside code", b.includes("<code>a|b</code>"));
  check("escaped pipe preserved literal", b.includes("<td>x|y</td>"));
}
// 14. Blockquote and nested blockquote.
{
  const b = body("> outer\n>\n> > inner", "t");
  check("blockquote renders", count(b, /<blockquote>/g) >= 1);
  check("nested blockquote renders", count(b, /<blockquote>/g) === 2);
}
// 15. Ordered vs unordered list.
{
  check("ordered list -> <ol>", body("1. one\n2. two", "t").includes("<ol>"));
  check("bullet list -> <ul>", body("- one\n- two", "t").includes("<ul>"));
}
// 16. No NUL placeholder leaks into output.
{
  const full = convert("`code1` mid `code2`", "t");
  check("no NUL placeholder leak", !full.includes("\x00"));
}

console.log("\nrender.js — structural invariants:");
{
  const src = fs.readFileSync(path.join(__dirname, "render.js"), "utf8");
  check("deletes stale PDF before render", /fs\.rmSync\(pdfPath/.test(src));
  // Order matters: CHROME_BIN must be pushed before the ms-playwright loop and system paths.
  const iChrome = src.indexOf("process.env.CHROME_BIN");
  const iCache = src.indexOf("ms-playwright");
  const iSys = src.indexOf("/usr/bin/chromium");
  check("CHROME_BIN pushed before other candidates", iChrome > 0 && iChrome < iCache && iChrome < iSys);
  check("uses pathToFileURL for file arg", /pathToFileURL\(/.test(src));
  check("searches ms-playwright cache", /ms-playwright/.test(src));
  check("full chrome gets --headless=new", /--headless=new/.test(src));
  check("headless-shell path handled", /headless\[_-\]shell/.test(src) && /isShell/.test(src));
  check("judges success by artifact size", /statSync\(pdfPath\)\.size\s*>\s*1000/.test(src));
}

console.log(`\n${fail ? "FAIL" : "PASS"}: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
