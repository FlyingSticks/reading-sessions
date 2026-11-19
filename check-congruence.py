#!/usr/bin/env python3
"""check-congruence.py  (revised 19 November 2026 after an outside audit)

Numerical checks for the plate "Pinhole, Double Slit and the Number Four".
The first version reported 9/9, but the audit found that two of its assertions
tested almost nothing and several were weaker than their labels. Every assertion
below states exactly what is computed. A numerical check is evidence on the
sampled cases; it is not a proof.
"""
import numpy as np

rng = np.random.default_rng(11)
ALPHA, BETA = np.radians(35), np.radians(40)
AC2 = -1 + 2 * np.tan(BETA)
UP2 = -1 + 2 * np.tan(ALPHA) / np.cos(BETA)

# the plate's slits: a on card 1 (z = 0) parallel to ACROSS at up = -1,
#                    b on card 2 (z = 2) parallel to UP at across = AC2
A0, AD = np.array([0.0, -1.0, 0.0]), np.array([1.0, 0.0, 0.0])
B0, BD = np.array([AC2, 0.0, 2.0]), np.array([0.0, 1.0, 0.0])

ok = tot = 0


def chk(label, cond):
    global ok, tot
    tot += 1
    ok += bool(cond)
    print(("PASS  " if cond else "FAIL  ") + label)


def transversal(P, a0, ad, b0, bd):
    """Points A on slit a and B on slit b collinear with P."""
    n = np.cross(ad, a0 - P)                      # normal of the plane through P and slit a
    B = b0 + (np.dot(n, P - b0) / np.dot(n, bd)) * bd
    m = np.cross(bd, b0 - P)                      # normal of the plane through P and slit b
    A = a0 + (np.dot(m, P - a0) / np.dot(m, ad)) * ad
    return A, B


def conj(P, A, B):
    """Harmonic partner of P with respect to A and B, on the line A B."""
    d = B - A
    k = np.dot(P - A, d) / np.dot(d, d)
    return A + (k / (2 * k - 1)) * d


def sigma(P, a0=A0, ad=AD, b0=B0, bd=BD):
    A, B = transversal(P, a0, ad, b0, bd)
    return conj(P, A, B)


def collinear(pts, tol=1e-7):
    pts = np.array(pts)
    return np.linalg.matrix_rank(pts[1:] - pts[0], tol=tol) <= 1


def on_line(P, L0, Ld, tol=1e-7):
    return np.linalg.norm(np.cross(P - L0, Ld)) / np.linalg.norm(Ld) < tol


def dist_point_line(P, L0, Ld):
    return np.linalg.norm(np.cross(P - L0, Ld)) / np.linalg.norm(Ld)


def general_points(n):
    """Random points kept clear of card 1 (z = 0), card 2 (z = 2) and the plane midway (z = 1)."""
    out = []
    while len(out) < n:
        P = rng.normal(size=3) * 2
        if min(abs(P[2]), abs(P[2] - 2), abs(P[2] - 1)) > 0.15:
            out.append(P)
    return out


PTS = general_points(300)

# ---- the two-card numbers of panel 1 ----
chk("panel 1: (across2, up2) rounds to (0.68, 0.83)", (round(AC2, 2), round(UP2, 2)) == (0.68, 0.83))

# ---- one ray through a general point ----
good = True
for P in PTS:
    A, B = transversal(P, A0, AD, B0, BD)
    good &= abs(A[2]) < 1e-9 and abs(A[1] + 1) < 1e-9          # A is on slit a
    good &= abs(B[2] - 2) < 1e-9 and abs(B[0] - AC2) < 1e-9    # B is on slit b
    good &= collinear([P, A, B])
