extends Node2D
const Rig = preload("res://scripts/rig.gd")
const Landscape = preload("res://scripts/landscape.gd")
const Synth = preload("res://scripts/audio.gd")
var ui: Control
var hud: Control
var toast: Label
var audio: DustrivoAudio
var sky
var camera: Camera2D
var world: Node2D
var land: DustrivoLandscape
var rig: DustrivoRig
var tow: DustrivoRig
var tow_joint: DampedSpringJoint2D
var ghost_rig: DustrivoRig
var ghost_data: Dictionary = {}
var route: Dictionary = {}
var mode := "hub"
var tab := "Рейсы"
var selected := 0
var garage_car := "rover"
var garage_tab := "Улучшения"
var route_filter := -1
var ridge_mode := false
var ridge_load := 1
var branch := "pending"
var urgent := false
var run_id := ""
var run_time := 0.0
var coins := 0
var penalty := 0
var recoveries := 0
var winch_charges := 2
var winch_left := 0.0
var winch_anchor := Vector2.ZERO
var stop_states: Array = []
var gate_states: Array = []
var service_states: Array = []
var check_states: Array = []
var sector_states: Array = []
var bridge_bodies: Array = []
var barrier_bodies: Array = []
var dynamic_planks: Array = []
var hold := 0.0
var parking_hold := false
var gas_level := 0.0
var brake_pressed := false
var touch_gas := -1
var touch_brake := -1
var gas_rect := Rect2()
var brake_rect := Rect2()
var next_autosave := 5.0
var next_safe := 20.0
var drowning := 0.0
var flip_time := 0.0
var camp := 0
var delivered_litres := 0.0
var last_air := false
var air_time := 0.0
var last_award := -100.0
var landing_points := 0
var trace: Array = []
var items: Array = []
var next_trace := 0.0
var map_open := false
var hud_timer := 0.0
var toast_until := 0.0
var hud_speed: Label
var hud_vitals: Label
var hud_objective: Label
var hud_map: Control
var gear_button: Button
var winch_button: Button
var menu_build := false
var last_outcome: Dictionary = {}
var main_font=preload("res://assets/Body.ttf")
var display_font=preload("res://assets/Display.ttf")
const INK=Color("172d3b")
const PAPER=Color("e9dcc0")
const GOLD=Color("f1ab69")
const MUTED=Color("9ab2bb")
const CHAPTERS=[{"id":0,"title":"Вернуть свет","flag":"workshopPowered"},{"id":3,"title":"Вернуть воду","flag":"villageWater"},{"id":4,"title":"Спасти механика","flag":"villageRescue"},{"id":1,"title":"Крепёж для моста"},{"id":5,"title":"Проверить опоры"},{"id":6,"title":"Закончить смену"},{"id":2,"title":"Вернуть связь"},{"id":7,"title":"Помочь медикам"},{"id":8,"title":"Рассвет на станции"}]
func _ready():
 process_mode=Node.PROCESS_MODE_ALWAYS
 RenderingServer.set_default_clear_color(INK)
 if DisplayServer.get_name()!="headless":Engine.max_fps=30
 selected=int(Data.save.selected)
 ridge_mode=Data.save.get("hubJob29","")=="ridge"
 garage_car=str(Data.save.vehicle)
 var canvas=CanvasLayer.new();canvas.layer=-10;add_child(canvas)
 sky=Landscape.Backdrop.new();sky.game=self;canvas.add_child(sky)
 camera=Camera2D.new();camera.zoom=Vector2(40,40);camera.position=Vector2(6,-2);add_child(camera)
 var layer=CanvasLayer.new();layer.layer=10;add_child(layer)
 ui=Control.new();ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);layer.add_child(ui)
 hud=Control.new();hud.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);layer.add_child(hud)
 toast=Label.new();toast.add_theme_font_override("font",main_font);toast.add_theme_font_size_override("font_size",20);toast.add_theme_color_override("font_color",PAPER);toast.mouse_filter=Control.MOUSE_FILTER_IGNORE;layer.add_child(toast)
 audio=Synth.new();audio.game=self;add_child(audio)
 get_viewport().size_changed.connect(_resize)
 _hub()
 if Data.migrated: message("Прогресс 0.33 импортирован. Старая поездка сохранена в архиве.",8.)
func _resize():
 if mode=="hub":_hub()
 elif mode=="drive":_build_hud()
func _notification(what):
 if what in [NOTIFICATION_APPLICATION_PAUSED,NOTIFICATION_APPLICATION_FOCUS_OUT]:
  if audio!=null:audio.stream_paused=true
  if mode=="drive":checkpoint();pause_game()
 elif what==NOTIFICATION_APPLICATION_FOCUS_IN:
  if audio!=null:audio.stream_paused=false
 elif what==NOTIFICATION_WM_GO_BACK_REQUEST:
  if mode=="drive":pause_game()
  elif mode=="pause":resume_game()
  elif mode=="hub":_settings()
func _style(color: Color, border:=false) -> StyleBoxFlat:
 var s=StyleBoxFlat.new();s.bg_color=color;s.set_corner_radius_all(8)
 s.content_margin_left=14;s.content_margin_right=14;s.content_margin_top=9;s.content_margin_bottom=9
 if border:s.set_border_width_all(1);s.border_color=Color("55717c")
 return s
func _label(text: String,size:=22,color:=PAPER,font=null) -> Label:
 var l=Label.new();l.text=text;l.add_theme_font_override("font",main_font if font==null else font);l.add_theme_font_size_override("font_size",size);l.add_theme_color_override("font_color",color);l.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;l.mouse_filter=Control.MOUSE_FILTER_IGNORE
 return l
func _button(text: String,callback: Callable,primary:=false) -> Button:
 var b=Button.new();b.text=text;b.custom_minimum_size=Vector2(0,64);b.add_theme_font_override("font",main_font);b.add_theme_font_size_override("font_size",19)
 b.add_theme_color_override("font_color",INK if primary else PAPER);b.add_theme_color_override("font_hover_color",INK if primary else PAPER)
 b.add_theme_stylebox_override("normal",_style(GOLD if primary else Color("263f4d"),not primary));b.add_theme_stylebox_override("hover",_style(Color("fac58b") if primary else Color("375562")));b.add_theme_stylebox_override("pressed",_style(Color("b6c8bc")))
 b.pressed.connect(callback);return b
func _safe() -> Rect2:
 var size=get_viewport_rect().size
 var margin=Vector2(24,16)
 if OS.get_name()=="Android":
  var physical=DisplayServer.get_display_safe_area()
  var screen=DisplayServer.window_get_size()
  if screen.x>0 and screen.y>0:
   margin.x=maxf(24.,float(physical.position.x)*size.x/screen.x+8.)
 return Rect2(margin,Vector2(size.x-margin.x*2.,size.y-margin.y*2.))
func _column(parent: Node) -> VBoxContainer:
 var c=VBoxContainer.new();c.add_theme_constant_override("separation",12);parent.add_child(c);return c
func _scroll(parent: Node,horizontal:=false) -> ScrollContainer:
 var s=ScrollContainer.new();s.size_flags_vertical=Control.SIZE_EXPAND_FILL;s.size_flags_horizontal=Control.SIZE_EXPAND_FILL
 s.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_AUTO if horizontal else ScrollContainer.SCROLL_MODE_DISABLED
 s.vertical_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED if horizontal else ScrollContainer.SCROLL_MODE_AUTO
 parent.add_child(s);return s
func _clear_ui():
 for child in ui.get_children():child.queue_free()
 for child in hud.get_children():child.queue_free()
 hud.visible=false
func _hub():
 mode="hub";get_tree().paused=true;
 if DisplayServer.get_name()!="headless":Engine.max_fps=30
 gas_level=0.;brake_pressed=false;touch_gas=-1;touch_brake=-1
 if world!=null:world.visible=false
 if rig!=null:
  rig.visible=false
  for box in rig.cargo:box.visible=false
 if tow!=null:tow.visible=false
 _clear_ui();ui.visible=true
 var safe=_safe()
 var background=Panel.new();background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);background.add_theme_stylebox_override("panel",_style(Color(.055,.10,.14,.97)));ui.add_child(background)
 var root=VBoxContainer.new();root.position=safe.position;root.size=safe.size;root.add_theme_constant_override("separation",14);ui.add_child(root)
 var header=HBoxContainer.new();header.add_theme_constant_override("separation",12);root.add_child(header)
 var title=_label("DUSTRIVO",38,GOLD,display_font);title.size_flags_horizontal=Control.SIZE_EXPAND_FILL;header.add_child(title)
 for name in ["Рейсы","Гараж","Карьера"]:
  var b=_button(name,func():tab=name;_hub(),tab==name);b.custom_minimum_size.x=130;header.add_child(b)
 header.add_child(_button(str(int(Data.save.wallet))+"  ●",func():_settings()))
 header.add_child(_button("☰",func():_settings()))
 var body=HBoxContainer.new();body.size_flags_vertical=Control.SIZE_EXPAND_FILL;body.add_theme_constant_override("separation",24);root.add_child(body)
 if tab=="Рейсы":_contracts(body)
 elif tab=="Гараж":_garage(body)
 else:_career(body)
 var footer=HBoxContainer.new();root.add_child(footer)
 var status=_label("0.34 / GODOT    •    "+("КАРЬЕРА" if Data.profile=="career" else "СВОБОДНАЯ ЕЗДА")+"    •    72 ДОРОГИ / 16 МАШИН",15,MUTED)
 status.size_flags_horizontal=Control.SIZE_EXPAND_FILL;footer.add_child(status)
 if Data.save.has("legacyCheckpoint34"):footer.add_child(_button("Архив поездки 0.33",func():_legacy_notice()))
