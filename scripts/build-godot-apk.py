#!/usr/bin/env python3
"""Build and sign the native Android game using the existing 0.33 signing identity."""
import hashlib,importlib.util,json,os,pathlib,re,shutil,subprocess,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
TOOLS=ROOT/'.tools'
signing=TOOLS/'dustrivo-signing/signing.properties'
if not signing.is_file():raise SystemExit('Restore the existing 0.33+ signing folder privately. No key will be generated.')
spec=importlib.util.spec_from_file_location('godot_bootstrap',ROOT/'scripts/bootstrap-godot.py')
bootstrap=importlib.util.module_from_spec(spec);spec.loader.exec_module(bootstrap)
binary,templates=bootstrap.prepare()
project=ROOT/'godot'
artifacts=ROOT/'artifacts';artifacts.mkdir(exist_ok=True)
# Editor configuration contains paths only, never signing credentials.
settings=pathlib.Path.home()/'.config/godot/editor_settings-4.6.tres';settings.parent.mkdir(parents=True,exist_ok=True)
text=settings.read_text() if settings.exists() else '[gd_resource type="EditorSettings" format=3]\n[resource]\n'
for key,value in [('export/android/android_sdk_path',str(TOOLS/'android-sdk')),('export/android/java_sdk_path',str(TOOLS/'jdk-21.0.8'))]:
    line=key+' = '+json.dumps(value)
    pattern=r'^'+re.escape(key)+r'\s*=.*$'
    text=re.sub(pattern,lambda _:line,text,flags=re.M) if re.search(pattern,text,re.M) else text+'\n'+line+'\n'
settings.write_text(text)
env=os.environ.copy();env['JAVA_HOME']=str(TOOLS/'jdk-21.0.8');env['ANDROID_HOME']=str(TOOLS/'android-sdk');env['PATH']=str(TOOLS/'jdk-21.0.8/bin')+os.pathsep+env['PATH']
print('Import native project resources',flush=True)
imported=subprocess.run([binary,'--headless','--editor','--path',str(project),'--import','--quit'],cwd=ROOT,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=75)
if imported.returncode or 'SCRIPT ERROR' in imported.stdout:
    print(imported.stdout);raise SystemExit('Native resource import failed')
print('Native Godot focused integration check',flush=True)
check=subprocess.run([binary,'--headless','--path',str(project),'--script','tests/native_smoke.gd','--fixed-fps','60'],cwd=ROOT,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=75)
print(check.stdout)
if check.returncode or 'PASS native Godot:' not in check.stdout or 'SCRIPT ERROR' in check.stdout:raise SystemExit('Native integration failed')
catalog=json.loads((project/'data/catalog.json').read_text())
assert len(catalog['roads'])==72 and len(catalog['vehicles'])==16
assert [r['id'] for r in catalog['roads']]==list(range(72))
assert len({json.dumps(r['profile']) for r in catalog['roads']})==72,'Duplicate terrain profiles'
unsigned=artifacts/'Dustrivo-0.34-unsigned.apk'
preset=project/'export_presets.cfg';original=preset.read_text()
local=original.replace('../.tools/godot-4.6.3-templates/',str(templates)+'/')
try:
    preset.write_text(local)
    subprocess.run([binary,'--headless','--path',str(project),'--export-release','Android',str(unsigned)],cwd=ROOT,env=env,check=True,timeout=120)
finally:preset.write_text(original)
props={}
for line in signing.read_text().splitlines():
    if '=' in line:
        key,value=line.split('=',1);props[key]=value
store=pathlib.Path(props['storeFile'])
if not store.is_absolute():store=(ROOT/'app'/store).resolve()
env['DUSTRIVO_STORE_PASSWORD']=props['storePassword'];env['DUSTRIVO_KEY_PASSWORD']=props['keyPassword']
buildtools=TOOLS/'android-sdk/build-tools/35.0.0'
aligned=artifacts/'Dustrivo-0.34-aligned.apk';apk=artifacts/'Dustrivo-0.34.apk'
subprocess.run([str(buildtools/'zipalign'),'-P','16','-f','4',str(unsigned),str(aligned)],env=env,check=True)
subprocess.run([str(buildtools/'apksigner'),'sign','--ks',str(store),'--ks-key-alias',props['keyAlias'],'--ks-pass','env:DUSTRIVO_STORE_PASSWORD','--key-pass','env:DUSTRIVO_KEY_PASSWORD','--out',str(apk),str(aligned)],env=env,check=True)
cert=subprocess.check_output([str(buildtools/'apksigner'),'verify','--print-certs',str(apk)],env=env,text=True)
expected=(ROOT/'scripts/signing-certificate.sha256').read_text().strip();assert expected in cert,'0.33 signer mismatch'
badging=subprocess.check_output([str(buildtools/'aapt'),'dump','badging',str(apk)],text=True)
assert "name='ru.rokiru.cargo' versionCode='35' versionName='0.34'" in badging
assert 'application-debuggable' not in badging and 'uses-permission' not in badging
with zipfile.ZipFile(apk) as z:
    assert z.testzip() is None
    names=z.namelist()
    assert any(n.endswith('libgodot_android.so') for n in names)
    assert not any(n.endswith(('.html','.js')) for n in names),'WebView/JS must not ship'
    assert not any('/tests/' in n for n in names),'Developer scripts must not ship'
    assert z.read('assets/data/catalog.json')==(project/'data/catalog.json').read_bytes()
sha=hashlib.sha256(apk.read_bytes()).hexdigest();(artifacts/'Dustrivo-0.34.apk.sha256').write_text(sha+'  Dustrivo-0.34.apk\n')
print('PASS native APK: Godot engine, code35/version0.34, 72 roads/16 cars, no JS/HTML, no permissions, same signer as0.33, ZIP/content verified.',flush=True)
print('APK: '+str(apk),flush=True)
