---
title: Test file names
description: Which file names the node and jsdom presets run as tests, and which they exclude from coverage.
---

The presets find tests by file name. A test file is `<name>.<id>.<ext>`, with optional environment parts between `<id>`
and `<ext>`. The node presets and the jsdom presets accept different environment parts.

## Identifiers

| Identifier list | Values | Runs by default |
| --- | --- | --- |
| [`defaultTestIdentifiers`](/repobuddy/jest/api/configs/#defaulttestidentifiers) | `spec`, `test`, `unit`, `accept`, `integrate`, `learning`, `system`, `perf`, `stress` | yes |
| [`loadTestIdentifiers`](/repobuddy/jest/api/configs/#loadtestidentifiers) | `load` | no, only through [`configs.nodeLoad`](/repobuddy/jest/api/configs/#nodeload) |

## Extensions

`js`, `jsx`, `cjs`, `mjs`, `ts`, `tsx`, `cts`, `mts`.

## Node presets

The `ts`, `ts-esm`, `ts-cjs`, `js-esm`, and `js-cjs` presets (and their `-watch` variants) set `testRegex` from
[`configs.configNode()`](/repobuddy/jest/api/configs/#confignode). They run:

| Pattern | Example | Runs |
| --- | --- | --- |
| `<name>.<id>.<ext>` | `feature.spec.ts` | always |
| `<name>.<id>.node.<ext>` | `feature.spec.node.ts` | always |
| `<name>.<id>.node<major>.<ext>` | `feature.spec.node18.ts` | when Jest runs on Node.js `<major>` or later |

The version list is built when the preset loads. It holds one entry for each major from 14 up to the running Node.js
major. A file for a later major, such as `feature.spec.node99.ts`, does not run.

Checked against the built `configs.node.testRegex`:

| File | Matches |
| --- | --- |
| `a.spec.ts` | yes |
| `a.learning.cts` | yes |
| `a.spec.node.ts` | yes |
| `a.spec.node18.ts` | yes (on Node.js 18 or later) |
| `a.spec.node18.js` | yes (on Node.js 18 or later) |
| `a.spec.node18.jsx` | no: the version patterns spell the extension `jtx` |
| `a.spec.node99.ts` | no |
| `a.spec.jsdom.ts` | no |
| `a.load.ts` | no |

The node presets also set `coveragePathIgnorePatterns` to skip every known test file, `load` included, with any
environment part.

## jsdom presets

The `jsdom-ts`, `jsdom-ts-esm`, and `jsdom-ts-cjs` presets (and their `-watch` variants) set `testMatch` from
[`configs.jsdom`](/repobuddy/jest/api/configs/#jsdom):

```js
'**/?*\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)?(.jsdom).(js|jsx|cjs|mjs|ts|tsx|cts|mts)'
```

Checked with `micromatch`, the glob library Jest uses for `testMatch`:

| File | Matches |
| --- | --- |
| `a.spec.ts` | yes |
| `a.test.tsx` | yes |
| `a.unit.mts` | yes |
| `a.spec.jsdom.ts` | yes |
| `a.spec.node.ts` | no |
| `a.spec.node18.ts` | no |
| `a.load.ts` | no |
| `a.jsdom.ts` | no |

The jsdom presets set no `coveragePathIgnorePatterns`. Jest itself skips files that match `testMatch` when it collects
coverage.

## Source folder

Every preset except `watch` limits `roots` and `collectCoverageFrom` to one source folder. See
[`configs.configSource()`](/repobuddy/jest/api/configs/#configsource).

## Related

- [Load tests guide](/repobuddy/jest/guides/load-tests/)
- [`configs`](/repobuddy/jest/api/configs/)
