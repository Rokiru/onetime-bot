class_name DustrivoLandscape
extends Node2D
var game
var route: Dictionary
var road_color := Color("6d6267")
var surface_color := Color("c1a489")
var theme := 0
var rocks: Array = []
func build(owner_game,r: Dictionary):
 game=owner_game;route=r;theme=int(r.get("region",0))
 road_color=[Color("686b5e"),Color("756671"),Color("465767"),Color("a9856d"),Color("546e70"),Color("738e9c"),Color("675d76"),Color("617f78")][theme%8]
 surface_color=[Color("c7bc91"),Color("d8b6a5"),Color("91a5ab"),Color("f0d2a2"),Color("9bb8a1"),Color("e4eee6"),Color("bc9c9e"),Color("b3ccaa")][theme%8]
 var ground=StaticBody2D.new();ground.name="Terrain";ground.collision_layer=1;ground.collision_mask=2|4|8|16
 var material=PhysicsMaterial.new();material.friction=2.;ground.physics_material_override=material
 var segments=PackedVector2Array()
 var points=r.profile
 for i in range(points.size()-1):
  var a=Vector2(points[i][0],points[i][1]);var b=Vector2(points[i+1][0],points[i+1][1])
  var bridge=r.get("bridge")
  var gap=r.get("gap")
  var lift=r.get("liftBridge")
  if bridge is Dictionary and a.x>=float(bridge.from) and b.x<=float(bridge.to):continue
  if gap is Dictionary and a.x>=float(gap.from) and b.x<=float(gap.to):continue
  if lift is Dictionary and a.x>=float(lift.from) and b.x<=float(lift.to):continue
  segments.append(a);segments.append(b)
 var shape=CollisionShape2D.new();var mesh=ConcavePolygonShape2D.new();mesh.segments=segments;shape.shape=mesh
 ground.add_child(shape);add_child(ground)
 for rock in r.get("rocks",[]):
  var body=RigidBody2D.new();body.mass=20.;body.position=Vector2(float(rock.x),Data.height_at(r,float(rock.x))-.3);body.collision_layer=1;body.collision_mask=2|4
  var c=CollisionShape2D.new();var circle=CircleShape2D.new();circle.radius=float(rock.get("r",.24));c.shape=circle;body.add_child(c);add_child(body);rocks.append(body)
 queue_redraw()
func _draw():
 if route.is_empty():return
 var p=PackedVector2Array()
 for point in route.profile:p.append(Vector2(point[0],point[1]))
 p.append(Vector2(float(route.profile[-1][0]),38));p.append(Vector2(float(route.profile[0][0]),38))
 draw_colored_polygon(p,road_color.darkened(.35))
 var top=PackedVector2Array()
 for point in route.profile:top.append(Vector2(point[0],point[1]))
 for i in range(3):
  var band=PackedVector2Array()
  for point in top:band.append(point+Vector2(0,i*.20))
  draw_polyline(band,surface_color.darkened(i*.14),.19,false)
 var rng=RandomNumberGenerator.new();rng.seed=int(route.get("seed",int(route.get("id",0))+50))*67
 for n in range(int(float(route.length)/2.0)):
  var x=rng.randf_range(-10,float(route.length)+15)
  var y=Data.height_at(route,x)+rng.randf_range(.6,7.)
  var k=rng.randf_range(.03,.10)
  draw_line(Vector2(x,y),Vector2(x+k*2.,y-.05),road_color.lightened(.22),k)
 for n in range(int(float(route.length)/3.)):
  var x=n*3.1+2.
  var y=Data.height_at(route,x)
  if theme!=3 and theme!=5:
   for blade in range(3):draw_line(Vector2(x+blade*.06,y-.04),Vector2(x+blade*.06-.04,y-.18-rng.randf()*.11),surface_color.darkened(.34),.025)
  if n%7==0:
   var pole_y=Data.height_at(route,x+.5)
   draw_line(Vector2(x+.5,pole_y),Vector2(x+.5,pole_y-1.3),Color("778685"),.06)
   draw_line(Vector2(x+.2,pole_y-1.0),Vector2(x+.8,pole_y-1.0),Color("d0bc91"),.05)
 for stop in route.get("stops",route.get("drops",[])):
  _site(float(stop.x),"pump" if route.get("cargo")=="liquid" else "house",str(stop.get("name","ПОСТ")))
 for service in route.get("services",[]):_site(float(service.x),"service",str(service.get("name","МАСТЕРСКАЯ")))
 for gate in route.get("gates",[]):_site(float(gate.x)+4.,"gate","ПОСТ")
 _site(float(route.length)+6.,"service" if int(route.id)==0 else "depot","БАЗА")
 if route.get("gap") is Dictionary:
  var gap=route.gap
  draw_line(Vector2(float(gap.from),-float(gap.get("y",0))),Vector2(float(gap.from)+.35,-float(gap.get("y",0))-.15),Color("e3c38b"),.12)
 for ford in route.get("fords",[]):
  var water_y=-float(ford.level)
  var water=PackedVector2Array([Vector2(ford.from,water_y),Vector2(ford.to,water_y),Vector2(ford.to,water_y+1.7),Vector2(ford.from,water_y+1.7)])
  draw_colored_polygon(water,Color(.25,.65,.69,.55))
  draw_line(Vector2(ford.from,water_y),Vector2(ford.to,water_y),Color("a3e3dd"),.045)
