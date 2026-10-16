'use strict';
// A preview of the real collision profile ahead of this rest area.
function RidgePreview28(s){
 const from=CP.ridge28.camps[s.ridge28.camp-1].x,to=CP.ridge28.camps[s.ridge28.camp]?.x||CP.ridge28.length+6;
 const samples=Array.from({length:101},(_,i)=>{const x=from+(to-from)*i/100;return {x,y:CP.groundHeight(x,s.roadId)};});
 const low=Math.min(...samples.map(p=>p.y)),high=Math.max(...samples.map(p=>p.y)),px=x=>8+(x-from)/(to-from)*404,py=y=>45-(y-low)/Math.max(3,high-low)*35;
 const line=samples.map((p,i)=>(i?'L':'M')+px(p.x).toFixed(1)+' '+py(p.y).toFixed(1)).join(' ');
 return '<svg viewBox="0 0 420 55" role="img" aria-label="Рельеф следующего участка"><path d="'+line+' L412 55 L8 55 Z" fill="#9ba28222"/><path d="'+line+'" fill="none" stroke="#d5bb83" stroke-width="2"/><circle cx="8" cy="'+py(samples[0].y)+'" r="3" fill="#e6d9ad"/><path d="M412 3v12l-7-3 7-3" fill="#d5bb83" stroke="#d5bb83"/></svg><small>'+Math.round((to-from)*3)+' М ДО '+(s.ridge28.camp===3?'ФИНИША':'СЛЕДУЮЩЕГО ПРИВАЛА')+'</small>';
}
