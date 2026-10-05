---
title: diagnostics
description: The tsconfig building block for compiler diagnostics output.
---

Files under `@repobuddy/typescript/tsconfig/diagnostics/` match the
[Compiler Diagnostics](https://www.typescriptlang.org/tsconfig#Compiler_Diagnostics_6251) category of the TSConfig
reference.

## `diagnostics/buddy`

Turns on the compiler's diagnostic output, for debugging a build.

```json
{
	"compilerOptions": {
		"extendedDiagnostics": true,
		"listEmittedFiles": true,
		"listFiles": true,
		"traceResolution": true
	}
}
```

| Option | Value |
| --- | --- |
| `extendedDiagnostics` | `true` |
| `listEmittedFiles` | `true` |
| `listFiles` | `true` |
| `traceResolution` | `true` |

`tsc` prints every file it reads, every file it writes, every module resolution step, and timing data. Expect long
output: even a one-file project lists every `lib` file it loads. Extend this file only while you debug, not in a
committed build config.

```jsonc
// tsconfig.debug.json
{
	"extends": ["./tsconfig.json", "@repobuddy/typescript/tsconfig/diagnostics/buddy"]
}
```

## Related

- [tsconfig presets](/repobuddy/typescript/tsconfig/)
