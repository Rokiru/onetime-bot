'use strict';
(function(root){
 const fields=['time','fuel','fuelUsed','lastFuelX','winchCharges','winchTime','coins','distance','flip','stuckTime','groundCount','throttle','hardLandings','condition','temperature','overheated','peakTemperature','serviceHold','airDrop','airTicks','wasAir','brakeHeld','slip','slipTime','traceOverflow','traceAt','lastImpact','fluidLitres','fluidDelivered','fluidSlosh','peakSlosh','fluidLeak','parkingHold','waterDepth','intakeWet','inWater','peakWaterDepth'];
 const groups={items:['got'],boxes:['lost','delivered','out','stopIndex'],stops:['done','elapsed','boxIndex','warned'],services:['done','elapsed'],checkpoints:['done'],gates:['elapsed','requested','open'],liftBridges:['elapsed','wait','requested','done']};
 const finite=(v,limit=10000000)=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=limit;
 const copy=(o,keys)=>Object.fromEntries(keys.filter(k=>o[k]!==undefined).map(k=>[k,o[k]]));
 function fingerprint(CP,id,car,levels,setup){let h=2166136261;const text=JSON.stringify([CP.routes[id],CP.profiles[id],CP.preparedVehicle(car,setup),levels]);for(let n=0;n<text.length;n++)h=Math.imul(h^text.charCodeAt(n),16777619);return h>>>0;}
 function bodies(s){const result=[];for(let b=s.world.getBodyList();b;b=b.getNext())if(!b.isStatic())result.push(b);return result;}
 function fixtures(b){const result=[];for(let f=b.getFixtureList();f;f=f.getNext())result.push(f);return result;}
 // Solver caches are version-pinned to the bundled Planck build. They preserve
 // suspension/contact impulses so a reload does not introduce a cold solve.
 const impulseFields=['m_impulse','m_motorImpulse','m_springImpulse','m_lowerImpulse','m_upperImpulse'];
 function jointList(s){const result=[];for(let j=s.world.getJointList();j;j=j.getNext())result.push(j);return result;}
 function fixtureKeys(s){const map=new Map();let n=0;for(let b=s.world.getBodyList();b;b=b.getNext(),n++)fixtures(b).forEach((f,i)=>map.set(f,n+'.'+i));return map;}
 function contactKey(c,map){return map.get(c.getFixtureA())+':'+c.m_indexA+'>'+map.get(c.getFixtureB())+':'+c.m_indexB;}
 function solverCapture(s){const map=fixtureKeys(s),contacts=[];for(let c=s.world.getContactList();c;c=c.getNext()){const m=c.getManifold();if(m.pointCount)contacts.push({key:contactKey(c,map),manifold:JSON.parse(JSON.stringify(m))});}contacts.sort((a,b)=>a.key.localeCompare(b.key));return {joints:jointList(s).map(j=>({type:j.getType(),impulses:JSON.parse(JSON.stringify(copy(j,impulseFields)))})),contacts};}
 function capture(s,CP){
  if(!s||s.state!=='drive'||s.paid||s.started===false)return null;
  if(!s.attemptId)s.attemptId=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
  const data={schema:1,engine:'river17',attempt:s.attemptId,id:s.id,car:s.vehicle.id,levels:s.levels.slice(),setup:s.vehicle.setup,signature:fingerprint(CP,s.id,s.vehicle.id,s.levels,s.vehicle.setup),state:copy(s,fields),drivetrain:{lowGear:!!s.lowGear,shiftCooldown:s.shiftCooldown||0,gearShifts:s.gearShifts||0},anchor:s.winchAnchor?{x:s.winchAnchor.x,y:s.winchAnchor.y}:null,trace:s.trace.map(p=>p.slice()),groups:{},bodies:[]};
  for(const [name,keys] of Object.entries(groups))data.groups[name]=s[name].map(x=>({...copy(x,keys),...(name==='boxes'?{strap:!!x.strap,strap2:!!x.strap2}:{})}));
  if(s.edition===20)data.journey={edition:20,sectors:s.sectors.map(o=>copy(o,['entered','done','passed','maxSpeed','initialCargo','initialHits']))};
  if(s.edition===21)data.expedition={edition:21,path:s.path,waiting:s.forkWaiting,powered:s.workshopPowered,machine:{...s.machine}};
  if(s.edition===22)data.waterRun={edition:22,support:s.workshopSupport,pump:{...s.pump}};
  if(s.edition===23)data.recoveryRun={edition:23,tow:{...s.tow}};
  if(s.dispatchTerms)data.dispatchTerms={...s.dispatchTerms};
  data.solver=solverCapture(s);data.motors=[...s.joints,...s.gates.map(g=>g.joint),...s.liftBridges.map(b=>b.joint)].map(j=>[j.isMotorEnabled(),j.getMotorSpeed(),j.getMaxMotorTorque()]);
  data.bodies=bodies(s).map(b=>{const p=b.getPosition(),v=b.getLinearVelocity();return {x:p.x,y:p.y,a:b.getAngle(),vx:v.x,vy:v.y,w:b.getAngularVelocity(),active:b.isActive(),awake:b.isAwake(),fixtures:fixtures(b).map(f=>({density:f.getDensity(),sensor:f.isSensor()}))};});
  return validate(data,CP);
 }
 function validate(d,CP){
  try{
   if(!d||d.schema!==1||d.engine!=='river17'||typeof d.attempt!=='string'||! /^[a-z0-9-]{4,60}$/.test(d.attempt)||!Number.isInteger(d.id)||!CP.routes[d.id]||!CP.vehicles.some(m=>m.id===d.car)||!CP.SETUPS[d.setup]||!Array.isArray(d.levels)||d.levels.length!==3||d.levels.some(x=>!Number.isInteger(x)||x<0||x>5))return null;
   if(d.signature!==fingerprint(CP,d.id,d.car,d.levels,d.setup)||!d.state||!d.groups||!Array.isArray(d.bodies)||d.bodies.length>100||!Array.isArray(d.trace)||d.trace.length>800)return null;
   for(const k of fields)if(typeof d.state[k]!=='boolean'&&!finite(d.state[k]))return null;
   if(d.journey){const j=d.journey;if(j.edition!==20||!Array.isArray(j.sectors)||j.sectors.length!==CP.contractRoute(d.id,20).sectors.length)return null;for(const o of j.sectors)if(!o||['entered','done','passed'].some(k=>typeof o[k]!=='boolean')||!finite(o.maxSpeed,500)||o.maxSpeed<0||!finite(o.initialCargo,5000)||o.initialCargo<0||!Number.isInteger(o.initialHits)||o.initialHits<0||o.initialHits>10000||o.passed&&(!o.done||!o.entered))return null;}
   if(d.expedition){const e=d.expedition,m=e.machine;if(d.journey||d.id!==0||e.edition!==21||!['pending','ridge','detour'].includes(e.path)||typeof e.waiting!=='boolean'||typeof e.powered!=='boolean'||e.waiting&&e.path!=='pending'||!m||!finite(m.integrity,100)||m.integrity<0||!finite(m.previousVy,500)||!finite(m.cooldown,1)||m.cooldown<0)return null;}
   if(d.waterRun){const w=d.waterRun,m=w.pump;if(d.journey||d.expedition||d.id!==3||w.edition!==22||typeof w.support!=='boolean'||!m||!finite(m.integrity,100)||m.integrity<0||!finite(m.previousVy,500)||!finite(m.cooldown,1)||m.cooldown<0)return null;}
   if(d.recoveryRun){const r=d.recoveryRun,t=r.tow;if(d.journey||d.expedition||d.waterRun||d.id!==4||r.edition!==23||!t||typeof t.attached!=='boolean'||typeof t.support!=='boolean'||t.delivered!==false||!finite(t.condition,100)||t.condition<0||!Number.isInteger(t.breaks)||t.breaks<0||t.breaks>10000||!finite(t.strain,100000)||t.strain<0||!finite(t.overload,2)||t.overload<0||!finite(t.cooldown,1)||t.cooldown<0||!finite(t.previousVx,500)||!finite(t.previousVy,500))return null;}
   if(d.dispatchTerms&&(!d.journey||d.journey.edition!==20||!(typeof module==='object'?require('./dispatch-terms24.js'):root.DispatchTerms24).valid(d.dispatchTerms,d.id,20)))return null;
   if(d.drivetrain&&(typeof d.drivetrain.lowGear!=='boolean'||!finite(d.drivetrain.shiftCooldown)||d.drivetrain.shiftCooldown<0||d.drivetrain.shiftCooldown>1||!Number.isInteger(d.drivetrain.gearShifts)||d.drivetrain.gearShifts<0))return null;
   if(d.state.time<0||d.state.time>7200||d.state.fuel<0||d.state.fuel>100||d.state.condition<0||d.state.condition>100||d.state.winchCharges<0||d.state.winchCharges>3||d.state.coins<0||d.state.coins>10000)return null;
   if(d.anchor!==null&&(!d.anchor||!finite(d.anchor.x)||!finite(d.anchor.y)))return null;
   let last=-1;for(const p of d.trace){if(!Array.isArray(p)||p.length!==4||p.some(x=>!Number.isInteger(x)||!finite(x))||p[0]<=last||p[0]>d.state.time*60+1)return null;last=p[0];}
   for(const [name,keys] of Object.entries(groups)){if(!Array.isArray(d.groups[name])||d.groups[name].length>100)return null;for(const o of d.groups[name]){if(!o||typeof o!=='object')return null;for(const k of keys)if(o[k]!==undefined&&typeof o[k]!=='boolean'&&!finite(o[k]))return null;if(name==='boxes'&&(typeof o.strap!=='boolean'||typeof o.strap2!=='boolean'))return null;}}
   if(!Array.isArray(d.motors)||d.motors.length>12||d.motors.some(m=>!Array.isArray(m)||m.length!==3||typeof m[0]!=='boolean'||!finite(m[1])||!finite(m[2])||m[2]<0))return null;
   if(!d.solver||!Array.isArray(d.solver.joints)||d.solver.joints.length>100||!Array.isArray(d.solver.contacts)||d.solver.contacts.length>400)return null;
   const vector=(o,allowZ=false)=>o&&typeof o==='object'&&!Array.isArray(o)&&finite(o.x)&&finite(o.y)&&Object.keys(o).every(k=>['x','y',...(allowZ?['z']:[])].includes(k)&&finite(o[k]));
   for(const j of d.solver.joints)if(!j||typeof j.type!=='string'||!j.impulses||Object.keys(j.impulses).some(k=>!impulseFields.includes(k)||!finite(j.impulses[k])&&!vector(j.impulses[k],true)))return null;
   for(const c of d.solver.contacts){const m=c&&c.manifold;if(!c||typeof c.key!=='string'||!/^\d+\.\d+:\d+>\d+\.\d+:\d+$/.test(c.key)||!m||![1,2].includes(m.pointCount)||![-1,0,1,2].includes(m.type)||!vector(m.localNormal)||!vector(m.localPoint)||!Array.isArray(m.points)||m.points.length!==2)return null;for(const p of m.points)if(!p||!vector(p.localPoint)||!finite(p.normalImpulse)||!finite(p.tangentImpulse)||!p.id||Object.keys(p.id).some(k=>!['key','indexA','indexB','typeA','typeB'].includes(k)||!Number.isInteger(p.id[k])||!finite(p.id[k]))||!Number.isInteger(p.id.key))return null;}
   for(const b of d.bodies){if(!b||!['x','y','a','vx','vy','w'].every(k=>finite(b[k]))||Math.abs(b.vx)>500||Math.abs(b.vy)>500||typeof b.active!=='boolean'||typeof b.awake!=='boolean'||!Array.isArray(b.fixtures)||b.fixtures.length>20)return null;for(const f of b.fixtures)if(!f||!finite(f.density,500)||f.density<0||typeof f.sensor!=='boolean')return null;}
   if(JSON.stringify(d).length>160000)return null;
   return d;
  }catch(e){return null;}
 }
 function restore(data,CP){
  const d=validate(data,CP);if(!d)return null;
  try{
   const e=d.expedition,w=d.waterRun,r=d.recoveryRun,s=new CP.Drive(d.id,d.levels.slice(),d.car,d.setup,r?23:w?22:e?21:d.journey?20:0,r?{attached:r.tow.attached,support:r.tow.support}:w?{support:w.support}:e?{path:e.path,powered:e.powered}:{}),list=bodies(s);if(list.length!==d.bodies.length)return null;
   for(const name of Object.keys(groups)){if(s[name].length!==d.groups[name].length)return null;for(let i=0;i<s[name].length;i++){const o=s[name][i],saved=d.groups[name][i];for(const k of groups[name]){if(saved[k]!==undefined){if(o[k]!==undefined&&typeof o[k]!==typeof saved[k])return null;o[k]=saved[k];}}if(name==='boxes')for(const k of ['strap','strap2']){if(!saved[k]&&o[k]){s.world.destroyJoint(o[k]);o[k]=null;}}}}
   if(d.dispatchTerms)s.dispatchTerms={...d.dispatchTerms};
   for(const k of fields){if(typeof s[k]!==typeof d.state[k])return null;s[k]=d.state[k];}
   if(d.drivetrain)Object.assign(s,d.drivetrain);
   if(d.journey)for(let i=0;i<s.sectors.length;i++)Object.assign(s.sectors[i],d.journey.sectors[i]);
   if(e){s.forkWaiting=e.waiting;Object.assign(s.machine,e.machine);}
   if(w)Object.assign(s.pump,w.pump);
   if(r)Object.assign(s.tow,r.tow);
   s.attemptId=d.attempt;s.started=true;s.winchAnchor=d.anchor?{...d.anchor}:null;s.trace=d.trace.map(p=>p.slice());s.events=[];s.previous=null;
   for(let i=0;i<list.length;i++){const b=list[i],v=d.bodies[i],fs=fixtures(b);if(fs.length!==v.fixtures.length)return null;b.setActive(false);b.setTransform({x:v.x,y:v.y},v.a);b.m_sweep.a=b.m_sweep.a0=v.a;for(let n=0;n<fs.length;n++){fs[n].setDensity(v.fixtures[n].density);fs[n].setSensor(v.fixtures[n].sensor);}b.resetMassData();b.setActive(v.active);b.setLinearVelocity({x:v.vx,y:v.vy});b.setAngularVelocity(v.w);b.setAwake(v.awake);}
   const motors=[...s.joints,...s.gates.map(g=>g.joint),...s.liftBridges.map(b=>b.joint)];if(motors.length!==d.motors.length)return null;for(let i=0;i<motors.length;i++){motors[i].enableMotor(d.motors[i][0]);motors[i].setMotorSpeed(d.motors[i][1]);motors[i].setMaxMotorTorque(d.motors[i][2]);}
   // Rebuild broad-phase contacts without advancing the attempt clock or bodies.
   s.world.step(0);const joints=jointList(s);if(joints.length!==d.solver.joints.length)return null;for(let i=0;i<joints.length;i++){const j=joints[i],saved=d.solver.joints[i];if(j.getType()!==saved.type)return null;for(const [k,v] of Object.entries(saved.impulses)){if(typeof j[k]!==typeof v)return null;if(typeof v==='number')j[k]=v;else Object.assign(j[k],v);}}
   const map=fixtureKeys(s),warm=new Map(d.solver.contacts.map(c=>[c.key,c.manifold]));for(let c=s.world.getContactList();c;c=c.getNext()){const saved=warm.get(contactKey(c,map));if(!saved)continue;const m=c.getManifold();m.type=saved.type;m.pointCount=saved.pointCount;Object.assign(m.localPoint,saved.localPoint);Object.assign(m.localNormal,saved.localNormal);for(let n=0;n<m.points.length;n++){const p=m.points[n],v=saved.points[n];if(!v)continue;Object.assign(p.localPoint,v.localPoint);Object.assign(p.id,v.id);p.normalImpulse=v.normalImpulse;p.tangentImpulse=v.tangentImpulse;}}
   for(let i=0;i<list.length;i++)list[i].setAwake(d.bodies[i].awake);s.groundCount=d.state.groundCount;s.events=[];
   return s;
  }catch(e){return null;}
 }
 const api={capture,validate,restore};if(typeof module==='object')module.exports=api;else root.RunCheckpoint=api;
})(typeof globalThis!=='undefined'?globalThis:this);
