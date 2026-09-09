# merge-dep-prs

Works through a repository's open dependency-update PRs — classifies them, gates each merge on whether CI actually verified what the change can reach, fixes the ones that fail, and never touches a release PR.

## When to use

- "merge the pending dependency PRs"
- "land the Renovate updates across these repos"
- "clean up the PR queue"
- "why is this dep PR failing?"

## What it does

1. Lists the open PRs and keeps only dependency updates — Renovate, Dependabot, and manual bumps — while skipping anything whose purpose is to trigger a release
2. Sorts them by CI status: passing, pending, failing, behind base, obsolete
3. **Gates the merge on verification reach covering blast radius** (below) rather than on a green check
4. Merges what clears the gate; diagnoses and fixes what fails, with recipes for the common breakages — ignored build scripts, Turbo's `pipeline`→`tasks` rename, new linter rules, TypeScript majors, ESM resolution, workflows that will not re-trigger
5. Adds a changeset where the repo needs one, and closes PRs the base branch has already superseded

## The merge gate

The thing most worth knowing about this skill: **it does not merge on green.**

A green check is evidence about exactly one thing — what CI executed. Two independent quantities decide whether that is enough:

- **Blast radius** — what consumes the artifact the PR changes
- **Verification reach** — what the green check actually ran

The merge condition is **reach ⊇ radius**. Where reach falls short, green says nothing at all about the uncovered part.

The case that produced this rule: a `changesets/action` v1 → v2 bump in an org `.github` repo, in the reusable release workflow 30 repos call. The PR was correct, renamed every input properly, and passed every check. The v2 action then refuses `@changesets/cli` v2 at runtime, and the release job broke in 25 downstream repos — each going red days later, one at a time, on its own next push. A `.github` repo has no test suite because everything it ships runs somewhere else, so its reach was zero against a radius of 30.

It is not a rule about major versions. A patch release can carry the same break, and a major devDependency bump in a leaf repo carries none.

So before merging, the skill asks whether the diff touches a consumed artifact (reusable workflow, composite action, published package or preset, container image, depended-on workspace package); whether anything shrank CI's reach (no test suite, affected-only selection, path-filtered jobs that skipped); and if reach falls short, it enumerates the consumers and checks what each one resolves. The same applies inside a single monorepo, where `turbo --filter` or `nx affected` deliberately shrinks reach and misses edges the task graph does not model.

The outcome is then an explicit decision — hold until consumers are ready, or merge and immediately open the follow-ups — never a fall-through to merge-on-green.

## How to invoke

Ask for it directly, or invoke `/merge-dep-prs` where slash commands are supported. Works on GitHub via `gh` and on GitLab via `glab`.

## What it produces

Merged dependency PRs that cleared the gate, fixes pushed to the ones that failed CI, closed obsolete PRs, and — for any PR whose blast radius outran CI's reach — a named decision with the consumer list behind it.

## Install

```sh
npx skills add repobuddy/repobuddy --skill merge-dep-prs
```
