'use strict';
/* Illustrated roadside architecture. A bounded canvas cache keeps its joinery,
 * corrugation, equipment and lighting out of the per-frame command stream. */
const DepotArt20=(()=>{
 const sprites=new Map();
 function sprite(kind,region){
  const key=kind+':'+(region===5?'snow':region===2?'night':'day');if(sprites.has(key))return sprites.get(key);
  const c=document.createElement('canvas');c.width=720;c.height=360;const a=c.getContext('2d');
  const snow=region===5,night=region===2,medical=kind==='clinic',shop=kind==='service',hall=kind==='warehouse'||kind==='receiver',tank=kind==='tank';
  const poly=(p,fill,stroke='#25382e',w=2)=>{a.beginPath();p.forEach((q,n)=>n?a.lineTo(...q):a.moveTo(...q));a.closePath();if(fill){a.fillStyle=fill;a.fill();}if(stroke){a.strokeStyle=stroke;a.lineWidth=w;a.stroke();}};
  const rect=(x,y,w,h,fill)=>{a.fillStyle=fill;a.fillRect(x,y,w,h);};
  const line=(x,y,xx,yy,col,w=1)=>{a.strokeStyle=col;a.lineWidth=w;a.beginPath();a.moveTo(x,y);a.lineTo(xx,yy);a.stroke();};
  const disk=(x,y,r,col)=>{a.fillStyle=col;a.beginPath();a.arc(x,y,r,0,Math.PI*2);a.fill();};
  const text=(x,y,t,size=13,col='#e8debe')=>{a.fillStyle=col;a.font='600 '+size+'px sans-serif';a.fillText(t,x,y);};
  const wood=medical?'#b6c1ad':shop?'#677d76':hall?'#738074':'#887e5c',roof=snow?'#e3e9dc':'#59685e';
  // Shadow and layered concrete foundation ground the building on its apron.
  a.fillStyle='#0c211d32';a.beginPath();a.ellipse(342,327,275,20,0,0,Math.PI*2);a.fill();
  poly([[93,303],[523,303],[581,323],[146,334]],'#707c65');poly([[146,334],[581,323],[581,331],[146,342]],'#394f40');
  if(tank){
   const metal=a.createLinearGradient(150,0,440,0);metal.addColorStop(0,'#526e67');metal.addColorStop(.4,'#c5d1bd');metal.addColorStop(.7,'#8fa59b');metal.addColorStop(1,'#4d7068');
   rect(195,79,259,226,metal);a.fillStyle='#c6d0bb';a.beginPath();a.ellipse(324,79,129,25,0,0,Math.PI*2);a.fill();a.strokeStyle='#476a5b';a.lineWidth=3;a.stroke();
   for(const y of [111,246,296])line(195,y,454,y,'#3c5c50',5);rect(275,125,96,46,'#324e45');text(290,155,'900 L',24);rect(451,165,10,152,'#3e5b4b');for(let y=181;y<309;y+=19)line(451,y,472,y,'#b0bda4',3);line(472,165,472,316,'#3e5b4b',4);
   poly([[487,244],[530,244],[537,305],[485,305]],'#b7a370');rect(499,257,24,25,'#253f39');line(508,307,565,307,'#253c34',8);text(244,63,'ПЕРЕКАЧКА',16);
  }else{
   const left=hall?94:137,right=hall?535:492,top=hall?123:136,base=298;
   poly([[left,top],[right,top],[right,base],[left,base]],wood);
   poly([[right,top],[right+57,top-22],[right+57,base-21],[right,base]],medical?'#809583':'#435e50');
   for(let y=top+12;y<base;y+=12){line(left,y,right,y,'#243b2b55',2);line(left+3,y+2,right-2,y+2,'#e9dec122',1);}
   for(let x=right+7;x<right+55;x+=9)line(x,top-18,x,base-18,'#afbaa13b',2);
   // A shallow gable with fascia, standing seams and snow on the eaves.
   poly([[left-23,top],[left+70,top-67],[right-38,top-67],[right+26,top]],roof);
   poly([[right-38,top-67],[right+26,top],[right+81,top-24],[right+18,top-85]],snow?'#b5c5b8':'#344d42');
   for(let x=left+2;x<right;x+=25)line(x,top-6,x+38,top-62,snow?'#b7c2ad':'#89988b',1.5);
   line(left-24,top,right+28,top,snow?'#f1f0de':'#aeb5a0',5);line(right+28,top,right+81,top-24,'#95a893',4);
   if(!snow){poly([[left+90,top-53],[left+165,top-53],[left+135,top-11],[left+60,top-11]],'#5d6d61',null);for(let n=0;n<7;n++)line(left+72+n*10,top-15,left+102+n*10,top-49,'#354c40',1);}
   // Main bay: a real interior silhouette and warm glazing, not a flat door.
   const doorX=shop?260:hall?289:325,doorW=hall?164:shop?143:54;
   rect(doorX-5,top+30,doorW+10,base-top-24,'#a7b39b');rect(doorX,top+36,doorW,base-top-36,'#172c24');
   if(shop||hall){rect(doorX+3,top+39,doorW-6,25,'#718576');for(let y=top+44;y<top+63;y+=6)line(doorX+3,y,doorX+doorW-3,y,'#384f41',2);rect(doorX+10,base-36,doorW-20,29,'#2b4135');
    rect(doorX+20,base-57,43,29,'#8e8460');rect(doorX+25,base-72,43,16,'#a3976c');for(const x of [doorX+32,doorX+55])line(x,base-69,x,base-30,'#d3c597',3);
    if(shop){rect(doorX+74,base-35,43,14,'#d2a176');disk(doorX+83,base-20,10,'#111f1a');disk(doorX+110,base-20,10,'#111f1a');line(doorX+83,base-39,doorX+102,base-51,'#536c5b',4);}
   }else{rect(doorX+7,top+45,doorW-14,51,night?'#dcc49a':'#405d56');line(doorX+doorW-10,base-59,doorX+doorW-10,base-47,'#c6bc93',3);}
   for(const x of medical?[172,246,411]:[left+31,right-55]){
    rect(x-5,top+40,44,62,'#354f40');rect(x,top+45,34,49,night?'#d8c193':'#688d83');rect(x+3,top+49,11,40,night?'#f0d2a7':'#a4b8a1');line(x+17,top+45,x+17,top+95,'#d2d2b4',3);line(x,top+68,x+34,top+68,'#c6c5a6',3);rect(x-6,top+99,47,5,'#d5cfab');}
   // Covered loading apron, stairs, rails, drainpipe, lamp and station sign.
   if(!hall&&!shop){poly([[left-10,base-18],[right+14,base-18],[right+28,base],[left-17,base]],'#b1ac86');for(const y of [base+1,base+10,base+19])rect(309,y,96,5,'#89967b');}
   const signY=top+7;rect(left+24,signY,right-left-48,25,medical?'#d4d8c1':'#2d493c');text(left+36,signY+18,medical?'МЕДПУНКТ':shop?'МАСТЕРСКАЯ':hall?(kind==='receiver'?'ПРИЁМ ГРУЗА':'ОТГРУЗКА / ЛИСИЙ БРОД'):'ЛЕСНОЙ ПОСТ',hall?15:16,medical?'#405b4b':'#e6d7ad');
   if(medical){rect(right+8,top+19,35,35,'#dedfc9');rect(right+20,top+25,10,23,'#b77c64');rect(right+14,top+32,23,10,'#b77c64');}
   line(left-9,top+3,left-9,base+7,'#40584a',4);line(left-9,base+7,left+2,base+7,'#40584a',4);rect(right-10,top+31,9,6,'#e2cca2');
   if(hall||shop){for(let n=0;n<3;n++){const x=102+n*36;rect(x,base+8,31,29,'#a08c5e');line(x+3,base+10,x+28,base+32,'#cebb85',3);line(x+28,base+10,x+3,base+32,'#cebb85',3);}rect(91,base+38,123,5,'#4c6346');
    rect(567,base-11,70,24,'#b7975a');rect(574,base-29,41,18,'#d5b277');disk(582,base+13,12,'#1b2c23');disk(625,base+13,12,'#1b2c23');line(636,base-58,636,base+20,'#617460',5);line(636,base+17,673,base+17,'#617460',4);}
  }
  // Human scale at the apron: worker with helmet, two legs and an arm.
  const hx=tank?550:hall?478:medical?435:121;line(hx-5,318,hx-4,300,'#293d31',5);line(hx+6,318,hx+3,300,'#293d31',5);poly([[hx-9,277],[hx+7,277],[hx+10,300],[hx-9,300]],'#c09158',null);disk(hx,268,8,'#ba9d76');rect(hx-10,260,20,6,'#dbc18e');line(hx+8,282,hx+18,288,'#b9a584',4);
  sprites.set(key,c);if(sprites.size>8)sprites.delete(sprites.keys().next().value);return c;
 }
 function building(kind,x,y,region,width=9){const base=Math.max(y,CP.height(x-width*.27,sim.id),CP.height(x+width*.27,sim.id));if(base-y>.15){for(const off of [-.27,.25]){const q=x+width*off;line(sx(q),sy(base)-1,sx(q),sy(CP.height(q,sim.id))+2,'#425b44',scale*.10);}y=base;}const image=sprite(kind,region),w=scale*width;ctx.drawImage(image,sx(x)-w*.5,sy(y)-w*340/720,w,w*.5);}
 function bay(x,done,index){const k=scale,y=CP.height(x,sim.id),col=done?'#a8c195':'#e3b479';ctx.beginPath();for(let q=x-3.1;q<x+3.1;q+=.5){ctx.moveTo(sx(q),sy(CP.groundHeight(q,sim.id))-2);ctx.lineTo(sx(q+.25),sy(CP.groundHeight(q+.25,sim.id))-2);}ctx.strokeStyle=col;ctx.lineWidth=Math.max(2,k*.08);ctx.stroke();const px=sx(x),py=sy(y);line(px,py,px,py-k*2.1,'#9ca88b',k*.04);circle(px,py-k*2.1,k*.28,col);ctx.fillStyle='#233b2c';ctx.font='bold '+Math.round(k*.28)+'px sans-serif';ctx.textAlign='center';ctx.fillText(done?'✓':String(index),px,py-k*2.0);ctx.textAlign='left';}
 function visible(x){return sx(x)>-scale*8&&sx(x)<W+scale*8;}
 function landmark(mark){if(!visible(mark.x))return;building(/МЕД|ПРИЮТ|ТЁПЛ/.test(mark.text)?'clinic':'post',mark.x,CP.height(mark.x,sim.id),sim.route.region,7);}
 return {building,bay,visible,landmark,stats:()=>({sprites:sprites.size})};
})();
dispatchDepot=function(){if(!sim)return;for(const [x,kind] of [[-1,'warehouse'],[sim.route.length+12,'receiver']])if(DepotArt20.visible(x))DepotArt20.building(kind,x,CP.height(x,sim.id),sim.route.region,12);};
deliveryDepots=function(){if(!sim||sim.fluidCapacity)return;for(const stop of sim.stops){if(!DepotArt20.visible(stop.x))continue;DepotArt20.bay(stop.x,stop.done,stop.index+1);const x=stop.x+5;DepotArt20.building(/МЕД|ПРИЮТ|ТЁПЛ/.test(stop.name)?'clinic':'post',x,CP.height(x,sim.id),sim.route.region,7);if(stop.done){const box=sim.boxes.find(b=>b.delivered&&b.stopIndex===stop.index);if(box)crate({...box,body:{getPosition:()=>({x:stop.x+4.25,y:CP.height(stop.x,sim.id)+.39}),getAngle:()=>0}});}}};
roadsideDepots=function(){if(!sim)return;for(const site of sim.services){if(!DepotArt20.visible(site.x))continue;DepotArt20.bay(site.x,site.done,'+');DepotArt20.building('service',site.x+6,CP.height(site.x+6,sim.id),sim.route.region,9);}};
tankerDepots=function(){if(!sim||!sim.fluidCapacity)return;for(const stop of sim.stops){if(!DepotArt20.visible(stop.x))continue;DepotArt20.bay(stop.x,stop.done,stop.index+1);const x=stop.x+5,y=CP.height(x,sim.id);DepotArt20.building('tank',x,y,sim.route.region,7);if(stop.elapsed>0&&!stop.done){const nozzle=bodyPoint(sim.car,-1.93,.55);ctx.beginPath();ctx.moveTo(...nozzle);ctx.bezierCurveTo(nozzle[0]+scale*.3,nozzle[1]+scale*.5,sx(x)-scale,sy(y),sx(x),sy(y)-scale*.4);ctx.strokeStyle='#243c31';ctx.lineWidth=scale*.065;ctx.stroke();}}};
