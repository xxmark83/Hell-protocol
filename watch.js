// Mortal Bullet · prototyp 2D hry pre Apple Watch (vetva watch-proto). Beží v prehliadači v ráme hodiniek.
// Zámer: overiť čitateľnosť na malom displeji a ovládanie korunkou a dotykom, skôr než sa hra prepíše do Swiftu (SpriteKit).
// Kreslí sa tak, ako by sa kreslilo na hodinkách: všetky postavy a pozadie sú vopred vykreslené obrázky (ako atlas textúr v SpriteKite),
// každá snímka je len skladanie obrázkov, žiadne filtre ani rozmazanie celej obrazovky. Merač ráta ťahy (drawImage) a častice.
(function(){
'use strict';
const $=id=>document.getElementById(id),TAU=Math.PI*2,cv=$('scr'),ctx=cv.getContext('2d',{alpha:false});
const clamp=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a=1,b)=>b==null?Math.random()*a:a+Math.random()*(b-a);
let W=416,H=496,S=1,G=0,WW=0,Q='w',CAP=60,PERF=true;

// ---------- pomocné kreslenie do obrázkov (atlas) ----------
const mk=(w,h,f)=>{const c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);const x=c.getContext('2d');f(x,c.width,c.height);return c;};
const white=src=>mk(src.width,src.height,(x)=>{x.drawImage(src,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#fff';x.fillRect(0,0,src.width,src.height);});
const glowC={};const glow=col=>glowC[col]||(glowC[col]=mk(64,64,(x)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,col);g.addColorStop(.35,col.replace(/[\d.]+\)$/,'.45)'));g.addColorStop(1,col.replace(/[\d.]+\)$/,'0)'));x.fillStyle=g;x.fillRect(0,0,64,64);}));
const C={fire:'rgba(255,140,50,1)',red:'rgba(255,60,30,1)',green:'rgba(90,255,110,1)',white:'rgba(255,240,220,1)',bronze:'rgba(217,161,90,1)',blood:'rgba(200,20,30,1)'};
let A={};// atlas

