'use strict';
// Vector details are rasterized once, then reused at subpixel world positions.
// Native transparent canvases keep this entirely offline and bound memory.
const ScenerySprites=(()=>{
 const cache=new Map(),limit=24;let hits=0,misses=0;
 function pine(target,x,y,size,color,quality,snow=false){
  const key=color+':'+(quality==='low'?'low':'detailed')+':'+snow;let sprite=cache.get(key);
  if(!sprite){misses++;const image=document.createElement('canvas'),k=192,d=2;image.width=k*d;image.height=Math.ceil(k*1.06)*d;const g=image.getContext('2d');g.scale(d,d);const cx=k/2,base=k*1.02;
   const polygon=(pts,fill)=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fillStyle=fill;g.fill();};
   const stroke=(a,b,c,e,fill,w)=>{g.beginPath();g.moveTo(a,b);g.lineTo(c,e);g.strokeStyle=fill;g.lineWidth=w;g.stroke();};
   g.fillStyle='#2a4032';g.fillRect(cx-k*.024,base-k*.32,k*.05,k*.34);stroke(cx-k*.012,base-k*.31,cx-k*.012,base,'#82905d50',k*.015);
   for(let j=0;j<7;j++){const at=j/7,yy=base-k+k*at*.84,width=k*(.06+at*.32),height=k*(.20+at*.06),tip=(hash(j+576)-.5)*k*.027;polygon([[cx+tip,yy],[cx-width,yy+height],[cx-width*.52,yy+height*.83],[cx-width*.11,yy+height],[cx+width*.19,yy+height*.84],[cx+width*.65,yy+height],[cx+width,yy+height*.94]],color);polygon([[cx+tip,yy],[cx-width,yy+height],[cx-width*.08,yy+height*.86]],'#172f3036');if(quality!=='low')for(let n=0;n<3;n++)stroke(cx,yy+height*.35,cx+width*(n%2?-.65:.66),yy+height*(.78+n*.06),'#b1c79e16',1);}
   if(snow)for(let j=1;j<5;j++)polygon([[cx,base-k*(1-j*.13)],[cx-k*j*.065,base-k*(.86-j*.13)],[cx+k*j*.065,base-k*(.86-j*.13)]],'#dce8dbaa');
   sprite=image;if(cache.size>=limit)cache.delete(cache.keys().next().value);cache.set(key,sprite);
  }else{hits++;cache.delete(key);cache.set(key,sprite);}
  target.drawImage(sprite,x-size*.5,y-size*1.02,size,size*1.06);
 }
 function grove(target,x,y,size,n,id,quality){
  const variant=((n%8)+8)%8,night=id===2,key='grove:'+night+':'+variant+':'+(quality==='low'?'low':'detailed');let sprite=cache.get(key);
  if(!sprite){misses++;const image=document.createElement('canvas'),k=128,d=2;image.width=Math.ceil(k*1.4)*d;image.height=Math.ceil(k*1.3)*d;const g=image.getContext('2d');g.scale(d,d);const cx=k*.7,base=k*1.15;g.strokeStyle=night?'#1e3941':'#3a5946';g.lineWidth=k*.055;g.beginPath();g.moveTo(cx,base);g.lineTo(cx-k*.025,base-k*.8);g.stroke();
   for(let j=0;j<6;j++){const px=cx+(j-2.5)*k*.095,py=base-k*(.68+hash(variant*7+j)*.16);g.beginPath();g.arc(px,py,k*(.16+hash(variant+j)*.05),0,Math.PI*2);g.fillStyle=night?'#234950':['#64886a','#426f58','#527e61'][j%3];g.fill();if(quality!=='low'){g.beginPath();g.arc(px-k*.04,py-k*.065,k*.06,0,Math.PI*2);g.fillStyle='#a7c79618';g.fill();}}
   sprite=image;if(cache.size>=limit)cache.delete(cache.keys().next().value);cache.set(key,sprite);
  }else{hits++;cache.delete(key);cache.set(key,sprite);}target.drawImage(sprite,x-size*.7,y-size*1.15,size*1.4,size*1.3);
 }
 return {pine,grove,get stats(){return {hits,misses,entries:cache.size,limit};}};
})();
