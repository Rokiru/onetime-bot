'use strict';
(function(root){
 function create({P,V,routes,profiles,zones,landmarks,bridges,gaps,height}){
  const roads=new Map(),map=new Map(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
  function applyRoute(s){
   const base=s.roadId;if(base.startsWith?.('dispatch:29:'))return;
   const key='dispatch:29:'+base,r=s.route;
   if(!roads.has(key)){
    const protectedAreas=[[0,24],[r.length-18,r.length+20],...(r.stops||r.drops||[]).map(o=>[o.x-14,o.x+14]),...(r.services||[]).map(o=>[o.x-14,o.x+14]),...(r.gates||[]).map(o=>[o.x-18,o.x+13]),...(r.checkpoints||[]).map(o=>[o.x-10,o.x+10]),...(r.hazards||[]).map(o=>[o.from-2,o.to+2]),...(r.fords||[]).map(o=>[o.from-8,o.to+8])];
    for(const b of [bridges[base],gaps[base],r.liftBridge].filter(Boolean))protectedAreas.push([b.from-18,b.to+16]);
    let technical=null;
    if(s.edition!==25&&!(r.fords?.length||r.liftBridge||bridges[base])){
     for(let x=Math.round(r.length*.42);x<r.length*.65;x++)if(!protectedAreas.some(([a,b])=>x+10>a&&x<b)){technical={from:x,to:x+10,type:'mud',friction:.72};break;}
    }
    routes[key]={...r,roadId:key};profiles[key]=(profiles[base]||[]).map(p=>p.slice());zones[key]=(zones[base]||[]).map(o=>({...o}));if(technical)zones[key].push(technical);landmarks[key]=(landmarks[base]||[]).map(o=>({...o}));if(technical)landmarks[key].push({x:technical.from-4,type:'sign',text:'ВЯЗКИЙ УЧАСТОК · 4L'});if(bridges[base])bridges[key]={...bridges[base]};if(gaps[base])gaps[key]={...gaps[base]};
    let ridge=null;if(s.edition!==25){for(let x=Math.round(r.length*.70);x<r.length-50;x++)if(!protectedAreas.some(([a,b])=>x+30>a&&x<b)){ridge={from:x,to:x+30,peak:x+14,name:'ПОСЛЕДНИЙ ПОДЪЁМ',tip:'Понижайка перед склоном. За вершиной — точная подача.',type:'c',points:[[x,0],[x+4,0],[x+14,2.4],[x+18,2.4],[x+28,0],[x+30,0]]};break;}}
    roads.set(key,{base,technical,ridge});map.set(base,key);
   }
   const data=roads.get(key);s.roadId=key;s.route={...r,...(r.kind==='timed'?{limit:r.limit+16}:{}),...(r.kind==='eco'?{minFuel:Math.max(4,r.minFuel-8)}:{}),hazards:[...(r.hazards||[]),...(data.ridge?[data.ridge]:[])],roadId:key,phases:[{from:0,to:r.length*.33,name:'ТЕМП'},{from:r.length*.33,to:r.length*.67,name:'ТЕХНИКА'},{from:r.length*.67,to:r.length+6,name:s.edition===25?'ПЕРЕВАЛ':'ПОДАЧА'}],technical:data.technical};s.logistics29Model=api;
  }
  function init(s){
   const v=s.car.getLinearVelocity();s.logistics29={edition:29,integrity:100,shockG:1,peakG:1,previousVx:v.x,previousVy:v.y,previousHits:s.hardLandings,cooldown:0,punctured:false,leakRate:0,penalty:0,parkingBonus:0,rescues:0,parking:s.stops.map(()=>({grade:'pending',deadline:0})),arrival:{grade:'pending',hold:0,deadline:0}};
   if(s.pace30)s.logistics29.layout30=30;
   s._chassisImpact29=0;s.world.on('post-solve',(contact,impulse)=>{const a=contact.getFixtureA().getBody(),b=contact.getFixtureB().getBody();if(a!==s.car&&b!==s.car)return;const other=a===s.car?b:a;if(!['ground','rock','bridge'].includes(other.getUserData()))return;const n=(impulse.normalImpulses||[]).reduce((x,y)=>x+y,0)/Math.max(1,s.car.getMass());s._chassisImpact29=Math.max(s._chassisImpact29,n);});
   if(s.fluidCapacity)s.syncFluidMass();
  }
  function bumperError(s,x){return s.car.getWorldPoint(V(s.vehicle.width,.08)).x-(x+s.vehicle.width);}
  function grade(s,x,gas,brake){const p=s.car.getPosition(),v=s.car.getLinearVelocity(),error=Math.abs(bumperError(s,x));if(gas||!brake||s.groundCount<2||Math.abs(v.y)>.7||Math.abs(angle(s.car.getAngle()))>.4)return '';return error<=.70&&Math.abs(v.x)<.25?'perfect':error<=3.1&&Math.abs(v.x)<.45?'normal':'';}
  function stopUpdate(s,gas,brake,dt){
   const stop=s.nextStop();if(!stop)return;const r=s.logistics29,record=r.parking[stop.index],x=s.car.getPosition().x;
   if(!stop.warned&&x>stop.x-100){stop.warned=true;s.events.push({type:'stopApproach',index:stop.index});}
   if(x>stop.x+4&&!record.deadline){record.deadline=s.time+8;s.events.push({type:'overshoot29',index:stop.index});}
   if(record.deadline&&s.time>record.deadline&&Math.abs(x-stop.x)>3.1&&stop.cargoIndex===undefined){record.grade='skipped';stop.done=true;stop.elapsed=0;stop.boxIndex=-1;r.penalty+=25;s.events.push({type:'missed29',index:stop.index,fee:25});return;}
   const quality=grade(s,stop.x,gas,brake);if(!quality){stop.elapsed=0;stop.boxIndex=-1;return;}s.parkingHold=true;
   const duration=(s.fluidCapacity?2:stop.duration||1.3)*(quality==='perfect'?.60:1);
   if(s.fluidCapacity){if(s.fluidLitres<stop.litres+(s.route.minLitres||0)){s.end('liquid');return;}stop.elapsed+=dt;if(stop.elapsed>=duration){s.fluidLitres-=stop.litres;s.fluidDelivered+=stop.litres;s.syncFluidMass();stop.done=true;stop.elapsed=duration;record.grade=quality;if(quality==='perfect'){r.parkingBonus+=15;s.coins+=15;}s.events.push({type:'stopComplete',index:stop.index,name:stop.name,litres:stop.litres,quality});}return;}
   if(stop.boxIndex<0){const boxes=s.boxes.filter(b=>!b.lost&&!b.delivered&&(stop.cargoIndex===undefined||b.index===stop.cargoIndex)).sort((a,b)=>s.car.getLocalPoint(b.body.getPosition()).y-s.car.getLocalPoint(a.body.getPosition()).y);if(!boxes.length){s.end('cargo');return;}stop.boxIndex=boxes[0].index;}
   if(s.edition===22&&s.pump.integrity<70){s.end('pump');return;}stop.elapsed+=dt;
   if(stop.elapsed>=duration){const box=s.boxes[stop.boxIndex];box.delivered=true;box.stopIndex=stop.index;box.out=0;for(const j of [box.strap,box.strap2])if(j)s.world.destroyJoint(j);box.strap=box.strap2=null;box.body.setActive(false);stop.done=true;stop.elapsed=duration;record.grade=quality;if(quality==='perfect'){r.parkingBonus+=15;s.coins+=15;}s.events.push({type:'stopComplete',index:stop.index,name:stop.name,quality});}
  }
  function eligibility(s){if(s.edition===22&&s.pump.integrity<70)return 'pump';if(s.edition===21&&s.machine.integrity<60)return 'machine';if(s.fluidCapacity&&s.fluidLitres<(s.route.minLitres||0))return 'liquid';if(s.liftBridges.some(b=>!b.done))return 'bridge';if(s.gates.some(g=>!g.open))return 'gate';if(s.services.some(o=>o.required&&!o.done))return 'service';if(s.nextStop())return 'stops';if(s.stops.length&&!s.aboard())return 'cargo';if(s.route.kind==='eco'&&s.fuel<s.route.minFuel)return 'eco';if(s.route.kind==='survey'&&s.checkpoints.some(p=>!p.done))return 'survey';if(s.route.kind==='careful'&&s.remaining()!==s.route.boxes)return 'fragile';return '';}
  function update(s,gas,brake,dt){
   const r=s.logistics29,v=s.car.getLinearVelocity(),ax=(v.x-r.previousVx)/dt,ay=(v.y-r.previousVy)/dt+12,g=Math.hypot(ax,ay)/12;r.previousVx=v.x;r.previousVy=v.y;r.peakG=Math.max(r.peakG,Math.min(100,g));r.shockG=Math.max(Math.min(40,g),r.shockG-dt*8);r.cooldown=Math.max(0,r.cooldown-dt);
   const hit=s.hardLandings>r.previousHits,impulse=s._chassisImpact29||0;r.previousHits=s.hardLandings;s._chassisImpact29=0;
   if(r.cooldown===0&&(hit||impulse>2.8||g>18)){const damage=Math.min(35,Math.max(1,Math.round(hit?15:impulse>2.8?(impulse-2.8)*8:(g-18)*.6)));if(s.route.kind==='careful'&&!s.fluidCapacity){r.integrity=Math.max(0,r.integrity-damage);s.events.push({type:'cargoShock29',damage});}r.cooldown=.6;}
   if(s.fluidCapacity&&!r.punctured&&(hit||impulse>3.2||Math.abs(angle(s.car.getAngle()))>1.45&&impulse>.15)){r.punctured=true;r.leakRate=2.5+Math.min(5,impulse*.4);s.events.push({type:'puncture29'});}
   if(s.state!=='drive'||s.edition===25||s.edition===23)return;
   const x=s.car.getPosition().x,target=s.route.length+6,a=r.arrival;if(x<target-10)return;
   if(x>target+4&&!a.deadline){a.deadline=s.time+8;s.events.push({type:'overshoot29',index:-1});}
   const quality=grade(s,target,gas,brake);a.hold=quality?a.hold+dt:0;if(quality)s.parkingHold=true;
   if(a.hold>=(quality==='perfect'?.65:1.1)||a.deadline&&s.time>a.deadline){const failure=eligibility(s);if(failure){if(failure!=='stops')s.end(failure);return;}a.grade=quality||'skipped';if(a.grade==='perfect'){r.parkingBonus+=25;s.coins+=25;}if(a.grade==='skipped')r.penalty+=40;s.end('delivered');}
  }
  function braking(s){const v=Math.max(0,s.car.getLinearVelocity().x),surface=(zones[s.roadId]||[]).find(o=>s.car.getPosition().x>=o.from&&s.car.getPosition().x<=o.to),cargo=s.boxes.filter(b=>!b.lost&&!b.delivered).reduce((n,b)=>n+b.body.getMass(),0),mass=s.car.getMass()+s.wheels.reduce((n,b)=>n+b.getMass(),0),load=1+cargo/Math.max(1,mass);return v*.45+v*v*load/(2*7*Math.max(.4,surface?.friction||1));}
  function valid(d){const r=d?.logistics29,num=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b,grades=['pending','perfect','normal','skipped'];if(!r||Object.keys(r).some(k=>!['layout30','edition','integrity','shockG','peakG','previousVx','previousVy','previousHits','cooldown','punctured','leakRate','penalty','parkingBonus','rescues','parking','arrival'].includes(k))||(r.layout30!==undefined&&(r.layout30!==30||!d.pace30))||(d.pace30&&r.layout30!==30)||r.edition!==29||!d.course26&&!d.ridge25||!num(r.integrity,0,100)||!num(r.shockG,0,100)||!num(r.peakG,0,100)||!num(r.previousVx,-500,500)||!num(r.previousVy,-500,500)||!Number.isInteger(r.previousHits)||!num(r.previousHits,0,10000)||!num(r.cooldown,0,.6)||typeof r.punctured!=='boolean'||!num(r.leakRate,0,10)||!Number.isInteger(r.penalty)||!num(r.penalty,0,10000)||!Number.isInteger(r.parkingBonus)||!num(r.parkingBonus,0,1000)||!Number.isInteger(r.rescues)||!num(r.rescues,0,2)||!Array.isArray(r.parking)||r.parking.length!==d.groups.stops.length||!r.arrival)return false;
   if(r.parking.some((p,i)=>!p||Object.keys(p).length!==2||!grades.includes(p.grade)||!num(p.deadline,0,d.state.time+8.1)||(p.grade==='pending')===d.groups.stops[i].done))return false;if(r.penalty<r.rescues*40+r.parking.filter(p=>p.grade==='skipped').length*25||r.parkingBonus!==r.parking.filter(p=>p.grade==='perfect').length*15)return false;return Object.keys(r.arrival).length===3&&r.arrival.grade==='pending'&&num(r.arrival.hold,0,2)&&num(r.arrival.deadline,0,d.state.time+8.1);
  }
  function recover(s,snapshot,checkpoints,physics){
   if(!s.logistics29||s.logistics29.rescues>=2||s.paid||!snapshot?.logistics29||snapshot.attempt!==s.attemptId)return null;
   const restored=checkpoints.restore(snapshot,physics);if(!restored)return null;
   restored.time=Math.max(s.time,restored.time)+5;restored.logistics29.rescues=s.logistics29.rescues+1;restored.logistics29.penalty=Math.max(s.logistics29.penalty,restored.logistics29.penalty)+40;restored.started=true;return restored;
  }
  const api={bumperError,grade,recover,applyRoute,init,stopUpdate,update,eligibility,braking,valid,height:(x,key)=>{const d=roads.get(key),base=height(x,d.base),h=d.ridge;if(!h||x<h.from||x>h.to)return base;for(let n=1;n<h.points.length;n++){if(x>h.points[n][0])continue;const a=h.points[n-1],b=h.points[n],t=clamp((x-a[0])/(b[0]-a[0]),0,1);return base+a[1]+(b[1]-a[1])*t*t*(3-2*t);}return base;}};return api;
 }
 if(typeof module==='object')module.exports=create;else root.Logistics29Model=create;
})(typeof globalThis!=='undefined'?globalThis:this);
