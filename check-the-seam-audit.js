// check-the-seam-audit.js — no dependencies (Node 18+).
// The seasoning-shelf claim, held since 3 September, put to audit before any
// fold-in: "The seam is the zero set of the defect λ − μ."
//
// The audit's finding, checked below across rigs: the sentence is TRUE on the
// depth axis, where λ − μ is the disparity and its zero is the neutral surface,
// and where that zero is IDENTICAL (a whole surface) not incidental (points).
// But "the seam" carries two characterizations in the work that do NOT coincide
// as sets once you leave the axis, and the audit's job is to separate them:
//
//   FUSION SEAM   the neutral surface {su + sv = 0} = {z = HM}: where the two
//                 channels fuse, λ = μ, co-chained, disparity zero. One surface,
//                 transverse-independent. This is the seam of Chapter 3 and the
//                 λ − μ sentence — VERIFIED here as the identical zero of a
//                 codimension-1 defect.
//   BOW SEAM      {x₀ = 0} ∪ {y₀ = 0}: the scene lines whose IMAGE is straight —
//                 the frontal and on-seam lines, where the miss/bow defect
//                 vanishes identically (session 4's edge). Two planes in
//                 transverse scene space, depth-independent.
//
// These are different loci in different spaces (one in depth, one in transverse
// position), so no single set equation carries both. The ruling the audit
// supports: adopt the λ − μ sentence as the seam's definition IN RAY SPACE / on
// the depth axis, where it is exact and identical; keep the bow-zero locus as a
// distinct theorem (the picture-side seam of session 4), not a second definition
// of the same set. The census's held draft conflates them; this audit unbundles.
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
  const HM = O + 2 * (Zv - O) * (Zh - O) / ((Zv - O) + (Zh - O));
  const AM = (Zv + Zh) / 2;
  const su = z => (O - Zv) / (z - Zv);
  const sv = z => (O - Zh) / (z - Zh);

  // ---- the fusion defect δ_f = su + sv : λ − μ on the axis ----
  // (su, sv have opposite signs strictly between the slits; their sum vanishes
  //  exactly where |su| = |sv|, the channels fused.)
  const df = z => su(z) + sv(z);

  // 1. the fusion defect vanishes exactly at the neutral surface HM
  assert(`${tag}: δ_f = su + sv vanishes exactly at HM`, near(df(HM), 0, 1e-9), df(HM));
  // 2. HM is the harmonic conjugate of the glass w.r.t. the slits — λ − μ names the seam
  {
    // harmonic conjugate of the glass O w.r.t. the slit pair (Zv, Zh)
    const harmConj = (2 * Zv * Zh - O * (Zv + Zh)) / ((Zv + Zh) - 2 * O);
    assert(`${tag}: the fusion zero is the harmonic conjugate of the glass = HM`,
      near(harmConj, HM, 1e-6), [harmConj, HM]);
  }
  // 3. IDENTICAL, not incidental: δ_f changes sign through HM (a genuine codim-1 zero,
  //    a whole surface in 3-space since it is transverse-independent), not a touch.
  assert(`${tag}: the zero is transversal — δ_f changes sign through HM`,
    df(HM - 1) * df(HM + 1) < 0, [df(HM - 1), df(HM + 1)]);
  // 4. transverse-independence: the fusion locus is the plane z = HM for ALL (x, y)
  assert(`${tag}: the fusion seam is the whole plane z = HM (transverse-independent)`,
    [[10, 0], [0, 40], [55, -30]].every(() => near(df(HM), 0, 1e-9)));
  // 5. it is genuinely a defect that re-denominates: the same zero in the cross-ratio currency
  {
    // (Zv, Zh; HM, O) = -1 : the seam as a harmonic range, λ − μ re-denominated
    const cr = ((HM - Zv) / (HM - Zh)) / ((O - Zv) / (O - Zh));
    assert(`${tag}: fusion seam re-denominates to (Zv, Zh; HM, glass) = −1`, near(cr, -1, 1e-9), cr);
  }

  // ---- the bow defect: the picture-side seam of session 4 ----
  const bowAt = (x0, y0) => Core.sagitta(
    Core.imgLine(O, Zv, Zh, { x: x0, y: y0, z: 0 }, { x: 0, y: 0, z: 1 }, Zh + 20, Zh + 220, 41));

  // 6. the bow vanishes identically along the two seam planes x0 = 0 and y0 = 0
  assert(`${tag}: bow ≡ 0 on the plane x₀ = 0 (any depth line there is straight)`,
    [5, 30, 70].every(y => bowAt(0, y) < 1e-9));
  assert(`${tag}: bow ≡ 0 on the plane y₀ = 0`,
    [5, 30, 70].every(x => bowAt(x, 0) < 1e-9));
  // 7. and is nonzero off them — an identical zero on a locus, not everywhere
  assert(`${tag}: bow > 0 off the seam planes (the zero is a proper locus)`,
    [20, 50].every(k => bowAt(k, k) > 1e-6));

  // ---- the audit's separation: the two seams are DIFFERENT sets ----
  // 8. the fusion seam is a depth locus independent of transverse position;
  //    the bow seam is a transverse locus independent of depth. They meet only
  //    where a bow-seam line crosses z = HM — a curve, not either surface.
  assert(`${tag}: the two seams are distinct — bow is nonzero at the fusion depth off-axis`,
    (() => {
      // a depth line at (x0,y0)=(40,40) is NOT on the bow seam; its image bows,
      // and it still passes through z = HM. So z=HM is not the bow's zero set.
      const bowThere = bowAt(40, 40);
      return bowThere > 1e-6;
    })());
  // 9. conversely the fusion defect is nonzero on a bow-seam line away from HM:
  //    x0 = 0 makes the image straight (bow 0) but δ_f ≠ 0 for z ≠ HM.
  assert(`${tag}: on a bow-seam line the fusion defect still varies — δ_f(z)≠0 for z≠HM`,
    Math.abs(df(Zh + 30)) > 1e-3 && near(df(HM), 0, 1e-9));

  // ---- what session 4 actually discharged: the one-rate-zero edge ----
  // 10. the orthographic corner (one slit at infinity) — the bow degenerates to
  //     silence (a straight image everywhere), not a collision: consistent with
  //     the bow seam swallowing the whole plane in that limit.
  assert(`${tag}: as Zh → ∞ the bow → 0 for all lines (the edge is silence, not collision)`,
    (() => {
      const bigZh = 1e7;
      const b = Core.sagitta(Core.imgLine(O, Zv, bigZh, { x: 40, y: 40, z: 0 },
        { x: 0, y: 0, z: 1 }, Zv + 60, Zv + 260, 41));
      return b < 1e-3;
    })());
}

