'use strict';
function prepareStopHud(){
 const panel=$('stop-panel');panel.classList.toggle('hidden',!sim||!sim.stops.length);
 const track=document.querySelector('.trip-progress');track.querySelectorAll('.stop-pin,.survey-pin,.service-pin,.gate-pin').forEach(el=>el.remove());
 if(sim)for(const stop of sim.stops){const pin=document.createElement('span');pin.className='stop-pin';pin.dataset.stop=stop.index;pin.style.left=Math.max(0,(stop.x-6)/sim.route.length*100)+'%';pin.title=stop.name;track.appendChild(pin);}if(sim)for(const point of sim.checkpoints){const pin=document.createElement('span');pin.className='survey-pin';pin.dataset.check=sim.checkpoints.indexOf(point);pin.style.left=Math.max(0,(point.x-6)/sim.route.length*100)+'%';track.appendChild(pin);}if(sim)for(const site of sim.services){const pin=document.createElement('span');pin.className='service-pin';pin.dataset.service=sim.services.indexOf(site);pin.style.left=Math.max(0,(site.x-6)/sim.route.length*100)+'%';track.appendChild(pin);}if(sim)for(const gate of sim.gates){const pin=document.createElement('span');pin.className='gate-pin';pin.dataset.gate=sim.gates.indexOf(gate);pin.style.left=Math.max(0,(gate.x-6)/sim.route.length*100)+'%';track.appendChild(pin);}updateStopHud();
}
function updateStopHud(){
 if(!sim||!sim.stops.length){if(sim&&sim.checkpoints.length){surveyHud();return;}visibility('stop-panel',false);return;}
 visibility('stop-panel',true);const stop=sim.nextStop(),x=sim.car.getPosition().x;const meter=$('stop-progress');
 if(stop){const duration=sim.fluidCapacity?2:(stop.duration||1.3),distance=Math.round(Math.abs(stop.x-x)*3),near=Math.abs(x-stop.x)<=3.1;
  $('stop-label').textContent=(stop.index+1)+' / '+sim.stops.length+' · '+stop.name;
  $('stop-distance').textContent=stop.elapsed>0?(sim.fluidCapacity?'ПЕРЕКАЧКА ':'РАЗГРУЗКА ')+Math.round(Math.min(100,stop.elapsed/duration*100))+'%':near&&gas?'ОТПУСТИ ГАЗ':near?'ДЕРЖИ ТОРМОЗ':x>stop.x+3.1?'ВЕРНИСЬ · '+distance+' М':distance+' М ДО ОСТАНОВКИ';
  meter.style.width=Math.min(100,stop.elapsed/duration*100)+'%';$('stop-panel').classList.toggle('docking',near);$('stop-panel').classList.toggle('complete',false);
 }else{$('stop-label').textContent='ВСЕ ТОЧКИ ОБСЛУЖЕНЫ';$('stop-distance').textContent=Math.max(0,Math.round((sim.route.length+6-x)*3))+' М ДО БАЗЫ';meter.style.width='100%';$('stop-panel').classList.remove('docking');$('stop-panel').classList.add('complete');}
 document.querySelectorAll('.stop-pin').forEach(el=>el.classList.toggle('done',sim.stops[+el.dataset.stop].done));
}
function isStopCrate(box){if(!sim||box.delivered||box.lost)return false;const stop=sim.nextStop();return !!(stop&&stop.elapsed>0&&stop.boxIndex===box.index);}
function drawStopCrate(){
 if(!sim||sim.fluidCapacity)return;const stop=sim.nextStop();if(!stop||!stop.elapsed||stop.boxIndex<0)return;const box=sim.boxes[stop.boxIndex];if(!box||box.lost||box.delivered)return;
 const p=pose(box.body),t=Math.max(0,Math.min(1,stop.elapsed/(stop.duration||1.3))),ease=t*t*(3-2*t),destination={x:stop.x+4.25,y:CP.height(stop.x,sim.roadId)+.39};
 crate({...box,body:{getPosition:()=>({x:p.x+(destination.x-p.x)*ease,y:p.y+(destination.y-p.y)*ease+Math.sin(t*Math.PI)*1.6}),getAngle:()=>p.a*(1-ease)}});
}
function deliveryDepots(){
 if(!sim||!sim.stops.length||sim.fluidCapacity)return;const k=scale;
 for(const stop of sim.stops){const px=sx(stop.x),ground=CP.height(stop.x,sim.roadId),py=sy(ground);if(px<-k*8||px>W+k*5)continue;
  const paint=stop.done?'#73ad81':'#efc067';
  // Bay markings are painted on the same stable world geometry as the road.
  for(let x=stop.x-3.1;x<stop.x+3.1;x+=.5)line(sx(x),sy(CP.groundHeight(x,sim.roadId))-k*.03,sx(x+.25),sy(CP.groundHeight(x+.25,sim.roadId))-k*.03,paint,Math.max(2,k*.08));
  for(const x of [stop.x-3.5,stop.x+3.5]){const y=CP.height(x,sim.roadId);path([[sx(x-.12),sy(y)],[sx(x),sy(y+.4)],[sx(x+.12),sy(y)]],paint,'#334e42',k*.015);}
  const bx=px+k*4.4,by=py,h=k*1.5,w=k*1.55,snow=sim.route.region===5;
  path([[bx-w*.55,by],[bx-w*.55,by-h],[bx+w*.55,by-h],[bx+w*.55,by]],sim.route.region===3?'#9c7961':'#53715c','#263f3d',k*.028);
  path([[bx-w*.68,by-h],[bx,by-h-k*.60],[bx+w*.68,by-h]],snow?'#e6eddf':'#a17b5a','#354d43',k*.025);
  ctx.fillStyle='#294c45';ctx.fillRect(bx-k*.25,by-k*.95,k*.52,k*.95);ctx.fillStyle='#e0c683';ctx.fillRect(bx-k*.62,by-k*1.20,k*.32,k*.37);
  line(px,py,px,py-k*1.8,'#b5b795',k*.05);circle(px,py-k*1.9,k*.31,paint);ctx.fillStyle='#244232';ctx.font='900 '+Math.max(9,k*.28)+'px monospace';ctx.textAlign='center';ctx.fillText(stop.done?'✓':String(stop.index+1),px,py-k*1.80);
  ctx.font='700 '+Math.max(6,k*.12)+'px monospace';ctx.fillStyle='#e8d8aa';ctx.fillText(stop.name,bx,by-h-k*.70);ctx.textAlign='start';
  // A visible recipient and the accepted parcel remain at this checkpoint.
  const nx=bx-k*.86,ny=by-k*.16;line(nx,ny,nx,ny-k*.54,'#386354',k*.13);circle(nx,ny-k*.68,k*.11,'#d9ad72');line(nx-k*.11,ny-k*.76,nx+k*.12,ny-k*.76,'#e3bb65',k*.055);line(nx,ny-k*.33,nx-k*.14,ny-k*.23,'#cdb685',k*.052);
  if(stop.done){const box=sim.boxes.find(b=>b.delivered&&b.stopIndex===stop.index);if(box)crate({...box,body:{getPosition:()=>({x:stop.x+4.25,y:ground+.39}),getAngle:()=>0}});}
 }
}
function cargoLabel(body){
 if(!sim)return;const kind={3:'water',7:'medical',9:'light',12:'wood',15:'fuel',16:'heat'}[sim.id];if(!kind)return;
 const fill={water:'#507f96',medical:'#b46858',light:'#b3a160',wood:'#6f8c65',fuel:'#b68748',heat:'#b26c4d'}[kind];
 bpoly(body,[[-.13,-.11],[.13,-.11],[.13,.13],[-.13,.13]],fill,'#e3d9b2',scale*.012);
 const ink='#f3e2bc',w=Math.max(1,scale*.025);
 if(kind==='medical'){bodyLine(body,-.085,.01,.085,.01,ink,.035);bodyLine(body,0,-.075,0,.095,ink,.035);}
 else if(kind==='water'){bpoly(body,[[0,.10],[-.07,-.02],[-.045,-.065],[.045,-.065],[.07,-.02]],ink);}
 else if(kind==='light'||kind==='heat'){bpoly(body,[[.015,.10],[-.075,-.005],[-.005,-.005],[-.02,-.085],[.08,.025],[.015,.025]],ink);}
 else if(kind==='fuel'){bpoly(body,[[-.06,-.07],[.06,-.07],[.06,.07],[-.06,.07]],ink);bodyLine(body,-.045,.09,.045,.09,ink,.025);}
 else for(let y=-.055;y<.10;y+=.055)bodyLine(body,-.08,y,.08,y,ink,.024);
}
