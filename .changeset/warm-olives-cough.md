---
'@repobuddy/jest': major
---

Drop electron support as the underlying package (`@kayahr/jest-electron-runner`) is not maintained anymore.

The electron tests cause the test to hang indefinitely with `turbo`.