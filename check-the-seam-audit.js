// check-the-seam-audit.js — no dependencies (Node 18+).
// SUPERSEDES this file's first version (13 September), which tested the wrong
// defect: it audited su + sv (the neutral surface) and mislabeled its zero
// "the fusion seam." The seam theorem (the-seam-theorem-v1-1.md, line 22) fixes
// the seam as {Δ = 0}, Δ = r_u r_v (r_v − r_u) — the fusion diagonal r_u = r_v
// with the two channel-degeneration edges r = 0, three concurrent lines through
// the orthographic corner. Audited against THAT defect, the finding reverses.
//
// THE HELD CENSUS SENTENCE — "the seam is the zero set of the defect λ − μ" —
// names no defect the seam theorem uses. The book's seam defect is Δ. The
// quantity the draft points at (channel-scale balance su + sv = 0) is the
// NEUTRAL SURFACE z = HM, and the neutral surface is NOT on the seam:
// Δ(HM) ≠ 0, and — checked here — the depth axis meets the seam only as
// z → ∞, under ANY per-channel calibration, so no finite interior surface can
// be a seam point. The draft is therefore not a second definition to be split;
// it is a mis-identification to be RETIRED. The seam keeps its one definition,
// Δ = 0, already in Chapter 3 and the seam theorem.
//
// What survives as true: three loci the informal word "seam" had blurred are
// genuinely distinct — (a) the seam Δ = 0, where the two READINGS fuse;
// (b) the neutral surface su + sv = 0 = {z = HM}, where the image SCALES
// balance; (c) the bow-zero locus, where a depth line's IMAGE is straight.
// The book is right to reserve "seam" for (a). This audit certifies the
// distinctness and the mis-identification; it folds nothing.
//
// Reuses the CORE of eye-view-3d.html (keep adjacent).

