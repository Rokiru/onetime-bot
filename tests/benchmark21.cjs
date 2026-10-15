// Controlled full-scene raster workload, not a measurement of Android FPS.
const {chromium,executablePath,serveGame,readyGame}=require('./browser-tools.cjs');
const fs=require('node:fs'),input=require('./driving-input21.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath,args:['--no-sandbox']});
 const report={environment:'Headless Chromium, 873×393 CSS pixels, DPR 2.75, auto quality. Frozen physical scene: median of 5 batches × 20 draws; moving camera: median and p95 of 120 draws at 4.8 m/s, one pixel readback per draw forces raster completion. This is a comparative raster workload, not phone FPS.',versions:{}};
 try{for(const [name,assets] of [['0.20',process.env.CARGO_BASELINE||'/tmp/dustrivo-020/game/assets'],['current','game/assets']]){
  const server=await serveGame(assets);try{
   const page=await browser.newPage({viewport:{width:873,height:393},deviceScaleFactor:2.75});await page.addInitScript('window.testDriveInput='+input.browserSource);await page.goto(server.url);await readyGame(page);
   await page.evaluate(()=>{requestAnimationFrame=()=>0;switchProfile('test');save.sound=false;save.music=false;save.tutorialDone=true;save.quality='auto';resize();});await page.waitForTimeout(100);
   const result=await page.evaluate(()=>{
    const rows=[];
    for(const [id,view,path] of [[0,6,'ridge'],[0,65,'ridge'],[0,110,'ridge'],[0,160,'ridge'],[0,100,'detour'],[0,235,'detour'],[7,150],[47,145]]){
     selected=id;sim=new CP.Drive(id,[0,0,0],CP.routes[id].requires||(CP.routes[id].cargo==='logs'?'timber':CP.routes[id].cargo==='liquid'?'tanker':'rover'),'standard',path&&CP.firstLight?21:20,{path,powered:true});for(let n=0;n<20000&&sim.state==='drive'&&sim.car.getPosition().x<Math.min(view,sim.route.length+2);n++)sim.step(...testDriveInput(sim,CP,path));mode='pause';sim.previous=null;save.workshopPowered=true;
     cam={x:view,y:CP.height(view,id)+2};scale=Math.min(H/8.8,W/23);clock=10;
     for(let i=0;i<10;i++){draw(0);ctx.getImageData(0,0,1,1);}
     const batches=[];for(let b=0;b<5;b++){const start=performance.now();for(let i=0;i<20;i++){draw(0);ctx.getImageData(0,0,1,1);}batches.push((performance.now()-start)/20);}batches.sort((a,b)=>a-b);
     const operations={};const names=['fill','stroke','drawImage','createPattern','createLinearGradient','createRadialGradient'];const saved={};for(const n of names){saved[n]=ctx[n];ctx[n]=function(...a){operations[n]=(operations[n]||0)+1;return saved[n].apply(this,a);};}draw(0);for(const n of names)ctx[n]=saved[n];
     const moving=[];for(let n=0;n<120;n++){cam.x+=.08;cam.y=CP.height(cam.x,id)+2;const start=performance.now();draw(0);ctx.getImageData(0,0,1,1);moving.push(performance.now()-start);}moving.sort((a,b)=>a-b);
     rows.push({route:id,path:path||null,cameraX:view,region:sim.route.region,medianMs:Number(batches[2].toFixed(3)),movingMedianMs:Number(moving[60].toFixed(3)),movingP95Ms:Number(moving[114].toFixed(3)),operations,buildings:typeof DepotArt20==='undefined'?null:DepotArt20.stats(),cache:typeof ExpeditionArt.stats==='function'?ExpeditionArt.stats():null});
    }
    let miniMapPaintMs=null;if(typeof drawRoadProfile==='function'){const start=performance.now();for(let n=0;n<120;n++){drawRoadProfile();$('road-profile').getContext('2d').getImageData(0,0,1,1);}miniMapPaintMs=(performance.now()-start)/120;}return {backing:[canvas.width,canvas.height],miniMapPaintMs,rows};
   });report.versions[name]=result;await page.close();
  }finally{await server.close();}
 }}finally{await browser.close();}
 fs.writeFileSync('docs/performance-0.21.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
