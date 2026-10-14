function drivingInput(s,physics,careful=s.route.kind==='careful'){
 const {height,gaps}=physics;const x=s.car.getPosition().x,v=s.car.getLinearVelocity(),a=Math.atan2(Math.sin(s.car.getAngle()),Math.cos(s.car.getAngle()));
 let slope=(height(x+3,s.id)-height(x,s.id))/3,far=(height(x+8,s.id)-height(x+3,s.id))/5;
 let target=careful?2.0:4.8;let drop=0;for(let z=2;z<12;z+=2)drop=Math.min(drop,(height(x+z+2,s.id)-height(x+z,s.id))/2);
 if(slope<-.12||far<-.18)target=careful?1.5:2.8;
 if(slope>.3)target=careful?2.1:3.6;if(drop<-.55)target=careful?1.1:1.6;
 const gap=gaps[s.id];if(gap&&x>gap.from-10&&x<gap.from-.15)target=6.8;if(gap&&x>=gap.from-.15&&x<gap.to+3){if(s.groundCount>0&&x<gap.from+s.vehicle.base)return [true,false];return [a<.10,a>.22];}
 if(s.groundCount===0)return [a<-.08,a>.08];if(a<-.65&&s.car.getAngularVelocity()<-.3)return [true,false];
 return [v.x<target&&a<1.05,a>1.1||v.x>target+.25];
}
module.exports=drivingInput;
