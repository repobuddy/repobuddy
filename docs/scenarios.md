# Scenarios

## ESM

### Transform ESM dependencies

Using `jest-esm-transformer-2`.

- Doesn't work if the dependency contains ESM specific code such as `import.meta`.
- Need `esModuleInterop` to get the transformed code adjusted back for ESM usage.

Getting errors like:

```sh
SyntaxError: The requested module 'dirname-filename-esm' does not provide an export named 'filename'

SyntaxError: The requested module 'chalk' does not provide an export named 'default'
```

### Dogfooding locally

For some reason, even through `@repobuddy/jest` is an ESM package,

`jest` running it as CJS.

(this is likely a bug about the `exports` field from `jest`).

This means I need to just `jest-esm-transformer-2`,
which is included in `withChalk(..., 'cjs')`.

If not (calling `withChalk(...)` instead),
Will get the following error:

```sh
    /home/homa/code/repobuddy/jest/node_modules/.pnpm/strip-ansi@7.0.1/node_modules/strip-ansi/index.js:1
    ({"Object.<anonymous>":function(module,exports,require,__dirname,__filename,jest){import ansiRegex from 'ansi-regex';
                                                                                      ^^^^^^

    SyntaxError: Cannot use import statement outside a module
```