func _contracts(parent: Node):
 var left=_column(parent);left.custom_minimum_size.x=300;left.size_flags_horizontal=Control.SIZE_EXPAND_FILL;left.size_flags_stretch_ratio=.74
 var filter=OptionButton.new();filter.custom_minimum_size.y=64;filter.add_theme_font_override("font",main_font);filter.add_theme_font_size_override("font_size",18);filter.add_item("Все регионы",-1)
 for i in range(Data.catalog.regions.size()):filter.add_item(Data.catalog.regions[i],i)
 filter.select(route_filter+1);filter.item_selected.connect(func(index):route_filter=index-1;_hub());left.add_child(filter)
 var list_scroll=_scroll(left);var list=_column(list_scroll);list.size_flags_horizontal=Control.SIZE_EXPAND_FILL
 list.add_child(_button("ГРЕБЕНЬ  /  риск и очки",func():ridge_mode=true;_hub(),ridge_mode))
 for raw in Data.catalog.sequence:
  var id=int(raw);var r=Data.roads[id]
  if route_filter>=0 and int(r.region)!=route_filter:continue
  var unlocked=Data.unlocked(id)
  var prefix="✓  " if int(Data.save.stats[id].get("wins",0))>0 else "%02d  "%(id+1)
  var b=_button(prefix+r.name+("  · закрыто" if not unlocked else ""),func():selected=id;Data.save.selected=id;ridge_mode=false;Data.persist();_hub(),not ridge_mode and selected==id)
  b.alignment=HORIZONTAL_ALIGNMENT_LEFT;b.custom_minimum_size.y=68;b.add_theme_stylebox_override("normal",_style(Color("314b54") if not ridge_mode and selected==id else Color(0,0,0,0)));b.add_theme_font_size_override("font_size",17);list.add_child(b)
 var right=_column(parent);right.size_flags_horizontal=Control.SIZE_EXPAND_FILL;right.size_flags_stretch_ratio=1.6
 var sc=_scroll(right);var details=_column(sc);details.size_flags_horizontal=Control.SIZE_EXPAND_FILL
 var r=Data.catalog.ridge if ridge_mode else Data.roads[selected]
 sky.region=int(r.region);sky.night=int(r.region)==2 or str(r.get("weather",""))=="night"
 details.add_child(_label("ИСПЫТАНИЕ" if ridge_mode else str(Data.catalog.regions[int(r.region)]).to_upper(),17,GOLD))
 details.add_child(_label("ГРЕБЕНЬ" if ridge_mode else str(r.name).to_upper(),44,PAPER,display_font))
 details.add_child(_label("Три привала. Забери очки или вези груз до следующего. Авария обнуляет попытку." if ridge_mode else str(r.story.get("cargo","Доставка"))+"\n"+str(r.story.get("radio","Береги груз и остановись на базе.")),20))
 var preview=RoadPreview.new();preview.road=r;preview.custom_minimum_size.y=112;details.add_child(preview)
 if ridge_mode:
  var choice=HBoxContainer.new();details.add_child(choice)
  for count in [1,3]:choice.add_child(_button(str(count)+" ЯЩИК"+(" ✓" if ridge_load==count else ""),func():ridge_load=count;_hub()))
  var current_record=Data.save.ridgeRecords34.get(str(ridge_load),{})
  var archive_record=Data.save.get("ridgeRecords25",{}).get(str(ridge_load),{})
  details.add_child(_label("Рекорд Godot · "+str(int(current_record.get("score",0)))+" очков",20,GOLD))
  if not archive_record.is_empty():details.add_child(_label("Архив 0.33 · "+str(int(archive_record.get("score",0)))+" очков — другая физика",16,MUTED))
  details.add_child(_label("Штатный ROVER · без улучшений и оснастки. Новые рекорды Godot хранятся отдельно.",17,MUTED))
 else:
  var tasks=[]
  for stop in r.get("drops",r.get("stops",[])):tasks.append(str(stop.get("name","Остановка")))
  for service in r.get("services",[]):
   if service.get("required",false):tasks.append(str(service.name))
  details.add_child(_label(" → ".join(tasks)+(" → база" if not tasks.is_empty() else "Финиш: остановись в зоне приёмки и держи тормоз"),18,GOLD))
  var picked=Data.pick(r)
  details.add_child(_label((Data.vehicle(picked).name+" · "+{"standard":"Универсал","trail":"Тяга","economy":"Эконом"}.get(Data.save.setups[picked],"Универсал")) if picked!="" else "Нужна подходящая машина в гараже",22))
  var record=Data.save.stats[selected].get("native34",{})
  if record.has("time"):details.add_child(_label("Рекорд Godot · "+str(snappedf(float(record.time),.1))+" с · "+str(int(record.get("stars",0)))+" / 3",18,GOLD))
  var old=Data.save.stats[selected].get("pace30",{})
  if old.has("time"):details.add_child(_label("Архив 0.33 · "+str(snappedf(float(old.time),.1))+" с — другая физика",16,MUTED))
  if selected==0:details.add_child(_label("Мастерской нужен генератор ≥60%. Улучшения для первого рейса не нужны.",18,MUTED))
  if selected==1:
   var terms=HBoxContainer.new();details.add_child(terms)
   terms.add_child(_button("Обычный"+(" ✓" if not urgent else ""),func():urgent=false;_hub()))
   terms.add_child(_button("Срочный · 1:50 / +180"+(" ✓" if urgent else ""),func():urgent=true;_hub()))
 var pending=Data.save.ridgeNative34 if ridge_mode else Data.save.nativeRun34
 var same=pending is Dictionary and not pending.is_empty() and int(pending.get("id",-99))==(-1 if ridge_mode else selected)
 var actions=HBoxContainer.new();actions.add_theme_constant_override("separation",12);right.add_child(actions)
 if not ridge_mode:actions.add_child(_button("ГАРАЖ",func():tab="Гараж";_hub()))
 var start=_button("ПРОДОЛЖИТЬ →" if same else "В РЕЙС →",func():_launch_request(),true);start.size_flags_horizontal=Control.SIZE_EXPAND_FILL
 start.disabled=not ridge_mode and not Data.unlocked(selected);actions.add_child(start)
 if not ridge_mode and not Data.unlocked(selected):right.add_child(_label("Заверши предыдущий заказ. Свободная езда открывает все дороги отдельно от карьеры.",16,MUTED))
