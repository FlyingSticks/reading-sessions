// Smoke checks for the-hinge-v1.html
// Extracts the [MATH-BEGIN]..[MATH-END] block byte-identically from the shipped file,
// evaluates it, and audits it against independent intersection and area routines.
'use strict';
const fs=require('fs'), path=require('path'), cp=require('child_process'), os=require('os');

const file=path.join(__dirname,'the-hinge-v7.html');
const html=fs.readFileSync(file,'utf8');
let pass=0, fail=0;
function ok(c,msg){ if(c){pass++;} else {fail++; console.error('FAIL  '+msg);} }

// 1. whole inline script parses
const sm=html.match(/<script>([\s\S]*?)<\/script>/);
ok(!!sm,'inline script found');
const tmp=path.join(os.tmpdir(),'the-hinge-inline.js');
fs.writeFileSync(tmp,sm[1]);
try{ cp.execSync('node --check '+JSON.stringify(tmp),{stdio:'pipe'}); pass++; }
catch(e){ fail++; console.error('FAIL  node --check on inline script'); }

// 2. math block, byte-identical to shipped
const mb=html.match(/\/\/ \[MATH-BEGIN\]([\s\S]*?)\/\/ \[MATH-END\]/);
ok(!!mb,'math block found');
const M=new Function(mb[1]+
  '\nreturn {C_TOT,H_TOT,bOf,ptsOf,tHinge,hingeOf,legMeetV,chordAtT,chordLen,hmOf,gmOf,'+
  'amOf,tOfLen,tG,tA,midTop,midBot,shoelace,sliverLeft,sliverRight,sharedB,sliverPrice,'+
  'crossRatio4h,clampA,snapA,sOf,worldToScreen,'+
  'railY,NeOf,VDprimeOf,meet2,hingeT,m1T,VDof,SprimeOf,clampS,snapS};')();

const C=M.C_TOT, H=M.H_TOT;
ok(C===6&&H===3.2,'constants as documented');

// independent intersection of segments PQ and RS (as infinite lines)
function meet(P,Q,R,S){
  const d1={x:Q.x-P.x,y:Q.y-P.y}, d2={x:S.x-R.x,y:S.y-R.y};
  const den=d1.x*d2.y-d1.y*d2.x;
  const t=((R.x-P.x)*d2.y-(R.y-P.y)*d2.x)/den;
  return {x:P.x+t*d1.x, y:P.y+t*d1.y};
}
function dist(P,Q){return Math.hypot(P.x-Q.x,P.y-Q.y);}
function colin(P,Q,R){return Math.abs((Q.x-P.x)*(R.y-P.y)-(R.x-P.x)*(Q.y-P.y));}
function solveLin(A,rhs){
  const n=A.length;
  const Mx=A.map((row,i)=>row.concat([rhs[i]]));
  for(let col=0;col<n;col++){
    let piv=col;
    for(let r=col+1;r<n;r++) if(Math.abs(Mx[r][col])>Math.abs(Mx[piv][col])) piv=r;
    const tmp=Mx[col]; Mx[col]=Mx[piv]; Mx[piv]=tmp;
    for(let r=0;r<n;r++){
      if(r===col) continue;
      const f=Mx[r][col]/Mx[col][col];
      if(f===0) continue;
      for(let cc=col;cc<=n;cc++) Mx[r][cc]-=f*Mx[col][cc];
    }
  }
  return Mx.map((row,i)=>row[n]/row[i]);
}
function pointInTri(P1,P2,P3,T){
  function sgn(A,B){return (B.x-A.x)*(T.y-A.y)-(B.y-A.y)*(T.x-A.x);}
  const s1=sgn(P1,P2), s2=sgn(P2,P3), s3=sgn(P3,P1);
  return (s1>0&&s2>0&&s3>0)||(s1<0&&s2<0&&s3<0);
}
function homographyFrom(pairs){ // four plan (u,v) -> image (x,y) pairs; h33 = 1
  const A=[],rhs=[];
  for(const q of pairs){
    A.push([q.u,q.v,1,0,0,0,-q.x*q.u,-q.x*q.v]); rhs.push(q.x);
    A.push([0,0,0,q.u,q.v,1,-q.y*q.u,-q.y*q.v]); rhs.push(q.y);
  }
  const h=solveLin(A,rhs);
  return [[h[0],h[1],h[2]],[h[3],h[4],h[5]],[h[6],h[7],1]];
}
function applyH(H,u,v,w){
  return [H[0][0]*u+H[0][1]*v+H[0][2]*w,
          H[1][0]*u+H[1][1]*v+H[1][2]*w,
          H[2][0]*u+H[2][1]*v+H[2][2]*w];
}
const EPS=1e-10;
const close=(x,y,e)=>Math.abs(x-y)<=(e||EPS);

