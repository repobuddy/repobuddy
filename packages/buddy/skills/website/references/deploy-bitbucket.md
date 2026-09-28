# Deploy to Bitbucket Cloud static hosting

Bitbucket serves a static site from the main branch of a repo named exactly `<workspace>.bitbucket.io`.
Each workspace can have only one such repo. A project's own pipeline therefore publishes by pushing its
build output into that repo. Bitbucket has no official recipe for this. The pattern below is a git push
from Bitbucket Pipelines.

Reference: [Publishing a website on Bitbucket Cloud](https://support.atlassian.com/bitbucket-cloud/docs/publishing-a-website-on-bitbucket-cloud/).

## Base path

Every subfolder of the `<workspace>.bitbucket.io` repo is its own site with its own `index.html`. Give
each project its own subfolder so that projects in the same workspace do not overwrite each other.

| Case | `SITE_URL` | `BASE` |
|---|---|---|
| A project repo | `https://<workspace>.bitbucket.io` | `/<repo-slug>` |
| The site is the `<workspace>.bitbucket.io` repo itself, built in place | `https://<workspace>.bitbucket.io` | `/` |

The site is public even when both repos are private. Confirm with the user that this is acceptable.

## Prepare the target repo

1. Check that `<workspace>.bitbucket.io` exists:
   `curl -s -o /dev/null -w '%{http_code}' -u <user>:<token> https://api.bitbucket.org/2.0/repositories/<workspace>/<workspace>.bitbucket.io`.
   If it does not, ask the user to create it (or create it with the API if they agree).
2. The user creates a **repository access token** on the `<workspace>.bitbucket.io` repo with write
   permission, and adds it to the project repo as a secured repository variable named
   `PAGES_REPO_TOKEN`. The agent cannot do this. Report it as a manual step.

## Pipeline

Add a step to `bitbucket-pipelines.yml` on the default branch. Merge it in if the file exists.

```yaml
image: node:<NODE_VERSION>

pipelines:
  branches:
    <DEFAULT_BRANCH>:
      - step:
          name: Deploy website
          condition:
            changesets:
              includePaths:
                - '<SITE_DIR>/**'
                - 'bitbucket-pipelines.yml'
          script:
            # <PACKAGE_MANAGER_SETUP>: `corepack enable` for pnpm or yarn
            - <INSTALL_CMD>
            - <BUILD_CMD>
            - git clone --depth 1 "https://x-token-auth:${PAGES_REPO_TOKEN}@bitbucket.org/<workspace>/<workspace>.bitbucket.io.git" pages-repo
            - rm -rf "pages-repo/<repo-slug>"
            - cp -r <DIST_DIR> "pages-repo/<repo-slug>"
            - cd pages-repo
            - git add -A
            - git -c user.name=pipelines -c user.email=pipelines@noreply.bitbucket.org commit -m "deploy <repo-slug> ${BITBUCKET_COMMIT}" || echo "no changes"
            - git push
```

- Leave out `condition` when the site is the whole repo.
- The step replaces only the project's subfolder. Never clear the whole target repo, because other
  projects in the workspace publish there too.
- If two projects deploy at the same moment, one push is rejected. Re-run the failed step.

## Enable hosting

There is no setting to turn on. Bitbucket serves the target repo's main branch as soon as it has content.
After the first run, open `SITE_URL` + `BASE` and check that the page loads with its CSS.
