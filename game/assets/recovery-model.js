'use strict';
(function(root){
 function create({P,V,routes,profiles,zones,landmarks}){
  const key='recovery:23';
  const story={cargo:'Сломанный фургон и инструмент',from:'Обочина лесной дороги',to:'Ремонтная база Лисьего Брода',radio:'Фургон механика остался на обочине. Он стоит сзади. Остановись и нажми «Прицепить». Тяни плавно, на подъёме включай 4L. У базы останови обе машины и отцепи фургон на площадке. За помощь механик даст запасной трос для следующих рейсов.',reply:'Подцеплю, вытяну и поставлю у мастерской.',finish:'Фургон на базе. Механик выдал запасной трос: в следующих рейсах лебёдку можно использовать три раза.'};
  const base={...routes[4],name:'Своих не бросаем',kind:'delivery',limit:undefined,cargo:'towkit',requires:'rover',length:190,boxes:1,reward:690,seed:63,weather:'clear',fuelPoints:[],stops:[],services:[],sectors:[],story};
  function route(){return {...base};}
  routes[key]=route();profiles[key]=[[0,0],[26,0],[44,2.1],[58,2.1],[74,.3],[90,.3],[111,4.4],[116,4.4],[128,.3],[154,.3],[173,1.2],[190,.2]];
  zones[key]=[{from:78,to:91,type:'gravel',friction:1.05}];landmarks[key]=[{x:30,type:'sign',text:'ТЯЖЁЛАЯ СЦЕПКА'},{x:108,type:'sign',text:'СПУСК · ТОРМОЗИ ЗАРАНЕЕ'}];
  function init(s,options={}){s.roadId=key;s.tow={attached:options.attached===true,support:options.support===true,condition:68,breaks:0,strain:0,overload:0,cooldown:0,previousVx:0,previousVy:0,delivered:false};return route();}
  const methods={
   createRecoveryRig(){
    const b=this.world.createDynamicBody({position:V(-2,.94),bullet:true,linearDamping:.06,angularDamping:.8}),fd={filterGroupIndex:-2,friction:.7};b.setUserData('recovery');
    b.createFixture(P.Box(1.48,.14,V(0,.04)),{...fd,density:1.6});b.createFixture(P.Box(.88,.54,V(-.4,.7)),{...fd,density:.5});b.createFixture(P.Polygon([V(.48,.18),V(1.48,.18),V(1.18,1.1),V(.5,1.1)]),{...fd,density:.8});
    const wheels=[],joints=[];for(const x of [-1.02,1.02]){const w=this.world.createDynamicBody({position:V(-2+x,.44),bullet:true});w.setUserData('recoveryWheel');w.createFixture(P.Circle(.44),{density:1.2,friction:1.3,filterGroupIndex:-2});wheels.push(w);joints.push(this.world.createJoint(P.WheelJoint({enableMotor:false,maxMotorTorque:0,frequencyHz:3.0,dampingRatio:.8},b,w,w.getPosition(),V(0,1))));}
    this.recovery={body:b,wheels,joints,rope:null};if(this.tow.attached)this.attachRecoveryRope();
   },
   towAnchors(){return {a:this.car.getWorldPoint(V(-1.7,.10)),b:this.recovery.body.getWorldPoint(V(1.46,.10))};},
   attachRecoveryRope(){this.recovery.rope=this.world.createJoint(P.RopeJoint({maxLength:5.4,collideConnected:true,localAnchorA:V(-1.7,.10),localAnchorB:V(1.46,.10)},this.car,this.recovery.body));this.tow.attached=true;},
   canToggleTow(){if(this.edition!==23||this.state!=='drive'||this.tow.delivered||this.groundCount<1||Math.abs(this.car.getLinearVelocity().x)>.85||Math.abs(this.recovery.body.getLinearVelocity().x)>.85)return false;if(this.tow.attached){const p=this.recovery.body.getPosition();return Math.abs(p.x-this.route.length)>4||this.canDeliverRecovery();}const {a,b}=this.towAnchors();return a.x>b.x+.4&&Math.hypot(a.x-b.x,a.y-b.y)<=5.3;},
   canDeliverRecovery(){const p=this.recovery.body.getPosition(),v=this.recovery.body.getLinearVelocity(),a=this.recovery.body.getAngle();return p.x>=this.route.length-4&&p.x<=this.route.length+4&&Math.abs(v.x)<.45&&Math.abs(this.car.getLinearVelocity().x)<.45&&Math.abs(v.y)<.6&&Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.45&&this.tow.condition>=40&&this.remaining()===1;},
   toggleTow(){
    if(!this.canToggleTow())return false;const t=this.tow;
    if(t.attached){this.world.destroyJoint(this.recovery.rope);this.recovery.rope=null;t.attached=false;t.strain=0;t.overload=0;if(this.canDeliverRecovery()){t.delivered=true;this.events.push({type:'towDelivered'});this.end('delivered');}else this.events.push({type:'towDetach'});}
    else{this.attachRecoveryRope();t.overload=0;t.strain=0;this.events.push({type:'towAttach'});}return true;
   },
   updateRecovery(dt){
    if(this.edition!==23)return;const t=this.tow,r=this.recovery,v=r.body.getLinearVelocity(),vertical=v.y-t.previousVy,horizontal=Math.abs(v.x-t.previousVx);t.previousVy=v.y;t.previousVx=v.x;t.cooldown=Math.max(0,t.cooldown-dt);
    if(t.cooldown<=0&&(vertical>2.5||horizontal>2.5)){const damage=Math.min(25,Math.round(Math.max(0,vertical-2.5)*6+Math.max(0,horizontal-2.5)*4));if(damage){t.condition=Math.max(0,t.condition-damage);t.cooldown=.5;this.events.push({type:'towHit',damage});}}
    if(r.rope){const f=r.rope.getReactionForce(120),ratio=Math.hypot(f.x,f.y)/(t.support?1200:900);t.strain+=(ratio-t.strain)*.3;t.overload=ratio>1?t.overload+dt*(ratio-1):Math.max(0,t.overload-dt*.7);if(t.overload>.10){this.world.destroyJoint(r.rope);r.rope=null;t.attached=false;t.breaks++;t.overload=0;t.strain=0;this.events.push({type:'towBreak'});}}
    if(t.condition<=0)this.end('towDamage');if(this.car.getPosition().x>this.route.length+24&&!t.delivered)this.end('tow');
   },
   recoveryGoals(){const won=this.state==='win',full=this.remaining()===1&&this.tow.condition>=60;return [{id:'delivery',title:'Фургон на базе',detail:'Состояние ≥40%, инструмент цел',done:won},{id:'cargo',title:'Бережная буксировка',detail:'Фургон ≥60%, инструмент цел',done:won&&full},{id:'careful',title:'Без обрывов',detail:'Весь груз, кузов ≥70%, трос цел',done:won&&full&&this.condition>=70&&this.tow.breaks===0}];}
  };
  return {key,story,route,init,methods};
 }
 if(typeof module==='object')module.exports=create;else root.RecoveryModel=create;
})(typeof globalThis!=='undefined'?globalThis:this);
