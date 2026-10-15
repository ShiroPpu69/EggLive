# Changelog

## 1.6.1 — Public source release

- Publish the original Electron/Three.js avatar implementation under MIT, with separate third-party notices.
- Add English/Chinese documentation, a privacy-safe synthetic demo, OBS guidance, source asset preparation, and Windows CI checks.
- Update `ws` to 8.22.0, Vite to 7.3.7, and Electron Packager to 20.3.0. Publication-time npm audit reports no production-dependency advisories; development transitive advisories are documented in SECURITY.md.
- Add an optional CPU tracking backend for CI and driver troubleshooting. Normal launches continue to prefer GPU.

Includes the 1.6 features: personal clean-eye reference animation, matched-frame facial crops, smoothed pose and brief detection-gap handling, 30 FPS output, and improved OBS WebRTC signaling/reconnection.

Clean-eye mode substitutes the user's captured uncovered-eye images; it does not reconstruct exact live gaze or fully recover eyes hidden by lens glare. Demo images use a fictional AI-generated face and scripted motion.
