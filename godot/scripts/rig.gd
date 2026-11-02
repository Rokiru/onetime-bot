class_name DustrivoRig
extends RigidBody2D
# Native rigid wheels, groove travel limits and damped springs. No pose playback drives the car.
var game
var spec: Dictionary
var kit: Dictionary
var levels: Array
var paint_color := Color("df8550")
var gas := 0.0
var braking := false
var low := false
var brake_held := 0.0
var reverse_gear := false
var health := 100.0
var fuel := 100.0
var heat := 35.0
var integrity := 100.0
var grounded := 0
var elapsed := 0.0
var wheels: Array = []
var cargo: Array = []
var springs: Array = []
var fluid := 0.0
var fluid_start := 0.0
var slosh := 0.0
var leak := false
var hit_cooldown := 0.0
var last_velocity := Vector2.ZERO
var roll := 0.0
var setup := "standard"
var axle_positions: Array = []
var tire_grip := 1.0
var engine_scale := 1.0
var fuel_scale := 1.0
var spring_scale := 1.0
var drag_speed := 1.0
var radius := .6
var total_lost := 0
var snap_count := 0
var ghost := false
var passive := false
var cargo_type := "crates"
var wheel_bodies: Array = []
class Payload extends RigidBody2D:
 var kind := "crates"
 var delivered := false
 var lost := false
 var home := Vector2.ZERO
 var strapped := true
 var previous_v := Vector2.ZERO
 func _draw():
  if kind=="liquid": return
  if kind=="logs":
   draw_style_box(_box(Color("8b654d")),Rect2(-1.6,-.18,3.2,.36))
   draw_line(Vector2(-1.4,-.09),Vector2(1.4,-.09),Color("bd9370"),.035)
   draw_circle(Vector2(1.48,0),.145,Color("d3b68a"))
   draw_arc(Vector2(1.48,0),.09,0,TAU,12,Color("8b654d"),.025)
  elif kind in ["generator","waterkit"]:
   draw_style_box(_box(Color("386374")),Rect2(-.62,-.48,1.24,.96))
   draw_rect(Rect2(-.48,-.36,.66,.62),Color("7c9ca6"))
   draw_circle(Vector2(-.16,-.05),.22,Color("233b49"))
   draw_arc(Vector2(-.16,-.05),.13,0,TAU,12,Color("c5d8d5"),.04)
   for x in range(4): draw_line(Vector2(.29+x*.065,-.31),Vector2(.29+x*.065,.25),Color("a7c3bd"),.025)
   draw_line(Vector2(-.58,.48),Vector2(.58,.48),Color("d1a875"),.09)
  else:
   draw_rect(Rect2(-.35,-.35,.7,.7),Color("aa7c50"))
   draw_rect(Rect2(-.3,-.3,.6,.6),Color("d4b17b"),false,.055)
   draw_line(Vector2(-.28,-.28),Vector2(.28,.28),Color("edcea0"),.05)
   draw_line(Vector2(-.28,.28),Vector2(.28,-.28),Color("94694d"),.045)
 func _box(color: Color) -> StyleBoxFlat:
  var box=StyleBoxFlat.new()
  box.bg_color=color
  box.set_corner_radius_all(0)
  return box
