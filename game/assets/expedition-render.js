'use strict';
// Palettes and static details are anchored to world coordinates.
const REGION_LOOKS=[
 {sky:['#598b9d','#c4d2ba','#58796e'],earth:['#968059','#58614a','#273d3d'],road:'#cfb782'},
 {sky:['#827a83','#dbc2a0','#727f72'],earth:['#ac8d6e','#6f5e52','#324645'],road:'#d8ba94'},
 {sky:['#12223e','#455e76','#294c55'],earth:['#847955','#4b5950','#1b343b'],road:'#c3b18c'},
 {sky:['#448ba4','#c4e5db','#72a9a7'],earth:['#dfc498','#ae976b','#5c7165'],road:'#f1d9a5'},
 {sky:['#617e83','#c1cfb1','#537b67'],earth:['#839665','#566d4e','#274b42'],road:'#b6b891'},
 {sky:['#5e87ab','#dbe8e8','#8ab0b6'],earth:['#cddcd8','#91a9b3','#506a7b'],road:'#eef4e7'}
];
function expeditionLandmark(mark){
 const x=sx(mark.x),y=sy(CP.height(mark.x,sim.roadId)),k=scale;if(x<-k*4||x>W+k*4)return;
 if(mark.type==='lighthouse'){path([[x-k*.55,y],[x-k*.32,y-k*3.3],[x+k*.30,y-k*3.3],[x+k*.57,y]],'#e5d6b1','#56665b',k*.025);for(let j=0;j<3;j++)path([[x-k*.5,y-k*(.35+j*.9)],[x+k*.5,y-k*(.35+j*.9)],[x+k*.44,y-k*(.68+j*.9)],[x-k*.44,y-k*(.68+j*.9)]],'#a8705d');ctx.fillStyle='#315767';ctx.fillRect(x-k*.44,y-k*3.67,k*.88,k*.38);circle(x,y-k*3.48,k*.12,'#ffe1a0');path([[x-k*.55,y-k*3.67],[x,y-k*4.1],[x+k*.55,y-k*3.67]],'#435863');}
 else if(mark.type==='boat'){line(x-k*1.8,y-k*.2,x+k*1.8,y-k*.2,'#51615a',k*.08);for(const off of [-1.3,1.3])line(x+k*off,y,x+k*off,y-k*.45,'#889781',k*.07);path([[x-k*1.3,y-k*.45],[x+k*1.4,y-k*.45],[x+k*.9,y-k*.9],[x-k*.95,y-k*.9]],'#78908a','#3d5c5d',k*.04);}
 else if(mark.type==='reeds'){for(let j=0;j<7;j++){const px=x+k*(j*.17-.5),h=k*(.7+hash(j+mark.x)*.8);line(px,y,px-k*.09,y-h,'#59744e',k*.025);line(px-k*.09,y-h,px-k*.09,y-h-k*.25,'#b29660',k*.06);}}
 else if(mark.type==='snowpost'){line(x,y,x,y-k*1.8,'#5e6d6b',k*.07);for(let j=0;j<3;j++)line(x,y-k*(.3+j*.5),x,y-k*(.5+j*.5),'#d97963',k*.09);path([[x-k*.38,y-k*1.8],[x+k*.38,y-k*1.8],[x+k*.38,y-k*2.35],[x-k*.38,y-k*2.35]],'#b54f46','#f6ead5',k*.026);vehicleText({getPosition:()=>({x:mark.x,y:CP.height(mark.x,sim.roadId)}),getAngle:()=>0},0,2.0,'!', '#f5ecda',.25);}
}
function worldWeather(){if(!sim||!save.effects||save.quality==='low')return;const id=sim.route.region;if(id===5){for(let i=0;i<28;i++){const x=(hash(i+12)*W+clock*(8+hash(i+90)*8))%W,y=(hash(i+75)*H+clock*(11+hash(i+22)*12))%H;circle(x,y,.8+hash(i+34),'#edf6ec86');}}}
function mountainLayers(id,night){
 const colors=night?['#405b72','#324e64','#2c4755','#1f3e43']:id===1?['#b4a28a','#9b8971','#7c806a','#566958']:id===3?['#9fc9c6','#8fb9b1','#719b91','#4d7e76']:id===4?['#9cbaaa','#82a193','#638875','#436a58']:id===5?['#cbdfe0','#adc8ce','#89aebc','#668fa0']:['#afc6ba','#88aaa0','#658f82','#3e7163'];
 for(let layer=0;layer<4;layer++){
  const spacing=layer<2?86:64,shift=cam.x*scale*(.03+layer*.07),begin=Math.floor(shift/spacing)-2,end=begin+Math.ceil(W/spacing)+5;
  const points=[];for(let n=begin;n<=end;n++){const rough=hash(n+layer*411),elevation=H*(.35+layer*.085)+sceneryY(.025+layer*.018)-H*(.07+layer*.009)*(rough+Math.sin(n*.75+layer)*.7);points.push({x:n*spacing-shift,y:elevation,n});}
  path([[points[0].x,H],...points.map(p=>[p.x,p.y]),[points[points.length-1].x,H]],colors[layer]);
  if(layer<3&&save.quality!=='low')for(let j=1;j<points.length-1;j++){
   const p=points[j],prev=points[j-1],next=points[j+1];if(p.y>=prev.y||p.y>=next.y)continue;
   const base=Math.max(prev.y,next.y)+H*(.06+layer*.01),ridgeX=p.x+spacing*(.17+hash(p.n)*.14);
   path([[p.x,p.y],[ridgeX,base],[prev.x,prev.y]],id===5?'#eff7f055':night?'#9dbac813':'#eff0cf18');
   path([[p.x,p.y],[next.x,next.y],[ridgeX,base]],night?'#152f4015':'#234d5013');
   if(id===5||layer===0&&id===1){const depth=id===5?H*.026:H*.012;path([[p.x,p.y],[p.x+(next.x-p.x)*.27,p.y+(next.y-p.y)*.27],[p.x+spacing*.05,p.y+depth],[p.x-spacing*.12,p.y+depth*.60],[p.x-(p.x-prev.x)*.25,p.y+(prev.y-p.y)*.25]],id===5?'#f1f5eccc':'#e3dfc463');}
  }
 }
}
