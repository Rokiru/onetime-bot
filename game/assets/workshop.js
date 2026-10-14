'use strict';
function vehiclePull(m,levels){return m.torque*(1+levels[0]*.12)*(m.driven?m.driven.length/(m.axles?m.axles.length:2):1);}
function renderWorkshop(){
 const m=CP.preparedVehicle(save.vehicle,save.setups[save.vehicle]),l=currentLevels(),setup=CP.SETUPS[m.setup];
 $('workshop-summary').innerHTML='<button id="setup-open">Режим езды: '+setup.name.toLowerCase()+(CP.routes[selected].kind==='eco'&&m.setup!=='economy'?' · совет: эконом':'')+' '+icon('tools')+'</button>';
 $('setup-open').onclick=()=>{renderSetups();visibility('setup-dialog',true);};
}
function renderSetups(){
 $('setup-model').textContent=currentVehicle().name+' · текущая: '+CP.SETUPS[save.setups[save.vehicle]].name+(CP.routes[selected].kind==='eco'?' · Для этого заказа рекомендуется ЭКОНОМ':'');
 const descriptions={standard:'Заводской баланс скорости, тяги и расхода.',trail:'Тяга +7%, лучше сцепление и спокойнее подвеска. Скорость −6%, расход +7%.',economy:'Расход −18%, скорость −10%, тяга −4%. Мотор охлаждается немного быстрее.'};
 $('setup-options').innerHTML=Object.entries(CP.SETUPS).map(([id,t])=>'<button data-setup="'+id+'" class="setup-choice '+(save.setups[save.vehicle]===id?'selected':'')+'" aria-pressed="'+(save.setups[save.vehicle]===id)+'"><b>'+t.name+'</b><span>'+descriptions[id]+'</span><small>'+(save.setups[save.vehicle]===id?'УСТАНОВЛЕНО':'ВЫБРАТЬ БЕСПЛАТНО')+'</small></button>').join('');
 document.querySelectorAll('[data-setup]').forEach(b=>b.onclick=()=>{save.setups[save.vehicle]=b.dataset.setup;persist();renderSetups();upgrades();});
}
function updateRoadsideHud(){
 $('engine-heat').textContent='МОТОР '+Math.round(sim.temperature)+'°'+(sim.overheated?' · ОХЛАДИ':'');$('engine-heat').classList.toggle('danger',sim.overheated);$('engine-heat').classList.toggle('warm',sim.temperature>=85&&!sim.overheated);
 const site=sim.nextService(),x=sim.car.getPosition().x,near=site&&Math.abs(x-site.x)<=3;visibility('service-panel',!!site&&(site.required||Math.abs(x-site.x)<32));
 if(site){$('service-label').textContent=site.name+(site.required?' · ОБЯЗАТЕЛЬНО':'');$('service-distance').textContent=site.elapsed>0?'РЕМОНТ '+Math.round(Math.min(100,site.elapsed/2.2*100))+'%':near&&gas?'ОТПУСТИ ГАЗ':near?'ДЕРЖИ ТОРМОЗ 2,2 С':(x>site.x+3?'ВЕРНИСЬ · ':'')+Math.round(Math.abs(site.x-x)*3)+' М ДО СЕРВИСА';$('service-progress').style.width=Math.min(100,site.elapsed/2.2*100)+'%';$('service-panel').classList.toggle('docking',!!near);}
 document.querySelectorAll('.service-pin').forEach(el=>el.classList.toggle('done',!!sim.services[+el.dataset.service]?.done));
}
function roadsideEvent(ev){
 if(ev.type==='service'){toast('РЕМОНТ +'+ev.repaired+'% · БАК +'+Math.round(ev.refilled)+'%');if(save.sound)RoadAudio.event('fuel');sayDriver('Машина обслужена. Можно ехать.','happy',true);}
 if(ev.type==='hot'){toast('МОТОР ПЕРЕГРЕТ · ОТПУСТИ ГАЗ');sayDriver('Мотору жарко. Дай ему свободный ход.','worried',true);}
 if(ev.type==='cooled')toast('МОТОР ОСТЫЛ · ТЯГА ВОССТАНОВЛЕНА');
}
addEventListener('DOMContentLoaded',()=>{$('setup-close').onclick=()=>visibility('setup-dialog',false);});
