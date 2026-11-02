#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Dustrivo's current Android build is native Godot. Legacy WebView sources remain intact.
exec python3 scripts/build-godot-apk.py
