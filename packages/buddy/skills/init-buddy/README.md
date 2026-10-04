# init-buddy

Gets a machine ready to work with a repository's git host. It detects the OS and package managers, checks the host's CLI, and finds any MCP server already configured for the host. Then it installs and logs in the CLI you want. Last, it offers a starting allow list so your agent harness stops prompting for the read-only commands it runs most, and a deny list for the commands it should never run.

## When to use

- "set up my environment for this repo"
- "install gh" / "I need glab for our GitLab"
- another skill stopped because `gh` or `glab` is missing or logged out
- "is my machine ready to work with Azure DevOps?"
- "stop asking me before every `gh pr view`"
- "never let the agent force push or publish"

## What it does

1. **Detects the environment:**
   - OS family: macOS, Windows, or the Linux family (Debian/Ubuntu, Fedora, RHEL-like, Arch, openSUSE, Alpine, NixOS), plus WSL
   - whether `sudo` works without a password
   - package managers on PATH: brew, winget, scoop, choco, apt, dnf, pacman, zypper, apk, nix, snap, conda, go, cargo
2. **Detects the hosts** from the repo's git remotes. It recognizes GitHub, GitLab, Bitbucket, Azure DevOps, Gitea, and Forgejo/Codeberg. For a self-hosted instance with an unfamiliar name, it can ask the server's API what it runs.
3. **Checks each host's CLI:** installed or not, its version, and whether it is logged in.

   | Host | CLI |
   |---|---|
   | GitHub | `gh` |
   | GitLab | `glab` |
   | Gitea | `tea` |
   | Forgejo | `fj` |
   | Azure DevOps | `az` + the `azure-devops` extension |
   | Bitbucket Cloud | no official CLI |

4. **Finds existing MCP servers** for those hosts:
   - in local config files: Claude Code (including plugins), Cursor, Codex, Copilot CLI, Gemini CLI, VS Code, Windsurf (Devin Desktop), OpenCode, and Zed
   - among the tools the current session has, which covers web-account connectors that no local file shows

   If one is active, it shows you and asks whether you still want the CLI.
5. **Installs the CLI** with the option that fits your machine. It prefers the vendor's official package, shows the commands first, and asks you to run `sudo` commands yourself when they need a password.
6. **Walks you through login.** Logins are interactive, so it gives you the command to run (`! gh auth login`), then checks the result.
7. **Proposes an allow list** for Claude Code, Cursor CLI, or Codex CLI, in four tiers:

   | Tier | What goes in it | Examples |
   |---|---|---|
   | Safe | read-only commands | `git status`, `gh pr view`, `glab mr list`, the repo's `test` and `lint` scripts |
   | Good to have | local writes that git can undo | `git add`, `git commit`, `git mv`, format scripts |
   | Ask every time | remote, destructive, or open-ended commands, never proposed | `git push`, `gh pr merge`, `gh api`, `npx`, `git stash drop` |
   | Advanced (opt-in, Claude Code only) | a riskier entry, offered only when you ask, and written only together with its guard | `gh pr merge --auto` when the default branch requires a status check; `gh api` reads through a read-only token or the `gh-api-guard` hook |

   You pick the entries and the scope: user (every repo), project shared (committed), or project local
   (this repo on this machine). It shows the diff and writes only what you approved.

   In the advanced tier, an entry is never written without its guard. If you decline the guard, the
   entry is not written either:

   - **`gh pr merge --auto`**: GitHub waits until the branch's rules are met, then merges. If the branch
     requires no status check, the rules are already met and `--auto` merges at once. So the skill
     reads the default branch's rules first and offers the entry only when a required check exists. It
     writes the entry together with the deny entries for `gh pr merge --admin`.
   - **`gh api`**: GET is the default, but any `-f`/`-F` field switches it to POST, and `graphql` is
     always POST. The skill first points to the read commands that already cover most needs
     (`gh pr view --json`, `gh run view`, `gh search`). Then it offers one of two guards. The first is
     a fine-grained read-only token for one session; the agent then cannot push or merge in that
     session. The second is the `gh-api-guard` PreToolUse hook. It allows GET requests and GraphQL
     queries with no `mutation`, and asks for everything else, including `@file` fields, pipes, and
     variables it cannot see through.

   The hook is for **Claude Code only**. It ships with the skill as `scripts/gh-api-guard.mjs`, a
   dependency-free Node script, and is copied to `.claude/hooks/` or `~/.claude/hooks/` so that a
   plugin update does not move it. Cursor has a similar hook (`beforeShellExecution`) with a different
   format, which this script does not speak. Codex hooks can deny a command but not ask, so there is no
   equivalent there.
