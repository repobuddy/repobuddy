# agent-readiness

Score how ready a repository is for coding agents to work in: whether an agent can orient itself,
check its own work, work without supervision, and work cheaply. The report leads with a level and the
three fixes worth the most, not a percentage. Then, if you want, it fixes the findings as a series of
reviewable commits, one area at a time. It can also benchmark what agents actually cost in the repo,
before and after a change.

## When to use

- "is this repo agent-ready?"
- "why do agents keep struggling in this repo?"
- "what should we fix so agents work better here?"
- "how many tokens does every agent session load before it starts?"
- "fix what the readiness score found"
- "did that change make agents cheaper or more reliable here?"
- before handing a repository to unattended agents

## What it does

1. **Runs a static scan** with a bundled script: no build, no install, no tokens. It checks for a
   verify command, an instructions file and the commands it names, a pinned toolchain, file sizes,
   committed build output, fixture and vendored folders search still reads, committed secrets, literal MCP credentials, and more. It also measures the
   source: the share of comments, JSDoc blocks that document nothing, names that flood a grep, and
   environment variables the code reads that no setup document names.
   When the repo has [buddy-agent-harness](https://github.com/repobuddy/buddy-agent-harness)
   installed, or is that plugin's own repo, it also runs the plugin's read-only `doctor` and reports
   each finding under agent instructions.
2. **Settles the judgment calls** the script cannot make, such as whether CI runs the same command an
   agent runs locally, whether the instructions file is accurate, or whether heavy comments state
   constraints or tell history. When the repo has knip configured, it runs knip and reports what is
   unused; in CI, `score --run-knip` has the script run knip itself. It loads only the criteria for
   the areas that need it.
3. **Reports a gated level.** Each level has gates. A repo is at level N only when every gate up to N
   passes, so good docs cannot hide a missing test command.

   | Level | Meaning |
   | --- | --- |
   | 1 | An agent can read it |
   | 2 | An agent can check its own work |
   | 3 | An agent can work without supervision (the target) |
   | 4 | An agent works cheaply |
   | 5 | The cost is measured (a `bench` baseline at most 90 days old) |

   Security findings cap the level instead of subtracting points. A committed secret holds a repo at
   level 1 however good everything else is. The CI supply-chain checks (third-party actions pinned to
   a commit SHA, a `permissions:` block on every workflow or job, a package-manager release-age gate)
   are reported but never cap the level.
4. **Ranks the fixes.** Security caps first, then the gate that blocks the next level, then the rest by
   area weight per unit of effort. The weights are printed in the report as starting estimates, so you
   can disagree with them.
5. **Reports the tokens loaded per session**: instruction files plus every installed skill's
   description.
6. **Lists the prompt-injection surface**, without scoring it: hooks that run at session start or on
   each prompt, with the command each runs, and the MCP servers the repo configures. The agent names
   the ones that fetch untrusted content, such as issue bodies or web pages.

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

## Scoring a package

`score --package <path>` scores the other side of a library: how cheaply an agent in *another* repo
can use it. That agent meets the package through what ships, so the checks read the type
declarations, the `exports` map, the README, the changelog, and `llms.txt`, not the source.

| Level | Meaning |
| --- | --- |
| 1 | An agent can find it: a README and an entry point |
| 2 | An agent can call it: type declarations ship, and the `exports` map is clean |
| 3 | An agent can use it without reading the source: every export has a doc comment, no `any`, README examples run, errors say what to do |
| 4 | An agent keeps up with it cheaply: a parseable changelog with breaking changes labelled, and an accurate `llms.txt` checked for drift |

It also reports the public surface size and whether the package ships an agent skill, without scoring
either. `llms.txt` fixes go to the `llms-txt` skill. Point it at the package folder after a build, or
at an installed copy under `node_modules`.

## Bench

`bench` runs a fixed set of 3-5 agent tasks stored in the repo (`.agents/readiness/bench/tasks.json`),
each with a shell check that decides pass or fail. Every run gets a clean checkout of HEAD and a
headless Claude Code session that loads only the repo's own settings, instructions, skills, and MCP
servers. It records input, output, and cached tokens, turns, tool calls, wall time, and pass rate,
and from those the cost per successful task.

- `bench --init` writes a task-set template to edit.
- `bench` prints the plan and its spend ceiling, and runs nothing.
- `bench --yes --baseline` records the baseline (`baseline.json`, committed). It is indented like
  `tasks.json` beside it, so it fits the repo's formatter; run the formatter on it before committing anyway.
- `bench --yes` runs again and compares against the baseline, task by task.
- `bench --runner interactive` drives interactive Claude Code sessions in tmux or herdr panes instead
  of `claude -p`. Each session gets a fresh config directory, so none of your own instructions,
  plugins, or skills load. It needs `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`) or
  `ANTHROPIC_API_KEY` set, and its runs are compared only with other interactive runs.

It spends money, so the skill always shows the plan and waits for a yes. The defaults (Sonnet, 3 runs
per task, $0.50 cap per run) keep a 4-task bench around $2-5. Change one area at a time between runs,
so each delta has one cause.

## CI mode and weight overrides

- `score --check --min-level <n>` fails the run (exit 1) when the repo drops below level `n` (1-5,
  default 3). With `--package` it holds the package at its own level instead (1-4). The judgment calls
  cannot run in CI, so they count as unknown: the level comes from the checks the script decides, and
  the output marks it provisional while judgment gates are still unsettled.
- To change the area weights for your repo, add `.agents/readiness/weights.json` with
  `{ "<area>": <number> }`, beside the `bench` task set whose results justify it. Weights only reorder fixes and area scores. They never
  change the level, so an override cannot weaken the CI check.

## What it will not do

- Edit the repository during `score`, or without your yes during `improve`.
- Spend money on a `bench` run before you have seen its plan and said yes.
- Make a fix another skill owns.
- Print a secret. It names the file and the key. For a committed secret, it asks you to rotate it
  before it untracks the file.

## How to invoke

Ask for it directly, or run `/agent-readiness score`, `/agent-readiness improve [area]`, or
`/agent-readiness bench [--baseline]` where slash commands are supported. The script also runs on its
own:

```sh
node <skill-dir>/scripts/agent-readiness.mjs score [--dir <repo>] [--json] [--check [--min-level <1-5>]]
node <skill-dir>/scripts/agent-readiness.mjs score --package <path> [--json] [--check [--min-level <1-4>]]
node <skill-dir>/scripts/agent-readiness.mjs bench [--init | --baseline] [--runs <n>] [--task <id>] [--runner print|interactive] [--yes]
npx -y repobuddy@^1.12.0 agent-readiness score
npx -y repobuddy@^1.12.0 agent-readiness bench
```

## Install

```sh
npx skills add repobuddy/repobuddy --skill agent-readiness
```
