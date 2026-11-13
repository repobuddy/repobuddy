---
name: setup-github-repo
description: Sets up a GitHub repo with standard settings — branch protection, a merge backstop, Dependabot, and CI.
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

Run the detect script from the repo root. `<this-skill-dir>` is the absolute path of the directory
holding this SKILL.md, not the current working directory:

```bash
SKILL_DIR=<this-skill-dir>
if [ -f "$SKILL_DIR/scripts/detect-state.mjs" ]; then
  ACK=$(node "$SKILL_DIR/scripts/detect-state.mjs")
else
  ACK=$(npx -y repobuddy@4.5.2 detect-state)
fi
STATE=$(printf '%s' "$ACK" | jq -r .artifact)
printf '%s\n' "$ACK"
```

The script ships in the `repobuddy` npm package. If `scripts/detect-state.mjs` is missing (the skill
was installed from git) or cannot be run, use `npx -y repobuddy@4.5.2 detect-state` with the same
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
jq '.current.triageBypass' "$STATE"
jq '.current.separateBackstop' "$STATE"
```

Summarize pending changes for the user and confirm before applying any changes. Add `--verbose` to the detect command for a human-readable table on stderr (debugging only).

## Step 2 — Apply critical repository settings

Always apply (no extra confirmation needed after Step 1):

```bash
gh repo edit "$REPO" \
  --delete-branch-on-merge \
  --enable-auto-merge \
  --enable-merge-commit \
  --enable-squash-merge=false \
  --enable-rebase-merge=false \
  --allow-update-branch
```

Verify:

```bash
gh api "repos/$REPO" --jq '{delete_branch_on_merge, allow_auto_merge, allow_merge_commit, allow_squash_merge, allow_rebase_merge, allow_update_branch}'
```

`gh repo view --json` has no field for auto-merge or update-branch, so read them from the REST API.

Merge commits only: each pull request lands as one merge commit with its own commits kept beneath it.
Do not add a `required_linear_history` rule, which forbids merge commits.

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

### Triage bypass drift

`current.triageBypass` lists every active branch ruleset that already has `RepositoryRole` `2`
(Triage) among its bypass actors. Report each one as drift, whoever added it, and offer to remove that
actor. On a yes, send back the ruleset's bypass list without it; the `PUT` leaves every field it does
not send as it is:

```bash
RULESET_ID=<id from current.triageBypass>
gh api "repos/$REPO/rulesets/$RULESET_ID" \
  --jq '{bypass_actors: [.bypass_actors[] | select(.actor_type != "RepositoryRole" or .actor_id != 2)]}' \
  | gh api --method PUT "repos/$REPO/rulesets/$RULESET_ID" --input -
```

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
          {"context": "all-checks"}
        ]
      }
    }
  ]
}
EOF
```

Leave `integration_id` out of each check rather than setting it to `null`: the API rejects `null` with
a 422 (`Invalid property /rules/N: data matches no possible input`).

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

**A backstop in its own ruleset.** `current.separateBackstop` lists active branch rulesets, other than
the default-branch one, that hold a merge queue or a require-up-to-date rule. Earlier versions of this
skill created one named `merge-backstop`, with no bypass actors. Report each as drift and offer to fold
it into the default-branch ruleset. On a yes, note its required checks, delete it, then add the same
kind of backstop to the default-branch ruleset as below, in the same run, so the branch is not left
without one:

```bash
gh api "repos/$REPO/rulesets/<id>" --jq '[.rules[] | select(.type == "required_status_checks")]'
gh api --method DELETE "repos/$REPO/rulesets/<id>"
```

**Offer one when there is none.** Ask, and apply only on a yes:

1. **Merge queue** — when `mergeQueueAvailability` is `available`, or `enterprise-cloud-only` and the
   user confirms the org is on GitHub Enterprise Cloud. Recommend it wherever GitHub offers it: as
   each pull request lands, GitHub updates and re-tests the next one against the new default branch on
   its own servers. Without a queue, something has to update every other open pull request and re-run
   its CI after each merge. Do not talk the user out of a queue because they work alone: agents,
   Dependabot, and the Version Packages PR keep several pull requests open at once (check
   `gh pr list`).
2. **Require up to date** — where no queue is available. A pull request cannot merge until its branch
   contains the latest default branch, so its checks ran on what the merge will produce. Here
   `--allow-update-branch` (Step 2) is mandatory: without it a stale pull request has no way to update.

Either needs **required status checks**, or nothing is gated: use the checks chosen above. If there are
none, the backstop is not worth adding yet — say so.

**Put the backstop in the default-branch ruleset**, beside its deletion and force-push rules, with the
same Administrators bypass. Do not create a separate no-bypass ruleset for it:

- **The Version Packages PR can deadlock.** When its required checks never report (below), only an
  admin override can merge it. A ruleset with no bypass actors leaves nobody able to override, and the
  release stops.
- **A transfer wipes ruleset bypass actors.** Any transferred repo is in that no-bypass state until
  someone restores `RepositoryRole` `5`. Restore it as part of the transfer, then read the ruleset back.

The bypass is for those cases, not for routine merges. An agent merges with `gh pr merge`, never
`--admin`.

A changesets Version Packages PR opened with the default `GITHUB_TOKEN` gets its `pull_request` runs
created but parked as `action_required`, so its required checks never report and the PR cannot merge
without an admin override. Keep the release secretless: the shared `pnpm-release-changeset-oidc.yml`
release workflows approve those parked runs after opening the PR, which needs the calling job to grant
`actions: write`:

```yaml
release:
  uses: <org>/.github/.github/workflows/pnpm-release-changeset-oidc.yml@<ref>
  permissions:
    id-token: write
    contents: write
    pull-requests: write
    actions: write # approves the Version Packages PR's parked runs
```

