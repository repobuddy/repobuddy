---
title: buddy ts copy-cjs-package-json
description: Copies package.cjs.json into a CommonJS build's output folder as package.json.
---

`buddy ts copy-cjs-package-json <dir> [cwd]` copies [`package.cjs.json`](/repobuddy/typescript/nodejs-package-cjs-json/)
to `<cwd>/<dir>/package.json`. Use it after a CommonJS build step that `buddy ts build` does not run, such as esbuild.

## Usage

```sh
buddy ts copy-cjs-package-json <dir> [cwd]

# alias
buddy ts cpj <dir> [cwd]
```

Requires the [plugin to be enabled](/repobuddy/typescript/cli/#enable-the-plugin).

## Arguments

| Argument | Type | Default | Effect |
| --- | --- | --- | --- |
| `dir` | string | required | The output folder of the CommonJS build, relative to `cwd`. |
| `cwd` | string | `process.cwd()` | The project directory. |

The command has no flags.

Before `@repobuddy/typescript` 2.2.2, the CLI treated `cwd` as required: `buddy ts cpj cjs` exited with code `2`
and `missing required argument <cwd>`. On those versions, pass `.` for the current directory.

## Output

```
copy-cjs-package-json: starts...
copy-cjs-package-json: completed
```

## Exit codes

| Code | When |
| --- | --- |
| `0` | The file was copied. |
| `1` | `<cwd>/<dir>` does not exist (`ENOENT`, printed as an uncaught error). |
| `2` | `dir` is missing. |

## Behavior

- It does not create `<dir>`. Run it after the build that creates the folder.
- It overwrites an existing `<dir>/package.json`.

## Examples

Copy into `cjs/` in the current directory:

```sh
buddy ts cpj cjs
```

Copy into another project's output folder:

```sh
buddy ts copy-cjs-package-json out ../my-package
```

This writes `../my-package/out/package.json` with `{ "type": "commonjs" }`.

## Related

- [`buddy ts build`](/repobuddy/typescript/cli/build/)
- [Build CommonJS and ESM from one package](/repobuddy/typescript/guides/dual-cjs-esm-build/)
