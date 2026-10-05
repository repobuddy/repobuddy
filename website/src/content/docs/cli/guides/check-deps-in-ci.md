---
title: Check Jest dependencies in CI
description: Fail a build when the Jest config or its preset uses a package that package.json does not declare.
---

A Jest preset names packages, such as transformers and watch plugins, that your project has to install. When one is
missing, Jest fails, or it finds a copy that another package pulled in and the next install removes.
`buddy check-deps` exits `1` in that case, so it can stop a build.

`check-deps` is a command you run. It is not an install hook.

## Steps

1. Install `repobuddy`.

   ```sh
   pnpm add -D repobuddy
   ```

2. Run the check once and install what it reports.

   ```sh
   pnpm exec buddy check-deps
   ```

   ```
   missing dependencies: 2 used by jest.config.mjs but not declared in package.json
     jest-esm-transformer-2  preset(@repobuddy/jest/presets/ts) transform
     ts-jest                 preset(@repobuddy/jest/presets/ts) transform
   install: npm i -D jest-esm-transformer-2 ts-jest
   ```

   The install line uses the `packageManager` field of `package.json`. Add that field to get a `pnpm add -D`,
   `yarn add -D`, or `bun add -d` line.

3. Run it again until it prints `all declared in package.json`. A preset can ask for different packages once
   others are installed.

4. Add a script for it in `package.json`.

   ```json
   {
   	"scripts": {
   		"check-deps": "buddy check-deps"
   	}
   }
   ```

5. Run the script in CI, before the tests.

   ```yaml
   - run: pnpm install --frozen-lockfile
   - run: pnpm check-deps
   - run: pnpm test
   ```

6. In a workspace, check each package that has a Jest config.

   ```yaml
   - run: pnpm exec buddy check-deps --cwd packages/app
   - run: pnpm exec buddy check-deps --cwd packages/lib
   ```

   A package with no Jest config passes with `dependencies: no jest configuration found, nothing to check`.

## Run it before tests on your machine

To run it before every local test run, name it `pretest` instead of `check-deps`. npm runs a `pretest` script before
`test`. Check that your package manager runs `pre` scripts before you rely on this.

## Verify

1. Remove a package that the check reported from `devDependencies`.
2. Run `pnpm check-deps`. It lists the package and exits `1`.
3. Put the package back. The check prints `all declared in package.json` and exits `0`.

## Related

- [`buddy check-deps` reference](/repobuddy/cli/check-deps/)
- [`@repobuddy/jest`](/repobuddy/jest/)
