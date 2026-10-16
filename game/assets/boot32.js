'use strict';
// Startup readiness, independent of saved career state and the physics clock.
(function(){
 const root=document.getElementById('boot'),art=document.getElementById('boot-art'),button=document.getElementById('boot-skip'),progress=document.getElementById('boot-progress'),status=document.getElementById('boot-status');
 const ready={art:false,fonts:false,renderer:false};let disposed=false;
 function update(){if(disposed)return;const count=Object.values(ready).filter(Boolean).length;progress.value=count;root.dataset.ready=String(count===3);status.textContent=count===3?'Можно выезжать':!ready.renderer?'Готовим дорогу':'Открываем гараж';button.disabled=count!==3;button.querySelector('b').textContent=count===3?'В ДОРОГУ':'ПОДГОТОВКА';}
 // A missing illustration or damaged font must never trap an offline player.
 function bounded(job,fallback){return new Promise(resolve=>{let done=false;const complete=failed=>{if(done)return;done=true;clearTimeout(timer);if(failed)fallback();resolve();},timer=setTimeout(()=>complete(true),1800);Promise.resolve(job).then(()=>complete(false),()=>complete(true));});}
 const illustration=bounded(art.decode?art.decode():new Promise((resolve,reject)=>{if(art.complete)return art.naturalWidth?resolve():reject();art.onload=resolve;art.onerror=reject;}),()=>root.classList.add('art-unavailable')).then(()=>{ready.art=true;update();});
 const fonts=bounded(document.fonts?Promise.all([document.fonts.load('500 64px Road'),document.fonts.load('400 12px Manrope')]):Promise.resolve(),()=>root.classList.add('font-fallback')).then(()=>{ready.fonts=true;update();});
 window.Boot32={readyRenderer(){ready.renderer=true;update();return Promise.all([illustration,fonts]).then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));},dispose(){disposed=true;art.remove();art.removeAttribute('src');},get state(){return {...ready};}};
 update();
})();
