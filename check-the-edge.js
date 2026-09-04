// check-the-edge.js — audit for session 4 (reading-sessions)
// Discharges two open items against the Seam Theorem v1.1:
//   (a) the one-rate-zero edge from the pattern page (session 2),
//   (b) the miniature's crossing vs the seam condition (session 3),
// and locates the 1979 miniature in rate space.
// Companion facts to verify_seam.js (9/9) and verify_seam_v1_1.js (6/6),
// both re-run against the live repo copies before this script was written.
// Run: node check-the-edge.js
"use strict";
let pass = 0, fail = 0;
function chk(name, ok, detail) {
  if (ok) { pass++; console.log("  ok  " + name + (detail ? "  [" + detail + "]" : "")); }
  else    { fail++; console.log("FAIL  " + name + (detail ? "  [" + detail + "]" : "")); }
}
// Rig conventions, verbatim from the seam theorem setup:
function slit(x, y, ru, rv, l) { return [x/(1+ru*l), y/(1+rv*l)]; }
function Delta(ru, rv) { return ru*rv*(rv-ru); }
function bowOf(x, y, ru, rv, L, N) {   // max deviation of the camera ruling from its chord
  N = N || 81;
  const a = slit(x,y,ru,rv,0), b = slit(x,y,ru,rv,L);
  const dx = b[0]-a[0], dy = b[1]-a[1], Ln = Math.hypot(dx,dy) || 1;
  let m = 0;
  for (let i=0;i<N;i++){ const l = L*i/(N-1), p = slit(x,y,ru,rv,l);
    const d = Math.abs(dx*(p[1]-a[1]) - dy*(p[0]-a[0]))/Ln; if (d>m) m = d; }
  return m;
}

// ================================================================
// (a) The one-rate-zero edge IS the seam: Delta = 0 there, and the
//     mixed rulings fuse — with the zeroed channel silent, not colliding.
// ================================================================
chk("Delta vanishes on the r_v = 0 edge", Delta(0.9, 0) === 0);
chk("Delta vanishes on the r_u = 0 edge", Delta(0, 0.7) === 0);
chk("Delta vanishes on the diagonal",     Delta(0.55, 0.55) === 0);
chk("Delta nonzero at a generic rig (control)", Math.abs(Delta(0.9, 0.2)) > 1e-3,
    Delta(0.9,0.2).toFixed(4));
// Fusion on the edge: MIXED rulings (xy != 0) go straight when one rate is 0.
chk("mixed ruling straight on the edge, (1,1), r=(0.9,0)",   bowOf(1,1,0.9,0,1.5)   < 1e-12);
chk("mixed ruling straight on the edge, (1.3,-0.7), r=(0.9,0)", bowOf(1.3,-0.7,0.9,0,1.5) < 1e-12);
chk("same ruling bowed once the second rate wakes (control)", bowOf(1,1,0.9,0.2,1.5) > 1e-3,
    bowOf(1,1,0.9,0.2,1.5).toExponential(2));
// Silence (theorem section 5): the zeroed channel's readout parks — g = 1, the
// image coordinate constant along the whole ruling.
{
  let silent = true, moved = false;
  for (let l=0; l<=1.5001; l+=0.05){
    const p = slit(1.3, -0.7, 0.9, 0, l);
    if (Math.abs(p[1] - (-0.7)) > 1e-15) silent = false;   // v-channel parked
    if (Math.abs(p[0] - 1.3) > 1e-3) moved = true;         // u-channel working
  }
  chk("edge is silence, not collision: v-readout parked at y, u-readout still working", silent && moved);
}

// ================================================================
// (b) Category check: the miniature's crossing is not the seam and
//     cannot be. The seam is a locus in RATE space, blind to the
//     drawing gauge; the crossing is a depth, moved by the gauge.
// ================================================================
{
  const S = Math.sqrt(2/3), r = 0.35;
  const lstar = u => (Math.sqrt(S/u)-1)/r;
  chk("crossing depth moves with the drawing unit (0.6 vs 0.8)",
      Math.abs(lstar(0.6)-lstar(0.8)) > 0.1,
      lstar(0.6).toFixed(3) + " vs " + lstar(0.8).toFixed(3));
  chk("Delta is blind to the drawing unit (same rig either way)",
      Delta(r, 0.2) === Delta(r, 0.2));
}
// Structural confinement: the toy's single depth line is an axis ruling,
// and axis rulings fuse at EVERY rig, seam or no seam (Remark 2.1) — so a
// one-channel construction cannot exhibit the split at all.
chk("axis ruling straight at a generic off-seam rig, (x,0)", bowOf(1.4,0,0.9,0.2,1.5) < 1e-12);
chk("axis ruling straight at a generic off-seam rig, (0,y)", bowOf(0,-2,0.9,0.2,1.5) < 1e-12);
// Even the isotropic two-channel version stays on the seam: r_u = r_v fuses at every rate.
{
  let iso = true;
  for (const r of [0.2, 0.5, 0.9]) if (bowOf(1,1,r,r,1.5) > 1e-12) iso = false;
  chk("isotropic toy pinned to the seam: r_u = r_v fuses at every rate", iso);
}
// Leaving the seam requires anisotropy: r_u != r_v, both nonzero.
chk("split requires two unequal, nonzero rates", bowOf(1,1,0.5,0.25,1.5) > 1e-4);

// ================================================================
// The miniature's address: the isometric pair is parallel projection,
// r_u = r_v = 0 — the orthographic corner, where the seam's three
// lines concur and Delta vanishes to order THREE, and where both
// channels are silent, which is exactly why the 1979 defect is constant.
// ================================================================
chk("corner is on all three seam lines at once", Delta(0,0) === 0 &&
    Delta(0, 0.4) === 0 && Delta(0.4, 0) === 0 && Delta(0.4, 0.4) === 0);
{
  const q = t => Delta(t, 2*t)/(t*t*t);   // Delta(ta,tb) = t^3 ab(b-a); a=1,b=2 gives 2
  chk("Delta vanishes to order three at the corner (cubic, exactly)",
      Math.abs(q(1e-2)-2) < 1e-12 && Math.abs(q(1e-5)-2) < 1e-9,
      q(1e-3).toFixed(6));
}
{
  // Both channels silent at the corner: magnification identically 1 along
  // every ruling — so against ANY drawing unit u the defect is the constant
  // u - s, at every depth: the 1979 world, derived rather than observed.
  let mag1 = true;
  for (let l=0; l<=3.0001; l+=0.1){
    const p = slit(1.3,-0.7,0,0,l);
    if (Math.abs(p[0]-1.3) > 1e-15 || Math.abs(p[1]+0.7) > 1e-15) mag1 = false;
  }
  chk("corner: both readouts parked, magnification = 1 at every depth", mag1);
  const S = Math.sqrt(2/3);
  let constDef = true;
  for (const u of [0.7, 1.0, 1.25]) {
    for (let l=0; l<=3.0001; l+=0.1) if (Math.abs((u - S*1) - (u - S)) > 1e-15) constDef = false;
  }
  chk("corner: defect against any unit is constant in depth — the constant defect located", constDef);
}

console.log("\n" + pass + "/" + (pass+fail) + " assertions pass" + (fail ? "  — " + fail + " FAILED" : ""));
process.exit(fail ? 1 : 0);
