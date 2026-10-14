'use strict';
// Procedural sound; no network, recordings or audio assets required.
const RoadAudio={
 context:null,master:null,engine:null,road:null,wind:null,filter:null,tones:[],lastVy:0,lastHit:-10,
 init(volume){
  if(!this.context){
   const a=this.context=new(window.AudioContext||window.webkitAudioContext)();
   this.master=a.createGain();this.master.connect(a.destination);
   this.engine=a.createGain();this.engine.gain.value=0;this.engine.connect(this.master);
   const low=a.createBiquadFilter();low.type='lowpass';low.frequency.value=420;low.connect(this.engine);this.filter=low;
   for(const [type,hz,level] of [['sawtooth',44,.35],['triangle',22,.65],['sine',88,.22]]){
    const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=hz;g.gain.value=level;o.connect(g);g.connect(low);o.start();this.tones.push(o);
   }
   const buffer=a.createBuffer(1,a.sampleRate*2,a.sampleRate),samples=buffer.getChannelData(0);
   for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
   const noise=a.createBufferSource();noise.buffer=buffer;noise.loop=true;noise.start();this.noise=buffer;
   this.road=a.createGain();this.road.gain.value=0;
   const roadFilter=a.createBiquadFilter();roadFilter.type='bandpass';roadFilter.frequency.value=650;roadFilter.Q.value=.55;noise.connect(roadFilter);roadFilter.connect(this.road);this.road.connect(this.master);this.roadFilter=roadFilter;
   this.wind=a.createGain();this.wind.gain.value=0;const windFilter=a.createBiquadFilter();windFilter.type='lowpass';windFilter.frequency.value=260;noise.connect(windFilter);windFilter.connect(this.wind);this.wind.connect(this.master);
  }
  this.master.gain.value=volume/100;this.context.resume().catch(()=>{});return this.context;
 },
 mute(){if(!this.context)return;const t=this.context.currentTime;for(const g of [this.engine,this.road,this.wind]){g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(0,t);}},
 update(sim,active,gas,brake){
  if(!this.context)return;if(!active||!sim){this.mute();this.lastVy=0;return;}
  const a=this.context,t=a.currentTime,v=sim.car.getLinearVelocity(),speed=Math.abs(v.x),ground=sim.groundCount>0,surface=CargoPhysics.surfaceAt(sim.car.getPosition().x,sim.id).type;
  const hz=32+Math.min(75,Math.abs(sim.wheels[0].getAngularVelocity())*2)+(gas?18:0)+(sim.vehicle.id==='scrambler'?15:sim.vehicle.id==='tanker'?-10:sim.vehicle.id==='timber'?-6:sim.vehicle.id==='mule'?-7:0);
  this.tones.forEach((o,i)=>o.frequency.setTargetAtTime(hz*[1,.5,2][i],t,.08));
  this.filter.frequency.setTargetAtTime(gas?500:240,t,.15);this.engine.gain.setTargetAtTime(brake?.028:gas?.065:.032,t,.09);
  this.roadFilter.frequency.setTargetAtTime(['wet','water'].includes(surface)?1600:surface==='mud'?320:sim.bridge.length&&sim.car.getPosition().x>CargoPhysics.bridges[sim.id].from&&sim.car.getPosition().x<CargoPhysics.bridges[sim.id].to?900:650,t,.2);
  this.road.gain.setTargetAtTime(ground?Math.min(.055,speed*.003)*(surface==='wet'?1.35:1):0,t,.12);
  this.wind.gain.setTargetAtTime(Math.min(.028,speed*.0009),t,.2);
  if(ground&&this.lastVy<-2&&v.y-this.lastVy>2.5&&sim.time-this.lastHit>.35){this.hit(Math.min(1,(v.y-this.lastVy)/10));this.lastHit=sim.time;}
  this.lastVy=v.y;
 },
 hit(strength=.5){if(!this.context)return;const a=this.context,t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(38,t+.15);g.gain.setValueAtTime(.06*strength,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);o.connect(g);g.connect(this.master);o.start();o.stop(t+.2);},
 event(kind){if(!this.context)return;const a=this.context,t=a.currentTime;
  const notes=kind==='win'?[392,494,587,784]:kind==='lost'?[190,110]:kind==='fuel'?[262,392]:[660,880];
  notes.forEach((hz,i)=>{const o=a.createOscillator(),g=a.createGain(),at=t+i*.09;o.type=kind==='lost'?'triangle':'sine';o.frequency.value=hz;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.04,at+.012);g.gain.exponentialRampToValueAtTime(.001,at+.16);o.connect(g);g.connect(this.master);o.start(at);o.stop(at+.18);});
 },
 musicGain:null,musicVoices:new Set(),musicNext:0,musicBeat:0,musicRegion:-1,
 stopMusic(){
  if(this.musicGain)this.musicGain.gain.value=0;
  for(const voice of this.musicVoices){try{voice.stop();}catch(e){}}this.musicVoices.clear();this.musicNext=0;
 },
 musicNote(hz,start,duration,level){
  const a=this.context,o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=hz;o.connect(g);g.connect(this.musicGain);
  g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(level,start+.035);g.gain.exponentialRampToValueAtTime(.001,start+duration);
  o.start(start);o.stop(start+duration+.02);this.musicVoices.add(o);o.onended=()=>{this.musicVoices.delete(o);o.disconnect();g.disconnect();};
 },
 updateMusic(mode,enabled){
  if(!this.context)return;
  if(!enabled||['boot','pause','settings'].includes(mode)||this.context.state!=='running'){if(this.musicNext)this.stopMusic();return;}
  const a=this.context,region=typeof selected==='number'?CargoPhysics.routes[selected].region:0;
  if(!this.musicGain){this.musicGain=a.createGain();this.musicGain.connect(this.master);}
  this.musicGain.gain.value=mode==='drive'?.12:.24;
  if(this.musicRegion!==region){this.stopMusic();this.musicRegion=region;this.musicBeat=0;this.musicGain.gain.value=mode==='drive'?.12:.24;}
  if(!this.musicNext||this.musicNext<a.currentTime-.2)this.musicNext=a.currentTime+.03;
  const roots=[146.83,130.81,174.61,110],melody=[0,7,12,7,3,7,10,7,0,7,15,12,7,3,7,0];
  while(this.musicNext<a.currentTime+.13){
   const beat=this.musicBeat++,root=roots[Math.floor(beat/8)%4]*(region===1?1.122:region===2?.891:1),at=this.musicNext;
   this.musicNote(root*Math.pow(2,melody[beat%16]/12),at,.72,.20);
   if(beat%8===0){this.musicNote(root/2,at,2.6,.24);this.musicNote(root*Math.pow(2,7/12),at,2.2,.08);}
   this.musicNext+=region===2?.43:.36;
  }
 }
};
