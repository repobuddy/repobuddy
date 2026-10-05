---
title: setup-github-repo
description: Apply standard GitHub repository settings, a branch ruleset, a merge backstop, and starter CI workflows with the gh CLI.
---

`setup-github-repo` reads the repository's current GitHub state and applies only what is missing, so a second run on a
configured repo changes nothing.

## When to use

- "set up this new GitHub repo"
- "add branch protection" or "turn on Dependabot"
- "add a merge queue" or "stop agent merges from breaking main"
- "scaffold CI workflows for this repo"

## Invoke

Run `/setup-github-repo`, or ask in plain words. It takes no arguments and works on the repo in the current directory.

## What it changes

- Repository settings: delete branches on merge, allow auto-merge, squash and rebase merges, update PR branch; merge commits off.
- Dependabot security updates, if off.
- A `default-branch-protection` ruleset when no branch ruleset exists. It blocks deleting and force-pushing the default
  branch, with Administrators and Maintainers able to bypass. It requires the `all-checks` status check when it also
  writes `pull-request.yml`.
- A merge backstop if the branch has none: a `merge-backstop` ruleset with no bypass actors, as a merge queue where
  GitHub offers one (public org repos, private repos on GitHub Enterprise Cloud), otherwise require up to date. It
  reports an existing queue, up-to-date rule, or third-party queue such as Mergify and adds nothing.
- Workflow files under `.github/workflows/`, never overwritten and not committed: `pull-request.yml`, `release.yml`,
  `dependabot-automerge.yml` (patch and minor only), and `codeql.yml`. The CI steps are marked `TODO`.
- Optional: wiki, projects, or discussions off; secret scanning and push protection on.

The state snapshot goes to the OS temp directory. It deletes a leftover `.github/setup-state.json` from older versions.

## Asks before acting

It summarizes pending changes and asks you to confirm, asks before the backstop and each workflow file, and applies each
optional setting only on a yes. GitHub Pages is left to the GitHub UI.

## Hands off to

[`init-buddy`](/repobuddy/skills/init-buddy/) when `gh` is missing or logged out and that skill is installed.

## Requirements

- `gh`, logged in, and a git remote.
- `detect-state.mjs` and `scaffold-workflows.mjs`. They fall back to `npx -y repobuddy@^1.15.0 detect-state` and
  `scaffold-workflows` (needs network). See [Skill scripts](/repobuddy/cli/skill-scripts/).
- A required status check appears in GitHub only after CI has run once.

## Example

```
/setup-github-repo add a merge queue and scaffold CI
```

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/setup-github-repo).
