"""check-the-map-caption.py

Checks the two statements about numbers in the caption of figure 1 of
the-map.html (20 November 2026): where the cross-ratio -1 is stated, and
the sign of a map as a second number.

  A. The harmonic -1.  For the involutions of J1 (mirror), J3 (two slits)
     and J5 (half-turn about slit a), a point and its partner lie on a line
     that carries two fixed points, and divide those two in cross-ratio -1.

  B. The sign of a map.  For an involution that keeps distances, the sign
     (the sign of the determinant, which is +1 for an even number of mirrors
     and -1 for an odd number) equals one -1 for each direction reversed,
     multiplied.

Scope: B is checked only for involutions that keep distances, in the plane
and in space. Nothing here is a proof; each statement is tested on the cases
listed and on random samples.

Run:  python3 check-the-map-caption.py
"""
import math
import random

random.seed(20261120)
passed = failed = 0


def chk(name, ok):
    global passed, failed
    if ok:
        passed += 1
    else:
        failed += 1
    print(("ok    " if ok else "FAIL  ") + name)


def close(a, b, tol=1e-9):
    return abs(a - b) <= tol * max(1.0, abs(a), abs(b))


def cross_ratio(p, q, a, b):
    """(P, Q; A, B) for four positions measured along one line."""
    return ((a - p) * (b - q)) / ((a - q) * (b - p))


# ---------------------------------------------------------------- A
print("A. The harmonic -1")

# A1  J1: the mirror with line m (the x axis) in the Euclidean plane.
#     On the line through X square to m: fixed points F (on m) and K (at
#     infinity). With K at infinity the cross-ratio (X, X'; F, K) reduces to
#     the division ratio (f - x) / (f - x').
ok = True
for _ in range(200):
    y = random.uniform(-9, 9)
    if abs(y) < 1e-3:
        continue
    x_pos, partner, f = y, -y, 0.0
    ok = ok and close((f - x_pos) / (f - partner), -1.0)
chk("A1 mirror (J1): X and X' divide F and K-at-infinity in -1, 200 samples", ok)

# A2  J1 with the centre K on the page: harmonic pairing on the line through
#     K, with F at 0 and K at k. Partner of x is x' with (x, x'; 0, k) = -1,
#     that is x' = k x / (2 x - k).
ok = True
for _ in range(200):
    k = random.uniform(1, 9)
    x = random.uniform(-9, 9)
    if abs(x) < 1e-3 or abs(x - k) < 1e-3 or abs(2 * x - k) < 1e-3:
        continue
    xp = k * x / (2 * x - k)
    ok = ok and close(cross_ratio(x, xp, 0.0, k), -1.0, 1e-7)
    ok = ok and close(k * xp / (2 * xp - k), x, 1e-6)      # pairing twice returns x
chk("A2 harmonic pairing with centre K on the page: -1, and twice returns X", ok)

# A3  J3: the two-slit involution, slit a (x = 0, z = 150), slit b (y = 0, z = 250).
ZA, ZB = 150.0, 250.0


def sigma(P, za, zb):
    A = (0.0, P[1] * (za - zb) / (P[2] - zb), za)
    B = (P[0] * (zb - za) / (P[2] - za), 0.0, zb)
    k = (P[2] - za) / (zb - za)          # position of P on the line, A at 0, B at 1
    k2 = k / (2 * k - 1)                 # position of the partner
    P2 = tuple(A[i] + k2 * (B[i] - A[i]) for i in range(3))
    return P2, k, k2


ok = True
for _ in range(300):
    P = (random.uniform(-100, 100), random.uniform(-100, 100), random.uniform(-50, 400))
    if min(abs(P[2] - ZA), abs(P[2] - ZB), abs(2 * (P[2] - ZA) / (ZB - ZA) - 1)) < 1.0:
        continue
    P2, k, k2 = sigma(P, ZA, ZB)
    ok = ok and close(cross_ratio(k, k2, 0.0, 1.0), -1.0, 1e-7)
    back, _, _ = sigma(P2, ZA, ZB)
    ok = ok and all(close(back[i], P[i], 1e-6) for i in range(3))
chk("A3 two-slit involution (J3): (P, P'; A, B) = -1, and twice returns P, 300 samples", ok)

# A4  J5: slit b at infinity, square to slit a: the half-turn about slit a.
#     A is the foot of P on slit a, B is at infinity, so -1 means A is the midpoint.
ok = True
for _ in range(200):
    P = (random.uniform(-100, 100), random.uniform(-100, 100), random.uniform(-50, 400))
    P2 = (-P[0], P[1], 2 * ZA - P[2])
    A = (0.0, P[1], ZA)
    ok = ok and all(close((P[i] + P2[i]) / 2, A[i]) for i in range(3))
