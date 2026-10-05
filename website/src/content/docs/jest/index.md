---
title: '@repobuddy/jest'
description: Jest presets for TypeScript and JavaScript, ESM and CommonJS, Node.js and jsdom, plus the config pieces they are built from.
---

`@repobuddy/jest` replaces a hand-written Jest config with one `preset` line. Pick the preset that matches the
language, the module format, and the test environment of the project. The package also exports the pieces each preset
is built from, a `toSatisfies` matcher, and a function that lists the packages a Jest config needs.

## Install

```sh
# npm
npm install -D @repobuddy/jest

# yarn
yarn add -D @repobuddy/jest

# pnpm
pnpm add -D @repobuddy/jest

# rush
rush add -p @repobuddy/jest --dev
```

Then install the peers your preset needs:

| Package | Peer range | Optional peer | Needed by |
| --- | --- | --- | --- |
| `jest` | `>=29.5.0` | no | every preset |
| `@swc/jest` | `^0.2.31` | no | `ts-esm`, `jsdom-ts-esm`, and `ts` / `jsdom-ts` in an ESM package |
| `ts-jest` | `^29` | yes | `ts-cjs`, `jsdom-ts-cjs`, and `ts` / `jsdom-ts` in a CommonJS package |
| `jest-esm-transformer-2` | `^1` | yes | `ts-cjs`, `jsdom-ts-cjs`, `js-cjs` |
| `jest-watch-suspend` | `^1 \|\| ^2` | yes | `watch` and every `-watch` preset |
| `jest-watch-toggle-config` | `^3` | yes | `watch` and every `-watch` preset |
| `jest-watch-typeahead` | `^3.0.0` | yes | `watch` and every `-watch` preset |
| `identity-obj-proxy` | `^3.0.0` | yes | [`fields.knownModuleNameMappers.cssAll`](/repobuddy/jest/api/fields/#knownmodulenamemappers) only |

`@swc/jest` itself needs `@swc/core` (its own peer dependency). The jsdom presets also need `jest-environment-jsdom`,
which `@repobuddy/jest` does not declare. Each preset page lists the exact packages it references.

To list what a config needs, run [`buddy check-deps`](/repobuddy/cli/check-deps/) or call
[`extract.extractPackages()`](/repobuddy/jest/api/extract/#extractpackages).

## Use a preset

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/ts-watch',
}
```

ESM presets need Jest's ESM support. Run Jest with `NODE_OPTIONS=--experimental-vm-modules`, as the
[TypeScript with ESM guide](/repobuddy/jest/guides/typescript-esm/) shows.

## Choose a preset

| Language | Module format | Environment | Preset | Transform |
| --- | --- | --- | --- | --- |
| TypeScript | from `package.json` `type` | Node.js | [`ts`](/repobuddy/jest/presets/ts/) | as `ts-esm` or `ts-cjs` |
| TypeScript | ESM | Node.js | [`ts-esm`](/repobuddy/jest/presets/ts-esm/) | `@swc/jest` |
| TypeScript | CommonJS | Node.js | [`ts-cjs`](/repobuddy/jest/presets/ts-cjs/) | `ts-jest`, `jest-esm-transformer-2` for JS |
| JavaScript | ESM | Node.js | [`js-esm`](/repobuddy/jest/presets/js-esm/) | Jest's default (`babel-jest`) |
| JavaScript | CommonJS | Node.js | [`js-cjs`](/repobuddy/jest/presets/js-cjs/) | `jest-esm-transformer-2` |
| TypeScript | from `package.json` `type` | jsdom | [`jsdom-ts`](/repobuddy/jest/presets/jsdom-ts/) | as `jsdom-ts-esm` or `jsdom-ts-cjs` |
| TypeScript | ESM | jsdom | [`jsdom-ts-esm`](/repobuddy/jest/presets/jsdom-ts-esm/) | `@swc/jest` |
| TypeScript | CommonJS | jsdom | [`jsdom-ts-cjs`](/repobuddy/jest/presets/jsdom-ts-cjs/) | `ts-jest`, `jest-esm-transformer-2` for JS |
| any | any | any | [`watch`](/repobuddy/jest/presets/watch/) | none: watch plugins only, for the root of a multi-project config |

Every preset except `watch` has a `-watch` variant (`ts-watch`, `jsdom-ts-cjs-watch`, and so on) that adds five watch
plugins. See [`watch`](/repobuddy/jest/presets/watch/) for the list. The [presets index](/repobuddy/jest/presets/)
has every name.

## Support

| Area | Support | Source |
| --- | --- | --- |
| Jest | `jest >=29.5.0` (peer). This repository tests with Jest 30. | `packages/jest/package.json` |
| Node.js | No `engines` field. Node-version test files cover Node.js 14 up to the running major. | `packages/jest/src/configs/node.ts` |
| Package format | ESM (`esm/`) and CommonJS (`cjs/`) builds of every entry. | `packages/jest/package.json` `exports` |
| Project module format | ESM (`-esm` presets) and CommonJS (`-cjs` presets). `ts` and `jsdom-ts` choose from `package.json` `type`. | `packages/jest/src/presets/` |
| Environments | `node` (node and js presets) and `jsdom` (jsdom presets). | `packages/jest/src/configs/node.ts`, `jsdom.ts` |
| TypeScript transforms | `@swc/jest` for ESM, `ts-jest` with `isolatedModules: true` for CommonJS. `ts-jest` for ESM through [`fields.knownTransforms.tsJestEsm()`](/repobuddy/jest/api/fields/#knowntransformstsjestesm). | `packages/jest/src/configs/typescript.ts`, `src/fields/transform.ts` |
| ESM dependencies in CommonJS | `jest-esm-transformer-2` with `transformIgnorePatterns: []` transforms ESM packages in `node_modules`. | `packages/jest/src/configs/typescript.ts`, `javascript.ts` |
| Source folder | First of `src`, `source`, `ts`, `js` that exists in the working directory; `src` otherwise. | `packages/jest/src/configs/source.ts` |
| Monorepo | Run Jest in each package, or use `projects` with one preset per project and [`watch`](/repobuddy/jest/presets/watch/) at the root. Detection runs in the working directory: see the [monorepo guide](/repobuddy/jest/guides/monorepo/). | `packages/jest/src/presets/watch/jest-preset.ts` |

## Not supported

- JavaScript in jsdom. Every jsdom preset is a TypeScript preset. Compose `configs.jsdom` with `configs.jsEsm` or
  `configs.jsCjs` yourself (see [customize a preset](/repobuddy/jest/guides/customize/)).
- Other environments, such as `happy-dom` or a real browser. The package knows only `node` and `jsdom`.
- A Babel preset. No preset configures Babel. `js-esm` sets no `transform`, so Jest's default `babel-jest` stays in
  place.
- `ts-jest` for ESM as a preset. The ESM presets use `@swc/jest`. Build the `ts-jest` variant from `configs` and
  `fields`.
- Per-project detection in a multi-project config. Each preset reads the source folder and `package.json` `type`
  from the directory Jest runs in, not from each project's `rootDir`.
- A `@repobuddy/jest/resolver` entry. The resolver is reachable only as `resolver` from the main entry (see
  [`resolver`](/repobuddy/jest/api/resolver/)).
- Load tests in the jsdom presets. `*.load.*` files run only through [`configs.nodeLoad`](/repobuddy/jest/api/configs/#nodeload).

## Next steps

- Guides: [TypeScript with ESM](/repobuddy/jest/guides/typescript-esm/),
  [TypeScript with CommonJS](/repobuddy/jest/guides/typescript-cjs/), [DOM tests with jsdom](/repobuddy/jest/guides/jsdom/),
  [monorepo](/repobuddy/jest/guides/monorepo/), [load tests](/repobuddy/jest/guides/load-tests/),
  [customize a preset](/repobuddy/jest/guides/customize/).
- Reference: [presets](/repobuddy/jest/presets/), [API](/repobuddy/jest/api/),
  [test file names](/repobuddy/jest/reference/test-file-names/).
