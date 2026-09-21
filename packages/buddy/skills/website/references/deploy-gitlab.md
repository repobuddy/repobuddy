# Deploy to GitLab Pages

GitLab Pages, deployed by a CI job in `.gitlab-ci.yml`. Works on gitlab.com and on self-managed GitLab
with Pages enabled. Requires `glab`, logged in, with the Maintainer or Owner role on the project for the
Pages API.

Reference: [GitLab Pages](https://docs.gitlab.com/user/project/pages/),
[`pages` CI keyword](https://docs.gitlab.com/ci/yaml/#pages), [Pages API](https://docs.gitlab.com/api/pages/).

## Base path

GitLab turns on the **unique domain** setting by default for every new Pages site. It decides the base
path, so check it first:

```bash
glab api "projects/:id/pages"
```

The response carries `url` and `is_unique_domain_enabled`. A 404 means the project has no Pages
deployment yet.

| Case | `SITE_URL` | `BASE` |
|---|---|---|
| Unique domain on (the default for a new site) | the `url` from the API, for example `https://my-site-a1b2c3.gitlab.io` | `/` |
| Unique domain off | `https://<namespace>.gitlab.io` | `/<project-path>` |
| Project named `<namespace>.gitlab.io` | `https://<namespace>.gitlab.io` | `/` |
| Custom domain | `https://<domain>` | `/` |

With the unique domain on, the classic `https://<namespace>.gitlab.io/<project-path>` URL redirects to
the unique domain, where the site sits at the root. A `base` of `/<project-path>` then breaks every asset
path.

Before the first deploy, the unique hostname does not exist yet. `BASE` is still `/`. Leave out `site`
(or set a placeholder), deploy once, then read `url` from the API and set `site`.

Ask the user whether they want the unique domain or the classic path URL. To use the classic URL, turn
the setting off:

```bash
glab api --method PATCH "projects/:id/pages" -F pages_unique_domain_enabled=false
```

If the call returns 404, the project has no Pages deployment yet. Run the first deploy, turn the setting
off, then run the `pages` job again.

## CI job

Add a `pages` job to `.gitlab-ci.yml`. If the file exists, merge the job in, and check that its `stage`
is one the file's `stages:` list declares.

```yaml
pages:
  stage: deploy
  image: node:<NODE_VERSION>
  script:
    # <PACKAGE_MANAGER_SETUP>
    - <INSTALL_CMD>
    - <BUILD_CMD>
  pages:
    publish: <DIST_DIR>
  artifacts:
    paths:
      - <DIST_DIR>
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      changes:
        - <SITE_DIR>/**/*
        - .gitlab-ci.yml
```

Leave out `changes:` when the site is the whole repo. Replace `<PACKAGE_MANAGER_SETUP>`:

| PM | Script lines |
|---|---|
| pnpm | `corepack enable`. Corepack reads the pnpm version from `packageManager` |
| yarn | `corepack enable` |
| bun | Use the `oven/bun` image instead of `node`, with no setup line |
| npm | none |

`pages.publish` publishes any directory, so the build output does not have to be named `public/`. Recent
GitLab versions add the publish path to `artifacts:paths` on their own. Listing it anyway keeps the job
working on older self-managed instances.

Validate the file before committing:

```bash
glab ci lint
```

If the lint rejects the `pages:` keyword, the instance is too old for it. Remove the `pages:` block and
add a final script line that copies the output to `public/` (`rm -rf public && cp -r <DIST_DIR> public`),
then set `artifacts:paths` to `public`.

## Enable Pages

Nothing needs to be turned on. The first successful `pages` job creates the site. After it runs, confirm:

```bash
glab api "projects/:id/pages"
```

The expected result is a `url` that matches `SITE_URL` and `BASE`, and one entry in `deployments`. If
the project's Pages access control is on, only project members can view the site. Tell the user.
