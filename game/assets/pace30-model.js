'use strict';
(function(root){
 function create({routes,profiles,zones,landmarks,bridges,gaps,height}){
  const roads=new Map();
  // Keep the entire collision envelope of each actual interaction/obstacle.
  // Only gaps between these blocks are rebuilt as short, smooth connectors.
  function apply(s){
   s.pace30={edition:30};s.pace30Model=api;if([0,3,4].includes(s.id)||s.edition===25)return s.route;
   const base=s.roadId;if(String(base).startsWith('haul:30:'))return s.route;
   const key='haul:30:'+base;
   if(!roads.has(key)){
    const r=s.route,areas=[[0,12],[r.length-9,r.length+18],...(r.hazards||[]).map(h=>[h.from-1,h.to+1]),...(r.stops||r.drops||[]).map(o=>[o.x-8,o.x+6]),...(r.services||[]).map(o=>[o.x-8,o.x+6]),...(r.gates||[]).map(o=>[o.x-9,o.x+9]),...(r.checkpoints||[]).map(o=>[o.x-5,o.x+7]),...(r.rocks||[]).map(o=>[o.x-8,o.x+8]),...(r.fords||[]).flatMap(f=>fordAreas(f,base))];
    if(r.technical)areas.push([r.technical.from-2,r.technical.to+2]);
    for(const b of [bridges[base],gaps[base],r.liftBridge].filter(Boolean))areas.push([Math.min(b.control??b.from,b.from)-(gaps[base]===b?24:12),b.to+10]);
    areas.sort((a,b)=>a[0]-b[0]);const merged=[];
    for(const [from,to] of areas){const last=merged.at(-1);if(last&&from<=last.to+1)last.to=Math.max(last.to,to);else merged.push({from,to});}
    const blocks=[],connectors=[];let removed=0,offset=0;
    for(let n=0;n<merged.length;n++){
     const o=merged[n],prior=blocks.at(-1);
     if(prior){const span=o.from-prior.to,target=Math.min(span,Math.max(3,span*.08)),short=span-Math.floor((span-target)*2)/2,start=prior.end,end=start+short,y=height(prior.to,base)+prior.offset;
      offset=y-height(o.from,base);removed+=span-short;
      const slope=x=>(height(x+.02,base)-height(x-.02,base))/.04;
      connectors.push({from:start,to:end,y,left:slope(prior.to),right:slope(o.from),oldFrom:prior.to,oldTo:o.from});
     }
     blocks.push({...o,start:o.from-removed,end:o.to-removed,offset});
    }
    const data={base,blocks,connectors};
    data.x=x=>{const block=blocks.find(b=>x>=b.from&&x<=b.to);if(block)return block.start+x-block.from;const gap=connectors.find(g=>x>g.oldFrom&&x<g.oldTo);if(gap)return gap.from+(x-gap.oldFrom)/(gap.oldTo-gap.oldFrom)*(gap.to-gap.from);const edge=x<blocks[0].from?blocks[0]:blocks.at(-1);return edge.start+x-edge.from;};
    data.offset=x=>{const block=blocks.find(b=>x>=b.from&&x<=b.to);if(block)return block.offset;const gap=connectors.find(g=>x>g.oldFrom&&x<g.oldTo);if(gap){const nx=data.x(x);return connectorHeight(g,nx)-height(x,base);}return x<blocks[0].from?blocks[0].offset:blocks.at(-1).offset;};
    const point=o=>({...o,...(o.x!==undefined?{x:data.x(o.x)}:{}),...(o.from!==undefined?{from:data.x(o.from)}:{}),...(o.to!==undefined?{to:data.x(o.to)}:{}),...(o.control!==undefined?{control:data.x(o.control)}:{}),...(o.peak!==undefined?{peak:data.x(o.peak)}:{})});
    const crossing=b=>({...point(b),y:b.y+data.offset(b.from),...(b.landing!==undefined?{landing:b.landing+data.offset(b.to)}:{})});
    data.route={...r,roadId:key,length:data.x(r.length),hazards:r.hazards.map(h=>({...point(h),points:h.points.map(([x,y])=>[data.x(x),y])})),technical:r.technical?point(r.technical):null,sectors:(r.sectors||[]).map(point)};
    for(const name of ['stops','drops','gates','services','checkpoints','rocks'])if(r[name])data.route[name]=r[name].map(point);
    if(r.fords)data.route.fords=r.fords.map(f=>({...point(f),level:f.level+data.offset(f.from)}));
    if(r.liftBridge)data.route.liftBridge=crossing(r.liftBridge);
    if(r.fuelPoints)data.route.fuelPoints=r.fuelPoints.map(p=>typeof p==='number'?data.x(p):point(p));
    const length=data.route.length;data.route.phases=[{from:0,to:length*.33,name:'ТЕМП'},{from:length*.33,to:length*.67,name:'ТЕХНИКА'},{from:length*.67,to:length+6,name:'ПОДАЧА'}];
    roads.set(key,data);routes[key]=data.route;profiles[key]=[];
    for(let x=0;x<=length+6;x+=1)profiles[key].push([x,roadHeight(x,key)]);
    zones[key]=(zones[base]||[]).map(point);landmarks[key]=(landmarks[base]||[]).map(point);
    if(bridges[base])bridges[key]=crossing(bridges[base]);if(gaps[base])gaps[key]=crossing(gaps[base]);
   }
   const data=roads.get(key);s.roadId=key;s.route={...data.route};return s.route;
  }
  function fordAreas(f,base){
   // Shorten only a level bed: entry/exit grades and maximum water depth remain intact.
   let best=null,run=null;
   for(let x=f.from+5;x<=f.to-5;x+=.5){const y=height(x,base),flat=Math.abs(height(x+.25,base)-height(x-.25,base))<1e-7;if(flat){if(!run)run={from:x,to:x,y};else if(Math.abs(run.y-y)<1e-7)run.to=x;else run={from:x,to:x,y};if(!best||run.to-run.from>best.to-best.from)best={...run};}else run=null;}
   return best&&best.to-best.from>=7?[[f.from-7,best.from],[best.to,f.to+7]]:[[f.from-7,f.to+7]];
  }
  function connectorHeight(g,x){const span=g.to-g.from,t=(x-g.from)/span,t2=t*t,t3=t2*t;return g.y+span*((t3-2*t2+t)*g.left+(t3-t2)*g.right);}
  function roadHeight(x,key){const d=roads.get(key),b=d.blocks.find(o=>x>=o.start&&x<=o.end);if(b)return height(b.from+x-b.start,d.base)+b.offset;const g=d.connectors.find(o=>x>o.from&&x<o.to);if(g)return connectorHeight(g,x);const edge=x<d.blocks[0].start?d.blocks[0]:d.blocks.at(-1);return height(edge.from+x-edge.start,d.base)+edge.offset;}
  function valid(d){return d?.pace30?.edition===30&&Object.keys(d.pace30).length===1&&d.logistics29?.layout30===30&&!!d.course26&&!d.ridge25;}
  const api={apply,height:roadHeight,valid,inspect:key=>roads.get(key)};return api;
 }
 if(typeof module==='object')module.exports=create;else root.Pace30Model=create;
})(typeof globalThis!=='undefined'?globalThis:this);
