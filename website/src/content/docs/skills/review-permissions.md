---
title: review-permissions
description: Audit what you have allowed your coding agents to do across every harness on the machine and propose a tighter configuration.
---

`review-permissions` reads the permission config of each harness, ranks risks, finds duplicates and misplaced grants,
and proposes a smaller configuration as a diff.

## When to use

- Allowlists grew by "always allow" clicks and nobody pruned them.
- You want a risk-ranked view of what agents may run.
- You want to merge duplicate or covered rules.

If you want fewer prompts rather than tighter permissions, that is a different request, and it says so.

## Invoke

```
/review-permissions            # current repo plus user-scope config
/review-permissions <path>     # another repo
```

| Harness | Config it reads |
| --- | --- |
| Claude Code | `~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, managed settings |
| Cursor CLI | `~/.cursor/cli-config.json`, `.cursor/cli.json` |
| Codex CLI | `~/.codex/config.toml` |
| Copilot CLI | `~/.copilot/config.json` |
| Gemini CLI | `~/.gemini/settings.json`, project settings |
| OpenCode | `~/.config/opencode/opencode.json`, `opencode.json` |

Modes, sandboxes, trusted folders, writable roots, hooks, and MCP servers count as permissions too.

## What it produces

- Risks ranked critical through info. Blanket modes and disabled sandboxes rank above single rules.
- Consolidation: duplicates, rules a broader one covers, grants at the wrong scope, safe merges.
- A proposed configuration as a diff per file.

It never widens a permission, never edits a file before showing the diff, and never reads a credential file to prove it
is reachable.

## Requirements

Node.js. The scanner is committed with the skill, so a git install has it:

```sh
node ./scripts/scan-permissions.mjs [<repo>] [--json] [--all-scopes]
```

Paths are relative to the skill directory. It only reads, and exits 0 whenever the scan succeeded.

## Related

[`init-buddy`](/repobuddy/skills/init-buddy/) writes the starter allow and deny lists this skill audits.

## Example

```
/review-permissions ../other-repo
```

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/review-permissions).
