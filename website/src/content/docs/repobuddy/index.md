---
title: repobuddy
description: The repobuddy package ships two things, the buddy CLI and an agent plugin with the repobuddy skills, and how to install each.
---

The [`repobuddy`](https://npmjs.org/package/repobuddy) package ships two surfaces from one install:

- **The `buddy` CLI.** The package's `bin` installs `buddy`, `bd`, and `repobuddy`. It writes test scripts into
  `package.json`, checks that a Jest config's packages are declared, loads plugins, and runs the scripts the skills use.
- **An agent plugin.** The package is a [universal plugin](https://github.com/agentplugins/agent-plugins-spec)
  (`plugin.json`) for Claude Code, Cursor, Codex, and GitHub Copilot CLI. It carries the repobuddy agent skills,
  instruction packs that a coding agent loads when a request matches.

Install the half you need. The CLI is a dev dependency of your project. The plugin installs into your coding agent.

## Install the CLI

```sh
# npm
npm install -D repobuddy

# yarn
yarn add -D repobuddy

# pnpm
pnpm add -D repobuddy
```

Then run `buddy --help`. See [the `buddy` CLI](/repobuddy/cli/).

## Install the agent plugin

| Route | Command | Skill scripts |
| --- | --- | --- |
| Claude Code | `/plugin marketplace add cyber-uni/marketplace`, then `/plugin install repobuddy@cyber-uni` | built, from the npm package |
| Codex | `codex plugin marketplace add cyber-uni/marketplace`, then `codex plugin add repobuddy@cyber-uni` | built, from the npm package |
| GitHub Copilot CLI | `copilot plugin marketplace add cyber-uni/marketplace`, then `copilot plugin install repobuddy@cyber-uni` | run through `npx` |
| Cursor | A workspace admin imports `cyber-uni/marketplace` as a team marketplace | run through `npx` |
| Skills CLI, for other agents | `npx skills add repobuddy/repobuddy` | run through `npx` |

The plugin is listed in [`cyber-uni/marketplace`](https://github.com/cyber-uni/marketplace). If you added this
repository as a marketplace before 4.7.0, it no longer updates the plugin: see
[Move from the repobuddy marketplace](/repobuddy/skills/install/#move-from-the-repobuddy-marketplace). See [Install the skills](/repobuddy/skills/install/) for each route's install, update, and uninstall commands.

## Choose a starting page

| You want to | Start here |
| --- | --- |
| Add or update the `test`, `coverage`, and `test:watch` scripts | [`buddy test-scripts`](/repobuddy/cli/test-scripts/) |
| Find packages your Jest config uses that `package.json` does not declare | [`buddy check-deps`](/repobuddy/cli/check-deps/) |
| Add commands to `buddy` with a plugin | [Add a plugin](/repobuddy/cli/guides/plugins/) |
| Find a skill for a repository chore | [Agent skills](/repobuddy/skills/) |
| Run a skill's script without the skill | [Skill script commands](/repobuddy/cli/skill-scripts/) |

## Support

| Area | Supported |
| --- | --- |
| CLI | Node.js, ESM only, no importable API. See [the `buddy` CLI](/repobuddy/cli/#support). |
| Agent plugin | Claude Code, Cursor, Codex, and GitHub Copilot CLI, the four vendors `plugin.json` lists. Some skills need a git host CLI such as `gh` or `glab`. |

The CLI and the plugin share one version number.
