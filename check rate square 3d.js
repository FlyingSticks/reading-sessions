// check_rate_square_3d.js — verifies rate-square-3d.html
// Dependency-free. Extracts the CORE and DRAW blocks from the plate and re-asserts the geometry.
'use strict';
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'rate-square-3d.html'), 'utf8');
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
function rig() {                       // random rig, strictly inside the square
  return { ru: 0.0005 + Math.random() * (RMAX - 0.0005), rv: 0.0005 + Math.random() * (RMAX - 0.0005) };
}

console.log('check_rate_square_3d — ' + new Date().toISOString().slice(0, 10));

// --- The threaded ray: built from slit incidence alone, it must be the camera
{
  let worstMark = 0, worstU = 0, worstV = 0, worstP = 0;
  for (let i = 0; i < 100; i++) {
    const q = rig(), z = Math.random() * ZMAXP;
    const rf = rayFn(z, q.ru, q.rv);
    const m = mark(z, q.ru, q.rv), p0 = rf(0);
    worstMark = Math.max(worstMark, Math.hypot(p0.x - m.x, p0.y - m.y));
    worstU = Math.max(worstU, Math.abs(rf(-1 / q.ru).x));         // must lie on the vertical slit line x = 0
    worstV = Math.max(worstV, Math.abs(rf(-1 / q.rv).y));         // must lie on the horizontal slit line y = 0
    const pp = rf(z);
    worstP = Math.max(worstP, Math.hypot(pp.x - F.x, pp.y - F.y));// must pass through the probe
  }
  assert('threaded ray pierces the glass at M(z), 100 random rigs (worst ' + worstMark.toExponential(1) + ')', worstMark < 1e-9);
  assert('the ray meets the vertical slit line exactly (worst |x| ' + worstU.toExponential(1) + ')', worstU < 1e-9);
  assert('the ray meets the horizontal slit line exactly (worst |y| ' + worstV.toExponential(1) + ')', worstV < 1e-9);
  assert('the ray passes through the probe (worst ' + worstP.toExponential(1) + ')', worstP < 1e-9);
}
{
  // Ray is genuinely straight in 3D: three sampled points collinear
  const q = { ru: 1 / 150, rv: 1 / 250 }, rf = rayFn(430, q.ru, q.rv);
  const a = rf(430), b = rf(0), c = rf(-260);
  const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const ac = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
  const cx = ab.y * ac.z - ab.z * ac.y, cy = ab.z * ac.x - ab.x * ac.z, cz = ab.x * ac.y - ab.y * ac.x;
  assert('three points of the book-rig ray are collinear in 3D (|cross| ' +
    Math.hypot(cx, cy, cz).toExponential(1) + ')', Math.hypot(cx, cy, cz) < 1e-8);
}

// --- Straight exactly on the seam (the ledger's theorem, read as curve deviation)
{
  let ok = true;
  for (let i = 0; i < 400; i++) {
    let q, expectStraight;
    const pick = i % 4;
    if (pick === 0) { const r = 0.0005 + Math.random() * 0.0095; q = { ru: r, rv: r }; expectStraight = true; }
    else if (pick === 1) { q = { ru: 0.0005 + Math.random() * 0.0095, rv: 0 }; expectStraight = true; }
    else if (pick === 2) { q = { ru: 0, rv: 0.0005 + Math.random() * 0.0095 }; expectStraight = true; }
    else { q = rig(); if (Math.abs(q.ru - q.rv) < 1e-4) continue; expectStraight = false; }
    const dev = curveDeviation(q.ru, q.rv);
    if (expectStraight !== (dev < 1e-7)) ok = false;
    if (!expectStraight && dev < 1e-3) ok = false;   // off the seam the bow is a real quantity, not a rounding
  }
  assert('camera line straight iff on the seam: 400 rigs across diagonal, edges, interior', ok);
}
{
  // The ledger's algebraic form: y = y0·ru·x / ((ru−rv)x + rv·x0) along the curve
  let worst = 0;
  for (let i = 0; i < 60; i++) {
    const q = rig(), z = Math.random() * ZMAXP;
    const m = mark(z, q.ru, q.rv);
    const yAlg = F.y * q.ru * m.x / ((q.ru - q.rv) * m.x + q.rv * F.x);
    worst = Math.max(worst, Math.abs(yAlg - m.y));
  }
  assert('ledger algebra y = y0·ru·x/((ru−rv)x + rv·x0) holds along the trail (worst ' + worst.toExponential(1) + ')', worst < 1e-9);
}

