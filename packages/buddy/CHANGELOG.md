# repobuddy

## 2.1.0

### Minor Changes

- 85edd47: `agent-readiness bench` hands over to ACED's measured layer. The skill now runs its benchmark through ACED's `bench` skill, or its engine `npx -y -p cyber-aced@^0.4.0 aced-bench`, with the suite `repobuddy.readiness` at `.agents/aced/bench/repobuddy.readiness/`. Level 5 reads that suite's committed `baseline.json`.
  
  `agent-readiness.mjs bench` now prints where the benchmark moved and exits 1. The script no longer plans, runs, or compares a bench itself. If your repo has `.agents/readiness/bench/`, move it with `git mv .agents/readiness/bench .agents/aced/bench/repobuddy.readiness`, point the check paths in `tasks.json` at the new folder, and record a new baseline with ACED. Until you do, level 5 fails. The new `bench convert` subcommand turns an old results file into a version-3 record that `aced-bench compare` can read.
- d806ce7: New `agent-readiness suggest` command. It reads ACED bench comparisons of the suite `repobuddy.readiness` that are tagged with an area (`aced-bench compare … --tag area=<id>`) and suggests a weight for the `## Weights` section of `.agents/references/repobuddy.readiness.md`. It moves a weight one step of 5, clamped to 0–40, only when two or more comparisons show the same pass-rate or token/turn effect and none shows the opposite. Otherwise it says "keep the weight". Cost in dollars never decides. It prints the override line and its evidence, and never writes the file.
- 53e722e: `agent-readiness` now reads its area weights from the reference `repobuddy.readiness`, resolved by `@cyberuni/agent-harness`. The skill ships the default copy in `references/repobuddy.readiness.md`, with the weights in a `## Weights` section. A repo overrides the weights in `.agents/references/repobuddy.readiness.md`:
  
  ```markdown
  ---
  merge: merge-sections
  ---
  
  ## Weights
  
  - verification: 40
  ```
  
  `.agents/readiness/weights.json` is deprecated. For this release it is still read when no project override exists, and the script prints the exact override file to create in its place. A later release stops reading it.

## 2.0.0

### Major Changes

- c70d6d7: Replace the `pause-session` and `resume-session` skills with one `session` skill: `session pause`, `session resume`, and `session help`. The old names are removed with no aliases; invoke `/session pause` and `/session resume` instead (natural phrasing such as "let's stop here" or "pick up X" still routes). `session pause` now writes a topic that belongs to another repo into that repo's `.agents/repobuddy/checkpoints/`, with its branch, commit, and paths taken from that repo and a new `repo:` field, and gives the line to type to resume it from a session there. `--commit` commits only the checkpoints in the current repo. `session resume` warns when a checkpoint's `repo:` names another repo before checking its branch and commit.

### Minor Changes

- e66edf9: `agent-readiness`: `instructions-scope` scores a monorepo per package. The root passes on a statement in its instructions file of what belongs in the repo, with no root `GOALS.md` expected. Each workspace package that is not `private` passes on a `GOALS.md` (or another scope file) inside it that its own `AGENTS.md`/`CLAUDE.md` or the root instructions file names, or on a scope line in its own `AGENTS.md`. Private packages (apps, docs sites, fixtures) are skipped. The check fails when the root or any counted package fails and lists each; it stays level 3 and not a gate. `improve` drafts the root lines and one `GOALS.md` per failing package. Single-package repos are scored as before.
- 251b20e: `agent-readiness` adds `instructions-scope`, a level-3 check (not a gate) for whether the always-loaded instructions file says what the project is for and what it deliberately is not. The script finds a scope, purpose, or non-goals statement in the instructions file or in a local file it names, and fails when a well-known scope file (`GOALS.md`, `SCOPE.md`, `VISION.md`, …) exists but nothing points to it. The agent judges whether the boundary is specific enough to reject a real change. `improve` drafts 2-4 lines for `AGENTS.md` and a `GOALS.md` (goals, non-goals, rejected directions), and the owner decides every boundary.
- 01e7c70: `init-buddy` now points to `setup-github-repo`'s merge backstop when it lists the next setup skills on a GitHub repo.
- 01e7c70: `setup-github-repo` now reports whether the default branch has a merge backstop (a GitHub merge queue, a rule requiring the branch to be up to date, or a third-party queue such as Mergify) and, when it has none, offers a `merge-backstop` ruleset with no bypass actors, so every merge, including one an agent runs, is tested against the latest default branch. `detect-state` records the backstop and the workflows that trigger on `merge_group`, and the scaffolded `pull-request.yml` now triggers on `merge_group`.

### Patch Changes

