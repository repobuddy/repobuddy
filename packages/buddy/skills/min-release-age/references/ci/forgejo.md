# Setup CI — Forgejo Actions / Gitea Actions

Codeberg runs Forgejo. The paths below use `.forgejo/`. For Gitea, use `.gitea/` in every path, including the `SCRIPT` value in the workflow.

**Pick the directory the repo already uses.** Forgejo and Gitea read `.github/workflows` only when their own workflow directory does not exist. If the repo's workflows live in `.github/workflows`, put the job and script under `.github/` too. Creating `.forgejo/workflows` or `.gitea/workflows` would silently disable every existing workflow.

1. Copy `scripts/min-release-age.mjs` to `.forgejo/scripts/min-release-age.mjs`.
2. Copy `assets/ci/forgejo.yml` to `.forgejo/workflows/min-release-age.yml`.
3. Set `runs-on:` to the label the repo's other workflows use. If there are none, ask the user which runner label their instance provides. The job runs in a `node:22` container, so the runner must support containers.
4. **Token.** The automatic token can push and open PRs when the instance runs Actions in permissive mode. In restricted mode, the `permissions:` block in the workflow grants what the job needs. A PR opened with the automatic token does not trigger workflows. If the restore PR must pass checks, have the user add a personal access token (repository read and write) as the `MIN_RELEASE_AGE_TOKEN` secret.
5. Commit as `ci: expire minimum-release-age lifts automatically`.

Actions must be enabled for the repository (**Settings → Units** on Forgejo, **Settings → Repository → Actions** on Gitea).
