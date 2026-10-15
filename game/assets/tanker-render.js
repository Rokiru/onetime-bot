'use strict';
function tankerRig(body,wheels,preview){
 const m=vehicleLook(preview?currentVehicle():sim.vehicle),k=scale,metal=vehicleMetal(body,m,1.6);
 panel(body,[[-2.59,-.15],[2.61,-.15],[2.61,-.32],[-2.59,-.32]],'#263e3d');wheels.forEach((wheel,i)=>{shock(body,wheel,m.axles[i]);vehicleWheel(wheel,m);});
 panel(body,[[.67,.05],[.79,1.45],[2.12,1.45],[2.47,.59],[2.62,.42],[2.67,.05]],metal);
 panel(body,[[.94,.70],[1.06,1.27],[1.99,1.27],[2.23,.69]],'#48757d');drawMax(body,1.46,1.04,2.04,.70,k,preview);bodyLine(body,.94,1.4,2.07,1.4,'#ede3bb',.04);bodyLine(body,1.76,.48,2.02,.48,'#314c43',.045);
 panel(body,[[2.3,.18],[2.63,.18],[2.63,.48],[2.29,.48]],'#29433d');for(let y=.23;y<.46;y+=.055)bodyLine(body,2.34,y,2.59,y,'#bdbd99',.016);panel(body,[[2.38,.49],[2.64,.49],[2.64,.63],[2.34,.63]],'#ecdbac');bodyLine(body,2.32,.04,2.79,.04,'#bdc8a6',.075);
 // The rounded outline follows the reservoir collision envelope.
 const pts=[[-2.16,.4],[.58,.4],[.73,.51],[.85,.80],[.85,1.25],[.71,1.55],[.55,1.66],[-2.15,1.66],[-2.46,1.54],[-2.69,1.30],[-2.78,1.03],[-2.68,.73],[-2.46,.51]];
 panel(body,pts,metal);bpoly(body,[[-2.4,1.47],[.55,1.47],[.74,1.27],[.75,1.05],[-2.67,1.05],[-2.62,1.27]],'#e0dabc44');bodyLine(body,-2.45,.65,.67,.65,'#6b776851',.04);
 for(const x of [-1.82,-.22]){bodyLine(body,x,.44,x,1.61,'#707c6c',.064);bodyLine(body,x+.035,.47,x+.035,1.60,'#d7d6ac',.02);}
 panel(body,[[-1.36,1.64],[-1.36,1.77],[-.87,1.77],[-.87,1.64]],'#687a6a');bodyLine(body,-2.19,1.71,.38,1.71,'#d0c7a1',.026);for(const x of [-2.12,.33])bodyLine(body,x,1.63,x,1.93,'#6e8069',.027);bodyLine(body,-2.12,1.93,.33,1.93,'#bebf97',.029);
 panel(body,[[-1.56,.77],[.30,.77],[.30,1.26],[-1.56,1.26]],'#284f53');const ratio=preview?1:mode==='result'?0:(sim.fluidLitres/sim.fluidCapacity)*(dispatch.phase==='loading'?Math.min(1,dispatch.elapsed/dispatch.duration):dispatch.phase==='unloading'?Math.max(0,1-dispatch.elapsed/dispatch.duration):1),shift=preview?Math.sin(clock*1.3)*.035:sim.fluidSlosh;
 const bottom=.79,level=bottom+.44*ratio,tilt=Math.max(-.065,Math.min(.065,shift*.18));bpoly(body,[[-1.53,bottom],[.27,bottom],[.27,level-tilt],[-1.53,level+tilt]],'#79b1a4');bodyLine(body,-1.52,level+tilt,.26,level-tilt,'#d2ded1',.018);
 for(const x of [-.94,-.30])bodyLine(body,x,.79,x,1.24,'#a9bca582',.024);
 vehicleText(body,-.63,1.04,'BRINE / 900L','#f0e3b8',.15);vehicleText(body,1.50,.28,'6×6','#e5d8ac',.15);
 for(const x of [-2.37,-2.17]){bodyLine(body,x,.40,x,1.45,'#4b685a',.023);for(let y=.55;y<1.4;y+=.18)bodyLine(body,-2.38,y,-2.15,y,'#c4c8a5',.024);}
 for(const off of m.axles)panel(body,[[off-.63,-.01],[off-.46,.34],[off+.42,.34],[off+.62,-.01],[off+.48,.04],[off+.31,.21],[off-.32,.21],[off-.46,.03]],'#344e44');
}
function tankerDepots(){
 if(!sim||!sim.fluidCapacity)return;const k=scale;
 for(const stop of sim.stops){const x=sx(stop.x),y=sy(CP.height(stop.x,sim.roadId));if(x<-k*9||x>W+k*8)continue;const color=stop.done?'#86b78b':'#b6cf9c';
 for(let q=stop.x-3;q<stop.x+3;q+=.5)line(sx(q),sy(CP.groundHeight(q,sim.roadId))-.025*k,sx(q+.3),sy(CP.groundHeight(q+.3,sim.roadId))-.025*k,color,Math.max(2,k*.07));
 const bx=x+k*5,by=sy(CP.height(stop.x+5,sim.roadId));path([[bx-k*.75,by],[bx-k*.75,by-k*1.6],[bx-k*.58,by-k*1.95],[bx+k*.58,by-k*1.95],[bx+k*.75,by-k*1.6],[bx+k*.75,by]],'#8fa79b','#304b45',k*.035);line(bx-k*.67,by-k*.29,bx+k*.67,by-k*.29,'#4e7468',k*.04);line(bx-k*.67,by-k*1.5,bx+k*.67,by-k*1.5,'#cdd6b7',k*.03);
 line(x,y,x,y-k*1.9,'#5b7a64',k*.04);circle(x,y-k*2.1,k*.28,color);ctx.fillStyle='#244f3e';ctx.textAlign='center';ctx.font='900 '+Math.max(9,k*.26)+'px monospace';ctx.fillText(stop.done?'✓':String(stop.index+1),x,y-k*2.0);ctx.fillStyle='#dfd6b0';ctx.font='bold '+Math.max(7,k*.13)+'px monospace';ctx.fillText(stop.name,bx,by-k*2.1);ctx.textAlign='start';
 if(stop.elapsed>0&&!stop.done){const nozzle=bodyPoint(sim.car,-1.93,.55);ctx.beginPath();ctx.moveTo(...nozzle);ctx.bezierCurveTo(nozzle[0]+k*.3,nozzle[1]+k*.5,bx-k*1.2,by,bx-k*.55,by-k*.3);ctx.strokeStyle='#203e39';ctx.lineWidth=k*.065;ctx.stroke();ctx.strokeStyle='#8eb8a1';ctx.lineWidth=k*.018;ctx.stroke();vehicleText(sim.car,-.7,1.34,'ПЕРЕКАЧКА','#ecdea9',.11);}
 }
}
function gateScenery(){
 if(!sim)return;const k=scale;for(const gate of sim.gates){const x=sx(gate.x),y=sy(CP.height(gate.x,sim.roadId));if(x<-k*12||x>W+k*12)continue;
 for(let q=gate.x-2.8;q<gate.x+2.8;q+=.6)line(sx(q),sy(CP.groundHeight(q,sim.roadId))-.025*k,sx(q+.30),sy(CP.groundHeight(q+.3,sim.roadId))-.025*k,gate.open?'#95bd88':'#c99372',Math.max(2,k*.08));
 const px=sx(gate.pivot.x),py=sy(gate.pivot.y);line(px,sy(CP.height(gate.pivot.x,sim.roadId)),px,py,'#6d8069',k*.12);panel(gate.body,[[-1.6,-.095],[1.6,-.095],[1.6,.095],[-1.6,.095]],'#d3c89e');for(let q=-1.5;q<1.5;q+=.4)bpoly(gate.body,[[q,-.085],[q+.17,-.085],[q+.33,.085],[q+.16,.085]],'#a45f49');circle(px,py,k*.13,'#c5c7a4');
 const lampx=x+k*.6,lampy=y-k*1.95;line(lampx,y,lampx,lampy,'#667d64',k*.05);path([[lampx-k*.18,lampy-k*.62],[lampx+k*.18,lampy-k*.62],[lampx+k*.18,lampy],[lampx-k*.18,lampy]],'#29423b','#88a185',k*.018);circle(lampx,lampy-k*.45,k*.09,gate.open?'#704c40':'#e1a075');circle(lampx,lampy-k*.17,k*.09,gate.open?'#aad69a':'#52654d');
 ctx.font='bold '+Math.max(7,k*.13)+'px monospace';ctx.fillStyle='#e5d5ab';ctx.textAlign='center';ctx.fillText(gate.name,x,y-k*2.85);ctx.textAlign='start';
 }
}
