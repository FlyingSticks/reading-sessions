// check_three_means_here.js — no dependencies.
// Extracts the CORE block from three-means-here.html and asserts the geometry
// the plate draws: the three means, the tangency, the harmonic range, the
// orthogonal circles, the square's fourth-ray landing, the scales law,
// reciprocation, gauge covariance, and the defects.

const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "three-means-here.html"), "utf8");
const m = html.match(/\/\*CORE-BEGIN\*\/([\s\S]*?)\/\*CORE-END\*\//);
if (!m) { console.error("CORE block not found"); process.exit(1); }
const Core = new Function(m[1] + "; return Core;")();

let n = 0, failed = 0;
function assert(name, cond, detail) {
  n++;
  const tag = cond ? "PASS" : "FAIL";
  if (!cond) failed++;
  console.log(`${String(n).padStart(2)}  ${tag}  ${name}${cond ? "" : "   [" + detail + "]"}`);
}
const near = (x, y, tol = 1e-9) =>
  Math.abs(x - y) <= tol * Math.max(1, Math.abs(x), Math.abs(y));

// ---------------------------------------------------------------- sketch rig
{
  const mn = Core.means(0, 150, 355);
  assert("sketch rig: HM = 210.891… as annotated", near(mn.HM, 106500 / 505), mn.HM);
  assert("sketch rig: HM rounds to the sketch's 210.9", Math.round(mn.HM * 10) / 10 === 210.9, mn.HM);
  assert("sketch rig: GM = 230.759…", near(mn.GM, Math.sqrt(53250)), mn.GM);
  assert("sketch rig: AM = 252.5 as annotated", mn.AM === 252.5, mn.AM);
  assert("sketch rig: ordering HM < GM < AM", mn.HM < mn.GM && mn.GM < mn.AM);
}

// rigs to sweep: [O, Zv, Zh]
const rigs = [
  [0, 150, 355],   // the sketch
  [0, 150, 250],   // the book rig
  [40, 190, 395],  // glass dragged, same distances
  [-25, 60, 500],  // extreme spread
  [0, 149.5, 150.5], // near-pinhole
  [450, 150, 355]  // glass beyond both slits (signed gauge)
];

for (const [O, Zv, Zh] of rigs) {
  const tag = `rig O=${O}, Zv=${Zv}, Zh=${Zh}`;
  const mn = Core.means(O, Zv, Zh);
  const bd = Core.build(O, Zv, Zh);

  assert(`${tag}: closing law AM·HM = GM²`, near(mn.AM * mn.HM, mn.GM * mn.GM));
  assert(`${tag}: power of the glass = ab`, near(mn.power, mn.a * mn.b));
  assert(`${tag}: AM² − GM² = R²`, near(mn.AM * mn.AM - mn.GM * mn.GM, mn.R * mn.R, 1e-8));
  assert(`${tag}: defect AM − HM = 2R²/(a+b)`,
    near(mn.AM - mn.HM, 2 * mn.R * mn.R / (mn.a + mn.b), 1e-8));

  // constructed tangency
  const T = bd.T;
  assert(`${tag}: tangent exists (power > 0)`, !!T);
  assert(`${tag}: |OT|² = power (tangent length = GM)`,
    near((T.x - O) ** 2 + T.y ** 2, mn.power, 1e-8));
  assert(`${tag}: tangent ⟂ radius at T`,
    Math.abs((T.x - O) * (T.x - bd.M.x) + T.y * T.y) < 1e-6 * Math.abs(mn.power));
  assert(`${tag}: foot of T lands at O + HM`, near(T.x, O + mn.HM, 1e-8));
  assert(`${tag}: polar law (T−M)·(O−M) = R²`,
    near((T.x - bd.M.x) * (O - bd.M.x), mn.R * mn.R, 1e-8));
  assert(`${tag}: touch height² = GM² − HM²`,
    near(T.y * T.y, mn.GM * mn.GM - mn.HM * mn.HM, 1e-8));

  // harmonic range and orthogonal circles
  assert(`${tag}: (B, D; C, A) = −1 with C the drawn foot`,
    near(Core.crossRatio(Zv, Zh, bd.Cx, O), -1, 1e-8));
  assert(`${tag}: circle on AC ⟂ circle on BD`,
    near((bd.M.x - bd.c1.x) ** 2, bd.r1 ** 2 + bd.R ** 2, 1e-8));
  const E = bd.E;
  assert(`${tag}: eye E exists (orthogonal circles meet)`, !!E);
  assert(`${tag}: E on the sphere's equator`,
    near(Math.hypot(E.x - bd.M.x, E.y), bd.R, 1e-8));
  assert(`${tag}: E sees the slits at 90°`,
    Math.abs(Core.angleAt(E, { x: Zv, y: 0 }, { x: Zh, y: 0 }) - 90) < 1e-6);
  assert(`${tag}: E sees glass and virtual centre at 90°`,
    Math.abs(Core.angleAt(E, { x: O, y: 0 }, { x: bd.Cx, y: 0 }) - 90) < 1e-6);

  // the square: fourth ray lands on the glass for arbitrary S, t
  let landings = true;
  for (const [sx, sy, t] of [[0.55, 0.62, 0.45], [0.3, 1.1, 0.7], [1.4, -0.8, 0.2]]) {
    const S = { x: O + sx * mn.a, y: sy * Math.abs(mn.a) };
    const q = Core.square(O, Zv, Zh, bd.Cx, S, t);
    if (!q.S3) { landings = false; break; }
    const d = Core.distToLine(q.A, q.S2, q.S3) / Math.hypot(Zh - O, mn.R);
    if (d > 1e-8) landings = false;
  }
  assert(`${tag}: second diagonal lands on A for arbitrary starts`, landings);

  // scales law at several probe depths
  let scalesOK = true;
  for (const z of [O + 20, 320, 469, 800]) {
    const lhs = (Core.recipScale(z, Zv, O) + Core.recipScale(z, Zh, O)) / 2;
    const rhs = Core.recipScale(z, O + mn.HM, O);
    if (!near(lhs, rhs, 1e-10)) scalesOK = false;
  }
  assert(`${tag}: mean 1/scale = 1/scale of pinhole at z*`, scalesOK);

  // the ledger itself closes
  const rows = Core.checks(bd, 469);
  assert(`${tag}: all 9 ledger residuals < 1e-7`,
    rows.every(r => r.res !== null && r.res < 1e-7),
    rows.map(r => r.res && r.res.toExponential(1)).join(", "));
}

// ---------------------------------------------------------------- laws with names
{
  const [O, Zv, Zh] = [0, 150, 355];
  const mn = Core.means(O, Zv, Zh);
  // reciprocation swaps AM and HM and fixes GM
  const ra = 1 / mn.a, rb = 1 / mn.b;
  assert("reciprocation: AM of rates = 1/HM of depths", near((ra + rb) / 2, 1 / mn.HM));
  assert("reciprocation: HM of rates = 1/AM of depths",
    near(2 * ra * rb / (ra + rb), 1 / mn.AM));
  assert("reciprocation: GM is self-dual", near(Math.sqrt(ra * rb), 1 / mn.GM));
}

// ---------------------------------------------------------------- gauges
{
  const m0 = Core.means(0, 150, 355);
  const m1 = Core.means(40, 190, 395);   // same distances, glass moved
  assert("gauge: means are means of distances from the glass",
    near(m0.HM, m1.HM) && near(m0.GM, m1.GM) && near(m0.AM, m1.AM));
  const mSwap = Core.means(0, 355, 150); // relabel which slit is which
  assert("gauge: means symmetric under swapping the slits",
    near(m0.HM, mSwap.HM) && near(m0.AM, mSwap.AM) && near(m0.GM * m0.GM, mSwap.GM * mSwap.GM));
}

// ---------------------------------------------------------------- defects
{
  const mid = Core.means(200, 150, 355); // glass between the slits
  assert("defect: glass between the slits → power < 0", mid.power < 0);
  assert("defect: GM leaves the reals there", Number.isNaN(mid.GM));
  assert("defect: build refuses to draw a tangent there",
    Core.build(200, 150, 355).T === null);
  const on = Core.means(150, 150, 355);  // glass on a slit
  assert("defect: glass on a slit → power = 0, tangent length 0", on.power === 0);
  const pin = Core.means(0, 200, 200.000001); // pinhole limit
  assert("defect: pinhole limit fuses the means",
    Math.abs(pin.AM - pin.HM) < 1e-5 && Math.abs(pin.AM - pin.GM) < 1e-5);
  assert("defect: AM − HM → 0 exactly with R²", near(pin.AM - pin.HM, 2 * pin.R * pin.R / (pin.a + pin.b), 1e-6));
}

console.log(`\n${n} assertions, ${failed} failed.`);
process.exit(failed ? 1 : 0);