func _site(x: float,kind: String,_title: String):
 var y=Data.height_at(route,x)
 var dark=Color("263d4b")
 var light=Color("d8cfb1")
 if kind=="gate":
  draw_rect(Rect2(x-.12,y-2.7,.24,2.7),dark)
  draw_rect(Rect2(x-.35,y-2.55,.7,.9),Color("bc6b5b"))
  draw_circle(Vector2(x,y-2.1),.16,Color("f6c18b"));return
 if kind=="pump":
  draw_style_box(_style(Color("648f99")),Rect2(x-1.5,y-2.6,2.1,2.4))
  draw_line(Vector2(x+.4,y-.3),Vector2(x+1.8,y-.3),light,.13)
  draw_line(Vector2(x+1.8,y-.3),Vector2(x+1.8,y-1.2),light,.13)
  draw_circle(Vector2(x+1.8,y-1.2),.28,Color("cd9d65"));return
 var width=4.5 if kind in ["service","depot"] else 2.8
 var left=x-width/2.
 draw_rect(Rect2(left,y-2.6,width,2.6),dark)
 draw_colored_polygon(PackedVector2Array([Vector2(left-.3,y-2.6),Vector2(x,y-3.45),Vector2(left+width+.3,y-2.6)]),Color("b38274"))
 draw_line(Vector2(left-.2,y-2.58),Vector2(left+width+.2,y-2.58),light,.065)
 if kind in ["service","depot"]:
  draw_rect(Rect2(x-.95,y-1.9,1.9,1.9),Color("142d38"))
  for j in range(4):draw_line(Vector2(x-.90,y-1.8+j*.38),Vector2(x+.90,y-1.8+j*.38),Color("526b74"),.04)
 else:
  draw_rect(Rect2(x-.8,y-1.9,.75,.7),Color("e7c88a"));draw_rect(Rect2(x+.45,y-1.8,.5,1.8),Color("172f3a"))
 draw_circle(Vector2(x+width*.7,y-.60),.16,Color("cba685"))
 draw_line(Vector2(x+width*.7,y-.43),Vector2(x+width*.7,y-.12),Color("d5ab69"),.17)
 draw_line(Vector2(left-.5,y+.03),Vector2(left+width+.8,y+.03),Color("cbd0b1"),.08)
func _style(color: Color) -> StyleBoxFlat:
 var box=StyleBoxFlat.new();box.bg_color=color;box.set_corner_radius_all(1);return box
class Backdrop extends Node2D:
 var game
 var region := 0
 var night := false
 var motion := 0.0
 var palette_region := -1
 var sky_texture: GradientTexture2D
 const PALETTES=[ ["c5b5a6","ecd5b3","798c99","486c78","214854"], ["cbb0b2","efd2b5","9b8d9e","6f758a","414c66"], ["182c48","405778","4c647f","334b6a","223d55"], ["e3bba7","f5dab0","bca89b","829c9c","3d707b"], ["91b5b9","d2d9c7","749fa5","4d7f8c","285564"], ["c4dce0","edf2df","b3ced3","86acbc","47788e"], ["b0a2b4","ebc1aa","817e99","595c7b","323d5c"], ["bdd1ba","ede0b6","88afa6","5e8c92","2c6370"] ]
 func _process(delta):
  motion+=delta
  if palette_region!=region:
   palette_region=region
   var gradient=Gradient.new();gradient.colors=PackedColorArray([Color(PALETTES[region%8][0]),Color(PALETTES[region%8][1])]);gradient.offsets=PackedFloat32Array([0.,1.])
   sky_texture=GradientTexture2D.new();sky_texture.gradient=gradient;sky_texture.width=4;sky_texture.height=256;sky_texture.fill_from=Vector2.ZERO;sky_texture.fill_to=Vector2(0,1)
  queue_redraw()
 func _draw():
  var size=get_viewport_rect().size
  var c=PALETTES[region%8]
  if sky_texture!=null:draw_texture_rect(sky_texture,Rect2(Vector2.ZERO,size),false)
  else:draw_rect(Rect2(Vector2.ZERO,size),Color(c[0]))
  draw_circle(Vector2(size.x*.79,size.y*.25),size.y*.075,Color("f4dfa7") if not night else Color("d9e4dc"))
  var cam=game.camera.position.x if game!=null and game.camera!=null else motion*.5
  for layer in range(3):
   var points=PackedVector2Array();points.append(Vector2(-10,size.y))
   for n in range(-2,19):
    var x=n*size.x/15.-fmod(cam*(.7+layer*.5),size.x/15.)
    var index=n+floor(cam*(.7+layer*.5)/(size.x/15.))
    var y=size.y*(.51+layer*.10)-(sin(index*.68+layer)+sin(index*.23+.8)*.7+cos(index*1.31)*.2)*size.y*(.11-layer*.02)
    points.append(Vector2(x,y))
   points.append(Vector2(size.x+10,size.y));draw_colored_polygon(points,Color(c[2+layer]))
  for n in range(34):
   var x=n*size.x/30.-fmod(cam*2.,size.x/30.)
   var y=size.y*.78+sin(n*1.7)*size.y*.035
   var h=size.y*(.06+fmod(n*.037,.10))
   draw_line(Vector2(x,y),Vector2(x,y-h),Color(c[4]).darkened(.10),2.)
   for branch in range(3):
    var peak=y-h+branch*h*.22
    var width=h*(.19+branch*.075)
    draw_colored_polygon(PackedVector2Array([Vector2(x,peak),Vector2(x-width,peak+h*.45),Vector2(x+width,peak+h*.45)]),Color(c[4]))
  if night:
   for n in range(28):draw_circle(Vector2(fmod(n*117.3,size.x),fmod(n*71.1,size.y*.4)),1.3,Color("c8ddd9"))
