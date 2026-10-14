'use strict';
let checkpointAt=-5,newRunIntent=null;
function pendingRun(){return save.activeRun&&!save.settledRuns.includes(save.activeRun.attempt)?save.activeRun:null;}
function checkpointRun(force=false){
 if(!sim||sim.state!=='drive'||sim.paid||sim.started===false)return false;
 if(!force&&sim.time-checkpointAt<5)return true;
 const data=RunCheckpoint.capture(sim,CP);if(!data)return false;data.coach=lesson.active?{step:lesson.step,held:lesson.held}:null;
 save.activeRun=data;checkpointAt=sim.time;const ok=persist();
 if(force){$('pause-save-status').textContent=ok?'Рейс сохранён. Можно закрыть игру.':'Не удалось сохранить. Продолжи рейс и попробуй позже.';$('pause-save-status').classList.toggle('save-error',!ok);}
 return ok;
}
function updateResumeHome(){
 const run=pendingRun();$('home-play-label').textContent=run?'ПРОДОЛЖИТЬ РЕЙС':'ИГРАТЬ';$('home-current-route').textContent=run?CP.routes[run.id].name+' · '+Math.floor(run.state.distance)+' м · бак '+Math.floor(run.state.fuel)+'%':CP.routes[selected].name+' · '+CP.routes[selected].length*3+' м';
 $('saved-run-note').textContent=run?'Машина и груз ждут там, где ты остановился.':'';visibility('saved-run-note',!!run);if(run){$('home-job-kind').textContent='СОХРАНЁННЫЙ РЕЙС';$('home-weather').textContent=CP.weatherAt(run.id,run.state.time).name;$('home-work-info').textContent=timeText(run.state.time)+' в пути · кузов '+Math.floor(run.state.condition)+'%';}
}
function resumeSavedRun(){
 const data=pendingRun();if(!data)return false;const restored=RunCheckpoint.restore(data,CP);
 if(!restored){save.activeRun=null;persist();wallet();$('saved-run-note').textContent='Этот рейс восстановить не удалось. Можно начать новый.';visibility('saved-run-note',true);return false;}
 sim=restored;selected=sim.id;save.selected=selected;save.vehicle=sim.vehicle.id;region=sim.route.region;dispatch.phase=null;checkpointAt=sim.time;clearInput();acc=0;particles=[];resetCoach();if(data.coach&&Number.isInteger(data.coach.step)&&data.coach.step>=0&&data.coach.step<LESSONS.length&&Number.isFinite(data.coach.held)&&data.coach.held>=0&&data.coach.held<=60){lesson={active:true,step:data.coach.step,held:data.coach.held};showLesson();}configureRunHud();cam={x:sim.car.getPosition().x+3,y:sim.car.getPosition().y+.8};const br=sim.nextLiftBridge();scale=Math.min(H/(br&&Math.abs(sim.car.getPosition().x-br.control)<18?13.5:sim.vehicle.axles?10.3:9.5),W/(br?34:sim.vehicle.axles?29:26));
 setPage('pause');$('pause-copy').textContent='Рейс восстановлен. Продолжишь, когда будешь готов.';$('pause-save-status').textContent='Положение, груз, бак и время восстановлены.';$('pause-save-status').classList.remove('save-error');visibility('save-exit',true);last=performance.now();persist();return true;
}
function saveAndHome(){if(checkpointRun(true)){dispatch.phase=null;home();}}
function requestNewRun(){newRunIntent=selected;$('replace-run-copy').textContent='Текущий рейс закончится. Собранные монеты сохранятся, доставку нужно будет начать заново.';visibility('replace-run',true);}
function installRunSession(){
 $('save-exit').onclick=saveAndHome;$('replace-run-cancel').onclick=()=>{newRunIntent=null;visibility('replace-run',false);};$('replace-run-confirm').onclick=()=>{const id=newRunIntent;newRunIntent=null;visibility('replace-run',false);if(id===null)return;leaveRun();selected=id;save.selected=id;start();};
 addEventListener('pagehide',()=>{clearInput();pause();checkpointRun(true);});
 let inputWidth=innerWidth,inputHeight=innerHeight;addEventListener('resize',()=>{if(innerWidth!==inputWidth||innerHeight!==inputHeight){inputWidth=innerWidth;inputHeight=innerHeight;clearInput();pause();}});
 window.androidResume=()=>{clearInput();last=performance.now();acc=0;};
 window.androidInsets=(left,top,right,bottom)=>{for(const [name,value] of Object.entries({left,top,right,bottom}))if(Number.isFinite(value)&&value>=0&&value<200)document.documentElement.style.setProperty('--safe-'+name,value+'px');};
}
