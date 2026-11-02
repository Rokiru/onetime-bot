#!/usr/bin/env python3
"""Original procedural audio, baked once; playback uses native audio, not script DSP."""
import array,math,pathlib,random,wave
ROOT=pathlib.Path(__file__).resolve().parents[1]/'godot/assets/audio';ROOT.mkdir(exist_ok=True)
RATE=22050
rng=random.Random(3416)
def write(name,seconds,sample):
 data=array.array('h')
 for i in range(int(seconds*RATE)):
  value=max(-.96,min(.96,sample(i/RATE,i)))
  data.append(int(value*32767))
 with wave.open(str(ROOT/(name+'.wav')),'wb') as out:
  out.setnchannels(1);out.setsampwidth(2);out.setframerate(RATE);out.writeframes(data.tobytes())
write('engine',1.,lambda t,i:(math.sin(math.tau*44*t)*.34+math.sin(math.tau*88*t)*.25+math.sin(math.tau*132*t)*.13+math.sin(math.tau*220*t)*.06)*(1.+.18*math.sin(math.tau*4*t)))
noise=[rng.uniform(-1,1) for _ in range(RATE)]
for _ in range(3):noise=[(noise[i-1]+noise[i]+noise[(i+1)%RATE])/3 for i in range(RATE)]
write('road',1.,lambda t,i:noise[i]*.7)
write('impact',.25,lambda t,i:(math.sin(math.tau*(115*t-130*t*t))*.6+rng.uniform(-1,1)*.12)*math.exp(-t*19))
for name,notes in [('stop',[660,880]),('win',[392,494,587,784]),('lost',[220,147,110])]:
 write(name,len(notes)*.12+.15,lambda t,i,notes=notes:sum(math.sin(math.tau*hz*(t-n*.12))*.36*math.exp(-(t-n*.12)*18) for n,hz in enumerate(notes) if 0<=t-n*.12<.24))
roots=[146.83,130.81,174.61,110.]
write('music',8.,lambda t,i:sum((math.sin(math.tau*roots[int(t//2)%4]*factor*t)+.22*math.sin(math.tau*roots[int(t//2)%4]*factor*2*t))*.08*(1-math.exp(-(t%2)*15))*math.exp(-(t%2)*1.2) for factor in [1,1.189207,1.498307]))
print('Generated seven original local audio clips for native playback.')
