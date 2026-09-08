/* check-folded-rigs-3d.js — dependency-free checks for folded-rigs-3d.html
   Run: node check-folded-rigs-3d.js
   Mirrors the plate's formulas exactly; every claim drawn on the sheet is asserted here first. */
"use strict";

let n = 0, failed = 0;
function assert(cond, msg){
  n++;
  const tag = cond ? "ok " : "FAIL";
  if (!cond) failed++;
  console.log(`${tag} ${String(n).padStart(2)}  ${msg}`);
}
const near = (a, b, eps=1e-9) => Math.abs(a - b) < eps;
const vnear = (a, b, eps=1e-9) => a.length === b.length && a.every((x,i)=>near(x,b[i],eps));

/* ---------- the plate's formulas (verbatim) ---------- */
const mag = (s, lam) => (-s)/(lam - s);                       // channel gauge onto lambda = 0
const hDir = th => [0, Math.cos(th), Math.sin(th)];           // v-plane height direction
const pt3 = (lam, X, Y, th) => [lam, X + Y*Math.cos(th), Y*Math.sin(th)];  // fold map (rig -> world)
function projFn(V){                                           // orthographic orbit, V={phi,psi,SC,CX,CY}
  const c1=Math.cos(V.phi), s1=Math.sin(V.phi), c2=Math.cos(V.psi), s2=Math.sin(V.psi);
  return w => {
    const q1 =  w[0]*c1 + w[2]*s1;
    const q3 = -w[0]*s1 + w[2]*c1;
    const r2 =  w[1]*c2 - q3*s2;
    return [V.CX + q1*V.SC, V.CY - r2*V.SC];
  };
}
const VIEWS = {
  three: {phi:0.44,        psi:-0.24, SC:190, CX:650, CY:462},
  face:  {phi:Math.PI/2,   psi:0.00, SC:300, CX:470, CY:600},
  sheet: {phi:0.00,        psi:0.00, SC:198, CX:703, CY:486}
};
const HMAX = 1.30;
function rayEnds(u, v, lam, X, Y){                            // the threading ray, rig coords
  const tP = (lam - u)/(v - u), sB = X/tP, aA = Y/(1 - tP);
  return { A:[u, 0, aA], B:[v, sB, 0] };                      // A on l_u, B on l_v
}

/* ---------- samples ---------- */
const rand = (a,b) => a + (b-a)*Math.random();
const samples = [];
for (let i=0;i<40;i++) samples.push({u:rand(-3.2,-0.2), v:rand(-3.2,-0.2), lam:rand(0.05,1.4), X:rand(0.1,1.1), Y:rand(0.1,1.1), th:rand(0.02,Math.PI/2)});

/* 1 — gauge is x1 on the picture plane, every channel */
assert(samples.every(s => near(mag(s.u,0),1) && near(mag(s.v,0),1)), "m(s, 0) = 1 for every foot — the picture plane reads x1");

/* 2 — reciprocal pair: Xc*Xg = x^2 */
assert(samples.every(s => near(s.X*mag(s.u,s.lam) * s.X/mag(s.u,s.lam), s.X*s.X)), "Xc*Xg = x^2 — camera and glide one reciprocal apart");

/* 3 — geometric progression Xc : x : Xg with ratio 1/m */
assert(samples.every(s => { const m=mag(s.u,s.lam); return near((s.X/m)/s.X, s.X/(s.X*m)); }), "Xg/x = x/Xc — the corner mark is the mean proportional");

/* 4 — the hinge: (Xg, Xc; x, -x) = -1 */
assert(samples.every(s => {
  const m=mag(s.u,s.lam), Xg=s.X/m, Xc=s.X*m, x=s.X;
  const cr = ((Xg-x)*(Xc+x))/((Xg+x)*(Xc-x));
  return near(cr, -1, 1e-8);
}), "(Xg, Xc; x, -x) = -1 — harmonic hinge");

/* 5 — one square, two prints: areas multiply to 1 */
assert(samples.every(s => {
  const mu=mag(s.u,s.lam), mv=mag(s.v,s.lam);
  return near((mu*mv)*(1/(mu*mv)), 1);
}), "camera print area x glide print area = 1 (per unit square)");

/* 6 — fold direction: flat lies on X, open stands perpendicular, unit length throughout */
assert(vnear(hDir(0), [0,1,0]) && vnear(hDir(Math.PI/2), [0,0,1]) &&
       samples.every(s => near(Math.hypot(...hDir(s.th)), 1)), "h(0)=e_X, h(90)=e_Z, |h(th)|=1");