// --- Welds on every seam branch; no weld off it
{
  let worst = 0;
  for (let i = 0; i < 40; i++) {
    const r = 0.0005 + Math.random() * 0.0095;
    for (let z = 0; z <= ZMAXP; z += 40) {
      const t = glideTick(z, r, r, 'turn'), m = mark(z, r, r);
      worst = Math.max(worst, Math.hypot(t.x - m.x, t.y - m.y));
    }
  }
  assert('diagonal weld: Turn tick = mark for 40 random pinholes (worst ' + worst.toExponential(1) + ')', worst < 1e-9);
}
{
  let worst = 0;
  for (let i = 0; i < 40; i++) {
    const r = 0.0005 + Math.random() * 0.0095;
    for (let z = 0; z <= ZMAXP; z += 40) {
      const tU = glideTick(z, r, 0, 'turn'), mU = mark(z, r, 0);
      const tV = glideTick(z, 0, r, 'turn'), mV = mark(z, 0, r);
      worst = Math.max(worst, Math.hypot(tU.x - mU.x, tU.y - mU.y), Math.hypot(tV.x - mV.x, tV.y - mV.y));
    }
  }
  assert('edge welds: Turn tick = mark on both pushbroom edges (worst ' + worst.toExponential(1) + ')', worst < 1e-9);
}
{
  // Off the seam neither ruler closes: the worst miss is bounded away from zero
  let allMiss = true;
  for (let i = 0; i < 30; i++) {
    const q = rig();
    if (Math.abs(q.ru - q.rv) < 1e-3) { i--; continue; }
    for (const ruler of ['turn', 'reach']) {
      let worst = 0;
      for (let z = 0; z <= ZMAXP; z += 40) {
        const t = glideTick(z, q.ru, q.rv, ruler), m = mark(z, q.ru, q.rv);
        worst = Math.max(worst, Math.hypot(t.x - m.x, t.y - m.y));
      }
      if (worst < 0.05) allMiss = false;
    }
  }
  assert('off the seam no ruler welds: worst miss stays a real quantity, 30 rigs, both rulers', allMiss);
}
{
  const r = 1 / 200;
  assert('Reach agrees with Turn at the drawn level z = ' + Z1, close(muReach(Z1, r), muTurn(Z1, r), 0));
  let affine = true;
  for (let z = 0; z + 100 <= ZMAXP; z += 50) {
    const d2 = (muReach(z + 100, r) - muReach(z + 50, r)) - (muReach(z + 50, r) - muReach(z, r));
    if (Math.abs(d2) > 1e-12) affine = false;
  }
  assert('Reach is affine in z: equal depth steps, equal ruler steps', affine);
  assert('Turn seats infinity finitely: mu(10^12) -> 1/r', close(muTurn(1e12, r) * r, 1, 1e-9));
}

