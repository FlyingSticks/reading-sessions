// check-the-defect-census.js — stands behind the-defect-census.html
// Re-verifies every census claim this script can compute; cites the rest.
'use strict';

var EPS = 1e-9;
var pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; } else { fail++; console.log('FAIL: ' + name); }
}
function rand(a, b) { return a + Math.random() * (b - a); }

// ---------- C1: the refusal — floor witness f(d) = 2(1+d)/(2+d) ----------
function floorWitness(d) { return 2 * (1 + d) / (2 + d); }
var ok, d, prev;

ok = true;
for (d = 0; d <= 100; d += 0.25) { if (floorWitness(d) < 1 - EPS) { ok = false; } }
check('C1: floor holds, f(d) >= 1 on [0,100]', ok);                       // 1
check('C1: equality only at d = 0', floorWitness(0) === 1 &&
  floorWitness(0.01) > 1 + 1e-4);                                          // 2
ok = true; prev = floorWitness(0);
for (d = 0.25; d <= 100; d += 0.25) {
  var v = floorWitness(d); if (v <= prev) { ok = false; } prev = v;
}
check('C1: witness strictly increasing', ok);                              // 3
check('C1: supremum is 2', floorWitness(1e9) > 2 - 1e-6 &&
  floorWitness(1e9) < 2);                                                  // 4

// ---------- C3/C4: the miss family — split norm vs 3D gap ----------
function gap3d(D, ds, dt, s1, t2, s2, t1) {
  var cross = s1 * t2 - s2 * t1;
  return D * Math.abs(ds * dt) /
    Math.sqrt(D * D * ds * ds + D * D * dt * dt + cross * cross);
}
var i, D = 100;

ok = true; // zero set: N(delta) = 0 (a factor vanishes) => gap = 0
for (i = 0; i < 200; i++) {
  var g0 = gap3d(D, 0, rand(-5, 5), rand(-5, 5), rand(-5, 5), rand(-5, 5), rand(-5, 5));
  var g1 = gap3d(D, rand(-5, 5), 0, rand(-5, 5), rand(-5, 5), rand(-5, 5), rand(-5, 5));
  if (g0 > EPS || g1 > EPS) { ok = false; }
}
check('C3/C4: N(delta) = 0 gives gap = 0 (200 samples)', ok);              // 5

ok = true; // N nonzero => gap > 0
for (i = 0; i < 200; i++) {
  var ds = rand(0.1, 5) * (Math.random() < 0.5 ? -1 : 1);
  var dt = rand(0.1, 5) * (Math.random() < 0.5 ? -1 : 1);
  if (gap3d(D, ds, dt, rand(-5, 5), rand(-5, 5), rand(-5, 5), rand(-5, 5)) <= EPS) { ok = false; }
}
check('C3/C4: N(delta) != 0 gives gap > 0 (200 samples)', ok);             // 6

ok = true; // gap is a positive multiple of |N(delta)| — factor positive, finite
for (i = 0; i < 200; i++) {
  var ds2 = rand(0.1, 5), dt2 = rand(0.1, 5);
  var N = ds2 * dt2;
  var g = gap3d(D, ds2, dt2, rand(-5, 5), rand(-5, 5), rand(-5, 5), rand(-5, 5));
  var factor = g / Math.abs(N);
  if (!(factor > 0 && isFinite(factor))) { ok = false; }
}
check('C3/C4: gap = positive factor times |N(delta)|', ok);                // 7

// ---------- C8: the account — conservation and linearity ----------
// Corner cells: level i owns a cell h wide by (b_i - b_{i-1}) deep. Total telescopes.
function account(h, b) {
  var A = 0, i;
  for (i = 1; i < b.length; i++) { A += h * (b[i] - b[i - 1]); }
  return A;
}
function placement(kind, N, S) {
  var b = [0], i;
  if (kind === 'smear') {
    for (i = 1; i < N; i++) { b.push(S * i / N); }
  } else if (kind === 'pile') {
    for (i = 1; i < N; i++) { b.push(S * 0.05 * i); }
  } else { // grade: harmonic crowding toward the far end
    for (i = 1; i < N; i++) { b.push(S * (1 - 1 / (i + 1)) * (N + 1) / N); }
  }
  b.push(S);
  return b;
}
var S = 187.5, N = 4;
var A1 = account(1, placement('smear', N, S));
var A2 = account(1, placement('pile', N, S));
var A3 = account(1, placement('grade', N, S));
check('C8: A = 187.5 under smear', Math.abs(A1 - 187.5) < EPS);            // 8
check('C8: A identical under pile', Math.abs(A2 - A1) < EPS);              // 9
check('C8: A identical under grade', Math.abs(A3 - A1) < EPS);             // 10
ok = true; // arbitrary monotone interior placements
for (i = 0; i < 100; i++) {
  var pts = [0], j, acc = 0;
  for (j = 0; j < 3; j++) { acc += rand(0.01, 1); pts.push(acc); }
  var scale = S / (acc + rand(0.01, 1));
  for (j = 1; j < pts.length; j++) { pts[j] *= scale; }
  pts.push(S);
  if (Math.abs(account(1, pts) - S) > 1e-6) { ok = false; }
}
check('C8: conserved for arbitrary monotone placements', ok);              // 11
check('C8: halves exactly with the step', Math.abs(account(0.5,
  placement('grade', N, S)) - S / 2) < EPS);                               // 12

