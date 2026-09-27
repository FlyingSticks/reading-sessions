// Smoke checks for one-hinge-two-banks-v4.html — the comparison plate.
// The headline assertion set: the juxtaposed A + B = C and the signed uv-Pythagoras
// on diameter O–M are one theorem, term by term.
// v4 adds: matched altitudes (the four-VP -1 priced as two ab = H^2 circles with one
// altitude) and the prism (the red quad raised into a box by a vertical homology).
'use strict';
const fs=require('fs'), path=require('path'), cp=require('child_process'), os=require('os');

const file=path.join(__dirname,'one-hinge-two-banks-v4.html');
const html=fs.readFileSync(file,'utf8');
let pass=0, fail=0;
function ok(c,msg){ if(c){pass++;} else {fail++; console.error('FAIL  '+msg);} }

const sm=html.match(/<script>([\s\S]*?)<\/script>/);
ok(!!sm,'inline script found');
const tmp=path.join(os.tmpdir(),'two-banks-inline.js');
fs.writeFileSync(tmp,sm[1]);
try{ cp.execSync('node --check '+JSON.stringify(tmp),{stdio:'pipe'}); pass++; }
catch(e){ fail++; console.error('FAIL  node --check on inline script'); }

const mb=html.match(/\/\/ \[MATH-BEGIN\]([\s\S]*?)\/\/ \[MATH-END\]/);
ok(!!mb,'math block found');
const M=new Function(mb[1]+
  '\nreturn {C_TOT,H_TOT,bOf,tFrac,tY,ptsOf,hingeOf,P2of,Qv,pairQ,vsub,hyperVal,hyperY,'+
  'QOM,QOP2,QP2M,slopeMag,Mprime,legMeetV,midBot,midTop,meet2,shoelace3,regionA,regionC,'+
  'sharedB,sliverL,sliverR,hmOf,gmOf,amOf,chordAtT,tG,tA,crossRatio4h,clampA,snapA,'+
  'sOf,worldToScreen,railY,NeOf,VDprimeOf,hingeT,m1T,VDof,SprimeOf,clampS,snapS,'+
  'postNext,bounceOrbit,clampSeed,snapSeed,'+
  'altFoot,altSide,circAlpha,circBeta,altAlpha2,altBeta2,circAlt2,circPower,harmonicMate,'+
  'floorOf,eyeFraction,clampK,snapK};')();

const C=M.C_TOT, H=M.H_TOT;
function meet(P,Q,R,S){
  const d1={x:Q.x-P.x,y:Q.y-P.y}, d2={x:S.x-R.x,y:S.y-R.y};
  const den=d1.x*d2.y-d1.y*d2.x;
  const t=((R.x-P.x)*d2.y-(R.y-P.y)*d2.x)/den;
  return {x:P.x+t*d1.x, y:P.y+t*d1.y};
}
function colin(P,Q,R){return Math.abs((Q.x-P.x)*(R.y-P.y)-(R.x-P.x)*(Q.y-P.y));}
function solveLin(A,rhs){
  const n=A.length;
  const Mx=A.map((row,i)=>row.concat([rhs[i]]));
  for(let col=0;col<n;col++){
    let piv=col;
    for(let r=col+1;r<n;r++) if(Math.abs(Mx[r][col])>Math.abs(Mx[piv][col])) piv=r;
    const tm=Mx[col]; Mx[col]=Mx[piv]; Mx[piv]=tm;
    for(let r=0;r<n;r++){
      if(r===col) continue;
      const f=Mx[r][col]/Mx[col][col];
      if(f===0) continue;
      for(let cc=col;cc<=n;cc++) Mx[r][cc]-=f*Mx[col][cc];
    }
  }
  return Mx.map((row,i)=>row[n]/row[i]);
}
function homographyFrom(pairs){
  const A=[],rhs=[];
  for(const q of pairs){
    A.push([q.u,q.v,1,0,0,0,-q.x*q.u,-q.x*q.v]); rhs.push(q.x);
    A.push([0,0,0,q.u,q.v,1,-q.y*q.u,-q.y*q.v]); rhs.push(q.y);
  }
  const h=solveLin(A,rhs);
  return [[h[0],h[1],h[2]],[h[3],h[4],h[5]],[h[6],h[7],1]];
}
function applyH(Hh,u,v,w){
  return [Hh[0][0]*u+Hh[0][1]*v+Hh[0][2]*w,
          Hh[1][0]*u+Hh[1][1]*v+Hh[1][2]*w,
          Hh[2][0]*u+Hh[2][1]*v+Hh[2][2]*w];
}
const EPS=1e-10, close=(x,y,e)=>Math.abs(x-y)<=(e||EPS);

