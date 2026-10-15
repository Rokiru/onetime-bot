'use strict';
function vehicleMetal(body,m,top=1.2){const a=bodyPoint(body,0,top)[1],b=bodyPoint(body,0,-.3)[1],g=ctx.createLinearGradient(0,a,0,Math.max(a+2,b));g.addColorStop(0,m.accent);g.addColorStop(.38,m.color);g.addColorStop(1,m.shadow||'#624f3d');return g;}
function panel(body,points,fill){bpoly(body,points,fill,'#122b30',Math.max(1.4,scale*.04));}
function bodyLine(body,x,y,a,b,color,width=.025){line(...bodyPoint(body,x,y),...bodyPoint(body,a,b),color,Math.max(1,scale*width));}
function vehicleText(body,x,y,text,color,size=.13){const p=bodyPoint(body,x,y);ctx.save();ctx.translate(...p);ctx.rotate(-pose(body).a);ctx.textAlign='center';ctx.fillStyle=color;ctx.font='900 '+Math.max(6,scale*size)+'px monospace';ctx.fillText(text,0,0);ctx.restore();}
function shock(body,wheel,off){
 const anchor=bodyPoint(body,off,.16),hub=[sx(pose(wheel).x),sy(pose(wheel).y)],dx=hub[0]-anchor[0],dy=hub[1]-anchor[1],length=Math.hypot(dx,dy);
 line(...bodyPoint(body,off-.22,-.06),...hub,'#142d31',scale*.09);line(...bodyPoint(body,off+.20,-.06),...hub,'#9aac9c',scale*.045);
 ctx.save();ctx.translate(...anchor);ctx.rotate(Math.atan2(dy,dx)-Math.PI/2);line(0,0,0,length,'#d1d2b3',scale*.055);line(0,length*.30,0,length*.76,'#b27837',scale*.095);
 ctx.beginPath();ctx.moveTo(0,length*.1);for(let i=0;i<=10;i++)ctx.lineTo((i%2?1:-1)*scale*.075,length*(.14+i*.06));ctx.strokeStyle='#edd697';ctx.lineWidth=Math.max(1,scale*.022);ctx.stroke();ctx.restore();
}
function vehicleWheel(wheel,m){
 const p=pose(wheel),x=sx(p.x),y=sy(p.y),r=scale*m.radius;
 const rubber=ctx.createRadialGradient(x-r*.26,y-r*.34,r*.12,x,y,r);rubber.addColorStop(0,'#394747');rubber.addColorStop(.6,'#192a2e');rubber.addColorStop(.86,'#081e24');rubber.addColorStop(1,'#122e33');circle(x,y,r,rubber);
 ctx.save();ctx.translate(x,y);ctx.rotate(-p.a);for(let i=0;i<18;i++){ctx.save();ctx.rotate(i*Math.PI/9);ctx.fillStyle=i%2?'#667068':'#444e47';ctx.fillRect(-r*.075,-r*.99,r*.15,r*.12);ctx.restore();}
 circle(0,0,r*.71,'#0e252c');circle(0,0,r*.53,'#b8c4b3');circle(0,0,r*.42,'#2b454a');
 for(let i=0;i<6;i++){ctx.save();ctx.rotate(i*Math.PI/3);line(0,r*.10,0,r*.44,'#d7ddc7',Math.max(1.5,r*.11));circle(0,r*.25,r*.045,'#172f35');ctx.restore();}
 circle(0,0,r*.14,'#8eaa9c');circle(0,0,r*.055,'#e4cf99');ctx.restore();
 ctx.strokeStyle='#acb5a04d';ctx.lineWidth=Math.max(1,scale*.016);ctx.beginPath();ctx.arc(x,y,r*.85,Math.PI*1.15,Math.PI*1.75);ctx.stroke();
}
function truck(body,wheels,preview=false){if((preview?currentVehicle():sim?sim.vehicle:CP.vehicles[0]).id==='tanker'){tankerRig(body,wheels,preview);return;}if((preview?currentVehicle():sim?sim.vehicle:CP.vehicles[0]).id==='timber'){forestryRig(body,wheels,preview);return;}
 const m=vehicleLook(preview?currentVehicle():sim?sim.vehicle:CP.vehicles[0]),k=scale,metal=vehicleMetal(body,m,m.closed?1.9:1.2);
 // The visible axles and coil springs use the actual wheel poses.
 panel(body,[[-m.width,-.17],[m.width,-.17],[m.width,-.32],[-m.width,-.32]],'#203b40');
 wheels.forEach((w,i)=>{shock(body,w,i?m.base:-m.base);vehicleWheel(w,m);});
 if(m.id==='rover'){
  // Recognisable short-cab pickup: separate bed, flat hood, doors and wing mirrors.
  panel(body,[[-1.80,.04],[-1.80,.56],[-.03,.56],[.14,1.20],[1.00,1.24],[1.39,.60],[1.83,.57],[1.91,.10]],metal);
  panel(body,[[-1.75,.56],[-1.75,.70],[-.02,.70],[-.02,.54]],m.accent);
  bodyLine(body,-1.77,.43,-.08,.43,'#5d654c',.026);bodyLine(body,-1.70,.60,-.05,.60,'#efd4a5',.024);
  panel(body,[[.17,.57],[.27,1.08],[.93,1.11],[1.25,.59]],'#3b6370');
  drawMax(body,.64,.90,1.10,.64,k,preview);
  panel(body,[[.17,.57],[.23,.17],[1.23,.17],[1.26,.56]],metal);
  bodyLine(body,.18,.17,.18,.57,'#364743',.017);bodyLine(body,1.20,.19,1.24,.55,'#354743',.017);
  bodyLine(body,.32,1.08,.54,1.09,'#d6e3d0',.032);bodyLine(body,.93,1.10,1.25,.59,'#d5dbc2',.033);
  bodyLine(body,.24,1.18,1.02,1.21,'#f7dfae',.035);bodyLine(body,1.43,.58,1.81,.56,'#f2d3a2',.03);
  bodyLine(body,.78,.44,1.00,.44,'#263c3a',.05);
  panel(body,[[1.18,.79],[1.40,.79],[1.42,.68],[1.23,.68]],'#334e4e');bodyLine(body,1.24,.74,1.40,.75,'#d8d9bc',.018);
  panel(body,[[1.48,.24],[1.88,.24],[1.88,.43],[1.47,.45]],'#263b3b');for(let y=.28;y<.43;y+=.055)bodyLine(body,1.49,y,1.86,y,'#c9c9ac',.018);
  panel(body,[[1.67,.44],[1.89,.43],[1.89,.55],[1.66,.55]],'#ffdf9a');bodyLine(body,1.81,.45,1.81,.54,'#e1ae51',.02);
  panel(body,[[-1.82,.16],[-1.73,.16],[-1.73,.37],[-1.82,.37]],brake&&!preview?'#ff7452':'#b4573f');
  bodyLine(body,-1.92,.03,-1.67,.03,'#bbc5aa',.07);bodyLine(body,1.69,.04,2.0,.04,'#bcc5af',.07);
  vehicleText(body,-.78,.22,'ROVER','#f4e0b5',.17);vehicleText(body,.72,.27,'4×4','#3d5145',.10);
 }else if(m.id==='scrambler'){
  // Utility dune buggy: tubular cage, bucket seat, sloped nose and exposed suspension.
  panel(body,[[-1.62,.04],[-1.62,.36],[-.14,.36],[.13,.53],[1.15,.45],[1.67,.24],[1.76,.04]],metal);
  panel(body,[[-1.58,.36],[-1.58,.56],[-.10,.56],[-.10,.36]],'#b1c5a5');
  panel(body,[[.24,.45],[.37,.78],[.70,.81],[.77,.43]],'#253e3e');
  drawMax(body,.67,.87,1.08,.58,k,preview);
  bodyLine(body,-.04,.23,.12,1.22,'#d9d7af',.073);bodyLine(body,.12,1.22,.97,1.22,'#d9d7af',.085);bodyLine(body,.97,1.22,1.36,.33,'#d9d7af',.077);
  bodyLine(body,-.04,.24,.98,1.20,'#426f6f',.05);bodyLine(body,.07,.42,1.29,.42,'#b7c9a9',.053);
  panel(body,[[1.12,.47],[1.72,.26],[1.66,.13],[1.15,.18]],m.accent);bodyLine(body,1.18,.48,1.69,.27,'#edf0ca',.025);
  panel(body,[[-1.47,.12],[-1.39,.32],[-.80,.32],[-.77,.12]],'#344e4b');for(let x=-1.34;x<-.83;x+=.10)bodyLine(body,x,.15,x,.28,'#a5b9a8',.035);
  for(let x of [1.40,1.62]){const p=bodyPoint(body,x,.30);circle(...p,k*.10,'#142c30');circle(...p,k*.069,'#ffe3a0');circle(p[0]-k*.018,p[1]-k*.020,k*.024,'#fff1c8');}
  bodyLine(body,-1.81,-.05,-1.61,.21,'#b8bda1',.065);bodyLine(body,1.62,.08,1.86,-.04,'#b8bda1',.065);
  bodyLine(body,.16,.02,1.16,.02,'#293e3f',.07);vehicleText(body,-.72,.19,'SCRAMBLER','#e5dfb7',.105);
 }else{
  panel(body,[[-2.12,.02],[-2.12,.36],[.41,.36],[.72,1.36],[1.62,1.37],[2.18,.52],[2.22,.07]],metal);
  panel(body,[[.75,.59],[.88,1.21],[1.49,1.22],[1.88,.59]],'#447685');drawMax(body,1.12,.98,1.63,.69,k,preview);
  bodyLine(body,.86,1.19,1.36,1.20,'#b9d8d0',.045);bodyLine(body,.53,.15,.74,1.32,'#304c53');bodyLine(body,.90,.41,1.15,.41,'#203c43',.06);
  panel(body,[[1.85,.18],[2.20,.18],[2.20,.43],[1.81,.43]],'#263f44');for(let y=.22;y<.42;y+=.065)bodyLine(body,1.87,y,2.18,y,'#b6c5b6',.018);
  panel(body,[[1.95,.43],[2.18,.43],[2.18,.57],[1.89,.56]],'#ffe4a5');
  bodyLine(body,1.99,-.10,2.25,-.10,'#c8d0b6',.07);bodyLine(body,-2.23,-.12,-2.05,-.12,'#c8d0b6',.07);
  bodyLine(body,1.76,.20,1.76,1.45,'#233e3d',.065);bodyLine(body,1.76,1.45,1.61,1.45,'#233e3d',.075);bodyLine(body,1.74,.4,1.74,1.35,'#a7b5a155',.018);vehicleText(body,1.15,.23,'MULE','#e9d9b7',.14);
 }
 // Wheel arches have model-specific profiles; tyres remain exposed below.
 for(const off of [-m.base,m.base])if(m.id==='scrambler'){panel(body,[[off-.60,.06],[off-.46,.39],[off+.39,.39],[off+.60,.10],[off+.48,.12],[off+.31,.29],[off-.37,.29],[off-.48,.02]],m.color);}else panel(body,[[off-.59,-.03],[off-.48,.30],[off-.33,.42],[off+.34,.42],[off+.49,.30],[off+.60,-.03],[off+.46,.03],[off+.36,.22],[off-.35,.22],[off-.46,.03]],m.id==='scrambler'?'#263f43':'#344b4c');
 bodyLine(body,-m.width,-.20,m.width,-.20,'#93a99c',.025);if(!preview&&sim&&sim.condition<65){bodyLine(body,1.30,.26,1.60,.15,'#e3d4ac',.035);bodyLine(body,1.42,.31,1.73,.19,'#233d41',.025);}
}
function vanFrame(body){
 const m=vehicleLook(sim&&['drive','pause','result','loading','unloading'].includes(mode)?sim.vehicle:currentVehicle()),k=scale,metal=vehicleMetal(body,m,1.9);
 panel(body,[[-2.13,.36],[.36,.36],[.36,1.88],[-2.13,1.88]],metal);
 bodyLine(body,-1.94,.46,-1.94,1.79,'#345057',.02);bodyLine(body,-1.76,.46,-1.76,1.79,'#b1bdaa',.018);bodyLine(body,-2.10,1.80,.34,1.80,'#dbe1c3',.03);
 panel(body,[[-1.7,.73],[.15,.73],[.15,1.54],[-1.7,1.54]],'#314d58');vehicleText(body,-.76,1.16,'MULE / 6T','#e6d4a7',.21);vehicleText(body,-.76,.91,'СТАНЦИЯ 17','#b8c9b7',.10);
 bodyLine(body,-2.12,.50,.34,.50,'#deb363',.085);for(let x=-1.94;x<.20;x+=.25)bodyLine(body,x,.47,x+.10,.55,'#705a35',.025);
}
function cargoStraps(){if(!sim||sim.vehicle.closed||dispatch.phase)return;for(const box of sim.boxes){if(box.lost||box.delivered||isStopCrate(box)||!box.strap)continue;const p=pose(box.body),a=bodyPoint(sim.car,box.home.x-(box.kind==='log'?1.10:.30),.27),b=bodyPoint(sim.car,box.home.x+(box.kind==='log'?1.10:.30),.27),top=[sx(p.x),sy(p.y+.28)];line(...a,...top,'#dec380',Math.max(1,scale*.026));line(...top,...b,'#b5a067',Math.max(1,scale*.026));}}

