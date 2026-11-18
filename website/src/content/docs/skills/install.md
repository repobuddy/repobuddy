---
title: Install the skills
description: Install, update, and uninstall the repobuddy agent skills from a plugin marketplace for Claude Code, Codex, Copilot CLI, or Cursor, or with the Skills CLI.
---

The `repobuddy` package is a [universal plugin](https://github.com/agentplugins/agent-plugins-spec) for Claude Code,
Cursor, Codex, and GitHub Copilot CLI (`packages/buddy/plugin.json` lists those four vendors). Install it as a plugin
where your harness supports one: the harness owns the install, so it updates and uninstalls it cleanly. Use the Skills
CLI for any other agent. Start a new agent session after you install or update.

## Plugin marketplace

Install the plugin from [`cyber-uni/marketplace`](https://github.com/cyber-uni/marketplace), which lists it as
`repobuddy`. Claude Code and Codex install it from the `repobuddy` npm package, with built scripts. Copilot CLI and
Cursor install it from this repository, so its scripts run through `npx`.

Each harness installs the plugin into its own config directory, not into your project. Uninstalling removes it and its
settings entries.

**Claude Code**

```sh
# install
claude plugin marketplace add cyber-uni/marketplace
claude plugin install repobuddy@cyber-uni

# update
claude plugin marketplace update cyber-uni
claude plugin update repobuddy@cyber-uni

# uninstall
claude plugin uninstall repobuddy@cyber-uni
```

Inside a session, `/plugin marketplace add cyber-uni/marketplace` and `/plugin install repobuddy@cyber-uni` do the same.

**Codex**

```sh
# install
codex plugin marketplace add cyber-uni/marketplace
codex plugin add repobuddy@cyber-uni

# update
codex plugin marketplace upgrade cyber-uni
codex plugin add repobuddy@cyber-uni

# uninstall
codex plugin remove repobuddy@cyber-uni
```

**GitHub Copilot CLI**

```sh
# install
copilot plugin marketplace add cyber-uni/marketplace
copilot plugin install repobuddy@cyber-uni

# update
copilot plugin update repobuddy@cyber-uni

# uninstall
copilot plugin uninstall repobuddy@cyber-uni
```

The `cyber-uni` marketplace lists other plugins too, so uninstalling `repobuddy` leaves it in place. Remove it with
`plugin marketplace remove cyber-uni` when you use none of them.

**Cursor** has no command-line install. A workspace admin imports `cyber-uni/marketplace` from
Dashboard, Plugins, Team Marketplaces, Add Marketplace, Import from Repo.

### Move from the repobuddy marketplace

This repository was its own marketplace, named `repobuddy`, until 4.7.0. It no longer carries that catalog, so a
plugin installed from it receives no update. Uninstall that plugin, remove the marketplace, then install from
`cyber-uni/marketplace` as above:

```sh
claude plugin uninstall repobuddy@repobuddy
claude plugin marketplace remove repobuddy

codex plugin remove repobuddy@repobuddy
codex plugin marketplace remove repobuddy

copilot plugin uninstall repobuddy@repobuddy
copilot plugin marketplace remove repobuddy
```

On Cursor, a workspace admin removes the `repobuddy/repobuddy` team marketplace.

### cyber-agentkit

Several skills load their instructions with the `reference` skill of the
[`cyber-agentkit`](https://github.com/cyber-uni/cyber-agentkit) plugin, so a plugin, a repository, or a user can
customize them. `repobuddy` declares `cyber-agentkit` as a plugin dependency, and `cyber-uni/marketplace` lists both.
Claude Code installs it with `repobuddy`; it is the only harness that installs plugin dependencies. On Cursor, Codex,
and GitHub Copilot CLI, install `cyber-agentkit@cyber-uni` by hand. Without it, a skill that ships a default reads that default, and no customization applies.

## Skills CLI

For an agent without a plugin system, the [Skills CLI](https://github.com/vercel-labs/skills) copies the skills into
your project and records each one in `skills-lock.json`.

```sh
# list the skills
npx skills add repobuddy/repobuddy --list

# install all of them, or some of them
npx skills add repobuddy/repobuddy
npx skills add repobuddy/repobuddy --skill issue --skill setup-github-repo

# update every skill in skills-lock.json
npx skills update

# uninstall one, or all of them
npx skills remove issue
npx skills remove --all
```

`update` also offers to delete a skill that the repository no longer ships. `remove` leaves the empty skill directories
behind. Add `-g` to install to your user directory instead of the project.

Skills installed this way come from git and run their commands through npx. See [Scripts and npx](#scripts-and-npx).

## Scripts and npx

Some skills run a command for the deterministic part of their work. Each carries a committed forwarding script,
`scripts/repobuddy.mjs`, and runs `node <skill-dir>/scripts/repobuddy.mjs <command>`. The forwarder walks up from its
own real path. Inside the `repobuddy` package (an npm install or a development checkout) it runs that package's CLI.
Anywhere else, such as a git install or a copied skill folder, it runs `npx -y repobuddy@<version>`. That needs network
access.

| Skill | Command |
| --- | --- |
| `init-buddy` | `repobuddy.mjs env` |
| `min-release-age` | `repobuddy.mjs release-age` |
| `setup-github-repo` | `repobuddy.mjs detect-state`, `repobuddy.mjs scaffold-workflows` |
| `setup-npm-trusted-publishing` | `repobuddy.mjs npm-trust` |
| `agent-readiness` | `repobuddy.mjs agent-readiness` |

`min-release-age` also copies a `min-release-age.mjs` bundle into a consumer repository's CI. That bundle is built
only for the npm package, so from git the skill takes it from `npm pack` instead.

The `gh-api-guard` hook of `init-buddy` is a built bundle, because a hook runs on every `gh api` or `glab api` call.
It is available from the npm package or the plugin, not from a git install. The scripts of `review-permissions` and
`to-question` are committed to the repository, so a git install has them.

The commands are listed on [Skill scripts](/repobuddy/cli/skill-scripts/).

## Related skill collections

[`repobuddy/buddy-changesets`](https://github.com/repobuddy/buddy-changesets) (changeset authoring and release setup)
installs the same way.
