'use strict';
function create(base){return function(s,P,path='detour'){
 if(!s.course26)return base(s,P,path);
 if(s.forkWaiting)s.choosePath(path);
 const x=s.car.getPosition().x,v=s.car.getLinearVelocity(),a=Math.atan2(Math.sin(s.car.getAngle()),Math.cos(s.car.getAngle())),w=s.car.getAngularVelocity();
 const grade=(P.height(x+3,s.roadId)-P.height(x,s.roadId))/3;
 const hazard=s.route.hazards.find(h=>x>h.from-8&&x<h.to+2),bridge=P.bridges[s.roadId],gap=P.gaps[s.roadId],ford=(s.route.fords||[]).find(f=>x>f.from-5&&x<f.to+4),rocks=(s.route.rocks||[]).some(r=>x>r.x-8&&x<r.x+10);
 const low=!(gap&&x>gap.from-19&&x<gap.to+7)&&(!!ford||!!bridge&&x>bridge.from-8&&x<bridge.to+5||rocks||grade>.19||P.surfaceAt(x,s.roadId).type==='mud'||!!hazard&&['c','d'].includes(hazard.type)&&x<hazard.peak+3);
 if(s.groundCount&&Math.abs(v.x)<3.3&&s.shiftCooldown<=0&&low!==s.lowGear)s.setLowGear(low);
 if(s.edition===21&&s.path==='ridge'&&hazard?.type==='c'&&x>hazard.from+5&&x<hazard.peak+5&&s.lowGear&&Math.abs(v.x)<.45&&s.winchTime<=0)s.useWinch();
 if(s.edition===23){if(!s.tow.attached){if(s.canToggleTow())s.useWinch();else return [false,true];}if(s.canDeliverRecovery()){s.useWinch();return [false,true];}}
 if(s.groundCount===0){const target=v.y<0?-.10:.10,d=target-a-w*.22;return d>.045?[true,false]:d<-.045?[false,true]:[false,false];}
 let target=s.edition===23?2.4:s.edition===21?3:s.edition===22?3.3:s.fluidCapacity?3.6:s.route.cargo==='logs'?4.2:s.route.kind==='careful'?3.6:5.4;
 let drop=0;for(let n=2;n<=10;n+=2)drop=Math.min(drop,(P.height(x+n+2,s.roadId)-P.height(x+n,s.roadId))/2);
 if(drop<-.45)target=Math.min(target,s.edition===23?1.3:s.dispatchTerms?2.05:1.65);else if(drop<-.16||grade<-.12)target=Math.min(target,s.edition===23?1.6:2.4);
 if(low)target=Math.min(target,s.dispatchTerms?3.3:3.0);if(rocks)target=Math.min(target,1.7);if(bridge&&x>bridge.from-7&&x<bridge.to+6)target=Math.min(target,1.3);if(ford)target=1.5;
 const sector=s.sectors.find(h=>!h.done&&x>h.from-8&&x<h.to+1);if(sector)target=Math.min(target,3.4);
 const gate=s.nextGate(),lift=s.nextLiftBridge(),stop=s.nextStop(),service=s.nextService(),tasks=[...(gate?[{...gate,task:'gate'}]:[]),...(lift?[{...lift,x:lift.control,task:'lift'}]:[]),...(stop?[{...stop,task:'stop'}]:[]),...(service&&(service.required||service.x>=x-3)&&(service.required||s.condition<65||s.fuel<25||s.temperature>101)?[{...service,task:'service'}]:[])].sort((a,b)=>a.x-b.x);
 const task=tasks[0];if(task&&x>task.x-13){if(x>=task.x-2.2)return [false,true];target=Math.min(target,Math.max(.7,(task.x-x-1.8)*.40));}
 if(s.edition===23){const delta=s.route.length-s.recovery.body.getPosition().x;if(delta<16)target=Math.min(target,Math.max(.45,delta*.18));if(delta<1.3)return [false,true];}
 if(gap&&x>gap.from-15&&x<gap.from-.15)target=6.8+(s.delivered&&s.delivered()>0?.4:0);
 if(gap&&x>=gap.from-.15&&x<gap.to+3){if(s.groundCount&&x<gap.from+s.vehicle.base)return [true,false];const d=.12-a-w*.2;return d>0?[true,false]:[false,true];}
 if((s.route.kind==='eco'||s.route.length>450||s.fuel<22)&&!hazard&&!task&&Math.abs(grade)<.15&&drop>-.15)return [v.x<2.6,v.x>4.8];
 if(v.x>target+.16)return [false,true];if(v.x>target-.12)return [false,false];
 return [Math.max(.25,Math.min(1,.4+(target-v.x)*.35+Math.max(0,grade)*.9)),false];
};}
const base=require('./driving-input25.cjs'),drive=create(base);function park(base){return function(s,P,path='detour'){const c=base(s,P,path);if(!s.logistics29||[23,25].includes(s.edition))return c;const x=s.car.getPosition().x,v=s.car.getLinearVelocity().x,dx=s.route.length+6-x;if(!s.nextStop()&&dx<14){if(dx<=.4)return [false,true];const speed=Math.max(.4,Math.min(2.2,dx*.45));return v>speed+.12?[false,true]:v>speed-.12?[false,false]:[.35,false];}return c;};}const driver=park(drive);driver.browserSource='('+park.toString()+')(('+create.toString()+')('+base.browserSource+'))';module.exports=driver;
