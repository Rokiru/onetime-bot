'use strict';
// Developer-only: record successful public-control strategies, never synthesize poses/time.
const fs=require('node:fs'),assert=require('node:assert/strict'),P=require('../game/assets/physics.js'),input=require('../tests/driving-input30.cjs');
const traces={},strategies=[];
for(let id=0;id<48;id++){
 const candidates=[];
 for(const sample of [12,6,9,15,18,3,4]){
  const r=P.contractRoute(id),s=new P.Drive(id,[0,0,0],r.requires||'rover','standard',P.courses26.edition(id),{course:26,skill:27,logistics:29,pace:30,support:true,recoveryBonus:true});let c=[false,false],stall=0;
  for(let n=0;n<15000&&s.state==='drive';n++){
   if(n%sample===0||s.forkWaiting){c=input(s,P);if(s.edition!==23&&s.groundCount&&Math.abs(s.car.getLinearVelocity().x)<.12&&c[0])stall+=sample/60;else stall=0;if(stall>1.6){s.useWinch();stall=0;}}s.step(...c);
  }
  const clean=s.state==='win'&&s.remaining()===s.route.boxes&&s.logistics29.integrity===100&&!s.logistics29.punctured&&s.sectors.every(o=>o.passed);console.log('record30',id,sample,s.state,s.reason,+s.time.toFixed(2),clean?'clean':'rejected');if(!clean)continue;
  const p=s.car.getPosition(),points=s.trace.map(p=>p.slice()),end=[Math.round(s.time*60),Math.round(p.x*100),Math.round(p.y*100),Math.round(s.car.getAngle()*1000)];if(points.at(-1)?.[0]===end[0])points[points.length-1]=end;else points.push(end);
  candidates.push({pace30:30,logistics29:29,course26:26,...(id===0?{path21:'detour'}:{}),car:s.vehicle.id,setup:s.vehicle.setup,levels:[0,0,0],duration:s.time,points});strategies.push({id,sample,time:s.time});if(candidates.length===3)break;
 }
 assert.equal(candidates.length,3,'three actual clean recordings needed for road '+id);candidates.sort((a,b)=>a.duration-b.duration);traces['road'+id]={gold:candidates[0],silver:candidates[1],bronze:candidates[2]};
 fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/mechanic30-recordings.json',JSON.stringify({traces,strategies}));
}
fs.writeFileSync('game/assets/mechanic30.js',"'use strict';\n// 144 actual clean stock runs; simulation at 60Hz, recorded poses every 0.5s.\nwindow.Mechanic30="+JSON.stringify(traces)+';\n');
console.log('PASS recorded 144 actual clean stock drives on 0.30 roads');