func configure(owner_game, definition: Dictionary, build: Dictionary, upgrade_levels: Array, color: Color, mode: String):
 game=owner_game
 spec=definition.duplicate(true)
 kit=build.duplicate(true)
 levels=upgrade_levels.map(func(value):return int(value))
 paint_color=color
 setup=mode
 mass=float(spec.get("mass",900))
 can_sleep=false
 if kit.get("suspension")=="heavy": mass*=1.06; spring_scale*=1.16
 if kit.get("suspension")=="comfort": spring_scale*=.82
 if kit.get("utility")=="guard": mass*=1.08
 if kit.get("utility")=="service": mass*=1.04
 tire_grip=1.0+float(levels[2])*.075
 if kit.get("tires")=="mud": tire_grip*=1.2;drag_speed*=.92;fuel_scale*=1.1
 if kit.get("tires")=="road": tire_grip*=.88;drag_speed*=1.05;fuel_scale*=.9
 if setup=="trail": tire_grip*=1.08;engine_scale*=1.07;drag_speed*=.94;fuel_scale*=1.07
 if setup=="economy": engine_scale*=.96;drag_speed*=.90;fuel_scale*=.82
 engine_scale*=1.+float(levels[0])*.12
 spring_scale*=1.+float(levels[1])*.035
 radius=float(spec.radius)

 axle_positions=spec.get("axles",[-float(spec.base),float(spec.base)])
 for i in range(axle_positions.size()): wheels.append({"x":float(axle_positions[i]),"distance":.68,"contact":false,"spin":0.0,"drive":i in spec.get("driven",range(axle_positions.size()))})
 collision_layer=2
 collision_mask=1|4|8
 continuous_cd=RigidBody2D.CCD_MODE_CAST_SHAPE
 max_contacts_reported=8
 contact_monitor=true
 linear_damp=.05
 angular_damp=1.5
 var bed=CollisionShape2D.new()
 var rectangle=RectangleShape2D.new();rectangle.size=Vector2(float(spec.width)*2,.22)
 bed.shape=rectangle;add_child(bed)
 var cab=CollisionShape2D.new()
 var shape=ConvexPolygonShape2D.new()
 var front=float(spec.width)
 var cab_start=.25 if spec.family in ["rover","scrambler"] else .65
 shape.points=PackedVector2Array([Vector2(cab_start,-.15),Vector2(cab_start+.10,-1.15),Vector2(front-.45,-1.15),Vector2(front,-.35),Vector2(front,.08)])
 cab.shape=shape;add_child(cab)
 for edge in [float(spec.bedBack),float(spec.bedFront)]:
  var wall=CollisionShape2D.new();var box=RectangleShape2D.new();box.size=Vector2(.10,.5)
  wall.shape=box;wall.position=Vector2(edge,-.3);add_child(wall)
 if spec.get("closed",false) and spec.family not in ["timber","tanker"]:
  var roof=CollisionShape2D.new();var roof_shape=RectangleShape2D.new();roof_shape.size=Vector2(absf(float(spec.bedBack)-float(spec.bedFront)),.12)
  roof.shape=roof_shape;roof.position=Vector2((float(spec.bedBack)+float(spec.bedFront))*.5,-1.65);add_child(roof)
func load_cargo(route: Dictionary, load_count:=0):
 create_wheels()
 cargo_type=str(route.get("cargo","crates"))
 var count=int(route.get("boxes",3)) if load_count==0 else load_count
 if cargo_type=="liquid":
  fluid_start=float(route.get("litres",900));fluid=fluid_start;count=3
 for i in range(count):
  var box=Payload.new();box.kind=cargo_type;box.name="Payload"+str(i)
  box.mass=330.0 if cargo_type=="generator" else 80.0 if cargo_type=="waterkit" else 100.0 if cargo_type=="logs" else 34.0
  var columns=int(spec.get("cargoColumns",2))
  var home=Vector2(float(spec.get("cargoX",-1.2))+(i%columns)*.73,-.54-floorf(float(i)/columns)*.73)
  if cargo_type=="generator": home=Vector2(-.9,-.65)
  if cargo_type=="waterkit": home=Vector2(-1.05+i*.9,-.64)
  if cargo_type=="logs": home=Vector2(-.9,-.44-i*.36)
  if cargo_type=="liquid": home=Vector2(-1.6+i*.80,-.63);box.mass=maxf(1.,fluid*.26/3.)
  box.home=home;box.position=to_global(home);box.rotation=rotation
  box.collision_layer=4 if cargo_type!="liquid" else 0
  box.collision_mask=1|2|4 if cargo_type!="liquid" else 0
  box.continuous_cd=RigidBody2D.CCD_MODE_CAST_SHAPE
  box.linear_damp=.08;box.angular_damp=.25
  var c=CollisionShape2D.new()
  if cargo_type=="logs":
   var capsule=CapsuleShape2D.new();capsule.radius=.17;capsule.height=3.3;c.shape=capsule;c.rotation=PI/2.
  else:
   var rect=RectangleShape2D.new();rect.size=Vector2(1.22,.92) if cargo_type in ["generator","waterkit"] else Vector2(.68,.68);c.shape=rect
  if cargo_type!="liquid": box.add_child(c)
  else: c.free()
  game.add_child(box);cargo.append(box)
  if cargo_type=="liquid":
   var groove=GrooveJoint2D.new();game.add_child(groove)
   groove.global_position=to_global(home-Vector2(.48,0));groove.rotation=rotation-PI/2.
   groove.length=.96;groove.initial_offset=.48
   groove.node_a=groove.get_path_to(self);groove.node_b=groove.get_path_to(box)
   springs.append(groove)
