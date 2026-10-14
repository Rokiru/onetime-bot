'use strict';
(function(root){
 function attach({gas,brake,isDriving,onChange,onPause,onResume,isPaused,onAudio,target=root}){
  const held={gas:new Set(),brake:new Set()},pressures=new Map(),keys={ArrowRight:'gas',KeyD:'gas',ArrowLeft:'brake',KeyA:'brake'};
  function throttle(){if([...held.gas].some(k=>k[0]==='k'))return 1;return pressures.size?Math.max(...pressures.values()):1;}
  function pressure(e){const rect=gas.getBoundingClientRect();return Math.max(.28,Math.min(1,.28+(rect.bottom-e.clientY)/Math.max(1,rect.height)*.72));}
  function update(){for(const id of ['gas','brake']){const button=id==='gas'?gas:brake,down=held[id].size>0;button.classList.toggle('pressed',down);button.setAttribute('aria-pressed',String(down));}onChange(held.gas.size>0,held.brake.size>0);}
  function clear(){held.gas.clear();held.brake.clear();pressures.clear();gas.style.setProperty('--pedal-pressure',0);update();}
  for(const [id,button] of [['gas',gas],['brake',brake]]){
   button.addEventListener('pointerdown',e=>{e.preventDefault();if(!isDriving())return;if(e.pointerType==='mouse'&&e.button!==0)return;held[id].add('p'+e.pointerId);if(id==='gas'){pressures.set(e.pointerId,pressure(e));gas.style.setProperty('--pedal-pressure',throttle());}try{button.setPointerCapture(e.pointerId);}catch(e){}update();onAudio();});
   button.addEventListener('pointermove',e=>{if(id==='gas'&&held.gas.has('p'+e.pointerId)){pressures.set(e.pointerId,pressure(e));gas.style.setProperty('--pedal-pressure',throttle());}});
   const up=e=>{held[id].delete('p'+e.pointerId);if(id==='gas'){pressures.delete(e.pointerId);gas.style.setProperty('--pedal-pressure',held.gas.size?throttle():0);}update();};for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,up);
   button.addEventListener('contextmenu',e=>e.preventDefault());
  }
  target.addEventListener('keydown',e=>{if(keys[e.code]||e.code==='Space')e.preventDefault();if(e.code==='Space'||e.code==='Escape'){if(e.repeat)return;if(isDriving())onPause();else if(isPaused())onResume();return;}if(keys[e.code]&&isDriving()){held[keys[e.code]].add('k'+e.code);update();}});
  target.addEventListener('keyup',e=>{if(keys[e.code]){held[keys[e.code]].delete('k'+e.code);update();}});
  target.addEventListener('blur',()=>{clear();onPause();});
  return {clear,held,throttle};
 }
 if(typeof module==='object')module.exports={attach};else root.PedalInput={attach};
})(typeof globalThis!=='undefined'?globalThis:this);
