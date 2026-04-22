---
"@repobuddy/test": patch
---

Fix `isRunningInVitest()` to also detect the `__vitest_worker__` global, ensuring vitest is correctly identified in non-browser (node/worker) environments.
