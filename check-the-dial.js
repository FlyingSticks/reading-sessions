// check-the-dial.js — smoke check for the-dial.html
// One dial, two laws: exchange identity P(d) = 2(1+d)/(2+d) in [1,2)
// and hyperbolicity excess eps(d) = tr^2/det - 4 = 1/(d(1+d)) > 0.
// Run: node check-the-dial.js

let pass = 0, fail = 0;
function assert(name, cond) {
  if (cond) { pass++; console.log("  ok  " + name); }
  else { fail++; console.log("FAIL  " + name); }
}
function close(a, b, tol) { return Math.abs(a - b) <= (tol || 1e-12); }

// Canonical calibration: u = 1, D = d, L = 1 + d, y(x) = L x / (x + d)
function y(d, x) { return (1 + d) * x / (x + d); }
function P(d) { return 2 * (1 + d) / (2 + d); }        // exchange product
function eps(d) { return 1 / (d * (1 + d)); }          // hyperbolicity excess

const sweep = [0.02, 0.1, 0.5, 1, 2, 5, 17, 50];

// --- Exchange identity -------------------------------------------------
assert("1. normalization: Dy0 = y(u) - y(0) = 1 for all sampled d",
  sweep.every(d => close(y(d, 1) - y(d, 0), 1)));

assert("2. second difference from marks equals -2/(2+d)",
  sweep.every(d => {
    const D2 = (y(d, 2) - y(d, 1)) - (y(d, 1) - y(d, 0));
    return close(D2, -2 / (2 + d));
  }));

assert("3. |D2y| * L computed from marks equals 2(1+d)/(2+d)",
  sweep.every(d => {
    const D2 = Math.abs((y(d, 2) - y(d, 1)) - (y(d, 1) - y(d, 0)));
    return close(D2 * (1 + d), P(d));
  }));

assert("4. dimensionless form is unit-free: |D2y|*L/(Dy0)^2 with L=7.3, u=3, d=0.7",
  (() => {
    const L = 7.3, u = 3, d = 0.7, D = d * u;
    const g = x => L * x / (x + D);
    const dy0 = g(u) - g(0);
    const D2 = Math.abs((g(2 * u) - g(u)) - dy0);
    return close(D2 * L / (dy0 * dy0), P(d), 1e-10);
  })());

assert("5. P(d) confined to [1, 2) across sweep",
  sweep.every(d => P(d) >= 1 && P(d) < 2));

assert("6. floor attained: P(0) = 1 exactly",
  P(0) === 1);

assert("7. P strictly increasing in d",
  sweep.slice(1).every((d, i) => P(d) > P(sweep[i])));

assert("8. ceiling approached, never reached: P(1e9) within 1e-8 of 2, still < 2",
  close(P(1e9), 2, 1e-8) && P(1e9) < 2);

// --- The excess and its invariance ------------------------------------
assert("9. tr^2/det - 4 = 1/(d(1+d)) for the matrix [[1+d,0],[1,d]]",
  sweep.every(d => {
    const tr = (1 + d) + d, det = (1 + d) * d;
    return close(tr * tr / det - 4, eps(d), 1e-10);
  }));

assert("10. general units: (L-D)^2/(LD) = 1/(d(1+d)) with L=(1+d)u, D=du, u=3",
  sweep.every(d => {
    const u = 3, L = (1 + d) * u, D = d * u;
    return close((L - D) * (L - D) / (L * D), eps(d), 1e-10);
  }));

assert("11. scalar invariance: rescaling the matrix by k=4.7 leaves tr^2/det unchanged",
  sweep.every(d => {
    const k = 4.7, tr = k * (1 + 2 * d), det = k * k * (1 + d) * d;
    return close(tr * tr / det - 4, eps(d), 1e-9);
  }));