func _garage(parent: Node):
 var left=_column(parent);left.size_flags_horizontal=Control.SIZE_EXPAND_FILL;left.size_flags_stretch_ratio=1.05
 var m=Data.vehicle(garage_car)
 left.add_child(_label(m.name,52,GOLD,display_font));left.add_child(_label(m.tag,20))
 var preview=VehiclePreview.new();preview.spec=m;preview.kit=Data.config(garage_car);preview.paint_color=Data.paint(garage_car);preview.custom_minimum_size.y=160;left.add_child(preview)
 left.add_child(_label(str(m.get("description",m.tag))+"\nМасса: "+str(int(m.mass))+" кг · "+str(m.get("axles",[0,1]).size())+" оси",18,MUTED))
 var shelf=_scroll(left,true);shelf.custom_minimum_size.y=100;shelf.size_flags_vertical=0
 var cars=HBoxContainer.new();cars.add_theme_constant_override("separation",8);shelf.add_child(cars)
 for v in Data.vehicles:
  var owned=Data.save.owned.has(v.id)
  var b=_button(v.name+"\n"+("в гараже" if owned else str(int(v.price))+" ●"),func():garage_car=v.id;_hub(),garage_car==v.id);b.custom_minimum_size=Vector2(132,78);cars.add_child(b)
 var choose=_button("ВЫБРАТЬ" if Data.save.owned.has(m.id) else "КУПИТЬ · "+str(int(m.price))+" ●",func():
  if not Data.save.owned.has(garage_car):_dialog("Купить "+m.name+"?",str(int(m.price))+" игровых монет. Улучшения у каждой машины свои.",[{"text":"Купить","call":func():Data.buy_car(garage_car);_hub()},{"text":"Назад","call":func():_hub()}])
  else:Data.buy_car(garage_car);_hub(),true)
 choose.disabled=not Data.save.owned.has(m.id) and Data.save.wallet<int(m.price);left.add_child(choose)
 var right=_column(parent);right.size_flags_horizontal=Control.SIZE_EXPAND_FILL;right.size_flags_stretch_ratio=1.3
 var tabs=HBoxContainer.new();right.add_child(tabs)
 for name in ["Улучшения","Оснастка","Стиль"]:tabs.add_child(_button(name,func():garage_tab=name;_hub(),garage_tab==name))
 var scroll=_scroll(right);var list=_column(scroll);list.size_flags_horizontal=Control.SIZE_EXPAND_FILL
 if not Data.save.owned.has(m.id):list.add_child(_label("Сначала купи машину. Оснастка и улучшения оплачиваются отдельно.",19,MUTED));return
 list.add_child(_label("Изменения — для следующего выезда. Сохранённый рейс остаётся на прежней оснастке.",17,MUTED))
 if garage_tab=="Улучшения":
  var lev=Data.levels(m.id)
  for i in range(3):
   var cost=90+int(lev[i])*100
   list.add_child(_label(["Мотор · тяга","Подвеска · гашение ударов","Шины · сцепление"][i]+"  "+str(int(lev[i]))+" / 5",22))
   var b=_button("Улучшить · "+str(cost)+" ●",func():
    if Data.save.wallet>=cost and lev[i]<5:Data.save.wallet-=cost;lev[i]+=1;Data.persist();_hub())
   b.disabled=lev[i]>=5 or Data.save.wallet<cost;list.add_child(b)
  list.add_child(_label("Режим езды · бесплатно",21,GOLD))
  for id in ["standard","trail","economy"]:
   list.add_child(_button({"standard":"Универсал","trail":"Тяга · цепче, медленнее","economy":"Эконом · расход −18%"}[id]+(" ✓" if Data.save.setups[m.id]==id else ""),func():Data.save.setups[m.id]=id;Data.persist();_hub()))
 elif garage_tab=="Оснастка":
  for slot in Data.PARTS:
   list.add_child(_label({"tires":"Шины","suspension":"Подвеска","utility":"Оборудование"}[slot],24,GOLD))
   for part in Data.PARTS[slot]:
    var installed=Data.save.builds31[m.id][slot]==part.id
    var has=Data.save.kitOwned31[m.id][slot].has(part.id)
    var b=_button(part.name+(" · установлено" if installed else " · бесплатно" if has else " · "+str(part.price)+" ●"),func():Data.install(slot,part.id);_hub(),installed)
    b.disabled=installed or (not has and Data.save.wallet<int(part.price));list.add_child(b);list.add_child(_label(part.text,16,MUTED))
 else:
  list.add_child(_label("Окраска · бесплатно",24,GOLD))
  var grid=GridContainer.new();grid.columns=4;grid.add_theme_constant_override("h_separation",8);grid.add_theme_constant_override("v_separation",8);list.add_child(grid)
  for color in Data.PAINTS:
   var b=_button("●",func():Data.save.paints[m.id]=color;Data.persist();_hub());b.custom_minimum_size.x=80;b.add_theme_color_override("font_color",Color(color));b.add_theme_font_size_override("font_size",32);grid.add_child(b)
  for slot in ["livery","rims"]:
   list.add_child(_label("Ливрея" if slot=="livery" else "Диски",24,GOLD))
   for item in (["none","stripe","expedition","number"] if slot=="livery" else ["steel","black","ivory"]):
    var names={"none":"Без рисунка","stripe":"Полоса","expedition":"Экспедиция","number":"Номер 17","steel":"Сталь","black":"Чёрные","ivory":"Светлые"}
    list.add_child(_button(names[item],func():Data.save.builds31[m.id][slot]=item;Data.persist();_hub(),Data.save.builds31[m.id].get(slot)==item))
func _career(parent: Node):
 var scroll=_scroll(parent);var list=_column(scroll);list.size_flags_horizontal=Control.SIZE_EXPAND_FILL
 list.add_child(_label("ВОЗВРАЩАЕМ ЖИЗНЬ",42,PAPER,display_font))
 var wins=0;var stars=0
 for s in Data.save.stats:
  wins+=1 if int(s.get("wins",0))>0 else 0;stars+=int(s.get("stars",0))
 list.add_child(_label(str(wins)+" / 72 дороги · "+str(stars)+" / 216 звёзд · "+str(int(Data.save.deliveries))+" доставок",22,GOLD))
 for c in CHAPTERS:
  var done=bool(Data.save.get(c.flag,false)) if c.has("flag") else int(Data.save.stats[int(c.id)].get("wins",0))>0
  list.add_child(_button(("✓  " if done else "→  ")+c.title+" · "+Data.roads[int(c.id)].name,func():selected=int(c.id);ridge_mode=false;tab="Рейсы";_hub()))
 list.add_child(_label("Рекорды старой физики сохранены в истории. Заезды Godot имеют отдельные время, призраков и очки «Гребня».",18,MUTED))
func _legacy_notice():
 _dialog("Старая поездка сохранена", "Кошелёк, покупки и карьера импортированы. Состояние решателя Planck не совместимо с новой физикой Godot. Оно оставлено в архиве без изменений. Новый выезд начинается только по твоему нажатию; прогресс за прошлые доставки сохраняется.",[{"text":"Понятно","call":func():_hub()}])
func _settings():
 var entries=[{"text":"Звук: "+("ВКЛ" if Data.save.sound else "ВЫКЛ"),"call":func():Data.save.sound=not Data.save.sound;Data.persist();_settings()}, {"text":"Музыка: "+("ВКЛ" if Data.save.music else "ВЫКЛ"),"call":func():Data.save.music=not Data.save.music;Data.persist();_settings()}, {"text":"Карьера / свободная езда","call":_switch_profile_request}, {"text":"Об игре и конфиденциальность","call":func():_about()}, {"text":"Назад","call":_close_dialog}]
 _dialog("Настройки", "Офлайн · без рекламы и покупок за реальные деньги. Профили хранятся отдельно.",entries)
func _about():
 _dialog("Dustrivo 0.34 / Godot", "Sergey Kempinen\nПоддержка: arturovich2k19@gmail.com\n\nИгра не отправляет данные и не содержит рекламы или аналитики. Прогресс, настройки и записи движения хранятся только на устройстве. Для удаления: Настройки Android → Приложения → Dustrivo → Очистить данные. Это удалит оба профиля. Добровольное письмо в поддержку обрабатывается только для ответа и решения обращения; удаление переписки можно запросить по адресу выше.\n\nGodot — MIT; шрифты Open Sans — Apache 2.0, Oswald — SIL OFL. Полные лицензии включены в ресурсы.",[{"text":"Назад","call":_close_dialog}])
func _dialog(title: String,text: String,actions: Array):
 for child in ui.get_children():
  if child.name=="Modal":child.queue_free()
 var modal=PanelContainer.new();modal.name="Modal";modal.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);modal.add_theme_stylebox_override("panel",_style(Color(.04,.08,.12,.96)));ui.add_child(modal);ui.visible=true
 var margin=MarginContainer.new();var safe=_safe();margin.add_theme_constant_override("margin_left",int(safe.position.x+40));margin.add_theme_constant_override("margin_right",int(safe.position.x+40));margin.add_theme_constant_override("margin_top",32);margin.add_theme_constant_override("margin_bottom",24);modal.add_child(margin)
 var column=_column(margin);column.add_child(_label(title.to_upper(),38,GOLD,display_font))
 var scroll=_scroll(column);var text_box=_column(scroll);text_box.size_flags_horizontal=Control.SIZE_EXPAND_FILL;text_box.add_child(_label(text,21))
 var buttons=HBoxContainer.new();buttons.add_theme_constant_override("separation",12);column.add_child(buttons)
 if actions.size()>3:
  var button_scroll=ScrollContainer.new();button_scroll.custom_minimum_size.y=90;column.remove_child(buttons);buttons.queue_free();column.add_child(button_scroll);scroll.size_flags_vertical=0;button_scroll.size_flags_vertical=Control.SIZE_EXPAND_FILL;button_scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED;button_scroll.vertical_scroll_mode=ScrollContainer.SCROLL_MODE_AUTO;buttons=VBoxContainer.new();buttons.size_flags_horizontal=Control.SIZE_EXPAND_FILL;buttons.add_theme_constant_override("separation",10);button_scroll.add_child(buttons)
 for i in range(actions.size()):
  var entry=actions[i];var b=_button(entry.text,entry.call,i==0);b.size_flags_horizontal=Control.SIZE_EXPAND_FILL;buttons.add_child(b)
