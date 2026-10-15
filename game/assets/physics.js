(function(root){'use strict';
const terms24=typeof module==='object'?require('./dispatch-terms24.js'):root.DispatchTerms24;
const P=typeof module==='object'?require('./planck.min.js'):root.planck,V=P.Vec2;
const vehicles=[
 {id:'rover',name:'ROVER',tag:'Пикап 4×4',description:'Уверенная тяга, открытый кузов. Баланс скорости и груза.',price:0,width:1.83,base:1.22,radius:.60,density:2.6,wheelDensity:1.8,torque:26,speed:14,spring:3.25,damping:.70,angularDamping:.60,airTorque:18,bedBack:-1.72,bedFront:.14,cargoX:-1.25,cargoColumns:2,capacity:4,color:'#d99151',accent:'#f0bd7a',closed:false},
 {id:'scrambler',name:'SCRAMBLER',tag:'Багги с длинным ходом',description:'Легче и быстрее. Длинная подвеска, груз требует аккуратности.',price:300,width:1.65,base:1.10,radius:.55,density:1.65,wheelDensity:1.3,torque:22,speed:18,spring:2.75,damping:.68,angularDamping:.62,airTorque:12,bedBack:-1.58,bedFront:.12,cargoX:-1.18,cargoColumns:2,capacity:4,color:'#638f8f',accent:'#acd0b6',closed:false},
 {id:'mule',name:'MULE',tag:'Тяжёлый грузовик',description:'Закрытый отсек бережёт груз. Высокий воздухозаборник помогает пройти глубокий брод.',price:600,width:2.18,base:1.48,radius:.63,density:3.3,wheelDensity:2.1,torque:38,speed:12.2,spring:3.85,damping:.77,angularDamping:.8,airTorque:26,bedBack:-2.07,bedFront:.40,cargoX:-1.66,cargoColumns:3,capacity:6,color:'#879cac',accent:'#c8d2c3',closed:true}
];
const regions=[{name:'Сосновый перевал',short:'ЛЕС',subtitle:'Лесные склоны и первая доставка'},{name:'Старый карьер',short:'КАРЬЕР',subtitle:'Каменные ступени и длинные подъёмы'},{name:'Ночная смена',short:'НОЧЬ',subtitle:'Дорога в свете фар'}];
const routes=[
 {name:'Сосновый перевал',region:0,kind:'delivery',length:220,boxes:3,reward:180,seed:1},
 {name:'Старый карьер',region:1,kind:'delivery',length:300,boxes:4,reward:300,seed:2},
 {name:'Ночная смена',region:2,kind:'delivery',length:385,boxes:4,reward:420,seed:3},
 {name:'Бережный рейс',region:0,kind:'careful',length:245,boxes:3,reward:310,seed:4},
 {name:'Лесной экспресс',region:0,kind:'timed',length:230,boxes:3,reward:290,limit:90,seed:5},
 {name:'Хрупкий груз',region:1,kind:'careful',length:330,boxes:4,reward:470,seed:6},
 {name:'Срочный подъём',region:1,kind:'timed',length:290,boxes:3,reward:440,limit:115,seed:7},
 {name:'Тихая доставка',region:2,kind:'careful',length:360,boxes:4,reward:600,seed:8},
 {name:'До рассвета',region:2,kind:'timed',length:400,boxes:3,reward:580,limit:160,seed:9}
];
// Nine independent authored roads, measured in world metres.
const profiles=[
 [[0,0],[14,0],[22,.6],[30,3.9],[35,3.9],[43,.1],[51,.1],[60,1.8],[78,1.8],[82,2.0],[89,5.3],[94,5.3],[102,-.8],[110,-.8],[119,3.2],[124,3.2],[132,7.5],[137,7.5],[146,1.0],[154,1],[163,5.1],[169,5.1],[179,0],[220,0]],
 [[0,0],[14,0],[24,1],[33,5],[39,5],[48,0],[54,0],[65,6.5],[72,6.5],[82,2],[89,2],[99,8.2],[105,8.2],[114,1],[121,1],[131,5.2],[136,5.2],[145,.2],[155,.2],[167,7.2],[174,7.2],[185,1.7],[194,1.7],[203,4],[208,4],[218,0],[224,0],[235,7.2],[241,7.2],[251,2.5],[259,2.5],[270,9.5],[277,9.5],[289,0],[300,0]],
 [[0,0],[14,0],[29,4.0],[34,4],[43,-1],[50,-1],[63,5.7],[70,5.7],[81,.4],[88,.4],[100,7.3],[108,7.3],[121,-1.1],[132,-1.1],[144,3.8],[150,3.8],[160,-1.2],[168,-1.2],[181,6.6],[188,6.6],[199,.5],[210,.5],[223,8.4],[230,8.4],[242,1.2],[251,1.2],[263,5.5],[270,5.5],[282,-1],[292,-1],[305,6.1],[312,6.1],[325,1.5],[334,1.5],[347,7.0],[353,7],[369,0],[385,0]],
 [[0,0],[14,0],[28,4.2],[34,4.2],[46,.3],[54,.3],[67,6],[74,6],[87,.7],[93,.7],[104,2],[107,2],[125,2],[130,2],[140,5.9],[146,5.9],[158,.1],[166,.1],[179,7.6],[185,7.6],[198,1.1],[204,1.1],[216,5.4],[222,5.4],[237,0],[245,0]],
 [[0,0],[14,0],[23,1],[31,4],[36,4],[47,.1],[53,.1],[66,6.0],[72,6],[84,1.4],[90,1.4],[102,4.9],[108,4.9],[118,-.4],[126,-.4],[138,6.6],[145,6.6],[157,.6],[164,.6],[177,5.2],[184,5.2],[196,0],[202,0],[213,3.7],[218,3.7],[230,0]],
 [[0,0],[14,0],[28,5.2],[35,5.2],[49,.4],[56,.4],[69,6.2],[75,6.2],[88,1],[96,1],[110,8.8],[118,8.8],[134,1.7],[141,1.7],[154,6.3],[161,6.3],[176,.5],[184,.5],[199,7.4],[207,7.4],[222,1.9],[230,1.9],[244,5.6],[252,5.6],[267,.4],[275,.4],[291,8.5],[299,8.5],[320,0],[330,0]],
 [[0,0],[14,0],[26,5.4],[33,5.4],[44,1],[51,1],[64,7.2],[71,7.2],[84,.3],[92,.3],[106,6.4],[113,6.4],[126,1.1],[134,1.1],[149,8.5],[157,8.5],[171,2],[179,2],[193,6.8],[200,6.8],[213,.5],[222,.5],[237,7.5],[245,7.5],[260,2],[267,2],[283,0],[290,0]],
 [[0,0],[14,0],[29,3.6],[36,3.6],[49,.1],[57,.1],[70,5.5],[78,5.5],[92,.4],[99,.4],[113,7.1],[121,7.1],[137,1],[145,1],[158,4.6],[164,4.6],[177,-1.2],[185,-1.2],[200,4.9],[208,4.9],[223,.3],[231,.3],[246,7.2],[254,7.2],[269,1.2],[277,1.2],[291,5.8],[299,5.8],[315,.3],[322,.3],[338,4.1],[344,4.1],[354,0],[360,0]],
 [[0,0],[14,0],[29,5.7],[35,5.7],[46,.2],[54,.2],[67,6.7],[75,6.7],[88,1.2],[95,1.2],[109,8.6],[117,8.6],[132,.1],[141,.1],[155,5.7],[162,5.7],[176,-.8],[184,-.8],[199,7.7],[207,7.7],[222,1.4],[230,1.4],[244,5.9],[252,5.9],[267,.2],[275,.2],[289,8.2],[297,8.2],[312,1],[320,1],[334,6.6],[342,6.6],[357,1.1],[365,1.1],[382,4.4],[388,4.4],[400,0]]
];
// Keep steep descents; cap loaded stock-vehicle climbs at a reachable grade.
for(const points of profiles){const original=points.map(p=>p[1]);for(let i=1;i<points.length;i++){const prev=points[i-1];if(original[i]===original[i-1])points[i][1]=prev[1];else if(points[i][1]>prev[1])points[i][1]=Math.min(points[i][1],prev[1]+(points[i][0]-prev[0])*.46);}}
const gaps={0:{from:104,to:107.8,y:.6,depth:4},1:{from:145,to:149,y:1.5,depth:4.5},2:{from:199,to:203,y:1.6,depth:4},4:{from:118,to:121.8,y:1,depth:4},6:{from:126,to:130,y:2,depth:4.5},8:{from:222,to:226.0,y:2.2,depth:5}};
const bridges={0:{from:60,to:78,y:1.8},3:{from:107,to:125,y:2}};
const zones={0:[{from:91,to:107,type:'mud',friction:.50}],1:[{from:194,to:222,type:'gravel',friction:.95}],2:[{from:125,to:157,type:'wet',friction:.68}],3:[{from:140,to:159,type:'mud',friction:.55}],4:[{from:170,to:196,type:'gravel',friction:1.0}],5:[{from:210,to:235,type:'gravel',friction:1.0}],6:[{from:199,to:241,type:'gravel',friction:.93}],7:[{from:160,to:211,type:'wet',friction:.64}],8:[{from:235,to:273,type:'wet',friction:.69}]};
const landmarks=[
 [{x:40,type:'sign',text:'ЛИСИЙ БРОД'},{x:60,type:'bridge',text:'РУЧЕЙ'},{x:148,type:'cabin',text:'ЛЕСНИЧЕСТВО'}],
 [{x:67,type:'tower',text:'КАРЬЕР 02'},{x:151,type:'crane',text:'ПОГРУЗКА'},{x:244,type:'sign',text:'ТЯЖЁЛЫЙ ПОДЪЁМ'}],
 [{x:65,type:'lamp',text:'ПОСТ'},{x:165,type:'tower',text:'ЛИНИЯ 17'},{x:278,type:'cabin',text:'СВЯЗЬ'}],
 [{x:47,type:'cabin',text:'НАСОСНАЯ'},{x:106,type:'bridge',text:'ТИХИЙ ХОД'},{x:184,type:'sign',text:'БЕРЕГИ ГРУЗ'}],
 [{x:64,type:'sign',text:'ЭКСПРЕСС'},{x:120,type:'cabin',text:'ЛЕСНАЯ СТАНЦИЯ'},{x:198,type:'sign',text:'ОСТАЛСЯ ПОДЪЁМ'}],
 [{x:85,type:'crane',text:'ОПОРЫ'},{x:191,type:'tower',text:'КОНТРОЛЬ'},{x:268,type:'sign',text:'ДАТЧИКИ В КУЗОВЕ'}],
 [{x:46,type:'tower',text:'СМЕНА'},{x:162,type:'crane',text:'МОНТАЖ'},{x:243,type:'sign',text:'ДОРОГА НАВЕРХ'}],
 [{x:65,type:'lamp',text:'ПОВОРОТ'},{x:150,type:'cabin',text:'МЕДПУНКТ'},{x:286,type:'lamp',text:'ПОСТ 17'}],
 [{x:66,type:'tower',text:'ЛЭП'},{x:219,type:'lamp',text:'РАЦИЯ'},{x:367,type:'station',text:'СТАНЦИЯ 17'}]
];

// Chapter two: nine independently authored roads, not stretched copies.
regions.push(
 {name:'Солёный берег',short:'БЕРЕГ',subtitle:'Песок, дюны и маяк'},
 {name:'Топкий тракт',short:'БОЛОТО',subtitle:'Мокрая колея и деревянные переправы'},
 {name:'Северный хребет',short:'СЕВЕР',subtitle:'Снежные перевалы и ледяные спуски'}
);
routes.push(
 {name:'Дорога к маяку',region:3,kind:'delivery',length:250,boxes:3,reward:480,seed:10},
 {name:'Стекло для фонаря',region:3,kind:'careful',length:275,boxes:4,reward:650,seed:11},
 {name:'Штормовой рейс',region:3,kind:'timed',length:320,boxes:3,reward:720,limit:140,seed:12},
 {name:'Через топь',region:4,kind:'delivery',length:260,boxes:4,reward:560,seed:13},
 {name:'Плавный ход',region:4,kind:'careful',length:290,boxes:4,reward:760,seed:14},
 {name:'Посылка егерю',region:4,kind:'timed',length:325,boxes:3,reward:820,limit:155,seed:15},
 {name:'Снежная граница',region:5,kind:'delivery',length:310,boxes:4,reward:700,seed:16},
 {name:'Тёплый груз',region:5,kind:'careful',length:350,boxes:4,reward:930,seed:17},
 {name:'Полярный экспресс',region:5,kind:'timed',length:420,boxes:3,reward:1050,limit:195,seed:18}
);
profiles.push(
 [[0,0],[16,0],[30,2.2],[38,2.2],[54,.1],[65,.1],[83,4.4],[90,4.4],[106,1],[121,1],[141,5.5],[149,5.5],[169,0],[180,0],[198,3.8],[206,3.8],[226,.4],[239,.4],[250,0]],
 [[0,0],[17,0],[35,2.8],[42,2.8],[60,.2],[68,.2],[85,4.0],[93,4.0],[112,.4],[124,.4],[146,6],[154,6],[175,1.2],[184,1.2],[205,5.1],[213,5.1],[234,.5],[246,.5],[264,2.4],[275,0]],
 [[0,0],[18,0],[34,3.2],[42,3.2],[59,.2],[72,.2],[92,5.2],[99,5.2],[117,.5],[126,.5],[146,3.7],[154,3.7],[174,.3],[184,.3],[203,6.2],[212,6.2],[231,1.4],[244,1.4],[266,4.5],[274,4.5],[294,.4],[310,.4],[320,0]],
 [[0,0],[18,0],[32,1.4],[44,1.4],[58,.4],[66,.4],[90,.4],[104,1.8],[114,1.8],[134,.3],[148,.3],[162,2.5],[174,2.5],[190,.5],[200,.5],[217,3.1],[226,3.1],[242,.2],[260,0]],
 [[0,0],[19,0],[36,1.5],[46,1.5],[62,.6],[70,.6],[94,.6],[111,2.8],[121,2.8],[140,.3],[150,.3],[172,3.4],[181,3.4],[199,.8],[210,.8],[232,4],[242,4],[264,.4],[290,0]],
 [[0,0],[17,0],[33,2.1],[44,2.1],[60,.3],[76,.3],[98,3.1],[108,3.1],[127,.6],[136,.6],[160,.6],[181,2.9],[193,2.9],[215,.3],[226,.3],[249,4.0],[262,4.0],[283,.7],[297,.7],[315,1.6],[325,0]],
 [[0,0],[18,0],[38,5],[48,5],[69,.5],[83,.5],[108,8],[119,8],[142,2],[157,2],[181,8.5],[191,8.5],[214,1.2],[227,1.2],[248,6.5],[260,6.5],[285,.5],[299,.5],[310,0]],
 [[0,0],[20,0],[44,6.0],[54,6],[79,1.4],[92,1.4],[117,8.4],[130,8.4],[155,2.1],[169,2.1],[196,9.6],[210,9.6],[237,3.0],[251,3.0],[277,8.2],[291,8.2],[318,1.0],[338,1.0],[350,0]],
 [[0,0],[19,0],[41,5.4],[52,5.4],[75,.4],[87,.4],[113,7.6],[124,7.6],[149,1.6],[162,1.6],[189,9.1],[202,9.1],[226,2],[240,2],[266,7.9],[279,7.9],[304,1],[317,1],[343,8.4],[354,8.4],[381,1.4],[399,1.4],[420,0]]
);
Object.assign(gaps,{9:{from:171,to:175,y:1,depth:5},11:{from:235,to:239,y:2,depth:5},17:{from:309,to:313,y:2,depth:5.5}});
Object.assign(bridges,{12:{from:66,to:90,y:.4},13:{from:70,to:94,y:.6},14:{from:136,to:160,y:.6}});
Object.assign(zones,{
 9:[{from:40,to:66,type:'sand',friction:.83},{from:193,to:225,type:'sand',friction:.81}],
 10:[{from:92,to:132,type:'sand',friction:.83},{from:222,to:252,type:'sand',friction:.8}],
 11:[{from:155,to:193,type:'sand',friction:.85}],
 12:[{from:38,to:63,type:'mud',friction:.54},{from:119,to:157,type:'mud',friction:.56},{from:199,to:232,type:'wet',friction:.63}],
 13:[{from:42,to:67,type:'mud',friction:.58},{from:129,to:161,type:'wet',friction:.66},{from:217,to:252,type:'mud',friction:.6}],
 14:[{from:47,to:79,type:'wet',friction:.68},{from:210,to:239,type:'mud',friction:.58}],
 15:[{from:20,to:65,type:'snow',friction:.86},{from:125,to:158,type:'ice',friction:.56},{from:229,to:285,type:'snow',friction:.83}],
 16:[{from:29,to:87,type:'snow',friction:.88},{from:137,to:176,type:'ice',friction:.6},{from:252,to:305,type:'snow',friction:.86}],
 17:[{from:33,to:77,type:'snow',friction:.88},{from:129,to:168,type:'ice',friction:.6},{from:244,to:285,type:'snow',friction:.87},{from:361,to:402,type:'ice',friction:.61}]
});
landmarks.push(
 [{x:47,type:'sign',text:'СОЛЁНЫЙ БЕРЕГ'},{x:128,type:'lighthouse',text:'МАЯК'},{x:225,type:'boat',text:'ПРИЧАЛ'}],
 [{x:66,type:'boat',text:'ТИХАЯ ГАВАНЬ'},{x:158,type:'lighthouse',text:'БЕРЕГИ СТЕКЛО'},{x:248,type:'sign',text:'ФОНАРЬ МАЯКА'}],
 [{x:66,type:'sign',text:'ШТОРМОВОЕ ПРЕДУПРЕЖДЕНИЕ'},{x:177,type:'boat',text:'ПОРТ'},{x:282,type:'lighthouse',text:'БЕРЕГОВАЯ СЛУЖБА'}],
 [{x:45,type:'reeds',text:'ТОПЬ'},{x:95,type:'bridge',text:'ДЕРЕВЯННЫЙ ТРАКТ'},{x:218,type:'cabin',text:'ПОСТ ЕГЕРЯ'}],
 [{x:64,type:'reeds',text:'ТИХИЙ ХОД'},{x:140,type:'cabin',text:'БИОСТАНЦИЯ'},{x:257,type:'reeds',text:'МОКРЫЙ БЕРЕГ'}],
 [{x:48,type:'cabin',text:'ЛЕСНОЙ ПОСТ'},{x:163,type:'bridge',text:'ПЕРЕПРАВА'},{x:271,type:'reeds',text:'СТАРЫЙ ТРАКТ'}],
 [{x:72,type:'snowpost',text:'СЕВЕРНЫЙ ХРЕБЕТ'},{x:178,type:'cabin',text:'ТЁПЛЫЙ ПОСТ'},{x:286,type:'snowpost',text:'ПЕРЕВАЛ'}],
 [{x:82,type:'snowpost',text:'ЛЁД НА СПУСКЕ'},{x:198,type:'cabin',text:'ПРИЮТ'},{x:311,type:'snowpost',text:'КОТЕЛЬНАЯ'}],
 [{x:97,type:'snowpost',text:'СНЕЖНАЯ ГРАНИЦА'},{x:211,type:'tower',text:'МЕТЕОПОСТ'},{x:365,type:'cabin',text:'СЕВЕРНАЯ БАЗА'}]
);

// Every gap has an authored launch lip, landing shelf and recovery slope.
for(const [key,gap] of Object.entries(gaps)){const id=+key,points=profiles[id],lo=gap.from-10,hi=gap.to+10,base=height(lo,id),after=height(hi+1,id);gap.y=base+1.2;gap.landing=gap.y-1.6;const kept=points.filter(p=>p[0]<lo||p[0]>hi+1);kept.push([lo,base],[gap.from-4,gap.y-1.0],[gap.from,gap.y],[gap.to+1,gap.landing],[hi+1,after]);kept.sort((a,b)=>a[0]-b[0]);profiles[id]=kept;}
function height(x,id=0){const lip=gaps[id];if(lip&&x>=lip.from-4&&x<=lip.from)return lip.y-1+(x-lip.from+4)*.25;const r=routes[id]||routes[0],pts=profiles[id]||profiles[0];if(x<0)return 0;if(x>r.length)return pts[pts.length-1][1];for(let i=1;i<pts.length;i++){if(x<=pts[i][0]){const a=pts[i-1],b=pts[i],t=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0])));return a[1]+(b[1]-a[1])*t*t*(3-2*t);}}return 0;}
function groundHeight(x,id=0){const gap=gaps[id];if(gap&&x>gap.from&&x<gap.to){const edge=Math.min(x-gap.from,gap.to-x);return gap.y-gap.depth*Math.min(1,edge/.55);}let br=bridges[id]||(routes[id]&&routes[id].liftBridge);if(br&&x>br.from&&x<br.to){let edge=Math.min(x-br.from,br.to-x);return br.y-3.8*Math.min(1,edge/1.2);}let h=height(x,id);let z=(zones[id]||[]).find(z=>x>z.from&&x<z.to);if(z&&z.type==='gravel')h+=(z.roughness??.20)*Math.sin(x*1.7);if(z&&z.type==='mud')h-=.16*Math.sin((x-z.from)*.65)**2;return h;}
function surfaceAt(x,id){return(zones[id]||[]).find(z=>x>=z.from&&x<=z.to)||{type:'dirt',friction:1.04};}
// Multi-drop deliveries use authored level shoulders and keep the old road IDs.
routes[3].stops=[{x:50,name:'НАСОСНЫЙ ПОСТ'}];
routes[7].stops=[{x:53,name:'ДЕЖУРНЫЙ СКЛАД'}];
routes[9].stops=[{x:116.5,name:'РЫБАЦКИЙ ПРИЧАЛ'},{x:232.5,name:'ФОНАРЬ МАЯКА'}];
routes[12].stops=[{x:110,name:'БИОСТАНЦИЯ'},{x:195,name:'ДОМ ЕГЕРЯ'}];
routes[15].stops=[{x:76,name:'ГОРНЫЙ ПОСТ'},{x:220.5,name:'ПРИЮТ'}];
routes[16].stops=[{x:85.5,name:'ТЁПЛЫЙ СКЛАД'},{x:244,name:'КОТЕЛЬНАЯ'}];

