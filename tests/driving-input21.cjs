function create(base){return function(s,P,path='detour'){
 if(s.edition!==21)return base(s,P);
 if(s.forkWaiting)s.choosePath(path);
 const x=s.car.getPosition().x,v=s.car.getLinearVelocity(),angle=Math.atan2(Math.sin(s.car.getAngle()),Math.cos(s.car.getAngle()));
 const grade=(P.height(x+3,s.roadId)-P.height(x,s.roadId))/3,bridge=P.bridges[s.roadId];
 const low=s.path==='ridge'&&x>45&&x<128;
 if(s.groundCount>0&&Math.abs(v.x)<3.3&&s.shiftCooldown<=0&&low!==s.lowGear)s.setLowGear(low);
 if(s.groundCount===0)return [angle+s.car.getAngularVelocity()*.2<-.08,angle+s.car.getAngularVelocity()*.2>.08];
 let target=bridge&&x>bridge.from-7&&x<bridge.to+6?1.3:s.path==='ridge'?1.8:2.6;
 if(grade<-.12)target=1.5;
 if(grade>.15&&v.x<3.5)return [true,false];
 const service=s.nextService();if(service&&x>service.x-10&&x<service.x+4&&(s.condition<70||s.fuel<30)){if(x>=service.x-2)return [false,true];target=1;}
 if(v.x>target+.15)return [false,true];
 if(v.x>target-.1)return [false,false];
 return [Math.max(.28,Math.min(1,.42+(target-v.x)*.3+Math.max(0,grade)*.6)),false];
};}
const base=require('./driving-input20.cjs'),driver=create(base);driver.browserSource='('+create.toString()+')('+base.browserSource+')';module.exports=driver;
