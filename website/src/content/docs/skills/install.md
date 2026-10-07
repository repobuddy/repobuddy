---
title: Install the skills
description: Install, update, and uninstall the repobuddy agent skills from a plugin marketplace for Claude Code, Codex, Copilot CLI, or Cursor, or with the Skills CLI.
---

The `repobuddy` package is a [universal plugin](https://github.com/agentplugins/agent-plugins-spec) for Claude Code,
Cursor, Codex, and GitHub Copilot CLI (`packages/buddy/plugin.json` lists those four vendors). Install it as a plugin
where your harness supports one: the harness owns the install, so it updates and uninstalls it cleanly. Use the Skills
CLI for any other agent. Start a new agent session after you install or update.

## Plugin marketplace

The repository is a plugin marketplace.

| Harness | Catalog it reads | Where the plugin comes from |
| --- | --- | --- |
| Claude Code | `.claude-plugin/marketplace.json` | the `repobuddy` npm package, with built scripts |
| Codex | `.claude-plugin/marketplace.json` | the `repobuddy` npm package, with built scripts |
| Copilot CLI | `.github/plugin/marketplace.json` | this repository, so scripts run through `npx` |

Each harness installs the plugin into its own config directory, not into your project. Uninstalling removes it and its
settings entries.

**Claude Code**

```sh
# install
claude plugin marketplace add repobuddy/repobuddy
claude plugin install repobuddy@repobuddy

# update
claude plugin marketplace update repobuddy
claude plugin update repobuddy@repobuddy

# uninstall
claude plugin uninstall repobuddy@repobuddy
claude plugin marketplace remove repobuddy
```

Inside a session, `/plugin marketplace add repobuddy/repobuddy` and `/plugin install repobuddy@repobuddy` do the same.

**Codex**

```sh
# install
codex plugin marketplace add repobuddy/repobuddy
codex plugin add repobuddy@repobuddy

# update
codex plugin marketplace upgrade repobuddy
codex plugin add repobuddy@repobuddy

# uninstall
codex plugin remove repobuddy@repobuddy
codex plugin marketplace remove repobuddy
```

**GitHub Copilot CLI**

```sh
# install
copilot plugin marketplace add repobuddy/repobuddy
copilot plugin install repobuddy@repobuddy

# update
copilot plugin update repobuddy@repobuddy

# uninstall
copilot plugin uninstall repobuddy@repobuddy
copilot plugin marketplace remove repobuddy
```

**Cursor** has no command-line install. A workspace admin imports the catalog from
Dashboard, Plugins, Team Marketplaces, Add Marketplace, Import from Repo.

## Skills CLI

For an agent without a plugin system, the [Skills CLI](https://github.com/vercel-labs/skills) copies the skills into
your project and records each one in `skills-lock.json`.

```sh
# list the skills
npx skills add repobuddy/repobuddy --list

# install all of them, or some of them
npx skills add repobuddy/repobuddy
npx skills add repobuddy/repobuddy --skill file-issue --skill setup-github-repo

# update every skill in skills-lock.json
npx skills update

# uninstall one, or all of them
npx skills remove file-issue
npx skills remove --all
```

`update` also offers to delete a skill that the repository no longer ships. `remove` leaves the empty skill directories
behind. Add `-g` to install to your user directory instead of the project.

Skills installed this way come from git and have no built scripts. See [Scripts and npx](#scripts-and-npx).

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
call. Install the plugin from the Claude Code or Codex marketplace to use it. The scripts of `review-permissions` and
`to-question` are committed to the repository, so a git install has them.

The commands are listed on [Skill scripts](/repobuddy/cli/skill-scripts/).

## Related skill collections

[`repobuddy/agent-changesets`](https://github.com/repobuddy/agent-changesets) (changeset authoring and release setup)
and [`repobuddy/agent-security`](https://github.com/repobuddy/agent-security) (security PR remediation) install the
same way.
