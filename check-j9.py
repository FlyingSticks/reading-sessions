# check-j9.py -- J9: the mirror thread's measure against the book's gauges.
# Part 1: Reach, and Turn as a ruler.  Part 2: Turn as "equal ratios".
# Plate 12 formulas are copied from the-measure-v1.html (cr, R with +gamma, -gamma).
import math, random
random.seed(9)
ok=0; n=0
def check(name, cond):
    global ok,n
    n+=1; ok+=bool(cond)
    print(('pass  ' if cond else 'FAIL  ')+name)
def close(a,b,tol=1e-9): return abs(a-b)<=tol*max(1,abs(a),abs(b))

# plate 12
def cr(a,b,c,d): return ((c-a)*(d-b))/((d-a)*(c-b))
def R(tA,tB,gam): return cr(tA,tB,gam,-gam)           # readings tA,tB,+gam,-gam
def parab(tA,tB): return 1/tB-1/tA                    # plate 12, parabolic row

# the book's rig (chapter 2 and the instruments). Depth z is counted from the picture plane.
Zp,D,Zv,Zh,zstar=200.0,100.0,150.0,250.0,187.5
Z1,Z2=Zh-Zp,Zv-Zp        # slit feet from the picture plane: +50 and -50 (my reading of the rig)
unit=D
def reach(z): return z/unit                           # equal steps, plane at infinity at oo
def turn(z):  return z/(z+D)                          # station -> oo, plane at infinity -> 1
def cs(z):    return z*(Z1-Z2)/(Z1*(z-Z2))            # rebuilt: S->0, F1->1, F2->oo
p_cs=1-Z2/Z1                                          # where the chapter puts the plane at infinity

# rulers agree with what chapter 2 states
check('Turn: depth k units gives k/(k+1), k=0..6', all(close(turn(k*unit),k/(k+1)) for k in range(7)))
check('Turn: plane at infinity lands at 1', close(turn(1e15),1,1e-9))
check('cross-slit ruler: S at 0, F1 at 1', close(cs(0),0) and close(cs(Z1),1))
check('cross-slit ruler: F2 goes to infinity', abs(cs(Z2+1e-9))>1e9)
check('cross-slit ruler: plane at infinity at 1 - Z2/Z1', close(cs(1e15),p_cs,1e-9))
check('cross-slit ruler with F1 sent far out becomes z/(z+|Z2|)',
      all(close(z*(1e14-Z2)/(1e14*(z-Z2)), z/(z+abs(Z2)),1e-9) for z in (10,60,300)))
def pts(k=200):
    out=[]
    while len(out)<k:
        zA,zB=random.uniform(1,900),random.uniform(1,900)
        if abs(zA-zB)>1e-3: out.append((zA,zB))
    return out+[(Zv-Zp+60,zstar),(25,zstar),(zstar,Zh)]
P=pts()

# ---------- Part 1 ----------
# A reading whose one self-paired point is where the ruler puts the plane at infinity:
# Reach: self-paired point at oo, so reading t = 1/number.   Turn: t = 1 - x.   Cross-slit: t = p - x.
check('P1a Reach: plate-12 parabolic measure of readings 1/a, 1/b is b - a',
      all(close(parab(1/reach(zA),1/reach(zB)), reach(zB)-reach(zA)) for zA,zB in P))
check('P1b Turn: b - a = 1/(1-x_b) - 1/(1-x_a)',
      all(close(reach(zB)-reach(zA), parab(1-turn(zA),1-turn(zB)),1e-7) for zA,zB in P))
c=None; good=True
for zA,zB in P:
    q=parab(p_cs-cs(zA),p_cs-cs(zB))/(reach(zB)-reach(zA))
    if c is None: c=q
    good&=close(q,c,1e-6)
check('P1c cross-slit: same measure up to one constant (found %.6f)'%c, good)
check('P1c the constant is unit / (p*|Z2|)... computed %.6f'%(unit/(p_cs*abs(Z2))), close(c,unit/(p_cs*abs(Z2)),1e-6))
# the limit of plate 12: (R-1)/(2 gamma) -> parabolic measure, on the Turn readings
g=1e-7
check('P1d limit: (R-1)/(2 gamma) on Turn readings comes to b - a (gamma = 1e-7)',
      all(close((R(1-turn(zA),1-turn(zB),g)-1)/(2*g), reach(zB)-reach(zA),1e-4) for zA,zB in P))
