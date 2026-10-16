"""Check the actual resource table, including aapt's optimized filenames/configs."""
from pathlib import Path
import re
import subprocess
import sys
import zipfile

apk = Path(sys.argv[1])
base = Path('.tools/android-sdk/build-tools/35.0.0')
resources = subprocess.check_output([str(base/'aapt2'), 'dump', 'resources', str(apk)], text=True)
files, ids, current = {}, {}, None
for line in resources.splitlines():
    resource = re.match(r'\s*resource (0x[0-9a-f]+) (\S+)$', line)
    if resource:
        current = resource[2]
        ids[current] = resource[1]
        files[current] = []
    item = re.match(r'\s+\(([^)]*)\) \(file\) (\S+)', line)
    if item and current:
        files[current].append((item[1], item[2]))

def xml(name):
    return subprocess.check_output([str(base/'aapt'), 'dump', 'xmltree', str(apk), name], text=True)

with zipfile.ZipFile(apk) as archive:
    icon_files = files['drawable/app_icon32']
    assert len(icon_files) == 1 and icon_files[0][0] == 'nodpi'
    assert archive.read(icon_files[0][1]) == Path('game/res/drawable-nodpi/app_icon32.webp').read_bytes(), 'Native icon artwork mismatch'
    adaptive, themed = False, False
    for config, name in files['mipmap/ic_launcher']:
        tree = xml(name)
        if config in ('anydpi', 'anydpi-v26') and 'E: adaptive-icon' in tree:
            adaptive = True
        if config == 'anydpi-v33':
            assert 'E: monochrome' in tree and '@'+ids['drawable/launcher_mono32'] in tree
            themed = True
        if 'E: adaptive-icon' in tree:
            assert 'E: foreground' in tree and '@'+ids['drawable/launcher_foreground32'] in tree
    assert adaptive and themed, 'Both baseline adaptive and API 33 themed icons must be packaged'
    foreground = xml(files['drawable/launcher_foreground32'][0][1])
    assert 'E: inset' in foreground and '@'+ids['drawable/app_icon32'] in foreground
    mono = xml(files['drawable/launcher_mono32'][0][1])
    assert 'E: vector' in mono and 'E: path' in mono
    legacy = xml(files['drawable/icon'][0][1])
    assert 'E: bitmap' in legacy and '@'+ids['drawable/app_icon32'] in legacy
    launch = xml(files['drawable/launch_screen32'][0][1])
    assert 'E: layer-list' in launch and '@'+ids['drawable/icon'] in launch
manifest = xml('AndroidManifest.xml')
for attribute in ('icon', 'roundIcon'):
    assert re.search(r'android:'+attribute+r'\([^)]*\)=@'+ids['mipmap/ic_launcher'], manifest), 'Manifest must select the new launcher icon'
assert '0x0101062d=@drawable/launcher_foreground32' in resources, 'Android 12 splash must use the new artwork'
print('PASS APK32: actual optimized resource bindings, exact icon bytes, adaptive + themed icon, vector, native splash, manifest icon and roundIcon')
