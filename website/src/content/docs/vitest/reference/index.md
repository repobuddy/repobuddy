---
title: Reference
description: Every preset, config export, and setup file in @repobuddy/vitest.
---

| Name | Purpose |
| --- | --- |
| [`nodeTestPreset()`](/repobuddy/vitest/reference/node-test-preset/) | Vite plugin that configures Vitest for Node.js or a simulated DOM |
| [`browserTestPreset()`](/repobuddy/vitest/reference/browser-test-preset/) | Vite plugin that configures Vitest browser mode with Playwright |
| [`buddyConfigDefaults`](/repobuddy/vitest/reference/buddy-config-defaults/) | The globs and `test` settings both presets use |
| [`mergeConfig()`](/repobuddy/vitest/reference/merge-config/) | Vitest's `mergeConfig`, typed to return `base & overrides` |
| [`@repobuddy/vitest/setup/order`](/repobuddy/vitest/reference/setup-order/) | Setup file that adds `expect.order` |
| [`@repobuddy/vitest/setup/browser`](/repobuddy/vitest/reference/setup-browser/) | Setup file `browserTestPreset()` adds: reports the time zone as `GMT` |
| [Entry points](/repobuddy/vitest/reference/entry-points/) | Every import path and what it exports |
| [Test file names](/repobuddy/vitest/reference/test-file-names/) | Which file names each preset runs, and the exact globs |
