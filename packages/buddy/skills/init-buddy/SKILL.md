---
name: init-buddy
description: "Use this skill when setting up gh, glab, or another git host CLI here, when one is missing or logged out, or when seeding a harness allow or deny list for it."
argument-hint: "[github|gitlab|bitbucket|azure|gitea|forgejo[=hostname]]"
---

# Init Buddy

Set up this machine so an agent can work with the repository's git host: detect the OS and package
managers, find the host's CLI and any MCP server already configured for it, then install and
authenticate the CLI the user wants. Last, offer a starting allow list so the harness stops prompting
for the read-only commands the agent runs most, and a deny list for the commands it should never run.

## When to use

- First use of repobuddy skills in a repo, or "set up my environment for GitHub/GitLab/…"
- A skill needs `gh`, `glab`, `tea`, `fj`, or `az` and the command is missing or not logged in
- The user asks whether their machine is ready to work with a git host
- "Stop asking me before every `gh pr view`": set up a starting allow list
- "Never let the agent force push or publish": set up a deny list

## Detect

Run the detection script from this skill's directory:

```bash
node <this-skill-dir>/scripts/detect-env.mjs [--host <kind[=hostname]>]... [--probe] [--json]
```

The script ships in the `repobuddy` npm package. If `scripts/detect-env.mjs` is missing (the skill was
installed from git) or cannot be run, use `npx -y repobuddy@^1.8.0 env` with the same arguments.

- It reads the hosts from the repo's git remotes. Pass `--host` when there is no repo, when the user names a host, or to add a self-hosted instance (`--host gitlab=git.corp.example`).
- If a host shows as `unknown`, re-run with `--probe`. It asks that host's API which product it runs.
- It reports the OS family (`macos`, `windows`, `debian`, `fedora`, `rhel`, `arch`, `suse`, `alpine`, `nixos`, `other`), WSL, whether `sudo` works without a password, the package managers on PATH, and each host's CLI: whether it is installed and logged in, and the install options that fit this machine.
- It lists MCP servers for those hosts from Claude Code (including plugins), Cursor, Codex, Copilot CLI, Gemini CLI, VS Code, Windsurf (Devin Desktop), OpenCode, and Zed. It prints names, commands, and URL origins only. Never open those config files to show more, because they often hold tokens.

**Also check this session's own tools.** Connectors configured in a web account (for example claude.ai) are not in any local file. Look for tools whose names contain the host, such as `mcp__github__…` or `mcp__claude_ai_GitLab__…`, and add them to the report as active in this session.

## Report

Show the user one summary per host:

- the OS and package managers found
- the CLI's state: missing, installed but not logged in, or ready
- each MCP server for the host: where it is configured, and whether it is active or disabled

A host whose CLI is ready needs nothing more. Say so and move to the next host.

## Decide per host

1. **An active MCP server already covers the host.** Show it, and ask whether the user still wants the CLI installed and configured. Other repobuddy skills run shell commands (`gh`, `glab`) and work best with the CLI. If the user declines, stop for this host.
2. **Only a disabled MCP server exists.** Mention that enabling it is another option, then offer the CLI.
3. **Bitbucket Cloud.** It has no official CLI. Offer the Atlassian remote MCP server (`https://mcp.atlassian.com/v1/mcp`), or the REST API with a repository or workspace access token. Do not install a third-party CLI unless the user asks for one by name.

## Install

1. Pick the first install option the script lists; they come in preference order. Prefer an official option over a community one. Mention a community option only when no official option fits.
2. Show the exact commands and ask before running them.
3. **When the commands need `sudo`:**
   - `sudo: passwordless` or `root`: run them.
   - `sudo: needs-password`: do not run them. Ask the user to run each one with the `!` prefix (for example `! sudo apt install gh`) so they can type the password.
   - `sudo: absent`: use a user-level option (`brew`, `nix`, `cargo`, `go`, or the download) instead.
4. **Windows:** `winget` may show a UAC prompt. Tell the user to expect it. After installing, the current shell may not see the new command until the terminal restarts. If so, use the full path the installer printed, or ask the user to restart.
5. **WSL:** install inside the Linux distribution. A CLI installed on the Windows side is a separate install with its own login.
6. **No option fits** (`family: other`, or no supported manager): give the `docs` link and ask the user how they want to install it. Do not use `curl | sh` installers the script does not list.
7. Run any `postInstall` commands (for example `az extension add --name azure-devops`).
8. Re-run detection to confirm the CLI is on PATH.

## Authenticate

Login commands are interactive. The agent cannot complete them.

1. Ask the user to run the `login` command the script printed, with the `!` prefix (for example `! gh auth login` or `! glab auth login --hostname git.corp.example`).
2. For a headless machine or CI, point to the token variables the script lists (`GH_TOKEN`, `GITLAB_TOKEN`, `AZURE_DEVOPS_EXT_PAT`). Never ask the user to paste a token into the chat.
3. **Azure DevOps:** after `az login`, set the default organization with `az devops configure --defaults organization=https://dev.azure.com/<org>`.
4. **GitHub over HTTPS:** offer `gh auth setup-git` so git uses the same credentials.
5. Re-run detection. For `tea` and `fj`, the login check is not reliable and shows `auth unknown`. Confirm with a read-only command from the CLI's `--help`, such as listing the user's repositories.