function buildAtlas(){
  const s=S;A={};
  // hrdina Kaelthor: brnenie, plášť, štít Grahlkor, brokovnica; pozerá doprava, nohy na spodku obrázka
  A.hero=mk(70*s,104*s,(x,w,h)=>{x.scale(s,s);
    x.fillStyle='#3a0d0c';x.beginPath();x.moveTo(22,30);x.quadraticCurveTo(6,70,12,100);x.lineTo(34,98);x.lineTo(34,34);x.fill();// plášť
    x.fillStyle='#1d1c22';x.fillRect(24,66,9,36);x.fillRect(36,66,9,36);// nohy
    x.fillStyle='#2c2b33';x.fillRect(22,96,13,7);x.fillRect(35,96,13,7);
    const gb=x.createLinearGradient(20,30,50,70);gb.addColorStop(0,'#55535e');gb.addColorStop(1,'#202027');x.fillStyle=gb;
    x.beginPath();x.moveTo(20,34);x.lineTo(50,34);x.lineTo(47,70);x.lineTo(23,70);x.closePath();x.fill();// trup
    x.strokeStyle='#b07a3a';x.lineWidth=2;x.beginPath();x.moveTo(22,50);x.lineTo(48,50);x.stroke();x.beginPath();x.moveTo(35,36);x.lineTo(35,68);x.stroke();
    x.fillStyle='#3b3a44';x.beginPath();x.arc(35,22,12,0,TAU);x.fill();// prilba
    x.fillStyle='#1a1a20';x.fillRect(23,20,24,6);x.fillStyle='#ff5a2a';x.fillRect(36,22,10,2);// hľadí
    x.fillStyle='#55535e';x.beginPath();x.moveTo(35,8);x.lineTo(39,0);x.lineTo(41,10);x.fill();
    x.fillStyle='#2a2930';x.fillRect(44,44,24,6);x.fillStyle='#6a4a2a';x.fillRect(40,46,10,9);x.fillStyle='#8a8a92';x.fillRect(58,43,10,3);// brokovnica
    const sg=x.createRadialGradient(18,52,2,18,52,17);sg.addColorStop(0,'#c99350');sg.addColorStop(.7,'#7a5126');sg.addColorStop(1,'#3a2410');x.fillStyle=sg;x.beginPath();x.ellipse(18,54,11,17,0,0,TAU);x.fill();// štít
    x.strokeStyle='#ffd27a';x.lineWidth=1.2;x.beginPath();x.moveTo(18,44);x.lineTo(18,64);x.moveTo(13,50);x.lineTo(23,58);x.stroke();});
  A.heroW=white(A.hero);
  // imp: zhrbený démon s rohmi a pazúrmi
  A.imp=mk(64*s,72*s,(x)=>{x.scale(s,s);
    const g=x.createLinearGradient(0,10,0,72);g.addColorStop(0,'#8a2a14');g.addColorStop(1,'#3a0e08');x.fillStyle=g;
    x.beginPath();x.moveTo(18,70);x.lineTo(22,44);x.quadraticCurveTo(14,24,30,16);x.quadraticCurveTo(48,12,48,34);x.lineTo(46,48);x.lineTo(50,70);x.lineTo(40,70);x.lineTo(36,52);x.lineTo(30,52);x.lineTo(28,70);x.closePath();x.fill();
    x.fillStyle='#d8c7a0';x.beginPath();x.moveTo(30,18);x.quadraticCurveTo(22,4,16,6);x.quadraticCurveTo(24,10,26,20);x.fill();x.beginPath();x.moveTo(42,18);x.quadraticCurveTo(48,4,56,6);x.quadraticCurveTo(48,10,46,22);x.fill();
    x.fillStyle='#6a1a0c';x.beginPath();x.moveTo(46,34);x.lineTo(62,40);x.lineTo(58,44);x.lineTo(62,48);x.lineTo(46,44);x.fill();// pazúr
    x.strokeStyle='#ff7a20';x.lineWidth=1;x.beginPath();x.moveTo(26,30);x.lineTo(32,42);x.lineTo(28,50);x.stroke();
    x.fillStyle='#ffd040';x.fillRect(38,24,6,3);});
  A.impW=white(A.imp);
  // pľuvač: nafúknuté telo, zelené ústa
  A.spit=mk(80*s,86*s,(x)=>{x.scale(s,s);
    const g=x.createRadialGradient(38,48,6,38,50,36);g.addColorStop(0,'#6a7a24');g.addColorStop(1,'#26300c');x.fillStyle=g;x.beginPath();x.ellipse(38,52,32,30,0,0,TAU);x.fill();
    x.fillStyle='#2a320e';x.fillRect(22,74,10,12);x.fillRect(44,74,10,12);
    x.fillStyle='#3a1008';x.beginPath();x.ellipse(60,44,10,8,0,0,TAU);x.fill();x.fillStyle='#9aff6a';x.beginPath();x.ellipse(63,44,5,4,0,0,TAU);x.fill();
    x.fillStyle='#d6e05a';for(const [a,b] of [[24,34],[34,28],[44,32],[28,62],[50,60]]){x.beginPath();x.arc(a,b,3,0,TAU);x.fill();}
    x.fillStyle='#ffd040';x.fillRect(50,30,6,3);});
  A.spitW=white(A.spit);
  // kolos: veľký rohatý démon s pancierom a lávovými prasklinami
  A.brute=mk(130*s,150*s,(x)=>{x.scale(s,s);
    const g=x.createLinearGradient(0,20,0,150);g.addColorStop(0,'#3a2a26');g.addColorStop(1,'#140c0a');x.fillStyle=g;
    x.beginPath();x.moveTo(30,150);x.lineTo(36,96);x.quadraticCurveTo(14,60,40,34);x.quadraticCurveTo(66,18,94,34);x.quadraticCurveTo(116,60,96,96);x.lineTo(102,150);x.lineTo(80,150);x.lineTo(72,110);x.lineTo(60,110);x.lineTo(52,150);x.closePath();x.fill();
    x.fillStyle='#cfc0a0';x.beginPath();x.moveTo(44,34);x.quadraticCurveTo(24,10,12,14);x.quadraticCurveTo(30,22,36,42);x.fill();x.beginPath();x.moveTo(90,34);x.quadraticCurveTo(110,10,122,14);x.quadraticCurveTo(104,22,98,42);x.fill();
    x.strokeStyle='#ff6a18';x.lineWidth=2;x.beginPath();x.moveTo(50,60);x.lineTo(62,80);x.lineTo(56,100);x.moveTo(84,58);x.lineTo(76,78);x.lineTo(84,96);x.stroke();
    x.fillStyle='#5a4a42';x.fillRect(42,66,50,8);x.fillStyle='#ffd040';x.fillRect(72,44,10,4);x.fillRect(56,44,8,4);});
  A.bruteW=white(A.brute);
  // lebka: tie isté body ako znak hry (skull.js), vypečené do obrázka; druhá verzia s rozžeravenými očami (náznak náletu)
  const sk=(hot)=>mk(64*s,72*s,(x,w,h)=>{const D=window.MBSkull&&MBSkull.points?MBSkull.points(700):null;x.fillStyle='rgba(20,10,8,.85)';x.beginPath();x.ellipse(w/2,h*.46,w*.4,h*.4,0,0,TAU);x.fill();
    if(!D){x.fillStyle='#d8ccb0';x.beginPath();x.arc(w/2,h*.42,w*.36,0,TAU);x.fill();return;}
    for(let i=0;i<D.N;i++){const px=w/2+D.p[i*3]*w*.42,py=h*.47+D.p[i*3+1]*h*.42;if(D.hot[i]){const k=hot?1.6:1;x.fillStyle=hot?'rgba(255,220,140,.9)':'rgba(255,90,30,.85)';x.fillRect(px-1.2*k*s,py-1.2*k*s,2.4*k*s,2.4*k*s);}else{x.fillStyle=D.col[i]===2?'#c9934f':'#e2d6be';const z=Math.max(1,D.size[i]*.55*s);x.fillRect(px,py,z,z);}}});
  A.skull=sk(0);A.skullHot=sk(1);A.skullW=white(A.skull);
  // zelená strela, kvapka zdravia
  A.orb=mk(20*s,20*s,(x,w)=>{const g=x.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);g.addColorStop(0,'#eaffe0');g.addColorStop(.4,'#5aff6e');g.addColorStop(1,'rgba(40,200,60,0)');x.fillStyle=g;x.fillRect(0,0,w,w);});
  A.heart=mk(18*s,18*s,(x,w)=>{x.fillStyle='#ff2a3a';x.beginPath();x.moveTo(w/2,w*.85);x.bezierCurveTo(0,w*.5,w*.1,w*.05,w/2,w*.3);x.bezierCurveTo(w*.9,w*.05,w,w*.5,w/2,w*.85);x.fill();});
  buildBg();
}

