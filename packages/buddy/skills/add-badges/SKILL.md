---
name: add-badges
description: Use this skill when adding, fixing, or auditing readme badges — npm, CI, docs, coverage, license.
---

# Add Badges

Apply when a readme has no badge row, when badges are stale after a rename or transfer, or when a package was just published.

## When to use

- A readme opens straight into prose with no status row
- A repo was renamed, transferred, or its default branch changed, so badge URLs point at the old identity
- A package started publishing to npm, or a docs site was just deployed, and nothing advertises it
- Someone asks to "add badges", "add shields", or "make the readme look maintained"

## Workflow

### 1. Find the file badges belong in

Badges go in the readme that the audience actually renders. Resolve which file that is before writing anything:

```bash
ls README.md readme.md 2>/dev/null
find . -maxdepth 3 -iname 'readme.md' -not -path '*/node_modules/*'
```

- Single package at the repo root: the root readme.
- Monorepo with a published package: the badge row belongs in the **published package's** readme, since npm renders only that one. If the repo root and the package must share it, make the package copy the real file and symlink the root to it — GitHub renders a symlinked readme, and npm packs the target's contents.
- A readme that is generated (from a template, `llms-txt`, or a docs build) gets badges in its source, not its output.

### 2. Collect the facts each badge needs

Detect; never assume.

```bash
gh repo view --json nameWithOwner,visibility,defaultBranchRef,homepageUrl
node -p "require(process.cwd() + '/package.json').name" 2>/dev/null
ls .github/workflows/
find . -maxdepth 2 -iname 'LICENSE*' -not -path '*/node_modules/*'
```

Stop if `visibility` is `PRIVATE`: shields.io cannot read a private repo, so workflow and coverage badges render as `invalid`. Emit npm badges only.

Scoped package names must be URL-encoded in shields paths (`@scope/name` → `%40scope%2Fname`).
<!-- TODO: extract to scripts/badge-facts.sh — detection and URL encoding are deterministic -->

### 3. Choose the set

Include a badge only when the thing it reports exists and a reader would act on it. Default set, in this order:

| Badge | Include when | Source |
| --- | --- | --- |
| npm version | package is published (`npm view <name> version` succeeds) | `img.shields.io/npm/v/<name>.svg` |
| npm downloads | published and not a fresh first release | `img.shields.io/npm/dm/<name>.svg` |
| CI / release | a workflow runs on the default branch | `github.com/<owner>/<repo>/actions/workflows/<file>/badge.svg` |
| coverage | a coverage service already reports (`codecov.yml`, coveralls config) | the service's own badge URL |
| docs | a docs site is deployed and reachable | `img.shields.io/badge/docs-<host>-blue` |
| license | always, once the license is known | `img.shields.io/npm/l/<name>.svg`, or a static badge for an unpublished repo |

Badge the workflow that gates the default branch — the release or push workflow. A pull-request workflow's badge reports its last default-branch run, which is stale or absent, so it reads red or "no status" while the repo is healthy.

Cap the row at six. Beyond that the row wraps and stops being scannable.

### 4. Point every link at something that exists

Each badge is a link. Verify the target before writing it:

- License badge → the `LICENSE` file only if one is on disk. If the repo declares a license in `package.json` but ships no file, link the npm page and say the file is missing.
- Docs badge → derive the URL from the site config (`site` + `base` in an Astro config, `baseUrl` in Docusaurus) or `gh repo view --json homepageUrl`, not from the repo name.
- Workflow badge → the workflow file must exist in `.github/workflows/` on the default branch, or the badge 404s.

### 5. Write the row

Place it directly under the H1, separated by a blank line above and below, one badge per line so diffs stay readable:

```markdown
# <name>

[![npm version](https://img.shields.io/npm/v/<name>.svg)](https://www.npmjs.com/package/<name>)
[![release](https://github.com/<owner>/<repo>/actions/workflows/release.yml/badge.svg)](https://github.com/<owner>/<repo>/actions/workflows/release.yml)

<description>
```

### 6. Ship and verify

- A readme inside a published package is user-visible on npm: add a changeset (patch) if the repo uses changesets.
- Push the branch and confirm the badges actually render before merging — fetch the branch's repo page rather than trusting the markup. A wrong workflow filename or an unencoded scope shows as a broken image, not an error.

## Anti-patterns

- Badges for services the repo does not use — a coverage badge with no coverage upload renders "unknown" forever
- The legacy `img.shields.io/github/workflow/status/...` endpoint; it was retired, use the repo's own `badge.svg`
- `?branch=master` or an old owner left in a URL after a rename or transfer
- Build-status badges on a private repo
- A "docs" badge pointing at a Pages URL that has never deployed
