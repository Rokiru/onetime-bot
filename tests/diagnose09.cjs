const P=require('../game/assets/physics.js'),input=require('./driving-input10.cjs');
let pass=0,failed=[];
for(const levels of [[0,0,0],[5,5,5]])for(const m of P.vehicles)for(let id=0;id<P.routes.length;id++){
 const s=new P.Drive(id,levels,m.id);
 for(let n=0;n<30000&&s.state==='drive';n++)s.step(...input(s,P));
 if(s.state!=='win')failed.push({id,car:m.id,l:levels[0],state:s.state,reason:s.reason,x:+s.car.getPosition().x.toFixed(1),fuel:+s.fuel.toFixed(1),cond:s.condition,boxes:s.remaining(),time:+s.time.toFixed(1)});else pass++;
}
console.log(JSON.stringify({pass,failed},null,2));if(failed.length)process.exitCode=1;
