// Minimal, dependency-free Markdown -> self-contained HTML converter.
// Supports: headings, hr, fenced code, GFM tables, blockquotes (incl. nested),
// bullet/numbered/checkbox lists, **bold**, `code`, [text](url), bare URLs.
// Usable as a module: require(...).convert(mdString, title) -> htmlString
// Or as CLI: node md2html.js <in.md> <out.html> "<title>"
"use strict";
const fs = require("fs");

function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
// Trim trailing sentence punctuation and unbalanced ')' off an autolinked URL,
// returning [href, trailingText]. Keeps balanced parens (e.g. Wikipedia URLs).
function trimUrl(url){
  let trail = "";
  const p = url.match(/[.,;:!?]+$/);
  if(p){ trail = p[0]; url = url.slice(0, p.index); }
  while(url.endsWith(")") && url.split(")").length > url.split("(").length){
    trail = ")" + trail; url = url.slice(0, -1);
  }
  return [url, trail];
}
function inline(s){
  s = esc(s);
  // Protect inline code first so its content stays literal (no bold/link/autolink inside).
  // NUL-delimited placeholder never appears in source text and is inert to the regexes below.
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_,c)=>{ codes.push(c); return `\x00${codes.length-1}\x00`; });
  s = s.replace(/\*\*([^*]+)\*\*/g, (_,c)=>`<strong>${c}</strong>`);
  s = s.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, (_,t,u)=>`<a href="${u}">${t}</a>`);
  // Autolink bare URLs, but not ones already inside a tag we just emitted.
  // After esc() the only real '>' / '"' / '=' come from those tags, so excluding
  // them in the lookbehind prevents double-wrapping (e.g. link text that is a URL).
  // \x00 excluded so a URL stops at a code placeholder boundary (URL directly followed by `code`).
  s = s.replace(/(?<!["=(>])\bhttps?:\/\/[^\s<\x00]+/g, (m)=>{
    const [url, trail] = trimUrl(m);
    return `<a href="${url}">${url}</a>${trail}`;
  });
  s = s.replace(/\x00(\d+)\x00/g, (_,i)=>`<code>${codes[+i]}</code>`);
  return s;
}
function tableHTML(rows){
  const cells = r => r.replace(/^\||\|$/g,"").split("|").map(c=>c.trim());
  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  let t = "<table><thead><tr>";
  head.forEach(h=>t+=`<th>${inline(h)}</th>`);
  t+="</tr></thead><tbody>";
  body.forEach(r=>{t+="<tr>";r.forEach(c=>t+=`<td>${inline(c)}</td>`);t+="</tr>";});
  return t+"</tbody></table>";
}
function blocks(lines){
  const out=[]; let i=0;
  while(i<lines.length){
    const line=lines[i];
    if(/^\s*$/.test(line)){i++;continue;}
    // fenced code block: ```lang ... ``` — emit verbatim, no inline processing
    let fm;
    if((fm=line.match(/^```+\s*([\w+-]*)\s*$/))){
      const lang=fm[1]; const buf=[]; i++;
      while(i<lines.length && !/^```+\s*$/.test(lines[i])){buf.push(lines[i]);i++;}
      if(i<lines.length) i++; // consume closing fence
      const cls = lang ? ` class="lang-${lang}"` : "";
      out.push(`<pre><code${cls}>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }
    if(/^\|.*\|/.test(line) && i+1<lines.length && /^\|[\s:|-]+\|/.test(lines[i+1])){
      const rows=[];while(i<lines.length&&/^\|.*\|/.test(lines[i])){rows.push(lines[i]);i++;}
      out.push(tableHTML(rows));continue;
    }
    let m;
    if((m=line.match(/^(#{1,6})\s+(.*)$/))){out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);i++;continue;}
    if(/^---+$/.test(line)){out.push("<hr>");i++;continue;}
    if(/^>\s?/.test(line)){
      const buf=[];while(i<lines.length&&/^>\s?/.test(lines[i])){buf.push(lines[i].replace(/^>\s?/,""));i++;}
      out.push(`<blockquote>${blocks(buf)}</blockquote>`);continue;
    }
    if(/^\s*[-*]\s+/.test(line)||/^\s*\d+\.\s+/.test(line)){
      const ordered=/^\s*\d+\.\s+/.test(line);const items=[];
      while(i<lines.length&&(/^\s*[-*]\s+/.test(lines[i])||/^\s*\d+\.\s+/.test(lines[i]))){
        let it=lines[i].replace(/^\s*([-*]|\d+\.)\s+/,"");
        // Extract a task-list checkbox and emit its HTML OUTSIDE inline(), so esc() does not
        // turn it into literal &lt;input&gt; text.
        let box=""; const cb=it.match(/^\[( |x|X)\]\s+/);
        if(cb){ box=`<input type="checkbox"${cb[1].toLowerCase()==="x"?" checked":""} disabled> `; it=it.slice(cb[0].length); }
        items.push(`<li>${box}${inline(it)}</li>`);i++;
      }
      out.push(`<${ordered?"ol":"ul"}>${items.join("")}</${ordered?"ol":"ul"}>`);continue;
    }
    const buf=[line];i++;
    while(i<lines.length&&!/^\s*$/.test(lines[i])&&!/^[#>|-]/.test(lines[i])&&!/^```+/.test(lines[i])&&!/^\s*[-*]\s/.test(lines[i])&&!/^\s*\d+\.\s/.test(lines[i])){buf.push(lines[i]);i++;}
    out.push(`<p>${inline(buf.join(" "))}</p>`);
  }
  return out.join("\n");
}
const CSS = `
:root{--fg:#1a1d21;--muted:#5b6470;--line:#e3e7ec;--accent:#2b6cb0;--bg:#fff;--codebg:#f4f6f8;--th:#f7f9fb;}
*{box-sizing:border-box;}
body{font-family:-apple-system,"Segoe UI","Malgun Gothic","Apple SD Gothic Neo",Roboto,sans-serif;color:var(--fg);background:var(--bg);line-height:1.65;max-width:900px;margin:0 auto;padding:48px 40px;font-size:14.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
h1{font-size:26px;border-bottom:3px solid var(--accent);padding-bottom:12px;margin:0 0 8px;}
h2{font-size:20px;margin:34px 0 12px;padding-bottom:6px;border-bottom:1px solid var(--line);}
h3{font-size:16px;margin:22px 0 8px;color:#2d3540;}
p{margin:8px 0;} a{color:var(--accent);text-decoration:none;}
code{background:var(--codebg);padding:1.5px 5px;border-radius:4px;font-family:"SFMono-Regular",Consolas,monospace;font-size:0.88em;}
pre{background:var(--codebg);border:1px solid var(--line);border-radius:6px;padding:12px 14px;margin:14px 0;overflow-x:auto;line-height:1.5;}
pre code{background:none;padding:0;border-radius:0;font-size:0.86em;white-space:pre;}
hr{border:none;border-top:1px solid var(--line);margin:26px 0;}
blockquote{background:#fff8f0;border:1px solid #f0d9b8;border-left:4px solid #e08a2b;border-radius:6px;padding:12px 18px;margin:16px 0;}
blockquote p{margin:6px 0;}
table{border-collapse:collapse;width:100%;margin:14px 0;font-size:13px;}
th,td{border:1px solid var(--line);padding:7px 10px;text-align:left;vertical-align:top;}
th{background:var(--th);font-weight:600;} tbody tr:nth-child(even){background:#fafbfc;}
ul,ol{margin:8px 0 8px 4px;padding-left:22px;} li{margin:3px 0;}
input[type=checkbox]{margin-right:6px;}
@page{margin:16mm 14mm;}
@media print{body{padding:0;max-width:none;}h2{page-break-after:avoid;}table,blockquote,pre{page-break-inside:avoid;}pre{white-space:pre-wrap;}}
`;
function convert(md, title){
  const body = blocks(md.split("\n"));
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title||"Report")}</title><style>${CSS}</style></head><body>${body}</body></html>`;
}
module.exports = { convert };

if(require.main === module){
  const [,, inPath, outPath, title] = process.argv;
  if(!inPath||!outPath){console.error('usage: node md2html.js <in.md> <out.html> "<title>"');process.exit(1);}
  const html = convert(fs.readFileSync(inPath,"utf8"), title);
  fs.writeFileSync(outPath, html);
  console.log("wrote", outPath, `(${html.length} bytes)`);
}
