# Contributing

Thanks for helping improve EggLive. Small, focused changes with a clear before/after are welcome.

1. Follow [building.md](docs/building.md) to prepare local assets.
2. Run `npm test` and `npm run test:smoke` for code changes.
3. For tracking/output changes, report whether you tested a real webcam, OBS, and virtual camera. Include the OS, camera model, quality setting, CPU, GPU, and driver version where relevant.
4. Describe the actual behavior and limitations. Do not claim an unmeasured performance gain or universal glare removal.

Use the existing JavaScript/Electron/Three.js stack unless a change has a concrete reason to add a dependency. Changes that add per-frame CPU work should include a realistic measurement with hardware and sampling duration.

Never commit personal webcam footage, clean-eye references, localStorage profiles, OBS configuration, passwords, stream keys, or user filesystem paths. Use the synthetic demonstration portrait for shareable reproduction cases. Ask permission before including somebody else's face or voice in an Issue or PR.

By submitting a contribution, you agree to license your original contribution under this project's MIT license. Preserve third-party licenses and document added assets and dependencies.
