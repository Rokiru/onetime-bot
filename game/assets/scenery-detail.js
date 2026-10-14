'use strict';
// Continuous land/water planes cover the entire view, including deep valleys.
// Objects use world cell IDs, so movement and tile boundaries never reroll detail.
function sceneryY(depth){return Math.max(-H*.13,Math.min(H*.17,cam.y*scale*depth));}
function sceneryContour(n,layer){return H*(.66+layer*.08)+sceneryY(.10+layer*.035)-H*(.015+hash(n+layer*91)*.05);}
function sceneryCabin(x,y,k,night,snow){
 ctx.fillStyle=night?'#253e47':'#5a7761';ctx.fillRect(x,y-k*.62,k,k*.62);
 path([[x-k*.09,y-k*.62],[x+k*.45,y-k*.99],[x+k*1.09,y-k*.62]],snow?'#e1e9dc':night?'#213642':'#49625a');
 if(save.quality!=='low'){for(let i=1;i<6;i++)line(x,y-k*i*.10,x+k,y-k*i*.10,night?'#819ca617':'#233c3a38',1);line(x+k*.04,y-k*.61,x+k*.45,y-k*.9,'#d1d7ac40',1);}
 ctx.fillStyle=night?'#edd498':'#a7c0ac';ctx.fillRect(x+k*.16,y-k*.44,k*.18,k*.2);ctx.fillRect(x+k*.62,y-k*.44,k*.18,k*.2);line(x+k*.25,y-k*.44,x+k*.25,y-k*.24,'#384f49',1);
 ctx.fillStyle='#2b4845';ctx.fillRect(x+k*.41,y-k*.39,k*.15,k*.39);ctx.fillStyle=night?'#354e54':'#586c5a';ctx.fillRect(x+k*.70,y-k*.95,k*.12,k*.24);
 if(save.effects){ctx.strokeStyle='#c5d3c82b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+k*.76,y-k*.97);ctx.bezierCurveTo(x+k*.6,y-k*1.08,x+k*.95,y-k*1.14,x+k*.74,y-k*1.25);ctx.stroke();}
}
function sceneryGrove(x,y,k,n,id){
 if(id===5){ScenerySprites.pine(ctx,x,y,k,'#456878',save.quality,true);return;}
 if(Math.abs(n)%4!==0&&id!==4){pine(x,y,k,id===2?'#193c43':'#28594a');return;}
 ScenerySprites.grove(ctx,x,y,k,n,id,save.quality);
}
function detailedScenery(id,night){
 const low=save.quality==='low',water=id===3||id===4;
 if(water){const horizon=H*(id===3?.48:.58)+sceneryY(.055),g=ctx.createLinearGradient(0,horizon,0,H);g.addColorStop(0,id===3?'#84beba':'#547f71');g.addColorStop(.35,id===3?'#4d999c':'#3c6e63');g.addColorStop(1,id===3?'#244f65':'#254d45');ctx.fillStyle=g;ctx.fillRect(0,horizon,W,H-horizon+1);
  // Irregular short reflections have no common lower edge.
  for(let j=0;j<(low?18:65);j++){const row=hash(j+90),x=(hash(j+700)*W-cam.x*scale*.045+j*3)%(W+70),y=horizon+row*(H-horizon);line(x,y,x+8+row*33,y,'#d2ede42a',.6+row);}
 }
 const landColors=id===1?['#837e66','#656e59','#4e6253']:id===5?['#94b5bb','#72959f','#547b8c']:night?['#294953','#22434a','#19383f']:id===4?['#587c63','#426b55','#315a49']:['#638c70','#477759','#315e4b'];
 const layers=low?2:3;
 for(let layer=0;layer<layers;layer++){
  const depth=.12+layer*.07,cell=low?125:92,shift=cam.x*scale*depth,begin=Math.floor(shift/cell)-2,end=begin+Math.ceil(W/cell)+5;
  const base=n=>sceneryContour(n,layer)+(id===3?H*.10:0);const pts=[];for(let n=begin;n<=end;n++)pts.push([n*cell-shift,base(n)]);
  path([[pts[0][0],H+H*.3],...pts,[pts[pts.length-1][0],H+H*.3]],id===3?['#78947a','#567d6a','#396455'][layer]:landColors[layer]);
  for(let n=begin;n<end;n++){
   const x=n*cell-shift,y=base(n),k=H*(.11+hash(n+layer*83)*.075);
   if(id===1||id===3){if(id===1||Math.abs(n)%3===0){path([[x-cell*.25,y+2],[x-cell*.20,y-k*.20],[x-cell*.05,y-k*.30],[x+cell*.16,y-k*.19],[x+cell*.24,y+3]],id===3?'#789582':'#8b8971');path([[x-cell*.05,y-k*.30],[x+cell*.16,y-k*.19],[x+cell*.24,y+3],[x+cell*.05,y-k*.05]],'#284a3e27');if(!low){line(x-cell*.17,y-k*.16,x+cell*.12,y-k*.10,'#d0c3a839',1);line(x-cell*.15,y-k*.05,x+cell*.20,y-k*.01,'#273f3a40',1);}}}
   else sceneryGrove(x,y,k,n,id);
   if(layer===0&&Math.abs(n)%5===0&&id!==1){if(id===3){const py=H*.53+sceneryY(.055);path([[x-14,py],[x+29,py],[x+20,py+7],[x-8,py+7]],'#416670');line(x+7,py,x+7,py-36,'#69847d',1.5);path([[x+9,py-35],[x+9,py-2],[x+29,py-2]],'#e2e4c6');}else sceneryCabin(x+cell*.38,y,H*.095,night,id===5);}
   if(layer===1&&id===1&&Math.abs(n)%4===0){const top=y-k*1.45;line(x,y,x,top,'#4c5c50',3);line(x,top,x+cell*1.3,top+k*.12,'#576254',3);line(x,top,x+cell*.6,top-k*.16,'#61745c',1);line(x+cell*.6,top-k*.16,x+cell*1.3,top+k*.12,'#61745c',1);line(x+cell,top+k*.1,x+cell,y-k*.3,'#455c4f',1);ctx.fillStyle='#b39d6359';ctx.fillRect(x-7,top+3,14,10);}
   if(!low&&layer===1&&id===3&&Math.abs(n)%7===0){const h=H*.19,top=y-h;path([[x-9,y],[x-6,top],[x+6,top],[x+10,y]],'#c9d2ad');for(let j=0;j<3;j++)path([[x-8,y-h*(.13+j*.27)],[x+9,y-h*(.13+j*.27)],[x+8,y-h*(.23+j*.27)],[x-7,y-h*(.23+j*.27)]],'#987e6a');ctx.fillStyle='#466d75';ctx.fillRect(x-8,top-9,16,9);path([[x-11,top-9],[x,top-16],[x+11,top-9]],'#315361');circle(x,top-4,2,'#f0d897');line(x+14,y+2,x+55,y+2,'#9aa481',2);for(let off of [18,37,52])line(x+off,y+2,x+off,y+9,'#557464',2);}
   if(!low&&layer===1&&night&&Math.abs(n)%4===0){sceneryCabin(x+30,y,H*.075,true,false);sceneryCabin(x+63,y+3,H*.055,true,false);const top=y-H*.14;line(x+13,y,x+13,top,'#314e53',2);line(x+13,top,x+26,top,'#314e53',2);circle(x+26,top,2,'#dacb97');}
   if(!low&&layer===2){
    for(let j=0;j<10;j++){const px=x+hash(n*31+j)*cell,py=y+H*(.03+hash(n*67+j)*.25);circle(px,py,.6+hash(n*53+j)*1.5,id===5?'#dce9df20':'#b8bd7f14');}
    if(id===4){for(let j=0;j<5;j++){const px=x+j*7,py=y+4;line(px,py,px-2,py-12-hash(n+j)*10,'#869b68',1);line(px-2,py-17,px-2,py-25,'#b3996450',2);}}
    if(id===0&&Math.abs(n)%6===0){const py=y+7;ctx.fillStyle='#715e43';ctx.fillRect(x,py-7,8,7);path([[x-3,py],[x+11,py],[x+8,py-3],[x,py-3]],'#574f39');ctx.fillStyle='#ae9963';ctx.fillRect(x-1,py-8,10,2);for(let j=0;j<3;j++)line(x+15+j*6,py-7,x+15+j*6,py+2,'#a1a88680',1);line(x+14,py-4,x+29,py-4,'#89957460',1);}
   }
   if(layer===2&&!low){for(let j=0;j<4;j++){const px=x+j*cell*.23,py=y+H*(.03+hash(n+j)*.065);if(id===1||id===3){path([[px,py],[px+5,py-4],[px+12,py],[px+7,py+3]],'#c8c7a220');}else line(px,py,px-2,py-5-hash(n+j)*7,id===5?'#d4e6da38':'#a5b97b42',1);}}
  }
 }
 if(!low){
  // Meandering streams and layered quarry strata add detail below the skyline.
  const shift=cam.x*scale*.22;
  ctx.save();ctx.globalAlpha=.25;
  if(id===1){for(let j=0;j<3;j++){ctx.strokeStyle=j%2?'#c6b68a':'#243e36';ctx.lineWidth=2;ctx.beginPath();for(let x=-30;x<W+40;x+=25){const y=H*(.84+j*.045)+sceneryY(.17)+Math.sin((x+shift)*.005+j)*H*.022;x===-30?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}}
  else if(id===0||id===4){ctx.strokeStyle=id===4?'#91c1a9':'#8bbeb3';ctx.lineWidth=H*.011;ctx.beginPath();for(let x=-30;x<W+40;x+=20){const y=H*.87+sceneryY(.18)+Math.sin((x+shift)*.008)*H*.035;x===-30?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
  ctx.restore();
 }
}
