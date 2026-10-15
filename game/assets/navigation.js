'use strict';
function previewStarGoals(r){return [{id:'delivery',title:'Доставка',detail:'Выполни условия заказа',done:false},{id:'cargo',title:'Весь груз',detail:r.cargo==='liquid'?'Довези ≥98,5% объёма':'Не потеряй груз',done:false},{id:'careful',title:'Бережный рейс',detail:'Весь груз, кузов ≥70%'+(r.kind==='timed'?' · запас времени ≥15%':''),done:false}];}
function renderStarGoals(id,goals,preview=false){$(id).innerHTML=goals.map(g=>'<div class="star-goal '+(g.done?'done':'')+'" data-star-goal="'+g.id+'"><b>'+icon('star')+g.title+'</b><small>'+g.detail+(preview?'':g.done?' · выполнено':' · не выполнено')+'</small></div>').join('');}
function navigationData(s,pedals={}){
 const x=s.car.getPosition().x,candidates=[];
 for(const stop of s.stops)if(!stop.done)candidates.push({type:'stop',x:stop.x,name:stop.name,elapsed:stop.elapsed,duration:s.fluidCapacity?2:1.3,object:stop});
 for(const br of s.liftBridges||[])if(!br.done)candidates.push({type:'bridge',x:br.control,name:br.name,elapsed:br.elapsed,duration:1,object:br});
 for(const gate of s.gates)if(!gate.open)candidates.push({type:'gate',x:gate.x,name:gate.name,elapsed:gate.elapsed,duration:1,object:gate});
 for(const site of s.services)if(!site.done&&(site.required||s.condition<70||s.fuel<30||s.temperature>100))candidates.push({type:'service',x:site.x,name:site.name,elapsed:site.elapsed,duration:2.2,object:site,optional:!site.required});
 for(const check of s.checkpoints)if(!check.done)candidates.push({type:'survey',x:check.x,name:check.name,object:check});
 const missed=candidates.filter(c=>!c.optional&&x>c.x+(c.type==='survey'?6:3.1)).sort((a,b)=>a.x-b.x)[0];
 // Passed optional services are never instructions to turn back.
 const ahead=candidates.filter(c=>!c.optional||c.x>=x-3).sort((a,b)=>a.x-b.x);
 let next=missed||ahead[0]||{type:'base',x:s.route.length+6,name:'БАЗА / '+s.route.name};
 if(!missed){const ford=(s.route.fords||[]).find(f=>x>=f.from-20&&x<=f.to&&f.from<next.x);if(ford)next={type:'water',x:ford.from,name:ford.name,object:ford};}
 if(!missed&&s.fuel<25){const can=s.items.filter(i=>!i.got&&i.type==='fuel'&&i.x>=x-1&&i.x<next.x).sort((a,b)=>a.x-b.x)[0];if(can)next={type:'fuel',x:can.x,name:'КАНИСТРА +'+can.amount+'%',object:can};}
 const metres=Math.max(0,Math.round(Math.abs(next.x-x)*3)),near=Math.abs(next.x-x)<=(next.type==='gate'?2.8:3.1);let action=metres+' м · '+({base:'до базы',stop:'до разгрузки',gate:'до поста',service:'до ремонта',survey:'до проверки',fuel:'до канистры',bridge:'до переправы',water:'до брода'})[next.type],progress=0;
 if(next.type==='water'&&x>=next.object.from-2){action=s.intakeWet>.4?'Мотор в воде · на берег!':'Ровная тяга · без разгона';}
 else if(missed)action='Вернись · '+metres+' м';
 else if(next.type==='bridge'&&next.object.requested){action=next.object.wait<4?'Жди прохода судна':'Мост опускается';progress=next.object.wait<4?Math.min(1,next.object.wait/4):Math.min(1,1-next.object.joint.getJointAngle()/1.05);}
 else if(next.type==='gate'&&next.object.requested){action='Жди зелёный свет';progress=Math.min(1,-next.object.joint.getJointAngle()/1.4);}
 else if(near&&['stop','gate','service','bridge'].includes(next.type)){
  progress=Math.min(1,(next.elapsed||0)/next.duration);
  action=pedals.gas?'Отпусти газ':Math.abs(s.car.getLinearVelocity().x)>.45?'Остановись тормозом':progress>0?({stop:s.fluidCapacity?'Перекачка':'Разгрузка',gate:'Запрос проезда',service:'Ремонт',bridge:'Запрос переправы'})[next.type]+' '+Math.round(progress*100)+'%':'Держи тормоз '+next.duration.toLocaleString('ru-RU')+' с';
 }else if(near&&next.type==='survey')action=s.groundCount?'Проедь пост по земле':'Приземлись у поста';
 else if(near&&next.type==='fuel')action='Подбери канистру';
 return {...next,metres,near,missed:!!missed,action,progress};
}
function updateNavigator(){
 const next=navigationData(sim,{gas,brake});$('navigation-name').textContent=next.name;$('navigation-action').textContent=next.action;$('navigation-progress').style.width=next.progress*100+'%';$('navigation-panel').dataset.kind=next.type;updateJourneyCue(next);
}
function drawRoadProfile(){
 if(!sim)return;const c=$('road-profile'),g=c.getContext('2d'),w=c.width,h=c.height,x=pose(sim.car).x,from=x-5,to=x+55,points=[];let lo=Infinity,hi=-Infinity;
 for(let xx=from;xx<=to;xx+=1){const br=sim.route.liftBridge,old=CP.bridges[sim.roadId];const yy=br&&sim.liftBridges[0].done&&xx>br.from&&xx<br.to?br.y:old&&xx>old.from&&xx<old.to?old.y:CP.groundHeight(xx,sim.roadId);points.push([xx,yy]);lo=Math.min(lo,yy);hi=Math.max(hi,yy);}const range=Math.max(7,hi-lo+2),px=v=>(v-from)/(to-from)*w,py=v=>h-8-(v-lo+1)/range*(h-20);
 g.clearRect(0,0,w,h);g.strokeStyle='#b1c697';g.lineWidth=2;g.beginPath();points.forEach((p,i)=>i?g.lineTo(px(p[0]),py(p[1])):g.moveTo(px(p[0]),py(p[1])));g.stroke();
 const pins=[...(sim.liftBridges||[]).map(b=>({x:b.control,type:'bridge'})),...(sim.route.fords||[]).map(f=>({x:f.from,type:'water'})),...sim.stops.filter(o=>!o.done).map(o=>({...o,type:'stop'})),...sim.gates.filter(o=>!o.open).map(o=>({...o,type:'gate'})),...sim.services.filter(o=>!o.done).map(o=>({...o,type:'service'})),...sim.items.filter(o=>!o.got&&o.type==='fuel'),{x:sim.route.length+6,type:'base'}];
 for(const p of pins){if(p.x<from||p.x>to)continue;const xx=px(p.x),yy=py(CP.height(p.x,sim.roadId));g.fillStyle=p.type==='water'?'#90d7d5':p.type==='bridge'?'#d1b981':p.type==='gate'?'#dda479':p.type==='fuel'?'#e69873':p.type==='service'?'#9ccb9b':'#e8c575';g.fillRect(xx-3,yy-10,6,7);}
 g.fillStyle='#f2dfa0';g.beginPath();g.arc(px(x),py(CP.height(x,sim.roadId)),4,0,Math.PI*2);g.fill();
}
if(typeof module==='object')module.exports={navigationData,previewStarGoals};
