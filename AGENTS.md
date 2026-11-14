# AGENTS.md

When reading a `SKILL.md`, also read a `SKILL.local.md` in the same directory if one exists; it extends the skill and wins where they conflict.

## Commit Discipline

Commit each unit of work as soon as it is complete and verified, without waiting to be asked. Finishing several units before committing, or putting two units in one commit, breaks this rule.

A unit of work is one coherent change that can be reverted on its own: one feature, one bugfix, one refactor, one config change, or one test expansion for one concern. A red-green-refactor cycle alone is not a unit.

Commit with the `commit` skill from repobuddy. Where it is not installed, stage only this unit's files by name, leave unrelated changes unstaged, and never commit with failing checks.

## Commands

```sh
pnpm install
pnpm build        # required before the first test run: the repo dogfoods its own jest/vitest configs
pnpm test
pnpm --filter @repobuddy/jest test   # one package (also @repobuddy/typescript, @repobuddy/vitest)
pnpm coverage
pnpm check        # biome: format + lint, whole repo
pnpm check:fix
pnpm format
pnpm lint         # eslint, YAML only
pnpm --filter @repobuddy/biome check:preset   # each fixture's biome-ignore must still be used
pnpm verify       # everything CI runs; no separate typecheck — build runs tsc
pnpm verify:ci    # same, concurrency=1
pnpm cs           # add a changeset
npx cyber-skills@0.4.3 skill validate-private
npx cyber-skills@0.4.3 skill repair-private   # after editing .agents/skills/
npx cyber-skills@0.4.3 audit validate --root packages/buddy   # before a PR touching packages/buddy/skills/; no CI runs it
```

## Scope

A new package must be a repository tool a consumer installs on its own: test, lint, or TypeScript config, a `buddy` CLI plugin, or agent skills. Application code does not belong here.
Before changing what a package does, read its GOALS.md: [repobuddy](packages/buddy/GOALS.md), [jest](packages/jest/GOALS.md), [vitest](packages/vitest/GOALS.md), [biome](packages/biome/GOALS.md), [typescript](packages/typescript/GOALS.md), [test](packages/test/GOALS.md).

## Layout

pnpm + Turborepo monorepo. Published packages in `packages/`; public skills in `packages/buddy/skills/`, shipped in the `repobuddy` npm package; integration fixtures in `testcases/`.

- Before touching `packages/buddy/plugin.json`, any `*-plugin/` manifest or marketplace catalog, or the `version` script, read [.agents/docs/plugin-manifests.md](.agents/docs/plugin-manifests.md) — most of those files are generated.
- Before editing `website/`, or after changing a package's presets, exports, options, or commands, read [.agents/docs/website.md](.agents/docs/website.md).

## Skills

- A skill's frontmatter `name` matches its directory. Every skill ships a `README.md` for people beside its `SKILL.md`.
- Repo-private skills in `.agents/skills/` need `metadata: internal: true`. They are installed from other repos and pinned in `skills-lock.json`: update them through the Skills CLI, never in place, or the lock hash goes stale.
- Never duplicate a skill between `packages/buddy/skills/` and `.agents/skills/` without a documented reason.

## Dependencies

Renovate owns dependency updates.

- Never bulk-rewrite ranges: `pnpm update -r` conflicts with open Renovate PRs. Use `pnpm update -r --no-save` to refresh the lockfile only.
- `minimumReleaseAge: 1440` (strict) lives in `pnpm-workspace.yaml`, never `.npmrc` (pnpm 11 ignores it there). A dep PR failing the supply-chain check within 24h of publish needs a re-run later, not a fix.

## Changesets

- Every PR that modifies a published package needs a changeset (`pnpm cs`).
- Merge a Changesets release PR only when the owner asks, after every check passes, through GitHub — never by pushing to the release branch or merging locally. Its runs may wait on workflow approval (`action_required`); approve them when asked to release.
