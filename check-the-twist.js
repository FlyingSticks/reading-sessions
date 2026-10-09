// check-the-twist.js — node check for the-twist-v1.html
// Run: node check-the-twist.js
// Loads the math from twist-math.js, and if the-twist-v1.html is present, re-extracts
// the inline <script id="twist-math"> block and asserts it is byte-identical (shipped-math check).
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'twist-math.js'), 'utf8');
new Function(src)();
const M = globalThis.TwistMath;
const V = M.v;

let pass = 0, fail = 0;
function ok(name, cond, note) {
  if (cond) { pass++; console.log('  ok   ' + name + (note ? '   ' + note : '')); }
  else { fail++; console.log('  FAIL ' + name + (note ? '   ' + note : '')); }
}
const near = (x, y, tol) => Math.abs(x - y) <= tol;
const rnd = (lo, hi) => lo + Math.random() * (hi - lo);
Math.random = (function () { let s = 20261008; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; })();

console.log('the-twist · node check');

// 1. det = 8ab² sin θ in the stated vertex order
{
  let worst = 0;
  for (let i = 0; i < 200; i++) {
    const a = rnd(20, 200), b = rnd(20, 200), th = rnd(-Math.PI, Math.PI);
    const P = M.corners(a, b, th);
    worst = Math.max(worst, Math.abs(M.det(P) - M.detFormula(a, b, th)) / (8 * a * b * b));
  }
  ok('1  det(P1,P2,P3,P4) = 8ab²·sin θ', worst < 1e-12, 'rel drift ' + worst.toExponential(1));
}
// 2. det vanishes exactly at θ = 0 and θ = ±180°, nowhere else sampled
{
  const P0 = M.corners(100, 60, 0), Ppi = M.corners(100, 60, Math.PI), Pm = M.corners(100, 60, -Math.PI);
  let nonzero = true;
  for (let k = 1; k < 36; k++) { const th = k * Math.PI / 36 - Math.PI; if (Math.abs(th) < 1e-9) continue; if (Math.abs(M.det(M.corners(100, 60, th))) < 1e-6) nonzero = false; }
  ok('2  flat exactly at 0° and ±180°', near(M.det(P0), 0, 1e-9) && near(M.det(Ppi), 0, 1e-6) && near(M.det(Pm), 0, 1e-6) && nonzero);
}
// 3. projector gap at the purple point = 2b·tan(θ/2)
{
  let worst = 0;
  for (let i = 0; i < 200; i++) {
    const a = rnd(20, 200), b = rnd(20, 200), th = rnd(-0.95 * Math.PI, 0.95 * Math.PI);
    const P = M.corners(a, b, th);
    const c = M.planCrossing(M.line(P, [0, 2]), M.line(P, [1, 3]));
    worst = Math.max(worst, Math.abs(c.projectorGap - M.projectorGapFormula(b, th)) / Math.max(1, Math.abs(c.projectorGap)));
  }
  ok('3  projector gap = 2b·tan(θ/2)', worst < 1e-10, 'rel drift ' + worst.toExponential(1));
}
// 4. common perpendicular = |det| / |d1 × d2|
{
  let worst = 0;
  for (let i = 0; i < 200; i++) {
    const a = rnd(20, 200), b = rnd(20, 200), th = rnd(-0.95 * Math.PI, 0.95 * Math.PI);
    const P = M.corners(a, b, th);
    const L1 = M.line(P, [0, 2]), L2 = M.line(P, [1, 3]);
    const g = M.skewGap(L1, L2);
    const expect = Math.abs(M.det(P)) / V.norm(V.cross(L1.d, L2.d));
    worst = Math.max(worst, Math.abs(g.gap - expect) / Math.max(1, expect));
  }
  ok('4  skew gap = |det| / |d₁×d₂|', worst < 1e-10, 'rel drift ' + worst.toExponential(1));
}
// 5. sign(det) = sign(projector gap) : the determinant's sign says which diagonal passes over
{
  let agree = true;
  for (let i = 0; i < 200; i++) {
    const th = rnd(-0.95 * Math.PI, 0.95 * Math.PI);
    if (Math.abs(th) < 1e-3) continue;
    const P = M.corners(100, 60, th);
    const c = M.planCrossing(M.line(P, [0, 2]), M.line(P, [1, 3]));
    if (Math.sign(M.det(P)) !== Math.sign(c.projectorGap)) agree = false;
  }
  ok('5  sign(det) = which blue line is on top at the purple point', agree);
}
// 6. the eye's transversal meets both lines of each pair
{
  let worst = 0, count = 0;
  for (let i = 0; i < 60; i++) {
    const th = rnd(-0.9 * Math.PI, 0.9 * Math.PI);
    if (Math.abs(th) < 0.05) continue;
    const P = M.corners(120, 70, th);
    const E = [rnd(-150, 150), rnd(-150, 150), rnd(250, 600)];
    for (const pr of M.pairs) {
      const T = M.transversal(E, M.line(P, pr.lines[0]), M.line(P, pr.lines[1]));
      if (T.degenerate || T.hit1.atInfinity || T.hit2.atInfinity) continue;
      worst = Math.max(worst, T.hit1.residual, T.hit2.residual); count++;
    }
  }
  ok('6  transversal through E meets both lines of each pair', worst < 1e-8 && count > 100, 'max residual ' + worst.toExponential(1) + ' over ' + count);
}
// 7. the three traces are the three diagonal points of the image quadrangle
{
  let worst = 0, count = 0;
  for (let i = 0; i < 60; i++) {
    const th = rnd(-0.9 * Math.PI, 0.9 * Math.PI);
    if (Math.abs(th) < 0.05) continue;
    const P = M.corners(120, 70, th);
    const E = [rnd(-150, 150), rnd(-150, 150), rnd(250, 600)], zp = 160;
    const I = M.image(E, zp, P), D = M.diagonalPoints(I);
    M.pairs.forEach((pr, k) => {
      const T = M.transversal(E, M.line(P, pr.lines[0]), M.line(P, pr.lines[1]));
      if (T.degenerate) return;
      const tr = M.trace(E, zp, T.dir);
      if (!tr.finite || !D[k].finite) return;
      worst = Math.max(worst, Math.hypot(tr.x - D[k].x, tr.y - D[k].y)); count++;
    });
  }
  ok('7  trace of each transversal = diagonal point of the picture', worst < 1e-6, 'max residual ' + worst.toExponential(1) + ' over ' + count);
}
// 8. at 180° the blue pair uncrosses (parallel in plan) and the gold pair crosses: the transposition
{
  const r0 = M.planRoles(M.corners(120, 70, 0));
  const r180 = M.planRoles(M.corners(120, 70, Math.PI));
  ok('8  roles at 0°: red ∥, blue ×, gold ∥', !r0[0] && r0[1] && !r0[2]);
  ok('8′ roles at 180°: red ∥, gold ×, blue ∥  (blue↔gold swapped, red fixed)', !r180[0] && !r180[1] && r180[2]);
}
// 9. the picture is harmonic at every θ — the eye cannot see the twist
{
  let worst = 0, count = 0;
  for (let i = 0; i < 80; i++) {
    const th = rnd(-0.9 * Math.PI, 0.9 * Math.PI);
    const P = M.corners(120, 70, th);
    const E = [rnd(-100, 100), rnd(-100, 100), rnd(300, 600)];
    const H = M.harmonic(M.image(E, 160, P));
    for (const h of H) if (!Number.isNaN(h)) { worst = Math.max(worst, Math.abs(h + 1)); count++; }
  }
  ok('9  every finite diagonal line cut harmonically, (D₁,D₂;X,Y) = −1, flat or twisted', worst < 1e-8 && count > 100, 'max |CR+1| ' + worst.toExponential(1) + ' over ' + count);
}
// 10. fertile vs sterile
{
  ok('10 flat: all three pairs meet (3 new points)', M.meets(M.corners(120, 70, 0)) === 3);
  ok('10′ twisted: no pair meets (closed under join and meet)', M.meets(M.corners(120, 70, 1.1)) === 0);
  let allSkew = true;
  const P = M.corners(120, 70, 1.1);
  for (const pr of M.pairs) { const g = M.skewGap(M.line(P, pr.lines[0]), M.line(P, pr.lines[1])); if (g.parallel || g.gap < 1e-6) allSkew = false; }
  ok('10″ twisted: each opposite pair skew with positive gap', allSkew);
}
// 11. det = 0 is weaker than twist defect T = 0 (flat trapezoid: det 0, T ≠ 0)
{
  const P = [[-100, -60, 0], [-100, 60, 0], [100, 30, 0], [100, -30, 0]];
  const T = V.add(V.sub(P[0], P[1]), V.sub(P[2], P[3]));
  ok('11 flat trapezoid: det = 0 but T = A−B+C−D ≠ 0', near(M.det(P), 0, 1e-9) && V.norm(T) > 1);
}
// 12. shipped-math check: the HTML's inline block is this file, verbatim
{
  const html = path.join(__dirname, 'the-twist-v1.html');
  if (fs.existsSync(html)) {
    const h = fs.readFileSync(html, 'utf8');
    const m = h.match(/<script id="twist-math">\n([\s\S]*?)<\/script>/);
    ok('12 inline math block in the-twist-v1.html is twist-math.js verbatim', !!m && m[1] === src);
  } else {
    console.log('  --   12 the-twist-v1.html not present yet (pre-build run)');
  }
}

console.log(`\n${pass}/${pass + fail} checks passed${fail ? '  — ' + fail + ' FAILED' : ''}`);
process.exit(fail ? 1 : 0);
