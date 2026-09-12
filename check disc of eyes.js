// check_disc_of_eyes.js — no dependencies. Twelve assertions, one per claim.
// The "cite" row, checked: a physical pinhole image is the superposition of
// ideal windows from every point of the aperture; blur is linear in the hole;
// the slit pair is that aperture pulled apart anisotropically; fusing the
// slits recovers the round hole; shrinking the hole recovers the drawing.
// Settled physics wearing our notation — this script checks the tailoring,
// not the body. Reuses the CORE of eye-view-3d.html (keep the files adjacent).

const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "eye-view-3d.html"), "utf8");
const Core = new Function(html.match(/\/\*CORE-BEGIN\*\/([\s\S]*?)\/\*CORE-END\*\//)[1]
  + "; return Core;")();

let n = 0, failed = 0;
const assert = (name, cond, detail) => {
  n++; if (!cond) failed++;
  console.log(`${String(n).padStart(2)}  ${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "   [" + detail + "]"}`);
};
const near = (x, y, t = 1e-9) => Math.abs(x - y) <= t * Math.max(1, Math.abs(x), Math.abs(y));

// One eye of the crowd: central projection from aperture point (ux, uy, za) to glass z = 0.
const eye = (ux, uy, za, Q) => {
  const s = za / (za - Q.z);
  return { x: s * Q.x + (1 - s) * ux, y: s * Q.y + (1 - s) * uy };
};
// The patch a scene point paints through an aperture: sampled over the hole.
const patch = (pts, za, Q) => pts.map(u => eye(u.x, u.y, za, Q));
const disc = d => { const p = []; for (let i = 0; i < 48; i++)
  p.push({ x: d / 2 * Math.cos(i * Math.PI / 24), y: d / 2 * Math.sin(i * Math.PI / 24) }); return p; };
const spread = (ps, k) => Math.max(...ps.map(p => p[k])) - Math.min(...ps.map(p => p[k]));

const za = 150, Q = { x: 60, y: -40, z: 560 }, d = 8;
const coef = Z => Math.abs(Z / (Z - za));

// 1 — superposition: every aperture point is its own perfect eye (ray-trace = projection)
assert("1. every aperture point is its own perfect eye",
  (() => { const u = { x: 2.7, y: -1.3 };
    const dir = { x: Q.x - u.x, y: Q.y - u.y, z: Q.z - za };   // ray from the eye through Q
    const t = -za / dir.z, hit = { x: u.x + t * dir.x, y: u.y + t * dir.y };
    const p = eye(u.x, u.y, za, Q);
    return near(hit.x, p.x) && near(hit.y, p.y); })());

// 2 — a point source paints the aperture, scaled and shifted: square hole → square patch
assert("2. the patch is the aperture, scaled by |Z/(Z−za)|",
  (() => { const c = [{x:-d/2,y:-d/2},{x:d/2,y:-d/2},{x:d/2,y:d/2},{x:-d/2,y:d/2}];
    const ps = patch(c, za, Q);
    return near(spread(ps, "x"), d * coef(Q.z)) && near(spread(ps, "y"), d * coef(Q.z)); })());

// 3 — the round hole blurs isotropically at every depth
assert("3. round hole: blur isotropic at every depth",
  [300, 560, 2000].every(Z => { const ps = patch(disc(d), za, { x: 60, y: -40, z: Z });
    return near(spread(ps, "x"), spread(ps, "y"), 1e-6); }));

// 4 — the blur diameter is exactly d·|Z/(Z−za)|
assert("4. blur diameter = d·|Z/(Z−za)| exactly",
  [300, 560, 2000].every(Z =>
    near(spread(patch(disc(d), za, { x: 60, y: -40, z: Z }), "x"), d * coef(Z), 1e-6)));

// 5 — linear in the hole: double the diameter, double the blur
assert("5. blur linear in the hole (ratio 2 exactly)",
  near(spread(patch(disc(2 * d), za, Q), "x") / spread(patch(disc(d), za, Q), "x"), 2, 1e-9));

// 6 — the drawing is the limit: blur dies linearly as the hole closes (decade ratio 10)
assert("6. the drawing is the d → 0 limit, at rate O(d)",
  (r => r > 9.99 && r < 10.01)(
    spread(patch(disc(1), za, Q), "x") / spread(patch(disc(0.1), za, Q), "x")),
  spread(patch(disc(1), za, Q), "x") / spread(patch(disc(0.1), za, Q), "x"));

// 7 — far field: the blur is the hole itself (coefficient → 1)
assert("7. far-field blur → the hole's own diameter",
  near(spread(patch(disc(d), za, { x: 60, y: -40, z: 1e9 }), "x"), d, 1e-6));

// Finite-width slits: a ray is fixed by its slit crossings u (x at Zv) and v (y at Zh).
const slitPatch = (Zv, Zh, w, Qp) => {
  const ps = [];
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++){
    const u = w * i / 3, v = w * j / 3;
    const t = -Zv / (Qp.z - Zv), s = -Zh / (Qp.z - Zh);
    ps.push({ x: t * Qp.x + (1 - t) * u, y: s * Qp.y + (1 - s) * v });
  }
  return ps;
};

