# skill-commit: conclusion

## Last updated

November 2026

## Question

Should repobuddy ship a `commit` agent skill (`packages/buddy/skills/commit/SKILL.md`) whose Intent is: plan how
a working tree splits into commits, then stage and commit one unit of work at a time with no interactive git,
safely enough for an agent to run unattended, and hand back the commits and a report (commits, checks run,
files left uncommitted); never push, amend, or open an editor, pager, or prompt? Adopt an existing skill,
extend one, or build?

## Verdict

**Extend** (owner decision, confirmed by the research): keep the existing repobuddy `commit` skill and grow
it, with `commit-work`'s planned split and lean run as the baseline. No surveyed skill meets the Intent whole.
**The research changes nothing in the Intent.** It surfaces two refinements to the skill body (not the Intent):
see "Candidate refinements".

1. **Idea: the job is real.** Splitting work into logical, reviewable commits is long-standing git guidance, and
   agents now need it spelled out because they default to `git add .` and interactive flows (E1, E2, E3).
2. **Feasibility: yes on all four harnesses, with one real limit.** Each loads Agent Skills and can run shell git
   (E5-E8). Codex's default sandbox makes `.git` read-only, so staging and committing may need an approval or a
   wider sandbox (E6).
3. **Prior art: partial matches only.** Several skills write messages, or commit in one batch; none combines
   a planned multi-commit split, no interactive git, a never-commit-red-checks rule, and a structured
   report (E9-E14).

## Reference material

### Harness feasibility (shell git from a skill, hooks, Agent Skills)

| Harness | Loads Agent Skills | Shell git, no TTY | Git hooks | Limit to design for |
| --- | --- | --- | --- | --- |
| Claude Code | yes, skills run via the `Skill` tool (E5) | yes, Bash tool; default 2 min timeout, max 10 min (E5) | run by git itself, not by the harness (inference; the Claude Code docs I read do not state it, unverified) | an interactive prompt (editor, pager, `git add -p`) has no terminal to answer it; command times out |
| Codex | yes, `.agents/skills` (E6) | yes; `codex exec`, `-a never` skips prompts (E6) | unverified | default sandbox: network off, and `.git` read-only even in workspace-write (E6) |
| Cursor | yes, `.agents/skills`, `.cursor/skills`, also reads `.claude/skills` (E7) | yes, agent runs referenced scripts; approvals and sandbox not covered on the skills page (E7) | unverified | one third-party skill claims the CLI needs a real TTY or it hangs; contradicted by `--print` guides (E7, unverified) |
| GitHub Copilot CLI | yes, `.github/skills`, `.claude/skills`, `.agents/skills` (E8) | yes; `--allow-tool 'shell(git:*)'` grants git, `--deny-tool` wins (E8, third-party) | CLI has its own hooks; whether its `git commit` runs pre-commit is unverified (E8) | reported auto-appended `Co-authored-by: Copilot` trailer, which can trip commitlint (E8, unverified) |

### Prior art against the Intent

| Skill | Plans split | No interactive git | Checks before commit | Report | Verdict |
| --- | --- | --- | --- | --- | --- |
| commit-work (softaworks/agent-toolkit, 4.2K installs) | yes, split axes, lean steps | no: `git add -p`, `git commit -v`, "prefer an editor" | one "smallest verification", after commit | message and summary per commit | best baseline for plan and lean run; unsafe unattended (E9) |
| github/awesome-copilot `git-commit` (48.7K) | one logical change per commit, no plan step | yes: bans `git add -p`/`-i`, uses `-m`/`-F` | none | `git log -1 --stat`, status | strongest safety prose, plus merge/cherry-pick/unmerged handling repobuddy lacks (E10) |
| getsentry/skills `commit` (4.9K) | "one coherent change" only | yes: separate `-m`, no editor | none | none | message-style skill; no split plan (E11) |
| juliusbrussee/caveman `caveman-commit` (437K) | no | n/a: writes message only, never commits | none | message block | message compression only (E12) |
| sentimony/skills `commit-all` (3.7K) | no: one commit of everything | partly | none | progress update | opposite of the split goal; also offers push/pr (E13) |
| open-mercato `om-check-and-commit` (3.5K) | no | yes (non-interactive commit) | yes, full gate | validation outcome | commits and pushes; wrong scope and no split (E14) |
| mattpocock `setup-pre-commit` (551K) | n/a | n/a | n/a | n/a | installs hooks, not a commit workflow (E15) |

