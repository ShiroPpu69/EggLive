# Validation & known limits

## 1.6 development validation

These are development-machine observations on Windows with a Ryzen 9 5900HX (16 logical processors), AMD integrated graphics and an NVIDIA RTX 3070 Laptop GPU available. The tested video encoder reported AMD hardware H.264. This is not a certified hardware compatibility list.

| Check | Observed result |
|---|---|
| Paired capture | A source mutated immediately after snapshot did not alter the returned bitmap. |
| Bitmap orientation | Static source and returned bitmap produced matching orientation. |
| Source reflection fixture | Ordinary glare correction reduced blue excess by about 84% in the supplied fixture; this is a color metric, not proof of recovered eyes. |
| Clean-eye mode | Replacing live eye regions with strong white and blue-purple blocks produced zero pixel difference in the tested rendered eye region when reference mode was enabled. |
| Blink control | Synthetic closed-eye landmarks changed the rendered reference eyes. |
| Reference lifecycle | Open/closed validation, local save, startup reload, enable/disable, and deletion passed. |
| Stability | 150 readback samples over roughly 30 seconds: shell center alpha remained 255, 111 interpolated samples, face-loss/recovery exercised, no renderer errors. |
| Clean installation | Installer and uninstaller exited successfully; fresh profile loaded local tracking assets and configured its own OBS scene. |
| OBS recording | Final installer test decoded 60 frames at 1280×720 / 30 FPS, with no entirely black frames. |
| Virtual camera | Two post-fix native OBS Virtual Camera captures returned non-black 1280×720 shell images. No physical face camera was used in this test. |
| External renderer requests | None observed during the fresh-installed application test. |

The CPU sample (~15.84 seconds) measured all EggLive processes against total system capacity: ~4.19%. OBS, games, and stream/recording encoding were excluded from that figure. Input was a prerecorded synthetic-motion fixture, reference-eye mode was enabled, and one OBS viewer was connected. Render ~29 FPS, tracking ~15 FPS, encoded video ~30 FPS.

## What has not been established

- Accurate live facial tracking on every USB webcam, lens, lighting setup, or pair of glasses.
- A guarantee of removing glare while reconstructing the exact hidden live eye.
- Matching CPU/GPU figures on other systems or during a full game stream.
- Real gaze and all small eye-area expressions in reference mode.
- Linux/macOS installer support, arbitrary virtual-camera drivers, or transparent virtual-camera output.

The public demo uses an AI-generated portrait and scripted motion. It demonstrates EggLive's renderer; it is not a disguised personal camera recording or a live tracking benchmark. The source smoke test similarly validates code paths with synthetic input, while real hardware tests remain manual.

## Research behind the glare option

We reviewed the [official CVPR 2022 portrait eyeglasses-removal implementation](https://github.com/StoryMY/take-off-eyeglasses), [ERRNet](https://github.com/Vandermode/ERRNet), [EyeglassFilter](https://github.com/longyan97/EyeglassFilter), and [PDPrior](https://github.com/THUHoloLab/PDPrior). They cover different settings: still-image restoration, generic reflection separation, privacy blur, and polarized inputs. Their existence is not evidence that a ready-made model meets this app's ordinary USB-camera, low-CPU, temporal-stability requirements.

EggLive does not ship their models or claim to reproduce those papers. The clean-eye mode is an independently implemented, transparent tradeoff: capture the user's uncovered eyes and animate those local references instead of trying to recover saturated pixels every frame.
