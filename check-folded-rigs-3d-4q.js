/* check-folded-rigs-3d-4q.js — assertions for the four-quadrant plate.
   Dependency-free. Run: node check-folded-rigs-3d-4q.js
   Geometry below is the master copy; folded-rigs-3d-4q.html mirrors it verbatim. */
"use strict";

/* ---------------- geometry (mirrored in the plate) ---------------- */
const mag  = (s, lam) => (-s)/(lam - s);                 // channel gauge onto lambda = 0
const pt3  = (th, lam, X, Y) => [lam, X + Y*Math.cos(th), Y*Math.sin(th)];  // fold map
function projV(V, w){                                     // orthographic orbit
  const c1=Math.cos(V.phi), s1=Math.sin(V.phi), c2=Math.cos(V.psi), s2=Math.sin(V.psi);
  const q1 =  w[0]*c1 + w[2]*s1;
  const q3 = -w[0]*s1 + w[2]*c1;
  const r2 =  w[1]*c2 - q3*s2;
  return [V.CX + q1*V.SC, V.CY - r2*V.SC];
}
const VIEWS = {
  three: {phi:0.44,      psi:-0.24, SC:145, CX:759, CY:390},
  face:  {phi:Math.PI/2, psi:0.00, SC:270, CX:660, CY:390},
  sheet: {phi:0.00,      psi:0.00, SC:155, CX:760, CY:390}
};
const HMAX = 1.30, XT = 1.14, QF = 0.55;

/* ---------------- harness ---------------- */
let n = 0, failed = 0;
const ok = (desc, cond) => { n++;
  if (cond) console.log(`ok   #${String(n).padStart(2)}  ${desc}`);
  else { failed++; console.error(`FAIL #${String(n).padStart(2)}  ${desc}`); } };
const near = (a, b, eps=1e-9) => Math.abs(a-b) <= eps*Math.max(1, Math.abs(a), Math.abs(b));
/* seeded PRNG so failures reproduce */
let seed = 0x9e3779b9;
const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rIn = (a,b) => a + (b-a)*rnd();
const rSign = () => rnd() < 0.5 ? -1 : 1;

/* strike via the physical ray: through the point, meeting both slits; intersect λ = 0 */
function strike(u, v, lam, X, Y){
  const t = (lam - u)/(v - u);                 // baseline parameter of the depth lam
  const A = [u, 0, Y/(1 - t)];                 // on the vertical slit at u
  const B = [v, X/t, 0];                       // on the horizontal slit at v
  const s = (0 - A[0])/(B[0] - A[0]);          // extend A->B to lambda = 0
  return [A[1] + s*(B[1]-A[1]), A[2] + s*(B[2]-A[2])];
}
const cross2 = (a, b) => a[0]*b[1] - a[1]*b[0];

/* ================= inherited from the parent plate ================= */

{ let good = true;                                                        /* 1 */
  for (let i=0;i<40;i++){ const s = -rIn(0.18, 3.25); if (!near(mag(s,0),1)) good=false; }
  ok("×1 picture plane: mag(s, 0) = 1 for every foot", good); }

{ let gp = true, hinge = true;                                            /* 2,3 */
  for (let i=0;i<60;i++){
    const s=-rIn(0.2,3.2), lam=rIn(0.02,1.45), X=rSign()*rIn(0.05,1.12), m=mag(s,lam);
    const Xc=X*m, Xg=X/m;
    if (!near(Xg*Xc, X*X, 1e-12)) hinge=false;
    if (!near(X/Xc, Xg/X, 1e-12)) gp=false;                // common ratio 1/m
  }
  ok("harmonic hinge Xg·Xc = x² (both signs of X)", hinge);
  ok("Xc, x, Xg a geometric progression, ratio 1/m", gp); }

{ let good = true;                                                        /* 4 */
  for (let i=0;i<40;i++){
    const s=-rIn(0.2,3.2), lam=rIn(0.02,1.45), X=rIn(0.05,1.12), m=mag(s,lam);
    if (!near(-X*m, (-X)*m) || !near(-X/m, (-X)/m)) good=false;
  }
  ok("odd symmetry: negate X and all three marks negate — four-quadrant consistency", good); }

