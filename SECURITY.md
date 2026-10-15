# Security

Please do not publish exploit details, tokens, OBS passwords, stream keys, or personal camera data in a public issue.

Report vulnerabilities through this repository's private GitHub vulnerability reporting page when available. If it is unavailable, open an issue that states only that a private security contact is needed; omit reproduction details until a private channel is established.

The loopback avatar output is intended for trusted local applications. Do not expose its port to the public internet. Camera permissions and the first virtual-camera driver installation remain under Windows control.

There is no promised response-time SLA. The latest release is the current maintenance target.

The 1.6.1 source lockfile has no reported production-dependency advisories in its publication-time npm audit. Some development/build-tool transitive dependencies still have moderate/low advisories; this is not a claim that every dependency is vulnerability-free. Review `npm audit` before building and downloading new third-party packages.
