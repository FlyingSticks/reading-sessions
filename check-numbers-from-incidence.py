#!/usr/bin/env python3
"""check-numbers-from-incidence.py
Check for plate 7 of the primer, "Numbers from Incidence".
Exact arithmetic (fractions); nothing is rounded.

The construction, by joins and meets only:
  given  O, E, V on a line l   (named 0, 1 and infinity)
  choose U off l, and a line k through V (not l, not through U)
  O' = OU.k   E' = EU.k   W = OE'.UV
  step forward :  X' = XW.k ,  next = X'U.l
  step backward:  X' = XU.k ,  previous = X'W.l
Run:  python3 check-numbers-from-incidence.py
"""
from fractions import Fraction as F
import itertools, sys

def cross(a,b): return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
def same(a,b):  return cross(a,b)==(0,0,0)
def P(x,y):     return (F(x),F(y),F(1))
def on(p,L):    return p[0]*L[0]+p[1]*L[1]+p[2]*L[2]==0

class Net:
    def __init__(s,O,E,V,U,K):
        s.O,s.E,s.V,s.U=O,E,V,U
        s.l=cross(O,E); s.k=cross(V,K); s.uv=cross(U,V)
        assert on(V,s.l) and not on(U,s.l) and not on(U,s.k) and not same(s.k,s.l)
        s.Op=cross(cross(O,U),s.k); s.Ep=cross(cross(E,U),s.k)
        s.W=cross(cross(O,s.Ep),s.uv)
    def fwd(s,X):  return cross(cross(cross(cross(X,s.W),s.k),s.U),s.l)
    def bwd(s,X):  return cross(cross(cross(cross(X,s.U),s.k),s.W),s.l)
    def half(s):
        C=cross(cross(s.O,s.Ep),cross(s.E,s.Op))
        return cross(cross(s.U,C),s.l)
    def marks(s,lo,hi):
        m={0:s.O,1:s.E}
        for n in range(2,hi+1): m[n]=s.fwd(m[n-1])
        for n in range(-1,lo-1,-1): m[n]=s.bwd(m[n+1])
        return m

def coord(X,O,E):
    """position t of X along the line, with O at 0 and E at 1; None if X is at infinity"""
    if X[2]==0: return None
    x,y=X[0]/X[2],X[1]/X[2]; ox,oy=O[0],O[1]; dx,dy=E[0]-O[0],E[1]-O[1]
    return (x-ox)/dx if dx!=0 else (y-oy)/dy

def cr(a,b,c,d):
    """(a, b; c, d) = (a-c)(b-d) / ((a-d)(b-c)); None stands for the point at infinity"""
    def diff(p,q):
        if p is None or q is None: return None
        return p-q
    num=[diff(a,c),diff(b,d)]; den=[diff(a,d),diff(b,c)]
    n=F(1); d_=F(1); inf=0
    for t in num:
        if t is None: inf+=1
        else: n*=t
    for t in den:
        if t is None: inf-=1
        else: d_*=t
    assert inf==0
    return n/d_

tally=[0,0]
def ok(cond,what):
    tally[0]+=1
    if cond: tally[1]+=1
    else: print("FAIL:",what)

O=P(2,3); E=P(5,4)                         # a line in general position
def onl(t): return P(O[0]+t*(E[0]-O[0]), O[1]+t*(E[1]-O[1]))
Vs={ "V at infinity": (E[0]-O[0],E[1]-O[1],F(0)), "V at 9": onl(9), "V at 9/2": onl(F(9,2)), "V at -7/2": onl(F(-7,2)) }
aux=[(P(4,11),P(-1,7)), (P(7,15),P(0,6)), (P(-2,9),P(3,8)), (P(10,-6),P(1,-2))]
LO,HI=-3,8

for name,V in Vs.items():
    tv=coord(V,O,E)
    nets=[Net(O,E,V,U,K) for U,K in aux]
    ms=[n.marks(LO,HI) for n in nets]
    # 7.1 one further point, whatever U and k
    ok(all(same(ms[0][n],m[n]) for m in ms for n in range(LO,HI+1)), f"7.1 independence of U and k ({name})")
    m=ms[0]; t={n:coord(m[n],O,E) for n in m}
    # 7.3 the number read back from positions is n
    ok(all(cr(t[n],F(1),F(0),tv)==n for n in t), f"7.3 read back = n ({name})")
    # 7.2 each mark is the harmonic partner of the one before, about the one between and V
    ok(all(cr(t[n-1],t[n+1],t[n],tv)==-1 for n in range(LO+1,HI)), f"7.2 harmonic at every mark ({name})")
    # 7.4 positions
    if tv is None:
        ok(all(t[n]==n for n in t), f"7.4 equal steps ({name})")
    else:
        ok(all(t[n]==n*tv/(tv-1+n) for n in t), f"7.4 position n v/(v-1+n) ({name})")
        gaps=[1/(tv-t[n]) for n in range(LO,HI+1)]
        ok(len({gaps[i+1]-gaps[i] for i in range(len(gaps)-1)})==1, f"7.4 reciprocals of distances from V in equal steps ({name})")
    # 7.5 a half, three halves, and backward steps
    h=[n.half() for n in nets]
    ok(all(same(h[0],x) for x in h) and cr(coord(h[0],O,E),F(1),F(0),tv)==F(1,2), f"7.5 one half ({name})")
    ok(cr(coord(nets[0].fwd(h[0]),O,E),F(1),F(0),tv)==F(3,2), f"7.5 three halves ({name})")
    ok(cr(coord(h[0],O,E),tv,F(0),F(1))==-1, f"7.5 one half is the harmonic partner of V about 0 and 1 ({name})")
    ok(all(cr(t[n],F(1),F(0),tv)==n for n in range(LO,0)), f"7.5 backward steps give -1, -2, -3 ({name})")

# 7.3 (second half) a perspective view of the whole figure: construct in the view, compare
M=((F(3),F(1),F(2)),(F(-1),F(4),F(1)),(F(1,7),F(2,9),F(5)))
def view(p): return tuple(sum(M[i][j]*p[j] for j in range(3)) for i in range(3))
for name,V in Vs.items():
    U,K=aux[0]; a=Net(O,E,V,U,K); b=Net(view(O),view(E),view(V),view(U),view(K))
    ma,mb=a.marks(LO,HI),b.marks(LO,HI)
    ok(all(same(view(ma[n]),mb[n]) for n in ma), f"7.3 the construction commutes with a perspective view ({name})")
    O2,E2,V2=view(O),view(E),view(V)
    O2n=(O2[0]/O2[2],O2[1]/O2[2],F(1)); E2n=(E2[0]/E2[2],E2[1]/E2[2],F(1))
    tv2=coord(V2,O2n,E2n)
    ok(all(cr(coord(mb[n],O2n,E2n),F(1),F(0),tv2)==n for n in mb), f"7.3 read back in the view is still n ({name})")

print(f"{tally[1]} of {tally[0]} passed")
sys.exit(0 if tally[0]==tally[1] else 1)
