'use strict';
const assert=require('node:assert/strict'),P=require('../game/assets/physics.js'),C=require('../game/assets/run-checkpoint.js'),input=require('./driving-input22.cjs');
function tick(s){s.step(...input(s,P));}
function clone(s){const d=C.capture(s,P);assert.ok(d,'capture at '+s.car.getPosition().x);const r=C.restore(JSON.parse(JSON.stringify(d)),P);assert.ok(r,'restore at '+s.car.getPosition().x);return r;}
assert.equal(P.routes.length,48);assert.equal(P.profiles.length,48);assert.equal(new P.Drive(3,[0,0,0],'rover','standard',20).edition,20);
const run=new P.Drive(3,[0,0,0],'rover','standard',22);assert.equal(run.boxes[0].kind,'pump');assert.equal(run.boxes[1].kind,'controls');assert.ok(run.boxes[0].body.getMass()>run.boxes[1].body.getMass()*6);assert.equal(run.services.length,0);
const restored=[];let lowestInstalled=0;
for(let n=0;n<18000&&run.state==='drive';n++){
 tick(run);const x=run.car.getPosition().x,stop=run.stops[0],gate=run.gates[0];
 const stage=!gate.requested&&gate.elapsed>.3?'gate':run.inWater&&x>66&&x<69?'ford':stop.elapsed>1.3&&!stop.done?'install':stop.done&&x>144?'installed':null;
 if(stage&&!restored.includes(stage)){
  const r=clone(run);assert.deepEqual(r.pump,run.pump);assert.deepEqual(r.stops.map(s=>[s.done,s.elapsed,s.boxIndex]),run.stops.map(s=>[s.done,s.elapsed,s.boxIndex]));
  for(let k=0;k<120&&run.state==='drive';k++){tick(run);tick(r);}
  assert.ok(Math.hypot(r.car.getPosition().x-run.car.getPosition().x,r.car.getPosition().y-run.car.getPosition().y)<.05,'warm continuation '+stage);assert.equal(r.pump.integrity,run.pump.integrity);assert.equal(r.coins,run.coins);restored.push(stage);
 }
 if(stop.done){lowestInstalled=run.pump.integrity;assert.equal(run.boxes[0].delivered,true);assert.equal(run.boxes[1].delivered,undefined);assert.equal(run.aboard(),1,'only cabinet remains aboard');assert.equal(stop.boxIndex,0);assert.equal(stop.elapsed,3);}
}
assert.equal(run.state,'win',run.reason);assert.equal(run.rating(),3);assert.ok(run.peakWaterDepth>.5&&run.peakWaterDepth<.9);assert.equal(run.pump.integrity,100);assert.equal(lowestInstalled,100);assert.equal(run.gates[0].open,true);assert.deepEqual(restored,['gate','ford','install','installed']);
const damaged=new P.Drive(3,[0,0,0],'rover','standard',22);damaged.pump.integrity=69;for(let n=0;n<15000&&damaged.state==='drive';n++)tick(damaged);assert.equal(damaged.reason,'pump');assert.equal(damaged.stops[0].done,false,'damaged equipment cannot be installed');
const lostControls=new P.Drive(3,[0,0,0],'rover','standard',22);lostControls.boxes[1].lost=true;for(let n=0;n<18000&&lostControls.state==='drive';n++)tick(lostControls);assert.equal(lostControls.state,'fail');assert.ok(['cargo','fragile'].includes(lostControls.reason));
const full=new P.Drive(3,[0,0,0],'rover','standard',22);for(let n=0;n<4000&&full.state==='drive';n++)full.step(true,false);assert.notEqual(full.state,'win','holding gas does not fulfil mandatory route tasks');assert.equal(full.gates[0].requested,false);assert.ok(full.car.getPosition().x<48,'closed post blocks progress');assert.equal(full.stops[0].done,false);
const crew=new P.Drive(3,[0,0,0],'rover','standard',22,{support:true});crew.condition=55;let serviced=null;for(let n=0;n<18000&&crew.state==='drive';n++){tick(crew);if(!serviced&&crew.services[0].elapsed>.7)serviced=clone(crew);}
assert.equal(crew.state,'win');assert.equal(crew.services[0].done,true);assert.equal(crew.condition,93);assert.ok(serviced);assert.equal(serviced.workshopSupport,true);for(let n=0;n<18000&&serviced.state==='drive';n++)tick(serviced);assert.equal(serviced.state,'win');assert.equal(serviced.condition,crew.condition);assert.ok(crew.fuel>run.fuel+10,'real refuelling by unlocked crew');
const bad=C.capture(new P.Drive(3,[0,0,0],'rover','standard',22),P);for(const mutate of [d=>d.waterRun.pump.integrity=-1,d=>d.waterRun.support='yes',d=>d.id=0]){const d=JSON.parse(JSON.stringify(bad));mutate(d);assert.equal(C.validate(d,P),null);}
// Fixtures captured by the preceding shipped build, before any 0.22 edits.
for(const {name,checkpoint} of require('./fixtures/checkpoints-0.21.json').rows){const s=C.restore(checkpoint,P);assert.ok(s,'0.21 checkpoint '+name);assert.equal(s.edition,checkpoint.expedition?21:20);assert.equal(s.roadId,checkpoint.expedition?'light:'+checkpoint.expedition.path:3);}
for(const [setup,level] of [['standard',5],['economy',0],['economy',5],['trail',0],['trail',5]]){const s=new P.Drive(3,[level,level,level],'rover',setup,22);for(let n=0;n<18000&&s.state==='drive';n++)tick(s);assert.equal(s.state,'win',setup+' level '+level+' '+s.reason);assert.equal(s.pump.integrity,100);}
console.log('PASS water22: real 600 m delivery, 3 s pump installation, cabinet retained, 0.67 m ford, four warm restores, damaged/lost cargo rejection, unlocked crew repair/refuel and old 0.21 saves.',{seconds:run.time,integrity:run.pump.integrity,crewFuel:crew.fuel,withoutCrewFuel:run.fuel});