// Forestry and expedition contracts: independent road geometry and task rules.
vehicles.push({id:'timber',driven:[0,1],name:'LARCH',tag:'Лесовоз 6×4',description:'Три оси, длинная рама и стойки для брёвен. Тяжёлый груз меняет баланс.',price:1200,width:2.72,base:1.9,axles:[-1.9,-.66,1.9],radius:.58,density:3.15,wheelDensity:1.9,torque:61.5,speed:13.4,spring:3.65,damping:.80,angularDamping:.82,airTorque:33,bedBack:-2.58,bedFront:.48,cargoX:-2.05,cargoColumns:3,capacity:6,color:'#75854d',accent:'#c9bd83',closed:false,fuelFactor:1.12});
routes.push(
 {name:'Лесосека',region:0,kind:'delivery',length:270,boxes:3,reward:900,seed:19,cargo:'logs',requires:'timber',weather:'fog'},
 {name:'Брёвна через ручей',region:0,kind:'careful',length:310,boxes:4,reward:1150,seed:20,cargo:'logs',requires:'timber',weather:'rain'},
 {name:'Вывоз до грозы',region:0,kind:'timed',length:345,boxes:3,reward:1250,seed:21,cargo:'logs',requires:'timber',limit:160,weather:'storm'},
 {name:'Запас хода',region:3,kind:'eco',length:275,boxes:3,reward:1000,seed:22,fuelStart:85,minFuel:18,weather:'clear',fuelPoints:[]},
 {name:'Смена в метель',region:5,kind:'careful',length:360,boxes:4,reward:1320,seed:23,weather:'blizzard'},
 {name:'Горный объезд',region:1,kind:'survey',length:520,boxes:3,reward:1500,seed:24,weather:'wind',checkpoints:[{x:78,name:'НИЖНИЙ ПОСТ'},{x:250,name:'ОПОРЫ'},{x:426,name:'ВЕРХНИЙ ПОСТ'}]}
);
profiles.push(
 [[0,0],[18,0],[36,2.5],[45,2.5],[65,.4],[79,.4],[99,4.0],[111,4],[132,.5],[145,.5],[166,3.8],[178,3.8],[200,1],[213,1],[237,3.0],[248,3],[270,0]],
 [[0,0],[18,0],[40,3.0],[50,3],[72,.8],[82,.8],[103,.8],[125,3.7],[137,3.7],[160,1.2],[174,1.2],[198,4.5],[211,4.5],[235,1.0],[248,1],[273,4],[283,4],[310,0]],
 [[0,0],[18,0],[38,2.4],[49,2.4],[72,.4],[85,.4],[108,4.3],[120,4.3],[143,1.0],[157,1],[180,4.8],[193,4.8],[217,.7],[231,.7],[255,3.9],[270,3.9],[293,1.0],[310,1],[329,2.1],[345,0]],
 [[0,0],[21,0],[42,2.3],[54,2.3],[77,.3],[94,.3],[117,3.2],[130,3.2],[151,.5],[169,.5],[195,3.7],[210,3.7],[234,.4],[249,.4],[275,0]],
 [[0,0],[20,0],[43,5.0],[56,5],[81,1.2],[96,1.2],[122,6.8],[136,6.8],[163,2.0],[180,2],[205,7.4],[219,7.4],[247,2.4],[262,2.4],[287,6.1],[301,6.1],[330,.8],[345,.8],[360,0]],
 [[0,0],[20,0],[44,3.4],[57,3.4],[73,.5],[84,.5],[106,4.5],[120,4.5],[145,.6],[162,.6],[185,4.3],[199,4.3],[224,.7],[242,.7],[258,.7],[282,5.2],[297,5.2],[323,1.3],[340,1.3],[366,4.8],[380,4.8],[408,.6],[434,.6],[460,4.2],[478,4.2],[505,0],[520,0]]
);
bridges[19]={from:82,to:103,y:.8};
zones[18]=[{from:48,to:80,type:'mud',friction:.58},{from:145,to:169,type:'gravel',friction:.98}];
zones[19]=[{from:138,to:177,type:'wet',friction:.7},{from:236,to:265,type:'mud',friction:.61}];
zones[20]=[{from:85,to:124,type:'wet',friction:.75},{from:236,to:276,type:'mud',friction:.64}];
zones[21]=[{from:172,to:215,type:'sand',friction:.84}];
zones[22]=[{from:35,to:87,type:'snow',friction:.9},{from:142,to:186,type:'ice',friction:.62},{from:270,to:315,type:'snow',friction:.9}];
zones[23]=[{from:104,to:137,type:'gravel',friction:.97},{from:354,to:390,type:'gravel',friction:.98}];
landmarks.push(
 [{x:59,type:'cabin',text:'ЛЕСОСЕКА'},{x:154,type:'sign',text:'ЛЕСОВОЗНАЯ ДОРОГА'},{x:249,type:'crane',text:'ПИЛОРАМА'}],
 [{x:77,type:'bridge',text:'БЕЗ РЫВКОВ'},{x:174,type:'cabin',text:'ЛЕСНОЙ ПОСТ'},{x:285,type:'crane',text:'ПРИЁМ БРЁВЕН'}],
 [{x:65,type:'sign',text:'ГРОЗОВОЙ ФРОНТ'},{x:184,type:'cabin',text:'ГАЙКА / ЛЕС'},{x:310,type:'crane',text:'ЛЕСОПИЛКА'}],
 [{x:63,type:'boat',text:'ТИХАЯ ГАВАНЬ'},{x:167,type:'sign',text:'БЕЗ ДОЗАПРАВКИ'},{x:249,type:'lighthouse',text:'БЕРЕГОВОЙ ПОСТ'}],
 [{x:92,type:'snowpost',text:'МЕТЕЛЬ'},{x:186,type:'cabin',text:'ЗИМНИЙ СКЛАД'},{x:327,type:'snowpost',text:'БЕРЕГИ ГРУЗ'}],
 [{x:78,type:'tower',text:'СКАНЕР 01'},{x:250,type:'tower',text:'СКАНЕР 02'},{x:426,type:'tower',text:'СКАНЕР 03'}]
);
const WEATHER={clear:{name:'ЯСНО',grip:1,wind:0},rain:{name:'ДОЖДЬ',grip:.94,wind:.12},storm:{name:'ГРОЗА',grip:.90,wind:.28},fog:{name:'ТУМАН',grip:.97,wind:0},snow:{name:'СНЕГ',grip:.97,wind:.1},blizzard:{name:'МЕТЕЛЬ',grip:.93,wind:.26},wind:{name:'ВЕТЕР',grip:1,wind:.25}};
const oldWeather={1:'wind',2:'rain',5:'fog',7:'fog',8:'rain',11:'storm',12:'fog',13:'rain',15:'snow',16:'snow',17:'blizzard'};
for(const [id,type] of Object.entries(oldWeather))routes[+id].weather=type;
function weatherAt(id,time=0){const type=routes[id].weather||'clear';return {...WEATHER[type],type,intensity:type==='storm'?Math.min(1,.3+time/90):type==='blizzard'?.8:1};}
function fuelPlan(id){const r=routes[id];if(r.fuelPoints)return r.fuelPoints;const positions=[r.length*.56,...(r.length>350?[r.length*.87]:[])];return positions.map((x,i)=>{const gap=gaps[id],br=bridges[id];if(gap&&x>gap.from-7&&x<gap.to+7)x=gap.to+9;if(br&&x>br.from-3&&x<br.to+3)x=br.to+5;return {x:Math.min(r.length-12,x),amount:i===0?18:12};});}

