'use strict';
(function(root){
 function create({routes,profiles,zones,landmarks}){
  const key='water:22';
  const story={cargo:'Насос и шкаф управления',from:'Мастерская Лисьего Брода',to:'Водонапорная станция',radio:'Свет есть. Теперь нужна вода. Перед бродом остановись у поста: тормоз одну секунду. На насосной выгрузи насос — держи тормоз три секунды. Шкаф управления довези до водонапорной. Если мастерская запущена, её бригада поможет после брода.',reply:'Насос поставлю на место. Шкаф довезу сухим.',finish:'Насос запущен. В Лисьем Броде снова есть вода.'};
  const base={...routes[3],name:'Вода после шторма',kind:'careful',cargo:'waterkit',requires:'rover',boxes:2,length:200,reward:560,seed:62,weather:'clear',fuelPoints:[],sectors:[],gates:[{x:40,name:'ПОСТ У ПЕРЕПРАВЫ'}],fords:[{from:54,to:82,level:0,name:'ПОДТОПЛЕННАЯ ДОРОГА'}],stops:[{x:136,name:'УСТАНОВКА НАСОСА',cargoIndex:0,duration:3}],story};
  function route(support=false){return {...base,services:support?[{x:104,name:'ВЫЕЗДНАЯ БРИГАДА',required:false}]:[]};}
  routes[key]=route();profiles[key]=[[0,0],[20,0],[38,1.1],[48,1.1],[58,-.65],[76,-.65],[88,.5],[114,.5],[130,1.2],[151,1.2],[171,2.9],[180,2.9],[190,.2],[200,.2]];
  zones[key]=[{from:54,to:82,type:'wet',friction:.80},{from:91,to:110,type:'mud',friction:.72}];landmarks[key]=[{x:49,type:'sign',text:'БРОД · ТИХИЙ ХОД'},{x:124,type:'sign',text:'НАСОСНАЯ →'}];
  function init(s,options={}){s.roadId=key;s.workshopSupport=options.support===true;s.pump={integrity:100,previousVy:0,cooldown:0};return route(s.workshopSupport);}
  const methods={
   updatePump(dt){if(this.edition!==22)return;const box=this.boxes[0],m=this.pump;if(box.delivered||box.lost)return;const vy=box.body.getLinearVelocity().y,jolt=vy-m.previousVy;m.previousVy=vy;m.cooldown=Math.max(0,m.cooldown-dt);if(jolt>2.3&&m.cooldown<=0){const damage=Math.min(35,Math.round((jolt-2.3)*12));if(damage>0){m.integrity=Math.max(0,m.integrity-damage);m.cooldown=.45;this.events.push({type:'pumpHit',damage});}}},
   waterGoals(){const won=this.state==='win',full=this.remaining()===2&&this.pump.integrity>=95;return [{id:'delivery',title:'Вода в посёлке',detail:'Установи насос ≥70% и довези шкаф',done:won},{id:'cargo',title:'Целое оборудование',detail:'Насос ≥95%, оба груза доставлены',done:won&&full},{id:'careful',title:'Бережный рейс',detail:'Весь груз, насос ≥95%, кузов ≥70%',done:won&&full&&this.condition>=70}];}
  };
  return {key,story,route,init,methods};
 }
 if(typeof module==='object')module.exports=create;else root.WaterRunModel=create;
})(typeof globalThis!=='undefined'?globalThis:this);
