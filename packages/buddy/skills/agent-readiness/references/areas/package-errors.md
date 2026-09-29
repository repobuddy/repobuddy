# Errors (package, weight 15)

A consumer's agent sees the package's error messages, not its source. A message that names the fix
saves a trip into `node_modules`.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `actionable-errors` | 3 | yes | **judgment** |

## Judging `actionable-errors`

Search the package's source, or its shipped JavaScript, for the errors it throws (`throw new`,
`reject(`, custom error classes). Read the ones a consumer can trigger with bad input or bad
configuration: skip assertions on internal invariants.

Pass when most of those messages name the input that was wrong and what to pass instead, or point to
the doc that does. Fail when they state internal state (`unexpected state 3`, `cannot read x of
undefined`), or throw a bare error code with no hint.

Name two or three failing messages in the reason, with their file.
