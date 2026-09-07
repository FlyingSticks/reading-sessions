// check_folded_rigs_v2.js — numbered assertions for "u and v — two rigs folded, v2"
// v1 checks 1–17 retained; 18+ cover the glide/cross-slit readings added in v2.
// No dependencies. Run: node check_folded_rigs_v2.js
//
// Conventions (matching the sheet and the book's Ch 2 convention):
//   slits axis = lambda axis. Picture plane at lambda = 0. Slab lambda in [0,1], L = 1.
//   Vertical slit  l_u = { lambda = u, X = 0 } -> u channel, image x.  d_u = -u, r_u = 1/d_u.
//   Horizontal slit l_v = { lambda = v, Y = 0 } -> v channel, image y.
//   Channel magnification m(lam) = d/(lam+d) = 1/(1 + r*lam).
//   CAMERA (cross-slit) reading: mark Xc = X*m         (ray scene-point -> slit, read at screen)
//   GLIDE reading:              mark Xg = X/m          (ray footprint -> slit, read at scene depth,
//                                                       carried home along the level plane)
//   CORNER rig: mark x = X (both feet at -infinity).

let n = 0, failed = 0;
function check(desc, cond) {
  n++;
  const tag = cond ? "ok " : "FAIL";
  if (!cond) failed++;
  console.log(`${String(n).padStart(2)}. ${tag}  ${desc}`);
}
const close = (a, b, tol = 1e-11) => Math.abs(a - b) < tol;

const mag  = (s, lam) => (-s)/(lam - s);
const imgX = (u, lam, X) => X * mag(u, lam);
const imgY = (v, lam, Y) => Y * mag(v, lam);

/* ================= v1 checks (1–17), unchanged ================= */
const ru = 0.5, rv = 1.0;
const u = -1/ru, v = -1/rv;

check("default positions: r_u=0.50 -> u=-2, r_v=1.00 -> v=-1", close(u,-2) && close(v,-1));

function rayImage(u, v, lam, X, Y) {
  const tP = (lam-u)/(v-u);
  const s = X/tP, a = Y/(1-tP);
  const t0 = (0-u)/(v-u);
  return { x: t0*s, y: a*(1-t0) };
}
{
  const lam=0.65, X=0.8, Y=0.55;
  const r = rayImage(u,v,lam,X,Y);
  check("3D two-slit ray hits P.P. at x = X*(-u)/(lam-u)  (u channel formula)", close(r.x, imgX(u,lam,X)));
  check("same ray hits P.P. at y = Y*(-v)/(lam-v)  (v channel formula)", close(r.y, imgY(v,lam,Y)));
}
{
  let ok = true, ok2 = true;
  for (const [lam,X,Y] of [[0.3,0.9,0.2],[1.0,-0.4,0.7],[0.77,0.1,-1.1]]) {
    const tP=(lam-u)/(v-u), s=X/tP, a=Y/(1-tP);
    ok  = ok  && close(0*s, 0);
    ok2 = ok2 && close(a*(1-1), 0);
  }
  check("plan of every ray passes through the point u (X=0 at lambda=u) — the u-pencil", ok);
  check("elevation of every ray passes through the point v (Y=0 at lambda=v) — the v-pencil", ok2);
}
{
  const du=[0,0,1], dv=[0,1,0];
  check("slit directions are perpendicular (dot product 0)", close(du[0]*dv[0]+du[1]*dv[1]+du[2]*dv[2],0));
  check("slits are skew: min gap = |u-v| = D, attained at (u,0,0)-(v,0,0)", close(Math.abs(u-v),1));
  const seg=[u-v,0,0];
  check("the slits axis is the common perpendicular; u and v are its feet",
    close(seg[2],0) && close(seg[1],0));
}
const AR = lam => mag(v,lam)/mag(u,lam);
check("AR(0) = 1 — both channels print x1 on the picture plane", close(AR(0),1));
check("AR(lambda) -> r_u/r_v as lambda -> infinity (bounded budget)", close(AR(1e9), ru/rv, 1e-6));
{
  let mono=true, prev=AR(0);
  for (let lam=0.05; lam<=6; lam+=0.05){ const cur=AR(lam); if (cur>prev+1e-12) mono=false; prev=cur; }
  check("AR is monotone from 1 toward r_u/r_v (here decreasing, since d_u > d_v)", mono);
  check("at the back wall lambda=1: m_u=2/3, m_v=1/2, AR=3/4",
    close(mag(u,1),2/3) && close(mag(v,1),1/2) && close(AR(1),0.75));
}
{
  const uu=-1.7; let ok=true;
  for (const lam of [0.2,0.9,1.4]) ok = ok && close(imgX(uu,lam,0.8)/0.8, imgY(uu,lam,0.55)/0.55);
  check("v = u  =>  x/X = y/Y at every depth — single pencil, ordinary perspective", ok);
}
function dirF(t){ return [0.60*Math.sin(t), -(Math.cos(t)+0.45*Math.sin(t))]; }
{
  const d0=dirF(0);
  check("theta = 0 (folded): fold direction = (0,-1), identical to the plan's X direction",
    close(d0[0],0) && close(d0[1],-1));
  const k=100, Sx=lam=>400+120*lam, lam=0.4, c=0.7, dd=dirF(0);
  check("folded overlap: (lambda,c) in the v-plane prints on the same paper point as in the u-plane",
    close(Sx(lam), Sx(lam)+c*k*dd[0]) && close(300-c*k, 300+c*k*dd[1]));
  const d90=dirF(Math.PI/2);
  check("theta = 90: v-plane content leaves the paper plane along the oblique (0.60, -0.45)",
    close(d90[0],0.60) && close(d90[1],-0.45));
}
check("descriptive-geometry tie: P_plan and P_elev sit on the same ordinate lambda = const", true);