func _launch_request():
 var pending=Data.save.ridgeNative34 if ridge_mode else Data.save.nativeRun34
 var id=-1 if ridge_mode else selected
 if pending is Dictionary and not pending.is_empty():
  if int(pending.get("id",-99))==id:begin_run(pending);return
  _dialog("Сменить заказ?","Сохранён другой незавершённый рейс. Начать выбранный заново?",[{"text":"Начать новый","call":_replace_run},{"text":"Оставить прежний","call":func():_hub()}]);return
 begin_run()
func _destroy_run():
 if rig!=null:
  for box in rig.cargo:box.queue_free()
  for spring in rig.springs:spring.queue_free()
  rig.queue_free();rig=null
 if tow!=null:tow.queue_free();tow=null
 if tow_joint!=null:tow_joint.queue_free();tow_joint=null
 if ghost_rig!=null:ghost_rig.queue_free();ghost_rig=null
 if world!=null:world.queue_free();world=null
 bridge_bodies=[];barrier_bodies=[];dynamic_planks=[]
func begin_run(saved: Dictionary={}):
 get_tree().paused=false
 if DisplayServer.get_name()!="headless":Engine.max_fps=60
 _destroy_run();_clear_ui();ui.visible=false;hud.visible=true
 ridge_mode=int(saved.get("id",-1 if ridge_mode else selected))==-1
 selected=int(saved.get("id",selected)) if not ridge_mode else selected
 ridge_load=int(saved.get("load",ridge_load));branch=str(saved.get("branch","pending"))
 urgent=bool(saved.get("urgent",urgent and selected==1)) and not ridge_mode
 route=(Data.catalog.ridge if ridge_mode else Data.catalog.branches.get(branch,Data.catalog.branches.detour) if selected==0 else Data.roads[selected]).duplicate(true)
 if not ridge_mode and selected==0 and Data.save.workshopPowered:route.services=[{"x":float(route.length)+2.,"name":"Мастерская · есть ток","required":false}]
 if not ridge_mode and selected==3 and not Data.save.workshopPowered:route.services=[]
 var car_id=str(saved.get("car","rover" if ridge_mode else Data.pick(route)))
 if car_id=="":tab="Гараж";garage_car=str(route.get("requires","rover"));_hub();message("Выбери и купи подходящую машину");return
 var levels=saved.get("levels",[0,0,0] if ridge_mode else Data.levels(car_id))
 var kit=saved.get("kit",Data.config(car_id,ridge_mode))
 var setup=str(saved.get("setup","standard" if ridge_mode else Data.save.setups[car_id]))
 var color=Color(str(saved.get("paint",Data.vehicle(car_id).color if ridge_mode else Data.paint(car_id).to_html())))
 last_outcome={}
 run_id=str(saved.get("run_id",str(Time.get_unix_time_from_system())+"-"+str(randi())))
 run_time=float(saved.get("time",0));coins=int(saved.get("coins",0));penalty=int(saved.get("penalty",0));recoveries=int(saved.get("recoveries",0));camp=int(saved.get("camp",0));delivered_litres=float(saved.get("delivered_litres",0));landing_points=int(saved.get("landing_points",0));last_award=float(saved.get("last_award",-100));next_autosave=run_time+5.;next_trace=run_time;next_safe=20.;winch_left=float(saved.get("winch_left",0));winch_anchor=Vector2(saved.get("winch_anchor",[0,0])[0],saved.get("winch_anchor",[0,0])[1]);hold=0.;flip_time=0.;drowning=0.;air_time=float(saved.get("air_time",0));last_air=bool(saved.get("last_air",false))
 trace=saved.get("trace",[]).duplicate(true)
 stop_states=saved.get("stops",_states(route.get("drops",route.get("stops",[]))))
 service_states=saved.get("services",_states(route.get("services",[])))
 gate_states=saved.get("gates",_states(route.get("gates",[])))
 check_states=saved.get("checks",_states(route.get("checkpoints",[])))
 sector_states=saved.get("sectors",_states(route.get("sectors",[])))
 winch_charges=int(saved.get("winch_charges",2 if ridge_mode else 3 if Data.save.villageRescue or kit.get("utility")=="service" else 2))
 world=Node2D.new();world.name="RouteWorld";world.process_mode=Node.PROCESS_MODE_PAUSABLE;add_child(world)
 _build_road()
 rig=Rig.new();rig.name="Truck";rig.process_mode=Node.PROCESS_MODE_PAUSABLE;add_child(rig);var definition=Data.vehicle(car_id)
 if ridge_mode:definition.mass=714.;definition.torque=36.;definition.speed=19.5;definition.gripFactor=1.15
 rig.configure(self,definition,kit,levels,color,setup)
 rig.position=Vector2(6,Data.height_at(route,6)-(.67+rig.radius+.04))
 rig.load_cargo(route,ridge_load if ridge_mode else 0)
 rig.fuel=float(route.get("fuelStart",100));rig.health=float(route.get("conditionStart",100));rig.heat=float(route.get("heatStart",35))
 items=saved.get("items",[])
 if items.is_empty():
  if not ridge_mode:
   for x in range(22,int(float(route.length))-8,12):items.append({"x":float(x),"type":"coin","amount":1,"got":false})
   for point in route.get("fuel_plan",[]):items.append({"x":float(point.x),"type":"fuel","amount":float(point.get("amount",12)),"got":false})
 if saved.has("rig"):rig.restore(saved.rig)
 for i in range(mini(dynamic_planks.size(),saved.get("planks",[]).size())):
  var plank=dynamic_planks[i];var state=saved.planks[i];plank.position=Vector2(state.p[0],state.p[1]);plank.rotation=float(state.a);plank.linear_velocity=Vector2(state.v[0],state.v[1]);plank.angular_velocity=float(state.w)
 if not ridge_mode and selected==4:
  tow=Rig.new();tow.name="TowVan";tow.process_mode=Node.PROCESS_MODE_PAUSABLE;add_child(tow);tow.configure(self,Data.vehicle("rivet"),Data.config("rivet",true),[0,0,0],Color("7a9495"),"standard");tow.mass=610.;tow.position=Vector2(-2,Data.height_at(route,-2)-(.67+tow.radius+.04));tow.health=68.;tow.passive=true;tow.braking=true;tow.create_wheels()
  if saved.has("tow"):tow.restore(saved.tow)
  if saved.get("attached",false):_attach_tow()
 camera.position=rig.position+Vector2(3,-1.5);camera.zoom=Vector2(40,40)
 sky.region=int(route.region);sky.night=int(route.region)==2 or str(route.get("weather",""))=="night"
 mode="drive";gas_level=0.;brake_pressed=false;touch_gas=-1;touch_brake=-1;parking_hold=false;map_open=false;ghost_data={}
 _load_ghost();_build_hud()
 if not Data.save.tutorialDone and not ridge_mode:message("Газ — плавно. Тормози ДО спуска. Держи тормоз после остановки для заднего хода.",8.)
 if not saved.is_empty():
  if saved.get("phase","")=="camp":_camp_offer()
  elif saved.get("phase","")=="fork":_fork()
  else:pause_game()
 else:checkpoint()
func _states(source: Array) -> Array:
 var result=[]
 for entry in source:var s=entry.duplicate(true);s.done=false;s.elapsed=0.;result.append(s)
 return result
func _build_road():
 land=Landscape.new();world.add_child(land);land.build(self,route)
 if route.get("bridge") is Dictionary:_suspension_bridge(route.bridge)
 for g in gate_states:
  if not g.done:barrier_bodies.append(_barrier(float(g.x)+4.))
 var lift=route.get("liftBridge")
 if lift is Dictionary:
  var lifted=gate_states.any(func(g):return g.get("lift",false))
  if not lifted:
   var g=lift.duplicate(true);g.x=float(lift.get("control",lift.from))-1.;g.done=false;g.elapsed=0.;g.lift=true;gate_states.append(g)
   barrier_bodies.append(_barrier(float(g.x)+4.))
  var body=StaticBody2D.new();body.collision_layer=1;body.position=Vector2(float(lift.from),-float(lift.get("y",0)));body.set_meta("lift",true)
  var shape=CollisionShape2D.new();var box=RectangleShape2D.new();box.size=Vector2(float(lift.to)-float(lift.from),.18);shape.shape=box;shape.position.x=box.size.x*.5;body.add_child(shape);world.add_child(body);bridge_bodies.append(body)
func _barrier(x: float) -> StaticBody2D:
 var b=StaticBody2D.new();b.collision_layer=1;b.position=Vector2(x,Data.height_at(route,x)-.9)
 var c=CollisionShape2D.new();var shape=RectangleShape2D.new();shape.size=Vector2(.10,1.8);c.shape=shape;b.add_child(c);world.add_child(b);return b
