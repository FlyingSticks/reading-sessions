// the-twist — shared math. Lives inline in the-twist-v1.html (script id="twist-math")
// and is loaded by check-the-twist.js. One text, two homes.
(function (root) {
  const M = {};
  const EPS = 1e-9;

  // --- vectors ---------------------------------------------------------
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
  const mul = (p, k) => [p[0] * k, p[1] * k, p[2] * k];
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
  const norm = p => Math.sqrt(dot(p, p));
  const det3 = (u, v, w) => dot(u, cross(v, w));
  M.v = { sub, add, mul, dot, cross, norm, det3 };

  // --- the rig -----------------------------------------------------------
  // A rectangle of half-widths a (x) and b (y) in the plane z = 0.
  // The right red edge (x = +a) is twisted about the x-axis by th.
  // Vertex order is fixed: P1 = (-a,-b), P2 = (-a,+b), P3 = twist of (+a,+b), P4 = twist of (+a,-b).
  M.corners = function (a, b, th) {
    const c = Math.cos(th), s = Math.sin(th);
    return [[-a, -b, 0], [-a, b, 0], [a, b * c, b * s], [a, -b * c, -b * s]];
  };
  // The three pairings of the four points into opposite edges.
  M.pairs = [
    { name: 'red',  lines: [[0, 1], [2, 3]] },   // the two red edges
    { name: 'blue', lines: [[0, 2], [1, 3]] },   // the two blue diagonals
    { name: 'gold', lines: [[0, 3], [1, 2]] }    // the remaining pair
  ];

  // --- the determinant ----------------------------------------------------
  M.det = P => det3(sub(P[1], P[0]), sub(P[2], P[0]), sub(P[3], P[0]));
  M.detFormula = (a, b, th) => 8 * a * b * b * Math.sin(th);

  // --- skew lines -----------------------------------------------------------
  // line = {p, d}
  M.line = (P, ij) => ({ p: P[ij[0]], d: sub(P[ij[1]], P[ij[0]]) });
  // Distance between two lines (common perpendicular). parallel: true when d1 x d2 vanishes.
  M.skewGap = function (L1, L2) {
    const n = cross(L1.d, L2.d), nn = norm(n);
    if (nn < EPS * norm(L1.d) * norm(L2.d)) return { gap: NaN, parallel: true };
    return { gap: Math.abs(dot(sub(L2.p, L1.p), n)) / nn, parallel: false, n };
  };

  // --- plan (orthographic top view, drop z) -----------------------------------
  // Intersection of the plan images of two lines; returns params t (on L1) and s (on L2).
  M.planCrossing = function (L1, L2) {
    const ax = L1.p[0], ay = L1.p[1], bx = L1.d[0], by = L1.d[1];
    const cx = L2.p[0], cy = L2.p[1], dx = L2.d[0], dy = L2.d[1];
    const den = bx * dy - by * dx;
    const scale = Math.hypot(bx, by) * Math.hypot(dx, dy);
    if (Math.abs(den) < 1e-12 * scale) return { finite: false };
    const t = ((cx - ax) * dy - (cy - ay) * dx) / den;
    const s = ((cx - ax) * by - (cy - ay) * bx) / den;
    const Q1 = add(L1.p, mul(L1.d, t)), Q2 = add(L2.p, mul(L2.d, s));
    return { finite: true, t, s, x: Q1[0], y: Q1[1], z1: Q1[2], z2: Q2[2], projectorGap: Q1[2] - Q2[2] };
  };
  // Closed form for the blue pair on the twisted rectangle: the projector through the
  // purple point meets the two diagonals 2b·tan(th/2) apart (first minus second).
  M.projectorGapFormula = (b, th) => 2 * b * Math.tan(th / 2);

  // --- the eye and its three transversals ------------------------------------
  // The unique line through E meeting both L1 and L2 (E not on either).
  // It is the meet of the planes (E,L1) and (E,L2).
  M.transversal = function (E, L1, L2) {
    const n1 = cross(sub(L1.p, E), L1.d);
    const n2 = cross(sub(L2.p, E), L2.d);
    const dir = cross(n1, n2);
    const nd = norm(dir);
    if (nd < EPS * norm(n1) * norm(n2)) return { degenerate: true };
    const hit = L => {
      // point on L lying on the line (E, dir): solve L.p + t L.d = E + u dir
      const c = cross(L.d, dir), cc = dot(c, c);
      if (cc < EPS * dot(L.d, L.d) * dot(dir, dir)) return { atInfinity: true };
      const t = dot(cross(sub(E, L.p), dir), c) / cc;
      const Q = add(L.p, mul(L.d, t));
      // residual: distance of Q from the line (E, dir)
      const r = norm(cross(sub(Q, E), dir)) / nd;
      return { atInfinity: false, t, Q, residual: r };
    };
    return { degenerate: false, dir: mul(dir, 1 / nd), hit1: hit(L1), hit2: hit(L2) };
  };

  // --- projection through the eye onto the picture plane z = zp ------------------
  M.project = function (E, zp, X) {
    const k = (zp - E[2]) / (X[2] - E[2]);
    return [E[0] + (X[0] - E[0]) * k, E[1] + (X[1] - E[1]) * k];
  };
  M.image = (E, zp, P) => P.map(X => M.project(E, zp, X));
  // Trace of a line through E with direction dir on the plane z = zp.
  M.trace = function (E, zp, dir) {
    if (Math.abs(dir[2]) < EPS * norm(dir)) return { finite: false, dir: [dir[0], dir[1]] };
    const k = (zp - E[2]) / dir[2];
    return { finite: true, x: E[0] + dir[0] * k, y: E[1] + dir[1] * k };
  };

  // --- 2D helpers for the picture --------------------------------------------------
  M.meet2 = function (A, B, C, D) {
    const bx = B[0] - A[0], by = B[1] - A[1], dx = D[0] - C[0], dy = D[1] - C[1];
    const den = bx * dy - by * dx;
    const scale = Math.hypot(bx, by) * Math.hypot(dx, dy);
    if (Math.abs(den) < 1e-12 * scale) return { finite: false, dir: [bx, by] };
    const t = ((C[0] - A[0]) * dy - (C[1] - A[1]) * dx) / den;
    return { finite: true, x: A[0] + bx * t, y: A[1] + by * t };
  };
  // The three diagonal points of the planar quadrangle I (4 points), in pair order.
  M.diagonalPoints = I => M.pairs.map(pr => {
    const [u, v] = pr.lines;
    return M.meet2(I[u[0]], I[u[1]], I[v[0]], I[v[1]]);
  });
  // Cross-ratio of four collinear 2D points, by parameter along the line AB.
  M.crossRatio = function (A, B, C, D) {
    const dx = B[0] - A[0], dy = B[1] - A[1], L = dx * dx + dy * dy;
    const par = X => ((X[0] - A[0]) * dx + (X[1] - A[1]) * dy) / L;
    const a = 0, b = 1, c = par(C), d = par(D);
    return ((c - a) * (d - b)) / ((c - b) * (d - a));
  };
  // Harmonic property of a complete quadrangle: the line joining two diagonal points
  // is cut harmonically by the two lines of the third pair. Returns the three cross-ratios.
  M.harmonic = function (I) {
    const D = M.diagonalPoints(I);
    const out = [];
    for (let k = 0; k < 3; k++) {
      const i = (k + 1) % 3, j = (k + 2) % 3;
      if (!D[i].finite || !D[j].finite) { out.push(NaN); continue; }
      const Di = [D[i].x, D[i].y], Dj = [D[j].x, D[j].y];
      const [u, v] = M.pairs[k].lines;
      const X = M.meet2(Di, Dj, I[u[0]], I[u[1]]);
      const Y = M.meet2(Di, Dj, I[v[0]], I[v[1]]);
      if (!X.finite || !Y.finite) { out.push(NaN); continue; }
      out.push(M.crossRatio(Di, Dj, [X.x, X.y], [Y.x, Y.y]));
    }
    return out;
  };

  // --- fertile / sterile -------------------------------------------------------------
  // Count how many of the three opposite pairs meet (coplanar). 3 = flat, 0 = tetrahedron.
  M.meets = function (P) {
    const d = Math.abs(M.det(P));
    const scale = Math.pow(norm(sub(P[1], P[0])) + norm(sub(P[2], P[0])) + norm(sub(P[3], P[0])), 3);
    return d < 1e-9 * scale ? 3 : 0;
  };

  // --- which pair crosses in plan ----------------------------------------------------
  // Returns, for each pair, whether its plan images cross inside both segments (0<t<1, 0<s<1).
  M.planRoles = function (P) {
    return M.pairs.map(pr => {
      const c = M.planCrossing(M.line(P, pr.lines[0]), M.line(P, pr.lines[1]));
      return c.finite && c.t > 0 && c.t < 1 && c.s > 0 && c.s < 1;
    });
  };

  root.TwistMath = M;
})(typeof window !== 'undefined' ? window : globalThis);
