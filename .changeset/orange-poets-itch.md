---
'@repobuddy/vitest': minor
---

Add `@repobuddy/vitest/config/node` and `@repobuddy/vitest/config/browser` exports.
`@repobuddy/vitest/config` exports requires `@vitest/browser-playwright` as peer dependency even if you are not using browser tests.
