// check_one_identity_three_grammars.js
// Dependency-free assertions for the page "one-identity-three-grammars.html"
// Grammar I  : Euclid I.43 area complements (two diagonals from the slit)
// Grammar II : semicircle altitude (mean proportional, compass anchor)
// Grammar III: mirror circle (inverse pair, tangent witness, harmonic range)
// Ancestor   : OAB + BPD = OP2 (Overflow/harmonic_area_identity.html)

let n = 0, failed = 0;
const EPS = 1e-10;
function assert(name, cond) {
  n++;
  if (!cond) { failed++; console.log(`  FAIL  ${String(n).padStart(2)}  ${name}`); }
  else console.log(`  ok    ${String(n).padStart(2)}  ${name}`);
}
function close(a, b, eps = EPS) { return Math.abs(a - b) < eps; }
function shoelace(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

// ---------- Grammars I-III: sweep s = r*lambda, unit x = 1, unit d = 1 ----------
const x = 1, d = 1;
let ok1 = true, ok2 = true, ok3 = true, ok4 = true, ok5 = true, ok6 = true,
    ok7 = true, ok8 = true, ok9 = true, altMin = Infinity, altMax = -Infinity,
    diaMin = Infinity, diaMax = -Infinity;
for (let s = 0; s <= 1.6001; s += 0.01) {
  const Xg = x * (1 + s), Xc = x / (1 + s), z = s * d;
  ok1 = ok1 && close(Xg * Xc, x * x);                          // mirror identity
  ok2 = ok2 && close(d * (Xg - x), z * x);                     // I.43 complements, glide diagonal
  ok3 = ok3 && close(d * (x - Xc), z * Xc);                    // I.43 complements, camera diagonal
  ok4 = ok4 && close(Xg / x, x / Xc);                          // divide the two: mean proportional
  const alt = Math.sqrt(Xg * Xc);                              // semicircle altitude
  ok5 = ok5 && close(alt, x);
  altMin = Math.min(altMin, alt); altMax = Math.max(altMax, alt);
  diaMin = Math.min(diaMin, Xg + Xc); diaMax = Math.max(diaMax, Xg + Xc);
  const m = (Xg + Xc) / 2, rho = (Xg - Xc) / 2;
  // Thales: apex of the altitude lies on the circle of radius m about the diameter midpoint
  ok6 = ok6 && close(Math.hypot(Xg - m, 0), rho);              // junction sits rho from center
  ok6 = ok6 && close(rho * rho + alt * alt, m * m);            // apex on the circle
  ok7 = ok7 && close(m * m - rho * rho, x * x);                // tangent length from 0 equals x
  ok8 = ok8 && close(m * m, x * x + rho * rho);                // circle through pair orthogonal to mirror
  const cr = ((x - Xg) * (-x - Xc)) / ((x - Xc) * (-x - Xg) || 1e-300);
  if (s > 1e-9) ok9 = ok9 && close(cr, -1);                    // harmonic range (Xg,Xc;x,-x)
}
assert("mirror identity Xg*Xc = x^2 for all s in [0,1.6]", ok1);
assert("I.43 glide diagonal: d(Xg - x) = z x", ok2);
assert("I.43 camera diagonal: d(x - Xc) = z Xc", ok3);
assert("division of the two equalities gives Xg : x = x : Xc", ok4);
assert("semicircle altitude = x, invariant in s", ok5);
assert("Thales: altitude apex lies on the circle on Xg+Xc", ok6);
assert("tangent length from 0 to circle through the pair = x", ok7);
assert("circle through the inverse pair is orthogonal to the mirror circle", ok8);
assert("cross-ratio (Xg, Xc; x, -x) = -1 for all s > 0", ok9);
assert("duality: section deployment has breathing diameter, pinned altitude",
       diaMax - diaMin > 0.5 && altMax - altMin < EPS);

// ---------- Ancestor: O(0,0) A(0,1) D(2,1) C(2,0), B=(b,1), P = OD ∩ BC ----------
let a1 = true, a2 = true, a3 = true, a4 = true, a5 = true,
    ancAltMin = Infinity, ancAltMax = -Infinity;
for (let b = 0.02; b <= 1.98001; b += 0.01) {
  const O = [0, 0], A = [0, 1], D = [2, 1], C = [2, 0], B = [b, 1];
  const P = [4 / (4 - b), 2 / (4 - b)];
  a1 = a1 && close(P[1], P[0] / 2);                            // P on the diagonal OD
  a1 = a1 && close((P[1] - 0) * (b - 2), (P[0] - 2) * 1);      // P on the fan line BC
  const OAB = shoelace([O, A, B]), BPD = shoelace([B, P, D]),
        OPC = shoelace([O, P, C]), OBP = shoelace([O, B, P]),
        OAD = shoelace([O, A, D]), OBC = shoelace([O, B, C]);
  a2 = a2 && close(OAB + BPD, OPC);                            // the theorem
  a3 = a3 && close(OBC, OAD) && close(OAD, 1);                 // I.37: B rides a parallel
  a4 = a4 && close(OAB + OBP + BPD, OAD)                       // the cancellation, both halves
          && close(OBP + OPC, OBC);
  const h = Math.sqrt(b * (2 - b));                            // altitude on the fixed diameter AD
  a5 = a5 && close((b - 1) * (b - 1) + h * h, 1);              // B' on the semicircle
  ancAltMin = Math.min(ancAltMin, h); ancAltMax = Math.max(ancAltMax, h);
}
assert("P = OD ∩ BC has closed form (4/(4-b), 2/(4-b))", a1);
assert("ancestor theorem OAB + BPD = OP2, all B", a2);
assert("I.37: area OBC = area OAD = 1 (B on a parallel)", a3);
assert("cancellation: both totals split with shared OBP", a4);
assert("B' lies on the semicircle on AD (Thales)", a5);
assert("duality: ancestor deployment has fixed diameter, moving altitude",
       ancAltMax - ancAltMin > 0.5);

// reciprocal ladder and the diagonal's conjugate chain
let L1 = true, L2 = true;
for (let k = 1; k <= 12; k++) {
  const pos = 2 * (k - 1) / k;                                 // fan from C through (0,k) hits top here
  // line from C(2,0) to (0,k): x = 2 - 2t, y = k t; y = 1 at t = 1/k -> x = 2(k-1)/k
  L1 = L1 && close((2 - pos) / 2, 1 / k);                      // its value is 1/k
  const yP = 2 / (4 - pos);
  L2 = L2 && close(yP, k / (k + 1));                           // diagonal carries n/(n+1)
}
assert("fan through integer heights prints the reciprocal ladder 1/n on the top edge", L1);
assert("each fan line crosses the diagonal at n/(n+1) - the conjugate chain", L2);

// sqrt ladder: squared position reads the integer
let R1 = true;
for (let k = 1; k <= 4; k++) R1 = R1 && close(Math.sqrt(k) * Math.sqrt(k), k);
assert("sqrt ladder: position sqrt(n) squares to the integer register", R1);

console.log(failed === 0 ? `\nAll ${n}/${n} checks pass.` : `\n${failed}/${n} FAILED.`);
process.exit(failed === 0 ? 0 : 1);
