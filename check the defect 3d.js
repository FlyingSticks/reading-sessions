// check_the_defect_3d.js — verifies the-defect-3d.html
// Dependency-free. Extracts the CORE and DRAW blocks from the plate and re-asserts the geometry.
'use strict';
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'the-defect-3d.html'), 'utf8');
function block(name) {
  const a = html.indexOf('/*' + name + '*/'), b = html.indexOf('/*END' + name + '*/');
  if (a < 0 || b < 0) throw new Error('missing block ' + name);
  return html.slice(a + name.length + 4, b);
}
(0, eval)(block('CORE'));
(0, eval)(block('DRAW'));

let n = 0, failed = 0;
function assert(label, cond) {
  n++;
  if (cond) console.log('  ok ' + String(n).padStart(2) + '  ' + label);
  else { failed++; console.log('FAIL ' + String(n).padStart(2) + '  ' + label); }
}
const close = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-12);

console.log('check_the_defect_3d — ' + new Date().toISOString().slice(0, 10));

// --- Rig and calibration (shared with the sibling plates)
assert('r is the reciprocal of the pinhole depth: r·Zp = 1', close(R * ZP, 1));
assert('Reach agrees with Turn at the first counted level z = ' + Z1, close(wReach(Z1), wTurn(Z1), 0));
assert('the counted world reaches N·dz = ' + (NMAX * DZ), ZWORLD === NMAX * DZ);

// --- The welded camera: its marks are the Turn placements, exactly, with no slider
{
  let worst = 0;
  for (let i = 0; i < 200; i++) {
    const z = (i / 199) * ZWORLD;
    const m = markOnSheet(z), q = tickPos(wTurn(z));
    worst = Math.max(worst, Math.hypot(m.x - q.x, m.y - q.y));
  }
  assert('camera mark = Turn placement over 200 depths (worst ' + worst.toExponential(1) + ')', worst < 1e-10);
}

// --- The placement family: endpoints, order, monotone slide
assert('the morph\'s ends are the two rulers: wMix(z,0) = Reach, wMix(z,1) = Turn',
  [50, 137, 300, 512, 800].every(z => close(wMix(z, 0), wReach(z), 0) && close(wMix(z, 1), wTurn(z), 0)));
{
  let ordered = true;
  for (const t of [0, 0.3, 0.7, 1]) {
    for (let i = 1; i < NMAX; i++)
      if (!(wMix((i + 1) * DZ, t) > wMix(i * DZ, t))) ordered = false;
  }
  assert('the numbers never exchange places: tick order preserved at every placement', ordered);
}
{
  let mono = true;
  for (let i = 1; i <= NMAX; i++) {
    let prev = wMix(i * DZ, 0);
    for (let t = 0.05; t <= 1.0001; t += 0.05) {
      const w = wMix(i * DZ, t);
      if (w > prev + 1e-12) mono = false;
      prev = w;
    }
  }
  assert('each counted tick slides one way as the placement turns (no back-and-forth)', mono);
}

// --- Theorem 0 along the whole family: every blend short of Turn leaves infinity unmarked
{
  let unbounded = true;
  for (const t of [0, 0.25, 0.5, 0.9, 0.99, 0.999])
    if (!(wMix(1e9, t) > 1e3)) unbounded = false;
  assert('every blend short of pure Turn is unbounded: infinity has no mark for t < 1', unbounded);
  assert('pure Turn seats infinity finitely: wMix(10^12, 1) -> 1', close(wMix(1e12, 1), 1, 1e-9));
  assert('the seat is the tick at w = 1', close(tickPos(1).x, SEAT.x) && close(tickPos(1).y, SEAT.y));
}

