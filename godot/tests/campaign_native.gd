extends SceneTree
var game
var results=[]
var scenarios=range(72)
func _initialize():
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--routes="):scenarios=arg.trim_prefix("--routes=").split(",").map(func(value):return int(value))
 call_deferred("run")
func controls():
 var s=game.rig
 var x=s.position.x
 var v=s.linear_velocity.x
 var angle=wrapf(s.rotation,-PI,PI)
 var gap=game.route.get("gap")
 var jumping=gap is Dictionary and x>float(gap.from)-18. and x<float(gap.to)+3.
 if s.grounded==0 and absf(s.linear_velocity.y)>.8:
  game.gas_level=1. if angle>.10 else 0.
  game.brake_pressed=angle<-.15
  return
 if jumping and x<float(gap.from)-.3:
  s.low=false;game.gas_level=1.;game.brake_pressed=false;return
 var slope=(root.get_node("Data").height_at(game.route,x+3.)-root.get_node("Data").height_at(game.route,x))/3.
 var descending=0.
 for n in [2.,4.,6.,8.]:descending=maxf(descending,(root.get_node("Data").height_at(game.route,x+n+2.)-root.get_node("Data").height_at(game.route,x+n))/2.)
 var target=2.8 if s.spec.family=="timber" or game.route.get("kind")=="careful" else 3.7
 if slope<-.15:target=2.8
 if descending>.16:target=1.7
 if game.tow!=null:target=2.0
 if absf(v)<3. and (slope<-.16 or angle<-.12 or game.water_depth(s.position)>.05):s.low=true
 elif absf(v)<3. and slope>-.08 and angle>-.06:s.low=false
 if game.route.get("bridge") is Dictionary and x>float(game.route.bridge.from)-6. and x<float(game.route.bridge.to)+5.:target=minf(target,1.4)
 if jumping:
  target=7.1;s.low=absf(v)<.4 and x>float(gap.from)
 var goal=game._next_goal()
 var dx=float(goal.x)-x
 if dx<13.:
  target=minf(target,maxf(.55,dx*.38))
  if dx<1.9:game.gas_level=0.;game.brake_pressed=true;return
 if game.tow!=null:
  if game.tow_joint==null and absf(v)<.7 and absf(game.tow.linear_velocity.x)<.7:game._winch_action()
  if absf(game.tow.position.x-float(game.route.length))<3.:
   game.gas_level=0.;game.brake_pressed=true
   if absf(v)<.5 and absf(game.tow.linear_velocity.x)<.5:game._winch_action()
   return
 if s.elapsed>5. and absf(v)<.20 and game.winch_left<=0. and game.winch_charges>0:game._winch_action()
 game.gas_level=clampf(.22+(target-v)*.4+maxf(0.,-slope)*1.2,0.,.60 if s.spec.family=="timber" and slope>-.2 else 1.) if v<target-.12 else 0.
 game.brake_pressed=v>target+.20
func run():
 await process_frame
 game=load("res://main.tscn").instantiate();root.add_child(game)
 await process_frame
 var data=root.get_node("Data")
 data.transient=true
 if data.profile!="test":data.switch_profile()
 data.save.owned=data.vehicles.map(func(m):return m.id);data.save.sound=false;data.save.music=false;data.save.tutorialDone=true
 for id in scenarios:
  game._destroy_run();await process_frame
  game.ridge_mode=id==-1;game.selected=maxi(0,id);game.ridge_load=1;game.urgent=false
  data.save.vehicle="scrambler" if data.roads[maxi(0,id)].get("gap") is Dictionary else "cedar" if data.roads[maxi(0,id)].get("cargo")=="logs" else "bison" if data.roads[maxi(0,id)].get("requires")=="mule" else "tanker" if data.roads[maxi(0,id)].get("cargo")=="liquid" else "bison" if id==48 else "rover"
  var car=data.pick(data.roads[maxi(0,id)]);data.save.setups[car]="trail" if data.vehicle(car).family in ["timber","mule"] else "standard"
  data.save.vehicle=car
  data.install("tires","mud")
  data.save.nativeRun34={};data.save.ridgeNative34={};game.begin_run()
  var checkpoint_count=0
  for n in range(15000):
   if game.mode=="fork":game._choose_path("detour")
   elif game.mode=="camp":
    game.rig.health=100.;game.rig.fuel=100.;game.resume_game()
   elif game.mode=="result" or game.mode=="rescue":break
   if n%6==0:controls()
   await physics_frame
  var row={"id":id,"car":game.rig.spec.id,"mode":game.mode,"outcome":game.last_outcome,"time":game.run_time,"x":game.rig.position.x,"y":game.rig.position.y,"health":game.rig.health,"integrity":game.rig.integrity,"cargo":game.rig.remaining(),"stops":game.stop_states,"gas":game.rig.gas,"low":game.rig.low,"velocity":[game.rig.linear_velocity.x,game.rig.linear_velocity.y],"braking":game.rig.braking,"sleep":game.rig.sleeping,"grounded":game.rig.grounded,"fuel":game.rig.fuel,"angle":game.rig.rotation}
  results.append(row);print(JSON.stringify(row))
 var f=FileAccess.open("/tmp/dustrivo-native-campaign.json",FileAccess.WRITE);f.store_string(JSON.stringify(results));f.close()
 quit()
