---
title: projects
description: The tsconfig building blocks for project references.
---

Files under `@repobuddy/typescript/tsconfig/projects/` match the
[Projects](https://www.typescriptlang.org/tsconfig#Projects_6255) category of the TSConfig reference.

| File | Sets |
| --- | --- |
| [`projects/composite`](#projectscomposite) | `composite` |
| [`projects/large-project`](#projectslarge-project) | `composite`, `disableReferencedProjectLoad` |

## `projects/composite`

Makes the project referenceable from another project's `references`. Used by
[`tsconfig/monorepo`](/repobuddy/typescript/tsconfig/monorepo/).

```json
{
	"compilerOptions": {
		"composite": true
	}
}
```

`tsc --showConfig` (TypeScript 7.0.2) also lists `declaration: true` and `incremental: true`, which TypeScript derives
from `composite`.

## `projects/large-project`

`composite`, plus `disableReferencedProjectLoad`, which stops the editor from loading every referenced project at
startup. Use it in a solution with many projects.

```json
{
	"compilerOptions": {
		"composite": true,
		"disableReferencedProjectLoad": true
	}
}
```

`tsc --showConfig` (TypeScript 7.0.2) also lists the derived `declaration: true` and `incremental: true`.

## Related

- [tsconfig presets](/repobuddy/typescript/tsconfig/)
- [Configure a monorepo package](/repobuddy/typescript/guides/monorepo/)
