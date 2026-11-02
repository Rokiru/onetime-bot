extends Node
# All persistence is local; the original Java/native backup is imported once.
var catalog: Dictionary
var vehicles: Array
var roads: Array
var profile := "career"
var profiles: Dictionary = {}
var save: Dictionary
var migrated := false
var transient := false # Developer benchmark only; no UI enables it.
const RULES := "godot34"
const FILE := "user://dustrivo-native.json"
const PARTS := {
 "tires": [{"id":"stock","name":"Универсальные","price":0,"text":"Баланс для смешанной дороги"},{"id":"mud","name":"Грязевые","price":160,"text":"Сцепление +20%, скорость −8%, расход +10%"},{"id":"road","name":"Дорожные","price":130,"text":"Скорость +5%, расход −10%, сцепление −12%"}],
 "suspension": [{"id":"stock","name":"Заводская","price":0,"text":"Сбалансированная подвеска"},{"id":"comfort","name":"Мягкая","price":180,"text":"Длиннее ход, мягче удары; сильнее крен"},{"id":"heavy","name":"Грузовая","price":220,"text":"Жёсткость +16%, масса +6%"}],
 "utility": [{"id":"stock","name":"Без обвеса","price":0,"text":"Минимальная масса"},{"id":"guard","name":"Защита рамы","price":200,"text":"Урон кузову −15%, масса +8%"},{"id":"service","name":"Экспедиционный","price":240,"text":"Запасной трос, масса +4%"}]
}
const PAINTS := ["#df8550","#599487","#b69864","#b35359","#558ea9","#63717e","#c8a44f","#bc6250","#9fc3c6","#899365","#e2d2ae","#ced9da"]
func _ready():
 catalog = JSON.parse_string(FileAccess.get_file_as_string("res://data/catalog.json"))
 vehicles = catalog.vehicles
 roads = catalog.roads
 catalog.sequence=catalog.sequence.map(func(value):return int(value))
 for m in vehicles:
  if m.has("driven"):m.driven=m.driven.map(func(value):return int(value))
 for r in roads:r.id=int(r.id);r.region=int(r.region)
 for path in [FILE,FILE+".bak"]:
  if not FileAccess.file_exists(path):continue
  var raw = JSON.parse_string(FileAccess.get_file_as_string(path))
  if raw is Dictionary and raw.get("profiles") is Dictionary and not raw.profiles.is_empty():
   profiles=raw.profiles;profile=str(raw.get("active","career"));break
 if profiles.is_empty():
  _import_legacy()
 for name in ["career", "test"]:
  profiles[name] = normalize(profiles.get(name, {}), name)
 if not profiles.has(profile): profile = "career"
 save = profiles[profile]
 persist()
func normalize(raw: Dictionary, which: String) -> Dictionary:
 var s = raw.duplicate(true)
 var defaults = {"wallet":18000 if which=="test" else 0,"owned":["rover"],"vehicle":"rover","levels":[0,0,0],"stats":[],"vehicleLevels":{},"builds31":{},"kitOwned31":{},"setups":{},"paints":{},"nativeRun34":{},"ridgeNative34":{},"ridgeRecords34":{},"settledNative34":[],"workshopPowered":false,"villageWater":false,"villageRescue":false,"selected":0,"sound":true,"haptics":true,"music":true,"volume":65,"tutorialDone":false,"deliveries":0,"earned":0,"best":0,"ridgeLoad25":1}
 for key in defaults:
  if not s.has(key): s[key] = defaults[key]
 if not s.stats is Array: s.stats = []
 while s.stats.size()<roads.size(): s.stats.append({})
 for m in vehicles:
  var id = m.id
  if not s.vehicleLevels.has(id): s.vehicleLevels[id] = [0,0,0]
  if not s.setups.has(id): s.setups[id] = "standard"
  if not s.paints.has(id): s.paints[id] = "factory"
  if not s.builds31.has(id): s.builds31[id] = {"tires":"stock","suspension":"stock","utility":"stock","livery":"none","rims":"steel"}
  if not s.kitOwned31.has(id): s.kitOwned31[id] = {"tires":["stock"],"suspension":["stock"],"utility":["stock"]}
  for slot in PARTS:
   if not s.builds31[id].has(slot): s.builds31[id][slot] = "stock"
   if not s.kitOwned31[id].has(slot): s.kitOwned31[id][slot] = ["stock"]
   if not s.kitOwned31[id][slot].has(s.builds31[id][slot]): s.builds31[id][slot] = "stock"
 if not s.owned.has("rover"): s.owned.append("rover")
 if not s.owned.has(s.vehicle): s.vehicle = "rover"
 s.wallet = maxi(0,int(s.wallet))
 s.selected = clampi(int(s.selected),0,roads.size()-1)
 return s
func _import_legacy():
 var candidates = ["/data/data/ru.rokiru.cargo/shared_prefs/dustrivo_saves_v1.xml","/data/user/0/ru.rokiru.cargo/shared_prefs/dustrivo_saves_v1.xml"]
 var base = OS.get_user_data_dir()
 for i in range(5):
  candidates.append(base.path_join("shared_prefs/dustrivo_saves_v1.xml"))
  base = base.get_base_dir()
 for path in candidates:
  if FileAccess.file_exists(path) and import_backup_xml(FileAccess.get_file_as_string(path)):return
