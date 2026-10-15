'use strict';
// Cartography uses the actual collision profile and contract coordinates.
const JourneyMaps20=(()=>{
 const cache=new Map();
 function map(id,detail=false){
  const key=id+':'+detail;if(cache.has(key))return cache.get(key);
  const r=CP.contractRoute(id),road=r.roadId??id,samples=Array.from({length:161},(_,n)=>({x:r.length*n/160,y:CP.groundHeight(r.length*n/160,road)}));
  const lo=Math.min(...samples.map(p=>p.y)),hi=Math.max(...samples.map(p=>p.y)),px=x=>22+x/r.length*596,py=y=>155-(y-lo)/Math.max(8,hi-lo)*100;
  const line=samples.map((p,n)=>(n?'L':'M')+px(p.x).toFixed(1)+' '+py(p.y).toFixed(1)).join(' '),col=['#384d3b','#4d4b3e','#273e3b','#43574d','#344b3c','#465956'][r.region];
  let contours='';for(let n=0;n<8;n++){let d='';for(let x=0;x<=640;x+=16)d+=(x?'L':'M')+x+' '+(n*34-30+Math.sin(x*.012+id*.8+n*.42)*23+Math.cos(x*.024-n)*9).toFixed(1);contours+='<path d="'+d+'"/>';}
  let marks='';for(const s of r.sectors||[])marks+='<path d="'+samples.filter(p=>p.x>=s.from&&p.x<=s.to).map((p,n)=>(n?'L':'M')+px(p.x).toFixed(1)+' '+py(p.y).toFixed(1)).join(' ')+'" fill="none" stroke="#eca979" stroke-width="9" opacity=".6"/>';
  for(const b of [CP.bridges[road],r.liftBridge].filter(Boolean))marks+='<path d="M'+px(b.from)+' '+py(b.y)+'H'+px(b.to)+'" stroke="#d7ded1" stroke-width="5" stroke-dasharray="2 3"/>';
  for(const f of r.fords||[])marks+='<path d="M'+px(f.from)+' 170H'+px(f.to)+'" stroke="#79bac8" stroke-width="5"/>';
  const pins=[...(r.liftBridge?[{x:r.liftBridge.control,name:r.liftBridge.name,label:'↕',color:'#d7c49c'}]:[]),...(r.fords||[]).map(f=>({x:f.from,name:f.name,label:'≈',color:'#79bac8'})),...(CP.gaps[road]?[{x:(CP.gaps[road].from+CP.gaps[road].to)/2,name:'РАЗРЫВ ДОРОГИ',label:'×',color:'#d49b79'}]:[]),...(r.drops||r.stops||[]).map((s,n)=>({...s,label:String(n+1),color:'#ebc98b'})),...(r.services||[]).map(s=>({...s,label:'+',color:'#95bda3'})),...(r.gates||[]).map(s=>({...s,label:'!',color:'#e9a57f'})),...(r.hazards||[]).map(s=>({x:s.peak,name:s.name,label:'⌃',color:'#e9b180'}))];
  let pinArt='';const labels=new Map();for(const [n,p] of pins.entries()){const x=px(p.x),y=py(CP.height(p.x,road)),lx=Math.max(75,Math.min(560,x)),name=p.name.slice(0,18),half=name.length*2.9+5,shelves=n%2?[184,168,24,40]:[24,40,184,168],ly=shelves.find(row=>!(labels.get(row)||[]).some(([a,b])=>lx-half<b&&lx+half>a))??shelves[0];if(!labels.has(ly))labels.set(ly,[]);labels.get(ly).push([lx-half,lx+half]);pinArt+='<g data-map-pin="'+p.x+'"><path d="M'+x+' '+y+'V'+ly+'" stroke="'+p.color+'" stroke-width="1" stroke-dasharray="3 3"/><circle cx="'+x+'" cy="'+y+'" r="9" fill="'+p.color+'" stroke="#17271f" stroke-width="2"/><text x="'+x+'" y="'+(y+3)+'" text-anchor="middle" fill="#1b2b21" font-size="10" font-weight="700">'+p.label+'</text>'+(detail?'<text class="map-pin-label" x="'+lx+'" y="'+ly+'" text-anchor="middle" fill="#dedfcb" font-size="10">'+p.name.slice(0,18)+'</text>':'')+'</g>';}
  const art='<svg viewBox="0 0 640 210" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Рельеф и остановки: '+r.name+'"><rect width="640" height="210" fill="'+col+'"/><g fill="none" stroke="#bdc4a6" stroke-width=".6" opacity=".12">'+contours+'</g><g stroke="#bdc4a6" opacity=".12">'+[100,200,300,400,500,600].map(x=>'<path d="M'+x+' 0V210"/>').join('')+'</g><path d="'+line+' L618 180H22Z" fill="#152b2190"/><path d="'+line+'" fill="none" stroke="#15271e" stroke-width="7" stroke-linejoin="round"/><path d="'+line+'" fill="none" stroke="#d9d2ac" stroke-width="3" stroke-linejoin="round"/>'+marks+pinArt+'<circle cx="22" cy="'+py(samples[0].y)+'" r="5" fill="#bdd0a8"/><path d="M618 '+(py(samples.at(-1).y)-17)+'v21m0-21h10l-3 5 3 5h-10" stroke="#edc794" fill="none" stroke-width="2"/>'+(detail?'<text x="22" y="200" fill="#c6cfbb" font-size="9">РЕАЛЬНЫЙ РЕЛЬЕФ · '+r.length*3+' М</text>':'')+'</svg>';
  cache.set(key,art);return art;
 }
 return {map};
})();
routeArt=JourneyMaps20.map;
const journeyCue=document.createElement('div');journeyCue.id='journey-cue';journeyCue.className='hidden';$('hud').appendChild(journeyCue);
const missedStop=document.createElement('div');missedStop.id='missed-stop';missedStop.className='hidden';missedStop.setAttribute('role','status');$('hud').appendChild(missedStop);
let previousMissed=null;
function updateJourneyCue(next){
 const missed=next.missed&&['stop','service','survey','gate'].includes(next.type);visibility('missed-stop',missed);
 if(missed){missedStop.innerHTML='<span class="return-arrow">←</span><div><b>ТОЧКА ПРОПУЩЕНА</b><span>'+next.name+'</span><small>НАЗАД '+next.metres+' М · ДЕРЖИ ТОРМОЗ ДЛЯ ЗАДНЕГО ХОДА</small></div>';if(previousMissed!==next.x){toast('ПРОЕХАЛ ТОЧКУ · СЛЕВА ПОЗАДИ');previousMissed=next.x;}}else previousMissed=null;
 const x=sim.car.getPosition().x,sector=sim.sectors?.find(s=>!s.done&&x>=s.from-18&&x<=s.to);
 visibility('journey-cue',!!sector&&!missed);
 if(sector){const failed=sector.maxSpeed>sector.limit;journeyCue.dataset.failed=String(failed);journeyCue.innerHTML='<b>'+(x<sector.from?'СПУСК ЧЕРЕЗ '+Math.round((sector.from-x)*3)+' М':failed?'ПРЕМИЯ УПУЩЕНА':'ПЛАВНЫЙ СПУСК · +'+sector.reward)+'</b><span>'+(failed?'Береги груз до конца участка':'До 36 км/ч · без жёстких посадок')+'</span>';}
}
const plan=document.createElement('section');plan.id='mission-plan';plan.className='overlay hidden';plan.innerHTML='<div class="dialog mission-plan-dialog"><div class="dialog-title"><div><span class="eyebrow">ДОРОЖНАЯ КНИГА</span><h2 id="mission-plan-title"></h2></div><button id="mission-plan-close" class="icon-button" aria-label="Закрыть план">'+icon('close')+'</button></div><div id="mission-plan-art"></div><div id="mission-plan-stops"></div><p class="map-key">● Остановка · + Сервис · ! Шлагбаум · × Разрыв · светлый пунктир — мост · голубой — брод · оранжевый — спуск с премией</p></div>';document.body.appendChild(plan);
$('mission-plan-close').onclick=()=>visibility('mission-plan',false);
function openMissionPlan(){
 const r=CP.contractRoute(selected);$('mission-plan-title').textContent=r.name;$('mission-plan-art').innerHTML=routeArt(selected,true);
 const stops=r.drops||r.stops||[];$('mission-plan-stops').innerHTML='<span>СТАРТ → '+(stops.length?stops.map((s,n)=>(n+1)+'. '+s.name+' · '+Math.round(s.x*3)+' м').join(' → ')+' → ':'')+'БАЗА</span>'+(r.sectors.length?'<span>ПРЕМИЯ +'+r.sectors.reduce((a,s)=>a+s.reward,0)+' · спуски до 36 км/ч, без потери груза и жёстких посадок</span>':'');visibility('mission-plan',true);
}
const renderRoutes19=renderRoutes;renderRoutes=function(){renderRoutes19();const art=document.querySelector('.route-detail-art'),button=document.createElement('button');button.className='open-mission-plan';button.textContent='ПЛАН РЕЙСА ↗';button.onclick=openMissionPlan;art.appendChild(button);};
const back19=window.androidBack;window.androidBack=function(){if(!plan.classList.contains('hidden')){visibility('mission-plan',false);return true;}return back19?back19():false;};
