// check_window_floor_3d.js — verifies window-and-floor-3d.html
// Dependency-free. Extracts the CORE and DRAW blocks from the plate and re-asserts the geometry.
'use strict';
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'window-and-floor-3d.html'), 'utf8');
function block(name) {
  const a = html.indexOf('/*' + name + '*/'), b = html.indexOf('/*END' + name + '*/');
  if (a < 0 || b < 0) throw new Error('missing block ' + name);
  return html.slice(a + name.length + 4, b);
}
// Evaluate CORE + DRAW on the global scope (indirect eval)
(0, eval)(block('CORE'));
(0, eval)(block('DRAW'));

let n = 0, failed = 0;
function assert(label, cond) {
  n++;
  if (cond) console.log('  ok ' + String(n).padStart(2) + '  ' + label);
  else { failed++; console.log('FAIL ' + String(n).padStart(2) + '  ' + label); }
}
const close = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-12);

console.log('check_window_floor_3d — ' + new Date().toISOString().slice(0, 10));

// --- Rig constants
assert('r is the reciprocal of the pinhole depth: r·Zp = 1', close(R * ZP, 1));
assert('seat is the principal point (0,0)', SEAT.x === 0 && SEAT.y === 0);

// --- Pierce point: parametric sight-line intersection equals the closed form F/(1+rz)
let worst = 0;
for (const z of [0, 1, 137, 300, 512, 1000]) {
  const a = sightIntersect(z), b = markOnSheet(z);
  worst = Math.max(worst, Math.hypot(a.x - b.x, a.y - b.y));
}
assert('pierce point = F/(1+rz) at six depths (worst ' + worst.toExponential(1) + ')', worst < 1e-10);

// --- The weld: Turn tick sits on the mark at every depth
worst = 0;
for (let i = 0; i < 200; i++) {
  const z = (i / 199) * ZMAX;
  const t = tickPos(wTurn(z)), m = markOnSheet(z);
  worst = Math.max(worst, Math.hypot(t.x - m.x, t.y - m.y));
}
assert('weld: Turn tick = mark over 200 depths (worst ' + worst.toExponential(1) + ')', worst < 1e-10);

// --- Book-form weld: F + mu·(−rF) with mu = lambda/(1+r·lambda) reproduces the mark
worst = 0;
for (let i = 0; i < 50; i++) {
  const lam = Math.random() * ZMAX;
  const mu = lam / (1 + R * lam);
  const gx = F.x + mu * (-R * F.x), gy = F.y + mu * (-R * F.y);
  const m = markOnSheet(lam);
  worst = Math.max(worst, Math.hypot(gx - m.x, gy - m.y));
}
assert('book convention: G(mu), mu = lambda/(1+r lambda), lands on C(lambda) (worst ' + worst.toExponential(1) + ')', worst < 1e-10);

// --- Reach: calibration, equal steps, no finite seat
assert('Reach agrees with Turn at the drawn level z = ' + Z1, close(wReach(Z1), wTurn(Z1), 0));
let affine = true;
for (let z = 0; z + 100 <= ZMAX; z += 50) {
  const d2 = (wReach(z + 100) - wReach(z + 50)) - (wReach(z + 50) - wReach(z));
  if (Math.abs(d2) > 1e-14) affine = false;
}
assert('Reach is affine in z: equal depth steps, equal tick steps', affine);
assert('Reach leaves infinity unmarked: w(10^6) = ' + wReach(1e6).toFixed(0) + ', unbounded', wReach(1e6) > 100);
const zExit = reachExitZ();
assert('Reach tick reaches the seat at z = ' + zExit + ' and passes it', close(wReach(zExit), 1) && wReach(zExit + 1) > 1);
{
  const t = tickPos(wReach(zExit + 1));
  const dot = (t.x - SEAT.x) * (F.x - SEAT.x) + (t.y - SEAT.y) * (F.y - SEAT.y);
  assert('beyond exit the tick is on the far side of the seat', dot < 0);
}

