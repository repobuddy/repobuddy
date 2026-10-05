---
title: Build CommonJS and ESM from one package
description: Emit an ESM build and a CommonJS build from one TypeScript source tree with buddy ts build.
---

This guide builds `esm/` and `cjs/` from the same `src/`, and publishes both through `exports`. It uses
[`buddy ts build`](/repobuddy/typescript/cli/build/), which runs `tsc` and marks `cjs/` as CommonJS with
[`package.cjs.json`](/repobuddy/typescript/nodejs-package-cjs-json/).

## Steps

1. Install the packages:

   ```sh
   pnpm add -D typescript repobuddy @repobuddy/typescript
   ```

2. Enable the plugin. Add a `repobuddy` property to `package.json`, or create a `.repobuddy.json` with the same
   content:

   ```json
   {
   	"repobuddy": {
   		"plugins": ["@repobuddy/typescript"]
   	}
   }
   ```

3. Set `"type": "module"` in `package.json`, so Node.js reads `esm/*.js` as ESM.

4. Create the base `tsconfig.json`. It holds the ESM settings:

   ```json
   {
   	"extends": "@repobuddy/typescript/tsconfig/monorepo",
   	"compilerOptions": {
   		"outDir": "esm",
   		"rootDir": "src"
   	},
   	"include": ["src"]
   }
   ```

5. Create `tsconfig.esm.json`. `buddy ts build esm` reads this file name:

   ```json
   {
   	"extends": "./tsconfig.json"
   }
   ```

6. Create `tsconfig.cjs.json`. List [`modules/buddy-commonjs`](/repobuddy/typescript/tsconfig/modules/#modulesbuddy-commonjs)
   after the base config so its `module: CommonJS` wins. Set `outDir` to `cjs`, because the command copies
   `package.json` into a folder named after the build type:

   ```json
   {
   	"extends": ["./tsconfig.json", "@repobuddy/typescript/tsconfig/modules/buddy-commonjs"],
   	"compilerOptions": {
   		"outDir": "cjs"
   	}
   }
   ```

7. Point `exports` at both builds and add a build script:

   ```json
   {
   	"exports": {
   		".": {
   			"import": {
   				"types": "./esm/index.d.ts",
   				"default": "./esm/index.js"
   			},
   			"require": {
   				"types": "./cjs/index.d.ts",
   				"default": "./cjs/index.js"
   			}
   		}
   	},
   	"files": ["cjs", "esm"],
   	"scripts": {
   		"build": "buddy ts build esm && buddy ts build cjs"
   	}
   }
   ```

8. Run the build:

   ```sh
   pnpm build
   ```

   ```
   building esm...
   build esm done
   building cjs...
   copying package.json...
   build cjs done
   ```

## Finished files

```json
// package.json
{
	"name": "my-lib",
	"version": "1.0.0",
	"type": "module",
	"exports": {
		".": {
			"import": {
				"types": "./esm/index.d.ts",
				"default": "./esm/index.js"
			},
			"require": {
				"types": "./cjs/index.d.ts",
				"default": "./cjs/index.js"
			}
		}
	},
	"files": ["cjs", "esm"],
	"scripts": {
		"build": "buddy ts build esm && buddy ts build cjs"
	},
	"repobuddy": {
		"plugins": ["@repobuddy/typescript"]
	}
}
```

`tsconfig.json`, `tsconfig.esm.json`, and `tsconfig.cjs.json` are as in steps 4 to 6.

## Verify

1. Check that `cjs/package.json` exists and contains `{ "type": "commonjs" }`.
2. From another project that installs the package, load it both ways:

   ```sh
   node -e "console.log(require('my-lib'))"
   node --input-type=module -e "import * as m from 'my-lib'; console.log(m)"
   ```

   Both print the package's exports.

## Variations

- **Helpers from `tslib`:** add `tsconfig.tslib.json` that extends `tsconfig.cjs.json` and sets
  `"importHelpers": true` and `"outDir": "tslib"`. Run `buddy ts build tslib`. The package needs `tslib` as a
  dependency. `testcases/build-ts` in this repository does this.
- **Another CommonJS build tool:** if a bundler writes `cjs/`, skip `buddy ts build cjs` and run
  [`buddy ts cpj cjs .`](/repobuddy/typescript/cli/copy-cjs-package-json/) after it. This repository's `packages/jest`
  bundles `cjs/index.js` with esbuild, emits only declarations with `tsc -p tsconfig.cjs.json`
  (`emitDeclarationOnly`), and then copies its own `package.cjs.json` to `cjs/package.json`.

## Related

- [`buddy ts build`](/repobuddy/typescript/cli/build/)
- [`modules/buddy-commonjs`](/repobuddy/typescript/tsconfig/modules/#modulesbuddy-commonjs)
- [`nodejs/package.cjs.json`](/repobuddy/typescript/nodejs-package-cjs-json/)
