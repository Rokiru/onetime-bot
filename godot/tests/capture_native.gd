extends SceneTree
func _initialize():call_deferred("run")
func run():
 await process_frame
 DisplayServer.window_set_size(Vector2i(1280,720))
 var game=load("res://main.tscn").instantiate();root.add_child(game)
 await process_frame
 var data=root.get_node("Data")
 data.transient=true
 if data.profile!="test":data.switch_profile()
 data.save.owned=data.vehicles.map(func(m):return m.id)
 data.save.sound=false;data.save.music=false;data.save.tutorialDone=true
 game.selected=48;game.ridge_mode=false;game._hub()
 for n in range(8):await process_frame
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("/tmp/dustrivo-godot-hub.png")
 game.garage_car="taiga";game.tab="Гараж";game._hub()
 for n in range(5):await process_frame
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("/tmp/dustrivo-godot-garage.png")
 game.selected=48;game.ridge_mode=false;data.save.vehicle="fox";game.begin_run()
 game.gas_level=.65
 for n in range(420):await physics_frame
 game.gas_level=0.
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("/tmp/dustrivo-godot-driving.png")
 var icon=Image.new();icon.load_svg_from_string(FileAccess.get_file_as_string("res://assets/icon.svg"));icon.resize(512,512,Image.INTERPOLATE_LANCZOS);icon.convert(Image.FORMAT_RGB8);icon.save_png("/tmp/dustrivo-godot-icon.png")
 print("Captured real native Godot frames: hub, garage, moving loaded vehicle")
 quit()
