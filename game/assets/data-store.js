'use strict';
const GameStorage=(()=>{
 const allowed=['cargo-save-v1','cargo-career-v1','cargo-active-profile'];
 function revision(value){try{const s=JSON.parse(value);return s&&typeof s==='object'&&!Array.isArray(s)?Math.max(0,Number(s._saveRevision)||0):-1;}catch(e){return -1;}}
 function read(key){if(!allowed.includes(key))return null;let local=null,native=null;try{local=localStorage.getItem(key);}catch(e){}try{if(typeof AndroidGameStore!=='undefined')native=AndroidGameStore.read(key)||null;}catch(e){}
  if(key==='cargo-active-profile'){
   const decode=value=>{if(['test','career'].includes(value))return {profile:value,_saveRevision:0};try{const p=JSON.parse(value);return p&&['test','career'].includes(p.profile)?p:null;}catch(e){return null;}};
   const l=decode(local),n=decode(native);return !l&&!n?null:!l?n.profile:!n?l.profile:revision(native)>=revision(local)?n.profile:l.profile;
  }
  const l=revision(local),n=revision(native);return l<0&&n<0?null:n>l?native:local;
 }
 function write(key,value){if(!allowed.includes(key)||typeof value!=='string'||value.length>2000000)return false;
  if(key==='cargo-active-profile'){if(!['test','career'].includes(value))return false;let rev=Date.now();try{rev=Math.max(rev,revision(localStorage.getItem(key))+1);}catch(e){}try{if(typeof AndroidGameStore!=='undefined')rev=Math.max(rev,revision(AndroidGameStore.read(key))+1);}catch(e){}value=JSON.stringify({profile:value,_saveRevision:rev});}
  let ok=false;try{localStorage.setItem(key,value);ok=true;}catch(e){}try{if(typeof AndroidGameStore!=='undefined'&&AndroidGameStore.write(key,value))ok=true;}catch(e){}return ok;
 }
 return {read,write};
})();