func import_backup_xml(contents: String) -> bool:
 var xml=XMLParser.new()
 if xml.open_buffer(contents.to_utf8_buffer())!=OK:return false
 var imported=false
 var key=""
 while xml.read()==OK:
  if xml.get_node_type()==XMLParser.NODE_ELEMENT and xml.get_node_name()=="string":key=xml.get_named_attribute_value_safe("name")
  elif xml.get_node_type()==XMLParser.NODE_TEXT and key!="":
   var value=xml.get_node_data()
   if key in ["cargo-career-v1","cargo-save-v1"]:
    var raw=JSON.parse_string(value)
    if raw is Dictionary:
     profiles["career" if key=="cargo-career-v1" else "test"]=raw
     if raw.get("activeRun") is Dictionary:raw["legacyCheckpoint34"]=raw.activeRun.duplicate(true)
     if raw.get("ridgeRun25") is Dictionary:raw["legacyRidge34"]=raw.ridgeRun25.duplicate(true)
     imported=true;migrated=true
   elif key=="cargo-active-profile":
    var active=JSON.parse_string(value);profile=str(active.get("profile","career")) if active is Dictionary else value
   key=""
 return imported
func persist() -> bool:
 if transient:return true
 profiles[profile] = save if save!=null else profiles.get(profile,{})
 var text=JSON.stringify({"schema":34,"engine":RULES,"active":profile,"profiles":profiles})
 var f=FileAccess.open(FILE+".tmp",FileAccess.WRITE)
 if f==null: return false
 f.store_string(text)
 f.flush()
 f.close()
 if FileAccess.file_exists(FILE): DirAccess.copy_absolute(FILE,FILE+".bak")
 return DirAccess.rename_absolute(FILE+".tmp",FILE)==OK
func switch_profile():
 persist()
 profile="test" if profile=="career" else "career"
 save=profiles[profile]
 persist()
func vehicle(id: String) -> Dictionary:
 for m in vehicles:
  if m.id==id: return m.duplicate(true)
 return vehicles[0].duplicate(true)
func levels(id: String) -> Array:
 return save.levels if id=="rover" else save.vehicleLevels[id]
func unlocked(id: int) -> bool:
 if profile=="test": return true
 var at=catalog.sequence.find(id)
 return at==0 or int(save.stats[id].get("wins",0))>0 or (at>0 and int(save.stats[int(catalog.sequence[at-1])].get("wins",0))>0)
func compatible(m: Dictionary,r: Dictionary) -> bool:
 var cargo=r.get("cargo","crates")
 if cargo=="liquid": return m.family=="tanker"
 if cargo=="logs": return m.family=="timber"
 if m.family in ["tanker","timber"]: return false
 if r.get("requires")!=null: return m.family==r.requires
 return true
func pick(r: Dictionary) -> String:
 var current=vehicle(save.vehicle)
 if compatible(current,r): return current.id
 for m in vehicles:
  if save.owned.has(m.id) and compatible(m,r): return m.id
 return ""
func buy_car(id: String) -> bool:
 var m=vehicle(id)
 if not save.owned.has(id):
  if save.wallet<int(m.price): return false
  save.wallet-=int(m.price)
  save.owned.append(id)
 save.vehicle=id
 persist()
 return true
func install(slot: String, id: String) -> bool:
 var car=save.vehicle
 for part in PARTS[slot]:
  if part.id!=id: continue
  if not save.kitOwned31[car][slot].has(id):
   if save.wallet<int(part.price): return false
   save.wallet-=int(part.price)
   save.kitOwned31[car][slot].append(id)
  save.builds31[car][slot]=id
  persist()
  return true
 return false
func config(id: String, stock:=false) -> Dictionary:
 return {"tires":"stock","suspension":"stock","utility":"stock","livery":"none","rims":"steel"} if stock else save.builds31[id].duplicate(true)
func paint(id: String) -> Color:
 var p=save.paints.get(id,"factory")
 var old={"pine":1,"sand":2,"cherry":3,"marine":4,"graphite":5,"ochre":6,"rescue":7,"glacier":8,"olive":9,"cream":10,"arctic":11}
 return Color(PAINTS[int(old.get(p,0))]) if old.has(p) else Color(p) if str(p).begins_with("#") else Color(vehicle(id).color)
func height_at(r: Dictionary,x: float) -> float:
 var points=r.profile
 var low=0
 var high=points.size()-1
 while low+1<high:
  var middle=(low+high)/2
  if float(points[middle][0])<=x: low=middle
  else: high=middle
 var a=points[low]
 var b=points[high]
 return lerpf(float(a[1]),float(b[1]),clampf((x-float(a[0]))/maxf(.001,float(b[0])-float(a[0])),0.,1.))
func surface(r: Dictionary,x: float) -> Dictionary:
 for zone in r.get("surfaces",[]):
  if x>=float(zone.from) and x<=float(zone.to): return zone
 return {"type":"gravel","friction":.95}
