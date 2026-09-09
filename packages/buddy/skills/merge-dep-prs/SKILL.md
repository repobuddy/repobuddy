---
name: merge-dep-prs
description: "Use this skill when merging dependency update PRs; fixes CI, handles changesets, never merges release PRs."
---

# Merge Dependency PRs

Work through open dependency-update PRs in one or more repositories: identify them, gate each merge on whether CI actually verified what the change can reach, fix the ones that fail, and skip anything that would trigger a release.

Covers Renovate, Dependabot, and manual bumps for packages, dev dependencies, and repo tooling. Use when asked to merge pending PRs, land dependency updates, process dep PRs, or clean up the PR queue.

## Detect platform

```bash
git remote get-url origin
```

| Remote pattern | Platform | CLI tool |
|---|---|---|
| `github.com` | GitHub | `gh` |
| `gitlab.com` or self-hosted GitLab | GitLab | `glab` |

All examples below use `gh`. For GitLab, substitute `glab mr` for `gh pr`, `glab ci` for `gh run`.

## Step 1 — List and classify PRs

**GitHub:**
```bash
gh pr list --repo <owner>/<repo> --state open \
  --json number,title,headRefName,author,mergeStateStatus,statusCheckRollup \
  --jq '.[] | {number, title, state: .mergeStateStatus}'
```

**GitLab:**
```bash
glab mr list --state opened
```

**Keep** (dependency updates):
- Title matches: `chore(deps)`, `fix(deps)`, `bump X from`, `update X to`, `upgrade X`, `chore: upgrade <tool>`, etc.
- Author is `renovate[bot]`, `dependabot[bot]`, or a human doing a manual dep bump
- Head branch matches: `renovate/*`, `dependabot/*`, `chore/upgrade-*`

**Skip always — do not merge:**

Any PR whose purpose is to trigger a release:
- Title is `"Version Packages"` (changesets)
- Title matches `"Release X.Y.Z"` or `"chore(release): ..."` (semantic-release)
- Author is `semantic-release-bot`, `release-please[bot]`, or similar release automation
- Any PR clearly adding features or fixing bugs unrelated to dependencies

If working across multiple repos, repeat for each repo before proceeding.

## Step 2 — Sort by CI status

For each dep PR, note its CI result:

| Status | Action |
|---|---|
| All checks pass | Gate the merge (Step 3), then merge (Step 4) |
| Pending | Wait or move on; revisit after other PRs |
| Failing | Diagnose (Step 5) |
| BEHIND base | Update branch first, then re-check CI |
| Obsolete (base already has the fix) | Close with a note (Step 9) |

Check if the base branch already contains the fix before spending time on a failing PR:
```bash
# Example: check if main already has a specific version
git show origin/main:package.json | grep '"packageName"'
```

## Step 3 — Gate the merge: does verification reach cover blast radius?

**Green is not the merge condition.** A green check is evidence about exactly one thing: what CI
actually executed. It says nothing about anything CI did not run.

Two independent quantities:

| Quantity | What it is |
|---|---|
| **Blast radius** | what consumes the artifact this PR changes |
| **Verification reach** | what the green check actually ran |

**Merge when reach ⊇ radius.** Where reach falls short, green carries no information about the
uncovered part — that is not weak evidence, it is no evidence.

> Worked example. A bump of `changesets/action` v1 → v2.1.0 in an org `.github` repo, in the reusable
> release workflow 30 repos call. The PR renamed every v2 input correctly and explained itself. It
> passed every check. `changesets/action@v2` then hard-refuses `@changesets/cli` v2 at runtime, and
> the release job broke in 25 downstream repos — each staying green until its own next push to
> `main`, then going red one at a time, days apart. Reach was **zero**: a `.github` repo has no test
> suite because everything it ships executes elsewhere. Radius was 30.

**This is not about major bumps.** Semver is a property of the *dependency being bumped*; the risk is
a property of the *artifact being changed* and who executes it.

- A reusable workflow that changes an input default, a preset that tightens a rule, a package that
  narrows a peer range in a minor — consumers pin `@v2` / `main` / `^1` and get it regardless. In the
  example above the mechanism was a **runtime probe**; a *patch* release adding that probe would have
  broken the same 25 repos.
- A major devDependency bump in a leaf repo with real local coverage has no blast radius and needs no
  gate.

Run the gate in four moves.

### 3a — Does the PR touch a consumed artifact?

Path-detectable from the diff:

| Path signal | Consumed artifact |
|---|---|
| `.github/workflows/*.yml` containing `on: workflow_call` | reusable workflow — especially in an org `.github` repo |
| `action.yml` / `action.yaml` | composite action |
| a published package, config, or preset | anything installed from a registry |
| `Dockerfile`, image manifests | container image |
| a workspace package other packages depend on | in-repo consumed artifact |

```bash
gh pr diff <number> --repo <owner>/<repo> --name-only
grep -rl "workflow_call" .github/workflows/ 2>/dev/null
```

**Touches none of these →** the PR has no blast radius beyond its own repo. The gate is satisfied;
go to Step 4.

### 3b — What did CI actually reach?

