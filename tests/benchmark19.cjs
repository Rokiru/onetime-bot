// Controlled full-scene raster workload, not a measurement of Android FPS.
const {chromium,executablePath,serveGame,readyGame}=require('./browser-tools.cjs');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath,args:['--no-sandbox']});
 const report={environment:'Headless Chromium, 873×393 CSS pixels, DPR 2.75, auto quality. Frozen physical scene: median of 5 batches × 20 draws; moving camera: median and p95 of 120 draws at 4.8 m/s, one pixel readback per draw forces raster completion. This is a comparative raster workload, not phone FPS.',versions:{}};
 try{for(const [name,assets] of [['0.18',process.env.CARGO_BASELINE||'/tmp/dustrivo-018/game/assets'],['current','game/assets']]){
  const server=await serveGame(assets);try{
   const page=await browser.newPage({viewport:{width:873,height:393},deviceScaleFactor:2.75});await page.goto(server.url);await readyGame(page);
   await page.evaluate(()=>{requestAnimationFrame=()=>0;switchProfile('test');save.sound=false;save.music=false;save.tutorialDone=true;save.quality='auto';resize();});await page.waitForTimeout(100);
   const result=await page.evaluate(()=>{
    const rows=[];
    for(const id of [0,1,2,9,12,15,46,47]){
     selected=id;sim=new CP.Drive(id,[0,0,0,0],CP.routes[id].requires||(CP.routes[id].cargo==='logs'?'timber':CP.routes[id].cargo==='liquid'?'tanker':'rover'));mode='pause';sim.previous=null;
     cam={x:id===47?84:30,y:CP.height(id===47?84:30,id)+2};scale=Math.min(H/8.8,W/23);clock=10;
     for(let i=0;i<10;i++){draw(0);ctx.getImageData(0,0,1,1);}
     const batches=[];for(let b=0;b<5;b++){const start=performance.now();for(let i=0;i<20;i++){draw(0);ctx.getImageData(0,0,1,1);}batches.push((performance.now()-start)/20);}batches.sort((a,b)=>a-b);
     const operations={};const names=['fill','stroke','drawImage','createPattern','createLinearGradient','createRadialGradient'];const saved={};for(const n of names){saved[n]=ctx[n];ctx[n]=function(...a){operations[n]=(operations[n]||0)+1;return saved[n].apply(this,a);};}draw(0);for(const n of names)ctx[n]=saved[n];
     const moving=[];for(let n=0;n<120;n++){cam.x+=.08;cam.y=CP.height(cam.x,id)+2;const start=performance.now();draw(0);ctx.getImageData(0,0,1,1);moving.push(performance.now()-start);}moving.sort((a,b)=>a-b);
     rows.push({route:id,region:sim.route.region,medianMs:Number(batches[2].toFixed(3)),movingMedianMs:Number(moving[60].toFixed(3)),movingP95Ms:Number(moving[114].toFixed(3)),operations,cache:typeof ExpeditionArt.stats==='function'?ExpeditionArt.stats():null});
    }
    return {backing:[canvas.width,canvas.height],rows};
   });report.versions[name]=result;await page.close();
  }finally{await server.close();}
 }}finally{await browser.close();}
 fs.writeFileSync('renderer19-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
