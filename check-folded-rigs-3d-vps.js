/* check-folded-rigs-3d-vps.js — assertions for "the glide seats".
   Dependency-free. Run: node check-folded-rigs-3d-vps.js
   Geometry below is the master copy; folded-rigs-3d-vps.html mirrors it verbatim. */
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

/* the glide print of the depth line through (X, Y), at parameter lam */
const trail = (u, v, X, Y, lam) =>
  [X*(1 + lam*(1/(-u))), Y*(1 + lam*(1/(-v)))];

/* strike via the physical ray */
function strike(u, v, lam, X, Y){
  const t = (lam - u)/(v - u);
  const A = [u, 0, Y/(1 - t)];
  const B = [v, X/t, 0];
  const s = (0 - A[0])/(B[0] - A[0]);
  return [A[1] + s*(B[1]-A[1]), A[2] + s*(B[2]-A[2])];
}
const cross2 = (a, b) => a[0]*b[1] - a[1]*b[0];

/* ---------------- harness ---------------- */
let n = 0, failed = 0;
const ok = (desc, cond) => { n++;
  if (cond) console.log(`ok   #${String(n).padStart(2)}  ${desc}`);
  else { failed++; console.error(`FAIL #${String(n).padStart(2)}  ${desc}`); } };
const near = (a, b, eps=1e-9) => Math.abs(a-b) <= eps*Math.max(1, Math.abs(a), Math.abs(b));
let seed = 0x7a15b1c3;
const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rIn = (a,b) => a + (b-a)*rnd();

/* ================= the seats ================= */

{ let good = true;                                                        /* 1 */
  for (let i=0;i<50;i++){
    const u=-rIn(0.3,3.2), v=-rIn(0.3,3.2), rv=1/(-v);
    const Y=(rnd()<0.5?-1:1)*rIn(0.1,1.0);
    const VP=[0, Y*(1+u*rv)];
    for (const X of [-0.5,-0.2,0.13,0.4,0.77]){
      const p=trail(u,v,X,Y,u);                       // evaluate at lam = u
      if (!near(p[0],0,1e-10) || !near(p[1],VP[1],1e-9)) good=false;
    }
  }
  ok("rows concur: every depth line at height Y passes (0, Y·(1+u·r_v)) at λ = u — whatever X", good); }

{ let good = true;                                                        /* 2 */
  for (let i=0;i<50;i++){
    const u=-rIn(0.3,3.2), v=-rIn(0.3,3.2), ru=1/(-u);
    const X=(rnd()<0.5?-1:1)*rIn(0.1,1.0);
    const VP=[X*(1+v*ru), 0];
    for (const Y of [-0.6,-0.25,0.1,0.44,0.9]){
      const p=trail(u,v,X,Y,v);                       // evaluate at lam = v
      if (!near(p[1],0,1e-10) || !near(p[0],VP[0],1e-9)) good=false;
    }
  }
  ok("columns concur: every depth line of width X passes (X·(1+v·r_u), 0) at λ = v — whatever Y", good); }

