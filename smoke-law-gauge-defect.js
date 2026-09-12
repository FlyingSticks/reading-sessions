// smoke-law-gauge-defect.js — checks for law-gauge-defect-v1.html
'use strict';

var EPS = 1e-9;
function measure(L, n) {
  var x = n * L;
  var m = Math.floor(x);
  if (Math.abs(x - Math.round(x)) < EPS) { m = Math.round(x); }
  var gd = x - m;
  if (gd < EPS) { gd = 0; }
  return { m: m, gd: gd, ad: gd / n };
}

var pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; } else { fail++; console.log('FAIL: ' + name); }
}

var R2 = Math.SQRT2, F = 7 / 5, n, r;

// 1–4: the four panels of the original sketch
check('n=1 count 1',  measure(R2, 1).m === 1);
check('n=2 count 2',  measure(R2, 2).m === 2);
check('n=4 count 5',  measure(R2, 4).m === 5);
check('n=8 count 11', measure(R2, 8).m === 11);

// 5: n=12 gives 16 (his twelfth mark beyond)
check('n=12 count 16', measure(R2, 12).m === 16);

// 6: absolute defect at n=8 is √2 − 11/8
check('abs defect n=8', Math.abs(measure(R2, 8).ad - (R2 - 11 / 8)) < EPS);

// 7–11: invariants for √2 across all gauges
var ok7 = true, ok8 = true, ok9 = true, ok10 = true, ok11 = true;
for (n = 1; n <= 48; n++) {
  r = measure(R2, n);
  if (!(r.m / n <= R2 && R2 < (r.m + 1) / n)) { ok7 = false; }
  if (!(r.ad >= 0 && r.ad < 1 / n)) { ok8 = false; }
  if (!(r.gd >= 0 && r.gd < 1)) { ok9 = false; }
  if (Math.abs(r.gd - n * r.ad) > 1e-9) { ok10 = false; }
  if (r.gd === 0) { ok11 = false; }              // √2 never posts a zero
}
check('bracket holds (root2)', ok7);
check('abs defect in [0,1/n)', ok8);
check('gauge defect in [0,1)', ok9);
check('currencies agree: gd = n*ad', ok10);
check('root2 never zero, n<=48', ok11);

// 12: gauge defect wanders — spread over (0,1) is wide
var lo = 1, hi = 0;
for (n = 1; n <= 48; n++) {
  r = measure(R2, n);
  if (r.gd < lo) { lo = r.gd; }
  if (r.gd > hi) { hi = r.gd; }
}
check('root2 gauge defect spreads', lo < 0.06 && hi > 0.94);

// 13: gauge defect does NOT trend to zero (late values still large)
var lateMax = 0;
for (n = 40; n <= 48; n++) { r = measure(R2, n); if (r.gd > lateMax) { lateMax = r.gd; } }
check('no late-n collapse', lateMax > 0.5);

// 14–16: rational law 7/5 clears exactly at multiples of 5
var ok14 = true, ok15 = true;
for (n = 1; n <= 48; n++) {
  r = measure(F, n);
  if (n % 5 === 0 && r.gd !== 0) { ok14 = false; }
  if (n % 5 !== 0 && r.gd === 0) { ok15 = false; }
}
check('7/5 zero at multiples of 5', ok14);
check('7/5 nonzero elsewhere', ok15);
check('7/5 n=5 count 7', measure(F, 5).m === 7);

// 17–18: bracket + currencies for 7/5 too
var ok17 = true, ok18 = true;
for (n = 1; n <= 48; n++) {
  r = measure(F, n);
  if (!(r.m / n <= F + EPS && F < (r.m + 1) / n)) { ok17 = false; }
  if (Math.abs(r.gd - n * r.ad) > 1e-9) { ok18 = false; }
}
check('bracket holds (7/5)', ok17);
check('currencies agree (7/5)', ok18);

// 19: float guard — 1.4*5, 1.4*10, 1.4*15 land on the integer, not below it
check('float guard on 7/5', measure(F, 10).m === 14 && measure(F, 15).m === 21);

// 20: sketch lower bounds reproduce 1, 1, 1.25, 1.375
check('sketch fractions', [1, 2, 4, 8].map(function (k) {
  return measure(R2, k).m / k;
}).join(',') === '1,1,1.25,1.375');

console.log(pass + '/' + (pass + fail) + ' checks passed' + (fail ? ' — FAILURES ABOVE' : ''));
process.exit(fail ? 1 : 0);
