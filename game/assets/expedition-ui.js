'use strict';
(function(){
 const originalHud=hud,originalWallet=wallet,originalRouteArt=routeArt;
 const el=id=>document.getElementById(id);
 function shift(){
  if(!sim||mode!=='drive')return;
  if(sim.setLowGear(!sim.lowGear)){hud();beep(sim.lowGear?140:230);checkpointRun(true);toast(sim.lowGear?'4L · ТЯГА +55% / СКОРОСТЬ НИЖЕ':'4H · ДОРОЖНАЯ ПЕРЕДАЧА');}
  else toast(sim.groundCount<1?'ПЕРЕКЛЮЧАЙ НА ЗЕМЛЕ':'СБАВЬ СКОРОСТЬ ДО 38 КМ/Ч');
 }
 el('transfer-case').onclick=shift;
 addEventListener('keydown',e=>{if(e.code==='KeyQ'&&!e.repeat)shift();});
 hud=function(){
  originalHud();if(!sim)return;
  const low=!!sim.lowGear;
  el('gear-value').textContent=low?'4L':'4H';el('gear-name').textContent=low?'ТЯГА':'ДОРОГА';el('transfer-case').setAttribute('aria-pressed',String(low));
  let instability=0,broken=0;
  for(const box of sim.boxes){if(box.lost||box.delivered)continue;if(box.kind==='liquid'){instability=Math.max(instability,Math.abs(sim.fluidSlosh)/.32);continue;}
   const q=sim.car.getLocalPoint(box.body.getPosition());instability=Math.max(instability,Math.hypot(q.x-box.home.x,q.y-box.home.y)/1.1);if(!box.strap&&!sim.vehicle.closed)broken++;
  }
  instability=Math.min(1,Math.max(0,instability));el('load-stability-fill').style.width=(instability*100)+'%';el('load-stability-fill').style.background=instability>.68||broken?'#e09567':'#acbd8d';
  el('load-stability-label').textContent=broken?'БЕЗ РЕМНЯ':instability>.68?'КАЧАЕТ':'СТАБИЛЕН';
  const speed=Math.abs(sim.car.getLinearVelocity().x)*10.8;el('gauge-needle').style.transform='rotate('+Math.min(120,speed*1.8)+'deg)';
  el('road-readout').textContent=sim.inWater?'БРОД':sim.groundCount===0?'В ВОЗДУХЕ':sim.slipTime>.3?'ПРОБУКСОВКА':CP.surfaceAt(sim.car.getPosition().x,sim.id).type==='mud'?'ГРЯЗЬ':low?'ПОНИЖЕННАЯ':'4×4';
 };
 wallet=function(){originalWallet();if(!pendingRun())el('home-play-label').textContent='НАЧАТЬ РЕЙС';};
 // Miniature landscape maps show the region as well as the measured road profile.
 routeArt=function(id){
  const r=CP.routes[id],old=originalRouteArt(id),colors=[['#b9c8aa','#70916c','#395c40'],['#cbbda4','#9e9477','#606c4b'],['#526e65','#385b46','#203f2c'],['#b0d0bb','#83ad92','#496e4d'],['#a4b695','#709562','#395f35'],['#d0dcd1','#8caea3','#537c70']][r.region];
  const mountain='<path d="M0 76L23 58L51 68L82 32L119 69L150 51L184 64L220 26L263 58L300 49V120H0Z" fill="'+colors[1]+'"/><path d="M0 84L29 74L62 82L99 62L140 78L175 67L214 82L247 61L300 75V120H0Z" fill="'+colors[2]+'"/>';
  let details='';for(let n=0;n<10;n++){const x=n*34+8,top=65+hash(n+id)*26;details+='<path d="M'+x+' '+top+'l-7 17h5l-8 12h20l-8-12h5Z" fill="'+colors[2]+'" opacity=".7"/>';}
  const profile=old.match(/<path d="([^"]+)" stroke="#e5ca8b"[^>]*\/>/g)||[];
  return '<svg viewBox="0 0 300 120" preserveAspectRatio="xMidYMid slice" aria-label="Карта '+r.name+'"><rect width="300" height="120" fill="'+colors[0]+'"/><circle cx="252" cy="24" r="10" fill="#eadab5"/>'+mountain+details+'<g transform="translate(0 18) scale(1 .85)">'+profile.join('')+'</g><path d="M14 103H286" stroke="#e0d4ad" stroke-width=".6" opacity=".25"/><circle cx="14" cy="96" r="3" fill="#e3c49a"/><path d="M284 85V101M284 86l8 3-8 4" stroke="#ead2a7" stroke-width="1.5" fill="none"/><text x="10" y="115" fill="#e8dec3" font-size="7" font-family="sans-serif">'+String(id+1).padStart(2,'0')+' / '+r.length*3+' М</text></svg>';
 };
 const originalLesson=startLesson;
 startLesson=function(){originalLesson();if(lesson.active&&el('lesson-text'))el('lesson-text').textContent='Справа — газ, слева — тормоз. Кнопка 4H включает пониженную 4L: больше тяги, меньше скорости. Береги ящики на спусках.';};
 const brand=el('brand-home').querySelector('svg');brand.innerHTML='<path d="M5 4h9c8 0 11 5 11 11s-3 11-11 11H5V4Z"/><path d="M10 10h4c4 0 6 2 6 5s-2 5-6 5h-4M10 10v10"/>';
 document.querySelectorAll('#routes .eyebrow').forEach(n=>n.textContent='ЭКСПЕДИЦИОННЫЙ АТЛАС');
 const title=el('routes').querySelector('h2');if(title)title.textContent='Дороги и заказы';
 wallet();
})();