8. **Proposes a deny list**, in the same files and scopes. It covers force push in every common form,
   `gh pr merge --admin`, `gh repo delete`, `gh api` DELETE requests, `rm -rf` and its variants, package
   publish, and reading secrets (`.env*`, `~/.ssh`, `~/.aws`, `~/.npmrc`, `gh`'s `hosts.yml`). You pick
   the groups or entries. It only appends; it never removes or loosens a deny entry you already have.

   What a deny list can and cannot do:

   - **Deny rules match text.** They are tripwires: a reworded command such as `git -C . push --force`,
     `/bin/rm -rf`, or `sh -c '…'` gets past them.
   - **`Read(...)` denies do not cover every read.** Claude Code applies them to its Read tool and to
     the Bash file commands it recognizes, such as `cat`. A script that opens the file itself, or a
     `grep -r` from a parent directory, still reads it. The sandbox, or a hook, is the real guard.
   - **Deny beats allow.** Deny rules are checked first and apply in every mode, including
     `bypassPermissions`. No allow rule or hook overrides them.
   - **Modes.** In `auto` mode, ask rules still prompt. In `dontAsk` mode and headless `claude -p` runs,
     anything that would prompt is denied instead.

   In Cursor, deny entries go in `permissions.deny`, where deny also beats allow. In Codex they are
   `forbidden` prefix rules, which match only the leading words of a command, so a flag later in the
   command (`git push origin --force`) cannot be expressed. Codex has no read-deny rule; its sandbox
   decides what a command can read.

9. **Lists the next setup skills.** It ends with the other installed skills that set up a repo, one line
   each, grouped by what they touch. It lists them; it never runs them. It leaves out itself and any
   skill already set up here.

## For skill authors: naming a setup skill

`init-buddy` finds setup skills by name, because every harness already shows the agent the names of the
installed skills. Name yours so it is found:

| Prefix | Means | Examples |
|---|---|---|
| `init` / `init-<tool>` | wires a tool or plugin into this repo | `init-changesets`, `init-aced`, `init-quill`, `init-cyberlegion` |
| `setup-<service>` | configures a hosted service outside the repo | `setup-github-repo`, `setup-npm-trusted-publishing` |

A plugin prefix is fine (`sdd:init`). If the name cannot follow the convention, for example a router whose
`init` is a subcommand, add the field to its frontmatter:

```yaml
metadata:
  setup: true
```

`init-buddy` reads that field only where the frontmatter is cheap to read, such as repo-local
`.agents/skills/`, so the name is the more reliable signal. It never sorts skills by their descriptions.

## Safety

- MCP servers are reported by name, command, and URL origin only. Environment values, headers, and URL query strings in those config files are never shown.
- It never asks you to paste a token into the chat.
- It does not install, enable, or edit MCP servers, and does not change repository settings.
- It only adds allow and deny entries you approved. It never removes an entry or a deny rule, and never adds a remote or destructive command unless you name it and confirm it. An advanced entry is written only with its guard. To audit the allow list you already have, use [`review-permissions`](../review-permissions/README.md).
- It does not run `curl | sh` installers beyond the ones it lists by name. The one listed, Microsoft's Azure CLI script for Debian/Ubuntu, is shown to you before it runs.

## How to invoke

Ask for it directly, or run `/init-buddy [github|gitlab|bitbucket|azure|gitea|forgejo[=hostname]]` where slash commands are supported. Without an argument, it uses the repo's git remotes.

## What it produces

An installed, logged-in CLI for each host you chose, a summary of the environment and of the MCP servers already available, and, if you accepted, the allow and deny entries (and the `gh-api-guard` hook) you approved, written to the scope you picked.

## Install

Install the `repobuddy` plugin (see the [repository readme](../../../../readme.md#installing-as-a-plugin)), or add
the skill alone:

```sh
npx skills add repobuddy/repobuddy --skill init-buddy
```

A skill installed with `skills add` comes from git and has no built `scripts/` folder. It runs its
script through `npx -y repobuddy@^1.8.0` instead, which needs network access. The plugin install
ships the script with the skill. The `gh-api-guard` hook has no `npx` fallback, because a hook runs on every
`gh api` call; install the plugin, or copy the script out of the npm package, to use it.
