'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),P=require('../game/assets/physics.js'),C=require('../game/assets/run-checkpoint.js'),input=require('./driving-input25.cjs');
const tick=(s,choice)=>s.step(...input(s,P,choice));
function restore(s){const d=JSON.parse(JSON.stringify(C.capture(s,P)));assert.ok(d,'captured actual solver');const r=C.restore(d,P);assert.ok(r,'restored actual solver');return r;}
function same(a,b){assert.equal(a.state,b.state);assert.equal(a.remaining(),b.remaining());assert.ok(Math.abs(a.car.getPosition().x-b.car.getPosition().x)<.03);assert.ok(Math.abs(a.car.getAngle()-b.car.getAngle())<.03);assert.equal(a.ridgeScore(),b.ridgeScore());}
for(const load of [1,3]){
 for(const choice of ['cash','continue']){const s=new P.Drive(0,[0,0,0],'rover','standard',25,{load});let camp=false,jump=false,late=false;
  for(let n=0;n<12000&&s.state==='drive';n++){
   if(!jump&&s.groundCount===0&&s.car.getPosition().x>47&&s.car.getPosition().x<51){jump=true;const r=restore(s);for(let k=0;k<10;k++){tick(s,choice);tick(r,choice);}same(s,r);const a=restore(s),b=restore(s);for(let k=0;k<8;k++){a.step(true,false);b.step(false,true);}assert.ok(a.car.getAngularVelocity()>b.car.getAngularVelocity()+.5,'gas and brake physically control pitch');}
   if(s.ridge.waiting&&!camp){camp=true;const d=C.capture(s,P),r=restore(s),time=s.time,x=s.car.getPosition().x;for(let k=0;k<600;k++)s.step(true,false);assert.equal(s.time,time);assert.equal(s.car.getPosition().x,x);assert.deepEqual(s.ridge,r.ridge);for(const change of [d=>d.ridge25.load=2,d=>d.ridge25.stage=2,d=>d.ridge25.landings=-1,d=>d.ridge25.peakFall=null,d=>d.levels[0]=1,d=>d.dispatchTerms={edition:24},d=>d.ridge25.waiting='yes']){const bad=structuredClone(d);change(bad);assert.equal(C.validate(bad,P),null);} }
   if(!late&&s.ridge.stage===1&&s.car.getPosition().x>100){late=true;const r=restore(s);for(let k=0;k<120&&s.state==='drive';k++){tick(s,choice);tick(r,choice);}same(s,r);}
   tick(s,choice);
  }
  assert.equal(s.state,'win',load+' '+choice+' '+s.reason);assert.ok(camp&&jump);assert.ok(s.remaining()>0);if(choice==='cash')assert.equal(s.remaining(),load);else assert.ok(late);assert.equal(s.ridgeScore(),s.remaining()*(choice==='cash'?100:250)+s.ridge.landings);assert.ok(s.ridge.landings>0);console.log('PASS ridge25',load,choice,s.time.toFixed(2)+'s',s.remaining()+' cargo',s.condition+'% body',s.ridgeScore()+' points');
 }
 const held=new P.Drive(0,[0,0,0],'rover','standard',25,{load});for(let n=0;n<12000&&held.state==='drive';n++){if(held.ridge.waiting)held.ridgeContinue();held.step(true,false);}assert.equal(held.state,'fail','holding gas must not solve the course');assert.equal(held.ridgeScore(),0);
}
const light=new P.Drive(0,[0,0,0],'rover','standard',25,{load:1}),heavy=new P.Drive(0,[0,0,0],'rover','standard',25,{load:3});for(let n=0;n<200;n++){light.step(.65,false);heavy.step(.65,false);}assert.ok(Math.abs(light.car.getPosition().x-heavy.car.getPosition().x)>.5,'cargo mass changes actual trajectory');assert.equal(P.routes.length,48);assert.equal(P.profiles.length,48);
const dir=process.env.CARGO_BASELINE24||'/tmp/dustrivo-024/game/assets',old=fs.existsSync(path.join(dir,'physics.js'))?require(path.join(dir,'physics.js')):null;
for(const row of require('./fixtures/checkpoints-0.24.json').rows){const s=C.restore(row.checkpoint,P);assert.ok(s,row.name);assert.notEqual(s.edition,25);if(old){const b=C.restore(row.checkpoint,old);assert.ok(b);for(let n=0;n<180&&s.state==='drive';n++){tick(s);b.step(...input(b,old));}assert.equal(s.state,b.state);assert.ok(Math.abs(s.car.getPosition().x-b.car.getPosition().x)<1e-8,row.name);assert.equal(s.reward(),b.reward());}}
console.log('PASS ridge25: choice freezes physics, real air controls, load weight, warm jumps/camp/late leg, malformed saves, 48 unchanged career roads and real 0.24 checkpoint compatibility'+(old?' with exact archived trajectories.':'.'));