## Propose an allow list

Once a CLI is ready, offer to add allow-list entries so the agent stops prompting for the commands it
runs most. This is optional; skip it if the user declines. To audit or clean up an allow list the user
already has, use the `review-permissions` skill instead. This step only adds a starting set.

1. **Find the harnesses.** Use the one running this session, plus any the user names. Read only the
   permission keys of the files below. Never print other keys, because these files can hold MCP
   tokens and hook commands.

   | Harness | User scope | Project scope | Entry syntax |
   |---|---|---|---|
   | Claude Code | `~/.claude/settings.json` | `.claude/settings.json` (shared), `.claude/settings.local.json` (yours) | `permissions.allow`: `"Bash(gh pr view *)"` |
   | Cursor CLI | `~/.cursor/cli-config.json` | `.cursor/cli.json` | `permissions.allow`: `"Shell(gh)"` matches every command whose first word is `gh`. Narrow it with the `command:args` form from the Cursor docs |
   | Codex CLI | `~/.codex/rules/default.rules` | `.codex/rules/*.rules` (loaded only in a trusted project) | `prefix_rule(pattern = ["gh", "pr", "view"], decision = "allow")` |

   Write new Claude Code entries with ` *` (space, star). `:*` means the same thing, but pick one
   style per file so duplicates are easy to see. Keep the space: `Bash(ls *)` matches `ls -la` but not `lsof`, and `Bash(ls*)` matches both.

2. **Build the candidates in four tiers.** Use only commands that exist on this machine and in this
   repo. Read each package script before offering it; a script is only as safe as what it runs.

   - **Safe:** read-only, so allow it anywhere.
     - git: `git status`, `git diff`, `git log`, `git show`, `git branch`, `git stash list`
     - the host CLI's read commands, from the table below
     - the repo's check scripts that only read (`test`, `lint`, `check`, `typecheck`), run through
       its package manager (`pnpm test *`, `npm run lint *`)
   - **Good to have:** writes, but stays local and can be undone. Say the condition with each one.
     - `git add *`, `git mv *`, `git stash push *`: the change stays in the working tree or index
     - `git commit *`: recoverable until pushed. It also covers `--no-verify` and `--amend`, so offer it
       only where commit hooks are not the user's last check
     - format or fix scripts (`pnpm format *`, `pnpm check:fix *`): they rewrite files, which git can restore
   - **Ask every time:** do not propose these. Add one only if the user names it and says yes again
     after you state what it permits.
     - anything that acts on the remote: `git push`, `gh pr merge`, `gh release`, `glab mr merge`,
       publish, deploy
     - raw API access: `gh api *` and `glab api *` can send any POST, PATCH, or DELETE the token allows
     - commands that run code chosen at call time: `npx`, `pnpm dlx`, `bash -c`, `node -e`
     - destructive local commands: `git stash drop`, `git stash clear`, `git reset --hard`, `git clean`
     - any bare wildcard such as `Bash(git *)` or `Bash(gh *)`
   - **Advanced (opt-in):** offer only when the user asks, and only for Claude Code. Each entry names
     its risk and comes with the guard that makes it acceptable. Read
     [references/advanced-tier.md](references/advanced-tier.md) before you offer one.
     - `Bash(gh pr merge --auto *)`: GitHub waits for the branch's required checks before it merges.
       Offer it only when the default branch requires a status check. With none, `--auto` merges at once.
     - Merges in auto mode: an `autoMode.allow` rule in `~/.claude/settings.json`, because auto
       mode's classifier blocks `gh pr merge` on an unreviewed PR even when `permissions.allow`
       lists it. User scope only; the rule names the owners and conditions, with the `--admin` deny entries.
     - `gh api` reads: through a read-only token for the session, or the `gh-api-guard` hook this skill
       ships, which allows GET and GraphQL queries and asks for everything else
     - **Never write an entry without its guard.** If the user declines the guard, do not write the entry.

   | Host | Read-only commands |
   |---|---|
   | GitHub | `gh pr view`, `gh pr list`, `gh pr diff`, `gh pr checks`, `gh issue view`, `gh issue list`, `gh run view`, `gh run list`, `gh repo view`, `gh auth status` |
   | GitLab | `glab mr view`, `glab mr list`, `glab mr diff`, `glab issue view`, `glab issue list`, `glab ci list`, `glab ci status`, `glab repo view`, `glab auth status` |
   | Gitea | `tea pulls list`, `tea issues list`, `tea repos list`, `tea login list` |
   | Forgejo | `fj pr view`, `fj issue view`, `fj repo view`, `fj whoami` |
   | Azure DevOps | `az repos pr list`, `az repos pr show`, `az pipelines runs list`, `az pipelines runs show`, `az account show` |

   For `tea` and `fj`, check each subcommand against the CLI's `--help` before you offer it. Their
   commands change between releases. Never offer a bare `az *`, because `az` controls the whole Azure
   account.