- dda1c8f: `agent-readiness`: the `GOALS.md` that `improve` drafts for `instructions-scope` is bare section headings: no preamble ("What this project is for… Not a roadmap."), no guidance comments, and no duplicate title. The judgment bar now counts a boundary only when it would make an agent turn down a plausible request, such as "Biome 1.x" for a package of Biome configs. The draft keeps only goals that help decide whether a change belongs, and leaves out empty sections.
- 200c075: `agent-readiness` records which `bench` runs each default area weight rests on, in `references/weights.md`. The first pilot benched comment density and found no change in pass rate and at most a few percent in cost, so `noise` keeps its starting weight of 15; every other weight is still an unmeasured estimate. The report footer now says bench results have not yet revised any weight.
- 1620562: The `buddy` readme lists the commands that exist (adding `plugins list` and `plugins search`, dropping the never-implemented `buddy init` and `buddy add`), says global options go after the command name, shows a real `check-deps` run, and fixes the broken `@repobuddy/typescript` plugin link.
- 58fb6d9: Ship the bundled skill scripts without a raw U+FEFF character. The minifier wrote the `yaml` package's `BOM` constant into `init-buddy`'s `detect-env.mjs` as the literal character, which skill auditors flag as hidden content; the build now writes it as the `\uFEFF` escape.
- 2c038c1: `init-buddy`'s force-push deny entries no longer block `git push --force-with-lease` or `--force-if-includes`. They are word-bounded now (`Bash(git push --force *)`, `Bash(git push * --force)`, and the `-f` forms), so the agent can still update a rebased PR branch, matching `review-permissions`.
- ce15110: `review-permissions` no longer recommends a deny rule that blocks `git push --force-with-lease`. It now suggests `Bash(git push --force *)` and `Bash(git push -f *)`, flags an existing `Bash(git push --force*)` rule for that swap, and scores `--force-with-lease` and `--force-if-includes` below a plain force-push.
- 2c038c1: `review-permissions` now covers a force flag after the arguments (`git push origin main --force`) with word-bounded rules: `Bash(git push * --force)`, `Bash(git push * --force *)`, and the same two for `-f`. These leave `--force-with-lease` allowed. It no longer suggests `Bash(git push * --force*)`, and flags an existing one the same way it flags `Bash(git push --force*)`.

## 1.14.0

### Minor Changes

- 8977ce7: `init-buddy`'s `gh-api-guard` hook now also guards `glab api`. It reads `glab`'s own flags (`--form` counts as a field that switches the request to POST, and any `@file` field is asked about) and allows only GET requests and GraphQL queries with no mutation, asking for everything else. The skill registers it for GitLab with a second `if: "Bash(glab api *)"` hook entry.
- dd442f0: `init-buddy`'s advanced tier now offers a rule for merging in Claude Code auto mode. Auto mode's classifier blocks `gh pr merge` on a PR with no approving review even when `permissions.allow` lists the command. The new rule goes in `autoMode.allow` in `~/.claude/settings.json` (the classifier ignores project settings). It covers only the owners the user names and only PRs the agent has confirmed have no conflicts, green checks and no requested changes, never `--admin`. The `--admin` deny entries are written with it.
- 49e3219: `init-buddy`'s advanced tier and deny list now cover every git host it detects, not only GitHub. The queued-merge entry has a GitLab form (`glab mr merge --auto-merge`, offered when the project requires a successful pipeline) and an Azure DevOps form (`az repos pr update --auto-complete true`, offered when the branch has a blocking build validation policy), each written with that host's deny entries. Gitea, Forgejo, and Bitbucket Cloud are told plainly that they get no queued-merge entry, because their CLIs cannot queue one. The auto-mode merge rule now names each detected host's merge commands, its owners (GitHub users and organizations, GitLab groups, Azure DevOps organizations or projects, Gitea and Forgejo organizations and users) and the bypass forms it excludes. `glab api` reads can be allowed for one session through a `read_api` token. The deny list adds `--bypass-policy`, a Gitea `force_merge`, repo delete and API DELETE for every host CLI, and each CLI's login file.
- dd442f0: `init-buddy` now places each allow and deny entry by what its safety depends on. Entries that are safe in any repo go to user scope: read commands, the deny list, and the auto-mode merge rule. The repo's package scripts go to project shared. `gh pr merge --auto` goes to project local, because its guard is that repo's branch rules. A repo-guarded entry or a script entry is never written at user scope.
- dd442f0: `init-buddy` now records each run in a local, git-excluded `.agents/repobuddy/init-buddy.json`. It also hands the user a reminder line for `~/.agents/AGENTS.md`, limited to the owners they name; the skill never writes it. In a repo with no marker, the agent then mentions `init-buddy` once per session. A repo where the user declined stays quiet.
- 9169e34: `pause-session` checkpoints now keep what a cold session needs to stay on course: every user request, including ones not started; the user's latest instruction quoted word for word, with their corrections recorded as settled decisions; dead ends not to retry; the harness's pending todo items as remaining steps; and what a half-finished edit does and lacks. With `--commit`, a grep checks for leaked paths, usernames and hostnames before committing. `resume-session` reads the dead ends before acting and works through the remaining steps.

### Patch Changes

- 790512e: `setup-github-repo` now names the CodeQL workflow the scaffold actually writes, `codeql.yml`, instead of `codeql-analysis.yml`.
- f2e83c1: Add a `README.md` to the `create-issue`, `llms-txt`, `setup-github-repo`, and `setup-npm-trusted-publishing` skills, explaining what each does, how to invoke it, and what it produces.

## 1.13.0

### Minor Changes

