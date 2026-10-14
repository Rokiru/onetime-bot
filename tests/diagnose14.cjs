const P=require('../game/assets/physics.js'),drive=require('./driving-input13.cjs');let passed=0,failed=[],fuels=[];
for(const levels of [[0,0,0],[5,5,5]])for(const m of P.vehicles)for(let id=0;id<P.routes.length;id++){
 if(m.onlyCargo&&P.routes[id].cargo!==m.onlyCargo)continue;
 if(P.routes[id].requires&&P.routes[id].requires!==m.id)continue;
 const s=new P.Drive(id,levels,m.id);let minimum=100;for(let n=0;n<42000&&s.state==='drive';n++){s.step(...drive(s,P));minimum=Math.min(minimum,s.fuel);}
 if(s.state==='win')passed++;else failed.push({id,car:m.id,level:levels[0],state:s.state,reason:s.reason,x:+s.car.getPosition().x.toFixed(1),fuel:+s.fuel.toFixed(1),condition:s.condition,time:+s.time.toFixed(1),cargo:s.remaining()});fuels.push({id,car:m.id,level:levels[0],final:+s.fuel.toFixed(1),minimum:+minimum.toFixed(1)});
 if(id===27)console.log('group',m.id,levels[0],passed,'passed',failed.length,'failed');
}
require('fs').writeFileSync('physics14-results.json',JSON.stringify({passed,failed,fuels},null,2));console.log(JSON.stringify({passed,failed},null,2));if(failed.length)process.exitCode=1;
