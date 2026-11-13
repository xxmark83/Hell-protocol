// Mortal Bullet: lebka z častíc s horiacimi očami (od 3.60). Znak hry: úvodné video, načítanie, hlavné menu.
// Ten istý tvar ako na úvodnej stránke (landing/app.js), tu ako malý samostatný modul bez závislostí.
// MBSkull.run(canvas,{place,alpha,n,fadeY,still}) spustí animáciu (iskry sa zlejú do lebky), vráti {stop()}.
//   place(W,H) vráti [stredX, stredY, veľkosť] v bodoch plátna; fadeY(W,H) = od tejto výšky nadol lebka mizne (0 = nemizne).
(function(){
'use strict';
const TAU=Math.PI*2,BONE=0,RED=1,BRONZE=2,INK=['236,226,208','255,74,36','217,161,90'];
function build(N){
  let seed=20261113;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const w=400,h=460,c2=document.createElement('canvas');c2.width=w;c2.height=h;const c=c2.getContext('2d',{willReadFrequently:true});
  const eye=x=>{c.beginPath();c.ellipse(x,196,40,46,x<200?-.18:.18,0,TAU);c.fill();};
  c.fillStyle='#00f';c.beginPath();c.ellipse(200,180,160,168,0,0,TAU);c.fill();
  c.beginPath();c.moveTo(92,280);c.lineTo(308,280);c.lineTo(286,420);c.quadraticCurveTo(200,446,114,420);c.closePath();c.fill();
  c.globalCompositeOperation='destination-out';eye(130);eye(270);
  c.beginPath();c.moveTo(200,248);c.lineTo(224,306);c.lineTo(176,306);c.closePath();c.fill();
  for(let x=140;x<=260;x+=30)c.fillRect(x-3,352,6,80);c.fillRect(118,344,164,7);
  const d=c.getImageData(0,0,w,h).data,px=[];let x0=w,x1=0,y0=h,y1=0;
  for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){if(d[(y*w+x)*4+3]<128)continue;px.push(x,y);if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  const cx=(x0+x1)/2,cy=(y0+y1)/2,half=Math.max(x1-x0,y1-y0)/2||1;
  const p=new Float32Array(N*3),col=new Uint8Array(N),hot=new Uint8Array(N),stiff=new Float32Array(N),size=new Float32Array(N),phase=new Float32Array(N),pos=new Float32Array(N*3),vel=new Float32Array(N*3);
  for(let i=0;i<N;i++){const k=i*3;
    if(rnd()<.16){const s=rnd()<.5?-1:1,a=rnd()*TAU,r=Math.sqrt(rnd())*.12;p[k]=s*.31+r*Math.cos(a);p[k+1]=-.13+r*Math.sin(a)*1.1;p[k+2]=-.12+rnd()*.1;col[i]=rnd()<.25?BRONZE:RED;hot[i]=1;}
    else{const q=(px.length/2*rnd()|0)*2,ox=(px[q]+rnd()*2-cx)/half,oy=(px[q+1]+rnd()*2-cy)/half,dd=Math.hypot(ox,oy+.2),dome=Math.sqrt(Math.max(0,1-dd*dd*.9));p[k]=ox*.9;p[k+1]=oy*.9;p[k+2]=-dome*.42+(rnd()-.5)*.1;col[i]=rnd()<.07?RED:rnd()<.1?BRONZE:BONE;}
    stiff[i]=.014+rnd()*.034;size[i]=1.15+rnd()*rnd()*4.4;phase[i]=rnd();pos[k]=(rnd()*2-1)*3.4;pos[k+1]=(rnd()*2-1)*2.4;pos[k+2]=(rnd()*2-1)*2;}
  return {N,p,col,hot,stiff,size,phase,pos,vel};
}
let glow=null;
function glows(){return glow||(glow=INK.map(c=>{const g=document.createElement('canvas');g.width=g.height=64;const x=g.getContext('2d'),r=x.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba('+c+',.85)');r.addColorStop(.25,'rgba('+c+',.26)');r.addColorStop(1,'rgba('+c+',0)');x.fillStyle=r;x.fillRect(0,0,64,64);return g;}));}
function run(cv,o){o=o||{};const ctx=cv.getContext('2d');if(!ctx)return {stop(){}};
  const small=Math.min(innerWidth,innerHeight)<600,P=build(o.n||(small?1400:2400)),G=glows(),A=o.alpha==null?1:o.alpha;
  let W=0,H=0,cx=0,cy=0,S=100,fy=0,on=true,turn=0,raf=0;
  let fw=0,fh=0;/* od 3.62: posledná známa veľkosť plátna; keď sa zmení (otočenie telefónu), plátno sa prepočíta, inak by sa lebka roztiahla */
  const fit=()=>{const r=cv.getBoundingClientRect(),D=Math.min(devicePixelRatio||1,2);W=r.width||cv.clientWidth||300;H=r.height||cv.clientHeight||300;fw=cv.clientWidth;fh=cv.clientHeight;cv.width=Math.round(W*D);cv.height=Math.round(H*D);ctx.setTransform(D,0,0,D,0,0);const q=(o.place||((w,h)=>[w/2,h*.47,Math.min(w,h)*.46]))(W,H);cx=q[0];cy=q[1];S=q[2];fy=o.fadeY?o.fadeY(W,H):0;};
  if(o.still){for(let i=0;i<P.N*3;i++)P.pos[i]=P.p[i];}
  const draw=t=>{if(cv.clientWidth!==fw||cv.clientHeight!==fh)fit();/* veľkosť sa overí pri každom kreslení */const T=t*.001,p=P.p,C=P.col,Hh=P.hot,pos=P.pos,vel=P.vel,cs=Math.cos(turn),sn=Math.sin(turn);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.clearRect(0,0,W,H);
    for(let b=0;b<3;b++){ctx.fillStyle='rgb('+INK[b]+')';for(let i=0;i<P.N;i++){if(C[i]!==b)continue;const k=i*3;let tx=p[k],ty=p[k+1],fade=1;
      if(Hh[i]){const f=(T*(.22+P.stiff[i]*6)+P.phase[i])%1;ty-=f*.2;tx+=Math.sin(T*3+P.phase[i]*TAU)*.012;fade=1-f;}
      vel[k]=(vel[k]+(tx-pos[k])*P.stiff[i])*.86;vel[k+1]=(vel[k+1]+(ty-pos[k+1])*P.stiff[i])*.86;vel[k+2]=(vel[k+2]+(p[k+2]-pos[k+2])*P.stiff[i])*.86;pos[k]+=vel[k];pos[k+1]+=vel[k+1];pos[k+2]+=vel[k+2];
      const x=pos[k],z=pos[k+2],xr=x*cs+z*sn,zr=z*cs-x*sn,pe=1/(1+zr*.35),sx=cx+xr*S*pe,sy=cy+pos[k+1]*S*pe,sz=Math.max(1,P.size[i]*pe*(S/260)*(Hh[i]?.9+fade*.8:1)),tw=.55+.45*Math.sin(T*2.2+P.phase[i]*TAU);
      let a=A*(Hh[i]?fade:(.62+.38*tw))*Math.min(1,pe);if(fy&&sy>fy)a*=Math.max(0,1-(sy-fy)/(H*.1));if(a<=.01)continue;ctx.globalAlpha=a;ctx.fillRect(sx-sz*.5,sy-sz*.5,sz,sz);}}
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<P.N;i+=2){const b=C[i];if(!(Hh[i]||(b!==BONE&&P.size[i]>2.2)))continue;const k=i*3,x=pos[k],z=pos[k+2],xr=x*cs+z*sn,zr=z*cs-x*sn,pe=1/(1+zr*.35),g=P.size[i]*(Hh[i]?9:6)*pe*(S/260),sy=cy+pos[k+1]*S*pe;if(fy&&sy>fy)continue;ctx.globalAlpha=A*(Hh[i]?.5:.28);ctx.drawImage(G[b],cx+xr*S*pe-g*.5,sy-g*.5,g,g);}};
  const tick=t=>{if(!on)return;turn+=(Math.sin(t*.00045)*(o.sway==null?.22:o.sway)-turn)*.05;draw(t);raf=requestAnimationFrame(tick);};
  const stl=matchMedia('(prefers-reduced-motion: reduce)').matches;fit();const rs=()=>{fit();if(stl)draw(0);setTimeout(()=>{fit();if(stl)draw(0);},250);};addEventListener('resize',rs);addEventListener('orientationchange',rs);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){for(let i=0;i<P.N*3;i++)P.pos[i]=P.p[i];draw(0);}else raf=requestAnimationFrame(tick);
  const me={stop(){on=false;cancelAnimationFrame(raf);removeEventListener('resize',rs);removeEventListener('orientationchange',rs);const i=live.indexOf(me);if(i>=0)live.splice(i,1);},draw,fit};live.push(me);return me;
}
const live=[];/* bežiace lebky (pre skúšky: MBSkull.live[i].draw(t) nakreslí jednu snímku) */
/* od 3.62: body lebky pre hru (3D aj 2D nepriateľ). p = [x,y,z] v rozsahu asi −1 až 1 (y rastie nadol), col 0 kosť / 1 červená / 2 bronz, hot 1 = iskra v oku */
function points(N){const P=build(N);return {N,p:P.p,col:P.col,hot:P.hot,size:P.size,phase:P.phase,stiff:P.stiff};}
window.MBSkull={run,live,points,INK};
})();
