# AGENTS.md

This file provides guidance to AI coding assistants when working with code in this repository.

## Skill Augmentations

When reading any `SKILL.md` file, always check whether a `SKILL.local.md` exists in the same directory. If it does, treat its contents as additional instructions that extend the base skill. Local augmentations take precedence over the base skill where they conflict.

## Commit Discipline

**Auto-commit rule:** When a unit of work is complete and verified, commit it immediately — do not wait for the user to ask. Batching multiple units into one commit, or finishing all work before committing, are both violations of this rule.

**Unit of work:** one coherent, independently revertable change — one domain's refactor, one feature, one bugfix, one test suite expansion for one concern, one config change. Never two unrelated concerns in the same commit. A TDD red-green-refactor cycle alone is not a commit boundary; commit when the full intended change is complete and tests pass. If the working tree has unrelated changes, leave them unstaged — commit the current unit first, then continue.

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- One concern per commit; never batch unrelated changes
- Stage only files for this unit: `git add <files>`, then verify with `git diff --cached`
- Never use `git add .`, `git add -A`, or `git add -p` (interactive commands agents cannot run)
- Never commit with red tests; run validation commands first

### References

- **`commit-work` skill** — staging, splitting, and message writing when committing

## Commands

```sh
# Install dependencies
pnpm install

# Build all packages
# (also required before the first test run — the repo dogfoods its own jest/vitest configs)
pnpm build

# Run all tests
pnpm test

# Run tests for a single package
pnpm --filter @repobuddy/jest test
pnpm --filter @repobuddy/typescript test
pnpm --filter @repobuddy/vitest test

# Run coverage
pnpm coverage

# Lint and format check
pnpm check        # biome check
pnpm lint         # eslint

# Fix formatting
pnpm format       # biome format --write
pnpm check:fix    # biome check --fix

# Full verify (typecheck + lint + coverage + depcheck + size)
pnpm verify

# CI verify (same tasks, concurrency=1)
pnpm verify:ci

# Add a changeset
pnpm cs           # alias for changeset

# Validate private skills without writing
npx cyber-skills@0.4.3 skill validate-private

# Repair private skills (sets metadata: internal: true, removes erroneous symlinks)
npx cyber-skills@0.4.3 skill repair-private

# Validate public skills
npx cyber-skills@0.4.3 audit validate
```

## Architecture

