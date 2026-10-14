const assert=require('assert'),P=require('../game/assets/physics.js'),input=require('./driving-input08.cjs');
assert.equal(P.routes.length,9);assert.equal(Object.keys(P.gaps).length,6);
for(const [id,g] of Object.entries(P.gaps))assert(P.groundHeight((g.from+g.to)/2,+id)<P.height((g.from+g.to)/2,+id)-2,'real ravine floor');
const fingerprints=P.routes.map((r,i)=>Array.from({length:71},(_,k)=>P.height(k*r.length/70,i).toFixed(2)).join(','));assert.equal(new Set(fingerprints).size,9);
let pass=0;
for(const levels of [[0,0,0],[5,5,5]])for(const m of P.vehicles)for(let id=0;id<9;id++){
 const s=new P.Drive(id,levels,m.id);let deformation=0;
 for(let n=0;n<24000&&s.state==='drive';n++){s.step(...input(s,P));assert(Number.isFinite(s.car.getPosition().x));if(s.bridge.length)deformation=Math.max(deformation,...s.bridge.map(b=>Math.abs(b.getPosition().y-(P.bridges[id].y-.09))));}
 assert.equal(s.state,'win',m.id+' road '+id+' level '+levels[0]+' '+s.reason+' @'+s.distance);assert(s.condition>0);assert(s.rating()>=1&&s.rating()<=3);
 if(s.route.kind==='careful')assert.equal(s.remaining(),s.route.boxes);
 if(s.route.kind==='timed')assert(s.time<=s.route.limit);
 if(id===0)assert(deformation>.025);pass++;
}
for(let id=0;id<3;id++)for(const m of P.vehicles){const s=new P.Drive(id,[0,0,0],m.id);for(let n=0;n<18000&&s.state==='drive';n++)s.step(true,false);assert.equal(s.state,'fail','held gas must not clear '+id+' '+m.id);console.log('held gas:',id,m.id,s.reason,Math.floor(s.distance)+'m');}
for(const m of P.vehicles){const s=new P.Drive(3,[0,0,0],m.id);for(const b of [s.car,...s.wheels,...s.boxes.map(x=>x.body)]){const p=b.getPosition();b.setPosition({x:p.x,y:p.y+2});}for(let n=0;n<600;n++){s.suspensionForces();s.world.step(1/120,6,3);}assert(Math.abs(s.car.getLinearVelocity().y)<.25);}
console.log('PASS:',pass,'controlled road/vehicle/upgrade combinations, six physical ravines, moving bridges, cargo, timers, damage, nine held-gas failures and suspension settle');