func create_wheels():
 if ghost or not wheel_bodies.is_empty():return
 var spring_k=mass*12./(.32*wheels.size())*spring_scale
 for wheel in wheels:
  var body=RigidBody2D.new();body.name="Tire"+str(wheel_bodies.size());body.mass=float(spec.get("wheelDensity",1.8))*45.;body.can_sleep=false;body.continuous_cd=RigidBody2D.CCD_MODE_CAST_SHAPE;body.contact_monitor=true;body.max_contacts_reported=6
  body.collision_layer=16;body.collision_mask=1|8;body.linear_damp=.03;body.angular_damp=.03
  var material=PhysicsMaterial.new();material.friction=tire_grip;material.bounce=0.;body.physics_material_override=material
  var collision=CollisionShape2D.new();var circle=CircleShape2D.new();circle.radius=radius;collision.shape=circle;body.add_child(collision)
  wheel.contacts=0
  body.body_entered.connect(func(_other):wheel.contacts=int(wheel.contacts)+1)
  body.body_exited.connect(func(_other):wheel.contacts=maxi(0,int(wheel.contacts)-1))
  body.position=to_global(Vector2(wheel.x,.67));game.world.add_child(body);wheel_bodies.append(body)
  var groove=GrooveJoint2D.new();game.world.add_child(groove);groove.global_position=to_global(Vector2(wheel.x,.18));groove.rotation=rotation;groove.length=.9;groove.initial_offset=.49;groove.node_a=groove.get_path_to(self);groove.node_b=groove.get_path_to(body)
  var spring=DampedSpringJoint2D.new();game.world.add_child(spring);spring.global_position=to_global(Vector2(wheel.x,-.10));spring.rotation=rotation;spring.length=.77;spring.rest_length=1.04;spring.stiffness=spring_k;spring.damping=2.*sqrt(spring_k*body.mass)*.68;spring.node_a=spring.get_path_to(self);spring.node_b=spring.get_path_to(body)
