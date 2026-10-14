const assert=require('node:assert/strict'),P=require('../game/assets/physics.js'),C=require('../game/assets/run-checkpoint.js');
const input=require('./driving-input18.cjs');
function settle(s){for(let i=0;i<70;i++)s.step(false,false);assert.ok(s.groundCount>=1);}
const high=new P.Drive(0,[0,0,0]),low=new P.Drive(0,[0,0,0]);settle(high);settle(low);
assert.equal(low.setLowGear(true),true);assert.equal(low.setLowGear(false),false,'shift cooldown enforced');
high.step(true,false);low.step(true,false);
assert.ok(low.joints[0].getMaxMotorTorque()>high.joints[0].getMaxMotorTorque()*1.5);
assert.ok(Math.abs(low.joints[0].getMotorSpeed())<Math.abs(high.joints[0].getMotorSpeed())*.45);
assert.ok(low.fuelUsed>high.fuelUsed,'low gear has a real consumption tradeoff');
const saved=C.capture(low,P),restored=C.restore(JSON.parse(JSON.stringify(saved)),P);
assert.ok(restored);assert.equal(restored.lowGear,true);assert.equal(restored.gearShifts,1);assert.equal(restored.shiftCooldown,low.shiftCooldown);
const legacy=JSON.parse(JSON.stringify(saved));delete legacy.drivetrain;const migrated=C.restore(legacy,P);assert.ok(migrated);assert.equal(migrated.lowGear,false);
const invalid=JSON.parse(JSON.stringify(saved));invalid.drivetrain.lowGear='yes';assert.equal(C.validate(invalid,P),null);
low.shiftCooldown=0;low.groundCount=0;assert.equal(low.setLowGear(false),false);low.groundCount=2;low.car.setLinearVelocity({x:5,y:0});assert.equal(low.setLowGear(false),false);
const partial=new P.Drive(0,[0,0,0]),full=new P.Drive(0,[0,0,0]);for(let i=0;i<60;i++){partial.step(.45,false);full.step(true,false);}assert.ok(partial.throttle<.46&&full.throttle>.99,'analog throttle controls actual motor target');
assert.equal(P.routes.length,48);assert.equal(new Set(P.profiles.map(p=>JSON.stringify(p))).size,48);
let count=0;
for(const id of [46,47])for(const levels of [[0,0,0],[1,1,1],[3,3,3],[5,5,5]])for(const m of P.vehicles){
 if(m.onlyCargo||P.routes[id].requires&&P.routes[id].requires!==m.id)continue;
 const s=new P.Drive(id,levels,m.id);
 for(let n=0;n<42000&&s.state==='drive';n++)s.step(...input(s,P));
 assert.equal(s.state,'win',`new road ${id}, ${m.id}, level ${levels[0]}: ${s.reason} at ${s.car.getPosition().x}`);
 assert.ok(s.remaining()>0);assert.ok(s.fuel>0);count++;
}
console.log('PASS expedition18: physical torque/speed/fuel tradeoff, cooldown and shift constraints, analog throttle, new/legacy checkpoint, 48 unique roads; '+count+' real deliveries on new roads.');
