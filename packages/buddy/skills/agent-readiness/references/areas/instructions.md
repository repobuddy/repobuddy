# Agent instructions (weight 15)

The instructions file (`AGENTS.md`, or a harness-specific file like `CLAUDE.md`) loads on every turn
of every session. A wasted line costs more here than anywhere else in the repo.

**buddy-agent-harness owns this area's configuration**: multi-harness bridges, skill layout, MCP
files. Hand fixes to it. This area only reads and reports, and it reads what buddy-agent-harness
`doctor` finds rather than checking those files itself.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `readme` | 1 | yes | script: a README at the root |
| `instructions-file` | 3 | yes | script: a root instructions file exists |
| `instructions-commands` | 3 | yes | script: each `pnpm <x>`, `npm run <x>`, `yarn <x>`, `bun run <x>`, `make <x>` it names exists in the root `package.json` or `Makefile` |
| `instructions-accurate` | 3 | yes | **judgment** |
| `instructions-scope` | 3 | no | script finds the statement: a scope, purpose, or non-goals heading or line in an instructions file, or a file one names; in a monorepo, per published package too; then **judgment** |
| `instructions-lean` | 4 | yes | script: all instruction files together under ~3000 tokens (four characters per token) |
| `harness-doctor` | 3 | no | script: buddy-agent-harness `doctor` reports no findings |
| `harness-<problem>` | 3 | no | script: one per problem `doctor` reports, such as `harness-missing` |

`instructions-commands` checks the root manifest only. A command scoped to a workspace package
(`pnpm --filter x test`) is not checked, and a script defined in a workspace package can show up as
missing. Confirm each reported one before calling it wrong.

## buddy-agent-harness doctor

When the repo has buddy-agent-harness, the script runs its `doctor --format json`, which is
read-only. It looks in this order:

1. the repo root, when its `package.json` is named `buddy-agent-harness`
2. a workspace package of that name, from `pnpm-workspace.yaml` or `package.json` `workspaces`
3. an installed copy in `node_modules/buddy-agent-harness`

The repo's own package runs from `src/cli.ts` with node's `--experimental-transform-types`, so it
needs no build. Otherwise, and always for an installed copy, it runs the package's `bin`.

With no findings, `harness-doctor` passes. Each problem `doctor` names becomes a failing `harness-<problem>` check that lists the affected paths, and
`harness-doctor` is left out. These checks count toward the area score but never gate the level.
Their fixes belong to the `doctor-buddy-agent-harness` skill, which knows each repair.

When none of these exists, `harness-doctor` is `n/a` and names the plugin. When
`doctor` fails or its output cannot be read, `harness-doctor` is `judge`: run the
`doctor-buddy-agent-harness` skill and settle it from its report.

## Judging `instructions-accurate`

Read the instructions file against the repo. Pass when:

- the layout it describes matches the directories that exist
- the rules it states are ones the repo follows (spot-check two)
- nothing in it is history ("we used to", "migrated from"), a restatement of what the code or a config file already says, or an essay an agent does not need to act

Fail when any section is stale, or when more than a few lines are history or restatement. Name the
sections in the reason.

## Judging `instructions-scope`

An agent asked to add a feature, package, or dependency needs to know what the project is for and
what it deliberately is not, or it accepts scope creep it should push back on. The statement must be
in the always-loaded instructions file: an agent cannot lazily load the file that tells it a change
does not belong, because it does not know it needs it.

The shape this check rewards:

- **The instructions file carries the purpose and the boundary in 2-4 lines**: what the project is,
  and what it is not.
- **A file it names carries the detail**, read on demand: goals, non-goals, and directions
  considered and rejected, each with its reason. The instructions file names it with a trigger line,
  such as "Before adding a feature, package, dependency, or public API, read GOALS.md."
- A small repo can keep everything in the instructions file, with no second file.

