'use strict';
/* An authored art direction: layered landscape, weathered metal, readable silhouettes.
 * Collision geometry and suspension are always taken from the live physics bodies. */
const ExpeditionArt=(()=>{
 const originalTruck=truck,originalDraw=draw;
 const treeCache=new Map(),soilCache=new Map();
 const cacheStats={soilBuilds:0};
 function remember(cache,key,value,limit){cache.set(key,value);if(cache.size>limit)cache.delete(cache.keys().next().value);return value;}
 const palettes=[
  {sky:['#8caaa1','#d6d1b4','#bbc3a5'],peaks:['#a4b5a5','#7e9b8c','#517d6a','#294f3c'],trees:'#294f38',earth:['#8b8860','#666347','#343b29'],road:'#c6be87'},
  {sky:['#7b8887','#d1bca0','#b8ac88'],peaks:['#b7ae9b','#9b9078','#80795c','#595e43'],trees:'#515d36',earth:['#a69675','#756f55','#3c4132'],road:'#d1bc93'},
  {sky:['#142c34','#425950','#748777'],peaks:['#637b77','#47675c','#2d5242','#1b3b2d'],trees:'#203e2b',earth:['#74775a','#4e5c3e','#293d2c'],road:'#acaa7d'},
  {sky:['#709fa9','#d0d6bb','#aac4ae'],peaks:['#a8c2b9','#81aaa0','#618e7d','#366958'],trees:'#46705a',earth:['#c6b590','#95835d','#566044'],road:'#dfcd9d'},
  {sky:['#7b9a90','#bbc4a0','#8da586'],peaks:['#a1b396','#7e9e7d','#527c56','#345f39'],trees:'#3d6139',earth:['#7b8459','#586b40','#2c472c'],road:'#a9a777'},
  {sky:['#758f9e','#d9dfd5','#b1c6c2'],peaks:['#bbc9c6','#97b0b0','#6a9392','#477575'],trees:'#42625a',earth:['#c3cbc1','#849b91','#445e53'],road:'#e8e8d4'}
 ];
 function pineSprite(variant,region){
  const key=region+':'+variant;if(treeCache.has(key))return treeCache.get(key);
  const c=document.createElement('canvas');c.width=110;c.height=200;const a=c.getContext('2d');
  const col=palettes[region].trees;const shade=region===5?'#87a095':'#78916b';
  a.fillStyle='#384b34';a.fillRect(51,38,6,155);
  for(let tier=0;tier<12;tier++){
   const y=16+tier*12,w=8+tier*3.5+hash(tier+variant*19)*5;
   a.beginPath();a.moveTo(54,y-18);
   for(let j=0;j<7;j++)a.lineTo(54+w*(j/6),y+j*2.6+hash(j+tier*21+variant)*4);
   a.lineTo(54,y+20);
   for(let j=6;j>=0;j--)a.lineTo(54-w*(j/6),y+j*2.6+hash(j+tier*51+variant)*4);
   a.closePath();a.fillStyle=col;a.fill();
   a.beginPath();a.moveTo(54,y-15);a.lineTo(54+w*.86,y+14);a.lineTo(54,y+13);a.closePath();a.fillStyle=shade;a.globalAlpha=region===5?.46:.23;a.fill();a.globalAlpha=1;
   if(region===5){a.strokeStyle='#e8e8d5';a.lineWidth=2;a.beginPath();a.moveTo(54,y-16);a.lineTo(54+w*.9,y+13);a.stroke();}
  }
  a.fillStyle='#202f2180';a.fillRect(52,166,3,28);
  treeCache.set(key,c);return c;
 }
 function ridge(region,layer){
  const p=palettes[region],night=region===2,factor=.02+layer*.07,spacing=95-layer*12,shift=cam.x*scale*factor;
  const start=Math.floor(shift/spacing)-2,points=[];
  for(let n=start;n<start+Math.ceil(W/spacing)+6;n++){
   const height=H*(.37+layer*.086)-(Math.sin(n*.64+region*2.1)+hash(n+layer*109)*.72)*H*(.068+layer*.012);
   points.push([n*spacing-shift,height+(cam.y-2)*scale*(.015+layer*.028)]);
  }
  path([[points[0][0],H],...points,[points[points.length-1][0],H]],p.peaks[layer]);
  for(let i=1;i<points.length-1;i++){
   const prev=points[i-1],a=points[i],next=points[i+1];if(a[1]>prev[1]||a[1]>next[1])continue;
   const trough=Math.max(prev[1],next[1])+H*.08;
   path([a,[a[0]+spacing*.34,trough],prev],region===5?'#e8ead580':night?'#c0d8bd09':'#d8d4b51b');
   if(region===5){path([a,[a[0]+(next[0]-a[0])*.35,a[1]+(next[1]-a[1])*.35],[a[0]+7,a[1]+H*.025],[a[0]-17,a[1]+H*.02],[a[0]-(a[0]-prev[0])*.25,a[1]+(prev[1]-a[1])*.25]],'#e2e5d0');}
  }
  if(layer>=2&&region!==1&&region!==3){
   const step=24,scroll=cam.x*scale*(factor+.03),begin=Math.floor(scroll/step)-2;
   for(let n=begin;n<begin+Math.ceil(W/step)+5;n++){
    const h=H*(.08+hash(n+region*33)*.12),x=n*step-scroll,base=H*(.61+layer*.052)+Math.sin(n*.4)*H*.025+(cam.y-2)*scale*.08;
    ctx.globalAlpha=layer===2?.46:.85;ctx.drawImage(pineSprite(Math.abs(n)%4,region),x-h*.26,base-h,h*.55,h);
   }ctx.globalAlpha=1;
  }
 }
 // Reuse world-space geometry and submit each colour as one path. This
 // avoids hundreds of per-frame ellipse calls without large bitmap layers.
 function soilTexture(route,tile){
  const key=route+':'+tile;let value=soilCache.get(key);if(value)return value;
  const from=tile*8,to=from+8,light=new Path2D(),dark=new Path2D();
  for(let n=Math.ceil(from/.48);n*.48<to;n++){
   const x=n*.48,base=CP.groundHeight(x,route);
   for(let j=0;j<4;j++){
    const seed=x*37+j*41,px=x+hash(seed)*.3,py=base-.23-j*.65-hash(seed+17)*.35,size=.015+hash(seed+28)*.04,path=j%2?light:dark;
    path.moveTo(px+size*1.8*Math.cos(-.4),py+size*1.8*Math.sin(-.4));path.ellipse(px,py,size*1.8,size,-.4,0,Math.PI*2);
   }
  }
  value={light,dark};cacheStats.soilBuilds++;return remember(soilCache,key,value,16);
 }
 function house(x,y,k,region){
  const night=region===2;ctx.fillStyle=night?'#304132':'#56634d';ctx.fillRect(x-k*.7,y-k*.72,k*1.4,k*.72);
  path([[x-k*.85,y-k*.72],[x-k*.05,y-k*1.25],[x+k*.8,y-k*.72]],'#42513d');
  path([[x-k*.05,y-k*1.25],[x+k*.38,y-k*1.12],[x+k*.9,y-k*.72],[x+k*.8,y-k*.72]],'#839074');
  for(let j=0;j<2;j++){ctx.fillStyle=night?'#e0b67b':'#9bbaa0';ctx.fillRect(x-k*.43+j*k*.58,y-k*.56,k*.23,k*.25);ctx.strokeStyle='#343f30';ctx.lineWidth=1;ctx.strokeRect(x-k*.43+j*k*.58,y-k*.56,k*.23,k*.25);}
  ctx.fillStyle='#354a32';ctx.fillRect(x+k*.02,y-k*.38,k*.2,k*.38);
  ctx.strokeStyle='#ffffff0f';ctx.lineWidth=1;for(let j=1;j<6;j++)line(x-k*.65,y-k*j*.12,x+k*.65,y-k*j*.12,'#d9d0ad22',1);
  ctx.fillStyle='#4d563f';ctx.fillRect(x+k*.4,y-k*1.1,k*.15,k*.34);
  if(save.effects){ctx.globalAlpha=.12;for(let j=0;j<4;j++)circle(x+k*.47+j*k*.04,y-k*(1.25+j*.23)-Math.sin(clock+j)*k*.04,k*(.08+j*.025),'#e9e4c9');ctx.globalAlpha=1;}
 }
 function background(){
  const driving=sim&&['drive','pause','result','loading','unloading'].includes(mode),id=driving?sim.route.region:CP.routes[selected].region,p=palettes[id];
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,p.sky[0]);g.addColorStop(.55,p.sky[1]);g.addColorStop(1,p.sky[2]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const sunx=W*.73-cam.x*.08,suny=H*.23;
  const glow=ctx.createRadialGradient(sunx,suny,5,sunx,suny,H*.33);glow.addColorStop(0,id===2?'#cdd8b522':'#f4d4a440');glow.addColorStop(1,'#e5d1a000');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  circle(sunx,suny,H*.053,id===2?'#dce0c0':'#efdfb0');
  if(id===2){circle(sunx+H*.026,suny-H*.01,H*.05,p.sky[0]);for(let i=0;i<45;i++)circle(hash(i)*W,hash(i+60)*H*.39,hash(i+33)>.85?1:.5,'#e3e2c574');}
  if(save.quality!=='low'){
   for(let i=0;i<5;i++){
    const x=(W*(i*.31+.06)-cam.x*scale*.017)%(W*1.6),y=H*(.12+hash(i)*.18),w=H*(.25+hash(i+9)*.1);
    ctx.globalAlpha=id===2?.08:.16;ctx.fillStyle='#f5edd4';ctx.beginPath();ctx.ellipse(x,y,w,H*.022,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(x+w*.25,y-H*.014,w*.61,H*.019,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
   }
  }
  for(let layer=0;layer<(save.quality==='low'?3:4);layer++)ridge(id,layer);
  if(id===1){
   const cx=W*.76-cam.x*scale*.11,y=H*.58,k=H*.31;line(cx,y,cx,y-k,'#53624c',3);line(cx-k*.4,y-k,cx+k*.7,y-k*.94,'#65745d',3);line(cx,y-k*.98,cx+k*.52,y-k*.74,'#869278',1);line(cx+k*.52,y-k*.94,cx+k*.52,y-k*.45,'#52664e',1.3);path([[cx-6,y-k],[cx+6,y-k],[cx+10,y-k*.82],[cx-10,y-k*.82]],'#708065');
  }
  if(save.quality!=='low'){
   const parallax=.27,step=120,shift=cam.x*scale*parallax,start=Math.floor(shift/step)-2;
   for(let n=start;n<start+Math.ceil(W/step)+5;n++){
    const x=n*step-shift,base=H*.81+(cam.y-2)*scale*.1-Math.sin(n*.78+id)*H*.035;
    if((id===0||id===2)&&hash(n+73)>.65)house(x,base,H*.08,id);
    else if(id!==1&&id!==3){const h=H*(.16+hash(n+53)*.18);ctx.drawImage(pineSprite(Math.abs(n)%4,id),x-h*.275,base-h,h*.55,h);}
   }
  }
  const mist=ctx.createLinearGradient(0,H*.43,0,H*.86);mist.addColorStop(0,'#d4dcc300');mist.addColorStop(.5,id===2?'#a9bba009':'#d1d9b918');mist.addColorStop(1,'#cad2b100');ctx.fillStyle=mist;ctx.fillRect(0,0,W,H);
 }
 function terrain(){
  const r=sim?sim.id:selected,id=CP.routes[r].region,p=palettes[id],from=cam.x-W*.4/scale-4,to=cam.x+W*.73/scale+4;
  const mesh=CP.groundVertices(r),visible=mesh.slice(Math.max(0,Math.floor((from+30)*2)),Math.min(mesh.length,Math.ceil((to+30)*2)+1));if(visible.length<2)return;
  const road=visible.map(v=>[sx(v.x),sy(v.y)]),shape=[[road[0][0],H+15],...road,[road[road.length-1][0],H+15]];
  const g=ctx.createLinearGradient(0,H*.52,0,H);g.addColorStop(0,p.earth[0]);g.addColorStop(.27,p.earth[1]);g.addColorStop(1,p.earth[2]);path(shape,g);
  ctx.save();ctx.beginPath();shape.forEach((q,i)=>i?ctx.lineTo(...q):ctx.moveTo(...q));ctx.closePath();ctx.clip();
  for(let row=0;row<3;row++){
   ctx.beginPath();visible.forEach((v,i)=>{const x=sx(v.x),y=sy(v.y-.45-row*.8+Math.sin(v.x*.63+row)*.11);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.lineWidth=scale*(row===0?.08:.035);ctx.strokeStyle=row===0?'#ddd6b12b':'#202f2240';ctx.stroke();
  }
  if(save.quality!=='low')for(let tile=Math.floor(from/8);tile<=Math.floor(to/8);tile++){
   const texture=soilTexture(r,tile);ctx.save();ctx.translate(sx(0),sy(0));ctx.scale(scale,-scale);ctx.fillStyle='#d9c79929';ctx.fill(texture.light);ctx.fillStyle='#14271735';ctx.fill(texture.dark);ctx.restore();
  }
  ctx.restore();
  ctx.beginPath();road.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.lineWidth=Math.max(7,scale*.23);ctx.lineJoin='round';ctx.strokeStyle='#354634';ctx.stroke();ctx.lineWidth=Math.max(4,scale*.13);ctx.strokeStyle=p.road;ctx.stroke();ctx.lineWidth=1;ctx.strokeStyle='#f1e2b74b';ctx.stroke();
  if(save.quality!=='low')for(let x=Math.floor(from/.6)*.6;x<to;x+=.6){
   const y=CP.groundHeight(x,r),a=sx(x),b=sy(y),h=hash(x*3+id*101);const bridge=CP.bridges[r];if(bridge&&x>bridge.from&&x<bridge.to)continue;
   if(id===5){line(a-4,b-1,a+5,b-1,'#e5e7d7',3);}else if((id===0||id===4)&&h>.42){for(let j=0;j<3;j++)line(a+j*2,b-1,a+j*2-2,b-4-h*6,id===4?'#88945c':'#8c9a64',1);}else if(h>.78){ctx.fillStyle='#57644d';ctx.beginPath();ctx.ellipse(a,b-1,2+hash(x)*3,1.5,0,0,Math.PI*2);ctx.fill();}
  }
  // Keep authored depots and the physical end marker from the original renderer.
  if(sim){const end=sim.route.length+6,x=sx(end),y=sy(CP.height(end,r)),k=scale;if(x<W+250&&x>-300){line(x,y,x,y-k*3.25,'#c1c7a7',k*.05);path([[x,y-k*3.25],[x+k*.9,y-k*3.05],[x,y-k*2.62]],'#d99464');const bx=x+k*1.6;ctx.fillStyle='#40583a';ctx.fillRect(bx,y-k*2.0,k*3.2,k*2.0);path([[bx-k*.15,y-k*2],[bx+k*1.6,y-k*2.8],[bx+k*3.35,y-k*2]],'#8c8d63','#c3bf93',1);ctx.fillStyle='#263d28';ctx.fillRect(bx+k*.5,y-k*1.7,k*1.8,k*1.7);for(let j=0;j<4;j++)line(bx+k*.5,y-k*(.4+j*.4),bx+k*2.3,y-k*(.4+j*.4),'#667454',1);ctx.fillStyle='#d2c6a1';ctx.font='bold '+Math.round(k*.2)+'px sans-serif';ctx.textAlign='left';ctx.fillText('ПРИЁМКА',bx+k*.4,y-k*2.14);}}
 }
 let wheelSprite=null;
 function makeWheel(){
  const c=document.createElement('canvas');c.width=c.height=192;const a=c.getContext('2d'),r=90;
  a.translate(96,96);const disk=(radius,color)=>{a.fillStyle=color;a.beginPath();a.arc(0,0,radius,0,Math.PI*2);a.fill();};
  const polygon=(pts,color)=>{a.fillStyle=color;a.beginPath();pts.forEach((q,i)=>i?a.lineTo(...q):a.moveTo(...q));a.closePath();a.fill();};
  const rubber=a.createRadialGradient(-r*.2,-r*.3,r*.1,0,0,r);rubber.addColorStop(0,'#475446');rubber.addColorStop(.5,'#18251c');rubber.addColorStop(1,'#111a13');disk(r,rubber);
  for(let i=0;i<20;i++){a.save();a.rotate(i*Math.PI/10);polygon([[-r*.12,-r*.98],[r*.04,-r*.98],[r*.12,-r*.82],[-r*.05,-r*.82]],i%2?'#69705b':'#4e5c47');a.restore();}
  disk(r*.69,'#132017');disk(r*.52,'#b5baa4');disk(r*.43,'#414f3e');
  for(let i=0;i<5;i++){a.save();a.rotate(i*Math.PI*2/5);polygon([[-r*.055,r*.12],[r*.055,r*.12],[r*.12,r*.39],[-r*.12,r*.39]],'#b5b89f');a.fillStyle='#172218';a.beginPath();a.arc(0,r*.31,r*.05,0,Math.PI*2);a.fill();a.restore();}
  disk(r*.15,'#a3aa90');disk(r*.045,'#e4d4a9');return c;
 }
 function wheel(w,m){
  const p=pose(w),x=sx(p.x),y=sy(p.y),r=scale*m.radius;if(!wheelSprite)wheelSprite=makeWheel();
  ctx.save();ctx.translate(x,y);ctx.rotate(-p.a);const extent=r*192/90;ctx.drawImage(wheelSprite,-extent/2,-extent/2,extent,extent);ctx.restore();
  ctx.strokeStyle='#b3bca23d';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,y,r*.86,Math.PI*1.05,Math.PI*1.77);ctx.stroke();
 }
 function metal(body,m,top=1.5){
  const a=bodyPoint(body,0,top)[1],b=bodyPoint(body,0,-.3)[1],g=ctx.createLinearGradient(0,a,0,Math.max(a+2,b));
  g.addColorStop(0,m.accent);g.addColorStop(.12,m.color);g.addColorStop(.49,m.color);g.addColorStop(.52,m.accent);g.addColorStop(.58,m.color);g.addColorStop(1,m.shadow||'#48563b');return g;
 }
 function driver(body,hx,hy,wx,wy,k){
  bpoly(body,[[hx-.13,hy-.32],[hx+.11,hy-.32],[hx+.15,hy-.12],[hx-.09,hy-.09]],'#414d3b');
  const head=bodyPoint(body,hx,hy+.025);circle(...head,k*.12,'#b6a27d');
  bpoly(body,[[hx-.14,hy+.09],[hx-.08,hy+.17],[hx+.10,hy+.15],[hx+.18,hy+.08]],'#4f6551');
  bodyLine(body,hx-.10,hy+.055,hx+.15,hy+.055,'#324736',.025);bodyLine(body,hx+.08,hy-.16,wx-.10,wy+.08,'#b49c77',.06);
  bodyLine(body,wx-.14,wy+.1,wx+.05,wy+.08,'#1c3023',.07);
 }
 function rig(body,wheels,preview=false){
  originalTruck(body,wheels,preview);const m=vehicleLook(preview?currentVehicle():sim.vehicle);
  // Integrated accessories: protective rails, reflective tape, roof rack and dirt.
  if(m.id==='rover'||m.id==='mule'){
   bodyLine(body,m.width-.1,.02,m.width+.10,.13,'#243426',.10);
   bodyLine(body,.16,1.23,.99,1.26,'#374c35',.06);
   for(let i=0;i<4;i++)bodyLine(body,-1.52+i*.28,.15,-1.37+i*.28,.15,'#ddd5af',.035);
   vehicleText(body,.71,.28,m.name,'#f0dbb2',.14);
   bpoly(body,[[.18,.61],[.30,1.05],[.95,1.10],[.56,.87]],'#cfdfbc14');
  }
  if(!preview&&save.effects){
   const dirt=CP.surfaceAt(body.getPosition().x,sim.id).type;const dirty=sim.distance/200;
   ctx.globalAlpha=Math.min(.45,dirty*.25);
   for(let i=0;i<14;i++)circle(...bodyPoint(body,-m.width+hash(i+7)*m.width*2,.04+hash(i+71)*.2),Math.max(.6,scale*(.025+hash(i+28)*.018)),dirt==='snow'?'#d8dfbd':'#857b50');ctx.globalAlpha=1;
  }
 }
 function menuScene(){
  background();const y=H*.76;
  const floor=ctx.createLinearGradient(0,y-10,0,H);floor.addColorStop(0,'#687557');floor.addColorStop(.08,'#47583c');floor.addColorStop(1,'#233723');ctx.fillStyle=floor;ctx.fillRect(0,y,W,H-y);line(0,y,W,y,'#b8b389',3);
  for(let i=0;i<60;i++){const x=hash(i+8)*W,py=y+hash(i+23)*(H-y);line(x,py,x+2+hash(i)*9,py,'#a4b1871b',1);}
  const carScale=Math.min(W*.095,H*.175),x=W*.745;
  ctx.save();ctx.globalAlpha=.33;ctx.fillStyle='#07160d';ctx.beginPath();ctx.ellipse(x,y+7,carScale*2.15,carScale*.13,0,0,Math.PI*2);ctx.fill();ctx.restore();
  previewRig(x,y-carScale*(.5+currentVehicle().radius),carScale,false);
  // A distant trail marker visually grounds the truck in the expedition.
  const postx=W*.48;line(postx,y,postx,y-H*.2,'#566b43',4);path([[postx-12,y-H*.2],[postx+27,y-H*.2],[postx+35,y-H*.17],[postx+27,y-H*.14],[postx-12,y-H*.14]],'#a3ae78','#4e6042',1);
  ctx.fillStyle='#475b38';ctx.font='700 9px sans-serif';ctx.textAlign='center';ctx.fillText('17',postx+10,y-H*.157);
 }
 function garageScene(){
  const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#35483b');g.addColorStop(.45,'#273b2b');g.addColorStop(1,'#1b2b20');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(let x=20;x<W*.49;x+=38){line(x,0,x,H*.77,'#65745722',2);line(x+3,0,x+3,H*.77,'#132d1d50',1);}
  const y=H*.77;ctx.fillStyle='#293c28';ctx.fillRect(0,y,W,H-y);
  for(let x=-W;x<W;x+=60)line(W*.25,y,x,H,'#aab8901a',1);
  ctx.fillStyle='#72836a';ctx.fillRect(W*.11,H*.19,W*.27,3);for(let i=0;i<5;i++){line(W*.14+i*W*.042,H*.20,W*.14+i*W*.042,H*.25,'#c3c8a585',1.5);circle(W*.14+i*W*.042,H*.263,2,'#abb99a');}
  const k=Math.min(W*.068,H*.142),x=W*.235;
  ctx.fillStyle='#182b1c';ctx.fillRect(x-k*2.6,y+9,k*5.2,7);for(const o of [-1.8,1.8])line(x+o*k,y+10,x+o*k,y+25,'#405c36',5);
  ctx.save();ctx.fillStyle='#101d13';ctx.globalAlpha=.4;ctx.beginPath();ctx.ellipse(x,y,k*2.1,k*.16,0,0,Math.PI*2);ctx.fill();ctx.restore();
  previewRig(x,y-k*(.5+currentVehicle().radius),k,false);
  const lampx=W*.23;line(lampx,0,lampx,H*.28,'#16291c',3);path([[lampx-20,H*.28],[lampx+20,H*.28],[lampx+27,H*.30],[lampx-27,H*.30]],'#9eae85');line(lampx-24,H*.302,lampx+24,H*.302,'#ead5a4',2);
  ctx.fillStyle='#d0c5a557';ctx.font='8px sans-serif';ctx.textAlign='left';ctx.fillText('МАСТЕРСКАЯ / ЛИСИЙ БРОД',W*.08,H*.91);
 }
 function drawPremium(dt){originalDraw(dt);}
 return {background,terrain,wheel,metal,driver,rig,menuScene,garageScene,draw:drawPremium,
  stats:()=>({...cacheStats,soilTiles:soilCache.size})};
})();
background=ExpeditionArt.background;terrain=ExpeditionArt.terrain;vehicleWheel=ExpeditionArt.wheel;
vehicleMetal=ExpeditionArt.metal;drawMax=ExpeditionArt.driver;truck=ExpeditionArt.rig;
menuScene=ExpeditionArt.menuScene;garageScene=ExpeditionArt.garageScene;draw=ExpeditionArt.draw;
