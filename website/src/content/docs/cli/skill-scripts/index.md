---
title: Skill script commands
description: Hidden buddy subcommands that run the scripts behind the repobuddy skills.
---

Some repobuddy skills run a script for the part of their work that has one right answer. The npm package ships each
script as a bundled `.mjs` file inside the skill folder. The same scripts are also `buddy` subcommands.

A skill installed from git has no bundled scripts, because the bundles are built at publish time. Such a skill runs
the subcommand through npx instead, for example:

```sh
npx -y repobuddy@^1.8.0 env
```

This needs network access the first time.

## How they differ from the other commands

- `buddy` passes every argument after the subcommand name to the script unchanged. The script parses them itself.
- They do not appear in `buddy --help`.
- The [global options](/repobuddy/cli/global-options/) do not apply. `buddy env --help` is an unknown argument.
- Error and usage lines name the script file, for example `usage: detect-env.mjs ...`, not `buddy env`.
- Exit codes are each script's own. Each page lists them.

## Commands

| Command | Used by skill | What it does |
| --- | --- | --- |
| [`buddy env`](/repobuddy/cli/skill-scripts/env/) | `init-buddy` | Reports the OS, package managers, git hosts and their CLIs, and configured MCP servers |
| [`buddy detect-state`](/repobuddy/cli/skill-scripts/detect-state/) | `setup-github-repo` | Reads the repository's GitHub settings and files into a state file |
| [`buddy scaffold-workflows`](/repobuddy/cli/skill-scripts/scaffold-workflows/) | `setup-github-repo` | Writes the GitHub Actions workflows the state file says are missing |
| [`buddy npm-trust`](/repobuddy/cli/skill-scripts/npm-trust/) | `setup-npm-trusted-publishing` | Plans and registers npm trusted publishers |
| [`buddy release-age`](/repobuddy/cli/skill-scripts/release-age/) | `min-release-age` | Lifts and restores the minimum-release-age gate for one package version |
| [`buddy agent-readiness`](/repobuddy/cli/skill-scripts/agent-readiness/) | `agent-readiness` | Scores a repository's agent readiness, or benchmarks agent cost |

`release-age`, `npm-trust`, and `agent-readiness` print their usage and exit `2` when run without a subcommand.

The `init-buddy` skill also ships a `gh-api-guard.mjs` hook script. It is not a `buddy` subcommand.

## Related

- [Skills](/repobuddy/skills/)
- [Install the skills](/repobuddy/skills/install/)
