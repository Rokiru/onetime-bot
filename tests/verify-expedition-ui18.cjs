const assert=require('node:assert/strict'),{chromium,serveGame,readyGame}=require('./browser-tools.cjs');
(async()=>{
 const server=await serveGame('game/assets');const browser=await chromium.launch({executablePath:process.env.CARGO_CHROME||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const size of [{width:640,height:320},{width:850,height:393},{width:1000,height:500}]){
   const context=await browser.newContext({viewport:size,hasTouch:true});const page=await context.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(e.message));await page.goto(server.url);await readyGame(page);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400);
   assert.equal(await page.evaluate(()=>profile),'career');assert.equal(await page.evaluate(()=>save.wallet),0);
   assert.equal(await page.evaluate(()=>CP.routes.length),48);
   for(const id of ['play','routes-open','garage-open','more-open']){const r=await page.locator('#'+id).boundingBox();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=size.width+1&&r.y+r.height<=size.height+1,'home control fits '+id);}
   if(size.width===1000)await page.screenshot({path:'artifacts/dustrivo-menu.png'});
   await page.click('#garage-open');await page.waitForTimeout(400);assert.equal(await page.locator('[data-vehicle]').count(),5);
   if(size.width===1000)await page.screenshot({path:'artifacts/dustrivo-garage.png'});
   await page.click('#garage-close');await page.waitForTimeout(300);await page.click('#routes-open');await page.waitForTimeout(400);
   if(size.width===1000)await page.screenshot({path:'artifacts/dustrivo-routes.png'});
   await page.evaluate(()=>{switchProfile('test');selected=46;save.selected=46;region=0;goPage('routes');});await page.waitForTimeout(300);
   const visibleRoad=await page.evaluate(()=>{const title=document.querySelector('.route-card.selected h3').getBoundingClientRect(),grid=document.querySelector('#route-grid').getBoundingClientRect();return title.top>=grid.top-1&&title.bottom<=grid.bottom+1&&title.left>=grid.left-1&&title.right<=grid.right+1;});
   assert.ok(visibleRoad,'selected new road remains visible on a small screen');
   await page.evaluate(()=>{save.tutorialDone=true;save.dialogues=false;save.sound=false;save.music=false;save.motion=false;applySettings();selected=0;beginDrive();completeDispatch();});
   await page.waitForFunction(()=>sim&&sim.groundCount>0);await page.click('#transfer-case');assert.equal(await page.evaluate(()=>sim.lowGear),true);assert.equal(await page.locator('#transfer-case').getAttribute('aria-pressed'),'true');
   const pedal=await page.locator('#gas').boundingBox(),touch=await context.newCDPSession(page),x=pedal.x+pedal.width/2;
   await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:pedal.y+pedal.height*.85,id:7}]});
   await page.waitForTimeout(350);const gentle=await page.evaluate(()=>sim.throttle);assert.ok(gentle>.25&&gentle<.6,'bottom of pedal gives gentle actual throttle');
   await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:pedal.y-20,id:7}]});await page.waitForTimeout(450);
   assert.ok(await page.evaluate(()=>sim.throttle)>.95,'dragging up increases actual motor demand');
   await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(250);
   assert.equal(await page.evaluate(()=>gas),false);assert.ok(await page.evaluate(()=>sim.throttle)<.1,'released input decays');
   await page.click('#pause');const time=await page.evaluate(()=>sim.time);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>sim.time),time);
   await page.click('#resume');assert.equal(await page.evaluate(()=>mode),'drive');
   if(size.width===1000){await page.evaluate(()=>{sim.previous=null;hud();});await page.screenshot({path:'artifacts/dustrivo-drive.png'});}
   await page.evaluate(()=>androidPause());assert.equal(await page.evaluate(()=>mode),'pause');assert.equal(await page.evaluate(()=>gas),false);
   assert.deepEqual(errors,[]);console.log('PASS UI18 '+size.width+'×'+size.height+': fresh career, 48 roads, home/garage/map, physical 4L, real touch analog throttle, release, pause and lifecycle.');
   await context.close();
  }
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
