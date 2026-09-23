// Smoke checks for vi31-for-uv-v1.html — the settlement plate.
// Extracts the [MATH-BEGIN]..[MATH-END] block byte-identically from the shipped file,
// evaluates it, and audits every claim in the reading against independent routines.
'use strict';
const fs=require('fs'), path=require('path'), cp=require('child_process'), os=require('os');

const file=path.join(__dirname,'vi31-for-uv-v1.html');
const html=fs.readFileSync(file,'utf8');
let pass=0, fail=0;
function ok(c,msg){ if(c){pass++;} else {fail++; console.error('FAIL  '+msg);} }

// 1. whole inline script parses
const sm=html.match(/<script>([\s\S]*?)<\/script>/);
ok(!!sm,'inline script found');
const tmp=path.join(os.tmpdir(),'vi31-inline.js');
fs.writeFileSync(tmp,sm[1]);
try{ cp.execSync('node --check '+JSON.stringify(tmp),{stdio:'pipe'}); pass++; }
catch(e){ fail++; console.error('FAIL  node --check on inline script'); }

// 2. math block, byte-identical to shipped
const mb=html.match(/\/\/ \[MATH-BEGIN\]([\s\S]*?)\/\/ \[MATH-END\]/);
ok(!!mb,'math block found');
const M=new Function(mb[1]+
  '\nreturn {BMIN,BMAX,tOf,P2of,Pof,Qv,pairQ,vsub,hyperY,hyperVal,centerOf,footF,tauOf,'+
  'QOB,QOP2,QP2B,areaOAB,areaBPD,areaOP2,slopeMag,Bprime,shoelace3,clampB,snapB,'+
  'sOf,worldToScreen};')();

// independent tools
function meet(P,Q,R,S){
  const d1={x:Q.x-P.x,y:Q.y-P.y}, d2={x:S.x-R.x,y:S.y-R.y};
  const den=d1.x*d2.y-d1.y*d2.x;
  const t=((R.x-P.x)*d2.y-(R.y-P.y)*d2.x)/den;
  return {x:P.x+t*d1.x, y:P.y+t*d1.y};
}
function colin(P,Q,R){return Math.abs((Q.x-P.x)*(R.y-P.y)-(R.x-P.x)*(Q.y-P.y));}
const EPS=1e-10;
const close=(x,y,e)=>Math.abs(x-y)<=(e||EPS);

const O={x:0,y:0}, A={x:0,y:1}, D={x:2,y:1}, C2={x:2,y:0};

const samples=[];
for(let bb=0.25;bb<=1.7501;bb+=0.05) samples.push(Math.round(bb*100)/100);
let seed=7;
function rnd(){seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;}
for(let i=0;i<24;i++) samples.push(0.25+1.5*rnd());