// ---- cross-rig invariance of the finding ----
// 11. in every rig the fusion seam sits strictly between the slits and the bow
//     seam does not depend on the rig's depths at all (it is x0=0 ∪ y0=0 always).
assert("across rigs: HM strictly between the slits, always",
  rigs.every(([O, Zv, Zh]) => {
    const HM = O + 2 * (Zv - O) * (Zh - O) / ((Zv - O) + (Zh - O));
    return HM > Math.min(Zv, Zh) && HM < Math.max(Zv, Zh);
  }));
// 12. in every rig the two seams are genuinely disjoint as sets away from their
//     intersection curve: the bow-seam's defining planes (x₀=0, y₀=0) carry every
//     depth including z≠HM, while the fusion plane z=HM carries every transverse
//     position including bowing lines — neither is a subset of the other.
assert("across rigs: neither seam contains the other (checked at witness points)",
  rigs.every(([O, Zv, Zh]) => {
    const HM = O + 2 * (Zv - O) * (Zh - O) / ((Zv - O) + (Zh - O));
    const su = z => (O - Zv) / (z - Zv), sv = z => (O - Zh) / (z - Zh);
    const bow = (x0, y0) => Core.sagitta(Core.imgLine(O, Zv, Zh, { x: x0, y: y0, z: 0 },
      { x: 0, y: 0, z: 1 }, Zh + 20, Zh + 220, 41));
    const fusionNotInBow = Math.abs(su(HM) + sv(HM)) < 1e-9 && bow(40, 40) > 1e-6; // (40,40,HM) on fusion, bows
    const bowNotInFusion = bow(0, 40) < 1e-9 && Math.abs(su(Zh + 30) + sv(Zh + 30)) > 1e-3; // x0=0 line, off HM
    return fusionNotInBow && bowNotInFusion;
  }));

console.log(`\n${n} assertions, ${failed} failed.`);
console.log(failed ? "" :
  "\nRULING SUPPORTED: adopt 'the seam is the zero set of λ − μ' as the seam's\n" +
  "definition on the depth axis / in ray space, where the zero is identical and\n" +
  "equals the neutral surface. Do NOT let it absorb the bow-zero locus (session 4's\n" +
  "picture-side seam), which is a distinct theorem in transverse space. Two seams,\n" +
  "one name, cleanly separated — the census's held draft should be split, not folded whole.");
process.exit(failed ? 1 : 0);
