---
title: nodejs/package.cjs.json
description: A package.json fragment that marks a build output folder as CommonJS.
---

`@repobuddy/typescript/nodejs/package.cjs.json` is a `package.json` fragment that sets `"type": "commonjs"`. Copy it
into a CommonJS build's output folder as `package.json`.

## Content

```json
{
	"type": "commonjs"
}
```

## Usage

The package exports it under `./nodejs/*`, so you can resolve it by name:

```sh
node -e "console.log(require.resolve('@repobuddy/typescript/nodejs/package.cjs.json'))"
```

Two commands copy it for you:

- [`buddy ts build cjs`](/repobuddy/typescript/cli/build/) runs `tsc` and then copies it to `cjs/package.json`.
- [`buddy ts copy-cjs-package-json <dir> [cwd]`](/repobuddy/typescript/cli/copy-cjs-package-json/) copies it to
  `<cwd>/<dir>/package.json`.

## Behavior

- Node.js reads `.js` files by the `type` field of the nearest `package.json`. In a package whose root `package.json`
  has `"type": "module"`, a `cjs/package.json` with `"type": "commonjs"` makes Node.js load the `.js` files under
  `cjs/` as CommonJS.
- The file has no other fields, so it does not change the package's name, version, or `exports`.

## Related

- [Build CommonJS and ESM from one package](/repobuddy/typescript/guides/dual-cjs-esm-build/)
- [`modules/buddy-commonjs`](/repobuddy/typescript/tsconfig/modules/#modulesbuddy-commonjs)
