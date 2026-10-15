'use strict';
(function(){
 const originalCrate=crate;
 crate=function(box){if(box.kind!=='generator'){originalCrate(box);return;}const b=box.body,k=scale;
  bpoly(b,[[-.79,-.44],[.79,-.44],[.79,.44],[-.79,.44]],'#243a35','#132b28',k*.04);
  bpoly(b,[[-.68,-.31],[.67,-.31],[.67,.28],[-.68,.28]],box.lost?'#797b68':'#a09568','#d0c19a',k*.02);
  bpoly(b,[[-.63,-.26],[-.04,-.26],[-.04,.22],[-.63,.22]],'#344b46');
  for(let x=-.57;x<-.10;x+=.09)bodyLine(b,x,-.20,x,.16,'#93a18d',.025);
  bpoly(b,[[.08,-.22],[.59,-.22],[.59,.22],[.08,.22]],'#c2b486','#6d785e',k*.02);
  const q=bodyPoint(b,.32,0);circle(...q,k*.17,'#314640');circle(...q,k*.12,'#809080');circle(...q,k*.05,'#3c5149');
  for(const x of [-.76,.76])bodyLine(b,x,-.43,x,.43,'#bcc4ac',.045);
  bodyLine(b,-.65,.43,.65,.43,'#7f9384',.06);bodyLine(b,.35,.45,.35,.59,'#3a4d42',.09);
  bpoly(b,[[-.43,.30],[-.12,.30],[-.12,.39],[-.43,.39]],'#e6cf86');
  const led=bodyPoint(b,.64,.29);circle(...led,k*.028,box.lost?'#ac755c':'#bed08d');
 };
 const originalStraps=cargoStraps;cargoStraps=function(){if(!sim||sim.edition!==21){originalStraps();return;}if(dispatch.phase)return;const box=sim.boxes[0];if(box.lost||box.delivered)return;for(const joint of [box.strap,box.strap2])if(joint){const a=joint.getAnchorA(),b=joint.getAnchorB();line(sx(a.x),sy(a.y),sx(b.x),sy(b.y),'#d6bf85',Math.max(1,scale*.026));}};
 const originalDepot=dispatchDepot;dispatchDepot=function(){if(!sim||sim.edition!==21){originalDepot();return;}const end=sim.route.length+10;if(DepotArt20.visible(-1))DepotArt20.building('warehouse',-1,0,0,12);if(DepotArt20.visible(end))DepotArt20.building(save.workshopPowered?'workshop-on':'workshop-off',end,CP.height(end,sim.roadId),0,12);};
 const originalRoadside=roadsideDepots;roadsideDepots=function(){if(!sim||sim.edition!==21){originalRoadside();return;}for(const site of sim.services)if(DepotArt20.visible(site.x))DepotArt20.bay(site.x,site.done,'+');};
})();