// ---------- pozadie: Brána pekla (vzdialené oblúky, stĺpy, brána s portálom, zem s lávovými prasklinami) ----------
let BGF=null,BGM=null,DEC=null,DX=null,DEC0=null;const braz=[];
function buildBg(){const s=S;
  BGF=mk(W*1.6,G,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#090404');g.addColorStop(.6,'#2a0b07');g.addColorStop(1,'#4a1308');x.fillStyle=g;x.fillRect(0,0,w,h);
    x.fillStyle='#120706';for(let i=0;i<9;i++){const bx=i*w/8-20*s,bw=70*s,top=h*.25+((i*37)%5)*8*s;x.beginPath();x.moveTo(bx,h);x.lineTo(bx,top+bw*.5);x.quadraticCurveTo(bx+bw/2,top-bw*.4,bx+bw,top+bw*.5);x.lineTo(bx+bw,h);x.fill();
      x.fillStyle='rgba(255,90,30,.12)';x.fillRect(bx+bw*.38,top+bw*.4,bw*.24,bw*.9);x.fillStyle='#120706';}});
  BGM=mk(WW,G,(x,w,h)=>{const cx=w/2;
    for(let px=60*s;px<w;px+=150*s){if(Math.abs(px-cx)<120*s)continue;const g=x.createLinearGradient(px,0,px+34*s,0);g.addColorStop(0,'#1c1412');g.addColorStop(.5,'#3a2c26');g.addColorStop(1,'#140e0c');x.fillStyle=g;x.fillRect(px,h*.18,34*s,h*.82);
      x.fillStyle='#8a5a26';x.fillRect(px-3*s,h*.42,40*s,4*s);x.fillRect(px-3*s,h*.7,40*s,4*s);x.fillStyle='#24140f';x.fillRect(px-8*s,h*.15,50*s,12*s);}
    // brána
    x.fillStyle='#160c0a';x.beginPath();x.moveTo(cx-110*s,h);x.lineTo(cx-110*s,h*.35);x.quadraticCurveTo(cx,h*.02,cx+110*s,h*.35);x.lineTo(cx+110*s,h);x.fill();
    const pg=x.createRadialGradient(cx,h*.62,10*s,cx,h*.62,90*s);pg.addColorStop(0,'#ffb060');pg.addColorStop(.35,'#d0300c');pg.addColorStop(1,'#2a0604');x.fillStyle=pg;
    x.beginPath();x.moveTo(cx-78*s,h);x.lineTo(cx-78*s,h*.42);x.quadraticCurveTo(cx,h*.14,cx+78*s,h*.42);x.lineTo(cx+78*s,h);x.fill();
    x.strokeStyle='#b07a3a';x.lineWidth=4*s;x.beginPath();x.moveTo(cx-96*s,h);x.lineTo(cx-96*s,h*.38);x.quadraticCurveTo(cx,h*.08,cx+96*s,h*.38);x.lineTo(cx+96*s,h);x.stroke();
    x.fillStyle='#ffd27a';x.font=`bold ${12*s}px serif`;x.textAlign='center';for(let i=0;i<7;i++){const a=Math.PI*(.15+i*.7/6);x.fillText('ᚠᚢᚦᚨᚱᚲᚷ'[i],cx-Math.cos(a)*86*s,h*.38-Math.sin(a)*58*s);}});
  braz.length=0;for(let px=60*s;px<WW;px+=150*s){if(Math.abs(px-WW/2)<120*s)continue;braz.push(px+17*s);}
  DEC=mk(WW,H-G+4*s,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#2a1a14');g.addColorStop(1,'#0c0605');x.fillStyle=g;x.fillRect(0,0,w,h);
    x.strokeStyle='#ff5a14';x.lineWidth=1.5*s;x.globalAlpha=.75;for(let i=0;i<w/40;i++){let px=rnd(w),py=rnd(4*s,h);x.beginPath();x.moveTo(px,py);for(let k=0;k<4;k++){px+=rnd(-14,14)*s;py+=rnd(-6,6)*s;x.lineTo(px,clamp(py,2,h));}x.stroke();}
    x.globalAlpha=1;x.fillStyle='#3a2a22';x.fillRect(0,0,w,3*s);});
  DX=DEC.getContext('2d');DEC0=null;}

// ---------- stav hry ----------
let P,E,B,PT,POP,cam,score,combo,comboT,wave,waveT,spawnQ,shake,hitstop,slow,over,hint,t0,flashR;
function reset(){P={x:WW/2,y:0,vy:0,face:1,hp:100,inv:0,cd:0,shield:false,blockT:9,dash:0,dashD:0,dashCd:0,chg:0,chgCd:0,flash:0,muz:0,kick:0,stun:0};
  E=[];B=[];PT=[];POP=[];cam=WW/2-W/2;score=0;combo=0;comboT=0;wave=0;waveT=1.5;spawnQ=[];shake=0;hitstop=0;slow=0;over=false;hint=7;flashR=0;if(DX)DX.drawImage(buildDecClean(),0,0);}
const buildDecClean=()=>DEC0||(DEC0=mk(DEC.width,DEC.height,(x)=>x.drawImage(DEC,0,0)));

const ED={imp:{hp:30,sp:72,r:18,h:72,sc:100,spr:'imp'},spit:{hp:60,sp:46,r:24,h:86,sc:150,spr:'spit'},skull:{hp:25,sp:90,r:18,h:72,sc:170,spr:'skull',fly:1},brute:{hp:320,sp:34,r:44,h:150,sc:600,spr:'brute'}};
function spawn(t){const d=ED[t],side=Math.random()<.5?-1:1;let x;const r=Math.random();if(t==='skull'){x=clamp(P.x+side*rnd(140,220)*S,40*S,WW-40*S);}else if(r<.35){x=WW/2+rnd(-50,50)*S;}else x=side<0?30*S:WW-30*S;
  const e={t,d,x,y:d.fly?-120*S:0,hp:d.hp,max:d.hp,cd:1+rnd(1.2),ph:null,pt:0,face:1,flash:0,stun:0,kx:0,bob:rnd(TAU),spawnT:.6,fy:0};E.push(e);ring(e.x,G-6*S,t==='skull'?C.fire:C.red,1.2);burst(e.x,G-30*S,10,C.fire,160,.6,1);}
function nextWave(){wave++;const n=2+wave,q=[];for(let i=0;i<n;i++)q.push('imp');for(let i=0;i<Math.floor(wave/2);i++)q.push('spit');for(let i=0;i<Math.floor((wave+1)/3);i++)q.push('skull');if(wave%4===0)q.push('brute');
  for(let i=q.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[q[i],q[j]]=[q[j],q[i]];}spawnQ=q.map((t,i)=>({t,at:.4+i*.65}));pop('VLNA '+wave,W/2,H*.36,'#ffd27a',1.6,20);}

// ---------- častice (rozpočet podľa kvality) ----------
const PMAX=()=>Q==='w'?140:450;
function part(o){if(PT.length>=PMAX())PT.shift();PT.push(o);}
function burst(x,y,n,col,sp,life,sz,add=1){n=Q==='w'?Math.ceil(n*.55):n;for(let i=0;i<n;i++){const a=rnd(TAU),v=rnd(.3,1)*sp*S;part({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(40)*S,g:420*S,t:life*rnd(.6,1),t0:life,s:(sz||1)*rnd(.7,1.3)*S,col,add});}}
function blood(x,y,n,dir){n=Q==='w'?Math.ceil(n*.5):n;for(let i=0;i<n;i++){const a=-Math.PI/2+rnd(-1.1,1.1)+dir*.5,v=rnd(80,260)*S;part({x,y,vx:Math.cos(a)*v+dir*60*S,vy:Math.sin(a)*v,g:700*S,t:rnd(.5,.9),t0:.9,s:rnd(1.5,3)*S,col:'#a01018',add:0,bl:1});}}
function ring(x,y,col,life){part({x,y,vx:0,vy:0,g:0,t:life*.5,t0:life*.5,s:1,col,add:1,ring:1});}
function pop(txt,x,y,col,life=1,size=14){POP.push({txt,x,y,col,t:life,t0:life,size});}

