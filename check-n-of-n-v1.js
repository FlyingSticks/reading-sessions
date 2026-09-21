// Smoke checks for n-of-n-v1.html
// Extracts the [MATH-BEGIN]..[MATH-END] block byte-identically from the shipped file,
// evaluates it, and audits it against an independent line-intersection routine.
'use strict';
const fs=require('fs'), path=require('path'), cp=require('child_process'), os=require('os');

const file=path.join(__dirname,'n-of-n-v1.html');
const html=fs.readFileSync(file,'utf8');
let pass=0, fail=0;
function ok(c,msg){ if(c){pass++;} else {fail++; console.error('FAIL  '+msg);} }

// 1. whole inline script parses
const sm=html.match(/<script>([\s\S]*?)<\/script>/);
ok(!!sm,'inline script found');
const tmp=path.join(os.tmpdir(),'n-of-n-inline.js');
fs.writeFileSync(tmp,sm[1]);
try{ cp.execSync('node --check '+JSON.stringify(tmp),{stdio:'pipe'}); pass++; }
catch(e){ fail++; console.error('FAIL  node --check on inline script'); }

// 2. math block, byte-identical to shipped
const mb=html.match(/\/\/ \[MATH-BEGIN\]([\s\S]*?)\/\/ \[MATH-END\]/);
ok(!!mb,'math block found');
const M=new Function(mb[1]+
  '\nreturn {gcd,freeY,projectorMeet,fineOnFree,shiftOf,climbOf,turnDir,transferTop,'+
  'ratioBA,fineX,addressOf,markOf,snapM,nextY,nextCut,sxOf,syOf,worldToScreen};')();

// independent intersection: p + t*dp meets q + u*dq
function meet(p,dp,q,dq){
  const den=dp.x*dq.y-dp.y*dq.x;
  const t=((q.x-p.x)*dq.y-(q.y-p.y)*dq.x)/den;
  return {x:p.x+t*dp.x, y:p.y+t*dp.y};
}
const CFG={W:960,H:880,ML:64,MR:36,MT:24,MB:46,XPAD:0.35,XEXTRA:0.75,Y0:-0.34,Y1:1.66};
const EPS=1e-12;
const close=(a,b,e)=>Math.abs(a-b)<=(e||EPS);

for(let n=2;n<=5;n++){
  ok(close(M.freeY(n),1/n),'freeY n='+n);
  ok(close(M.nextY(n),1/(n*n)),'nextY n='+n);

  // projector: vertical through mark 1 meets outer ray at height 1/n — forced, not chosen
  const pm=meet({x:1,y:0},{x:0,y:1},{x:0,y:0},{x:n,y:1});
  ok(close(pm.x,1)&&close(pm.y,1/n),'projector meet (independent) n='+n);
  const pf=M.projectorMeet(n);
  ok(close(pf.x,pm.x)&&close(pf.y,pm.y),'projectorMeet agrees n='+n);

  // pencil double duty: ray j cuts the free horizontal at j/n, the next level at j/n²
  for(let j=0;j<=n;j++){
    const f=M.fineOnFree(n,j);
    ok(close(f.x,j/n)&&close(f.y,1/n),'fineOnFree j='+j+' n='+n);
    if(j>=1){
      const c=meet({x:0,y:0},{x:j,y:1},{x:0,y:1/n},{x:1,y:0});
      ok(close(c.x,j/n)&&close(c.y,1/n),'ray '+j+' cuts free line at its own division, n='+n);
      const c2=meet({x:0,y:0},{x:j,y:1},{x:0,y:1/(n*n)},{x:1,y:0});
      ok(close(c2.x,j/(n*n)),'ray '+j+' cuts next level, n='+n);
      const nc=M.nextCut(n,j);
      ok(close(nc.x,c2.x)&&close(nc.y,1/(n*n)),'nextCut agrees j='+j+' n='+n);
    }
  }

  // turn families: parallel within family, land on the top line, marks rational m/n
  const seen=new Map();
  for(let k=1;k<=n;k++){
    const d=M.turnDir(n,k);
    for(let j=0;j<=n;j++){
      const a=M.fineOnFree(n,j), b=M.transferTop(n,k,j);
      ok(close(b.y,1),'lands on top k='+k+' j='+j+' n='+n);
      ok(Math.abs((b.x-a.x)*d.dy-(b.y-a.y)*d.dx)<=EPS,'parallel k='+k+' j='+j+' n='+n);
      const key=Math.round(b.x*n);
      ok(close(b.x,key/n),'fine mark rational k='+k+' j='+j+' n='+n);
      ok(key===M.markOf(n,k-1,j),'markOf agrees k='+k+' j='+j+' n='+n);
      seen.set(key,(seen.get(key)||0)+1);
    }
    // family Tk's last transfer line lands on coarse mark k
    ok(close(M.transferTop(n,k,n).x,k),'T'+k+' closes on coarse mark '+k+', n='+n);
    // screen-space parallelism survives the anisotropic map
    const A0=M.worldToScreen(CFG,n,M.fineOnFree(n,0).x,M.fineOnFree(n,0).y);
    const B0=M.worldToScreen(CFG,n,M.transferTop(n,k,0).x,1);
    const A1=M.worldToScreen(CFG,n,M.fineOnFree(n,n).x,M.fineOnFree(n,n).y);
    const B1=M.worldToScreen(CFG,n,M.transferTop(n,k,n).x,1);
    if(k===1){
      ok(Math.abs(B0.x-A0.x)<1e-9&&Math.abs(B1.x-A1.x)<1e-9,'T1 vertical on screen n='+n);
    }else{
      const s0=(B0.y-A0.y)/(B0.x-A0.x), s1=(B1.y-A1.y)/(B1.x-A1.x);
      ok(close(s0,s1,1e-9),'screen slopes equal in T'+k+' n='+n);
    }
    // ratio B:A = n(k−1) : (n−1), reduced
    const r=M.ratioBA(n,k);
    ok(M.gcd(r.p,r.q)===1,'ratio reduced k='+k+' n='+n);
    ok(r.p*(n-1)===r.q*n*(k-1),'ratio value k='+k+' n='+n);
  }
  ok(seen.size===n*n+1,'distinct fine marks = n²+1, n='+n);
  let doubles=0;
  for(const [key,c] of seen){ ok(c<=2,'multiplicity ≤2 at key='+key+' n='+n); if(c===2)doubles++; }
  ok(doubles===n-1,'exactly n−1 carry (shared) marks, n='+n);

  // addresses round-trip; snap behaves
  for(let m=0;m<=n*n;m++){
    const ad=M.addressOf(n,m);
    ok(ad.k*n+ad.j===m,'address roundtrip m='+m+' n='+n);
    ok(close(M.fineX(n,m),m/n),'fineX m='+m+' n='+n);
    ok(M.snapM(n,m/n+0.33/n)===Math.min(m,n*n),'snap +ε m='+m+' n='+n);
    ok(M.snapM(n,m/n-0.33/n)===m,'snap −ε m='+m+' n='+n);
  }
  ok(M.snapM(n,-99)===0&&M.snapM(n,99)===n*n,'snap clamps n='+n);
}

if(fail){ console.error('FAIL '+fail+'  (pass '+pass+')'); process.exit(1); }
console.log('PASS '+pass+'/'+pass);
