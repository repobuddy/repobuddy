# Setup CI — other providers

There is no template for this CI system (for example CircleCI, Jenkins, Travis, Woodpecker, Drone, or Buildkite), or for this git host.

1. Copy `scripts/min-release-age.mjs` to `ci/min-release-age.mjs`.
2. Write a daily scheduled job in the repo's existing CI system. Use its native scheduling, for example CircleCI scheduled triggers, Jenkins `cron`, or Woodpecker cron. Base the job on `assets/ci/gitlab.yml`, which uses no CI-specific actions:
   - run `node ci/min-release-age.mjs restore --json --body-file <tmp>/body.md`
   - stop when `removed` is empty
   - commit as `chore: restore minimum release age` on `chore/min-release-age-restore`, and force-push that branch
   - open or update a change request to the default branch with the host's CLI or API. For a Bitbucket, Azure Repos, Forgejo, or Gitea host, call `node ci/min-release-age.mjs open-pr --provider <host>` with the environment variables that provider's template supplies. For a GitHub host, use `gh pr create`.
3. Show the user the job before committing. Ask which secret holds a token that can push and open change requests.
4. If the CI system cannot push, schedule `node ci/min-release-age.mjs status --check` instead. It exits 1 when a lift has expired, so the job fails. Tell the user to run Restore by hand when it does.
5. Commit as `ci: expire minimum-release-age lifts automatically`.
