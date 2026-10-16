'use strict';
(function(root){
 function create({routes,profiles,zones,landmarks,height,gaps}){
  const key='ridge:25',camp=82;
  const base={name:'Гребень',region:0,kind:'delivery',cargo:'ridge',requires:'rover',length:149,boxes:1,reward:0,seed:71,weather:'clear',fuelPoints:[],stops:[],services:[],sectors:[]};
  routes[key]={...base};profiles[key]=[[0,0],[16,0],[25,2.4],[28,2.4],[37,0],[43,1.8],[47,2.8],[51,.9],[55,.9],[57,.2],[67,4.5],[70,4.5],[80,.6],[87,.6],[96,4],[99,4],[108,-.5],[114,2],[120,-.5],[123,-.5],[132,5.5],[135,5.5],[143,0],[149,0]];
  gaps[key]={from:47,to:51,y:2.8,depth:3.5};zones[key]=[];landmarks[key]=[];
  function init(s,options={}){const load=options.load===3?3:1;s.roadId=key;s.ridge={load,stage:0,waiting:false,landings:0,awardX:0,airTime:0,peakFall:0,roofTime:0,stallTime:0};return {...base,boxes:load};}
  function vehicle(m,load){return {...m,density:2.1,wheelDensity:1.5,torque:36,speed:19.5,spring:3.1,damping:.60,angularDamping:.45,airTorque:22,gripFactor:1.15,cargoX:load===1?-.8:m.cargoX};}
  function valid(d){const r=d?.ridge25;return !!r&&d.id===0&&d.car==='rover'&&d.setup==='standard'&&d.levels.every(x=>x===0)&&!d.journey&&!d.expedition&&!d.waterRun&&!d.recoveryRun&&!d.dispatchTerms&&r.edition===25&&[1,3].includes(r.load)&&[0,1].includes(r.stage)&&typeof r.waiting==='boolean'&&(!r.waiting||r.stage===0||!!d.ridge28)&&Number.isInteger(r.landings)&&r.landings>=0&&r.landings<=1000&&Number.isFinite(r.awardX)&&r.awardX>=0&&r.awardX<(d.ridge28?500:200)&&['airTime','peakFall','roofTime','stallTime'].every(k=>Number.isFinite(r[k])&&r[k]>=0&&r[k]<100);}
  const methods={
   ridgeContinue(){if(this.edition!==25||!this.ridge.waiting||this.state!=='drive')return false;this.ridge.stage=1;this.ridge.waiting=false;return true;},
   ridgeDeliver(){if(this.edition!==25||!this.ridge.waiting||this.state!=='drive'||!this.remaining())return false;this.ridge.waiting=false;this.end('delivered');return true;},
   ridgeScore(){return this.state==='win'?this.remaining()*(this.ridge.stage?250:100)+this.ridge.landings:0;},
   ridgeUpdate(dt,wasAir){const r=this.ridge,p=this.car.getPosition(),v=this.car.getLinearVelocity(),air=this.groundCount===0;
    if(air){r.airTime=Math.min(10,r.airTime+dt);r.peakFall=Math.max(r.peakFall,-v.y);}else if(wasAir){const slope=Math.atan((height(p.x+1,key)-height(p.x-1,key))/2),a=Math.atan2(Math.sin(this.car.getAngle()-slope),Math.cos(this.car.getAngle()-slope));if(r.airTime>.20&&r.peakFall<7&&Math.abs(a)<.35&&this.remaining()&&p.x>r.awardX+6){r.awardX=p.x;const points=10*this.remaining();r.landings+=points;this.events.push({type:'ridgeLanding',points});}r.airTime=0;r.peakFall=0;}
    r.stallTime=Math.abs(v.x)<.15&&this.throttle>.2?Math.min(10,r.stallTime+dt):0;if(r.stallTime>=2&&r.stallTime-dt<2)this.events.push({type:'ridgeStall'});
    const a=Math.abs(Math.atan2(Math.sin(this.car.getAngle()),Math.cos(this.car.getAngle())));r.roofTime=a>2&&p.y<height(p.x,key)+2.3?r.roofTime+dt:0;if(r.roofTime>.35)this.end('flipped');
    if(this.state==='drive'&&r.stage===0&&p.x>=camp&&this.groundCount>=2&&a<.55){r.waiting=true;this.events.push({type:'ridgeCamp'});}
   }
  };
  return {key,camp,distance:base.length*3,init,vehicle,valid,methods};
 }
 if(typeof module==='object')module.exports=create;else root.Ridge25Model=create;
})(typeof globalThis!=='undefined'?globalThis:this);