- 9a98c07: `agent-readiness bench compare <before> <after>` compares two stored bench results without running an agent. Per task and pooled (geometric mean of the task ratios), it shows the mean and median change, each side's min-max, and an exact permutation-test p-value, flags run counts too small to reach significance, and counts its tests for the multiple-comparisons caveat. A bench run compares against its baseline the same way, reading the baseline's runs from its results file.
- 31cdb5f: `agent-readiness bench --ref <commit>` benches a past commit on today's task set: each run checks that commit out and overlays HEAD's `.agents/readiness/bench/` on it, so two commits compare on the same tasks without cherry-picking. Results files and `baseline.json` now carry `schemaVersion: 2` and record both the commit benched (`commit`) and the task set's (`taskSetCommit`); `references/bench-results.md` documents the format.
- 31cdb5f: `agent-readiness bench` keeps each run's transcript, gzipped, at `results/<timestamp>/<task>-<run>.jsonl.gz` beside its results file (git-ignored), and records its path as `results[].transcript`, so a cost change can be traced to what the agent read and ran.
- 8b1c053: `init-buddy` adds an opt-in advanced tier to its allow list, for Claude Code. It is offered only when the user asks, and each entry is written only together with its guard. `Bash(gh pr merge --auto *)` is offered only when the default branch requires a status check, because with none `--auto` merges at once. It is written together with the `gh pr merge --admin` deny entries. `gh api` reads are allowed in one of two ways: a read-only token for one session, or the new `gh-api-guard` PreToolUse hook that ships with the skill (`scripts/gh-api-guard.mjs`). The hook allows GET requests and GraphQL queries with no `mutation`. It asks for everything else, including fields that switch to POST, `--input`, `@file` fields, pipes, and variables.
- 6b3dcc4: `init-buddy` now offers a starting allow list once the git host CLI is ready. It proposes entries for Claude Code, Cursor CLI, or Codex CLI in three tiers: safe read-only commands (git inspection, the host CLI's read commands, the repo's test and lint scripts), local writes that git can undo (`git add`, `git commit`, format scripts), and remote or destructive commands it never proposes (`git push`, `gh pr merge`, `gh api`, `npx`). The user picks the entries and the scope (user, project shared, or project local). The skill shows the diff and writes only the approved entries. It never removes an existing entry or deny rule. Auditing an existing allow list stays with `review-permissions`.
- 8b1c053: `init-buddy` now proposes a deny list beside the allow list. It covers force push in every common form, `gh pr merge --admin`, `gh repo delete`, `gh api` DELETE requests, `rm -rf` and its variants, package publish, and reading secrets (`.env*`, `~/.ssh`, `~/.aws`, `~/.npmrc`, `gh`'s `hosts.yml`). The user picks groups or single entries, and the skill only appends: it never removes or loosens an existing deny entry. The skill says what deny rules cannot do: they match text, so a reworded command gets past them; `Read(...)` denies do not stop a script from reading the file; deny beats allow; and in `dontAsk` mode and headless runs, anything that would prompt is denied.
- 6e83800: `init-buddy` now ends by listing the other installed skills that set up a repo, so the user knows what to run next. It finds them by name: `init` / `init-*` skills wire a tool into the repo, and `setup-*` skills configure a hosted service. A skill whose name cannot follow that convention can add `metadata: setup: true` to its frontmatter; `website` now does. It lists one line per skill, leaves out itself and anything already set up, and never runs them.
- 24869c2: Add the `pause-session` and `resume-session` skills. `pause-session` sorts a session's work into topics, skips the ones that are done, and writes each live topic to `.agents/repobuddy/checkpoints/<slug>.md`: the next action first, then settled decisions, open questions, working method, touched files and state that isn't in git. When more than one topic has work left, it asks whether to write one checkpoint per topic or keep them in one, and recommends; a split topic that waits on another names it in `depends-on`. On first use in a repo it lists that folder in `.git/info/exclude`, never in the tracked `.gitignore`; `--commit` stages only the checkpoints with `git add -f`. `resume-session` finds that checkpoint, asking whenever more than one is paused, checks it against the repo, flags one that waits on an unfinished topic, and continues from the next step without reopening settled decisions. Given another repo's path, it lists that repo's paused checkpoints and hands back what to type to resume there: the in-session `/cd` lines where the harness can move the session (Claude Code v2.1.246+, Codex 0.150.0+, Copilot CLI), with a fresh-session command as the fallback and the only option on Gemini CLI and Cursor. Each harness's hand-off lives in `resume-session/references/<harness>.md`, with its sources. The names avoid every harness built-in, including `/resume`. SDD missions hand off to cyber-sdd's `pause-mission` and `resume-mission`.

### Patch Changes

- 31cdb5f: `agent-readiness bench --baseline` writes `baseline.json` with the repository's own indent, taken from an existing baseline or the `tasks.json` beside it, so committing it no longer fails a tab-indenting formatter such as Biome.
- f56a492: The `agent-readiness` bench plan now prints an estimated spend from the stored results on the same model and runner (or the baseline), counting a task with none at its per-run cap. The skill's cost guidance is corrected to the measured ~$0.07 per `claude -p` run: a 4-task, 3-run bench costs about $1, not $2-5.
- 60413f0: `agent-readiness score` now runs buddy-agent-harness `doctor` when the repo is buddy-agent-harness itself, at its root or as a workspace package, instead of reporting `harness-doctor` as `n/a`. The repo's own package runs from `src/cli.ts`, so it needs no build or published install.

## 1.12.0

### Minor Changes

- 75db5c4: `agent-readiness bench --runner interactive` runs each task as an interactive Claude Code session in a terminal multiplexer pane (tmux, herdr, or another one cyber-mux drives) instead of `claude -p`. Each session gets a fresh `CLAUDE_CONFIG_DIR`, so only the repository's own settings, instructions, skills, and `.mcp.json` load. It authenticates with `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY`. Tokens, turns, and tool calls come from the session transcript, and the cost from Claude Code's status line. The runner enforces `timeoutMinutes` and the per-run spend cap, and closes the pane and checkout after each run. Results record their runner, and a run is never compared against a baseline another runner took; a baseline with no runner counts as `print` (`claude -p`, still the default).
- cfda58b: Add `agent-readiness bench`: run a repository's fixed agent task set in clean checkouts with Claude Code and record tokens, turns, tool calls, wall time, pass rate, and cost per successful task, compared against a stored baseline. `bench --init` writes a task-set template, and without `--yes` it only prints the plan and its spend ceiling. `score` now awards Level 5 ("the cost is measured") when a `bench` baseline at most 90 days old exists.
- 1e7d0fa: `agent-readiness score --check [--min-level <n>]` holds a repository (levels 1-5) or, with `--package`, a package (levels 1-4) at a level in CI. It exits 1 below the level (default 3). Judgment checks count as unknown: the level comes from the gates the script decides, and the output marks it provisional while judgment gates are unsettled. A repository can override the area weights in `.agents/readiness/weights.json`, beside the `bench` task set. Weights only order fixes and area scores, so an override never changes the level.
- 0282595: `agent-readiness score` adds an `env-documented` check to the environment area. It collects the `process.env.X` and `import.meta.env.X` names read in non-test JS and TS source and fails with each name that no instructions file, README, CONTRIBUTING, or `.env.example` mentions. Names the OS, shell, package manager, CI runner, or bundler sets (`NODE_ENV`, `CI`, `HOME`, `npm_*`, `GITHUB_*`) are skipped. The check is not a gate, so it ranks in the fix list without changing the level.
- acdc4bc: `agent-readiness score` adds a `fixtures-excluded` check to the noise area. It lists tracked fixture and vendored folders (`fixtures/`, `__fixtures__/`, `testcases/`, `__snapshots__/`, `vendor/`, `third_party/`, and similar) whose files no `.gitignore`, `.ignore`, or `.rgignore` excludes from search, with the count of files search still reads. The agent judges which ones search should skip. The check is not a gate, so it ranks in the fix list without changing the level.
- 98f45c8: `agent-readiness score` reads buddy-agent-harness `doctor` in the instructions area. When the scored repository has `buddy-agent-harness` installed, the script runs its read-only `doctor --format json` and reports each problem it names as a failing `harness-<problem>` check, listing the affected paths and handing the fix to buddy-agent-harness. With no findings, `harness-doctor` passes. Without the package installed, `harness-doctor` is `n/a` and names it. These checks count toward the instructions area score but never gate the level.
- c83dad1: Add `improve [area]` to the `agent-readiness` skill. It fixes the findings `score` reports one area per commit, applies each fix only after you approve it, hands fixes other skills own (`buddy-agent-harness`, `llms-txt`, `review-permissions`, `setup-github-repo`, `min-release-age`, `setup-npm-trusted-publishing`) to those skills, and re-runs `score` after each area to report how the level moved.
- 5c9e080: `agent-readiness` `score` lists the prompt-injection surface as report-only facts: session-start and per-prompt hooks from Claude Code, Gemini CLI, Cursor, and Copilot settings with the command each runs, and the MCP servers declared in `.mcp.json`, `.cursor/mcp.json`, and `.vscode/mcp.json`. The agent judges which of them fetch untrusted content; none of them change the score.
- 6769f6d: Add `agent-readiness score --package <path>`: scores how cheaply a consumer's agent can use a published package, through what ships rather than the source. Same gated report (levels 1-4, per-area scores, top three fixes) with package criteria: type declarations, a clean `exports` map, no `any` in the public API, a doc comment on each export, README examples, actionable errors, a parseable changelog with breaking changes labelled, and an `llms.txt` with a drift check (fixes hand off to `llms-txt`). Public surface size and a shipped agent skill are reported, not scored.
- 9d25d81: `agent-readiness score --run-knip` runs the repository's knip command and settles the `dead-code` check itself: pass when knip reports nothing, fail with knip's report headings (`Unused exports (4)`) when it does. Without the flag, `score` still only names the command for the agent to run. The flag is opt-in because it runs the repo's own tooling and needs dependencies installed, so it fits CI, where no agent is there to run knip.
- d80bd36: `agent-readiness score` measures the source itself. It reports the share of comment lines in non-test source and lists the most-commented files to sample, so the comment judgment starts from a number instead of a guess. It fails on JSDoc blocks that document nothing, lists top-level JS/TS names that a grep finds in ten or more files, and names the knip command to run when the repo has knip configured.
- f05131a: `agent-readiness score` reports CI supply-chain settings in the `security` area: third-party actions pinned to a commit SHA, a `permissions:` block on every workflow or job, and a package-manager release-age gate. These checks never cap the level, and each hands its fix to `setup-github-repo` or `min-release-age`.

### Patch Changes

- c2392d1: `agent-readiness bench` now compares each task's median cache-read tokens against the baseline. Claude Code serves nearly all of a run's context from the prompt cache, so uncached input tokens stay near zero and hide a change in how much the agent read.

## 1.11.0

### Minor Changes

- 7d0d8e6: Add the `agent-readiness` skill: scores how ready a repository is for coding agents. A bundled script runs static checks and reports a gated level (1-4), a score per area, the top three fixes, and the tokens every agent session loads; the skill settles the checks a script cannot decide. Security findings cap the level. Read-only. The script also runs as `repobuddy agent-readiness score`.
- 2783bd6: Add `buddy check-deps`, which reports packages your jest config uses that your `package.json` does not declare.
  
  A preset names the packages it needs, but the project using it has to install them. `check-deps` reads the jest config, follows the preset chain, and names every package no dependency field declares, along with the config field that asked for it and the command to install it. It exits `1` when something is missing, so it can gate a build.
  
  It is a command you run, not a `postinstall` hook: the same check on install would run on every consumer's machine, which is intrusive and exactly the shape a supply-chain review flags.
- f5c0829: `min-release-age`: a lift now schedules its own removal. When the repo has no cleanup job, the skill installs it in the same change as the lift instead of offering it. `release-age lift` reports the `ci` block (`--json`) and ends its summary with a `cleanup job:` line that says whether the job is installed and which provider and reference to use.
- 19caf0f: Add the `review-api` skill: reviews a library's public API for consistency and completeness against the project's own conventions. It infers the canonical shape from exemplars, audits shape conformance, sibling-justified gaps, and docs against exports, verifies each claim, and reports by priority. Read-only.
- 3dc80db: New `buddy test-scripts` command: adds or adjusts a project's `test`, `coverage`, and `test:watch`
  scripts to match the test runner it actually uses.
  
  The runner is read off the project's dependencies — `jest` or `@repobuddy/jest` means jest, `vitest`
  or `@repobuddy/vitest` means vitest — and `--runner` names it when a project depends on both or on
  neither. `--cwd` points the command at a project other than the working directory.
  
  Adjusting never clobbers a script the project meant to keep. A missing script is added; a script
  still holding one of the values this command writes, for either runner, is adjusted; anything else is
  left alone and reported as skipped. That makes a second run a no-op and lets a project that moved
  from jest to vitest pick up the new commands without losing a customized `test`. The manifest keeps
  its own indentation and script order — only the managed keys are touched.
  
  This is the CLI's first authored command, so it also settles the shape the ones after it follow:
  detect from the project, report every script as added, adjusted, or skipped, and be safe to run twice.

### Patch Changes

- 61ea2ef: Load plugins such as `@repobuddy/typescript` from the project the command runs in. The bundled CLI looked for them next to itself, so `buddy ts build` failed in a workspace, and through `npx` or a global install, with `Cannot find package '@repobuddy/typescript'`. The fix is clibuilder 11.3.2.

## 1.10.1

### Patch Changes

- 6c43b3a: Update the bundled `clibuilder` to `11.3.0`.

## 1.10.0

### Minor Changes

- 807df00: Remove the `setup-github-pages` skill. Its GitHub Pages setup is now the `deploy` command of the
  `website` skill, which also covers GitLab, Codeberg, Bitbucket, and Azure. Run `/website deploy` where
  you ran `/setup-github-pages`. The generated workflow now uses the current major versions of the Pages
  actions and runs only for changes under the site directory.
- 6cacf4b: New `website` skill, a router for work on a repository's docs website. It has two commands.
  
  `init` adds an Astro/Starlight docs site to a monorepo as a private workspace package, following the
  `apps/web` layout of `cyberuni/cyber-sdd`. It picks a location that matches the workspace globs. It
  chooses versions within Starlight's Astro peer range and the repo's release-age window, and keeps
  `astro check` on TypeScript 6 when the root uses TypeScript 7. It updates turbo, knip, biome,
  `.gitignore`, and pnpm build-script approvals so no check fails on the new package, then runs `deploy`.
  
  `deploy` publishes a static site from CI to the repo's own git host: GitHub Pages, GitLab Pages,
  Codeberg Pages, Bitbucket Cloud (`<workspace>.bitbucket.io`), or Azure Static Web Apps from Azure
  DevOps. It sets the base path the host actually serves at, including GitLab's unique domain setting,
  which serves new sites from the domain root. Each CI job is limited to changes under the site directory.

### Patch Changes

- 11c3c20: `website deploy` for GitHub Pages now looks for a deploy that is already there, including one inside a
  called reusable workflow, before adding its own. A job that pushes to a `gh-pages` branch does nothing
  while Pages uses the `workflow` build type, so the skill replaces it rather than leaving the site at 404.
  The generated workflow writes `workflow_dispatch: {}` so YAML linters accept it, and the base-path step
  notes that a path in Astro's `site` does not prefix asset URLs.

## 1.9.1

### Patch Changes

- d0bbd1a: `init-buddy`'s MCP scan (`buddy env` / `detect-env.mjs`) now reads configured MCP servers through
  `buddy-agent-harness`'s `listMcpServers` instead of its own duplicate JSONC/TOML parsing. Output stays
  the same shape and covers the same sources — Claude Code (user/project/local/plugin), Cursor, Codex,
  Copilot CLI, Gemini CLI, VS Code, Windsurf, OpenCode, and Zed — with one behavior change: an unreadable
  config file is now silently skipped rather than reported as a `{ harness, scope, file, error }` entry,
  and Windsurf's servers are now reported under the harness name `devin-desktop` (still called "Windsurf"
  in the skill's docs) instead of `windsurf`.

## 1.9.0

### Minor Changes

- a661bef: Add `buddy detect-state`, `buddy scaffold-workflows`, and `buddy npm-trust <plan|apply>`. They run the
  same code, with the same flags and output, as the `setup-github-repo` and `setup-npm-trusted-publishing`
  skill scripts, which now ship as bundled `.mjs` scripts (built from `src/setup-github-repo/` and
  `src/npm-trust/`) instead of hand-written `.mts` files run through `npx tsx`.

### Patch Changes

- 2bdb450: Point `add-badges`, `create-issue`, `merge-dep-prs`, `setup-github-pages`, `setup-github-repo`, and `setup-npm-trusted-publishing` at the `init-buddy` skill when `gh`/`glab` is missing or not logged in.
- bb7e17f: `buddy --version` and `buddy --help` no longer print clibuilder's "no config found under ..." warning when run outside a repobuddy-configured repo. Config loading itself is unaffected: a `.repobuddy*` file (or a `repobuddy` key in `package.json`) still loads normally.
- f5786fb: Fix plugin version drift: `packages/buddy/plugin.json`, its vendor manifests, and both local marketplace catalogs were stuck at 1.3.2 while the package moved to 1.8.0, so `claude plugin update repobuddy@repobuddy` reported the plugin was already up to date and never installed the update. The root `version` script now carries a released version into the plugin automatically, and `pnpm verify` fails if it ever drifts again.

## 1.8.0

### Minor Changes

- 7669e6a: Add `buddy release-age <status|lift|restore|open-pr>` and `buddy env`. They run the same code, with the same flags and output, as the `min-release-age` and `init-buddy` skill scripts.
- 868c227: New `init-buddy` skill: gets a machine ready to work with the repository's git host.
  
  It detects the OS and Linux family (Debian/Ubuntu, Fedora, RHEL-like, Arch, openSUSE, Alpine, NixOS), WSL,
  `sudo` access, and the package managers on PATH. It then checks each host's CLI (`gh`, `glab`, `tea`, `fj`, or
  `az` with the Azure DevOps extension) and lists the install commands that fit the machine, official
  packages first. It also finds MCP servers already configured for the host across Claude Code (including
  plugins), Cursor, Codex, Copilot CLI, Gemini CLI, VS Code, Windsurf, OpenCode, and Zed, reporting only
  names, commands, and URL origins. When one is active, it asks whether the CLI is still wanted. Logins are
  handed to the user to run.