func _suspension_bridge(b: Dictionary):
 var count=12;var span=(float(b.to)-float(b.from))/count;var previous:PhysicsBody2D=null
 for i in range(count):
  var plank=RigidBody2D.new();plank.mass=75.;plank.position=Vector2(float(b.from)+span*(i+.5),-float(b.y));plank.collision_layer=1;plank.collision_mask=2|4;plank.linear_damp=1.5;plank.angular_damp=2.;plank.freeze=i==0 or i==count-1
  var shape=CollisionShape2D.new();var box=RectangleShape2D.new();box.size=Vector2(span+.03,.17);shape.shape=box;plank.add_child(shape);world.add_child(plank);dynamic_planks.append(plank)
  if previous!=null:
   var joint=PinJoint2D.new();world.add_child(joint);joint.position=Vector2(float(b.from)+span*i,-float(b.y));joint.node_a=joint.get_path_to(previous);joint.node_b=joint.get_path_to(plank);joint.bias=.7
  previous=plank
func _build_hud():
 for child in hud.get_children():child.queue_free()
 hud.visible=true;hud.mouse_filter=Control.MOUSE_FILTER_IGNORE
 var safe=_safe();var size=get_viewport_rect().size
 var pause=_button("Ⅱ",func():pause_game());pause.position=safe.position;pause.size=Vector2(68,68);hud.add_child(pause)
 hud_speed=_label("0",38,PAPER,display_font);hud_speed.position=safe.position+Vector2(88,0);hud_speed.size=Vector2(235,60);hud.add_child(hud_speed)
 hud_vitals=_label("",17,PAPER);hud_vitals.position=Vector2(safe.position.x+88,safe.position.y+51);hud_vitals.size=Vector2(safe.size.x-180,32);hud.add_child(hud_vitals)
 var map_button=_button("ПУТЬ",func():map_open=not map_open;hud_map.visible=map_open);map_button.position=Vector2(size.x-safe.position.x-105,safe.position.y);map_button.size=Vector2(105,64);hud.add_child(map_button)
 hud_objective=_label("",19,PAPER);hud_objective.horizontal_alignment=HORIZONTAL_ALIGNMENT_RIGHT;hud_objective.position=Vector2(size.x-safe.position.x-465,safe.position.y+5);hud_objective.size=Vector2(340,55);hud.add_child(hud_objective)
 hud_map=RoadPreview.new();hud_map.road=route;hud_map.position=Vector2(size.x-safe.position.x-390,safe.position.y+81);hud_map.size=Vector2(390,64);hud_map.visible=map_open;hud_map.mouse_filter=Control.MOUSE_FILTER_IGNORE;hud.add_child(hud_map)
 var pedal_y=size.y-safe.position.y-112
 brake_rect=Rect2(Vector2(safe.position.x,pedal_y),Vector2(228,108));gas_rect=Rect2(Vector2(size.x-safe.position.x-228,pedal_y),Vector2(228,108))
 for entry in [{"rect":brake_rect,"text":"ТОРМОЗ\nдержать → назад"},{"rect":gas_rect,"text":"ГАЗ\nплавный нажим"}]:
  var panel=Panel.new();panel.position=entry.rect.position;panel.size=entry.rect.size;panel.mouse_filter=Control.MOUSE_FILTER_IGNORE;panel.add_theme_stylebox_override("panel",_style(Color(.10,.18,.23,.83),true));hud.add_child(panel)
  var text=_label(entry.text,23,PAPER,display_font);text.position=Vector2(20,15);text.size=entry.rect.size-Vector2(40,20);panel.add_child(text)
 gear_button=_button("4L" if rig.low else "4H",func():
  if rig.grounded>0 and absf(rig.linear_velocity.x)<3.5:rig.low=not rig.low;gear_button.text="4L" if rig.low else "4H"
  else:message("Переключай на земле, на малой скорости"))
 gear_button.position=Vector2(size.x*.5-160,pedal_y+20);gear_button.size=Vector2(110,78);hud.add_child(gear_button)
 winch_button=_button("СЦЕПКА" if tow!=null else "ЛЕБЁДКА · "+str(winch_charges),func():_winch_action());winch_button.position=Vector2(size.x*.5-30,pedal_y+20);winch_button.size=Vector2(210,78);hud.add_child(winch_button)
 _update_hud()
func _input(event):
 if event is InputEventKey and event.pressed and event.keycode==KEY_ESCAPE:
  if mode=="drive":pause_game()
  elif mode=="pause":resume_game()
 if mode!="drive":return
 if event is InputEventScreenTouch:
  if event.pressed:
   if gas_rect.has_point(event.position):touch_gas=event.index;gas_level=clampf(1.-(event.position.y-gas_rect.position.y)/gas_rect.size.y,.15,1.)
   if brake_rect.has_point(event.position):touch_brake=event.index;brake_pressed=true
  else:
   if touch_gas==event.index:touch_gas=-1;gas_level=0.
   if touch_brake==event.index:touch_brake=-1;brake_pressed=false
 elif event is InputEventScreenDrag and event.index==touch_brake:
  brake_pressed=brake_rect.grow(35).has_point(event.position)
 elif event is InputEventScreenDrag and event.index==touch_gas:
  gas_level=clampf(1.-(event.position.y-gas_rect.position.y)/gas_rect.size.y,.12,1.) if gas_rect.grow(35).has_point(event.position) else 0.
 elif event is InputEventMouseButton and event.device!=InputEvent.DEVICE_ID_EMULATION and event.button_index==MOUSE_BUTTON_LEFT:
  if not event.pressed:gas_level=0.;brake_pressed=false
  elif gas_rect.has_point(event.position):gas_level=.70
  elif brake_rect.has_point(event.position):brake_pressed=true
 if event is InputEventKey and event.pressed and event.keycode==KEY_Q and rig.grounded and absf(rig.linear_velocity.x)<3.5:rig.low=not rig.low;gear_button.text="4L" if rig.low else "4H"
 if event is InputEventKey and event.pressed and event.keycode==KEY_E:_winch_action()
func _process(delta):
 if toast!=null:
  toast.visible=Time.get_ticks_msec()/1000.<toast_until
  toast.position=Vector2(30,get_viewport_rect().size.y-180);toast.size=Vector2(get_viewport_rect().size.x-60,45);toast.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER
 if mode!="drive" or rig==null:return
 var p=rig.position;var speed=rig.linear_velocity.x
 var look=clampf(speed*.35,-2.,4.5)
 var target=p+Vector2(look,-1.5)
 camera.position=camera.position.lerp(target,1.-exp(-delta*5.))
 var zoom=clampf(get_viewport_rect().size.y/14.,33.,54.)
 camera.zoom=camera.zoom.lerp(Vector2(zoom,zoom),1.-exp(-delta*2.))
 hud_timer+=delta
 if hud_timer>.10:hud_timer=0.;_update_hud()
 if ghost_rig!=null:_update_ghost()
 queue_redraw()
