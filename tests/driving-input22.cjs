'use strict';
function create(base){return function(s,P,path='detour'){
 if(s.edition!==22)return base(s,P,path);
 const x=s.car.getPosition().x,v=s.car.getLinearVelocity(),a=Math.atan2(Math.sin(s.car.getAngle()),Math.cos(s.car.getAngle()));
 const low=x>47&&x<91;if(s.groundCount&&Math.abs(v.x)<3.3&&s.shiftCooldown<=0&&low!==s.lowGear)s.setLowGear(low);
 if(s.groundCount===0)return [a+s.car.getAngularVelocity()*.2<-.08,a+s.car.getAngularVelocity()*.2>.08];
 let target=x>49&&x<88?1.4:3;
 const gate=s.nextGate(),stop=s.nextStop(),service=s.nextService();
 const points=[...(gate&&!gate.requested?[gate]:[]),...(stop?[stop]:[]),...(service&&(s.condition<70||s.fuel<30)?[service]:[])].sort((a,b)=>a.x-b.x),point=points[0];
 if(point&&x>point.x-15){if(x>=point.x-2.2)return [false,true];target=Math.min(target,Math.max(.8,(point.x-x)*.23));}
 if(gate&&gate.requested&&!gate.open&&x>gate.x-3)return [false,true];
 const grade=(P.height(x+3,s.roadId)-P.height(x,s.roadId))/3;
 if(grade<-.1)target=Math.min(target,2);
 if(v.x>target+.2)return [false,true];if(v.x>target-.1)return [false,false];
 return [Math.max(.3,Math.min(1,.5+(target-v.x)*.35+Math.max(0,grade)*.8)),false];
};}
const base=require('./driving-input21.cjs'),driver=create(base);driver.browserSource='('+create.toString()+')('+base.browserSource+')';module.exports=driver;
