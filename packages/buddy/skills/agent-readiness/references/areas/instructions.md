# Agent instructions (weight 15)

The instructions file (`AGENTS.md`, or a harness-specific file like `CLAUDE.md`) loads on every turn
of every session. A wasted line costs more here than anywhere else in the repo.

**buddy-agent-harness owns this area's configuration**: multi-harness bridges, skill layout, MCP
files. Hand fixes to it. This area only reads and reports.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `readme` | 1 | yes | script: a README at the root |
| `instructions-file` | 3 | yes | script: a root instructions file exists |
| `instructions-commands` | 3 | yes | script: each `pnpm <x>`, `npm run <x>`, `yarn <x>`, `bun run <x>`, `make <x>` it names exists in the root `package.json` or `Makefile` |
| `instructions-accurate` | 3 | yes | **judgment** |
| `instructions-lean` | 4 | yes | script: all instruction files together under ~3000 tokens (four characters per token) |

`instructions-commands` checks the root manifest only. A command scoped to a workspace package
(`pnpm --filter x test`) is not checked, and a script defined in a workspace package can show up as
missing. Confirm each reported one before calling it wrong.

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
