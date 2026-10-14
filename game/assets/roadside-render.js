'use strict';
function roadsideDepots(){
 if(!sim)return;const k=scale;
 for(const site of sim.services){const x=sx(site.x),y=sy(CP.height(site.x,sim.id));if(x<-k*10||x>W+k*8)continue;
 const paint=site.done?'#7aab83':'#91c09c';for(let q=site.x-3;q<site.x+3;q+=.5)line(sx(q),sy(CP.groundHeight(q,sim.id))-.03*k,sx(q+.28),sy(CP.groundHeight(q+.28,sim.id))-.03*k,paint,Math.max(2,k*.075));
 const bx=x+k*6.2,by=sy(CP.height(site.x+6.2,sim.id)),w=k*3.3,h=k*2.15;
 path([[bx-w/2,by],[bx-w/2,by-h],[bx+w/2,by-h],[bx+w/2,by]],'#687965','#2c4739',k*.028);
 path([[bx-w*.58,by-h],[bx-w*.4,by-h-k*.6],[bx+w*.43,by-h-k*.6],[bx+w*.58,by-h]],sim.route.region===5?'#c8d5c6':'#ac9a71','#34493b',k*.035);
 ctx.fillStyle='#223d37';ctx.fillRect(bx-w*.20,by-h*.75,w*.52,h*.75);for(let q=0;q<5;q++)line(bx-w*.17,by-h*.70+q*k*.24,bx+w*.29,by-h*.70+q*k*.24,'#698278',k*.022);
 ctx.fillStyle='#d9ce95';ctx.fillRect(bx-w*.39,by-h*.68,k*.35,k*.52);line(bx-w*.31,by-h*.68,bx-w*.31,by-h*.17,'#56604a',k*.03);
 line(x,y,x,y-k*2.1,'#7d9470',k*.055);path([[x-k*.39,y-k*2.7],[x+k*.39,y-k*2.7],[x+k*.39,y-k*2.05],[x-k*.39,y-k*2.05]],paint,'#314e3b',k*.025);
 ctx.textAlign='center';ctx.font='bold '+Math.max(11,k*.31)+'px monospace';ctx.fillStyle='#2a4c37';ctx.fillText(site.done?'✓':'⚒',x,y-k*2.24);ctx.font='bold '+Math.max(7,k*.13)+'px monospace';ctx.fillStyle='#eedcaa';ctx.fillText(site.name,bx,by-h-k*.72);ctx.textAlign='start';
 const nx=bx-w*.60,ny=by-k*.05;line(nx,ny,nx,ny-k*.57,'#876846',k*.15);circle(nx,ny-k*.72,k*.115,'#d8b17a');line(nx-k*.12,ny-k*.80,nx+k*.13,ny-k*.80,'#bfc18b',k*.06);line(nx,ny-k*.40,nx-k*.18,ny-k*.19,'#dab178',k*.045);
 for(let n=0;n<3;n++){circle(bx+w*.63,by-k*(.20+n*.35),k*.19,'#253b33');circle(bx+w*.63,by-k*(.20+n*.35),k*.075,'#7c8b70');}
 if(site.elapsed>0&&!site.done){ctx.strokeStyle='#dace89';ctx.lineWidth=k*.035;ctx.beginPath();ctx.arc(nx,ny-k*1.22,k*.20,clock*5,clock*5+Math.PI*1.4);ctx.stroke();}
 }
}
function physicalRocks(){
 if(!sim)return;const k=scale;for(const rock of sim.rocks){const body=rock.body,p=pose(body);if(sx(p.x)<-k||sx(p.x)>W+k)continue;const r=rock.radius,pts=Array.from({length:7},(_,i)=>{const a=i*Math.PI*2/7,t=r*(i%2?.9:1);return [Math.cos(a)*t,Math.sin(a)*t];});circle(sx(p.x),sy(CP.groundHeight(p.x,sim.id))+.015*k,r*k*1.03,'#142b2a35');circle(sx(p.x),sy(p.y),r*k,'#7d857a');ctx.strokeStyle='#384f48';ctx.lineWidth=Math.max(1,k*.025);ctx.beginPath();ctx.arc(sx(p.x),sy(p.y),r*k,0,Math.PI*2);ctx.stroke();bpoly(body,pts,'#858d7d');bpoly(body,[[-r*.7,r*.25],[r*.08,r*.8],[r*.65,r*.23],[r*.13,-r*.2]],'#a5ab94');bodyLine(body,-r*.55,-r*.12,r*.45,-r*.48,'#556858',.018);}
}
function vehicleWearEffects(){
 if(!sim)return;const b=sim.car,k=scale,m=sim.vehicle;
 if(brake&&mode==='drive'){const p=bodyPoint(b,-m.width,.31);circle(...p,k*.045,'#ef9f70');if(save.effects)circle(...p,k*.10,'#e8854d35');}
 if(sim.condition<80){const count=sim.condition<40?6:3;for(let j=0;j<count;j++){const x=(j%2?-.8:m.width*.45)+j*.09,y=.33+(j%3)*.09;bodyLine(b,x,y,x+.14,y+.09,'#314239',.017);bodyLine(b,x+.025,y-.025,x+.14,y+.03,'#c7b894',.012);}}
 if(!save.effects)return;
 if(sim.temperature>=96){const at=bodyPoint(b,m.width*.70,.83);for(let n=0;n<6;n++){const phase=(clock*.6+n/6)%1,side=Math.sin(n*4+clock)*k*.08;circle(at[0]+side,at[1]-phase*k*.95,k*(.06+phase*.12),'#d4d9c1'+Math.round((1-phase)*52).toString(16).padStart(2,'0'));}}
 // Bounded tyre impressions record ground contact at world coordinates.
 if(mode==='drive'&&sim.groundCount>0){if(!sim.tyreMarks)sim.tyreMarks=[];const p=sim.car.getPosition(),last=sim.tyreMarks[sim.tyreMarks.length-1];if(!last||Math.abs(p.x-last.x)>.65){const surface=CP.surfaceAt(p.x,sim.id).type;if(['mud','snow','sand'].includes(surface)){sim.tyreMarks.push({x:p.x,y:CP.groundHeight(p.x,sim.id),surface});if(sim.tyreMarks.length>96)sim.tyreMarks.shift();}}}
 for(const mark of sim.tyreMarks||[]){const x=sx(mark.x);if(x<-k||x>W+k)continue;line(x,sy(mark.y)-1,x+k*.22,sy(mark.y)-1,mark.surface==='snow'?'#668b9270':'#273b2d60',Math.max(1,k*.045));}
}
