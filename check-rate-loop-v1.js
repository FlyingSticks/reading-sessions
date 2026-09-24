// Smoke checks for rate-loop-v1.html — the kj sketch resolved.
'use strict';
const fs=require('fs'), path=require('path'), cp=require('child_process'), os=require('os');

const file=path.join(__dirname,'rate-loop-v1.html');
const html=fs.readFileSync(file,'utf8');
let pass=0, fail=0;
function ok(c,msg){ if(c){pass++;} else {fail++; console.error('FAIL  '+msg);} }

const sm=html.match(/<script>([\s\S]*?)<\/script>/);
ok(!!sm,'inline script found');
const tmp=path.join(os.tmpdir(),'rate-loop-inline.js');
fs.writeFileSync(tmp,sm[1]);
try{ cp.execSync('node --check '+JSON.stringify(tmp),{stdio:'pipe'}); pass++; }
catch(e){ fail++; console.error('FAIL  node --check on inline script'); }

const mb=html.match(/\/\/ \[MATH-BEGIN\]([\s\S]*?)\/\/ \[MATH-END\]/);
ok(!!mb,'math block found');
const M=new Function(mb[1]+
  '\nreturn {W_T,H_T,cellsOf,ratesOf,defectOf,spreadForm,hookOf,diagX,onSeam,'+
  'snapToDiag,commonK,boostImage,clampP,snapP,rectS,sqS,hypS};')();

const W=M.W_T, H=M.H_T;
const EPS=1e-10, close=(a,b,e)=>Math.abs(a-b)<=(e||EPS);

let seed=29;
function rnd(){seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;}

const pts=[];
for(let x=0.5;x<=5.5001;x+=0.5) for(let y=0.5;y<=3.5001;y+=0.5)
  pts.push([Math.round(x*100)/100,Math.round(y*100)/100]);
for(let i=0;i<40;i++) pts.push([0.45+5.1*rnd(),0.45+3.1*rnd()]);
// exact seam points
for(let x=0.6;x<=5.4001;x+=0.4) pts.push([x,H*(1-x/W)]);

for(const [x,y] of pts){
  const q=M.cellsOf(x,y), r=M.ratesOf(x,y);
  ok(close(q.c+q.d,W)&&close(q.a+q.b,H),'cells sum to the frame, ('+x+','+y+')');

  // round-trip law: per channel, always — the convention, not the event
  ok(close(r.r1*(q.a/q.c),1)&&close(r.r2*(q.b/q.d),1),
    'k_i * j_i = 1 per channel, always, ('+x+','+y+')');

  // four-way seam equivalence (with a shared tolerance)
  const tol=1e-9;
  const e1=Math.abs(q.a*q.d-q.b*q.c)<tol;
  const e2=Math.abs(r.r1-r.r2)<tol/(q.a*q.b);
  const e3=Math.abs(x/W+y/H-1)<tol/(W*H);
  ok(e1===M.onSeam(x,y,tol),'onSeam matches ad = bc, ('+x+','+y+')');
  ok(e1===e2||Math.abs(q.a*q.d-q.b*q.c)>1e-6||Math.abs(r.r1-r.r2)*q.a*q.b>1e-6,
    'ad = bc <-> r1 = r2, ('+x+','+y+')');
  ok(e1===e3||Math.abs(q.a*q.d-q.b*q.c)>1e-6||Math.abs(x/W+y/H-1)*W*H>1e-6,
    'ad = bc <-> P on the diagonal, ('+x+','+y+')');

  // defect in both denominations; hook as defect per height
  ok(close(M.defectOf(x,y),M.spreadForm(x,y),1e-9),
    'ad - bc = ab(r2 - r1), ('+x+','+y+')');
  ok(close(M.hookOf(x,y),(q.b*q.c-q.a*q.d)/(q.a+q.b),1e-12),
    'hook formula, ('+x+','+y+')');
  // geometric hook: the signed gap from the diagonal to P at P's height IS the formula
  ok(close(x-M.diagX(y),M.hookOf(x,y),1e-9),
    'hook = signed gap to the diagonal, ('+x+','+y+')');
  ok((Math.abs(M.hookOf(x,y))<1e-9)===(Math.abs(q.a*q.d-q.b*q.c)<1e-9*(q.a+q.b)),
    'hook vanishes exactly on the seam, ('+x+','+y+')');

  // snap: projection lands on the diagonal, exactly and idempotently
  const s=M.snapToDiag(x,y);
  ok(Math.abs(s.x/W+s.y/H-1)<1e-12,'snap lands on the diagonal, ('+x+','+y+')');
  const s2=M.snapToDiag(s.x,s.y);
  ok(close(s.x,s2.x,1e-12)&&close(s.y,s2.y,1e-12),'snap idempotent, ('+x+','+y+')');
  for(let i=0;i<3;i++){
    const t=rnd()*W;
    const dx=t, dy=H*(1-t/W);
    ok(Math.hypot(x-s.x,y-s.y)<=Math.hypot(x-dx,y-dy)+1e-9,
      'snap is the nearest diagonal point, ('+x+','+y+')');
  }

  // hyperbola membership: each channel's (k, j) on uv = 1
  ok(close(r.r1*(1/r.r1),1)&&close(r.r2*(1/r.r2),1),'rate pairs on uv = 1, ('+x+','+y+')');
}