// --- The silent corner and the seats
{
  let silent = true;
  for (let z = 0; z <= ZMAXP; z += 40) {
    const m = mark(z, 0, 0);
    if (!close(m.x, F.x) || !close(m.y, F.y)) silent = false;
  }
  assert('orthographic corner: the mark never leaves the footprint — depth unread', silent);
  assert('corner has no welded rate and no seat', weldedRate(0, 0) === null && camSeat(0, 0) === null);
}
{
  const sD = camSeat(0.004, 0.004), sU = camSeat(0.004, 0), sV = camSeat(0, 0.004);
  assert('seats: principal point on the diagonal; (0, y0) and (x0, 0) on the edges',
    sD.x === 0 && sD.y === 0 && sU.x === 0 && close(sU.y, F.y) && close(sV.x, F.x) && sV.y === 0);
  const q = { ru: 1 / 150, rv: 1 / 250 };
  const far = mark(1e10, q.ru, q.rv), s = camSeat(q.ru, q.rv);
  assert('the dashed trail\'s destination is the seat: M(z) -> seat as z grows',
    close(far.x, s.x, 1e-5) && close(far.y, s.y, 1e-5));
}
{
  // Book rig sanity: slit depths 150 and 250; datum at z = 0 for every rig
  assert('cross-slit preset is the book rig: depths 150 and 250',
    close(1 / PRESETS.cross.ru, 150) && close(1 / PRESETS.cross.rv, 250));
  let datum = true;
  for (let i = 0; i < 20; i++) {
    const q = rig(), m = mark(0, q.ru, q.rv), t = glideTick(0, q.ru, q.rv, 'reach');
    if (!close(m.x, F.x) || !close(m.y, F.y) || !close(t.x, F.x) || !close(t.y, F.y)) datum = false;
  }
  assert('z = 0 is the exempt level: mark = tick = footprint for every rig', datum);
}

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
  // Collinearity survives the display pipeline: probe, mark, slit crossings project collinear
  const q = { ru: 1 / 150, rv: 1 / 250 }, z = 430, v = DEFAULT_VIEW, rf = rayFn(z, q.ru, q.rv);
  const pts = [rf(z), rf(0), rf(-150), rf(-250)].map(p => project(p, v));
  let worst = 0;
  for (let i = 2; i < pts.length; i++) {
    const cross = (pts[1].X - pts[0].X) * (pts[i].Y - pts[0].Y) - (pts[1].Y - pts[0].Y) * (pts[i].X - pts[0].X);
    worst = Math.max(worst, Math.abs(cross));
  }
  assert('projected ray stays straight through mark and both slit crossings (worst cross ' + worst.toExponential(1) + ')', worst < 1e-6);
}
{
  // Scene extremes inside the 720 x 640 viewBox at the default view, across the presets
  const v = DEFAULT_VIEW;
  let inBox = true;
  const staticPts = [
    { x: -140, y: -100, z: 0 }, { x: 140, y: -100, z: 0 }, { x: 140, y: 100, z: 0 }, { x: -140, y: 100, z: 0 },
    { x: 0, y: 0, z: ZMAXP + 60 }, { x: 0, y: 0, z: -(ZSLITDRAW * 1.15 + 100) },
    { x: F.x, y: F.y, z: ZMAXP },
    { x: 0, y: 85, z: -ZSLITDRAW }, { x: 0, y: -85, z: -ZSLITDRAW },
    { x: 85, y: 0, z: -ZSLITDRAW }, { x: -85, y: 0, z: -ZSLITDRAW }
  ];
  for (const p of staticPts) {
    const q = project(p, v);
    if (q.X < 8 || q.X > 712 || q.Y < 8 || q.Y > 632) inBox = false;
  }
  // Reach walk-off extremes for each non-corner preset
  for (const k of ['cross', 'pinhole', 'pushbroom', 'off']) {
    const pr = PRESETS[k], t = glideTick(ZMAXP, pr.ru, pr.rv, 'reach');
    const q = project({ x: t.x, y: t.y, z: 0 }, v);
    if (q.X < 8 || q.X > 712 || q.Y < 8 || q.Y > 632) inBox = false;
  }
  assert('scene extremes and Reach walk-offs project inside the viewBox for every preset', inBox);
}
{
  const v = DEFAULT_VIEW;
  const sCross = sceneSVG({ z: 300, ru: PRESETS.cross.ru, rv: PRESETS.cross.rv, ruler: 'turn', fan: true, view: v });
  const sOff = sceneSVG({ z: 600, ru: PRESETS.off.ru, rv: PRESETS.off.rv, ruler: 'turn', fan: false, view: v });
  const sOrtho = sceneSVG({ z: 300, ru: 0, rv: 0, ruler: 'turn', fan: false, view: v });
  const sPush = sceneSVG({ z: 300, ru: PRESETS.pushbroom.ru, rv: 0, ruler: 'reach', fan: false, view: v });
  assert('sceneSVG carries the mark ring and tick dot', sCross.includes('markRing') && sCross.includes('tickDot'));
  assert('no NaN coordinates in cross-slit, off-seam, orthographic, or pushbroom states',
    !sCross.includes('NaN') && !sOff.includes('NaN') && !sOrtho.includes('NaN') && !sPush.includes('NaN'));
  assert('slit-at-infinity annotation appears when a rate is zero',
    sPush.includes('at infinity') && sOrtho.includes('at infinity') && !sCross.includes('at infinity'));
  const pv = padSVG({ ru: PRESETS.cross.ru, rv: PRESETS.cross.rv });
  assert('the pad draws the three gold seam lines and the rig point', (pv.match(/#b08948/g) || []).length >= 3 && pv.includes('r="7"'));
  const rt = padRates(padXY(0.0063, 0.0021).X, padXY(0.0063, 0.0021).Y);
  assert('pad round-trip: rates -> pixels -> rates', close(rt.ru, 0.0063, 1e-9) && close(rt.rv, 0.0021, 1e-9));
}

console.log(failed === 0 ? '\nALL ' + n + ' CHECKS PASS' : '\n' + failed + ' OF ' + n + ' FAILED');
process.exit(failed === 0 ? 0 : 1);