// Roadside chapter: authored services and physical loose obstacles.
const SETUPS={standard:{name:'УНИВЕРСАЛ',torque:1,speed:1,grip:1,fuel:1,cooling:1,damping:0},trail:{name:'БЕЗДОРОЖЬЕ',torque:1.07,speed:.94,grip:1.1,fuel:1.07,cooling:1,damping:.035},economy:{name:'ЭКОНОМ',torque:.96,speed:.90,grip:1,fuel:.82,cooling:1.08,damping:0}};
function preparedVehicle(id,setup='standard'){const base=vehicles.find(v=>v.id===id)||vehicles[0],t=SETUPS[setup]||SETUPS.standard;return {...base,torque:base.torque*t.torque,speed:base.speed*t.speed,damping:base.damping+t.damping,fuelFactor:(base.fuelFactor||1)*t.fuel,setup:SETUPS[setup]?setup:'standard',gripFactor:t.grip,cooling:t.cooling};}
routes.push(
 {name:'После камнепада',region:1,kind:'delivery',length:295,boxes:4,reward:1450,seed:25,weather:'clear',rocks:[{x:73,r:.19},{x:152,r:.22},{x:220,r:.17}],services:[{x:132,name:'ПОСТ КАРЬЕРА'}]},
 {name:'Ремонтная смена',region:2,kind:'service',length:350,boxes:3,reward:1540,seed:26,weather:'rain',conditionStart:58,fuelStart:78,services:[{x:160,name:'МАСТЕРСКАЯ 17',required:true}]},
 {name:'Длинный подъём',region:1,kind:'careful',length:330,boxes:4,reward:1620,seed:27,weather:'clear',heatStart:67,rocks:[{x:235,r:.18}],services:[{x:159,name:'ПЕРЕВАЛ / СЕРВИС'}]},
 {name:'Лес после шторма',region:4,kind:'service',length:370,boxes:4,reward:1750,seed:28,cargo:'logs',requires:'timber',weather:'storm',rocks:[{x:75,r:.17},{x:278,r:.20}],services:[{x:184,name:'ЛЕСНАЯ МАСТЕРСКАЯ',required:true}]}
);
profiles.push(
 [[0,0],[20,0],[44,4],[59,4],[68,1],[80,1],[103,5],[111,5],[124,.7],[142,.7],[160,3],[169,3],[191,.5],[205,.5],[217,2.4],[231,2.4],[251,6],[263,6],[282,0],[295,0]],
 [[0,0],[21,0],[44,3],[57,3],[81,.5],[96,.5],[122,4.3],[132,4.3],[148,.7],[172,.7],[197,4.4],[210,4.4],[234,.3],[247,.3],[271,4.5],[285,4.5],[311,.7],[324,.7],[344,0],[350,0]],
 [[0,0],[20,0],[67,13],[80,13],[125,26],[139,26],[152,26],[168,26],[207,38],[220,38],[230,38],[243,38],[267,30],[280,30],[305,18],[330,18]],
 [[0,0],[20,0],[48,3.2],[60,3.2],[69,.4],[81,.4],[111,4.2],[126,4.2],[153,.8],[169,.8],[177,.8],[192,.8],[218,4.8],[233,4.8],[265,1.1],[283,1.1],[310,4.3],[324,4.3],[350,0],[370,0]]
);
zones[24]=[{from:62,to:85,type:'gravel',friction:.97},{from:144,to:163,type:'gravel',friction:.95}];
zones[25]=[{from:200,to:235,type:'wet',friction:.75}];
zones[26]=[{from:80,to:125,type:'gravel',friction:.97}];
zones[27]=[{from:127,to:170,type:'mud',friction:.65},{from:244,to:282,type:'wet',friction:.73}];
landmarks.push([{x:70,type:'sign',text:'КАМНЕПАД'},{x:262,type:'crane',text:'РАСЧИСТКА'}],[{x:76,type:'cabin',text:'РЕМОНТНАЯ СМЕНА'},{x:302,type:'tower',text:'ЛИНИЯ СВЯЗИ'}],[{x:79,type:'sign',text:'СЛЕДИ ЗА МОТОРОМ'},{x:281,type:'crane',text:'ВЕРХНЯЯ СМЕНА'}],[{x:64,type:'sign',text:'ПОСЛЕ ШТОРМА'},{x:307,type:'cabin',text:'ПРИЁМ ЛЕСА'}]);
routes[0].services=[{x:150,name:'ЛЕСНОЙ СЕРВИС'}];routes[17].services=[{x:233,name:'СЕВЕРНЫЙ СЕРВИС'}];

