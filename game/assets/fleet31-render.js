'use strict';
(function(){
 const oldTruck=truck,oldVan=vanFrame,oldWheel=vehicleWheel;
 function model(preview){return vehicleLook(preview?currentVehicle():sim?sim.vehicle:currentVehicle());}
 vehicleWheel=function(w,m){oldWheel(w,m);const c=m.look31;if(!c)return;const p=pose(w),x=sx(p.x),y=sy(p.y),r=m.radius*scale;
  if(c.rims!=='steel'){const color=c.rims==='black'?'#273337':'#d9d1b7';circle(x,y,r*.48,color);circle(x,y,r*.17,'#7d8b85');for(let i=0;i<6;i++){const a=p.a+i*Math.PI/3;circle(x+Math.cos(a)*r*.31,y-Math.sin(a)*r*.31,r*.045,'#1f3033');}}
  if(c.tires==='mud'){for(let i=0;i<12;i++){const a=p.a+i*Math.PI/6;line(x+Math.cos(a)*r*.84,y-Math.sin(a)*r*.84,x+Math.cos(a+.09)*r*.98,y-Math.sin(a+.09)*r*.98,'#a0a58a',Math.max(1,scale*.025));}}
 };
 function livery(body,m,x=-.8,y=.36){const c=m.look31;if(!c)return;
  if(c.livery==='stripe'){panel(body,[[x-.72,y-.07],[x+.66,y-.07],[x+.78,y+.12],[x-.60,y+.12]],m.accent);bodyLine(body,x-.65,y+.19,x+.79,y+.19,'#243c40',.035);}
  if(c.livery==='expedition'){panel(body,[[x-.56,y-.13],[x+.62,y-.13],[x+.62,y+.29],[x-.56,y+.29]],'#243c40');vehicleText(body,x+.03,y+.12,'ЛИСИЙ БРОД','#e3d8b8',.13);vehicleText(body,x+.03,y-.04,'EXPEDITION','#b8c6b7',.08);}
  if(c.livery==='number'){panel(body,[[x-.23,y-.15],[x+.24,y-.15],[x+.24,y+.32],[x-.23,y+.32]],'#e4dcc2');vehicleText(body,x,y+.02,'17','#253b40',.29);}
 }
 function equipment(body,m){const c=m.look31;if(!c)return;
  if(c.utility==='guard'){panel(body,[[-m.width,-.35],[m.width,-.35],[m.width,-.25],[-m.width,-.25]],'#768881');bodyLine(body,m.width+.04,-.26,m.width+.04,.34,'#a4b4a0',.075);for(const x of [-.8,0,.8])bodyLine(body,x,-.32,x+.08,-.26,'#263b3c',.025);}
  if(c.utility==='service'){const roof=m.closed?1.96:1.5;panel(body,[[.5,roof],[1.62,roof],[1.62,roof+.12],[.5,roof+.12]],'#2d4545');for(const x of [.62,1.28])panel(body,[[x,roof+.13],[x+.27,roof+.13],[x+.27,roof+.39],[x,roof+.39]],'#8b9b75');bodyLine(body,.45,roof+.12,1.72,roof+.12,'#d6ccb0',.032);}
 }
 function cab(body,m,preview){const van=m.id==='rivet',bison=m.id==='bison',cedar=m.id==='cedar';
  // Rivet has a short sloping nose; the three heavy variants use forward-control cabs.
  const back=van?.44:.72,front=van?1.94:bison?2.47:2.51,top=van?1.3:cedar?1.52:1.42;
  panel(body,[[back,.05],[back,top-.12],[back+.16,top],[front-.28,top],[front,top-.36],[front,.07]],vehicleMetal(body,m,top));
  panel(body,[[back+.14,.71],[back+.23,top-.16],[front-.35,top-.16],[front-.14,.76]],'#355c68');drawMax(body,(back+front)/2,top-.36,front-.35,.65,scale,preview);
  bodyLine(body,back+.04,.1,back+.04,top-.12,'#334a49',.025);bodyLine(body,front-.25,.19,front-.25,.64,'#293e3e',.025);bodyLine(body,back+.25,.48,back+.49,.48,'#253b3d',.05);
  panel(body,[[front-.35,.2],[front,.2],[front,.55],[front-.35,.55]],'#253b3d');for(let y=.24;y<.54;y+=.07)bodyLine(body,front-.32,y,front-.02,y,'#a7b6ad',.021);
  panel(body,[[front-.19,.56],[front+.02,.56],[front+.02,.7],[front-.19,.7]],'#f0dfb5');bodyLine(body,front-.2,.02,front+.12,.02,'#c3c9b0',.075);bodyLine(body,front-.08,.9,front+.13,.9,'#2a4144',.045);
  vehicleText(body,(back+front)/2,.27,m.name,m.accent,.13);
  if(bison){bodyLine(body,front-.17,.83,front-.17,1.84,'#2d4342',.06);bodyLine(body,front-.17,1.84,front-.37,1.84,'#2d4342',.09);}
 }
 function reservoir(body,m,preview){panel(body,[[-2.16,.4],[.58,.4],[.8,.68],[.8,1.35],[.55,1.66],[-2.15,1.66],[-2.54,1.44],[-2.77,1.03],[-2.54,.62]],vehicleMetal(body,m,1.7));bodyLine(body,-2.4,1.45,.53,1.45,'#e2e8d078',.07);
  for(const x of [-1.85,-.16]){bodyLine(body,x,.43,x,1.63,'#506c68',.075);bodyLine(body,x+.04,.47,x+.04,1.6,'#cfdbcf',.025);}
  panel(body,[[-1.38,1.64],[-.89,1.64],[-.89,1.79],[-1.38,1.79]],'#526b65');
  const ratio=preview?1:Math.max(0,sim.fluidLitres/sim.fluidCapacity),slosh=preview?0:Math.max(-.08,Math.min(.08,sim.fluidSlosh*.15));panel(body,[[-1.55,.76],[.3,.76],[.3,1.27],[-1.55,1.27]],'#294a50');panel(body,[[-1.52,.79],[.27,.79],[.27,.79+.45*ratio-slosh],[-1.52,.79+.45*ratio+slosh]],'#7db5ad');vehicleText(body,-.6,1,'DELTA / 900L','#e9e3cb',.14);livery(body,m,-.63,.52);
 }
 function closed(body,m){const rivet=m.id==='rivet',left=rivet?-1.91:-2.36,right=rivet?.36:.52,top=1.87;
  panel(body,[[left,.37],[right,.37],[right,top-.1],[right-.12,top],[left+.1,top],[left,top-.1]],vehicleMetal(body,m,top));bodyLine(body,left+.08,1.79,right-.1,1.79,m.accent,.045);
  if(rivet){panel(body,[[-1.66,1.2],[-.9,1.2],[-.9,1.64],[-1.66,1.64]],'#35565f');bodyLine(body,-.65,.49,-.65,1.76,'#3b5758',.021);bodyLine(body,-.47,1.04,-.18,1.04,'#263b3d',.048);vehicleText(body,-1.2,.65,'RIVET',m.accent,.17);}
  else {for(let x=left+.2;x<right-.2;x+=.22)bodyLine(body,x,.53,x,1.65,'#30494735',.018);panel(body,[[left+.25,.85],[right-.18,.85],[right-.18,1.48],[left+.25,1.48]],'#2e484b');vehicleText(body,-.9,1.22,'BISON / 6×6','#e0d3ad',.22);vehicleText(body,-.9,.98,'ЛИСИЙ БРОД','#aebdab',.1);}
  bodyLine(body,left,.47,right,.47,m.accent,.06);livery(body,m,rivet?-.29:-.8,rivet?.66:.65);equipment(body,m);
 }
 truck=function(body,wheels,preview=false){const m=model(preview);if(!['rivet','bison','cedar','delta'].includes(m.id)){oldTruck(body,wheels,preview);if(!m.closed)livery(body,m,m.id==='scrambler'?-.75:-.8,m.id==='scrambler'?.23:.33);equipment(body,m);return;}
  panel(body,[[-m.width,-.15],[m.width,-.15],[m.width,-.32],[-m.width,-.32]],'#243d3f');wheels.forEach((w,i)=>{shock(body,w,(m.axles||[-m.base,m.base])[i]);vehicleWheel(w,m);});
  if(m.id==='cedar'){panel(body,[[-2.62,.05],[.49,.05],[.49,.32],[-2.62,.32]],vehicleMetal(body,m,.4));for(const x of [-2.55,.46]){bodyLine(body,x,.24,x,1.65,'#3f5250',.11);bodyLine(body,x+.02,.27,x+.02,1.63,'#c2b590',.028);}livery(body,m,-.9,.2);}
  if(m.id==='delta')reservoir(body,m,preview);
  cab(body,m,preview);for(const off of (m.axles||[-m.base,m.base]))panel(body,[[off-.66,-.02],[off-.48,.32],[off+.43,.32],[off+.65,-.02],[off+.48,.05],[off+.32,.19],[off-.33,.19],[off-.48,.05]],'#344b48');
  if(!m.closed)equipment(body,m);
 };
 vanFrame=function(body){const m=model(!sim||!['drive','pause','fork','result','loading','unloading'].includes(mode));if(['rivet','bison'].includes(m.id))closed(body,m);else{oldVan(body);livery(body,m,-.75,.67);}};
})();