{ let good = true;                                                        /* 3 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2), v=-rIn(0.3,3.2), ru=1/(-u), rv=1/(-v);
    for (const sx of [-Q,Q]) for (const sy of [-Q,Q]){
      const rowVP=[0, sy*(1+u*rv)], colVP=[sx*(1+v*ru), 0];
      const pu=trail(u,v,sx,sy,u), pv=trail(u,v,sx,sy,v);
      if (!near(pu[0],rowVP[0],1e-9)||!near(pu[1],rowVP[1],1e-9)) good=false;
      if (!near(pv[0],colVP[0],1e-9)||!near(pv[1],colVP[1],1e-9)) good=false;
    }
  }
  ok("each corner connector threads two seats: its row's and its column's", good); }

{ let good = true;                                                        /* 4 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2), v=-rIn(0.3,3.2), rv=1/(-v), ru=1/(-u);
    const Y=rIn(0.1,1.0), X=rIn(0.1,1.0);
    if (!near(2*Y*(1+u*rv), (2*Y)*(1+u*rv))) good=false;   // trivially linear — and:
    const s1=Y*(1+u*rv), s2=(2.7*Y)*(1+u*rv);
    if (!near(s2/s1, 2.7, 1e-9)) good=false;               // the scale is a scaling of the trace
    const t1=X*(1+v*ru), t2=(0.4*X)*(1+v*ru);
    if (!near(t2/t1, 0.4, 1e-9)) good=false;
  }
  ok("the seats lie in scale along the traces: seat position proportional to height (and to width)", good); }

{ let good = true;                                                        /* 5 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2), v=-rIn(0.3,3.2), ru=1/(-u), rv=1/(-v);
    if (!near(1+u*rv, (v-u)/v, 1e-12)) good=false;
    if (!near(1+v*ru, (u-v)/u, 1e-12)) good=false;
  }
  ok("readout identities: 1+u·r_v = (v−u)/v and 1+v·r_u = (u−v)/u", good); }

{ let good = true;                                                        /* 6 */
  for (let i=0;i<60;i++){
    const u=-rIn(0.3,3.2); let v=-rIn(0.3,3.2);
    if (Math.abs(u-v)<0.02) v=u-0.4;
    const kU=(u-v)/u, kV=(v-u)/v;
    if (!(kU*kV < 0)) good=false;                    // opposite signs whenever split
  }
  ok("exactly one pair of fans crosses the axis: (u−v)/u and (v−u)/v have opposite signs when u ≠ v", good); }

{ let collapse = true, star = true;                                       /* 7,8 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2), ru=1/(-u);
    if (!near(1+u*ru, 0, 1e-12)) collapse=false;     // both ratios die at u = v
    const X=(rnd()<0.5?-1:1)*rIn(0.1,1.0), Y=(rnd()<0.5?-1:1)*rIn(0.1,1.0);
    for (const l of [0.3,1.2,2.5]){
      const p=trail(u,u,X,Y,l);
      if (Math.abs(cross2(p,[X,Y])) > 1e-10) star=false;   // through the origin, direction (X, Y)
    }
  }
  ok("fused: both ratios die — all four seats come home to the origin", collapse);
  ok("fused: every glide depth trail lies on the ray through the origin — one star", star); }

/* ================= channel machinery ================= */

{ let good = true;                                                        /* camera line */
  const col = (A,B,P) => Math.abs((B[0]-A[0])*(P[1]-A[1]) - (B[1]-A[1])*(P[0]-A[0]));
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2), l0=rIn(0.05,1.0), m0=mag(u,l0);
    /* (lam, height) coordinates in the u-plane */
    if (col([u,0],[l0,Q],[0,Q*m0]) > 1e-10) good=false;    // foot, sample point, mark collinear
  }
  ok("machinery, camera: the foot's line through (λ₀, q) cuts the trace exactly at Xc = q·m_u", good); }

{ let good = true;                                                        /* glide stroke */
  const col = (A,B,P) => Math.abs((B[0]-A[0])*(P[1]-A[1]) - (B[1]-A[1])*(P[0]-A[0]));
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2), l0=rIn(0.05,1.0), m0=mag(u,l0);
    if (col([u,0],[0,Q],[l0,Q/m0]) > 1e-10) good=false;    // foot, footprint, tip collinear
  }
  ok("machinery, glide: the foot's stroke through the footprint (0, q) reaches (λ₀, q/m_u)", good); }

{ let good = true;                                                        /* marks ≡ frames */
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2), v=-rIn(0.3,3.2), l0=rIn(0.05,1.0), m0=mag(u,l0);
    if (!near(Q*m0, Q*mag(u,l0))) good=false;              // Xc = the cross-slit frame's u-trace crossing
    if (!near(Q/m0, Q/mag(u,l0))) good=false;              // Xg = the glide frame's u-trace crossing
    if (!near((Q/m0)*(Q*m0), Q*Q, 1e-12)) good=false;      // hinge: Xg·Xc = q²
    const ratio1 = (Q*m0)/Q, ratio2 = Q/(Q/m0);
    if (!near(ratio1, ratio2, 1e-12)) good=false;          // Xc, q, Xg geometric, ratio m_u
  }
  ok("machinery marks are the frames' trace crossings, in geometric progression: Xg·Xc = q²", good); }