// sample the whole legal range plus off-grid randoms
const samples=[];
// station point and horizon constants (independent of the drag)
{
  const S={x:3,y:-3};
  ok(close((0-S.x)*(C-S.x)+(0-S.y)*(0-S.y),0),'S sees O and R at 90 degrees');
  ok(close(Math.hypot(0-S.x,0-S.y),Math.hypot(C-S.x,0-S.y)),'|SO| = |SR|: the 45-45 station');
  ok(close(Math.hypot(S.x-C/2,S.y),C/2),'S on the Thales semicircle below HL');
  ok(close(S.x,C/2),'S\u2019s vertical strikes V_D');
  ok(close((0-C/2)/(C-C/2),-1),'(VP_L, VP_R ; V_D, inf) = -1: midpoint harmonic');
}
for(let a=0.6;a<=5.4001;a+=0.2) samples.push(Math.round(a*100)/100);
let seed=42;
function rnd(){seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;}
for(let i=0;i<24;i++) samples.push(0.6+4.8*rnd());

for(const a of samples){
  const b=M.bOf(a), p=M.ptsOf(a);
  ok(close(a+b,C),'a+b=c at a='+a);

  // hinge = meet of diagonals, independently
  const Xi=meet(p.O,p.N,p.R,p.M);
  const X=M.hingeOf(a);
  ok(close(X.x,Xi.x)&&close(X.y,Xi.y),'hinge = diagonal meet, a='+a);
  ok(close(X.y,H*C/(b+C)),'hinge height c/(b+c), a='+a);

  // diagonals cut in ratio c:b, both diagonals
  ok(close(dist(p.O,X)/dist(X,p.N),C/b,1e-9),'OX:XN = c:b, a='+a);
  ok(close(dist(p.R,X)/dist(X,p.M),C/b,1e-9),'RX:XM = c:b, a='+a);

  // harmonic chord: length, station, midpoint
  const t=M.tHinge(a), ch=M.chordAtT(a,t);
  ok(close(ch.p.y,X.y)&&close(ch.q.y,X.y),'chord level through X, a='+a);
  ok(close(M.chordLen(a,t),M.hmOf(a)),'chord length = HM, a='+a);
  ok(close(dist(ch.p,ch.q),M.hmOf(a)),'euclidean chord length = HM, a='+a);
  ok(close((ch.p.x+ch.q.x)/2,X.x),'X bisects the chord, a='+a);
  ok(close(M.tOfLen(a,M.hmOf(a)),t),'HM station = hinge station, a='+a);
  ok(close(2/M.hmOf(a),1/b+1/C),'reciprocal addition 2/HM = 1/b + 1/c, a='+a);

  // legs are on the chord's endpoints
  ok(colin(p.O,p.M,ch.p)<EPS,'left chord end on leg OM, a='+a);
  ok(close(ch.q.x,C),'right chord end on leg RN, a='+a);

  // means ladder: values, order, stations
  const hm=M.hmOf(a), gm=M.gmOf(a), am=M.amOf(a);
  ok(b<hm&&hm<gm&&gm<am&&am<C,'b < HM < GM < AM < c strict, a='+a);
  ok(close(gm*gm,b*C),'GM squared = bc, a='+a);
  ok(close(am,(b+C)/2),'AM value, a='+a);
  const tg=M.tG(a);
  ok(close(M.chordLen(a,tg),gm),'GM chord at its station, a='+a);
  ok(close(C/gm,gm/b),'similar split c:GM = GM:b, a='+a);
  ok(close(M.chordLen(a,M.tA()),am),'AM chord is the midline, a='+a);
  ok(t>tg&&tg>M.tA(),'stations stack: HM above GM above AM, a='+a);

  // slivers: equal, and priced h·HM/4
  const dl=M.shoelace(...M.sliverLeft(a));
  const dr=M.shoelace(...M.sliverRight(a));
  ok(close(dl,dr,1e-9),'D = D, a='+a);
  ok(close(dl,M.sliverPrice(a),1e-9),'each D = h*HM/4, a='+a);
  // and the b-triangles they certify are equal wholes: shared + sliver
  const sh=M.shoelace(...M.sharedB(a));
  ok(close(sh+dl,0.5*b*H,1e-9),'sliver + shared = half bh, a='+a);

  // witness: V, collinearity, both midpoints, cross-ratio −1
  const V=M.legMeetV(a);
  const Vi=meet(p.O,p.M,p.R,p.N);
  ok(close(V.x,Vi.x)&&close(V.y,Vi.y,1e-8),'V = leg meet, a='+a);
  const m0=M.midBot(), m1=M.midTop(a);
  ok(colin(m0,X,V)<1e-8,'m0, X, V collinear, a='+a);
  ok(colin(m0,m1,V)<1e-8,'m0, m1, V collinear, a='+a);
  ok(colin(m0,m1,X)<1e-8,'m0, m1, X collinear, a='+a);
  const cr=M.crossRatio4h(m1.y,m0.y,X.y,V.y);
  ok(close(cr,-1,1e-9),'(m1, m0; X, V) = -1, a='+a);

  // --- perspective office: M X N V images a square ---
  ok(colin(p.O,p.N,X)<1e-8,'side X-N through VP_L = O, a='+a);
  ok(colin(p.O,p.M,V)<1e-7,'side M-V through VP_L = O, a='+a);
  ok(colin(p.R,p.M,X)<1e-8,'side M-X through VP_R = R, a='+a);
  ok(close(p.N.x,C)&&close(V.x,C)&&close(p.R.x,C),'side N-V through VP_R = R, a='+a);
  ok(close(p.M.y,p.N.y),'diagonal M-N vanishes at infinity (horizontal), a='+a);
  const dmeet=meet(p.M,p.N,X,V);
  ok(close(dmeet.x,m1.x,1e-7)&&close(dmeet.y,m1.y,1e-7),
    'diagonal meet = m1, the image of the center, a='+a);
  // homography from an exact plan square (rotated 45 deg, near corner at origin)
  const Hm=homographyFrom([
    {u:0,v:0,x:X.x,y:X.y},{u:1,v:1,x:p.N.x,y:p.N.y},
    {u:0,v:2,x:V.x,y:V.y},{u:-1,v:1,x:p.M.x,y:p.M.y}]);
  [[0,0,X],[1,1,p.N],[0,2,V],[-1,1,p.M]].forEach(function(pr){
    const im=applyH(Hm,pr[0],pr[1],1);
    ok(Math.abs(im[0]/im[2]-pr[2].x)<1e-6&&Math.abs(im[1]/im[2]-pr[2].y)<1e-6,
      'homography reproduces vertex ('+pr[0]+','+pr[1]+'), a='+a);
  });
  const dS1=applyH(Hm,1,1,0);
  ok(Math.abs(dS1[0]/dS1[2])<1e-6&&Math.abs(dS1[1]/dS1[2])<1e-6,
    'plan side (1,1) vanishes at VP_L = O, a='+a);
  const dS2=applyH(Hm,-1,1,0);
  ok(Math.abs(dS2[0]/dS2[2]-C)<1e-6&&Math.abs(dS2[1]/dS2[2])<1e-6,
    'plan side (-1,1) vanishes at VP_R = R, a='+a);
  const dDep=applyH(Hm,0,1,0);
  ok(Math.abs(dDep[0]/dDep[2]-m0.x)<1e-6&&Math.abs(dDep[1]/dDep[2])<1e-6,
    'plan depth diagonal vanishes at V_D = m0, a='+a);
  const dHor=applyH(Hm,1,0,0);
  ok(Math.abs(dHor[2])<=1e-8*Math.max(1,Math.abs(dHor[0]))&&
     Math.abs(dHor[1])<=1e-8*Math.max(1,Math.abs(dHor[0])),
    'plan cross diagonal vanishes at the ideal point of HL, a='+a);
  const dCen=applyH(Hm,0,1,1);
  ok(Math.abs(dCen[0]/dCen[2]-m1.x)<1e-6&&Math.abs(dCen[1]/dCen[2]-m1.y)<1e-6,
    'plan center images to m1, a='+a);

  // --- label anchors sit inside their regions ---
  ok(pointInTri(p.O,p.L,p.M,{x:a/3,y:1.98}),'label A anchor inside triangle O L M, a='+a);
  const cC={x:(p.O.x+X.x+p.R.x)/3,y:(p.O.y+X.y+p.R.y)/3};
  ok(pointInTri(p.O,X,p.R,cC),'label C anchor inside triangle O X R, a='+a);
  // juxtaposed reading: A, D, B, D, C are five DISJOINT regions tiling the rectangle
  const Aarea=M.shoelace(p.O,p.L,p.M), Bshared=M.shoelace(...M.sharedB(a)),
        Dl=M.shoelace(...M.sliverLeft(a)), Dr=M.shoelace(...M.sliverRight(a)),
        Cjux=M.shoelace(p.O,X,p.R), rect=C*H;
  ok(close(Aarea+Dl+Bshared+Dr+Cjux,rect,1e-9),
    'A + D + B + D + C tile the whole rectangle, a='+a);
  ok(close(Aarea+Dl+Bshared,rect/2,1e-9),'A + D + B = half rectangle, above O-N, a='+a);
  ok(close(Cjux+Dr,rect/2,1e-9),'C + D = half rectangle, below O-N, a='+a);
  ok(close(Aarea+Bshared,Cjux,1e-9),'A + B = C with all regions disjoint, a='+a);
  // the interpretation: classical base-triangles under an apex, overlapping, in agreement
  const Bleft=M.shoelace(p.O,p.M,p.N), Bright=M.shoelace(p.R,p.M,p.N);
  ok(close(Bleft,Bright,1e-9),'the two apex readings of the base-b triangle agree (D = D), a='+a);
  ok(close(Bshared,Bleft-Dl,1e-9),'B (shared) = base-b triangle minus its sliver, a='+a);
  ok(close(M.shoelace(p.O,p.L,p.N),Aarea+Bleft,1e-9),
    'classical reading: triangle O L N = A + base-b triangle, a='+a);
}