const samples=[];
for(let aa=0.6;aa<=5.4001;aa+=0.2) samples.push(Math.round(aa*100)/100);
let seed=17;
function rnd(){seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;}
for(let i=0;i<20;i++) samples.push(0.6+4.8*rnd());

for(const a of samples){
  const b=M.bOf(a), p=M.ptsOf(a), X=M.hingeOf(a), P2=M.P2of(a), t=M.tY(a), V=M.legMeetV(a);

  // --- the dictionary: hinge = diagonal meet, station height, R.T-03's formula ---
  const Xi=meet(p.O,p.N,p.R,p.M);
  ok(close(X.x,Xi.x)&&close(X.y,Xi.y),'hinge = diagonal meet, a='+a);
  ok(close(X.y,H*C/(b+C)),'station height hc/(b+c), a='+a);
  // in R.T-03's convention (unit square c=2,h=1, division at b3 from the left):
  // height fraction 2/(4-b3) with b3 <-> a scaled; check the formula identity
  const b3=2*a/C; // a translated into R.T-03's left-measured division on c=2
  ok(close(M.tFrac(a),2/(4-b3)),'station fraction = R\u00B7T-03\u2019s 2/(4\u2212b), a='+a);
  ok(close(M.hingeOf(a).x/C,M.tFrac(a))&&close(X.y/H,M.tFrac(a)),'X on O-N at the fraction, a='+a);

  // --- uv apparatus in hinge coordinates ---
  ok(close(M.hyperVal(a,p.O),0),'O on the Minkowski circle of O-M, a='+a);
  ok(close(M.hyperVal(a,p.M),0),'M on the Minkowski circle, a='+a);
  ok(close(M.hyperVal(a,P2),0),'P2 on the Minkowski circle, a='+a);
  ok(close(M.hyperY(a,C),t),'unique right-edge crossing at the hinge height, a='+a);
  ok(close(P2.y,X.y),'P2 and X share the null rail, a='+a);
  ok(close(M.pairQ(M.vsub(P2,p.O),M.vsub(p.M,P2)),0,1e-9),'<OP2, P2M> = 0: Q-right at P2, a='+a);
  ok(close(M.QOP2(a)+M.QP2M(a),M.QOM(a),1e-9),'signed Pythagoras Q(OP2)+Q(P2M)=Q(OM), a='+a);
  ok(M.QOP2(a)>0&&M.QP2M(a)<0,'legs of opposite type, a='+a);
  const s1=(P2.y-0)/(P2.x-0), s2=(p.M.y-P2.y)/(p.M.x-P2.x);
  ok(close(s1,M.slopeMag(a))&&close(s2,-M.slopeMag(a)),'mirror slopes \u00B1h/(b+c), a='+a);

  // --- THE HEADLINE: three half-squares are A, C, B; the two identities coincide ---
  const areaA=M.shoelace3(...M.regionA(a));
  const areaC=M.shoelace3(...M.regionC(a));
  const areaB=M.shoelace3(...M.sharedB(a));
  ok(close(areaA,0.5*M.QOM(a),1e-9),'half-square on O-M IS region A, a='+a);
  ok(close(M.shoelace3(p.O,P2,p.R),0.5*M.QOP2(a),1e-9),'half-square on O-P2, a='+a);
  ok(close(M.shoelace3(p.M,p.N,P2),0.5*Math.abs(M.QP2M(a)),1e-9),'half-square on P2-M owns M and N, a='+a);
  ok(close(M.shoelace3(p.O,X,p.R),M.shoelace3(p.O,P2,p.R),1e-9),'null slide carries it onto C, a='+a);
  ok(close(M.shoelace3(p.M,X,p.N),M.shoelace3(p.M,p.N,P2),1e-9),'null slide carries it onto B, a='+a);
  ok(close(areaC,0.5*M.QOP2(a),1e-9),'C = +\u00BDQ(OP2), a='+a);
  ok(close(areaB,-0.5*M.QP2M(a),1e-9),'B = \u2212\u00BDQ(P2M): the crossed negative square, a='+a);
  ok(close(areaA+areaB,areaC,1e-9),'A + B = C: one theorem, two proofs, a='+a);

  // --- the count-bank proof still stands beside it ---
  const Dl=M.shoelace3(...M.sliverL(a)), Dr=M.shoelace3(...M.sliverR(a));
  ok(close(Dl,Dr,1e-9),'D = D, a='+a);
  ok(close(areaA+Dl+areaB+Dr+areaC,C*H,1e-9),'five regions tile the rectangle, a='+a);
  ok(close(areaA+Dl+areaB,C*H/2,1e-9),'A + D + B = half rectangle above O-N, a='+a);
  ok(close(areaC+Dr,C*H/2,1e-9),'C + D = half rectangle below O-N, a='+a);

  // --- circle bank ---
  const Mp=M.Mprime(a);
  ok(close((Mp.x-3)**2+(Mp.y-H)**2,9,1e-9),'M\u2032 on the semicircle over L-N, a='+a);
  const LM2=(Mp.x-p.L.x)**2+(Mp.y-p.L.y)**2, MN2=(p.N.x-Mp.x)**2+(p.N.y-Mp.y)**2;
  ok(close(LM2+MN2,36,1e-8),'LM\u20322 + M\u2032N2 = LN2, a='+a);
  ok(close((Mp.y-H)**2,a*b,1e-9),'altitude M\u2032M = sqrt(ab), a='+a);

  // --- means at their stations ---
  ok(close(M.chordAtT(a,M.tFrac(a)).q.x-M.chordAtT(a,M.tFrac(a)).p.x,M.hmOf(a),1e-9),'HM chord at the hinge, a='+a);
  ok(close(M.chordAtT(a,M.tG(a)).q.x-M.chordAtT(a,M.tG(a)).p.x,M.gmOf(a),1e-9),'GM chord at its station, a='+a);
  ok(close(M.chordAtT(a,M.tA()).q.x-M.chordAtT(a,M.tA()).p.x,M.amOf(a),1e-9),'AM chord is the midline, a='+a);
  ok(b<M.hmOf(a)&&M.hmOf(a)<M.gmOf(a)&&M.gmOf(a)<M.amOf(a)&&M.amOf(a)<C,'ladder order, a='+a);

  // --- horizon bank ---
  const m0=M.midBot(), m1=M.midTop(a);
  ok(colin(p.O,p.N,X)<1e-8&&colin(p.O,p.M,V)<1e-7,'quad sides through VP_L, a='+a);
  ok(colin(p.R,p.M,X)<1e-8&&close(V.x,C),'quad sides through VP_R, a='+a);
  const dm=meet(p.M,p.N,X,V);
  ok(close(dm.x,m1.x,1e-7)&&close(dm.y,m1.y,1e-7),'diagonal meet = m1, a='+a);
  ok(colin(m0,X,V)<1e-7,'X-V passes through V_D = m0, a='+a);
  ok(close(M.crossRatio4h(m1.y,m0.y,X.y,V.y),-1,1e-9),'(m1,m0;X,V) = -1, a='+a);
  ok(close((0-C/2)/(C-C/2),-1),'(VP_L,VP_R;V_D,inf) = -1: midpoint harmonic');
  const Hm=homographyFrom([
    {u:0,v:0,x:X.x,y:X.y},{u:1,v:1,x:p.N.x,y:p.N.y},
    {u:0,v:2,x:V.x,y:V.y},{u:-1,v:1,x:p.M.x,y:p.M.y}]);
  const d1=applyH(Hm,1,1,0), d3=applyH(Hm,0,1,0);
  ok(Math.abs(d1[0]/d1[2])<1e-5&&Math.abs(d1[1]/d1[2])<1e-5,'plan side vanishes at O, a='+a);
  ok(close(d3[0]/d3[2],m0.x,1e-5)&&Math.abs(d3[1]/d3[2])<1e-5,'depth diagonal vanishes at V_D, a='+a);
}

