'use strict';
const fs=require('fs'),assert=require('assert/strict'),P=require('../game/assets/physics.js'),C=require('../game/assets/run-checkpoint.js'),input=require('../tests/driving-input29.cjs');
const rows=[],traces={};for(const tier of ['gold','silver','bronze'])for(let id=0;id<50;id++){
 const ridge=id>=48,load=id===48?1:3,r=!ridge&&P.contractRoute(id),s=ridge?new P.Drive(0,[0,0,0],'rover','standard',25,{load,trail:28,logistics:29}):new P.Drive(id,[0,0,0],r.requires||'rover','standard',P.courses26.edition(id),{course:26,skill:27,logistics:29,support:true,recoveryBonus:true});let c=[false,false],stall=0;
 const wait=tier==='gold'?0:tier==='silver'?2:4;for(let n=0;n<24000&&s.state==='drive';n++){
  if(ridge||n%12===0||s.forkWaiting||s.ridge?.waiting){c=s.time<wait?[false,true]:input(s,P,'detour',ridge||s.route.kind==='timed'?'gold':tier);if(s.edition!==23&&s.groundCount&&Math.abs(s.car.getLinearVelocity().x)<.12&&c[0])stall+=.2;else stall=0;if(stall>1.6){s.useWinch();stall=0;}}
  s.step(...c);
 }
 console.log(tier,id,s.state,s.reason,+s.time.toFixed(2),s.logistics29.integrity,s.fluidLitres,s.remaining());if(s.state!=='win'){process.exitCode=1;continue;}
 if(tier==='gold'){rows.push({id,time:s.time,integrity:s.logistics29.integrity,condition:s.condition,arrival:s.logistics29.arrival,technical:s.route.technical});if(!ridge){const d=C.capture(s,P); /* finished runs aren't checkpointable */}}
 const p=s.car.getPosition(),points=s.trace.map(p=>p.slice()),final=[Math.round(s.time*60),Math.round(p.x*100),Math.round(p.y*100),Math.round(s.car.getAngle()*1000)];if(points.at(-1)?.[0]!==final[0])points.push(final);else points[points.length-1]=final;
 const key=ridge?'ridge'+load:'road'+id;traces[key]??={};traces[key][tier]={logistics29:29,...(ridge?{trial28:load}:{course26:26,...(id===0?{path21:'detour'}:{})}),car:s.vehicle.id,setup:s.vehicle.setup,levels:[0,0,0],duration:s.time,points};
}
fs.writeFileSync('artifacts/logistics29-routes.json',JSON.stringify(rows,null,2));for(const [key,runs] of Object.entries(traces)){assert.equal(Object.keys(runs).length,3,key+' needs three completed runs');const ranked=Object.values(runs).sort((a,b)=>a.duration-b.duration);traces[key]={gold:ranked[0],silver:ranked[1],bronze:ranked[2]};}
fs.writeFileSync('game/assets/mechanic29.js',"'use strict';\n// Actual stock-truck runs, captured at 60 Hz with public pedals; poses sampled twice per second.\nwindow.Mechanic29="+JSON.stringify(traces)+';\n');
