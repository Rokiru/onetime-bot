const assert=require('assert'),CP=require('../game/assets/physics.js'),C=require('../game/assets/run-checkpoint.js'),input=require('./driving-input16.cjs'),fs=require('fs');
const round=s=>{const data=C.capture(s,CP);assert(data,'valid checkpoint');const frozen=JSON.stringify(data),clone=JSON.parse(frozen),r=C.restore(clone,CP);assert(r,'restores');const actual=C.capture(r,CP);for(let n=0;n<data.bodies.length;n++){const a=actual.bodies[n],b=data.bodies[n];for(const k of ['x','y','a','vx','vy','w'])assert(Math.abs(k==='a'?Math.atan2(Math.sin(a[k]-b[k]),Math.cos(a[k]-b[k])):a[k]-b[k])<1e-8,'body '+n+' '+k);assert.deepEqual(a.fixtures,b.fixtures);assert.equal(a.active,b.active);assert.equal(a.awake,b.awake);}assert.deepEqual({...actual,bodies:[],solver:null},{...data,bodies:[],solver:null},'motors, stops, cargo, trace and counters equal before resuming');assert.equal(JSON.stringify(data),frozen,'restore cannot mutate stored checkpoint');return r;};
const sample=new CP.Drive(42,[0,0,0]);sample.started=true;for(let n=0;n<100;n++)sample.step(false,false);const good=C.capture(sample,CP);
for(const change of [d=>d.schema=10,d=>d.engine='old',d=>d.id=999,d=>d.signature=0,d=>d.state.fuel=-1,d=>d.state.time=Infinity,d=>d.bodies[0].vx=NaN,d=>d.motors=[],d=>d.trace=Array(801).fill([1,2,3,4]),d=>d.groups.stops=[],d=>d.bodies.pop(),d=>d.levels[0]=6,d=>d.attempt='bad text',d=>d.state.wasAir=12]){const d=JSON.parse(JSON.stringify(good));change(d);assert.equal(C.restore(d,CP),null,'corrupt checkpoint rejected');}
sample.started=false;assert.equal(C.capture(sample,CP),null);sample.started=true;sample.paid=true;assert.equal(C.capture(sample,CP),null);
const prior=process.env.CARGO_RESUME_RETRY_ONLY?JSON.parse(fs.readFileSync('resume17-results.json','utf8')):null;const result=prior?prior.results:[];let restored=prior?prior.restored:0;
if(!prior)for(const levels of [[0,0,0],[5,5,5]])for(const car of CP.vehicles)for(let id=0;id<CP.routes.length;id++){
 const route=CP.routes[id];if(car.onlyCargo&&route.cargo!==car.onlyCargo||route.requires&&route.requires!==car.id)continue;
 let s=new CP.Drive(id,levels,car.id),count=0,bridgeCut=false;
 for(let n=0;n<42000&&s.state==='drive';n++){
  s.step(...input(s,CP));const x=s.car.getPosition().x,br=s.liftBridges[0];
  if(s.state==='drive'&&(count===0&&s.time>=10||count===1&&x>route.length*.5||count===2&&x>route.length*.8||br&&br.requested&&br.wait>=2&&!br.done&&!bridgeCut)){
   if(br&&br.requested&&br.wait>=2&&!br.done)bridgeCut=true;else count++;
   s=round(s);restored++;
  }
 }
 result.push({id,car:car.id,level:levels[0],state:s.state,reason:s.reason,time:s.time,condition:s.condition,restores:count+(bridgeCut?1:0)});
 if(result.length%25===0)console.log('checked',result.length,'restores',restored);
}
const initialFailed=result.filter(x=>x.state!=='win').map(x=>({...x})),adaptive=require('./driving-input17.cjs');
for(const old of initialFailed){const at=result.findIndex(x=>x===result.find(x=>x.id===old.id&&x.car===old.car&&x.level===old.level));let s=new CP.Drive(old.id,[old.level,old.level,old.level],old.car),count=0,bridgeCut=false;
 for(let n=0;n<42000&&s.state==='drive';n++){s.step(...adaptive(s,CP));const x=s.car.getPosition().x,br=s.liftBridges[0];if(s.state==='drive'&&(count===0&&s.time>=10||count===1&&x>s.route.length*.5||count===2&&x>s.route.length*.8||br&&br.requested&&br.wait>=2&&!br.done&&!bridgeCut)){if(br&&br.requested&&br.wait>=2&&!br.done)bridgeCut=true;else count++;s=round(s);restored++;}}
 result[at]={id:old.id,car:old.car,level:old.level,state:s.state,reason:s.reason,time:s.time,condition:s.condition,restores:count+(bridgeCut?1:0),driver:'17-angle-rate-earlier-takeoff',firstAttempt:old};console.log('adaptive retry',old.id,old.car,s.state,s.reason);
}
const failed=result.filter(x=>x.state!=='win'),successfulRestores=result.filter(x=>x.state==='win').reduce((n,x)=>n+x.restores,0);fs.writeFileSync('resume17-results.json',JSON.stringify({passed:result.length-failed.length,restored:successfulRestores,total_restore_attempts:restored,initial_failed:initialFailed,failed,results:result},null,2));assert.deepEqual(failed,[]);console.log('PASS resume17:',result.length,'actual deliveries after',successfulRestores,'physical restores;',initialFailed.length,'test-driver retries using earlier takeoff/angle-rate control; exact saved poses/counters, moving bridge/boat, cargo topology, damaged input rejection; no replay');
