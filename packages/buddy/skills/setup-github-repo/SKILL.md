---
name: setup-github-repo
description: Use this skill when setting up a GitHub repo with standard settings — branch protection, a merge backstop, Dependabot, and CI.
---

# Setup GitHub Repo

Apply a consistent set of GitHub repository settings using the `gh` CLI. Idempotent: detects current state before applying changes, skips anything already configured.

## When to use

- Initializing a new GitHub repository with standard settings
- Adding branch protection, merge strategy, or Dependabot to an existing repo
- Making every merge — by a person, a bot, or an agent — pass the same gate against the latest default branch
- Scaffolding CI/CD workflow files
- Standardizing settings across multiple repos

## Prerequisites

Verify before taking any action. If `gh` is missing or not logged in, run the `init-buddy` skill when it is installed; otherwise tell the user to install and log in.

```bash
gh auth status
git remote get-url origin
```

If either fails, stop and tell the user what to fix.

Detect repo owner/name and default branch:

```bash
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
```

## Step 1 — Detect current state

Run the detect script from the repo root:

```bash
SKILL_DIR=$(npx skills path setup-github-repo 2>/dev/null || echo "$HOME/.agents/skills/setup-github-repo")
if [ -f "$SKILL_DIR/scripts/detect-state.mjs" ]; then
  ACK=$(node "$SKILL_DIR/scripts/detect-state.mjs")
else
  ACK=$(npx -y repobuddy@^2.1.0 detect-state)
fi
STATE=$(printf '%s' "$ACK" | jq -r .artifact)
printf '%s\n' "$ACK"
```

The script ships in the `repobuddy` npm package. If `scripts/detect-state.mjs` is missing (the skill
was installed from git) or cannot be run, use `npx -y repobuddy@^2.1.0 detect-state` with the same
arguments.

The script writes the state artifact **outside the repo tree** — under the OS temp dir, at the
path the ack reports as `artifact`. Never write it into the repo: it is a scratch snapshot, and a
copy left in the working tree reads like a statement of the repo's settings policy long after the
run made it stale. Capture the path as `$STATE` (above) and pass it to every later step; if a
later step runs in a shell where `$STATE` is unset, use the literal path the ack printed.

If the ack carries `removedLegacyArtifact`, the script found a state file left in the repo and
deleted it. Tell the user — if they had committed it, it now shows as a
deletion in `git status`.

The ack carries only the artifact path and a count. **Do not parse stdout for state** — read the
artifact file instead:

```bash
jq '[.rows[] | select(.action | startswith("will"))]' "$STATE"
jq '{repo, defaultBranch, detected}' "$STATE"
jq '.current.mergeBackstop' "$STATE"
```

Summarize pending changes for the user and confirm before applying any changes. Add `--verbose` to the detect command for a human-readable table on stderr (debugging only).

## Step 2 — Apply critical repository settings

Always apply (no extra confirmation needed after Step 1):

```bash
gh repo edit "$REPO" \
  --delete-branch-on-merge \
  --enable-auto-merge \
  --enable-merge-commit=false \
  --allow-squash-merge \
  --allow-rebase-merge \
  --allow-update-branch
```

Verify:

```bash
gh repo view "$REPO" --json deleteBranchOnMerge,allowAutoMerge,allowMergeCommit,allowSquashMerge,allowRebaseMerge,allowUpdateBranch
```

## Step 3 — Enable Dependabot security updates

Check and enable if not already on:

```bash
gh api "repos/$REPO" --jq '.security_and_analysis.dependabot_security_updates.status'
# If not "enabled":
gh api --method PATCH "repos/$REPO" \
  --field 'security_and_analysis[dependabot_security_updates][status]=enabled'
```

## Step 4 — Branch ruleset

Check if a ruleset already covers the default branch:

```bash
gh api "repos/$REPO/rulesets" --jq '.[] | select(.target == "branch") | {id, name, enforcement}'
```

If none exists, create one:

```bash
gh api --method POST "repos/$REPO/rulesets" \
  --field name="default-branch-protection" \
  --field target="branch" \
  --field enforcement="active" \
  --field 'conditions={"ref_name":{"include":["~DEFAULT_BRANCH"],"exclude":[]}}' \
  --field 'bypass_actors=[{"actor_id":5,"actor_type":"RepositoryRole","bypass_mode":"always"}]' \
  --input - <<'EOF'
{
  "rules": [
    {"type": "deletion"},
    {"type": "non_fast_forward"}
  ]
}
EOF
```

Actor ID `5` = Administrators (the standard GitHub built-in role ID). Do not add `2`: that is the Triage role, which has no push access, so the bypass would grant nothing.

### Required status checks

If the skill is also scaffolding `pull-request.yml` (Step 5), add `all-checks` as a required status check to the ruleset. This single gate job covers all CI matrix legs without needing to update the ruleset when new jobs are added.

If NOT scaffolding workflows, ask the user: "Do you want to add required status checks? If so, provide the exact job names (e.g. `all-checks`, `build`, `test`)."

To add required checks to an existing ruleset:

```bash
RULESET_ID=<id from above>
gh api --method PUT "repos/$REPO/rulesets/$RULESET_ID" \
  --input - <<EOF
{
  "rules": [
    {"type": "deletion"},
    {"type": "non_fast_forward"},
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          {"context": "all-checks", "integration_id": null}
        ]
      }
    }
  ]
}
EOF
```

Note: status check names must exactly match the `name:` field of the CI job as GitHub reports it. For standalone workflow jobs it is just the job key (e.g. `all-checks`); for reusable workflow calls it is prefixed with the calling job name (e.g. `code / all-checks`).

### Merge backstop

A pull request that was green on its own head can still break the default branch if the branch moved
before it merged. Agents now merge pull requests themselves, outside any dispatcher's merge-order and
re-run-CI discipline, so the gate belongs at the forge, where it holds whoever runs the merge.

**Report first.** Read `current.mergeBackstop` from the state artifact and tell the user what the repo
already has, whether or not they asked:

| Field | Meaning |
|---|---|
| `mergeQueue: true` | a ruleset requires GitHub's merge queue on the default branch |
| `strictUpToDate: true` | a ruleset or classic branch protection requires the branch to be up to date before merging |
| `thirdPartyQueue` | a third-party queue's config is in the repo, e.g. `{ "tool": "mergify", "config": ".mergify.yml" }` |
| `mergeQueueAvailability` | `available` (public org repo), `enterprise-cloud-only` (private org repo: only on GitHub Enterprise Cloud, which the API does not report), `unavailable` (personal repo) |

Any of the first three is a backstop. **When one exists, do not add another** — report it and move on.
In particular, never add a native merge queue beside a third-party queue such as Mergify: two queues
fight over the same pull requests. A third-party queue can also be configured outside the repo (Mergify
reads an org-level config too); if the user says one runs, take their word and skip.

**Offer one when there is none.** Ask, and apply only on a yes:

1. **Merge queue** — when `mergeQueueAvailability` is `available`, or `enterprise-cloud-only` and the
   user confirms the org is on GitHub Enterprise Cloud. Each merge is tested against the latest default
   branch, with the pull requests ahead of it, and lands in order.
2. **Require up to date** — otherwise. A pull request cannot merge until its branch contains the latest
   default branch, so its checks ran on what the merge will produce. Without a queue, each pull request
   behind another must be updated and re-run; `--allow-update-branch` (Step 2) and auto-merge make that
   one click.

Either needs **required status checks**, or nothing is gated: use the checks chosen above. If there are
none, the backstop is not worth adding yet — say so.

Put the backstop in its own ruleset, `merge-backstop`, with **no bypass actors**. The default-branch
ruleset lets Administrators bypass, and an agent often runs with an admin token — a
bypassable backstop is exactly the hole this closes. If the owner needs an emergency path, they can
disable the ruleset for that one merge.

