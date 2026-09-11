# repobuddy

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
