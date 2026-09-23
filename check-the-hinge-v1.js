// Smoke checks for the-hinge-v1.html
// Extracts the [MATH-BEGIN]..[MATH-END] block byte-identically from the shipped file,
// evaluates it, and audits it against independent intersection and area routines.
'use strict';
const fs=require('fs'), path=require('path'), cp=require('child_process'), os=require('os');

const file=path.join(__dirname,'the-hinge-v1.html');
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
  'crossRatio4h,clampA,snapA,sOf,worldToScreen};')();

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
const EPS=1e-10;
const close=(x,y,e)=>Math.abs(x-y)<=(e||EPS);

// sample the whole legal range plus off-grid randoms
const samples=[];
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

if(fail){ console.error('FAIL '+fail+'  (pass '+pass+')'); process.exit(1); }
console.log('PASS '+pass+'/'+pass);
