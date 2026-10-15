'use strict';
function create(base){return function(s,P,path='detour'){
 if(s.edition!==23)return base(s,P,path);
 const x=s.car.getPosition().x,v=s.car.getLinearVelocity(),a=s.car.getAngle(),van=s.recovery.body.getPosition(),vv=s.recovery.body.getLinearVelocity();
 if(!s.tow.attached){if(s.canToggleTow())s.useWinch();else return [false,true];}
 if(s.canDeliverRecovery()){if(Math.abs(v.x)<.7&&Math.abs(vv.x)<.6)s.useWinch();return [false,true];}
 const low=x>24&&x<146;if(s.groundCount&&Math.abs(v.x)<3.3&&s.shiftCooldown<=0&&low!==s.lowGear)s.setLowGear(low);
 if(s.groundCount===0)return [a+s.car.getAngularVelocity()*.2<-.08,a+s.car.getAngularVelocity()*.2>.08];
 let target=2.4;const grade=(P.height(x+3,s.roadId)-P.height(x,s.roadId))/3;
 if(grade<-.08||x>108&&x<138)target=1.6;
 const delta=s.route.length-van.x;if(delta<16)target=Math.min(target,Math.max(.45,delta*.18));
 if(delta<1.3)return [false,true];
 if(v.x>target+.2)return [false,true];if(v.x>target-.1)return [false,false];
 return [Math.max(.28,Math.min(1,.42+(target-v.x)*.35+Math.max(0,grade)*.8)),false];
};}
const base=require('./driving-input22.cjs'),driver=create(base);driver.browserSource='('+create.toString()+')('+base.browserSource+')';module.exports=driver;
