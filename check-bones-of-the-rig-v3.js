// check-bones-of-the-rig-v3.js — pre-build checks for bones-of-the-rig-v3.html
// v3 makes the balance point reachable: QMAX = 6 − 3√2 exactly, where MQ = OA
// (congruent circles, equal spans, equal witness heights, and the pair-swap
// half-turn about the midpoint of O and M — the third involution — turns metric).
// The sweep gains the orthogonality law OM² = OA² + MQ², which holds at every Q.
// The GM block is mirrored verbatim in the page.

/* GM-BEGIN */
const A = 0, C = 6, O = 3, R = 3;              // slits at A and C; O their midpoint; R = OA
const Sof = Q => 3 * Q / (Q - 3);              // harmonic conjugate of Q w.r.t. A, C
const rig = Q => {
  const S = Sof(Q), M = (Q + S) / 2;
  return { S, M, MQ: Q - M, OQ: O - Q, OS: O - S, MA: A - M, MC: C - M };
};
const cross = (a, c, q, s) => ((q - a) * (s - c)) / ((q - c) * (s - a));
const tangentF = S => {                        // tangent from S to the fixed circle, upper touch
  const d = O - S, t2 = d * d - R * R;
  return { x: O + R * R * (S - O) / (d * d), y: R * Math.sqrt(t2) / d, t2 };
};
const tangentB = g => {                        // tangent from C to the breathing circle, upper touch
  const d = g.MC, t2 = d * d - g.MQ * g.MQ;
  return { x: g.M + g.MQ * g.MQ * (C - g.M) / (d * d), y: g.MQ * Math.sqrt(t2) / d, t2 };
};
const QBAL = 6 - 3 * Math.sqrt(2);             // the balance point: MQ = OA
const QMIN = 0.30, QMAX = QBAL;
/* GM-END */

let pass = 0, fail = 0, worst = 0;
const ck = (name, v, tol = 1e-9) => {
  const a = Math.abs(v);
  if (a > worst) worst = a;
  if (a < tol) pass++; else { fail++; console.log('FAIL', name, v); }
};

const step = (QMAX - QMIN) / 290;
for (let i = 0; i <= 290; i++) {
  const Q = QMIN + i * step;
  const g = rig(Q);
  // the harmonic quadruple
  ck('cross-ratio (A,C;Q,S) = -1', cross(A, C, Q, g.S) + 1);
  ck('C = harmonic mean of Q and S (A at 0)', 2 / (1 / Q + 1 / g.S) - C);
  // the two Newton relations
  ck('fixed: OQ·OS = OA²', g.OQ * g.OS - R * R);
  ck('breathing: MA·MC = MQ²', g.MA * g.MC - g.MQ * g.MQ);
  ck('breathing radius = GM of slit distances', g.MQ - Math.sqrt(g.MA * g.MC));
  // the two involutions, as inversions
  ck('fixed circle sends Q to S (slits fixed)', (O + R * R / (Q - O)) - g.S);
  ck('breathing circle swaps the slits', (g.M + g.MQ * g.MQ / (A - g.M)) - C);
  // the orthogonality law — equivalent to the harmonic condition, holds at every Q
  ck('circles orthogonal: OM² = OA² + MQ²', (O - g.M) * (O - g.M) - R * R - g.MQ * g.MQ);
  // fixed witness: tangent from S
  const TF = tangentF(g.S);
  ck('ST² = SA·SC', TF.t2 - (A - g.S) * (C - g.S));
  ck('T on the fixed circle', Math.hypot(TF.x - O, TF.y) - R);
  ck('OT ⊥ ST', (TF.x - O) * (TF.x - g.S) + TF.y * TF.y, 1e-8);
  ck('fixed witness lands over Q (Tx = Q)', TF.x - Q);
  // breathing witness: tangent from C
  const TB = tangentB(g);
  ck('CT′² = CQ·CS', TB.t2 - (C - Q) * (C - g.S));
  ck('T′ on the breathing circle', Math.hypot(TB.x - g.M, TB.y) - g.MQ);
  ck('MT′ ⊥ CT′', (TB.x - g.M) * (TB.x - C) + TB.y * TB.y, 1e-8);
  ck('breathing witness lands over A (T′x = A)', TB.x - A);
  // Euclid I.43 — the complement diagonals pass through the centers
  ck('I.43 fixed diagonal through O', 3 + (O - g.S) / (C - g.S) * (-g.OQ - 3));
  ck('I.43 breathing diagonal through M', -g.MA + (g.M - g.S) / (C - g.S) * (g.MQ + g.MA));
}

// the balance point, exactly
{
  const Q = QBAL, g = rig(Q), TF = tangentF(g.S), TB = tangentB(g);
  ck('balance: MQ = OA (congruent circles)', g.MQ - R);
  ck('balance: span Q–S = span A–C', (Q - g.S) - (C - A));
  ck('balance: OQ = MA', g.OQ - g.MA);
  ck('balance: witness heights equal', TF.y - TB.y);
  const h = (O + g.M) / 2;                     // the half-turn center
  ck('balance: half-turn about (O+M)/2 sends A to Q', 2 * h - A - Q);
  ck('balance: half-turn about (O+M)/2 sends C to S', 2 * h - C - g.S);
  ck('balance: OQ = 3(√2−1) — silver units', g.OQ - 3 * (Math.sqrt(2) - 1));
}

// stage bounds at the slider extremes
[QMIN, QMAX].forEach(Q => {
  const g = rig(Q);
  if (g.S < -4.25) { fail++; console.log('FAIL stage: S off stage at Q =', Q, g.S); } else pass++;
  if (g.MQ > 3.0)  { fail++; console.log('FAIL stage: breathing radius > OA at Q =', Q); } else pass++;
  if (tangentB(g).y > 3.0) { fail++; console.log('FAIL stage: T′ above stage at Q =', Q); } else pass++;
});

console.log(`${pass}/${pass + fail} checks pass; worst residual ${worst.toExponential(2)}`);
if (fail) process.exit(1);