// ---------- C9: the rate-space cubic ----------
function cubic(ru, rv) { return ru * rv * (rv - ru); }
ok = true;
for (i = 0; i < 100; i++) {
  var r0 = rand(-3, 3);
  if (Math.abs(cubic(0, r0)) > EPS || Math.abs(cubic(r0, 0)) > EPS ||
      Math.abs(cubic(r0, r0)) > EPS) { ok = false; }
}
check('C9: cubic vanishes on the three seam lines', ok);                   // 13
ok = true;
for (i = 0; i < 100; i++) {
  var a = rand(0.1, 3), b2 = rand(0.1, 3) + a + 0.1; // distinct, nonzero
  if (Math.abs(cubic(a, b2)) <= EPS) { ok = false; }
}
check('C9: cubic nonzero off the seam lines', ok);                         // 14
ok = true; // order 3 at the corner: Delta(ta, tb) = t^3 Delta(a, b)
for (i = 0; i < 100; i++) {
  var t = rand(0.1, 4), aa = rand(-3, 3), bb = rand(-3, 3);
  if (Math.abs(cubic(t * aa, t * bb) - t * t * t * cubic(aa, bb)) > 1e-7) { ok = false; }
}
check('C9: homogeneous of order 3 at the corner', ok);                     // 15

// ---------- C10: the gauge ledger ----------
function measure(L, n) {
  var x = n * L, m = Math.floor(x);
  if (Math.abs(x - Math.round(x)) < EPS) { m = Math.round(x); }
  var gd = x - m;
  if (gd < EPS) { gd = 0; }
  return { m: m, gd: gd, ad: gd / n };
}
var R2 = Math.SQRT2, F = 7 / 5, n, r;

ok = true;
for (n = 1; n <= 48; n++) {
  r = measure(R2, n);
  if (!(r.m / n <= R2 && R2 < (r.m + 1) / n)) { ok = false; }
}
check('C10: bracket holds for root 2, n <= 48', ok);                       // 16
ok = true;
for (n = 1; n <= 48; n++) {
  r = measure(R2, n);
  if (Math.abs(r.gd - n * r.ad) > 1e-9) { ok = false; }
}
check('C10: currencies agree, gauge = n x absolute', ok);                  // 17
ok = true;
for (n = 1; n <= 48; n++) { if (measure(R2, n).gd === 0) { ok = false; } }
check('C10: root 2 never posts a zero, n <= 48', ok);                      // 18
ok = true;
for (n = 1; n <= 48; n++) {
  r = measure(F, n);
  if ((n % 5 === 0) !== (r.gd === 0)) { ok = false; }
}
check('C10: 7/5 posts zeros exactly at multiples of 5', ok);               // 19
var lateMax = 0;
for (n = 40; n <= 48; n++) { r = measure(R2, n); if (r.gd > lateMax) { lateMax = r.gd; } }
check('C10: no late-gauge collapse of the ledger', lateMax > 0.5);         // 20

// ---------- witnesses and precedents ----------
check('rig: z* harmonic mean 2*150*250/400 = 187.5',
  Math.abs(2 * 150 * 250 / 400 - 187.5) < EPS);                            // 21

// porch, the map case: classical angle defect — Girard on the unit octant.
// Three mutually orthogonal vertices; each spherical angle is pi/2;
// excess (angle sum - pi) equals area = pi/2.
(function () {
  var Vx = [1, 0, 0], Vy = [0, 1, 0], Vz = [0, 0, 1];
  function angleAt(A, B, C) { // spherical angle at vertex A of triangle ABC
    function cross(u, w) {
      return [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    }
    function dot(u, w) { return u[0] * w[0] + u[1] * w[1] + u[2] * w[2]; }
    function norm(u) { return Math.sqrt(dot(u, u)); }
    var u = cross(A, B), w = cross(A, C);
    return Math.acos(dot(u, w) / (norm(u) * norm(w)));
  }
  var sum = angleAt(Vx, Vy, Vz) + angleAt(Vy, Vz, Vx) + angleAt(Vz, Vx, Vy);
  check('porch/map: octant angles are three right angles',
    Math.abs(sum - 3 * Math.PI / 2) < 1e-12);                              // 22
  check('porch/map: angle defect (excess) = area = pi/2',
    Math.abs((sum - Math.PI) - Math.PI / 2) < 1e-12);                      // 23
})();

// the miniature's welded number, distinct from the drawing's run
check('miniature: sqrt(2/3) = .8165, distinct from cos 30 = .8660',
  Math.abs(Math.sqrt(2 / 3) - 0.816496580927726) < 1e-12 &&
  Math.abs(Math.cos(Math.PI / 6) - 0.8660254037844387) < 1e-12 &&
  Math.abs(Math.sqrt(2 / 3) - Math.cos(Math.PI / 6)) > 0.04);              // 24

console.log(pass + '/' + (pass + fail) + ' checks passed' +
  (fail ? ' — FAILURES ABOVE' : ''));
process.exit(fail ? 1 : 0);
