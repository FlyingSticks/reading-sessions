// check_gm_mirror.js — no dependencies.
// Extracts the CORE block from gm-mirror.html and asserts the mirror:
// swaps, fixities, orthogonality, cross-ratio invariance, the eye's image,
// the fold paths, gauges, defects, and the scope guard for the addendum.

const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "gm-mirror.html"), "utf8");
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

const rigs = [
  [0, 150, 355],    // the sketch
  [0, 150, 250],    // the book rig
  [40, 190, 395],   // glass dragged, same distances
  [-25, 60, 500],   // extreme spread
  [450, 150, 355]   // glass beyond both slits
];

for (const [O, Zv, Zh] of rigs) {
  const tag = `rig O=${O}, Zv=${Zv}, Zh=${Zh}`;
  const mn = Core.means(O, Zv, Zh);
  const bd = Core.build(O, Zv, Zh);
  const p2 = mn.power;
  const iv = x => Core.inv(O, p2, x);

  // the involution and its cast
  assert(`${tag}: mirror swaps the slits`, near(iv(Zv), Zh, 1e-10) && near(iv(Zh), Zv, 1e-10));
  assert(`${tag}: mirror swaps AM and HM`,
    near(iv(O + mn.AM), O + mn.HM, 1e-10) && near(iv(O + mn.HM), O + mn.AM, 1e-10));
  assert(`${tag}: GM is fixed`, near(iv(O + mn.GM), O + mn.GM, 1e-10));
  assert(`${tag}: the mirror is an involution (ι∘ι = id)`,
    near(iv(iv(O + 0.37 * mn.a)), O + 0.37 * mn.a, 1e-9));
  assert(`${tag}: axis fixed points at ±GM exactly`,
    near(iv(O - mn.GM), O - mn.GM, 1e-10));

  // fixed circle and orthogonality
  assert(`${tag}: T lies on the mirror (|OT| = GM)`,
    near(Math.hypot(bd.T.x - O, bd.T.y), Math.abs(mn.GM), 1e-9));
  assert(`${tag}: T is fixed by the mirror as a 2D point`,
    (p => near(p.x, bd.T.x, 1e-9) && near(p.y, bd.T.y, 1e-9))(Core.inv2(O, p2, bd.T)));
  assert(`${tag}: equator ⊥ mirror (AM² − GM² = R²)`,
    near(mn.AM * mn.AM - mn.GM * mn.GM, mn.R * mn.R, 1e-8));
  assert(`${tag}: the constructed equator–mirror crossing is T`,
    near(bd.cross.x, bd.T.x, 1e-8) && near(bd.cross.y, bd.T.y, 1e-8));
  // self-inversion of the equator: sample points map back onto it
  {
    let ok = true;
    for (let k = 1; k < 7; k++) {
      const th = k * Math.PI / 7;
      const P = { x: bd.M.x + bd.R * Math.cos(th), y: bd.R * Math.sin(th) };
      const Q = Core.inv2(O, p2, P);
      if (!near(Math.hypot(Q.x - bd.M.x, Q.y), bd.R, 1e-8)) ok = false;
    }
    assert(`${tag}: the equator is carried to itself`, ok);
  }

  // the eye's side of the mirror
  assert(`${tag}: circle on AC inverts to the plane at AM`, (() => {
    for (let k = 1; k < 10; k++) {
      const th = k * Math.PI / 10;
      const P = { x: bd.c1.x + bd.r1 * Math.cos(th), y: bd.r1 * Math.sin(th) };
      if (!near(Core.inv2(O, p2, P).x, O + mn.AM, 1e-8)) return false;
    }
    return true;
  })());
  assert(`${tag}: E inverts to the summit of the equator`,
    (p => near(p.x, bd.summit.x, 1e-8) && near(p.y, bd.summit.y, 1e-8))(Core.inv2(O, p2, bd.E)));

  // projective bookkeeping
  assert(`${tag}: cross-ratio survives the mirror`,
    near(Core.crossRatio(Zv, Zh, bd.Cx, O + mn.GM),
         Core.crossRatio(iv(Zv), iv(Zh), iv(bd.Cx), iv(O + mn.GM)), 1e-8));
  assert(`${tag}: (B,D;C,A) = −1 maps to midpoint-and-infinity (image of C is the midpoint of B, D)`,
    near(iv(bd.Cx), (Zv + Zh) / 2, 1e-8));

  // fold paths: every pair rides a circle orthogonal to the mirror
  {
    let ok = true;
    for (const x of [Zv, bd.Cx, O + 1.7 * mn.b]) {
      const y = iv(x), c = (x + y) / 2, r = Math.abs(y - x) / 2;
      // power of the glass with respect to the pair-circle equals GM²
      if (!near((c - O) * (c - O) - r * r, p2, 1e-8)) ok = false;
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        const P = Core.foldPos(O, p2, x, t);
        if (!near(Math.hypot(P.x - c, P.y), r, 1e-8)) ok = false; // stays on its circle
      }
      const P1 = Core.foldPos(O, p2, x, 1);
      if (!near(P1.x, y, 1e-8) || Math.abs(P1.y) > 1e-8) ok = false; // lands on the partner
    }
    assert(`${tag}: fold paths stay on their pair-circles, all orthogonal to the mirror, landing on the partner`, ok);
  }
  assert(`${tag}: the pair (B, D) rides the equator itself`, (() => {
    for (const t of [0.2, 0.5, 0.8]) {
      const P = Core.foldPos(O, p2, Zv, t);
      if (!near(Math.hypot(P.x - bd.M.x, P.y), bd.R, 1e-8)) return false;
    }
    return true;
  })());

  // reciprocation is the mirror in the rig's unit: the means of (1/a, 1/b)
  // are the reciprocals of the swapped means of (a, b), and ι = ab · reciprocation
  {
    const rm = Core.means(0, 1 / mn.a, 1 / mn.b);
    const ok = near(rm.AM, 1 / mn.HM, 1e-9) && near(rm.HM, 1 / mn.AM, 1e-9)
      && near(Math.abs(rm.GM), 1 / Math.abs(mn.GM), 1e-9)
      && near(Core.inv(O, p2, O + mn.a), O + p2 * (1 / mn.a), 1e-9);
    assert(`${tag}: reciprocation = mirror in the rig's unit (ι = ab · reciprocal)`, ok);
  }
}