- 98c16ce: New `min-release-age` skill: lifts the minimum-release-age gate for one package version when a fresh
  release is needed, and puts it back afterward. Works with pnpm, Yarn Berry, npm, and bun.
  
  `lift <pkg>` resolves the bare name to its `latest` dist-tag; a tag or an exact version also works, and
  the exemption always pins the exact version. Before lifting, it checks the release: provenance, publisher, and the diff from the previous version.
  Each lift is written with an expiry marker set to the version's publish time plus the gate window. After
  that time the version passes the gate on its own. `restore` removes only marked, expired lifts and never
  touches permanent exemptions. npm and bun cannot exempt a single version, so the skill asks before
  exempting a whole package name. `setup-ci` detects the CI provider and installs a daily job that removes
  expired lifts and opens or updates a PR/MR. It has templates for GitHub Actions, GitLab CI, Bitbucket Pipelines,
  Azure Pipelines, and Forgejo/Gitea Actions, and generic steps for other CI systems.

### Patch Changes

- 5392b0e: Add a `repobuddy` bin alongside `buddy` and `bd`. Runners that pick the bin named after the package, such as `upx repobuddy@^1`, can now resolve it.
- 8637166: `buddy --version` reads the version from its own `package.json`, not from `package.json` in the current directory.
- 17e9303: The `min-release-age` and `init-buddy` skill scripts are built at release and ship only in the npm package. A skill installed from git, without its `scripts/` folder, runs the same command through `npx -y repobuddy@^1.8.0`.

