'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),P=require('../game/assets/physics.js'),C=require('../game/assets/run-checkpoint.js'),input=require('./driving-input25.cjs');
function restore(s){const d=C.capture(s,P);assert.ok(d,'capture');const r=C.restore(structuredClone(d),P);assert.ok(r,'restore');assert.deepEqual(r.ridge,s.ridge);assert.deepEqual(r.ridge28,s.ridge28);return r;}
const rows=[];let protectedSamples=0,lateJump=false;
for(let x=-30;x<=155;x+=.5){assert.ok(Math.abs(P.groundHeight(x,'ridge:25')-P.groundHeight(x,P.ridge28.key))<1e-9);protectedSamples++;}
assert.equal(P.routes.length,48);assert.equal(P.profiles.length,48);
for(const load of [1,3]){
 const s=new P.Drive(0,[0,0,0],'rover','standard',25,{load,trail:28});const camps=[],reckless=[];let lastCamp=0;
 for(let n=0;n<18000&&s.state==='drive';n++){
  if(s.ridge.waiting&&s.ridge28.camp!==lastCamp){lastCamp=s.ridge28.camp;const r=restore(s),before={time:r.time,x:r.car.getPosition().x,boxes:r.boxes.map(b=>({...b.body.getPosition()}))};for(let k=0;k<600;k++)r.step(true,false);assert.equal(r.time,before.time);assert.equal(r.car.getPosition().x,before.x);assert.deepEqual(r.boxes.map(b=>({...b.body.getPosition()})),before.boxes);
   const cash=restore(s),offer=P.ridge28.offer(cash),cargo=cash.remaining(),soft=cash.ridge.landings;assert.ok(cash.ridgeDeliver());assert.equal(cash.ridgeScore(),cargo*offer.value+soft);assert.equal(cash.ridgeContinue(),false);assert.equal(cash.ridgeDeliver(),false);camps.push({camp:lastCamp,cargo,condition:s.condition,bank:cash.ridgeScore()});
   if(lastCamp>=2){const held=restore(s);held.ridgeContinue();for(let k=0;k<9000&&held.state==='drive'&&!held.ridge.waiting;k++)held.step(true,false);reckless.push({camp:lastCamp,state:held.state,reason:held.reason,condition:held.condition,cargo:held.remaining()});if(lastCamp===3){assert.equal(held.state,'fail');assert.equal(held.ridgeScore(),0,'last safe bank is at stake');}}
   assert.ok(r.ridgeContinue());assert.equal(r.fuel,100);assert.equal(r.condition,100);assert.equal(r.remaining(),cargo,'lost cargo never respawns');assert.equal(r.ridgeContinue(),false);
   const d=C.capture(s,P);for(const change of [d=>d.ridge28.edition=29,d=>d.ridge28.camp=4,d=>d.ridge28.camp=0,d=>d.ridge28.unknown=true,d=>delete d.ridge25,d=>d.ridge25.awardX=Infinity,d=>d.course26={edition:26}]){const bad=structuredClone(d);change(bad);assert.equal(C.validate(bad,P),null);}
  }
  if(load===1&&!lateJump&&s.car.getPosition().x>278&&s.groundCount===0){lateJump=true;const r=restore(s);for(let k=0;k<36&&s.state==='drive';k++){const c=input(s,P);s.step(...c);r.step(...c);}assert.ok(Math.abs(s.car.getPosition().x-r.car.getPosition().x)<.05);assert.ok(Math.abs(s.car.getAngle()-r.car.getAngle())<.05);assert.equal(s.ridge.landings,r.ridge.landings);}
  if(s.car.getPosition().x>290&&s.car.getPosition().x<315){const view=P.ridge28.camera(s,873,393),sy=y=>393*.55-(y-view.y)*view.scale;assert.ok(sy(s.car.getPosition().y+1.4)>=393*.18);assert.ok(sy(P.height(s.car.getPosition().x+12,s.roadId))<=393*.76);}
  s.step(...input(s,P));
 }
 assert.equal(s.state,'win',s.reason);assert.equal(s.ridge28.camp,3);assert.equal(s.ridgeScore(),s.remaining()*750+s.ridge.landings);assert.ok(s.remaining()>0);assert.equal(camps.length,3);assert.ok(s.distance>=P.ridge28.distance);rows.push({load,time:+s.time.toFixed(2),cargo:s.remaining(),score:s.ridgeScore(),soft:s.ridge.landings,camps,reckless});console.log('PASS ridge28',load,'three camps + full series',s.remaining(),s.ridgeScore());
}
assert.ok(lateJump,'real jump in the new last leg');
const dir=process.env.CARGO_BASELINE27||'/tmp/dustrivo-027/game/assets',old=fs.existsSync(path.join(dir,'physics.js'))?require(path.join(dir,'physics.js')):null;let archived=0;const storyInput=require('./driving-input26.cjs');
for(const row of require('./fixtures/checkpoints-0.27.json').rows){const s=C.restore(row.checkpoint,P);assert.ok(s,row.name);assert.equal(s.ridge28,undefined);if(old){const b=C.restore(row.checkpoint,old);assert.ok(b);for(let n=0;n<180&&s.state==='drive';n++){const c=storyInput(s,P),other=storyInput(b,old);assert.deepEqual(c,other);s.step(...c);b.step(...other);}assert.equal(s.state,b.state);assert.ok(Math.abs(s.car.getPosition().x-b.car.getPosition().x)<1e-8,row.name);assert.equal(s.ridge?s.ridgeScore():s.reward(),b.ridge?b.ridgeScore():b.reward());archived++;}}
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/ridge28-results.json',JSON.stringify({rows,protectedSamples,lateJump,archived,controller:'public pedals sampled at 60Hz; this proves a strategy, not a human playtest'},null,2));console.log('PASS ridge28: exact old prefix, 3 frozen camps/load, real cash-out and escalating risk, repair/refuel without cargo restoration, warm late jump, malformed state and 7 archived 0.27 states:',archived);