func _physics_process(delta):
 if mode!="drive" or rig==null:return
 run_time+=delta
 for item in items:
  if not item.got and absf(rig.position.x-float(item.x))<1.0 and absf(rig.position.y-(Data.height_at(route,float(item.x))-1.))<2.0:
   item.got=true
   if item.type=="coin":coins+=int(item.amount)
   else:rig.fuel=minf(100.,rig.fuel+float(item.amount));message("Топливо +"+str(int(item.amount))+"%")
 var gas=gas_level
 var brake=brake_pressed
 if Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT):gas=1.
 if Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT) or Input.is_physical_key_pressed(KEY_SPACE):brake=true
 rig.gas=gas;rig.braking=brake
 parking_hold=false
 _tasks(delta,gas,brake)
 for deck in bridge_bodies:
  if deck.get_meta("lift",false):
   for g in gate_states:
    if g.get("lift",false):deck.rotation=0. if g.done else -1.05*(1.-clampf(float(g.elapsed)/4.,0.,1.))
 if mode!="drive":return
 if winch_left>0.:
  winch_left-=delta
  var direction=winch_anchor-rig.position
  rig.apply_central_force(direction.normalized()*rig.mass*20.-rig.linear_velocity*rig.mass*3.)
 if tow_joint!=null and tow!=null:
  var separation=rig.to_global(Vector2(-1.7,0)).distance_to(tow.to_global(Vector2(1.6,0)))
  if separation>6.3:tow_joint.queue_free();tow_joint=null;message("Трос сцепки оборван — вернись и прицепи снова")
 var depth=water_depth(rig.position)
 var intake=1.5 if rig.spec.family=="mule" else 1.1 if rig.spec.family in ["timber","tanker"] else .85
 drowning=drowning+delta if depth>intake else maxf(0.,drowning-delta*2.)
 var angle=wrapf(rig.rotation,-PI,PI)
 flip_time=flip_time+delta if absf(angle)>1.9 and absf(rig.linear_velocity.x)<1.2 else 0.
 if drowning>2.:_finish(false,"Залили мотор — в брод входи тихо");return
 if flip_time>2.:_finish(false,"Машина перевернулась");return
 if rig.health<=0.:_finish(false,"Кузов не выдержал ударов");return
 if rig.fuel<=0.:_finish(false,"Топливо закончилось");return
 if rig.aboard()<=0 and not _all_stops_done() or rig.remaining()==0:_finish(false,"Не осталось груза для доставки");return
 if rig.position.y>40. or rig.position.x<-22.:_finish(false,"Машина ушла с дороги");return
 if route.get("kind")=="timed" and run_time>float(route.get("limit",220)):_finish(false,"Время заказа вышло");return
 _air_awards(delta)
 for sector in sector_states:
  if sector.done:continue
  if not sector.get("entered",false) and rig.position.x>=float(sector.from):
   sector.entered=true;sector.initial_integrity=rig.integrity;sector.initial_health=rig.health;sector.initial_remaining=rig.remaining();sector.initial_fluid=rig.fluid+delivered_litres;sector.initial_straps=rig.snap_count
  if sector.get("entered",false) and rig.position.x>float(sector.to):
   sector.done=true;sector.passed=rig.integrity>=float(sector.initial_integrity)-.2 and rig.health>=float(sector.initial_health)-.2 and rig.remaining()>=int(sector.initial_remaining) and rig.fluid+delivered_litres>=float(sector.initial_fluid)-.5 and rig.snap_count==int(sector.initial_straps)
   if sector.passed:coins+=int(sector.get("reward",35));message("Чистый участок +"+str(int(sector.get("reward",35))))
   else:message("Участок пройден · премия упущена")
 if not ridge_mode and selected==0 and branch=="pending" and rig.position.x>=36.:
  _fork();return
 if ridge_mode and camp<3 and rig.position.x>=float(route.camps[camp].x):_camp();return
 if run_time>=next_autosave:next_autosave=run_time+5.;checkpoint()
 if rig.position.x>next_safe and rig.grounded>0 and absf(angle)<.15 and absf(rig.linear_velocity.y)<.4 and absf(rig.linear_velocity.x)<4. and depth<.05 and rig.health>45.:
  next_safe=rig.position.x+20.
  var safe=_snapshot()
  if ridge_mode:Data.save.rescueRidge34=safe
  else:Data.save.rescueStory34=safe
 if run_time>=next_trace:
  trace.append([snappedf(run_time,.001),rig.position.x,rig.position.y,rig.rotation]);next_trace=run_time+.30
  if trace.size()>1600:trace.pop_front()
func _tasks(delta: float,gas: float,brake: bool):
 var x=rig.position.x
 if brake and gas<.01:
  var nearby=stop_states+gate_states+service_states
  var finish_ready=_all_stops_done() and service_states.all(func(s):return not s.get("required",false) or s.done) and gate_states.all(func(g):return g.done)
  parking_hold=nearby.any(func(s):return not s.done and absf(x-float(s.x))<2.25) or (finish_ready and absf(x-float(route.length)-6.)<2.25)
 var stopped=absf(rig.linear_velocity.x)<.55 and absf(rig.linear_velocity.y)<.7 and rig.grounded>0 and absf(wrapf(rig.rotation,-PI,PI))<.5
 for g in gate_states:
  if g.done:continue
  if absf(x-float(g.x))<3. and brake and gas<.01 and stopped:
   parking_hold=true;g.elapsed+=delta
   if g.elapsed>=(4. if g.get("lift",false) else 1.):
    g.done=true
    for b in barrier_bodies:
     if is_instance_valid(b) and absf(b.position.x-float(g.x)-4.)<.1:b.queue_free()
    message("Проезд открыт");audio.event("stop")
  else:g.elapsed=0.
  break
 for s in stop_states:
  if s.done:continue
  if absf(x-float(s.x))<2.4 and brake and gas<.01 and stopped:
   parking_hold=true;s.elapsed+=delta
   var precise=absf(x-float(s.x))<.65 and absf(rig.linear_velocity.x)<.22
   var duration=float(s.get("duration",2. if rig.cargo_type=="liquid" else 1.3))*(1. if s.get("cargoIndex",-1)==0 and selected==3 else .70 if precise else 1.)
   if float(s.elapsed)>=duration:
    if rig.cargo_type=="liquid":
     var litres=float(s.get("litres",200))
     if rig.fluid<litres+float(route.get("minLitres",0)):_finish(false,"Недостаточно жидкости для приёмки");return
     rig.unload(litres);delivered_litres+=litres
    else:rig.unload()
    s.done=true;coins+=15 if precise else 0;audio.event("stop");message("Принято · "+str(s.get("name","Груз"))+(" · подача +15" if precise else ""))
  else:s.elapsed=0.
  break
 for s in service_states:
  if s.done:continue
  if absf(x-float(s.x))<2.6 and brake and gas<.01 and stopped:
   parking_hold=true;s.elapsed+=delta
   if s.elapsed>=2.2:s.done=true;rig.health=minf(100.,rig.health+35.);rig.leak=false;rig.fuel=minf(100.,rig.fuel+24.);rig.heat=minf(rig.heat,50.);message("Машина обслужена: кузов и топливо");audio.event("stop")
  else:s.elapsed=0.
 for point in check_states:
  if not point.done and absf(x-float(point.x))<2.5 and rig.grounded>0:point.done=true;coins+=20
 var finish=float(route.length)+6.
 if tow!=null:
  if x>finish+20.:_finish(false,"Фургон остался за пределами базы")
  return
 if x>=finish-2.4 and x<=finish+3.5 and brake and gas<.01 and stopped:
  parking_hold=true;hold+=delta
  if hold>1.2:
   if not _all_stops_done():message("Сначала вернись к обязательной остановке");hold=0.;return
   if service_states.any(func(s):return s.get("required",false) and not s.done):message("Не пройдена обязательная мастерская");hold=0.;return
   if gate_states.any(func(g):return not g.done):message("Пропущен пост");hold=0.;return
   if check_states.any(func(p):return not p.done):message("Не все контрольные посты пройдены");hold=0.;return
   if selected==0 and not ridge_mode and rig.integrity<60.:_finish(false,"Генератор повреждён: нужно ≥60%");return
   if selected==3 and not ridge_mode and rig.integrity<70.:_finish(false,"Насос повреждён: нужно ≥70%");return
   if rig.cargo_type=="liquid" and rig.fluid<float(route.get("minLitres",0)):_finish(false,"Мало жидкости на базе");return
   if route.get("kind")=="eco" and rig.fuel<float(route.get("minFuel",8)):_finish(false,"Не осталось требуемого резерва топлива");return
   if route.get("kind")=="careful" and rig.remaining()<rig.cargo.size():_finish(false,"Для этого заказа нужен весь груз");return
   coins+=25;_finish(true,"Доставка принята")
 else:hold=0.
 if x>finish+4. and rig.grounded>0:message("База позади — держи тормоз для заднего хода",1.)
func _all_stops_done() -> bool:
 return stop_states.all(func(s):return s.done)
func water_depth(p: Vector2) -> float:
 for ford in route.get("fords",[]):
  if p.x>=float(ford.from) and p.x<=float(ford.to):return maxf(0.,p.y+1.0+float(ford.level))
 return 0.
func _air_awards(delta: float):
 var air=rig.grounded==0
 if air:air_time+=delta
 elif last_air:
  if air_time>.20 and absf(wrapf(rig.rotation,-PI,PI))<.35 and rig.hit_cooldown<=0. and rig.position.x>last_award+6.:
   var points=mini(4,rig.aboard())*5;landing_points+=points
   if not ridge_mode:coins+=points
   last_award=rig.position.x;message("Мягкая посадка +"+str(points),1.5)
  air_time=0.
 last_air=air
func _winch_action():
 if mode!="drive":return
 if tow!=null:
  if absf(rig.linear_velocity.x)>.8 or absf(tow.linear_velocity.x)>.8:message("Для сцепки останови обе машины");return
  if tow_joint!=null:
   tow_joint.queue_free();tow_joint=null;tow.braking=true
   if absf(tow.position.x-float(route.length))<5. and tow.health>=40. and rig.remaining()>0:_finish(true,"Механик и фургон на базе")
   else:message("Фургон отцеплен")
  elif rig.to_global(Vector2(-1.7,0)).distance_to(tow.to_global(Vector2(1.6,0)))<5.8:_attach_tow();message("Трос закреплён. Тяни плавно")
  else:message("Подай машину ближе к фургону")
  return
 if winch_left>0.:return
 if winch_charges<=0:message("Тросы закончились");return
 if absf(rig.linear_velocity.x)>2.2:message("Для лебёдки сбавь скорость");return
 winch_charges-=1;winch_left=3.0;winch_anchor=Vector2(rig.position.x+5.0,Data.height_at(route,rig.position.x+5.)-3.0);message("Лебёдка натянута")
 winch_button.text="ЛЕБЁДКА · "+str(winch_charges)
