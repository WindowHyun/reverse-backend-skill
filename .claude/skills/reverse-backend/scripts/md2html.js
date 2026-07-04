// Minimal, dependency-free Markdown -> self-contained HTML converter.
// Supports: headings, hr, GFM tables, blockquotes (incl. nested tables),
// bullet/numbered/checkbox lists, **bold**, `code`, [text](url), bare URLs.
// Usable as a module: require(...).convert(mdString, title) -> htmlString
// Or as CLI: node md2html.js <in.md> <out.html> "<title>"
"use strict";
const fs = require("fs");

function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function inline(s){
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, (_,c)=>`<code>${c}</code>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, (_,c)=>`<strong>${c}</strong>`);
  s = s.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, (_,t,u)=>`<a href="${u}">${t}</a>`);
  s = s.replace(/(?<!["=(])\b(https?:\/\/[^\s<)]+)/g, (m)=>`<a href="${m}">${m}</a>`);
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
        it=it.replace(/^\[ \]\s*/,'<input type="checkbox" disabled> ').replace(/^\[x\]\s*/i,'<input type="checkbox" checked disabled> ');
        items.push(`<li>${inline(it)}</li>`);i++;
      }
      out.push(`<${ordered?"ol":"ul"}>${items.join("")}</${ordered?"ol":"ul"}>`);continue;
    }
    const buf=[line];i++;
    while(i<lines.length&&!/^\s*$/.test(lines[i])&&!/^[#>|-]/.test(lines[i])&&!/^\s*[-*]\s/.test(lines[i])&&!/^\s*\d+\.\s/.test(lines[i])){buf.push(lines[i]);i++;}
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
hr{border:none;border-top:1px solid var(--line);margin:26px 0;}
blockquote{background:#fff8f0;border:1px solid #f0d9b8;border-left:4px solid #e08a2b;border-radius:6px;padding:12px 18px;margin:16px 0;}
blockquote p{margin:6px 0;}
table{border-collapse:collapse;width:100%;margin:14px 0;font-size:13px;}
th,td{border:1px solid var(--line);padding:7px 10px;text-align:left;vertical-align:top;}
th{background:var(--th);font-weight:600;} tbody tr:nth-child(even){background:#fafbfc;}
ul,ol{margin:8px 0 8px 4px;padding-left:22px;} li{margin:3px 0;}
input[type=checkbox]{margin-right:6px;}
@page{margin:16mm 14mm;}
@media print{body{padding:0;max-width:none;}h2{page-break-after:avoid;}table,blockquote{page-break-inside:avoid;}}
`;
function convert(md, title){
  const body = blocks(md.split("\n"));
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${(title||"Report").replace(/</g,"&lt;")}</title><style>${CSS}</style></head><body>${body}</body></html>`;
}
module.exports = { convert };

if(require.main === module){
  const [,, inPath, outPath, title] = process.argv;
  if(!inPath||!outPath){console.error('usage: node md2html.js <in.md> <out.html> "<title>"');process.exit(1);}
  const html = convert(fs.readFileSync(inPath,"utf8"), title);
  fs.writeFileSync(outPath, html);
  console.log("wrote", outPath, `(${html.length} bytes)`);
}