function warningSigns(){if(!sim)return;const gap=CP.gaps[sim.roadId];if(gap){for(const [x,word] of [[gap.from-15,'РАЗГОН'],[gap.from-3,'ТРАМПЛИН']]){const px=sx(x),py=sy(CP.height(x,sim.roadId));if(px<-100||px>W+100)continue;line(px,py,px,py-scale*1.3,'#4c5740',scale*.04);path([[px-scale*.43,py-scale*1.2],[px,py-scale*1.94],[px+scale*.43,py-scale*1.2]],'#e8bb65','#5b5b38',scale*.025);line(px-scale*.16,py-scale*1.35,px+scale*.17,py-scale*1.60,'#35432c',scale*.05);ctx.fillStyle='#e4c686';ctx.font='bold '+Math.max(7,scale*.13)+'px monospace';ctx.textAlign='center';ctx.fillText(word,px,py-scale*2.05);ctx.textAlign='start';}const left=sx(gap.from),right=sx(gap.to),bottom=sy(gap.y-gap.depth);if(right>0&&left<W){ctx.fillStyle='#315d5c';ctx.fillRect(left,bottom,right-left,scale*.35);line(left+2,bottom+4,right-2,bottom+4,'#8ab3a4',1.5);}}}

function surfaceMarks(){if(!sim)return;const from=cam.x-W*.4/scale,to=cam.x+W*.75/scale;for(let x=Math.floor(from/.6)*.6;x<to;x+=.6){const z=CP.surfaceAt(x,sim.roadId);if(z.type==='dirt')continue;const ax=sx(x),ay=sy(CP.groundHeight(x,sim.roadId)),bx=sx(x+.55),by=sy(CP.groundHeight(x+.55,sim.roadId));line(ax,ay,bx,by,z.type==='mud'?'#615137':z.type==='wet'?'#84a3a0':z.type==='sand'?'#ddc692':z.type==='snow'?'#eff1e7':z.type==='ice'?'#a7d4da':'#c1b79e',Math.max(3,scale*.12));if(z.type==='gravel'){const px=sx(x+.2),py=sy(CP.groundHeight(x+.2,sim.roadId))-.03*scale;circle(px,py,scale*.045,'#666a5b');}else if(z.type==='wet'||z.type==='ice')line(ax,ay-1,bx,by-1,'#c2d3bc90',1);}}
