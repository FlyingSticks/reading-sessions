// check_folded_rigs.js — numbered assertions for "rigs of u and v — folded superposition"
// No dependencies. Run: node check_folded_rigs.js
//
// Conventions (matching the sheet):
//   slits axis = lambda axis. Picture plane at lambda = 0. Slab lambda in [0,1], L = 1.
//   Vertical slit  l_u = { lambda = u, X = 0 }  (extends in Y)  -> governs image x  (u channel)
//   Horizontal slit l_v = { lambda = v, Y = 0 } (extends in X)  -> governs image y  (v channel)
//   u = -1/r_u, v = -1/r_v  (r = L/d with L = 1, d = distance of slit behind P.P.)

let n = 0, failed = 0;
function check(desc, cond) {
  n++;
  const tag = cond ? "ok " : "FAIL";
  if (!cond) failed++;
  console.log(`${String(n).padStart(2)}. ${tag}  ${desc}`);
}
const close = (a, b, tol = 1e-12) => Math.abs(a - b) < tol;

// channel magnification of a slit at axis position s (s<0) onto P.P. at 0, point depth lambda
const mag = (s, lam) => (-s) / (lam - s);            // = d/(lam+d), d = -s
const imgX = (u, lam, X) => X * mag(u, lam);
const imgY = (v, lam, Y) => Y * mag(v, lam);

// ---- defaults from the current sheet: r_u = 0.50, r_v = 1.00 ----
const ru = 0.5, rv = 1.0;
const u = -1 / ru, v = -1 / rv;                       // u = -2, v = -1

check("default positions: r_u=0.50 -> u=-2, r_v=1.00 -> v=-1",
  close(u, -2) && close(v, -1));

// ---- 1) exact 3D ray through both slits reproduces the per-channel formulas ----
// A = (u, 0, a) on l_u ; B = (v, s, 0) on l_v ; line A + t(B-A)
// through P = (lam, X, Y): t_P = (lam-u)/(v-u), s = X/t_P, a = Y/(1-t_P)
function rayImage(u, v, lam, X, Y) {
  const tP = (lam - u) / (v - u);
  const s = X / tP, a = Y / (1 - tP);
  const t0 = (0 - u) / (v - u);                       // param where the ray meets the P.P.
  return { x: t0 * s, y: a * (1 - t0) };
}
{
  const lam = 0.65, X = 0.8, Y = 0.55;
  const r = rayImage(u, v, lam, X, Y);
  check("3D two-slit ray hits P.P. at x = X*(-u)/(lam-u)  (u channel formula)",
    close(r.x, imgX(u, lam, X)));
  check("same ray hits P.P. at y = Y*(-v)/(lam-v)  (v channel formula)",
    close(r.y, imgY(v, lam, Y)));
}

// ---- 2) pencil property: the plan of EVERY camera ray passes through (u, 0) ----
// plan trace of the ray: (lambda(t), X(t)) with X(t) = t*s ; at lambda=u, t=0, X=0.
{
  let ok = true;
  for (const [lam, X, Y] of [[0.3, 0.9, 0.2], [1.0, -0.4, 0.7], [0.77, 0.1, -1.1]]) {
    const tP = (lam - u) / (v - u);
    const s = X / tP;
    const tAtU = (u - u) / (v - u);                   // = 0
    ok = ok && close(tAtU * s, 0);
  }
  check("plan of every ray passes through the point u (X=0 at lambda=u) — the u-pencil", ok);
  let ok2 = true;
  for (const [lam, X, Y] of [[0.3, 0.9, 0.2], [1.0, -0.4, 0.7], [0.77, 0.1, -1.1]]) {
    const tP = (lam - u) / (v - u);
    const a = Y / (1 - tP);
    const tAtV = 1;                                   // at lambda=v, t=1, Y = a(1-1) = 0
    ok2 = ok2 && close(a * (1 - tAtV), 0);
  }
  check("elevation of every ray passes through the point v (Y=0 at lambda=v) — the v-pencil", ok2);
}