Check the repo's `release.yml` for that grant, and add it if it is missing. Without it the release
still publishes, but the PR waits until someone approves its runs from the Actions tab.

**A hand-rolled release job.** When `release.yml` runs `changesets/action` in its own job instead of
calling the shared workflow, the Version Packages PR's runs can park the same way and nothing approves
them. Tell the user, and offer one of:

1. **Migrate to the shared workflow.** Replace the job with the `uses:` call above. It publishes
   through npm trusted publishing, so each package needs a trusted publisher registered first (the
   `setup-npm-trusted-publishing` skill does that). Fits a job that only installs, builds, and runs
   `changesets/action`.
2. **Copy the approval step.** Keep the job, and:
   - give the `changesets/action` step `id: changesets`, since the approval step reads its
     `pr-number` and `published` outputs;
   - add `actions: write` to the job's `permissions:`;
   - copy the step `Approve the version packages PR's pending runs` from
     [`pnpm-release-changeset-oidc.yml`](https://github.com/repobuddy/.github/blob/main/.github/workflows/pnpm-release-changeset-oidc.yml)
     unchanged, right after the `changesets/action` step. It assumes the default version branch,
     `changeset-release/<branch>`; if the job sets the action's `branch` input, change `VERSION_BRANCH`
     to match.

Read the version branch's runs before choosing (`gh run list --event pull_request`, filtered to
`changeset-release/` branches). Runs in `action_required` are what the approval step clears, whichever
token opened the PR. If the PR has no runs at all, there is nothing to approve: its checks start only on
a push by a real user or a GitHub App token.

Merge queue: add the rule to the default-branch ruleset, keeping its other rules. `merge_method` must
be one the repo allows; Step 2 allows only merge commits, so it is `MERGE`:

```bash
RULESET_ID=<id of the default-branch ruleset>
QUEUE='{"type":"merge_queue","parameters":{"merge_method":"MERGE","grouping_strategy":"ALLGREEN","max_entries_to_build":5,"min_entries_to_merge":1,"max_entries_to_merge":1,"min_entries_to_merge_wait_minutes":5,"check_response_timeout_minutes":60}}'
gh api "repos/$REPO/rulesets/$RULESET_ID" --jq '{rules: .rules}' \
  | jq --argjson queue "$QUEUE" '.rules |= (map(select(.type != "merge_queue")
      | if .type == "required_status_checks" then .parameters.strict_required_status_checks_policy = false else . end)
      + [$queue])' \
  | gh api --method PUT "repos/$REPO/rulesets/$RULESET_ID" --input -
```

- **All seven queue parameters are required.** Leaving one out gets a 422 with an empty detail, the same
  error a personal repo gets for the rule, so the error does not say which it was.
- **`max_entries_to_merge: 1`** keeps one merge commit per pull request. Batching would fold several
  pull requests into one merge commit. `max_entries_to_build: 5` still builds the ones behind it in
  parallel.
- **Require up to date goes off in the same `PUT`.** The queue tests each pull request against the real
  default branch, so the rule is redundant, and left on it strands pull requests before they reach the
  queue.

Require up to date: turn on `strict_required_status_checks_policy` in the default-branch ruleset's
required checks, keeping its other rules:

```bash
RULESET_ID=<id of the default-branch ruleset>
gh api "repos/$REPO/rulesets/$RULESET_ID" \
  --jq '{rules: [.rules[] | if .type == "required_status_checks" then .parameters.strict_required_status_checks_policy = true else . end]}' \
  | gh api --method PUT "repos/$REPO/rulesets/$RULESET_ID" --input -
```

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

Land that change and see a run start before adding the queue rule. The `pull-request.yml` that Step 5
scaffolds already has it. Checks from a third-party CI (not Actions) must be configured to report on
merge-queue branches (`gh-readonly-queue/*`) too. The require-up-to-date backstop needs nothing extra:
its checks already run on a branch that contains the default branch.

Once a merge queue is on, `gh pr merge` adds the pull request to the queue instead of merging it; agents
need no change. A `--admin` merge skips the queue and its checks, because Administrators can bypass the
ruleset; keep that for the deadlocks above.

## Step 5 — Workflow files (optional)

The scaffold script detects which workflows to offer based on filesystem signals. Run it:

```bash
SKILL_DIR=<this-skill-dir>
if [ -f "$SKILL_DIR/scripts/scaffold-workflows.mjs" ]; then
  node "$SKILL_DIR/scripts/scaffold-workflows.mjs" --state "$STATE" --yes
else
  npx -y repobuddy@4.5.2 scaffold-workflows --state "$STATE" --yes
fi
```

The script ships in the `repobuddy` npm package. If `scripts/scaffold-workflows.mjs` is missing (the
skill was installed from git) or cannot be run, use `npx -y repobuddy@4.5.2 scaffold-workflows` with
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
- [x] Triage bypass actor removed from ruleset main (7)
- [x] Merge backstop: merge queue on default-branch-protection (added)
- [x] Workflows: pull-request.yml, dependabot-automerge.yml, codeql.yml

### Already configured (skipped)
- [~] allow_merge_commit → true
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
- **Bypass actor IDs**: role ID `5` (Administrators) is a standard GitHub built-in role. Do not substitute org-specific team IDs, and do not add `2` (Triage, which grants nothing). Detect reports an existing one as drift to remove.
- **`--enable-auto-merge`**: enables the feature on the repo but does not auto-merge individual PRs; branch protection rules must still be satisfied per PR.
- **One backstop**: a native merge queue, a require-up-to-date rule, or a third-party queue — detect which, never stack them.
- **Status check timing**: if CI has never run, the check context won't exist in GitHub's UI. Add it after the first CI run completes, or re-run the skill then.
