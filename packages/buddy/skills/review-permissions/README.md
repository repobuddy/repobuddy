# review-permissions

Review what you have allowed your coding agents to do — across every harness on the machine — and get back a risk-ranked list plus a tighter, smaller configuration.

Allowlists grow by accident. Every "always allow" click adds a line, nothing ever removes one, and after a few months the list grants far more than anyone would approve in one sitting. This skill reads that list back to you.

## Usage

```
/review-permissions            # review the current repo plus your user-scope config
/review-permissions <path>     # review another repo
```

## What it covers

| Harness | Config it reads |
| --- | --- |
| Claude Code | `~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, managed settings |
| Cursor CLI | `~/.cursor/cli-config.json`, `.cursor/cli.json` |
| Codex CLI | `~/.codex/config.toml` |
| Copilot CLI | `~/.copilot/config.json` |
| Gemini CLI | `~/.gemini/settings.json`, project settings |
| OpenCode | `~/.config/opencode/opencode.json`, `opencode.json` |

Modes and sandboxes count as permissions too, so `defaultMode`, `approval_policy`, `sandbox_mode`, `approvalMode`, `autoAccept`, trusted folders, writable roots, hooks, and MCP servers are all in scope — an allowlist means nothing underneath a mode that skips the check.

## Auto mode

In Claude Code's auto mode, a matching allow rule resolves before the classifier, so the review places each rule by mode. With `defaultMode: "auto"` in a settings file, or `--mode auto` when you switch to it by hand, it also flags:

- allow rules for outward-facing commands (push, merge, `gh api`, `gh workflow run`, release, publish), which skip the classifier's check of repo, branch, and PR; it suggests leaving them to the classifier, or an `ask` rule if you want a person every time
- broad rules auto mode drops while it is active (`Bash(*)`, `Bash(python*)`, `npm run *`, `Agent`, `Monitor`)
- an `autoMode` block in a project settings file, where the classifier ignores it
- a `soft_deny` or `hard_deny` list without `"$defaults"`, which discards the built-in rules
- template text left in an `autoMode.environment` or `autoMode.allow` entry

## Running the scanner yourself

```bash
# paths are relative to this skill's directory, not your cwd
node ./scripts/scan-permissions.mjs                 # readable report for the current repo
node ./scripts/scan-permissions.mjs <repo> --json   # parseable: findings, consolidation, inventory
node ./scripts/scan-permissions.mjs --all-scopes    # include enterprise-managed files
node ./scripts/scan-permissions.mjs --mode auto      # you run Claude Code in auto mode
```

It reads only; it never writes a config file. Exit code is 0 whenever the scan itself succeeded — findings are data, not failure.

## What you get

- **Risks** — each grant with the worst thing it permits, ranked critical through info. Blanket modes and disabled sandboxes rank above any individual rule, because they make the rules moot.
- **Consolidation** — duplicates, rules already covered by a broader one, grants sitting at the wrong scope, and merge candidates that would not widen anything.
- **A proposed configuration** — as a diff, per file, for you to approve or reject.

## What it will not do

It never widens a permission, never edits a file without showing you the diff first, and never reads a credential file to prove it is reachable. Its output is a *smaller* grant set — if what you want is fewer prompts rather than tighter permissions, it will tell you that is a different request.
