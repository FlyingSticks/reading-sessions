// check-sphere-duality.js — no dependencies. (Dash-named per house convention;
// supersedes the underscore-named delivery of 12 Sep, content unchanged, 32/32.)
// The conjecture: a pure duality operates between the cross-slit rig and the
// two-point reading, and it is the POLARITY OF THE MEANS SPHERE itself.
// Claims checked: (D1) both slits are tangent lines of the sphere at its axis
// poles; (D2) the polarity turns each slit 90° in its own tangent plane, so it
// maps the rig's slit pair to the DUAL rig's (directions exchanged, depths
// kept); (D3) it maps the whole imaging congruence to the dual congruence —
// the polar line of every imaging ray meets both dual slits; (D4) its trace on
// the profile is conjugacy in the equator, and the closing law AM × HM = GM²
// IS the pole–polar pairing of the glass with the neutral surface; (D5) the
// vanishing point's polar plane is the slit's own plane, and E on the sphere
// is self-conjugate — the reader stands on the duality's fixed surface;
// (D6) the two axis involutions (conjugacy in the equator, conjugacy in the
// circle on AC) commute exactly when the range is harmonic; (D7) the polarity
// is an involution, the dual rig shares every axis datum, and the two rigs'
// conformal pictures at z* differ by a half-turn.
// Reuses the CORE of eye-view-3d.html (keep the files adjacent).

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

// ---- small 3D kit -----------------------------------------------------------
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul = (a, k) => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const crs = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const nrm = a => { const L = Math.hypot(a.x, a.y, a.z); return mul(a, 1 / L); };

function lineDist(p1, d1, p2, d2){
  const cx = crs(d1, d2), L = Math.hypot(cx.x, cx.y, cx.z);
  if (L < 1e-12){
    const v = sub(p2, p1), t = dot(v, nrm(d1));
    const w = sub(v, mul(nrm(d1), t));
    return Math.hypot(w.x, w.y, w.z);
  }
  return Math.abs(dot(sub(p2, p1), cx)) / L;
}

// polar line of the line (p, d) w.r.t. the sphere (c, R):
// { X : (p−c)·(X−c) = R²  and  d·(X−c) = 0 }
function polarLine(c, R, p, d){
  const n1 = sub(p, c), n2 = d;
  const a11 = dot(n1, n1), a12 = dot(n1, n2), a22 = dot(n2, n2);
  const det = a11 * a22 - a12 * a12;
  const a = (R * R * a22) / det, b = (-R * R * a12) / det;
  const Y0 = add(mul(n1, a), mul(n2, b));
  return { p: add(c, Y0), d: nrm(crs(n1, n2)) };
}

const slitsOf = (Zv, Zh) => ({
  l1: { p: { x: 0, y: 0, z: Zv }, d: { x: 0, y: 1, z: 0 } },
  l2: { p: { x: 0, y: 0, z: Zh }, d: { x: 1, y: 0, z: 0 } }
});
const dualSlitsOf = (Zv, Zh) => ({
  l1: { p: { x: 0, y: 0, z: Zv }, d: { x: 1, y: 0, z: 0 } },
  l2: { p: { x: 0, y: 0, z: Zh }, d: { x: 0, y: 1, z: 0 } }
});

