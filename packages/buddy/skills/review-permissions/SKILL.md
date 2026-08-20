---
name: review-permissions
description: "Use this skill when auditing an agent harness allowlist — permission risk, tightening, and cross-harness consolidation."
---

# Review Permissions

Audit the permissions a user has granted their agent harnesses, rank what each grant actually risks, and propose a tighter, smaller set. Apply when the user asks what they have approved, whether their allowlist is safe, why the agent stopped prompting, or wants the list cleaned up after months of clicking "always allow".

This skill **reads and recommends**. It never widens a grant, and it never edits a config file without the user saying yes to a diff they have seen.

## Where permissions live

| Harness | Files (user scope first) | Carries |
| --- | --- | --- |
| Claude Code | `~/.claude/settings.json`, `<repo>/.claude/settings.json`, `<repo>/.claude/settings.local.json`, `/etc/claude-code/managed-settings.json` | `permissions.allow/deny/ask`, `defaultMode`, `additionalDirectories`, hooks, MCP servers |
| Cursor CLI | `~/.cursor/cli-config.json`, `<repo>/.cursor/cli.json` | `permissions.allow/deny`, `approvalMode`, `sandbox` |
| Codex CLI | `~/.codex/config.toml` | `approval_policy`, `sandbox_mode`, `sandbox_workspace_write`, `[projects.*] trust_level`, MCP servers |
| Copilot CLI | `~/.copilot/config.json` | tool allow/deny, trusted folders |
| Gemini CLI | `~/.gemini/settings.json`, `<repo>/.gemini/settings.json` | `tools.allowed`/`excludeTools`, `autoAccept`, per-server `trust` |
| OpenCode | `~/.config/opencode/opencode.json`, `<repo>/opencode.json` | `permission.{edit,bash,...}` |

A harness the scanner does not know is not a harness with no permissions. If the user runs one that is missing here, ask where it stores its config and read that file directly, using the same lens.

## Procedure

1. **Scan.** Run the bundled scanner from the repo being reviewed:

   ```bash
   node <this-skill-dir>/scripts/scan-permissions.mjs <repo> --json
   ```

   `<this-skill-dir>` is the directory holding this SKILL.md, **not** the current working directory — a bare `scripts/…` path resolves against wherever you happen to be. Drop `--json` for the readable form; add `--all-scopes` to include enterprise-managed files.

   The scanner reports `findings` (risk-ranked), `consolidation` (duplicates, subsumed rules, merge and scope candidates), `inventory` (every rule it parsed) and `notes` (files it could not read). Read the **inventory too** — the scanner grades by pattern and knows nothing about this repo, so its silence is not a clearance.

2. **Re-judge every finding against the repo.** The scanner supplies the catalog; you supply the context. A `pnpm build` grant is only as safe as `package.json`'s build script, and a rule naming a script that no longer exists is dead weight to delete. Check what allowed commands actually run before you defend or condemn them.

3. **Look for what the scanner cannot see:**
   - **Escape hatches.** Any rule ending in a wildcard grants the flags too — `git commit *` covers `--no-verify`, `pnpm *` covers every script including ones added later. Whether the harness splits `&&` chains and command substitution before matching varies by harness and version, so never treat a prefix rule as a guarantee.
   - **Reach beyond the repo.** Writable roots, additional directories, and trusted folders outside the project are the difference between a mistake git can undo and one it cannot.
   - **Outward-facing grants.** Push, merge, publish, release, deploy, cloud CLIs, and anything that sends bytes off the machine. These are the grants where an error is public.
   - **Credential paths.** Reads of `.env`, `~/.ssh`, `~/.aws`, `.npmrc`, and any command that prints them into a transcript.
   - **Hooks and MCP servers.** Both run code outside the allowlist's reach — hooks fire around tool calls with no prompt, and a server-wide MCP grant covers tools that server has not shipped yet.
   - **Staleness.** A grant added for one afternoon's task that has been live ever since.

4. **Rank.** Sort by what the grant *permits*, not by how it was worded, and state the worst plausible outcome for anything high or critical.

5. **Report** in the shape below.

6. **Propose the change as a diff.** Show the exact edited file content, say which scope each rule should live at, and ask before writing. If the user approves, apply the edits and re-run the scanner to confirm the result.

## Consolidation rules

Fewer rules are better only when the smaller set grants no more than the larger one.

- **Delete** rules already covered by a broader rule, exact duplicates, and grants for tools or scripts the repo no longer has.
- **Merge** several narrow rules into one prefix rule **only when every invocation that prefix admits is one the user would approve.** Merging `git log`, `git status` and `git diff` into `git *` is not consolidation — it is a widening wearing a tidy hat. Say so when you decline to merge.
- **Re-scope.** Project-specific grants belong in the project file; machine-specific paths belong in the local (uncommitted) file; only genuinely universal, low-risk grants belong at user scope, because a rule there applies to every repo the user ever opens, including ones they have not cloned yet.
- **Prefer deny over allow.** Deny wins over allow in every harness that has both, so a four-line deny list survives a permissive mode and a broad allow rule that a tidy allowlist does not.

## Report format

```
## Permission review — <repo>

Sources: <harness/scope/file, one per line>
Totals:  N allow · N deny · N ask — <counts by risk level>

### Risks
| Grant | Where | Risk | What it permits | Recommendation |

### Consolidation
| Change | Rules | Why it is safe |

### Proposed configuration
<the diff, per file>
```

Close with the one-line bottom line: the single change that removes the most risk. Then ask whether to apply.

## Boundaries

- **Never widen.** Not to fix a prompt the user finds annoying, not as a side effect of merging rules.
- **Never write a secret into the report.** Report that a file is reachable; do not read it to prove the point.
- **Never edit without approval of a shown diff**, and never touch enterprise-managed settings — report them as fixed constraints and route the user to whoever owns them.
- Reducing prompts is a different job. This skill's output is a smaller, tighter grant set; if the user actually wants fewer interruptions, say so plainly rather than quietly loosening the list.
