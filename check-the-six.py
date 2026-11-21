# Check for the plate "The Six on Three Dots".
# Part 1: the six reversible correspondences on three dots (top, left, right), under "then".
# Part 2: the book's six maps of a value L, under "then", and the match between the two.
# Parts 1 and 2 use exact arithmetic. The addendum on the triangle uses decimal arithmetic with a tolerance of 1e-9.
# Run: python3 check-the-six.py
# Amended 21 November 2026 after the outside audit: this heading corrected; the test "two mirrors are a turn"
# now uses two points, so that a mirror cannot pass it; three checks added (the builds printed in figure 5,
# and the two statements about the values -1, 1/2 and 2).
from itertools import permutations
TOP, LEFT, RIGHT = 0, 1, 2
I  = (0, 1, 2)            # the identity
LR = (0, 2, 1)            # exchange left, right (top sent to itself)
LT = (1, 0, 2)            # exchange left, top   (right sent to itself)
RT = (2, 1, 0)            # exchange right, top  (left sent to itself)
ACW = (1, 2, 0)           # circuit left -> right -> top -> left : top->left, left->right, right->top
CW  = (2, 0, 1)           # circuit left -> top -> right -> left : top->right, left->top, right->left
SIX = {'identity': I, 'exchange left,right': LR, 'exchange left,top': LT, 'exchange right,top': RT,
       'circuit left>right>top': ACW, 'circuit left>top>right': CW}
def then(a, b):           # do a first, b second
    return tuple(b[a[i]] for i in range(3))
ok = total = 0
def check(name, cond):
    global ok, total
    total += 1; ok += bool(cond)
    print(('pass  ' if cond else 'FAIL  ') + name)

vals = list(SIX.values())
check('the six listed are all six rearrangements of three dots', set(vals) == set(permutations(range(3))))
check('closed: each of the 36 "a then b" is one of the six', all(then(a, b) in vals for a in vals for b in vals))
check('each row of the table holds each of the six exactly once', all(len({then(a, b) for b in vals}) == 6 for a in vals))
check('each column of the table holds each of the six exactly once', all(len({then(a, b) for a in vals}) == 6 for b in vals))
check('identity then a = a, and a then identity = a', all(then(I, a) == a == then(a, I) for a in vals))
check('each exchange done twice is the identity', all(then(a, a) == I for a in (LR, LT, RT)))
check('each circuit done twice is the other circuit', then(ACW, ACW) == CW and then(CW, CW) == ACW)
check('each circuit done three times is the identity', all(then(then(a, a), a) == I for a in (ACW, CW)))
check('one circuit then the other is the identity, in either order', then(ACW, CW) == I == then(CW, ACW))
ex = (LR, LT, RT)
check('two different exchanges in turn always give a circuit (6 cases)', all(then(a, b) in (ACW, CW) for a in ex for b in ex if a != b))
check('reversing the order of two different exchanges gives the other circuit', all(then(a, b) != then(b, a) for a in ex for b in ex if a != b))
check('an exchange then a circuit, or a circuit then an exchange, is always an exchange (12 cases)',
      all(then(a, c) in ex and then(c, a) in ex for a in ex for c in (ACW, CW)))
keep = (I, ACW, CW)
check('identity and the two circuits are closed among themselves (9 cases)', all(then(a, b) in keep for a in keep for b in keep))
check('exchange then exchange is never an exchange (9 cases)', all(then(a, b) in keep for a in ex for b in ex))
same = sum(then(a, b) == then(b, a) for a in vals for b in vals)
check('of the 36 ordered pairs, 18 give the same result in either order and 18 do not', same == 18)
check('worked example: exchange right,top then exchange left,right = circuit left>right>top', then(RT, LR) == ACW)
check('worked example reversed: exchange left,right then exchange right,top = circuit left>top>right', then(LR, RT) == CW)
check('"then" needs no brackets: (a then b) then c = a then (b then c), all 216 cases',
      all(then(then(a, b), c) == then(a, then(b, c)) for a in vals for b in vals for c in vals))

