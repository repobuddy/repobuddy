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
  - content: 'Spike: pnpm plugin resolution — risk did not reproduce'
    status: completed
  - content: 'Spike: init template publishing — typo fixed, verified'
    status: completed
  - content: 'Spike: package-manager detection + command matrix'
    status: completed
  - content: 'Re-verify the assumptions after the clibuilder v10 / find-installed-packages 4 upgrade'
    status: completed
  - content: Tag every node with its concept; reconcile the assumptions register
    status: completed
  - content: 'Re-derive every node''s ## Use Cases actor-first, with extensions stated'
    status: pending
  - content: 'Fix section order in plugin-management/loading (Control Flow precedes Use Cases)'
    status: pending
  - content: Spec gate — judge, freeze, status approved
    status: pending
  - content: Write the nine *.learn.ts boundary guards (deferred to a later impl mission)
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

## clibuilder facts that constrain the spec

(Read from v9 during explore; every one re-verified against v10 — see the assumptions register.)

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

Capability-first at `packages/buddy/.agents/spec/`. 15 nodes, 10 suites, **43 scenarios**
after the inherited-behavior triage (was 74). Both checks pass.

- `cli-shell/` 4 · `configuration/` 3 · `initialization/` 8 · `workflows/` 5
- `plugin-management/` → `add` 5 · `remove` 4 · `update` 6 · `discovery` 2 · `loading` 3 ·
  `package-manager` 3 · `plugin-contract` (reference)
- `design/inherited-behavior.md` · `design/decisions/` · `tooling/` · `glossary.md`

### The inherited-behavior rule (settled)

**Specify your promise, not their mechanism** — and assert the **weakest form** that
supports it. Roughly half the first draft asserted clibuilder's mechanics; 28 scenarios
were cut and ~10 restated at repobuddy's own boundary.

The corollary earned its keep: the draft had pinned clibuilder's name-first config
precedence as intended behavior. That is a suspected upstream bug, and freezing it would
have made the upstream *fix* a break here. It is deleted, not weakened.

The cut analysis is preserved as prose + CFGs in `design/inherited-behavior.md`, which
also carries the **nine-assumption register** — the clibuilder facts our promises rest on,
each to be guarded by a `*.learn.ts` boundary test (a *learning test*, Clean Code ch. 8)
rather than by a scenario. Guards fail on the Renovate bump PR, which is what makes
`dependabot-automerge.yml` defensible.

`learn` still needs adding to the `files` exclusion glob in `package.json` so guards are
not published.

## Running the checks

`node <sdd-skills>/check-project-specs/scripts/check-project-specs.mts --root .` from
`packages/buddy` runs all six (spec-state, suite, concept-index, spec-structure, align-spec,
scenario-overlap). This now works directly — the earlier `gherkin-cli` export problem that needed a
symlinked local build is gone.

## NEXT

**Paused before the spec gate, on a producer-alignment problem. Read this before writing anything.**

The mechanical checks are all green and the three spikes are done, but green checks clear no
alignment question — the bars are judged, not linted.

### What went wrong

The spec-judge was dispatched and **blocked at its pre-flight**: the conductor forwarded an empty
producer governance declaration. That was accurate — this segment edited spec artifacts (the v10
correction, the concept tags, the register reconciliation) **without loading the spec-gate bars
first**, and what earlier segments loaded is unrecorded and cannot be vouched for.

The bars were then loaded and **two standing violations surfaced immediately**, which is evidence
against alignment, not for it. Re-declaring after the fact would have gamed a pre-flight that
cannot distinguish a claim from evidence, so the declaration was withheld.

### The two findings (unfixed — this is the next segment's work)

1. **Every behavioral node enumerates use cases from the entry point.** All ten carry a
   `| Use case | Trigger | Inputs | Outcome |` table. The bar requires **actor / goal**, the entry
   point, **and extensions**, derived *from a listed set of actors*. Entry-point-first enumeration
   can only return the use cases the interface already implies — structurally blind to the use case
   nobody has built yet, which in a spec whose whole subject is **unbuilt** commands is the
   expensive version of this mistake, not the cosmetic one.
2. **`plugin-management/loading/` orders its sections wrongly** — `## Control Flow` sits before
   `## Use Cases`. The four sections are ordered.

### How to resume