## 1.7.0

### Minor Changes

- 5d74440: New `add-badges` skill: builds a readme badge row from facts detected in the repo — package name,
  visibility, workflows, license file, docs URL — instead of a fixed template.
  
  It resolves which readme npm and GitHub actually render before writing (in a monorepo that is the
  published package's, not the root's), badges the workflow that gates the default branch rather than a
  pull-request workflow whose badge reads stale on `main`, skips build badges on private repos where
  shields cannot read them, and verifies the badges render on the pushed branch before merge.
- e414614: Build the CLI with tsdown and inline its dependencies, replacing the `tsc` build.
  
  An installed agent plugin is a copy of a source checkout, not an npm install, so its directory has
  no reliable `node_modules` and a CLI with external dependencies cannot be run from it. `esm/bin.js`
  is now a bundle that inlines `clibuilder` and runs with no `node_modules` present at all, so
  `clibuilder` moves from `dependencies` to `devDependencies`.
  
  Published paths do not move: the output stays in `esm/` with a `.js` extension, so the tracked
  `bin/buddy.js` shim keeps resolving `../esm/bin.js`. The declaration files `tsc` used to emit
  alongside it are gone, which affects nothing — the package exports only `./package.json` and has no
  library surface.
  
  Bundling also required pointing `jsonc-parser` (reached through clibuilder) at its ESM build. Its
  `main` is a UMD bundle whose factory calls `require("./impl/format")` and three siblings — specifiers
  a bundler cannot analyse, so those modules were silently left out and the CLI threw
  `Cannot find module './impl/format'` at startup.
  
  Because `tsc` was also typechecking as a side effect of building, the package gains an explicit
  `typecheck` script, wired into `verify`.
