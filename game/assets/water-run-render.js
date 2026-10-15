'use strict';
const WaterRunArt22=(()=>{
 const cache=new Map();
 function sprite(kind,on){const key=kind+':'+on;if(cache.has(key))return cache.get(key);const c=document.createElement('canvas');c.width=720;c.height=420;const a=c.getContext('2d');
  const rect=(x,y,w,h,col)=>{a.fillStyle=col;a.fillRect(x,y,w,h);},line=(x,y,xx,yy,col,w=2)=>{a.beginPath();a.moveTo(x,y);a.lineTo(xx,yy);a.strokeStyle=col;a.lineWidth=w;a.stroke();},disk=(x,y,r,col)=>{a.beginPath();a.arc(x,y,r,0,Math.PI*2);a.fillStyle=col;a.fill();},poly=(p,col)=>{a.beginPath();p.forEach((v,i)=>i?a.lineTo(...v):a.moveTo(...v));a.closePath();a.fillStyle=col;a.fill();};
  a.fillStyle='#102b2538';a.beginPath();a.ellipse(365,389,304,19,0,0,Math.PI*2);a.fill();
  if(kind==='pump'){
   rect(80,367,534,17,'#788675');poly([[80,367],[121,347],[647,347],[614,367]],'#a3ac91');
   rect(156,194,350,158,'#778b79');poly([[506,194],[572,166],[572,328],[506,352]],'#46645c');poly([[124,195],[191,115],[490,115],[535,195]],'#67796b');poly([[490,115],[551,89],[599,166],[535,195]],'#3a574e');
   for(let x=151;x<518;x+=25)line(x,188,x+49,125,'#9caa8a',2);line(123,194,535,194,'#c0c9ab',5);
   rect(239,230,175,122,'#273f37');rect(245,234,163,18,'#95a18c');for(let y=258;y<350;y+=15)line(245,y,409,y,'#476155',1);
   for(const x of [176,442]){rect(x,222,43,57,'#324e47');rect(x+5,227,33,45,on?'#d3c993':'#8ba293');line(x+22,227,x+22,272,'#bdc9a8',3);}
   rect(188,205,284,20,'#304e42');a.fillStyle='#e0d4ae';a.font='600 15px sans-serif';a.fillText('НАСОСНАЯ / ЛИСИЙ БРОД',205,221);
   // Intake pipe, manifold, pressure gauge and handwheel.
   line(81,367,81,290,'#36554e',29);line(81,290,181,290,'#36554e',29);line(81,367,81,290,'#8eaa98',19);line(81,290,181,290,'#8eaa98',19);for(const x of [110,164])rect(x,271,7,38,'#bdcbb2');
   disk(134,256,17,'#2b4a40');disk(134,256,12,'#d2d6b8');line(134,256,on?143:126,on?248:262,'#b37a53',3);line(134,273,134,289,'#779888',6);
   line(540,318,629,318,'#86a391',19);line(622,314,622,268,'#86a391',13);disk(622,258,19,'#b37f59');disk(622,258,12,'#395b4d');line(604,258,640,258,'#c3996a',3);line(622,240,622,276,'#c3996a',3);
   rect(583,194,47,75,'#4b6a5e');rect(589,201,35,48,'#a2b59a');disk(606,216,5,on?'#e2c776':'#4e6353');line(582,270,582,347,'#3b5548',5);
   rect(260,340,135,12,'#a7ad91');
  }else{
   // Braced steel tower, cylindrical reservoir, ladder and village standpipe.
   poly([[163,367],[211,136],[243,136],[222,367]],'#526e61');poly([[465,367],[429,136],[463,136],[515,367]],'#3b594e');
   for(const y of [198,274,350]){line(203,y,488,y,'#789081',7);line(203,y,480,y+67,'#627e6d',5);line(480,y,217,y+67,'#627e6d',5);}
   const g=a.createLinearGradient(179,0,488,0);g.addColorStop(0,'#536f67');g.addColorStop(.4,'#becdb4');g.addColorStop(.7,'#8fa998');g.addColorStop(1,'#42675d');rect(177,86,311,107,g);a.fillStyle='#c2cfb7';a.beginPath();a.ellipse(332,86,155,33,0,0,Math.PI*2);a.fill();a.strokeStyle='#56786b';a.lineWidth=3;a.stroke();
   for(const y of [108,175,192])line(177,y,488,y,'#527164',5);rect(261,116,143,40,'#34594c');a.fillStyle='#e2d7b7';a.font='600 20px sans-serif';a.fillText('ЛИСИЙ БРОД',268,143);
   line(486,97,486,366,'#b7c5a8',5);line(512,92,512,366,'#8ba58e',5);for(let y=108;y<366;y+=16)line(486,y,512,y,'#b4c7aa',3);
   line(414,186,414,363,'#547d6e',18);line(414,363,615,363,'#547d6e',18);line(607,359,607,289,'#9ab7a1',12);line(607,292,649,292,'#9ab7a1',12);disk(608,274,14,'#b59160');line(596,274,620,274,'#e0bc78',3);
   rect(550,378,112,9,'#788d76');rect(577,343,47,37,'#8ca198');rect(581,348,38,25,'#2d5148');if(on){line(649,298,649,369,'#87c8c3',6);line(651,311,651,367,'#c3e5d0',2);}
   line(97,381,97,331,'#2e473c',10);line(112,381,112,331,'#2e473c',10);rect(91,300,30,34,'#b68e5d');disk(106,285,11,'#c6a87d');rect(91,272,31,9,'#d7b974');line(118,313,143,305,'#c6aa82',7);
  }
  cache.set(key,c);return c;
 }
 function building(kind,x,on,width=11){if(!sim||!DepotArt20.visible(x))return;const y=CP.height(x,sim.roadId),w=scale*width;ctx.drawImage(sprite(kind,on),sx(x)-w*.5,sy(y)-w*390/720,w,w*420/720);}
 return {building,preview:(kind,on)=>sprite(kind,on).toDataURL(),stats:()=>({sprites:cache.size})};
})();
(function(){
 const oldCrate=crate;crate=function(box){if(box.kind==='controls'){const b=box.body;bpoly(b,[[-.27,-.27],[.27,-.27],[.27,.27],[-.27,.27]],'#2f4941','#c6ccaa',scale*.023);bpoly(b,[[-.22,-.23],[.22,-.23],[.22,.24],[-.22,.24]],'#6c8276','#bcc7ac',scale*.018);bpoly(b,[[-.14,.02],[.14,.02],[.14,.17],[-.14,.17]],'#2d4941');for(const x of [-.11,0,.11]){const p=bodyPoint(b,x,-.11);circle(...p,scale*.025,x===0?'#d6b776':'#a7bea2');}return;}if(box.kind!=='pump'){oldCrate(box);return;}const b=box.body,k=scale;
  bpoly(b,[[-.56,-.40],[.56,-.40],[.56,-.29],[-.56,-.29]],'#7c9082','#283f36',k*.025);bpoly(b,[[-.45,-.28],[.13,-.28],[.13,.30],[-.45,.30]],'#82968a','#314e43',k*.025);
  for(let x=-.39;x<.1;x+=.08)bodyLine(b,x,-.20,x,.22,'#bfd0b5',.022);const q=bodyPoint(b,.28,0);circle(...q,k*.29,box.lost?'#7c816b':'#b49b69');circle(...q,k*.20,'#576e60');circle(...q,k*.07,'#d1c296');
  bodyLine(b,.30,.17,.30,.40,'#8aa496',.15);bodyLine(b,.30,.40,.53,.40,'#8aa496',.15);bodyLine(b,.53,.29,.53,.49,'#d2d6b8',.045);bodyLine(b,.39,-.11,.56,-.11,'#8ca596',.13);bodyLine(b,.56,-.22,.56,0,'#c4cfb0',.04);
 };
 const oldStraps=cargoStraps;cargoStraps=function(){if(!sim||sim.edition!==22){oldStraps();return;}if(dispatch.phase)return;for(const box of sim.boxes)if(!box.delivered&&!box.lost)for(const joint of [box.strap,box.strap2])if(joint){const a=joint.getAnchorA(),b=joint.getAnchorB();line(sx(a.x),sy(a.y),sx(b.x),sy(b.y),'#d6bf85',Math.max(1,scale*.026));}};
 const oldDepots=deliveryDepots;deliveryDepots=function(){if(!sim||sim.edition!==22){oldDepots();return;}const stop=sim.stops[0];if(DepotArt20.visible(stop.x)){DepotArt20.bay(stop.x,stop.done,'1');WaterRunArt22.building('pump',stop.x+6,stop.done,10);if(stop.done)crate({...sim.boxes[0],body:{getPosition:()=>({x:stop.x+4.25,y:CP.height(stop.x,sim.roadId)+.4}),getAngle:()=>0}});}};
 const oldDispatch=dispatchDepot;dispatchDepot=function(){if(!sim||sim.edition!==22){oldDispatch();return;}if(DepotArt20.visible(-1))DepotArt20.building(save.workshopPowered?'workshop-on':'workshop-off',-1,0,0,12);WaterRunArt22.building('tower',sim.route.length+11,save.villageWater,13);};
})();
