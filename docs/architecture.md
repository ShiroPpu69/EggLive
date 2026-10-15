# Architecture & privacy

## Runtime

`main.cjs` owns the Electron window, loopback HTTP/WebSocket server, filesystem saves, OBS launch, and authenticated OBS control. `preload.cjs` exposes a narrow IPC bridge. The renderer runs `src/app.js`, `src/avatar.js`, `src/eye-reference.js`, `src/tracker.js`, and `src/transport.js`.

The worker loads the bundled MediaPipe Face Landmarker in VIDEO mode with one face and transformation matrices. It tries GPU inference and falls back to CPU. Blendshape output is disabled in this low-CPU configuration; ordinary expressions are conveyed by the real eye/mouth images.

Each inference request transfers a fresh `ImageBitmap`. The worker returns the same bitmap with its landmarks. The avatar owns two paired images for interpolation and closes superseded bitmaps. Head pose has bounds, outlier rejection, smoothing, and spring motion. A short detection gap holds the current face; a longer gap fades the features out.

The Three.js renderer builds the shell procedurally. Curved eye/mouth patches sample the matched images, with roll compensation and feathered edges. The optional reference-eye atlas replaces eye-image sampling with the user's own stored open/closed eye crops; landmark opening controls the blend. It does not reconstruct live gaze.

## Output

The producer packs RGB and alpha side by side in a canvas-captured WebRTC video stream. OBS' browser source reconstructs the transparency in a WebGL shader. H.264 is preferred, with actual encoder choice determined by Chromium and the system. A 30 FPS cap bounds rendering/output, and no viewer means no outbound video encoding.

ICE candidates gathered before the producer sends its offer are queued and flushed afterward. The receiver also queues candidates while applying the remote description. A stalled viewer reconnects instead of remaining permanently blank.

## Data locations

- Camera frames and tracking results are processed locally in memory.
- Personal eye references are a small PNG atlas plus opening calibration, stored in the Electron profile's localStorage. The app's delete control removes those saved reference keys and clears the active atlas.
- User settings and diagnostic logs live in the Electron user-data directory.
- App recordings go to the Windows Videos folder; OBS manages its own recording settings.
- OBS configuration and its randomly generated local WebSocket password live under the portable OBS config directory. Never commit or share that directory.

EggLive does not implement telemetry, cloud inference, account login, or uploads of camera images. Runtime assets are local. Downloading the app/dependencies and first-time source asset setup use network access. OBS and other third-party programs have their own behavior; a user-configured livestream naturally transmits the OBS program output to that platform.

## Local boundary

The app server binds only to `127.0.0.1:18739`; WebRTC is configured without STUN/TURN servers. The avatar viewer is intended for local OBS/browser clients. Other applications on the same computer can access the loopback avatar output. Do not port-forward or publicly proxy it. The producer channel uses a per-run token; OBS control uses its generated password on local port `4457`.

## Scope

This is a desktop egg avatar, not a general face-swap system, VRM rig exporter, or universal eyeglass-removal model. The camera and GPU compatibility surface needs broader testing. Read the reported measurements as measurements, not hardware-independent guarantees.
