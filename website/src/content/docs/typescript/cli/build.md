---
title: buddy ts build
description: Runs tsc for one build type and marks CommonJS output folders with a package.json.
---

`buddy ts build <type>` runs `tsc -p tsconfig.<type>.json` in the current directory. For `cjs` and `tslib` it then
copies [`package.cjs.json`](/repobuddy/typescript/nodejs-package-cjs-json/) to `<type>/package.json`.

## Usage

```sh
buddy ts build <type>
```

Requires the [plugin to be enabled](/repobuddy/typescript/cli/#enable-the-plugin).

## Arguments

| Argument | Type | Default | Effect |
| --- | --- | --- | --- |
| `type` | `cjs`, `esm`, or `tslib` | required | Picks the tsconfig file `tsconfig.<type>.json` and, for `cjs` and `tslib`, the output folder `<type>/` that receives `package.json`. |

The command has no flags.

## Output

On success it prints:

```
building cjs...
copying package.json...
build cjs done
```

For `esm`, the `copying package.json...` line is absent.

## Exit codes

| Code | When |
| --- | --- |
| `0` | `tsc` succeeded and, for `cjs` and `tslib`, the copy succeeded. |
| `1` | `tsc` failed (the error, with `tsc`'s output, is printed as an uncaught `ExecaError`), or the output folder does not exist for the copy. |
| `2` | `type` is missing (`missing required argument <type>`) or is not one of the three values (`invalid value for argument <type>`). |

## Behavior

- It runs `tsc` from `PATH`, not from a resolved TypeScript install. Package scripts, `pnpm exec`, and `npx` put the
  project's `node_modules/.bin` on `PATH`.
- `tsc` output is captured. On success none of it is printed.
- It copies to `./<type>/package.json` relative to the current directory. Set the tsconfig's `outDir` to `cjs` or
  `tslib` so the copy lands next to the emitted files. With another `outDir`, `tsc` emits there and the copy then
  fails with `ENOENT` (exit code `1`) because `<type>/` does not exist.
- It overwrites an existing `<type>/package.json`.
- `esm` only runs `tsc`. It writes no `package.json`.
- `tslib` is a name only. The command does not add `importHelpers`. Set it in `tsconfig.tslib.json`.

## Examples

`testcases/build-ts` in this repository builds both CommonJS variants with these scripts:

```json
{
	"scripts": {
		"test:cjs": "buddy ts build cjs",
		"test:tslib": "buddy ts build tslib"
	}
}
```

```jsonc
// tsconfig.cjs.json
{
	"extends": ["./tsconfig.json", "@repobuddy/typescript/tsconfig/modules/buddy-commonjs.json"],
	"compilerOptions": {
		"outDir": "cjs"
	}
}
```

```jsonc
// tsconfig.tslib.json
{
	"extends": "./tsconfig.cjs.json",
	"compilerOptions": {
		"importHelpers": true,
		"outDir": "tslib"
	}
}
```

After `buddy ts build cjs`, `cjs/` holds `index.js`, `index.js.map`, `index.d.ts`, `index.d.ts.map`, and a
`package.json` with `{ "type": "commonjs" }`.

Building `esm` without a `tsconfig.esm.json` exits with code `1`:

```
building esm...
ExecaError: Command failed with exit code 1: tsc -p tsconfig.esm.json

error TS5058: The specified path does not exist: '<cwd>/tsconfig.esm.json'.
```

## Related

- [`buddy ts copy-cjs-package-json`](/repobuddy/typescript/cli/copy-cjs-package-json/)
- [Build CommonJS and ESM from one package](/repobuddy/typescript/guides/dual-cjs-esm-build/)
- [CLI plugin](/repobuddy/typescript/cli/)