chk("A4 half-turn about slit a (J5): A is the midpoint of P and P', 200 samples", ok)

# ---------------------------------------------------------------- B
print("B. The sign of a map")


def matmul(X, Y):
    n = len(X)
    return [[sum(X[i][k] * Y[k][j] for k in range(n)) for j in range(n)] for i in range(n)]


def transpose(X):
    return [list(r) for r in zip(*X)]


def det(X):
    n = len(X)
    if n == 2:
        return X[0][0] * X[1][1] - X[0][1] * X[1][0]
    return (X[0][0] * (X[1][1] * X[2][2] - X[1][2] * X[2][1])
            - X[0][1] * (X[1][0] * X[2][2] - X[1][2] * X[2][0])
            + X[0][2] * (X[1][0] * X[2][1] - X[1][1] * X[2][0]))


def diag(entries):
    n = len(entries)
    return [[entries[i] if i == j else 0.0 for j in range(n)] for i in range(n)]


def identity(n):
    return diag([1.0] * n)


def mirror(n_vec):
    """The mirror square to the unit vector n_vec: I - 2 n n^T."""
    n = len(n_vec)
    return [[(1.0 if i == j else 0.0) - 2 * n_vec[i] * n_vec[j] for j in range(n)] for i in range(n)]


def unit(v):
    L = math.sqrt(sum(c * c for c in v))
    return [c / L for c in v]


def random_frame(n):
    """A random set of n mutually square unit directions (Gram-Schmidt)."""
    while True:
        vs = []
        for _ in range(n):
            v = [random.gauss(0, 1) for _ in range(n)]
            for u in vs:
                d = sum(a * b for a, b in zip(v, u))
                v = [a - d * b for a, b in zip(v, u)]
            if math.sqrt(sum(c * c for c in v)) < 1e-6:
                break
            vs.append(unit(v))
        if len(vs) == n:
            return vs


def same(X, Y, tol=1e-9):
    return all(close(X[i][j], Y[i][j], tol) for i in range(len(X)) for j in range(len(X)))


def keeps_distance(X):
    return same(matmul(transpose(X), X), identity(len(X)), 1e-9)


names = {
    (2, 1): "mirror with a line, in the plane",
    (2, 2): "half-turn about a point, in the plane",
    (3, 1): "mirror with a plane, in space",
    (3, 2): "half-turn about a line, in space (J5)",
    (3, 3): "pairing through a point, in space",
}

for (n, k), name in names.items():
    ok = True
    for _ in range(100):
        frame = random_frame(n)                 # n square directions
        # the map that reverses the first k of them and keeps the rest
        M = identity(n)
        for i in range(k):
            M = matmul(mirror(frame[i]), M)     # built as k mirrors in turn
        # it is an involution, moves something, keeps distances
        ok = ok and same(matmul(M, M), identity(n), 1e-9) and not same(M, identity(n))
        ok = ok and keeps_distance(M)
        # directions reversed: frame[i] is sent to -frame[i] for i < k, kept for i >= k
        for i in range(n):
            img = [sum(M[r][c] * frame[i][c] for c in range(n)) for r in range(n)]
            want = [(-1.0 if i < k else 1.0) * c for c in frame[i]]
            ok = ok and all(close(img[r], want[r], 1e-9) for r in range(n))
        # sign of the map = sign of the determinant = (-1)^k = mirror-count parity
        ok = ok and close(det(M), (-1.0) ** k, 1e-9)
    sign = "+1" if k % 2 == 0 else "-1"
    chk("B  %s: reverses %d direction(s), built from %d mirror(s), sign %s, 100 samples"
        % (name, k, k, sign), ok)

# B6  the caution: the half-turn about slit a has sign +1 while every pair is harmonic (A4).
H = diag([-1.0, 1.0, -1.0])
chk("B6 half-turn about slit a: determinant +1, although each pair has cross-ratio -1 (A4)",
    close(det(H), 1.0) and same(matmul(H, H), identity(3)))

# B7  a map that keeps distances but is not an involution reverses no direction:
#     the rule is not claimed for it. A turn through 40 degrees, as two mirrors.
t = math.radians(20)
R = matmul(mirror([math.sin(t), -math.cos(t)]), mirror([0.0, 1.0]))
chk("B7 scope: a turn through 40 degrees keeps distances, has sign +1, is not an involution",
    keeps_distance(R) and close(det(R), 1.0) and not same(matmul(R, R), identity(2)))

print()
print("%d of %d passed" % (passed, passed + failed))
raise SystemExit(1 if failed else 0)