A changesets Version Packages PR opened with the default `GITHUB_TOKEN` gets no checks, so a
backstop that requires checks and has no bypass actors blocks it. Open that PR with a token or app
that triggers workflows, or have the owner disable the ruleset for that one merge.

Merge queue (`merge_method` must be one the repo allows — Step 2 allows `SQUASH` and `REBASE`):

```bash
gh api --method POST "repos/$REPO/rulesets" --input - <<'EOF'
{
  "name": "merge-backstop",
  "target": "branch",
  "enforcement": "active",
  "conditions": {"ref_name": {"include": ["~DEFAULT_BRANCH"], "exclude": []}},
  "bypass_actors": [],
  "rules": [
    {
      "type": "merge_queue",
      "parameters": {
        "merge_method": "SQUASH",
        "grouping_strategy": "ALLGREEN",
        "max_entries_to_build": 5,
        "min_entries_to_merge": 1,
        "max_entries_to_merge": 5,
        "min_entries_to_merge_wait_minutes": 0,
        "check_response_timeout_minutes": 60
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "do_not_enforce_on_create": false,
        "required_status_checks": [{"context": "all-checks", "integration_id": null}]
      }
    }
  ]
}
EOF
```

Require up to date — the same ruleset without the `merge_queue` rule, and with
`"strict_required_status_checks_policy": true`.

**Checks must run on the merged result.** A merge queue runs CI on a temporary `merge_group` branch,
and GitHub Actions runs a workflow there only if it triggers on `merge_group`. A required check from a
workflow without that trigger never reports, and the queue stalls until it times out. Compare
`detected.mergeGroupWorkflows` with the workflows that produce the required checks, and for each one
missing, show the user the addition:

```yaml
on:
  pull_request:
  merge_group:
```

The `pull-request.yml` that Step 5 scaffolds already has it. Checks from a third-party CI (not Actions)
must be configured to report on merge-queue branches (`gh-readonly-queue/*`) too. The require-up-to-date
backstop needs nothing extra: its checks already run on a branch that contains the default branch.

**The trade-off — say it when offering.** A merge queue adds latency: every merge waits for a full CI
run on the merged result, even on a quiet repo where nothing else is merging and the pull request's own
run was already current. Settings above keep it small (`min_entries_to_merge: 1`, no wait to batch), but
it never reaches zero. Require-up-to-date costs nothing when the branch is current and a re-run when it
is not — and on a busy repo pull requests race to update, which a queue serializes. Quiet repos with few
merges often prefer require-up-to-date; repos where agents merge in parallel get the most from a queue.

Once a merge queue is on, `gh pr merge` adds the pull request to the queue instead of merging it; agents
need no change. A `--admin` merge would skip it — the `merge-backstop` ruleset has no bypass actors, so
it cannot.

## Step 5 — Workflow files (optional)

The scaffold script detects which workflows to offer based on filesystem signals. Run it:

```bash
SKILL_DIR=$(npx skills path setup-github-repo 2>/dev/null || echo "$HOME/.agents/skills/setup-github-repo")
if [ -f "$SKILL_DIR/scripts/scaffold-workflows.mjs" ]; then
  node "$SKILL_DIR/scripts/scaffold-workflows.mjs" --state "$STATE" --yes
else
  npx -y repobuddy@^2.1.0 scaffold-workflows --state "$STATE" --yes
fi
```

The script ships in the `repobuddy` npm package. If `scripts/scaffold-workflows.mjs` is missing (the
skill was installed from git) or cannot be run, use `npx -y repobuddy@^2.1.0 scaffold-workflows` with
the same arguments.

Use `--yes` for agent runs (non-interactive). Omit `--yes` for human runs — the script prompts on stderr. Read JSON stdout for `created` and `skipped`; add `--verbose` for progress on stderr.

### Workflow descriptions

**`pull-request.yml`** — Triggers on `pull_request`, and on `merge_group` so its checks also run in a merge queue. Runs a CI job matrix across Node.js LTS versions (for JS/TS projects) or a single job (other stacks). Always includes an `all-checks` gate job that depends on all other jobs:

```yaml
all-checks:
  needs: [ci]
  runs-on: ubuntu-latest
  if: always()
  steps:
    - name: All checks passed
      run: |
        if [[ "${{ contains(needs.*.result, 'failure') || contains(needs.*.result, 'cancelled') }}" == "true" ]]; then
          exit 1
        fi
```

CI steps are templated based on detected stack (pnpm/npm/yarn/bun install + test command). Leaves a `# TODO: add your test/lint commands here` comment where customization is needed.

**`release.yml`** — Triggers on push to default branch. Runs the same CI as pull-request, then a release job. Leaves a `# TODO: add your release steps here` placeholder.

**`dependabot-automerge.yml`** — Triggers on `pull_request` where actor is `dependabot[bot]`. Auto-approves and enables auto-merge for patch and minor updates only (not major). Uses `dependabot/fetch-metadata` to check update type.

**`codeql.yml`** — Uses `github/codeql-action`. Language populated from detected `codeqlLanguage` in state JSON. Runs on push to default branch, PRs, and a weekly schedule.

After generating files: "Review the generated workflows before committing — CI steps are placeholders that need your actual commands."

### LTS matrix

For Node.js projects, the CI job uses a matrix of active LTS versions. The scaffold uses `[22, 24]` by default. Edit the `node-version` matrix in the generated file to adjust.

## Step 6 — Optional settings

Ask the user about each; apply only if confirmed:

| Setting | Command |
|---------|---------|
| Disable wiki | `gh repo edit "$REPO" --enable-wiki=false` |
| Disable projects | `gh repo edit "$REPO" --enable-projects=false` |
| Disable discussions | `gh repo edit "$REPO" --enable-discussions=false` |
| Enable secret scanning | `gh api --method PATCH "repos/$REPO" --field 'security_and_analysis[secret_scanning][status]=enabled'` |
| Enable push protection | `gh api --method PATCH "repos/$REPO" --field 'security_and_analysis[secret_scanning_push_protection][status]=enabled'` |

GitHub Pages: too many configuration permutations — direct the user to the GitHub UI or `gh api` docs if needed.

## Step 7 — Summary

Print a final table:

```
## Setup complete

### Applied
- [x] delete_branch_on_merge → true
- [x] Branch ruleset: default-branch-protection (created)
- [x] Merge backstop: merge-backstop ruleset, merge queue (created)
- [x] Workflows: pull-request.yml, dependabot-automerge.yml, codeql.yml

### Already configured (skipped)
- [~] allow_squash_merge → true
- [~] Merge backstop: mergify (.mergify.yml)

### Deferred
- [ ] Secret scanning (skipped by user)
- [ ] release.yml (skipped by user)
```

## Notes

- **Idempotency**: re-running on a fully configured repo should produce no changes.
- **The state artifact is scratch**: it lives in the OS temp dir, is keyed by `owner/repo`, and is
  stale the moment Steps 2–5 apply the plan it holds. Nothing reads it after the run. Leave it for
  the OS to reap, or delete it — either is fine, and neither touches the repo. Do not commit it, do
  not copy it into the repo, and do not add it to `.gitignore`; it never appears in `git status`.
  The detect script deletes a leftover `.github/setup-state.json` if it finds one.
- **No org assumptions**: generated workflows are standalone — no reusable workflow references from any specific org. If your org has shared workflows, replace the generated file contents manually.
- **Bypass actor IDs**: role ID `5` (Administrators) is a standard GitHub built-in role. Do not substitute org-specific team IDs, and do not add `2` (Triage, which grants nothing).
- **`--enable-auto-merge`**: enables the feature on the repo but does not auto-merge individual PRs; branch protection rules must still be satisfied per PR.
- **One backstop**: a native merge queue, a require-up-to-date rule, or a third-party queue — detect which, never stack them.
- **Status check timing**: if CI has never run, the check context won't exist in GitHub's UI. Add it after the first CI run completes, or re-run the skill then.
