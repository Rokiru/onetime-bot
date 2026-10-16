#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -x .tools/gradle-8.13/bin/gradle ] || [ ! -x .tools/jdk-21.0.8/bin/javac ] || [ ! -f local.properties ]; then
  python3 scripts/bootstrap.py
fi
export GRADLE_USER_HOME="$PWD/.tools/gradle-home"
export ANDROID_USER_HOME="$PWD/.tools/android-user"
export ANDROID_HOME="$PWD/.tools/android-sdk"
node tests/verify-expedition18.cjs
node tests/verify-contracts20.cjs
node tests/verify-first-light21.cjs
node tests/verify-water-run22.cjs
node tests/verify-recovery23.cjs
node tests/verify-opening24.cjs
node tests/verify-ridge25.cjs
node tests/verify-courses26.cjs
node tests/verify-driving27.cjs
DUSTRIVO_BUILD_TYPE=${DUSTRIVO_BUILD_TYPE:-auto}
if [ "$DUSTRIVO_BUILD_TYPE" = auto ]; then
  if [ -f .tools/dustrivo-signing/signing.properties ]; then DUSTRIVO_BUILD_TYPE=release; else DUSTRIVO_BUILD_TYPE=debug; fi
fi
case "$DUSTRIVO_BUILD_TYPE" in
 release)
  if [ ! -f .tools/dustrivo-signing/signing.properties ]; then
    printf 'Release signing is not configured. Supply the signing key locally or use DUSTRIVO_BUILD_TYPE=debug for a separate development build.\n' >&2
    exit 1
  fi
  python3 scripts/gradle.py --no-daemon --max-workers=2 :app:assembleRelease :app:lintRelease
  DUSTRIVO_APK_SOURCE=app/build/outputs/apk/release/app-release.apk
  ;;
 debug)
  python3 scripts/gradle.py --no-daemon --max-workers=2 :app:assembleDebug :app:lintDebug
  DUSTRIVO_APK_SOURCE=app/build/outputs/apk/debug/app-debug.apk
  ;;
 *) printf 'Unknown DUSTRIVO_BUILD_TYPE: %s\n' "$DUSTRIVO_BUILD_TYPE" >&2; exit 1 ;;
esac
export DUSTRIVO_BUILD_TYPE
mkdir -p artifacts
cp "$DUSTRIVO_APK_SOURCE" artifacts/Dustrivo-0.27.apk
.tools/android-sdk/build-tools/35.0.0/apksigner verify --verbose artifacts/Dustrivo-0.27.apk
python3 - <<'PY'
from pathlib import Path
import zipfile, subprocess, os
apk=Path('artifacts/Dustrivo-0.27.apk')
badging=subprocess.check_output(['.tools/android-sdk/build-tools/35.0.0/aapt','dump','badging',str(apk)],text=True)
assert "name='ru.rokiru.cargo' versionCode='28' versionName='0.27'" in badging
if os.environ['DUSTRIVO_BUILD_TYPE']=='release':
    assert 'application-debuggable' not in badging, 'Release APK must not be debuggable'
    cert=subprocess.check_output(['.tools/android-sdk/build-tools/35.0.0/apksigner','verify','--print-certs',str(apk)],text=True)
    assert '3b5dab139957cb61bef40f2d0c98c97a0498f57e5683118a0b20066863a6e1e1' in cert, 'Signing identity changed; existing installs must remain updatable'
print('Verified Android metadata; build type: '+os.environ['DUSTRIVO_BUILD_TYPE'])
with zipfile.ZipFile(apk) as z:
    assert z.testzip() is None, 'APK CRC failure'
    for source in Path('game/assets').rglob('*'):
        if source.is_file():
            assert z.read('assets/'+source.relative_to('game/assets').as_posix())==source.read_bytes(), 'APK asset mismatch: '+str(source)
print('All bundled assets match the tested game.')
PY
sha256sum artifacts/Dustrivo-0.27.apk > artifacts/Dustrivo-0.27.apk.sha256
printf 'APK: %s/artifacts/Dustrivo-0.27.apk\n' "$PWD"
