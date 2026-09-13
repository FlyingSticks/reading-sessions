// check-the-landscape.js — no dependencies (Node 18+, built-in fetch).
// Verifies the estate map against reality in four tiers:
// (i) OFFLINE: the registry is internally consistent — statuses and territories
//     from the declared vocabularies, paths well-formed and unique, every row
//     carrying a one-sentence claim, seasoning/source/out rows pathless,
//     pending rows exactly the declared punch list;
// (ii) LIVE: every site path the map lists as present resolves in the actual
//     repository (fetched via raw.githubusercontent.com, spaces respected);
// (iii) NEGATIVE: every path the map lists as pending is genuinely absent —
//     the map's picture of reality is asserted in both directions;
// (iv) DEEP: two live check suites are downloaded and re-run end to end
//     (eye-view 89, disc-of-eyes 12), so the audit proves more than
//     reachability. Archive repositories confirmed via the GitHub API.

const fs = require("fs"), path = require("path"), os = require("os");
const { execSync } = require("child_process");

const html = fs.readFileSync(path.join(__dirname, "the-landscape.html"), "utf8");
const m = html.match(/\/\*CORE-BEGIN\*\/([\s\S]*?)\/\*CORE-END\*\//);
if (!m) { console.error("CORE block not found"); process.exit(1); }
const Core = new Function(m[1] + "; return Core;")();
const REG = Core.REG;

let n = 0, failed = 0;
function assert(name, cond, detail) {
  n++;
  if (!cond) failed++;
  console.log(`${String(n).padStart(3)}  ${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "   [" + detail + "]"}`);
}

const RAW = "https://raw.githubusercontent.com/flyingsticks";
const rawURL = p => {
  const [, repo, ...rest] = p.split("/");
  return `${RAW}/${repo}/main/` + rest.map(encodeURIComponent).join("/");
};
async function liveStatus(p){
  const r = await fetch(rawURL(p));
  return r.status;
}

(async () => {
  // ---------------------------------------------------------------- (i) offline
  console.log("— registry consistency —");
  assert("every row has territory, name, claim, status",
    REG.every(r => Core.TERRITORIES.includes(r.t) && r.name && r.claim && r.status));
  assert("every status is from the declared vocabulary",
    REG.every(r => Core.STATUSES.includes(r.status)));
  assert("claims are one sentence apiece (none over 200 characters)",
    REG.every(r => r.claim.length <= 200));
  assert("site paths are well-formed and rooted in the two active repos",
    REG.filter(r => r.path && !r.path.startsWith("http"))
       .every(r => /^\/(reading-sessions|one-congruence-two-readings)\/.+/.test(r.path)));
  {
    const all = [];
    for (const r of REG) if (r.path) { all.push(r.path); (r.also || []).forEach(a => all.push(a)); }
    assert("no address is listed twice", new Set(all).size === all.length,
      all.filter((p, i) => all.indexOf(p) !== i).join(", "));
  }
  assert("seasoning, source, and out rows are pathless — ideas, not files",
    REG.filter(r => ["seasoning", "source", "out"].includes(r.t)).every(r => r.path === null));
  assert("statuses match territories (book=stated, record=record|pending, archive=archive)",
    by("book").every(r => r.status === "stated") &&
    by("record").every(r => r.status === "record" || r.status === "pending") &&
    by("archive").every(r => r.status === "archive"));
  {
    const pend = [];
    for (const r of REG) if (r.status === "pending"){ pend.push(r.path); (r.also || []).forEach(a => pend.push(a)); }
    assert("the punch list is empty — no row anywhere is pending", pend.length === 0, pend.join(", "));
  }
  {
    // "linked" = reachable from the sessions index directly or through a session page.
    // Sources of record: the local filing (index + sessions 5-10 beside this file when
    // present), the live copies otherwise; sessions 1-4 always fetched live.
    const hrefs = new Set();
    const harvest = txt => { for (const m of txt.matchAll(/href="([^"]+)"/g)){
      const h = decodeURIComponent(m[1]);
      if (!h.startsWith("http")) hrefs.add(h.split("/").pop());
    } };
    const localOrLive = async f => {
      const lp = path.join(__dirname, f);
      if (fs.existsSync(lp)) return fs.readFileSync(lp, "utf8");
      return await (await fetch(rawURL("/reading-sessions/" + f))).text();
    };
    harvest(await localOrLive("index.html"));
    for (let i = 1; i <= 10; i++)
      harvest(await localOrLive(`session-${String(i).padStart(2, "0")}.html`));
    const mism = by("shelf").filter(r =>
      r.linked !== hrefs.has(decodeURIComponent(r.path.split("/").pop())));
    assert("every shelf row's linked flag matches reachability from the record",
      by("shelf").every(r => typeof r.linked === "boolean") && mism.length === 0,
      mism.map(r => r.name).join(", "));
  }
  assert("the map spans all seven territories",
    Core.TERRITORIES.every(t => REG.some(r => r.t === t)));

  function by(t){ return REG.filter(r => r.t === t); }

  // ---------------------------------------------------------------- (ii) live
  console.log("— every listed address, against the repositories —");
  for (const r of REG){
    if (!r.path || r.path.startsWith("http") || r.status === "pending") continue;
    const paths = [r.path, ...(r.also || [])];
    const codes = [];
    for (const p of paths) codes.push(await liveStatus(p));
    assert(`live: ${r.name} (${paths.length} file${paths.length > 1 ? "s" : ""})`,
      codes.every(c => c === 200), paths.map((p, i) => `${p}:${codes[i]}`).join(", "));
  }

  // ---------------------------------------------------------------- (iii) negative
  console.log("— pending rows asserted absent (the map's picture, both directions) —");
  for (const r of REG.filter(r => r.status === "pending")){
    const paths = [r.path, ...(r.also || [])];
    const codes = [];
    for (const p of paths) codes.push(await liveStatus(p));
    assert(`pending and genuinely absent: ${r.name}`,
      codes.every(c => c === 404), paths.map((p, i) => `${p}:${codes[i]}`).join(", "));
  }

  // ---------------------------------------------------------------- archives
  console.log("— the five archives —");
  async function repoExists(repo){
    for (const br of ["main", "master"]){
      try {
        const r = await fetch(`https://codeload.github.com/flyingsticks/${repo}/tar.gz/refs/heads/${br}`);
        if (r.body) r.body.cancel().catch(() => {});
        if (r.status === 200) return br;
      } catch (e) { /* try next */ }
    }
    return null;
  }
  for (const r of REG.filter(r => r.t === "archive")){
    const repo = r.path.split("/").pop();
    const br = await repoExists(repo);
    assert(`archive exists: ${repo}`, br !== null, "no reachable branch");
  }

  // ---------------------------------------------------------------- (iv) deep
  console.log("— two live suites re-run end to end —");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "landscape-"));
  const grab = async (p) => {
    const body = await (await fetch(rawURL(p))).text();
    fs.writeFileSync(path.join(tmp, p.split("/").pop()), body);
  };
  await grab("/reading-sessions/eye-view-3d.html");
  await grab("/reading-sessions/check eye view 3d.js");
  await grab("/reading-sessions/check disc of eyes.js");
  const run = f => execSync(`node "${f}"`, { cwd: tmp, encoding: "utf8" });
  assert("the live eye-view suite passes from the repository copy (89, 0 failed)",
    /89 assertions, 0 failed/.test(run("check eye view 3d.js")));
  assert("the live disc-of-eyes suite passes from the repository copy (12, 0 failed)",
    /12 assertions, 0 failed/.test(run("check disc of eyes.js")));

  console.log(`\n${n} assertions, ${failed} failed.`);
  if (!failed){
    const punch = REG.filter(r => r.status === "pending");
    if (punch.length){
      console.log("punch list (pending, asserted absent, audit flips them when they land):");
      punch.forEach(r => [r.path, ...(r.also || [])].forEach(p => console.log("  " + p)));
    }
  }
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error("audit aborted:", e.message); process.exit(1); });
