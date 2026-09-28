---
name: agent-readiness
description: "Use this skill when scoring how ready a repo is for coding agents — gated level, top fixes, tokens per session."
argument-hint: "score [--dir <repo>]"
---

# Agent Readiness

Score how cheaply and reliably coding agents can work in a repository. The report leads with a
**level** and the **three fixes worth the most**, not a percentage.

Use when asked "is this repo agent-ready", "why do agents struggle here", "what should we fix so
agents work better", "how many tokens does every session load", or before handing a repo to
unattended agents.

This skill **reads and reports**. It edits nothing. Each fix it names goes to the skill that owns
it, or to the user.

## Commands

| Command | What it does | Writes |
| --- | --- | --- |
| `score` (default) | Runs the static checks, settles the judgment checks, and reports the level, a score per area, the top fixes, and the tokens loaded per session | nothing |

## Script

```bash
node <this-skill-dir>/scripts/agent-readiness.mjs score [--dir <repo>] [--json]
```

`<this-skill-dir>` is the directory holding this SKILL.md, not the current working directory.

The script ships in the `repobuddy` npm package. If `scripts/agent-readiness.mjs` is missing (the skill
was installed from git) or cannot be run, use `npx -y repobuddy@^1.11.0 agent-readiness score` with the
same arguments.

It reads files and asks `git` which files are tracked and ignored. It builds, installs, and runs
nothing, so it takes seconds and costs no tokens.

## Levels

Gates decide the level. A repository is at level N when every gate at levels 1 through N passes, so
strong docs cannot hide a missing verify command. Level 3 is the target.

| Level | Meaning | Gates |
| --- | --- | --- |
| 1 | An agent can read it | README; a build manifest |
| 2 | An agent can check its own work | one verify command; a test command; CI runs that same command |
| 3 | An agent can work without supervision | an instructions file that is accurate and names only real commands; a pinned toolchain; one-step, non-interactive setup |
| 4 | An agent works cheaply | instructions under the token budget; no file over 1000 lines; no committed build output |

Security findings **cap** the level instead of subtracting points: a committed secret file or a
literal MCP credential caps it at 1, and an unignored `.env` caps it at 2. The more ready a repo is,
the more autonomously agents act in it, so a leak does more damage there.

The area weights (verification 25, instructions 15, navigability 15, signal-to-noise 15,
self-describing code 10, environment 10, task discovery 5) only order the fixes and the per-area
scores. They are starting estimates, not measurements. Say so in the report.

## Score

1. **Run the script** with `--json` from the repository root, or pass `--dir`.
2. **Settle every `judge` check.** The script cannot decide these. For each one, load **only** its
   area's reference below, read the evidence it names, and decide pass or fail with one line of
   reason. Settle the gates in `pendingJudgments` first: a failed one lowers the level to the level
   below it.
3. **Re-judge `fail` results that look wrong.** The script matches patterns. A `dist/` folder that is
   a published artifact the repo deliberately commits is still noise to search, but say why it is
   there. Never flip a security failure without reading the file.
4. **Report** in the shape below.
5. **Offer the next step.** For each top fix with an owner, offer to run that skill. For the rest,
   offer to open an issue with `create-issue` or make the change. Change nothing without a yes.

| Area | Reference | Fixes hand off to |
| --- | --- | --- |
| Verification loop | `references/areas/verification.md` | `setup-github-repo` for CI |
| Agent instructions | `references/areas/instructions.md` | `buddy-agent-harness` |
| Navigability | `references/areas/navigability.md` | none |
| Signal-to-noise | `references/areas/noise.md` | none |
| Self-describing code | `references/areas/self-describing.md` | none |
| Environment and setup | `references/areas/environment.md` | none |
| Task discovery | `references/areas/task-discovery.md` | `create-issue` for templates |
| Security | `references/areas/security.md` | `review-permissions`, `setup-github-repo`, `min-release-age`, `setup-npm-trusted-publishing` |

## Report

```markdown
## Agent readiness: Level <n> of 4 — <meaning>
<one line: what holds it at this level, and the security cap if any>

### Fix first
1. **<fix>** (<area>, gate for level <n+1> | security) — <why it matters here>. Owner: <skill or "you">.
2. …
3. …

### Tokens loaded per session
~<total> (instructions ~<n>, skill descriptions ~<n>). <one line on the biggest contributor>

### Areas
| Area | Weight | Score | Notes |
| --- | --- | --- | --- |

### Judgment calls
| Check | Result | Reason |
| --- | --- | --- |

Weights are starting estimates; they are not yet measured against agent runs.
```

Keep the fix list to three. The full check list is in the script output if the user asks for it.

## Anti-patterns

- Reporting an average percentage as the headline, or letting a high area score excuse a failed gate
- Passing a `judge` check without reading the evidence it names
- Re-implementing a check another skill owns (harness config, permissions, branch protection) instead of handing it off
- Printing a secret's value. Name the file and the key, never the value
- Editing the repository during `score`

## References

- Factory's Agent Readiness model, whose gated levels this adapts: https://factory.ai/news/agent-readiness
- Area criteria: `references/areas/` (load only the areas with `judge` checks or disputed results)