// ---------- ovládanie: korunka, dotyk, klávesy ----------
const crown={rate:0,keys:0,ang:0};const crownEl=$('crown'),watch=$('watch');
watch.addEventListener('wheel',e=>{e.preventDefault();crown.rate=clamp(crown.rate+e.deltaY*.012,-6,6);},{passive:false});
{let cy=null;crownEl.addEventListener('pointerdown',e=>{cy=e.clientY;crownEl.setPointerCapture(e.pointerId);e.stopPropagation();});crownEl.addEventListener('pointermove',e=>{if(cy==null)return;crown.rate=clamp(crown.rate+(e.clientY-cy)*.08,-6,6);cy=e.clientY;});crownEl.addEventListener('pointerup',()=>cy=null);}
const touch={id:null,x0:0,y0:0,t0:0,sw:false};
cv.addEventListener('pointerdown',e=>{e.preventDefault();if(over){reset();return;}touch.id=e.pointerId;touch.x0=e.clientX;touch.y0=e.clientY;touch.t0=performance.now();touch.sw=false;cv.setPointerCapture(e.pointerId);});
cv.addEventListener('pointermove',e=>{if(e.pointerId!==touch.id||touch.sw||P.shield)return;const dx=e.clientX-touch.x0,dy=e.clientY-touch.y0,th=cv.getBoundingClientRect().width*.09;if(Math.hypot(dx,dy)>th){touch.sw=true;if(Math.abs(dx)>Math.abs(dy))dash(Math.sign(dx));else if(dy<0)charge();}});
cv.addEventListener('pointerup',e=>{if(e.pointerId!==touch.id)return;touch.id=null;if(P.shield){P.shield=false;return;}if(!touch.sw&&performance.now()-touch.t0<200)shoot();});
cv.addEventListener('pointercancel',()=>{touch.id=null;P.shield=false;});
const K={};addEventListener('keydown',e=>{if(e.repeat)return;K[e.code]=1;if(over&&(e.code==='Space'||e.code==='Enter')){reset();return;}if(e.code==='Space'){e.preventDefault();shoot();}if(e.code==='ShiftLeft'||e.code==='ShiftRight')raise();if(e.code==='KeyA')dash(-1);if(e.code==='KeyD')dash(1);if(e.code==='KeyW')charge();});
addEventListener('keyup',e=>{K[e.code]=0;if(e.code==='ShiftLeft'||e.code==='ShiftRight')P.shield=false;});
function raise(){if(P.dash>0||P.chg>0||over)return;if(!P.shield){P.shield=true;P.blockT=0;}}

// ---------- boj ----------
function nearest(maxD){let b=null,bd=maxD;for(const e of E){if(e.hp<=0||e.spawnT>0)continue;const d=Math.abs(e.x-P.x)+(e.d.fly?Math.max(0,-e.y-60*S)*.3:0);if(d<bd){bd=d;b=e;}}return b;}
function shoot(){if(over||P.cd>0||P.shield||P.dash>0)return;P.cd=.42;P.muz=.07;P.kick=1;shake=Math.max(shake,2*S);const tg=nearest(W*.85);if(tg)P.face=Math.sign(tg.x-P.x)||P.face;
  const gx=P.x+P.face*30*S,gy=G-50*S;part({x:gx,y:gy,vx:0,vy:0,g:0,t:.06,t0:.06,s:2.2*S,col:C.fire,add:1,flashp:1});
  if(!tg){for(let i=0;i<5;i++)part({x:gx,y:gy,tx:gx+P.face*W*.5,ty:gy+rnd(-30,30)*S,t:.07,t0:.07,trc:1,col:'#ffd890',add:1,vx:0,vy:0,g:0,s:1});return;}
  const d=Math.abs(tg.x-P.x),dmg=clamp(36-d/(W*.85)*24,12,36)*(tg.t==='brute'?.75:1),ty=G+tg.y-tg.d.h*.55*S;
  for(let i=0;i<6;i++)part({x:gx,y:gy,tx:tg.x+rnd(-10,10)*S,ty:ty+rnd(-14,14)*S,t:.07,t0:.07,trc:1,col:'#ffd890',add:1,vx:0,vy:0,g:0,s:1});
  hit(tg,dmg,P.face);}
function hit(e,dmg,dir){if(e.hp<=0)return;e.hp-=dmg;e.flash=.08;e.kx+=dir*(e.t==='brute'?40:160)*S;const ty=G+e.y-e.d.h*.55*S;
  if(e.t==='skull')burst(e.x,ty,8,C.white,160,.4,1.2);else{blood(e.x,ty,7,dir);if(e.t==='brute')burst(e.x,ty,5,C.fire,200,.35,1);}
  if(e.ph==='tell'&&e.t!=='brute'&&dmg>=20){e.ph=null;e.cd=Math.max(e.cd,.6);}
  if(e.hp<=0)kill(e,dir);}
function kill(e,dir){const ty=G+e.y-e.d.h*.5*S;hitstop=Math.max(hitstop,e.t==='brute'?.12:.035);shake=Math.max(shake,(e.t==='brute'?9:4)*S);
  if(e.t==='skull'){burst(e.x,ty,22,C.white,240,.6,1.4);burst(e.x,ty,10,C.fire,200,.5,1.2);}else{blood(e.x,ty,18,dir);burst(e.x,ty,8,C.fire,180,.5,1.1);splat(e.x,dir);}
  combo++;comboT=3;const k=Math.min(3,1+combo*.1),pts=Math.round(e.d.sc*k);score+=pts;pop('+'+pts,e.x-cam,ty-30*S,'#ffd27a',.8,11);if(Math.random()<.12)B.push({t:'hp',x:e.x,y:-8*S,vy:0,life:8});}
