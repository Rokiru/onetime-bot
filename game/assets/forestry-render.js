'use strict';
function forestryRig(body,wheels,preview){
 const m=vehicleLook(preview?currentVehicle():sim.vehicle),k=scale,metal=vehicleMetal(body,m,1.5);
 panel(body,[[-2.72,-.14],[2.74,-.14],[2.74,-.32],[-2.72,-.32]],'#263f3d');
 wheels.forEach((w,i)=>{shock(body,w,m.axles[i]);vehicleWheel(w,m);});
 panel(body,[[-2.65,.02],[-2.65,.28],[.55,.28],[.86,1.46],[2.11,1.46],[2.48,.51],[2.74,.35],[2.78,.03]],metal);
 panel(body,[[.98,.69],[1.10,1.29],[1.97,1.29],[2.23,.68]],'#44727a');drawMax(body,1.52,1.02,2.05,.70,k,preview);
 bodyLine(body,.94,1.45,2.10,1.45,'#e6d4a1',.04);bodyLine(body,1.05,1.28,1.87,1.28,'#b3d2c8',.035);bodyLine(body,.70,.10,.91,1.42,'#3b5741',.024);bodyLine(body,1.72,.48,1.98,.48,'#293f32',.055);
 panel(body,[[2.31,.18],[2.71,.18],[2.71,.44],[2.28,.44]],'#203a33');for(let y=.21;y<.43;y+=.06)bodyLine(body,2.33,y,2.68,y,'#c7c6a0',.018);
 panel(body,[[2.43,.44],[2.70,.44],[2.70,.58],[2.40,.58]],'#efd7a0');bodyLine(body,2.42,.03,2.85,.03,'#c1c3a0',.07);bodyLine(body,-2.81,.00,-2.50,.00,'#a4b291',.06);
 for(const off of m.axles)panel(body,[[off-.59,-.02],[off-.48,.28],[off-.33,.4],[off+.32,.4],[off+.47,.28],[off+.58,-.02],[off+.46,.02],[off+.32,.25],[off-.32,.25],[off-.45,.01]],'#33473c');
 bodyLine(body,-2.50,.25,.40,.25,'#d4c593',.047);for(const x of [-2.53,-.94,.42]){panel(body,[[x-.035,.24],[x-.035,1.68],[x+.045,1.68],[x+.045,.24]],'#435947');bodyLine(body,x,1.58,x,1.68,'#d3bb6d',.045);}
 vehicleText(body,1.56,.28,'LARCH / 6×4','#ecdfb0',.13);vehicleText(body,-1.4,.10,'ЛЕСОСЕКА 17','#d4c599',.115);
 bodyLine(body,2.10,1.05,2.35,1.05,'#4b6052',.06);panel(body,[[2.24,1.14],[2.43,1.14],[2.43,.98],[2.25,.98]],'#293f3b');
}
function logCargo(box){const body=box.body,k=scale,seed=box.index||0;
 bpoly(body,[[-1.36,0],[-1.30,.12],[-1.22,.15],[1.22,.15],[1.31,.11],[1.36,0],[1.30,-.12],[1.22,-.15],[-1.22,-.15],[-1.30,-.12]],'#8e653e','#4e422d',Math.max(1,k*.026));
 for(let j=0;j<4;j++){const y=-.10+j*.063;bodyLine(body,-1.22,y,1.24,y+(hash(seed*7+j)-.5)*.028,j%2?'#c69b5b':'#624c32',.022);}
 for(const x of [-1.28,1.28]){const p=bodyPoint(body,x,0);ctx.save();ctx.translate(...p);ctx.rotate(-pose(body).a);ctx.fillStyle='#d8b678';ctx.beginPath();ctx.ellipse(0,0,k*.072,k*.14,0,0,Math.PI*2);ctx.fill();for(const radius of [.10,.066,.03]){ctx.strokeStyle='#977341';ctx.lineWidth=Math.max(.7,k*.012);ctx.beginPath();ctx.ellipse(0,0,k*radius*.45,k*radius,0,0,Math.PI*2);ctx.stroke();}ctx.restore();}
 for(const x of [-.62,.64]){const p=bodyPoint(body,x,.018);ctx.save();ctx.translate(...p);ctx.rotate(-pose(body).a);ctx.strokeStyle='#4d3d2b';ctx.lineWidth=Math.max(.8,k*.02);ctx.beginPath();ctx.ellipse(0,0,k*.065,k*.035,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
}
function weatherEffects(){
 if(!sim||!save.effects)return;const w=CP.weatherAt(sim.id,sim.time),count=save.quality==='low'?16:44;
 if(w.type==='rain'||w.type==='storm'){
  const intensity=w.intensity;for(let i=0;i<count;i++){const x=(hash(i+121)*W+clock*(28+w.wind*90))%(W+40)-20,y=(hash(i+38)*H+clock*(145+hash(i+41)*90))%(H+20)-20;line(x,y,x-3-intensity*2,y+9+intensity*6,'#c9e3dc66',1);}
  ctx.fillStyle='#12384d'+(w.type==='storm'?'22':'10');ctx.fillRect(0,0,W,H);
  // Stable glints on wet ground, independent of camera sampling.
  const from=Math.floor((cam.x-W*.4/scale)/2)*2,to=cam.x+W*.7/scale;for(let x=from;x<to;x+=2){const g=CP.gaps[sim.roadId];if(g&&x>g.from-.5&&x<g.to+.5)continue;line(sx(x),sy(CP.groundHeight(x,sim.roadId))-1,sx(x+.55),sy(CP.groundHeight(x+.55,sim.roadId))-1,'#cbdfca55',Math.max(1,scale*.023));}
 }else if(w.type==='snow'||w.type==='blizzard'){
  const density=w.type==='blizzard'?count*1.6:count*.7;for(let i=0;i<density;i++){const x=(hash(i+12)*W+clock*(w.type==='blizzard'?55:10)*(1+hash(i+93)))%W,y=(hash(i+75)*H+clock*(18+hash(i+22)*15))%H;circle(x,y,.8+hash(i+34)*1.2,'#edf6ec9c');}
 }
 if(['fog','storm','blizzard'].includes(w.type)){const fog=ctx.createLinearGradient(W*.40,0,W,0);fog.addColorStop(0,'#c3d5ce00');fog.addColorStop(1,w.type==='blizzard'?'#dfe9de70':w.type==='fog'?'#c0d2bc55':'#93b1af30');ctx.fillStyle=fog;ctx.fillRect(W*.4,0,W*.6,H);}
 if(w.type==='wind'&&save.quality!=='low')for(let i=0;i<8;i++){const x=(hash(i+412)*W+clock*34)%W,y=H*(.34+hash(i+86)*.40);line(x,y,x+9,y-2,'#d6ca9350',1);}
}
function winchCable(){if(!sim||sim.winchTime<=0||!sim.winchAnchor)return;const a=bodyPoint(sim.car,sim.vehicle.width*.45,.28),b=[sx(sim.winchAnchor.x),sy(sim.winchAnchor.y)];line(...a,...b,'#213b32',Math.max(2,scale*.042));line(...a,...b,'#d7c491',Math.max(1,scale*.018));circle(...b,scale*.10,'#c8b77b');circle(...b,scale*.055,'#324c37');}
function surveyPosts(){if(!sim)return;for(const point of sim.checkpoints){const x=sx(point.x),y=sy(CP.height(point.x,sim.roadId)),k=scale;if(x<-k*3||x>W+k*3)continue;line(x,y,x,y-k*2.15,'#798365',k*.05);path([[x-k*.35,y-k*2.1],[x+k*.35,y-k*2.1],[x+k*.35,y-k*2.70],[x-k*.35,y-k*2.70]],point.done?'#74a580':'#d9b764','#364d38',k*.03);ctx.fillStyle='#244031';ctx.textAlign='center';ctx.font='900 '+Math.max(8,k*.23)+'px monospace';ctx.fillText(point.done?'✓':String(sim.checkpoints.indexOf(point)+1),x,y-k*2.27);ctx.textAlign='start';}}
function skyLight(id){
 if(!save.effects||save.quality==='low'||id===2)return;const weather=sim?CP.weatherAt(sim.id,sim.time):CP.weatherAt(selected);if(['storm','blizzard'].includes(weather.type))return;
 const x=W*.78-cam.x*.15,y=H*.2;for(let i=0;i<4;i++){const shift=(i-1.5)*H*.15;path([[x-4+i,y],[x+6+i,y],[x+shift+H*.05,H*.80],[x+shift-H*.10,H*.80]],'#fff1cb08');}
}
function skyPalette(base,w){const sky={rain:['#415f72','#91a9a5','#526d64'],storm:['#344a61','#6d8387','#405b56'],fog:['#879e9a','#b4c6b7','#637e6b'],blizzard:['#799ba9','#c6d7d5','#83a9ad']}[w.type];return sky?{...base,sky}:base;}
function cloudWeatherBackdrop(w){if(!['rain','storm','fog','blizzard'].includes(w.type))return;ctx.save();const drift=cam.x*scale*.028;ctx.globalAlpha=w.type==='storm'?.25:.13;for(let n=-1;n<6;n++){const x=n*W*.24-drift%(W*.24),y=H*(.12+hash(n+55)*.045);circle(x,y,W*.16,w.type==='storm'?'#304652':'#b4c8bf');}ctx.restore();}