3. **Show the tiers.** Show safe, good to have, and ask-every-time. Add advanced only if the user
   asked for it. List every candidate as entry, tier, and a one-line reason. Leave out entries
   the user already has. If an existing entry is broader or riskier than the tiers allow, point to
   `review-permissions`. Do not change it here.

4. **Ask what to write and where.** Let the user pick entries, or a whole tier. Then ask for the scope:
   - **user**: applies to every repo the user opens. Only safe entries that are not tied to this repo
     belong here.
   - **project, shared**: committed with the repo, so it applies to every contributor
   - **project, local**: this repo, this machine only (Claude Code's `settings.local.json`)

   Without an answer, write safe entries at user scope and the rest at project local.

5. **Write only what was approved.** Show the diff for each file and ask before you write.
   - Add entries. Never remove or reorder the ones already there.
   - Never remove a deny entry, and never add an entry from the ask-every-time tier, unless the user
     said yes to that exact entry.
   - Write an advanced entry in the same change as its guard: the `--admin` deny entries for
     `gh pr merge --auto` and for the auto-mode merge rule, and the hook for `gh api`.
   - Keep the file valid: read it back and parse it after writing. For Codex, run
     `codex execpolicy check --pretty --rules <file> -- <command>` on one entry if the command exists.
   - Report the files you changed and what each one now allows.

## Propose a deny list

Offer this beside the allow list, with the same harnesses, files, and scopes. It is optional; skip it
if the user declines. The candidates and what each one misses are in
[references/deny-list.md](references/deny-list.md).

1. **Say what deny rules can and cannot do** before the user picks. They are text matches, so a
   reworded command gets past them. `Read(...)` denies do not stop a script from reading the file; the
   sandbox or a hook does. Deny beats allow. The reference has the details and the mode behavior.
2. **Show the candidates** by group: force push, admin merge, repo delete, API delete, recursive
   delete, publish, and secrets. Give one line per entry on what it blocks. Leave out entries the user
   already has.
3. **Let the user pick** groups or single entries, and the scope. Suggest user scope for the secrets
   group.
4. **Append only.** Show the diff and ask before you write. Never remove, reorder, or loosen an existing
   deny entry, and never turn a deny into an ask or an allow. Read the file back and parse it after writing.

## List the next setup skills

End by listing the other installed skills that set up a repo, so the user knows what to run next.
List them only. Never run them.

**Setup skill rule** (the one place to change it):

- name prefixes: `init`, `init-*` → group **Wire a tool into this repo**; `setup-*` → group
  **Configure a hosted service**
- frontmatter field: `metadata: { setup: true }` → group **Wire a tool into this repo**

1. **Read your own list of available skills.** The harness already shows you their names. Do not open
   skill files to build this list. Match each name against the prefixes above. Ignore a plugin prefix
   when matching: `sdd:init` and `buddy-changesets:init-changesets` both match.
2. **Check the field only where it is cheap.** For skills whose files sit in the repo, such as
   `.agents/skills/*/SKILL.md`, read the frontmatter and add those that carry the field. Do not search
   other install locations for it. Never classify a skill by its description.
3. **Leave out** `init-buddy` itself, and any skill whose own documented check shows it is already done
   in this repo (for example `init-changesets` when `.changeset/config.json` exists). If you cannot
   tell without running the skill, list it; the skill's own checks decide when it runs.
4. **Show one line per skill**, under its group: the name as the user would invoke it, and a few words
   on what it sets up. If nothing matches, say there are no other setup skills installed.

## Out of scope

- Installing, enabling, or editing MCP servers
- Editing harness config beyond the allow entries, deny entries, and `gh-api-guard` hook the user approved
- Auditing or tightening an existing allow list (that is `review-permissions`)
- Storing, printing, or moving tokens
- Changing git remotes or repository settings

## References

- GitHub CLI install: https://github.com/cli/cli#installation
- GitLab CLI install: https://gitlab.com/gitlab-org/cli#installation
- Gitea `tea`: https://gitea.com/gitea/tea
- Forgejo CLI `fj`: https://codeberg.org/forgejo-contrib/forgejo-cli
- Azure CLI install: https://learn.microsoft.com/cli/azure/install-azure-cli
- Atlassian remote MCP server: https://github.com/atlassian/atlassian-mcp-server
- Claude Code permissions: https://code.claude.com/docs/en/permissions
- Claude Code permission modes: https://code.claude.com/docs/en/permission-modes
- Claude Code hooks: https://code.claude.com/docs/en/hooks
- Cursor hooks: https://cursor.com/docs/agent/hooks
- Codex hooks: https://developers.openai.com/codex/hooks
- `gh api`: https://cli.github.com/manual/gh_api
- GitHub auto-merge: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request
- Cursor CLI permissions: https://cursor.com/docs/cli/reference/permissions
- Codex rules: https://developers.openai.com/codex/rules
