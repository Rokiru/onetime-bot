'use strict';
function crossingEvent(ev){if(ev.type==='waterEnter')sayDriver('Брод: держи ровную тягу.','focus');if(ev.type==='bridgeRequest')toast('ПЕРЕПРАВА · ЖДИ СУДНО');if(ev.type==='bridgeReady'){toast('МОСТ ОПУЩЕН · МОЖНО ЕХАТЬ');if(save.sound)beep(410);}}
function crossingWater(ford,reflection=true){
 const left=sx(ford.from),right=sx(ford.to);if(right<-50||left>W+50)return;const level=sim.waterLevel(ford),top=sy(level),bed=[];for(let x=ford.from;x<=ford.to+.01;x+=.5)bed.push([sx(x),Math.max(top,sy(CP.groundHeight(x,sim.id)))]);
 const points=[[left,top],...bed,[right,top]],g=ctx.createLinearGradient(0,top,0,top+scale*2);g.addColorStop(0,'#84bcb4ba');g.addColorStop(1,'#285b6fef');path(points,g);
 ctx.save();ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.clip();
 if(save.effects&&save.quality!=='low'&&reflection&&sim.car.getPosition().x>ford.from-3&&sim.car.getPosition().x<ford.to+3){ctx.save();ctx.translate(0,top*2);ctx.scale(1,-1);ctx.globalAlpha=.13;truck(sim.car,sim.wheels);if(sim.vehicle.closed)vanFrame(sim.car);for(const box of sim.boxes)if(!box.lost&&!box.delivered)crate(box);ctx.restore();}
 for(let x=ford.from+.6;x<ford.to;x+=2.1){const y=top+3+(hash(x+sim.id)*scale*.33);line(sx(x),y,sx(x+.75),y,'#d4eade4b',1);}
 ctx.restore();line(left,top,right,top,'#c1ded6aa',1.5);
 if(sim.waterDepth>.12&&save.effects&&sim.car.getPosition().x>=ford.from&&sim.car.getPosition().x<=ford.to){for(const wheel of sim.wheels){const p=pose(wheel),x=sx(p.x);for(let j=0;j<3;j++){const phase=(sim.time*1.9+j*.33)%1,r=scale*(.08+phase*.28),h=scale*(.04+Math.abs(sim.car.getLinearVelocity().x)*.035)*Math.sin(phase*Math.PI);circle(x-r,top-h,Math.max(.8,scale*.025*(1-phase)),'#c4e5d6b0');circle(x+r,top-h,Math.max(.8,scale*.025*(1-phase)),'#c4e5d6b0');}}}
}
function crossingScenery(){
 if(!sim)return;for(const ford of sim.route.fords||[])crossingWater(ford);
 for(const br of sim.liftBridges){const k=scale;if(sx(br.to)<-100||sx(br.from)>W+100)continue;crossingWater(br.water,false);
  for(const xx of [br.from,br.to]){const y=sy(br.y);path([[sx(xx-.30),y],[sx(xx+.30),y],[sx(xx+.38),y+k*3.6],[sx(xx-.38),y+k*3.6]],'#526b68');line(sx(xx-.27),y+k*.3,sx(xx+.30),y+k*.3,'#95a69b70',2);}
  bpoly(br.body,[[-br.span/2,-.10],[br.span/2,-.10],[br.span/2,.10],[-br.span/2,.10]],'#a99a77','#495b50',k*.02);for(let q=-br.span/2;q<br.span/2;q+=.8)line(...bodyPoint(br.body,q,.10),...bodyPoint(br.body,q+.50,.10),'#ded3ad',k*.025);
  for(let q=-br.span/2+.6;q<br.span/2;q+=2){line(...bodyPoint(br.body,q,.14),...bodyPoint(br.body,q,.78),'#7e9284',k*.04);}line(...bodyPoint(br.body,-br.span/2+.6,.76),...bodyPoint(br.body,br.span/2-.5,.76),'#a3b3a0',k*.028);
  circle(sx(br.from),sy(br.y-.10),k*.16,'#d7c492');circle(sx(br.from),sy(br.y-.10),k*.06,'#425b57');
  const x=sx(br.control),y=sy(CP.height(br.control,sim.id));for(let dx=-2.8;dx<2.8;dx+=.55)line(sx(br.control+dx),y-1,sx(br.control+dx+.30),y-1,br.done?'#a3d19d':'#deb58b',k*.06);line(x+1.8*k,y,x+1.8*k,y-2.35*k,'#758c79',k*.07);ctx.fillStyle='#294947';ctx.fillRect(x+1.6*k,y-2.65*k,k*.42,k*.50);circle(x+1.8*k,y-2.40*k,k*.095,br.done?'#a8d78e':br.requested?'#e3cc80':'#dd8f76');
  if(br.boat.isActive()){ctx.save();ctx.beginPath();ctx.rect(sx(br.from),-H,sx(br.to)-sx(br.from),H*3);ctx.clip();bpoly(br.boat,[[-1.8,.28],[1.8,.28],[1.45,-.30],[-1.4,-.30]],'#537c7d','#284b55',k*.035);bpoly(br.boat,[[-.55,.3],[.65,.3],[.55,1.0],[-.5,1.0]],'#b9c9ae');bpoly(br.boat,[[-.30,.52],[.35,.52],[.3,.85],[-.27,.85]],'#486a79');line(...bodyPoint(br.boat,0,1),...bodyPoint(br.boat,0,1.6),'#879d8a',k*.03);if(save.effects)for(let j=0;j<3;j++)line(...bodyPoint(br.boat,1.7+j*.45,-.14),...bodyPoint(br.boat,2+j*.55,-.14-j*.07),'#d1e8d078',1);ctx.restore();}
 }
}

function crossingOverlay(){
 if(!sim||sim.waterDepth<.1)return;const x=sim.car.getPosition().x,ford=(sim.route.fords||[]).find(f=>x>=f.from&&x<=f.to)||(sim.liftBridges.find(b=>x>=b.from&&x<=b.to)||{}).water;if(!ford)return;const top=sy(sim.waterLevel(ford)),points=[[sx(ford.from),top]];for(let xx=ford.from;xx<=ford.to+.01;xx+=.5)points.push([sx(xx),Math.max(top,sy(CP.groundHeight(xx,sim.id)))]);points.push([sx(ford.to),top]);ctx.save();ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.clip();ctx.fillStyle='#68a9ad42';ctx.fillRect(sx(x-sim.vehicle.width-.4),top,scale*(sim.vehicle.width*2+.8),H-top);ctx.restore();
}
