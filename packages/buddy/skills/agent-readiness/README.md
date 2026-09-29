# agent-readiness

Score how ready a repository is for coding agents to work in: whether an agent can orient itself,
check its own work, work without supervision, and work cheaply. The report leads with a level and the
three fixes worth the most, not a percentage. Then, if you want, it fixes the findings as a series of
reviewable commits, one area at a time.

## When to use

- "is this repo agent-ready?"
- "why do agents keep struggling in this repo?"
- "what should we fix so agents work better here?"
- "how many tokens does every agent session load before it starts?"
- "fix what the readiness score found"
- before handing a repository to unattended agents

## What it does

1. **Runs a static scan** with a bundled script: no build, no install, no tokens. It checks for a
   verify command, an instructions file and the commands it names, a pinned toolchain, file sizes,
   committed build output, committed secrets, literal MCP credentials, and more. It also measures the
   source: the share of comments, JSDoc blocks that document nothing, and names that flood a grep.
2. **Settles the judgment calls** the script cannot make, such as whether CI runs the same command an
   agent runs locally, whether the instructions file is accurate, or whether heavy comments state
   constraints or tell history. When the repo has knip configured, it runs knip and reports what is
   unused. It loads only the criteria for
   the areas that need it.
3. **Reports a gated level.** Each level has gates. A repo is at level N only when every gate up to N
   passes, so good docs cannot hide a missing test command.

   | Level | Meaning |
   | --- | --- |
   | 1 | An agent can read it |
   | 2 | An agent can check its own work |
   | 3 | An agent can work without supervision (the target) |
   | 4 | An agent works cheaply |

   Security findings cap the level instead of subtracting points. A committed secret holds a repo at
   level 1 however good everything else is.
4. **Ranks the fixes.** Security first, then the gate that blocks the next level, then the rest by
   area weight per unit of effort. The weights are printed in the report as starting estimates, so you
   can disagree with them.
5. **Reports the tokens loaded per session**: instruction files plus every installed skill's
   description.

## Improving

`improve [area]` works through the findings one area at a time: all of one area, or the areas in the
order the fix list ranks them.

1. It proposes each fix on its own, with the files and the change, and applies it only when you say
   yes. A fix you decline is skipped and listed.
2. It runs the verify command, then commits the area's approved fixes as one commit. Two areas never
   share a commit.
3. It hands the fixes other skills own to those skills instead of making them itself:
   `buddy-agent-harness` for instructions and harness config, `llms-txt` for `llms.txt`,
   `review-permissions` for allowlists, `setup-github-repo` for CI and branch protection,
   `min-release-age` and `setup-npm-trusted-publishing` for supply chain.
4. It runs `score` again and reports how the level and the area's score moved, or which gate still
   holds the level.

It starts only from a clean working tree, so each commit holds its own edits and nothing else.

## What it will not do

- Edit the repository during `score`, or without your yes during `improve`.
- Make a fix another skill owns.
- Print a secret. It names the file and the key. For a committed secret, it asks you to rotate it
  before it untracks the file.

## How to invoke

Ask for it directly, or run `/agent-readiness score` or `/agent-readiness improve [area]` where slash
commands are supported. The scoring script also runs on its own:

```sh
node <skill-dir>/scripts/agent-readiness.mjs score [--dir <repo>] [--json]
npx -y repobuddy@^1.11.0 agent-readiness score
```

## Install

```sh
npx skills add repobuddy/repobuddy --skill agent-readiness
```