// ---------- tilt: three strata ----------
function ang(u){return Math.atan2(u.y,u.x);}
function angdiff(u,v){let d=ang(u)-ang(v);
  while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI; return d;}
for(const a of [0.8,1.8,2.6,3.6,4.6,5.2]){
  const p=M.ptsOf(a), Vv=M.legMeetV(a), P2=M.P2of(a), t=M.tY(a);
  const hi=M.clampS(a,99), lo=M.clampS(a,-99);
  ok(hi>0&&lo<0,'tilt range straddles level, a='+a);
  for(const s of [lo*0.85,lo*0.4,hi*0.4,hi*0.85]){
    const Ne=M.NeOf(a,s), X=M.hingeT(a,s), m1t=M.m1T(a,s),
          VD=M.VDof(a,s), VDp=M.VDprimeOf(a,s);
    // stratum 1: rail-borne claims genuinely fail (park-worthiness demonstrated)
    ok(Math.abs(X.y-t)>1e-4,'the hinge leaves the rail, a='+a+' s='+s.toFixed(3));
    const Cslid=M.shoelace3(p.O,X,p.R);
    ok(Math.abs(Cslid-0.5*M.QOP2(a))>1e-5,'the region/square equivalence fails off-level, a='+a+' s='+s.toFixed(3));
    // stratum 2: form-borne claims stand unchanged (O, M, P2 never moved)
    ok(close(M.hyperVal(a,P2),0),'P2 still on the Minkowski circle, a='+a+' s='+s.toFixed(3));
    ok(close(M.pairQ(M.vsub(P2,p.O),M.vsub(p.M,P2)),0,1e-9),'Q-right at P2 stands, a='+a+' s='+s.toFixed(3));
    ok(close(M.QOP2(a)+M.QP2M(a),M.QOM(a),1e-9),'signed Pythagoras stands, a='+a+' s='+s.toFixed(3));
    // stratum 3: incidence-borne claims stand and grow
    const Xi=meet(p.O,Ne,p.R,p.M);
    ok(close(X.x,Xi.x,1e-9)&&close(X.y,Xi.y,1e-9),'tilted hinge = diagonal meet, a='+a+' s='+s.toFixed(3));
    const mi=meet(p.M,Ne,X,Vv);
    ok(close(m1t.x,mi.x,1e-8)&&close(m1t.y,mi.y,1e-8),'tilted center image, a='+a+' s='+s.toFixed(3));
    ok(Math.abs(VD.y)<1e-9&&colin(X,Vv,VD)<1e-6,'V_D on diagonal X-V and on HL, a='+a+' s='+s.toFixed(3));
    ok(VDp.x<-0.14||VDp.x>C+0.14,'V_Dprime outside the base, a='+a+' s='+s.toFixed(3));
    const p1=VD.x, q1=VDp.x;
    ok(close(M.crossRatio4h(0,C,p1,q1),-1,1e-7),'(VP_L,VP_R;V_D,V_Dprime) = -1, a='+a+' s='+s.toFixed(3));
    ok(close(1/p1+1/q1,2/C,1e-9),'1/OV_D + 1/OV_Dprime = 2/c, a='+a+' s='+s.toFixed(3));
    ok(close(M.crossRatio4h(X.y,Vv.y,m1t.y,0),-1,1e-7),'(X,V;m1,V_D) = -1, a='+a+' s='+s.toFixed(3));
    ok(close(M.crossRatio4h(a,C,m1t.x,q1),-1,1e-7),'(M,N;m1,V_Dprime) = -1, a='+a+' s='+s.toFixed(3));
    const Sp=M.SprimeOf(p1,q1);
    ok(Sp.y<0&&close(Math.hypot(Sp.x-C/2,Sp.y),C/2,1e-7),'S on the O-R semicircle, a='+a+' s='+s.toFixed(3));
    ok(close(Math.hypot(Sp.x-(p1+q1)/2,Sp.y),Math.abs(q1-p1)/2,1e-6*Math.max(1,Math.abs(q1))),
      'S on the V_D-V_Dprime semicircle, a='+a+' s='+s.toFixed(3));
    ok(Math.abs((0-Sp.x)*(C-Sp.x)+Sp.y*Sp.y)<1e-7,'S sees O, R at 90 deg, a='+a+' s='+s.toFixed(3));
    ok(Math.abs((p1-Sp.x)*(q1-Sp.x)+Sp.y*Sp.y)<1e-6*Math.max(1,Math.abs(q1)),
      'S sees V_D, V_Dprime at 90 deg, a='+a+' s='+s.toFixed(3));
    const rO={x:-Sp.x,y:-Sp.y}, rR={x:C-Sp.x,y:-Sp.y}, rD={x:p1-Sp.x,y:-Sp.y};
    ok(close(Math.abs(angdiff(rO,rD)),Math.abs(angdiff(rD,rR)),1e-6),
      'S-V_D bisects angle O-S-R, a='+a+' s='+s.toFixed(3));
    const Hm2=homographyFrom([
      {u:0,v:0,x:X.x,y:X.y},{u:1,v:1,x:Ne.x,y:Ne.y},
      {u:0,v:2,x:Vv.x,y:Vv.y},{u:-1,v:1,x:p.M.x,y:p.M.y}]);
    const e1=applyH(Hm2,1,1,0), e4=applyH(Hm2,1,0,0), e5=applyH(Hm2,0,1,1);
    ok(Math.abs(e1[0]/e1[2])<1e-5&&Math.abs(e1[1]/e1[2])<1e-5,'plan side -> O, tilted, a='+a+' s='+s.toFixed(3));
    ok(close(e4[0]/e4[2],q1,1e-4*Math.max(1,Math.abs(q1)))&&
       Math.abs(e4[1]/e4[2])<1e-4*Math.max(1,Math.abs(q1)),
      'cross diagonal -> V_Dprime, finite, a='+a+' s='+s.toFixed(3));
    ok(close(e5[0]/e5[2],m1t.x,1e-6)&&close(e5[1]/e5[2],m1t.y,1e-6),'plan center -> m1, tilted, a='+a+' s='+s.toFixed(3));
  }
  // level reductions
  ok(close(M.hingeT(a,0).x,M.hingeOf(a).x,1e-9)&&close(M.hingeT(a,0).y,M.hingeOf(a).y,1e-9),
    'hingeT reduces at s=0, a='+a);
  const VD0=M.VDof(a,0);
  ok(close(VD0.x,3,1e-9)&&Math.abs(VD0.y)<1e-9,'V_D at m0 when level, a='+a);
  const m10=M.m1T(a,0);
  ok(close(m10.x,M.midTop(a).x,1e-9)&&close(m10.y,M.midTop(a).y,1e-9),
    'center image at the midpoint when level, a='+a);
}
ok(M.snapS(0.01)===0&&M.snapS(0.032)===0.03,'snapS behavior');

