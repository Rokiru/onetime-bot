#!/usr/bin/env python3
"""Install verified official Android and Gradle archives into the checkout's ignored .tools."""
import hashlib, os, pathlib, subprocess, tarfile, urllib.request, xml.etree.ElementTree as ET, zipfile
ROOT = pathlib.Path(__file__).resolve().parents[1]
TOOLS = ROOT / '.tools'
TOOLS.mkdir(exist_ok=True)
os.environ['GRADLE_USER_HOME'] = str(TOOLS / 'gradle-home')
os.environ['ANDROID_USER_HOME'] = str(TOOLS / 'android-user')

def download(url, dest, digest=None, algorithm='sha256'):
    if not dest.exists():
        print('Downloading', dest.name, flush=True)
        with urllib.request.urlopen(url, timeout=120) as response, open(dest, 'wb') as output:
            while chunk := response.read(1024 * 1024): output.write(chunk)
    if digest and hashlib.new(algorithm, dest.read_bytes()).hexdigest() != digest:
        dest.unlink()
        raise RuntimeError('Archive checksum verification failed')

jdk = TOOLS / 'jdk-21.0.8'
if not (jdk / 'bin/javac').exists():
    url = 'https://download.oracle.com/java/21/archive/jdk-21.0.8_linux-x64_bin.tar.gz'
    with urllib.request.urlopen(url + '.sha256', timeout=60) as r: digest = r.read().decode().strip()
    dest = TOOLS / 'jdk-21.0.8.tar.gz'
    download(url, dest, digest)
    with tarfile.open(dest) as archive: archive.extractall(TOOLS, filter='data')
os.environ['JAVA_HOME'] = str(jdk)
os.environ['PATH'] = str(jdk / 'bin') + os.pathsep + os.environ['PATH']
sdk = TOOLS / 'android-sdk'
manager = sdk / 'cmdline-tools/19.0/bin/sdkmanager'
if not manager.exists():
    with urllib.request.urlopen('https://dl.google.com/android/repository/repository2-1.xml', timeout=60) as r:
        repo = ET.fromstring(r.read())
    package = next(p for p in repo if p.attrib.get('path') == 'cmdline-tools;19.0')
    archive = next(a for a in package.find('archives') if a.findtext('host-os') == 'linux')
    complete = archive.find('complete')
    checksum = complete.find('checksum')
    dest = TOOLS / 'android-commandline-19.zip'
    download('https://dl.google.com/android/repository/' + complete.findtext('url'), dest,
             checksum.text, checksum.attrib.get('type', 'sha1'))
    staging = TOOLS / 'android-commandline-19'
    with zipfile.ZipFile(dest) as z: z.extractall(staging)
    manager.parent.parent.parent.mkdir(parents=True, exist_ok=True)
    (staging / 'cmdline-tools').rename(manager.parent.parent)
    for directory in [manager.parent, manager.parent.parent / 'lib']:
        for p in directory.rglob('*'):
            if p.is_file() and p.suffix not in ['.jar', '.xml']: p.chmod(p.stat().st_mode | 0o111)
    manager.chmod(0o755)
if not (sdk / 'platforms/android-35/android.jar').exists() or not (sdk / 'build-tools/35.0.0/apksigner').exists():
    subprocess.run([str(manager), '--sdk_root=' + str(sdk), '--licenses'], input='y\n' * 100, text=True, check=True,
                   stdout=subprocess.DEVNULL)
    subprocess.run([str(manager), '--sdk_root=' + str(sdk), 'platforms;android-35', 'build-tools;35.0.0', 'platform-tools'], check=True)
gradle = TOOLS / 'gradle-8.13/bin/gradle'
if not gradle.exists():
    url = 'https://services.gradle.org/distributions/gradle-8.13-bin.zip'
    with urllib.request.urlopen(url + '.sha256', timeout=60) as r: digest = r.read().decode().strip()
    dest = TOOLS / 'gradle.zip'
    download(url, dest, digest)
    with zipfile.ZipFile(dest) as z: z.extractall(TOOLS)
    gradle.chmod(0o755)
(ROOT / 'local.properties').write_text('sdk.dir=' + str(sdk) + '\n')
print('JDK 21.0.8, Android SDK 35 and Gradle 8.13 ready.', flush=True)
