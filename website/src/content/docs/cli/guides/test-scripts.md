---
title: Set up test scripts
description: Write the test, coverage, and test:watch scripts for Jest or Vitest with buddy test-scripts.
---

This guide writes the `test`, `coverage`, and `test:watch` scripts into `package.json` for Jest or Vitest.

## Steps

1. Install the test runner, or its repobuddy preset package. `buddy` detects the runner from either.

   ```sh
   # Jest
   pnpm add -D jest @repobuddy/jest

   # Vitest
   pnpm add -D vitest @repobuddy/vitest
   ```

2. Install `repobuddy`.

   ```sh
   pnpm add -D repobuddy
   ```

3. Run `buddy test-scripts` from the project directory.

   ```sh
   pnpm exec buddy test-scripts
   ```

   For a package in a workspace, run it from the root and name the package:

   ```sh
   pnpm exec buddy test-scripts --cwd packages/app
   ```

4. If the project depends on both runners, or on neither, name the runner.

   ```sh
   pnpm exec buddy test-scripts --runner vitest
   ```

5. Read the output. `added` and `adjusted` lines are changes. A `skipped` line with your own command means `buddy`
   kept a customized script.

## Result

For a Vitest project, `package.json` now holds:

```json
{
	"scripts": {
		"test": "vitest run",
		"coverage": "vitest run --coverage",
		"test:watch": "vitest"
	}
}
```

For Jest the values are `jest`, `jest --coverage`, and `jest --watch`.

## Verify

1. Run the command again. It prints `the vitest scripts are already what they should be` (or `jest`).
2. Run `pnpm test`.

## Move from Jest to Vitest

Run the command again after you switch runners. Scripts that still hold the Jest values from the table are
adjusted to the Vitest values. A script you changed by hand stays as it is.

## Related

- [`buddy test-scripts` reference](/repobuddy/cli/test-scripts/)
- [`@repobuddy/jest`](/repobuddy/jest/)
- [`@repobuddy/vitest`](/repobuddy/vitest/)