func _integrate_forces(state: PhysicsDirectBodyState2D):
 if ghost:return
 var dt=state.step;elapsed+=dt
 if passive or not braking or game.parking_hold or grounded==0:brake_held=0.;reverse_gear=false
 elif absf(state.linear_velocity.x)<.35:
  brake_held+=dt
  if brake_held>.8:reverse_gear=true
 else:brake_held=0.
 grounded=0
 var target_omega=float(spec.speed)*drag_speed*(1.+float(levels[0])*.035)*(.57 if low else 1.)
 for i in range(wheel_bodies.size()):
  var body=wheel_bodies[i]
  var wheel=wheels[i]
  wheel.contact=int(wheel.get("contacts",0))>0 or absf(body.position.y+radius-Data.height_at(game.route,body.position.x))<.15
  if wheel.contact:grounded+=1
  var local=to_local(body.position);wheel.distance=local.y+.12;wheel.spin=body.rotation-rotation
  var torque=0.
  var cap=900.*2.75*radius*engine_scale*(float(spec.torque)/32.)*(2.35 if low else 1.)
  var brake_cap=mass*7./maxi(1,wheels.size())*radius
  if not passive and gas>.01 and not braking and fuel>0. and wheel.get("drive",true):torque=clampf((target_omega-body.angular_velocity)*body.mass*radius*radius*16.,-cap,cap)*gas
  elif braking:
   var reverse=reverse_gear and grounded>0 and not game.parking_hold
   torque=clampf(((-1.3/radius if reverse else 0.)-body.angular_velocity)*body.mass*radius*radius*30.,-brake_cap,brake_cap)
  body.apply_torque(torque)
  state.apply_torque(-torque)
 if grounded==0:state.apply_torque(mass*.45*(-gas+(1. if braking else 0.)))
 fuel=maxf(0.,fuel-dt*(.012+gas*.115*fuel_scale*float(spec.get("fuelFactor",1.))))
 heat=clampf(heat+dt*(gas*1.-.45),25.,115.)
 if heat>103.:state.apply_central_force(-state.linear_velocity*mass*.12)
 hit_cooldown=maxf(0.,hit_cooldown-dt)
 var jolt=(state.linear_velocity-last_velocity).length()
 if elapsed>1.5 and hit_cooldown<=0. and grounded>0 and jolt>3.:
  var damage=clampf((jolt-3.)*4.,1.,24.)*(.85 if kit.get("utility")=="guard" else 1.)
  health=maxf(0.,health-damage);hit_cooldown=.5
  if cargo_type=="liquid" and jolt>5.5:leak=true
  game.impact(damage)
 last_velocity=state.linear_velocity
func _physics_process(delta):
 if ghost: return
 for body in wheel_bodies:
  var surface=Data.surface(game.route,body.position.x)
  var grip=clampf(float(surface.get("friction",.95))*tire_grip*float(spec.get("gripFactor",1.)),.12,1.9)
  if not is_equal_approx(body.physics_material_override.friction,grip):body.physics_material_override.friction=grip
 var shift=0.
 for box in cargo:
  if box.delivered or box.lost: continue
  var home_point=to_global(box.home)
  var local=to_local(box.global_position)
  var relative_v=box.linear_velocity-linear_velocity-Vector2(-(home_point-global_position).y,(home_point-global_position).x)*angular_velocity
  if cargo_type=="liquid":
   var axis=Vector2.RIGHT.rotated(rotation)
   var displacement=local.x-box.home.x
   var force=axis*(-displacement*box.mass*7.0-relative_v.dot(axis)*box.mass*1.7)
   box.apply_central_force(force);apply_force(-force,home_point-global_position)
   shift+=displacement
   box.mass=maxf(.2,fluid*.26/3.)
  elif box.strapped:
   var displacement=home_point-box.global_position
   if displacement.length()>1.45 and not spec.get("closed",false):
    box.strapped=false;snap_count+=1;game.message("Ремень сорван — сбавь ход")
   else:
    var stiffness=box.mass*(110. if cargo_type in ["generator","waterkit"] else 80.)
    var force=displacement*stiffness-relative_v*box.mass*14.0
    box.apply_central_force(force);apply_force(-force,home_point-global_position)
  if cargo_type!="liquid":
   var impact_delta=(box.linear_velocity-box.previous_v).length()
   if elapsed>2. and impact_delta>3.2: integrity=maxf(0.,integrity-(impact_delta-3.2)*2.5)
   box.previous_v=box.linear_velocity
   if local.y>4.5 or local.x<float(spec.bedBack)-2.5 or local.x>float(spec.width)+3.:
    box.lost=true;box.strapped=false;total_lost+=1;game.message("Груз потерян")
 slosh=shift/3.
 if leak: fluid=maxf(0.,fluid-delta*1.7)
 var depth=game.water_depth(global_position)
 if depth>.15:
  apply_central_force(-linear_velocity*mass*clampf(depth*.8,0.,1.8))
  apply_central_force(Vector2.UP*mass*12.*clampf(depth*.20,0.,.60))
 queue_redraw()
func remaining() -> int:
 var count=0
 for box in cargo:
  if not box.lost: count+=1
 return count
