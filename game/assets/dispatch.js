'use strict';
const dispatch={phase:null,elapsed:0,duration:1.35};
function beginLoading(){dispatch.phase='loading';dispatch.elapsed=0;dispatch.duration=1.35;setPage('loading');showDispatch('ПОГРУЗКА / '+(sim.route.story||STORY.jobs[sim.id]).from,'Нина: груз проверен. '+(sim.fluidCapacity?sim.fluidCapacity+' л в цистерне.':sim.route.boxes+' '+cargoWord(sim.route)+' в кузове.'));if(!save.motion)completeDispatch();}
function beginUnloading(){dispatch.phase='unloading';dispatch.elapsed=0;dispatch.duration=1.65;cam.x=sim.car.getPosition().x+2;cam.y=sim.car.getPosition().y+.7;setPage('unloading');showDispatch('ГРУЗ ПРИНЯТ / '+(sim.route.story||STORY.jobs[sim.id]).to,sim.fluidCapacity?'Перекачиваем '+Math.floor(sim.fluidLitres)+' л на базу.':'Разгружаем '+sim.aboard()+' '+cargoWord(sim.route)+'. Доставка на месте.');if(!save.motion)completeDispatch();}
function showDispatch(title,text){$('dispatch-title').textContent=title;$('dispatch-copy').textContent=text;$('dispatch-skip').textContent=dispatch.phase==='loading'?'ПОЕХАЛИ →':'К ИТОГАМ →';visibility('dispatch-card',true);}
function completeDispatch(){
 const phase=dispatch.phase;if(!phase)return;dispatch.phase=null;visibility('dispatch-card',false);last=performance.now();acc=0;
 if(phase==='loading'){sim.started=true;setPage('drive');checkpointRun(true);if(!save.tutorialDone&&(save.runs===0||sim.repeatLesson))startLesson();}else showResult();
}
function updateDispatch(dt){if(mode!==dispatch.phase)return;if(!dispatch.phase)return;dispatch.elapsed+=dt;$('dispatch-progress').style.width=Math.min(100,dispatch.elapsed/dispatch.duration*100)+'%';if(dispatch.elapsed>=dispatch.duration)completeDispatch();}
function dispatchCrate(box){if(box.kind==='liquid'||box.delivered)return;
 if(!dispatch.phase||!['loading','unloading','pause'].includes(mode)||box.lost){crate(box);return;}
 const at=Math.min(1,Math.max(0,dispatch.elapsed/dispatch.duration)),q=box.body.getPosition(),a=box.body.getAngle();
 const offset=dispatch.phase==='loading'?Math.pow(Math.max(0,1-at*(1.6+box.index*.2)),2):Math.pow(Math.max(0,(at-.12-box.index*.12)/.55),2);
 const proxy={...box,body:{getPosition:()=>({x:q.x+(dispatch.phase==='loading'?-3:3)*offset,y:q.y+2*offset}),getAngle:()=>a}};
 ctx.save();if(dispatch.phase==='unloading')ctx.globalAlpha=Math.max(0,1-offset);crate(proxy);ctx.restore();
}
function medalRewards(s,stats){
 const awards=[],whole=s.state==='win'&&s.wholeCargo();
 if(whole&&!stats.whole){stats.whole=true;awards.push({name:'ВЕСЬ ГРУЗ',amount:30});}
 if(whole&&s.hardLandings===0&&!stats.smooth){stats.smooth=true;awards.push({name:'МЯГКИЙ ХОД',amount:40});}
 if(s.state==='win'&&(s.stops||[]).length&&s.stops.every(x=>x.done)&&!stats.relay){stats.relay=true;awards.push({name:'РАЗВОЗЧИК',amount:60});}
 return awards;
}
function renderMedals(){
 const whole=sim.state==='win'&&sim.wholeCargo(),smooth=whole&&sim.hardLandings===0;
 $('result-medals').innerHTML=[['ВЕСЬ ГРУЗ',whole],['МЯГКИЙ ХОД',smooth],...(sim.stops.length?[['РАЗВОЗЧИК',sim.state==='win'&&sim.stops.every(s=>s.done)]]:[])].map(([name,done])=>'<span class="'+(done?'won':'')+'">'+(done?'✓ ':'')+name+'</span>').join('');
 const bonus=(sim.awards||[]).reduce((a,b)=>a+b.amount,0),delivery=sim.reward()-sim.coins;
 const sectors=sim.sectors||[],sectorBonus=sectors.filter(s=>s.passed).reduce((a,s)=>a+s.reward,0);$('result-breakdown').textContent='ДОРОГА +'+(sim.coins-sectorBonus)+(sectors.length?' · СПУСКИ '+sectors.filter(s=>s.passed).length+'/'+sectors.length+' +'+sectorBonus:'')+' · ГРУЗ +'+delivery+' · НОВЫЕ ЗНАКИ +'+bonus;
}
const VILLAGE=[
 {name:'ЛЕСНИЧЕСТВО',job:0,x:110,y:85,kind:'wood',hint:'Расчистка дороги'},
 {name:'НАСОСНАЯ',job:3,x:305,y:85,kind:'pump',hint:'Вода в домах'},
 {name:'МОСТ',job:5,x:500,y:85,kind:'bridge',hint:'Снова можно проехать'},
 {name:'ЛИНИЯ СВЯЗИ',job:2,x:110,y:210,kind:'radio',hint:'Свет и рация'},
 {name:'МЕДПУНКТ',job:7,x:305,y:210,kind:'clinic',hint:'Резервное питание'},
 {name:'СТАНЦИЯ 17',job:null,x:500,y:210,kind:'station',hint:'Финал девяти доставок'}
];
function villageActive(n){return n.job===null?save.stats.slice(0,9).every(x=>x.wins>0):save.stats[n.job].wins>0;}
function villageBuilding(n){const {x,y,kind}=n,on=villageActive(n),ink=on?'#3f6650':'#8f907b',window=on?'#e1b954':'#778375';let shape='';
 if(kind==='bridge')shape='<path d="M'+(x-52)+' '+(y+8)+'h104m-104-15h104m-90-12v40m24-40v40m24-40v40m24-40v40" stroke="'+ink+'" stroke-width="5" fill="none"/>';
 else if(kind==='radio')shape='<path d="M'+x+' '+(y-42)+'l-20 62h40Zm-12 26h24m-30 18h36" stroke="'+ink+'" stroke-width="4" fill="none"/><circle cx="'+x+'" cy="'+(y-46)+'" r="6" fill="'+window+'"/>';
 else shape='<rect x="'+(x-32)+'" y="'+(y-22)+'" width="64" height="45" rx="1" fill="'+ink+'"/><path d="M'+(x-40)+' '+(y-23)+'l40-24 40 24Z" fill="'+ink+'"/><rect x="'+(x-23)+'" y="'+(y-12)+'" width="14" height="14" fill="'+window+'"/><rect x="'+(x+8)+'" y="'+(y-12)+'" width="14" height="14" fill="'+window+'"/>'+(kind==='clinic'?'<path d="M'+x+' '+(y-40)+'v17m-8-9h16" stroke="#d9c9a4" stroke-width="5"/>':kind==='pump'?'<circle cx="'+x+'" cy="'+(y+17)+'" r="10" fill="#8aa5a0" stroke="'+ink+'" stroke-width="3"/>':'');
 return '<g>'+shape+'<text x="'+x+'" y="'+(y+47)+'" text-anchor="middle" fill="#304438" font-size="14" font-weight="700">'+n.name+'</text><text x="'+x+'" y="'+(y+64)+'" text-anchor="middle" fill="'+(on?'#426c49':'#776f57')+'" font-size="12">'+(on?'РАБОТАЕТ':'ЖДЁТ ГРУЗ')+'</text></g>';
}
function openVillage(){
 $('village-progress').textContent=save.stats.slice(0,9).filter(x=>x.wins>0).length+' / 9 РЕЙСОВ ПОСЁЛКА';
 $('village-map').innerHTML='<svg viewBox="0 0 610 295" role="img" aria-label="Карта восстановления Лисьего Брода"><rect width="610" height="295" fill="#d7caa6"/><path d="M20 166H590M210 45v230" stroke="#aea482" stroke-width="14"/><path d="M20 166H590" stroke="#e4dcc2" stroke-width="2" stroke-dasharray="9 8"/>'+VILLAGE.map(villageBuilding).join('')+'</svg>';
 const next=nextCareerJob();$('village-next').textContent=save.stats.slice(0,9).every(x=>x.wins>0)?'Свет вернулся. На каждой дороге ещё можно собрать три звезды и два знака мастерства.':'Следующий шаг: '+STORY.jobs[next].cargo+' → '+STORY.jobs[next].to;
 visibility('village',true);
}
