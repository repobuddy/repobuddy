---
title: init-buddy
description: Get a machine ready for the repo's git host, installing and logging in its CLI and seeding a harness allow and deny list.
---

`init-buddy` detects the OS, package managers, and git hosts, checks each host's CLI and any configured MCP server,
installs and logs in the CLI you choose, and offers allow and deny lists for your agent harness.

## When to use

- "set up my environment for this repo" or "install gh" / "I need glab"
- Another skill stopped because `gh` or `glab` is missing or logged out.
- "stop asking me before every `gh pr view`" or "never let the agent force push or publish"

## Invoke

```
/init-buddy [github|gitlab|bitbucket|azure|gitea|forgejo[=hostname]]
```

With no argument it uses the repo's git remotes. Natural phrasing works too.

| Host | CLI |
| --- | --- |
| GitHub | `gh` |
| GitLab | `glab` |
| Gitea | `tea` |
| Forgejo, Codeberg | `fj` |
| Azure DevOps | `az` with the `azure-devops` extension |
| Bitbucket Cloud | no official CLI |

## What it produces or changes

- An installed, logged-in CLI per host. Logins are interactive: it gives you the command (such as `! gh auth login`) and checks the result.
- Allow list entries in tiers (safe, good to have, ask every time, advanced) for Claude Code, Cursor CLI, or Codex CLI, each written to the scope it is safe in.
- A deny list (force push, merge bypass, repo delete, API DELETE, `rm -rf`, publish, reading secrets). It only appends.
- Optionally the `gh-api-guard` hook (Claude Code only), copied to `.claude/hooks/` or `~/.claude/hooks/`.
- `.agents/repobuddy/init-buddy.json` as a local setup marker, excluded through `.git/info/exclude`.
- A one-line reminder for `~/.agents/AGENTS.md`, which it hands to you and never writes itself.

## Asks before acting

It shows commands before installing, asks you to run `sudo` commands yourself, shows the allow and deny diff, and writes
only the entries you approve. It never asks for a token in chat, edits MCP servers, or changes repository settings.
If an MCP server already covers the host, it asks whether you still want the CLI.

## Hands off to

It ends by listing the other setup skills, such as [`setup-github-repo`](/repobuddy/skills/setup-github-repo/), without
running them. To audit an existing allow list, use [`review-permissions`](/repobuddy/skills/review-permissions/).

## Requirements

- Node.js for `detect-env.mjs`. Falls back to `npx -y repobuddy@^1.8.0 env` (needs network). See
  [Skill scripts](/repobuddy/cli/skill-scripts/).
- Network access and a package manager to install the CLIs.
- The `gh-api-guard` hook has no `npx` fallback: install the plugin or copy the script from the npm package.

## Example

```
/init-buddy gitlab=git.example.com
```

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/init-buddy).