chk("existence: for 300 points off the cards, A on slit a, B on slit b and P are collinear", good)
# any line through P meeting both slits lies in plane(P, a) and in plane(P, b);
# if those two planes are different, their meet is one line, so the ray is unique
good = all(np.linalg.norm(np.cross(np.cross(AD, A0 - P), np.cross(BD, B0 - P))) > 1e-9 for P in PTS)
chk("uniqueness: at each of those points plane(P, a) and plane(P, b) are different planes", good)
# a point of card 1 off slit a: the only candidate line (through P, in plane(P, b), meeting slit a)
# lies in card 1 and runs parallel to slit b, so in ordinary space it never meets slit b
P1 = np.array([0.3, 0.4, 0.0])
m = np.cross(BD, B0 - P1)
Astar = A0 + (np.dot(m, P1 - A0) / np.dot(m, AD)) * AD
chk("a point of card 1 off slit a lies on no ray: the one candidate line is parallel to slit b",
    np.linalg.norm(np.cross(Astar - P1, BD)) < 1e-12 and np.linalg.norm(Astar - P1) > 1e-6)

# ---- the pairing ----
chk("the pairing undoes itself at 300 points", all(np.linalg.norm(sigma(sigma(P)) - P) < 1e-7 for P in PTS))
chk("the pairing is not the do-nothing map (it moves all 300 points)", all(np.linalg.norm(sigma(P) - P) > 1e-6 for P in PTS))

good = True
for _ in range(200):
    L0, Ld = rng.normal(size=3), rng.normal(size=3)
    img = [sigma(L0 + u * Ld) for u in (-1.3, -0.4, 0.5, 1.7)]
    spread = max(np.linalg.norm(img[i] - img[0]) for i in range(1, 4))
    good &= collinear(img, tol=1e-6 * max(1.0, spread)) and spread > 1e-6
chk("lines go to lines: on 200 random lines, four image points are distinct and collinear", good)

good = True
for _ in range(100):
    s, t = rng.uniform(-3, 3, size=2)
    A, B = np.array([s, -1.0, 0.0]), np.array([AC2, t, 2.0])
    for u in (-0.8, 0.2, 0.7, 1.6):
        good &= on_line(sigma(A + u * (B - A)), A, B - A, tol=1e-6)
chk("100 random rays: four points of each are carried to points of the same ray", good)

good = True
for _ in range(200):
    L0, Ld = rng.normal(size=3), rng.normal(size=3)
    # confirm it is not a ray: it must miss at least one slit
    def gap(c0, cd):
        n = np.cross(Ld, cd)
        return abs(np.dot(c0 - L0, n)) / np.linalg.norm(n)
    assert max(gap(A0, AD), gap(B0, BD)) > 1e-3
    img = [sigma(L0 + u * Ld) for u in (-0.9, 0.6)]
    good &= max(dist_point_line(q, L0, Ld) for q in img) > 1e-4
chk("200 random lines that are not rays are each carried off themselves", good)

good = True
for _ in range(100):
    s = rng.uniform(-3, 3)
    A = np.array([s, -1.0, 0.0])
    Ld = rng.normal(size=3)                       # a line through slit a, missing slit b
    img = [sigma(A + u * Ld) for u in (0.7, 1.9)]
    good &= max(dist_point_line(q, A, Ld) for q in img) > 1e-4
chk("100 lines meeting slit a only are each carried off themselves", good)

# ---- one ray in a general plane ----
good = True
for _ in range(100):
    n, c = rng.normal(size=3), rng.normal()
    assert abs(n @ AD) > 1e-3 and abs(n @ BD) > 1e-3          # plane parallel to neither slit
    Ap = A0 + ((c - n @ A0) / (n @ AD)) * AD                  # the one point where the plane meets slit a
    Bp = B0 + ((c - n @ B0) / (n @ BD)) * BD                  # the one point where it meets slit b
    good &= abs(n @ Ap - c) < 1e-9 and abs(n @ Bp - c) < 1e-9  # so their join lies in the plane
    good &= np.linalg.norm(Ap - Bp) > 1e-6
    # a ray lying in the plane must pass through Ap and Bp, so it is that join; any other ray leaves the plane
    s, t = Ap[0] + 0.5, Bp[1] - 0.3
    A2, B2 = np.array([s, -1.0, 0.0]), np.array([AC2, t, 2.0])
    good &= max(abs(n @ A2 - c), abs(n @ B2 - c)) > 1e-6
chk("100 random planes: each meets each slit once, the join lies in the plane, another ray does not", good)

