const fs=require('fs');let pw;try{pw=require('playwright');}catch(e){pw=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');}const local='/workspace/scratch/21273215e9ef/browser09/chrome-headless-shell-linux64/chrome-headless-shell';module.exports={...pw,executablePath:process.env.CARGO_CHROME||(fs.existsSync(local)?local:pw.chromium.executablePath())};
module.exports.serveGame=async function(assets){const http=require('http'),path=require('path'),fs=require('fs');const root=path.resolve(assets);const server=http.createServer((req,res)=>{let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(e){res.writeHead(400).end();return;}const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file));});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return {url:'http://127.0.0.1:'+server.address().port,close:()=>new Promise(resolve=>server.close(resolve))};};

module.exports.readyGame=async function(page){
 await page.waitForFunction(()=>window.CargoGame,{timeout:15000});
 if(await page.locator('#boot-skip').isVisible()){
  try{await page.locator('#boot-skip').click({timeout:1200});}catch(error){
   if(await page.evaluate(()=>CargoGame.mode==='boot')){
    await page.waitForFunction(()=>CargoGame.mode!=='boot',{timeout:10000});
   }
  }
 }
 await page.waitForFunction(()=>CargoGame.mode!=='boot',{timeout:15000});
};
