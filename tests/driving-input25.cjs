'use strict';
function create(base){return function(s,P,choice='continue'){
 if(s.edition!==25)return base(s,P);
 if(s.ridge.waiting){if(choice==='cash')s.ridgeDeliver();else s.ridgeContinue();return [false,false];}
 const p=s.car.getPosition(),v=s.car.getLinearVelocity(),a=Math.atan2(Math.sin(s.car.getAngle()),Math.cos(s.car.getAngle())),w=s.car.getAngularVelocity();if(s.ridge.waiting)s.ridgeContinue();if(p.x>38&&p.x<47&&s.groundCount)return [.65,false];if(s.groundCount<2){const target=p.x>=47&&p.x<52?.25:s.groundCount?Math.atan((P.height(p.x+2,s.roadId)-P.height(p.x,s.roadId))/2):v.y<0?-.18:.12,d=target-a-w*.23;return d>.055?[true,false]:d<-.055?[false,true]:[false,false];}const grade=(P.height(p.x+3,s.roadId)-P.height(p.x,s.roadId))/3;let target=s.ridge.load===3?6.5:5.5;if(p.x>38&&p.x<47)target=7.5;if(grade<-.16)target=3.0;if(v.x>target+.25)return [false,true];if(v.x>target-.2)return [false,false];return [Math.min(1,.45+(target-v.x)*.25+Math.max(0,grade)*.5),false];
};}
const base=require('./driving-input23.cjs'),driver=create(base);driver.browserSource='('+create.toString()+')('+base.browserSource+')';module.exports=driver;
