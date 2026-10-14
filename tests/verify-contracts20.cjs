const assert=require('node:assert/strict'),P=require('../game/assets/physics.js'),C=require('../game/assets/run-checkpoint.js'),input=require('./driving-input20.cjs');
const legacy=new P.Drive(0,[0,0,0]);assert.equal(legacy.stops.length,0);const old=C.capture(legacy,P);assert.ok(C.restore(JSON.parse(JSON.stringify(old)),P),'pre-0.20 checkpoint restores original contract');
const active=new P.Drive(0,[0,0,0],'rover','standard',20);assert.equal(active.stops.length,1);assert.equal(active.sectors.length,2);const saved=C.capture(active,P),restored=C.restore(JSON.parse(JSON.stringify(saved)),P);assert.ok(restored);assert.equal(restored.edition,20);assert.equal(restored.stops.length,1);
const bad=JSON.parse(JSON.stringify(saved));bad.journey.sectors[0].maxSpeed=Infinity;assert.equal(C.validate(bad,P),null);
function advance(s){s.step(...input(s,P));}
for(const id of [0,3,4,1,5,6,2,7,8,9,12,15,46,47]){
 const m=P.routes[id].requires||'rover';let won=null;
 for(let trial=0;trial<3&&!won;trial++){
  const s=new P.Drive(id,[0,0,0],m,'standard',20);
  for(let n=0;n<35000&&s.state==='drive';n++){advance(s);if(n===450){const d=C.capture(s,P),r=C.restore(JSON.parse(JSON.stringify(d)),P);assert.ok(r);assert.deepEqual(r.sectors,s.sectors);}}
  if(s.state==='win')won=s;
 }
 assert.ok(won,'real contract delivery '+id);assert.ok(won.stops.every(s=>s.done));console.log('PASS contract20 '+id+': delivered, stops complete, '+won.sectors.filter(s=>s.passed).length+'/'+won.sectors.length+' clean descents');
}
// A reward is an outcome of physical speed/landing/cargo, and cannot be farmed.
for(const [speed,passed] of [[2,true],[5,false]]){
 const s=new P.Drive(0,[0,0,0],'rover','standard',20),sector=s.sectors[0];s.car.setPosition({x:sector.from+.1,y:P.height(sector.from,0)+2});s.car.setLinearVelocity({x:speed,y:0});s.updateSectors();s.car.setPosition({x:sector.to+.1,y:2});s.updateSectors();assert.equal(sector.passed,passed);const coins=s.coins;assert.equal(coins,passed?35:0);
 const copy=C.restore(JSON.parse(JSON.stringify(C.capture(s,P))),P);assert.ok(copy);copy.car.setPosition({x:sector.from+1,y:2});copy.updateSectors();copy.car.setPosition({x:sector.to+1,y:2});copy.updateSectors();assert.equal(copy.coins,coins,'no duplicate sector reward after restore/reversal');
}
const reverse=new P.Drive(0,[0,0,0],'rover','standard',20);for(let n=0;n<12000&&reverse.car.getPosition().x<55&&reverse.state==='drive';n++)reverse.step(.55,false);assert.equal(reverse.state,'drive');assert.ok(reverse.car.getPosition().x>53.1);for(let n=0;n<3000&&!reverse.stops[0].done&&reverse.state==='drive';n++)reverse.step(false,true);assert.ok(reverse.stops[0].done,'a missed first stop is actually reachable by reverse and unload');
console.log('PASS versioned contracts, legacy restore, measured sector rewards and no replay farming.');

for(const id of [0,4,15,38,46,47]){
 const s=new P.Drive(id,[0,0,0],P.routes[id].requires||'rover','standard',20);for(let n=0;n<900;n++)advance(s);const r=C.restore(JSON.parse(JSON.stringify(C.capture(s,P))),P);assert.ok(r);
 assert.deepEqual(C.capture(r,P).journey,C.capture(s,P).journey,'exact sector state restored');
 const a=s.car.getPosition(),b=r.car.getPosition();assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1e-8,'exact saved body pose');let maxDeviation=0;
 for(let n=0;n<500&&s.state==='drive';n++){
  const controls=input(s,P);if(r.lowGear!==s.lowGear)assert.ok(r.setLowGear(s.lowGear),'test driver gives both copies the same gear change');s.step(...controls);r.step(...controls);
  const d=Math.hypot(s.car.getPosition().x-r.car.getPosition().x,s.car.getPosition().y-r.car.getPosition().y);if(!n)assert.ok(d<.005,'no restore discontinuity');maxDeviation=Math.max(maxDeviation,d);
 }
 assert.ok(maxDeviation<.05,'bounded continuation deviation '+id+' '+maxDeviation);assert.equal(r.coins,s.coins);assert.equal(r.condition,s.condition);assert.deepEqual(r.sectors.map(s=>[s.done,s.passed]),s.sectors.map(s=>[s.done,s.passed]));
}
console.log('PASS exact saved sector/pose state and warm edition20 continuation on six routes, including liquid cargo.');