// Tanker chapter: three independent liquid masses, not decorative cargo.
vehicles.push({id:'tanker',name:'BRINE',tag:'Автоцистерна 6×6',description:'Три ведущие оси и цистерна на 900 литров. Жидкость меняет баланс при разгоне и торможении.',price:1800,width:2.55,base:1.78,axles:[-1.80,-.60,1.78],radius:.62,density:3.2,wheelDensity:1.9,torque:43,speed:13.2,spring:3.9,damping:.83,angularDamping:.95,airTorque:30,bedBack:-2.39,bedFront:.52,cargoX:-1.7,cargoColumns:3,capacity:3,color:'#c5ad78',accent:'#ded8b2',closed:false,onlyCargo:'liquid',fuelFactor:1.08});
routes.push(
 {name:'Вода для перевала',region:1,kind:'delivery',length:270,boxes:3,reward:1850,seed:29,cargo:'liquid',requires:'tanker',litres:900,minLitres:750,weather:'clear',gates:[{x:66,name:'КАРЬЕРНЫЙ ПОСТ'}]},
 {name:'Вода в каждый дом',region:0,kind:'delivery',length:315,boxes:3,reward:2100,seed:30,cargo:'liquid',requires:'tanker',litres:900,minLitres:250,weather:'fog',drops:[{x:78,name:'ЛЕСНОЙ ДОМ',litres:300},{x:193,name:'ЛИСИЙ БРОД',litres:300}]},
 {name:'Топливо северной смены',region:5,kind:'timed',length:330,boxes:3,reward:2250,seed:31,cargo:'liquid',requires:'tanker',litres:900,minLitres:730,limit:190,weather:'snow',services:[{x:179,name:'ПОСТ СНАБЖЕНИЯ'}]},
 {name:'Береговой резерв',region:3,kind:'delivery',length:350,boxes:3,reward:2400,seed:32,cargo:'liquid',requires:'tanker',litres:900,minLitres:450,weather:'rain',drops:[{x:157,name:'БЕРЕГОВОЙ РЕЗЕРВ',litres:400}],gates:[{x:72,name:'ПОРТОВЫЙ ПОСТ'}]}
);
profiles.push(
 [[0,0],[20,0],[43,3.6],[54,3.6],[58,.8],[80,.8],[101,4.8],[114,4.8],[137,1.0],[153,1],[177,5.5],[191,5.5],[216,.7],[233,.7],[254,2.2],[270,0]],
 [[0,0],[20,0],[44,2.8],[55,2.8],[70,.5],[87,.5],[111,4.3],[125,4.3],[151,.7],[164,.7],[185,.7],[201,.7],[225,4.1],[241,4.1],[267,.8],[282,.8],[304,0],[315,0]],
 [[0,0],[20,0],[45,4.5],[59,4.5],[87,1.2],[103,1.2],[130,6.2],[144,6.2],[171,1.4],[187,1.4],[215,6.8],[230,6.8],[258,1.8],[274,1.8],[301,4.6],[313,4.6],[330,0]],
 [[0,0],[20,0],[45,2.8],[55,2.8],[62,.6],[86,.6],[110,3.5],[124,3.5],[144,.7],[168,.7],[194,4.8],[208,4.8],[234,1.0],[249,1.0],[276,4.0],[291,4.0],[316,.4],[333,.4],[350,0]]
);
zones[28]=[{from:158,to:193,type:'gravel',friction:.98,roughness:.06}];zones[29]=[{from:130,to:165,type:'mud',friction:.64}];zones[30]=[{from:40,to:104,type:'snow',friction:.91},{from:151,to:187,type:'ice',friction:.70}];zones[31]=[{from:210,to:245,type:'sand',friction:.9}];
landmarks.push([{x:115,type:'crane',text:'ВОДА ДЛЯ СМЕНЫ'},{x:235,type:'cabin',text:'ВЕРХНИЙ РЕЗЕРВУАР'}],[{x:112,type:'cabin',text:'ЛЕСНОЕ СНAБЖЕНИЕ'},{x:276,type:'station',text:'ВОДОНАПОРНАЯ'}],[{x:106,type:'snowpost',text:'СЕВЕРНАЯ СМЕНА'},{x:289,type:'cabin',text:'ТОПЛИВО / ПОСТ'}],[{x:123,type:'boat',text:'ПОРТ'},{x:278,type:'lighthouse',text:'МАЯК'}]);


// Eight distinct roads for the expanded expedition. Old route IDs stay intact.
routes.push(
 {name:'Лесная низина',region:0,kind:'delivery',length:290,boxes:3,reward:1800,seed:33,weather:'clear'},
 {name:'Нижний карьер',region:1,kind:'careful',length:310,boxes:4,reward:1950,seed:34,weather:'wind',services:[{x:155,name:'НИЖНЯЯ МАСТЕРСКАЯ'}]},
 {name:'Огни по адресам',region:2,kind:'delivery',length:340,boxes:4,reward:2050,seed:35,weather:'rain',stops:[{x:78,name:'ЛИНИЯ СВЯЗИ'},{x:207,name:'ДОМ МАСТЕРА'}]},
 {name:'Дюны и прилив',region:3,kind:'eco',length:320,boxes:3,reward:2100,seed:36,weather:'wind',fuelStart:100,minFuel:18,fuelPoints:[]},
 {name:'Дальний настил',region:4,kind:'careful',length:350,boxes:4,reward:2250,seed:37,weather:'fog'},
 {name:'За северным седлом',region:5,kind:'timed',length:380,boxes:3,reward:2350,seed:38,weather:'snow',limit:210,services:[{x:211,name:'ТЁПЛЫЙ ПОСТ'}]},
 {name:'Лес к новой пристани',region:4,kind:'delivery',length:355,boxes:4,reward:2500,seed:39,cargo:'logs',requires:'timber',weather:'rain',services:[{x:191,name:'ПОСТ ЛЕСОВОЗОВ'}]},
 {name:'Резерв на рассвете',region:2,kind:'delivery',length:365,boxes:3,reward:2700,seed:40,cargo:'liquid',requires:'tanker',litres:900,minLitres:300,weather:'fog',gates:[{x:63,name:'ПОСТ СНАБЖЕНИЯ'}],drops:[{x:148,name:'КОТЕЛЬНАЯ',litres:250},{x:267,name:'ГЕНЕРАТОРНАЯ',litres:300}]}
);
profiles.push(
 [[0,0],[20,0],[43,2.6],[55,2.6],[75,-4.8],[96,-4.8],[121,-1.1],[136,-1.1],[162,-6],[177,-6],[204,-1.8],[219,-1.8],[248,3],[264,3],[290,0]],
 [[0,0],[20,0],[49,5],[65,5],[95,-2.5],[111,-2.5],[143,.4],[168,.4],[198,6.4],[214,6.4],[241,1],[259,1],[287,4.8],[297,4.8],[310,0]],
 [[0,0],[20,0],[46,3.1],[58,3.1],[70,.3],[86,.3],[114,-3.5],[131,-3.5],[158,2.8],[173,2.8],[199,.4],[216,.4],[242,4.7],[258,4.7],[287,-1.4],[303,-1.4],[326,1.4],[340,0]],
 [[0,0],[20,0],[48,3.7],[61,3.7],[90,-2],[105,-2],[132,3.3],[150,3.3],[177,.2],[194,.2],[221,4.7],[238,4.7],[267,1.1],[283,1.1],[310,0],[320,0]],
 [[0,0],[20,0],[49,2.8],[64,2.8],[87,-3.2],[111,-3.2],[141,1.8],[156,1.8],[185,-4.2],[204,-4.2],[234,2.6],[250,2.6],[278,-1.6],[295,-1.6],[327,3.4],[338,3.4],[350,0]],
 [[0,0],[20,0],[48,4.6],[65,4.6],[94,.8],[109,.8],[140,6.7],[158,6.7],[186,1.3],[222,1.3],[251,7.2],[267,7.2],[298,2.4],[314,2.4],[344,5.8],[358,5.8],[380,0]],
 [[0,0],[20,0],[48,2.7],[61,2.7],[90,-2.5],[107,-2.5],[139,3.1],[153,3.1],[183,.6],[200,.6],[230,3.8],[246,3.8],[277,-1.8],[294,-1.8],[325,2.9],[340,2.9],[355,0]],
 [[0,0],[20,0],[42,2.8],[51,2.8],[57,.5],[81,.5],[109,3.5],[123,3.5],[140,.5],[157,.5],[186,-1.8],[201,-1.8],[229,3.3],[243,3.3],[259,.5],[276,.5],[305,4.1],[320,4.1],[347,0],[365,0]]
);
bridges[32]={from:76,to:94,y:-4.8};bridges[36]={from:88,to:109,y:-3.2};
zones[32]=[{from:153,to:183,type:'mud',friction:.69}];zones[33]=[{from:179,to:217,type:'gravel',friction:.99,roughness:.09}];zones[34]=[{from:92,to:130,type:'wet',friction:.77}];zones[35]=[{from:126,to:160,type:'sand',friction:.90},{from:252,to:290,type:'sand',friction:.91}];zones[36]=[{from:171,to:215,type:'mud',friction:.69}];zones[37]=[{from:31,to:78,type:'snow',friction:.95},{from:281,to:318,type:'ice',friction:.72}];zones[38]=[{from:73,to:112,type:'wet',friction:.77},{from:260,to:299,type:'mud',friction:.7}];zones[39]=[{from:175,to:206,type:'wet',friction:.82}];
landmarks.push([{x:77,type:'bridge',text:'ЛЕСНОЙ РУЧЕЙ'},{x:173,type:'cabin',text:'ДОЛИНА'}],[{x:67,type:'crane',text:'УСТУП'},{x:228,type:'sign',text:'НИЖНИЙ КАРЬЕР'}],[{x:132,type:'lamp',text:'НОЧНАЯ ЛИНИЯ'},{x:295,type:'station',text:'НОВЫЕ ОГНИ'}],[{x:94,type:'boat',text:'ПРИЛИВ'},{x:240,type:'lighthouse',text:'БЕРЕГОВОЙ СВЕТ'}],[{x:89,type:'bridge',text:'НАСТИЛ'},{x:203,type:'reeds',text:'ТИХАЯ ТОПЬ'}],[{x:137,type:'snowpost',text:'СЕДЛО'},{x:319,type:'cabin',text:'ПРИЮТ'}],[{x:111,type:'cabin',text:'ЛЕСНОЙ ПОСТ'},{x:303,type:'boat',text:'НОВАЯ ПРИСТАНЬ'}],[{x:114,type:'lamp',text:'СНАБЖЕНИЕ'},{x:321,type:'station',text:'РАССВЕТ'}]);


