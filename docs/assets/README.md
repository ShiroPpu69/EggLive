# Documentation asset provenance

`demo-portrait.png` is an AI-generated fictional adult portrait created for EggLive documentation with the built-in imagegen tool. It is not the developer, a customer, or a webcam capture. It is not a default face inside the shipped application.

Generation prompt:

> Use case: photorealistic-natural. Create one photorealistic neutral webcam calibration portrait of an entirely fictional adult man, about 30, short dark hair, brown eyes, clean shaven, warm medium skin, both eyes fully open, looking straight at camera with a small relaxed smile showing a little upper teeth. Straight-on frontal head pose, level eyes, entire face and ears visible, head centered, uncluttered plain medium gray backdrop, even soft diffuse frontal lighting, clear realistic skin texture and eyes, sharp focus, ordinary webcam appearance. No glasses, no hats, no accessories, no text, no watermark, no celebrity likeness. This synthetic face will be fed to an actual face-tracking application to create a privacy-safe open-source demo, not used as fake proof of a real webcam session.

`hero.png` and `demo.gif` are captured from EggLive's actual renderer using the synthetic portrait. Demo motion is scripted with the application's wobble demonstration control. The hero's title and background are composed in HTML/CSS around the actual rendered egg. These images show visual output, not a measurement of live-webcam tracking accuracy.

To regenerate on Windows after asset setup and building:

```powershell
node tests/render-public-demo.cjs
```

The script writes the hero and a PNG frame sequence under Git-ignored `tests/artifacts/public-demo`. The published GIF is encoded from those frames. It contains no private desktop, camera identity, device identifier, local OBS configuration, or user path.