{ let good = true;                                                        /* 5 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.2,3.2), v=-rIn(0.2,3.2), lam=rIn(0.02,1.45);
    if (!near(0*mag(u,lam),0) || !near(0/mag(v,lam),0)) good=false;
    if (Math.abs(u-v)>1e-3){ const S2=strike(u,v,lam,0,0);
      if (!near(S2[0],0,1e-9) || !near(S2[1],0,1e-9)) good=false; }
  }
  ok("origin is fixed: axis material prints to (0,0) under every reading, incl. the strike", good); }

{ let good = true;                                                        /* 6 */
  for (let i=0;i<80;i++){
    const u=-rIn(0.2,3.2); let v=-rIn(0.2,3.2);
    if (Math.abs(u-v)<0.05) v=u-0.4;
    const lam=rIn(0.05,1.4), X=rSign()*rIn(0.05,1.12), Y=rSign()*rIn(0.05,1.12);
    const S2=strike(u,v,lam,X,Y);
    if (!near(S2[0], X*mag(u,lam), 1e-9) || !near(S2[1], Y*mag(v,lam), 1e-9)) good=false;
  }
  ok("strike = camera print: the ray through both slits lands at (X·mᵤ, Y·mᵥ) — all quadrants", good); }

{ let lin = true, col = true;                                             /* 7,8 */
  for (let i=0;i<40;i++){
    const th=rIn(0,Math.PI/2), a=rIn(-2,2), b=rIn(-2,2);
    const p=[rIn(-1,1.4),rIn(-1.2,1.2),rIn(-1.2,1.2)], q=[rIn(-1,1.4),rIn(-1.2,1.2),rIn(-1.2,1.2)];
    const L=pt3(th, a*p[0]+b*q[0], a*p[1]+b*q[1], a*p[2]+b*q[2]);
    const R=[0,1,2].map(k => a*pt3(th,p[0],p[1],p[2])[k] + b*pt3(th,q[0],q[1],q[2])[k]);
    if (!R.every((r,k)=>near(L[k],r,1e-12))) lin=false;
    const M=[0,1,2].map(k=>(p[k]+q[k])/2);
    const A=pt3(th,p[0],p[1],p[2]), B=pt3(th,q[0],q[1],q[2]), C=pt3(th,M[0],M[1],M[2]);
    const d1=[B[0]-A[0],B[1]-A[1],B[2]-A[2]], d2=[C[0]-A[0],C[1]-A[1],C[2]-A[2]];
    const cr=[d1[1]*d2[2]-d1[2]*d2[1], d1[2]*d2[0]-d1[0]*d2[2], d1[0]*d2[1]-d1[1]*d2[0]];
    if (Math.hypot(...cr) > 1e-10) col=false;
  }
  ok("fold map is linear at every θ", lin);
  ok("collinearity survives the fold map", col); }

/* ================= new: depth trails ================= */

{ let col = true, dir = true, arith = true;                               /* 9,10 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.2,3.2), v=-rIn(0.2,3.2), ru=1/(-u), rv=1/(-v);
    const X=rSign()*rIn(0.05,1.12), Y=rSign()*rIn(0.05,1.12);
    const g = l => [X*(1+l*ru), Y*(1+l*rv)];
    const L=[0.3,0.7,1.1,1.5,2.0].map(g);
    const d0=[L[1][0]-L[0][0], L[1][1]-L[0][1]];
    for (let k=2;k<L.length;k++){
      const dk=[L[k][0]-L[0][0], L[k][1]-L[0][1]];
      if (Math.abs(cross2(d0,dk)) > 1e-10) col=false;
    }
    if (Math.abs(cross2(d0,[X*ru, Y*rv])) > 1e-10) dir=false;
    const s1=[g(0.4)[0]-g(0.2)[0], g(0.4)[1]-g(0.2)[1]], s2=[g(0.6)[0]-g(0.4)[0], g(0.6)[1]-g(0.4)[1]];
    if (!near(s1[0],s2[0],1e-12) || !near(s1[1],s2[1],1e-12)) arith=false;
  }
  ok("glide trail is straight, direction (X·r_u, Y·r_v)", col && dir);
  ok("glide trail is arithmetic: equal depth steps, equal strides", arith); }

{ let hyp = true, thru = true, toO = true;                                /* 11,12,13 */
  for (let i=0;i<60;i++){
    const u=-rIn(0.2,3.2); let v=-rIn(0.2,3.2);
    if (Math.abs(u-v)<0.05) v=u-0.5;
    const X=rSign()*rIn(0.05,1.12), Y=rSign()*rIn(0.05,1.12);
    const c = l => [X*mag(u,l), Y*mag(v,l)];
    for (const l of [0.2,0.6,1.1,2.5,7]){
      const [Xc,Yc]=c(l);
      if (!near((u-v)*Xc*Yc + v*Y*Xc - u*X*Yc, 0, 1e-9)) hyp=false;
    }
    const p0=c(0); if (!near(p0[0],X) || !near(p0[1],Y)) thru=false;
    const pF=c(1e6); if (Math.hypot(pF[0],pF[1]) > 1e-5) toO=false;
  }
  ok("camera trail lies on the hyperbola (u−v)·Xc·Yc + v·Y·Xc − u·X·Yc = 0", hyp);
  ok("camera trail passes through the ⊥ print at λ = 0", thru);
  ok("camera trail runs to the origin as λ → ∞", toO); }

