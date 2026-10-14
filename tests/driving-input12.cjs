module.exports=function drivingInput12(s,P){
 const x0=s.car.getPosition().x,v0=s.car.getLinearVelocity(),site=s.nextService();
 if(site&&(site.required||s.condition<60||s.fuel<18||s.temperature>100)&&x0>site.x-11&&x0<site.x+5){if(x0>=site.x-2.25)return [false,true];const target=Math.min(1.3,Math.max(.65,(site.x-2-x0)*.5));return [v0.x<target,v0.x>target+.05];}
 if(s.id>=24&&s.groundCount>0&&(s.route.rocks||[]).some(r=>r.x>x0-5&&r.x<x0+8)){const a=s.car.getAngle();return [v0.x<1.8&&a<.95,a>=.95||v0.x>2.05];}
 function drivingInput10(s,physics){

 function drivingInput(s,physics,careful=s.route.kind==='careful'){
 const {height,gaps}=physics;const x=s.car.getPosition().x,v=s.car.getLinearVelocity(),a=Math.atan2(Math.sin(s.car.getAngle()),Math.cos(s.car.getAngle()));
 let slope=(height(x+3,s.id)-height(x,s.id))/3,far=(height(x+8,s.id)-height(x+3,s.id))/5;
 let target=careful?2.0:4.8;let drop=0;for(let z=2;z<12;z+=2)drop=Math.min(drop,(height(x+z+2,s.id)-height(x+z,s.id))/2);
 if(slope<-.12||far<-.18)target=careful?1.5:2.8;
 if(slope>.3)target=careful?2.1:3.6;if(drop<-.55)target=careful?1.1:1.6;
 const gap=gaps[s.id];if(gap&&x>gap.from-10&&x<gap.from-.15)target=6.8+(s.delivered&&s.delivered()>0?.4:0);if(gap&&x>=gap.from-.15&&x<gap.to+3){if(s.groundCount>0&&x<gap.from+s.vehicle.base)return [true,false];return [a<.10,a>.22];}
 if(s.groundCount===0)return [a<-.08,a>.08];if(a<-.65&&s.car.getAngularVelocity()<-.3)return [true,false];
 return [v.x<target&&a<1.05,a>1.1||v.x>target+.25];
}
 const stop=s.nextStop(),x=s.car.getPosition().x,v=s.car.getLinearVelocity();
 if(stop&&x>stop.x-11&&x<stop.x+5){
  if(x>stop.x+3.1)return [false,true];
  if(x>=stop.x-2.3)return [false,true];
  const target=Math.min(1.35,Math.max(.65,(stop.x-2.0-x)*.5));return [v.x<target,v.x>target+.05];
 }
 return drivingInput(s,physics);
}
 if((s.route.kind==='eco'||s.route.length>450||s.fuel<22)&&s.groundCount>0){const x=s.car.getPosition().x,v=s.car.getLinearVelocity(),a=s.car.getAngle(),slope=(P.height(x+4,s.id)-P.height(x,s.id))/4;if(Math.abs(a)<.65&&Math.abs(slope)<.24)return [v.x<2.8,v.x>4.6];}
 return drivingInput10(s,P);
};