- a69bcdd: `to-question`: make the content shape a parameter, and add an `unblock` shape.
  
  The skill composed into exactly one shape — Context → Use Cases → Problem → Options → Questions —
  while the platform was already a parameter. That shape assumes the user is undecided between
  alternatives and wants input. Where that does not hold, the misfire is quiet: the agent
  manufactures an "Options" section for a request that has no options.
  
  Shape and dialect are now chosen independently. `question` stays the default, so a request that
  names no shape composes exactly as before.
  
  The new `unblock` shape is for "can someone unblock me": what you are blocked on, what you have
  already tried, **what you need from whom**, and by when. The ask is a required slot naming a person
  or team plus one concrete action — if you have not said who or by when, the skill asks instead of
  drafting a ping whose ask is "any help appreciated". It picks `unblock` when your own words say you
  are blocked, stuck, or waiting on someone, and tells you it did so you can ask for the other shape.
  
  The frontmatter description now reads "a question or an unblock ping", so a blocked user's request
  matches it.
- 3631025: `merge-dep-prs` now gates each merge on **verification reach covering blast radius** instead of on a
  green check. A green check is evidence about what CI executed and about nothing else — a dependency
  PR can be correct, pass every check in its own repo, and still break every consumer of the artifact
  it changed, because no check ever exercised a consumer.
  
  A new Step 3 runs between sorting by CI status and merging: detect whether the diff touches a
  consumed artifact (reusable workflow, composite action, published package or preset, container
  image, depended-on workspace package); name what shrank CI's reach (no test suite, affected-only
  selection, path-filtered jobs that skipped); enumerate the consumers when reach falls short — by
  looping the org repo list, since `gh search code` misses org-internal matches — and check what each
  one resolves. The gate ends in an explicit decision, hold or merge-with-follow-ups, never a
  fall-through to merge-on-green. The same gate covers the in-repo case, where `turbo --filter` or
  `nx affected` deliberately shrinks reach past edges the task graph does not model.
  
  The skill also gains a `What NOT to do` section and the `README.md` it was shipping without.

