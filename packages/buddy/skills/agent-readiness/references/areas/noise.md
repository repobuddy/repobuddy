# Signal-to-noise (weight 15)

Everything search returns that is not source costs tokens and can mislead.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `build-output-untracked` | 4 | yes | script: tracked files under `dist/`, `build/`, `out/`, `coverage/`, `.next/`, `.turbo/`, or named `*.min.js`/`*.min.css` |
| `fixtures-excluded` | 4 | no | script: tracked folders named `fixtures/`, `__fixtures__/`, `testcases/`, `__snapshots__/`, `vendor/`, `third_party/`, and similar, with files no `.gitignore`, `.ignore`, or `.rgignore` excludes; **judgment** on each one listed |
| `comment-signal` | 4 | no | script: comment-only lines as a share of non-test source; **judgment** above 15% |
| `orphaned-jsdoc` | 4 | no | script: a `/** */` block followed by another one, a closing brace, or the end of the file, outside a file header |
| `dead-code` | 4 | no | **judgment**, when the repo has knip configured; script with `--run-knip` |

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

## Judging `fixtures-excluded`

The script lists each outermost fixture or vendored folder with the count of its files that search
still reads. It reads ignore files as ripgrep does: `.gitignore`, `.git/info/exclude`, and every
tracked `.ignore` and `.rgignore`. A `.gitignore` or `.ignore` negation that re-includes a file is
read only within its own kind of file.

For each folder, decide whether an agent working in the repo should find its files by grep:

- **skip**: sample inputs, recorded responses, snapshots, and third-party code that no task edits
- **keep**: fixtures that are the subject of the work, such as the test cases of a tool whose job is
  to read them, or vendored code the repo patches

Pass when every listed folder is keep. Fail when one is skip, and name it; the fix is a line in the
root `.ignore`, which search tools read and git does not, so the files stay tracked.

## Judging `dead-code`

With `--run-knip`, the script ran knip already: `pass` and `fail` are settled, and the detail lists
knip's report headings. A `judge` result after `--run-knip` says why knip did not complete. Without it:

The check names the command that runs knip. Run it; it reads the repo and changes nothing, but it needs
the dependencies installed. Report the count of unused files, exports, and dependencies, and name the
largest group. Pass when it reports nothing. If the command cannot run (not installed, a config
error), leave the check undecided and say why.

## What the script cannot see

- dead code in a repo without knip
- fixture and vendored folders under a name the script does not know
