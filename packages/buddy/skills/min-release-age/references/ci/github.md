# Setup CI — GitHub Actions

1. Copy `scripts/min-release-age.mjs` to `.github/scripts/min-release-age.mjs`.
2. Copy `assets/ci/github.yml` to `.github/workflows/min-release-age.yml`.
3. Tell the user that a PR opened with `GITHUB_TOKEN` does not trigger `pull_request` workflows. Required checks will not run on the restore PR unless they add a `MIN_RELEASE_AGE_TOKEN` secret: a GitHub App installation token or a fine-grained PAT with Contents and Pull requests write access on this repo.
4. If the repo restricts `GITHUB_TOKEN` to read-only (Settings → Actions → General → Workflow permissions), tell the user the job-level `permissions:` block still grants what it needs, unless an org policy blocks it.
5. Commit as `ci: expire minimum-release-age lifts automatically`.

The workflow runs daily on `schedule` and on `workflow_dispatch`. Never add `pull_request_target` or any trigger that runs on untrusted input. Keep the checkout action pinned by SHA.

Scheduled workflows run only on the default branch, and GitHub disables them after 60 days without repository activity in a public repo.
