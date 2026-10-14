(function() {
  'use strict';
  const $=id=>document.getElementById(id),canvas=$('arena'),ctx=canvas.getContext('2d',{alpha:false});
  const KEY='iskra.save.v1',num=v=>Number.isFinite(v)?Math.max(0,Math.floor(v)):0;
  let data={coins:0,best:0,runs:0,wins:0,hull:0,power:0,drive:0,tutorial:false,sound:true,haptic:true,reduced:false,difficulty:'normal'};
  try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');if(raw){for(const k of ['coins','best','runs','wins'])data[k]=num(raw[k]);for(const k of ['hull','power','drive'])data[k]=Math.min(8,num(raw[k]));for(const k of ['tutorial','sound','haptic','reduced'])if(typeof raw[k]==='boolean')data[k]=raw[k];if(['easy','normal','hard'].includes(raw.difficulty))data.difficulty=raw.difficulty;}}catch(_){/* A corrupt save resets safely. */}
  let storageWarned=false;
  function save(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch(_){if(!storageWarned){storageWarned=true;toast('Не удалось сохранить прогресс: память недоступна');}}}
  let run=null,paused=false,screen='menu',resultSaved=false,last=0,visualTime=0,accumulator=0,hudTime=0,choiceShown=false;
  let scale=1,ox=0,oy=0,width=420,height=800,joystick=null,input={x:0,y:0},keys={};
  let audio=null,toastTimer=null,pendingPlay=false,menuFx=[];
  const iconPaths={fire:'<path d="M12 2L19 12L12 22L5 12Z"/><path d="M12 8L15 12L12 16L9 12Z"/>',bolt:'<path d="M14 2L4 14H11L10 22L20 10H13Z"/>',split:'<path d="M12 21V11M12 11L5 4M12 11L19 4M2 4H5V7M16 4H19V7"/>',arrow:'<path d="M5 19L19 5M6 5H19V18"/>',orbit:'<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-40 12 12)"/>',heart:'<path d="M12 20L4 12C-1 5 7 1 12 7C17 1 25 5 20 12Z"/>',wind:'<path d="M3 7H16C22 7 22 2 18 2M3 12H19M3 17H14C20 17 20 22 16 22"/>',shield:'<path d="M12 2L21 6V12C21 18 12 22 12 22C12 22 3 18 3 12V6Z"/><path d="M8 12L11 15L17 9"/>',magnet:'<circle cx="12" cy="12" r="9"/><path d="M12 6V18M6 12H18"/>',star:'<path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z"/>'};
  const icon=name=>`<svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]||iconPaths.star}</svg>`;
  const symbols={};Object.keys(iconPaths).forEach(k=>{symbols[k]=icon(k);});
  const arrows=html=>html.replace(/<span>↗<\/span>/g,'<span>'+icon('arrow')+'</span>');
  $('play').innerHTML=arrows($('play').innerHTML);
  $('dash').querySelector('b').innerHTML=icon('bolt');
  const stars=Array.from({length:70},(_,i)=>({x:(i*137.53)%420,y:(i*213.79)%800,r:i%4===0?1.5:.7}));
  function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2400);}
  function initAudio(){try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch(_){}}
  function sound(type){
    if(!data.sound||!audio||audio.state!=='running')return;
    const table={shoot:[440,.035,.025,'triangle'],kill:[170,.06,.035,'sine'],pickup:[900,.035,.018,'sine'],dash:[130,.14,.045,'sawtooth'],hurt:[75,.18,.08,'triangle'],nova:[90,.4,.12,'sine'],level:[660,.3,.055,'sine'],boss:[180,.45,.06,'triangle'],warning:[110,.25,.05,'square'],end:[220,.5,.055,'sine']};
    const p=table[type];if(!p)return;
    const t=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
    osc.type=p[3];osc.frequency.setValueAtTime(p[0],t);osc.frequency.exponentialRampToValueAtTime(type==='level'?1320:Math.max(25,p[0]*.45),t+p[1]);
    gain.gain.setValueAtTime(p[2],t);gain.gain.exponentialRampToValueAtTime(.001,t+p[1]);osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+p[1]+.01);
  }
  function haptic(ms){if(!data.haptic)return;try{if(window.Android)Android.feedback(ms);else if(navigator.vibrate)navigator.vibrate(ms);}catch(_){}}
  function resize(){width=window.innerWidth;height=window.innerHeight;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);scale=Math.min(width/420,height/800);ox=(width-420*scale)/2;oy=(height-800*scale)/2;resetInput();}
  function resetInput(){joystick=null;input={x:0,y:0};keys={};}
  function point(event){return{x:(event.clientX-ox)/scale,y:(event.clientY-oy)/scale};}
  canvas.addEventListener('pointerdown',e=>{if(!run||paused||run.mode!=='playing'||joystick)return;const p=point(e);if(p.y<Iskra.TOP-10)return;initAudio();joystick={id:e.pointerId,x:p.x,y:p.y,dx:0,dy:0};canvas.setPointerCapture(e.pointerId);e.preventDefault();});
  canvas.addEventListener('pointermove',e=>{if(!joystick||joystick.id!==e.pointerId)return;const p=point(e),dx=p.x-joystick.x,dy=p.y-joystick.y,d=Math.hypot(dx,dy),n=Math.min(d,44)/(d||1);joystick.dx=dx*n;joystick.dy=dy*n;input.x=joystick.dx/44;input.y=joystick.dy/44;e.preventDefault();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(joystick&&joystick.id===e.pointerId)resetInput();});
  window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Escape'].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;if(e.key===' '&&run&&!paused)run.dash();if(e.key==='Escape')window.nativeBack();});
  window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
  $('dash').addEventListener('pointerdown',e=>{e.preventDefault();if(run&&!paused&&run.dash()){initAudio();haptic(15);}});
  $('play').onclick=()=>{initAudio();if(!data.tutorial){pendingPlay=true;showHelp();}else start();};
  $('workshop-open').onclick=showWorkshop;$('settings-open').onclick=showSettings;$('help-open').onclick=()=>{pendingPlay=false;showHelp();};
  $('pause').onclick=()=>pause();
  function updateMenu(){$('menu-coins').textContent='✦ '+data.coins;$('best-score').textContent=data.best.toLocaleString('ru-RU');document.body.classList.toggle('reduced',data.reduced);}
  function open(html,state){$('panel').innerHTML=arrows(html);$('overlay').hidden=false;screen=state;resetInput();}
  function close(){$('overlay').hidden=true;screen=run?'game':'menu';resetInput();}
  function header(label,title,closable=true){return `<div class="panel-top"><span class="eyebrow">${label}</span>${closable?'<button class="close" id="close-panel" aria-label="Закрыть">×</button>':''}</div><h2>${title}</h2>`;}
  function bindClose(fn=close){const b=$('close-panel');if(b)b.onclick=fn;}
  function showHelp(){
    open(header('ПЕРВЫЙ КОНТАКТ','Одной искры<br>достаточно.')+'<div class="help-step"><b>01</b><div><strong>Двигайся одним пальцем</strong><span>Потяни в любой точке арены. Искра сама стреляет в ближайшего врага.</span></div></div><div class="help-step"><b>02</b><div><strong>Прорывайся рывком</strong><span>Кнопка ↯ справа. Во время рывка ты неуязвим и наносишь урон при столкновении.</span></div></div><div class="help-step"><b>03</b><div><strong>Собирай осколки света</strong><span>Они открывают усиления и заряжают автоматический импульс. Красные зоны опасны.</span></div></div><div class="help-step"><b>04</b><div><strong>Верни свет в 8 секторов</strong><span>Стражи ждут в секторах 4 и 8. После каждой попытки улучшай Искру в мастерской.</span></div></div><button class="primary" id="help-done">'+(pendingPlay?'Я ГОТОВ · НАЧАТЬ':'ПОНЯТНО')+' <span>↗</span></button>','help');
    bindClose(()=>{pendingPlay=false;close();});$('help-done').onclick=()=>{data.tutorial=true;save();const begin=pendingPlay;pendingPlay=false;close();if(begin)start();};
  }
  function start(){
    initAudio();run=new Iskra.Run(Date.now(),data,data.difficulty);paused=false;resultSaved=false;choiceShown=false;accumulator=0;
    $('menu').hidden=true;$('hud').hidden=false;$('overlay').hidden=true;screen='game';resetInput();updateHud();sound('level');
  }
  function menu(){run=null;paused=false;screen='menu';$('menu').hidden=false;$('hud').hidden=true;$('overlay').hidden=true;resetInput();updateMenu();}
  function pause(){
    if(!run||run.mode!=='playing'||paused)return;paused=true;
    open(header('ВЫДОХНИ','Свет подождёт.',false)+`<p>Сектор ${run.wave} из 8 · уровень ${run.level}<br>Выбери момент и вернись в бой.</p><button class="primary" id="resume">ПРОДОЛЖИТЬ <span>↗</span></button><button class="secondary" id="pause-settings" style="width:100%;margin-top:12px">Звук и эффекты</button><button class="quiet" id="leave">Завершить попытку</button>`,'pause');
    $('resume').onclick=resume;$('pause-settings').onclick=showSettings;$('leave').onclick=()=>{paused=false;run.mode='dead';run.endReason='Искра вернётся';finish();};
  }
  function resume(){paused=false;close();initAudio();accumulator=0;}
  function showSettings(){
    const wasPaused=!!run;
    open(header('ПОД ТВОЙ РИТМ','Настройки')+['sound','haptic','reduced'].map((k,i)=>`<div class="setting-row"><span>${['Звуки','Вибрация','Меньше эффектов'][i]}</span><button class="toggle ${data[k]?'on':''}" data-setting="${k}">${data[k]?'ВКЛ':'ВЫКЛ'}</button></div>`).join('')+(!wasPaused?'<p style="margin-bottom:8px;margin-top:24px">Уровень сложности</p><div class="difficulty">'+[['easy','Рассвет'],['normal','Сумерки'],['hard','Затмение']].map(([k,t])=>`<button data-difficulty="${k}" class="${data.difficulty===k?'selected':''}">${t}</button>`).join('')+'</div><p style="font-size:11px;margin-top:12px">Рассвет: на 25% меньше урона и врагов.<br>Затмение: на 35% больше угроз.</p>':'')+'<p style="font-size:11px;margin-top:24px">Игра полностью офлайн. Прогресс хранится на устройстве. Удаление приложения удалит сохранения.</p>','settings');
    bindClose(()=>{if(wasPaused){paused=false;pause();}else close();});
    document.querySelectorAll('[data-setting]').forEach(b=>b.onclick=()=>{initAudio();data[b.dataset.setting]=!data[b.dataset.setting];save();updateMenu();showSettings();});
    document.querySelectorAll('[data-difficulty]').forEach(b=>b.onclick=()=>{data.difficulty=b.dataset.difficulty;save();showSettings();});
  }
  function showWorkshop(){
    const upgrades=[{id:'hull',name:'Оболочка',desc:'+12 здоровья навсегда',symbol:icon('shield')},{id:'power',name:'Ядро',desc:'+1,5 урона навсегда',symbol:icon('fire')},{id:'drive',name:'Двигатель',desc:'Рывок быстрее на 0,12 сек.',symbol:icon('bolt')}];
    open(header('СВЕТ СТАНОВИТСЯ СИЛЬНЕЕ','Мастерская')+`<p>Усиления сохраняются между попытками.<br>Каждый осколок приближает рассвет.</p><div class="workshop-balance">✦ ${data.coins} <span style="font-size:10px;color:var(--muted);letter-spacing:2px">ОСКОЛКОВ</span></div><div class="choice-list">`+upgrades.map(u=>{const lv=data[u.id],cost=25+lv*20;return `<button class="upgrade-card" data-buy="${u.id}" ${lv>=8||data.coins<cost?'disabled':''}><span class="upgrade-icon" style="color:var(--amber)">${u.symbol}</span><span class="upgrade-copy"><b>${u.name} <small style="display:inline;color:var(--amber)">${lv}/8</small></b><small>${u.desc}</small></span><span class="tag">${lv>=8?'МАКС':cost+' ✦'}</span></button>`;}).join('')+'</div><p style="font-size:11px">Осколки: за врагов, пройденные волны и боссов. Их нельзя купить за реальные деньги.</p>','workshop');bindClose();
    document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const id=b.dataset.buy,cost=25+data[id]*20;if(data[id]>=8||data.coins<cost)return;data.coins-=cost;data[id]++;save();updateMenu();sound('level');showWorkshop();toast('Улучшение сохранено');});
  }
  function showChoice(){
    if(choiceShown)return;choiceShown=true;
    open(header(run.nextWave?'СЕКТОР ОЧИЩЕН':'НОВЫЙ УРОВЕН','Прибавь света.',false)+`<p>${run.nextWave?'Следующий сектор '+(run.wave+1)+'. После выбора: +10 здоровья.':'Уровень '+run.level+'. Выбери усиление для этой попытки.'}<br>Усиления складываются друг с другом.</p><div class="choice-list">`+run.choice.map(u=>`<button class="upgrade-card" data-pick="${u.id}"><span class="upgrade-icon" style="color:${u.color}">${symbols[u.icon]}</span><span class="upgrade-copy"><b>${u.name}</b><small>${u.desc}</small></span><span class="chevron">›</span></button>`).join('')+'</div>','choice');
    document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{if(run.choose(b.dataset.pick)){choiceShown=false;close();accumulator=0;initAudio();sound('level');}});
  }
  function finish(){
    if(resultSaved)return;resultSaved=true;const won=run.mode==='won',reward=run.reward(),newBest=run.score>data.best;
    data.coins+=reward;data.runs++;if(won)data.wins++;data.best=Math.max(data.best,run.score);save();updateMenu();
    const mins=Math.floor(run.time/60),secs=Math.floor(run.time%60).toString().padStart(2,'0');
    open('<div class="result-emblem">'+(won?'✦':'◇')+'</div>'+header(won?'РАССВЕТ НАСТУПИЛ':newBest?'НОВЫЙ РЕКОРД':'ЕЩЁ ОДНА ИСКРА',run.endReason+'.',false)+`<p>${won?'Восемь секторов снова освещены. Попробуй Затмение — тьма станет сильнее.':'Каждая попытка делает тебя сильнее.<br>Собранные осколки остались с тобой.'}</p><div class="results-grid"><div><small>СЧЁТ</small><strong>${run.score.toLocaleString('ru-RU')}</strong></div><div><small>НАГРАДА</small><strong class="amber">+${reward} ✦</strong></div><div><small>УНИЧТОЖЕНО</small><strong>${run.kills}</strong></div><div><small>ВРЕМЯ / СЕКТОР</small><strong style="font-size:20px">${mins}:${secs} <span style="color:var(--muted)">/ ${run.wave}</span></strong></div></div><button class="primary" id="retry">ЕЩЁ ОДНА ИСКРА <span>↗</span></button><button class="quiet" id="to-menu">В мастерскую и меню</button>`,'result');
    $('retry').onclick=start;$('to-menu').onclick=menu;haptic(won?70:40);
  }
  window.nativePause=()=>{resetInput();pause();if(audio&&audio.state==='running')audio.suspend().catch(()=>{});};
  window.nativeBack=()=>{if(screen==='menu')return false;if(screen==='game')pause();else if(screen==='pause')resume();else if(screen==='settings'){if(run){paused=false;pause();}else close();}else if(screen==='help'){pendingPlay=false;close();}else if(screen==='workshop')close();else if(screen==='result')menu();return true;};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)window.nativePause();});
  window.addEventListener('blur',()=>{if(run&&run.mode==='playing')window.nativePause();else resetInput();});
  function updateHud(){
    if(!run)return;const h=run.hero;
    $('sector').textContent=String(run.wave).padStart(2,'0');$('wave-text').textContent=`ВОЛНА ${run.wave} / 8`;
    $('health-fill').style.width=(h.hp/h.maxHp*100)+'%';$('health-fill').style.background=h.hp/h.maxHp<.3?'#ff687e':'#61e4cf';$('health-value').textContent=Math.ceil(h.hp);
    $('score').textContent=run.score.toLocaleString('ru-RU');$('level').textContent='УР. '+run.level;
    const remain=Math.max(0,Math.ceil(28-run.waveTime));$('wave-timer').textContent=remain?'00:'+String(remain).padStart(2,'0'):run.wave%4===0?'БОСС':'00:00';
    $('xp-fill').style.width=Math.min(100,run.xp/run.nextXp*100)+'%';$('energy-fill').style.width=Math.min(100,run.energy)+'%';$('energy-label').textContent=Math.min(100,Math.floor(run.energy))+' / 100';
    const ready=1-h.dash/h.dashMax;$('dash').style.background=`conic-gradient(${h.dash>0?'#536774':'#61e4cf'} ${ready*360}deg,#24313c 0deg)`;$('dash-label').textContent=h.dash>0?h.dash.toFixed(1)+' С':'РЫВОК';
    $('control-hint').style.opacity=run.time>7?'0':'1';$('combo').hidden=run.combo<5;$('combo').textContent='СЕРИЯ × '+run.combo;
    const boss=run.enemies.find(e=>e.type==='boss'&&e.hp>0);$('boss-hud').hidden=!boss;if(boss){$('boss-fill').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';$('boss-name').textContent=run.wave===4?'СТРАЖ ПУСТОТЫ':'ПОЖИРАТЕЛЬ СВЕТА';}
  }
  function polygon(x,y,r,sides,angle=0){ctx.beginPath();for(let i=0;i<sides;i++){const a=angle+i*Math.PI*2/sides;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);}ctx.closePath();}
  function circle(x,y,r){ctx.beginPath();ctx.arc(x,y,Math.max(.01,r),0,Math.PI*2);}
  function line(x,y,x2,y2){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
  function drawBackground(){
    ctx.fillStyle='#080f17';ctx.fillRect(0,0,width,height);ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
    const g=ctx.createRadialGradient(210,390,0,210,390,400);g.addColorStop(0,run?'#11212a':'#13232b');g.addColorStop(1,'#080f17');ctx.fillStyle=g;ctx.fillRect(0,0,420,800);
    ctx.lineWidth=.7;ctx.strokeStyle='#1e3039';ctx.globalAlpha=.45;
    for(let x=-30;x<450;x+=48)for(let y=run?135:0;y<(run?700:800);y+=56){polygon(x+(Math.round(y/56)%2)*24,y,28,6,Math.PI/6);ctx.stroke();}
    ctx.globalAlpha=1;
    for(const s of stars){ctx.fillStyle=s.r>1?'#52616a':'#31414c';circle(s.x,(s.y+visualTime*(s.r>1?2:4))%800,s.r);ctx.fill();}
    if(run){
      ctx.strokeStyle='#37505b';ctx.lineWidth=1;ctx.strokeRect(13,Iskra.TOP,394,Iskra.BOTTOM-Iskra.TOP);
      ctx.strokeStyle='#ffb85c';ctx.globalAlpha=.5;
      for(const [x,y,sx,sy] of [[13,Iskra.TOP,1,1],[407,Iskra.TOP,-1,1],[13,Iskra.BOTTOM,1,-1],[407,Iskra.BOTTOM,-1,-1]]){line(x,y,x+sx*18,y);line(x,y,x,y+sy*18);}
      ctx.globalAlpha=.1;ctx.strokeStyle='#61e4cf';circle(210,410,88);ctx.stroke();circle(210,410,67);ctx.stroke();
      polygon(210,410,24,4,Math.PI/4);ctx.stroke();ctx.globalAlpha=1;
      ctx.fillStyle='#394953';ctx.font='8px sans-serif';ctx.textAlign='center';ctx.fillText('REACTOR / '+String(run.wave).padStart(2,'0'),210,Iskra.BOTTOM+19);
    }
    ctx.restore();
  }
  function drawGame(){
    if(!run)return;ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
    if(run.feedback>0&&!data.reduced)ctx.translate(Math.sin(visualTime*93)*run.feedback*9,Math.cos(visualTime*67)*run.feedback*7);
    for(const z of run.hazards){const firing=z.age>=1.2;ctx.globalAlpha=firing?.4:.18+.1*Math.sin(z.age*18);ctx.fillStyle='#ff687e';circle(z.x,z.y,z.r);ctx.fill();ctx.globalAlpha=.8;ctx.strokeStyle='#ff687e';ctx.lineWidth=1;circle(z.x,z.y,z.r*(firing?1:Math.min(1,z.age/1.2)));ctx.stroke();line(z.x-8,z.y,z.x+8,z.y);line(z.x,z.y-8,z.x,z.y+8);ctx.globalAlpha=1;}
    for(const p of run.drops){ctx.fillStyle='#ffb85c';if(!data.reduced){ctx.shadowBlur=8;ctx.shadowColor='#ffb85c';}polygon(p.x,p.y,p.value>1?5:3,4,visualTime*1.2);ctx.fill();ctx.shadowBlur=0;}
    for(const fx of run.effects){const t=fx.age/fx.life;ctx.globalAlpha=1-t;ctx.strokeStyle=fx.color;ctx.fillStyle=fx.color;
      if(fx.type==='ring'){ctx.lineWidth=2*(1-t)+.5;circle(fx.x,fx.y,(10+t*65)*fx.size);ctx.stroke();}
      else if(fx.type==='trail'){polygon(fx.x,fx.y,10*(1-t),4,Math.PI/4);ctx.fill();}
      else if(!data.reduced){ctx.lineWidth=1.5;for(let i=0;i<9;i++){const a=i*.698+fx.x;line(fx.x+Math.cos(a)*t*18*fx.size,fx.y+Math.sin(a)*t*18*fx.size,fx.x+Math.cos(a)*(t*28+5)*fx.size,fx.y+Math.sin(a)*(t*28+5)*fx.size);}}
    }ctx.globalAlpha=1;
    for(const b of run.bullets){ctx.strokeStyle=b.enemy?'#ff687e':'#ffe0a9';ctx.fillStyle=b.enemy?'#ff687e':'#fff1cb';ctx.lineWidth=b.enemy?1.5:2;
      if(!b.enemy){ctx.globalAlpha=.45;line(b.x,b.y,b.x-b.vx*.025,b.y-b.vy*.025);ctx.globalAlpha=1;}
      circle(b.x,b.y,b.r);if(b.enemy)ctx.stroke();else ctx.fill();
    }
    for(const e of run.enemies){
      if(e.warning>0){ctx.strokeStyle=e.type==='boss'?'#ffb85c':'#ff687e';ctx.globalAlpha=.5;ctx.lineWidth=1;circle(e.x,e.y,e.r+12+Math.sin(e.warning*14)*4);ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText('!',e.x,e.y+5);ctx.globalAlpha=1;continue;}
      ctx.save();ctx.translate(e.x,e.y);const angle=Math.atan2(run.hero.y-e.y,run.hero.x-e.x);
      if(e.type==='boss'){
        ctx.strokeStyle='#ff687e';ctx.fillStyle=e.flash>0?'#ffd9de':'#382132';ctx.lineWidth=2;polygon(0,0,e.r+9,8,visualTime*.3);ctx.stroke();polygon(0,0,e.r,6,-visualTime*.25);ctx.fill();ctx.stroke();
        ctx.fillStyle='#ff687e';polygon(0,0,11,4,Math.PI/4+visualTime);ctx.fill();ctx.fillStyle='#fff0dd';circle(0,0,4);ctx.fill();
      } else if(e.type==='tank'){
        ctx.rotate(angle);ctx.fillStyle=e.flash>0?'#ffe4e8':'#402434';ctx.strokeStyle='#ff687e';ctx.lineWidth=2;polygon(0,0,e.r,6,Math.PI/6);ctx.fill();ctx.stroke();ctx.fillStyle='#ff687e';ctx.fillRect(-3,-7,6,14);
      } else if(e.type==='shooter'){
        ctx.rotate(visualTime*.6);ctx.fillStyle=e.flash>0?'#eef0ff':'#282c47';ctx.strokeStyle='#a7b4ff';ctx.lineWidth=1.5;polygon(0,0,e.r,4);ctx.fill();ctx.stroke();ctx.fillStyle='#a7b4ff';circle(0,0,4);ctx.fill();
      } else {
        ctx.rotate(angle);ctx.fillStyle=e.flash>0?'#ffe6e9':'#362230';ctx.strokeStyle='#ff687e';ctx.lineWidth=1.5;polygon(0,0,e.r,3);ctx.fill();ctx.stroke();ctx.fillStyle='#ff687e';circle(1,0,2.5);ctx.fill();
      }
      ctx.restore();if(e.hp<e.maxHp&&e.type!=='boss'){ctx.fillStyle='#27313b';ctx.fillRect(e.x-12,e.y-e.r-8,24,2);ctx.fillStyle=e.type==='shooter'?'#a7b4ff':'#ff687e';ctx.fillRect(e.x-12,e.y-e.r-8,24*Math.max(0,e.hp/e.maxHp),2);}
    }
    const h=run.hero;
    for(let i=0;i<(run.picks.orbit||0);i++){const a=run.time*2.8+i*Math.PI*2/run.picks.orbit,x=h.x+Math.cos(a)*44,y=h.y+Math.sin(a)*44;ctx.strokeStyle='#61e4cf';ctx.globalAlpha=.2;circle(h.x,h.y,44);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle='#61e4cf';polygon(x,y,6,4,Math.PI/4);ctx.fill();}
    ctx.save();ctx.translate(h.x,h.y);const shine=1+Math.sin(visualTime*6)*.1;
    if(!data.reduced){ctx.shadowColor='#ffb85c';ctx.shadowBlur=18;}ctx.fillStyle=h.invuln>0?'#fff5d6':'#ffc674';polygon(0,0,12*shine,4);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#fff8dd';polygon(0,0,5,4);ctx.fill();
    if(h.invuln>0){ctx.strokeStyle=h.dashTime>0?'#61e4cf':'#ffdfab';ctx.lineWidth=1.5;ctx.globalAlpha=.4+Math.sin(visualTime*30)*.2;circle(0,0,20);ctx.stroke();ctx.globalAlpha=1;}
    ctx.strokeStyle='#ffb85c';ctx.globalAlpha=.5;line(-17,0,-22,0);line(17,0,22,0);ctx.globalAlpha=1;ctx.restore();
    if(joystick){ctx.globalAlpha=.2;ctx.fillStyle='#61e4cf';circle(joystick.x,joystick.y,44);ctx.fill();ctx.strokeStyle='#61e4cf';ctx.globalAlpha=.45;ctx.lineWidth=1;ctx.stroke();ctx.globalAlpha=.55;circle(joystick.x+joystick.dx,joystick.y+joystick.dy,17);ctx.fill();ctx.globalAlpha=1;}
    if(run.waveTime<2.8&&run.mode==='playing'){ctx.textAlign='center';ctx.globalAlpha=Math.min(1,(2.8-run.waveTime));ctx.fillStyle=run.wave%4===0?'#ff687e':'#ffb85c';ctx.font='bold 20px sans-serif';ctx.fillText(run.wave%4===0?'СТРАЖ ПРОБУДИЛСЯ':'СЕКТОР '+String(run.wave).padStart(2,'0'),210,290);ctx.fillStyle='#81909c';ctx.font='10px sans-serif';ctx.fillText(run.wave%4===0?'Уничтожь босса, чтобы пройти дальше':'НЕ ДАЙ ИСКРЕ ПОГАСНУТЬ',210,312);ctx.globalAlpha=1;}
    ctx.restore();
  }
  function frame(t){
    if(!last)last=t;const dt=Math.min(.05,(t-last)/1000);last=t;visualTime+=dt;
    if(run&&!paused&&run.mode==='playing'){
      accumulator+=dt;let steps=0;while(accumulator>=1/60&&steps++<4){const keyboard={x:(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),y:(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)};run.step(1/60,joystick?input:keyboard);accumulator-=1/60;}
      const sounds=new Set(run.events.splice(0));for(const e of sounds)sound(e);if(sounds.has('hurt'))haptic(30);if(sounds.has('nova'))haptic(45);
    }
    if(run){if(run.mode==='choice')showChoice();if(run.mode==='dead'||run.mode==='won')finish();hudTime+=dt;if(hudTime>.05){updateHud();hudTime=0;}}
    drawBackground();drawGame();requestAnimationFrame(frame);
  }
  // A read-only snapshot helps automated smoke tests and troubleshooting.
  window.iskraSnapshot=()=>({screen,paused,mode:run?run.mode:'menu',wave:run?run.wave:0,hero:run?{x:run.hero.x,y:run.hero.y,hp:run.hero.hp,dash:run.hero.dash}:null,save:Object.assign({},data)});
  window.addEventListener('resize',resize);resize();updateMenu();requestAnimationFrame(frame);
})();