function splat(x,dir){if(!DX)return;DX.globalAlpha=.55;DX.fillStyle='#5a0a0e';for(let i=0;i<6;i++){DX.beginPath();DX.ellipse(x+dir*rnd(0,30)*S+rnd(-10,10)*S,rnd(3,10)*S,rnd(4,12)*S,rnd(1.5,3)*S,0,0,TAU);DX.fill();}DX.globalAlpha=1;}
// zásah hráča: src = útočník (smer), proj = strela. Vráti 'block', 'parry' alebo 'hit'.
function hurtP(dmg,src,proj){if(over||P.inv>0||P.dash>0)return 'miss';const from=Math.sign((src?src.x:P.x)-P.x)||P.face;
  if(P.shield&&from===P.face){const perfect=P.blockT<=.22;if(perfect){slow=.25;flashR=.25;ring(P.x+P.face*24*S,G-50*S,C.green,.9);burst(P.x+P.face*24*S,G-50*S,14,C.green,220,.45,1.3);pop('PRESNÝ KRYT',W/2,H*.3,'#86efac',1,15);score+=150;return 'parry';}
    burst(P.x+P.face*24*S,G-50*S,8,C.white,180,.3,1);shake=Math.max(shake,3*S);P.x-=P.face*10*S;return 'block';}
  P.hp-=dmg;P.inv=.6;P.flash=.12;combo=0;shake=Math.max(shake,8*S);blood(P.x,G-50*S,10,-from);if(P.hp<=0){P.hp=0;over=true;burst(P.x,G-50*S,40,C.red,300,1,2);}return 'hit';}
function dash(dir){if(over||P.dashCd>0||P.shield)return;P.dash=.18;P.dashD=dir;P.dashCd=.6;P.inv=Math.max(P.inv,.25);P.face=dir;for(let i=0;i<4;i++)part({x:P.x,y:G-50*S,vx:-dir*rnd(40,120)*S,vy:rnd(-20,20)*S,g:0,t:.3,t0:.3,s:3*S,col:'#6a4a3a',add:0,smk:1});}
function charge(){if(over||P.chgCd>0)return;P.chg=.26;P.chgCd=2;P.shield=false;shake=Math.max(shake,4*S);pop('NÁPOR',W/2,H*.3,'#ffd27a',.6,13);}

// ---------- AI démonov ----------
function updE(e,dt){e.bob+=dt*5;e.flash-=dt;if(e.spawnT>0){e.spawnT-=dt;if(e.d.fly)e.y+=(-140*S-e.y)*Math.min(1,dt*3);return;}
  e.x+=e.kx*dt;e.kx*=Math.pow(.02,dt);e.x=clamp(e.x,20*S,WW-20*S);if(e.stun>0){e.stun-=dt;return;}e.cd-=dt;const dx=P.x-e.x,ad=Math.abs(dx),dir=Math.sign(dx)||1;if(e.ph!=='dash')e.face=dir;
  if(e.t==='imp'){if(e.ph==='tell'){e.pt-=dt;if(e.pt<=0){e.ph=null;e.cd=1.2;if(ad<58*S){const r=hurtP(10,e);if(r==='parry'){e.stun=1.6;e.kx=-dir*220*S;}else if(r==='block'){e.kx=-dir*140*S;}}burst(e.x+e.face*26*S,G-36*S,4,C.white,120,.2,.8);}return;}
    if(ad>44*S)e.x+=dir*e.d.sp*S*dt;else if(e.cd<=0){e.ph='tell';e.pt=.38;}}
  else if(e.t==='spit'){if(e.ph==='tell'){e.pt-=dt;if(e.pt<=0){e.ph=null;e.cd=2.6;B.push({t:'orb',x:e.x+e.face*28*S,y:-50*S,vx:e.face*175*S,own:0,life:4});}return;}
    if(ad>230*S)e.x+=dir*e.d.sp*S*dt;else if(ad<150*S)e.x-=dir*e.d.sp*S*dt*.8;if(ad<300*S&&e.cd<=0){e.ph='tell';e.pt=.45;}}
  else if(e.t==='skull'){const hy=-150*S+Math.sin(e.bob*.45)*14*S;
    if(e.ph==='tell'){e.pt-=dt;e.x-=e.face*20*S*dt;if(e.pt<=0){e.ph='dash';e.pt=.5;e.vx=dir*430*S;e.vy=(-50*S-e.y)/.32;e.hitL=0;}return;}
    if(e.ph==='dash'){e.pt-=dt;e.x+=e.vx*dt;e.y=Math.min(-30*S,e.y+e.vy*dt);if(!e.hitL&&Math.abs(P.x-e.x)<26*S&&e.y>-90*S){e.hitL=1;const r=hurtP(12,e);if(r==='parry'||r==='block'){e.stun=r==='parry'?1.8:1.1;e.ph=null;e.kx=-Math.sign(e.vx)*260*S;e.cd=2;e.vy=0;}}if(e.pt<=0){e.ph=null;e.cd=rnd(1.6,2.6);}return;}
    e.y+=(hy-e.y)*Math.min(1,dt*2.5);const want=ad>170*S?1:ad<110*S?-1:0;e.x+=dir*want*e.d.sp*S*dt;if(e.cd<=0&&ad<240*S){e.ph='tell';e.pt=.5;}}
  else if(e.t==='brute'){if(e.ph==='tell'){e.pt-=dt;if(e.pt<=0){e.ph=null;e.cd=2.4;shake=Math.max(shake,10*S);ring(e.x,G-4*S,C.fire,1);burst(e.x,G-6*S,16,C.fire,260,.6,1.4);if(ad<95*S&&P.dash<=0){const r=hurtP(22,e);if(r==='parry'){e.stun=1.2;}}}return;}
    if(ad>70*S)e.x+=dir*e.d.sp*S*dt;if(e.cd<=0&&ad<110*S){e.ph='tell';e.pt=.7;}}}

