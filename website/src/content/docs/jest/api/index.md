---
title: API
description: The namespaces exported by the main entry of @repobuddy/jest, and the matchers entry.
---

The main entry exports six namespaces:

```ts
import { configs, extract, fields, matchers, presets, resolver } from '@repobuddy/jest'
```

```js
// CommonJS
const { configs, extract, fields, matchers, presets, resolver } = require('@repobuddy/jest')
```

| Namespace | What it holds | Page |
| --- | --- | --- |
| `configs` | The partial configs the presets are built from, and the test identifier lists | [`configs`](/repobuddy/jest/api/configs/) |
| `fields` | Values and helpers for single Jest config fields: transforms, mappers, watch plugins | [`fields`](/repobuddy/jest/api/fields/) |
| `extract` | `extractPackages()` and `toPackageName()`: list the packages a Jest config references | [`extract`](/repobuddy/jest/api/extract/) |
| `matchers` | The `toSatisfies` matcher | [`matchers`](/repobuddy/jest/api/matchers/) |
| `presets` | Every preset as a config object | [`presets`](/repobuddy/jest/api/presets/) |
| `resolver` | `sync` and `async`: a Jest resolver that falls back to `package.json` `imports` | [`resolver`](/repobuddy/jest/api/resolver/) |

## Other entries

| Entry | Exports |
| --- | --- |
| `@repobuddy/jest/matchers` | `toSatisfies`. See [`matchers`](/repobuddy/jest/api/matchers/). |
| `@repobuddy/jest/presets/<name>` | One preset as its default export. See [presets](/repobuddy/jest/presets/). |
| `@repobuddy/jest/presets/<name>/jest-preset` | The same preset, at the path Jest looks for. |
| `@repobuddy/jest/package.json` | The package manifest. |

Every entry has an `import` (ESM) and a `require` (CommonJS) build, each with type declarations. No other subpath is
exported, so `@repobuddy/jest/resolver` does not resolve.
