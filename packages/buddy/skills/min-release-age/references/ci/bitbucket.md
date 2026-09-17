# Setup CI — Bitbucket Pipelines

1. Copy `scripts/min-release-age.mjs` to `ci/min-release-age.mjs`.
2. Merge the `min-release-age` entry from `assets/ci/bitbucket.yml` into `bitbucket-pipelines.yml` under `pipelines:` → `custom:`. Create `custom:` if it is missing. Keep every existing pipeline unchanged.
3. **Token.** Pushing back to the same repo works without setup, unless branch restrictions block it. Opening the PR needs a **repository access token** with the `pullrequest:write` scope. Have the user create one (**Repository settings → Security → Access tokens**) and store it as a secured repository variable named `MIN_RELEASE_AGE_TOKEN`.
4. Commit as `ci: expire minimum-release-age lifts automatically`.
5. **Schedule.** After the commit reaches the default branch, have the user open **Repository settings → Pipelines → Schedules → New schedule** and pick the default branch, the `custom: min-release-age` pipeline, and a daily interval. Bitbucket has no in-file schedule.

`open-pr` targets the branch the schedule runs on (`BITBUCKET_BRANCH`), so the schedule must run on the default branch.
