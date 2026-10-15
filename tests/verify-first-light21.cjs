'use strict';
const assert=require('node:assert/strict'),P=require('../game/assets/physics.js'),C=require('../game/assets/run-checkpoint.js'),input=require('./driving-input21.cjs');
function tick(s,path='detour'){s.step(...input(s,P,path));}
function copy(s){const saved=C.capture(s,P);assert.ok(saved,'capture');const r=C.restore(JSON.parse(JSON.stringify(saved)),P);assert.ok(r,'restore '+s.path+' x='+s.car.getPosition().x);return r;}
assert.equal(P.routes.length,48);assert.equal(P.profiles.length,48);
const old=new P.Drive(0,[0,0,0],'rover','standard',20);assert.equal(old.boxes.length,3);assert.equal(old.stops[0].x,50);
const s=new P.Drive(0,[0,0,0],'rover','standard',21);assert.ok(s.boxes[0].body.getMass()>old.boxes.reduce((sum,b)=>sum+b.body.getMass(),0)*3,'real heavy load');
for(let n=0;n<5000&&!s.forkWaiting;n++)s.step(.6,false);
assert.ok(s.forkWaiting);const paused=C.capture(s,P);for(let n=0;n<120;n++)s.step(true,false);assert.deepEqual(C.capture(s,P),paused,'fork freezes physics, fuel and clock');
const waiting=copy(s);assert.ok(waiting.forkWaiting);assert.equal(waiting.path,'pending');assert.equal(waiting.choosePath('invalid'),false);
for(const path of ['ridge','detour']){
 const run=copy(s);assert.ok(run.choosePath(path));assert.equal(run.choosePath(path==='ridge'?'detour':'ridge'),false,'cannot switch back to farm coins');assert.equal(run.bridge.length,path==='ridge'?12:0);
 const positions=path==='ridge'?[48,65,106]:[48,110,200];let at=0;
 for(let n=0;n<20000&&run.state==='drive';n++){
  tick(run,path);
  if(at<positions.length&&run.car.getPosition().x>=positions[at]){
   const r=copy(run),before=run.car.getPosition();assert.ok(Math.hypot(before.x-r.car.getPosition().x,before.y-r.car.getPosition().y)<1e-8);assert.deepEqual(r.machine,run.machine);assert.deepEqual(r.items.map(i=>i.got),run.items.map(i=>i.got));
   // Independent controllers preserve physics, gear and cargo state after reload.
   for(let j=0;j<180&&run.state==='drive';j++){tick(run,path);tick(r,path);}
   assert.ok(Math.hypot(run.car.getPosition().x-r.car.getPosition().x,run.car.getPosition().y-r.car.getPosition().y)<.05,'warm continuation '+path);assert.equal(r.machine.integrity,run.machine.integrity);assert.equal(r.coins,run.coins);at++;
  }
 }
 assert.equal(run.state,'win',path+' '+run.reason);assert.equal(run.machine.integrity,100);assert.equal(run.rating(),3);assert.equal(at,positions.length);assert.ok(run.time<140);console.log(path,{seconds:+run.time.toFixed(2),generator:run.machine.integrity,fuel:Math.floor(run.fuel),car:run.condition});
}
const full=new P.Drive(0,[0,0,0],'rover','standard',21);for(let n=0;n<10000&&full.state==='drive';n++){if(full.forkWaiting)full.choosePath('ridge');full.step(true,false);}assert.equal(full.state,'fail');assert.equal(full.reason,'machine');assert.ok(full.machine.integrity<60);console.log('Full throttle damages generator:',full.machine.integrity+'%',full.reason);
const fastTimes={};for(const path of ['ridge','detour']){const s=new P.Drive(0,[0,0,0],'rover','standard',21);for(let n=0;n<10000&&s.state==='drive';n++){if(s.forkWaiting)s.choosePath(path);const x=s.car.getPosition().x,v=s.car.getLinearVelocity(),a=s.car.getAngle();let controls=[true,false];if(path==='ridge'&&x>103&&x<124){controls=v.x>2.7?[false,true]:v.x<2.3?[.5,false]:[false,false];if(s.groundCount===0)controls=[a+s.car.getAngularVelocity()*.2<-.08,a+s.car.getAngularVelocity()*.2>.08];}s.step(...controls);}assert.equal(s.state,'win');assert.equal(s.machine.integrity,100);fastTimes[path]=s.time;}assert.ok(fastTimes.ridge<fastTimes.detour,'skilled braking makes the risky short path faster with intact cargo');console.log('Efficient routes, seconds:',fastTimes);
for(const path of ['ridge','detour']){const a=new P.Drive(0,[0,0,0],'rover','standard',21,{path}),b=new P.Drive(0,[0,0,0],'rover','standard',21,{path,powered:true});assert.equal(a.services.length,0);assert.equal(b.services.length,1);assert.equal(copy(b).workshopPowered,true);}
const service=new P.Drive(0,[0,0,0],'rover','standard',21,{powered:true});service.condition=55;for(let n=0;n<16000&&service.state==='drive';n++)tick(service);assert.equal(service.state,'win');assert.equal(service.services[0].done,true);assert.ok(service.condition>=90);assert.ok(service.fuel>50,'actual repair and fuel after stopping');
for(const prop of [e=>e.machine.integrity=-1,e=>e.path='other',e=>{e.path='ridge';e.waiting=true;}]){const d=JSON.parse(JSON.stringify(paused));prop(d.expedition);assert.equal(C.validate(d,P),null);}
// Existing road/profile data and historical trajectories remain identical.
for(const {edition,checkpoint} of require('./fixtures/checkpoints-0.20.json').rows){const s=C.restore(checkpoint,P);assert.ok(s,'saved APK 0.20 fixture');assert.equal(s.edition,edition);assert.equal(s.boxes.length,3);assert.equal(s.path,undefined);}
const baseline=process.env.CARGO_BASELINE||'/tmp/dustrivo-020/game/assets';
if(require('node:fs').existsSync(baseline+'/physics.js')){
const previous=require(baseline+'/physics.js');
assert.equal(JSON.stringify(P.routes),JSON.stringify(previous.routes));assert.equal(JSON.stringify(P.profiles),JSON.stringify(previous.profiles));
for(const edition of [0,20])for(const id of [0,4,15,38,46,47]){const car=P.routes[id].requires||'rover',a=new P.Drive(id,[0,0,0],car,'standard',edition),b=new previous.Drive(id,[0,0,0],car,'standard',edition);for(let n=0;n<900;n++){const controls=require('./driving-input20.cjs')(a,P);a.step(...controls);if(a.lowGear!==b.lowGear)b.setLowGear(a.lowGear);b.step(...controls);}assert.deepEqual({...a.car.getPosition()},{...b.car.getPosition()},'unchanged legacy trajectory '+edition+'/'+id);const r=C.restore(require(baseline+'/run-checkpoint.js').capture(b,previous),P);assert.ok(r,'0.20 checkpoint');assert.equal(r.edition,edition);}
}
console.log('PASS two physical paths, heavy cargo, risk, frozen fork, six warm restores, power gating, validation and legacy 0.20 compatibility.');
