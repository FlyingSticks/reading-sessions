# Check: the book's six anharmonic maps permute the three values 0, 1, infinity
# in all six ways, and likewise the three harmonic values -1, 1/2, 2.
# Exact arithmetic (fractions). Run: python3 check-six-on-three-values.py
from fractions import Fraction as F
INF = 'inf'
def ap(f, x):
    a, b, c, d = f                      # the map (a*x + b) / (c*x + d)
    if x == INF:
        return INF if c == 0 else F(a, c)
    den = c * x + d
    return INF if den == 0 else (a * x + b) / den
MAPS = {'identity': (1, 0, 0, 1), '1/L (Reciprocal)': (0, 1, 1, 0),
        '1-L (Complement)': (-1, 1, 0, 1), 'L/(L-1) (Third)': (1, 0, 1, -1),
        '1/(1-L)': (0, 1, -1, 1), '(L-1)/L': (1, -1, 1, 0)}
ok = 0; total = 0
def check(name, cond):
    global ok, total
    total += 1; ok += bool(cond)
    print(('pass  ' if cond else 'FAIL  ') + name)
for label, vals in (('0, 1, inf', (F(0), F(1), INF)), ('-1, 1/2, 2', (F(-1), F(1, 2), F(2)))):
    seen = set()
    for n, f in MAPS.items():
        img = tuple(ap(f, x) for x in vals)
        check(f'{n} sends the set {{{label}}} onto itself', set(img) == set(vals))
        seen.add(img)
    check(f'the six maps give six different arrangements of {label}', len(seen) == 6)
inv = ['1/L (Reciprocal)', '1-L (Complement)', 'L/(L-1) (Third)']
for n in inv:
    f = MAPS[n]
    for vals in ((F(0), F(1), INF), (F(-1), F(1, 2), F(2))):
        check(f'{n} keeps exactly one of {[str(v) for v in vals]}', sum(ap(f, x) == x for x in vals) == 1)
for n in ['1/(1-L)', '(L-1)/L']:
    f = MAPS[n]
    check(f'{n} keeps none of 0, 1, inf', sum(ap(f, x) == x for x in (F(0), F(1), INF)) == 0)
print(f'{ok}/{total}')