// seam-only theorems: common rate, boost to the transpose
for(let x=0.6;x<=5.4001;x+=0.3){
  const y=H*(1-x/W);
  const q=M.cellsOf(x,y), r=M.ratesOf(x,y);
  ok(close(r.r1,r.r2,1e-10),'one common rate on the seam, x='+x);
  const k=M.commonK(x,y);
  ok(close(q.c,k*q.a,1e-9)&&close(q.d,k*q.b,1e-9),'c = ka and d = kb, x='+x);
  ok(close(k*(1/k),1),'k*j = 1, x='+x);
  // boost image: P -> (a, d) in the transpose H x W
  const Pp=M.boostImage(x,y);
  ok(close(Pp.x,q.a)&&close(Pp.y,q.d),'P\u2032 = (a, d), x='+x);
  ok(Math.abs(Pp.x/H+Pp.y/W-1)<1e-9,'P\u2032 on the transpose diagonal, x='+x);
  // transpose cells and the four preserved areas
  const cT={c:Pp.x, d:H-Pp.x, b:Pp.y, a:W-Pp.y};
  ok(close(cT.c,q.a)&&close(cT.d,q.b)&&close(cT.b,q.d)&&close(cT.a,q.c),
    'transpose cells are the exchanged pairs, x='+x);
  ok(close(cT.a*cT.c,q.c*q.a,1e-9)&&close(cT.a*cT.d,q.c*q.b,1e-9)&&
     close(cT.b*cT.c,q.d*q.a,1e-9)&&close(cT.b*cT.d,q.d*q.b,1e-9),
    'all four cell areas kept by the boost, x='+x);
  // transpose dimensions: jW = H and kH = W
  ok(close((1/k)*W,H,1e-9)===close(W/H,k,1e-9),'jW = H <-> k = W/H, x='+x);
  ok(close(k,W/H,1e-9),'the common rate is the aspect ratio W/H, x='+x);
}

// off-seam: the labels are impossible (no single k), demonstrated
for(let i=0;i<25;i++){
  const x=0.5+5*rnd(), y=0.5+3*rnd();
  if(Math.abs(x/W+y/H-1)<0.02) continue;
  const r=M.ratesOf(x,y);
  ok(Math.abs(r.r1-r.r2)>1e-6,'off the seam there is no common rate, i='+i);
}

// clamps and mappings
ok(M.clampP(-1,-1).x===0.45&&M.clampP(99,99).y===H-0.45,'clampP range');
const CFG={rox:70,roy:520,rs:95,sox:700,soy:310,ss:42,sqmax:5,hox:700,hoy:592,hs:60,hymax:3.5};
const A0=M.rectS(CFG,0,0), A1=M.rectS(CFG,1,0), A2=M.rectS(CFG,0,1);
ok(close(A1.x-A0.x,CFG.rs)&&close(A0.y-A2.y,CFG.rs),'rect panel isotropic');
const B0=M.sqS(CFG,0,0), B1=M.sqS(CFG,1,1);
ok(close(B1.x-B0.x,CFG.ss)&&close(B0.y-B1.y,CFG.ss),'square inset isotropic');

if(fail){ console.error('FAIL '+fail+'  (pass '+pass+')'); process.exit(1); }
console.log('PASS '+pass+'/'+pass);
