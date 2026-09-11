// check-the-area-identity.js
// Audit of the sketched claim (session sheet, 11 Sep 2026):
//   "The sum of overlapping areas equals the sum of adjacent areas"
//   with DEFECT marked as the yellow residue, under a CONSTANT COUNT.
//
// Formalization. Count on the vertical axis: levels a_k = k, k = 0..N,
// constant step h = 1. Placement on the horizontal axis: ticks
// b_0 < b_1 < ... < b_N with b_0 = 0, b_N = S (shared endpoints,
// interior placement free — smear / pile / grade).
// The bounding rectangle is [0,S] x [0,N], area N*S.
//
// Each level k contributes one horizontal strip, each placement gap
// one vertical strip. Three anchoring conventions:
//   ADJACENT   horiz strip k runs x in [0, b_{k-1}]; vert strip k is
//              [b_{k-1}, b_k] x [0, k].  (mixed anchoring)
//   OVERLAPPING both right-anchored: horiz strip k runs [0, b_k];
//              vert strip k as above. Strips double-cover the
//              diagonal cells.
//   STARVED    both left-anchored: horiz [0, b_{k-1}], vert
//              [b_{k-1}, b_k] x [0, k-1]. Diagonal cells missed.
//
// Claims audited:
//   (i)   ADJACENT tiles the rectangle exactly: sum = N*S.
//   (ii)  OVERLAPPING = ADJACENT + D, D > 0 the defect.
//   (iii) D is exactly the area of the diagonal corner cells
//         [b_{k-1},b_k] x [k-1,k] — the yellow squares.
//   (iv)  CONSERVATION: D = h * (b_N - b_0) = S for every interior
//         placement. Smear, pile, grade relocate it; none change it.
//   (v)   STARVED = ADJACENT - D: the same bill, missed instead of
//         double-paid (the sketch's second yellow patch).
//   (vi)  Refining the count starves the defect linearly: D(h) = h*S.
//
// Rig flavor: S = 187.5 (the neutral surface z*), Turn rate seated at
// Zp = 200. The identity itself is placement- and rig-independent.

const TOL = 1e-9;
let pass = 0, fail = 0, n = 0;
function check(label, ok) {
  n++;
  if (ok) { pass++; console.log(`  ok  ${String(n).padStart(2)} ${label}`); }
  else    { fail++; console.log(`FAIL  ${String(n).padStart(2)} ${label}`); }
}
const eq = (x, y, tol = TOL) => Math.abs(x - y) <= tol;

const N = 4;            // levels drawn in the sketch
const S = 187.5;        // placement span: the rig's neutral surface
const Zp = 200;         // Turn rate seat

// ---- placements: b_0 = 0, b_N = S, interior free -------------------
function smear(N, S) {           // equal intervals
  return Array.from({length: N + 1}, (_, k) => (k * S) / N);
}
function pile(N, S) {            // near-perfect steps, one huge gap
  const d = S / (8 * N);
  const b = Array.from({length: N + 1}, (_, k) => k * d);
  b[N] = S;
  return b;
}
function grade(N, S, seat) {     // Turn placement, mu = c*k/(1 + r k)
  const r = 1 / seat;
  const c = (S * (1 + r * N)) / N;
  return Array.from({length: N + 1}, (_, k) => (c * k) / (1 + r * k));
}

// ---- strip sums under the three conventions ------------------------
function sums(b) {
  const Nn = b.length - 1;
  let adj = 0, ovl = 0, stv = 0, diag = 0;
  for (let k = 1; k <= Nn; k++) {
    const dv = b[k] - b[k - 1];
    adj += b[k - 1] + k * dv;            // horiz to b_{k-1} + vert to k
    ovl += b[k]     + k * dv;            // horiz to b_k     + vert to k
    stv += b[k - 1] + (k - 1) * dv;      // horiz to b_{k-1} + vert to k-1
    diag += dv * 1;                      // corner cell area, height h=1
  }
  return { adj, ovl, stv, diag };
}

// ---- exact cell-coverage map (multiplicity per grid cell) ----------
function coverage(b, convention) {
  const Nn = b.length - 1;
  let double_ = 0, gap = 0, single = 0;
  for (let j = 1; j <= Nn; j++) {        // placement cell index
    for (let k = 1; k <= Nn; k++) {      // count cell index
      const area = (b[j] - b[j - 1]) * 1;
      let m = 0;
      if (convention === 'adjacent')    m = (j <= k - 1 ? 1 : 0) + (k <= j ? 1 : 0);
      if (convention === 'overlapping') m = (j <= k     ? 1 : 0) + (k <= j ? 1 : 0);
      if (convention === 'starved')     m = (j <= k - 1 ? 1 : 0) + (k <= j - 1 ? 1 : 0);
      if (m === 0) gap += area;
      if (m === 1) single += area;
      if (m === 2) double_ += area;
    }
  }
  return { gap, single, double_ };
}