// --- The sliver: shrinking at every stop of the count, nonzero at every stop
{
  let ok = true, prev = Infinity;
  for (let N = 1; N <= NMAX; N++) {
    const s = sliver(N);
    if (!(s > 0) || !(s < prev)) ok = false;
    prev = s;
  }
  assert('the account\'s price at Turn shrinks at every count stop and vanishes at none', ok);
}
{
  // Turn spends the whole drawn line: counted intervals plus the sliver partition [0, 1]
  let ok = true;
  for (let N = 1; N <= NMAX; N++) {
    let sum = 0, prev = 0;
    for (let i = 1; i <= N; i++) { sum += wTurn(i * DZ) - prev; prev = wTurn(i * DZ); }
    if (!close(sum + sliver(N), 1)) ok = false;
  }
  assert('intervals + sliver = the whole drawn line, for every count stop (telescoping)', ok);
}
{
  // Grade and pile, as laws of the two ends
  let grading = true, prev = Infinity;
  for (let i = 1; i <= NMAX; i++) {
    const step = wTurn(i * DZ) - wTurn((i - 1) * DZ);
    if (!(step < prev)) grading = false;
    prev = step;
  }
  assert('Turn grades: every drawn interval shorter than the last', grading);
  let equal = true;
  const step0 = wReach(DZ) - wReach(0);
  for (let i = 2; i <= NMAX; i++)
    if (!close(wReach(i * DZ) - wReach((i - 1) * DZ), step0)) equal = false;
  assert('Reach piles: every drawn step equal, the account exiled past the open end', equal);
}
assert('the datum is exempt: tick 0 at the footprint under every placement',
  [0, 0.4, 1].every(t => close(wMix(0, t), 0)));

// --- Projection and scene
{
  let rigid = true;
  for (let i = 0; i < 40; i++) {
    const p = { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100, z: Math.random() * 200 - 100 };
    const q = rotX(rotY(p, 0.7), -0.4);
    if (!close(Math.hypot(p.x, p.y, p.z), Math.hypot(q.x, q.y, q.z), 1e-9)) rigid = false;
  }
  assert('rotY/rotX preserve length (rigid view, 40 random points)', rigid);
}
{
  // Scene extremes inside the 720 x 640 viewBox at the default view
  const v = DEFAULT_VIEW;
  const pts = [
    { x: -160, y: -120, z: 0 }, { x: 160, y: -120, z: 0 }, { x: 160, y: 120, z: 0 }, { x: -160, y: 120, z: 0 },
    { x: 0, y: 0, z: -ZP - 90 }, { x: 0, y: 0, z: ZWORLD + 60 },
    { x: F.x, y: F.y, z: ZWORLD + 70 },                                  // the account's arrowhead
    { x: tickPos(wMix(NMAX * DZ, 0)).x, y: tickPos(wMix(NMAX * DZ, 0)).y, z: 0 },   // farthest Reach tick
    { x: tickPos(2.9).x, y: tickPos(2.9).y, z: 0 }                       // the open extension's end
  ];
  let inBox = true;
  for (const p of pts) {
    const q = project(p, v);
    if (q.X < 8 || q.X > 712 || q.Y < 8 || q.Y > 632) inBox = false;
  }
  assert('scene extremes project inside the viewBox at the default view', inBox);
}
{
  const v = DEFAULT_VIEW;
  const sReach = sceneSVG({ N: 5, t: 0, rays: false, view: v });
  const sTurn = sceneSVG({ N: 5, t: 1, rays: false, view: v });
  const sMid = sceneSVG({ N: 8, t: 0.5, rays: true, view: v });
  assert('sceneSVG carries the infinity ring, visible only as the placement turns',
    sTurn.includes('id="infinityRing"') && sTurn.includes('opacity="1.00"') &&
    sReach.includes('opacity="0.00"'));
  assert('no NaN coordinates at Reach, Turn, or mid-morph with rays', !sReach.includes('NaN') && !sTurn.includes('NaN') && !sMid.includes('NaN'));
  const numsReach = (sReach.match(/>5<\/text>/g) || []).length;
  const numsTurn = (sTurn.match(/>1<\/text>/g) || []).length;
  assert('the count rides the morph: numerals on the world and on the glass, thinning only where ticks crowd',
    numsReach >= 2 && numsTurn >= 2);
  assert('the exiled account is an arrow at Reach and a closed sliver at Turn',
    sReach.includes('#c0322b') && sReach.includes('polygon') &&
    sTurn.includes('stroke-linecap="round"'));
}

console.log(failed === 0 ? '\nALL ' + n + ' CHECKS PASS' : '\n' + failed + ' OF ' + n + ' FAILED');
process.exit(failed === 0 ? 0 : 1);
