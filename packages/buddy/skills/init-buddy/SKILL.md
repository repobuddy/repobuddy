---
name: init-buddy
description: "Use this skill when setting up gh, glab, or another git host CLI here, or when one is missing or logged out."
argument-hint: "[github|gitlab|bitbucket|azure|gitea|forgejo[=hostname]]"
---

# Init Buddy

Set up this machine so an agent can work with the repository's git host: detect the OS and package
managers, find the host's CLI and any MCP server already configured for it, then install and
authenticate the CLI the user wants.

## When to use

- First use of repobuddy skills in a repo, or "set up my environment for GitHub/GitLab/…"
- A skill needs `gh`, `glab`, `tea`, `fj`, or `az` and the command is missing or not logged in
- The user asks whether their machine is ready to work with a git host

## Detect

Run the detection script from this skill's directory:

```bash
node <this-skill-dir>/scripts/detect-env.mjs [--host <kind[=hostname]>]... [--probe] [--json]
```

- It reads the hosts from the repo's git remotes. Pass `--host` when there is no repo, when the user names a host, or to add a self-hosted instance (`--host gitlab=git.corp.example`).
- If a host shows as `unknown`, re-run with `--probe`. It asks that host's API which product it runs.
- It reports the OS family (`macos`, `windows`, `debian`, `fedora`, `rhel`, `arch`, `suse`, `alpine`, `nixos`, `other`), WSL, whether `sudo` works without a password, the package managers on PATH, and each host's CLI: whether it is installed and logged in, and the install options that fit this machine.
- It lists MCP servers for those hosts from Claude Code (including plugins), Cursor, Codex, Copilot CLI, Gemini CLI, VS Code, Windsurf, OpenCode, and Zed. It prints names, commands, and URL origins only. Never open those config files to show more, because they often hold tokens.

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

## Out of scope

- Installing, enabling, or editing MCP servers or harness config
- Storing, printing, or moving tokens
- Changing git remotes or repository settings

## References

- GitHub CLI install: https://github.com/cli/cli#installation
- GitLab CLI install: https://gitlab.com/gitlab-org/cli#installation
- Gitea `tea`: https://gitea.com/gitea/tea
- Forgejo CLI `fj`: https://codeberg.org/forgejo-contrib/forgejo-cli
- Azure CLI install: https://learn.microsoft.com/cli/azure/install-azure-cli
- Atlassian remote MCP server: https://github.com/atlassian/atlassian-mcp-server