func aboard() -> int:
 var count=0
 for box in cargo:
  if not box.delivered and not box.lost: count+=1
 return count
func unload(litres:=0.0):
 if cargo_type=="liquid": fluid=maxf(0.,fluid-litres);return
 for box in cargo:
  if not box.delivered and not box.lost:
   box.delivered=true;box.freeze=true;box.visible=false;box.collision_layer=0;box.collision_mask=0;return
func _draw():
 var width=float(spec.get("width",1.83))
 var stroke=Color("172d39")
 var trim=Color("dfcfaf")
 for wheel in wheels:
  var p=Vector2(wheel.x,wheel.distance-.12)
  draw_line(Vector2(wheel.x-.18,.05),p,Color("71878b"),.075)
  draw_line(Vector2(wheel.x+.18,-.02),p,Color("bd995f"),.065)
  draw_circle(p,radius+.06,stroke)
  draw_circle(p,radius,Color("263845"))
  for n in range(12):
   var angle=n*TAU/12.+float(wheel.spin)
   var axis=Vector2.from_angle(angle)
   draw_line(p+axis*(radius-.075),p+axis*(radius+.015),Color("657679"),.055 if kit.get("tires")=="mud" else .035)
  draw_circle(p,radius*.57,Color("b7b5a4") if kit.get("rims")!="black" else Color("4a5c67"))
  draw_circle(p,radius*.38,Color("455766"))
  for n in range(5):
   var angle=n*TAU/5.+float(wheel.spin)
   draw_line(p+Vector2.from_angle(angle)*radius*.18,p+Vector2.from_angle(angle)*radius*.49,trim,.045)
  draw_circle(p,.085,trim)
 draw_rect(Rect2(-width,-.15,width*2,.24),stroke)
 draw_line(Vector2(-width+.08,.14),Vector2(width-.1,.14),Color("97a8a4"),.05)
 var truck=spec.family in ["timber","tanker","mule"]
 var cab_start=.55 if truck else .22
 var roof=-1.28 if truck else -1.05
 if spec.id in ["cedar","atlas","boreal","taiga"]: cab_start=.65;roof=-1.52
 var body=PackedVector2Array([Vector2(cab_start,-.15),Vector2(cab_start+.06,roof),Vector2(width-.52,roof),Vector2(width-.10,-.66),Vector2(width,-.58),Vector2(width,-.10)])
 draw_colored_polygon(body,paint_color)
 draw_polyline(PackedVector2Array([body[0],body[1],body[2],body[3],body[4],body[5]]),stroke,.07,false)
 draw_colored_polygon(PackedVector2Array([Vector2(cab_start+.16,roof+.13),Vector2(width-.58,roof+.13),Vector2(width-.25,-.65),Vector2(cab_start+.16,-.65)]),Color("86bdc5"))
 draw_line(Vector2(cab_start+.22,roof+.20),Vector2(width-.55,-.70),Color("c5e4df"),.035)
 draw_line(Vector2(cab_start,-.53),Vector2(width-.1,-.53),paint_color.lightened(.3),.07)
 draw_line(Vector2(cab_start+.08,-.5),Vector2(cab_start+.08,-.17),stroke,.035)
 draw_rect(Rect2(cab_start+.17,-.47,.18,.055),trim)
 draw_rect(Rect2(width-.1,-.48,.13,.14),Color("fff0b5"))
 draw_line(Vector2(width-.11,-.08),Vector2(width+.10,-.08),trim,.09)
 # Faceted metal and glass, visible cab fittings, and per-family chassis detail.
 draw_colored_polygon(PackedVector2Array([Vector2(cab_start+.04,-.53),Vector2(width-.13,-.53),Vector2(width-.13,-.20),Vector2(cab_start+.04,-.20)]),paint_color.darkened(.13))
 draw_line(Vector2(cab_start+.02,roof+.03),Vector2(width-.53,roof+.03),paint_color.lightened(.52),.07)
 draw_line(Vector2(cab_start+.18,roof+.15),Vector2(cab_start+.18,-.65),stroke,.045)
 draw_line(Vector2(width-.53,roof+.12),Vector2(width-.24,-.64),stroke,.045)
 var driver_x=cab_start+.37
 draw_circle(Vector2(driver_x,roof+.42),.115,Color("d2ad83"))
 draw_line(Vector2(driver_x,roof+.54),Vector2(driver_x+.08,-.64),Color("354d5b"),.16)
 draw_line(Vector2(cab_start-.10,-.83),Vector2(cab_start-.22,-.96),stroke,.04)
 draw_rect(Rect2(cab_start-.32,-1.06,.14,.23),stroke)
 draw_rect(Rect2(width-.02,-.43,.10,.16),Color("ffe8a4"))
 draw_rect(Rect2(width-.03,-.22,.12,.07),Color("d59c66"))
 draw_line(Vector2(width-.02,-.06),Vector2(width+.14,-.10),stroke,.12)
 draw_line(Vector2(-width,-.06),Vector2(-width-.12,-.06),stroke,.09)
 draw_rect(Rect2(-width-.05,-.40,.08,.14),Color("bd665a"))
 draw_rect(Rect2(-width,-.46,cab_start+width,.34),paint_color.darkened(.1))
 draw_line(Vector2(-width,-.48),Vector2(cab_start,-.48),trim,.07)
 if spec.family=="tanker":
  draw_style_box(_tank_box(paint_color.darkened(.12)),Rect2(-width+.15,-1.63,width+.26,1.27))
  draw_style_box(_tank_box(Color("182f3d")),Rect2(-width+.30,-1.43,width-.10,.80))
  var tank_left=-width+.34
  var tank_right=.16
  var water_height=lerpf(-.64,-1.37,clampf(fluid/maxf(1.,fluid_start),0.,1.))
  draw_colored_polygon(PackedVector2Array([Vector2(tank_left,water_height+slosh*.4),Vector2(tank_right,water_height-slosh*.4),Vector2(tank_right,-.65),Vector2(tank_left,-.65)]),Color("5cb8b9"))
  for x in [-width+.5,-.35]: draw_line(Vector2(x,-1.60),Vector2(x,-.39),trim,.065)
  draw_rect(Rect2(-1.,-1.76,.5,.14),stroke)
 elif spec.family=="timber":
  for x in [-width+.2,-.8,.15]: draw_line(Vector2(x,-.3),Vector2(x,-1.65),paint_color.lightened(.3),.09)
 elif spec.get("closed",false):
  draw_rect(Rect2(-width+.1,-1.60,cab_start+width-.22,1.1),paint_color.darkened(.08))
  draw_line(Vector2(-width+.12,-1.60),Vector2(cab_start-.1,-1.60),trim,.06)
  for y in [-1.38,-1.0,-.65]:draw_line(Vector2(-width+.2,y),Vector2(cab_start-.2,y),paint_color.lightened(.2),.025)
 for wheel in wheels:
  var p=Vector2(wheel.x,wheel.distance-.12)
  draw_arc(p,radius+.10,PI*1.08,PI*1.92,18,paint_color.darkened(.3),.15,false)
  draw_arc(p,radius+.17,PI*1.10,PI*1.90,18,paint_color.lightened(.25),.035,false)
  draw_line(Vector2(wheel.x-radius-.10,p.y-.06),Vector2(wheel.x-radius-.12,p.y+.25),stroke,.09)
 draw_line(Vector2(cab_start+.03,.19),Vector2(width-.15,.19),Color("a8bbb7"),.06)
 if truck:
  draw_line(Vector2(cab_start-.22,-.15),Vector2(cab_start-.22,roof-.12),stroke,.10)
  draw_rect(Rect2(cab_start-.29,roof-.20,.20,.13),Color("829da3"))
  for index in range(4):draw_line(Vector2(width-.28,-.33+index*.05),Vector2(width-.12,-.33+index*.05),stroke,.025)
 if spec.family=="scrambler":
  draw_line(Vector2(-width+.20,-.48),Vector2(-.25,roof-.13),Color("e3c29a"),.075)
  draw_line(Vector2(-.25,roof-.13),Vector2(cab_start+.1,roof-.13),Color("e3c29a"),.075)
 if spec.family=="timber":
  draw_line(Vector2(-width,-.22),Vector2(.3,-.22),Color("b8a47b"),.045)
  for x in [-width+.3,-.9,.12]:draw_rect(Rect2(x-.09,-.30,.18,.19),Color("deb98b"))
 if kit.get("livery") in ["stripe","expedition"]: draw_line(Vector2(-width+.12,-.31),Vector2(width-.15,-.31),trim,.09)
 if kit.get("livery")=="number":
  draw_circle(Vector2(cab_start+.45,-.35),.17,trim)
  draw_line(Vector2(cab_start+.42,-.42),Vector2(cab_start+.42,-.27),stroke,.035)
  draw_line(Vector2(cab_start+.48,-.42),Vector2(cab_start+.55,-.42),stroke,.035)
 if kit.get("utility")=="guard": draw_line(Vector2(-width+.15,.23),Vector2(width,.23),Color("82989e"),.10)
 if kit.get("utility")=="service":
  draw_rect(Rect2(cab_start+.18,roof-.18,.70,.16),Color("bda277"))
  draw_line(Vector2(cab_start+.1,roof-.22),Vector2(cab_start+.93,roof-.22),stroke,.07)