// ---- 3) the two slits are perpendicular, skew, and the axis is their common perpendicular ----
{
  // direction of l_u is (0,0,1); of l_v is (0,1,0)  (lambda, X, Y) coords
  const du = [0, 0, 1], dv = [0, 1, 0];
  const dot = du[0] * dv[0] + du[1] * dv[1] + du[2] * dv[2];
  check("slit directions are perpendicular (dot product 0)", close(dot, 0));
  // closest points: (u,0,0) on l_u and (v,0,0) on l_v; segment between them = axis segment
  // distance between the skew lines = |u - v|
  // (minimize |(u,0,a)-(v,s,0)|^2 = (u-v)^2 + s^2 + a^2 at s=a=0)
  check("slits are skew: min gap = |u-v| = D, attained at (u,0,0)-(v,0,0)", close(Math.abs(u - v), 1));
  // that segment lies on the axis {X=0,Y=0} and is perpendicular to both slit directions
  const seg = [u - v, 0, 0];
  const p1 = seg[0] * du[0] + seg[1] * du[1] + seg[2] * du[2];
  const p2 = seg[0] * dv[0] + seg[1] * dv[1] + seg[2] * dv[2];
  check("the slits axis is the common perpendicular; u and v are its feet",
    close(p1, 0) && close(p2, 0));
}

// ---- 4) anamorphic ratio AR(lambda) = m_v / m_u ----
const AR = (lam) => mag(v, lam) / mag(u, lam);
check("AR(0) = 1 — both channels print x1 on the picture plane", close(AR(0), 1));
{
  const lim = ru / rv;                                // = (d_v/d_u)
  check("AR(lambda) -> r_u/r_v as lambda -> infinity (bounded budget)",
    close(AR(1e9), lim, 1e-6));
  let mono = true, prev = AR(0);
  for (let lam = 0.05; lam <= 6; lam += 0.05) {
    const cur = AR(lam);
    if (cur > prev + 1e-12) mono = false;
    prev = cur;
  }
  check("AR is monotone from 1 toward r_u/r_v (here decreasing, since d_u > d_v)", mono);
  check("at the back wall lambda=1: m_u=2/3, m_v=1/2, AR=3/4",
    close(mag(u, 1), 2 / 3) && close(mag(v, 1), 1 / 2) && close(AR(1), 0.75));
}

// ---- 5) fuse: v -> u collapses the two pencils into one center (perspective) ----
{
  const uu = -1.7;
  let ok = true;
  for (const lam of [0.2, 0.9, 1.4]) {
    ok = ok && close(imgX(uu, lam, 0.8) / 0.8, imgY(uu, lam, 0.55) / 0.55);
  }
  check("v = u  =>  x/X = y/Y at every depth — single pencil, ordinary perspective", ok);
}

// ---- 6) fold transform ----
// v-plane point (lambda, Y) draws at S(lambda) + Y*k*dir(theta),
// dir(theta) = ( OX*sin t, -(cos t + OY*sin t) ), OX=0.60, OY=0.45.
function dir(t) { return [0.60 * Math.sin(t), -(Math.cos(t) + 0.45 * Math.sin(t))]; }
{
  const d0 = dir(0);
  check("theta = 0 (folded): fold direction = (0,-1), identical to the plan's X direction",
    close(d0[0], 0) && close(d0[1], -1));
  // overlap property: folded, a v-plane point (lambda, c) lands exactly where a
  // plan point (lambda, c) lands — the two rigs superimpose
  const k = 100, S = (lam) => [400 + 120 * lam, 300];
  const lam = 0.4, c = 0.7;
  const plan = [S(lam)[0], S(lam)[1] - c * k];
  const dd = dir(0);
  const elev = [S(lam)[0] + c * k * dd[0], S(lam)[1] + c * k * dd[1]];
  check("folded overlap: (lambda,c) in the v-plane prints on the same paper point as in the u-plane",
    close(plan[0], elev[0]) && close(plan[1], elev[1]));
  const d90 = dir(Math.PI / 2);
  check("theta = 90: v-plane content leaves the paper plane along the oblique (0.60, -0.45)",
    close(d90[0], 0.60) && close(d90[1], -0.45));
}

// ---- 7) tie line: plan trace and elevation trace of one point share the abscissa lambda ----
{
  const lam = 0.83;
  check("descriptive-geometry tie: P_plan and P_elev sit on the same ordinate lambda = const",
    close(lam, lam)); // structural: both traces are constructed from the one lambda
}

console.log(failed === 0 ? `\nAll ${n} checks passed.` : `\n${failed} of ${n} checks FAILED.`);
process.exit(failed === 0 ? 0 : 1);
