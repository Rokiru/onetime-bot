'use strict';
function updateTankerHud(){
 const liquid=!!sim.fluidCapacity;$('liquid-readout').textContent=liquid?(sim.fluidLeak?'УТЕЧКА · ':'')+'СДАНО '+Math.floor(sim.fluidDelivered)+' Л':'';$('liquid-readout').classList.toggle('danger',sim.fluidLeak>0);
 const gate=sim.nextGate(),x=sim.car.getPosition().x,near=gate&&Math.abs(x-gate.x)<=2.8;visibility('gate-panel',!!gate&&Math.abs(x-gate.x)<33);
 if(gate){$('gate-label').textContent=gate.name;$('gate-distance').textContent=gate.requested?'ЖДИ ЗЕЛЁНЫЙ СВЕТ':gate.elapsed>0?'ЗАПРОС ПРОЕЗДА '+Math.round(gate.elapsed*100)+'%':near&&gas?'ОТПУСТИ ГАЗ':near?'ДЕРЖИ ТОРМОЗ 1 С':Math.round(Math.abs(gate.x-x)*3)+' М ДО ПОСТА';$('gate-progress').style.width=(gate.requested?Math.min(100,-gate.joint.getJointAngle()/1.4*100):gate.elapsed*100)+'%';}
 document.querySelectorAll('.gate-pin').forEach(el=>el.classList.toggle('done',!!sim.gates[+el.dataset.gate]?.open));
}
function tankerEvent(ev){if(ev.type==='gateRequest'){toast('ПОСТ · ПРОЕЗД ЗАПРОШЕН');}if(ev.type==='gateOpen'){toast('ЗЕЛЁНЫЙ СВЕТ · МОЖНО ЕХАТЬ');if(save.sound)beep(410);}}