# ---- Addendum: odd and even, and the triangle ----
from itertools import product
from functools import reduce
import math
for k in range(7):
    got = {reduce(then, seq, I) for seq in product(ex, repeat=k)}
    want = set(keep) if k % 2 == 0 else set(ex)
    check(f'every way of doing {k} exchanges in turn gives ' + ('the identity or a circuit' if k % 2 == 0 else 'an exchange') + f' ({3 ** k} ways)', got <= want)
def build(*seq): return reduce(then, seq, I)
check('the eight builds printed in figure 5 give what the figure says',
      build(LR, LR) == I and build(RT, LR) == ACW and build(LR, RT, LR, RT) == ACW and build(LR, RT) == CW
      and build(LR, LT, LR, LT) == CW and build(LT, RT, LT) == LR and build(LR, RT, LR) == LT and build(LR, LT, LR) == RT)
C = [(0.0, -1.0), (-math.cos(math.radians(30)), 0.5), (math.cos(math.radians(30)), 0.5)]   # top, left, right; y runs down, as drawn
def refl(p, i):               # mirror in the line through the centre and corner i
    a = 2 * math.atan2(C[i][1], C[i][0])
    return (math.cos(a) * p[0] + math.sin(a) * p[1], math.sin(a) * p[0] - math.cos(a) * p[1])
def near(p, q): return abs(p[0] - q[0]) < 1e-9 and abs(p[1] - q[1]) < 1e-9
MIR = {TOP: LR, LEFT: RT, RIGHT: LT}
check('each mirror line of the triangle moves the corners exactly as its exchange moves the dots (3 mirrors)',
      all(near(refl(C[j], i), C[MIR[i][j]]) for i in range(3) for j in range(3)))
def turn(p, deg):
    t = math.radians(deg); return (p[0] * math.cos(t) - p[1] * math.sin(t), p[0] * math.sin(t) + p[1] * math.cos(t))
pt, pt2 = (0.3, -0.2), (-0.1, 0.45)      # two points in different directions: a turn is settled by where both go
check('two different mirrors in turn are a turn through 120 degrees, one way or the other (6 cases, two points each)',
      all(any(near(refl(refl(pt, i), j), turn(pt, d)) and near(refl(refl(pt2, i), j), turn(pt2, d)) for d in (120, -120))
          for i in range(3) for j in range(3) if i != j))
check('the turn made by two mirrors moves the corners as "exchange then exchange" moves the dots (6 cases)',
      all(near(refl(refl(C[c], i), j), C[then(MIR[i], MIR[j])[c]]) for i in range(3) for j in range(3) if i != j for c in range(3)))
check('the angle between two mirror lines is 60 degrees', abs(abs(math.degrees(math.atan2(C[0][1], C[0][0]) - math.atan2(C[1][1], C[1][0]))) % 180 - 60) < 1e-9 or abs(abs(math.degrees(math.atan2(C[0][1], C[0][0]) - math.atan2(C[1][1], C[1][0]))) % 180 - 120) < 1e-9)

