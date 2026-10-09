---
name: agent-readiness
description: "Use this skill when scoring or improving how ready a repo or package is for coding agents, or benchmarking agent cost."
argument-hint: "score [--dir <repo> | --package <path>] [--check] | improve [area] | bench"
---

# Agent Readiness

Score how cheaply and reliably coding agents can work in a repository. The report leads with a
**level** and the **three fixes worth the most**, not a percentage.

Use when asked "is this repo agent-ready", "why do agents struggle here", "what should we fix so
agents work better", "how many tokens does every session load", "fix the readiness findings", "did
that change make agents cheaper", or before handing a repo to unattended agents. Use `--package` when
asked whether a library is easy for *consumers' agents* to use: "can an agent use this package", "is
our public API agent-friendly".

`score` **reads and reports**. It edits nothing. `improve` edits the repository, but only a fix the
user approved, and only one area per commit. A fix another skill owns goes to that skill. `bench`
hands over to ACED's measured layer, which spends money only after a yes.

## Commands

| Command | What it does | Writes |
| --- | --- | --- |
| `score` (default) | Runs the static checks, settles the judgment checks, and reports the level, a score per area, the top fixes, and the tokens loaded per session. `--check` is CI mode (see [CI mode](#ci-mode)) | nothing |
| `score --package <path>` | Scores the consuming side of a package: how cheaply another repo's agent can use it through what ships. Same report shape, its own criteria (see [Package score](#package-score)) | nothing |
| `improve [area]` | Fixes the findings `score` reports as a reviewable series: one area per commit, each fix approved first, owned fixes handed off. Re-scores after each area | the repo, on approval |
| `bench` | Hands over to ACED's `bench` with the suite `repobuddy.readiness`: real agent runs on the repo's fixed task set, compared with permutation tests (see [Bench](#bench)) | what ACED writes |
| `suggest [--area <id>]` | Reads ACED bench comparisons tagged with an area and suggests a weight override, or "keep the weight" (see [Suggesting a weight](#suggesting-a-weight)). Runs no agent | nothing |

## Script

```bash
node <this-skill-dir>/scripts/agent-readiness.mjs score [--dir <repo>] [--json] [--run-knip] [--check [--min-level <1-5>]]
node <this-skill-dir>/scripts/agent-readiness.mjs score --package <path> [--json] [--check [--min-level <1-4>]]
node <this-skill-dir>/scripts/agent-readiness.mjs bench convert <results.json> --arm <label> [--task-set <dir>] [--out <file>]
node <this-skill-dir>/scripts/agent-readiness.mjs suggest [--dir <repo>] [--area <id>] [<comparison.json>...] [--json]
```

`<this-skill-dir>` is the directory holding this SKILL.md, not the current working directory.

The script ships in the `repobuddy` npm package. If `scripts/agent-readiness.mjs` is missing (the skill
was installed from git) or cannot be run, use `npx -y repobuddy@^2.1.0 agent-readiness score` with the
same arguments.

`score` reads files and asks `git` which files are tracked and ignored. It builds, installs, and runs
nothing, so it takes seconds and costs no tokens. There are two exceptions. `--run-knip` opts in to
running the repo's knip command and settles `dead-code` itself, which needs the dependencies
installed. Use it in CI, where no agent is there to run knip. And when the repo has
buddy-agent-harness installed, or is buddy-agent-harness itself, the script runs its read-only
`doctor` and reports each finding in the instructions area. It measures the source too: the share of comments,
JSDoc blocks that document nothing, names that flood a grep, and environment variables the code reads
that no setup document names. Whether a comment or a name is worth
changing stays a judgment. `bench` runs real agents through ACED; see [Bench](#bench).

## Levels

Gates decide the level. A repository is at level N when every gate at levels 1 through N passes, so
strong docs cannot hide a missing verify command. Level 3 is the target.

| Level | Meaning | Gates |
| --- | --- | --- |
| 1 | An agent can read it | README; a build manifest |
| 2 | An agent can check its own work | one verify command; a test command; CI runs that same command |
| 3 | An agent can work without supervision | an instructions file that is accurate and names only real commands; a pinned toolchain; one-step, non-interactive setup |
| 4 | An agent works cheaply | instructions under the token budget; no file over 1000 lines; no committed build output |
| 5 | The cost is measured | a committed `bench` baseline at most 90 days old: `.agents/aced/bench/repobuddy.readiness/baseline.json` |

Security findings **cap** the level instead of subtracting points: a committed secret file or a
literal MCP credential caps it at 1, and an unignored `.env` caps it at 2. The more ready a repo is,
the more autonomously agents act in it, so a leak does more damage there. The CI supply-chain checks
(pinned actions, workflow `permissions:`, a release-age gate) are security checks too, but they only
report: they never cap the level.

The area weights (verification 25, instructions 15, navigability 15, signal-to-noise 15,
self-describing code 10, environment 10, task discovery 5) only order the fixes and the per-area
scores. They are starting estimates. One pilot benched `noise` and found no reason to change it; the
rest are unmeasured. Say so in the report. [references/weights.md](references/weights.md) records
which bench runs each weight rests on: load it when a user disputes a weight or asks where one comes
from.

The weights live in the reference `repobuddy.readiness`, whose default copy ships in
[references/repobuddy.readiness.md](references/repobuddy.readiness.md). A repository overrides them in
`.agents/references/repobuddy.readiness.md`, naming only the areas to change, and cites in the pull
request the `bench` comparison that justifies the change:

```markdown
---
merge: merge-sections
---

## Weights

- verification: 40
- task-discovery: 0
```

`merge: merge-sections` replaces only the `## Weights` section; an area it leaves out keeps its
default. `--package` does not read it. Weights never touch gates or the level, so an override cannot
lower the bar CI holds. The report marks each overridden weight. A malformed item stops the script
(exit 2) rather than scoring with a guess. A legacy `.agents/readiness/weights.json` is still read
when no project override exists; the script then prints the override file to create.
Offer to create it, and to delete the JSON file, on the user's yes.

### Suggesting a weight

`suggest` turns a repo's own bench evidence into a weight suggestion. It reads ACED's comparison
records of the suite `repobuddy.readiness` that carry an `area` tag, by default every one under
`.agents/aced/results/bench/repobuddy.readiness/`. To produce one, bench before and after one area's
change and compare with `--tag area=<id>` (ACED's `bench` skill passes the tag through as given).

- An area's **effects** are a pass-rate change on a task, or a pooled change in input tokens, output
  tokens, turns, or tool calls, at p < 0.05 with enough runs to reach it. Dollars never decide; the
  pooled cost row is shown as evidence only.
- An effect counts only when **two or more comparisons** show it the same way and none the other way.
- A counted effect moves the weight **one step of 5**, clamped to 0-40; pass rate and effort count
  the same, and if they disagree the weight stays. Anything else prints **"keep the weight"**, which
  is a finding too: report it.

The script prints the `- <area>: <weight>` line for the `## Weights` section of
`.agents/references/repobuddy.readiness.md` and never writes the file. Offer to add it on the user's
yes, and put the evidence it prints in the pull request that adds the override. A suggestion changes
this repo's override only; the defaults change only on results across repositories
([references/weights.md](references/weights.md)).

## CI mode

`score --check --min-level <n>` holds a repository at a level in CI. It exits 1 when the level is
below `n` and 0 otherwise. `--min-level` takes 1 to 5 and defaults to 3, the target.

CI cannot settle `judge` checks, so it treats them as **unknown**: only the gates the script decides
count, and security caps still apply. When the check passes, the script lists the unsettled judgment
gates at or below `n` as provisional; they never change the exit code. Run `score` without `--check`
to settle them.

`--check` works the same with `--package`, holding a package at its own level. A package tops out at
level 4, so there `--min-level` takes 1 to 4.

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
5. **Offer the next step.** Offer `improve` for the area of the first fix, and `file-issue` for
   fixes the user wants tracked instead. Change nothing without a yes.

| Area | Reference | Fixes hand off to |
| --- | --- | --- |
| Verification loop | `references/areas/verification.md` | `setup-github-repo` for CI |
| Agent instructions | `references/areas/instructions.md` | `buddy-agent-harness` |
| Navigability | `references/areas/navigability.md` | none |
| Signal-to-noise | `references/areas/noise.md` | none |
| Self-describing code | `references/areas/self-describing.md` | none |
| Environment and setup | `references/areas/environment.md` | none |
| Task discovery | `references/areas/task-discovery.md` | `file-issue` for templates |
| Security | `references/areas/security.md` | `review-permissions`, `setup-github-repo`, `min-release-age`, `setup-npm-trusted-publishing` |

## Report

```markdown
## Agent readiness: Level <n> of 5 — <meaning>
<one line: what holds it at this level, and the security cap if any>

### Fix first
1. **<fix>** (<area>, gate for level <n+1> | security) — <why it matters here>. Owner: <skill or "you">.
2. …
3. …

### Tokens loaded per session
~<total> (instructions ~<n>, skill descriptions ~<n>). <one line on the biggest contributor>

### Prompt-injection surface (not scored)
<hooks and MCP servers from `injectionSurface` that fetch untrusted content, and what they fetch; or "none">

### Areas
| Area | Weight | Score | Notes |
| --- | --- | --- | --- |

### Judgment calls
| Check | Result | Reason |
| --- | --- | --- |

Weights are starting estimates; bench results have not yet revised any.
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
   it; record the skip. A fix that states what the project will not do (`instructions-scope`) is a
   draft for the owner to rewrite, never a boundary you chose; in a monorepo, draft the root lines and
   one `GOALS.md` per failing package, never a root one. A fix that also needs a change in another area (a new verify script that the
   instructions file must name) edits only this area's files now and leaves the rest to that area.
4. **Verify.** Run the repo's verify command when one exists. If it fails because of this area's
   edits, fix that or revert the edit, with the user's say.
5. **Commit the area.** Stage only the files this area's approved fixes touched, by name. Show the
   staged diff, then commit one Conventional Commit for the area (`ci:` for CI, `docs:` for docs,
   `chore:` otherwise, when the repo uses the convention). Skip the commit when nothing was approved.
   If the user asked for no commits, leave the changes staged and stop after this area.
6. **Hand off owned fixes.** After the commit, offer to run each owner skill for its findings, one
   at a time. What an owner changes is its own work and its own commit, never this area's. When the
   owner skill is not installed, name it and how to get it, or offer `file-issue`. The repobuddy
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

## Package score

`score --package <path>` scores a package the way a consumer's agent meets it: through the
declarations, `exports` map, README, changelog, and `llms.txt` that ship, not the source. `<path>` is
the package folder, or an installed copy under `node_modules`. It runs the same steps as `score`, with
these levels:

| Level | Meaning | Gates |
| --- | --- | --- |
| 1 | An agent can find it | README; an entry point in package.json |
| 2 | An agent can call it | type declarations ship; a clean `exports` map |
| 3 | An agent can use it without reading the source | a doc comment on every export; no `any` in the public API; README examples that run; errors that say what to do |
| 4 | An agent keeps up with it cheaply | a parseable changelog with breaking changes labelled; an `llms.txt` that is accurate and checked for drift |

The JSDoc rule flips here: inside a repo, comments that restate code are noise, but a one-line doc on an
exported symbol is often the only prose a consumer's agent sees. Document the surface, cut inside.

If the declarations are declared but not built, the declaration checks come back `judge`. Build the
package or point `--package` at an installed copy and run again; do not guess them.

Two things are reported, not scored: the **public surface** (distinct exports and the declaration
tokens an agent reads to learn the API; smaller is cheaper, but size is not a defect), and a
**shipped agent skill** (useful, not required). Report them in place of the tokens-per-session line.

| Area | Reference | Fixes hand off to |
| --- | --- | --- |
| Types and exports | `references/areas/package-api.md` | none |
| Docs | `references/areas/package-docs.md` | none |
| Errors | `references/areas/package-errors.md` | none |
| Changelog | `references/areas/package-changelog.md` | `init-changesets` (repobuddy/agent-changesets) |
| llms.txt | `references/areas/package-llms-txt.md` | `llms-txt` |

Every `llms.txt` fix goes to `llms-txt`, which generates the file and wires its drift check. This
skill never writes one. `improve` works on the repository areas only; for a package finding, offer the
fix or its owning skill as `score` does.

## Bench

`bench` answers whether `score` means anything: it runs real agents on fixed tasks and measures what
they cost. It now lives in ACED's measured layer, which owns the engine, the records, and the
statistics. Readiness supplies the suite `repobuddy.readiness` and reads its baseline for level 5.
Compare one area's changes at a time, or the effect of each cannot be told apart: to measure an
`improve` area, bench before it and again after its commit, and tag the comparison with the area
(`--tag area=<id>`) for [`suggest`](#suggesting-a-weight).

1. **Hand over.** With the ACED plugin installed, load its `bench` skill by name and give it the suite
   `repobuddy.readiness`, and the arms when the user named them. It checks fit, shows the plan, asks
   for an explicit yes, runs, and reports the verdict. Follow it; add nothing to its numbers.
2. **Without the plugin,** run ACED's engine with `npx -y -p cyber-aced@^0.4.0 aced-bench`, under the
   same rule: `plan --suite repobuddy.readiness --arm <label>=<subject> … --out <plan.json>` spends
   nothing; show the user every line of the plan, including its ceiling, the permission mode, and its
   warnings; run `run --plan <plan.json> --consent` only after their explicit yes to that plan; then
   `compare --suite repobuddy.readiness --before <record|baseline> --after <record>`. Never pass
   `--consent` on your own, or on a yes relayed by anyone but the user. With no user present, run
   nothing.
3. **The suite** lives at `.agents/aced/bench/repobuddy.readiness/`: `tasks.json`, `checks/`, and the
   committed `baseline.json`. A missing task set gets ACED's `init` template, which the user fills with
   3-5 tasks of this repo's own: a seeded bug, a small feature, a question whose answer the `check` can
   grep. Write no task yourself.

**Moving a `.agents/readiness/bench/` folder.** `agent-readiness.mjs bench` now only prints this handover. A repo with
`.agents/readiness/bench/` moves it with `git mv .agents/readiness/bench
.agents/aced/bench/repobuddy.readiness`, points any check paths in `tasks.json` at the new folder, and
records a new baseline with ACED: the engine reads only schema version 3. `bench convert` turns a
legacy results file into a version-3 record, so `aced-bench compare` can re-read a legacy pair; see
[references/bench-results.md](references/bench-results.md). Converted records compare only with each
other, never with a run ACED made.

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
- Running ACED's `run --consent` before the user has seen the plan and said yes to it
- Reporting a median change as an effect when the comparison says it is noise or too few runs to call
- Benching several areas changed at once

## References

- Factory's Agent Readiness model, whose gated levels this adapts: https://factory.ai/news/agent-readiness
- Area criteria: `references/areas/` (load only the areas with `judge` checks or disputed results;
  `package-*.md` apply to `score --package` only)
- Old bench results and converting them: `references/bench-results.md` (load when a repo still has
  `.agents/readiness/bench/` or old results files)
- Weight provenance: `references/weights.md` (load when a weight is disputed or its source asked for)
- The default weights: `references/repobuddy.readiness.md` (the script reads it; load it only to show a
  user the override format)
