# Signal-to-noise (weight 15)

Everything search returns that is not source costs tokens and can mislead.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `build-output-untracked` | 4 | yes | script: tracked files under `dist/`, `build/`, `out/`, `coverage/`, `.next/`, `.turbo/`, or named `*.min.js`/`*.min.css` |
| `comment-signal` | 4 | no | script: comment-only lines as a share of non-test source; **judgment** above 15% |
| `orphaned-jsdoc` | 4 | no | script: a `/** */` block followed by another one, a closing brace, or the end of the file, outside a file header |
| `dead-code` | 4 | no | **judgment**, when the repo has knip configured |

The script measures comments in languages that use `//` and `/* */`. It skips tests, fixtures,
`.d.ts` files, and build output.

## Judging `comment-signal`

The script passes it when comments are at most 15% of the non-blank source lines. Above that, it lists
the share and the five most-commented files. Sample three to five of those files, and classify each
comment:

- **keep**: states a constraint, a reason the code cannot show, or a link to the issue behind a workaround
- **cut**: tells history ("previously", "changed to"), restates the name or the next line, repeats a vendor's docs, or argues a design at essay length

Pass when most comments are keep. Fail when cut comments are common, and quote one example. Report the
share the script measured, and say the classification is from a sample.

## Re-judging `orphaned-jsdoc`

A block the script lists documents nothing: the compiler attaches it to no declaration, so no hover
shows it. It is usually stale, left behind when its declaration moved. A module overview placed after
a first declaration also lands here; move it to the top of the file.

## Judging `dead-code`

The check names the command that runs knip. Run it; it reads the repo and changes nothing, but it needs
the dependencies installed. Report the count of unused files, exports, and dependencies, and name the
largest group. Pass when it reports nothing. If the command cannot run (not installed, a config
error), leave the check undecided and say why.

## What the script cannot see

- dead code in a repo without knip
- fixtures and vendored folders that are tracked on purpose but not excluded from search with `.ignore`
