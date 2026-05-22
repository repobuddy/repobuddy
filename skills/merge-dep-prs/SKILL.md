---
name: merge-dep-prs
description: "Merge pending dependency update PRs — Renovate, Dependabot, or manual bumps for packages, dev dependencies, and repository tooling. Use this skill when asked to 'merge pending PRs', 'land dependency updates', 'process dep PRs', or 'clean up the PR queue'. Diagnoses and fixes CI failures, handles changesets where required, and never merges release PRs."
---

# Merge Dependency PRs

Work through open dependency-update PRs in one or more repositories: identify them, merge the ones that pass CI, fix the ones that fail, and skip anything that would trigger a release.

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
| All checks pass | Merge immediately (Step 3) |
| Pending | Wait or move on; revisit after other PRs |
| Failing | Diagnose (Step 4) |
| BEHIND base | Update branch first, then re-check CI |
| Obsolete (base already has the fix) | Close with a note (Step 8) |

Check if the base branch already contains the fix before spending time on a failing PR:
```bash
# Example: check if main already has a specific version
git show origin/main:package.json | grep '"packageName"'
```

## Step 3 — Merge passing PRs

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

## Step 4 — Diagnose failing PRs

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

## Step 5 — Fix common failures

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

## Step 6 — Handle changeset requirements

If CI reports a missing changeset check failure:
1. Determine whether the repo publishes to a package registry and uses a changeset tool
2. If yes, create a changeset for the dep bump (typically a `patch` bump with summary "Update dependencies.")
3. If the repo has a `add-changeset` or equivalent skill available, invoke it

**Do not add a changeset if:**
- The repo is private or doesn't publish to a registry
- The PR only bumps devDependencies with no runtime impact
- The CI does not have a changeset check

## Step 7 — Commit, push, and monitor

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

Once CI passes, merge (Step 3). Then move on to the next PR in your list.

## Step 8 — Close obsolete PRs

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

## Checklist summary

- [ ] Listed all open PRs and filtered to dep updates only
- [ ] Confirmed no release PR is in the merge list
- [ ] Merged all PRs with passing CI
- [ ] Diagnosed and fixed all failing PRs (or noted as needing deeper investigation)
- [ ] Handled changeset requirements where applicable
- [ ] Closed any PRs that are now obsolete