// River chapter: six authored routes, keeping previous IDs unchanged.
routes.push(
 {name:'Речной обход',region:0,kind:'delivery',length:290,boxes:3,reward:2750,seed:41,weather:'clear',fords:[{from:68,to:104,level:.35,name:'ЛЕСНОЙ БРОД'}]},
 {name:'Глубокая переправа',region:1,kind:'careful',length:310,boxes:4,reward:2950,seed:42,weather:'clear',requires:'mule',fords:[{from:112,to:152,level:.35,name:'ГЛУБОКИЙ БРОД'}],services:[{x:236,name:'КАРЬЕРНЫЙ СЕРВИС'}]},
 {name:'Огни за рекой',region:2,kind:'delivery',length:330,boxes:3,reward:3050,seed:43,weather:'fog',liftBridge:{from:95,to:105,y:.6,control:86,name:'НОЧНАЯ ПЕРЕПРАВА'},stops:[{x:178,name:'ЛИНИЯ ЗА РЕКОЙ'}]},
 {name:'Пристань после прилива',region:3,kind:'delivery',length:340,boxes:3,reward:3250,seed:44,weather:'rain',cargo:'liquid',requires:'tanker',litres:900,minLitres:550,fords:[{from:118,to:155,level:.30,name:'ПРИЛИВНЫЙ БРОД'}],drops:[{x:228,name:'РЕЗЕРВ ПРИСТАНИ',litres:250}]},
 {name:'Лес на другой берег',region:4,kind:'delivery',length:355,boxes:4,reward:3350,seed:45,weather:'rain',cargo:'logs',requires:'timber',liftBridge:{from:143,to:155,y:.4,control:134,name:'ЛЕСНОЙ РАЗВОДНОЙ'},fords:[{from:240,to:267,level:.25,name:'ТОПКИЙ РУЧЕЙ'}]},
 {name:'Мост к зимнему посту',region:5,kind:'timed',length:380,boxes:3,reward:3450,seed:46,weather:'snow',limit:220,liftBridge:{from:177,to:187,y:1,control:168,name:'СЕВЕРНЫЙ МОСТ'}}
);
profiles.push(
 [[0,0],[20,0],[43,3.2],[53,3.2],[62,.9],[68,.35],[77,-.55],[94,-.55],[104,.35],[114,.9],[140,4.2],[156,4.2],[183,.6],[200,.6],[229,4.7],[244,4.7],[270,.5],[290,0]],
 [[0,0],[20,0],[47,4],[63,4],[87,1],[102,.8],[112,.35],[122,-1.05],[142,-1.05],[152,.35],[162,.8],[188,4.8],[204,4.8],[227,1],[245,1],[274,5.2],[289,5.2],[310,0]],
 [[0,0],[20,0],[43,3.3],[58,3.3],[77,.6],[110,.6],[137,3.7],[152,3.7],[170,.7],[188,.7],[216,4.8],[232,4.8],[259,.8],[276,.8],[305,3.5],[318,3.5],[330,0]],
 [[0,0],[20,0],[49,3.4],[65,3.4],[94,.9],[109,.9],[118,.30],[127,-.55],[146,-.55],[155,.30],[165,.9],[189,4.1],[204,4.1],[220,.7],[236,.7],[265,4.6],[282,4.6],[310,.5],[340,0]],
 [[0,0],[20,0],[48,3],[62,3],[91,.7],[108,.7],[127,.4],[160,.4],[186,3.9],[202,3.9],[224,.8],[234,.8],[240,.25],[248,-.45],[259,-.45],[267,.25],[277,.8],[308,4.4],[326,4.4],[355,0]],
 [[0,0],[20,0],[49,4.4],[66,4.4],[96,1],[112,1],[142,4.4],[151,4.4],[162,1],[193,1],[221,5],[238,5],[264,1.2],[281,1.2],[311,6.1],[328,6.1],[355,1.0],[380,0]]
);
zones[40]=[{from:68,to:104,type:'water',friction:.88}];zones[41]=[{from:112,to:152,type:'water',friction:.9}];zones[42]=[{from:236,to:270,type:'wet',friction:.76}];zones[43]=[{from:118,to:155,type:'water',friction:.92}];zones[44]=[{from:240,to:267,type:'water',friction:.88},{from:47,to:75,type:'mud',friction:.72}];zones[45]=[{from:244,to:279,type:'ice',friction:.76}];
landmarks.push([{x:61,type:'sign',text:'БРОД / ТИХИЙ ХОД'},{x:117,type:'cabin',text:'ЕГЕРЬ'}],[{x:104,type:'sign',text:'MULE / ГЛУБОКО'},{x:168,type:'crane',text:'ВЕРХНИЙ СКЛАД'}],[{x:72,type:'lamp',text:'ПЕРЕПРАВА'},{x:289,type:'station',text:'НОВЫЕ ОГНИ'}],[{x:106,type:'boat',text:'ПРИЛИВ'},{x:283,type:'lighthouse',text:'РЕЗЕРВ'}],[{x:118,type:'cabin',text:'ЛЕСНОЙ ПОСТ'},{x:269,type:'reeds',text:'РУЧЕЙ'}],[{x:137,type:'snowpost',text:'СЕВЕРНАЯ ПЕРЕПРАВА'},{x:333,type:'cabin',text:'ЗИМНИЙ ПОСТ'}]);

// Expedition 0.18: two authored routes. Legacy IDs and geometry remain intact.
routes.push(
 {name:'Хребет ветров',region:0,kind:'delivery',length:245,boxes:3,reward:510,seed:47,weather:'fog',drops:[{x:151,name:'Наблюдательный пост'}]},
 {name:'Каменная лестница',region:1,kind:'careful',length:270,boxes:5,reward:790,seed:48,weather:'clear',requires:'mule',rocks:[{x:82,r:.25},{x:182,r:.22}],services:[{x:145,name:'Проверка тормозов',required:true}]}
);
profiles.push(
 [[0,0],[20,0],[35,2.3],[48,2.3],[64,.5],[76,.5],[92,5.0],[103,5.0],[121,1.5],[159,1.5],[178,5.3],[190,5.3],[208,.8],[219,.8],[233,1.8],[245,0]],
 [[0,0],[22,0],[40,2.4],[54,2.4],[72,.7],[92,.7],[111,4.7],[123,4.7],[137,2],[155,2],[175,5.8],[190,5.8],[209,1.1],[223,1.1],[247,3.0],[260,3.0],[270,0]]
);
bridges[46]={from:121,to:139,y:1.5};
zones[46]=[{from:65,to:79,type:'mud',friction:.56},{from:196,to:219,type:'wet',friction:.68}];
zones[47]=[{from:72,to:96,type:'gravel',friction:.93},{from:157,to:178,type:'gravel',friction:.91}];
landmarks[46]=[{x:35,type:'pine'},{x:105,type:'pine'},{x:153,type:'house'},{x:214,type:'pine'}];
landmarks[47]=[{x:55,type:'rock'},{x:115,type:'crane'},{x:165,type:'rock'}];

const firstLightFactory=typeof module==='object'?require('./first-light-model.js'):root.FirstLightModel;
const firstLight=firstLightFactory({P,V,routes,profiles,bridges,zones,landmarks,height,groundHeight,groundVertices,fuelPlan});

const waterRunFactory=typeof module==='object'?require('./water-run-model.js'):root.WaterRunModel;
const waterRun=waterRunFactory({routes,profiles,zones,landmarks});

const recoveryFactory=typeof module==='object'?require('./recovery-model.js'):root.RecoveryModel;
const recoveryRun=recoveryFactory({P,V,routes,profiles,zones,landmarks});

// Versioned contracts add tasks without changing collision geometry or old saves.
const contractCache=new Map();
function contractRoute(id,edition=23){
 if(id===4&&edition===23)return recoveryRun.route();if(edition===23)edition=22;
 if(id===3&&edition===22)return waterRun.route();if(edition===22)edition=21;
 if(id===0&&edition===21)return firstLight.route();if(edition===21)edition=20;
 const base=routes[id]||routes[0];if(edition!==20)return base;if(contractCache.has(id))return contractCache.get(id);
 const stops=base.stops?base.stops.map(s=>({...s})):[];
 if(id===0)stops.push({x:50,name:'ЛЕСНИЧЕСТВО'});
 if(id===4)stops.push({x:53,name:'ЭКСПРЕСС-ПОСТ'});
 const sectors=[],points=profiles[id];
 for(let n=1;n<points.length&&sectors.length<2;n++){
  const a=points[n-1],b=points[n],gap=gaps[id];
  if(a[0]<25||b[0]>base.length-15||b[0]-a[0]<6||a[1]-b[1]<1.8||gap&&gap.from>a[0]-12&&gap.from<b[0]+15)continue;
  sectors.push({from:a[0],to:b[0],limit:3.3,reward:35,name:'ПЛАВНЫЙ СПУСК'});
 }
 const route={...base,...(stops.length?{stops}:{}),sectors};contractCache.set(id,route);return route;
}

