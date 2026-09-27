// Checks for the-cylinder-v1.html. Run: node check-the-cylinder-v1.js
"use strict";
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'the-cylinder-v1.html'),'utf8');
const mb=html.match(/\/\/ \[MATH-BEGIN\]([\s\S]*?)\/\/ \[MATH-END\]/);
const M=new Function(mb[1]+'return {rateOf,camAxes,gliAxes,axisRatio,seamCubic,deepRatio,isCone};')();
let pass=0,fail=0; function ok(c,m){if(c)pass++;else{fail++;console.log('FAIL ',m)}}
function close(a,b,e){return Math.abs(a-b)<=(e||1e-9)}
const rho=60, lams=[0,0.5,1,1.5,2,2.5,3,10,100];
const rigs=[];
for(const zP of [300,400,500,580]) for(const zU of [40,160,240]) for(const zV of [40,160,240]) if(zU<zP-44&&zV<zP-44) rigs.push({zP,zU,zV});
for(const rg of rigs){
  const ru=M.rateOf(120,rg.zP,rg.zU), rv=M.rateOf(120,rg.zP,rg.zV), tag=' zP='+rg.zP+' zU='+rg.zU+' zV='+rg.zV;
  const seam=rg.zU===rg.zV;
  for(const lam of lams){
    const c=M.camAxes(rho,ru,rv,lam), g=M.gliAxes(rho,ru,rv,lam);
    ok(close(c.a*g.a,rho*rho,1e-9)&&close(c.b*g.b,rho*rho,1e-9),'inverse ellipses'+tag+' λ='+lam);
    ok(c.a<=rho+1e-12&&c.b<=rho+1e-12&&g.a>=rho-1e-12&&g.b>=rho-1e-12,'camera inside, glide outside'+tag+' λ='+lam);
    const circ=close(c.a,c.b,1e-9)&&close(g.a,g.b,1e-9);
    ok(circ===(seam||lam===0),'circle iff seam or λ = 0'+tag+' λ='+lam);
    ok(close(M.axisRatio(ru,rv,lam),c.b/c.a)&&close(1/M.axisRatio(ru,rv,lam),g.b/g.a,1e-9),'ratio formula'+tag+' λ='+lam);
  }
  ok(close(M.axisRatio(ru,rv,0),1),'plane always a circle'+tag);
  // monotone in λ off the seam, flat on it
  let prev=M.axisRatio(ru,rv,0), mono=true, flat=true;
  for(let k=1;k<=40;k++){const r=M.axisRatio(ru,rv,k*0.25); if(ru>rv){ if(r<prev-1e-12) mono=false; } else if(ru<rv){ if(r>prev+1e-12) mono=false; } if(Math.abs(r-1)>1e-12) flat=false; prev=r;}
  ok(mono,'ratio monotone in depth'+tag);
  ok(flat===seam,'ratio flat iff seam'+tag);
  ok(close(M.axisRatio(ru,rv,1e9),M.deepRatio(ru,rv),1e-6),'deep limit r_u/r_v'+tag);
  ok(M.isCone(ru,rv,[0,0.5,1,2,3],1e-12)===seam,'cone test passes iff seam'+tag);
  ok((Math.abs(M.seamCubic(ru,rv))<1e-12)===seam,'Δ = 0 iff seam'+tag);
}
// pushbroom: v slit receding, r_v → 0: the up axis stops shrinking
{
  const zP=400, ru=M.rateOf(120,zP,240);
  for(const zV of [-1000,-1e5,-1e7]){
    const rv=M.rateOf(120,zP,zV), c=M.camAxes(rho,ru,rv,3);
    ok(Math.abs(c.b-rho)<rho*rv*3+1e-9,'pushbroom: up axis within r_v·λ of ρ, zV='+zV);
    ok(c.a<rho*0.5,'pushbroom: across axis still shrinks, zV='+zV);
  }
}
// pinhole (seam) is a cone: the camera radius falls as 1/(1+rλ), similar sections
{
  const ru=0.5, rv=0.5;
  for(const lam of [0.5,1,2,3]){ const c=M.camAxes(rho,ru,rv,lam); ok(close(c.a,rho/(1+ru*lam))&&close(c.a,c.b),'seam: circle radius ρ/(1+rλ), λ='+lam); }
}
console.log(fail?('FAIL '+fail+'  (pass '+pass+')'):('PASS '+pass+'/'+pass));
process.exit(fail?1:0);
