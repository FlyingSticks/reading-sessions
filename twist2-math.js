// the-twist v2 — the sheet's rig. Lives inline in the-twist-v2.html (script id="twist2-math")
// and is loaded by check-the-twist-v2.js. One text, two homes.
(function (root) {
  const M = {};
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
  const norm = p => Math.sqrt(dot(p, p));
  M.v = { sub, dot, cross, norm };

  // The sheet: square ABCD, half-side s, in the floor z = 0.
  // A bottom-left, B top-left, C bottom-right, D top-right (plan: x right, y up).
  // AC (the bottom edge) stays. BD (the top edge) rotates by th about the square's
  // midline parallel to AB — the y-axis through the centre. AB and CD are carried along.
  M.corners = function (s, th) {
    const c = Math.cos(th), si = Math.sin(th);
    return { A: [-s, -s, 0], B: [-s * c, s, -s * si], C: [s, -s, 0], D: [s * c, s, s * si] };
  };
  // BD's "top face" after rotation: the rotated +z, dotted with +z. +1 red up, 0 edge-on, −1 blue up.
  M.faceUp = th => Math.cos(th);

  M.det = P => dot(sub(P.B, P.A), cross(sub(P.C, P.A), sub(P.D, P.A)));
  M.detFormula = (s, th) => -8 * s * s * s * Math.sin(th);

  // Common perpendicular between the two sides AB and CD.
  M.sideGap = function (P) {
    const d1 = sub(P.B, P.A), d2 = sub(P.D, P.C), n = cross(d1, d2), nn = norm(n);
    if (nn < 1e-12) return { gap: 0, parallel: true };
    return { gap: Math.abs(dot(sub(P.C, P.A), n)) / nn, parallel: false };
  };
  M.sideGapFormula = (s, th) => 2 * s * Math.abs(Math.cos(th / 2));

  // Where the plan images of AB and CD cross, with the heights of the two lines there.
  // t is the parameter along AB (0 at A, 1 at B); inside: both segments contain the crossing.
  M.planCrossing = function (P) {
    const ax = P.A[0], ay = P.A[1], bx = P.B[0] - ax, by = P.B[1] - ay;
    const cx = P.C[0], cy = P.C[1], dx = P.D[0] - cx, dy = P.D[1] - cy;
    const den = bx * dy - by * dx;
    if (Math.abs(den) < 1e-12 * Math.hypot(bx, by) * Math.hypot(dx, dy)) return { finite: false };
    const t = ((cx - ax) * dy - (cy - ay) * dx) / den;
    const u = ((cx - ax) * by - (cy - ay) * bx) / den;
    const z1 = P.A[2] + (P.B[2] - P.A[2]) * t, z2 = P.C[2] + (P.D[2] - P.C[2]) * u;
    return { finite: true, x: ax + bx * t, y: ay + by * t, t, u, z1, z2, gap: z1 - z2, inside: t >= -1e-9 && t <= 1 + 1e-9 && u >= -1e-9 && u <= 1 + 1e-9 };
  };
  // On the projector through that crossing, AB and CD are 2s·cot(θ/2) apart (AB below).
  M.projectorGapFormula = (s, th) => -2 * s / Math.tan(th / 2);

  root.TwistMath2 = M;
})(typeof window !== 'undefined' ? window : globalThis);
