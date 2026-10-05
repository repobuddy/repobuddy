---
title: buddy detect-state
description: Read a GitHub repository's settings and workflow files into a state file for the setup-github-repo skill.
---

`buddy detect-state` reads a GitHub repository's settings and local files, and writes them to a state file. The
`setup-github-repo` skill runs it, then passes the state file to
[`buddy scaffold-workflows`](/repobuddy/cli/skill-scripts/scaffold-workflows/).

## Usage

```sh
buddy detect-state [--dir <repo>] [--out <path>] [--verbose]
```

## Arguments

| Flag | Type | Default | Effect |
| --- | --- | --- | --- |
| `--dir` | path | the current directory | The local checkout to inspect. |
| `--out` | path | `<os temp dir>/setup-github-repo-<user>/<owner>-<repo>.json` | Where to write the state file. |
| `--verbose` | boolean | off | Prints a table of current and target settings to stderr. |

## Behavior

- It needs the `gh` CLI, signed in. It reads the repository with `gh repo view` and `gh api` GET requests only.
- It reads repository settings, rulesets, branch rules, classic branch protection, and the merge backstop (merge
  queue or require-up-to-date).
- From `--dir` it reads the language, the package manager, whether `package.json` and `.github/dependabot.yml`
  exist, and the files in `.github/workflows`.
- The default state path is the same on every run for one repository, so `scaffold-workflows` finds it without
  `--state`.
- It deletes `.github/setup-state.json` from `--dir` when present. Earlier versions wrote the state file there.

## Output

stdout is one JSON line:

```json
{"ok":true,"artifact":"/tmp/setup-github-repo-me/repobuddy-repobuddy.json","repo":"repobuddy/repobuddy","defaultBranch":"main","counts":{"willSet":2,"alreadySet":7}}
```

With `--verbose`, stderr adds a table and a summary:

```
Repo: repobuddy/repobuddy  (default branch: main)

| Setting                     | Current            | Target                    | Action      |
|-----------------------------|--------------------|---------------------------|-------------|
| delete_branch_on_merge      | true               | true                      | already set |
| allow_merge_commit          | true               | false                     | will set    |
| default branch ruleset      | none               | default-branch-protection | will create |
| merge backstop              | require up to date | merge queue               | already set |

Detected:
  Language:        typescript
  CodeQL language: javascript
  Package manager: pnpm
  Existing workflows: codeql-analysis.yml, deploy-pages.yml, pull-request.yml, release.yml
```

(Rows trimmed.)

## Exit codes

| Code | When |
| --- | --- |
| `0` | The state file was written. |
| `1` | An unknown argument, a flag without a value, or a failed `gh` call. |

## Related

- [`buddy scaffold-workflows`](/repobuddy/cli/skill-scripts/scaffold-workflows/)
- [`setup-github-repo` skill](/repobuddy/skills/setup-github-repo/)
