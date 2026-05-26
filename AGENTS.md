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

# Initial build (required before first test run — repo dogfoods itself)
pnpm build

# Build all packages
pnpm build

# Run all tests
pnpm test

# Run tests for a single package
pnpm --filter @repobuddy/jest test
pnpm --filter @repobuddy/typescript test

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
- `@repobuddy/biome` — Predefined Biome configs
- `@repobuddy/typescript` — TypeScript tools and utilities
- `repobuddy` — CLI for managing the repository itself

**Public agent skills** (`skills/`) — installed by consumers via `npx skills add repobuddy/repobuddy`:
- `create-issue` — create GitHub/GitLab issues, dedup check first
- `merge-dep-prs` — merge Dependabot/Renovate PRs, handles CI failures
- `setup-github-repo` — branch protection, Dependabot, CI setup

**Repo-private contributor skills** (`.agents/skills/`) — `metadata: internal: true`, not shipped to consumers:
- `add-changeset`, `audit-skill`, `create-skill`, `find-awesome-skill`, `fix-security-pr`

**Test cases** live under `testcases/` — these are fixture packages exercised by integration tests.

**Build pipeline**: Turborepo tasks are declared in `turbo.json`. `coverage` and `test` depend on `@repobuddy/jest#build` and `@repobuddy/vitest#build` first, because the repo dogfoods its own jest config.

**Note on initial setup**: Always run `pnpm build` before `pnpm test` on a fresh clone — the jest/vitest packages must be built before they can be used by test runners.

## Skill Repo Conventions

- Public skills live in `skills/<name>/SKILL.md`. The `name` in frontmatter must match the directory name.
- Repo-private skills live in `.agents/skills/<name>/SKILL.md` and **must** include `metadata: internal: true` in frontmatter.
- Never duplicate a skill between `skills/` and `.agents/skills/` without a documented reason.
- After adding or editing any `.agents/skills/` entry, run `npx cyber-skills@0.4.3 skill repair-private` to ensure metadata is correct.
- CI validates public skills on PRs touching `skills/` via `npx cyber-skills@0.4.3 audit validate`.

## Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning and release.

- Every PR that modifies a published package needs a changeset: `pnpm cs`
- Release PRs are created automatically by the Changesets GitHub Action — **never merge release PRs manually**
- `pnpm version` bumps versions; `pnpm release` builds and publishes