class Drive{
 constructor(id,levels,vehicleId='rover',setup='standard',edition=0,options={}){
 this.id=id;this.roadId=id;this.edition=edition===23&&id===4?23:edition===22&&id===3?22:edition===21&&id===0?21:edition===20?20:0;this.route=this.edition===23?recoveryRun.init(this,options):this.edition===22?waterRun.init(this,options):this.edition===21?firstLight.init(this,options):contractRoute(id,this.edition);this.sectors=(this.route.sectors||[]).map(s=>({...s,entered:false,done:false,passed:false,maxSpeed:0,initialCargo:0,initialHits:0}));this.levels=levels||[0,0,0];this.vehicle=preparedVehicle(vehicleId,setup);const m=this.vehicle;if(this.route.requires&&m.id!==this.route.requires)throw new Error(this.route.requires==='rover'?'Для этого рейса нужен пикап ROVER':this.route.requires==='timber'?'Для этого рейса нужен лесовоз LARCH':this.route.requires==='tanker'?'Для этого рейса нужна автоцистерна BRINE':'Для этого рейса нужен грузовик MULE');if(m.onlyCargo&&this.route.cargo!==m.onlyCargo)throw new Error('Автоцистерна перевозит только жидкость');
 this.dispatchTerms=terms24.create(options.dispatchTerms,id,this.edition);this.world=new P.World(V(0,-12));this.lowGear=false;this.shiftCooldown=0;this.gearShifts=0;this.time=0;this.fuel=this.route.fuelStart??100;this.fuelUsed=0;this.lastFuelX=6;this.winchCharges=options.recoveryBonus===true?3:2;this.winchTime=0;this.winchAnchor=null;this.checkpoints=(this.route.checkpoints||[]).map(s=>({...s,done:false}));this.coins=0;this.distance=0;this.state='drive';this.reason='';this.flip=0;this.stuckTime=0;this.groundCount=0;this.events=[];this.paid=false;this.throttle=0;this.hardLandings=0;this.condition=this.route.conditionStart??100;this.temperature=this.route.heatStart??35;this.overheated=false;this.peakTemperature=this.temperature;this.services=(this.route.services||[]).map(x=>({...x,done:false,elapsed:0}));this.serviceHold=false;this.rocks=[];this.airDrop=0;this.airTicks=0;this.wasAir=false;this.brakeHeld=0;this.slip=0;this.slipTime=0;this.trace=[];this.traceOverflow=false;this.traceAt=0;this.lastImpact=0;this.fluidCapacity=this.route.litres||0;this.fluidLitres=this.fluidCapacity;this.fluidDelivered=0;this.fluidSlosh=0;this.peakSlosh=0;this.fluidLeak=0;this.fluidMasses=[];this.gates=[];this.stops=(this.route.drops||this.route.stops||[]).map((s,i)=>({...s,index:i,done:false,elapsed:0,boxIndex:-1,warned:false}));this.parkingHold=false;
 const ground=this.world.createBody();this.groundBody=ground;ground.setUserData('ground');const vertices=groundVertices(this.roadId).map(p=>V(p.x,p.y));this.groundVertices=vertices;ground.createFixture(P.Chain(vertices),{friction:1.0});
 const y=m.radius+.50;
 this.car=this.world.createDynamicBody({position:V(6,y),bullet:true,angularDamping:m.angularDamping,linearDamping:.04});const group=-1,fd={density:m.density,friction:.65,filterGroupIndex:group};
 this.car.createFixture(P.Box(m.width,.18,V(0,.08)),fd);
 const cab=['timber','tanker'].includes(m.id)?[V(.63,.23),V(2.51,.23),V(2.13,1.37),V(.88,1.43)]:m.closed?[V(.50,.23),V(1.92,.23),V(1.62,1.20),V(.72,1.30)]:[V(.25,.23),V(m.width-.28,.23),V(m.width-.53,1.01),V(.45,1.10)];
 this.car.createFixture(P.Polygon(cab),{density:m.density*.66,friction:.55,filterGroupIndex:group});
 this.car.createFixture(P.Box(.065,m.id==='timber'?.72:m.closed?.81:.30,V(m.bedBack,m.id==='timber'?.93:m.closed?1.0:.50)),{density:.7,friction:.65,filterGroupIndex:group});
 this.car.createFixture(P.Box(.055,m.id==='timber'?.74:m.closed?.76:.30,V(m.bedFront,m.id==='timber'?.96:m.closed?.96:.50)),{density:.6,friction:.65,filterGroupIndex:group});
 if(m.id==='tanker'){this.car.createFixture(P.Box(1.45,.63,V(-.69,1.03)),{density:.35,friction:.5,filterGroupIndex:group});this.car.createFixture(P.Circle(V(-2.14,1.03),.63),{density:.25,friction:.5,filterGroupIndex:group});}
 if(m.closed)this.car.createFixture(P.Box(1.27,.055,V(-.82,1.86)),{density:.25,friction:.4,filterGroupIndex:group});
 this.bridge=[];if(this.edition!==21)this.createRoadBridge(ground);
 for(const rock of this.route.rocks||[]){const b=this.world.createDynamicBody({position:V(rock.x,height(rock.x,this.roadId)+rock.r+.02),bullet:true,linearDamping:.28,angularDamping:.5});b.setUserData('rock');b.createFixture(P.Circle(rock.r),{density:3.2,friction:.50,restitution:.03});this.rocks.push({body:b,radius:rock.r,index:this.rocks.length});}
for(const data of this.route.gates||[]){const h=height(data.x,this.roadId),pivot=V(data.x+6,h+2.12),b=this.world.createDynamicBody({position:V(pivot.x-1.6,pivot.y),angularDamping:.6,bullet:true});b.setUserData('gate');b.createFixture(P.Box(1.6,.095),{density:1,friction:.3});const joint=this.world.createJoint(P.RevoluteJoint({enableLimit:true,lowerAngle:-1.48,upperAngle:0,enableMotor:true,motorSpeed:0,maxMotorTorque:600},ground,b,pivot));this.gates.push({...data,body:b,joint,pivot,elapsed:0,requested:false,open:false});}
 this.wheels=[];this.joints=[];this.travel=[];
 for(let off of (m.axles||[-m.base,m.base])){let wheel=this.world.createDynamicBody({position:V(6+off,m.radius),bullet:true});wheel.setUserData('wheel');wheel.createFixture(P.Circle(m.radius),{density:m.wheelDensity,friction:(1.35+this.levels[2]*.15)*m.gripFactor,filterGroupIndex:group});this.wheels.push(wheel);this.joints.push(this.world.createJoint(P.WheelJoint({enableMotor:false,maxMotorTorque:m.torque*(1+this.levels[0]*.12),frequencyHz:m.spring+this.levels[1]*.16,dampingRatio:Math.min(.92,m.damping+this.levels[1]*.025)},this.car,wheel,wheel.getPosition(),V(0,1))));}
 this.boxes=[];
 if(this.fluidCapacity){for(let i=0;i<3;i++){const home={x:-1.65+i*.82,y:1.0},b=this.world.createDynamicBody({position:V(6+home.x,y+home.y),bullet:true});b.createFixture(P.Circle(.18),{density:20,isSensor:true,filterGroupIndex:group});const joint=this.world.createJoint(P.PrismaticJoint({enableLimit:true,lowerTranslation:-.32,upperTranslation:.32},this.car,b,b.getPosition(),V(1,0)));const box={body:b,lost:false,delivered:false,out:0,index:i,kind:'liquid',home,joint};this.boxes.push(box);this.fluidMasses.push(box);}}else
 for(let i=0;i<this.route.boxes;i++){
 const pump=this.route.cargo==='waterkit'&&i===0,controls=this.route.cargo==='waterkit'&&i===1,machine=this.route.cargo==='generator',log=this.route.cargo==='logs',col=log?0:i%m.cargoColumns,row=log?i:Math.floor(i/m.cargoColumns),home={x:pump?-1.1:controls?-.28:machine?-.84:log?-1.05:m.cargoX+col*.69,y:pump?.73:controls?.62:machine?.82:log?.53+row*.36:.62+row*.66};
 const b=this.world.createDynamicBody({position:V(6+home.x,y+home.y),angularDamping:log?.65:.4,bullet:true});
 if(controls)b.createFixture(P.Box(.27,.27),{density:.8,friction:.78,restitution:.015});else if(pump)b.createFixture(P.Box(.52,.40),{density:2.7,friction:.78,restitution:.01});else if(machine)b.createFixture(P.Box(.79,.44),{density:3.1,friction:.78,restitution:.01});else if(log){b.createFixture(P.Box(1.22,.15),{density:1.2,friction:.7,restitution:.035});for(const end of [-1.22,1.22])b.createFixture(P.Circle(V(end,0),.15),{density:1.2,friction:.7,restitution:.035});}else b.createFixture(P.Box(.32,.32),{density:.8,friction:.78,restitution:.015});
 const span=pump?.38:machine?.55:log?1.12:.19,anchor=V(6+home.x-(log||machine||pump?span:0),y+.20);
 const strap=this.world.createJoint(P.DistanceJoint({frequencyHz:pump?2.2:machine?1.9:log?3.2:2.8,dampingRatio:log?.65:.6,collideConnected:true},this.car,b,anchor,V(b.getPosition().x-(log||machine||pump?span:0),b.getPosition().y)));
 const strap2=this.world.createJoint(P.DistanceJoint({frequencyHz:pump?2.2:machine?1.9:log?3.2:2.8,dampingRatio:log?.65:.6,collideConnected:true},this.car,b,V(6+home.x+(machine||pump?span:log?span:.38),y+.20),V(b.getPosition().x+(machine||pump?span:log?span:.22),b.getPosition().y+(log?.10:.15))));
 this.boxes.push({body:b,lost:false,out:0,index:i,kind:pump?'pump':controls?'controls':machine?'generator':log?'log':this.edition===23?'toolbox':'crate',strap,strap2,home});
 }

 this.createCrossings(ground);if(this.edition===23)this.createRecoveryRig();if(this.edition===21)this.createRoadBridge(ground);
 this.items=[];for(let x=22;x<this.route.length-9;x+=12)this.items.push({x,y:height(x,this.roadId)+1.05,type:'coin',got:false});for(const point of fuelPlan(this.roadId))this.items.push({x:point.x,y:height(point.x,this.roadId)+1,type:'fuel',amount:point.amount,got:false});
 this.world.on('pre-solve',c=>{let a=c.getFixtureA(),b=c.getFixtureB();if(a.getBody().getUserData()==='ground'||b.getBody().getUserData()==='ground'){let w=a.getBody().getUserData()==='ground'?b:a;let z=surfaceAt(w.getBody().getPosition().x,this.roadId);c.setFriction(Math.sqrt(z.friction*w.getFriction())*weatherAt(this.id,this.time).grip);}});this.world.on('begin-contact',c=>this.contact(c,1));this.world.on('end-contact',c=>this.contact(c,-1));for(let settle=0;settle<48;settle++){this.suspensionForces();this.world.step(1/120,6,3);}
 }
 createRoadBridge(ground){const br=bridges[this.roadId];if(br){let previous=ground;for(let x=br.from;x<br.to;x+=1.5){const block=this.world.createDynamicBody({position:V(x+.75,br.y-.09),linearDamping:.3,angularDamping:.5});block.setUserData('bridge');block.createFixture(P.Box(.75,.10),{density:5,friction:1.25});this.world.createJoint(P.RevoluteJoint({},previous,block,V(x,br.y-.09)));this.world.createJoint(P.DistanceJoint({frequencyHz:2.5,dampingRatio:.8},ground,block,V(x+.75,br.y+4),V(x+.75,br.y-.09)));this.bridge.push(block);previous=block;}this.world.createJoint(P.RevoluteJoint({},previous,ground,V(br.to,br.y-.09)));}}
 contact(c,sign){let a=c.getFixtureA().getBody().getUserData(),b=c.getFixtureB().getBody().getUserData();if(a==='wheel'&&(b==='ground'||b==='bridge')||b==='wheel'&&(a==='ground'||a==='bridge'))this.groundCount=Math.max(0,this.groundCount+sign);}
 remaining(){if(this.fluidCapacity)return Math.ceil((this.fluidLitres+this.fluidDelivered)/300);return this.boxes.filter(b=>!b.lost).length;}
 aboard(){if(this.fluidCapacity)return this.fluidLitres/300;return this.boxes.filter(b=>!b.lost&&!b.delivered).length;}
 delivered(){if(this.fluidCapacity)return this.fluidDelivered/300;return this.boxes.filter(b=>b.delivered).length;}
 nextStop(){return this.stops.find(s=>!s.done)||null;}
 updateStops(gas,brake,dt){
  const stop=this.nextStop();if(!stop)return;const duration=stop.duration||1.3;const p=this.car.getPosition(),v=this.car.getLinearVelocity();
  if(!stop.warned&&p.x>stop.x-18){stop.warned=true;this.events.push({type:'stopApproach',index:stop.index});}
  const angle=Math.atan2(Math.sin(this.car.getAngle()),Math.cos(this.car.getAngle()));
  const ready=Math.abs(p.x-stop.x)<=3.1&&this.groundCount>=2&&Math.abs(v.x)<.45&&Math.abs(v.y)<.7&&Math.abs(angle)<.40&&brake&&!gas;
  if(!ready){stop.elapsed=0;stop.boxIndex=-1;return;}
  this.parkingHold=true;
  if(this.fluidCapacity){if(this.fluidLitres<stop.litres+(this.route.minLitres||0)){this.end('liquid');return;}stop.elapsed+=dt;if(stop.elapsed>=2){this.fluidLitres-=stop.litres;this.fluidDelivered+=stop.litres;this.syncFluidMass();stop.done=true;stop.elapsed=2;this.events.push({type:'stopComplete',index:stop.index,name:stop.name,litres:stop.litres});}return;}
  if(stop.boxIndex<0){const boxes=this.boxes.filter(b=>!b.lost&&!b.delivered&&(stop.cargoIndex===undefined||b.index===stop.cargoIndex)).sort((a,b)=>this.car.getLocalPoint(b.body.getPosition()).y-this.car.getLocalPoint(a.body.getPosition()).y);if(!boxes.length){this.end('cargo');return;}stop.boxIndex=boxes[0].index;}
  if(this.edition===22&&this.pump.integrity<70){this.end('pump');return;}
  stop.elapsed+=dt;
  if(stop.elapsed>=duration){const box=this.boxes[stop.boxIndex];box.delivered=true;box.stopIndex=stop.index;box.out=0;for(const joint of [box.strap,box.strap2])if(joint)this.world.destroyJoint(joint);box.strap=box.strap2=null;box.body.setActive(false);stop.done=true;stop.elapsed=duration;this.events.push({type:'stopComplete',index:stop.index,name:stop.name});}
 }