# ---- crossed slits on one card ----
C = np.array([AC2, UP2, 2.0])
SA0, SAD = C.copy(), np.array([1.0, 0.0, 0.0])               # slit parallel to ACROSS through C
SB0, SBD = C.copy(), np.array([0.0, 1.0, 0.0])               # slit parallel to UP through C
good = True
for _ in range(200):
    u, v = rng.uniform(-3, 3, size=2)
    if min(abs(u), abs(v)) < 1e-3:
        continue
    X, Y = SA0 + u * SAD, SB0 + v * SBD                       # a line meeting both slits away from C
    good &= abs((X + 0.37 * (Y - X))[2] - 2) < 1e-12           # lies in the card
chk("crossed slits: a line meeting both away from C lies in the card", good)
Lpar0, Lpard = np.array([0.0, 0.0, 2.0]), np.array([1.0, 0.0, 0.0])   # in the card, parallel to the ACROSS slit
chk("crossed slits: a line in the card parallel to one slit does not meet that slit (the exception)",
    abs(np.cross(Lpard, SAD)).max() < 1e-12 and dist_point_line(Lpar0, SA0, SAD) > 0.5)

# ---- panel 6 numbers ----
pp = lambda B: B / (2 - B)
chk("panel 6: with A = 0, P = 1 the partner is -3, -2, -1.25 for B = 3, 4, 10",
    np.allclose([pp(3), pp(4), pp(10)], [-3, -2, -1.25]))

# ---- slit b at infinity, at a right angle to slit a: the limit is the half-turn ----
YA0, YAD = np.zeros(3), np.array([0.0, 1.0, 0.0])            # slit a: the UP line through the origin
R = np.diag([-1.0, 1.0, -1.0])                               # half-turn about that line
Q = [rng.uniform(-1.5, 1.5, size=3) + np.array([0, 0, 0.3]) for _ in range(60)]
errs = []
for d in (1e2, 1e4, 1e6):
    b0, bd = np.array([0.0, 0.0, d]), np.array([1.0, 0.0, 0.0])   # level slit b at height 0, depth d
    errs.append(max(np.linalg.norm(sigma(P, YA0, YAD, b0, bd) - R @ P) for P in Q))
chk("slit b receding at a fixed height: the pairing tends to the half-turn (error %.1e, %.1e, %.1e)" % tuple(errs),
    errs[0] > errs[1] > errs[2] and errs[2] < 1e-4)
chk("the half-turn preserves distance (60 pairs of points)",
    all(abs(np.linalg.norm(R @ Q[i] - R @ Q[i + 1]) - np.linalg.norm(Q[i] - Q[i + 1])) < 1e-12 for i in range(59)))
chk("the pairing for the plate's finite slits does not preserve distance",
    any(abs(np.linalg.norm(sigma(PTS[i]) - sigma(PTS[i + 1])) - np.linalg.norm(PTS[i] - PTS[i + 1])) > 1e-2 for i in range(100)))

# ---- slit b at infinity but oblique to slit a: midpoints hold, distances do not ----
M = np.array([[-1.0, 0, 0], [0, 1, -2], [0, 0, -1]])         # the auditor's map (x, y, z) -> (-x, y - 2z, -z)
errs = []
for d in (1e2, 1e4, 1e6):
    b0, bd = np.array([0.0, d, d]), np.array([1.0, 0.0, 0.0])    # recedes within the plane y = z
    errs.append(max(np.linalg.norm(sigma(P, YA0, YAD, b0, bd) - M @ P) for P in Q))
chk("slit b receding obliquely: the pairing tends to (x, y, z) -> (-x, y - 2z, -z) (error %.1e, %.1e, %.1e)" % tuple(errs),
    errs[0] > errs[1] > errs[2] and errs[2] < 1e-4)
good = True
for P in Q:
    A = np.array([0.0, P[1] - P[2], 0.0])                     # where the ray through P crosses slit a
    good &= np.linalg.norm((P + M @ P) / 2 - A) < 1e-12        # A is the midpoint of P and its partner
chk("oblique case: A is still the midpoint of P and P' on every ray", good)
chk("oblique case: distance is NOT preserved, e.g. (0, 2, 1) at distance sqrt 5 goes to distance 1",
    abs(np.linalg.norm(M @ np.array([0.0, 2.0, 1.0])) - 1) < 1e-12)

print(f"{ok}/{tot}")
