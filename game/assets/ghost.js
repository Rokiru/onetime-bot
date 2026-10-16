'use strict';
function validateGhost(g){
 if(!g||(g.pace30!==undefined&&(g.pace30!==30||g.logistics29!==29||g.trial28!==undefined))||(g.logistics29!==undefined&&g.logistics29!==29)||(g.trial28!==undefined&&(![1,3].includes(g.trial28)||g.logistics29!==29||g.course26!==undefined))||(g.path21!==undefined&&(!['ridge','detour'].includes(g.path21)||g.logistics29!==29))||(g.course26!==undefined&&g.course26!==26)||!['rover','scrambler','mule','timber','tanker'].includes(g.car)||!['standard','trail','economy'].includes(g.setup)||!Array.isArray(g.levels)||g.levels.length!==3||g.levels.some(v=>!Number.isInteger(v)||v<0||v>5)||!Number.isFinite(g.duration)||g.duration<=0||g.duration>401||!Array.isArray(g.points)||g.points.length<2||g.points.length>800)return null;
 let last=-1;for(const p of g.points){if(!Array.isArray(p)||p.length!==4||p.some(v=>!Number.isInteger(v)||Math.abs(v)>1000000)||p[0]<=last||p[0]<0||p[0]>24060)return null;last=p[0];}if(Math.abs(last/60-g.duration)>.1)return null;
 return {...(g.pace30===30?{pace30:30}:{}),...(g.logistics29===29?{logistics29:29}:{}),...(g.trial28?{trial28:g.trial28}:{}),...(g.path21?{path21:g.path21}:{}),...(g.course26===26?{course26:26}:{}),car:g.car,setup:g.setup,levels:g.levels.slice(),duration:g.duration,points:g.points.map(p=>p.slice())};
}
function ghostMatches(g,s){return !!g&&(g.pace30||0)===(s.pace30?30:0)&&(g.logistics29||0)===(s.logistics29?29:0)&&(g.trial28||0)===(s.ridge28?s.ridge.load:0)&&(g.path21||'')===(s.logistics29&&s.edition===21?s.path:'')&&(g.course26||0)===(s.course26?26:0)&&g.car===s.vehicle.id&&g.setup===s.vehicle.setup&&g.levels.every((v,i)=>v===s.levels[i]);}
function saveBestGhost(s,stats){
 if(s.state!=='win'||s.traceOverflow||s.trace.length<2)return;const field=s.pace30?'ghost30':s.logistics29?'ghost29':'ghost',old=stats[field];if(ghostMatches(old,s)&&old.duration<=s.time)return;
 const p=s.car.getPosition(),points=s.trace.map(p=>p.slice()),final=[Math.round(s.time*60),Math.round(p.x*100),Math.round(p.y*100),Math.round(s.car.getAngle()*1000)];if(points[points.length-1][0]!==final[0])points.push(final);else points[points.length-1]=final;
 if(points.length>800)return;stats[field]=validateGhost({...(s.pace30?{pace30:30}:{}),...(s.logistics29?{logistics29:29}:{}),...(s.ridge28?{trial28:s.ridge.load}:{}),...(s.logistics29&&s.edition===21?{path21:s.path}:{}),...(s.course26?{course26:26}:{}),car:s.vehicle.id,setup:s.vehicle.setup,levels:s.levels.slice(),duration:s.time,points});
}
function ghostPoseAt(g,time){if(!g||time>g.duration)return null;const tick=time*60,p=g.points;let lo=0,hi=p.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(p[mid][0]<=tick)lo=mid;else hi=mid;}const a=p[lo],b=p[hi],t=Math.max(0,Math.min(1,(tick-a[0])/(b[0]-a[0])));return {x:(a[1]+(b[1]-a[1])*t)/100,y:(a[2]+(b[2]-a[2])*t)/100,a:(a[3]+(b[3]-a[3])*t)/1000};}
function drawGhostSilhouette29(g,label,color){
 const p=ghostPoseAt(g,sim.time);if(!p||sx(p.x)<-scale*5||sx(p.x)>W+scale*5)return;
 const body={getPosition:()=>({x:p.x,y:p.y}),getAngle:()=>p.a},m=sim.vehicle,c=Math.cos(p.a),sn=Math.sin(p.a),wheels=(m.axles||[-m.base,m.base]).map(off=>({getPosition:()=>({x:p.x+off*c+.5*sn,y:p.y+off*sn-.5*c}),getAngle:()=>-sim.time*4}));
 ctx.save();ctx.globalAlpha=.22;truck(body,wheels);if(m.closed)vanFrame(body);ctx.globalAlpha=.85;ctx.fillStyle=color;ctx.font='600 '+Math.max(8,Math.round(scale*.18))+'px Manrope';ctx.textAlign='center';ctx.fillText(label,sx(p.x),sy(p.y+2.4));ctx.restore();
}
function drawBestGhost(){
 if(mode!=='drive'||!save.ghostEnabled||!sim)return;
 if(sim.logistics29){const key=sim.ridge28?'ridge'+sim.ridge.load:'road'+sim.id,master=(sim.pace30?window.Mechanic30:window.Mechanic29)?.[key]?.[save.ghostTier29||'bronze'];if(master&&master.car===sim.vehicle.id&&(!master.path21||master.path21===sim.path))drawGhostSilhouette29(master,'МЕХАНИК · '+({bronze:'БРОНЗА',silver:'СЕРЕБРО',gold:'ЗОЛОТО'})[save.ghostTier29||'bronze'],'#edc38a');const personal=sim.ridge28?save.ridgeGhost29?.[sim.ridge.load]:save.stats[sim.id][sim.pace30?'ghost30':'ghost29'];if(ghostMatches(personal,sim))drawGhostSilhouette29(personal,'ТВОЙ РЕКОРД','#b6d8c6');return;}
 if([21,22,23,25].includes(sim.edition))return;const g=save.stats[sim.id].ghost;if(ghostMatches(g,sim))drawGhostSilhouette29(g,'ТВОЙ РЕКОРД','#b6d8c6');
}
if(typeof module==='object')module.exports={validateGhost,ghostMatches,saveBestGhost,ghostPoseAt};
