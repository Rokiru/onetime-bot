const {chromium}=require('./browser-tools.cjs');
const assert=require('assert'),path=require('path'),fs=require('fs'),input=require('./driving-input10.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CARGO_CHROME||require('./browser-tools.cjs').executablePath,args:['--no-sandbox']});
 try{
 const p=await browser.newPage({viewport:{width:850,height:393},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript('window.testDriveInput='+input.toString());
 await p.addInitScript(()=>!localStorage.getItem('cargo-save-v1')&&localStorage.setItem('cargo-save-v1',JSON.stringify({wallet:31415,devBonus04:true,owned:['rover','scrambler','mule'],vehicle:'mule',levels:[2,1,0],vehicleLevels:{mule:[0,0,0],scrambler:[0,0,0]},tutorialDone:true,sound:false,music:false,stats:[{wins:2,stars:3,whole:true,smooth:true}],runs:3,paints:{mule:'pine'}})));
 await p.goto('file://'+path.resolve('game/assets/index.html'));await p.click('#boot-skip');await p.waitForTimeout(600);
 assert.equal(await p.evaluate(()=>CargoGame.save.wallet),31415);assert.equal(await p.evaluate(()=>CargoGame.save.stats.length),18);assert.equal(await p.evaluate(()=>CargoGame.save.stats[0].stars),3);
 await p.click('#garage-open');for(const car of ['rover','scrambler','mule']){await p.click('[data-vehicle="'+car+'"]');await p.waitForTimeout(350);await p.screenshot({path:'review09-garage-'+car+'.png'});}await p.click('#garage-close');
 await p.click('#routes-open');assert.equal(await p.locator('[data-region]').count(),6);
 for(let region=0;region<6;region++){const tab=p.locator('[data-region="'+region+'"]');await tab.scrollIntoViewIfNeeded();await tab.click();assert.equal(await p.locator('[data-route]').count(),3);const arts=await p.locator('.route-art>svg').evaluateAll(es=>es.map(e=>e.outerHTML));assert.equal(new Set(arts).size,3);await p.waitForTimeout(200);await p.screenshot({path:'review09-routes-'+region+'.png'});}
 await p.click('[data-home]:visible');
 for(const [id,car] of [[0,'rover'],[9,'scrambler'],[12,'mule'],[15,'rover'],[2,'mule']]){
  await p.evaluate(([id,car])=>{selected=id;save.selected=id;save.vehicle=car;save.levels=[0,0,0];save.sound=false;save.dialogues=true;beginDrive();completeDispatch();},[id,car]);
  await p.evaluate(()=>{const s=CargoGame.sim;for(let n=0;n<10000&&s.car.getPosition().x<43&&s.state==='drive';n++)s.step(...testDriveInput(s,CargoPhysics));pause();visibility('paused',false);cam.x=s.car.getPosition().x+1.2;cam.y=s.car.getPosition().y+.9;hud();draw(0);});
  // Compact radio is in the instrument band and cannot intercept a pedal.
  await p.evaluate(()=>{sayDriver('Тормози заранее. Береги груз.','focus',true);draw(0);});
  const radio=await p.locator('#driver-radio').boundingBox();assert(radio&&radio.height<=30&&radio.y<120);assert.equal(await p.locator('#driver-radio').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
  await p.screenshot({path:'review09-drive-'+id+'-'+car+'.png'});
  await p.evaluate(()=>{resetCoach();leaveRun();home();});
 }
 await p.evaluate(()=>{selected=0;save.vehicle='rover';beginDrive();completeDispatch();});
 await p.dispatchEvent('#gas','pointerdown',{pointerId:11,pointerType:'touch',isPrimary:true});await p.dispatchEvent('#brake','pointerdown',{pointerId:12,pointerType:'touch'});assert.deepEqual(await p.evaluate(()=>[gas,brake]),[true,true]);
 await p.evaluate(()=>androidPause());assert.deepEqual(await p.evaluate(()=>[gas,brake]),[false,false]);await p.evaluate(()=>resume());assert.equal(await p.evaluate(()=>CargoGame.mode),'drive');
 await p.evaluate(()=>{const s=CargoGame.sim;for(let n=0;n<30000&&s.state==='drive';n++)s.step(...testDriveInput(s,CargoPhysics));});await p.waitForFunction(()=>CargoGame.mode==='result');assert.equal(await p.evaluate(()=>CargoGame.sim.state),'win');await p.click('#result-home');
 // New progress survives restart, along with old purchases, profile and settings.
 await p.evaluate(()=>{save.stats[17]={wins:1,stars:3,whole:true,smooth:true,time:80};save.selected=17;selected=17;persist();});await p.reload();await p.click('#boot-skip');await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>CargoGame.save.selected),17);assert.equal(await p.evaluate(()=>CargoGame.save.stats[17].wins),1);
 // All nine original deliveries still light the village; extra routes don't relock it.
 await p.evaluate(()=>{for(let i=0;i<9;i++)save.stats[i].wins=1;openVillage();});assert((await p.locator('#village-next').textContent()).includes('Свет вернулся'));await p.click('#village-close');
 // Independent career grows to 18 without importing free-drive wallet.
 await p.evaluate(()=>switchProfile('career'));assert.equal(await p.evaluate(()=>CargoGame.save.wallet),0);assert.equal(await p.evaluate(()=>CargoGame.save.stats.length),18);assert.equal(await p.evaluate(()=>routeUnlocked(9)),false);
 await p.evaluate(()=>{for(let i=0;i<9;i++)save.stats[i].wins=1;});assert.equal(await p.evaluate(()=>routeUnlocked(9)),true);assert.equal(await p.evaluate(()=>routeUnlocked(10)),false);await p.evaluate(()=>switchProfile('test'));
 for(const viewport of [{width:640,height:320},{width:1536,height:691}]){await p.setViewportSize(viewport);await p.click('#garage-open');await p.waitForTimeout(250);await p.screenshot({path:'review09-small-'+viewport.width+'.png'});const rects=await p.locator('#garage .upgrade').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {y:r.y,b:r.bottom};}));assert(rects.every(r=>r.y>=0&&r.b<viewport.height-25));await p.click('#garage-close');await p.evaluate(()=>{selected=17;save.selected=17;save.vehicle='mule';beginDrive();completeDispatch();pause();visibility('paused',false);sayDriver('Лёд: тормози заранее.','focus',true);hud();draw(0);});const radio=await p.locator('#driver-radio').boundingBox();assert(radio.height<=30);const pedal=await p.locator('#gas').boundingBox();assert(pedal.width>=100&&pedal.height>=80);await p.screenshot({path:'review09-phone-'+viewport.width+'.png'});await p.evaluate(()=>{leaveRun();home();});}
 assert.deepEqual(errors,[]);console.log('PASS UI: 18-route migration; 6 regions; distinct art; 3 models; radio <=30px; touch/pause; delivery; reload; original village; career unlocks; 640/850/1536 layouts; zero JS errors');
 }finally{await browser.close();}
})();
