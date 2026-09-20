// check-bones-of-the-rig-v2.js — pre-build checks for bones-of-the-rig-v2.html
// v2 adds the breathing circle's own tangent witness (from C, touching at T′) and the
// two landing facts: the fixed witness T sits directly above Q, the breathing witness
// T′ sits directly above A. The GM block is mirrored verbatim in the page.

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
const QMIN = 0.30, QMAX = 1.75;
/* GM-END */

let pass = 0, fail = 0, worst = 0;
const ck = (name, v, tol = 1e-9) => {
  const a = Math.abs(v);
  if (a > worst) worst = a;
  if (a < tol) pass++; else { fail++; console.log('FAIL', name, v); }
};

for (let i = 0; i <= 290; i++) {
  const Q = QMIN + i * 0.005;
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

// stage bounds at the slider extremes
[QMIN, QMAX].forEach(Q => {
  const g = rig(Q);
  if (g.S < -4.25) { fail++; console.log('FAIL stage: S off stage at Q =', Q, g.S); } else pass++;
  if (g.MQ > 3.0)  { fail++; console.log('FAIL stage: breathing radius > OA at Q =', Q); } else pass++;
  if (tangentB(g).y > 3.0) { fail++; console.log('FAIL stage: T′ above stage at Q =', Q); } else pass++;
});

console.log(`${pass}/${pass + fail} checks pass; worst residual ${worst.toExponential(2)}`);
if (fail) process.exit(1);
