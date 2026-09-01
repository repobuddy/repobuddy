---
'@repobuddy/vitest': patch
---

Annotate `browserTestPreset()` and `nodeTestPreset()` return types as vite's `Plugin`.

The return types were inferred structurally, so the emitted `.d.ts` leaked the whole config shape.
`test.browser.instances[].browser` is typed against vitest's augmentable `_BrowserNames` interface,
which resolved to `string` when the presets were built without a browser provider installed. In a
consumer project `@vitest/browser-playwright` augments `_BrowserNames`, `browser` narrows to the
provider's union, and `string` is no longer assignable — `browserTestPreset()` failed with TS2769
"No overload matches this call".

Annotating the return type keeps the emitted types independent of what is installed at build time.
Runtime behavior is unchanged.

Fixes https://github.com/repobuddy/repobuddy/issues/610