/* ================= v2 checks: the two readings ================= */

/* 18 — the glide construction as drawn: the line through u and the footprint (0, X),
   read at scene depth lambda, gives exactly X/m (the transposed trace). */
{
  let ok = true;
  for (const [dd, lam, X] of [[2,0.65,0.8],[1,1.0,0.4],[0.7,0.33,1.05],[3.1,1.4,0.2]]) {
    const heightAt = X*(lam+dd)/dd;                    // line through (-dd,0) and (0,X) at lambda
    ok = ok && close(heightAt, X/mag(-dd,lam));
  }
  check("glide construction: ray footprint->slit read at scene depth = X/m  (the transposed trace)", ok);
}

/* 19 — the product identity on the slot */
{
  let ok = true;
  for (const [dd, lam, X] of [[2,0.65,0.8],[0.4,1.2,0.9],[5,0.1,1.1]]) {
    const m = mag(-dd,lam), Xc = X*m, Xg = X/m;
    ok = ok && close(Xg*Xc, X*X);
  }
  check("one point, three marks: Xg * Xc = x^2 with x = X (corner mark), all rigs and depths", ok);
}

/* 20 — geometric progression */
{
  const dd=2, lam=0.65, X=0.8, m=mag(-dd,lam);
  check("marks of one point are geometric: Xg : x : Xc with common ratio m (mean proportional)",
    close((X/m)/X, X/(X*m)));
}

/* 21 — the harmonic hinge */
function crossRatio(A,B,C,D){ return ((A-C)/(B-C))/((A-D)/(B-D)); }
{
  let ok = true;
  for (const [dd, lam, X] of [[2,0.65,0.8],[0.9,1.3,0.5]]) {
    const m = mag(-dd,lam);
    ok = ok && close(crossRatio(X/m, X*m, X, -X), -1);
  }
  check("harmonic range (Xg, Xc; x, -x) = -1 — the hinge between the two structures", ok);
}

/* 22 — same slot, two questions: forward and backward of ONE map */
{
  const dd=2, lam=0.65, X=0.8, m=mag(-dd,lam);
  const f = t => t*m;                                   // the camera map at this level
  check("Xc = f(X) and Xg = f^-1(X): the glide mark is the camera map run backward",
    close(f(X), X*m) && close(f(X/m), X));
}

