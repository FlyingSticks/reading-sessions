// check-the-gauge.js
// Audit of the sketch sheet's remaining panels (11 Sep 2026) before
// they are drawn interactive in the-gauge.html.
//
// PANEL 1 — "GAUGE, SAME COUNT": three fans, Types A, B, C.
// Model: a band of equally spaced count lines; feet equally spaced on
// the base; a seat V; rays from V through the feet write marks on
// every level. Claims:
//   (1) at each level the marks stay equally spaced (the count
//       survives every level);
//   (2) the write-scale at height y is s = 1 - y/v (v = seat height):
//       the type is the seat's address, nothing else;
//   (3) seat above the band: s > 0 everywhere - Types A and B are one
//       type at two heights, higher seat writing gentler;
//   (4) seat inside the band: s < 0 above the seat's level - Type C,
//       the count inverting through the seat; s = 0 at the seat's own
//       level (collapse).
//
// PANEL 2 — "GLIDE VANISHING AXIS", two placements of one count.
// Model: the axis is a line; a fence of equal steps recedes on a
// second, non-parallel line; a seat transfers fence posts to axis
// marks by projection. Claims:
//   (5) the marks are Mobius in the count k - equivalently Turn form
//       m_k = ring - c/(k+e);
//   (6) the ring (limit) is the image of the fence's direction, at a
//       finite address on the axis;
//   (7) harmonic conjugacy at every interior tick:
//       (m_{k-1}, m_{k+1}; m_k, ring) = -1 exactly - why the gauge is
//       called harmonic;
//   (8) crowding: gaps strictly decrease toward the ring;
//   (9) the bank (ring - m_N) is positive at every stop, decreasing,
//       never zero - the account under the crimson wash;
//  (10) no single ruler: the marks are not an affine image of the
//       count - the fence and the axis cannot share a graduation, so
//       the construction's two lines are a necessity, not a style.
//
// Constants mirror the-gauge.html exactly (drawing units).

const TOL = 1e-9;
let pass = 0, fail = 0, n = 0;
function check(label, ok) {
  n++;
  if (ok) { pass++; console.log(`  ok  ${String(n).padStart(2)} ${label}`); }
  else    { fail++; console.log(`FAIL  ${String(n).padStart(2)} ${label}`); }
}
const eq = (x, y, tol = TOL) => Math.abs(x - y) <= tol;

console.log('check-the-gauge — the fans and the transfer construction\n');

/* ---------------- Panel 1: the fans ---------------- */
// heights measured up from the base line; band top at B.
const B = 220, FU = 44, NF = 4;               // band height, foot step, feet 0..NF
const feet = Array.from({length: NF + 1}, (_, i) => 160 + i * FU);
function marksAt(seat, y) {                    // seat = [vx, v]
  const [vx, v] = seat;
  return feet.map(fx => fx + (vx - fx) * (y / v));
}
const seats = { A: [248, 240], B: [248, 330], C: [248, 110] }; // A/B above band, C inside — mirrors the-gauge.html

// (1) equal spacing at every level, every seat
for (const [name, s] of Object.entries(seats)) {
  let equal = true;
  for (const y of [55, 110, 165, 220]) {
    const m = marksAt(s, y), g0 = m[1] - m[0];
    for (let i = 2; i <= NF; i++) if (!eq(m[i] - m[i - 1], g0)) equal = false;
  }
  check(`type ${name}: marks equally spaced at every level (count survives)`, equal);
}
// (2) write-scale law s(y) = 1 - y/v
{
  const [ , v] = seats.A;
  const ok = [55, 165, 220].every(y => {
    const m = marksAt(seats.A, y);
    return eq((m[1] - m[0]) / FU, 1 - y / v);
  });
  check('write-scale s = 1 - y/v exact (the type is the seat\'s address)', ok);
}
// (3) A and B: one type, two heights; higher seat writes gentler
{
  const sTopA = 1 - B / seats.A[1], sTopB = 1 - B / seats.B[1];
  check('A, B: seat above band, scale positive at every level', sTopA > 0 && sTopB > 0);
  check('higher seat, gentler write: s_top(B) > s_top(A)', sTopB > sTopA);
}
// (4) C: inversion above the seat's level, collapse at it
{
  const [ , v] = seats.C;                      // v = 120, inside the band
  const below = marksAt(seats.C, 55), above = marksAt(seats.C, 165);
  check('C: below the seat\'s level order preserved (s > 0)', below[1] > below[0]);
  check('C: above the seat\'s level order inverted (s < 0)', above[1] < above[0]);
  const at = marksAt(seats.C, v);
  check('C: at the seat\'s level the write collapses (s = 0)', eq(at[0], at[NF]));
}