// ---------- the harmonic bounce ----------
// level: closed form, gap laws, parabolic double point, Mobius CR preservation
for(const x of [0.5,1.2,2.0,3.0,3.7,4.4,4.9]){
  const f=M.postNext(3.6,0,x);
  ok(close(f,C*C/(2*C-x),1e-10),'bounce closed form c^2/(2c-x), x='+x);
  ok(close(M.postNext(1.2,0,x),M.postNext(4.8,0,x),1e-10),'level bounce independent of a, x='+x);
  const g=C-x, g2=C-f;
  ok(close(g2,C*g/(C+g),1e-10),'gap law g\'=cg/(c+g), x='+x);
  ok(close(1/g2-1/g,1/C,1e-10),'reciprocal gap steps by exactly 1/c, x='+x);
  ok(close(g2,(2*g*C/(g+C))/2,1e-10),'new gap = HM(gap,c)/2, x='+x);
  ok(close((f-x)*(2*C-x),(x-C)*(x-C),1e-8),'f(x)-x = (x-c)^2/(2c-x): double fixed point at N, x='+x);
}
{ // Mobius: cross-ratio preserved
  const q=[0.7,1.9,3.1,4.6].map(x=>x);
  const fq=q.map(x=>M.postNext(2.5,0,x));
  ok(close(M.crossRatio4h(q[0],q[1],q[2],q[3]),M.crossRatio4h(fq[0],fq[1],fq[2],fq[3]),1e-9),
    'the bounce preserves cross-ratio (it is a projectivity)');
}
// level orbits: arithmetic reciprocals across the run, triple-wise -1 with N
for(const x0 of [0.5,1.5,2.0,3.0,4.2]){
  const xs=M.bounceOrbit(3.6,0,x0,8);
  ok(xs.length>=6,'orbit runs, x0='+x0);
  for(let n=0;n+1<xs.length;n++){
    ok(xs[n+1]>xs[n]&&xs[n+1]<C,'orbit monotone toward N, x0='+x0+' n='+n);
    ok(close(1/(C-xs[n+1])-1/(C-xs[n]),1/C,1e-9),'harmonic progression step, x0='+x0+' n='+n);
  }
  for(let n=0;n+2<xs.length;n++){
    ok(close(M.crossRatio4h(xs[n],xs[n+2],xs[n+1],C),-1,1e-8),
      '(x_n, x_n+2; x_n+1, N) = -1, x0='+x0+' n='+n);
  }
}
// tilt: the -1 chain survives; the fixed point rides with N (x = c)
for(const a of [1.2,2.6,3.6,4.8]){
  const hi=M.clampS(a,99), lo=M.clampS(a,-99);
  for(const s of [lo*0.7,hi*0.7]){
    for(const x0 of [0.8,2.0,3.5]){
      const xs=M.bounceOrbit(a,s,x0,8);
      ok(xs.length>=5,'tilted orbit runs, a='+a+' s='+s.toFixed(3)+' x0='+x0);
      for(let n=0;n+1<xs.length;n++)
        ok(xs[n+1]>xs[n]&&xs[n+1]<C,'tilted orbit monotone toward N, a='+a+' s='+s.toFixed(3));
      for(let n=0;n+2<xs.length;n++)
        ok(close(M.crossRatio4h(xs[n],xs[n+2],xs[n+1],C),-1,1e-7),
          'tilted triple -1, a='+a+' s='+s.toFixed(3)+' n='+n);
      // the harmonic-progression property itself survives tilt: the map stays
      // parabolic in x with its double point at x = c, so reciprocal gaps stay
      // arithmetic; only the step's VALUE 1/c belongs to the level frame
      if(xs.length>=5){
        const d1=1/(C-xs[1])-1/(C-xs[0]), d2=1/(C-xs[2])-1/(C-xs[1]),
              d3=1/(C-xs[3])-1/(C-xs[2]);
        ok(close(d1,d2,1e-8)&&close(d2,d3,1e-8),
          'reciprocal gaps stay arithmetic under tilt, a='+a+' s='+s.toFixed(3));
        ok(Math.abs(d1-1/C)>1e-4,
          'the step value 1/c is level furniture, a='+a+' s='+s.toFixed(3));
      }
    }
  }
}
ok(M.snapSeed(1.024)===1.0&&M.clampSeed(9)===5.0&&M.clampSeed(-1)===0.4,'seed clamp and snap');

