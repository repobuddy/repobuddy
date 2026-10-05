---
title: buddy scaffold-workflows
description: Write the GitHub Actions workflows that a detect-state file shows are missing.
---

`buddy scaffold-workflows` writes GitHub Actions workflow files based on the state file from
[`buddy detect-state`](/repobuddy/cli/skill-scripts/detect-state/). The `setup-github-repo` skill runs it.

## Usage

```sh
buddy scaffold-workflows [--state <path>] [--dir <repo>] [--workflows <list>] [--yes] [--verbose]
```

## Arguments

| Flag | Type | Default | Effect |
| --- | --- | --- | --- |
| `--state` | path | the default path `detect-state` writes to | The state file to read. |
| `--dir` | path | the current directory | The repository to write `.github/workflows/` into. |
| `--workflows` | comma-separated list | chosen from the state | Any of `pull-request`, `release`, `dependabot-automerge`, `codeql`. |
| `--yes`, `-y` | boolean | off | Writes without asking. |
| `--verbose` | boolean | off | Prints progress to stderr. |

## Behavior

- Without `--state`, it finds the default path from `gh repo view`, so it needs the `gh` CLI.
- Without `--workflows`, it offers all four when the state shows no workflows. Otherwise it offers `pull-request` and
  `release` when `package.json` exists, `dependabot-automerge` when `.github/dependabot.yml` exists, and `codeql` when
  a language was detected.
- A workflow whose `<name>.yml` the state lists as existing is skipped with `already exists`.
- An unknown name is skipped with `unknown workflow name`.
- Without `--yes`, it asks `Create these files? [y/N]` on stderr. Any answer but `y` writes nothing and returns
  `"reason":"aborted"`.

## Output

stdout is one JSON line. With `--workflows pull-request,codeql,nope --yes` against a state that lists
`pull-request.yml`:

```json
{"ok":true,"created":[".github/workflows/codeql.yml"],"skipped":[{"name":"pull-request.yml","reason":"already exists"},{"name":"nope.yml","reason":"unknown workflow name"}]}
```

`--verbose` adds to stderr:

```
  [skip] pull-request.yml — already exists

Workflows to create:
  codeql.yml
  nope.yml
  [created] .github/workflows/codeql.yml
  [skip] nope — unknown workflow name

Done. Review the generated files before committing — CI steps may need customization.
```

## Exit codes

| Code | When |
| --- | --- |
| `0` | Success, including a declined prompt. |
| `1` | The state file is missing, an unknown argument, or a flag without a value. |

## Related

- [`buddy detect-state`](/repobuddy/cli/skill-scripts/detect-state/)
- [`setup-github-repo` skill](/repobuddy/skills/setup-github-repo/)