for(const b of samples){
  const B={x:b,y:1}, t=M.tOf(b), P2=M.P2of(b), P=M.Pof(b), F=M.footF(b);
  ok(t>0&&t<1,'t in (0,1), b='+b);

  // --- the Minkowski circle on diameter OB ---
  // membership: O, B, P2 on 2xy - x - by = 0
  ok(close(M.hyperVal(b,O),0),'O on hyperbola, b='+b);
  ok(close(M.hyperVal(b,B),0),'B on hyperbola, b='+b);
  ok(close(M.hyperVal(b,P2),0),'P2 on hyperbola, b='+b);
  // it IS the Thales locus: random points on the curve are Q-right at the apex
  for(let k=0;k<6;k++){
    const x= (k<3)? (b/2)*rnd()*0.9-0.3 : b/2+0.05+2.4*rnd();
    if(Math.abs(2*x-b)<1e-3) continue;
    const E={x:x,y:M.hyperY(b,x)};
    ok(close(M.pairQ(M.vsub(E,O),M.vsub(E,B)),0,1e-9),
      'Thales: (E-O) Q-perp (E-B) on curve, b='+b);
  }
  // conversely a non-curve point fails
  const Ebad={x:1.5,y:M.hyperY(b,1.5)+0.1};
  ok(Math.abs(M.pairQ(M.vsub(Ebad,O),M.vsub(Ebad,B)))>1e-6,
    'off-curve point is not Q-right, b='+b);
  // center = midpoint of OB, asymptotes null: y -> 1/2 as x -> inf, pole at x=b/2
  const c=M.centerOf(b);
  ok(close(c.x,b/2)&&close(c.y,0.5),'center = mid OB, b='+b);
  ok(close(M.hyperY(b,1e7),0.5,1e-6),'horizontal asymptote y=1/2, b='+b);
  // unique crossing of the right edge x=2, at the hinge height
  ok(close(M.hyperY(b,2),t),'right-edge crossing at height t, b='+b);
  // uniqueness on the right edge: hyperVal(2,y) is linear in y with nonzero slope
  ok(Math.abs(M.hyperVal(b,{x:2,y:t+0.1}))>1e-6&&Math.abs(M.hyperVal(b,{x:2,y:t-0.1}))>1e-6,
    'right-edge crossing unique, b='+b);

  // --- the certified right angle and its mirror reading ---
  ok(close(M.pairQ(M.vsub(P2,O),M.vsub(B,P2)),0),'<OP2, P2B> = 0 identically, b='+b);
  const s1=(P2.y-O.y)/(P2.x-O.x), s2=(B.y-P2.y)/(B.x-P2.x);
  ok(close(s1,M.slopeMag(b))&&close(s2,-M.slopeMag(b)),
    'slopes are +-1/(4-b): mirror law, b='+b);

  // --- signed Pythagoras ---
  ok(close(M.QOP2(b),M.Qv(M.vsub(P2,O))),'Q(OP2) formula, b='+b);
  ok(close(M.QP2B(b),M.Qv(M.vsub(B,P2))),'Q(P2B) formula, b='+b);
  ok(M.QOP2(b)>0&&M.QP2B(b)<0,'legs of opposite type, b='+b);
  ok(close(M.QOP2(b)+M.QP2B(b),M.QOB(b)),'Q(OP2)+Q(P2B)=Q(OB), b='+b);

  // --- squares into triangles ---
  // half-square on OB is OAB verbatim
  ok(close(M.shoelace3(O,A,B),0.5*M.QOB(b)),'OAB = half-square on OB, b='+b);
  // half-square on OP2 is O-P2-2corner; on P2B is B-D-P2 (its rectangle owns D)
  ok(close(M.shoelace3(O,P2,C2),0.5*M.QOP2(b)),'O P2 2 = half-square on OP2, b='+b);
  ok(close(M.shoelace3(B,D,P2),0.5*Math.abs(M.QP2B(b))),'B D P2 = half-square on P2B, b='+b);
  // rectangle on P2B has corners exactly {(b,t),(2,t),(2,1),(b,1)}: B and D among them
  ok(close(P2.x,2)&&close(P2.y,t)&&close(D.x,2)&&close(D.y,1)&&close(B.y,1),
    'square on P2B owns corners B and D, b='+b);
  // null shear: apexes P2 and P share the rail y=t; areas carried exactly
  ok(close(P2.y,P.y),'P2 and P on one null rail, b='+b);
  ok(close(M.shoelace3(O,P,C2),M.shoelace3(O,P2,C2)),'I.37 carries OP2, b='+b);
  ok(close(M.shoelace3(B,P,D),M.shoelace3(B,D,P2)),'I.37 carries BPD, b='+b);
  // the unsigned identity, and its equality with the shipped area functions
  ok(close(M.areaOAB(b),M.shoelace3(O,A,B)),'areaOAB shoelace, b='+b);
  ok(close(M.areaBPD(b),M.shoelace3(B,P,D)),'areaBPD shoelace, b='+b);
  ok(close(M.areaOP2(b),M.shoelace3(O,P,C2)),'areaOP2 shoelace, b='+b);
  ok(close(M.areaOAB(b)+M.areaBPD(b),M.areaOP2(b)),'OAB + BPD = OP2, b='+b);

  // --- the hinge, three offices ---
  const Pi=meet(B,C2,O,D);
  ok(close(Pi.x,P.x)&&close(Pi.y,P.y),'P = B2 meet OD, b='+b);
  ok(close(P2.y,P.y)&&close(F.x,P.x),'P is the null corner: P2->P horizontal, P->F vertical, b='+b);
  ok(colin(O,B,F)<1e-9,'F on the hypotenuse line OB, b='+b);
  // F is the Q-perpendicular foot: (P2-F) Q-perp OB
  ok(close(M.pairQ(M.vsub(P2,F),M.vsub(B,O)),0,1e-9),'P2F Q-perp OB, b='+b);
  // Euclid's lemma in Q: foot fraction = Q(OP2)/Q(OB)
  ok(close(M.tauOf(b),M.QOP2(b)/M.QOB(b)),'foot fraction = Q(OP2)/Q(OB), b='+b);
  ok(close(F.x,M.tauOf(b)*b)&&close(F.y,M.tauOf(b)),'F = tau*(b,1), b='+b);
  // Q-geometric-mean relation, negative as the reading claims
  const QPF=M.Qv(M.vsub(F,P2));
  ok(close(QPF,M.QOP2(b)*M.QP2B(b)/M.QOB(b),1e-9),'Q(P2F)=Q(OP2)Q(P2B)/Q(OB), b='+b);
  ok(QPF<0,'altitude of opposite type, b='+b);

  // --- upstairs, for the mirrored certificate ---
  const Bp=M.Bprime(b);
  ok(close((Bp.x-1)*(Bp.x-1)+(Bp.y-1)*(Bp.y-1),1),'B\u2032 on the circle, b='+b);
  const AB2=(Bp.x-A.x)**2+(Bp.y-A.y)**2, BD2=(D.x-Bp.x)**2+(D.y-Bp.y)**2;
  ok(close(AB2+BD2,4,1e-9),'AB\u20322 + B\u2032D2 = AD2, b='+b);
  ok(close((Bp.y-1)**2,b*(2-b),1e-9),'BB\u2032 = sqrt(AB*BD), b='+b);
}

// clamp, snap, screen map
ok(M.clampB(-1)===M.BMIN&&M.clampB(9)===M.BMAX,'clamp range');
ok(M.snapB(1.024)===1.0&&M.snapB(1.026)===1.05,'snap to 0.05');
const CFG={W:960,H:790,ML:46,MR:30,MT:20,XMIN:-0.55,XMAX:2.6,YMAX:2.15};
const s=M.sOf(CFG);
const A0=M.worldToScreen(CFG,0,0), A1=M.worldToScreen(CFG,1,0), A2=M.worldToScreen(CFG,0,1);
ok(close(A1.x-A0.x,s)&&close(A0.y-A2.y,s),'isotropic screen scale');

if(fail){ console.error('FAIL '+fail+'  (pass '+pass+')'); process.exit(1); }
console.log('PASS '+pass+'/'+pass);