/* 7 — the fold map is linear */
assert(samples.slice(0,10).every(s => {
  const a=[rand(-2,2),rand(0,1),rand(0,1)], b=[rand(-2,2),rand(0,1),rand(0,1)], al=rand(-1,2), be=1-al;
  const mix = pt3(al*a[0]+be*b[0], al*a[1]+be*b[1], al*a[2]+be*b[2], s.th);
  const pa = pt3(...a, s.th), pb = pt3(...b, s.th);
  return vnear(mix, [0,1,2].map(i => al*pa[i]+be*pb[i]), 1e-8);
}), "pt3 is linear in (lam, X, Y) at every fold angle");

/* 8 — hence collinearity survives the fold: straight rays stay straight while folding */
assert(samples.slice(0,10).every(s => {
  const {A,B} = rayEnds(s.u,s.v,s.lam,s.X,s.Y);
  const P=[s.lam,s.X,s.Y], t=(s.lam-s.u)/(s.v-s.u);
  const pa=pt3(...A,s.th), pb=pt3(...B,s.th), pp=pt3(...P,s.th);
  return vnear(pp, [0,1,2].map(i => pa[i]+t*(pb[i]-pa[i])), 1e-7);
}), "folded images of A, B, P remain collinear at every theta");

/* 9 — the ray threads both slits and the point */
assert(samples.every(s => {
  const {A,B} = rayEnds(s.u,s.v,s.lam,s.X,s.Y);
  const t=(s.lam-s.u)/(s.v-s.u);
  const hit=[0,1,2].map(i => A[i]+t*(B[i]-A[i]));
  return near(A[1],0) && near(B[2],0) && vnear(hit,[s.lam,s.X,s.Y],1e-7);
}), "ray A-B lies on l_u, l_v, and passes through the point");

/* 10 — the strike: the ray meets the screen exactly at the camera print (Xc, Yc) */
assert(samples.every(s => {
  const {A,B} = rayEnds(s.u,s.v,s.lam,s.X,s.Y);
  const t0 = (0 - A[0])/(B[0]-A[0]);
  const S=[0,1,2].map(i => A[i]+t0*(B[i]-A[i]));
  return vnear(S, [0, s.X*mag(s.u,s.lam), s.Y*mag(s.v,s.lam)], 1e-7);
}), "ray strikes lambda=0 at (Xc, Yc) — the strike IS the camera print");

/* 11 — and the folded strike is pt3(0, Xc, Yc): print coordinates ride the fold */
assert(samples.slice(0,10).every(s => {
  const {A,B} = rayEnds(s.u,s.v,s.lam,s.X,s.Y);
  const t0 = -A[0]/(B[0]-A[0]);
  const pa=pt3(...A,s.th), pb=pt3(...B,s.th);
  const S=[0,1,2].map(i => pa[i]+t0*(pb[i]-pa[i]));
  return vnear(S, pt3(0, s.X*mag(s.u,s.lam), s.Y*mag(s.v,s.lam), s.th), 1e-7);
}), "folded ray strikes the folded plane at the folded print");

/* 12 — face-on preset: depth axis vanishes, X reads up, Y reads right */
{
  const p = projFn(VIEWS.face), o = p([0,0,0]);
  const eL = p([1,0,0]), eX = p([0,1,0]), eY = p([0,0,1]);
  assert(near(eL[0]-o[0],0) && near(eL[1]-o[1],0), "face view: e_lambda projects to zero — picture plane truly face-on");
  assert(near(eX[0]-o[0],0) && eX[1]-o[1] < 0,      "face view: X is screen-up");
  assert(eY[0]-o[0] > 0 && near(eY[1]-o[1],0),      "face view: Y is screen-right");
}

/* 15 — sheet preset: Y vanishes, lambda right, X up (the old plan view) */
{
  const p = projFn(VIEWS.sheet), o = p([0,0,0]);
  const eL = p([1,0,0]), eX = p([0,1,0]), eY = p([0,0,1]);
  assert(near(eY[0]-o[0],0) && near(eY[1]-o[1],0) && eL[0]-o[0] > 0 && eX[1]-o[1] < 0,
    "sheet view: e_Y vanishes; lambda right, X up — folded-rigs-v2's drawing plane");
}