// station point constants (level rig)
{
  const S={x:3,y:-3};
  ok(close((0-S.x)*(C-S.x)+(0-S.y)*(0-S.y),0),'S sees O and R at 90 degrees');
  ok(close(Math.hypot(S.x-C/2,S.y),C/2),'S on the Thales semicircle below HL');
  ok(close(S.x,C/2),'S\u2019s vertical strikes V_D');
}
// ---------- matched altitudes: the -1 priced as ab = H^2, twice ----------
// (1) the sketch's own numbers: c = 4, V_D at 3, V_Dprime at 6, foot at 1, altitude sqrt 6
{
  const c=4,p=3,q=6;
  ok(close(M.crossRatio4h(0,c,p,q),-1),'sketch: (A,Q;P,B) = -1');
  ok(close(1/p+1/q,2/c),'sketch: 1/AP + 1/AB = 2/AQ');
  ok(M.altFoot(c,p)===1,'sketch: foot H at 1');
  const ca=M.circAlpha(c,p,q), cb=M.circBeta(c,p,q);
  ok(ca.lo===-2&&ca.hi===3,'sketch: circle alpha on [-2, 3]');
  ok(cb.lo===0&&cb.hi===7,'sketch: circle beta on [0, 7]');
  ok(M.altAlpha2(c,p,q)===6&&M.altBeta2(c,p,q)===6,'sketch: 3*2 = 6*1 = 6');
  ok(close(M.circAlt2(ca,1),6)&&close(M.circAlt2(cb,1),6),'sketch: both altitudes^2 at H are 6');
  ok(close(Math.sqrt(M.circAlt2(ca,1)),Math.sqrt(6)),'sketch: red altitude sqrt 6');
  ok(close(M.circPower(ca,1,0),-6)&&close(M.circPower(cb,1,0),-6),'sketch: H has power -6 in both circles');
  ok(close(M.harmonicMate(c,p),q),'sketch: B is P\u2019s harmonic mate w.r.t. A, Q');
  // the orange circle on A-Q inverts P into B; the P-B circle is orthogonal to it
  ok(close((p-c/2)*(q-c/2),(c/2)*(c/2)),'sketch: P, B inverse in the circle on A-Q');
  const d2=((p+q)/2-c/2)**2, ro=(c/2)**2, rd=((q-p)/2)**2;
  ok(close(d2,ro+rd),'sketch: circles on A-Q and P-B orthogonal');
}
// (2) the general law across the plate's own tilts, both sides of level
for(const a of [0.8,1.8,2.6,3.6,4.6,5.2]){
  const hi=M.clampS(a,99), lo=M.clampS(a,-99);
  for(const s of [lo*0.9,lo*0.5,lo*0.15,hi*0.15,hi*0.5,hi*0.9]){
    const p=M.VDof(a,s).x, q=M.VDprimeOf(a,s).x, tag=' a='+a+' s='+s.toFixed(3);
    const Hf=M.altFoot(C,p), ca=M.circAlpha(C,p,q), cb=M.circBeta(C,p,q);
    ok(q>C||q<0,'V_Dprime outside the base'+tag);
    ok(close(Hf,C-p)&&close(Hf,2*(C/2)-p),'foot H = V_D mirrored in m0'+tag);
    const A2=M.altAlpha2(C,p,q), B2=M.altBeta2(C,p,q);
    ok(A2>0&&B2>0,'both products positive'+tag);
    ok(close(A2,B2,1e-9*Math.max(1,A2)),'OV_D*RV_Dprime = V_DR*OV_Dprime: altitudes match'+tag);
    ok(ca.lo<Hf&&Hf<ca.hi&&cb.lo<Hf&&Hf<cb.hi,'H inside both diameters'+tag);
    ok(close(M.circAlt2(ca,Hf),A2,1e-9*Math.max(1,A2)),'alpha altitude^2 at H = OV_D*RV_Dprime'+tag);
    ok(close(M.circAlt2(cb,Hf),B2,1e-9*Math.max(1,B2)),'beta altitude^2 at H = V_DR*OV_Dprime'+tag);
    // the pieces really are the four VP distances
    const pa=[Hf-ca.lo,ca.hi-Hf].sort((u,v)=>u-v), pb=[Hf-cb.lo,cb.hi-Hf].sort((u,v)=>u-v);
    const ea=[p,Math.abs(q-C)].sort((u,v)=>u-v), eb=[C-p,Math.abs(q)].sort((u,v)=>u-v);
    ok(close(pa[0],ea[0],1e-9)&&close(pa[1],ea[1],1e-9),'alpha pieces are OV_D and RV_Dprime'+tag);
    ok(close(pb[0],eb[0],1e-9)&&close(pb[1],eb[1],1e-9),'beta pieces are V_DR and OV_Dprime'+tag);
    // one circle always has O or R as an end (the sketch's [0, 7])
    ok(q>C?close(cb.lo,0,1e-9):close(ca.hi,C,1e-9),'one circle ends at O (V_Dprime right) or at R (V_Dprime left)'+tag);
    ok(close(ca.lo,q-p,1e-9)||close(ca.hi,q-p,1e-9),'alpha circle ends at V_Dprime - OV_D'+tag);
    // radical axis is the vertical through H: equal power along the whole line
    for(const y of [0,0.7,2.3]) ok(close(M.circPower(ca,Hf,y),M.circPower(cb,Hf,y),1e-8*Math.max(1,A2)),
      'radical axis is x = H'+tag+' y='+y);
    // both circles pass through the apex (H, sqrt product)
    const alt=Math.sqrt(A2);
    ok(Math.abs(M.circPower(ca,Hf,alt))<1e-8*Math.max(1,A2)&&Math.abs(M.circPower(cb,Hf,alt))<1e-8*Math.max(1,A2),
      'both circles pass through the apex of the altitude'+tag);
    // and it is a certificate: nudge V_Dprime off harmonic and the altitudes part
    for(const d of [0.05,-0.05,0.3]){
      const qq=q+d*Math.max(1,Math.abs(q)/4);
      ok(Math.abs(M.altAlpha2(C,p,qq)-M.altBeta2(C,p,qq))>1e-4,'altitudes part off harmonic'+tag+' d='+d);
      ok(Math.abs(M.crossRatio4h(0,C,p,qq)+1)>1e-6,'and the range is no longer -1'+tag+' d='+d);
    }
    ok(close(M.harmonicMate(C,p),q,1e-8*Math.max(1,Math.abs(q))),'V_Dprime = harmonic mate of V_D'+tag);
  }
}
// (3) the resting state: at level V_Dprime -> infinity and the pair straightens
{
  const p=C/2;
  for(const q of [1e3,1e5,1e7]){
    const ca=M.circAlpha(C,p,q), cb=M.circBeta(C,p,q);
    ok(close(M.altFoot(C,p),C/2),'level foot at m0');
    ok(close(ca.lo,0)&&close(cb.lo,0),'both circles start at O as V_Dprime recedes, q='+q);
    ok(close(ca.hi,q-p)&&close(cb.hi,q+p),'far ends recede with V_Dprime, q='+q);
    const cxA=(ca.lo+ca.hi)/2, rA=(ca.hi-ca.lo)/2, y=1.0;
    const xOnA=cxA-Math.sqrt(rA*rA-y*y);
    ok(Math.abs(xOnA-0)<2/q*10,'near O the alpha circle is a vertical, q='+q);
  }
}

