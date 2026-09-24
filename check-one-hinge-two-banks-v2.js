// Smoke checks for one-hinge-two-banks-v2.html — the comparison plate.
// The headline assertion set: the juxtaposed A + B = C and the signed uv-Pythagoras
// on diameter O–M are one theorem, term by term.
'use strict';
const fs=require('fs'), path=require('path'), cp=require('child_process'), os=require('os');

const file=path.join(__dirname,'one-hinge-two-banks-v2.html');
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
  'sOf,worldToScreen,railY,NeOf,VDprimeOf,hingeT,m1T,VDof,SprimeOf,clampS,snapS};')();

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

// station point constants (level rig)
{
  const S={x:3,y:-3};
  ok(close((0-S.x)*(C-S.x)+(0-S.y)*(0-S.y),0),'S sees O and R at 90 degrees');
  ok(close(Math.hypot(S.x-C/2,S.y),C/2),'S on the Thales semicircle below HL');
  ok(close(S.x,C/2),'S\u2019s vertical strikes V_D');
}
ok(M.clampA(-1)===0.6&&M.clampA(9)===5.4,'clamp range');
ok(M.snapA(3.6249)===3.6&&M.snapA(3.63)===3.65,'snap to 0.05');
const CFG={W:960,H:1240,ML:50,MR:30,MT:20,XMIN:-0.7,XMAX:6.9,YMAX:6.65};
const s=M.sOf(CFG);
const A0=M.worldToScreen(CFG,0,0), A1=M.worldToScreen(CFG,1,0), A2=M.worldToScreen(CFG,0,1);
ok(close(A1.x-A0.x,s)&&close(A0.y-A2.y,s),'isotropic screen scale');

if(fail){ console.error('FAIL '+fail+'  (pass '+pass+')'); process.exit(1); }
console.log('PASS '+pass+'/'+pass);
