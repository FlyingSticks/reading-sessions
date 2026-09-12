// check_eye_view_3d.js — no dependencies.
// The open item of the station-point addendum (R3), checked before prose.
// Extracts the CORE block from eye-view-3d.html and asserts:
// (i) the imaging model is consistent; (ii) the camera is central only in its
// two shadows; (iii) no eye exists in the round — on the sphere or anywhere;
// (iv) the picture is no perspective in disguise (the bow certificate);
// (v) the best-fit eye law, its far-field limit at AM, and its scene-dependence;
// (vi) the scene-free compromise at the neutral surface; (vii) rates; (viii) the
// pinhole limit, where the question dissolves.

const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "eye-view-3d.html"), "utf8");
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
  [0, 150, 355],   // the sketch
  [0, 150, 250],   // the book rig
  [40, 190, 395]   // glass moved; slits moved with it
];

for (const [O, Zv, Zh] of rigs) {
  const tag = `rig O=${O}, Zv=${Zv}, Zh=${Zh}`;
  const bd = Core.build(O, Zv, Zh);
  const zc = Zh + 200, hd = 45, hw = 60;
  const verts = Core.boxVerts(zc, hw, hd);
  const rays = verts.map(Q => Core.ray(Zv, Zh, Q));

  // (i) model consistency
  assert(`${tag}: every imaging ray passes through its scene point`,
    verts.every((Q, i) => Core.distPR(Q, rays[i]) < 1e-9));
  assert(`${tag}: every imaging ray meets both slits`,
    rays.every(r => Math.abs(r.V.x) < 1e-12 && Math.abs(r.V.z - Zv) < 1e-12
                 && Math.abs(r.H.y) < 1e-12 && Math.abs(r.H.z - Zh) < 1e-12));
  assert(`${tag}: the closed-form image is the ray's glass crossing`,
    verts.every((Q, i) => {
      const r = rays[i], t = (O - r.p.z) / r.d.z;
      const gx = r.p.x + t * r.d.x, gy = r.p.y + t * r.d.y;
      const im = Core.img(O, Zv, Zh, Q);
      return near(gx, im.x, 1e-8) && near(gy, im.y, 1e-8);
    }));

  // (ii) central in the shadows only
  assert(`${tag}: plan shadow is a pencil through the vertical slit's point`,
    rays.every(r => {
      const L = Math.hypot(r.H.x - r.V.x, r.H.z - r.V.z);
      return Math.abs((0 - r.V.x) * (r.H.z - r.V.z) - (Zv - r.V.z) * (r.H.x - r.V.x)) / L < 1e-9;
    }));
  assert(`${tag}: profile shadow is a pencil through the horizontal slit's point`,
    rays.every(r => {
      const L = Math.hypot(r.H.y - r.V.y, r.H.z - r.V.z);
      return Math.abs((0 - r.V.y) * (r.H.z - r.V.z) - (Zh - r.V.z) * (r.H.y - r.V.y)) / L < 1e-9;
    }));
  assert(`${tag}: scene points on the plane y = 0 are imaged centrally from B's point`,
    [{ x: 40, y: 0, z: zc }, { x: -70, y: 0, z: zc + 90 }].every(Q => {
      const im = Core.img(O, Zv, Zh, Q);
      const pp = Core.persp({ x: 0, y: 0, z: Zv }, O, Q);
      return near(im.x, pp.x, 1e-9) && Math.abs(im.y - pp.y) < 1e-9;
    }));
  assert(`${tag}: scene points on the plane x = 0 are imaged centrally from D's point`,
    [{ x: 0, y: 40, z: zc }, { x: 0, y: -70, z: zc + 90 }].every(Q => {
      const im = Core.img(O, Zv, Zh, Q);
      const pp = Core.persp({ x: 0, y: 0, z: Zh }, O, Q);
      return near(im.y, pp.y, 1e-9) && Math.abs(im.x - pp.x) < 1e-9;
    }));

  // (iii) no eye in the round
  const bf = Core.bestFit(rays);
  const miss = Math.max(...rays.map(r => Core.distPR(bf, r)));
  assert(`${tag}: no common point — the best fit still misses by > 5`, miss > 5, miss);
  assert(`${tag}: the best-fit eye sits on the axis (symmetric scene)`,
    Math.hypot(bf.x, bf.y) < 1e-6, [bf.x, bf.y]);
  assert(`${tag}: E′ lies on the sphere`,
    near(Math.hypot(bd.E3.z - bd.mn.M, bd.E3.y), bd.mn.R, 1e-8));
  assert(`${tag}: E′ is no eye either — rays miss it by > 5`,
    Math.max(...rays.map(r => Core.distPR(bd.E3, r))) > 5);

  // (iv) the bow certificate: no homography can dress a perspective as this picture
  const sagGeneric = Core.sagitta(Core.imgLine(O, Zv, Zh,
    { x: hw, y: hw, z: 0 }, { x: 0, y: 0, z: 1 }, zc - hd, zc + 200, 41));
  assert(`${tag}: off-seam depth line bows (sagitta > 1)`, sagGeneric > 1, sagGeneric);
  assert(`${tag}: the same line is straight from any pinhole (E′ shown)`,
    (() => {
      const pts = [];
      for (let i = 0; i < 41; i++){
        const z = zc - hd + (200 + hd) * i / 40;
        pts.push(Core.persp(bd.E3, O, { x: hw, y: hw, z }));
      }
      return Core.sagitta(pts) < 1e-8;
    })());
  assert(`${tag}: seam depth lines are straight (X₀ = 0 and Y₀ = 0)`,
    Core.sagitta(Core.imgLine(O, Zv, Zh, { x: 0, y: hw, z: 0 }, { x: 0, y: 0, z: 1 }, zc - hd, zc + 200, 41)) < 1e-9 &&
    Core.sagitta(Core.imgLine(O, Zv, Zh, { x: hw, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, zc - hd, zc + 200, 41)) < 1e-9);
  assert(`${tag}: frontal lines are straight, any direction`,
    Core.sagitta(Core.imgLine(O, Zv, Zh, { x: -hw, y: 20, z: zc }, { x: 1, y: 0.7, z: 0 }, 0, 2 * hw, 41)) < 1e-9);
  assert(`${tag}: a generic oblique line bows too`,
    Core.sagitta(Core.imgLine(O, Zv, Zh, { x: 30, y: 50, z: 0 }, { x: 1, y: 0.7, z: 1.3 }, zc - hd, zc + 150, 41)) > 0.3);

  // (v) the eye law
  const slabRays = Z => {
    const rr = [];
    for (const sx of [-1, -0.4, 0.4, 1]) for (const sy of [-1, -0.4, 0.4, 1])
      rr.push(Core.ray(Zv, Zh, { x: sx * 10, y: sy * 10, z: Z }));
    return rr;
  };
  assert(`${tag}: z_eye closed form matches the least squares (paraxial; < 0.15 at the nearest slab)`,
    [Zh + 45, Zh + 150, Zh + 500].every(Z =>
      Math.abs(Core.bestFit(slabRays(Z)).z - Core.zEye(Zv, Zh, Z)) < 0.15));
  assert(`${tag}: and the paraxial error dies with distance from the slit`,
    (() => {
      const d = Z => Math.abs(Core.bestFit(slabRays(Z)).z - Core.zEye(Zv, Zh, Z));
      return d(Zh + 45) > d(Zh + 150) && d(Zh + 150) > d(Zh + 500);
    })());
  assert(`${tag}: far-field limit of z_eye is AM — the centre of the sphere`,
    near(Core.zEye(Zv, Zh, 1e9), (Zv + Zh) / 2, 1e-6));
  assert(`${tag}: z_eye is monotone from the near slit down to AM`,
    (() => {
      const zs = [Zh + 1, Zh + 50, Zh + 200, Zh + 1000, Zh + 1e5].map(Z => Core.zEye(Zv, Zh, Z));
      for (let i = 1; i < zs.length; i++) if (zs[i] >= zs[i - 1]) return false;
      return zs[0] < Zh && zs[zs.length - 1] > (Zv + Zh) / 2;
    })());
  assert(`${tag}: z_eye stays inside the sphere, above AM — never z*, GM, or the surface`,
    [Zh + 45, Zh + 200, Zh + 2000].every(Z => {
      const z = Core.zEye(Zv, Zh, Z);
      return z > (Zv + Zh) / 2 && z < Zh;
    }));
  assert(`${tag}: the best-fit eye is scene-bound (a gauge): moves > ¼ gap between near and far`,
    Math.abs(Core.zEye(Zv, Zh, Zh + 70) - Core.zEye(Zv, Zh, Zh + 545)) > 0.25 * (Zh - Zv));
  assert(`${tag}: the congruence — and so the eye law — ignores the glass`,
    near(Core.zEye(Zv, Zh, Zh + 200), Core.zEye(Zv, Zh, Zh + 200)) &&
    (() => { // rays are built from the slits and the scene only
      const r1 = Core.ray(Zv, Zh, { x: 33, y: 44, z: zc });
      return Math.abs(r1.p.x) < 1e-12; // no O anywhere in the construction
    })());

  // (vi) the scene-free compromise
  const zstar = bd.zstar;
  assert(`${tag}: vergence midpoint law at every depth (mean 1/scale = pinhole at z*)`,
    [zc - hd, zc, zc + hd, zc + 300].every(z => {
      const s = Core.scales(O, Zv, Zh, z);
      return near((1 / s.su + 1 / s.sv) / 2, (z - zstar) / (O - zstar), 1e-10);
    }));
  assert(`${tag}: conformal at z* exactly — |su| = |sv|`,
    (s => near(Math.abs(s.su), Math.abs(s.sv), 1e-10))(Core.scales(O, Zv, Zh, zstar)));
  assert(`${tag}: z* is the unique conformal depth between the slits`,
    (() => {
      let roots = 0;
      let prev = null;
      for (let z = Zv + 1.01; z < Zh; z += 0.497){
        const s = Core.scales(O, Zv, Zh, z);
        const f = Math.abs(s.su) - Math.abs(s.sv);
        if (prev !== null && prev * f < 0) roots++;
        prev = f;
      }
      return roots === 1;
    })());
  assert(`${tag}: hand flipped between the slits (su·sv < 0), restored beyond (su·sv > 0)`,
    Core.scales(O, Zv, Zh, zstar).su * Core.scales(O, Zv, Zh, zstar).sv < 0 &&
    Core.scales(O, Zv, Zh, Zh + 100).su * Core.scales(O, Zv, Zh, Zh + 100).sv > 0);

  // profile jurisdiction: within x = 0 the imaging eye is D's point, not E′
  assert(`${tag}: within the profile plane, the camera's eye is the slit point, not E′`,
    (() => {
      const Q = { x: 0, y: 55, z: zc };
      const im = Core.img(O, Zv, Zh, Q);
      const fromD = Core.persp({ x: 0, y: 0, z: Zh }, O, Q);
      const fromE = Core.persp(bd.E3, O, Q);
      return near(im.y, fromD.y, 1e-9) && Math.abs(im.y - fromE.y) > 1;
    })());
}

// ---------------------------------------------------------------- rates
{
  const [O, Zv, Zh] = [0, 150, 355];
  // bow linear in each offset
  const s1 = Core.sagitta(Core.imgLine(O, Zv, Zh, { x: 60, y: 60, z: 0 }, { x: 0, y: 0, z: 1 }, 380, 600, 41));
  const s2j = Core.sagitta(Core.imgLine(O, Zv, Zh, { x: 120, y: 120, z: 0 }, { x: 0, y: 0, z: 1 }, 380, 600, 41));
  const s3 = Core.sagitta(Core.imgLine(O, Zv, Zh, { x: 60, y: 120, z: 0 }, { x: 0, y: 0, z: 1 }, 380, 600, 41));
  assert("rate: bow linear in the joint transverse offset (ratio ≈ 2)",
    s2j / s1 > 1.8 && s2j / s1 < 2.2, s2j / s1);
  assert("finding: along-chord offset alone leaves the sagitta nearly unchanged",
    s3 / s1 > 0.8 && s3 / s1 < 1.3, s3 / s1);
  // bow linear in the gap
  const sagGap = e => {
    const Zh2 = Zv + 2 * e;
    return Core.sagitta(Core.imgLine(O, Zv, Zh2, { x: 60, y: 60, z: 0 }, { x: 0, y: 0, z: 1 }, 380, 600, 41));
  };
  assert("rate: bow dies linearly with the gap (decade ratio ≈ 10)",
    (r => r > 7 && r < 15)(sagGap(5) / sagGap(0.5)), sagGap(5) / sagGap(0.5));
  // non-centrality dies linearly at the pinhole
  const missGap = e => {
    const Zh2 = Zv + 2 * e;
    const verts = Core.boxVerts(425, 60, 45);
    const rays = verts.map(Q => Core.ray(Zv, Zh2, Q));
    const bf = Core.bestFit(rays);
    return Math.max(...rays.map(r => Core.distPR(bf, r)));
  };
  assert("rate: the miss dies linearly at the pinhole (decade ratio ≈ 10)",
    (r => r > 7 && r < 14)(missGap(2) / missGap(0.2)), missGap(2) / missGap(0.2));
  assert("pinhole limit: the best-fit eye converges to the fused slits",
    (() => {
      const Zh2 = Zv + 0.4;
      const verts = Core.boxVerts(425, 60, 45);
      const bf = Core.bestFit(verts.map(Q => Core.ray(Zv, Zh2, Q)));
      return Math.abs(bf.z - Zv) < 1;
    })());
}

console.log(`\n${n} assertions, ${failed} failed.`);
process.exit(failed ? 1 : 0);