 nextGate(){return this.gates.find(g=>!g.open)||null;}
 updateGates(gas,brake,dt){for(const gate of this.gates){if(gate.open)continue;if(!gate.requested){const p=this.car.getPosition(),v=this.car.getLinearVelocity(),a=Math.atan2(Math.sin(this.car.getAngle()),Math.cos(this.car.getAngle())),ready=Math.abs(p.x-gate.x)<=2.8&&this.groundCount>=2&&Math.abs(v.x)<.45&&Math.abs(a)<.4&&brake&&!gas;gate.elapsed=ready?gate.elapsed+dt:0;if(gate.elapsed>=1){gate.requested=true;this.events.push({type:'gateRequest'});}}gate.joint.setMotorSpeed(gate.requested?-1.2:0);if(gate.requested&&gate.joint.getJointAngle()< -1.40){gate.open=true;gate.body.getFixtureList().setSensor(true);this.events.push({type:'gateOpen'});}}}
 syncFluidMass(){const ratio=this.fluidCapacity?this.fluidLitres/this.fluidCapacity:0;for(const mass of this.fluidMasses){mass.body.getFixtureList().setDensity(Math.max(.02,20*ratio));mass.body.resetMassData();}}
 fluidForces(){if(!this.fluidCapacity)return;let shift=0;for(const box of this.fluidMasses){const q=this.car.getLocalPoint(box.body.getPosition()),axis=this.car.getWorldVector(V(1,0)),v=box.body.getLinearVelocity(),cv=this.car.getLinearVelocity(),center=this.car.getWorldCenter(),home=this.car.getWorldPoint(V(box.home.x,box.home.y)),omega=this.car.getAngularVelocity(),dx=q.x-box.home.x,rel=(v.x-cv.x+omega*(home.y-center.y))*axis.x+(v.y-cv.y-omega*(home.x-center.x))*axis.y,mass=box.body.getMass(),force=(-dx*5-rel*1.7)*mass;box.body.applyForce(V(axis.x*force,axis.y*force),box.body.getWorldCenter(),true);this.car.applyForce(V(-axis.x*force,-axis.y*force),home,true);shift+=dx;}this.fluidSlosh=shift/3;this.peakSlosh=Math.max(this.peakSlosh,Math.abs(this.fluidSlosh));}
 updateFluid(dt){if(!this.fluidCapacity)return;const leak=this.condition<70?(70-this.condition)*.012:0;this.fluidLeak=leak;if(leak&&this.fluidLitres>0){this.fluidLitres=Math.max(0,this.fluidLitres-leak*dt);this.syncFluidMass();}}
 wholeCargo(){return this.edition===23?this.remaining()===1&&this.tow.condition>=60:this.edition===22?this.remaining()===2&&this.pump.integrity>=95:this.edition===21?this.remaining()===1&&this.machine.integrity>=95:this.fluidCapacity?this.fluidLitres+this.fluidDelivered>=this.fluidCapacity-.5:this.remaining()===this.route.boxes;}
 nextService(){return this.services.find(s=>!s.done)||null;}
 updateServices(gas,brake,dt){this.serviceHold=false;const site=this.nextService();if(!site)return;const p=this.car.getPosition(),v=this.car.getLinearVelocity(),a=Math.atan2(Math.sin(this.car.getAngle()),Math.cos(this.car.getAngle()));
 const ready=Math.abs(p.x-site.x)<=3&&this.groundCount>=2&&Math.abs(v.x)<.45&&Math.abs(v.y)<.7&&Math.abs(a)<.4&&brake&&!gas;
 if(!ready){site.elapsed=0;return;}this.serviceHold=true;site.elapsed+=dt;
 if(site.elapsed>=2.2){site.done=true;site.elapsed=2.2;const repaired=Math.min(100,this.condition+38)-this.condition,refilled=Math.min(100,this.fuel+12)-this.fuel;this.condition+=repaired;this.fuel+=refilled;this.temperature=Math.min(this.temperature,55);this.overheated=false;this.events.push({type:'service',repaired,refilled,name:site.name});}}
 updateEngine(gas,brake,dt){const p=this.car.getPosition(),v=this.car.getLinearVelocity(),weather=weatherAt(this.id,this.time),grade=Math.max(0,(height(p.x+1,this.roadId)-height(p.x-1,this.roadId))/2),ambient=['snow','blizzard'].includes(weather.type)?18:['rain','storm'].includes(weather.type)?27:35;
 const heating=gas&&!brake?this.throttle*(2.3+grade*3+this.cargoLoadRatio()*.45+(Math.abs(v.x)<1?.4:0))*(this.vehicle.id==='scrambler'?1.10:this.vehicle.id==='timber'?1.05:.98)*(this.lowGear?1.08:1):.1;
 const cooling=(.85+Math.abs(v.x)*.14+(['rain','storm','snow','blizzard'].includes(weather.type)?.4:0))*this.vehicle.cooling;
 this.temperature=Math.max(ambient,Math.min(125,this.temperature+(heating-cooling)*dt));this.peakTemperature=Math.max(this.peakTemperature,this.temperature);
 if(!this.overheated&&this.temperature>=104){this.overheated=true;this.events.push({type:'hot'});}else if(this.overheated&&this.temperature<=96){this.overheated=false;this.events.push({type:'cooled'});}}

 useWinch(){if(this.edition===23)return this.toggleTow();if(this.state!=='drive'||!this.winchCharges||this.winchTime>0||this.groundCount===0||Math.abs(this.car.getLinearVelocity().x)>.85)return false;const p=this.car.getPosition();this.winchAnchor=V(p.x+6,height(p.x+6,this.roadId)+3.2);this.winchTime=1.8;this.winchCharges--;this.events.push({type:'winch'});return true;}
 cargoLoadRatio(){return Math.max(0,Math.min(1,this.fluidCapacity?this.fluidLitres/this.fluidCapacity:this.aboard()/this.route.boxes));}
 starGoals(){if(this.edition===23)return this.recoveryGoals();if(this.edition===22)return this.waterGoals();const win=this.state==='win',full=this.edition===21?this.remaining()===1&&this.machine.integrity>=95:this.fluidCapacity?(this.fluidLitres+this.fluidDelivered)/this.fluidCapacity>=.985:this.remaining()===this.route.boxes,careful=this.condition>=70&&(this.route.kind!=='timed'||this.time<=this.route.limit*.85)&&(!this.dispatchTerms||this.time<=this.dispatchTerms.deadline);return [{id:'delivery',title:'Доставка',detail:this.edition===21?'Генератор ≥60% исправности':'Выполни условия заказа',done:win},{id:'cargo',title:'Весь груз',detail:this.edition===21?'Генератор ≥95% исправности':this.fluidCapacity?'Довези не меньше 98,5% объёма':'Не потеряй ни одного ящика/бревна',done:win&&full},{id:'careful',title:'Бережный рейс',detail:'Весь груз, кузов ≥70%'+(this.route.kind==='timed'?' · запас времени ≥15%':'')+(this.dispatchTerms?' · договор в срок':''),done:win&&full&&careful}];}
 rating(){return this.starGoals().filter(g=>g.done).length;}
 recordTrace(){if(this.traceOverflow||this.time+1e-6<this.traceAt)return;if(this.trace.length>=800){this.traceOverflow=true;this.trace=[];return;}const p=this.car.getPosition();this.trace.push([Math.round(this.time*60),Math.round(p.x*100),Math.round(p.y*100),Math.round(this.car.getAngle()*1000)]);this.traceAt=this.time+.5;}
 measureSlip(){if(this.groundCount===0){this.slip*=.8;return;}const p=this.car.getPosition(),grade=(height(p.x+1,this.roadId)-height(p.x-1,this.roadId))/2,k=1/Math.sqrt(1+grade*grade),v=this.car.getLinearVelocity(),speed=(v.x+v.y*grade)*k;let sum=0,count=0;for(let i=0;i<this.wheels.length;i++){if(this.vehicle.driven&&!this.vehicle.driven.includes(i))continue;let touching=false;for(let e=this.wheels[i].getContactList();e;e=e.next){if(!e.contact.isTouching())continue;const a=e.contact.getFixtureA().getBody().getUserData(),b=e.contact.getFixtureB().getBody().getUserData();if(['ground','bridge','rock'].includes(a)||['ground','bridge','rock'].includes(b)){touching=true;break;}}if(!touching)continue;const roll=-this.wheels[i].getAngularVelocity()*this.vehicle.radius;sum+=Math.min(1,Math.abs(roll-speed)/Math.max(2,Math.abs(roll),Math.abs(speed)));count++;}this.slip+=(sum/Math.max(1,count)-this.slip)*.15;}

