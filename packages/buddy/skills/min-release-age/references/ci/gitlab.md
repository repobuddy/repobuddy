# Setup CI — GitLab CI

1. Copy `scripts/min-release-age.mjs` to `ci/min-release-age.mjs`.
2. Copy `assets/ci/gitlab.yml` to `.gitlab/ci/min-release-age.yml`.
3. Add it to `.gitlab-ci.yml`. Keep any existing `include:` entries:
   ```yaml
   include:
     - local: .gitlab/ci/min-release-age.yml
   ```
4. **Other jobs.** A scheduled pipeline also runs every other job whose rules allow schedules. Show the user which jobs lack a schedule guard, and offer to add this rule at the top of their `rules:`:
   ```yaml
   - if: $MIN_RELEASE_AGE == "restore"
     when: never
   ```
5. **Push access.** Ask the user which identity pushes:
   - **Project access token** (recommended): create one with the `write_repository` scope and the Developer role, and store it as a masked, protected CI/CD variable named `MIN_RELEASE_AGE_TOKEN`. Its MR runs pipelines like any other.
   - **Job token**: needs GitLab 18.4+ and **Settings → CI/CD → Job token permissions → Allow Git push requests to the repository**. A push with the job token does not start a pipeline for the branch.
6. Commit as `ci: expire minimum-release-age lifts automatically`.
7. **Schedule.** The schedule lives in GitLab, not in the file. After the commit reaches the default branch, ask before creating it. This is a change to the project's settings:
   ```bash
   glab schedule create --cron "17 3 * * *" --description "min-release-age restore" \
     --ref <default-branch> --variable "MIN_RELEASE_AGE:restore"
   ```
   Without `glab`, point the user to **Build → Pipeline schedules** and have them add the same cron and variable.

Push options cannot carry newlines, so the MR description is flattened to one line. Pushing again to the branch updates the open MR.
