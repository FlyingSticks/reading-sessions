// check-the-twist-v2.js — node check for the-twist-v2.html (the sheet's rig)
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'twist2-math.js'), 'utf8');
new Function(src)();
const M = globalThis.TwistMath2, V = M.v;
let pass = 0, fail = 0;
const ok = (n, c, note) => { if (c) pass++; else fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (note ? '   ' + note : '')); };
const near = (x, y, t) => Math.abs(x - y) <= t;
const deg = d => d * Math.PI / 180;
const s = 60;
console.log('the-twist v2 · node check');

{ let w = 0; for (let k = 0; k <= 360; k++) { const th = deg(k - 180); w = Math.max(w, Math.abs(M.det(M.corners(s, th)) - M.detFormula(s, th)) / (8 * s * s * s)); }
  ok('1  det(B−A, C−A, D−A) = −8s³·sin θ', w < 1e-12, 'rel drift ' + w.toExponential(1)); }
{ let z = true, nz = true; for (let k = 0; k <= 180; k++) { const d = Math.abs(M.det(M.corners(s, deg(k)))); if (k === 0 || k === 180) { if (d > 1e-6) z = false; } else if (d < 1e-6) nz = false; }
  ok('2  flat at 0° and 180°, a tetrahedron everywhere between', z && nz); }
{ let w = 0; for (let k = 1; k < 180; k++) { const th = deg(k); w = Math.max(w, Math.abs(M.sideGap(M.corners(s, th)).gap - M.sideGapFormula(s, th)) / s); }
  ok('3  gap between the sides AB, CD (common perpendicular) = 2s·cos(θ/2)', w < 1e-12, 'rel drift ' + w.toExponential(1)); }
{ let w = 0; for (let k = 5; k < 180; k++) { const th = deg(k); const c = M.planCrossing(M.corners(s, th)); w = Math.max(w, Math.abs(c.gap - M.projectorGapFormula(s, th)) / Math.max(1, Math.abs(c.gap))); }
  ok('4  gap on the projector through the plan crossing = 2s·cot(θ/2), AB below CD', w < 1e-10, 'rel drift ' + w.toExponential(1)); }
{ let onAxis = true, insideRight = true;
  for (let k = 1; k < 180; k++) { const c = M.planCrossing(M.corners(s, deg(k))); if (Math.abs(c.x) > 1e-9) onAxis = false; if (c.inside !== (k >= 90)) insideRight = false; }
  ok('5  plan crossing lies on the axis; inside both sides exactly for θ ≥ 90°', onAxis && insideRight); }
{ const P = M.corners(s, deg(90)); ok('6  90°: BD stands on the axis — point view at (0, s), B below, D above', near(P.B[0], 0, 1e-9) && near(P.D[0], 0, 1e-9) && near(P.B[2], -s, 1e-9) && near(P.D[2], s, 1e-9));
  const c = M.planCrossing(P); ok('6′ 90°: the sides meet the point view in plan, 2s apart in space', near(c.x, 0, 1e-9) && near(c.y, s, 1e-9) && near(Math.abs(c.gap), 2 * s, 1e-9)); }
{ const P = M.corners(s, deg(180)); ok('7  180°: B and D have swapped places in the floor', near(P.B[0], s, 1e-9) && near(P.D[0], -s, 1e-9) && near(P.B[2], 0, 1e-9) && near(P.D[2], 0, 1e-9));
  const c = M.planCrossing(P); ok('7′ 180°: incident point at the centre, gap 0', near(c.x, 0, 1e-9) && near(c.y, 0, 1e-9) && near(c.gap, 0, 1e-9) && near(M.sideGap(P).gap, 0, 1e-9)); }
{ ok('8  BD\'s face: red up at 0°, edge-on at 90°, blue up at 180° — the flip is cos θ', M.faceUp(0) === 1 && near(M.faceUp(deg(90)), 0, 1e-12) && M.faceUp(deg(180)) === -1); }
{ let agree = true; for (let k = 1; k < 180; k++) { const th = deg(k); if (Math.sign(M.det(M.corners(s, th))) !== Math.sign(M.projectorGapFormula(s, th))) agree = false; }
  ok('9  sign of det = sign of the projector gap (which side passes over)', agree); }
{ const html = path.join(__dirname, 'the-twist-v2.html');
  if (fs.existsSync(html)) { const m = fs.readFileSync(html, 'utf8').match(/<script id="twist2-math">\n([\s\S]*?)<\/script>/); ok('10 inline math block in the-twist-v2.html is twist2-math.js verbatim', !!m && m[1] === src); }
  else console.log('  --   10 the-twist-v2.html not present yet (pre-build run)'); }
console.log(`\n${pass}/${pass + fail} checks passed${fail ? '  — ' + fail + ' FAILED' : ''}`);
process.exit(fail ? 1 : 0);