This is a **pnpm monorepo** managed with [Turborepo](https://turbo.build/). It is a **tooling library** skill repo — it ships npm packages and agent skills from the same repo.

**Published packages** (`packages/`):
- `@repobuddy/jest` — Jest presets and config helpers
- `@repobuddy/vitest` — Vitest presets and config helpers
- `@repobuddy/biome` — Predefined Biome configs
- `@repobuddy/typescript` — TypeScript tools and utilities
- `@repobuddy/test` — Shared test utilities
- `repobuddy` — CLI for managing the repository itself

**Public agent skills** (`packages/buddy/skills/`) — shipped as a universal plugin inside the `repobuddy` npm package, and installed by consumers via `npx skills add repobuddy/repobuddy`:
- `add-astro-website` — add an Astro/Starlight docs site to a monorepo as a private workspace package; wires turbo, knip, biome, and pnpm build approvals, and hands off deploy to `setup-github-pages`
- `create-issue` — create GitHub/GitLab issues, dedup check first
- `init-buddy` — set up the machine for the repo's git host: detect OS, package managers, and existing MCP servers; install and log in `gh`, `glab`, `tea`, `fj`, or `az`
- `llms-txt` — publish an `llms.txt` generated from the project's public surface; decides whether one is warranted, wires the drift check, reports the documentation gap
- `merge-dep-prs` — merge Dependabot/Renovate PRs; gates each merge on whether CI reached the change's blast radius, handles CI failures
- `min-release-age` — lift the minimum-release-age gate for one package version, restore it once the version ages past the window, and install a scheduled CI job that expires lifts automatically (pnpm, Yarn, npm, bun; GitHub, GitLab, Bitbucket, Azure, Forgejo/Gitea)
- `review-permissions` — audit harness permissions (Claude Code, Cursor, Codex, Copilot, Gemini): risk, tightening, consolidation
- `setup-github-pages` — deploy a static site to GitHub Pages (base path, Actions workflow, Pages source)
- `setup-github-repo` — branch protection, Dependabot, CI setup
- `setup-npm-trusted-publishing` — register npm trusted publishers (OIDC) to retire `NPM_TOKEN`; one package, an org, or every org owned
- `to-question` — word a question for a platform (Slack, Jira, Linear, Asana, GitHub, GitLab, Bugzilla, Redmine, Trac, email); composes, never posts

**Related skill collections** (separate repos, same install flow):
- [`repobuddy/agent-changesets`](https://github.com/repobuddy/agent-changesets) — changeset authoring and release setup
- [`repobuddy/agent-security`](https://github.com/repobuddy/agent-security) — security PR remediation

**Repo-private contributor skills** (`.agents/skills/`) — `metadata: internal: true`, not shipped to consumers:
- `add-changeset`, `audit-skill`, `create-skill`, `find-awesome-skill`, `fix-security-pr`

These are *installed* from the related collections above and from
[`cyberuni/cyber-skills`](https://github.com/cyberuni/cyber-skills), not authored here. `skills-lock.json`
records each one's source repo, path, and content hash — update them through the Skills CLI rather than
editing in place, or the lock hash goes stale.

**Test cases** live under `testcases/` — fixture packages exercised by integration tests.

**Universal plugin**: `packages/buddy/plugin.json` is the canonical manifest (Agent Plugins Specification v1.0.0). The
`.claude-plugin/`, `.cursor-plugin/`, and `.codex-plugin/` manifests beside it, and the two local marketplace catalogs
(`.claude-plugin/marketplace.json`, `.github/plugin/marketplace.json`), are **generated** by
`npx universal-plugin plugin build` — never hand-edit them, except the Claude catalog's `source` (see below). Copilot
CLI reads the canonical `plugin.json` directly, so nothing is derived for it. `packages/buddy/.agents/universal-plugin.json`
declares `packagePath: "."`, which is what this repo's release wiring reads — not the field of the same name that used
to live under `plugin.json`'s `extensions` block, which this CLI version no longer reads there.

The `version` script (`changeset version && node scripts/sync-plugin-manifests.mjs`) carries a released version into
the plugin automatically: `scripts/sync-plugin-manifests.mjs` runs `universal-plugin publish sync-version` (never
`plugin version` — this is a changesets repo, so changesets decides the number) followed by `plugin build`, pinned to
an exact `universal-plugin` version. `scripts/check-plugin-version.mjs` (wired into `verify` as `check-plugin-version`)
fails when `packages/buddy/package.json`'s version disagrees with the manifest, any vendor manifest, or either
catalog's `repobuddy` entry.

`plugin build`'s catalog generation only ever writes a local-path `source`; it has no npm-package source concept. This
repo ships its Claude Code/Codex catalog entry from the published `repobuddy` npm package instead (so the catalog
carries the built, gitignored skill script bundles that only the npm tarball has) — `sync-plugin-manifests.mjs`
restores that `source` in `.claude-plugin/marketplace.json` after every rebuild. That is the one field in a generated
file this repo intentionally keeps out of sync with the tool's own output.

**Documentation site** lives under `website/` (Astro).

**Build pipeline**: Turborepo tasks are declared in `turbo.json`. `coverage` and `test` depend on `@repobuddy/jest#build` and `@repobuddy/vitest#build` first, because the repo dogfoods its own jest/vitest configs.

**Note on initial setup**: Always run `pnpm build` before `pnpm test` on a fresh clone — the jest/vitest packages must be built before they can be used by test runners.

## Skill Repo Conventions

- Public skills live in `packages/buddy/skills/<name>/SKILL.md`. The `name` in frontmatter must match the directory name.
- Every skill ships a `README.md` beside its `SKILL.md`. `SKILL.md` instructs the agent; the `README.md` explains to a person what the skill does, how to invoke it, and what it produces.
- Repo-private skills live in `.agents/skills/<name>/SKILL.md` and **must** include `metadata: internal: true` in frontmatter.
- Never duplicate a skill between `packages/buddy/skills/` and `.agents/skills/` without a documented reason.
- After adding or editing any `.agents/skills/` entry, run `npx cyber-skills@0.4.3 skill repair-private` to ensure metadata is correct.
- CI validates public skills on PRs touching `packages/buddy/skills/` via `npx cyber-skills@0.4.3 audit validate`.

## Dependencies

Renovate manages this repo's dependencies (`.github/renovate.json` extends `github>unional/renovate-preset`).

- **Let Renovate own semver range bumps.** Do not bulk-rewrite ranges in `package.json` — plain `pnpm update -r`
  rewrites every range to the exact latest and conflicts with the open Renovate PRs. To refresh resolved
  versions only, use `pnpm update -r --no-save`, which touches the lockfile alone.
- **`pnpm-workspace.yaml` sets `minimumReleaseAge: 1440`.** Any lockfile entry published within the last 24h fails the
  supply-chain check in CI with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. A freshly opened dep PR often fails
  for this reason alone — re-run the job once the version has aged out rather than debugging it as a real break.
- `dependabot-automerge.yml` only fires for `dependabot[bot]`, which covers GitHub security updates; regular
  updates all come through Renovate.

## Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning and release.

- Every PR that modifies a published package needs a changeset: `pnpm cs`
- Release PRs are opened automatically by the Changesets GitHub Action. An agent merges one only when the owner asks, and only after every check passes, through GitHub — never by pushing to the release branch or merging locally.
- The bot's release PR runs can wait on workflow approval (`action_required`); the owner, or an agent asked to release, approves those runs before the checks can complete.
- `pnpm version` bumps versions; `pnpm release` builds and publishes