T3=[(random.uniform(1,900),random.uniform(1,900),random.uniform(1,900)) for _ in range(100)]
check('P1f adds: measure(A,C) = measure(A,B) + measure(B,C) on the Turn ruler',
      all(close(parab(1-turn(a),1-turn(c2)), parab(1-turn(a),1-turn(b))+parab(1-turn(b),1-turn(c2)),1e-6) for a,b,c2 in T3))
# negative control: Turn differences are NOT the measure
check('P1g control: x_b - x_a is not b - a (so the 1/(1-x) step is needed)',
      any(not close(turn(zB)-turn(zA), reach(zB)-reach(zA),1e-3) for zA,zB in P))
# Complement x -> 1-x reverses the Reach measure (it is a mirror of it)
check('P1h Complement 1-x reverses Reach differences',
      all(close((1-reach(zB))-(1-reach(zA)), -(reach(zB)-reach(zA))) for zA,zB in P))

# ---------- Part 2 ----------
# Self-paired points at the numbers 0 and oo. Plate 12's Minkowski form needs them at +1 and -1.
def t2(x): return (x+1)/(x-1)   # 0 -> -1, oo -> +1; the other naming of the two points gives the opposite sign
for name,f in (('Reach',reach),('Turn',turn),('cross-slit',cs)):
    check('P2a %s numbers: half ln R = half ln(b/a)'%name,
          all(R(t2(f(zA)),t2(f(zB)),1)>0 and close(0.5*math.log(R(t2(f(zA)),t2(f(zB)),1)), 0.5*math.log(f(zB)/f(zA)),1e-6)
              for zA,zB in P if abs(f(zA)-1)>1e-6 and abs(f(zB)-1)>1e-6 and f(zA)>0 and f(zB)>0))
check('P2a2 with the two self-paired points named the other way round the sign is opposite',
      all(close(0.5*math.log(R(-t2(reach(zA)),-t2(reach(zB)),1)), -0.5*math.log(reach(zB)/reach(zA)),1e-6) for zA,zB in P))
check('P2b directly: cross-ratio of a, b, 0, oo is a/b... order check', close(cr(3.0,7.0,0.0,1e18),3.0/7.0,1e-9))
check('P2c scale x -> c x keeps ln(b/a); slide x -> x + c does not',
      close(math.log(5*7/(5*3)),math.log(7/3)) and not close(math.log((7+2)/(3+2)),math.log(7/3),1e-3))
check('P2d Reciprocal 1/x reverses ln(b/a)', all(close(math.log((1/reach(zB))/(1/reach(zA))),-math.log(reach(zB)/reach(zA))) for zA,zB in P))
# Does the ratio measure agree between rulers?  (It should NOT: 0 is shared, the point numbered oo is not.)
m=[(math.log(reach(zB)/reach(zA)), math.log(turn(zB)/turn(zA)), math.log(cs(zB)/cs(zA))) for zA,zB in P if cs(zA)>0 and cs(zB)>0]
check('P2e the ratio measure differs from ruler to ruler (Reach vs Turn)', any(not close(a,b,1e-3) for a,b,_ in m))
check('P2e the ratio measure differs from ruler to ruler (Turn vs cross-slit)', any(not close(b,c2,1e-3) for _,b,c2 in m))
# On the Turn ruler the two self-paired points are: number 0 = picture plane point S, number oo = station.
check('P2f Turn ruler: ln(x_b/x_a) is the measure with self-paired points S (z=0) and the station (z=-D)',
      all(close(math.log(turn(zB)/turn(zA)), math.log(cr(zA,zB,-D,0.0)),1e-7) for zA,zB in P))
# Turn's own steps k/(k+1): are they equal ratios?
r=[turn((k+1)*unit)/turn(k*unit) for k in range(1,6)]
check('P2g control: the steps k/(k+1) are NOT equal ratios (ratios %s)'%', '.join('%.3f'%v for v in r),
      not close(r[0],r[1],1e-3))
d=[1/(1-turn((k+1)*unit))-1/(1-turn(k*unit)) for k in range(0,6)]
check('P2h but they ARE equal steps of the Part 1 measure (each 1)', all(close(v,1,1e-9) for v in d))
print('%d of %d'%(ok,n))