# ---- Part 2: the book's six maps, each written (a*L + b) / (c*L + d) ----
from fractions import Fraction as F
from math import gcd
INF = 'inf'
def norm(m):
    a, b, c, d = m
    g = gcd(gcd(abs(a), abs(b)), gcd(abs(c), abs(d)))
    m = tuple(x // g for x in m)
    first = next(x for x in m if x != 0)
    return tuple(-x for x in m) if first < 0 else m
def mthen(m, n):          # do map m first, map n second: n(m(L))
    a, b, c, d = m; p, q, r, s = n
    return norm((p * a + q * c, p * b + q * d, r * a + s * c, r * b + s * d))
def ap(m, x):
    a, b, c, d = m
    if x == INF:
        return INF if c == 0 else F(a, c)
    den = c * x + d
    return INF if den == 0 else (a * x + b) / den
MAPS = {'L': (1, 0, 0, 1), '1-L': (-1, 1, 0, 1), '1/L': (0, 1, 1, 0), 'L/(L-1)': (1, 0, 1, -1),
        '1/(1-L)': (0, 1, -1, 1), '(L-1)/L': (1, -1, 1, 0)}
MAPS = {k: norm(v) for k, v in MAPS.items()}
DOTVAL = {TOP: INF, LEFT: F(0), RIGHT: F(1)}     # top is infinity, left is 0, right is 1
VALDOT = {v: k for k, v in DOTVAL.items()}
def as_dots(m):
    return tuple(VALDOT[ap(m, DOTVAL[i])] for i in range(3))
mv = list(MAPS.values())
check('each of the six maps sends the set {0, 1, inf} onto itself', all(set(ap(m, x) for x in DOTVAL.values()) == set(DOTVAL.values()) for m in mv))
check('the six maps give six different rearrangements of 0, 1, inf', len({as_dots(m) for m in mv}) == 6)
check('closed: each of the 36 "map then map" is one of the six maps', all(mthen(m, n) in mv for m in mv for n in mv))
check('the match respects "then", all 36 cases: dots of (m then n) = (dots of m) then (dots of n)',
      all(as_dots(mthen(m, n)) == then(as_dots(m), as_dots(n)) for m in mv for n in mv))
check('1-L (Complement) is exchange left,right', as_dots(MAPS['1-L']) == LR)
check('1/L (Reciprocal) is exchange left,top', as_dots(MAPS['1/L']) == LT)
check('L/(L-1) (Third) is exchange right,top', as_dots(MAPS['L/(L-1)']) == RT)
check('1/(1-L) is the circuit left>right>top, that is 0 > 1 > inf > 0', as_dots(MAPS['1/(1-L)']) == ACW)
check('(L-1)/L is the circuit left>top>right, that is 0 > inf > 1 > 0', as_dots(MAPS['(L-1)/L']) == CW)
check('Complement then Reciprocal = 1/(1-L)', mthen(MAPS['1-L'], MAPS['1/L']) == MAPS['1/(1-L)'])
check('Reciprocal then Complement = (L-1)/L, the other circuit', mthen(MAPS['1/L'], MAPS['1-L']) == MAPS['(L-1)/L'])
check('Third then Complement = 1/(1-L)', mthen(MAPS['L/(L-1)'], MAPS['1-L']) == MAPS['1/(1-L)'])
check('Complement and Reciprocal, done in turn in every way, produce all six maps',
      (lambda gen: len(gen) == 6)((lambda: (lambda s: [s.update({mthen(x, g) for x in list(s) for g in (MAPS['1-L'], MAPS['1/L'])}) for _ in range(6)] and s)({MAPS['L']}))()))
# "Toward the book", a second set of three dots: the values -1, 1/2 and 2
HARM = {LEFT: F(2), RIGHT: F(-1), TOP: F(1, 2)}          # the naming under which the rows of figure 4 stay as they are
HVAL = {v: k for k, v in HARM.items()}
def as_dots_h(m): return tuple(HVAL[ap(m, HARM[i])] for i in range(3))
check('the six maps rearrange -1, 1/2 and 2 in all six ways', all(set(ap(m, x) for x in HARM.values()) == set(HARM.values()) for m in mv) and len({as_dots_h(m) for m in mv}) == 6)
check('named left 2, right -1, top 1/2, each map gives the same dot diagram as it does on 0, 1, inf', all(as_dots_h(m) == as_dots(m) for m in mv))
# spot check that composing the formulas really is composing the maps, at a value that is none of 0, 1, inf
x = F(7, 3)
check('formula check at L = 7/3: (m then n)(L) = n(m(L)), all 36', all(ap(mthen(m, n), x) == ap(n, ap(m, x)) for m in mv for n in mv))
print(f'{ok}/{total}')