// --- Turn: finite seat, crowding law
assert('Turn seats infinity finitely: w(10^12) -> 1', close(wTurn(1e12), 1, 1e-9));
{
  const t = tickPos(1);
  assert('the seat is the tick at w = 1', close(t.x, SEAT.x) && close(t.y, SEAT.y));
}
let crowd = true, prev = null;
for (let z = 0; z + 100 <= ZMAX; z += 100) {
  const step = wTurn(z + 100) - wTurn(z);
  if (prev !== null && !(step < prev)) crowd = false;
  prev = step;
}
assert('camera marks crowd: equal depth steps shrink strictly on the sheet', crowd);

// --- Datum both ways: at z = 0 both rulers read the footprint, magnification 1
{
  const m = markOnSheet(0), tT = tickPos(wTurn(0)), tR = tickPos(wReach(0));
  assert('z = 0: mark = tick = footprint under both rulers (the exempt level)',
    close(m.x, F.x) && close(m.y, F.y) && close(tT.x, F.x) && close(tR.x, F.x) &&
    close(tT.y, F.y) && close(tR.y, F.y));
}
{
  let mono = true;
  for (let z = 0; z < ZMAX; z += 25)
    if (!(markOnSheet(z + 25).x < markOnSheet(z).x)) mono = false;
  assert('mark travels monotonically from footprint toward seat', mono);
}

// --- Projection: rotations are rigid; affine depth compression cannot bend lines
{
  let rigid = true;
  for (let i = 0; i < 40; i++) {
    const p = { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100, z: Math.random() * 200 - 100 };
    const L0 = Math.hypot(p.x, p.y, p.z);
    const q = rotX(rotY(p, 0.7), -0.4);
    const L1 = Math.hypot(q.x, q.y, q.z);
    if (!close(L0, L1, 1e-9)) rigid = false;
  }
  assert('rotY/rotX preserve length (rigid view, 40 random points)', rigid);
}
{
  // Collinearity survives the whole pipeline: probe, pierce point, pinhole project collinear
  const z = 415, v = DEFAULT_VIEW;
  const a = project({ x: F.x, y: F.y, z: z }, v);
  const m0 = markOnSheet(z);
  const b = project({ x: m0.x, y: m0.y, z: 0 }, v);
  const c = project({ x: 0, y: 0, z: -ZP }, v);
  const cross = (b.X - a.X) * (c.Y - a.Y) - (b.Y - a.Y) * (c.X - a.X);
  assert('projected sight line stays straight through the projected mark (cross ' + cross.toExponential(1) + ')', Math.abs(cross) < 1e-6);
}
{
  // Everything the scene draws lands inside the 720 x 640 viewBox at the default view
  const v = DEFAULT_VIEW;
  const pts = [
    { x: -160, y: -120, z: 0 }, { x: 160, y: -120, z: 0 }, { x: 160, y: 120, z: 0 }, { x: -160, y: 120, z: 0 },
    { x: 0, y: 0, z: -ZP - 90 }, { x: 0, y: 0, z: ZMAX + 60 },
    { x: F.x, y: F.y, z: ZMAX },
    { x: tickPos(wReach(ZMAX)).x, y: tickPos(wReach(ZMAX)).y, z: 0 },
    { x: tickPos(2.9).x, y: tickPos(2.9).y, z: 0 }
  ];
  let inBox = true;
  for (const p of pts) {
    const q = project(p, v);
    if (q.X < 8 || q.X > 712 || q.Y < 8 || q.Y > 632) inBox = false;
  }
  assert('all scene extremes project inside the viewBox at the default view', inBox);
}

// --- Scene builder: headless smoke over both rulers
{
  const v = DEFAULT_VIEW;
  const sTurn = sceneSVG({ z: 300, ruler: 'turn', rays: true, view: v });
  const sReach = sceneSVG({ z: 800, ruler: 'reach', rays: false, view: v });
  assert('sceneSVG returns markup with the mark ring and tick dot', sTurn.includes('markRing') && sTurn.includes('tickDot'));
  assert('no NaN coordinates in either ruler state', !sTurn.includes('NaN') && !sReach.includes('NaN'));
  const rings = (sTurn.match(/<circle/g) || []).length;
  assert('scene carries the camera marks, pinhole, probe, and moving pair (' + rings + ' circles)', rings >= 9);
}

console.log(failed === 0 ? '\nALL ' + n + ' CHECKS PASS' : '\n' + failed + ' OF ' + n + ' FAILED');
process.exit(failed === 0 ? 0 : 1);