// ---------- krok hry ----------
function step(dt){if(hitstop>0){hitstop-=dt;return;}if(slow>0){slow-=dt;dt*=.35;}
  hint-=dt;flashR=Math.max(0,flashR-dt);if(touch.id!=null&&!touch.sw&&!P.shield&&performance.now()-touch.t0>=200)raise();/* podržanie = štít */
  // korunka a klávesy
  if(K.ArrowLeft)crown.rate=-3.2;else if(K.ArrowRight)crown.rate=3.2;crown.ang+=crown.rate*dt*40;crownEl.style.backgroundPosition='0 '+crown.ang.toFixed(1)+'px';
  const rate=crown.rate;crown.rate*=Math.pow(K.ArrowLeft||K.ArrowRight?1:.004,dt);
  if(!over){P.cd-=dt;P.dashCd-=dt;P.chgCd-=dt;P.inv-=dt;P.flash-=dt;P.muz-=dt;P.kick=Math.max(0,P.kick-dt*6);if(P.shield)P.blockT+=dt;
    if(P.dash>0){P.dash-=dt;P.x+=P.dashD*660*S*dt;if(Math.random()<.6)part({x:P.x,y:G-50*S,vx:0,vy:0,g:0,t:.18,t0:.18,s:1,col:'',add:0,ghost:1,face:P.face});}
    else if(P.chg>0){P.chg-=dt;P.x+=P.face*620*S*dt;for(const e of E){if(e.hp<=0||e.spawnT>0||e.d.fly&&e.y<-90*S)continue;if(Math.abs(e.x-P.x)<(e.d.r+26)*S&&!e.chH){e.chH=1;e.stun=1;hit(e,25,P.face);e.kx+=P.face*320*S*(e.t==='brute'?.2:1);}}if(P.chg<=0)for(const e of E)e.chH=0;}
    else{const v=clamp(rate,-3.2,3.2)*68*S*(P.shield?.4:1);P.x+=v*dt;if(Math.abs(v)>8*S&&!nearest(W*.85))P.face=Math.sign(v);}
    P.x=clamp(P.x,24*S,WW-24*S);const tg=nearest(W*.85);if(tg&&P.dash<=0&&P.chg<=0)P.face=Math.sign(tg.x-P.x)||P.face;}
  comboT-=dt;if(comboT<=0)combo=0;
  // vlny
  if(!over){if(spawnQ.length){for(const q of spawnQ)q.at-=dt;const alive=E.filter(e=>e.hp>0).length;while(spawnQ.length&&spawnQ[0].at<=0&&alive<(Q==='w'?7:10)){spawn(spawnQ.shift().t);}}
    else if(!E.some(e=>e.hp>0)){waveT-=dt;if(waveT<=0){waveT=2;nextWave();}}}
  for(const e of E)if(e.hp>0)updE(e,dt);E=E.filter(e=>e.hp>0);
  // strely a predmety
  for(const b of B){b.life-=dt;if(b.t==='orb'){b.x+=b.vx*dt;if(Math.random()<(Q==='w'?.3:.7))part({x:b.x,y:G+b.y,vx:-b.vx*.1,vy:rnd(-20,20)*S,g:0,t:.3,t0:.3,s:1.6*S,col:C.green,add:1});
      if(!b.own&&Math.abs(b.x-P.x)<20*S){const r=hurtP(12,{x:b.x-Math.sign(b.vx)*5});if(r==='parry'){b.own=1;b.vx=-b.vx*1.4;}else if(r!=='miss')b.life=0;}
      if(b.own)for(const e of E){if(e.hp>0&&!e.d.fly&&Math.abs(e.x-b.x)<e.d.r*S){hit(e,60,Math.sign(b.vx));b.life=0;burst(b.x,G+b.y,12,C.green,200,.4,1.2);break;}}
      if(b.x<0||b.x>WW)b.life=0;}
    else if(b.t==='hp'){if(Math.abs(b.x-P.x)<22*S&&!over){P.hp=Math.min(100,P.hp+15);b.life=0;pop('+15',P.x-cam,G-110*S,'#ff6a7a',.8,12);burst(b.x,G-14*S,8,C.red,120,.4,1);}}}
  B=B.filter(b=>b.life>0);
  for(const p of PT){p.t-=dt;if(p.trc||p.ring||p.flashp||p.ghost)continue;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.bl&&p.y>G){p.t=0;}}PT=PT.filter(p=>p.t>0);
  for(const q of POP){q.t-=dt;q.y-=dt*16*S;}POP=POP.filter(q=>q.t>0);
  shake=Math.max(0,shake-dt*30*S);
  cam+=(clamp(P.x-W/2+P.face*W*.12,0,WW-W)-cam)*Math.min(1,dt*4);}