/* ---------------- Panel 2: the transfer ---------------- */
// axis: the glide line; heights signed, seat above (+), fence below (-).
const CX = 120, HC = 110;                      // seat on axis coords, height above axis
const P0X = 170, HP0 = -65, DX = 30, DH = -18; // fence: first post, step
const KMAX = 12;
const postX = k => P0X + DX * k;
const postH = k => HP0 + DH * k;
const mark = k => CX + (postX(k) - CX) * HC / (HC - postH(k));
const RING = CX - HC * DX / DH;                // image of the fence direction
const m = Array.from({length: KMAX + 1}, (_, k) => mark(k));

// (5) Mobius / Turn form: fit from k = 0, 1 then verify all k
{
  // Turn form m_k = RING - c/(k+e): two unknowns from k=0,1
  const d0 = RING - m[0], d1 = RING - m[1];    // c/e and c/(1+e)
  const e = d1 / (d0 - d1), c = d0 * e;
  const ok = m.every((mk, k) => eq(mk, RING - c / (k + e), 1e-7));
  check(`Turn form m_k = ring - c/(k+e) exact for k = 0..${KMAX}`, ok);
}
// (6) the ring is finite and on the axis
check(`the ring sits at a finite address (${RING.toFixed(2)} drawing units)`,
  Number.isFinite(RING) && RING > m[KMAX]);
// (7) harmonic conjugacy at every interior tick
{
  const CR = (a, b, c, d) => ((c - a) * (d - b)) / ((c - b) * (d - a));
  const ok = Array.from({length: KMAX - 1}, (_, i) => i + 1)
    .every(k => eq(CR(m[k - 1], m[k + 1], m[k], RING), -1, 1e-9));
  check('(m_{k-1}, m_{k+1}; m_k, ring) = -1 at every interior tick', ok);
}
// (8) crowding
check('gaps strictly decreasing toward the ring',
  Array.from({length: KMAX - 1}, (_, i) => i + 1)
    .every(k => (m[k] - m[k - 1]) > (m[k + 1] - m[k])));
// (9) the bank
{
  const bank = k => RING - m[k];
  check('bank positive at every stop (the wash never empties)',
    m.every((_, k) => bank(k) > 0));
  check('bank strictly decreasing (each tick pays, none settles)',
    Array.from({length: KMAX}, (_, i) => i + 1).every(k => bank(k) < bank(k - 1)));
}
// (10) no single ruler: marks not affine in the count
{
  const second = Array.from({length: KMAX - 1}, (_, i) => i + 1)
    .map(k => m[k + 1] - 2 * m[k] + m[k - 1]);
  check('second differences nonzero: the marks are no affine image of the count',
    second.every(s => Math.abs(s) > 1e-6));
  // and the fence itself IS affine in the count (equal steps on its own line)
  const stepLen = Math.hypot(DX, DH);
  const ok = Array.from({length: KMAX}, (_, i) => i + 1).every(k =>
    eq(Math.hypot(postX(k) - postX(k - 1), postH(k) - postH(k - 1)), stepLen));
  check('the fence keeps equal steps on its own line (Reach placement intact)', ok);
}
// bonus: a parallel fence would transfer affinely - the oblique is necessary
{
  const mPar = k => CX + (postX(k) - CX) * HC / (HC - HP0); // DH = 0 case
  const g = mPar(1) - mPar(0);
  const ok = Array.from({length: KMAX}, (_, i) => i + 1)
    .every(k => eq(mPar(k) - mPar(k - 1), g));
  check('control: a fence parallel to the axis transfers with no crowding at all',
    ok);
}

console.log(`\n${pass}/${n} checks pass${fail ? ` — ${fail} FAILED` : ''}`);
process.exit(fail ? 1 : 0);