console.log('check-the-area-identity — the sketch\'s conservation panel');
console.log(`rig flavor: N = ${N}, span S = ${S} (z*), Turn seat = ${Zp}\n`);

const RECT = N * S;
const placements = {
  smear: smear(N, S),
  pile:  pile(N, S),
  grade: grade(N, S, Zp),
};
const defects = {};

for (const [name, b] of Object.entries(placements)) {
  console.log(`— placement: ${name}  [${b.map(x => x.toFixed(2)).join(', ')}]`);
  check(`${name}: monotone, endpoints 0 and S`,
    b.every((x, i) => i === 0 || x > b[i - 1]) && eq(b[0], 0) && eq(b[N], S));

  const s = sums(b);
  // (i) adjacent tiles the rectangle
  check(`${name}: ADJACENT strip-sum = N*S (tiling exact)`, eq(s.adj, RECT));
  const covA = coverage(b, 'adjacent');
  check(`${name}: adjacent coverage — no gaps, no double-cover`,
    eq(covA.gap, 0) && eq(covA.double_, 0) && eq(covA.single, RECT));

  // (ii)+(iii) overlapping exceeds by exactly the diagonal cells
  const D = s.ovl - s.adj;
  defects[name] = D;
  check(`${name}: OVERLAPPING - ADJACENT = D = ${D.toFixed(4)}`, D > 0);
  check(`${name}: D equals the diagonal corner-cell area exactly`,
    eq(D, s.diag));
  const covO = coverage(b, 'overlapping');
  check(`${name}: overlap coverage — double-covered area = D, no gaps`,
    eq(covO.double_, D) && eq(covO.gap, 0));

  // (v) starved misses by the same bill
  check(`${name}: ADJACENT - STARVED = same D (gap on the diagonal)`,
    eq(s.adj - s.stv, D));
  const covS = coverage(b, 'starved');
  check(`${name}: starved coverage — gap area = D, no double-cover`,
    eq(covS.gap, D) && eq(covS.double_, 0));
  console.log('');
}

// (iv) conservation across policies
console.log('— conservation');
check('D(smear) = D(pile) = D(grade): the bill ignores the arrangement',
  eq(defects.smear, defects.pile) && eq(defects.pile, defects.grade));
check(`D = h * span = 1 * ${S} exactly (one count-step of placement)`,
  eq(defects.smear, S));
check('D / rectangle = 1/N: the defect is one count-step\'s share',
  eq(defects.smear / RECT, 1 / N));

// where the bill sits: largest single corner cell per policy
const cellShare = b => {
  let mx = 0;
  for (let k = 1; k <= N; k++) mx = Math.max(mx, b[k] - b[k - 1]);
  return mx / S;
};
console.log('\n— placement of the bill (largest corner cell / D)');
check(`smear: cells equal, max share = 1/N`,
  eq(cellShare(placements.smear), 1 / N));
check('pile: one cell carries ~90%+ of the defect',
  cellShare(placements.pile) > 0.9);
const gb = placements.grade;
check('grade: corner cells strictly shrinking toward the seat',
  Array.from({length: N - 1}, (_, i) => i + 1)
    .every(k => (gb[k] - gb[k - 1]) > (gb[k + 1] - gb[k])));

// (vi) refinement starves the defect linearly
console.log('\n— refinement: count pressed finer against the same span');
function refinedDefect(m) {          // count step h = 1/m over same span
  const Nf = N * m, h = 1 / m;
  const b = grade(Nf, S, Zp);
  let D = 0;
  for (let k = 1; k <= Nf; k++) D += (b[k] - b[k - 1]) * h;
  return D;
}
const D1 = refinedDefect(1), D2 = refinedDefect(2), D4 = refinedDefect(4);
check(`h=1/2: D = ${D2.toFixed(4)} = S/2`, eq(D2, S / 2));
check(`h=1/4: D = ${D4.toFixed(4)} = S/4`, eq(D4, S / 4));
check('halving the step halves the bill (ratio 2.0000, twice)',
  eq(D1 / D2, 2) && eq(D2 / D4, 2));

console.log(`\n${pass}/${n} checks pass${fail ? ` — ${fail} FAILED` : ''}`);
process.exit(fail ? 1 : 0);
