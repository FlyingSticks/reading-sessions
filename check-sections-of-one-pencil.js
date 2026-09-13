// check-sections-of-one-pencil.js — no dependencies.
// The equal-measure fact Kevin drew, audited and made exact. In the tangent
// configuration — a BLUE whole circle of diameter D through the station C, and
// a RED semicircular arc of radius R about C, sharing their far point from C —
// the single condition R = D delivers two parities at once:
//   LENGTH  the red arc (πR) equals the blue circumference (πD);
//   AREA    the RESIDUAL red (the half-disk minus the blue circle it contains,
//           adjacent, no overlap in the flat) equals the blue circle's area,
//           because the half-disk is exactly twice the blue circle.
// This is the invariant-currency lesson of the Russell musing made exact: same
// rim, the interior re-authored by the closure rule. The plate reads the picture
// surface as one section of the spectator pencil through C; R = D is the section
// through C's own far point.
//
// Extracts the CORE block from sections-of-one-pencil.html.

const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "sections-of-one-pencil.html"), "utf8");
const Core = new Function(html.match(/\/\*CORE-BEGIN\*\/([\s\S]*?)\/\*CORE-END\*\//)[1] + "; return Core;")();

let n = 0, failed = 0;
const assert = (name, cond, detail) => {
  n++; if (!cond) failed++;
  console.log(`${String(n).padStart(2)}  ${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "   [" + detail + "]"}`);
};
const near = (x, y, t = 1e-12) => Math.abs(x - y) <= t * Math.max(1, Math.abs(x), Math.abs(y));

// the measures, from the CORE
const M = Core.measures;

// ---- at R = D, both parities hold ----
for (const R of [1, 2.5, 7, 0.3]) {
  const D = R;
  const m = M(R, D);
  assert(`R=D=${R}: red arc length = blue circumference (πR = πD)`,
    near(m.redArc, m.blueCirc));
  assert(`R=D=${R}: half-disk is exactly twice the blue circle`,
    near(m.halfDisk, 2 * m.blueDisk));
  assert(`R=D=${R}: residual red (half-disk − blue) equals the blue circle`,
    near(m.residualRed, m.blueDisk));
}

// ---- away from R = D, both parities break in the known directions ----
{
  const m = M(2, 1); // R = 2D
  assert("R = 2D: rims no longer match (red arc > blue circumference)", m.redArc > m.blueCirc);
  assert("R = 2D: residual red ≠ blue circle", !near(m.residualRed, m.blueDisk, 1e-6));
}

// ---- area parity needs R = D, not the D = R√2 that pure disk-area equality would want ----
assert("the residual reading gives R = D (not D = R√2): parity of residual-vs-blue is a different equation",
  (() => {
    // residualRed(R,D) = blueDisk(D)  ⇔  πR²/2 − πD²/4 = πD²/4  ⇔  R² = D²  ⇔  R = D
    const R = 3, D = 3;
    const m = M(R, D);
    return near(m.residualRed, m.blueDisk) &&
      // and the naive half-disk = blue-disk equality would instead need D = R√2:
      near(M(R, R * Math.SQRT2).halfDisk, M(R, R * Math.SQRT2).blueDisk);
  })());

// ---- the tangency origin: R = D is the section through C's far point ----
assert("R = D is the tangent configuration — blue circle through C and red arc about C share their far point",
  (() => {
    // far point of the blue circle (diameter D, through C) from C is at distance D;
    // the red arc about C reaches distance R; they coincide iff R = D.
    return near(Core.farBlue(5), 5) && near(Core.farRed(5), 5);
  })());

// ---- the pencil-section reading: one condition, both currencies conserved-or-doubled ----
assert("one condition R = D yields length parity AND area parity together",
  (() => {
    const m = M(4, 4);
    return near(m.redArc, m.blueCirc) && near(m.residualRed, m.blueDisk);
  })());

// ---- the doubling is exact and scale-free (the currency lesson) ----
assert("the half-disk : blue-disk ratio is exactly 2 at R = D, for every size",
  [0.5, 1, 3.3, 100].every(R => near(M(R, R).halfDisk / M(R, R).blueDisk, 2)));

console.log(`\n${n} assertions, ${failed} failed.`);
process.exit(failed ? 1 : 0);
