const assert=require('node:assert/strict');
const {chromium,executablePath,serveGame,readyGame}=require('./browser-tools.cjs');
(async()=>{
 const server=await serveGame('game/assets'),browser=await chromium.launch({executablePath,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();await page.goto(server.url);await readyGame(page);
  await page.evaluate(()=>{requestAnimationFrame=()=>0;save.sound=false;save.music=false;save.tutorialDone=true;});await page.waitForTimeout(100);
  const results=await page.evaluate(()=>{
   const rows=[],originalDraw=draw;let draws=0;draw=dt=>{draws++;originalDraw(dt);};
   for(const hz of [60,90,120]){
    sim=new CP.Drive(0,[0,0,0,0],'rover');mode='drive';gas=false;brake=true;acc=0;last=0;nextFrame=0;checkpointAt=1e9;clock=0;draws=0;cam={x:6,y:2};frame(0);
    for(let i=1;i<=hz;i++)frame(i*1000/hz);
    const p=sim.car.getPosition();rows.push({hz,time:sim.time,draws,x:p.x,y:p.y,fuel:sim.fuel});
    const before={time:sim.time,x:cam.x,y:cam.y,clock};frame(last-1000);if(sim.time!==before.time||cam.x!==before.x||cam.y!==before.y||clock!==before.clock)throw Error('Stale callback changed time/camera');
   }
   // A delayed callback advances only the original 50 ms safety limit.
   const before=sim.time;frame(last+1000);const hitchAdvance=sim.time-before;
   mode='pause';last=0;nextFrame=0;draws=0;const paused=sim.time;for(let i=0;i<=120;i++)frame(i*1000/120);const pausedResult={draws,time:sim.time,paused};
   draw=originalDraw;return {rows,hitchAdvance,pausedResult};
  });
  for(const row of results.rows){assert.ok(row.draws>=59&&row.draws<=61,'render cap at '+row.hz);assert.ok(Math.abs(row.time-1)<=1/60+.00001,'real time preserved at '+row.hz);}
  for(const row of results.rows.slice(1)){const base=results.rows[0];assert.ok(Math.abs(row.x-base.x)<.005&&Math.abs(row.y-base.y)<.005,'same physical braking outcome across display rates');}
  assert.ok(results.hitchAdvance<=.051);assert.equal(results.pausedResult.time,results.pausedResult.paused);assert.ok(results.pausedResult.draws<=31);
  console.log('PASS pacing19: 60/90/120 Hz callbacks preserve one second of physics and braking, ≤61 renders, stale/hitch safety, pause frozen at ≤31 renders.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
