'use strict';
(function(root){
 function create({P,V,routes,profiles,bridges,zones,landmarks,height,groundHeight,groundVertices,fuelPlan}){
  const common=[[0,0],[17,0],[29,.4],[43,.4]];
  const paths={
   ridge:{name:'Подвесной мост',length:160,reward:450,description:'Короткий путь. Подвижный настил, крутой спуск. Береги крепления.',profile:[...common,[51,1.3],[56,1.3],[74,1.3],[85,.2],[88,.2],[108,5.5],[113,5.5],[120,.2],[160,.2]]},
   detour:{name:'Лесной объезд',length:240,reward:420,description:'Длиннее на 240 м. Пологие уклоны, больше расход топлива.',profile:[...common,[62,.4],[81,2.0],[95,2],[115,.3],[132,.3],[152,2.4],[167,2.4],[190,.2],[240,.2]]}
  };
  const story={cargo:'Тяжёлый генератор',from:'Северный склад',to:'Мастерская Лисьего Брода',radio:'Без генератора мастерская стоит. У указателя выбери мост или объезд. Генератор тяжёлый: дозируй газ, тормози до спуска. На базе нужно не меньше 60% исправности.',reply:'Выберу дорогу по грузу. Доставлю рабочим.',finish:'В мастерской загорелся свет. Посёлок снова может чинить машины.'};
  const base={...routes[0],name:'Первый свет',kind:'delivery',cargo:'generator',requires:'rover',boxes:1,length:240,reward:420,seed:61,weather:'clear',fuelPoints:[],stops:[],services:[],sectors:[],story,fork:{x:36,paths}};
  function route(path='pending',powered=false){const p=paths[path]||paths.detour;return {...base,length:p.length,reward:p.reward,services:powered?[{x:p.length+2,name:'МАСТЕРСКАЯ · ЕСТЬ ТОК',required:false}]:[]};}
  for(const path of ['pending','ridge','detour']){const key='light:'+path;routes[key]=route(path);profiles[key]=(paths[path]||paths.detour).profile;zones[key]=path==='detour'?[{from:128,to:142,type:'sand',friction:.88}]:[];landmarks[key]=[{x:38,type:'sign',text:'МОСТ / ОБЪЕЗД'}];}
  bridges['light:ridge']={from:56,to:74,y:1.3};
  function init(s,options={}){const path=['ridge','detour'].includes(options.path)?options.path:'pending';s.path=path;s.roadId='light:'+path;s.workshopPowered=options.powered===true;s.forkWaiting=false;s.machine={integrity:100,previousVy:0,cooldown:0};return route(path,s.workshopPowered);}
  const methods={
   choosePath(path){
    if(this.edition!==21||this.state!=='drive'||!this.forkWaiting||this.path!=='pending'||!paths[path])return false;
    this.path=path;this.roadId='light:'+path;this.route=route(path,this.workshopPowered);if(this.course26)this.course26Model.apply(this);
    this.groundBody.destroyFixture(this.groundBody.getFixtureList());const points=groundVertices(this.roadId).map(p=>V(p.x,p.y));this.groundVertices=points;this.groundBody.createFixture(P.Chain(points),{friction:1});
    this.createRoadBridge(this.groundBody);this.services=this.route.services.map(s=>({...s,done:false,elapsed:0}));
    const picked=new Set(this.items.filter(i=>i.got).map(i=>i.type+':'+i.x));this.items=[];for(let x=22;x<this.route.length-9;x+=12)this.items.push({x,y:height(x,this.roadId)+1.05,type:'coin',got:picked.has('coin:'+x)});
    for(const p of fuelPlan(this.roadId))this.items.push({x:p.x,y:height(p.x,this.roadId)+1,type:'fuel',amount:p.amount,got:picked.has('fuel:'+p.x)});
    this.forkWaiting=false;this.events.push({type:'path',path});return true;
   },
   updateMachine(dt){
    if(this.edition!==21)return;const box=this.boxes[0],m=this.machine,vy=box.body.getLinearVelocity().y,jolt=vy-m.previousVy;m.previousVy=vy;m.cooldown=Math.max(0,m.cooldown-dt);
    if(jolt>2.3&&m.cooldown<=0){const damage=Math.min(35,Math.round((jolt-2.3)*14));if(damage>0){m.integrity=Math.max(0,m.integrity-damage);m.cooldown=.45;this.events.push({type:'machineHit',damage});}}
    if(this.path==='pending'&&this.car.getPosition().x>=36){this.forkWaiting=true;this.events.push({type:'fork'});}
   }
  };
  return {paths,story,route,init,methods};
 }
 if(typeof module==='object')module.exports=create;else root.FirstLightModel=create;
})(typeof globalThis!=='undefined'?globalThis:this);
