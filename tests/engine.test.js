const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Run,UPGRADES,TOP,BOTTOM}=require('../app/src/main/assets/game/engine.js');
const steps=(run,n,input={x:0,y:0})=>{for(let i=0;i<n;i++)run.step(1/60,input);};

test('seeded runs produce identical combat and drops',()=>{
  const a=new Run(42),b=new Run(42);
  for(let i=0;i<1200;i++){const input={x:Math.sin(i/100),y:Math.cos(i/100)};a.step(1/60,input);b.step(1/60,input);}
  assert.deepEqual(a,b);assert.ok(a.kills>0);assert.ok(a.time>10);
});
test('movement normalizes diagonal input and clamps arena boundaries',()=>{
  const run=new Run(1),before={...run.hero};run.step(1/60,{x:1,y:1});
  assert.ok(Math.abs(Math.hypot(run.hero.x-before.x,run.hero.y-before.y)-3)<.0001);
  steps(run,3000,{x:100,y:-100});
  assert.ok(run.hero.x<=402&&run.hero.y>=TOP+18);
});
test('dash is invulnerable, has a cooldown and cannot trigger on a paused upgrade screen',()=>{
  const r=new Run(1);r.hero.invuln=0;assert.equal(r.dash(),true);r.hurt(50);assert.equal(r.hero.hp,100);
  assert.equal(r.dash(),false);r.mode='choice';const time=r.time;steps(r,100);assert.equal(r.time,time);
  r.hero.dash=0;assert.equal(r.dash(),false);
});
test('spawn warnings prevent immediate damage; kills award drops once',()=>{
  const r=new Run(2),e=r.spawn('tank',210,200);r.hit(e,999);assert.equal(r.kills,0);
  e.warning=0;r.hit(e,999);r.hit(e,999);assert.equal(r.kills,1);assert.equal(r.drops.length,1);assert.equal(r.drops[0].value,3);
});
test('damage, split shot, piercing and health upgrades change actual combat',()=>{
  const r=new Run(2);
  for(const id of ['damage','split','pierce','health']){r.mode='choice';r.choice=[UPGRADES.find(u=>u.id===id)];assert.equal(r.choose(id),true);}
  assert.equal(r.hero.maxHp,125);assert.ok(Math.abs(r.hero.damage-15.6)<1e-9);r.shoot({x:210,y:100});
  assert.equal(r.bullets.length,2);assert.ok(r.bullets.every(b=>b.pierce===1&&Math.abs(b.damage-15.6)<1e-9));
  assert.equal(r.choose('damage'),false);
});
test('boss waves cannot advance while their boss is alive',()=>{
  const r=new Run(3);r.wave=4;r.waveTime=28;r.hero.hp=100000;steps(r,5);
  assert.equal(r.mode,'playing');const boss=r.enemies.find(e=>e.type==='boss');assert.ok(boss);
  boss.warning=0;r.hit(boss,100000);r.step(1/60);assert.equal(r.mode,'choice');assert.equal(r.nextWave,true);
  const pick=r.choice[0];r.choose(pick.id);assert.equal(r.wave,5);assert.equal(r.waveTime,0);assert.equal(r.bossKills,1);
});
test('full eight-wave combat completes, including both bosses, with finite bounded entities',()=>{
  const r=new Run(17);r.hero.hp=r.hero.maxHp=100000;r.hero.damage=500;
  for(let i=0;i<30000&&r.mode!=='won'&&r.mode!=='dead';i++){
    if(r.mode==='choice')r.choose(r.choice.find(u=>u.id==='split'||u.id==='rate')?.id||r.choice[0].id);
    r.step(1/60,{x:Math.sin(i/140),y:Math.cos(i/140)});
    if(i%200===0)r.dash();
    assert.ok(r.enemies.length<=70&&r.bullets.length<=220&&r.drops.length<=120);
    for(const e of [r.hero,...r.enemies,...r.bullets])assert.ok(Number.isFinite(e.x)&&Number.isFinite(e.y));
  }
  assert.equal(r.mode,'won');assert.equal(r.wave,8);assert.equal(r.bossKills,2);assert.ok(r.kills>100);assert.ok(r.reward()>=156);
});
test('death stops the simulation and awards no unearned waves',()=>{
  const r=new Run(4);r.hero.invuln=0;r.hurt(200);assert.equal(r.mode,'dead');const time=r.time;steps(r,50);
  assert.equal(r.time,time);assert.equal(r.reward(),0);
});
test('energy pickups trigger an impulse and harm nearby enemies',()=>{
  const r=new Run(4);r.energy=99;r.drops.push({x:r.hero.x,y:r.hero.y,value:1,age:0});
  const e=r.spawn('tank',r.hero.x+50,r.hero.y);e.warning=0;r.step(1/60);
  assert.ok(r.events.includes('nova'));assert.equal(r.energy,4);assert.equal(r.kills,0);assert.ok(e.hp<10);
});
test('difficulty and persistent progression affect a fresh attempt',()=>{
  const easy=new Run(1,{hull:2,power:3,drive:4},'easy'),hard=new Run(1,{},'hard');
  assert.equal(easy.hero.maxHp,124);assert.equal(easy.hero.damage,16.5);assert.ok(easy.hero.dashMax<3.2);
  easy.hero.invuln=hard.hero.invuln=0;easy.hurt(20);hard.hurt(20);
  assert.equal(easy.hero.hp,109);assert.equal(hard.hero.hp,73);
});
