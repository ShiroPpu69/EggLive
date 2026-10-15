# Building EggLive

## Development

Windows 10/11 x64, Git, and Node.js 22.12+ are the supported development path. The end-user installer needs none of these tools.

```powershell
npm ci
npm run setup
npm run build
npm start
```

`setup` copies the pinned MediaPipe runtime and WASM files from `node_modules`, downloads the face model, verifies its SHA256, and prepares third-party notices for packaging. The CC0 HDRI is tracked in the repository. No personal references or camera captures are required to build.

Runtime assets are loaded locally after setup. Development dependencies and first-time asset downloads require network access.

## Optional official OBS bundle

```powershell
npm run setup -- --with-obs
```

This downloads and verifies the official OBS Studio 32.2.2 Windows x64 ZIP, extracts it under `OBS/`, and enables portable configuration. Windows' built-in `tar` must be available. Existing OBS configuration is not committed to Git or included in the installer.

The generated model/runtime files, OBS distribution, downloaded archives, development profiles, and release output are all Git-ignored.

## Portable application and Windows installer

```powershell
npm run setup -- --with-obs --with-runtime
npm run build
npm run package -- --icon=public/egg.ico
npm run installer
```

`--with-runtime` downloads Microsoft's current official v14 redistributable and checks the Authenticode signer on Windows. This download is intentionally not pinned because Microsoft updates the permalink. Before publishing, inspect its signature and file version; the installer currently checks for an x64 runtime with minor version 51 or newer. Original 1.6 binary runtime SHA256: `843068991daaa1f73ad9f6239bce4d0f6a07a51f18c37ea2a867e9beca71295c`.

Portable app output: `release/EggLive-win32-x64/`. Keep the prepared `OBS/` directory in a location accepted by `obsRoot()` in `main.cjs` (alongside the executable, or alongside its parent portable app folder). The installer automatically includes OBS in the correct layout.

Installer output: `installers/EggLive-Setup-<version>-x64.exe`. A rebuilt installer may have a different byte hash from a previously published binary; NSIS and packaging metadata are not a claim of reproducible byte-for-byte builds. Published releases are unsigned; SHA256 checksums identify the exact downloadable files.

## Pinned external assets

| Asset | SHA256 |
|---|---|
| Google Face Landmarker float16 v1 | `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff` |
| Poly Haven Studio Small 03 1K HDRI | `30933d55e45f0795daf49f3cbefbe0e5ebcb821ee04fb0a2818c02ffc3938817` |
| Official OBS 32.2.2 Windows x64 ZIP | `4d6e40e3ab155f56b30de517380566a206d74b63cdf5ad49aa596924768f97e1` |
| Official OBS 32.2.2 source archive | `ec81fb66b03e75ddb3076b576f62679c39262e0e9960cef3e17a40dc5d68e6b4` |

## Checks

```powershell
npm test
npm run test:smoke
```

The deterministic test exercises ICE-before-offer signaling order. The Electron smoke test loads the local model, detects the synthetic documentation portrait, renders the avatar, checks reference-eye isolation and persistence, and rejects unexpected external renderer requests. It uses a separate temporary app profile and does not require a real webcam or OBS.

Hardware tests remain necessary for camera permissions, USB formats, live expression accuracy, OBS capture/recording, and virtual-camera drivers. CI cannot certify those on every computer.

For driver troubleshooting or CI, set `EGGLIVE_TRACKING_BACKEND=CPU` before starting Electron to force CPU face inference. This is optional; normal launches prefer GPU with a CPU fallback. The smoke test forces CPU inference and software GL for repeatable automation; it is not a performance benchmark.