// ---------------------------------------------------------------- gauges
{
  const b0 = Core.build(0, 150, 355);
  const b1 = Core.build(40, 190, 395);
  assert("gauge: recentring the glass carries the mirror (radius GM unchanged)",
    near(b0.g, b1.g));
  assert("gauge: the fold path is a choice — the endpoints are the map",
    (() => {
      // a different road (straight segment) reaches the same endpoint
      const x = 469, y = Core.inv(0, 150 * 355, x);
      const P = Core.foldPos(0, 150 * 355, x, 1);
      return near(P.x, y, 1e-8); // the semicircle and the segment agree where it matters
    })());
}

// ---------------------------------------------------------------- defects
{
  const O = 200, Zv = 150, Zh = 355;           // glass between the slits
  const mn = Core.means(O, Zv, Zh);
  assert("defect: glass between the slits → power < 0, mirror radius imaginary",
    mn.power < 0 && Number.isNaN(Core.build(O, Zv, Zh).g));
  const iv = x => Core.inv(O, mn.power, x);
  assert("defect: the anti-mirror still swaps the slits",
    near(iv(Zv), Zh, 1e-10) && near(iv(Zh), Zv, 1e-10));
  assert("defect: the anti-mirror has no real fixed point on the axis",
    (x => (x - O) * (iv(x) - O) < 0)(230)); // image always on the far side of the glass
  const pin = Core.means(0, 200, 200.000001); // pinhole limit
  const ivp = x => Core.inv(0, pin.power, x);
  assert("defect: at the pinhole the slits fall onto the mirror and stop trading",
    near(ivp(200), 200.000001, 1e-9) && Math.abs(ivp(200) - 200) < 1e-4);
}

// ---------------------------------------------------------------- scope guard for the addendum
{
  // The diagonal points of the square (glass and virtual centre) are NOT the
  // measuring points of the two-point method: |BA| ≠ |BE| already at the sketch rig.
  const bd = Core.build(0, 150, 355);
  const BA = Math.abs(150 - 0);
  const BE = Math.hypot(bd.E.x - 150, bd.E.y);
  assert("scope guard: |BA| ≠ |BE| — diagonal points are not measuring points",
    Math.abs(BA - BE) > 1, `BA=${BA}, BE=${BE.toFixed(2)}`);
}

console.log(`\n${n} assertions, ${failed} failed.`);
process.exit(failed ? 1 : 0);