for (const [O, Zv, Zh] of [[0, 150, 355], [0, 150, 250]]) {
  const tag = `rig O=${O}, Zv=${Zv}, Zh=${Zh}`;
  const bd = Core.build(O, Zv, Zh);
  const c = { x: 0, y: 0, z: (Zv + Zh) / 2 }, R = bd.mn.R;
  const S = slitsOf(Zv, Zh), Sd = dualSlitsOf(Zv, Zh);

  // D1 — both slits are tangent lines of the means sphere, at its axis poles
  assert(`${tag}: both slits are tangent to the sphere, touching at B and D on the axis`,
    [[S.l1, Zv], [S.l2, Zh]].every(([sl, Zs]) => {
      const t = dot(sub(c, sl.p), sl.d);
      const f = add(sl.p, mul(sl.d, t));
      return near(Math.hypot(f.x - c.x, f.y - c.y, f.z - c.z), R, 1e-9)
          && near(Math.hypot(f.x, f.y, f.z - Zs), 0, 1e-9);
    }));

  // D2 — the polarity turns each slit 90° in its tangent plane: rig ↦ dual rig
  assert(`${tag}: polar of the vertical slit is the same-depth horizontal line`,
    (() => { const pl = polarLine(c, R, S.l1.p, S.l1.d);
      return lineDist(pl.p, pl.d, Sd.l1.p, Sd.l1.d) < 1e-9
          && Math.abs(Math.abs(dot(pl.d, Sd.l1.d)) - 1) < 1e-9; })());
  assert(`${tag}: polar of the horizontal slit is the same-depth vertical line`,
    (() => { const pl = polarLine(c, R, S.l2.p, S.l2.d);
      return lineDist(pl.p, pl.d, Sd.l2.p, Sd.l2.d) < 1e-9
          && Math.abs(Math.abs(dot(pl.d, Sd.l2.d)) - 1) < 1e-9; })());

  // D3 — the congruence maps to the dual congruence
  assert(`${tag}: the polar of every imaging ray meets both dual slits`,
    [{ x: 60, y: -40, z: Zh + 205 }, { x: -35, y: 80, z: Zh + 90 }, { x: 20, y: 25, z: Zh + 500 }]
      .every(Q => {
        const r = Core.ray(Zv, Zh, Q);
        const pl = polarLine(c, R, r.p, r.d);
        return lineDist(pl.p, pl.d, Sd.l1.p, Sd.l1.d) < 1e-7
            && lineDist(pl.p, pl.d, Sd.l2.p, Sd.l2.d) < 1e-7;
      }));

  // D4 — the profile trace: the closing law is the pole–polar pairing
  assert(`${tag}: inverse of the glass in the equator is the virtual centre — AM·HM = GM² as pole–polar`,
    near(c.z + R * R / (O - c.z), bd.E2 ? bd.zstar : NaN, 1e-9) &&
    near((c.z - O) * (bd.zstar - O), bd.mn.GM * bd.mn.GM, 1e-9));

  // D5 — vanishing point ↦ slit plane; E self-conjugate on the fixed surface
  assert(`${tag}: the polar plane of the vanishing point B is the slit's own plane z = Zv`,
    (() => {
      const B = { x: 0, y: 0, z: Zv }, nB = sub(B, c);
      return [{ x: 7, y: -3, z: Zv }, { x: -20, y: 11, z: Zv }, { x: 0, y: 0, z: Zv }]
        .every(X => near(dot(nB, sub(X, c)), R * R, 1e-9));
    })());
  assert(`${tag}: E is self-conjugate — the reader stands on the duality's fixed surface`,
    near(dot(sub(bd.E3, c), sub(bd.E3, c)), R * R, 1e-9));
  assert(`${tag}: a point off the sphere is not self-conjugate (the fixed surface is exactly the sphere)`,
    !near(dot(sub({ x: 0, y: 0, z: bd.zstar }, c), sub({ x: 0, y: 0, z: bd.zstar }, c)), R * R, 1e-6));

  // D6 — the two axis involutions commute iff the range is harmonic
  const sigma = x => c.z + R * R / (x - c.z);
  const tauOf = Cx => { const cc = (O + Cx) / 2, rr = (Cx - O) / 2;
    return x => cc + rr * rr / (x - cc); };
  const tau = tauOf(bd.zstar);
  assert(`${tag}: conjugacy in the equator fixes B, D and swaps A ↔ C`,
    near(sigma(Zv), Zv) && near(sigma(Zh), Zh) && near(sigma(O), bd.zstar, 1e-9) && near(sigma(bd.zstar), O, 1e-6));
  assert(`${tag}: conjugacy in the circle on AC fixes A, C and swaps B ↔ D`,
    near(tau(O), O) && near(tau(bd.zstar), bd.zstar) && near(tau(Zv), Zh, 1e-9) && near(tau(Zh), Zv, 1e-9));
  assert(`${tag}: the two involutions commute on the harmonic range`,
    [Zv - 37, (Zv + Zh) / 2 + 13, Zh + 61].every(x => near(sigma(tau(x)), tau(sigma(x)), 1e-8)));
  assert(`${tag}: commutation fails when harmonicity is broken (falsifiability)`,
    (() => { const tBad = tauOf(bd.zstar + 2);
      return [Zv - 37, Zh + 61].some(x => Math.abs(sigma(tBad(x)) - tBad(sigma(x))) > 0.01); })());
  assert(`${tag}: the composite realizes (A C)(B D) — both pairs swapped at once`,
    near(sigma(tau(O)), bd.zstar, 1e-6) && near(sigma(tau(Zv)), Zh, 1e-9) &&
    near(sigma(tau(Zh)), Zv, 1e-9) && near(sigma(tau(bd.zstar)), O, 1e-4));

  // D7 — involution; shared axis data; the two rigs' z* pictures differ by a half-turn
  assert(`${tag}: the polarity is an involution — the polar of the polar is the ray`,
    (() => { const r = Core.ray(Zv, Zh, { x: 60, y: -40, z: Zh + 205 });
      const pl = polarLine(c, R, r.p, r.d);
      const back = polarLine(c, R, pl.p, pl.d);
      return lineDist(back.p, back.d, r.p, r.d) < 1e-7; })());
  assert(`${tag}: the rigs share the axis reading, not the picture — same range, different images`,
    (() => {
      const Q = { x: 60, y: -40, z: Zh + 205 };
      const im = Core.img(O, Zv, Zh, Q);
      const imd = { x: Q.x * (O - Zh) / (Q.z - Zh), y: Q.y * (O - Zv) / (Q.z - Zv) };
      const T = Core.tangentTouch(O, Zv, Zh);
      const cr = ((T.x - Zv) / (T.x - Zh)) / ((O - Zv) / (O - Zh));
      return Math.abs(im.x - imd.x) > 1 && Math.abs(im.y - imd.y) > 1
          && near(cr, -1, 1e-9);
    })());
  assert(`${tag}: at z*, rig and dual rig are opposite reflections — their pictures differ by a half-turn`,
    (() => { const s = Core.scales(O, Zv, Zh, bd.zstar);
      const sd = { su: (O - Zh) / (bd.zstar - Zh), sv: (O - Zv) / (bd.zstar - Zv) };
      return s.su * s.sv < 0 && sd.su * sd.sv < 0
          && near(sd.su, -s.su, 1e-9) && near(sd.sv, -s.sv, 1e-9);
    })());
}

console.log(`\n${n} assertions, ${failed} failed.`);
process.exit(failed ? 1 : 0);