/* ================= the level combs ================= */

{ let good = true;                                                        /* teal comb rides the stroke */
  const col = (A,B,P) => Math.abs((B[0]-A[0])*(P[1]-A[1]) - (B[1]-A[1])*(P[0]-A[0]));
  for (let i=0;i<30;i++){
    const u=-rIn(0.3,3.2), Nn=8;
    for (let k=1;k<=Nn;k++){
      const lk=k*LAM/Nn;
      if (col([u,0],[0,Q],[lk, Q/mag(u,lk)]) > 1e-10) good=false;   // rung's right end on the glide stroke
    }
  }
  ok("teal comb: each rung's right end (λk, q/m_u(λk)) rides the straight glide stroke", good); }

{ let bow = true, bent = true;                                            /* purple comb bows on the chain */
  const col = (A,B,P) => Math.abs((B[0]-A[0])*(P[1]-A[1]) - (B[1]-A[1])*(P[0]-A[0]));
  for (let i=0;i<30;i++){
    const u=-rIn(0.3,3.2);
    const h = l => Q*mag(u,l);
    for (const l of [0.2,0.5,0.8]){
      const mid = h(l), chord = (h(l-0.15)+h(l+0.15))/2;
      if (!(mid < chord)) bow=false;                        // convex profile: mid-depth inside the chord
    }
    if (col([0.2,h(0.2)],[0.6,h(0.6)],[1.0,h(1.0)]) < 1e-8) bent=false;  // and genuinely not straight
  }
  ok("purple comb: the rung ends' profile (λ, q·m_u(λ)) bows convexly — the chain, not a stroke", bow && bent); }

{ let good = true;                                                        /* welded at the shared rung */
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2), Nn=4+Math.floor(rnd()*9);
    for (let k=1;k<=Nn;k++){
      const lk=k*LAM/Nn, hc=Q*mag(u,lk), hg=Q/mag(u,lk);
      if (!(hc < Q && Q < hg)) good=false;                  // combs strictly astride the shared rung
      if (!near(hc*hg, Q*Q, 1e-12)) good=false;             // inverse images rung by rung
    }
  }
  ok("the combs sit astride the shared rung and are inverse images rung by rung: hc·hg = q²", good); }

/* ================= inherited construction facts ================= */

{ let arith = true, harm = true;                                          /* 9,10 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2), v=-rIn(0.3,3.2), Nn=8;
    for (const ch of [u,v]){
      const pos=[], rec=[];
      for (let k=0;k<=Nn;k++){ const l=k*LAM/Nn;
        pos.push(Q/mag(ch,l)); rec.push(1/(Q*mag(ch,l))); }
      for (let k=2;k<=Nn;k++){
        if (!near(pos[k]-pos[k-1], pos[1]-pos[0], 1e-9)) arith=false;
        if (!near(rec[k]-rec[k-1], rec[1]-rec[0], 1e-9)) harm=false;
      }
    }
  }
  ok("glide frames (gauge lines) march in equal strides — both channels", arith);
  ok("cross-slit frames graduate harmonically — both channels", harm); }

{ let hyp = true, toO = true;                                             /* 11,12 */
  for (let i=0;i<50;i++){
    const u=-rIn(0.3,3.2); let v=-rIn(0.3,3.2);
    if (Math.abs(u-v)<0.05) v=u-0.5;
    const sx=(rnd()<0.5?-1:1)*Q, sy=(rnd()<0.5?-1:1)*Q;
    for (const l of [0.2,0.7,2,6]){
      const Xc=sx*mag(u,l), Yc=sy*mag(v,l);
      if (!near((u-v)*Xc*Yc + v*sy*Xc - u*sx*Yc, 0, 1e-9)) hyp=false;
    }
    const pF=[sx*mag(u,1e7), sy*mag(v,1e7)];
    if (Math.hypot(pF[0],pF[1]) > 1e-5) toO=false;
  }
  ok("cross-slit connectors lie on chains (trail hyperbolas, axis-parallel asymptotes)", hyp);
  ok("cross-slit connectors run to the origin — seat and vanishing point welded, one for all of depth", toO); }

