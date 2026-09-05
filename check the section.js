// check_the_section.js — pre-build checks for the-section.html
// Replicates the page's embedded math exactly. Node, no deps.
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; } else { fail++; console.log("FAIL " + name); } }
const L = 120;
function rig(Su, Sv) { return { ru: L / Su, rv: L / Sv }; }
function marks(x, r, lam) { return { Xg: x * (1 + r * lam), Xc: x / (1 + r * lam) }; }

// 1. Mirror identity Xg*Xc = x^2 across random rigs and depths
let worst = 0;
for (let i = 0; i < 500; i++) {
  const Su = 44 + Math.random() * 400, lam = Math.random() * 4, x = 5 + Math.random() * 200;
  const { Xg, Xc } = marks(x, L / Su, lam);
  worst = Math.max(worst, Math.abs(Xg * Xc - x * x) / (x * x));
}
ok("mirror Xg*Xc=x^2 (500 rigs, rel err " + worst.toExponential(1) + ")", worst < 1e-12);

// 2. Plane datum: lambda=0 gives Xg=Xc=x for any rate
for (const Su of [44, 100, 300]) {
  const { Xg, Xc } = marks(77, L / Su, 0);
  ok("datum at plane, Su=" + Su, Xg === 77 && Xc === 77);
}

// 3. Seam membership survives a plane slide; address does not
{
  const d = 60;
  const eq0 = rig(150, 150), eq1 = rig(150 + d, 150 + d);
  ok("equal depths stay equal under slide", eq0.ru === eq0.rv && eq1.ru === eq1.rv);
  const sp0 = rig(150, 250), sp1 = rig(150 + d, 250 + d);
  ok("split stays split under slide", sp1.ru !== sp1.rv && Math.sign(sp1.rv - sp1.ru) === Math.sign(sp0.rv - sp0.ru));
  ok("address moves under slide", sp1.ru !== sp0.ru);
}

// 4. Orthographic limit: slits receding => both marks -> x, monotonically
{
  const x = 90, lam = 2.5;
  let prevGap = Infinity, mono = true, rateOk = true;
  for (const Su of [100, 200, 400, 800, 1600, 3200, 1e6]) {
    const { Xg, Xc } = marks(x, L / Su, lam);
    const gap = Xg - Xc;
    if (!(gap > 0 && gap < prevGap && Xc < x && x < Xg)) mono = false;
    if ((L / Su) * lam < 0.5 && Math.abs(gap - 2 * x * lam * L / Su) / gap > 0.35) rateOk = false;
    prevGap = gap;
  }
  ok("ortho limit: Xc<x<Xg, gap ~ 2x*lam*L/Su -> 0", mono && rateOk && prevGap < 0.1);
}

// 5. Seam cubic: Delta=0 iff ru=rv or a rate is 0 (sampled)
{
  const D = (ru, rv) => ru * rv * (rv - ru);
  ok("Delta=0 on diagonal", D(0.7, 0.7) === 0);
  ok("Delta=0 on edges", D(0, 0.6) === 0 && D(0.6, 0) === 0);
  ok("Delta!=0 split", D(1.0, 0.5) === -0.25);
}

// 6. Lambda ruler: tick at z = zP + k*L reads lambda = k after any plane slide
{
  const zP0 = 400, zP1 = 470;
  const lamOf = (z, zP) => (z - zP) / L;
  ok("lambda ruler re-graduates with plane", lamOf(zP0 + 2 * L, zP0) === 2 && lamOf(zP1 + 2 * L, zP1) === 2);
}

console.log(pass + "/" + (pass + fail) + " checks passed" + (fail ? " — " + fail + " FAILED" : ""));
process.exit(fail ? 1 : 0);
