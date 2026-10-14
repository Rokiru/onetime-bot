const assert=require('node:assert/strict'),{chromium,executablePath,serveGame,readyGame}=require('./browser-tools.cjs');
const fs=require('node:fs');
(async()=>{
 const server=await serveGame('game/assets'),browser=await chromium.launch({executablePath,args:['--no-sandbox']});
 try{for(const size of [{width:640,height:320},{width:873,height:393},{width:1000,height:500}]){
  const context=await browser.newContext({viewport:size,hasTouch:true,deviceScaleFactor:2.75}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(server.url);await readyGame(page);await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{save.sound=false;save.music=false;save.motion=false;save.tutorialDone=true;save.radio=false;applySettings();});
  await page.click('#routes-open');assert.ok(await page.locator('[data-map-pin="50"]').count()>=1,'first contract map shows the actual new stop');await page.click('.open-mission-plan');assert.ok(await page.locator('#mission-plan').isVisible());assert.ok((await page.locator('#mission-plan-stops').textContent()).includes('ЛЕСНИЧЕСТВО'));
  const map=await page.locator('#mission-plan-art>svg').boundingBox();assert.ok(map.width>size.width*.7&&map.height>90,'expanded map fills the dialog');const close=await page.locator('#mission-plan-close').boundingBox();assert.ok(close.x>=0&&close.y>=0&&close.x+close.width<=size.width+1&&close.y+close.height<=size.height+1);
  if(size.width===873)await page.screenshot({path:'artifacts/mission-plan20.png'});
  await page.evaluate(()=>androidBack());assert.ok(await page.locator('#mission-plan').isHidden());
  if(size.width===873)await page.screenshot({path:'artifacts/missions20.png'});
  await page.evaluate(()=>{beginDrive();completeDispatch();requestAnimationFrame=()=>0;});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>sim.edition),20);
  assert.equal(await page.evaluate(()=>getComputedStyle($('hud'),'::before').content),'none','no full-screen top vignette');
  if(size.width===873)await page.screenshot({path:'artifacts/warehouse20.png'});
  // Instrument the actual frame path, rather than calling the map renderer itself.
  const rendered=await page.evaluate(()=>{const original=drawRoadProfile;let maps=0;drawRoadProfile=()=>{maps++;original();};last=0;nextFrame=0;acc=0;checkpointAt=1e9;mode='drive';for(let n=0;n<=60;n++)frame(n===60?1000:n*1000/60+Math.sin(n*1.7)*1.2);drawRoadProfile=original;return maps;});assert.ok(rendered>=59&&rendered<=61,'mini-map paints at paced driving frequency despite RAF jitter');
  await page.evaluate(()=>{sim.car.setPosition({x:65,y:CP.height(65,sim.id)+2});hud();cam={x:60,y:3};draw(0);drawRoadProfile();});assert.ok(await page.locator('#missed-stop').isVisible());assert.ok((await page.locator('#missed-stop').textContent()).includes('ЛЕСНИЧЕСТВО'));assert.ok((await page.locator('.return-arrow').textContent()).includes('←'));
  const alert=await page.locator('#missed-stop').boundingBox();assert.ok(alert.x>=0&&alert.y>=0&&alert.x+alert.width<=size.width+1&&alert.y+alert.height<=size.height+1);
  if(size.width===873)await page.screenshot({path:'artifacts/missed-stop20.png'});
  await page.evaluate(()=>{sim.stops[0].done=true;hud();});assert.ok(await page.locator('#missed-stop').isHidden(),'served stop stops asking to return');
  if(size.width===873){
   for(const [name,id,x] of [['clinic',7,150],['service',47,145],['arrival',0,218]]){
    await page.evaluate(({id,x,driver})=>{const input=(0,eval)(driver);sim=new CP.Drive(id,[0,0,0],CP.routes[id].requires||'rover','standard',20);for(let n=0;n<35000&&sim.state==='drive'&&sim.car.getPosition().x<x;n++)sim.step(...input(sim,CP));if(sim.car.getPosition().x<x)throw Error('Screenshot journey did not reach '+x);mode='pause';configureRunHud();hud();toastTime=0;$('toast').style.opacity=0;cam={x:sim.car.getPosition().x+3,y:sim.car.getPosition().y+1};clock=sim.time;scale=Math.min(H/8.8,W/23);sim.previous=null;draw(0);}, {id,x,driver:require('./driving-input20.cjs').browserSource});
    await page.screenshot({path:'artifacts/'+name+'20.png'});
   }
   await page.evaluate(driver=>{const input=(0,eval)(driver);for(let n=0;n<10000&&sim.state==='drive';n++)sim.step(...input(sim,CP));if(sim.state!=='win')throw Error('Result fixture delivery failed');finish();},require('./driving-input20.cjs').browserSource);
   assert.ok((await page.locator('#result-breakdown').textContent()).includes('СПУСКИ 2/2 +70'),'real completed delivery reports sector bonus separately');
  }
  assert.ok(await page.evaluate(()=>DepotArt20.stats().sprites)<=8,'bounded architecture cache');assert.deepEqual(errors,[]);console.log('PASS journey UI20 '+size.width+'×'+size.height+': real route plan/back, edition20, clear sky, smooth mini-map, missed/served stop arrow, architecture cache.');await context.close();
 }}finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