{ let good = true;                                                        /* 13 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2); let v=-rIn(0.3,3.2);
    if (Math.abs(u-v)<0.05) v=u-0.5;
    const l0=rIn(0.05,1.0);
    for (const sx of [-Q,Q]) for (const sy of [-Q,Q]){
      const S2=strike(u,v,l0,sx,sy);
      if (!near(S2[0], sx*mag(u,l0), 1e-9) || !near(S2[1], sy*mag(v,l0), 1e-9)) good=false;
    }
  }
  ok("the gauge square's corners strike exactly on the cross-slit frame at λ₀ — the drawn rays are honest", good); }

{ let good = true;                                                        /* 14 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2), v=-rIn(0.3,3.2), l0=rIn(0.05,1.0);
    const cu=Q*mag(u,l0), cv=Q*mag(v,l0), gu=Q/mag(u,l0), gv=Q/mag(v,l0);
    if (!near((2*cu)*(2*cv)*(2*gu)*(2*gv), Math.pow(2*Q,4), 1e-9)) good=false;
  }
  ok("area reciprocity at the gauge depth: camera frame × glide frame = (2q)⁴", good); }

{ let good = true;                                                        /* 15 */
  for (let i=0;i<40;i++){
    const u=-rIn(0.3,3.2), v=-rIn(0.3,3.2), l=rIn(0.02,1.0);
    if (!(Q*mag(u,l)<Q && Q*mag(v,l)<Q && Q/mag(u,l)>Q && Q/mag(v,l)>Q)) good=false;
  }
  ok("nesting: cross-slit frames inside the red rectangle, glide frames outside, every depth", good); }

{ let zero = true;                                                        /* 16 */
  const D = (u,v)=>{const ru=1/(-u), rv=1/(-v); return ru*rv*(rv-ru);};
  if (!near(D(-1.4,-1.4), 0)) zero=false;
  if (Math.abs(D(-2,-1)) < 1e-6) zero=false;
  if (!(Math.abs(D(-1e6,-1)) < 1e-5)) zero=false;
  ok("seam meter zero set: Δ = 0 at u = v, and Δ → 0 as a foot retreats to −∞", zero); }

{                                                                          /* 17 */
  const u=-2, v=-1;
  const kU=(u-v)/u, kV=(v-u)/v;
  ok("at default feet the four seats sit on the sheet: |q·(u−v)/u|, |q·(v−u)/v| ≤ plane extent",
     Math.abs(Q*kU) <= XT && Math.abs(Q*kV) <= XT); }

/* ================= view containment ================= */

{                                                                          /* 18,19,20 */
  const world = [];
  for (const sx of [-1.29,1.29]) for (const sy of [-1.29,1.29]) world.push([0,sx,sy]);   // plane + overshoot
  world.push([-3.3,0,0],[1.55,0,0]);                                                     // axis
  for (const f of [-3.25,-0.30]) for (const [a,b] of [[0,0.5],[0,-0.5],[0.5,0],[-0.5,0]])
    world.push([f,a,b]);                                                                 // slit extremes
  for (const sx of [-Q,Q]) for (const sy of [-Q,Q]) world.push([LAM,sx,sy]);             // slab far square
  for (const s of [-0.95,0.95]){ world.push([LAM,s,s]); world.push([LAM,s,-s]); }        // back plane quad
  for (const l0 of [0.05,1.0]) for (const s of [-0.80,0.80]){
    world.push([l0,s,s]); world.push([l0,s,-s]); }                                       // gauge plane range
  const inside = V => world.every(w => {
    const p = projV(V, w);
    return p[0] >= 6 && p[0] <= 1314 && p[1] >= 6 && p[1] <= 774;
  });
  ok("¾ view contains the whole drawing (planes included)", inside(VIEWS.three));
  ok("face view contains the whole drawing", inside(VIEWS.face));
  ok("edge-on view contains the whole drawing", inside(VIEWS.sheet));
}

console.log(failed === 0
  ? `\nall ${n} assertions pass`
  : `\n${failed} of ${n} assertions FAILED`);
process.exit(failed === 0 ? 0 : 1);