The link matters, not the filename: no agent opens a scope file it was not told about, and no name is
an established convention for one. The script follows every local `.md` file an instructions file
names (a link, an `@` import, or a bare `GOALS.md`) and counts it when it has a well-known name
(`GOALS.md`, `NON-GOALS.md`, `SCOPE.md`, `VISION.md`, `PURPOSE.md`, at the root or under `docs/`) or a
scope, purpose, or non-goals heading. An FAQ or philosophy page with a non-goals section counts this
way.

The script fails the check when it finds no statement, and when a file with a well-known name exists
but no instructions file names it. Otherwise it lists what it found. Read those lines and files. Pass
when the statement names the purpose and at least one concrete boundary, something the project will
not do, specific enough to reject a real change. Fail on boilerplate: "a library for X" with no
boundary, or non-goals so broad no change would ever hit them. Fail, too, when the statement sits in
the named file alone and the instructions file only links to it, with no purpose line of its own.

Do not count `CONTRIBUTING.md` as the home. It teaches people how to build, test, and open a pull
request; an agent pointed at it for scope pays for all of that.

**Fixing it.** `improve` drafts the lines and the file from the repo: the README's first paragraph and
the package descriptions give the purpose, and declined issues or PRs give candidate boundaries.
Propose `GOALS.md` at the root, unless the repo already has a file the instructions should name
instead:

```markdown
# Goals

What this project is for and what it deliberately is not. Not a roadmap.

## Goals
## Non-goals
## Rejected directions
<!-- each: what was proposed, and why not -->
```

When the repo keeps decision records (`docs/adr`, `docs/decisions`), rejected directions can stay
there, and the instructions file names both. Show both drafts and ask the owner to confirm or rewrite
every boundary: what a project will not do is the owner's decision, and a boundary the agent invented
is worse than none. Keep the instructions-file part to 2-4 lines, since `instructions-lean` counts it
on every turn.

### In a monorepo

A monorepo (a `pnpm-workspace.yaml`, a `package.json` `workspaces`, or a `lerna.json`) has no single
scope: each package has its own, and one consolidated root file drifts from all of them. So the check
splits:

- **The root** passes on a repo-level statement in the root instructions file: what belongs in this
  repo, such as what a new package must be. No root `GOALS.md` is expected, and its absence is not a
  failure; one that exists unnamed still fails, as above.
- **Each workspace package that is not `private`** passes on a scope file inside it (a well-known
  name at the package root or its `docs/`, or a file with a scope heading) that the package's own
  `AGENTS.md`/`CLAUDE.md` or a root instructions file names, or on a scope line in the package's own
  `AGENTS.md`/`CLAUDE.md`. A link resolves from the file that holds it, so the package's `AGENTS.md`
  can say `GOALS.md` and the root says `packages/jest/GOALS.md`.
- **`private` packages are skipped**: apps, the docs site, examples, test fixtures such as
  `testcases/`. Nobody else installs them, so a change to one is the repo's call, which the root
  statement covers. The detail lists them as skipped.

The check fails when the root or any counted package fails, and the detail names each one that
failed and which passed. It stays level 3 and not a gate. Judge each statement the script found, as
above; fail on a package whose boundary is boilerplate.

**Fixing it in a monorepo.** Draft the 2-4 root lines on what belongs in the repo, and one
`GOALS.md` per failing package, in the package's directory, from its readme, `package.json`
`description`, and source. Name each from the package's `AGENTS.md` when it has one, else from the
root instructions file with a short trigger line per package or one line covering all of them
("Before changing a package, read its GOALS.md"; the script needs each path, so list them). Do not
draft a root `GOALS.md`. The owner decides every boundary, package by package.

`score --package` does not run this check. A consumer's agent calls the package; it is not deciding
whether a change belongs in it, and the instructions file does not ship.

## Tokens loaded per session

The script adds the instruction files and every installed skill's `name` and `description` (from
`.agents/skills`, `.claude/skills`, `.cursor/skills`, `.codex/skills`, `.github/skills`). Both load
before the agent does any work. Report the number on every run, and name the biggest contributor.
A file reachable under two names (a `CLAUDE.md` symlink to `AGENTS.md`) counts once.
