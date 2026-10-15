'use strict';
(function(root){
 function create({routes,profiles,zones,landmarks,bridges,gaps,height,contractRoute}){
  // Explicit sequences per career ID. Placement is deterministic and keeps each
  // existing interaction and crossing in its original, level collision envelope.
  const sequence=['ct','kc','rt','ct','dt','kr','kc','rt','kr','rc','kt','kt','ct','rc','cr','tc','rt','kc','dt','ct','dc','ct','tr','ck','tc','rt','ct','dt','ss','ss','st','ss','rc','tc','rt','ct','tr','kc','dt','ss','ct','tc','rt','ss','dc','kt','rc','tc'];
  const motifs={
   k:{name:'ОСТРЫЙ ГРЕБЕНЬ',tip:'Сбавь перед вершиной. В воздухе выровняй нос педалями.',points:[[0,0],[6,0],[13,3.8],[20,3.8],[27,-.7],[30,-.7],[34,0]]},
   r:{name:'ДВОЙНАЯ ВОЛНА',tip:'Не держи газ: разгрузка колёс, затем короткая посадка.',points:[[0,0],[6,0],[11,2.4],[14,2.4],[19,-.2],[23,1.6],[26,1.6],[31,-.3],[36,0]]},
   c:{name:'ТЯГОВЫЙ ПОДЪЁМ',tip:'Перед уклоном сбавь и включи 4L. На вершине отпусти газ.',points:[[0,0],[6,0],[19,5.6],[27,5.6],[36,.1],[40,.1],[44,0]]},
   t:{name:'КАМЕННЫЕ ПОЛКИ',tip:'Тормози до края. Сходи по ступеням без разгона.',points:[[0,0],[6,0],[18,4.6],[26,4.6],[31,1.7],[34,1.7],[40,0]]},
   s:{name:'ПЕРЕЛИВ НА СКЛОНЕ',tip:'Плавная тяга. Затормози до спуска, береги объём в цистерне.',points:[[0,0],[6,0],[16,3.5],[20,3.5],[29,.1],[33,.1],[38,1],[42,0]]},
   d:{name:'ТЯЖЁЛАЯ СЦЕПКА',tip:'Подъём — 4L. На спуске удерживай скорость без рывков.',points:[[0,0],[6,0],[20,4.2],[32,4.2],[38,-.5],[42,-.5],[46,0]]}
  };
  const cache=new Map(),byRoad=new Map(),edition=id=>id===0?21:id===3?22:id===4?23:20;
  const oldKey=id=>id===0?'light:pending':id===3?'water:22':id===4?'recovery:23':id;
  function protectedRanges(id,key,r){const result=[[0,id===0?45:20],[r.length-16,r.length+40]];
   if(id===3)result.push([91,117]);
   for(const p of [...(r.drops||r.stops||[]),...(r.services||[]),...(r.checkpoints||[])])result.push([p.x-13,p.x+13]);
   for(const g of r.gates||[])result.push([g.x-17,g.x+12]);for(const rock of r.rocks||[])result.push([rock.x-7,rock.x+8]);
   for(const f of r.fords||[])result.push([f.from-10,f.to+10]);
   for(const b of [bridges[key],r.liftBridge].filter(Boolean))result.push([Math.min(b.control??b.from,b.from)-10,b.to+10]);
   const gap=gaps[key];if(gap)result.push([gap.from-17,gap.to+15]);return result;
  }
  function build(id,key=oldKey(id)){
   const tag=id+':'+key;if(cache.has(tag))return cache.get(tag);
   const original=key.toString().startsWith('light:')?{...contractRoute(0,21),...routes[key]}:contractRoute(id,edition(id));
   const r={...original,...(id===6?{limit:130}:id===8?{limit:180}:{})};
   const road='course:26:'+tag,avoid=protectedRanges(id,key,r),hazards=[];let points=profiles[key].map(p=>p.slice());
   const kinds=sequence[id];
   for(let n=0;n<kinds.length;n++){
    const type=kinds[n],m=motifs[type],full=m.points.at(-1)[0];let found=null;
    // Two authored target regions per route. Short fallback fits crowded roads,
    // never moves a stop, floods a service or lands a ramp on a bridge control.
    for(const ratio of [1,.8,.65]){const width=full*ratio,target=r.length*(n===0?.29:.70)+(id%3-1)*5;
     for(let from=20;from+width<=r.length-16;from+=1){const to=from+width;if(avoid.some(([a,b])=>from<b&&to>a))continue;let fit=1;for(let j=1;j<m.points.length;j++){const a=m.points[j-1],b=m.points[j],x=from+(a[0]+b[0])*.5*ratio,base=(height(x+.1,key)-height(x-.1,key))/.2,added=1.5*(b[1]-a[1])/((b[0]-a[0])*ratio);if(added>.01)fit=Math.min(fit,(Math.max(.56,base+.025)-base)/added);if(added<-.01)fit=Math.min(fit,(-Math.max(.72,-base+.025)-base)/added);}const distance=Math.abs((from+to)/2-target)+(1-Math.max(0,Math.min(1,fit)))*90;if(!found||distance<found.distance)found={from,to,width,ratio,distance};}
     if(found)break;
    }
    if(!found)continue;
    const {from,to,ratio}=found,progress=id<9?.70:id<24?.85:1;
    let strength=progress*ratio*(id===4?.85:1),patch;
    const sample=(x,ps)=>{for(let j=1;j<ps.length;j++){if(x>ps[j][0])continue;const a=ps[j-1],b=ps[j],t=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0])));return a[1]+(b[1]-a[1])*t*t*(3-2*t);}return 0;};
    // Overlay the new feature on the real landscape, with zero offset and zero
    // added gradient at each boundary. Limit added grades rather than creating
    // an unclimbable wall where an authored mountain already rises underneath.
    for(let attempt=0;attempt<36;attempt++){
     patch=m.points.map(([x,y])=>[from+x*ratio,y*strength]);let fair=true;
     for(let x=from+.125;x<to;x+=.25){const base=(height(x+.05,key)-height(x-.05,key))/.1,actual=base+(sample(x+.05,patch)-sample(x-.05,patch))/.1;if(actual>Math.max(.56,base+.025)||actual<-Math.max(.72,-base+.025)){fair=false;break;}}
     if(fair)break;strength*=.86;
    }
    points=points.concat(patch.map(([x,y])=>[x,height(x,key)+y])).sort((a,b)=>a[0]-b[0]);
    const h={points:patch,strength,type,name:m.name,tip:m.tip,from,to,peak:from+m.points.find(p=>p[1]===Math.max(...m.points.map(p=>p[1])))[0]*ratio};hazards.push(h);avoid.push([from-6,to+6]);
   }
   routes[road]={...r,roadId:road};profiles[road]=[...new Map(points.map(p=>[p[0],p])).values()];zones[road]=(zones[key]||[]).map(o=>({...o}));landmarks[road]=(landmarks[key]||[]).map(o=>({...o}));if(bridges[key])bridges[road]={...bridges[key]};if(gaps[key])gaps[road]={...gaps[key]};
   for(const h of hazards){landmarks[road].push({x:h.from-3,type:'sign',text:h.name});if(h.type==='c'&&!zones[road].some(z=>z.from<h.peak&&z.to>h.from))zones[road].push({from:h.from+5,to:h.peak-1,type:r.region===5?'snow':'mud',friction:r.region===5?.88:.76});}
   const data={key:road,hazards,protected:protectedRanges(id,key,r),route:{...r,roadId:road,hazards,sectors:[0,3,4].includes(id)?[]:hazards.map(h=>({from:h.peak,to:h.to-2,limit:3.3,reward:35,name:'ЧИСТЫЙ СПУСК'}))}};cache.set(tag,data);byRoad.set(road,{...data,baseKey:key});return data;
  }
  function apply(s){const data=build(s.id,s.roadId);s.roadId=data.key;s.route={...s.route,...(data.route.limit?{limit:data.route.limit}:{}),roadId:data.key,hazards:data.hazards,sectors:data.route.sectors};s.route.services=(s.route.services||[]).map(o=>({...o,refuel:24}));s.course26={edition:26};s.course26Model=api;return s.route;}
  function courseHeight(x,road){const data=byRoad.get(road);if(!data)throw Error('Unknown course '+road);const base=height(x,data.baseKey),h=data.hazards.find(h=>x>=h.from&&x<=h.to);if(!h)return base;const points=h.points;for(let n=1;n<points.length;n++){if(x>points[n][0])continue;const a=points[n-1],b=points[n],t=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0])));return base+a[1]+(b[1]-a[1])*t*t*(3-2*t);}return base;}
  function preview(id){return {...build(id).route};}
  function valid(d){return d?.course26?.edition===26&&Object.keys(d.course26).length===1&&!d.ridge25&&((d.id===0&&!!d.expedition)||(d.id===3&&!!d.waterRun)||(d.id===4&&!!d.recoveryRun)||(![0,3,4].includes(d.id)&&!!d.journey));}
  const api={edition,build,apply,preview,valid,motifs,height:courseHeight};return api;
 }
 if(typeof module==='object')module.exports=create;else root.Courses26Model=create;
})(typeof globalThis!=='undefined'?globalThis:this);
