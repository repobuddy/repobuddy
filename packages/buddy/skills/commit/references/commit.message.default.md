---
description: How the commit skill writes a commit message. Patch a section in .agents/references/commit.message.md.
tags: [commit, commit-message, conventional-commits]
---

## Convention

[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):

```text
<type>[(<scope>)][!]: <subject>

[body: why the change was made]

[trailers]
```

## Rules source

Read the allowed types, scopes, subject case, and line lengths from the repository's commitlint
config, not from memory. The config is one of:

- `commitlint.config.{js,cjs,mjs,ts,cts,mts}`
- `.commitlintrc`, or `.commitlintrc.{json,yaml,yml,js,cjs,mjs,ts,cts}`
- a `commitlint` key in `package.json`

When commitlint is installed, `node_modules/.bin/commitlint --print-config json` prints the resolved
rules, including those of a preset the config `extends`. Otherwise read the config, and the preset it
extends from `node_modules` when present. A rule whose level is `0` is off.

| Rule | What it sets |
| --- | --- |
| `type-enum` | the allowed types |
| `scope-enum`, `scope-empty`, `scope-case` | the allowed scopes, whether one is required, its case |
| `subject-case` | the case the subject may or may not take |
| `header-max-length` | the longest first line |
| `body-max-line-length` | where the body wraps |

With no commitlint config, use the rules of `@commitlint/config-conventional`: the types `build`,
`chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`; a subject not in
sentence, start, pascal, or upper case; a header and body lines of at most 100 characters. Take the
scope from what `git log --oneline -20` shows the repository uses, and leave it out when it shows none.

Check the message before committing when commitlint is installed:
`node_modules/.bin/commitlint < <message-file>` exits non-zero and names each broken rule.

## Type

| Type | The change |
| --- | --- |
| `feat` | adds behavior a user of the package or tool can see |
| `fix` | corrects behavior that was wrong |
| `refactor` | changes code without changing behavior |
| `perf` | makes it faster or smaller without changing behavior |
| `test` | adds or changes tests only |
| `docs` | changes documentation only |
| `build`, `ci` | changes the build or the CI configuration |
| `chore` | anything else: dependencies, tooling, repository config |
| `style` | formatting only |
| `revert` | reverts an earlier commit |

Use only a type the rules allow. When two fit, the one higher in this table wins.

## Subject

An imperative summary of the change ("add", not "added" or "adds"), with no trailing period, within
`header-max-length` for the whole first line.

## Body

Optional. Say why the change was made and what it affects, not a list of the files. Wrap it at
`body-max-line-length` when that rule is on.

## Breaking changes

Mark a change that breaks a consumer with `!` before the colon and a `BREAKING CHANGE: <what breaks
and what to do>` trailer.

## Trailers

Keep every trailer the harness or the repository supplies, such as `Co-Authored-By` or
`Signed-off-by`, after one blank line at the end of the message.
