// Run against `python3 -m http.server 8000 --directory app/src/main/assets/game`.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const errors=[];
  for(const [width,height] of [[390,844],[360,640],[412,915]]){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.iskraSnapshot);
    assert.equal(await page.evaluate(()=>iskraSnapshot().mode),'menu');
    const menu=await page.locator('#menu footer').boundingBox();assert.ok(menu.y+menu.height<=height+1);
    if(width===390)await page.screenshot({path:path.resolve('artifacts/menu.png')});
    await page.click('#play');await page.click('#help-done');assert.equal(await page.evaluate(()=>iskraSnapshot().mode),'playing');
    await page.waitForTimeout(300);const before=await page.evaluate(()=>iskraSnapshot().hero);
    const touch=await context.newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:130,y:430,id:1}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:167,y:420,id:1}]});
    await page.waitForTimeout(500);const after=await page.evaluate(()=>iskraSnapshot().hero);assert.ok(after.x>before.x+30,'virtual joystick moves hero');
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.locator('#dash').dispatchEvent('pointerdown');assert.ok(await page.evaluate(()=>iskraSnapshot().hero.dash>0));
    await page.waitForTimeout(2200);
    if(width===390)await page.screenshot({path:path.resolve('artifacts/gameplay.png')});
    await page.click('#pause');const paused=await page.evaluate(()=>iskraSnapshot());await page.waitForTimeout(400);
    assert.equal(paused.paused,true);assert.deepEqual((await page.evaluate(()=>iskraSnapshot())).hero,paused.hero);
    await page.click('#pause-settings');await page.click('[data-setting="sound"]');assert.equal(await page.evaluate(()=>iskraSnapshot().save.sound),false);
    await page.click('#close-panel');await page.click('#resume');assert.equal(await page.evaluate(()=>iskraSnapshot().paused),false);
    await page.click('#pause');await page.click('#leave');assert.equal(await page.evaluate(()=>iskraSnapshot().screen),'result');
    const ended=await page.evaluate(()=>iskraSnapshot().save);assert.equal(ended.runs,1);
    await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>iskraSnapshot().save.runs),1,'result rewards are recorded once');
    await page.click('#to-menu');await page.reload();await page.waitForFunction(()=>!!window.iskraSnapshot);
    assert.equal(await page.evaluate(()=>iskraSnapshot().save.runs),1);assert.equal(await page.evaluate(()=>iskraSnapshot().save.sound),false);
    await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('iskra.save.v1'));s.coins=60;localStorage.setItem('iskra.save.v1',JSON.stringify(s));});
    await page.reload();await page.click('#workshop-open');await page.click('[data-buy="hull"]');
    const upgraded=await page.evaluate(()=>iskraSnapshot().save);assert.equal(upgraded.coins,35);assert.equal(upgraded.hull,1);
    await page.click('#close-panel');await page.click('#play');assert.equal(await page.evaluate(()=>iskraSnapshot().hero.hp),112);
    await page.evaluate(()=>window.nativePause());assert.equal(await page.evaluate(()=>iskraSnapshot().paused),true);
    console.log(`PASS ${width}×${height}: tutorial, touch movement, dash, pause, settings, rewards, persistence, workshop, lifecycle`);
    await context.close();
  }
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
