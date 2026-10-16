'use strict';
const PAINTS=[
 {id:'factory',name:'ЗАВОД',wins:0,swatch:'#d99151'},
 {id:'pine',name:'ХВОЯ',wins:2,swatch:'#658e67',color:'#658e67',accent:'#afc3a0',shadow:'#344e3b'},
 {id:'sand',name:'ПЕСОК',wins:5,swatch:'#baa16f',color:'#baa16f',accent:'#e1c898',shadow:'#77684e'},
 {id:'cherry',name:'ВИШНЯ',wins:9,swatch:'#ad655a',color:'#ad655a',accent:'#dcaa91',shadow:'#613d42'},
 {id:'marine',name:'ШТОРМ',wins:12,swatch:'#497e9a',color:'#497e9a',accent:'#a5c5cd',shadow:'#2d4e66'},
 {id:'graphite',name:'ГРАФИТ',wins:0,swatch:'#53616a',color:'#53616a',accent:'#c0cbd0',shadow:'#273742'},
 {id:'ochre',name:'ОХРА',wins:0,swatch:'#bc9545',color:'#bc9545',accent:'#ead4a0',shadow:'#775e35'},
 {id:'rescue',name:'СПАСАТЕЛЬ',wins:0,swatch:'#ae493e',color:'#ae493e',accent:'#eee2c9',shadow:'#673d37'},
 {id:'glacier',name:'ЛЕДНИК',wins:0,swatch:'#8bafb7',color:'#8bafb7',accent:'#e8e6d3',shadow:'#466b77'},
 {id:'olive',name:'ОЛИВА',wins:0,swatch:'#72785a',color:'#72785a',accent:'#c7c4a7',shadow:'#3e493c'},
 {id:'cream',name:'СЛОНОВАЯ КОСТЬ',wins:0,swatch:'#d5cdb7',color:'#d5cdb7',accent:'#f3e7cc',shadow:'#8c9389'},
 {id:'arctic',name:'СЕВЕР',wins:16,swatch:'#d9dcd0',color:'#d9dcd0',accent:'#f4ead0',shadow:'#7a989b'}
];
function saveKey(){return profile==='career'?'cargo-career-v1':'cargo-save-v1';}
function completedJobs(){return save.stats.filter(x=>x.wins>0).length;}
function nextCareerJob(){return STORY.sequence.find(id=>!(save.stats[id].wins>0))??0;}
function careerStatus(){return profile==='career'?'КАРЬЕРА · '+completedJobs()+' / '+CP.routes.length:'СВОБОДНАЯ ЕЗДА';}
function openProfiles(){visibility('profiles',true);$('profile-current').textContent='Сейчас: '+careerStatus();}
function switchProfile(next){
 if(!['test','career'].includes(next)||next===profile){visibility('profiles',false);return;}
 if(sim)leaveRun();persist();const settings={};for(const k of ['sound','haptics','music','volume','quality','effects','motion','bigPedals','dialogues','radio','ghostEnabled'])settings[k]=save[k];
 const nextSave=loadSave(next==='career'?'cargo-career-v1':'cargo-save-v1');profile=next;save=nextSave;Object.assign(save,settings);
 selected=save.selected;if(!routeUnlocked(selected)){selected=nextCareerJob();save.selected=selected;}region=CP.routes[selected].region;
 resetCoach();visibility('profiles',false);persist();applySettings();home();
}
function paintUnlocked(p){return profile==='test'||completedJobs()>=p.wins;}
function vehicleLook(base){const run=['drive','pause','fork','result','loading','unloading'].includes(mode)&&sim?sim:null,pending=mode==='home'&&pendingRun()?save.activeRun:null,frozen=run?.vehicle31||pending?.vehicle31,c=frozen||(run||pending?CP.fleet31.config({livery:save.builds31[base.id]?.livery,rims:save.builds31[base.id]?.rims}):save.builds31[base.id])||CP.fleet31.config(),paint=frozen?.paint||save.paints[base.id],p=PAINTS.find(x=>x.id===paint);return {...base,...(p&&p.id!=='factory'?{color:p.color,accent:p.accent,shadow:p.shadow}:{}),look31:c};}
function renderPaints(){
 $('paint-options').innerHTML=PAINTS.map(p=>'<button class="paint-choice '+(save.paints[save.vehicle]===p.id?'selected':'')+'" data-paint="'+p.id+'" aria-label="Окраска '+p.name+'" aria-pressed="'+(save.paints[save.vehicle]===p.id)+'" '+(!paintUnlocked(p)?'disabled':'')+'><i style="background:'+p.swatch+'"></i><span>'+p.name+'</span><small>'+(!paintUnlocked(p)?p.wins+' РЕЙСОВ':'')+'</small></button>').join('');
 document.querySelectorAll('[data-paint]').forEach(b=>b.onclick=()=>{const p=PAINTS.find(x=>x.id===b.dataset.paint);if(!p||!paintUnlocked(p))return;save.paints[save.vehicle]=p.id;persist();renderPaints();beep(440);visibility('paint-dialog',false);});
}
function renderCareerHome(){
 $('profile-badge').textContent=careerStatus();$('build-profile').textContent=careerStatus();
 const next=nextCareerJob(),done=completedJobs();
 $('career-label').textContent=profile==='career'?(save.stats.slice(0,9).every(x=>x.wins>0)?'НОВЫЕ ГОРИЗОНТЫ':'ВОССТАНОВЛЕНИЕ ПОСЁЛКА'):'СВОБОДНЫЙ ТЕСТ-ДРАЙВ';
 $('career-title').textContent=done===CP.routes.length?'ВСЕ ДОРОГИ ПРОЙДЕНЫ':profile==='career'?STORY.jobs[next].to:'ВСЕ ДОРОГИ ОТКРЫТЫ';
 $('career-progress').style.width=done/CP.routes.length*100+'%';
 $('career-copy').textContent=profile==='career'?done===CP.routes.length?'Все '+CP.routes.length+' рейсов приняты. Собери по три звезды на каждом.':'Следующий груз: '+STORY.jobs[next].cargo+'.': 'Проверяй машины и маршруты. Карьера — отдельное прохождение с нуля.';
}
