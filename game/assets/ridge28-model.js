'use strict';
(function(root){
 function create({routes,profiles,zones,landmarks,gaps,height}){
  const key='ridge:28',length=430;
  // The original 447-metre challenge remains an exact prefix. Each extension
  // has its own approach, landing room and level rest area.
  routes[key]={...routes['ridge:25'],name:'Гребень · большая серия',length};
  profiles[key]=[...profiles['ridge:25'].map(p=>p.slice()),[170,0],
   [183,3.2],[190,3.2],[197,.8],[202,.8],[208,-1.2],[213,-1.2],
   [228,4.6],[236,4.6],[244,1.4],[250,1.4],[258,0],[278,0],
   [296,6.0],[303,6.0],[315,.7],[321,.7],[329,3.3],[335,3.3],
   [344,-.6],[351,-.6],[369,5.7],[376,5.7],[385,2.0],[391,2.0],
   [399,-.4],[405,-.4],[416,0],[430,0]];
  gaps[key]={...gaps['ridge:25']};
  zones[key]=[{from:214,to:225,type:'gravel',friction:1.0,roughness:.06},{from:353,to:365,type:'gravel',friction:.98,roughness:.07}];landmarks[key]=[];
  const camps=[
   {x:82,value:100,next:250,name:'Первый привал',nextName:'За гребнем',tip:'Разгон до подъёма. Перед краем отпускай газ и лови посадку.'},
   {x:155,value:250,next:450,name:'У старого финиша',nextName:'Каменные полки',tip:'Два коротких спуска и подъём. Тормози до края, затем дай машине выкатиться.'},
   {x:270,value:450,next:750,name:'Перед перевалом',nextName:'Высокий перевал',tip:'Длинный подъём и несколько посадок подряд. Не разгоняйся на вершинах.'}
  ];
  const distance=length*3;
  function init(s){s.roadId=key;s.ridge28={edition:28,camp:0};return {...routes[key],boxes:s.ridge.load};}
  function valid(d){const r=d?.ridge28,q=d?.ridge25;if(!r||r.edition!==28||Object.keys(r).some(k=>!['edition','camp'].includes(k))||!Number.isInteger(r.camp)||r.camp<0||r.camp>3||!q||!d.groups||d.journey||d.expedition||d.waterRun||d.recoveryRun||d.course26||d.driving27)return false;
   if(r.camp===0)return q.stage===0&&!q.waiting;
   if(r.camp===1)return q.waiting?q.stage===0:q.stage===1;
   return q.stage===1;
  }
  function offer(s){return camps[s.ridge28.camp-1]||null;}
  function bankValue(s){return offer(s)?.value||0;}
  function proceed(s){if(!s.ridge.waiting||s.state!=='drive')return false;s.ridge.stage=1;s.ridge.waiting=false;s.fuel=100;s.condition=100;s.temperature=35;s.overheated=false;s.airDrop=0;s.airTicks=0;s.wasAir=false;s.ridge.airTime=0;s.ridge.peakFall=0;return true;}
  function deliver(s){if(!s.ridge.waiting||s.state!=='drive'||!s.remaining())return false;s.ridge.waiting=false;s.end('delivered');return true;}
  function score(s){if(s.state!=='win')return 0;const finished=s.car.getPosition().x>=length+6;return s.remaining()*(finished?750:bankValue(s))+s.ridge.landings;}
  function update(s,dt,wasAir){const r=s.ridge,p=s.car.getPosition(),v=s.car.getLinearVelocity(),air=s.groundCount===0;
   if(air){r.airTime=Math.min(10,r.airTime+dt);r.peakFall=Math.max(r.peakFall,-v.y);}else if(wasAir){const slope=Math.atan((height(p.x+1,key)-height(p.x-1,key))/2),a=Math.atan2(Math.sin(s.car.getAngle()-slope),Math.cos(s.car.getAngle()-slope));if(r.airTime>.20&&r.peakFall<7&&Math.abs(a)<.35&&s.remaining()&&p.x>r.awardX+6){r.awardX=p.x;const points=10*s.remaining();r.landings+=points;s.events.push({type:'ridgeLanding',points});}r.airTime=0;r.peakFall=0;}
   r.stallTime=Math.abs(v.x)<.15&&s.throttle>.2?Math.min(10,r.stallTime+dt):0;if(r.stallTime>=2&&r.stallTime-dt<2)s.events.push({type:'ridgeStall'});
   const a=Math.abs(Math.atan2(Math.sin(s.car.getAngle()),Math.cos(s.car.getAngle())));r.roofTime=a>2&&p.y<height(p.x,key)+2.3?r.roofTime+dt:0;if(r.roofTime>.35)s.end('flipped');
   const next=camps[s.ridge28.camp];if(s.state==='drive'&&next&&p.x>=next.x&&s.groundCount>=2&&a<.55){s.ridge28.camp++;r.waiting=true;s.events.push({type:'ridgeCamp'});}
  }
  function camera(s,w,h){
   const p=s.car.getPosition(),speed=Math.max(0,s.car.getLinearVelocity().x),look=Math.min(22,Math.max(12,9+speed*1.4));
   let low=Math.min(height(p.x,key),p.y-.7),high=p.y+1.4;
   for(const b of s.boxes)if(!b.lost)high=Math.max(high,b.body.getPosition().y+.4);
   for(let dx=2;dx<=look;dx+=2){const y=height(p.x+dx,key);low=Math.min(low,y);high=Math.max(high,y+.3);}
   const scale=Math.min(h/8,w/22,h*.52/Math.max(1,high-low));
   return {x:p.x+Math.min(5.4,2.2+speed*.3),y:(high+low)/2-h*.09/scale,scale};
  }
  return {key,length,distance,camps,init,valid,offer,bankValue,proceed,deliver,score,update,camera};
 }
 if(typeof module==='object')module.exports=create;else root.Ridge28Model=create;
})(typeof globalThis!=='undefined'?globalThis:this);
