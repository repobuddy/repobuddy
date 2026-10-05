---
title: Configure a monorepo package
description: Set up a package's tsconfig in a monorepo with tsconfig/monorepo and project references.
---

This guide configures one package in a workspace with [`tsconfig/monorepo`](/repobuddy/typescript/tsconfig/monorepo/),
and references another workspace package so `tsc --build` compiles them in order.

## Steps

1. Add the package to the workspace package you are configuring:

   ```sh
   pnpm add -D typescript @repobuddy/typescript
   ```

2. Create `tsconfig.json` in the package. Extend the preset and set the folders:

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

   The preset sets `composite`, so every source file must be matched by `include`.

3. If the package imports another workspace package, add a `references` entry with the path to that package's
   folder (or to its tsconfig file):

   ```json
   {
   	"references": [
   		{
   			"path": "../other-package"
   		}
   	]
   }
   ```

   The referenced package must also have `composite` on. If it extends `tsconfig/monorepo`, it does.

4. Build with `tsc --build`, which builds referenced projects first:

   ```sh
   pnpm exec tsc --build
   ```

5. Add `*.tsbuildinfo` and the output folder to `.gitignore`. `composite` turns on `incremental`, which writes a
   `.tsbuildinfo` file.

## Finished config

`testcases/build-ts/tsconfig.json` in this repository:

```json
{
	"extends": "@repobuddy/typescript/tsconfig/monorepo",
	"compilerOptions": {
		"outDir": "esm",
		"rootDir": "src"
	},
	"include": ["src"],
	"references": [
		{
			"path": "../../packages/typescript"
		}
	]
}
```

## Verify

1. Run `pnpm exec tsc --showConfig`. The output includes `"composite": true` and `"module": "node16"`.
2. Run `pnpm exec tsc --build`. It exits with code `0` and writes `esm/` with `.js`, `.d.ts`, and `.map` files.

## Notes

- If a tool that reads your tsconfig cannot follow an `extends` array, extend
  [`tsconfig/legacy/monorepo`](/repobuddy/typescript/tsconfig/legacy-monorepo/) instead.
- In a large solution, add [`projects/large-project`](/repobuddy/typescript/tsconfig/projects/#projectslarge-project)
  to the `extends` array so the editor does not load every referenced project at startup.

## Related

- [`tsconfig/monorepo`](/repobuddy/typescript/tsconfig/monorepo/)
- [projects](/repobuddy/typescript/tsconfig/projects/)
- [Build CommonJS and ESM from one package](/repobuddy/typescript/guides/dual-cjs-esm-build/)
