'use strict';
(function(root){
 function create({height}){
  const reasons=['','cargo','impact','strap','sway'],incidentKinds=['impact','cargo','strap','flipped','ravine'];
  const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
  function init(s){s.driving27={edition:27,previousVy:s.boxes.map(b=>b.body.getLinearVelocity().y),previousStraps:s.boxes.map(b=>!!b.strap),previousCargo:s.remaining(),previousCondition:s.condition,previousHits:s.hardLandings,airTime:0,fallSpeed:0,awardX:0,landings:0,landingBonus:0,sectors:s.sectors.map(()=>({jolt:0,sway:0,reason:''})),incident:null};}
  function incident(s,kind){const r=s.driving27,p=s.car.getPosition(),prior=r.incident,priority={cargo:5,impact:4,strap:3,flipped:2,ravine:2};if(prior&&priority[prior.kind]>priority[kind])return;r.incident={kind,x:p.x,time:s.time,speed:Math.abs(s.car.getLinearVelocity().x)*10.8,angle:angle(s.car.getAngle())};}
  function update(s,dt){
   const r=s.driving27,x=s.car.getPosition().x,velocity=s.car.getLinearVelocity();let jolt=0,sway=0,snapped=false;
   for(let i=0;i<s.boxes.length;i++){const b=s.boxes[i],vy=b.body.getLinearVelocity().y;if(!b.lost&&!b.delivered){if(b.kind==='liquid')sway=Math.max(sway,Math.abs(s.fluidSlosh)/.32);else{const q=s.car.getLocalPoint(b.body.getPosition());sway=Math.max(sway,Math.hypot(q.x-b.home.x,q.y-b.home.y));jolt=Math.max(jolt,vy-r.previousVy[i]);if(r.previousStraps[i]&&!b.strap&&!s.vehicle.closed)snapped=true;}}r.previousVy[i]=vy;r.previousStraps[i]=!!b.strap;}
   const remaining=s.remaining(),hit=s.hardLandings>r.previousHits,lost=remaining<r.previousCargo;
   if(lost)incident(s,'cargo');else if(hit)incident(s,'impact');else if(snapped)incident(s,'strap');
   const air=s.groundCount===0;
   if(air){r.airTime=Math.min(20,r.airTime+dt);r.fallSpeed=Math.max(r.fallSpeed,-velocity.y);}
   else if(r.airTime>0){const slope=Math.atan((height(x+1,s.roadId)-height(x-1,s.roadId))/2),alignment=Math.abs(angle(s.car.getAngle()-slope));if(r.airTime>.20&&r.fallSpeed<7&&alignment<.35&&!lost&&!hit&&s.condition>=r.previousCondition&&s.aboard()>0&&x>r.awardX+8){r.awardX=x;r.landings++;const bonus=5*Math.min(4,s.aboard());r.landingBonus+=bonus;s.coins+=bonus;s.events.push({type:'softLanding27',bonus});}r.airTime=0;r.fallSpeed=0;}
   for(let i=0;i<s.sectors.length;i++){
    const sector=s.sectors[i],tech=r.sectors[i];if(sector.done||x<sector.from)continue;
    if(!sector.entered&&x>sector.to){sector.done=true;continue;}
    if(!sector.entered){sector.entered=true;sector.initialCargo=s.fluidCapacity?s.fluidLitres+s.fluidDelivered:remaining;sector.initialHits=s.hardLandings;}
    sector.maxSpeed=Math.max(sector.maxSpeed,Math.abs(velocity.x));tech.jolt=Math.max(tech.jolt,jolt);tech.sway=Math.max(tech.sway,sway);
    const failure=lost?'cargo':hit?'impact':snapped?'strap':(!s.fluidCapacity&&(sway>.72||jolt>3.4&&sway>.30))?'sway':'';
    if(!tech.reason&&failure){tech.reason=failure;s.events.push({type:'roughSector27',reason:failure,index:i});}
    if(x>sector.to){sector.done=true;sector.passed=!tech.reason&&(s.fluidCapacity?s.fluidLitres+s.fluidDelivered:remaining)>=sector.initialCargo-.5&&s.hardLandings===sector.initialHits;if(sector.passed)s.coins+=sector.reward;s.events.push({type:'sector',passed:sector.passed,reward:sector.reward,physical:true,reason:tech.reason});}
   }
   r.previousCargo=remaining;r.previousCondition=s.condition;r.previousHits=s.hardLandings;
  }
  function valid(d){const r=d?.driving27,num=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;if(!d.course26||!r||r.edition!==27||!Array.isArray(r.previousVy)||r.previousVy.length!==d.groups.boxes.length||r.previousVy.some(v=>!num(v,-500,500))||!Array.isArray(r.previousStraps)||r.previousStraps.length!==r.previousVy.length||r.previousStraps.some(v=>typeof v!=='boolean')||!Array.isArray(r.sectors)||r.sectors.length!==(d.journey?.sectors.length||0))return false;
   if(!Number.isInteger(r.previousCargo)||!num(r.previousCargo,0,100)||!num(r.previousCondition,0,100)||!Number.isInteger(r.previousHits)||!num(r.previousHits,0,10000)||!num(r.airTime,0,20)||!num(r.fallSpeed,0,500)||!num(r.awardX,0,2000)||!Number.isInteger(r.landings)||!num(r.landings,0,250)||!Number.isInteger(r.landingBonus)||r.landingBonus<r.landings*5||r.landingBonus>r.landings*20)return false;
   if(r.sectors.some(s=>!s||!num(s.jolt,0,1000)||!num(s.sway,0,10000)||!reasons.includes(s.reason)))return false;
   return r.incident===null||r.incident&&incidentKinds.includes(r.incident.kind)&&num(r.incident.x,-100,2000)&&num(r.incident.time,0,d.state.time)&&num(r.incident.speed,0,5400)&&num(r.incident.angle,-Math.PI,Math.PI);
  }
  return {init,update,incident,valid};
 }
 if(typeof module==='object')module.exports=create;else root.Driving27Model=create;
})(typeof globalThis!=='undefined'?globalThis:this);
