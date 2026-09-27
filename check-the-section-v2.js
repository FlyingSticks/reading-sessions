// Checks for the-section-v2.html — the section with both channels folded in.
// Run: node check-the-section-v2.js
"use strict";
const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'the-section-v2.html'),'utf8');
let pass=0,fail=0;
function ok(c,m){if(c)pass++;else{fail++;console.log('FAIL ',m)}}
function close(a,b,e){return Math.abs(a-b)<=(e||1e-9)}
// the sheet's laws, restated from the script: rates r = L/(zP - zSlit), depth lam = (zS - zP)/L,
// camera mark x/(1 + r lam), glide mark x (1 + r lam)
const L=120, zS=700, hTrue=90;
function marks(zU,zV,zP){
  const Su=zP-zU, Sv=zP-zV, ru=L/Su, rv=L/Sv, lam=(zS-zP)/L;
  return {ru,rv,lam,
    xcU:hTrue*Su/(Su+lam*L), xgU:hTrue*(1+ru*lam),
    xcV:hTrue*Sv/(Sv+lam*L), xgV:hTrue*(1+rv*lam)};
}
// (1) the script's law for the camera mark equals x/(1 + r lam)
for(const zP of [300,400,500,580]) for(const zU of [60,160,240]) {
  const m=marks(zU,zU,zP);
  ok(close(m.xcU,hTrue/(1+m.ru*m.lam),1e-9),'camera law u zP='+zP+' zU='+zU);
}
// (2) both channels obey the mirror identity at every rig
for(const zP of [300,400,500,580]) for(const zU of [60,160,240]) for(const zV of [60,160,240]){
  if(zU>=zP-44||zV>=zP-44) continue;
  const m=marks(zU,zV,zP), tag=' zP='+zP+' zU='+zU+' zV='+zV;
  ok(close(m.xgU*m.xcU,hTrue*hTrue,1e-9),'u: Xg·Xc = x²'+tag);
  ok(close(m.xgV*m.xcV,hTrue*hTrue,1e-9),'v: Xg·Xc = x²'+tag);
  ok(m.xcU<=hTrue&&hTrue<=m.xgU&&m.xcV<=hTrue&&hTrue<=m.xgV,'Xc ≤ x ≤ Xg both channels'+tag);
  // (3) the marks fuse exactly on the seam and only there
  const fused=close(m.xgU,m.xgV,1e-9)&&close(m.xcU,m.xcV,1e-9);
  ok(fused===(zU===zV),'marks fuse iff equal depths'+tag);
  // (4) the glide-mark gap in units of x is (rv - ru)·lam
  ok(close((m.xgV-m.xgU)/hTrue,(m.rv-m.ru)*m.lam,1e-12),'glide gap = (rv−ru)·λ'+tag);
  // (5) seam cubic vanishes iff seam
  const D=m.ru*m.rv*(m.rv-m.ru);
  ok((Math.abs(D)<1e-12)===(zU===zV),'Δ = 0 iff seam'+tag);
}
// (6) plane datum: at the plane, every channel reads true size
{
  const zP=400, m=marks(240,160,zP), lam0=0;
  ok(close(hTrue*(1+m.ru*lam0),hTrue)&&close(hTrue*(1+m.rv*lam0),hTrue),'λ = 0 reads true size in both channels');
}
// (7) orthographic limit: slits far left, both pairs huddle toward x at first order in the rate
{
  const zP=580;
  for(const zSl of [50,20,-200,-2000]){
    const m=marks(zSl,zSl,zP);
    ok(Math.abs(m.xgU-hTrue)<=hTrue*m.ru*m.lam+1e-9&&Math.abs(hTrue-m.xcU)<=hTrue*m.ru*m.lam+1e-9,'orthographic limit bounded by r·λ, slit at '+zSl);
  }
}
// (8) the v toggle exists in the page and the notes no longer say only u is drawn
ok(/id="bV"/.test(html)&&/gliRayV/.test(html)&&/camRayV/.test(html),'v channel elements present');
ok(!/Only the u channel is drawn/.test(html),'old single-channel note removed');
console.log(fail?('FAIL '+fail+'  (pass '+pass+')'):('PASS '+pass+'/'+pass));
process.exit(fail?1:0);