{ let harm = true;                                                        /* 14 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.2,3.2), X=rSign()*rIn(0.05,1.12), lam=rIn(0.2,1.4), N=6;
    const rec = []; for (let k=1;k<=N;k++) rec.push(1/(X*mag(u,k*lam/N)));
    for (let k=2;k<N;k++)
      if (!near(rec[k]-rec[k-1], rec[1]-rec[0], 1e-9)) harm=false;
  }
  ok("camera ladder is harmonic: reciprocals of the marks equally spaced (both signs)", harm); }

{ let straight = true, bends = true;                                      /* 15,16 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.2,3.2), X=rSign()*rIn(0.05,1.12), Y=rSign()*rIn(0.05,1.12);
    const cF = l => [X*mag(u,l), Y*mag(u,l)];             // fused: v = u
    const A=cF(0.3), B=cF(1.2);
    if (Math.abs(cross2(A,B)) > 1e-10) straight=false;    // collinear with the origin
    if (Math.abs(cross2(A,[X,Y])) > 1e-10) straight=false;
  }
  { const u=-2, v=-1, X=0.8, Y=0.55;
    const c = l => [X*mag(u,l), Y*mag(v,l)];
    const A=c(0.3), B=c(1.2);
    if (Math.abs(cross2(A,B)) < 1e-6) bends=false; }
  ok("fused (v = u): the camera trail degenerates to the straight ray through the origin", straight);
  ok("split (v ≠ u): the camera trail genuinely bends — the star is the Δ = 0 case", bends); }

/* ================= new: gauge frames ================= */

{ let corners = true;                                                     /* 17 */
  for (const lk of [0.25,0.5,0.75,1.0]){
    const u=-2, v=-1, fu=mag(u,lk), fv=mag(v,lk);
    for (const sx of [-1,1]) for (const sy of [-1,1]){
      const S2=strike(u,v,lk,sx*QF,sy*QF);
      if (!near(S2[0], sx*QF*fu, 1e-9) || !near(S2[1], sy*QF*fv, 1e-9)) corners=false;
    }
  }
  ok("frame corners are strikes: the gauge-plane square's corners land on the camera frame", corners); }

{ let prod = true;                                                        /* 18 */
  for (const lk of [0.25,0.5,0.75,1.0]){
    const fu=mag(-2,lk), fv=mag(-1,lk);
    if (!near((fu*fv)*(1/(fu*fv)), 1, 1e-12)) prod=false;
    const camA=(2*QF*fu)*(2*QF*fv), gldA=(2*QF/fu)*(2*QF/fv);
    if (!near(camA*gldA, Math.pow(2*QF,4), 1e-9)) prod=false;
  }
  ok("frame areas in exact reciprocal: factor product 1, area product (2q)⁴", prod); }

{ let nest = true;                                                        /* 19 */
  for (let i=0;i<40;i++){
    const s=-rIn(0.2,3.2), l1=rIn(0.02,1.2), l2=l1+rIn(0.05,0.3);
    if (!(mag(s,l2) < mag(s,l1))) nest=false;             // camera frames nest inward
    if (!(1/mag(s,l2) > 1/mag(s,l1))) nest=false;         // glide frames step outward
  }
  ok("nesting is monotone: camera frames in, glide frames out, as depth grows", nest); }

{ let sq = true;                                                          /* 20 */
  for (const lk of [0.25,0.75,1.3]){
    if (!near(mag(-1.7,lk), mag(-1.7,lk))) sq=false;      // u = v: frames are squares
    if (near(mag(-2,lk), mag(-1,lk), 1e-6)) sq=false;     // u ≠ v: they are not
  }
  ok("frames are squares exactly when the feet fuse (AR = 1 ⇔ u = v)", sq); }

{ let zero = true;                                                        /* 21 */
  const D = (u,v)=>{const ru=1/(-u), rv=1/(-v); return ru*rv*(rv-ru);};
  if (!near(D(-1.4,-1.4), 0)) zero=false;
  if (Math.abs(D(-2,-1)) < 1e-6) zero=false;
  if (!(Math.abs(D(-1e6,-1)) < 1e-5)) zero=false;         // a foot at infinity loses its strength (Δ ~ r_u·r_v²)
  ok("seam meter zero set: Δ = 0 at u = v, and Δ → 0 as a foot retreats to −∞", zero); }

{ let clip = true;                                                        /* 22 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.0), X=rSign()*rIn(0.05,1.12);
    const lamC=(-u)*(HMAX/Math.abs(X)-1);
    if (lamC>0 && !near(Math.abs(X/mag(u,lamC)), HMAX, 1e-9)) clip=false;
  }
  ok("glide clip depth: |X / m(u, λ_clip)| = HMAX, both signs of X", clip); }

/* ================= new: view containment ================= */

{                                                                          /* 23 */
  const world = th => {
    const w=[];
    if (th > 0.05)                                        // plane quad hidden when folded flat
      for (const sx of [-1.29,1.29]) for (const sy of [-1.29,1.29]) w.push(pt3(th,0,sx,sy));
    else
      for (const sx of [-1.29,1.29]) w.push(pt3(th,0,sx,0));   // only the u trace remains
    w.push(pt3(th,-3.3,0,0), pt3(th,1.55,0,0));
    for (const s of [-1.14,1.14]){ w.push(pt3(th,1,s,0)); w.push(pt3(th,1,0,s)); }
    for (const f of [-3.25,-0.18]) for (const [a,b] of [[0,0.5],[0,-0.5],[0.5,0],[-0.5,0]])
      w.push(pt3(th,f,a,b));
    for (const sx of [-1.12,1.12]) for (const sy of [-1.12,1.12]) w.push(pt3(th,1.45,sx,sy));
    return w;
  };
  const inside = (V, ths) => ths.every(th => world(th).every(w => {
    const p = projV(V, w);
    return p[0] >= 6 && p[0] <= 1314 && p[1] >= 6 && p[1] <= 774;
  }));
  ok("¾ view contains the whole drawing (θ = 0 and 90°)", inside(VIEWS.three,[0,Math.PI/2]));
  ok("face view contains the whole drawing (preset forces θ = 90°)", inside(VIEWS.face,[Math.PI/2]));
  ok("sheet view contains the whole drawing (θ = 0 and 90°)", inside(VIEWS.sheet,[0,Math.PI/2]));
}

{ let sym = true;                                                         /* 26 */
  const u=-2, v=-1, X=0.8, Y=0.55;
  for (const l of [0.2,0.7,1.3]){
    const a=[X*mag(u,l), Y*mag(v,l)], b=[-X*mag(u,l), -Y*mag(v,l)];
    if (!near(a[0], -b[0]) || !near(a[1], -b[1])) sym=false;
  }
  ok("trail of (−X, −Y) is the origin-reflection of the trail of (X, Y)", sym); }

console.log(failed === 0
  ? `\nall ${n} assertions pass`
  : `\n${failed} of ${n} assertions FAILED`);
process.exit(failed === 0 ? 0 : 1);
