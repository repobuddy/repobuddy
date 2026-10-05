---
title: Install the skills
description: Install the repobuddy agent skills with the Skills CLI, from npm, or from a plugin marketplace for Claude Code, Codex, Copilot CLI, or Cursor.
---

The `repobuddy` package is a [universal plugin](https://github.com/agentplugins/agent-plugins-spec) for Claude Code,
Cursor, Codex, and GitHub Copilot CLI (`packages/buddy/plugin.json` lists those four vendors). It carries every skill
and the built skill scripts. Start a new agent session after you install.

## Skills CLI

```sh
# list the skills
npx skills add repobuddy/repobuddy --list

# install all of them
npx skills add repobuddy/repobuddy

# install some of them
npx skills add repobuddy/repobuddy --skill create-issue --skill setup-github-repo
```

Skills installed this way come from git and have no built scripts. See [Scripts and npx](#scripts-and-npx).

## From npm

Installing the package puts the skills, with their built scripts, in `node_modules`. Then sync them to your agents:

```sh
npm install repobuddy
npx skills experimental_sync
```

## Plugin marketplace

The repository is a plugin marketplace.

| Harness | Catalog it reads | Where the plugin comes from |
| --- | --- | --- |
| Claude Code | `.claude-plugin/marketplace.json` | the `repobuddy` npm package, with built scripts |
| Codex | `.claude-plugin/marketplace.json` | the `repobuddy` npm package, with built scripts |
| Copilot CLI | `.github/plugin/marketplace.json` | this repository, so scripts run through `npx` |

**Claude Code**

```
/plugin marketplace add repobuddy/repobuddy
/plugin install repobuddy@repobuddy
```

**Codex**

```sh
codex plugin marketplace add repobuddy/repobuddy
codex plugin add repobuddy@repobuddy
```

**GitHub Copilot CLI**

```sh
copilot plugin marketplace add repobuddy/repobuddy
copilot plugin install repobuddy@repobuddy
```

**Cursor** has no command-line install. A workspace admin imports the catalog from
Dashboard, Plugins, Team Marketplaces, Add Marketplace, Import from Repo.

## Scripts and npx

Some skills run a script for the deterministic part of their work. Those scripts are built at release and ship only in
the npm package. A skill installed from git has no built script, so it runs the same command through
`npx -y repobuddy@<version>`. That needs network access.

| Skill | Script | Falls back to |
| --- | --- | --- |
| `init-buddy` | `detect-env.mjs` | `npx -y repobuddy@^1.8.0 env` |
| `min-release-age` | `min-release-age.mjs` | `npx -y repobuddy@^1.8.0 release-age` |
| `setup-github-repo` | `detect-state.mjs`, `scaffold-workflows.mjs` | `npx -y repobuddy@^1.15.0 detect-state`, `scaffold-workflows` |
| `setup-npm-trusted-publishing` | `npm-trust.mjs` | `npx -y repobuddy@^1.9.0 npm-trust` |
| `agent-readiness` | `agent-readiness.mjs` | `npx -y repobuddy@^1.12.0 agent-readiness` |

The `gh-api-guard` hook of `init-buddy` has no `npx` fallback, because a hook runs on every `gh api` or `glab api`
call. Install the plugin, or copy the script out of the npm package, to use it. The scripts of `review-permissions` and
`to-question` are committed to the repository, so a git install has them.

The commands are listed on [Skill scripts](/repobuddy/cli/skill-scripts/).

## Related skill collections

[`repobuddy/agent-changesets`](https://github.com/repobuddy/agent-changesets) (changeset authoring and release setup)
and [`repobuddy/agent-security`](https://github.com/repobuddy/agent-security) (security PR remediation) install the
same way.
