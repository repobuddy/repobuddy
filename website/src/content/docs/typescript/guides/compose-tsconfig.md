---
title: Compose your own tsconfig
description: Build a tsconfig from the @repobuddy/typescript category files with an extends array.
---

When [`tsconfig/monorepo`](/repobuddy/typescript/tsconfig/monorepo/) does not fit, pick one file per category and list
them in an `extends` array. This guide builds a config for a library that a bundler consumes.

`extends` arrays need TypeScript 5.0 or later.

## Steps

1. Install the package:

   ```sh
   pnpm add -D typescript @repobuddy/typescript
   ```

2. Pick the language level. [`language/buddy`](/repobuddy/typescript/tsconfig/language/#languagebuddy) targets ES2020.

3. Pick one module file. For bundler output, use
   [`modules/es2022`](/repobuddy/typescript/tsconfig/modules/#moduleses2022). For a Node.js package, use
   [`modules/buddy`](/repobuddy/typescript/tsconfig/modules/#modulesbuddy) or
   [`modules/nodenext`](/repobuddy/typescript/tsconfig/modules/#modulesnodenext).

4. Add [`interop/buddy`](/repobuddy/typescript/tsconfig/interop/#interopbuddy) so single-file transpilers can compile
   the code.

5. Pick a strictness level from [type-checking](/repobuddy/typescript/tsconfig/type-checking/). This example uses
   `buddy-strictest`.

6. Add [`emit/buddy`](/repobuddy/typescript/tsconfig/emit/#emitbuddy) for declarations and source maps.

7. Add any extras:

   - [`language/react`](/repobuddy/typescript/tsconfig/language/#languagereact) for JSX with the automatic runtime.
   - [`modules/ui-assets`](/repobuddy/typescript/tsconfig/modules/#modulesui-assets) to import `.css` and other
     files that have declaration files.
   - [`javascript/buddy`](/repobuddy/typescript/tsconfig/javascript/) to compile and check `.js` files.
   - [`projects/composite`](/repobuddy/typescript/tsconfig/projects/#projectscomposite) for project references.

8. Set your own `outDir`, `rootDir`, and `include`. No building block sets them.

Order matters. When two files set the same option, the later file in the array wins, and your own `compilerOptions`
win over all of them.

## Finished config

```json
{
	"extends": [
		"@repobuddy/typescript/tsconfig/language/buddy",
		"@repobuddy/typescript/tsconfig/modules/es2022",
		"@repobuddy/typescript/tsconfig/interop/buddy",
		"@repobuddy/typescript/tsconfig/type-checking/buddy-strictest",
		"@repobuddy/typescript/tsconfig/emit/buddy"
	],
	"compilerOptions": {
		"outDir": "dist",
		"rootDir": "src"
	},
	"include": ["src"]
}
```

## Verify

1. Run `pnpm exec tsc --showConfig`. Check that the output lists `"module": "es2022"`,
   `"moduleResolution": "bundler"`, `"target": "es2020"`, and `"noImplicitOverride": true`.
2. Run `pnpm exec tsc -p .`. It exits with code `0` and writes `.js`, `.d.ts`, and `.map` files to `dist/`.

## Related

- [tsconfig presets](/repobuddy/typescript/tsconfig/)
- [Known failures](/repobuddy/typescript/tsconfig/#known-failures): files that need an extra option or an older
  TypeScript.
