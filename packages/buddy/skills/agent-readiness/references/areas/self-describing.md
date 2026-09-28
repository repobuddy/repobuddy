# Self-describing code (weight 10)

Types, names, and error messages that carry their constraints save an agent from reading prose, or
guessing.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `ts-strict` | 3 | no | script: the root `tsconfig.json` sets `strict: true` or extends a preset; `strict: false` fails |

A root `tsconfig.json` that only lists project references is `n/a`: strictness lives in each
referenced project. A config that extends a preset passes because the preset usually sets `strict`.
If you have reason to doubt that, read the preset.

## What the script cannot see

- names that hide their constraints (`timeout` with no unit, `id` with no owner)
- error messages that state internal state instead of what to do next