Three reach-shrinking conditions. **Any one** of them means reach < radius:

1. **No test suite at all.** The degenerate case — checks are green by construction. An org `.github`
   repo is the canonical instance.
2. **Affected-only / selective test selection.** `turbo run test --filter=...[origin/main]`,
   `nx affected`, changed-files selection. Selective execution is *deliberately* shrinking reach; it
   is safe exactly as far as the dependency graph is complete.
3. **Path-filtered jobs that skipped on this diff.** A job that did not run is not a job that passed.

```bash
# what ran, and what was skipped
gh pr checks <number> --repo <owner>/<repo>
grep -rn "paths:\|--filter\|nx affected" .github/workflows/
```

**None of the three applies →** the green run already exercised the whole repo, so reach covers
radius. The gate is satisfied; go to Step 4.

### 3c — When reach < radius, enumerate the consumers

**Cross-repo.** Do **not** rely on `gh search code` — it misses org-internal matches (it returned
nothing for a workflow name that 30 repos in the same org referenced). Loop the repo list and read
each repo's workflow files instead; this took ~90s across three orgs:

```bash
for r in $(gh repo list <org> --limit 100 --json name,isArchived \
             --jq '.[]|select(.isArchived|not)|.name'); do
  for f in $(gh api repos/<org>/$r/contents/.github/workflows --jq '.[].name' 2>/dev/null); do
    gh api "repos/<org>/$r/contents/.github/workflows/$f" --jq .content 2>/dev/null \
      | base64 -d | grep -q "<workflow-name>" && { echo "$r ($f)"; break; }
  done
done
```

Read **every** workflow file, not just `release.yml` — a consumer that calls the workflow from
`ci.yml` is still a consumer. Repeat per org that could consume it.

**In-repo.** Run the **full** graph rather than the affected subset:

```bash
pnpm turbo run test          # no --filter
```

Then look for the edges the selector *cannot* see — they are why the affected set was wrong in the
first place:

- runtime config loads (a package reads another's config at run time)
- generated files (the generator changed; the consumer's checked-in output did not)
- peer dependencies (not an edge in most task graphs)

### 3d — Check each consumer, then decide explicitly

Check what each consumer **resolves** against what the new artifact **requires** — the resolved
version, the pinned ref, the input names it passes. **The list is not the check**: decide only after
you have read something from each consumer on it.

Then take one of two named decisions:

- **Hold** the merge until the consumers are ready. Say what unblocks it.
- **Merge and immediately** open the follow-up PRs, or file the enumerated consumer list as an issue.

Both are decisions someone made. **Never fall through to merge-on-green because the check was green
and nothing objected** — an unenumerated consumer set is not an empty one.

## Step 4 — Merge passing PRs

**GitHub:**
```bash
gh pr merge <number> --repo <owner>/<repo> --squash
```

**GitLab:**
```bash
glab mr merge <number> --squash
```

If blocked by branch protection (`mergeStateStatus = BLOCKED` or `BEHIND`):
```bash
# Update branch first (GitHub)
gh api --method PUT repos/<owner>/<repo>/pulls/<number>/update-branch

# Then re-check CI; once passing:
gh pr merge <number> --repo <owner>/<repo> --squash
```

If the only blocker is a required check that already passed on an older commit, use `--admin` sparingly:
```bash
gh pr merge <number> --repo <owner>/<repo> --squash --admin
```

## Step 5 — Diagnose failing PRs

**GitHub:**
```bash
gh run list --repo <owner>/<repo> --branch <branch> --json databaseId,name,conclusion --jq '.[:3]'
gh run view <run-id> --repo <owner>/<repo> --log-failed 2>&1 | grep -v "##\[" | grep -E "(ERR|Error|error|FAIL|Cannot)" | head -30
```

**GitLab:**
```bash
glab ci list --branch <branch>
glab ci view <pipeline-id>
```

For more context:
```bash
gh run view <run-id> --repo <owner>/<repo> --log-failed 2>&1 | grep -v "##\[" | tail -60
```

## Step 6 — Fix common failures

The patterns below are common examples. For unfamiliar failures, read the full log and reason by analogy — identify what broke, check if the dep bump introduced a breaking change, and apply a targeted fix.

---

### Package manager: ignored build scripts

**Symptom:** `[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: @parcel/watcher, esbuild, fsevents` (pnpm 11+)

**Fix:** add the packages to `onlyBuiltDependencies` in `pnpm-workspace.yaml`:
```yaml
onlyBuiltDependencies:
  - '@parcel/watcher'
  - esbuild
  - fsevents
```

Check what other repos in the org use and match the pattern.

---

### Package manager: invalid version in fixture

**Symptom:** `version has an incorrect type, expected a string, but received null`

**Fix:** find and fix all `"version": null` entries in test fixtures:
```bash
grep -rl '"version": null' . --include="package.json" | grep -v node_modules
# replace with "version": "0.0.0"
```

---

### Build tool: pipeline/tasks rename (Turbo v2)

**Symptom:** `Found 'pipeline' field instead of 'tasks'`

**Fix:** In `turbo.json`, rename `"pipeline"` → `"tasks"` and update `$schema`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": { ... }
}
```

---

### Linter/formatter: new rules after version bump

**Symptom:** formatter or linter reports N errors after a version bump (e.g. Biome, ESLint, Prettier)

**Fix:**
1. Run auto-fix: `<linter> check --fix .` or `<formatter> --write .`
2. Verify no residual errors
3. If the tool incorrectly processes certain file types, exclude them in the config
4. Restore any incorrectly reformatted files from git: `git checkout -- '*.ext'`
5. Commit the reformatted files separately from the dep bump commit

---

### Merge conflicts / stale PR

**Symptom:** `mergeStateStatus: DIRTY` or `CONFLICTING`

**Fix options:**
1. Rebase the PR branch onto the base:
   ```bash
   git fetch origin
   git checkout -b <fix-branch> origin/<pr-branch>
   git rebase origin/main
   # resolve conflicts, then push
   git push origin <fix-branch>
   ```
2. For Renovate/Dependabot PRs with many accumulated changes, close the stale PR and let the bot re-open a fresh one.

---

### TypeScript compatibility (major dep bumps)

**Symptom:** TS parse errors after upgrading a library that requires a newer TypeScript version

**Fix:** Upgrade TypeScript in the affected package. For monorepos, add a workspace override to unify versions:
```yaml
# pnpm-workspace.yaml
overrides:
  typescript: '~5.x.x'
```

---

### Module resolution (ESM fully-specified)

**Symptom:** `Module not found: Can't resolve 'react/jsx-runtime'` + `BREAKING CHANGE: The request failed to resolve only because it was resolved as fully specified`

**Fix:** configure your bundler to disable `fullySpecified` resolution for `.mjs` files. Example for webpack:
```js
config.module.rules.unshift({
  test: /\.m?js/,
  resolve: { fullySpecified: false }
})
```

---

### CI workflow not triggering after push

**Symptom:** pushed fixes to a PR branch but the workflow never fires

**Likely cause:** The PR contains workflow file changes. GitHub may require a maintainer action to re-trigger.

**Fix:** Close and reopen the PR. If that doesn't work, create a fresh PR from a new branch (cherry-pick only the dep bump commit, excluding workflow file changes).

## Step 7 — Handle changeset requirements

If CI reports a missing changeset check failure:
1. Determine whether the repo publishes to a package registry and uses a changeset tool
2. If yes, create a changeset for the dep bump (typically a `patch` bump with summary "Update dependencies.")
3. If the repo has a `add-changeset` or equivalent skill available, invoke it

**Do not add a changeset if:**
- The repo is private or doesn't publish to a registry
- The PR only bumps devDependencies with no runtime impact
- The CI does not have a changeset check

## Step 8 — Commit, push, and monitor

After applying fixes:
```bash
git add <changed-files>
git commit -m "fix: <description of what was fixed>"
git push origin <branch>
```

Watch CI:
```bash
# GitHub
gh run list --repo <owner>/<repo> --branch <branch> --limit 3
gh run watch <run-id> --repo <owner>/<repo>

# GitLab
glab ci list --branch <branch>
```

Once CI passes, re-run the merge gate (Step 3) and merge (Step 4). Then move on to the next PR in your list.

## Step 9 — Close obsolete PRs

A PR is obsolete when the base branch already contains the intended change:
```bash
git show origin/main:package.json | grep '"packageName"'
```

**GitHub:**
```bash
gh pr close <number> --repo <owner>/<repo> \
  --comment "main is already on <version>; closing as superseded."
```

**GitLab:**
```bash
glab mr close <number> --note "main is already on <version>; closing as superseded."
```

## What NOT to do

**Do not treat green CI as evidence beyond what it executed.** A repo with no test suite is not a
repo with nothing to break — it is a repo whose checks are green by construction. Green covers what
ran; it is silent, not reassuring, about everything else.

**Do not merge on green while verification reach falls short of blast radius.** Take one of the two
named decisions in Step 3d instead. Nobody objecting is not the same as nobody being affected.

**Do not gate on the version class of the bump.** A patch can break every consumer and a major can
break none; semver describes the dependency, not the artifact you are changing.

**Do not accept `gh search code` as the consumer enumeration.** It misses org-internal matches. Use
the repo-list loop in Step 3c.

**Do not merge a release PR.** `"Version Packages"`, `"Release X.Y.Z"`, `chore(release):`, or
anything authored by release automation — those land by their own process (Step 1).

**Do not add a changeset the repo does not want** — a private repo, a devDependency-only bump, or a
repo with no changeset check (Step 7).

## Checklist summary

- [ ] Listed all open PRs and filtered to dep updates only
- [ ] Confirmed no release PR is in the merge list
- [ ] For each PR: established that verification reach covers its blast radius
- [ ] Enumerated the consumers wherever reach fell short, and checked what each resolves
- [ ] Recorded an explicit hold-or-merge-with-follow-ups decision for every gated PR
- [ ] Merged all PRs that cleared the gate
- [ ] Diagnosed and fixed all failing PRs (or noted as needing deeper investigation)
- [ ] Handled changeset requirements where applicable
- [ ] Closed any PRs that are now obsolete
