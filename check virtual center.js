// check_virtual_center.js — dependency-free Node assertions for the
// "two pivots, one virtual center" reading-session plate.
// Rig: glass (image plane) at A = 0; slit centers B, D on the axis; scene beyond both.
// Channel model: each channel is a 1-D pinhole camera on the shared axis.

let n = 0, failed = 0;
function assert(name, cond, detail) {
  n++;
  if (!cond) { failed++; console.log(`  ✗ ${n}. ${name}  ${detail || ""}`); }
  else { console.log(`  ✓ ${n}. ${name}`); }
}
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// ---- core math (must match the <script id="core"> block in the HTML) ----
function hm(b, d) { return 2 * b * d / (b + d); }
function crossRatio(p, q, r, s) { return ((r - p) * (s - q)) / ((r - q) * (s - p)); }
// solve (b,d; a,x) = -1 linearly: (a-b)(x-d) + (a-d)(x-b) = 0
function fourthHarmonic(b, d, a) { return ((a - b) * d + (a - d) * b) / ((a - b) + (a - d)); }
// mark on the glass (x=0) cast by probe (z,y) through a center at depth Z — closed form
function markVia(Z, z, y) { return -Z * y / (z - Z); }
// the same mark from drawn geometry: intersect the line through (z,y),(Z,0) with x=0
function markDrawn(Z, z, y) { const t = (0 - z) / (Z - z); return y + t * (0 - y); }
// reciprocal scale (rate) of a pinhole at depth Z, evaluated at scene depth z
function rate(Z, z) { return 1 - z / Z; }

// ---- assertions over a grid of rigs ----
console.log("check_virtual_center");
const rigs = [[150, 355], [150, 250], [100, 500], [220, 300]];
for (const [B, D] of rigs) {
  const C = hm(B, D);
  console.log(` rig B=${B} D=${D} → C=${C.toFixed(4)}`);

  assert("C between B and D", B < C && C < D);
  assert("C from polar (HM) = C from cross-ratio solve",
    close(C, fourthHarmonic(B, D, 0)));
  assert("(B,D; A,C) = −1 exactly",
    close(crossRatio(B, D, 0, C), -1, 1e-12), `got ${crossRatio(B, D, 0, C)}`);

  // threading: probes on a line through a REAL center share that channel's mark
  const zs = [D + 70, D + 130, D + 210, D + 260];
  for (const P of [B, D]) {
    const k = 0.35; // line slope through (P,0)
    const marks = zs.map(z => markVia(P, z, k * (z - P)));
    const spread = Math.max(...marks) - Math.min(...marks);
    assert(`pivot ${P === B ? "B" : "D"}: marks coincide along the line`, spread < 1e-9, `spread ${spread}`);
    // the OTHER channel fans
    const Q = P === B ? D : B;
    const other = zs.map(z => markVia(Q, z, k * (z - P)));
    assert(`pivot ${P === B ? "B" : "D"}: other channel's marks scatter`,
      Math.max(...other) - Math.min(...other) > 1e-3);
  }

  // C is not a pivot: along a line through C, BOTH real channels' marks scatter,
  // while the fictional C-camera's mark is invariant (the promise it can't keep)
  const k = 0.35;
  const viaB = zs.map(z => markVia(B, z, k * (z - C)));
  const viaD = zs.map(z => markVia(D, z, k * (z - C)));
  const viaC = zs.map(z => markVia(C, z, k * (z - C)));
  assert("pivot C: B-marks scatter", Math.max(...viaB) - Math.min(...viaB) > 1e-3);
  assert("pivot C: D-marks scatter", Math.max(...viaD) - Math.min(...viaD) > 1e-3);
  assert("pivot C: the C-camera's own mark is invariant (fiction is consistent)",
    Math.max(...viaC) - Math.min(...viaC) < 1e-9);

  // the redemption: rate closure at every depth — avg of channel rates = rate of pinhole at C
  for (const z of [0, 80, C, D + 40, 600]) {
    assert(`rate closure at z=${z}`,
      close((rate(B, z) + rate(D, z)) / 2, rate(C, z), 1e-12));
  }

  // drawn geometry agrees with closed form; marks are inverted
  for (const Z of [B, D, C]) {
    const z = D + 115, y = 60;
    assert(`markDrawn = markVia for Z=${Z.toFixed(1)}`, close(markDrawn(Z, z, y), markVia(Z, z, y)));
    assert(`inversion: sign flips through Z=${Z.toFixed(1)}`, Math.sign(markVia(Z, z, y)) === -Math.sign(y));
  }

  // degeneration: slits fused → C goes real, all three centers coincide
  assert("B=D collapses C onto the pinhole", close(hm(B, B), B));
}
console.log(failed === 0 ? `ALL ${n} PASS` : `${failed}/${n} FAILED`);
process.exit(failed === 0 ? 0 : 1);
