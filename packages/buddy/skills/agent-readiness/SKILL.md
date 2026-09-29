---
name: agent-readiness
description: "Use this skill when scoring or improving how ready a repo is for coding agents — gated level, fixes, tokens per session."
argument-hint: "score [--dir <repo>] | improve [area]"
---

# Agent Readiness

Score how cheaply and reliably coding agents can work in a repository. The report leads with a
**level** and the **three fixes worth the most**, not a percentage.

Use when asked "is this repo agent-ready", "why do agents struggle here", "what should we fix so
agents work better", "how many tokens does every session load", "fix the readiness findings", or
before handing a repo to unattended agents.

`score` **reads and reports**. It edits nothing. `improve` edits the repository, but only a fix the
user approved, and only one area per commit. A fix another skill owns goes to that skill.

## Commands

| Command | What it does | Writes |
| --- | --- | --- |
| `score` (default) | Runs the static checks, settles the judgment checks, and reports the level, a score per area, the top fixes, and the tokens loaded per session | nothing |
| `improve [area]` | Fixes the findings `score` reports as a reviewable series: one area per commit, each fix approved first, owned fixes handed off. Re-scores after each area | the repo, on approval |

## Script

```bash
node <this-skill-dir>/scripts/agent-readiness.mjs score [--dir <repo>] [--json]
```

`<this-skill-dir>` is the directory holding this SKILL.md, not the current working directory.

The script ships in the `repobuddy` npm package. If `scripts/agent-readiness.mjs` is missing (the skill
was installed from git) or cannot be run, use `npx -y repobuddy@^1.11.0 agent-readiness score` with the
same arguments.

It reads files and asks `git` which files are tracked and ignored. It builds, installs, and runs
nothing, so it takes seconds and costs no tokens. It measures the source too: the share of comments,
JSDoc blocks that document nothing, and names that flood a grep. Whether a comment or a name is worth
changing stays a judgment.

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
5. **Offer the next step.** Offer `improve` for the area of the first fix, and `create-issue` for
   fixes the user wants tracked instead. Change nothing without a yes.

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

## Improve

`improve [area]` turns findings into commits. `area` is one of the script's area ids: `security`,
`verification`, `instructions`, `navigability`, `noise`, `self-describing`, `environment`,
`task-discovery`. Without one, work the areas in the order of the ranked fix list (the area of the
first failed fix goes first, so security leads when it has a finding), and ask before starting each
next area.

**Before the first area:**

- Stop if the working tree has uncommitted changes, and ask the user to commit or set them aside. A
  commit made here must hold this skill's edits and nothing else.
- On the default branch, offer to create a branch first.
- Run **Score** steps 1–3 and keep the result as the baseline: level, and the area's score.

**For each area:**

1. **List the area's findings.** Every check in the area with status `fail`, plus each `judge` check
   you settled as fail. Load that area's reference.
2. **Split them by owner.** A fix is owned by the check's `handoff` field, or by the area's row in the
   **Score** table, or by the security reference's hand-off table, or by `llms-txt` when the finding is
   about `llms.txt`. Owners are `buddy-agent-harness` (instructions, harness config), `llms-txt`,
   `review-permissions`, `setup-github-repo`, `min-release-age`, and `setup-npm-trusted-publishing`.
   This skill does not edit what an owner owns, even when the change looks small.
3. **Propose each unowned fix, one at a time.** Name the check, the files it touches, and the change
   (a diff, or a short description for a large one). Apply it only on a yes. A no, or no answer, skips
   it; record the skip. A fix that also needs a change in another area (a new verify script that the
   instructions file must name) edits only this area's files now and leaves the rest to that area.
4. **Verify.** Run the repo's verify command when one exists. If it fails because of this area's
   edits, fix that or revert the edit, with the user's say.
5. **Commit the area.** Stage only the files this area's approved fixes touched, by name. Show the
   staged diff, then commit one Conventional Commit for the area (`ci:` for CI, `docs:` for docs,
   `chore:` otherwise, when the repo uses the convention). Skip the commit when nothing was approved.
   If the user asked for no commits, leave the changes staged and stop after this area.
6. **Hand off owned fixes.** After the commit, offer to run each owner skill for its findings, one
   at a time. What an owner changes is its own work and its own commit, never this area's. When the
   owner skill is not installed, name it and how to get it, or offer `create-issue`. The repobuddy
   skills install with `npx skills add repobuddy/repobuddy --skill <name>`; buddy-agent-harness is a
   separate plugin (https://github.com/repobuddy/buddy-agent-harness).
7. **Re-score.** Run **Score** steps 1–3 again. Report the level change and the area's score change,
   and name the gate that still holds the level when it did not move.

```markdown
### <area>: <n> fixed, <n> handed off, <n> skipped
Level <before> → <after>. <area> <score before> → <score after>. Commit <short sha>, or "no commit".
- fixed: <check> — <one line>
- handed off: <check> → <owner skill>, <what it did, or "offered">
- skipped: <check> — <user's reason, if given>
<when the level did not move: the gate that holds it>
```

**Security fixes.** A committed secret must be rotated, and rotation happens outside the repo. Tell
the user to rotate it first, and untrack and ignore the file only after they confirm. Never print the
value, in a diff or a message.

## Anti-patterns

- Reporting an average percentage as the headline, or letting a high area score excuse a failed gate
- Passing a `judge` check without reading the evidence it names
- Re-implementing a check another skill owns (harness config, permissions, branch protection) instead of handing it off
- Printing a secret's value. Name the file and the key, never the value
- Editing the repository during `score`
- Applying a fix the user did not approve, or treating an earlier yes as approval for the next fix
- Committing two areas together, or mixing an owner skill's changes into this area's commit
- Fixing something an owner skill owns instead of handing it off
- Reporting an area as improved without re-running `score`

## References

- Factory's Agent Readiness model, whose gated levels this adapts: https://factory.ai/news/agent-readiness
- Area criteria: `references/areas/` (load only the areas with `judge` checks or disputed results)