// 8 — crossed slits: each direction blurs from its own depth alone
assert("8. x-blur owned by the vertical slit's depth, y-blur by the horizontal's",
  (() => { const w = 3;
    const a = slitPatch(150, 355, w, Q), b = slitPatch(150, 800, w, Q),
          c = slitPatch(90, 355, w, Q);
    return near(spread(a, "x"), spread(b, "x"), 1e-9)       // move Zh: x-blur deaf to it
        && near(spread(a, "y"), spread(c, "y"), 1e-9)       // move Zv: y-blur deaf to it
        && near(spread(a, "x"), 2 * w * Math.abs(Q.z / (Q.z - 150)), 1e-9)
        && near(spread(a, "y"), 2 * w * Math.abs(Q.z / (Q.z - 355)), 1e-9); })());

// 9 — anisotropic at every depth unless the slits fuse
assert("9. blur ratio ≠ 1 wherever Zv ≠ Zh; isotropy restored on fusion",
  [420, 560, 2000].every(Z => { const ps = slitPatch(150, 355, 3, { x: 60, y: -40, z: Z });
    return Math.abs(spread(ps, "x") / spread(ps, "y") - 1) > 1e-3; }) &&
  [420, 560, 2000].every(Z => { const ps = slitPatch(250, 250, 3, { x: 60, y: -40, z: Z });
    return near(spread(ps, "x"), spread(ps, "y"), 1e-9); }));

// 10 — the ideal cross-slit has zero blur: one ray per scene point
assert("10. ideal slits: exactly one ray per scene point (zero-width, zero blur)",
  (() => { const r = Core.ray(150, 355, Q);
    return Core.distPR(Q, r) < 1e-9 && Math.abs(r.V.x) < 1e-12 && Math.abs(r.H.y) < 1e-12; })());

// 11 — fusing the slits recovers the round hole's ideal: the pinhole camera
assert("11. fused slits = the pinhole: cross-slit image at Zh = Zv is the pinhole image",
  (() => { const im = Core.img(0, 250, 250, Q);
    const pp = Core.persp({ x: 0, y: 0, z: 250 }, 0, Q);
    return near(im.x, pp.x) && near(im.y, pp.y); })());

// 12 — the crowd's mean is the ideal image: the centre eye speaks for the disc
assert("12. the disc's mean image is the centre eye's image",
  (() => { const ps = patch(disc(d), za, Q);
    const mx = ps.reduce((a, p) => a + p.x, 0) / ps.length;
    const my = ps.reduce((a, p) => a + p.y, 0) / ps.length;
    const c = eye(0, 0, za, Q);
    return near(mx, c.x, 1e-9) && near(my, c.y, 1e-9); })());

console.log(`\n${n} assertions, ${failed} failed.`);
process.exit(failed ? 1 : 0);
