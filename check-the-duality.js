// check-the-duality.js — no dependencies. Extracts the CORE from the-duality.html
// and asserts the axis face of the means-sphere polarity that the plate draws live.
// The full 3D audit (mutual polarity of the slits, the congruence mapped to the dual
// congruence, harmonic commutation, involution in space) is check-sphere-duality.js
// (32/32); this file verifies the plate's own construction matches that theorem on
// the axis, across rigs and across the fold.

const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "the-duality.html"), "utf8");
const Core = new Function(html.match(/\/\*CORE-BEGIN\*\/([\s\S]*?)\/\*CORE-END\*\//)[1] + "; return Core;")();

let n = 0, failed = 0;
const assert = (name, cond, detail) => {
  n++; if (!cond) failed++;
  console.log(`${String(n).padStart(2)}  ${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "   [" + detail + "]"}`);
};
const near = (x, y, t = 1e-9) => Math.abs(x - y) <= t * Math.max(1, Math.abs(x), Math.abs(y));

for (const [O, Zv, Zh] of [[0, 150, 355], [0, 150, 250], [40, 190, 395]]) {
  const tag = `rig O=${O}, Zv=${Zv}, Zh=${Zh}`;
  const bd = Core.build(O, Zv, Zh);
  const { mn, M, R, zstar, T } = bd;

  // the equator inversion is the polarity's axis trace
  assert(`${tag}: σ swaps glass ↔ neutral surface`, near(Core.sigma(bd, O), zstar, 1e-9));
  assert(`${tag}: σ fixes each slit (B, D on the sphere)`,
    near(Core.sigma(bd, Zv), Zv, 1e-9) && near(Core.sigma(bd, Zh), Zh, 1e-9));
  assert(`${tag}: σ is an involution — σ(σ(x)) = x`,
    [O, zstar, Zv, Zh, O + mn.GM, M.x + 30].every(x => near(Core.sigma(bd, Core.sigma(bd, x)), x, 1e-6)));

  // the closing law as pole–polar
  assert(`${tag}: AM × HM = GM²`, near(mn.AM * mn.HM, mn.GM * mn.GM, 1e-9));
  assert(`${tag}: (AM − glass)(AM − neutral) = R²`,
    near((M.x - O) * (M.x - zstar), R * R, 1e-9));

  // GM self-inverse, T fixed, E self-conjugate
  assert(`${tag}: AM² − GM² = R² — GM the tangent length, fixed by the GM-circle inversion`,
    near(mn.AM * mn.AM - mn.GM * mn.GM, R * R, 1e-6));
  assert(`${tag}: T lies on both the equator and the GM circle`,
    T && near(Math.hypot(T.x - M.x, T.y), R, 1e-7) && near(Math.hypot(T.x - O, T.y), mn.GM, 1e-7));
  assert(`${tag}: E is self-conjugate — on the equator`,
    bd.E2 && near(Math.hypot(bd.E2.x - M.x, bd.E2.y), R, 1e-7));

  // harmonic range
  assert(`${tag}: (B, D; neutral, glass) = −1`,
    near(Core.crossRatio(Zv, Zh, zstar, O), -1, 1e-9));

  // the fold: endpoints are rig and dual; E never leaves the equator; conjugate pairs land on their partners
  assert(`${tag}: fold t=0 puts each pair-point on the axis (the rig)`,
    [O, zstar, Zv, Zh].every(x => near(Core.foldPoint(bd, x, 0).y, 0, 1e-9)
      && near(Core.foldPoint(bd, x, 0).x, x, 1e-9)));
  assert(`${tag}: fold t=1 carries each point to its conjugate (the dual)`,
    [O, zstar, Zv, Zh].every(x => near(Core.foldPoint(bd, x, 1).x, Core.sigma(bd, x), 1e-7)
      && near(Core.foldPoint(bd, x, 1).y, 0, 1e-7)));
  assert(`${tag}: E stays on the equator for every fold value`,
    [0, 0.25, 0.5, 0.75, 1].every(t => {
      const e = Core.foldE(bd, t);
      return e && near(Math.hypot(e.x - M.x, e.y), R, 1e-7);
    }));
  assert(`${tag}: at t=1 E reaches the summit of the equator`,
    (() => { const e = Core.foldE(bd, 1); return near(e.x, M.x, 1e-6) && near(e.y, R, 1e-6); })());

  // every live check the plate shows passes
  assert(`${tag}: all plate checks green`, Core.checksLive(bd).every(c => c.res < 1e-6));
}

console.log(`\n${n} assertions, ${failed} failed.`);
process.exit(failed ? 1 : 0);
