const assert=require('assert'),P=require('../game/assets/physics.js'),input=require('./driving-input10.cjs'),base=require('./driving-input08.cjs');
const ids=P.routes.map((r,id)=>r.stops?id:null).filter(id=>id!==null);assert.deepEqual(ids,[3,7,9,12,15,16]);
let completions=0;
for(const id of ids)for(const model of P.vehicles){
 const s=new P.Drive(id,[0,0,0],model.id);let credited=0,firstMass=s.car.getMass()+s.boxes.reduce((a,b)=>a+b.body.getMass(),0);
 for(let n=0;n<30000&&s.state==='drive';n++){s.step(...input(s,P));for(const ev of s.events.splice(0))if(ev.type==='stopComplete'){credited++;assert.equal(s.delivered(),credited);assert.equal(s.aboard(),s.route.boxes-credited);assert.equal(s.remaining(),s.route.boxes);const box=s.boxes.find(b=>b.delivered&&b.stopIndex===ev.index);assert.equal(box.body.isActive(),false);assert.equal(box.strap,null);assert.equal(box.strap2,null);const activeMass=s.car.getMass()+s.boxes.filter(b=>!b.delivered).reduce((a,b)=>a+b.body.getMass(),0);assert(activeMass<firstMass);}}
 assert.equal(s.state,'win',id+' '+model.id+' '+s.reason);assert.equal(credited,s.stops.length);assert.equal(s.rating(),3);assert(s.reward()>=s.route.reward);completions+=credited;
}
// Ignoring stops cannot complete a delivery, even with physically careful driving.
for(const id of ids){const s=new P.Drive(id,[0,0,0]);for(let n=0;n<30000&&s.state==='drive';n++)s.step(...base(s,P));assert.equal(s.reason,'stops');}
// No acceptance while moving, in the air, or while the gas is pressed.
const s=new P.Drive(3,[0,0,0]);const st=s.nextStop();s.car.setPosition({x:st.x,y:P.height(st.x,3)+1.1});s.car.setLinearVelocity({x:2,y:0});s.groundCount=2;s.updateStops(false,true,.8);assert.equal(st.elapsed,0);
s.car.setLinearVelocity({x:0,y:0});s.groundCount=0;s.updateStops(false,true,.8);assert.equal(st.elapsed,0);s.groundCount=2;s.updateStops(true,true,.8);assert.equal(st.elapsed,0);
s.updateStops(false,true,.8);assert(st.elapsed>0&&!st.done);const duration=st.elapsed;s.state='fail';s.step(false,true,1);assert.equal(st.elapsed,duration,'finished/paused-by-caller cannot advance physics');s.state='drive';s.updateStops(false,false,.2);assert.equal(st.elapsed,0,'release cancels incomplete unload');
// Brake near an unfinished bay parks without kicking into reverse.
const p=new P.Drive(3,[0,0,0]);for(let n=0;n<12000&&!p.stops[0].done;n++)p.step(...input(p,P));for(let n=0;n<120;n++)p.step(false,true);assert(p.stops[0].done);assert(p.parkingHold);assert(Math.abs(p.car.getLinearVelocity().x)<.2);p.step(true,false);assert.equal(p.parkingHold,false);
// Delivered parcels never become lost when the remaining car moves away.
for(let n=0;n<600;n++)p.step(...input(p,P));assert(p.boxes.find(b=>b.delivered));assert(p.boxes.filter(b=>b.delivered).every(b=>!b.lost));
const empty=new P.Drive(9,[0,0,0]);for(let i=0;i<2;i++){empty.boxes[i].delivered=true;empty.boxes[i].body.setActive(false);empty.stops[i].done=true;}empty.boxes[2].lost=true;empty.step(false,false);assert.equal(empty.reason,'cargo','base must receive at least one remaining parcel');
const terminal=new P.Drive(9,[0,0,0]);for(let i=0;i<2;i++){terminal.boxes[i].delivered=true;terminal.boxes[i].body.setActive(false);terminal.stops[i].done=true;}terminal.boxes[2].lost=true;const dx=terminal.route.length+7-terminal.car.getPosition().x;for(const b of [terminal.car,...terminal.wheels]){const p=b.getPosition();b.setPosition({x:p.x+dx,y:p.y});}terminal.step(false,false);assert.equal(terminal.reason,'cargo','base cannot succeed without cargo on the finish tick');
console.log('PASS multi-drop:',ids.length,'contracts, 18 model/contract deliveries,',completions,'accepted parcels, missing stops rejected; real cargo mass removed; gas/speed/air checks; cancellation; park/release; no duplicate or lost delivered parcels');
