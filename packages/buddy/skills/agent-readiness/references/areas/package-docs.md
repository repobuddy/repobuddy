# Docs (package, weight 25)

The JSDoc rule flips on the consuming side. Inside a repo, a comment that restates the code is noise.
On an exported symbol, a one-line doc is often the only prose a consumer's agent sees.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `readme` | 1 | yes | script: a README in the package folder |
| `exports-documented` | 3 | yes | script: a `/** … */` block directly above each exported declaration |
| `readme-examples` | 3 | yes | **judgment**; the script fails it only when the README has no JavaScript or TypeScript block |

Overloads and merged declarations count once: a doc on any of them documents the name.

## Judging `readme-examples`

Read the fenced examples the script counted, then compare them with the declarations.

Pass when each example calls functions and options that exist with those names and types today, and
would run as written after the install line. Pass when the repo type-checks or runs its README
examples, which settles it.

Fail when:

- an example uses `...`, placeholder comments, or made-up names where code belongs
- it calls a renamed or removed export, or passes an option the types no longer accept
- it depends on setup the README never shows

## What the script cannot see

- whether a doc comment says anything a name does not (`/** The options. */` is a pass the script
  cannot tell from a useful one); note egregious cases in the report, do not flip the check