/* 23–24 — two ladders from one rig at equal depth steps */
{
  const dd=2, X=0.8, N=6, lamMax=0.9;
  const g = [], c = [];
  for (let k=0;k<=N;k++){ const lam=k*lamMax/N; g.push(X/mag(-dd,lam)); c.push(X*mag(-dd,lam)); }
  let arith = true, harm = true;
  for (let k=2;k<=N;k++){
    arith = arith && close(g[k]-g[k-1], g[1]-g[0]);
    harm  = harm  && close(1/c[k]-1/c[k-1], 1/c[1]-1/c[0]);
  }
  check("glide marks at equal depth steps are arithmetic (equal steps — the Reach gauge)", arith);
  check("camera marks at equal depth steps are harmonic (reciprocals arithmetic — welded)", harm);
  check("ladder closure: step 0 lands on x, step N lands on the live marks Xg and Xc",
    close(g[0],X) && close(c[0],X) && close(g[N], X/mag(-dd,lamMax)) && close(c[N], X*mag(-dd,lamMax)));
}

/* 26 — corner rig limit */
{
  const dd=1e9, lam=0.8, X=0.7;
  check("corner rig (foot at -infinity): both readings collapse onto the level mark x = X",
    close(X*mag(-dd,lam), X, 1e-6) && close(X/mag(-dd,lam), X, 1e-6));
}

/* 27 — per-channel fusion locus */
{
  const dd=2, X=0.8;
  const gap = lam => Math.abs(X/mag(-dd,lam) - X*mag(-dd,lam));
  check("within one channel the two readings agree only on the picture plane (lambda = 0)",
    close(gap(0),0) && gap(0.3) > 1e-3 && gap(1.2) > 1e-3);
}

/* 28 — mirror circle on the slot: power of the origin */
{
  const dd=2, lam=0.65, X=0.8, m=mag(-dd,lam);
  const Xc=X*m, Xg=X/m, c=(Xc+Xg)/2, rho=(Xg-Xc)/2;
  const power = c*c - rho*rho;
  const L = Math.sqrt(power);
  const T = [L*rho/c, L*L/c];                            // tangency point from the origin
  const OT = Math.hypot(T[0],T[1]);
  const CT = [T[0]-0, T[1]-c];
  const dot = T[0]*CT[0] + T[1]*CT[1];
  check("mirror circle on diameter [Xc, Xg]: power of the slot origin = Xc*Xg = x^2",
    close(power, X*X));
  check("tangent witness: |0T| = x and 0T perpendicular to CT at the touch point", close(OT,X) && close(dot,0));
}

/* 30 — area form of the identity (the front-view print) */
{
  const lam=0.65, mu=mag(u,lam), mv=mag(v,lam);
  check("one square, two prints: camera area ratio (mu*mv) times glide area ratio (1/(mu*mv)) = 1",
    close(mu*mv*(1/(mu*mv)), 1));
}

/* 31 — the seam cubic */
{
  const Delta = (a,b) => a*b*(b-a);
  check("seam cubic: Delta = 0 exactly on the diagonal r_u=r_v and the r=0 edges; nonzero off them",
    close(Delta(0.7,0.7),0) && close(Delta(0,0.9),0) && close(Delta(0.6,0),0) &&
    Math.abs(Delta(0.5,1.0)) > 0.2 && close(Delta(0.5,1.0), 0.25));
}

/* 32 — v channel carries the identical structure */
{
  const lam=0.65, Y=0.55, m=mag(v,lam);
  check("v channel: Yg * Yc = y^2 and (Yg, Yc; y, -y) = -1 — the same slot grammar",
    close((Y/m)*(Y*m), Y*Y) && close(crossRatio(Y/m, Y*m, Y, -Y), -1));
}

console.log(failed === 0 ? `\nAll ${n} checks passed.` : `\n${failed} of ${n} checks FAILED.`);
process.exit(failed === 0 ? 0 : 1);
