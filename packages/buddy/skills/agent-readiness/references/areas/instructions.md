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

## Tokens loaded per session

The script adds the instruction files and every installed skill's `name` and `description` (from
`.agents/skills`, `.claude/skills`, `.cursor/skills`, `.codex/skills`, `.github/skills`). Both load
before the agent does any work. Report the number on every run, and name the biggest contributor.
A file reachable under two names (a `CLAUDE.md` symlink to `AGENTS.md`) counts once.
