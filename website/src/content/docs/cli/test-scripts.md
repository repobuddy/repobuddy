---
title: buddy test-scripts
description: Add or adjust the test, coverage, and test:watch scripts in package.json for Jest or Vitest.
---

`buddy test-scripts` adds or adjusts the `test`, `coverage`, and `test:watch` scripts in `package.json` for the
project's test runner.

## Usage

```sh
buddy test-scripts [--cwd <dir>] [--runner jest|vitest]
```

## Options

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `--cwd` | string | the current directory | The directory that holds the `package.json` to edit. |
| `--runner` | `jest` \| `vitest` | detected | The runner to write scripts for. Required when the project depends on both runners or on neither. |

The [global options](/repobuddy/cli/global-options/) also apply.

## Scripts it writes

| Script | Jest | Vitest |
| --- | --- | --- |
| `test` | `jest` | `vitest run` |
| `coverage` | `jest --coverage` | `vitest run --coverage` |
| `test:watch` | `jest --watch` | `vitest` |

## Runner detection

`buddy` reads `dependencies` and `devDependencies` of `package.json`.

- `jest` or `@repobuddy/jest` means Jest.
- `vitest` or `@repobuddy/vitest` means Vitest.

When it finds exactly one runner, it uses that runner. When it finds both or neither, it stops with exit code `1` and
asks for `--runner`. `--runner` always wins over detection.

## Behavior

Each of the three scripts gets one action:

- **added**: the script is missing. `buddy` writes the value from the table.
- **adjusted**: the script holds a value from the table, for either runner, that differs from the chosen runner's
  value. `buddy` replaces it. This is how a project that moved from Jest to Vitest picks up the new commands.
- **skipped**: the script already holds the chosen runner's value, or it holds any other value. Any other value is a
  customization, and `buddy` leaves it alone.

Other details:

- A second run changes nothing.
- `buddy` writes the file only when at least one script is added or adjusted.
- It keeps the file's indentation (tabs or spaces) and its trailing newline.
- It does not install the runner.

## Output

One line per script, then a summary when nothing changed:

```
added "test": jest
added "coverage": jest --coverage
added "test:watch": jest --watch
```

```
skipped "test": jest
skipped "coverage": jest --coverage
skipped "test:watch": jest --watch
the jest scripts are already what they should be
```

## Exit codes

| Code | When |
| --- | --- |
| `0` | The scripts were written, or were already correct. |
| `1` | No `package.json` in the directory, or the runner cannot be detected. |
| `2` | An unknown option, or a `--runner` value other than `jest` or `vitest`. |

## Examples

### Add Jest scripts

`package.json` before:

```json
{
	"name": "jest-app",
	"devDependencies": { "jest": "^30.0.0" }
}
```

```sh
buddy test-scripts
```

```
added "test": jest
added "coverage": jest --coverage
added "test:watch": jest --watch
```

### Switch from Jest to Vitest

A project depends on `@repobuddy/vitest` and still has the Jest scripts:

```json
{
	"devDependencies": { "@repobuddy/vitest": "^2.0.0" },
	"scripts": { "test": "jest", "coverage": "jest --coverage", "test:watch": "jest --watch" }
}
```

```
adjusted "test": jest -> vitest run
adjusted "coverage": jest --coverage -> vitest run --coverage
adjusted "test:watch": jest --watch -> vitest
```

### Keep a customized script

`"test": "vitest run --project unit"` is not a value from the table, so it stays:

```
skipped "test": vitest run --project unit
added "coverage": vitest run --coverage
added "test:watch": vitest
```

### A project with both runners

```sh
buddy test-scripts
```

```
cannot tell which test runner this project uses: it depends on jest and vitest
name the one the scripts are for with --runner jest|vitest
```

```sh
buddy test-scripts --runner vitest
```

### A directory with no package.json

```sh
buddy test-scripts --cwd nope
```

```
no package.json in nope
run this from the project directory, or point at it with --cwd
```

## Related

- [Set up test scripts](/repobuddy/cli/guides/test-scripts/)
- [`@repobuddy/jest`](/repobuddy/jest/)
- [`@repobuddy/vitest`](/repobuddy/vitest/)