**Load the seven spec-gate governances *before* touching any spec file** — spec-format,
suite-format, lifecycle, gate-validation, oracle-spec, builder-spec, architect-spec. Then re-derive
every node's `## Use Cases` actor-first and fix the section order.

Expect the re-derivation to **surface gaps, not just reformat**: an actor-first enumeration is meant
to find goals with no entry point (a missing way in, or a use case belonging to another node) and
entry points serving no listed actor (surface nobody asked for). New scenarios and CFG edges are a
likely outcome, so treat the 43-scenario count and the CFGs as provisional again.

Only then re-dispatch the judge, forwarding a declaration that is **true of the segment that wrote
the artifacts**.

Untouched by all this: the nine `*.learn.ts` guards and the other impl items below stay **deferred
to a later mission** — this CR lands the spec, not the build.

### History (kept for context)

### Spike results so far

1. **pnpm plugin resolution — risk retired.** Did not reproduce across four layouts, including a
   workspace package depending on the published `@repobuddy/typescript`. pnpm's hidden hoist dir
   sits inside the walk-up chain from clibuilder's real path under `.pnpm`. Two honest limits
   recorded in `design/inherited-behavior.md`: hoisting could not actually be disabled (config
   didn't take), and **global install is untested and still a real risk** — local dev-dependency
   install is therefore a requirement, not a preference.
2. **Template publishing — real defect, fixed.** `npm pack --dry-run` confirmed `template*`
   matched **0 files**; `init`'s copy step would have found nothing in an installed package.
   Fixed to `templates`, re-verified (13 → 14 files, `templates/.editorconfig` present),
   changeset added. Also confirmed **`.agents/` is excluded from the tarball**, which validates
   the colocate-don't-hoist decision.

### Pending upgrade — re-verify, do not block on it

`find-installed-packages@3.2.0` (published 2026-08-12) and `search-packages@2.2.1` are not yet
pulled; 3.2.0 sits inside the 24-hour `minimumreleaseage` hold. Both are **transitive** deps
reached via clibuilder, and both drive `plugins list` / `plugins search` and `init`'s plugin
detection.

Verified working today against **3.1.2** in a pnpm workspace — `plugins list` found
`@repobuddy/typescript` by keyword — so **the hoisting scenario looks unnecessary** and nothing
is blocked. Re-verify once the upgrade lands, then let assumption 7's guard carry it.

This produced assumption **7** in the register, and the sharpest argument for keeping one:
Renovate watches *direct* dependencies, so a behavioral change in a transitive dep arrives with
no PR that names it. A learning test is the only thing that would catch it.

### Spike 3 result: package-manager (done)

**The command vocabulary is far more uniform than feared.** npm accepts `add` and `remove` as
aliases, so install/uninstall need no per-tool branching at all — verified against npm 12.0.2 and
pnpm 11.21.0. **Only `update` diverges, and only for yarn** (`upgrade` on v1, `up` on berry), so
the abstraction needs one conditional keyed on yarn's *major version*, not a command table. Added
one scenario for that branch and a `V` node to the CFG (8 scenarios now).

yarn is not installed here, so its rows are marked **documented-not-verified** in the node.

**Superseded — the precedence question is resolved by delegation.** `package-manager-detector`
(the library under `@antfu/ni`) already implements exactly the proposed precedence, verified:
`packageManager: yarn@1.22.22` + `pnpm-lock.yaml` → yarn (field wins); lockfile only → that tool;
neither → npm. It also handles the yarn v1/berry `upgrade`/`up` split and supports bun.

Adopted in **ADR 0001**. `package-manager/` drops 8 scenarios → 3; detection and command
construction become assumption **8** in the register. `@antfu/ni` itself was rejected — it is a
CLI, so using it would mean an install-time requirement or a vendored binary.

**Nothing now blocks the spec gate.**

### Then: the spec gate

Judge → freeze → `status: approved`. Note the freeze is per `.feature` file; the triage that cut
74 → 43 had to happen first, and did.

### Deferred to impl

- The six `*.learn.ts` boundary guards (see the assumptions register).
- Adding `learn` to the `files` exclusion glob so guards are not published.
- Correcting the readme's `buddy add <plugin>` → `@repobuddy/<plugin>` shorthand claim.
- **Upstream to clibuilder, not here:** every rejection path exits 0, and config resolution is
  name-first rather than nearest-first (suspected bug — deliberately not pinned by any scenario).
