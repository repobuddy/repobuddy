---
cr-ref: backfill-repobuddy-spec
target: packages/buddy
status: in-progress
todos:
  - content: Intake — locate spec (none found), confirm backfill path
    status: completed
  - content: Scope + strategy decisions with user
    status: completed
  - content: Measure partition quality; read clibuilder plugin/config model
    status: completed
  - content: Grill seed intent for init / add / plugin namespace
    status: completed
  - content: Scaffold spec envelope at packages/buddy/.agents/spec/
    status: completed
  - content: 'Explore: cli-shell — CFG + scenario map + .feature'
    status: completed
  - content: 'Explore: configuration — CFG + scenario map + .feature'
    status: completed
  - content: 'Explore: initialization — CFG + scenario map + .feature'
    status: completed
  - content: 'Explore: plugin-management/add — CFG + scenario map + .feature'
    status: completed
  - content: 'Explore: plugin-management/remove — CFG + scenario map + .feature'
    status: completed
  - content: 'Explore: plugin-management/update — CFG + scenario map + .feature'
    status: completed
  - content: 'Explore: plugin-management/discovery — CFG + scenario map + .feature'
    status: completed
  - content: 'Explore: plugin-management/plugin-contract — reference subject'
    status: completed
  - content: 'Explore: plugin-management/loading — CFG + scenario map + .feature'
    status: completed
  - content: 'Explore: plugin-management/package-manager — CFG + scenario map + .feature'
    status: completed
  - content: 'Explore: workflows — cross-capability seam scenarios'
    status: completed
  - content: 'Triage: cut inherited-behavior scenarios, register assumptions'
    status: completed
  - content: Build-to-learn spikes against non-frozen suite
    status: pending
  - content: Write the six *.learn.ts boundary guards (impl phase)
    status: pending
  - content: Spec gate — judge, freeze, status approved
    status: pending
---

# CR: backfill the `repobuddy` project spec

Open a project spec for `packages/buddy` (package name **`repobuddy`**, the clibuilder CLI).
No source CR — a bare prompt.

## Decisions (settled, do not relitigate)

- **Scope**: `packages/buddy` only. Not the outer repo, not the other 5 packages.
- **Coverage**: as-intended. Detection mode for the existing shell, intent mode for the
  unbuilt `init` / `add` commands. The spec drives the build.
- **Strategy**: capability-first. `check-partition-quality` declined to decide
  (top-folder: "history too thin — 8 usable multi-file commits, floor 20"; role: 33.3%
  parallelizable but shuffled control 81.4%, so the margin is noise).
- **Location**: colocated at `packages/buddy/.agents/spec/`. The package `files` array is
  an allowlist (`esm`, `template`, `src`) so `.agents/` is excluded from the tarball —
  no hoist needed.
- **Name frontmatter**: must declare `name: repobuddy`. `discover-specs` would guess the
  folder basename `buddy`, which is wrong.

### Seed intent (grilled 2026-08-11, settled)

- **`init`** = config + detection + templates, idempotent. Writes `.repobuddy.json`,
  pre-populates `plugins` from installed deps, copies `templates/*` into the repo, and
  merges rather than overwrites/errors on re-run. Requires fixing the `files` allowlist
  typo `"template"` → `"templates"`.
- **`add <plugin>`** = install **and** register. Shells the detected package manager to
  add the dep, then appends it to `plugins` in the config.
- **Namespace**: literal package names only, **no `@repobuddy/` shorthand**. The readme's
  `buddy add <plugin>` → `@repobuddy/<plugin>` line is wrong and is corrected by this
  mission's implementation.
- **Non-goals: none.** The user declined every proposed exclusion, so all four are
  in scope for the spec: the `plugins` list/search command, the plugin authoring
  contract, `remove` / `update` commands, and config schema validation.

## State of the code (as read)

- `src/app.ts` — `cli({ name: 'repobuddy', version, description, config: true })`. No
  commands registered. No `keywords` **option passed to `cli()`** (package.json does have
  a `keywords` field — different thing).
- `src/bin.ts` — `app.parse(process.argv)`.
- `src/app.spec.ts` — one assertion: `app.version` matches `package.json`.
- readme lists `buddy init` and `buddy add <plugin>` as 🚧 — neither is built.
- `package.json` `files` ships `template/`; the directory on disk is `templates/`
  (holding one `.editorconfig`). Typo in the allowlist — the templates are currently
  **not shipped**. Fixing it is in this mission's scope.

## clibuilder v9 facts that constrain the spec

