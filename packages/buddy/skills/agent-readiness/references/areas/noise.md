# Signal-to-noise (weight 15)

Everything search returns that is not source costs tokens and can mislead.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `build-output-untracked` | 4 | yes | script: tracked files under `dist/`, `build/`, `out/`, `coverage/`, `.next/`, `.turbo/`, or named `*.min.js`/`*.min.css` |
| `comment-signal` | 4 | no | **judgment** |

## Judging `comment-signal`

Sample three to five source files the instructions or recent commits point at (not tests). Classify
each comment:

- **keep**: states a constraint, a reason the code cannot show, or a link to the issue behind a workaround
- **cut**: tells history ("previously", "changed to"), restates the name or the next line, repeats a vendor's docs, or argues a design at essay length

Pass when most comments are keep. Fail when cut comments are common, and quote one example. This is a
sample, so say it is one.

## What the script cannot see

- dead code and unused exports (a tool like knip finds them)
- fixtures and vendored folders that are tracked on purpose but not excluded from search with `.ignore`
