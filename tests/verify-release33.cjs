'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),P=require('../game/assets/physics'),C=require('../game/assets/run-checkpoint'),G=require('../game/assets/ghost'),input=require('./driving-input30.cjs');
assert.equal(P.routes.length,50);assert.equal(P.profiles.length,50);
const make=(id,car,library=P)=>new library.Drive(id,[0,0,0],car||library.contractRoute(id).requires||'rover','standard',library.courses26.edition(id),{fleet:31,course:26,skill:27,logistics:29,pace:30,support:true,recoveryBonus:true});
const rows=[];let warm=0;
for(const [id,car] of [[48,'rover'],[48,'rivet'],[49,'tanker'],[49,'delta']]){
 const s=make(id,car);let controls=[false,false],twin=null,left=0,restored=false;
 for(let n=0;n<16000&&s.state==='drive';n++){
  if(n%12===0)controls=input(s,P);s.step(...controls);
  if(twin){if(twin.lowGear!==s.lowGear)twin.setLowGear(s.lowGear);twin.step(...controls);if(!--left){assert.equal(twin.state,s.state);assert.ok(Math.abs(twin.car.getPosition().x-s.car.getPosition().x)<.05);assert.equal(twin.remaining(),s.remaining());twin=null;warm++;}}
  if(!restored&&s.car.getPosition().x>70){twin=C.restore(C.capture(s,P),P);assert.ok(twin);restored=true;left=120;}
 }
 assert.equal(s.state,'win',id+'/'+car+' '+s.reason);assert.equal(s.remaining(),s.route.boxes);assert.equal(s.logistics29.integrity,100);assert.equal(s.logistics29.punctured,false);assert.ok(s.stops.every(o=>o.done));assert.ok(s.sectors.every(o=>o.passed));assert.ok(s.time>=60&&s.time<=120);
 const stats={};G.saveBestGhost(s,stats);assert.ok(stats.ghost30&&G.ghostMatches(stats.ghost30,s));assert.equal(G.ghostMatches(stats.ghost30,make(id,({rover:'rivet',rivet:'rover',tanker:'delta',delta:'tanker'})[car])),false);
 rows.push({id,car,time:s.time,litres:s.fluidLitres,stops:s.stops.length,condition:s.condition});
}
assert.equal(warm,4);
const book={window:{}};require('node:vm').runInNewContext(fs.readFileSync('game/assets/mechanic30.js','utf8'),book);for(const id of [48,49])for(const tier of ['bronze','silver','gold']){const ghost=G.validateGhost(book.window.Mechanic30['road'+id][tier]);assert.ok(ghost&&G.ghostMatches(ghost,make(id)));}
const reckless=[];for(const id of [48,49]){const s=make(id);for(let n=0;n<16000&&s.state==='drive';n++)s.step(true,false);assert.notEqual(s.state,'win','constant gas must not pass addresses');reckless.push({id,state:s.state,reason:s.reason});}
// Baseline is the confirmed 0.32 source tree, not a regenerated save fixture.
const dir=process.env.CARGO_BASELINE32||'/tmp/dustrivo-032/game/assets';let compared=0;
if(fs.existsSync(dir+'/physics.js')){
 const old=require(dir+'/physics');assert.deepEqual(P.routes.slice(0,48),old.routes.slice(0,48));assert.deepEqual(P.profiles.slice(0,48),old.profiles.slice(0,48));assert.deepEqual(P.vehicles,old.vehicles);
 for(let id=0;id<48;id++){
  const source=make(id,null,old);for(let n=0;n<80;n++)source.step(.3,false);const checkpoint=C.capture(source,old),a=C.restore(checkpoint,old),b=C.restore(checkpoint,P);assert.ok(b,'0.32 restore '+id);assert.equal(b.roadId,a.roadId);
  for(let n=0;n<120;n++){const c=input(a,old);if(a.lowGear!==b.lowGear)b.setLowGear(a.lowGear);a.step(...c);b.step(...c);}
  assert.ok(Math.abs(a.car.getPosition().x-b.car.getPosition().x)<1e-8,'unchanged 0.32 trajectory '+id);assert.equal(a.remaining(),b.remaining());assert.equal(a.reward(),b.reward());compared++;
 }
}else console.log('SKIP exact 0.32 trajectory comparison: baseline unavailable');
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/release33-results.json',JSON.stringify({rows,warm,reckless,compared},null,2));
console.log('PASS release33: 50 unique roads; four stock/variant deliveries, warm saves, personal ghosts, constant-gas failures; '+compared+' exact 0.32 checkpoint comparisons');
