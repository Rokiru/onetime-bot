extends SceneTree
# One focused native integration run; no repeated historical JS playthroughs.
var game
var failures: Array = []
var report: Array = []
func _initialize():call_deferred("run")
func check(ok: bool,text: String):
 if not ok:failures.append(text);push_error(text)
func run():
 await process_frame
 game=load("res://main.tscn").instantiate();root.add_child(game)
 await process_frame
 var data=root.get_node("Data")
 var previous=data.profiles.duplicate(true);var previous_profile=data.profile;var previous_save=data.save;var was_migrated=data.migrated
 var legacy={"wallet":1234,"owned":["rover","rivet"],"vehicle":"rivet","levels":[2,1,0],"workshopPowered":true,"stats":[{"wins":2,"stars":3}],"activeRun":{"engine":"river17","attempt":"archive-test","id":7}}
 var xml="<map><string name=\"cargo-career-v1\">"+JSON.stringify(legacy).xml_escape()+"</string></map>"
 check(data.import_backup_xml(xml),"Native Android preferences XML is imported")
 var imported=data.normalize(data.profiles.career,"career")
 check(imported.wallet==1234 and imported.owned.has("rivet") and imported.workshopPowered and imported.stats.size()==72,"Legacy wallet, cars, flags and 72-entry stats preserved")
 check(imported.legacyCheckpoint34.engine=="river17" and imported.nativeRun34.is_empty(),"Planck trip archived without automatic physics conversion")
 data.profiles=previous;data.profile=previous_profile;data.save=previous_save;data.migrated=was_migrated
 check(data.catalog.sequence.find(0)==0 and data.vehicle("boreal").driven.has(3),"Integer IDs and four driven axles survive JSON conversion")
 check(data.roads.size()==72,"72 authored route definitions")
 check(data.vehicles.size()==16,"16 distinct vehicle definitions")
 data.switch_profile() if data.profile!="test" else null
 data.save.owned=data.vehicles.map(func(m):return m.id)
 data.save.tutorialDone=true;data.save.sound=false;data.save.music=false
 game.selected=48;game.ridge_mode=false;data.save.vehicle="rover";game.begin_run()
 for n in range(180):await physics_frame
 check(game.rig.position.y<4.,"Suspension supports stationary loaded car")
 var start=game.rig.position
 game.gas_level=.65
 for n in range(240):await physics_frame
 check(game.rig.position.x>start.x+3.,"Real motor forces move loaded car")
 check(game.rig.position.y<20.,"Vehicle remains on physical road")
 var snapshot=game._snapshot()
 game.checkpoint();game.pause_game()
 var paused=game.rig.position
 for n in range(10):await process_frame
 check(game.rig.position.distance_to(paused)<.001,"Pause freezes physics")
 game.begin_run(snapshot)
 check(game.rig.position.distance_to(Vector2(snapshot.rig.p[0],snapshot.rig.p[1]))<.05,"Native checkpoint restores actual car pose")
 game.resume_game()
 report.append({"scenario":"crate native drive","position":[game.rig.position.x,game.rig.position.y]})
 game._destroy_run();await process_frame
 game.selected=49;data.save.vehicle="delta";game.begin_run()
 for n in range(180):await physics_frame
 check(game.rig.cargo.size()==3 and game.rig.fluid==900.,"Tank has three constrained physical masses and 900 litres")
 game.rig.unload(250.);check(game.rig.fluid==650.,"Pumping changes physical tank mass")
 report.append({"scenario":"native liquid","litres":game.rig.fluid})
 game._destroy_run();await process_frame
 game.ridge_mode=true;game.ridge_load=3;game.begin_run()
 check(game.rig.spec.id=="rover" and game.rig.levels==[0,0,0],"Ridge uses fixed stock ROVER")
 check(not game.map_open and not game.hud_map.visible,"Driving map collapsed by default")
 var safe=game._snapshot();game.checkpoint();check(data.save.ridgeNative34.get("rules")=="godot34","Independent native ridge save")
 report.append({"scenario":"ridge","cargo":game.rig.remaining(),"map_open":game.map_open})
 game._destroy_run();await process_frame
 game.ridge_mode=false;game.selected=4;data.save.vehicle="rover";game.begin_run()
 for n in range(150):
  game.brake_pressed=n%40<20
  await physics_frame
 game.brake_pressed=false
 check(game.tow!=null,"Recovery has a second physical vehicle")
 game._winch_action();check(game.tow_joint!=null,"Stopped recovery rig attaches a real native spring joint")
 report.append({"scenario":"tow","attached":game.tow_joint!=null})
 var f=FileAccess.open("/tmp/dustrivo-native-smoke.json",FileAccess.WRITE);f.store_string(JSON.stringify({"checks":report,"failures":failures}));f.close()
 game._destroy_run();game.queue_free();await process_frame
 if failures.is_empty():print("PASS native Godot: content, suspension/motor, pause/checkpoint, physical liquid, stock ridge, compact HUD, native tow")
 quit(0 if failures.is_empty() else 1)
