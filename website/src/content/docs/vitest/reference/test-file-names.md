---
title: Test file names
description: Which test file names each preset runs, which files coverage counts, and the exact globs.
---

The presets pick test files by folder and by name. The globs live in
[`buddyConfigDefaults`](/repobuddy/vitest/reference/buddy-config-defaults/).

## Folders

Tests live under `src`, `source`, `code`, or `tests`, at the root of the Vitest project. Coverage counts source files
under `src`, `source`, or `code` only.

## Names

A test file is `<name>.<id>.<ext>` or `<name>.<id>.<platform>.<ext>`. `<id>` is one of `spec`, `test`, `unit`,
`accept`, `integrate`, `system`, `perf`, `stress`, or `study`. Load tests use `<name>.load.<ext>` instead.

| Kind | Example | Glob key | Run by |
| --- | --- | --- | --- |
| general | `a.spec.ts`, `a.unit.mjs` | `testGeneral` | either preset, with `includeGeneralTests: true` |
| Node.js | `a.spec.node.ts` | `testNode` | `nodeTestPreset()` |
| browser | `a.spec.browser.ts`, `a.spec.tsx` | `testBrowser` | `browserTestPreset()`, or `nodeTestPreset()` with `environment: 'jsdom'` or `'happy-dom'` |
| load | `a.load.ts` | `testLoad` | either preset, with `includeLoadTests: true` |

Rules the globs encode:

- A general test uses a `js`, `cjs`, `mjs`, `ts`, `cts`, or `mts` extension. A `.jsx` or `.tsx` test is a browser test.
- The platform segment starts with `node` or `browser`, so `a.spec.node.ts` and `a.spec.browser.ts` both match.
- A Node.js test cannot use `.jsx` or `.tsx`. A browser test with a `browser` segment can use any of the extensions.
- Load tests use `js`, `cjs`, `mjs`, `ts`, `cts`, or `mts`.

## Exact globs

```ts
// include.testGeneral
'{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.{js,cjs,mjs,ts,cts,mts}'

// include.testNode
'{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.node*.{js,cjs,mjs,ts,cts,mts}'

// include.testBrowser
'{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.{jsx,tsx}'
'{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.browser*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}'

// include.testLoad
'{src,source,code,tests}/**/*.load.{js,cjs,mjs,ts,cts,mts}'
```

## Coverage

Both presets set `test.coverage`:

```ts
// include.source → coverage.include
'{src,source,code}/**/*.{js,mjs,cjs,ts,jsx,tsx,cts,mts}'

// exclude.test → coverage.exclude
'**/*.{spec,test,unit,accept,integrate,system,perf,stress,study,load}.{js,jsx,cjs,mjs,ts,tsx,cts,mts}'
'**/*.{spec,test,unit,accept,integrate,system,perf,stress,study,load}.*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}'
'**/*.stories.{js,mjs,jsx,tsx}'
```

Coverage excludes test files, load files, and Storybook stories (`.js`, `.mjs`, `.jsx`, `.tsx` only).

## Related

- [`buddyConfigDefaults`](/repobuddy/vitest/reference/buddy-config-defaults/)
- [`nodeTestPreset()`](/repobuddy/vitest/reference/node-test-preset/)
- [`browserTestPreset()`](/repobuddy/vitest/reference/browser-test-preset/)
