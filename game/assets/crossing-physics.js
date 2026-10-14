'use strict';
(function(root){
 function factory({P,V,height,groundHeight}){return {
  createCrossings(ground){
   this.waterDepth=0;this.intakeWet=0;this.inWater=false;this.peakWaterDepth=0;this.liftBridges=[];
   const br=this.route.liftBridge;if(!br)return;const span=br.to-br.from,angle=1.05,pivot=V(br.from,br.y-.10),body=this.world.createDynamicBody({position:V(pivot.x+Math.cos(angle)*span/2,pivot.y+Math.sin(angle)*span/2),angle,angularDamping:.7,bullet:true});body.setUserData('bridge');body.createFixture(P.Box(span/2,.10),{density:4,friction:1.25});
   const joint=this.world.createJoint(P.RevoluteJoint({referenceAngle:0,enableLimit:true,lowerAngle:0,upperAngle:1.05,enableMotor:true,motorSpeed:0,maxMotorTorque:25000},ground,body,pivot));
   const boat=this.world.createKinematicBody({position:V(br.to+4,br.y-1.10),bullet:true});boat.setUserData('boat');boat.createFixture(P.Box(1.7,.30),{friction:.5});boat.setActive(false);
   this.liftBridges.push({...br,span,pivot,body,joint,boat,elapsed:0,wait:0,requested:false,done:false,water:{from:br.from,to:br.to,level:br.y-.55,name:br.name}});
  },
  nextLiftBridge(){return this.liftBridges.find(b=>!b.done)||null;},
  updateLiftBridges(gas,brake,dt){
   for(const br of this.liftBridges){
    if(br.boat.isActive()&&br.boat.getPosition().x<br.from-5)br.boat.setActive(false);
    if(br.done){br.joint.setMotorSpeed(0);continue;}
    if(!br.requested){const p=this.car.getPosition(),v=this.car.getLinearVelocity(),a=Math.atan2(Math.sin(this.car.getAngle()),Math.cos(this.car.getAngle())),ready=Math.abs(p.x-br.control)<=2.8&&this.groundCount>=2&&Math.abs(v.x)<.45&&Math.abs(v.y)<.7&&Math.abs(a)<.4&&brake&&!gas;br.elapsed=ready?br.elapsed+dt:0;if(br.elapsed>=1){br.requested=true;br.boat.setActive(true);br.boat.setLinearVelocity(V(-4.5,0));this.events.push({type:'bridgeRequest'});}}
    if(br.requested){this.parkingHold=true;br.wait+=dt;br.joint.setMotorSpeed(br.wait>=4?-.75:0);if(br.wait>=4&&br.joint.getJointAngle()<.015){br.done=true;br.joint.setMotorSpeed(0);this.events.push({type:'bridgeReady'});}}
   }
  },
  waterLevel(ford){return ford.level+.025*Math.sin(this.time*1.6+this.route.seed);},
  updateFords(dt){
   const p=this.car.getPosition(),v=this.car.getLinearVelocity(),m=this.vehicle;let ford=(this.route.fords||[]).find(f=>p.x>=f.from&&p.x<=f.to);if(!ford){const br=this.liftBridges.find(b=>p.x>=b.from&&p.x<=b.to);if(br)ford=br.water;}const bottom=Math.min(...this.wheels.map(w=>w.getPosition().y-m.radius));this.waterDepth=ford?Math.max(0,this.waterLevel(ford)-bottom):0;this.peakWaterDepth=Math.max(this.peakWaterDepth,this.waterDepth);
   if(this.waterDepth>.1){if(!this.inWater)this.events.push({type:'waterEnter'});this.inWater=true;const fraction=Math.min(1,this.waterDepth/1.4),mass=this.car.getMass();this.car.applyForce(V(-v.x*Math.abs(v.x)*mass*.10*fraction,mass*12*.16*fraction-v.y*mass*.08*fraction),this.car.getWorldCenter(),true);
    const intake=this.car.getWorldPoint(V(m.width*(m.id==='mule'?.80:.55),m.id==='mule'?1.45:['timber','tanker'].includes(m.id)?.50:.25));if(intake.y<this.waterLevel(ford))this.intakeWet+=dt;else this.intakeWet=Math.max(0,this.intakeWet-dt*2);if(this.intakeWet>2.5)this.end('drowned');
   }else{this.inWater=false;this.intakeWet=Math.max(0,this.intakeWet-dt*2);}
  }
 };}
 if(typeof module==='object')module.exports=factory;else root.CrossingPhysics=factory;
})(typeof globalThis!=='undefined'?globalThis:this);