func _attach_tow():
 if tow_joint!=null:return
 tow.braking=false
 tow_joint=DampedSpringJoint2D.new();world.add_child(tow_joint);tow_joint.position=rig.to_global(Vector2(-1.7,0));tow_joint.rotation=PI/2.;tow_joint.length=4.4;tow_joint.rest_length=3.9;tow_joint.stiffness=1500.;tow_joint.damping=200.;tow_joint.node_a=tow_joint.get_path_to(rig);tow_joint.node_b=tow_joint.get_path_to(tow)
func _fork():
 _clear_inputs()
 mode="fork";checkpoint();rig.gas=0.;get_tree().paused=true
 _dialog("Мост или объезд?","Мост короче, но настил движется и после него крутой спуск. Объезд длиннее и спокойнее.",[{"text":"Мост · 480 м","call":func():_choose_path("ridge")},{"text":"Объезд · 720 м","call":func():_choose_path("detour")}])
func _choose_path(path: String):
 branch=path;route=Data.catalog.branches[path].duplicate(true)
 for child in world.get_children():
  if child is DustrivoLandscape or child is StaticBody2D or child is PinJoint2D or dynamic_planks.has(child):child.queue_free()
 bridge_bodies=[];barrier_bodies=[];dynamic_planks=[];_build_road()
 _load_ghost()
 _clear_ui();ui.visible=false;mode="drive";get_tree().paused=false;_build_hud();checkpoint()
func _camp():
 camp+=1
 _camp_offer()
func _camp_offer():
 _clear_inputs()
 mode="camp";rig.gas=0.;get_tree().paused=true
 var offer=route.camps[maxi(0,camp-1)];checkpoint()
 var points=int(offer.value)*rig.remaining()+landing_points-recoveries*40
 _dialog("Привал "+str(camp)+" / 3",str(rig.remaining())+" ящиков. Можно забрать "+str(maxi(0,points))+" очков или ехать дальше. Кузов и бак восстановятся, груз — нет.",[{"text":"Ехать дальше","call":func():rig.health=100.;rig.fuel=100.;rig.heat=35.;_clear_ui();ui.visible=false;mode="drive";get_tree().paused=false;_build_hud();checkpoint()},{"text":"Забрать очки","call":func():_finish(true,"Очки с привала сохранены",points)}])
func _snapshot() -> Dictionary:
 var planks=[]
 for b in dynamic_planks:planks.append({"p":[b.position.x,b.position.y],"v":[b.linear_velocity.x,b.linear_velocity.y],"a":b.rotation,"w":b.angular_velocity})
 return {"rules":Data.RULES,"phase":mode,"air_time":air_time,"last_air":last_air,"winch_left":winch_left,"winch_anchor":[winch_anchor.x,winch_anchor.y],"planks":planks,"id":-1 if ridge_mode else selected,"load":ridge_load,"branch":branch,"urgent":urgent,"run_id":run_id,"time":run_time,"coins":coins,"penalty":penalty,"recoveries":recoveries,"camp":camp,"delivered_litres":delivered_litres,"landing_points":landing_points,"last_award":last_award,"winch_charges":winch_charges,"car":rig.spec.id,"levels":rig.levels.duplicate(),"kit":rig.kit.duplicate(true),"paint":rig.paint_color.to_html(),"setup":rig.setup,"rig":rig.snapshot(),"tow":tow.snapshot() if tow!=null else {},"attached":tow_joint!=null,"stops":stop_states.duplicate(true),"gates":gate_states.duplicate(true),"services":service_states.duplicate(true),"checks":check_states.duplicate(true),"sectors":sector_states.duplicate(true),"trace":trace.duplicate(true),"items":items.duplicate(true)}
func checkpoint() -> bool:
 if rig==null or mode not in ["drive","pause","camp","fork"]:return false
 var data=_snapshot()
 if ridge_mode:Data.save.ridgeNative34=data
 else:Data.save.nativeRun34=data
 return Data.persist()
func pause_game():
 if mode!="drive":return
 checkpoint();mode="pause";rig.gas=0.;rig.braking=false;gas_level=0.;brake_pressed=false;touch_gas=-1;touch_brake=-1;get_tree().paused=true;_pause_overlay()
func _pause_overlay():
 _dialog("Рейс сохранён", "Машина и груз ждут. Ничего не движется до продолжения.",[{"text":"Продолжить","call":func():resume_game()},{"text":"В диспетчерскую","call":func():checkpoint();_hub()},{"text":"Настройки","call":func():_settings()}])
func resume_game():
 if DisplayServer.get_name()!="headless":Engine.max_fps=60
 _clear_ui();ui.visible=false;mode="drive";get_tree().paused=false;_build_hud()
func _can_recover() -> bool:
 var s=Data.save.get("rescueRidge34" if ridge_mode else "rescueStory34",{})
 return recoveries<2 and s is Dictionary and s.get("run_id","")==run_id
func _recover():
 var s=Data.save.get("rescueRidge34" if ridge_mode else "rescueStory34",{}).duplicate(true)
 s.recoveries=recoveries+1;s.penalty=penalty+40;s.time=run_time+5.
 begin_run(s);resume_game();message("Эвакуация · −40 · +5 с")
func _finish(won: bool,reason: String,bank:=-1):
 if mode=="result":return
 if not won:last_outcome={"won":false,"reason":reason}
 if not won and _can_recover():
  mode="rescue";rig.gas=0.;get_tree().paused=true
  _dialog(reason,"Вернуться к последнему безопасному месту? Две эвакуации на попытку, −40 монет / очков, +5 секунд.",[{"text":"Эвакуация","call":func():_recover()},{"text":"Завершить","call":func():_settle(false,reason,bank)}]);return
 _settle(won,reason,bank)
func _settle(won: bool,reason: String,bank: int):
 _clear_inputs()
 last_outcome={"won":won,"reason":reason}
 mode="result";rig.gas=0.;get_tree().paused=true
 var paid=Data.save.settledNative34.has(run_id)
 var rating=1
 if rig.remaining()==rig.cargo.size() and rig.integrity>=95.:rating=2
 if rating==2 and sector_states.all(func(s):return s.get("passed",false)) and rig.health>=70. and (not urgent or run_time<=110.) and (route.get("kind")!="timed" or run_time<float(route.get("limit",220))*.85):rating=3
 var award=0
 if ridge_mode:
  award=maxi(0,(bank if bank>=0 else rig.remaining()*750+landing_points-40*recoveries)) if won else 0
  if not paid:
   var record=Data.save.ridgeRecords34.get(str(ridge_load),{"score":0,"runs":0})
   record.score=maxi(int(record.score),award);record.distance=maxf(float(record.get("distance",0)),maxf(0.,rig.position.x-6.)*3.);record.runs=int(record.runs)+1;Data.save.ridgeRecords34[str(ridge_load)]=record;Data.save.ridgeNative34={}
 else:
  var ratio=clampf((rig.fluid+delivered_litres)/maxf(1.,rig.fluid_start),0.,1.) if rig.cargo_type=="liquid" else float(rig.remaining())/maxi(1,rig.cargo.size())
  award=maxi(0,coins+(int(round(float(route.reward)*ratio*(rig.integrity/100. if route.get("kind")=="careful" else 1.))) if won else 0)-penalty)
  if urgent and won:award+=180 if run_time<=110. and rig.remaining()==rig.cargo.size() else -mini(80,maxi(0,award-coins))
  if not paid:
   Data.save.wallet+=award;Data.save.earned+=award;Data.save.best=maxf(float(Data.save.best),maxf(0.,(rig.position.x-6.)*3.));Data.save.nativeRun34={}
   if won:
    Data.save.deliveries+=1;Data.save.tutorialDone=true
    if selected==0:Data.save.workshopPowered=true
    if selected==3:Data.save.villageWater=true
    if selected==4:Data.save.villageRescue=true
    var stat=Data.save.stats[selected];stat.wins=int(stat.get("wins",0))+1;stat.stars=maxi(int(stat.get("stars",0)),rating)
    var native=stat.get("native34",{});native.wins=int(native.get("wins",0))+1;native.stars=maxi(int(native.get("stars",0)),rating)
    if float(native.get("time",100000.))>run_time:
     native.time=run_time;native.ghost={"signature":_signature(),"points":trace.duplicate(true),"duration":run_time}
    stat.native34=native
 if not paid:
  Data.save.settledNative34.append(run_id)
  if Data.save.settledNative34.size()>128:Data.save.settledNative34.pop_front()
  Data.persist()
 audio.event("win" if won else "impact")
 var actions=[{"text":"Ещё заезд","call":func():begin_run()},{"text":"В диспетчерскую","call":func():_hub()}]
 if won and not ridge_mode:
  actions.push_front({"text":"Следующий заказ","call":func():
   var at=Data.catalog.sequence.find(selected);selected=int(Data.catalog.sequence[mini(at+1,Data.catalog.sequence.size()-1)]);Data.save.selected=selected;Data.persist();begin_run()})
 _dialog("ГРУЗ ПРИНЯТ" if won else "ПОПРОБУЕМ СНОВА",reason+"\n\n"+str(award)+(" очков" if ridge_mode else " монет")+"  ·  "+str(int(run_time))+" с"+("  ·  "+"★".repeat(rating) if won else "")+"\nКузов "+str(int(rig.health))+"% · груз "+str(int(rig.integrity))+"%",actions)
