/* Deterministic simulation. No DOM, network, timers or platform dependencies. */
(function(root) {
  'use strict';
  const W = 420, H = 800, TOP = 105, BOTTOM = 690;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const UPGRADES = [
    {id:'damage', name:'Раскалённое ядро', desc:'+30% к урону каждого выстрела', icon:'fire', color:'#ffb85c'},
    {id:'rate', name:'Перегрузка', desc:'Выстрелы на 20% чаще', icon:'bolt', color:'#ffb85c'},
    {id:'split', name:'Расщепление', desc:'Ещё один снаряд в залпе', icon:'split', color:'#a7b4ff', max:3},
    {id:'pierce', name:'Сквозной свет', desc:'Снаряды пробивают ещё одного врага', icon:'arrow', color:'#a7b4ff', max:3},
    {id:'orbit', name:'Спутник', desc:'Вращающийся щит наносит урон врагам', icon:'orbit', color:'#61e4cf', max:3},
    {id:'leech', name:'Живая искра', desc:'Каждые 5 уничтоженных врагов: +6 здоровья', icon:'heart', color:'#61e4cf', max:3},
    {id:'speed', name:'Невесомость', desc:'+15% к скорости, рывок восстанавливается быстрее', icon:'wind', color:'#61e4cf', max:4},
    {id:'health', name:'Титановая оболочка', desc:'+25 к максимуму здоровья и лечение на 35', icon:'shield', color:'#ffb85c'},
    {id:'magnet', name:'Притяжение', desc:'Собирать энергию с большего расстояния', icon:'magnet', color:'#a7b4ff', max:3},
    {id:'nova', name:'Сверхновая', desc:'Энергетический импульс сильнее на 50%', icon:'star', color:'#ffb85c', max:3}
  ];
  class Run {
    constructor(seed = Date.now(), meta = {}, difficulty = 'normal') {
      this.seed = seed >>> 0 || 1; this.mode = 'playing'; this.difficulty = difficulty;
      this.factor = difficulty === 'hard' ? 1.35 : difficulty === 'easy' ? .75 : 1;
      this.hero = {x:210,y:430,r:10,hp:100+(meta.hull||0)*12,maxHp:100+(meta.hull||0)*12,
        speed:180,damage:12+(meta.power||0)*1.5,fireEvery:.32,fire:0,invuln:1.2,
        dash:0,dashTime:0,dashX:0,dashY:-1,dashMax:3.2-(meta.drive||0)*.12};
      this.enemies=[]; this.bullets=[]; this.drops=[]; this.hazards=[]; this.effects=[]; this.events=[];
      this.wave=1; this.waveTime=0; this.time=0; this.spawnTimer=1.5; this.hazardTimer=10;
      this.kills=0; this.combo=0; this.comboTime=0; this.bestCombo=0; this.score=0;
      this.energy=0; this.xp=0; this.level=1; this.nextXp=16; this.picks={}; this.choice=[];
      this.nextWave=false; this.bossSpawned=false; this.bossKilled=false; this.bossKills=0;
      this.lastX=0; this.lastY=-1; this.nextId=1; this.feedback=0; this.endReason='';
    }
    random() { let x=this.seed; x^=x<<13; x^=x>>>17; x^=x<<5; this.seed=x>>>0; return this.seed/4294967296; }
    effect(type,x,y,color='#ffb85c',size=1) {
      if(this.effects.length<140) this.effects.push({type,x,y,color,size,age:0,life:type==='ring'?.65:.45});
    }
    event(type) { if(this.events.length<30) this.events.push(type); }
    spawn(type, x, y) {
      if(this.enemies.length>=70) return null;
      if(x===undefined) {
        const side=Math.floor(this.random()*4);
        x=side===0?22:side===1?398:25+this.random()*370;
        y=side===2?TOP+25:side===3?BOTTOM-25:TOP+30+this.random()*(BOTTOM-TOP-60);
        if(Math.hypot(x-this.hero.x,y-this.hero.y)<130) y=this.hero.y>395?135:650;
      }
      const stats=type==='boss'?{hp:(this.wave===4?620:1100)*this.factor,r:29,speed:38,dmg:22}:
        type==='tank'?{hp:60+this.wave*7,r:17,speed:43,dmg:20}:
        type==='shooter'?{hp:27+this.wave*3,r:12,speed:65,dmg:12}:
        {hp:18+this.wave*2,r:10,speed:76+this.wave*4,dmg:11};
      const e=Object.assign({id:this.nextId++,type,x,y},stats,{maxHp:stats.hp,warning:.9,flash:0,attack:1.8,hit:0,
        orbitHit:0,dashHit:0,angle:this.random()*6.28});
      this.enemies.push(e); return e;
    }
    dash() {
      const h=this.hero;
      if(this.mode!=='playing'||h.dash>0) return false;
      h.dash=h.dashMax; h.dashTime=.18; h.invuln=Math.max(h.invuln,.38);
      h.dashX=this.lastX; h.dashY=this.lastY;
      this.effect('ring',h.x,h.y,'#61e4cf',.6); this.event('dash'); return true;
    }
    hurt(amount) {
      const h=this.hero;
      if(h.invuln>0||this.mode!=='playing') return;
      h.hp=Math.max(0,h.hp-amount*this.factor); h.invuln=.75; this.combo=0;
      this.feedback=.3; this.event('hurt'); this.effect('ring',h.x,h.y,'#ff687e',.7);
      if(h.hp<=0) { this.mode='dead'; this.endReason='Искра погасла'; this.event('end'); }
    }
    hit(e, damage) {
      if(e.hp<=0||e.warning>0) return;
      e.hp-=damage; e.flash=.09;
      if(e.hp<=0) {
        this.kills++; this.combo++; this.comboTime=3.5; this.bestCombo=Math.max(this.bestCombo,this.combo);
        this.score+=Math.round((e.type==='boss'?1000:e.type==='tank'?40:20)*(1+Math.min(this.combo,40)*.025));
        this.effect('burst',e.x,e.y,e.type==='boss'?'#ffb85c':e.type==='shooter'?'#a7b4ff':'#ff687e',e.r/10);
        this.event('kill');
        if(e.type==='boss'){this.bossKilled=true;this.bossKills++;this.event('boss');}
        this.drops.push({x:e.x,y:e.y,value:e.type==='boss'?15:e.type==='tank'?3:1,age:0});
        if(this.kills%5===0&&this.picks.leech) this.hero.hp=Math.min(this.hero.maxHp,this.hero.hp+6*this.picks.leech);
      }
    }
    nova() {
      const damage=65*(1+(this.picks.nova||0)*.5);
      for(const e of this.enemies) if(distance(e,this.hero)<215) this.hit(e,damage);
      this.bullets=this.bullets.filter(b=>!b.enemy||distance(b,this.hero)>215);
      this.effect('ring',this.hero.x,this.hero.y,'#ffb85c',3.1); this.event('nova');
    }
    offer(advance=false) {
      this.mode='choice'; this.nextWave=advance;
      const pool=UPGRADES.filter(u=>(this.picks[u.id]||0)<(u.max||8));
      this.choice=[];
      while(this.choice.length<3&&pool.length) this.choice.push(pool.splice(Math.floor(this.random()*pool.length),1)[0]);
      this.event('level');
    }
    choose(id) {
      if(this.mode!=='choice'||!this.choice.some(u=>u.id===id)) return false;
      this.picks[id]=(this.picks[id]||0)+1;
      const h=this.hero;
      if(id==='damage')h.damage*=1.3;
      if(id==='rate')h.fireEvery=Math.max(.08,h.fireEvery*.8);
      if(id==='speed'){h.speed*=1.15;h.dashMax=Math.max(1,h.dashMax*.9);}
      if(id==='health'){h.maxHp+=25;h.hp=Math.min(h.maxHp,h.hp+35);}
      if(this.nextWave) {
        this.wave++;this.waveTime=0;this.spawnTimer=1;this.bossSpawned=false;this.bossKilled=false;
        h.hp=Math.min(h.maxHp,h.hp+10);this.nextWave=false;
      }
      h.invuln=Math.max(h.invuln,1);this.mode='playing';this.choice=[];return true;
    }
    shoot(target) {
      const h=this.hero,angle=Math.atan2(target.y-h.y,target.x-h.x),count=1+(this.picks.split||0);
      for(let i=0;i<count;i++) {
        const a=angle+(i-(count-1)/2)*.14;
        this.bullets.push({x:h.x+Math.cos(a)*14,y:h.y+Math.sin(a)*14,vx:Math.cos(a)*470,vy:Math.sin(a)*470,
          r:3,life:1.5,enemy:false,damage:h.damage,pierce:this.picks.pierce||0,hits:[]});
      }
      this.event('shoot');
    }
    step(dt,input={x:0,y:0}) {
      if(this.mode!=='playing')return;
      dt=clamp(dt,0,.05);const h=this.hero;
      this.time+=dt;this.waveTime+=dt;this.spawnTimer-=dt;this.hazardTimer-=dt;
      h.invuln=Math.max(0,h.invuln-dt);h.dash=Math.max(0,h.dash-dt);h.fire-=dt;
      this.feedback=Math.max(0,this.feedback-dt);this.comboTime-=dt;if(this.comboTime<=0)this.combo=0;
      let ix=Number.isFinite(input.x)?input.x:0,iy=Number.isFinite(input.y)?input.y:0;
      const len=Math.hypot(ix,iy);if(len>1){ix/=len;iy/=len;}
      if(len>.1){const angle=Math.atan2(iy,ix);this.lastX=Math.cos(angle);this.lastY=Math.sin(angle);}
      if(h.dashTime>0){h.dashTime-=dt;h.x+=h.dashX*780*dt;h.y+=h.dashY*780*dt;
        this.effect('trail',h.x,h.y,'#61e4cf',1);
      } else {h.x+=ix*h.speed*dt;h.y+=iy*h.speed*dt;}
      h.x=clamp(h.x,18,W-18);h.y=clamp(h.y,TOP+18,BOTTOM-18);
      if(this.wave%4===0&&!this.bossSpawned){this.spawn('boss',210,145);this.bossSpawned=true;this.event('warning');}
      if(this.spawnTimer<=0&&this.waveTime<28) {
        this.spawnTimer=Math.max(.28,1.05-this.wave*.08)/this.factor;
        const r=this.random();this.spawn(this.wave>=2&&r<.2?'tank':this.wave>=3&&r<.4?'shooter':'runner');
      }
      if(this.hazardTimer<=0&&this.wave>=2) {
        this.hazardTimer=8;this.hazards.push({x:clamp(h.x+(this.random()-.5)*100,45,375),y:clamp(h.y+(this.random()-.5)*100,TOP+50,BOTTOM-50),r:42,age:0});
      }
      let closest=null,nearest=Infinity;
      for(const e of this.enemies) {
        if(e.hp<=0)continue;e.flash=Math.max(0,e.flash-dt);e.hit-=dt;e.orbitHit-=dt;
        if(e.warning>0){e.warning-=dt;continue;}
        const dx=h.x-e.x,dy=h.y-e.y,d=Math.hypot(dx,dy)||1;
        if(d<nearest){nearest=d;closest=e;}
        let movement=e.type==='shooter'&&d<190?(d<135?-1:0):1;
        e.x+=dx/d*e.speed*dt*movement;e.y+=dy/d*e.speed*dt*movement;
        e.x=clamp(e.x,14,406);e.y=clamp(e.y,TOP+14,BOTTOM-14);
        if(d<h.r+e.r){this.hurt(e.dmg);if(h.dashTime>0&&e.dashHit<this.time-.5){this.hit(e,h.damage*3);e.dashHit=this.time;}}
        e.attack-=dt;
        if((e.type==='shooter'||e.type==='boss')&&e.attack<=0) {
          e.attack=e.type==='boss'?1.5:2.4;
          const angle=Math.atan2(dy,dx),count=e.type==='boss'?12:1;
          for(let i=0;i<count;i++) {
            const a=e.type==='boss'?angle+i*Math.PI*2/count:angle;
            this.bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*(e.type==='boss'?120:170),vy:Math.sin(a)*(e.type==='boss'?120:170),r:5,life:5,enemy:true});
          }
        }
        if(this.picks.orbit&&e.orbitHit<=0) {
          for(let i=0;i<this.picks.orbit;i++){
            const a=this.time*2.8+i*Math.PI*2/this.picks.orbit;
            if(Math.hypot(e.x-h.x-Math.cos(a)*44,e.y-h.y-Math.sin(a)*44)<e.r+9){this.hit(e,20);e.orbitHit=.25;break;}
          }
        }
      }
      if(closest&&h.fire<=0&&this.bullets.length<220){this.shoot(closest);h.fire=h.fireEvery;}
      for(const b of this.bullets) {
        b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
        if(b.enemy){if(distance(b,h)<h.r+b.r){this.hurt(10);b.life=0;}}
        else for(const e of this.enemies) {
          if(e.hp<=0||e.warning>0||b.life<=0||b.hits.includes(e.id))continue;
          if(distance(b,e)<e.r+b.r){this.hit(e,b.damage);b.hits.push(e.id);if(b.pierce--<=0)b.life=0;}
        }
      }
      for(const p of this.drops){
        p.age+=dt;const d=distance(p,h),range=65+(this.picks.magnet||0)*45;
        if(d<range){p.x+=(h.x-p.x)*dt*9;p.y+=(h.y-p.y)*dt*9;}
        if(d<18){this.xp+=p.value;this.energy+=p.value*5;p.age=100;this.event('pickup');}
      }
      if(this.energy>=100){this.energy-=100;this.nova();}
      for(const z of this.hazards){z.age+=dt;if(z.age>=1.2&&z.age<1.6&&distance(z,h)<z.r+h.r)this.hurt(17);}
      for(const fx of this.effects)fx.age+=dt;
      this.effects=this.effects.filter(f=>f.age<f.life);
      this.enemies=this.enemies.filter(e=>e.hp>0);
      this.bullets=this.bullets.filter(b=>b.life>0&&b.x>-20&&b.x<W+20&&b.y>TOP-30&&b.y<BOTTOM+30).slice(-220);
      this.drops=this.drops.filter(p=>p.age<25).slice(-120);this.hazards=this.hazards.filter(z=>z.age<1.8);
      if(this.mode!=='playing')return;
      if(this.waveTime>=28&&(this.wave%4!==0||this.bossKilled)){
        this.enemies=[];this.bullets=[];this.hazards=[];
        // Collect the remaining rewards before a wave transition.
        for(const p of this.drops){this.xp+=p.value;this.energy+=p.value*5;}this.drops=[];
        if(this.wave===8){this.mode='won';this.endReason='Свет возвращён';this.score+=2500;this.event('end');}
        else this.offer(true);
      } else if(this.xp>=this.nextXp){this.xp-=this.nextXp;this.level++;this.nextXp=Math.round(this.nextXp*1.32);this.offer();}
    }
    reward() {return Math.floor(this.kills/4)+(this.wave-1)*8+this.bossKills*20+(this.mode==='won'?60:0);}
  }
  const api={Run,UPGRADES,W,H,TOP,BOTTOM,clamp};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Iskra=api;
})(typeof globalThis!=='undefined'?globalThis:this);
