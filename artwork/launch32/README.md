# Dustrivo launch identity, 0.32

The two PNG files are original generated artwork masters, retained outside Android's assets to avoid bundling production sources in the APK. They were generated with the image generation tool for this update; no remote resources are used by the game.

`icon-master.png`: orange short-cab 4×4 cargo pickup, strapped wooden crate, northern pine valley and amber sunrise, dark green outer margins, no text. Android's adaptive foreground adds a 12% inset to keep the complete truck inside circular/squircle masks. `loading-master.png`: the same vehicle/world in a wide landscape composition, quiet dark left side for the locally typeset title and status.

Shipping encodings (ImageMagick; no crop or compositing):

```sh
convert artwork/launch32/icon-master.png -resize 512x512 -quality 92 game/res/drawable-nodpi/app_icon32.webp
convert artwork/launch32/loading-master.png -quality 86 game/assets/art/launch32.webp
```

Typography, overlay shade and progress remain code/DOM, not baked into the artwork. Android 13 monochrome uses a separate vector truck silhouette. These are startup illustrations, not gameplay screenshots. Browser mask previews approximate the Android 108dp layer / 72dp mask geometry; actual launcher appearance depends on the phone launcher.
