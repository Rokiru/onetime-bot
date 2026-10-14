const assert=require('node:assert/strict');
const {chromium,executablePath,serveGame,readyGame}=require('./browser-tools.cjs');
const fs=require('node:fs');
(async()=>{
 const server=await serveGame('game/assets'),browser=await chromium.launch({executablePath,args:['--no-sandbox']});
 try{
  for(const size of [{width:640,height:320,left:28,right:0,bottom:12},{width:747,height:336,left:0,right:28,bottom:8},{width:873,height:393,left:28,right:0,bottom:0},{width:915,height:412,left:0,right:28,bottom:8},{width:1000,height:500,left:0,right:0,bottom:0}]){
   const context=await browser.newContext({viewport:size,hasTouch:true,deviceScaleFactor:2.75});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(server.url);await readyGame(page);await page.evaluate(()=>document.fonts.ready);
   await page.evaluate(s=>{androidInsets(s.left,0,s.right,s.bottom);switchProfile('test');save.sound=false;save.music=false;save.motion=false;save.tutorialDone=true;applySettings();},size);
   const fits=async selector=>{
    for(const element of await page.locator(selector).all()){
     const r=await element.boundingBox();if(!r)continue;assert.ok(r.x>=size.left-1&&r.y>=-1&&r.x+r.width<=size.width-size.right+1&&r.y+r.height<=size.height-size.bottom+1,selector+' outside phone safe area: '+JSON.stringify(r));
    }
   };
   await fits('#play,#routes-open,#garage-open,#more-open,#brand-home,#settings-open');
   await page.click('#routes-open');
   assert.ok(await page.locator('[data-region]').evaluateAll(buttons=>buttons.every(b=>b.scrollWidth<=b.clientWidth+1)),'region labels fit their own touch targets');
   for(const id of [0,46,47,33]){
    await page.evaluate(id=>{selected=id;save.selected=id;region=CP.routes[id].region;orderFilter='all';renderRoutes();},id);
    const geometry=await page.evaluate(()=>{
     const card=document.querySelector('.route-card.selected'),grid=$('route-grid'),c=card.getBoundingClientRect(),g=grid.getBoundingClientRect(),panel=$('selected-order'),desc=document.querySelector('.route-detail-description');
     return {wholeCard:c.top>=g.top-1&&c.bottom<=g.bottom+1&&c.left>=g.left-1&&c.right<=g.right+1,cardOverflow:card.scrollHeight>card.clientHeight+1,panelOverflow:panel.scrollHeight>panel.clientHeight+1,descScrollable:desc.scrollHeight>desc.clientHeight,gridOverflow:grid.scrollHeight>grid.clientHeight,touch:getComputedStyle(card).touchAction};
    });
    assert.ok(geometry.wholeCard,'whole selected card fits, route '+id+' '+JSON.stringify(size));assert.equal(geometry.cardOverflow,false);assert.equal(geometry.panelOverflow,false);assert.equal(geometry.touch,'pan-y');
    await fits('#route-start,#selected-order,.route-detail-heading,.route-detail-meta,.route-detail-description,#world-map-open,[data-home]:visible');
    assert.ok(await page.evaluate(()=>{const content=$('selected-order-content').getBoundingClientRect(),desc=document.querySelector('.route-detail-description').getBoundingClientRect(),button=$('route-start').getBoundingClientRect();return desc.bottom<=content.bottom+1&&desc.bottom<=button.top+1;}),'order text viewport is fully above the action');
    await page.locator('.route-detail-description').evaluate(el=>{el.scrollTop=el.scrollHeight;});
    assert.ok(await page.locator('.route-detail-description').evaluate(el=>el.scrollTop+el.clientHeight>=el.scrollHeight-1),'all order conditions can be read');
   }
   // Real vertical swipe on a card, not a scripted scrollTop assignment.
   await page.evaluate(()=>{selected=0;region=0;orderFilter='all';renderRoutes();$('route-grid').scrollTop=0;});
   const grid=await page.locator('#route-grid').boundingBox(),cdp=await context.newCDPSession(page),x=grid.x+grid.width*.7;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:grid.y+grid.height-8,id:1}]});
   for(let i=1;i<=5;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:grid.y+grid.height-8-i*grid.height*.14,id:1}]});await page.waitForTimeout(20);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(150);assert.ok(await page.locator('#route-grid').evaluate(el=>el.scrollTop)>10,'vertical card swipe scrolls the catalog');
   await page.evaluate(()=>{selected=46;region=0;renderRoutes();});
   fs.mkdirSync('artifacts',{recursive:true});if(size.width===640||size.width===873)await page.screenshot({path:'artifacts/routes19-'+size.width+'.png'});
   await page.evaluate(()=>{selected=0;beginDrive();completeDispatch();});await fits('#gas,#brake,#transfer-case,#winch-button,#pause,#sound-run,#navigation-panel');
   assert.deepEqual(errors,[]);console.log('PASS mobile19 '+size.width+'×'+size.height+': cutout, complete selected card, readable conditions, pinned action and real vertical swipe.');await context.close();
  }
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