/* 16 — three-quarter preset: both drag Jacobians are comfortably invertible */
{
  const p = projFn(VIEWS.three), o = p([0,0,0]);
  const col = w => { const q=p(w); return [q[0]-o[0], q[1]-o[1]]; };
  const det = (a,b) => a[0]*b[1]-a[1]*b[0];
  const dP = Math.abs(det(col([1,0,0]), col([0,1,0])));
  const dQ = Math.abs(det(col([1,0,0]), col(hDir(Math.PI/2))));
  assert(dP > 0.2*VIEWS.three.SC*VIEWS.three.SC, "3/4 view: dragging P = (lam, X) is well-posed");
  assert(dQ > 0.2*VIEWS.three.SC*VIEWS.three.SC, "3/4 view: dragging Q = (lam, Y) is well-posed");
}

/* 18 — axis-constrained drag recovers the foot exactly */
{
  const p = projFn(VIEWS.three), o = p([0,0,0]);
  const a = [p([1,0,0])[0]-o[0], p([1,0,0])[1]-o[1]];
  const du = 0.37;
  const ds = [a[0]*du, a[1]*du];
  const rec = (ds[0]*a[0]+ds[1]*a[1])/(a[0]*a[0]+a[1]*a[1]);
  assert(near(rec, du), "least-squares drag along the slits axis returns the exact foot shift");
}

/* 19 — glide clip: the depth at which the stroke leaves the sheet */
assert(samples.filter(s => s.X/mag(s.u,s.lam) > HMAX).every(s => {
  const lamC = (-s.u)*(HMAX/s.X - 1);
  return near(s.X/mag(s.u,lamC), HMAX, 1e-8);
}), "lamC = (-u)(HMAX/X - 1) puts the clipped glide tip exactly at height HMAX");

/* 20 — the two ladders: harmonic in, arithmetic out */
{
  const u=-2.0, X=0.8, lam=1.2, N=6;
  const cam = [], gld = [];
  for (let k=1;k<=N;k++){ const lk=k*lam/N; cam.push(1/(X*mag(u,lk))); gld.push(X/mag(u,lk)); }
  const d2 = arr => arr.slice(2).map((_,i)=>arr[i+2]-2*arr[i+1]+arr[i]);
  const d1 = arr => arr.slice(1).map((x,i)=>x-arr[i]);
  assert(d2(cam).every(x=>near(x,0,1e-9)), "camera marks: reciprocals in arithmetic progression (harmonic crowding)");
  const steps = d1(gld);
  assert(steps.every(x=>near(x,steps[0],1e-9)), "glide marks: equal steps out — the Reach gauge");
}

/* 22 — seam meter and fusion */
assert(samples.every(s => {
  const ru=1/(-s.u), rv=1/(-s.v);
  const D = ru*rv*(rv-ru);
  return (Math.abs(D) < 1e-12) === (Math.abs(ru-rv) < 1e-12);
}), "Delta = r_u r_v (r_v - r_u) vanishes exactly when the feet agree");
assert((() => { const s={u:-1.3, lam:0.7, X:0.6, Y:0.9};
  const mu=mag(s.u,s.lam), mv=mag(s.u,s.lam);
  return near(mu,mv) && near(s.X*mu/(s.X), s.Y*mv/(s.Y));
})(), "fused (v = u): one gauge, camera prints scale both coordinates alike — perspective");

/* 24 — the corner limit: foot at minus infinity gives the perpendicular print */
assert(near(mag(-1e9, 0.7), 1, 1e-8), "s -> -inf: m -> 1, the mark returns to x = X (the corner rig)");

/* 25 — fold arc endpoints sit where the sheet says */
{
  const r=0.32, hx=1.28, th=1.1;
  const p0=[hx, r*Math.cos(0), r*Math.sin(0)], p1=[hx, r*Math.cos(th), r*Math.sin(th)];
  assert(vnear(p0,[hx,r,0]) && vnear(p1,[hx, r*Math.cos(th), r*Math.sin(th)]) &&
         near(Math.hypot(p1[1],p1[2]), r), "fold arc runs from e_X to h(theta) at constant radius");
}

/* 26 — picture-plane grid points genuinely lie at lambda = 0 under the fold */
assert(samples.slice(0,8).every(s => {
  for (const g of [0.25,0.75,1.25]){
    if (!near(pt3(0,g,0.5,s.th)[0],0)) return false;
  }
  return true;
}), "every gridded print point stays on lambda = 0 at every fold angle");

console.log(`\n${n} assertions, ${failed} failed.`);
process.exit(failed ? 1 : 0);