// cross-ratio sanity on known quadruples
ok(close(M.crossRatio4h(1,0,1/3,-1),-1),'known harmonic quadruple gives -1');
ok(close(M.crossRatio4h(3,1,2,0),-1/3),'known non-harmonic quadruple');

// clamp and snap
ok(M.clampA(-3)===0.6&&M.clampA(9)===5.4,'clamp range');
ok(M.snapA(3.6249)===3.6&&M.snapA(3.63)===3.65,'snap to 0.05');

// screen map is isotropic (single scale both axes)
const CFG={W:960,H:800,ML:50,MR:30,MT:20,XMIN:-0.75,XMAX:7.0,YMAX:5.95};
const s=M.sOf(CFG);
const A0=M.worldToScreen(CFG,0,0), A1=M.worldToScreen(CFG,1,0), A2=M.worldToScreen(CFG,0,1);
ok(close(A1.x-A0.x,s)&&close(A0.y-A2.y,s),'isotropic screen scale');

// ---------- tilt: the fourth vanishing point ----------
function ang(u){return Math.atan2(u.y,u.x);}
function angdiff(u,v){let d=ang(u)-ang(v);
  while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI; return d;}
for(const a of [0.8,1.6,2.4,3.0,3.6,4.4,5.2]){
  const p=M.ptsOf(a), Vv=M.legMeetV(a);
  const hi=M.clampS(a,99), lo=M.clampS(a,-99);
  ok(hi>0&&lo<0,'tilt range straddles level, a='+a);
  for(const s of [lo*0.9,lo*0.5,lo*0.2,hi*0.2,hi*0.5,hi*0.9]){
    const Ne=M.NeOf(a,s), X=M.hingeT(a,s), m1t=M.m1T(a,s),
          VD=M.VDof(a,s), VDp=M.VDprimeOf(a,s);
    ok(close(Ne.y,M.railY(a,s,C)),'Ne on the rail, a='+a+' s='+s.toFixed(3));
    ok(Math.abs(VDp.y)<EPS&&Math.abs(M.railY(a,s,VDp.x))<1e-9,
      'V_Dprime = rail meets HL, a='+a+' s='+s.toFixed(3));
    ok(VDp.x<-0.14||VDp.x>C+0.14,'V_Dprime outside the base, a='+a+' s='+s.toFixed(3));
    const Xi=meet(p.O,Ne,p.R,p.M);
    ok(close(X.x,Xi.x,1e-9)&&close(X.y,Xi.y,1e-9),'tilted hinge = diagonal meet, a='+a+' s='+s.toFixed(3));
    const mi=meet(p.M,Ne,X,Vv);
    ok(close(m1t.x,mi.x,1e-8)&&close(m1t.y,mi.y,1e-8),'tilted center image, a='+a+' s='+s.toFixed(3));
    ok(Math.abs(VD.y)<1e-9&&colin(X,Vv,VD)<1e-6,'V_D on diagonal X-V and on HL, a='+a+' s='+s.toFixed(3));
    ok(VD.x>0&&VD.x<C,'V_D inside the base, a='+a+' s='+s.toFixed(3));
    // the free harmonic on the horizon
    const p1=VD.x, q1=VDp.x;
    ok(close(M.crossRatio4h(0,C,p1,q1),-1,1e-7),'(VP_L,VP_R;V_D,V_Dprime) = -1, a='+a+' s='+s.toFixed(3));
    ok(close(1/p1+1/q1,2/C,1e-9),'1/OV_D + 1/OV_Dprime = 2/c, a='+a+' s='+s.toFixed(3));
    // both diagonals carry their own -1
    ok(close(M.crossRatio4h(X.y,Vv.y,m1t.y,0),-1,1e-7),'(X,V;m1,V_D) = -1 on diagonal 1, a='+a+' s='+s.toFixed(3));
    ok(close(M.crossRatio4h(a,C,m1t.x,q1),-1,1e-7),'(M,N;m1,V_Dprime) = -1 on diagonal 2, a='+a+' s='+s.toFixed(3));
    // station point at the meet of the two Thales semicircles
    const Sp=M.SprimeOf(p1,q1);
    ok(Sp.y<0,'S below the horizon, a='+a+' s='+s.toFixed(3));
    ok(close(Math.hypot(Sp.x-C/2,Sp.y),C/2,1e-7),'S on the O-R semicircle, a='+a+' s='+s.toFixed(3));
    ok(close(Math.hypot(Sp.x-(p1+q1)/2,Sp.y),Math.abs(q1-p1)/2,1e-6*Math.max(1,Math.abs(q1))),
      'S on the V_D-V_Dprime semicircle, a='+a+' s='+s.toFixed(3));
    ok(Math.abs((0-Sp.x)*(C-Sp.x)+Sp.y*Sp.y)<1e-7,'S sees O, R at 90 deg, a='+a+' s='+s.toFixed(3));
    ok(Math.abs((p1-Sp.x)*(q1-Sp.x)+Sp.y*Sp.y)<1e-6*Math.max(1,Math.abs(q1)),
      'S sees V_D, V_Dprime at 90 deg, a='+a+' s='+s.toFixed(3));
    const rO={x:0-Sp.x,y:-Sp.y}, rR={x:C-Sp.x,y:-Sp.y}, rD={x:p1-Sp.x,y:-Sp.y};
    ok(close(Math.abs(angdiff(rO,rD)),Math.abs(angdiff(rD,rR)),1e-6),
      'S-V_D bisects the angle O-S-R, a='+a+' s='+s.toFixed(3));
    // homography: the plan square, all four vanishing points finite
    const Hm=homographyFrom([
      {u:0,v:0,x:X.x,y:X.y},{u:1,v:1,x:Ne.x,y:Ne.y},
      {u:0,v:2,x:Vv.x,y:Vv.y},{u:-1,v:1,x:p.M.x,y:p.M.y}]);
    const d1=applyH(Hm,1,1,0), d2=applyH(Hm,-1,1,0),
          d3=applyH(Hm,0,1,0), d4=applyH(Hm,1,0,0), d5=applyH(Hm,0,1,1);
    ok(Math.abs(d1[0]/d1[2])<1e-5&&Math.abs(d1[1]/d1[2])<1e-5,'side (1,1) -> O, tilted, a='+a+' s='+s.toFixed(3));
    ok(close(d2[0]/d2[2],C,1e-5)&&Math.abs(d2[1]/d2[2])<1e-5,'side (-1,1) -> R, tilted, a='+a+' s='+s.toFixed(3));
    ok(close(d3[0]/d3[2],p1,1e-5)&&Math.abs(d3[1]/d3[2])<1e-5,'depth diagonal -> V_D, tilted, a='+a+' s='+s.toFixed(3));
    ok(close(d4[0]/d4[2],q1,1e-4*Math.max(1,Math.abs(q1)))&&
       Math.abs(d4[1]/d4[2])<1e-4*Math.max(1,Math.abs(q1)),
      'cross diagonal -> V_Dprime, finite at last, a='+a+' s='+s.toFixed(3));
    ok(close(d5[0]/d5[2],m1t.x,1e-6)&&close(d5[1]/d5[2],m1t.y,1e-6),'plan center -> m1, tilted, a='+a+' s='+s.toFixed(3));
  }
  // level reduction
  ok(close(M.hingeT(a,0).x,M.hingeOf(a).x,1e-9)&&close(M.hingeT(a,0).y,M.hingeOf(a).y,1e-9),
    'hingeT reduces to hingeOf at s=0, a='+a);
  const VD0=M.VDof(a,0);
  ok(close(VD0.x,3,1e-9)&&Math.abs(VD0.y)<1e-9,'V_D at m0 when level, a='+a);
  const m10=M.m1T(a,0);
  ok(close(m10.x,M.midTop(a).x,1e-9)&&close(m10.y,M.midTop(a).y,1e-9),
    'center image at the midpoint when level, a='+a);
}
ok(M.snapS(0.01)===0&&M.snapS(0.032)===0.03,'snapS behavior');
ok(M.clampS(3.6,99)>0&&M.clampS(3.6,-99)<0,'clampS bounds');

if(fail){ console.error('FAIL '+fail+'  (pass '+pass+')'); process.exit(1); }
console.log('PASS '+pass+'/'+pass);