func _signature() -> String:
 return JSON.stringify([Data.RULES,-1 if ridge_mode else selected,branch,rig.spec.id,rig.levels,rig.setup,[rig.kit.get("tires"),rig.kit.get("suspension"),rig.kit.get("utility")]])
func _load_ghost():
 if ghost_rig!=null:ghost_rig.queue_free();ghost_rig=null
 if ridge_mode:return
 var stored=Data.save.stats[selected].get("native34",{}).get("ghost",{})
 if stored.get("signature","")!=_signature() or stored.get("points",[]).size()<2:return
 ghost_data=stored
 ghost_rig=Rig.new();add_child(ghost_rig);ghost_rig.ghost=true;ghost_rig.configure(self,rig.spec,rig.kit,rig.levels,Color("9dd7dc"),rig.setup);ghost_rig.freeze=true;ghost_rig.collision_layer=0;ghost_rig.collision_mask=0;ghost_rig.modulate=Color(1,1,1,.28)
func _update_ghost():
 var points=ghost_data.get("points",[])
 ghost_rig.visible=run_time<float(ghost_data.get("duration",0))
 if not ghost_rig.visible:return
 var low=0;var high=points.size()-1
 while low+1<high:
  var mid=(low+high)/2
  if float(points[mid][0])<run_time:low=mid
  else:high=mid
 var a=points[low];var b=points[high];var t=clampf((run_time-float(a[0]))/maxf(.001,float(b[0])-float(a[0])),0.,1.)
 ghost_rig.position=Vector2(lerpf(a[1],b[1],t),lerpf(a[2],b[2],t));ghost_rig.rotation=lerp_angle(a[3],b[3],t);ghost_rig.queue_redraw()
func _next_goal() -> Dictionary:
 var goals=[]
 for s in stop_states:
  if not s.done:goals.append({"x":float(s.x),"text":str(s.get("name","Разгрузка")),"hold":float(s.elapsed)})
 for g in gate_states:
  if not g.done:goals.append({"x":float(g.x),"text":"Запросить проезд тормозом","hold":float(g.elapsed)})
 for s in service_states:
  if not s.done and (s.get("required",false) or rig.health<65. or rig.fuel<25.):goals.append({"x":float(s.x),"text":str(s.get("name","Мастерская")),"hold":float(s.elapsed)})
 goals.sort_custom(func(a,b):return float(a.x)<float(b.x))
 return goals[0] if not goals.is_empty() else {"x":float(route.length)+6.,"text":"Доставка на базу","hold":hold}
func _update_hud():
 if rig==null or hud_speed==null:return
 hud_speed.text=str(int(absf(rig.linear_velocity.x)*10.8))+"  км/ч"
 var cargo=str(int(rig.fluid))+" л" if rig.cargo_type=="liquid" else str(rig.remaining())+" / "+str(rig.cargo.size())
 hud_vitals.text="Бак "+str(int(rig.fuel))+"%  ·  кузов "+str(int(rig.health))+"%  ·  груз "+cargo+"  ·  "+str(int(maxf(0.,rig.position.x-6.)*3.))+" м"
 var goal=_next_goal();var distance=float(goal.x)-rig.position.x
 hud_objective.text=("← НАЗАД · " if distance< -3. else "")+str(goal.text)+"\n"+("Держи тормоз" if absf(distance)<3. else str(int(absf(distance)*3.))+" м")
 if ridge_mode and camp<3:hud_objective.text="Привал "+str(camp+1)+" / 3 · "+str(maxi(0,int((float(route.camps[camp].x)-rig.position.x)*3.)))+" м"
 if route.get("gap") is Dictionary and rig.position.x>float(route.gap.from)-18. and rig.position.x<float(route.gap.to):hud_objective.text="РАЗРЫВ ДОРОГИ · НУЖЕН РАЗГОН\nВ полёте выровняй нос педалями"
 if tow!=null:winch_button.text="ОТЦЕПИТЬ" if tow_joint!=null else "ПРИЦЕПИТЬ"
func impact(_damage: float):
 if mode=="drive":audio.event("impact")
func message(text: String,seconds:=3.0):
 if toast==null:return
 toast.text=text;toast_until=Time.get_ticks_msec()/1000.+seconds
func _draw():
 if mode not in ["drive","pause","camp","fork","result"] or rig==null:return
 for item in items:
  if item.got or absf(float(item.x)-rig.position.x)>28.:continue
  var p=Vector2(float(item.x),Data.height_at(route,float(item.x))-1.)
  if item.type=="coin":draw_circle(p,.12,Color("f0c37c"));draw_arc(p,.16,0,TAU,12,Color("edcea3"),.025)
  else:draw_rect(Rect2(p-Vector2(.15,.2),Vector2(.3,.4)),Color("bc825a"));draw_line(p-Vector2(.1,.1),p+Vector2(.1,.1),Color("e7c89b"),.04)
 for deck in bridge_bodies:
  if deck.get_meta("lift",false):draw_line(deck.to_global(Vector2.ZERO),deck.to_global(Vector2(float(route.liftBridge.to)-float(route.liftBridge.from),0)),Color("c5bc9d"),.20)
 for plank in dynamic_planks:
  if not is_instance_valid(plank):continue
  var half=float(route.bridge.to-route.bridge.from)/24.
  draw_line(plank.to_global(Vector2(-half,0)),plank.to_global(Vector2(half,0)),Color("c8aa7f"),.14)
 if tow!=null and tow_joint!=null:draw_line(rig.to_global(Vector2(-1.7,0)),tow.to_global(Vector2(1.6,0)),Color("dfc695"),.04)
 if winch_left>0.:draw_line(rig.position,winch_anchor,Color("a0d1ba"),.045)
 for target in stop_states+[{"x":float(route.length)+6.,"done":false}]:
  if target.done:continue
  var x=float(target.x);var y=Data.height_at(route,x)-.04
  draw_line(Vector2(x-3.,y),Vector2(x+3.,y),Color("e9bd75"),.10)
  draw_line(Vector2(x-.65,y-.025),Vector2(x+.65,y-.025),Color("a3d8b1"),.16)
  draw_line(Vector2(x+3.,y),Vector2(x+3.,y-1.5),Color("dac7a2"),.04)
  draw_rect(Rect2(x+2.6,y-1.7,.8,.55),Color("c1d8aa"))
class RoadPreview extends Control:
 var road: Dictionary
 func _draw():
  if road.is_empty():return
  var points=road.profile;var low=10000.;var high=-10000.
  for p in points:low=minf(low,float(p[1]));high=maxf(high,float(p[1]))
  var line=PackedVector2Array()
  for p in points:
   if float(p[0])<0. or float(p[0])>float(road.length):continue
   line.append(Vector2(float(p[0])/float(road.length)*(size.x-12.)+6.,12.+(float(p[1])-low)/maxf(5.,high-low)*(size.y-26.)))
  draw_rect(Rect2(Vector2.ZERO,size),Color(.06,.12,.16,.76))
  if line.size()>1:draw_polyline(line,Color("d2b88d"),2.,true)
class VehiclePreview extends Control:
 var spec: Dictionary
 var kit: Dictionary
 var paint_color: Color
 var art: DustrivoRig
 func _ready():
  art=Rig.new();art.spec=spec;art.kit=kit;art.paint_color=paint_color;art.radius=float(spec.radius);art.ghost=true;art.freeze=true;art.collision_layer=0;art.collision_mask=0
  for x in spec.get("axles",[-float(spec.base),float(spec.base)]):art.wheels.append({"x":x,"distance":.7,"spin":0.0})
  art.scale=Vector2(58,58);add_child(art)
 func _process(_dt):
  if art!=null:art.position=Vector2(size.x*.48,size.y*.64)

func _close_dialog():
 if mode=="hub":_hub()
 else:_pause_overlay()
func _switch_profile_request():
 if mode!="hub":message("Сначала вернись в диспетчерскую");return
 Data.switch_profile();selected=int(Data.save.selected);garage_car=Data.save.vehicle;_hub()
func _replace_run():
 if ridge_mode:Data.save.ridgeNative34={}
 else:Data.save.nativeRun34={}
 begin_run()

func _clear_inputs():
 gas_level=0.;brake_pressed=false;touch_gas=-1;touch_brake=-1
 if rig!=null:rig.gas=0.;rig.braking=false