### Patch Changes

- c0fdc06: `to-question`: route public venues to `research-workbench:community-post` instead of the Markdown baseline.
  
  An unlisted platform is no longer automatically a fallback case. An unlisted *private* venue —
  Notion, Teams — still resolves to the Markdown baseline with the fallback announced. An unlisted
  *public* venue — Stack Overflow, X/Bluesky, Reddit, Discord, Telegram, Facebook/LinkedIn — is now
  routed to `community-post`, which researches first.
  
  Previously the skill would compose a Reddit or Discord post on the Markdown baseline, which looked
  like a supported target and was not: every `to-question` target writes to an audience that already
  has the context, so the template opens by asking the question directly and treats Context as what the
  thread does not already cover. A public audience has none of that, and owes prior art and a check for
  an existing answer besides — both stated non-goals of this skill.
- 6094343: `setup-github-repo` no longer leaves `.github/setup-state.json` in the working tree. The run's state
  artifact is written to a temp path keyed by `owner/repo` instead, so it can't be committed by
  accident or linger as an untracked file that reads like the repo's settings policy. `detect-state`
  reports the path in its stdout ack and accepts `--out` to override it; `scaffold-workflows` resolves
  the same path by default. A leftover `.github/setup-state.json` from an earlier run is deleted.
- 32f4e72: `to-question`: support the non-Markdown trackers — Bugzilla, Redmine and Trac.
  
  Markdown renders in none of them, so the baseline every unlisted platform falls back to is the one
  dialect that must never be used there. Each gets its own dialect reference, the way Slack mrkdwn and
  Jira wiki markup already do: `references/plaintext.md` for Bugzilla's default mode, where no markup
  renders at all, `references/textile.md` for Redmine's, and `references/trac.md` for Trac's one fixed
  dialect. A Markdown-mode Bugzilla is a row in the capability table instead — GFM minus inline images
  and inline HTML, both of which Bugzilla strips.
  
  These are the first targets whose dialect is a property of the *instance* rather than of the
  platform. Bugzilla is plain text by default with Markdown switchable per user preference and per
  comment; Redmine is Textile by default with CommonMark set instance-wide. Nothing in the request
  reveals which, so the skill composes for the product default and says which mode it assumed, with the
  one-line switch — the same rule the Slack default and the Markdown fallback already follow.
  
  Plain text is the one target where the composition changes rather than only the markup: with no
  headings and no fenced blocks, sections are carried by blank lines and capitalised labels, and an
  ASCII diagram loses its monospace guarantee, so `plaintext.md` ships a template variant.
  
  `scripts/check-format.mjs` gains `bugzilla`, `bugzilla-markdown`, `redmine` and `trac`. Its
  verbatim-region detection is now dialect-specific rather than always a ``` fence, which also fixes a
  Jira rule that could never fire: the "Markdown code fence" scan ran over lines the fence pass had
  already blanked, so a fenced block in a Jira draft went unreported.
- ec04657: `to-question`: bundled files move from `assets/` to `references/`.
  
  The agentskills layout separates the two by kind rather than by topic — `assets/` holds static
  resources (templates, images, data files), while documentation the agent reads under a stated
  condition belongs in `references/`. Every file this skill bundles is the second kind: the dialect
  files and the shape files are read to inform the draft, never copied into it.
  
  No behavior change. The skill loads the same six files under the same conditions; only the paths
  inside the package move.

## 1.6.0

### Minor Changes

- 2bcf2a0: Bump `clibuilder` from `^10.1.0` to `^11.0.0`. The prior `^10.1.0` range could never
  cross into the published `11.0.0` major (a caret cannot span majors), which meant every
  consumer of `@repobuddy/typescript` — roughly 46 repos in the estate use it as a
  devDependency — kept resolving `clibuilder@10.1.0` and, through it, a stale `type-plus`
  and `tersify` major in their tree even after those packages published current majors.
  
  `clibuilder@11.0.0`'s own major came from a `type-plus@8` pin (its emitted `.d.ts` now
  requires TypeScript `>= 5.6.0`), not from an API change — the `PluginActivationContext`
  shape `@repobuddy/typescript` re-exports is unchanged, so this is not a breaking change
  for consumers on TypeScript `>= 5.6` (this repo already requires `^7.0.0`/`^6.0.0`).
  Shipping it as `minor` here lets the ~46 consumers of `@repobuddy/typescript` pick up
  the fix and drop the stale transitive `type-plus`/`tersify` majors without a forced
  major bump of their own.
- ed7323a: Add the `llms-txt` skill.
  
  `llms.txt` is the orientation file an agent reads before using a package or site: what the project
  is, the conventions that govern its whole surface, and where the per-item detail lives. The skill
  generates it from the project's real public surface rather than hand-writing it — a hand-written one
  rots into describing an API that was removed two releases ago — wires a drift check into the command
  CI already runs, and reports the documentation gap that generating from the real surface exposes
  instead of trying to fill it in the same change.
  
  It also draws the audience boundary against `AGENTS.md`: `llms.txt` addresses whoever consumes the
  published thing, `AGENTS.md` whoever changes the repo. A project with no public surface needs only
  the second, and the skill says so rather than generating a file with no reader.

## 1.5.2

### Patch Changes

- e3026f9: Bump `clibuilder` to the latest published `^10.1.0` (in-range, non-breaking) picked up
  while sweeping `type-plus` across the estate. No source change needed.
- d967c8a: `to-question`: sort dialect references by family instead of by platform name.
  
  `assets/github.md`, `assets/gitlab.md` and `assets/asana.md` are folded into `assets/markdown.md`,
  which now carries the Markdown baseline, a per-platform capability table (headings, tables, task
  lists, strikethrough, alerts, code blocks) and short platform notes for the quirks that change what
  gets written. `assets/` holds one file per dialect family — Markdown, Slack mrkdwn, Jira wiki
  markup, and email — so a new Markdown-family platform costs a row rather than another near-duplicate
  file. A platform the skill has no row for falls back to the Markdown baseline and says so.
- 25da932: `to-question`: derive the handoff file path instead of hardcoding `/tmp/question.md`.
  
  The new bundled `scripts/question-path.mjs` resolves the OS temp directory (honoring `TMPDIR`/`TEMP`,
  so it is correct on Linux, macOS, WSL and native Windows) and mints a fresh private `mkdtemp`
  directory per session. Two users or two concurrent sessions on a shared machine can no longer collide
  on the same world-readable filename.

## 1.5.1

### Patch Changes

- 6ca50f2: Fix two parsing defects in the `review-permissions` scanner.
  
  A `writable_roots` array spanning multiple lines parsed as the string `"["`, so the directories it granted write access to were dropped from the report and replaced by a finding for a directory named `[`. Continuation lines are now consumed until the brackets balance, and any line the reader cannot parse is counted into a note rather than skipped in silence.
  
  Subsumption also matched on a raw string prefix, which read `git committish foo` as already covered by `git commit *` and advised deleting a rule that was never covered. The prefix now has to land on a token boundary, so `pnpm test:*` still covers `pnpm test:watch` while `git commit` no longer swallows `git committish`.

## 1.5.0

### Minor Changes

- 9c753c8: Add the `review-permissions` skill: audit what an agent harness is allowed to do, rank each grant by what it actually permits, and propose a tighter, consolidated configuration.
  
  It reads permissions across Claude Code, Cursor CLI, Codex CLI, Copilot CLI, Gemini CLI, and OpenCode — allowlists, approval modes, sandboxes, trusted folders, writable roots, hooks, and MCP servers — since an allowlist means nothing underneath a mode that skips the check. The bundled `scan-permissions.mjs` collects and grades; the skill supplies the repo context and never widens a grant or edits a config without an approved diff.

## 1.4.0

### Minor Changes

- 3e8fae7: Ship the public agent skills as a universal plugin.
  
  The five public skills (`create-issue`, `merge-dep-prs`, `setup-github-pages`, `setup-github-repo`,
  `setup-npm-trusted-publishing`) move from the repository root into this package and are now published
  in the npm tarball, alongside a canonical `plugin.json` on the Agent Plugins Specification v1.0.0 and
  derived manifests for Claude Code, Cursor, and Codex. Copilot CLI reads the canonical manifest directly.
- 0bdd5fc: Add the `to-question` skill.
  
  It words a technical question, design discussion, or decision request for the platform you are about
  to paste it into — Slack, Jira, Linear, Asana, GitHub, GitLab, email, or a Markdown baseline for
  anything unlisted — and runs a bundled checker over the draft so dialect mistakes surface before the
  paste, not after. It composes and hands off; filing the item itself stays with `create-issue`.
- 42e0417: Add the `code-review` skill. Reviews a change set through three named engineering lenses — Linus, Uncle Bob, and Fowler — running each pass independently and reporting where the verdicts split rather than averaging them into one score.

### Patch Changes

- cf42353: Publish the `templates` directory. The `files` allowlist named `template` (singular), which matched nothing on disk, so no template file was included in the published package.

## 1.3.2

### Patch Changes

- 4e55a09: Rename the `ts` source folder to `src`.

  The published source folder is now `src` instead of `ts`. The public API and all
  export specifiers are unchanged; only the shipped file paths differ (relevant to
  JSR consumers, which resolve `./src/...` instead of `./ts/...`).

## 1.3.1

### Patch Changes

- 5bce37c: fix bin path

## 1.3.0

### Minor Changes

- bd113cc: Add `bd` as alias of `buddy`

## 1.2.0

### Minor Changes

- 030b32d: Update `clibuilder` to 9.0

## 1.1.0

### Minor Changes

- 3e394fb: Add `templates/.editorconfig`.
  Remove extra files in the distribution.

## 1.0.2

### Patch Changes

- 76dac3b: update readme

## 1.0.1

### Patch Changes

- 75de779: Update clibuilder
- 81dc7e2: Update `clibuilder`

## 1.0.0

### Major Changes

- 3835d89: Initial release.

  It is an plugin CLI.
  Commands will be added by other packages.