- `config: true` + `name: repobuddy` resolves `repobuddy{,.json,.yml,rc,...}` and the
  dotted `.repobuddy.*` variants via find-up, plus a `repobuddy` key in `package.json`.
  So `.repobuddy.json` is already supported — the readme is not wrong.
- Plugins listed in `config.plugins` are **auto-loaded** by clibuilder. Plugin loading is
  already free; buddy needs no code for it.
- A `plugins` command (list / search by keyword) is auto-added when `config` or
  `keywords` is set. ~~Search uses `findByKeywords`, so buddy's missing `keywords` makes
  search matchless.~~ **Corrected (read from `clibuilder/ts/state.ts`):** `state()` does
  `if (config && keywords.length === 0) keywords.push(name)` — with `config: true` the
  keyword list defaults to `['repobuddy']`. `@repobuddy/typescript` declares the
  `repobuddy` keyword, so list **and** search already work today. There is no
  missing-keywords defect.
- `list` uses `findByKeywords` (installed packages); `search` uses `searchByKeywords`
  (the npm registry). Different sources, not two spellings of one lookup.
- `@repobuddy/typescript` is already a working plugin: exports `activate(ctx)`, registers
  a `ts` command with `build` + `copyCJSPackageJson`. Its keywords include `repobuddy`.

## Spec tree (`status: draft`)

Capability-first at `packages/buddy/.agents/spec/`. 15 nodes, 10 suites, **46 scenarios**
after the inherited-behavior triage (was 74). Both checks pass.

- `cli-shell/` 3 · `configuration/` 3 · `initialization/` 8 · `workflows/` 5
- `plugin-management/` → `add` 5 · `remove` 4 · `update` 6 · `discovery` 2 · `loading` 3 ·
  `package-manager` 7 · `plugin-contract` (reference)
- `design/inherited-behavior.md` · `design/decisions/` · `tooling/` · `glossary.md`

### The inherited-behavior rule (settled)

**Specify your promise, not their mechanism** — and assert the **weakest form** that
supports it. Roughly half the first draft asserted clibuilder's mechanics; 28 scenarios
were cut and ~10 restated at repobuddy's own boundary.

The corollary earned its keep: the draft had pinned clibuilder's name-first config
precedence as intended behavior. That is a suspected upstream bug, and freezing it would
have made the upstream *fix* a break here. It is deleted, not weakened.

The cut analysis is preserved as prose + CFGs in `design/inherited-behavior.md`, which
also carries the **six-assumption register** — the clibuilder facts our promises rest on,
each to be guarded by a `*.learn.ts` boundary test (a *learning test*, Clean Code ch. 8)
rather than by a scenario. Guards fail on the Renovate bump PR, which is what makes
`dependabot-automerge.yml` defensible.

`learn` still needs adding to the `files` exclusion glob in `package.json` so guards are
not published.

## Running check-suite

`check-suite.mts` imports `validateFeatures` from `gherkin-cli`, which the **published** 0.2.0
does not export. Use the local unpublished build at
`~/code/cyberuni/gherkin-cli/packages/gherkin-cli` (0.1.0, has it) — a scratch runner with that
path symlinked into `node_modules/`. `npx gherkin-cli` does not work.

## NEXT

Two todos remain: **build-to-learn spikes** against the non-frozen suite, then the **spec gate**
(judge → freeze → `status: approved`).

The spikes are the first code of this mission. Targets in priority order, each probing an
assumption the spec makes that no reading has confirmed:

1. **`add` in a pnpm workspace** — the plugin-contract caution: plugins are imported by bare
   name resolved from *clibuilder's* location, not the repository's. If a pnpm layout cannot
   resolve a genuinely installed plugin, `add`'s contract ("install it and it loads next run")
   is unmet and the `workflows` seam scenarios fail. **Highest-risk assumption in the spec.**
2. **`package-manager` detection** — the declared-field-over-lockfile-over-npm precedence is a
   spec proposal, not a user ruling. Confirm one abstraction covers pnpm/yarn/npm uniformly.
3. **`init` template copying** — confirm the shipped `templates/` reach an installed package
   once the `files` typo is fixed.

**Implementation debts this spec already commits to fixing** (carry into the impl phase):

- `package.json` `files` says `"template"`; the directory is `templates/` → templates are
  not published, so `init`'s copy step would find nothing in an installed package.
- readme documents `buddy add <plugin>` → `@repobuddy/<plugin>` shorthand, which the settled
  intent rejects. Readme must be corrected.

(The third debt previously listed here — "`cli()` receives no `keywords`" — was **withdrawn**;
see the corrected clibuilder fact above. Keywords default to the app name.)
