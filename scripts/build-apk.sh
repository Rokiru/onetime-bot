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
python3 scripts/gradle.py --no-daemon --max-workers=2 :app:assembleDebug :app:lintDebug
mkdir -p artifacts
cp app/build/outputs/apk/debug/app-debug.apk artifacts/Dustrivo-0.22.apk
.tools/android-sdk/build-tools/35.0.0/apksigner verify --verbose artifacts/Dustrivo-0.22.apk
python3 - <<'PY'
from pathlib import Path
import zipfile
apk=Path('artifacts/Dustrivo-0.22.apk')
with zipfile.ZipFile(apk) as z:
    assert z.testzip() is None, 'APK CRC failure'
    for source in Path('game/assets').rglob('*'):
        if source.is_file():
            assert z.read('assets/'+source.relative_to('game/assets').as_posix())==source.read_bytes(), 'APK asset mismatch: '+str(source)
print('All bundled assets match the tested game.')
PY
sha256sum artifacts/Dustrivo-0.22.apk > artifacts/Dustrivo-0.22.apk.sha256
printf 'APK: %s/artifacts/Dustrivo-0.22.apk\n' "$PWD"
