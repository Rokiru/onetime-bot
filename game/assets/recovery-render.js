'use strict';
(function(){
 const active=()=>sim?.edition===23;
 const oldRocks=physicalRocks;physicalRocks=function(){oldRocks();if(!active())return;const b=sim.recovery.body;if(!DepotArt20.visible(pose(b).x))return;
  bpoly(b,[[-1.5,-.1],[1.5,-.1],[1.5,.19],[-1.5,.19]],'#35463e','#a3a18a',scale*.035);
  bpoly(b,[[-1.36,.18],[.45,.18],[.45,1.24],[-1.36,1.24]],'#8d9275','#d0c5a3',scale*.025);
  bpoly(b,[[.45,.18],[1.46,.18],[1.16,1.1],[.45,1.1]],'#b7b396','#555e4b',scale*.025);
  bpoly(b,[[.61,.61],[1.25,.61],[1.08,.98],[.61,.98]],'#345a58','#d1cdb0',scale*.028);
  bodyLine(b,-1.24,.36,.30,.36,'#b8ad83',.13);bodyLine(b,-1.23,.43,.25,.43,'#554b39',.025);
  bodyLine(b,.51,.22,.51,1.02,'#535d49',.025);bodyLine(b,.65,.51,.83,.51,'#424f42',.045);
  for(const x of [-1.15,-.65,-.15]){bodyLine(b,x,.56,x,1.12,'#69765d',.022);bodyLine(b,x,1.29,x,1.42,'#455a4e',.045);}bodyLine(b,-1.4,1.42,.4,1.42,'#536858',.07);
  bpoly(b,[[-1.45,.5],[-1.34,.5],[-1.34,.74],[-1.45,.74]],'#bd8055');bpoly(b,[[1.32,.32],[1.48,.32],[1.48,.49],[1.32,.49]],'#e2c98e');
  for(const w of sim.recovery.wheels)vehicleWheel(w,{radius:.44});
 };
 const oldCable=winchCable;winchCable=function(){if(!active()){oldCable();return;}if(!sim.tow.attached)return;const a=bodyPoint(sim.car,-1.7,.1),b=bodyPoint(sim.recovery.body,1.46,.1),d=Math.hypot(a[0]-b[0],a[1]-b[1])/scale;ctx.beginPath();ctx.moveTo(...a);ctx.quadraticCurveTo((a[0]+b[0])/2,(a[1]+b[1])/2+Math.max(0,5.4-d)*scale*.25,...b);ctx.strokeStyle=sim.tow.strain>.7?'#dc996e':'#d7c49c';ctx.lineWidth=Math.max(2,scale*.035);ctx.stroke();for(const q of [a,b])circle(...q,Math.max(2,scale*.065),'#c7c9ad');};
 const oldDepot=dispatchDepot;dispatchDepot=function(){if(!active()){oldDepot();return;}if(DepotArt20.visible(sim.route.length+9))DepotArt20.building(sim.tow.support?'workshop-on':'workshop-off',sim.route.length+9,CP.height(sim.route.length+9,sim.roadId),0,12);if(DepotArt20.visible(sim.route.length))DepotArt20.bay(sim.route.length,sim.tow.delivered,'P');};
 const oldCrate=crate;crate=function(box){if(box.kind!=='toolbox'){oldCrate(box);return;}const b=box.body;bpoly(b,[[-.32,-.3],[.32,-.3],[.32,.3],[-.32,.3]],'#718378','#c3c6a7',scale*.025);bodyLine(b,-.3,.12,.3,.12,'#d4bc84',.05);bodyLine(b,-.12,.32,-.12,.42,'#b3bba0',.045);bodyLine(b,-.12,.42,.12,.42,'#b3bba0',.045);bodyLine(b,.12,.42,.12,.32,'#b3bba0',.045);bodyLine(b,-.12,-.16,.12,.03,'#d3d4b7',.055);};
})();
