---
title: Skill script commands
description: Hidden buddy subcommands that run the scripts behind the repobuddy skills.
---

Some repobuddy skills run a command for the part of their work that has one right answer. Each such skill carries a
committed forwarding script, `scripts/repobuddy.mjs`, and runs it as
`node <skill-dir>/scripts/repobuddy.mjs <command> <args>`. The commands are also `buddy` subcommands.

The forwarder walks up from its own real path. Inside the `repobuddy` package (an npm install or a development
checkout) it runs that package's CLI. Anywhere else, such as a git install or a copied skill folder, it runs
`npx -y repobuddy@<version>`, which needs network access the first time.

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
| [`buddy release-age`](/repobuddy/cli/skill-scripts/release-age/) | `min-release-age` | Exempts one package version from the minimum-release-age gate, and restores it |
| [`buddy agent-readiness`](/repobuddy/cli/skill-scripts/agent-readiness/) | `agent-readiness` | Scores a repository's agent readiness, or benchmarks agent cost |

`release-age`, `npm-trust`, and `agent-readiness` print their usage and exit `2` when run without a subcommand.

The `init-buddy` skill also ships a `gh-api-guard.mjs` hook script. It is built for the npm package and the plugin,
and it is not a `buddy` subcommand.

## Related

- [Skills](/repobuddy/skills/)
- [Install the skills](/repobuddy/skills/install/)