assert("12. bare discriminant is NOT invariant: tr^2-4det scales by k^2 (k=4.7)",
  (() => {
    const d = 1, k = 4.7;
    const bare = (1 + 2 * d) ** 2 - 4 * (1 + d) * d;                 // = 1
    const scaled = (k * (1 + 2 * d)) ** 2 - 4 * k * k * (1 + d) * d; // = k^2
    return close(scaled, k * k * bare, 1e-9) && !close(scaled, bare);
  })());

assert("13. hyperbolic throughout: eps(d) > 0 for all sampled d",
  sweep.every(d => eps(d) > 0));

assert("14. eps strictly decreasing in d",
  sweep.slice(1).every((d, i) => eps(d) < eps(sweep[i])));

assert("15. maximal compression is maximally hyperbolic: eps(1e-9) > 1e8",
  eps(1e-9) > 1e8);

assert("16. affine recovery drains the excess: eps(1e9) < 1e-17, still > 0",
  eps(1e9) < 1e-17 && eps(1e9) > 0);

// --- The link between the two meters -----------------------------------
assert("17. closed link: eps = (2-P)^2 / (2 P (P-1)) at every sampled d",
  sweep.every(d => {
    const p = P(d);
    return close(eps(d), (2 - p) * (2 - p) / (2 * p * (p - 1)), 1e-9);
  }));

assert("18. link limits agree: P -> 1 forces eps -> infinity, P -> 2 forces eps -> 0",
  (() => {
    const f = p => (2 - p) ** 2 / (2 * p * (p - 1));
    return f(1 + 1e-9) > 1e8 && f(2 - 1e-9) < 1e-8;
  })());

// --- Fixed points and multipliers (canonical calibration) --------------
assert("19. fixed points of y(x)=x are exactly {0, u=1}",
  sweep.every(d => {
    // x^2 - (L - d) x = 0 with L = 1+d  =>  roots 0 and 1
    const r = (1 + d) - d;
    return close(y(d, 0), 0) && close(y(d, r), r) && close(r, 1);
  }));

assert("20. multipliers: f'(0) = (1+d)/d and f'(u) = d/(1+d)",
  sweep.every(d => {
    const fp = x => (1 + d) * d / ((x + d) * (x + d));
    return close(fp(0), (1 + d) / d, 1e-10) && close(fp(1), d / (1 + d), 1e-10);
  }));

assert("21. reciprocal pair: f'(0) * f'(u) = 1; repelling at 0, attracting at u",
  sweep.every(d => {
    const m0 = (1 + d) / d, mu = d / (1 + d);
    return close(m0 * mu, 1) && m0 > 1 && mu < 1;
  }));

assert("22. flow check: iterating from x=5 converges to the fixed mark u=1 (d=1)",
  (() => {
    let x = 5;
    for (let i = 0; i < 80; i++) x = y(1, x);
    return close(x, 1, 1e-9);
  })());

assert("23. flow check: a point near 0 is pushed away (f(0.001) > 0.001, d=1)",
  y(1, 0.001) > 0.001);

// --- Exemplars on the trichotomy strip ---------------------------------
assert("24. parabolic exemplar (Reach step [[1,1],[0,1]]): excess = 0 exactly",
  (() => { const tr = 2, det = 1; return tr * tr / det - 4 === 0; })());

assert("25. elliptic exemplar (quarter-turn K=[[0,D],[-1/D,0]]): excess = -4",
  (() => { const D = 3, tr = 0, det = 0 - D * (-1 / D); return close(tr * tr / det - 4, -4); })());

assert("26. display map v -> v/(1+v) is monotone and lands in (0,1) on the sweep",
  (() => {
    const m = sweep.map(d => eps(d) / (1 + eps(d)));
    return m.every(v => v > 0 && v < 1) && m.slice(1).every((v, i) => v < m[i]);
  })());

console.log("\n" + pass + "/" + (pass + fail) + " assertions passed" + (fail ? " — " + fail + " FAILED" : ""));
process.exit(fail ? 1 : 0);
