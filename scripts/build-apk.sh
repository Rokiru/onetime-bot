#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -x .tools/gradle-8.13/bin/gradle ] || [ ! -x .tools/jdk-21.0.8/bin/javac ] || [ ! -f local.properties ]; then
  python3 scripts/bootstrap.py
fi
export GRADLE_USER_HOME="$PWD/.tools/gradle-home"
export ANDROID_USER_HOME="$PWD/.tools/android-user"
export ANDROID_HOME="$PWD/.tools/android-sdk"
node --test tests/engine.test.js
python3 scripts/gradle.py --no-daemon --max-workers=2 :app:assembleDebug :app:lintDebug
mkdir -p artifacts
cp app/build/outputs/apk/debug/app-debug.apk artifacts/iskra-last-light-0.1.0.apk
.tools/android-sdk/build-tools/35.0.0/apksigner verify --verbose artifacts/iskra-last-light-0.1.0.apk
sha256sum artifacts/iskra-last-light-0.1.0.apk > artifacts/iskra-last-light-0.1.0.apk.sha256
printf 'APK: %s/artifacts/iskra-last-light-0.1.0.apk\n' "$PWD"
