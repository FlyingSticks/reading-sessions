// check-the-miniature.js — audit for the-miniature.html (reading-sessions)
// Verifies the constants and claims the companion page displays.
// Run: node check-the-miniature.js
"use strict";
let pass = 0, fail = 0;
function assert(name, ok, detail) {
  if (ok) { pass++; console.log("  ok  " + name + (detail ? "  [" + detail + "]" : "")); }
  else    { fail++; console.log("FAIL  " + name + (detail ? "  [" + detail + "]" : "")); }
}
const close = (a, b, eps) => Math.abs(a - b) <= (eps || 1e-12);

// ---- vector helpers ----
const dot = (a,b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const nrm = a => { const s = Math.hypot(a[0],a[1],a[2]); return [a[0]/s,a[1]/s,a[2]/s]; };

// ================================================================
// 1. The welded number. Orthographic projection along the cube
//    diagonal, viewed in the drawing's own convention (z up on the
//    page): direction n = (1,1,-1)/sqrt3, screen right u, screen up v.
//    Every unit edge projects to length sqrt(2/3).
// ================================================================
const n = nrm([1,1,-1]);
const u = nrm([1,-1,0]);           // screen right
const v = nrm([1,1,2]);            // screen up = world z, projected
assert("screen basis orthonormal and perpendicular to the rays",
  close(dot(u,v),0) && close(dot(u,n),0) && close(dot(v,n),0) &&
  close(dot(u,u),1) && close(dot(v,v),1));
const P = p => [dot(p,u), dot(p,v)];
const len2 = q => Math.hypot(q[0], q[1]);

const E = [[1,0,0],[0,1,0],[0,0,1]];
const S = Math.sqrt(2/3);          // 0.816496580927726
E.forEach((e,i) => assert("edge e"+(i+1)+" projects to length sqrt(2/3)",
  close(len2(P(e)), S), len2(P(e)).toFixed(7)));
assert("sqrt(2/3) = 0.8165 to 4 places", close(Math.round(S*1e4)/1e4, 0.8165));

// The classic corner fact: the three edges MEETING AT A CORNER
// (+e1, +e2, -e3 out of the vertex (0,0,1)) project at mutual 120°.
const Y = [P([1,0,0]), P([0,1,0]), P([0,0,-1])];
for (let i=0;i<3;i++) for (let j=i+1;j<3;j++) {
  const c = (Y[i][0]*Y[j][0]+Y[i][1]*Y[j][1]) / (len2(Y[i])*len2(Y[j]));
  assert("corner edges "+(i+1)+","+(j+1)+" at 120°", close(c, -0.5), "cos=" + c.toFixed(7));
}
// Attitude matches the drawing convention exactly:
assert("vertical edge projects vertical", close(P([0,0,1])[0], 0));
const ang1 = Math.atan2(P([1,0,0])[1], P([1,0,0])[0]) * 180/Math.PI;
assert("receding edge at +30° above horizontal", close(ang1, 30, 1e-9), ang1.toFixed(7) + "°");

// ================================================================
// 2. The remembered number: cos 30° = 0.8660 is the horizontal run
//    of a unit receding edge ON THE DRAWING (not the edge scale).
// ================================================================
const C30 = Math.cos(Math.PI/6);   // 0.8660254...
assert("cos 30° = 0.8660 to 4 places", close(Math.round(C30*1e4)/1e4, 0.8660));
const D = p => [ (p[0]-p[1])*C30, (p[0]+p[1])*0.5 + p[2] ];  // 30/30 drawing, true units
assert("drawing: unit edge length 1 (full size)", close(Math.hypot(D([1,0,0])[0]-D([0,0,0])[0], D([1,0,0])[1]-D([0,0,0])[1]), 1));
assert("drawing: unit edge horizontal run = cos30 = .8660", close(D([1,0,0])[0], C30));
assert("drawing: unit edge rise = 1/2", close(D([1,0,0])[1], 0.5));
// On the PROJECTION the same run is foreshortened:
assert("projection: receding-edge horizontal run = sqrt(2)/2 = .7071",
  close(Math.abs(P([1,0,0])[0]), Math.SQRT1_2), Math.abs(P([1,0,0])[0]).toFixed(7));
assert(".8660 is not the edge scale: cos30 vs sqrt(2/3) differ", !close(C30, S, 1e-3),
  C30.toFixed(4) + " vs " + S.toFixed(4));

// ================================================================
// 3. One congruence: the drawing map and the projection map are THE
//    SAME MAP up to one uniform scale — D = P / sqrt(2/3), checked
//    on the three edge vectors and over all 28 vertex pairs.
// ================================================================
E.forEach((e,i) => assert("map identity on e"+(i+1)+": D = P / sqrt(2/3)",
  close(D(e)[0]-D([0,0,0])[0], P(e)[0]/S) && close(D(e)[1]-D([0,0,0])[1], P(e)[1]/S)));
const verts = [];
for (let a=0;a<2;a++) for (let b=0;b<2;b++) for (let c=0;c<2;c++) verts.push([a,b,c]);
let simOK = true, worst = 0;
for (let i=0;i<8;i++) for (let j=i+1;j<8;j++) {
  const dd = Math.hypot(D(verts[i])[0]-D(verts[j])[0], D(verts[i])[1]-D(verts[j])[1]);
  const dp = Math.hypot(P(verts[i])[0]-P(verts[j])[0], P(verts[i])[1]-P(verts[j])[1]);
  const err = Math.abs(dp - S*dd);
  worst = Math.max(worst, err);
  if (err > 1e-12) simOK = false;
}
assert("all 28 vertex-pair distances scale by exactly sqrt(2/3)", simOK, "worst err " + worst.toExponential(2));
assert("drawing-to-projection enlargement = sqrt(3/2) = 1.2247",
  close(Math.round((1/S)*1e4)/1e4, 1.2247), (1/S).toFixed(7));

// ================================================================
// 4. The affine fact behind the constancy: both maps are linear, so
//    the ratio cannot depend on position — moving the cube anywhere
//    in space changes nothing.
// ================================================================
let transOK = true;
for (const t of [[3,-2,5],[10,10,10],[-7,0.5,2.25]]) {
  for (let i=0;i<8;i++) for (let j=i+1;j<8;j++) {
    const A = verts[i].map((x,k)=>x+t[k]), B = verts[j].map((x,k)=>x+t[k]);
    const dp = Math.hypot(P(A)[0]-P(B)[0], P(A)[1]-P(B)[1]);
    const dd = Math.hypot(D(A)[0]-D(B)[0], D(A)[1]-D(B)[1]);
    if (Math.abs(dp - S*dd) > 1e-9) transOK = false;
  }
}
assert("ratio unchanged under translation (3 placements x 28 pairs)", transOK);

// ================================================================
// 5. Un-parallelling (instrument 2 model, book Ch. 2 convention
//    x/(1+r lambda)): camera local scale c(l) = s/(1+rl)^2, drawing
//    local scale = u (constant). Defect delta(l) = u - c(l).
// ================================================================
const s = S;
const cam = (r,l) => s/Math.pow(1+r*l, 2);
// r = 0: defect constant at every depth — the 1979 world.
{
  const r=0, u0=1.0;
  let constOK = true;
  for (let l=0; l<=8; l+=0.25) if (!close(u0-cam(r,l), u0-s)) constOK = false;
  assert("r=0: defect constant in depth (= u - .8165)", constOK, (u0-s).toFixed(4));
  assert("r=0: defect zeroed EVERYWHERE by one gauge choice u=s", close(s-cam(0,3.7), 0));
}
// r > 0: camera scale strictly decreasing, so the defect crosses
// zero at most once; it crosses exactly once iff u < s.
{
  const r=0.35;
  let mono = true, prev = cam(r,0);
  for (let l=0.05; l<=12; l+=0.05) { const c2=cam(r,l); if (c2 >= prev) mono=false; prev=c2; }
  assert("r>0: camera scale strictly decreasing in depth", mono);
  const lstar = uu => (Math.sqrt(s/uu)-1)/r;
  const uu = 0.70, L = lstar(uu);
  assert("r>0, u<s: unique agreement depth = (sqrt(s/u)-1)/r",
    close(uu - cam(r,L), 0) && L > 0, "l*=" + L.toFixed(4));
  let none = true;
  for (let l=0.01; l<=200; l+=0.01) if (1.0 - cam(r,l) <= 0) none = false;
  assert("r>0, u>=s: no agreement at any positive depth", none);
  let reloc = true;
  for (const uu2 of [0.5, 0.65, 0.8]) { const L2=lstar(uu2); if (!(L2>0 && close(uu2-cam(r,L2),0))) reloc=false; }
  assert("r>0: gauge choice relocates the zero, cannot remove it", reloc);
}

// ================================================================
console.log("\n" + pass + "/" + (pass+fail) + " assertions pass" + (fail ? "  — " + fail + " FAILED" : ""));
process.exit(fail ? 1 : 0);
