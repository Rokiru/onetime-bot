'use strict';
let lesson={active:false,step:0,held:0},driverMood='calm',driverMoodUntil=0,radioUntil=0,radioNext=0,wasAir=false;
const LESSONS=[
 ['1 / 4 · ТРОГАНИЕ','Подержи правую педаль — машина плавно наберёт ход.','gas'],
 ['2 / 4 · ТОРМОЖЕНИЕ','Отпусти газ и подержи левую педаль. Так бережём груз.','brake'],
 ['3 / 4 · МЯГКАЯ ЕЗДА','Снова разгонись. После 25 метров отпусти обе педали: дай подвеске отработать.','coast'],
 ['4 / 4 · ТВОЙ ПЕРВЫЙ РЕЙС','Сначала доставь ящик в лесничество: у жёлтого знака держи тормоз. Потом — на базу. За спуски до 36 км/ч без жёстких посадок получишь премию.','done']
];
function startLesson(){lesson={active:true,step:0,held:0};showLesson();}
function showLesson(){const row=LESSONS[lesson.step];$('lesson-title').textContent=row[0];$('lesson-text').textContent=lesson.step===3&&sim?.edition!==20?'Довези груз до базы. В полёте газ поднимает нос, тормоз опускает.':row[1];$('lesson-next').textContent=lesson.step===3?'ПОНЯЛ, ЕДУ!':'ПРОПУСТИТЬ';$('lesson-meter').style.width='0%';visibility('lesson',true);for(const id of ['gas','brake'])$(id).classList.toggle('coach-focus',row[2]===id);}
function endLesson(done=true){lesson.active=false;save.tutorialDone=done;persist();visibility('lesson',false);for(const id of ['gas','brake'])$(id).classList.remove('coach-focus');}
function updateCoach(dt){
 if(mode!=='drive'||!sim)return;
 if(lesson.active){
  const valid=lesson.step===0?gas&&!brake:lesson.step===1?brake&&!gas:lesson.step===2?sim.distance>=25&&!gas&&!brake:false;
  lesson.held=valid?lesson.held+dt:0;$('lesson-meter').style.width=Math.min(100,lesson.held/.85*100)+'%';
  if(lesson.held>=.85&&lesson.step<3){lesson.step++;lesson.held=0;showLesson();}
 }
 if(sim.time>driverMoodUntil)driverMood='calm';
 if(sim.time>radioUntil)visibility('driver-radio',false);
 if(lesson.active)return;
 const flying=sim.groundCount===0;
 if(flying&&!wasAir&&Math.abs(sim.car.getLinearVelocity().y)>2&&sim.time>2)sayDriver('Полёт: выровняй нос педалями.','focus');
 if(!flying&&wasAir)sayDriver('Приземлились. Плавнее газ.','focus');
 if(sim.fuel<20)sayDriver(CP.fuelPlan(sim.id).length?'Бак почти пуст. Следи за канистрами.':'Канистр нет. Отпускай газ на ровной дороге.','worried');if(sim.slipTime>.8)sayDriver('Колёса буксуют. Попробуй плавнее газ или лебёдку.','focus');
 if(Math.abs(sim.car.getAngle())>1.15&&Math.abs(sim.car.getLinearVelocity().x)<.4)sayDriver('Задний ход: держи тормоз.','worried');const surface=CP.surfaceAt(sim.car.getPosition().x,sim.id).type;
 if(surface==='ice')sayDriver('Лёд: тормози заранее.','focus');if(surface==='snow')sayDriver('Снег: держи ровную тягу.','focus');if(surface==='sand')sayDriver('Песок: не бросай тягу.','focus');
 if(surface==='mud')sayDriver('Грязь! Тягу держи ровно, без рывков.','focus');
 wasAir=flying;
}
function sayDriver(text,mood='focus',force=false){if(!save.radio||!sim||(!force&&sim.time<radioNext)||lesson.active)return;driverMood=mood;driverMoodUntil=sim.time+2.4;radioUntil=sim.time+2.4;radioNext=sim.time+14;$('driver-radio-text').textContent=text;visibility('driver-radio',true);}
function resetCoach(){lesson.active=false;visibility('lesson',false);visibility('driver-radio',false);driverMood='calm';radioNext=3;radioUntil=0;wasAir=false;for(const id of ['gas','brake'])$(id).classList.remove('coach-focus');}
