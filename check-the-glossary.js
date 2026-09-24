// check-the-glossary.js — no dependencies (Node 18+, built-in fetch).
// The glossary defines nothing; it quotes. This check holds it to that:
// (i) every glossary on its sources — the book's glossary and each shelf page it
//     names — is re-extracted from the repositories, and every sense found there
//     must appear in this page verbatim (as text), beside a link to its source;
// (ii) nothing appears here that no source says — every sense on this page is
//     traced back to a source sense;
// (iii) anchors are unique, every shelf link resolves in the repository, and every
//     book link lands on an anchor the book's glossary actually carries.
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "glossary.html"), "utf8");
let n = 0, failed = 0;
function assert(name, cond, detail){ n++; if (!cond) failed++;
  if (!cond) console.log(`${String(n).padStart(4)}  FAIL  ${name}   [${detail || ""}]`); }
const ent = s => s.replace(/&#(\d+);/g,(m,d)=>String.fromCodePoint(+d)).replace(/&#x([0-9a-f]+);/gi,(m,h)=>String.fromCodePoint(parseInt(h,16)))
  .replace(/&nbsp;/g,"\u00a0").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'")
  .replace(/&([a-zA-Z]+);/g,(m,e)=>({mdash:"—",ndash:"–",rsquo:"’",lsquo:"‘",ldquo:"“",rdquo:"”",middot:"·",times:"×",minus:"−",infin:"∞",
    sup2:"²",sup3:"³",hellip:"…",rarr:"→",larr:"←",harr:"↔",le:"≤",ge:"≥",ne:"≠",asymp:"≈",equiv:"≡",radic:"√",prime:"′",Prime:"″",
    frac12:"½",frac14:"¼",frac34:"¾",frasl:"⁄",deg:"°",plusmn:"±",sdot:"⋅",thinsp:"\u2009",ensp:"\u2002",emsp:"\u2003",isin:"∈",
    part:"∂",sum:"∑",prod:"∏",lfloor:"⌊",rfloor:"⌋",lceil:"⌈",rceil:"⌉",perp:"⊥",ouml:"ö",eacute:"é",epsilon:"ε",Delta:"Δ",delta:"δ",
    lambda:"λ",mu:"μ",sigma:"σ",rho:"ρ",tau:"τ",theta:"θ",pi:"π",phi:"φ",alpha:"α",beta:"β",gamma:"γ",omega:"ω",Omega:"Ω",sect:"§",
    uarr:"↑",darr:"↓",cap:"∩",cup:"∪",sub:"⊂",sup:"⊃",nbsp:"\u00a0",laquo:"«",raquo:"»",bull:"•",hArr:"⇔",rArr:"⇒",lArr:"⇐",
    Sigma:"Σ",Lambda:"Λ",Gamma:"Γ",Theta:"Θ",Phi:"Φ",Psi:"Ψ",psi:"ψ",chi:"χ",zeta:"ζ",eta:"η",kappa:"κ",nu:"ν",xi:"ξ",
    omicron:"ο",upsilon:"υ",iota:"ι",auml:"ä",uuml:"ü",szlig:"ß",aacute:"á",iacute:"í",oacute:"ó",uacute:"ú",ccedil:"ç",
    egrave:"è",agrave:"à",ecirc:"ê"}[e] ?? m));
const text = s => ent(s.replace(/<[^>]+>/g,"")).replace(/\s+/g," ").trim();
const strip = s => s.replace(/<span class="(?:tag|ch)[^"]*"[^>]*>[\s\S]*?<\/span>/g,"");
const RAW = "https://raw.githubusercontent.com/FlyingSticks";
const SUP = new Set(["the-hinge-v1.html","the-hinge-v6.html","one-hinge-two-banks-v1.html","one-hinge-two-banks-v2.html",
  "bones-of-the-rig-v1.html","bones-of-the-rig-v2.html","rate-loop-v1.html"]);
const CENSUS_ROW = new Set(["quantity","space","currencies","currency","zero set","status","obeys","quarrel"]);

// this page's senses: dd text minus its trailing source link
const here = [];
for (const m of html.matchAll(/<dd>([\s\S]*?)<\/dd>/g)){
  const src = m[1].match(/<a class="src[^"]*" href="([^"]+)"/);
  const body = m[1].replace(/<a class="src[\s\S]*$/,"");
  here.push({ d: text(body), href: src ? src[1] : null });
}
(async () => {
  const get = async u => { const r = await fetch(u); return { ok: r.ok, body: r.ok ? await r.text() : "" }; };
  // sources: the book's glossary and every shelf page this page links as a source
  const book = await get(`${RAW}/one-congruence-two-readings/main/glossary.html`);
  assert("the book's glossary is reachable", book.ok);
  const shelf = [...new Set(here.map(h => h.href).filter(h => h && !h.startsWith("http")))];
  const srcSenses = [];
  const pull = (t, f) => {
    for (const m of t.matchAll(/<dt([^>]*)>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g)){
      const tagged = /class="(?:tag|ch)/.test(m[2]), term = text(strip(m[2]));
      if (f === "the-defect-census.html" && !tagged && CENSUS_ROW.has(term.toLowerCase())) continue;
      srcSenses.push({ f, term, d: text(strip(m[3])) });
    }
    for (const m of t.matchAll(/<div class="t">([\s\S]*?)<\/div>\s*<div>([\s\S]*?)<\/div>/g))
      srcSenses.push({ f, term: text(m[1]), d: text(m[2]) });
  };
  pull(book.body, "BOOK");
  const bookAnchors = new Set([...book.body.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
  for (const f of shelf){
    const r = await get(`${RAW}/reading-sessions/main/${encodeURIComponent(f)}`);
    assert(`shelf source resolves: ${f}`, r.ok);
    assert(`shelf source is current, not a superseded version: ${f}`, !SUP.has(f));
    pull(r.body, f);
  }
  const hereText = new Set(here.map(h => h.d));
  // (i) every source sense appears here, verbatim, linked to its own source
  for (const s of srcSenses){
    const found = here.some(h => h.d === s.d && (s.f === "BOOK" ? (h.href||"").includes("one-congruence-two-readings") : h.href === s.f)
      || (h.d === s.d));
    assert(`quoted verbatim: ${s.term} (${s.f})`, found && hereText.has(s.d), s.d.slice(0,80));
  }
  // (ii) nothing here that no source says
  const srcText = new Set(srcSenses.map(s => s.d));
  for (const h of here) assert(`traced to a source: ${h.d.slice(0,50)}`, srcText.has(h.d), h.href);
  // (iii) anchors unique; book links land on real anchors
  const ids = [...html.matchAll(/<dt id="([^"]+)"/g)].map(m => m[1]);
  assert("term anchors are unique", new Set(ids).size === ids.length);
  for (const m of html.matchAll(/href="https:\/\/flyingsticks\.github\.io\/one-congruence-two-readings\/glossary\.html#([^"]+)"/g))
    assert(`book anchor exists: #${m[1]}`, bookAnchors.has(m[1]));
  console.log(`${n} assertions, ${failed} failed. (${srcSenses.length} source senses; ${here.length} senses on this page; ${ids.length} terms)`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error("check aborted:", e.message); process.exit(1); });