Not read, listed by `npx skills find commit`: everyinc `ce-commit` (the raw path I tried returned 404),
`ce-commit-push-pr`, zc277584121 `git-commit-push` and `git-commit-pr`, fandhe-ai `create-commit`, affaan-m
`conventional-commit-review`, github `conventional-commit`. By name alone, `ce-commit-push-pr`, `git-commit-push`,
and `git-commit-pr` include push or PR steps; everything else about them is unverified.

### commit-work: strengths and gaps (E9)

- Strengths: plans boundaries before staging (feature vs refactor, formatting vs logic, tests vs prod, bumps vs
  behavior); one-sentence test ("if you cannot describe it cleanly, split"); about 60 lines plus one template,
  so cheap to load; a deliverable list.
- Gaps against the Intent: `git add -p`, `git restore --staged -p`, `git commit -v`, "prefer an editor" all
  block with no TTY; asks the user for commit style and counts (the Intent decides, not asks); verification
  runs after staging as "smallest relevant", with no rule that red checks block the commit; no secret stop, no
  hook discovery, no handling of an already-staged index, no no-push/no-amend rule, no uncommitted-files report.

### What repobuddy's skill already has beyond commit-work

Read from `packages/buddy/skills/commit/SKILL.md` (E16): plan stated before the first `git add`; stat-first reads
of the diff; named staging only; ban on editor/pager/`-p`/`-v`; `--no-pager`; red-check stop; hook discovery;
message written to a file, `git commit -F`; no push/amend/rebase; secret stop; "decide, do not ask" with a
defined fallback when undecidable; seven "Done when" checks (C1-C7); reference-skill overrides for message
style and release notes.

## Candidate refinements (not Intent changes)

- R1. Sandbox-blocked git: say that when the harness blocks `git add` or `git commit` (for example Codex's
  read-only `.git`, E6), the run stops and reports the block as "uncommitted: blocked by sandbox"; it never
  changes sandbox, config, or hooks to get around it. The Intent's "report files left uncommitted" already covers
  the outcome; the skill body does not yet name the cause.
- R2. In-progress operations: `git-commit` (E10) checks for `MERGE_HEAD`, `CHERRY_PICK_HEAD`, unmerged files
  before staging, because unstaging would drop the other side. repobuddy's step 1 unstages files from the index;
  it should first detect an operation in progress and stop. Not covered by repobuddy's rules today (E16).
- R3. Provider trailers: Copilot CLI may append a `Co-authored-by` trailer (E8, unverified). C3 already allows
  the "trailers the harness supplies"; no change unless commitlint trips on it.

## Confidence

Medium-high on the Idea and prior art (primary skill sources read in full or in part). Medium on feasibility:
Claude Code, Codex, and Cursor skill support are from official docs; Copilot shell limits and Cursor TTY are
third-party or thin; hooks behavior is largely unverified for non-Claude harnesses.

## Strongest supporting evidence

- Git's own contributor guide: one change per commit; if the description gets long, split; message explains
  why (E2).
- Conventional Commits ties commit types to automated changelog and semver, so the message is a machine input
  (E3), which is why repobuddy delegates message style to `commit.message`.
- github's `git-commit` skill independently bans `git add -p`/`-i` as "wait for input from a person" (E10),
  matching the Intent's no-interactive rule; getsentry says "never ... open an interactive editor" (E11).

## Strongest weakening evidence

- A shipped alternative exists with a large install base (`git-commit`, 48.7K) and more edge-case handling
  (E10). Extending repobuddy's skill is justified by the split plan and red-check rule it lacks, not by safety
  prose alone.
- commit-work's prose does not match its own claims of being "safe to ship" unattended (E9): the baseline is
  taken for its structure, not its commands.

## What is not supported

- That any surveyed skill can be adopted unchanged for unattended use.
- That Cursor needs a TTY for skills (conflicting third-party claims, E7).
- That Codex git writes fail in practice: only the documented read-only `.git` is cited; not tested.

## Where evidence is thin

- Hook behavior (run, blocked, no TTY) on Codex, Cursor, and Copilot CLI.
- Install numbers are from `skills.sh` listings, not usage quality.
- Unread skills in the listing (above).

## Check again later

- Codex sandbox treatment of `.git` and whether `git add` works under workspace-write (run one trial).
- Copilot CLI trailer behavior and whether a documented opt-out exists.
- New commit skills in `npx skills find commit`, especially ones with a split plan.