 end(reason){if(this.state!=='drive')return;this.state=reason==='delivered'?'win':'fail';this.reason=reason;this.events.push({type:'end',reason});}
 suspensionForces(){const m=this.vehicle;this.travel=[];for(let i=0;i<this.joints.length;i++){let j=this.joints[i],t=j.getJointTranslation(),speed=j.getJointSpeed(),compress=m.id==='scrambler'?.39:m.closed?.25:.30,extend=m.id==='scrambler'?.58:m.closed?.39:.47;let force=0;if(t>compress)force=-(t-compress)*110-speed*6;if(t<-extend)force=(-extend-t)*100-speed*6;if(force){force=Math.max(-95,Math.min(95,force));let axis=this.car.getWorldVector(V(0,1)),wheel=this.wheels[i],wp=wheel.getPosition(),f=V(axis.x*force,axis.y*force);wheel.applyForce(f,wp,true);this.car.applyForce(V(-f.x,-f.y),wp,true);}this.travel.push(t);}}
 setLowGear(on){if(this.state!=='drive'||this.shiftCooldown>0||this.groundCount<1||Math.abs(this.car.getLinearVelocity().x)>3.5)return false;on=!!on;if(on===this.lowGear)return true;this.lowGear=on;this.shiftCooldown=.45;this.gearShifts++;this.events.push({type:'gear',low:on});return true;}
 step(gas,brake,dt=1/60){if(this.state!=='drive'||this.forkWaiting)return;const m=this.vehicle;this.time+=dt;this.shiftCooldown=Math.max(0,this.shiftCooldown-dt);const v=this.car.getLinearVelocity(),torque=m.torque*(1+this.levels[0]*.12)*(this.overheated?.82:1)*(this.condition<45?.90:1)*(this.lowGear?1.55:1),maxSpeed=m.speed*(1+this.levels[0]*.055)*(this.lowGear?.43:1);
 if(!brake)this.parkingHold=false;const stop=this.nextStop(),park=(stop&&Math.abs(this.car.getPosition().x-stop.x)<=3.1||this.services.some(s=>Math.abs(this.car.getPosition().x-s.x)<=3)||this.gates.some(g=>Math.abs(this.car.getPosition().x-g.x)<=2.8)||this.liftBridges.some(b=>Math.abs(this.car.getPosition().x-b.control)<=2.8)||this.edition===23&&this.tow.attached&&Math.abs(this.recovery.body.getPosition().x-this.route.length)<=4)&&Math.abs(v.x)<.85;
 this.brakeHeld=brake&&!gas?this.brakeHeld+dt:0;
 this.throttle+=Math.max(-dt*5,Math.min(dt*1.6,(gas&&!brake?(typeof gas==='number'?Math.max(0,Math.min(1,gas)):1):0)-this.throttle));
 for(let i=0;i<this.joints.length;i++){const j=this.joints[i],driven=!m.driven||m.driven.includes(i);j.enableMotor(!!(brake||driven&&(gas||this.throttle>.02)));if(brake){j.setMotorSpeed(gas||park||this.parkingHold||Math.abs(v.x)>.65||this.brakeHeld<.45?0:4.5);j.setMaxMotorTorque(torque*(m.driven?1:1.5));}else{j.setMotorSpeed(-maxSpeed*(.15+.85*this.throttle));j.setMaxMotorTorque(torque*(.30+.70*this.throttle));}}
 const weather=weatherAt(this.id,this.time);if(weather.wind)this.car.applyForce(V(this.car.getMass()*weather.wind*Math.sin(this.time*.9+this.route.seed),0),this.car.getWorldCenter(),true);if(this.winchTime>0){this.winchTime=Math.max(0,this.winchTime-dt);const anchor=this.car.getWorldPoint(V(m.width*.45,.28)),dx=this.winchAnchor.x-anchor.x,dy=this.winchAnchor.y-anchor.y,len=Math.max(1,Math.hypot(dx,dy)),strength=this.car.getMass()*7;this.car.applyForce(V(dx/len*strength,dy/len*strength),anchor,true);}
 if(this.groundCount===0)this.car.applyTorque(-this.car.getAngularVelocity()*m.airTorque*.22,true);
 if(this.groundCount<2){const authority=this.groundCount===0?1:.45;if(gas)this.car.applyTorque(m.airTorque*authority*(typeof gas==='number'?Math.max(0,Math.min(1,gas)):1),true);if(brake)this.car.applyTorque(-m.airTorque*authority,true);}
 this.updateGates(gas,brake,dt);this.updateLiftBridges(gas,brake,dt);this.updateFords(dt);for(let sub=0;sub<2;sub++){this.suspensionForces();this.fluidForces();this.world.step(dt/2,6,3);}this.groundCount=0;for(const wheel of this.wheels){for(let e=wheel.getContactList();e;e=e.next){const c=e.contact;if(!c.isTouching())continue;const a=c.getFixtureA().getBody().getUserData(),b=c.getFixtureB().getBody().getUserData();if(a==='ground'||b==='ground'||a==='bridge'||b==='bridge'||a==='rock'||b==='rock'){const manifold=c.getWorldManifold(null);if(manifold&&Math.abs(manifold.normal.y)>.45)this.groundCount++;}}}const p=this.car.getPosition();this.distance=Math.max(this.distance,Math.max(0,(p.x-6)*3));const moved=Math.abs(p.x-this.lastFuelX),surface=surfaceAt(p.x,this.roadId).type,grade=Math.max(0,(height(p.x+1,this.roadId)-height(p.x-1,this.roadId))/2),load=1+this.cargoLoadRatio()*.035;const consumption=(dt*(.07+(gas&&!brake?.13:0))+moved*(.14+this.throttle*.15)*(1+grade*.18)*(surface==='mud'||surface==='snow'?1.09:1))*load*(m.fuelFactor||1)*(this.lowGear&&gas?1.13:1);this.fuel=Math.max(0,this.fuel-consumption);this.fuelUsed+=consumption;this.lastFuelX=p.x;
 for(let box of this.boxes){if(box.kind==='liquid'||box.lost||box.delivered)continue;const q=this.car.getLocalPoint(box.body.getPosition());if(box.strap&&!m.closed&&Math.hypot(q.x-box.home.x,q.y-box.home.y)>(box.kind==='log'?1.45:1.15)){this.world.destroyJoint(box.strap);if(box.strap2)this.world.destroyJoint(box.strap2);box.strap2=null;box.strap=null;this.events.push({type:'strap'});}if(q.x<m.bedBack-.60||q.x>m.width+.48||q.y<-1.2||q.y>4)box.out+=dt;else box.out=0;if(box.out>.6){box.lost=true;this.events.push({type:'lost'});}}
 for(let item of this.items){if(!item.got&&Math.hypot(item.x-p.x,item.y-p.y)<2.15){item.got=true;if(item.type==='coin'){this.coins+=10;this.events.push({type:'coin'});}else{const amount=item.amount||18;this.fuel=Math.min(100,this.fuel+amount);this.events.push({type:'fuel',amount});}}}
 for(const point of this.checkpoints)if(!point.done&&p.x>=point.x-2&&p.x<=point.x+6&&this.groundCount>0){point.done=true;this.events.push({type:'survey'});}
 this.measureSlip();this.slipTime=gas&&!brake&&this.slip>.55&&this.groundCount>0?this.slipTime+dt:Math.max(0,this.slipTime-dt*2);this.recordTrace();this.updateStops(gas,brake,dt);this.updateServices(gas,brake,dt);this.updateEngine(gas,brake,dt);this.updateFluid(dt);
 const air=this.groundCount===0;if(air){this.airTicks+=dt;this.airDrop=Math.max(this.airDrop,-this.car.getLinearVelocity().y);}else if(this.wasAir){if(this.airTicks>.10&&this.airDrop>7){this.hardLandings++;const slope=(height(p.x+1,this.roadId)-height(p.x-1,this.roadId))/2,align=Math.abs(Math.atan2(Math.sin(this.car.getAngle()-Math.atan(slope)),Math.cos(this.car.getAngle()-Math.atan(slope))));const severity=34+(this.airDrop-7)*6+align*8;const damage=Math.round(Math.max(10,Math.min(65,severity*(m.closed?.84:m.id==='scrambler'?1.12:1)/(1+this.levels[1]*.035))));this.lastImpact=this.airDrop;this.condition=Math.max(0,this.condition-damage);this.events.push({type:'impact',damage});if(this.condition<=0)this.end('damage');}this.airTicks=0;this.airDrop=0;}this.wasAir=air;this.updateSectors();if(this.edition===21)this.updateMachine(dt);if(this.edition===22)this.updatePump(dt);if(this.edition===23)this.updateRecovery(dt);
 const angle=Math.atan2(Math.sin(this.car.getAngle()),Math.cos(this.car.getAngle()));if(Math.abs(angle)>2.05&&p.y<height(p.x,this.roadId)+(m.closed?3.1:2.5))this.flip+=dt;else this.flip=Math.max(0,this.flip-dt*2);
 if(Math.abs(angle)>1.5&&Math.abs(this.car.getLinearVelocity().x)<.08&&gas&&p.y<height(p.x,this.roadId)+3)this.stuckTime+=dt;else this.stuckTime=0;if(this.stuckTime>4)this.end('flipped');
  if(this.route.kind==='timed'&&this.time>this.route.limit)this.end('timeout');
 else if(p.x>=this.route.length+6&&this.edition!==23){if(this.edition===22&&this.pump.integrity<70)this.end('pump');else if(this.edition===21&&this.machine.integrity<60)this.end('machine');else if(this.fluidCapacity&&this.fluidLitres<(this.route.minLitres||0))this.end('liquid');else if(this.liftBridges.some(b=>!b.done))this.end('bridge');else if(this.gates.some(g=>!g.open))this.end('gate');else if(this.services.some(s=>s.required&&!s.done))this.end('service');else if(this.nextStop())this.end('stops');else if(this.stops.length&&this.aboard()===0)this.end('cargo');else if(this.route.kind==='eco'&&this.fuel<this.route.minFuel)this.end('eco');else if(this.route.kind==='survey'&&this.checkpoints.some(p=>!p.done))this.end('survey');else if(this.route.kind==='careful'&&this.remaining()!==this.route.boxes)this.end('fragile');else this.end('delivered');}
 else if(gaps[this.roadId]&&p.x>gaps[this.roadId].from&&p.x<gaps[this.roadId].to&&p.y<gaps[this.roadId].y-gaps[this.roadId].depth*.55)this.end('ravine');else if(this.flip>1.4)this.end('flipped');else if(this.remaining()===0||this.stops.length&&this.aboard()===0)this.end('cargo');else if(this.fuel<=0)this.end('fuel');else if(p.y<-30||p.x<-15||!Number.isFinite(p.x)||!Number.isFinite(p.y))this.end('road');
 }
 updateSectors(){
  const x=this.car.getPosition().x,speed=Math.abs(this.car.getLinearVelocity().x);
  for(const sector of this.sectors){
   if(sector.done||x<sector.from)continue;
   if(!sector.entered&&x>sector.to){sector.done=true;continue;}
   if(!sector.entered){sector.entered=true;sector.initialCargo=this.fluidCapacity?this.fluidLitres+this.fluidDelivered:this.remaining();sector.initialHits=this.hardLandings;}
   sector.maxSpeed=Math.max(sector.maxSpeed,speed);
   if(x>sector.to){sector.done=true;sector.passed=sector.maxSpeed<=sector.limit&&(this.fluidCapacity?this.fluidLitres+this.fluidDelivered:this.remaining())>=sector.initialCargo-.5&&this.hardLandings===sector.initialHits;
    if(sector.passed)this.coins+=sector.reward;this.events.push({type:'sector',passed:sector.passed,reward:sector.reward});}
  }
 }
 reward(){return terms24.adjustment(this)+this.coins+(this.state==='win'?Math.round(this.route.reward*(this.fluidCapacity?(this.fluidLitres+this.fluidDelivered)/this.fluidCapacity:this.remaining()/this.route.boxes)):0);}
}
Object.assign(Drive.prototype,firstLight.methods,waterRun.methods,recoveryRun.methods);
const crossingFactory=typeof module==='object'?require('./crossing-physics.js'):root.CrossingPhysics;Object.assign(Drive.prototype,crossingFactory({P,V,height,groundHeight}));
const groundCache=new Map();
function groundVertices(id){if(!groundCache.has(id)){const points=[];for(let x=-30;x<=routes[id].length+45;x+=.5)points.push({x,y:groundHeight(x,id)});groundCache.set(id,points);}return groundCache.get(id);}
const api={SETUPS,firstLight,waterRun,recoveryRun,contractRoute,preparedVehicle,weatherAt,WEATHER,fuelPlan,groundVertices,Drive,routes,profiles,gaps,vehicles,regions,height,groundHeight,surfaceAt,bridges,landmarks};if(typeof module==='object')module.exports=api;else root.CargoPhysics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