func _tank_box(color: Color) -> StyleBoxFlat:
 var box=StyleBoxFlat.new();box.bg_color=color;box.set_corner_radius_all(1);return box
func snapshot() -> Dictionary:
 var boxes=[]
 for b in cargo: boxes.append({"p":[b.position.x,b.position.y],"v":[b.linear_velocity.x,b.linear_velocity.y],"a":b.rotation,"w":b.angular_velocity,"lost":b.lost,"delivered":b.delivered,"strapped":b.strapped})
 var tires=[]
 for b in wheel_bodies:tires.append({"p":[b.position.x,b.position.y],"v":[b.linear_velocity.x,b.linear_velocity.y],"a":b.rotation,"w":b.angular_velocity})
 return {"wheels":tires,"p":[position.x,position.y],"v":[linear_velocity.x,linear_velocity.y],"a":rotation,"w":angular_velocity,"snap_count":snap_count,"total_lost":total_lost,"health":health,"fuel":fuel,"heat":heat,"integrity":integrity,"fluid":fluid,"leak":leak,"low":low,"cargo":boxes,"elapsed":elapsed}
func restore(s: Dictionary):
 for i in range(mini(wheel_bodies.size(),s.get("wheels",[]).size())):
  var b=wheel_bodies[i];var data=s.wheels[i];b.position=Vector2(data.p[0],data.p[1]);b.rotation=float(data.a);b.linear_velocity=Vector2(data.v[0],data.v[1]);b.angular_velocity=float(data.w)
 position=Vector2(s.p[0],s.p[1]);rotation=float(s.a);linear_velocity=Vector2(s.v[0],s.v[1]);angular_velocity=float(s.w)
 last_velocity=linear_velocity;snap_count=int(s.get("snap_count",0));total_lost=int(s.get("total_lost",0))
 health=float(s.health);fuel=float(s.fuel);heat=float(s.heat);integrity=float(s.integrity);fluid=float(s.fluid);leak=bool(s.leak);low=bool(s.low);elapsed=float(s.elapsed)
 for i in range(mini(cargo.size(),s.cargo.size())):
  var b=cargo[i];var saved=s.cargo[i]
  b.position=Vector2(saved.p[0],saved.p[1]);b.rotation=float(saved.a);b.linear_velocity=Vector2(saved.v[0],saved.v[1]);b.angular_velocity=float(saved.w);b.previous_v=b.linear_velocity
  b.lost=bool(saved.lost);b.delivered=bool(saved.delivered);b.strapped=bool(saved.strapped)
  if b.delivered: b.freeze=true;b.visible=false;b.collision_layer=0;b.collision_mask=0
