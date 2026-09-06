---
'repobuddy': patch
---

`to-question`: derive the handoff file path instead of hardcoding `/tmp/question.md`.

The new bundled `scripts/question-path.mjs` resolves the OS temp directory (honoring `TMPDIR`/`TEMP`,
so it is correct on Linux, macOS, WSL and native Windows) and mints a fresh private `mkdtemp`
directory per session. Two users or two concurrent sessions on a shared machine can no longer collide
on the same world-readable filename.
