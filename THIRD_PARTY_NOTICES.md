# Third-party notices

The MIT license at the repository root applies to EggLive's original application code. It does not replace licenses for the components and assets below.

| Component | Version / source | License / notice |
|---|---|---|
| Electron | 44.7.2 | MIT; [notice](licenses/electron.txt). Chromium and bundled components retain their notices in the Electron distribution. |
| Three.js | 0.180.0 | MIT; [notice](licenses/three.txt). |
| MediaPipe Tasks Vision | 0.10.32 | Apache-2.0; [notice](licenses/mediapipe.txt). Runtime files are copied from the pinned npm dependency during setup. |
| MediaPipe Face Landmarker model | Official float16 model bundle, version 1 | Distributed from [Google's model endpoint](https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task). See the [official model documentation and model cards](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker). Upstream terms apply; the model is not EggLive's original code. |
| ws | 8.22.0 | MIT; [notice](licenses/ws.txt). |
| OBS Studio | Official unmodified Windows x64 32.2.2 | GPL-2.0-or-later; [license](licenses/obs.txt). A separate executable, controlled through its public local WebSocket API. [Upstream release](https://github.com/obsproject/obs-studio/releases/tag/32.2.2), [corresponding official source archive](https://github.com/obsproject/obs-studio/releases/download/32.2.2/OBS-Studio-32.2.2-Sources.tar.gz). A byte-identical source archive is also attached to EggLive's binary release. Bundled OBS components retain their own accompanying notices. |
| Studio Small 03 HDRI | Greg Zaal / [Poly Haven](https://polyhaven.com/a/studio_small_03), 1K | [CC0](https://polyhaven.com/license). File: `public/lighting/studio_small_03_1k.hdr`. |
| Microsoft Visual C++ x64 runtime | Official Microsoft signed redistributable, included in the installer | Microsoft terms; not covered by EggLive's MIT license. [Official download and documentation](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist). |

The earlier 1.6 Windows binary also contains two unused historical shell texture files: an internally generated texture and Bicanski's CC0 egg-shell photograph from [Pixnio](https://pixnio.com/fr/textures-et-modeles/poulet-oeuf-details-image-coquille). The current renderer uses a procedural microtexture rather than these image files. These legacy textures are excluded from the public source checkout.

`docs/assets/demo-portrait.png` was generated for this project with an image-generation tool and represents a fictional adult. The hero and animation are actual EggLive renders using that synthetic input and scripted movement. They are documentation assets, not personal webcam data and not bundled avatar defaults. Their generation prompt and method are recorded in [asset provenance](docs/assets/README.md).

No proprietary TheBurntPeanut, Snapchat, or third-party commercial avatar/filter assets are included. Research links in the documentation do not imply those projects' code or model weights are bundled.
