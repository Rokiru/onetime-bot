# Working on Dustrivo

- Work in the existing isolated checkout; do not create a worktree unless the user requests one.
- Every completed game update MUST include a newly built APK and a download link. Run `bash scripts/build-apk.sh`, verify success, then copy the delivered APK and SHA-256 into `releases/`.
- Increment the Android version in `app/build.gradle` and `game/AndroidManifest.xml`, and update the filename in `scripts/build-apk.sh`, for each subsequent delivered build.
- This project continues the user-supplied Dustrivo sources. The package is `ru.rokiru.cargo`. Preserve existing vehicle/route IDs, career progress, storage keys, and checkpoint compatibility.
- Gameplay assets and simulation are in `game/assets/`. Premium rendering is in `premium-render.js`, current interface styling in `expedition.css`, and the drivetrain/UI integration in `expedition-ui.js`.
- Run relevant physics, UI, delivery, checkpoint and storage tests for changes. The current road count is 48; older tests have historical fixtures. Test fixtures must select their intended career/test profile explicitly.
- Android builds use the pinned tools in `.tools/` and `scripts/gradle.py` for proxy and CA trust. Never disable TLS or archive checksum verification.
- The original development signing key supplied in the archive is retained under ignored `.tools/dustrivo-signing/`. Never commit it, passwords or `signing.properties`. A fresh clone without that key uses a different debug key and cannot update the supplied older development APK in place.
- Development APKs are playtest builds. Real-device validation and permanent release signing remain prerequisites for a RuStore release.
- Keep the game offline. Do not add ads, analytics, external resources or Internet permission without a user request.
- Do not restore the discarded Iskra project. Localhost/browser servers are for internal verification and are not user download links.
