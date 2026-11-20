# Setup CI — GitHub Actions

A PR opened with `GITHUB_TOKEN` does not trigger `pull_request` workflows, so required checks would never run on
the restore PR. Open it with a GitHub App token instead. The default recipe takes that token from the `repobuddy`
app, and needs no token secret of its own.

1. **Find out whether the `repobuddy` app is set up for this repo.** It is when either holds:
   - `gh secret list --org <owner>` or `gh secret list` (in the repo) lists `REPOBUDDY_APP_ID` and
     `REPOBUDDY_APP_PRIVATE_KEY`.
   - Another workflow in `.github/workflows/` already calls a `repobuddy/.github` workflow that takes those secrets,
     such as `dep-changeset.yml`.

   If you cannot tell (for example, `gh` lacks access to the org's secrets), ask the user. When the app is set up,
   follow **With the repobuddy app**. Otherwise follow **Without the app**.
2. If the repo restricts `GITHUB_TOKEN` to read-only (Settings → Actions → General → Workflow permissions), tell the
   user the workflow-level `permissions:` block still grants what it needs, unless an org policy blocks it.
3. Commit as `ci: expire minimum-release-age exemptions automatically`.

## With the repobuddy app

1. Copy `assets/ci/github.yml` to `.github/workflows/min-release-age.yml`. It calls the shared
   `repobuddy/.github/.github/workflows/min-release-age.yml@v2`, which runs the published `repobuddy` CLI, so copy
   no script into the repo.
2. Tell the user no token secret is needed: the shared workflow mints the token from `REPOBUDDY_APP_ID` and
   `REPOBUDDY_APP_PRIVATE_KEY`. The app needs **Contents: write** and **Pull requests: write** on this repo.

## Without the app

1. Copy `scripts/min-release-age.mjs` to `.github/scripts/min-release-age.mjs`.
2. Copy `assets/ci/github-token.yml` to `.github/workflows/min-release-age.yml`.
3. Tell the user that required checks will not run on the restore PR unless they add a `MIN_RELEASE_AGE_TOKEN`
   secret: a GitHub App installation token or a fine-grained PAT with Contents and Pull requests write access on
   this repo. Until then, the job opens the PR with `GITHUB_TOKEN`.

Both workflows run daily on `schedule` and on `workflow_dispatch`. Never add `pull_request_target` or any trigger that
runs on untrusted input. Keep the shared workflow pinned to `@v2` and the checkout action pinned by SHA.

Scheduled workflows run only on the default branch, and GitHub disables them after 60 days without repository activity
in a public repo.