// ---------- the prism: the red quad raised into a box ----------
for(const a of [0.8,1.8,2.6,3.6,4.6,5.2]){
  const hi=M.clampS(a,99), lo=M.clampS(a,-99), p=M.ptsOf(a), Vv=M.legMeetV(a);
  for(const s of [0,lo*0.6,hi*0.6]){
    for(const k of [0.25,0.5,0.53,1.0,1.2]){
      const tag=' a='+a+' s='+s.toFixed(3)+' k='+k;
      const Ne=(s===0)?p.N:M.NeOf(a,s);
      const X=(s===0)?M.hingeOf(a):M.hingeT(a,s);
      const m1=(s===0)?M.midTop(a):M.m1T(a,s);
      const VD=(s===0)?{x:C/2,y:0}:M.VDof(a,s);
      const top=[p.M,X,Ne,Vv], flr=top.map(t=>M.floorOf(t,k));
      // vertical edges, fixed ratio
      for(let i=0;i<4;i++){
        ok(close(flr[i].x,top[i].x),'vertical edge'+tag+' i='+i);
        ok(close(flr[i].y,-k*top[i].y),'fixed eye ratio'+tag+' i='+i);
      }
      ok(close(Ne.x,C)&&close(Vv.x,C),'N and V share the right edge: face N-V edge-on'+tag);
      // the homology fixes HL: sides still through O and R
      ok(colin(flr[0],flr[1],p.R)<1e-9*Math.max(1,Math.abs(flr[1].y)),'floor side M-X through R'+tag);
      ok(colin(flr[2],flr[3],p.R)<1e-9*Math.max(1,Math.abs(flr[3].y)),'floor side N-V through R'+tag);
      ok(colin(flr[1],flr[2],p.O)<1e-9*Math.max(1,Math.abs(flr[2].y)),'floor side X-N through O'+tag);
      ok(colin(flr[3],flr[0],p.O)<1e-9*Math.max(1,Math.abs(flr[3].y)),'floor side V-M through O'+tag);
      // diagonals to the diagonal VPs; center image to the floor of m1
      ok(colin(flr[1],flr[3],VD)<1e-8*Math.max(1,Math.abs(flr[3].y)),'floor diagonal X-V through V_D'+tag);
      const mf=meet(flr[0],flr[2],flr[1],flr[3]), m1f=M.floorOf(m1,k);
      ok(close(mf.x,m1f.x,1e-7)&&close(mf.y,m1f.y,1e-7*Math.max(1,Math.abs(m1f.y))),'floor diagonals meet at floor(m1)'+tag);
      ok(close(M.crossRatio4h(flr[1].y,flr[3].y,m1f.y,0),-1,1e-7),'floor (X,V;m1,V_D) = -1'+tag);
      if(s!==0){
        const q=M.VDprimeOf(a,s).x;
        ok(colin(flr[0],flr[2],{x:q,y:0})<1e-7*Math.max(1,Math.abs(q))*Math.max(1,Math.abs(flr[2].y)),
          'floor diagonal M-N through V_Dprime'+tag);
        ok(close(M.crossRatio4h(flr[0].x,flr[2].x,m1f.x,q),-1,1e-7),'floor (M,N;m1,V_Dprime) = -1'+tag);
      }
      // the floor is a square from the same station: homography with the same VPs
      const Hf=homographyFrom([
        {u:0,v:0,x:flr[1].x,y:flr[1].y},{u:1,v:1,x:flr[2].x,y:flr[2].y},
        {u:0,v:2,x:flr[3].x,y:flr[3].y},{u:-1,v:1,x:flr[0].x,y:flr[0].y}]);
      const f1=applyH(Hf,1,1,0), f2=applyH(Hf,-1,1,0), f3=applyH(Hf,0,1,0);
      const sc=Math.max(1,Math.abs(flr[3].y));
      ok(Math.abs(f1[0]/f1[2])<1e-5*sc&&Math.abs(f1[1]/f1[2])<1e-5*sc,'floor plan side -> O'+tag);
      ok(close(f2[0]/f2[2],C,1e-5*sc)&&Math.abs(f2[1]/f2[2])<1e-5*sc,'floor plan side -> R'+tag);
      ok(close(f3[0]/f3[2],VD.x,1e-5*sc)&&Math.abs(f3[1]/f3[2])<1e-5*sc,'floor depth diagonal -> V_D'+tag);
      ok(close(M.eyeFraction(k),k/(1+k)),'eye fraction'+tag);
    }
  }
}
// k = 1: the floor is the ceiling's reflection in HL
{
  const p=M.ptsOf(3.6), f=M.floorOf(p.M,1);
  ok(close(f.y,-p.M.y),'k = 1 reflects in HL');
  ok(M.clampK(0)===0.2&&M.clampK(5)===1.2&&M.snapK(0.512)===0.5,'k clamp and snap');
  ok(close(M.eyeFraction(0.53),0.3464,1e-3),'the sketch\u2019s ratio puts the eye near a third of the way up');
}

ok(M.clampA(-1)===0.6&&M.clampA(9)===5.4,'clamp range');
ok(M.snapA(3.6249)===3.6&&M.snapA(3.63)===3.65,'snap to 0.05');
const CFG={W:960,H:1240,ML:50,MR:30,MT:20,XMIN:-0.7,XMAX:6.9,YMAX:6.65};
const s=M.sOf(CFG);
const A0=M.worldToScreen(CFG,0,0), A1=M.worldToScreen(CFG,1,0), A2=M.worldToScreen(CFG,0,1);
ok(close(A1.x-A0.x,s)&&close(A0.y-A2.y,s),'isotropic screen scale');

if(fail){ console.error('FAIL '+fail+'  (pass '+pass+')'); process.exit(1); }
console.log('PASS '+pass+'/'+pass);
