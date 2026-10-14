# Working on Iskra

- This cloud workspace is already isolated. Use the existing checkout; do not create a worktree unless the user asks.
- The user requires an APK with every completed game update. Run `bash scripts/build-apk.sh`, verify success, and provide the resulting APK file in the final response.
- Increment `versionCode` and `versionName` in `app/build.gradle` for subsequent delivered versions. Update the artifact filename in `scripts/build-apk.sh` to match.
- Copy each delivered APK and its SHA-256 into `releases/` after successful validation so the user has a downloadable file through GitHub. These small, versioned playtest binaries are intentionally tracked; never add SDKs, build caches or signing keys.
- Game simulation lives in `app/src/main/assets/game/engine.js`; keep it independent of DOM and Android for deterministic tests.
- For changes to gameplay or UI, run the engine tests and browser smoke checks. Serve bundled assets on localhost for internal validation; do not present localhost as a downloadable game or preview.
- Preserve TLS and official archive checksum verification. Use `scripts/gradle.py` for this cloud machine's proxy and CA settings.
- The current APK is a debug-signed playtest build. Never describe it as a store-ready release. Never commit signing keys or credentials.
- Keep Android permissions minimal. The game works offline, with no ads, analytics, external assets or Internet permission.
