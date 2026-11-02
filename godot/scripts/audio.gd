class_name DustrivoAudio
extends Node
# Audio is baked once; the audio server mixes it without per-sample GDScript work.
var game
var stream_paused := false
var motor: AudioStreamPlayer
var road: AudioStreamPlayer
var music: AudioStreamPlayer
var signal_player: AudioStreamPlayer
func _loop(path: String) -> AudioStreamPlayer:
 var player=AudioStreamPlayer.new()
 var sample=load(path) as AudioStreamWAV
 sample.loop_mode=AudioStreamWAV.LOOP_FORWARD;sample.loop_begin=0;sample.loop_end=int(sample.get_length()*sample.mix_rate)
 player.stream=sample;player.volume_db=-80.;add_child(player);player.play();return player
func _ready():
 motor=_loop("res://assets/audio/engine.wav")
 road=_loop("res://assets/audio/road.wav")
 music=_loop("res://assets/audio/music.wav")
 signal_player=AudioStreamPlayer.new();add_child(signal_player)
func event(kind: String):
 if not Data.save.get("sound",true):return
 var clip="stop" if kind=="stop" else "win" if kind=="win" else "lost" if kind=="lost" else "impact"
 signal_player.stream=load("res://assets/audio/"+clip+".wav");signal_player.volume_db=linear_to_db(float(Data.save.get("volume",65))/100.*.36);signal_player.play()
func _process(_delta):
 if motor==null:return
 var active=game!=null and game.mode=="drive" and game.rig!=null
 var gain=float(Data.save.get("volume",65))/100. if Data.save.get("sound",true) else 0.
 var speed=0.;var rpm=0.
 if active:
  speed=absf(game.rig.linear_velocity.x)
  for tire in game.rig.wheel_bodies:rpm+=absf(tire.angular_velocity)
  rpm/=maxi(1,game.rig.wheel_bodies.size())
  var diesel=game.rig.spec.family in ["timber","tanker","mule"]
  motor.pitch_scale=clampf((.67 if diesel else .84)+rpm*.043+game.rig.gas*.14,.60,2.3)
  var surface=Data.surface(game.route,game.rig.position.x)
  road.pitch_scale=1.55 if game.water_depth(game.rig.position)>.1 else .65 if surface.type=="mud" else 1.
 motor.volume_db=linear_to_db(maxf(.0001,gain*(.11+game.rig.gas*.16))) if active and game.rig.fuel>0. else -80.
 road.volume_db=linear_to_db(maxf(.0001,gain*minf(.22,speed*.018))) if active else -80.
 music.volume_db=linear_to_db(maxf(.0001,gain*(.13 if active else .30))) if Data.save.get("music",true) else -80.
 for player in [motor,road,music,signal_player]:player.stream_paused=stream_paused