// ---------- kreslenie ----------
let draws=0;const di=(img,x,y,w,h)=>{draws++;if(w==null)ctx.drawImage(img,x,y);else ctx.drawImage(img,x,y,w,h);};
function sprite(img,wimg,x,y,face,sq,fl){const w=img.width,h=img.height;ctx.save();ctx.translate(x,y);ctx.scale(face,sq||1);di(img,-w/2,-h);if(fl>0){ctx.globalAlpha=Math.min(1,fl/.08);di(wimg,-w/2,-h);}ctx.restore();}
function glowAt(col,x,y,r,a){ctx.globalAlpha=a;di(glow(col),x-r,y-r,r*2,r*2);ctx.globalAlpha=1;}
function draw(T){draws=0;const sx=(Math.random()-.5)*shake,sy=(Math.random()-.5)*shake;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);ctx.translate(sx,sy);
  di(BGF,-(cam*.35)%(BGF.width-W),0);di(BGM,-cam,0);
  // portál a ohniská (sčítanie svetla, ako additive blend v SpriteKite)
  ctx.globalCompositeOperation='lighter';const pk=.55+.25*Math.sin(T*2.1);glowAt(C.fire,WW/2-cam,G*.62,110*S,pk*.6);
  for(const bx of braz){const x=bx-cam;if(x<-60||x>W+60)continue;glowAt(C.fire,x,G*.15,30*S*(1+.12*Math.sin(T*9+bx)),.9);glowAt(C.red,x,G*.15,60*S,.35);}
  ctx.globalCompositeOperation='source-over';di(DEC,-cam,G-2*S);
  ctx.globalCompositeOperation='lighter';glowAt(C.red,W/2,G+20*S,W*.7,.14);ctx.globalCompositeOperation='source-over';
  // predmety
  for(const b of B){const x=b.x-cam;if(b.t==='hp'){const y=G-14*S+Math.sin(T*4)*3*S;ctx.globalCompositeOperation='lighter';glowAt(C.red,x,y,18*S,.6);ctx.globalCompositeOperation='source-over';di(A.heart,x-A.heart.width/2,y-A.heart.height/2);}}
  // démoni
  for(const e of E){const x=e.x-cam;if(x<-80*S||x>W+80*S)continue;const spr=A[e.d.spr],wspr=A[e.d.spr+'W'];const tell=e.ph==='tell';let y=G+e.y,sq=1;
    if(e.spawnT>0){ctx.globalAlpha=1-e.spawnT/.6;}
    if(!e.d.fly){sq=1+Math.sin(e.bob)*.03;ctx.globalAlpha*=1;ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.ellipse(x,G+1,e.d.r*S,4*S,0,0,TAU);ctx.fill();}
    else{ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x,G+1,14*S,3*S,0,0,TAU);ctx.fill();y+=spr.height*.5;}
    if(tell){ctx.globalCompositeOperation='lighter';const tc=e.t==='spit'?C.green:e.t==='brute'?C.red:C.fire;glowAt(tc,x+e.face*(e.t==='spit'?22:10)*S,y-spr.height*(e.t==='brute'?.75:.62),(e.t==='brute'?50:26)*S,.9);ctx.globalCompositeOperation='source-over';}
    const img=e.t==='skull'&&(tell||e.ph==='dash')?A.skullHot:spr;const jit=tell&&e.t==='skull'?rnd(-2,2)*S:0;
    sprite(img,wspr,x+jit,y,e.t==='skull'?1:e.face,sq,e.flash);if(e.stun>0){ctx.globalCompositeOperation='lighter';glowAt(C.bronze,x,y-spr.height-4*S,8*S,.6+.3*Math.sin(T*14));ctx.globalCompositeOperation='source-over';}
    ctx.globalAlpha=1;
    if(e.t==='skull'){ctx.globalCompositeOperation='lighter';glowAt(C.fire,x,y-spr.height*.55,(tell?22:12)*S,tell?.9:.5);ctx.globalCompositeOperation='source-over';}
    if(e.t==='brute'){const w=70*S;ctx.fillStyle='#2a0a08';ctx.fillRect(x-w/2,y-spr.height-10*S,w,4*S);ctx.fillStyle='#ff5a2a';ctx.fillRect(x-w/2,y-spr.height-10*S,w*e.hp/e.max,4*S);}}
  // hrdina
  {const x=P.x-cam,blink=P.inv>0&&P.flash<=0&&((T*20)|0)%2;if(!over){ctx.globalAlpha=blink?.45:1;ctx.fillStyle='rgba(0,0,0,.5)';ctx.beginPath();ctx.ellipse(x,G+1,22*S,5*S,0,0,TAU);ctx.fill();
    sprite(A.hero,A.heroW,x-P.face*P.kick*4*S,G,P.face,1,P.flash);ctx.globalAlpha=1;
    if(P.shield){const pk2=P.blockT<=.22;ctx.globalCompositeOperation='lighter';glowAt(pk2?C.green:C.bronze,x+P.face*26*S,G-52*S,(pk2?40:28)*S,pk2?.8:.45);ctx.globalCompositeOperation='source-over';
      ctx.strokeStyle=pk2?'#9aff9a':'#ffd27a';ctx.lineWidth=3*S;ctx.beginPath();ctx.arc(x+P.face*14*S,G-52*S,30*S,P.face>0?-1:Math.PI-1,P.face>0?1:Math.PI+1);ctx.stroke();}
    if(P.muz>0){ctx.globalCompositeOperation='lighter';glowAt(C.fire,x+P.face*36*S,G-50*S,36*S,1);glowAt(C.white,x+P.face*36*S,G-50*S,12*S,1);ctx.globalCompositeOperation='source-over';}}}
  // strely
  ctx.globalCompositeOperation='lighter';for(const b of B){if(b.t!=='orb')continue;const x=b.x-cam,y=G+b.y;glowAt(b.own?C.white:C.green,x,y,16*S,.7);di(A.orb,x-A.orb.width/2,y-A.orb.height/2);}
  // častice
  for(const p of PT){const k=p.t/p.t0,x=p.x-cam;if(p.ghost){ctx.globalCompositeOperation='source-over';ctx.globalAlpha=k*.35;ctx.save();ctx.translate(x,G);ctx.scale(p.face,1);di(A.heroW,-A.hero.width/2,-A.hero.height);ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='lighter';continue;}
    if(p.trc){ctx.strokeStyle=p.col;ctx.globalAlpha=k;ctx.lineWidth=1.5*S;ctx.beginPath();ctx.moveTo(x,p.y);ctx.lineTo(p.tx-cam,p.ty);ctx.stroke();draws++;ctx.globalAlpha=1;continue;}
    if(p.ring){ctx.strokeStyle=p.col.replace(/[\d.]+\)$/,(k*.9).toFixed(2)+')');ctx.lineWidth=3*S;ctx.beginPath();ctx.ellipse(x,p.y,(1-k)*70*S+6*S,(1-k)*18*S+2*S,0,0,TAU);ctx.stroke();draws++;continue;}
    if(p.flashp)continue;
    if(p.add){ctx.globalCompositeOperation='lighter';glowAt(p.col,x,p.y,p.s*5,k);}else{ctx.globalCompositeOperation='source-over';ctx.globalAlpha=Math.min(1,k*1.5);ctx.fillStyle=p.col;if(p.smk){ctx.fillStyle='rgba(60,40,30,.5)';ctx.beginPath();ctx.arc(x,p.y,p.s*(2-k)*2,0,TAU);ctx.fill();}else ctx.fillRect(x-p.s/2,p.y-p.s/2,p.s,p.s);draws++;ctx.globalAlpha=1;}}
  ctx.globalCompositeOperation='source-over';
  // obraz: červený okraj pri zásahu, zelený záblesk pri presnom kryte (len prekryv, nie filter)
  ctx.setTransform(1,0,0,1,0,0);
  if(P.flash>0||P.hp<30){const a=P.flash>0?.45:.18+.1*Math.sin(T*6);const g=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.75);g.addColorStop(0,'rgba(160,0,0,0)');g.addColorStop(1,`rgba(160,0,0,${a})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);draws++;}
  if(flashR>0){ctx.fillStyle=`rgba(120,255,140,${flashR*.5})`;ctx.fillRect(0,0,W,H);draws++;}
  hud(T);}

function hud(T){const m=W*.09,s=S;ctx.textAlign='center';ctx.textBaseline='middle';
  // zdravie: oblúk pri hornom okraji (sedí do zaobleného displeja)
  ctx.lineCap='round';ctx.lineWidth=6*s;ctx.strokeStyle='#2a1612';ctx.beginPath();ctx.arc(W/2,H*1.15,H*1.06,-Math.PI/2-.36,-Math.PI/2+.36);ctx.stroke();
  ctx.strokeStyle=P.hp<30?'#ff3a2a':'#e0442a';ctx.beginPath();ctx.arc(W/2,H*1.15,H*1.06,-Math.PI/2-.36,-Math.PI/2-.36+.72*P.hp/100);ctx.stroke();draws+=2;
  ctx.fillStyle='#ffd27a';ctx.font=`bold ${17*s}px -apple-system,system-ui,sans-serif`;ctx.fillText(score.toString(),W/2,m*1.15);draws++;
  ctx.font=`${11*s}px -apple-system,system-ui,sans-serif`;ctx.fillStyle='#b09a80';ctx.fillText('VLNA '+Math.max(1,wave)+(combo>1?'  ·  ×'+Math.min(3,1+combo*.1).toFixed(1):''),W/2,m*1.15+17*s);draws++;
  // úskok a nápor: bodky dole
  const by=H-m*.9;for(const [i,ok,col] of [[-1,P.dashCd<=0,'#d8c7a0'],[1,P.chgCd<=0,'#ffd27a']]){ctx.fillStyle=ok?col:'#3a2a22';ctx.beginPath();ctx.arc(W/2+i*14*s,by,4*s,0,TAU);ctx.fill();draws++;}
  for(const q of POP){const k=q.t/q.t0;ctx.globalAlpha=Math.min(1,k*2);ctx.fillStyle=q.col;ctx.font=`bold ${q.size*s}px -apple-system,system-ui,sans-serif`;ctx.fillText(q.txt,q.x,q.y);draws++;}ctx.globalAlpha=1;
  if(hint>0&&!over){ctx.globalAlpha=Math.min(1,hint);ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(m,H*.5,W-2*m,58*s);ctx.fillStyle='#eadfcd';ctx.font=`${11*s}px -apple-system,system-ui,sans-serif`;
    ['Korunka: pohyb · Ťuk: streľba','Drž: štít · Švih: úskok · Hore: nápor'].forEach((t,i)=>ctx.fillText(t,W/2,H*.5+18*s+i*20*s));ctx.globalAlpha=1;draws+=3;}
  if(over){ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ff4a24';ctx.font=`bold ${24*s}px serif`;ctx.fillText('PADOL SI',W/2,H*.4);ctx.fillStyle='#ffd27a';ctx.font=`bold ${18*s}px -apple-system,system-ui,sans-serif`;ctx.fillText(score+' bodov · vlna '+wave,W/2,H*.5);ctx.fillStyle='#b09a80';ctx.font=`${12*s}px -apple-system,system-ui,sans-serif`;ctx.fillText('ťukni pre novú hru',W/2,H*.6);draws+=4;}
  if(PERF)perfHud();}

// ---------- merač (čo by stálo kreslenie na hodinkách) ----------
const pf={fr:[],ms:[],last:0};let lastDraws=0;
function perfHud(){const n=pf.fr.length,fps=n>1?(n-1)/((pf.fr[n-1]-pf.fr[0])/1000):0,ms=pf.ms.length?pf.ms.reduce((a,b)=>a+b,0)/pf.ms.length:0;const s=S;
  const bud={d:Q==='w'?140:260,p:PMAX()},warn=lastDraws>bud.d||PT.length>=bud.p;
  ctx.textAlign='left';ctx.font=`${9*s}px ui-monospace,Menlo,monospace`;const x=W*.62,y=H*.13;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(x-4*s,y-8*s,W*.3,46*s);
  ctx.fillStyle=warn?'#ffb040':'#9ad69a';[`${fps.toFixed(0)} snímok/s`,`${ms.toFixed(1)} ms výpočet`,`${lastDraws} ťahov`,`${PT.length} častíc · ${E.length} dém.`].forEach((t,i)=>ctx.fillText(t,x,y+i*11*s));ctx.textAlign='center';}

// ---------- slučka ----------
let prev=0,acc=0;
function frame(now){requestAnimationFrame(frame);const minDt=1000/CAP-1;if(now-prev<minDt)return;const dt=Math.min(.05,(now-(prev||now))/1000);prev=now;
  const t1=performance.now();step(dt);draw(now/1000);lastDraws=draws;const t2=performance.now();
  pf.fr.push(now);if(pf.fr.length>60)pf.fr.shift();pf.ms.push(t2-t1);if(pf.ms.length>60)pf.ms.shift();}

// ---------- nastavenia a rám hodiniek ----------
function setup(){const [w,h]=$('model').value.split('x').map(Number),zoom=+$('zoom').value;W=w;H=h;S=W/416;G=Math.round(H*.8);WW=Math.round(W*2.4);Q=$('q').value;CAP=+$('fps').value;PERF=$('perf').value==='1';
  cv.width=W;cv.height=H;const cw=W/2*zoom,ch=H/2*zoom,bez=Math.round(cw*.07),r=Math.round(cw*.21);
  watch.style.setProperty('--bez',bez+'px');watch.style.setProperty('--r',r+'px');$('glass').style.width=cw+'px';$('glass').style.height=ch+'px';watch.classList.toggle('ultra',w===410||w===422);
  $('cap').textContent=`${W} × ${H} bodov obrazu · na obrazovke ${Math.round(cw)} × ${Math.round(ch)} px`;buildAtlas();reset();}
['model','zoom','q'].forEach(id=>$(id).addEventListener('change',setup));$('fps').addEventListener('change',()=>CAP=+$('fps').value);$('perf').addEventListener('change',()=>PERF=$('perf').value==='1');
$('restart').addEventListener('click',()=>reset());
setup();requestAnimationFrame(frame);
window.__watch={get P(){return P;},get E(){return E;},get score(){return score;},get wave(){return wave;},get over(){return over;},shoot,dash,charge,raise,lower:()=>{P.shield=false;},crown:v=>{crown.rate=v;},perf:()=>({draws:lastDraws,parts:PT.length,ms:pf.ms.length?+(pf.ms.reduce((a,b)=>a+b,0)/pf.ms.length).toFixed(2):0})};
})();
