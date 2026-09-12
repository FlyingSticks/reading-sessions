// check_degeneration_ledger.js — no dependencies.
// Extracts the CORE block from degeneration-ledger.html and asserts:
// (i) the laws that are exact at every ε; (ii) the convergence RATES claimed
// in the ledger's third column, by comparing deviations across a decade of ε;
// (iii) the limits themselves; (iv) the asymmetric approach; (v) counts.

const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "degeneration-ledger.html"), "utf8");
const m = html.match(/\/\*CORE-BEGIN\*\/([\s\S]*?)\/\*CORE-END\*\//);
if (!m) { console.error("CORE block not found"); process.exit(1); }
const Core = new Function(m[1] + "; return Core;")();

let n = 0, failed = 0;
function assert(name, cond, detail) {
  n++;
  if (!cond) failed++;
  console.log(`${String(n).padStart(2)}  ${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "   [" + detail + "]"}`);
}
const near = (x, y, tol = 1e-9) =>
  Math.abs(x - y) <= tol * Math.max(1, Math.abs(x), Math.abs(y));
// deviation ratio across one decade of ε: ~10 for O(ε), ~100 for O(ε²)
const linear = r => r > 4 && r < 25;
const quadratic = r => r > 40 && r < 250;

const P = 252.5, O = 0, t = 0.45;
const epses = [10, 1, 0.1, 0.01];
const bds = epses.map(e => Core.rig(P, e, O));
const Ls = bds.map(bd => Core.ledger(bd));

// ---------------------------------------------------------------- exact at every ε
for (let i = 0; i < epses.length; i++) {
  const e = epses[i], bd = bds[i], L = Ls[i];
  const tag = `ε=${e}`;
  assert(`${tag}: (B, D; C, A) = −1 exactly`, Math.abs(L.cr + 1) < 1e-7, L.cr);
  assert(`${tag}: closing law AM × HM = GM²`,
    near(bd.mn.AM * bd.mn.HM, bd.mn.GM * bd.mn.GM, 1e-9));
  assert(`${tag}: defect identity AM − HM = ε²/P`,
    near(bd.mn.AM - bd.mn.HM, e * e / P, 1e-6));
  assert(`${tag}: equator = unit circle of the chart`, near(L.Runit, 1, 1e-12));
  assert(`${tag}: fourth ray lands on A, true scale`,
    bd.quad.S3 && Core.distToLine(bd.quad.A, bd.quad.S2, bd.quad.S3) / P < 1e-7);
  assert(`${tag}: fourth ray lands on A, chart`, (() => {
    const cs = Core.chartSquare(bd, { x: -0.6, y: 1.35 }, t);
    return cs.S3 && Core.distToLine(cs.A, cs.S2, cs.S3) / Math.abs(cs.A.x) < 1e-9;
  })());
  assert(`${tag}: circle on AC ⟂ circle on BD`,
    Math.abs((bd.M.x - bd.c1.x) ** 2 - bd.r1 ** 2 - bd.R ** 2) / (bd.R ** 2) < 1e-6);
  assert(`${tag}: ∠AFP = 90° — Thales on the survivor`,
    Math.abs(Core.angleAt(bd.F, { x: O, y: 0 }, { x: P, y: 0 }) - 90) < 1e-8);
  assert(`${tag}: F lies on the circle on glass–pinhole`,
    near(Math.hypot(bd.F.x - P / 2, bd.F.y), P / 2, 1e-9));
  assert(`${tag}: mirror swaps the slits`,
    near(Core.inv(O, bd.mn.power, bd.Zv), bd.Zh, 1e-10));
}

// ---------------------------------------------------------------- limits
{
  const L = Ls[3]; // ε = 0.01
  assert("limit: means progression ratio → 1", Math.abs(L.prog - 1) < 1e-6, L.prog);
  assert("limit: C marches to the chart midpoint 0", Math.abs(L.Cu) < 1e-3, L.Cu);
  assert("limit: A exiled — |Au| beyond 10⁴", Math.abs(L.Au) > 1e4, L.Au);
  assert("limit: eye at the summit — |E − (0,1)| < 10⁻³", L.dE < 1e-3, L.dE);
  assert("limit: touch point at the summit too", L.dT < 1e-3, L.dT);
  assert("limit: mirror crease — max|ι(u) + u| < 10⁻³", L.crease < 1e-3, L.crease);
  assert("limit: chart square's second diagonal turns horizontal", Math.abs(L.slope) < 1e-3, L.slope);
  assert("limit: meeting fractions → 1 − t", 
    Math.abs(L.meetFrac - (1 - t)) < 1e-9 && Math.abs(L.meetFrac3 - (1 - t)) < 1e-3);
  assert("limit: tip fraction → (1 − t)/(1 + t)",
    Math.abs(L.tipFrac - (1 - t) / (1 + t)) < 1e-3, L.tipFrac);
  assert("limit: tangent elevation → 0", Math.abs(L.elev) < 0.01, L.elev);
  assert("limit: orthogonality → incidence (P on the surviving circle)", L.incid < 1e-4, L.incid);
  assert("limit: GM − P dies at −ε²/(2P)",
    near(bds[3].mn.GM - P, -0.01 * 0.01 / (2 * P), 1e-4));
}

// ---------------------------------------------------------------- rates across a decade
{
  const dev = (f) => [f(Ls[1], bds[1]), f(Ls[2], bds[2])]; // ε = 1 vs ε = 0.1
  const rate = (f) => { const [a, b] = dev(f); return Math.abs(a / b); };
  assert("rate: means spread AM − HM is O(ε²)", quadratic(rate(L => L.spread)), rate(L => L.spread));
  assert("rate: progression deviation |ratio − 1| is O(ε²)",
    quadratic(rate(L => L.prog - 1)), rate(L => L.prog - 1));
  assert("rate: C's chart march is O(ε)", linear(rate(L => L.Cu)), rate(L => L.Cu));
  assert("rate: eye's climb |E − (0,1)| is O(ε)", linear(rate(L => L.dE)), rate(L => L.dE));
  assert("rate: touch point's climb is O(ε)", linear(rate(L => L.dT)), rate(L => L.dT));
  assert("rate: mirror crease gap is O(ε)", linear(rate(L => L.crease)), rate(L => L.crease));
  assert("rate: second-diagonal slope is O(ε)", linear(rate(L => L.slope)), rate(L => L.slope));
  assert("rate: meeting-fraction deviation is O(ε)",
    linear(rate(L => L.meetFrac3 - (1 - t))), rate(L => L.meetFrac3 - (1 - t)));
  assert("rate: tip-fraction deviation is O(ε)",
    linear(rate(L => L.tipFrac - (1 - t) / (1 + t))), rate(L => L.tipFrac - (1 - t) / (1 + t)));
  assert("rate: tangent elevation is O(ε)", linear(rate(L => L.elev)), rate(L => L.elev));
  assert("rate: incidence gap is O(ε²)", quadratic(rate(L => L.incid)), rate(L => L.incid));
  assert("rate: channel gap is O(ε)", linear(rate(L => L.chGap)), rate(L => L.chGap));
}

// ---------------------------------------------------------------- the asymmetric approach
{
  // B = P − ε, D = P + 2ε: the chart range tends to (−1, +2; ½, ∞) — still harmonic,
  // C marching to the midpoint of the blown-up slits.
  for (const e of [1, 0.01]) {
    const Zv = P - e, Zh = P + 2 * e;
    const mn = Core.means(O, Zv, Zh);
    const T = Core.tangentTouch(O, Zv, Zh);
    const Cu = (T.x - P) / e;
    assert(`asym ε=${e}: cross-ratio still −1`,
      Math.abs(Core.crossRatio(Zv, Zh, T.x, O) + 1) < 1e-6);
    if (e === 0.01)
      assert("asym limit: C marches to ½ — the midpoint of (−1, +2)",
        Math.abs(Cu - 0.5) < 1e-3, Cu);
  }
}

// ---------------------------------------------------------------- counts
{
  const bd = bds[3], L = Ls[3];
  const pts = [bd.Zv, bd.Zh, bd.Cx, O];
  let distinct = true;
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++)
    if (Math.abs(pts[i] - pts[j]) < 1e-12) distinct = false;
  assert("count: 4 range points distinct at every ε > 0", distinct);
  const cpts = [-1, 1, L.Cu, L.Au];
  distinct = true;
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++)
    if (Math.abs(cpts[i] - cpts[j]) < 1e-6) distinct = false;
  assert("count: 4 chart points distinct, one heading to ∞", distinct);
  assert("count: all 14 ledger quantities are finite at every ε tested",
    bds.every(b => {
      const v = Core.ledger(b);
      return ["gap","spread","prog","cr","Cu","Au","Runit","dE","dT","crease",
              "slope","meetFrac","tipFrac","chGap"].every(k => Number.isFinite(v[k]));
    }));
}

console.log(`\n${n} assertions, ${failed} failed.`);
process.exit(failed ? 1 : 0);
