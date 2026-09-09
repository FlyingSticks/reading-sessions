/* check-folded-rigs-3d-slab.js — assertions for "the slab printed twice".
   Dependency-free. Run: node check-folded-rigs-3d-slab.js
   Geometry below is the master copy; folded-rigs-3d-slab.html mirrors it verbatim. */
"use strict";

/* ---------------- geometry (mirrored in the plate) ---------------- */
const mag = (s, lam) => (-s)/(lam - s);              // channel gauge onto lambda = 0
function projV(V, w){
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
const XT = 1.14, Q = 0.5, LAM = 1.0;

/* ---------------- harness ---------------- */
let n = 0, failed = 0;
const ok = (desc, cond) => { n++;
  if (cond) console.log(`ok   #${String(n).padStart(2)}  ${desc}`);
  else { failed++; console.error(`FAIL #${String(n).padStart(2)}  ${desc}`); } };
const near = (a, b, eps=1e-9) => Math.abs(a-b) <= eps*Math.max(1, Math.abs(a), Math.abs(b));
let seed = 0x51ab51ab;
const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rIn = (a,b) => a + (b-a)*rnd();

/* strike via the physical ray: through the point, meeting both slits; intersect lambda = 0 */
function strike(u, v, lam, X, Y){
  const t = (lam - u)/(v - u);
  const A = [u, 0, Y/(1 - t)];
  const B = [v, X/t, 0];
  const s = (0 - A[0])/(B[0] - A[0]);
  return [A[1] + s*(B[1]-A[1]), A[2] + s*(B[2]-A[2])];
}
const cross2 = (a, b) => a[0]*b[1] - a[1]*b[0];

/* frame half-widths at depth lam */
const camF = (u, v, lam) => [Q*mag(u,lam), Q*mag(v,lam)];
const gldF = (u, v, lam) => [Q/mag(u,lam), Q/mag(v,lam)];

/* ================= the mediator ================= */

{ let good = true;                                                        /* 1 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2), v=-rIn(0.3,3.2);
    const c=camF(u,v,0), g=gldF(u,v,0);
    if (!near(c[0],Q)||!near(c[1],Q)||!near(g[0],Q)||!near(g[1],Q)) good=false;
  }
  ok("triple identity: at λ = 0 both constructions' frames coincide with the red rectangle (×1)", good); }

{ let good = true;                                                        /* 2 */
  for (let i=0;i<60;i++){
    const u=-rIn(0.3,3.2), v=-rIn(0.3,3.2), l=rIn(0.02,LAM);
    const c=camF(u,v,l), g=gldF(u,v,l);
    if (!(c[0]<Q && c[1]<Q && g[0]>Q && g[1]>Q)) good=false;
  }
  ok("strict nesting for every λ > 0: camera frame inside red, red inside glide frame", good); }

/* ================= graduation ================= */

{ let harm = true, arith = true;                                          /* 3,4 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2), v=-rIn(0.3,3.2), N=4+Math.floor(rnd()*9);
    for (const ch of [u, v]){
      const rec=[], pos=[];
      for (let k=0;k<=N;k++){ const l=k*LAM/N;
        rec.push(1/(Q*mag(ch,l))); pos.push(Q/mag(ch,l)); }
      for (let k=2;k<=N;k++){
        if (!near(rec[k]-rec[k-1], rec[1]-rec[0], 1e-9)) harm=false;
        if (!near(pos[k]-pos[k-1], pos[1]-pos[0], 1e-9)) arith=false;
      }
    }
  }
  ok("cross-slit graduation is harmonic: frame edges' reciprocals equally spaced, both channels", harm);
  ok("glide graduation is equal intervals: frame edges equally spaced, both channels", arith); }

/* ================= corner connectors ================= */

{ let ends = true;                                                        /* 5 */
  for (const sx of [-Q,Q]) for (const sy of [-Q,Q]){
    const u=-2, v=-1;
    const c0=[sx*mag(u,0), sy*mag(v,0)], c1=[sx*mag(u,LAM), sy*mag(v,LAM)];
    const g0=[sx, sy], g1=[sx*(1+LAM*(1/(-u))), sy*(1+LAM*(1/(-v)))];
    if (!near(c0[0],sx)||!near(c0[1],sy)) ends=false;                      // arc starts on red
    if (!near(Math.abs(c1[0]), camF(u,v,LAM)[0]) ||
        !near(Math.abs(c1[1]), camF(u,v,LAM)[1])) ends=false;              // arc ends on far camera frame
    if (!near(g0[0],sx)||!near(g0[1],sy)) ends=false;                      // line starts on red
    if (!near(Math.abs(g1[0]), gldF(u,v,LAM)[0]) ||
        !near(Math.abs(g1[1]), gldF(u,v,LAM)[1])) ends=false;              // line ends on far glide frame
  }
  ok("corner connectors join their frames: red rectangle to far frame, all four corners, both sides", ends); }

{ let hyp = true;                                                         /* 6 */
  for (let i=0;i<60;i++){
    const u=-rIn(0.3,3.2); let v=-rIn(0.3,3.2);
    if (Math.abs(u-v)<0.05) v=u-0.5;
    const sx=(rnd()<0.5?-1:1)*Q, sy=(rnd()<0.5?-1:1)*Q, l=rIn(0.02,LAM);
    const Xc=sx*mag(u,l), Yc=sy*mag(v,l);
    if (!near((u-v)*Xc*Yc + v*sy*Xc - u*sx*Yc, 0, 1e-9)) hyp=false;
  }
  ok("cross-slit corner connectors lie on trail hyperbolas (the two-slit camera bends depth lines)", hyp); }

{ let bow = true, straight = true;                                        /* 7,8 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2), v=-rIn(0.3,3.2), ru=1/(-u), rv=1/(-v);
    /* camera: m(λ) is convex in λ, so the arc bows toward the origin — each
       coordinate at mid-depth sits strictly inside the chord's midpoint */
    for (const ch of [u,v]){
      const mid = Q*mag(ch, LAM/2), chord = (Q*mag(ch,0)+Q*mag(ch,LAM))/2;
      if (!(mid < chord)) bow=false;
    }
    /* glide: exactly linear — mid-depth lands exactly on the chord midpoint */
    const gm=[Q*(1+(LAM/2)*ru), Q*(1+(LAM/2)*rv)];
    const gc=[(Q+Q*(1+LAM*ru))/2, (Q+Q*(1+LAM*rv))/2];
    if (!near(gm[0],gc[0],1e-12) || !near(gm[1],gc[1],1e-12)) straight=false;
  }
  ok("cross-slit connectors bow convexly toward the origin (m is convex in λ)", bow);
  ok("glide connectors are exactly straight (linear in λ)", straight); }

/* ================= closed vs open ================= */

{ let closed = true, open = true;                                         /* 9,10 */
  for (let i=0;i<30;i++){
    const u=-rIn(0.3,3.2), v=-rIn(0.3,3.2);
    const cF=camF(u,v,1e7), gF=gldF(u,v,1e7);
    if (!(cF[0] < 1e-5 && cF[1] < 1e-5)) closed=false;   // camera family converges on the origin
    if (!(gF[0] > 1e4 && gF[1] > 1e4)) open=false;       // glide family is unbounded
  }
  ok("closed: extended past the slab, the cross-slit frames converge on the origin", closed);
  ok("open: extended past the slab, the glide frames grow without bound", open); }

/* ================= strikes and areas ================= */

{ let good = true;                                                        /* 11 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2); let v=-rIn(0.3,3.2);
    if (Math.abs(u-v)<0.05) v=u-0.5;
    for (const sx of [-Q,Q]) for (const sy of [-Q,Q]){
      const S2=strike(u,v,LAM,sx,sy);
      if (!near(S2[0], sx*mag(u,LAM), 1e-9) || !near(S2[1], sy*mag(v,LAM), 1e-9)) good=false;
    }
  }
  ok("far camera frame's corners are physical strikes of the slab's far corners", good); }

{ let good = true;                                                        /* 12 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2), v=-rIn(0.3,3.2), l=rIn(0.02,LAM);
    const c=camF(u,v,l), g=gldF(u,v,l);
    const areaC=(2*c[0])*(2*c[1]), areaG=(2*g[0])*(2*g[1]);
    if (!near(areaC*areaG, Math.pow(2*Q,4), 1e-9)) good=false;
  }
  ok("area reciprocity at every graduation: camera area × glide area = (2q)⁴", good); }

/* ================= floor grids ================= */

{ let cam = true, gld = true;                                             /* 13,14 */
  for (let j=-2;j<=2;j++){
    const u=-2, v=-1, ru=0.5, rv=1, x=j*Q/2;
    for (const l of [0.2,0.5,0.9]){
      const Xc=x*mag(u,l), Yc=-Q*mag(v,l);
      if (!near((u-v)*Xc*Yc + v*(-Q)*Xc - u*x*Yc, 0, 1e-9)) cam=false;
    }
    const g=t=>[x*(1+t*ru), -Q*(1+t*rv)];
    const A=g(0), B=g(0.5), Cc=g(1);
    if (Math.abs(cross2([B[0]-A[0],B[1]-A[1]],[Cc[0]-A[0],Cc[1]-A[1]])) > 1e-10) gld=false;
  }
  ok("floor grid, cross-slit side: each depth line's print satisfies its hyperbola relation", cam);
  ok("floor grid, glide side: each depth line's print is straight", gld); }

/* ================= fusing ================= */

{ let straight = true, square = true, bent = true;                        /* 15,16,17 */
  for (let i=0;i<30;i++){
    const u=-rIn(0.3,3.2);
    for (const sx of [-Q,Q]) for (const sy of [-Q,Q]){
      const c=l=>[sx*mag(u,l), sy*mag(u,l)];
      const A=c(0.25), B=c(0.75), O=c(0);
      const d1=[B[0]-A[0],B[1]-A[1]], d2=[O[0]-A[0],O[1]-A[1]];
      if (Math.abs(cross2(d1,d2)) > 1e-10) straight=false;
    }
    const f=camF(u,u,rIn(0.05,LAM)), g=gldF(u,u,rIn(0.05,LAM));
    if (!near(f[0],f[1]) || !near(g[0],g[1])) square=false;
  }
  { const u=-2, v=-1, sx=Q, sy=Q;
    const c=l=>[sx*mag(u,l), sy*mag(v,l)];
    const A=c(0), B=c(0.5), Cc=c(1);
    if (Math.abs(cross2([B[0]-A[0],B[1]-A[1]],[Cc[0]-A[0],Cc[1]-A[1]])) < 1e-6) bent=false; }
  ok("fused (v = u): every corner connector straightens", straight);
  ok("fused (v = u): every frame is a square — the room is one-point perspective", square);
  ok("split (v ≠ u): the connectors genuinely bend — the straight room is the Δ = 0 case", bent); }

/* ================= seam meter and clipping ================= */

{ let zero = true;                                                        /* 18 */
  const D = (u,v)=>{const ru=1/(-u), rv=1/(-v); return ru*rv*(rv-ru);};
  if (!near(D(-1.4,-1.4), 0)) zero=false;
  if (Math.abs(D(-2,-1)) < 1e-6) zero=false;
  if (!(Math.abs(D(-1e6,-1)) < 1e-5)) zero=false;
  ok("seam meter zero set: Δ = 0 at u = v, and Δ → 0 as a foot retreats to −∞", zero); }

{                                                                          /* 19 */
  const rv=1;                                    // v = −1 (default)
  const reach = Q*(1+2.1*rv);                    // the open stub's far end
  ok("the open stubs genuinely leave the sheet at default feet (clip earns its keep)",
     reach > XT); }

/* ================= view containment ================= */

{                                                                          /* 20,21,22 */
  const world = [];
  for (const sx of [-1.29,1.29]) for (const sy of [-1.29,1.29]) world.push([0,sx,sy]);   // plane + trace overshoot
  world.push([-3.3,0,0],[1.55,0,0]);                                                     // axis
  for (const f of [-3.25,-0.30]) for (const [a,b] of [[0,0.5],[0,-0.5],[0.5,0],[-0.5,0]])
    world.push([f,a,b]);                                                                 // slit extremes
  for (const sx of [-Q,Q]) for (const sy of [-Q,Q]) world.push([LAM,sx,sy]);             // slab far square
  const inside = V => world.every(w => {
    const p = projV(V, w);
    return p[0] >= 6 && p[0] <= 1314 && p[1] >= 6 && p[1] <= 774;
  });
  ok("¾ view contains the whole drawing", inside(VIEWS.three));
  ok("face view contains the whole drawing", inside(VIEWS.face));
  ok("edge-on view contains the whole drawing", inside(VIEWS.sheet));
}

console.log(failed === 0
  ? `\nall ${n} assertions pass`
  : `\n${failed} of ${n} assertions FAILED`);
process.exit(failed === 0 ? 0 : 1);
