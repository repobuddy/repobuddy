---
name: setup-github-repo
description: Use this skill when setting up a GitHub repo with standard settings — branch protection, Dependabot, and CI.
---

# Setup GitHub Repo

Apply a consistent set of GitHub repository settings using the `gh` CLI. Idempotent: detects current state before applying changes, skips anything already configured.

## When to use

- Initializing a new GitHub repository with standard settings
- Adding branch protection, merge strategy, or Dependabot to an existing repo
- Scaffolding CI/CD workflow files
- Standardizing settings across multiple repos

## Prerequisites

Verify before taking any action:

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
node_major=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
SKILL_DIR=$(npx skills path setup-github-repo 2>/dev/null || echo "$HOME/.agents/skills/setup-github-repo")
if [ "$node_major" -ge 23 ]; then
  node "$SKILL_DIR/scripts/detect-state.mts"
else
  npx tsx "$SKILL_DIR/scripts/detect-state.mts"
fi
```

The script outputs `.github/setup-state.json` and prints a summary table showing current vs target state for each setting. Show this table to the user and confirm before applying any changes.

## Step 2 — Apply critical repository settings

Always apply (no extra confirmation needed after Step 1):

```bash
gh repo edit "$REPO" \
  --delete-branch-on-merge \
  --enable-auto-merge \
  --no-allow-merge-commit \
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
  --field 'bypass_actors=[{"actor_id":5,"actor_type":"RepositoryRole","bypass_mode":"always"},{"actor_id":2,"actor_type":"RepositoryRole","bypass_mode":"always"}]' \
  --input - <<'EOF'
{
  "rules": [
    {"type": "deletion"},
    {"type": "non_fast_forward"}
  ]
}
EOF
```

Actor IDs: `5` = Administrators, `2` = Maintainers (standard GitHub built-in role IDs).

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

## Step 5 — Workflow files (optional)

The scaffold script detects which workflows to offer based on filesystem signals. Run it:

```bash
SKILL_DIR=$(npx skills path setup-github-repo 2>/dev/null || echo "$HOME/.agents/skills/setup-github-repo")
if [ "$node_major" -ge 23 ]; then
  node "$SKILL_DIR/scripts/scaffold-workflows.mts" --state .github/setup-state.json
else
  npx tsx "$SKILL_DIR/scripts/scaffold-workflows.mts" --state .github/setup-state.json
fi
```

The script reports which files it would create, then asks confirmation before writing. It skips files that already exist.

### Workflow descriptions

**`pull-request.yml`** — Triggers on `pull_request`. Runs a CI job matrix across Node.js LTS versions (for JS/TS projects) or a single job (other stacks). Always includes an `all-checks` gate job that depends on all other jobs:

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

**`codeql-analysis.yml`** — Uses `github/codeql-action`. Language populated from detected `codeqlLanguage` in state JSON. Runs on push to default branch, PRs, and a weekly schedule.

After generating files: "Review the generated workflows before committing — CI steps are placeholders that need your actual commands."

### LTS matrix

For Node.js projects, the CI job uses a matrix of active LTS versions. The scaffold uses `[20, 22, 24]` by default. Edit the `node-version` matrix in the generated file to adjust.

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
- [x] Workflows: pull-request.yml, dependabot-automerge.yml, codeql-analysis.yml

### Already configured (skipped)
- [~] allow_squash_merge → true

### Deferred
- [ ] Secret scanning (skipped by user)
- [ ] release.yml (skipped by user)
```

## Notes

- **Idempotency**: re-running on a fully configured repo should produce no changes.
- **No org assumptions**: generated workflows are standalone — no reusable workflow references from any specific org. If your org has shared workflows, replace the generated file contents manually.
- **Bypass actor IDs**: role IDs `5` (Administrators) and `2` (Maintainers) are standard GitHub built-in roles. Do not substitute org-specific team IDs.
- **`--enable-auto-merge`**: enables the feature on the repo but does not auto-merge individual PRs; branch protection rules must still be satisfied per PR.
- **Status check timing**: if CI has never run, the check context won't exist in GitHub's UI. Add it after the first CI run completes, or re-run the skill then.
