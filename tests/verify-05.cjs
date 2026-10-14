const {chromium}=require('./browser-tools.cjs');
const path=require('path'),assert=require('assert');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CARGO_CHROME||require('./browser-tools.cjs').executablePath,args:['--no-sandbox']});
 try{
 const p=await b.newPage({viewport:{width:850,height:393},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('game/assets/index.html'));await p.click('#boot-skip');await p.waitForTimeout(600);await p.click('#play');await p.click('#briefing-drive');await p.waitForFunction(()=>CargoGame.mode==='drive');
 assert.equal(await p.evaluate(()=>CargoGame.lesson.step),0);await p.screenshot({path:'review-05-lesson.png'});
 await p.keyboard.down('ArrowRight');await p.waitForTimeout(1200);await p.keyboard.up('ArrowRight');assert.equal(await p.evaluate(()=>CargoGame.lesson.step),1);
 await p.keyboard.down('ArrowLeft');await p.waitForTimeout(1100);await p.keyboard.up('ArrowLeft');assert.equal(await p.evaluate(()=>CargoGame.lesson.step),2);
 await p.evaluate(()=>{const s=CargoGame.sim;for(let i=0;i<600&&s.distance<30;i++)s.step(true,false);});await p.waitForTimeout(1100);assert.equal(await p.evaluate(()=>CargoGame.lesson.step),3);
 await p.click('#lesson-next');assert.equal(await p.evaluate(()=>CargoGame.save.tutorialDone),true);assert.equal(await p.locator('.coach-focus').count(),0);
 await p.keyboard.down('ArrowRight');await p.waitForTimeout(500);await p.keyboard.up('ArrowRight');assert(await p.evaluate(()=>RoadAudio.engine.gain.value>0));
 await p.click('#pause');await p.waitForTimeout(80);assert.equal(await p.evaluate(()=>CargoGame.mode),'pause');assert.deepEqual(await p.evaluate(()=>[RoadAudio.engine,RoadAudio.road,RoadAudio.wind].map(g=>g.gain.value)),[0,0,0]);
 await p.click('#resume');await p.click('#sound-run');await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>RoadAudio.master.gain.value),0);assert.deepEqual(await p.evaluate(()=>[RoadAudio.engine,RoadAudio.road,RoadAudio.wind].map(g=>g.gain.value)),[0,0,0]);
 await p.evaluate(()=>window.androidPause());assert.equal(await p.evaluate(()=>CargoGame.mode),'pause');await p.click('#resume');await p.click('#sound-run');
 await p.evaluate(()=>sayDriver('Мост впереди. Притормози.','worried',true));assert(await p.locator('#driver-radio').isVisible());await p.screenshot({path:'review-05-radio.png'});
 await p.click('#pause');await p.click('#exit');await p.click('#help-open');await p.click('#lesson-repeat');await p.waitForFunction(()=>CargoGame.mode==='drive');assert(await p.locator('#lesson').isVisible());assert.equal(await p.evaluate(()=>CargoGame.sim.id),0);await p.click('#lesson-next');
 await p.click('#pause');await p.click('#exit');const wallet=await p.evaluate(()=>CargoGame.save.wallet);await p.reload();await p.click('#boot-skip');await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>CargoGame.save.wallet),wallet);assert.equal(await p.evaluate(()=>CargoGame.save.tutorialDone),true);
 for(let id=0;id<3;id++){
  await p.evaluate(i=>{selected=i;beginDrive();const s=CargoGame.sim;for(let k=0;k<900&&s.car.getPosition().x<42&&s.state==='drive';k++)s.step(true,false);cam.x=s.car.getPosition().x;cam.y=s.car.getPosition().y+.7;},id);
  await p.waitForTimeout(150);await p.screenshot({path:'review-05-region-'+id+'.png'});
  const pixels=await p.evaluate(()=>Array.from(ctx.getImageData(10,100,1,1).data));assert(pixels.slice(0,3).some(x=>x>0));
 }
 await p.setViewportSize({width:640,height:320});await p.evaluate(()=>{save.tutorialDone=false;beginDrive();startLesson();});await p.screenshot({path:'review-05-small.png'});
 const rects=await p.evaluate(()=>['lesson','brake','gas'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));assert(rects.every(r=>r.x>=0&&r.y>=0&&r.x+r.w<=640&&r.y+r.h<=320));
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS: responsive action lesson, repeat/skip/save, audio/mute/pause/Android lifecycle, regional scenes, small-screen bounds');
 }finally{await b.close();}
})();
