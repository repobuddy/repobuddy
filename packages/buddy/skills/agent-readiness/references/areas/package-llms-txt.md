# llms.txt (package, weight 15)

`llms.txt` is the orientation file a consumer's agent can load instead of crawling docs. It helps only
while it is accurate, which takes a check that fails when it drifts.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `llms-txt` | 4 | yes | script: `llms.txt` in the package, or any tracked `llms.txt` / `llms-full.txt` in its repo |
| `llms-drift-check` | 4 | yes | script: a package or root script, or a CI workflow, that mentions `llms` and `check` |
| `llms-accurate` | 4 | yes | **judgment** |

## Judging `llms-accurate`

Read the `llms.txt` the script found and the package's entry declarations.

Pass when every export, command, or link it names exists, and the main exports are in it. Fail when
it names removed or renamed APIs, links to pages that are gone, or describes a different package in a
monorepo.

A drift check the script matched only by name may not check this file. Open it; if it does not compare
the file with the code, fail `llms-drift-check` too.

## Fixes

Every fix here goes to `llms-txt`: it decides whether a file is warranted, generates it from the
public surface, and wires the drift check into the verify command. This skill never writes the file.
