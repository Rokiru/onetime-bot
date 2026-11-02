'use strict';
// Development conversion only. No JavaScript or WebView is shipped by Godot.
const fs=require('node:fs'),vm=require('node:vm'),P=require('../game/assets/physics');
const ctx={};vm.runInNewContext(fs.readFileSync('game/assets/story.js','utf8')+'\nthis.story=STORY;',ctx);
function exportRoad(id,path){const r=P.contractRoute(id),s=new P.Drive(id,[0,0,0],r.requires||'rover','standard',P.courses26.edition(id),{course:26,skill:27,logistics:29,pace:30,path,support:true,recoveryBonus:true});return sample(s,id);}
function sample(s,id){const r=s.route,points=[],surfaces=[];for(let x=-25;x<=r.length+35;x+=.5){points.push([x,-P.groundHeight(x,s.roadId)]);const surface=P.surfaceAt(x,s.roadId),last=surfaces.at(-1);if(last&&last.type===surface.type&&last.friction===surface.friction)last.to=x+.5;else surfaces.push({from:x,to:x+.5,type:surface.type,friction:surface.friction});}return {...r,id,profile:points,surfaces,bridge:P.bridges[s.roadId]||null,gap:P.gaps[s.roadId]||null,story:r.story||ctx.story.jobs[id]||{},fuel_plan:P.fuelPlan(s.roadId),legacyRoad:s.roadId};}
const roads=P.routes.map((r,id)=>exportRoad(id,id===0?'detour':undefined));
const extraNames=['Кедровая петля','Приборы за седлом','Последний паром','Соляной ветер','Под настилом','Белый коридор','Вулканическая почта','Резерв для долины','Дальний лесопункт','Тихий конвой','Через старую плотину','Ночной резерв','Разлив','Речной караван','Базальтовая лестница','Три северных поста','Горная вода','Новая лесосека','Зелёная волна','Сигнал за ущельем','Край большой земли','Дорога домой'];
for(let n=0;n<22;n++){const id=50+n,region=n<6?n:n%2+6,cargo=n%5===1?'logs':n%5===3?'liquid':'crates',length=230+(n%4)*35,profile=[[-25,0],[0,0],[20,0]],surfaces=[],stops=[];let y=0;for(let x=35,part=0;x<length-30;x+=32+(n%5)*.7,part++){const peak=2.2+(n%3)*.7+(part%2)*.5+n*.037;profile.push([x,-y],[x+12,-(y+peak)],[x+19,-(y+peak)],[x+29,-y]);surfaces.push({from:x+1,to:x+10,type:region===5?'snow':region===3?'sand':'mud',friction:region===5?.72:region===3?.78:.64});}while(profile.at(-1)[0]>=length-18)profile.pop();profile.push([length-18,0],[length+35,0]);const target=profile.find(p=>p[0]>length*.42&&p[0]<length*.67);if(n%3===0&&cargo!=='logs')stops.push({x:target[0]+3,name:cargo==='liquid'?'Резервная ёмкость':'Промежуточный пост',required:true,...(cargo==='liquid'?{litres:200}:{})});roads.push({id,name:extraNames[n],region,kind:n%4===2?'careful':n%4===1?'eco':'delivery',length,boxes:cargo==='logs'?5:cargo==='liquid'?3:4,reward:650+n*25,cargo,requires:cargo==='logs'?'timber':cargo==='liquid'?'tanker':null,litres:cargo==='liquid'?900:0,minLitres:500,minFuel:8,weather:region===2?'night':region===5?'snow':region===4?'fog':'clear',profile,surfaces,stops,services:n%4===2?[{x:length-15,name:'Проверка креплений',required:true}]:[],story:{cargo:cargo==='logs'?'Лес для дальней смены':cargo==='liquid'?'Резерв питьевой воды':'Снабжение дальнего поста',from:'Лисий Брод',to:extraNames[n],radio:'Тормози перед вершинами. По пути выполни отмеченные остановки. На базе остановись и держи тормоз.'}});}
// Native expansion: explicit contracts and interactions, rather than renamed repeats.
const expansion=[
 [0,'crates','delivery',null,'two'],[1,'crates','careful','mule','service'],[2,'crates','delivery',null,'lift'],[3,'liquid','delivery','tanker','pump'],[4,'crates','delivery','mule','ford'],[5,'crates','timed',null,'service'],[6,'crates','delivery',null,'post'],[7,'liquid','delivery','tanker','shallow'],[0,'logs','delivery','timber','shop'],[1,'crates','careful','mule','service'],[7,'logs','delivery','timber','lift'],[2,'liquid','delivery','tanker','post'],[7,'crates','delivery','mule','ford'],[7,'logs','delivery','timber','shallow'],[6,'crates','careful','mule','rocks'],[5,'crates','survey',null,'survey'],[6,'liquid','delivery','tanker','pump'],[0,'logs','delivery','timber','post'],[4,'crates','eco',null,'two'],[6,'crates','delivery',null,'bridge'],[5,'crates','timed',null,'lift'],[0,'crates','delivery',null,'two']
];
function patch(r,from,to,middle){const points=r.profile.filter(p=>p[0]<from||p[0]>to),left=r.profile.findLast(p=>p[0]<=from)||r.profile[0],right=r.profile.find(p=>p[0]>=to)||r.profile.at(-1);r.profile=[...points,[from,left[1]],...middle,[to,right[1]]].sort((a,b)=>a[0]-b[0]);}
for(let n=0;n<expansion.length;n++){
 const r=roads[50+n],[region,cargo,kind,requires,feature]=expansion[n];
 Object.assign(r,{region,cargo,kind,requires,boxes:cargo==='logs'?5:cargo==='liquid'?3:4,weather:region===2?'night':region===5?'snow':region===4?'fog':'clear',stops:[],services:[],gates:[],checkpoints:[],rocks:[],fuel_plan:[],bridge:null,gap:null});
 if(cargo==='liquid'){r.litres=900;r.minLitres=500;}else{delete r.litres;delete r.minLitres;}
 if(kind==='timed')r.limit=180;
 if(kind==='eco'){r.fuelStart=24;r.minFuel=8;}
 const first=106,second=r.length>280?236:r.length-28;
 patch(r,94,118,[[98,-.45],[114,-.45]]);
 if(['two','pump','shallow','ford','post'].includes(feature))r.stops.push({x:first,name:cargo==='liquid'?'Резервная ёмкость':'Дальний пост',required:true,...(cargo==='liquid'?{litres:200}:{})});
 if(feature==='two'){patch(r,second-11,second+11,[[second-6,-.3],[second+6,-.3]]);r.stops.push({x:second,name:'Второй адрес',required:true});}
 if(['ford','shallow','lift','bridge'].includes(feature)){
  const depth=feature==='ford'?1.35:.70;
  const middle=feature==='ford'||feature==='shallow'?[[46,0],[52,0],[58,depth],[72,depth],[82,0],[86,0]]:[[46,0],[54,0],[78,0],[86,0]];
  patch(r,36,92,middle);
  if(feature==='ford'||feature==='shallow'){r.fords=[{from:53,to:81,level:0,name:feature==='ford'?'ГЛУБОКИЙ БРОД':'ТВЁРДОЕ ДНО'}];r.surfaces.push({from:53,to:81,type:'wet',friction:.85});}
  if(feature==='bridge')r.bridge={from:54,to:78,y:0};
  if(feature==='lift')r.liftBridge={from:54,to:78,y:0,control:46};
 }
 if(feature==='post'){patch(r,20,44,[[24,0],[40,0]]);r.gates=[{x:30,name:'Пост дальнего тракта'}];}
 if(['service','shop','rocks'].includes(feature)){patch(r,172,200,[[178,-.35],[194,-.35]]);r.services=[{x:186,name:feature==='shop'?'Лесная мастерская':'Проверка креплений',required:feature!=='shop'}];}
 if(feature==='rocks')r.rocks=[{x:128,r:.20},{x:153,r:.22}];
 if(feature==='survey')r.checkpoints=[{x:94,name:'Северный пост 1'},{x:154,name:'Северный пост 2'},{x:216,name:'Северный пост 3'}];
 r.story={cargo:cargo==='logs'?'Древесина для дальней смены':cargo==='liquid'?'Вода для дальнего резерва':kind==='careful'?'Точная аппаратура':'Снабжение дальнего поста',from:'Лисий Брод',to:r.name,radio:({two:'Два обязательных адреса, затем база. На подъёмах включай 4L до склона.',service:'Сохрани все ящики. В мастерской проверь крепления: остановись и держи тормоз.',lift:'Запроси разводной мост тормозом у поста. Дождись зелёного, проходи настил тихо.',pump:'В резерв перекачай 200 литров, на базу довези хотя бы 500. Тормози до уступов.',ford:'Глубокий брод проходит MULE или вездеход его класса. Ровная тяга, без прыжка в воду.',shallow:'Через реку — по твёрдому дну. Тяжёлый груз в воде и на спуске требует плавного газа.',post:'На посту остановись и запроси проезд тормозом. За ним — обязательная приёмка.',shop:'Длинные брёвна меняют баланс. Для вязких подъёмов поставь грязевые шины. Мастерская по пути необязательна.',rocks:'Нужен закрытый грузовик. Камни проходи в 4L, затем обязательная проверка креплений.',survey:'Проедь все три поста по земле и довези груз. Полёт над отметкой не засчитывается.',bridge:'Подвесной настил двигается под колёсами. Отпусти газ до въезда; на другом берегу снова набирай ход.'})[feature]};
}
// Protected interaction pads must reconnect with climbable approaches. Lower only
// excessive native expansion peaks; do not touch the original 0..49 profiles.
for(const r of roads.slice(50)){
 r.profile=r.profile.filter((p,i,a)=>i===0||p[0]>a[i-1][0]);
 for(let i=1;i<r.profile.length;i++)r.profile[i][1]=Math.max(r.profile[i][1],r.profile[i-1][1]-.42*(r.profile[i][0]-r.profile[i-1][0]));
 for(let i=r.profile.length-2;i>=0;i--)r.profile[i][1]=Math.max(r.profile[i][1],r.profile[i+1][1]-.42*(r.profile[i+1][0]-r.profile[i][0]));
}
const vehicles=P.vehicles.map(v=>({...v,mass:Math.round(v.density*340),family:v.family||v.id,display_speed:v.speed*v.radius,color:v.color}));
for(const v of [
{id:'fox',name:'FOX',family:'rover',tag:'Лёгкий пикап 4×4',price:850,base:'rover',mass:690,torque:29,speed:17,radius:.53,width:1.72,axles:[-1.13,1.13],color:'#c27758'},
{id:'atlas',name:'ATLAS',family:'mule',tag:'Экспедиционный 6×6',price:2600,base:'bison',mass:1320,torque:47,speed:12,radius:.7,color:'#d0ae67'},
{id:'quartz',name:'QUARTZ',family:'rover',tag:'Ралли-фургон 4×4',price:1850,base:'rivet',mass:760,torque:34,speed:18,radius:.57,color:'#c2cccd'},
{id:'taiga',name:'TAIGA',family:'timber',tag:'Тяжёлый лесовоз 8×8',price:3800,base:'cedar',mass:1680,torque:63,speed:10.8,width:3.1,axles:[-2.3,-.95,.5,2.3],radius:.68,color:'#60868b'},
{id:'surge',name:'SURGE',family:'tanker',tag:'Цистерна 6×6',price:3500,base:'tanker',mass:1420,torque:69,speed:12.5,axles:[-1.9,-.65,1.9],radius:.7,color:'#ad6654'},
{id:'lynx',name:'LYNX',family:'scrambler',tag:'Спортивный багги 4×4',price:2100,base:'scrambler',mass:590,torque:30,speed:22,radius:.59,color:'#d4a650'},
{id:'boreal',name:'BOREAL',family:'mule',tag:'Арктический грузовик 8×8',price:4600,base:'bison',mass:1780,torque:68,speed:11,width:3.1,axles:[-2.25,-.85,.7,2.25],radius:.74,color:'#c7d5d0'}]){const base=vehicles.find(m=>m.id===v.base);vehicles.push({...base,...v,description:v.tag+'. Отдельная масса, колёсная база, двигатель и расход.',fuelFactor:v.mass/1100,display_speed:v.speed*v.radius,...(v.axles?{driven:v.axles.map((_,i)=>i)}:{})});}
const ridge=new P.Drive(0,[0,0,0],'rover','standard',25,{trail:28,load:1,logistics:29});const data={schema:34,regions:[...P.regions.map(r=>r.name),'Базальтовая долина','Большая пойма'],vehicles,roads,sequence:[...ctx.story.sequence,...Array.from({length:22},(_,i)=>50+i)],ridge:{...sample(ridge,-1),id:-1,camps:[{x:82,value:100},{x:155,value:250},{x:270,value:450}],finishValue:750},branches:{ridge:exportRoad(0,'ridge'),detour:exportRoad(0,'detour')}};
fs.writeFileSync('godot/data/catalog.json',JSON.stringify(data));console.log('Exported 72 routes, 16 vehicles, original IDs, both generator branches and separate ridge.');