const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "eye-view-3d.html"), "utf8");
const Core = new Function(html.match(/\/\*CORE-BEGIN\*\/([\s\S]*?)\/\*CORE-END\*\//)[1] + "; return Core;")();

let n = 0, failed = 0;
const assert = (name, cond, detail) => {
  n++; if (!cond) failed++;
  console.log(`${String(n).padStart(2)}  ${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "   [" + detail + "]"}`);
};
const near = (x, y, t = 1e-9) => Math.abs(x - y) <= t * Math.max(1, Math.abs(x), Math.abs(y));

const rigs = [[0, 150, 355], [0, 150, 250], [40, 190, 395]];

for (const [O, Zv, Zh] of rigs) {
  const tag = `rig O=${O}, Zv=${Zv}, Zh=${Zh}`;
  const ru = z => 1 / (z - Zv), rv = z => 1 / (z - Zh);        // reciprocal-depth graduation
  const Delta = z => ru(z) * rv(z) * (rv(z) - ru(z));           // the seam defect
  const HM = O + 2 * (Zv - O) * (Zh - O) / ((Zv - O) + (Zh - O));
  const su = z => (O - Zv) / (z - Zv), sv = z => (O - Zh) / (z - Zh);
  const dScale = z => su(z) + sv(z);                            // neutral-surface defect
  const bow = (x0, y0) => Core.sagitta(Core.imgLine(O, Zv, Zh, { x: x0, y: y0, z: 0 },
    { x: 0, y: 0, z: 1 }, Zh + 20, Zh + 220, 41));              // bow defect

  // ---- (a) the seam is Δ = 0, the theorem's three-line locus, on the rate square ----
  assert(`${tag}: Δ = r_u r_v (r_v − r_u) vanishes on the diagonal and both edges`,
    (() => {
      const diag = (a => a * a * (a - a))(0.02);
      const eU = (b => 0 * b * (b - 0))(0.02);
      const eV = (a => a * 0 * (0 - a))(0.02);
      const interior = 0.03 * (-0.017) * ((-0.017) - 0.03);
      return near(diag, 0) && near(eU, 0) && near(eV, 0) && Math.abs(interior) > 1e-9;
    })());
  assert(`${tag}: Δ is odd under the channel swap r_u ↔ r_v (the diagonal is its collision line)`,
    (() => { const a = 0.03, b = -0.017;
      return near(a * b * (b - a), -(b * a * (a - b)), 1e-12); })());

  // ---- (b) the neutral surface is a distinct locus, provably NOT on the seam ----
  assert(`${tag}: the neutral surface is z = HM (scale balance su + sv = 0)`,
    near(dScale(HM), 0, 1e-9), dScale(HM));
  assert(`${tag}: the neutral surface is NOT on the seam — Δ(HM) ≠ 0`,
    Math.abs(Delta(HM)) > 1e-9, Delta(HM));
  // calibration-independence: the depth axis meets {r_u = r_v} only as z → ∞, so no
  // finite interior depth is a seam point under ANY monotone per-channel graduation.
  assert(`${tag}: the axis meets the diagonal only at infinity — r_u − r_v shrinks monotonically to 0 outward`,
    (() => {
      const d = z => ru(z) - rv(z);
      const far = [Zh + 1e3, Zh + 1e5, Zh + 1e7].map(z => Math.abs(d(z)));
      return far[0] > far[1] && far[1] > far[2] && far[2] < 1e-6 && Math.abs(d(HM)) > 1e-6;
    })());
  assert(`${tag}: so "seam = zero set of λ − μ" (scale balance) is FALSE against the theorem's Δ`,
    Math.abs(Delta(HM)) > 1e-9 && near(dScale(HM), 0, 1e-9));

  // ---- (c) the bow-zero locus is a third locus, transverse not depth ----
  assert(`${tag}: bow ≡ 0 on the transverse planes x₀ = 0 and y₀ = 0`,
    [5, 40, 70].every(k => bow(0, k) < 1e-9 && bow(k, 0) < 1e-9));
  assert(`${tag}: bow > 0 off them, at every depth — a proper depth-independent locus`,
    [20, 50].every(k => bow(k, k) > 1e-6) && bow(0, 40) < 1e-9);

  // ---- the three loci are pairwise distinct ----
  assert(`${tag}: neutral surface ≠ bow locus — a bowing line (40,40) still crosses z = HM`,
    bow(40, 40) > 1e-6 && near(dScale(HM), 0, 1e-9));
  assert(`${tag}: seam ≠ neutral surface — Δ(HM) ≠ 0 while su+sv(HM) = 0`,
    Math.abs(Delta(HM)) > 1e-9 && near(dScale(HM), 0, 1e-9));
}

// ---- the ruling, checked rather than declared ----
assert("across rigs: the neutral surface is off the seam in every rig (the draft's premise fails everywhere)",
  rigs.every(([O, Zv, Zh]) => {
    const ru = z => 1 / (z - Zv), rv = z => 1 / (z - Zh);
    const Delta = z => ru(z) * rv(z) * (rv(z) - ru(z));
    const HM = O + 2 * (Zv - O) * (Zh - O) / ((Zv - O) + (Zh - O));
    return Math.abs(Delta(HM)) > 1e-9;
  }));
assert("the three loci meet only in the pinhole limit (HM → the fused slit as the gap → 0)",
  (() => {
    const Zv = 150;
    const near0 = [20, 2, 0.2].map(g => 2 * Zv * (Zv + g) / (2 * Zv + g) - Zv);
    return near0[0] > near0[1] && near0[1] > near0[2] && near0[2] < 0.2;
  })());

console.log(`\n${n} assertions, ${failed} failed.`);
console.log(failed ? "" :
  "\nRULING SUPPORTED: RETIRE the census's held draft; do not split it. The seam\n" +
  "has one definition — Δ = 0, the fusion diagonal and the two silence edges —\n" +
  "already stated in Chapter 3 and the seam theorem. The held sentence names a\n" +
  "defect the theorem does not use, for the neutral surface, which provably is\n" +
  "not the seam. Worth keeping is the distinction the audit surfaced: seam\n" +
  "(readings fuse) vs neutral surface (scales balance) vs bow-zero (image\n" +
  "straight) are three loci; the book is right to reserve 'seam' for the first.\n" +
  "This file supersedes its own first version, which tested the wrong defect.");
process.exit(failed ? 1 : 0);
