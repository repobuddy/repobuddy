---
title: buddy env
description: Report the OS, package managers, git hosts, their CLIs, and MCP servers for the init-buddy skill.
---

`buddy env` reports what an agent needs to work with a repository's git host. The `init-buddy` skill runs it.

## Usage

```sh
buddy env [--dir <repo>] [--host <kind[=hostname]>]... [--probe] [--json]
```

## Arguments

| Flag | Type | Default | Effect |
| --- | --- | --- | --- |
| `--dir` | path | the current directory | The repository whose remotes name the git hosts. |
| `--host` | `github` \| `gitlab` \| `bitbucket` \| `azure` \| `gitea` \| `forgejo`, optionally `=<hostname>` | the repository's remotes | A git host to report. Repeat it for more than one. Add `=<hostname>` for a self-hosted instance. |
| `--probe` | boolean | off | Asks an unknown hostname's API which product it runs. Uses the network. |
| `--json` | boolean | off | Prints JSON instead of the summary. |

## What it reports

- **os**: platform, architecture, WSL, Linux distribution family, and whether `sudo` is usable.
- **package managers**: the package managers on `PATH`.
- **hosts**: each git host from the remotes or `--host`, with its CLI: installed or not, version, signed in or not,
  and the install commands that fit this machine.
- **mcp**: MCP servers already configured for those hosts, across agent harnesses. Each is reported by name,
  command, package, and URL origin. Environment values, headers, and URL query strings are never read into the
  output.

## Output

```
os: debian (Ubuntu 26.04.1 LTS) x64, WSL, sudo: needs-password
package managers: brew, apt-get, snap, go, cargo
host: github.com → github [origin]
  cli: gh gh version 2.102.0 (2026-09-30) — authenticated
mcp servers for these hosts: none found
```

## Exit codes

| Code | When |
| --- | --- |
| `0` | Detection ran. |
| `2` | An unknown argument, or `--dir` or `--host` without a value. |

## Related

- [Skill script commands](/repobuddy/cli/skill-scripts/)
- [`init-buddy` skill](/repobuddy/skills/init-buddy/)
