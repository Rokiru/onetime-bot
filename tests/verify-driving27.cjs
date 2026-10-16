'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),P=require('../game/assets/physics.js'),C=require('../game/assets/run-checkpoint.js'),input=require('./driving-input26.cjs');
const make=id=>{const r=P.contractRoute(id);return new P.Drive(id,[0,0,0],r.requires||'rover','standard',P.courses26.edition(id),{course:26,skill:27,support:true,recoveryBonus:true});};
function checkpoint(s){const d=C.capture(s,P);assert.ok(d,'capture '+s.id);const r=C.restore(structuredClone(d),P);assert.ok(r,'restore '+s.id);assert.deepEqual(r.driving27,s.driving27);return r;}
const rows=[];let airRestore=false,roughRestore=false,fastClean=false;
for(let id=0;id<48;id++){
 const s=make(id);let controls=[false,false],stall=0,restored=false,twin=null,twinSteps=0;
 for(let n=0;n<18000&&s.state==='drive';n++){
  if(n%12===0||s.forkWaiting){controls=input(s,P);if(s.edition!==23&&s.groundCount&&Math.abs(s.car.getLinearVelocity().x)<.12&&controls[0])stall+=.2;else stall=0;if(stall>1.6){s.useWinch();stall=0;}}
  if(twin&&twin.lowGear!==s.lowGear)assert.ok(twin.setLowGear(s.lowGear));
  s.step(...controls);
  if(twin){twin.step(...controls);if(++twinSteps===120){assert.equal(s.state,twin.state);assert.equal(s.driving27.landings,twin.driving27.landings);assert.equal(s.driving27.landingBonus,twin.driving27.landingBonus);assert.ok(Math.abs(s.car.getPosition().x-twin.car.getPosition().x)<.05,'air warm trajectory');twin=null;}}
  if(!restored&&s.state==='drive'&&s.car.getPosition().x>s.route.hazards[0].from+8){checkpoint(s);restored=true;}
  if(id===1&&!airRestore&&s.driving27.airTime>.20&&s.state==='drive'){
   airRestore=true;twin=checkpoint(s);
  }
 }
 assert.equal(s.state,'win','route '+id+' '+s.reason);assert.ok(restored);assert.ok(s.driving27.sectors.every(x=>!x.reason),'careful driver clean '+id+' '+JSON.stringify(s.driving27.sectors));assert.ok(s.sectors.every(x=>x.passed),'all sectors '+id);assert.ok(s.driving27.landingBonus>=s.driving27.landings*5&&s.driving27.landingBonus<=s.driving27.landings*20,'bonus counts aboard cargo '+id);
 rows.push({id,time:+s.time.toFixed(2),condition:s.condition,stars:s.rating(),landings:s.driving27.landings,landingBonus:s.driving27.landingBonus,sectors:s.driving27.sectors});console.log('DELIVERED skill27',id,s.rating(),s.driving27.landingBonus);
}
assert.ok(airRestore,'warm save during real jump');
for(const id of [1,5]){const s=make(id);for(let n=0;n<9000&&s.state==='drive';n++){
 s.step(true,false);if(s.sectors.some(x=>x.passed&&x.maxSpeed*10.8>60))fastClean=true;
 if(id===5&&!roughRestore&&s.state==='drive'&&s.driving27.sectors.some(x=>x.reason)){
  roughRestore=true;const r=checkpoint(s);for(let k=0;k<90&&s.state==='drive';k++){s.step(true,false);r.step(true,false);}assert.deepEqual(r.driving27.sectors.map(x=>x.reason),s.driving27.sectors.map(x=>x.reason));assert.deepEqual(r.sectors.map(x=>x.passed),s.sectors.map(x=>x.passed));assert.equal(r.coins,s.coins);
 }
}if(id===1){assert.equal(s.reason,'damage');assert.equal(s.driving27.incident.kind,'impact');assert.ok(s.driving27.incident.speed>60);}else{assert.equal(s.state,'win');assert.equal(s.remaining(),s.boxes.length);assert.ok(s.driving27.sectors.some(x=>x.reason==='sway'));assert.equal(s.rating(),2);}}
assert.ok(fastClean,'smooth actual fast sector earns bonus without arbitrary speed cap');assert.ok(roughRestore,'rough sector saved before cargo loss');
// Observation must never alter body forces, transmission, cargo or fuel.
for(const id of [1,28,41]){const a=make(id),r=P.contractRoute(id),b=new P.Drive(id,[0,0,0],r.requires||'rover','standard',P.courses26.edition(id),{course:26,support:true,recoveryBonus:true});for(let n=0;n<2000&&a.state==='drive';n++){const c=input(a,P),other=input(b,P);assert.deepEqual(c,other);a.step(...c);b.step(...other);}assert.deepEqual(a.car.getPosition(),b.car.getPosition());assert.equal(a.condition,b.condition);assert.equal(a.fuel,b.fuel);assert.equal(a.remaining(),b.remaining());}
const live=make(1);for(let n=0;n<120;n++)live.step(.5,false);const d=C.capture(live,P);assert.ok(d);
for(const mutate of [d=>delete d.course26,d=>d.driving27.edition=28,d=>d.driving27.previousVy.pop(),d=>d.driving27.previousVy[0]=Infinity,d=>d.driving27.previousStraps[0]=1,d=>d.driving27.sectors.pop(),d=>d.driving27.sectors[0].reason='speed',d=>d.driving27.airTime=-1,d=>d.driving27.awardX=Infinity,d=>d.driving27.landingBonus=20,d=>d.driving27.incident={kind:'impact',x:2,time:d.state.time+1,speed:10,angle:0}]){const bad=structuredClone(d);mutate(bad);assert.equal(C.validate(bad,P),null);}
const oldDir=process.env.CARGO_BASELINE26||'/tmp/dustrivo-026/game/assets',old=fs.existsSync(path.join(oldDir,'physics.js'))?require(path.join(oldDir,'physics.js')):null;let archived=0;
for(const row of require('./fixtures/checkpoints-0.26.json').rows){const a=C.restore(row.checkpoint,P);assert.ok(a,row.name);assert.equal(a.driving27,undefined);if(old){const b=C.restore(row.checkpoint,old);assert.ok(b,row.name);for(let n=0;n<180&&a.state==='drive';n++){const c=input(a,P),other=input(b,old);assert.deepEqual(c,other);a.step(...c);b.step(...other);}assert.equal(a.state,b.state);assert.ok(Math.abs(a.car.getPosition().x-b.car.getPosition().x)<1e-8,row.name);assert.equal(a.reward(),b.reward());archived++;}}
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/driving27-results.json',JSON.stringify({controlled:rows,airRestore,roughRestore,fastClean,archived},null,2));console.log('PASS driving27: 48 stock routes, physical cleanliness and fast clean driving, real soft landings, warm states, unchanged forces, invalid-state rejection and archived 0.26 trajectories:',archived);
