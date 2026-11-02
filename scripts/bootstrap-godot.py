#!/usr/bin/env python3
"""Pinned, verified Godot runtime/templates; private keys are never generated here."""
import hashlib,json,pathlib,shutil,subprocess,urllib.request,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
TOOLS=ROOT/'.tools'
VERSION='4.6.3'
TEMPLATE_SHA256='3fbe2c0e2dec9d537ab9ec97bcf8da91dcf23357fc51f67092dd068d839290a8'

def prepare():
    TOOLS.mkdir(exist_ok=True)
    candidate=shutil.which('godot')
    if candidate and subprocess.check_output([candidate,'--version'],text=True).startswith(VERSION):
        binary=pathlib.Path(candidate)
    else:
        binary=TOOLS/('godot-'+VERSION)/('Godot_v'+VERSION+'-stable_linux.x86_64')
    templates=TOOLS/('godot-'+VERSION+'-templates')
    missing_binary=not binary.is_file()
    if missing_binary or not (templates/'android_release.apk').exists():
        with urllib.request.urlopen('https://api.github.com/repos/godotengine/godot/releases/tags/'+VERSION+'-stable',timeout=30) as r:
            release=json.load(r)
        needed=[]
        if missing_binary:needed.append('Godot_v'+VERSION+'-stable_linux.x86_64.zip')
        if not (templates/'android_release.apk').exists():needed.append('Godot_v'+VERSION+'-stable_export_templates.tpz')
        for name in needed:
            asset=next(a for a in release['assets'] if a['name']==name)
            archive=TOOLS/name
            if not archive.exists():
                print('Downloading official '+name,flush=True)
                with urllib.request.urlopen(asset['browser_download_url'],timeout=120) as src,archive.open('wb') as out:
                    shutil.copyfileobj(src,out,1024*1024)
            digest=hashlib.file_digest(archive.open('rb'),'sha256').hexdigest()
            expected=TEMPLATE_SHA256 if name.endswith('.tpz') else asset['digest'].split(':',1)[1]
            if digest!=expected:raise RuntimeError('Official Godot archive checksum mismatch')
            with zipfile.ZipFile(archive) as z:
                if name.endswith('.tpz'):
                    templates.mkdir(exist_ok=True)
                    for part in ['android_release.apk','android_debug.apk','version.txt']:
                        (templates/part).write_bytes(z.read('templates/'+part))
                else:
                    binary.parent.mkdir(exist_ok=True)
                    binary.write_bytes(z.read(binary.name));binary.chmod(0o755)
    if not (TOOLS/'android-sdk/build-tools/35.0.0/apksigner').exists():
        subprocess.run(['python3',str(ROOT/'scripts/bootstrap.py')],cwd=ROOT,check=True)
    return str(binary),templates
if __name__=='__main__':
    binary,templates=prepare()
    print('Verified Godot '+VERSION+' and Android templates ready.')
