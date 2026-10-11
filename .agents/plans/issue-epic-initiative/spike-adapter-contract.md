> Spike report for [the plan](../issue-epic-initiative.plan.md). Reference names normalized to ADR 0003 after the spike; the plan records the decisions taken from it.

# Spike: tracker adapter contract for `issue` / `epic` / `initiative`

Read-only spike. Sources: decisions 0002 and 0003; `file-issue/SKILL.md`; agent-harness readme "Reference documents" and `references/create.md`; cyber-asana `references/cyber-asana.task-conventions.md`, `skills/asana/SKILL.md`, `skills/asana/references/{plan-work,create-task,link-pr}.md`; Linear docs (cited in section 4).

## 0. Principles

- The reader is an LLM following a SKILL.md. An op is an H2/H3 section the skill "runs". The contract is: what the skill says it needs, what the section must tell it, what shape of answer the skill expects.
- Skills own: gather, duplicate check, confirm, create, report, fallback. The adapter owns only: commands/tools, field mapping, and facts about the tracker.
- Skills never branch on a tracker name. They branch on a section saying `Unsupported` or a declared capability.
- Outputs are described as a small record the skill reads out of whatever the tool returned. Shared record, call it an **item ref**: `{ id, title, state (open|closed|other:<text>), url, level, kind? }`.
- Nothing is mutated until the skill's confirm step. `detect`, `kinds`, `search`, `url` are read-only; `create`, `link`, `promote` write. Each write op's section must say so ("writes") so the skill places confirmation before it.

## 1. The contract, per op

Common vocabulary the skills pass in: `level` (issue|epic|initiative), `category` (bug|feature|task, optional, only for level issue and epic), `title`, `body` (already rendered from `repobuddy.work-template.<kind>`), `parent` (item ref), `scope` (repo/team/project the adapter resolves).

| Op | Reads/writes | Skill passes | Adapter section must tell the agent | Skill needs back |
|---|---|---|---|---|
| `detect` | read | the working directory, the user's words, the `work-tracker` route | How to decide this adapter applies (remote host pattern, config file, URL shape the user pasted), how to resolve `scope` (owner/repo, workspace, team, project), and the prerequisite check (CLI present, logged in). | `{ applies: yes/no/maybe, scope, ready: yes / blocked:<what to fix> }`. Blocked is reported with the fix command; the skill never asks for a token in chat. |
| `kinds` | read | nothing | Which levels this tracker supports and how each is represented; which categories exist per level and how each is expressed (label, issue type, custom field, tag); what a team may configure. | A table `level -> native object`, `category -> native marker or "none"`, plus `limits` (max depth, one parent only). Skill uses it to refuse or downgrade a level and to omit a category the tracker cannot express. |
| `search` | read | `keywords` (skill runs it at least twice with different combos), optional `level`, `state` (default: all) | Exact command per level, how to include closed items, result limit, how to map output fields to the item ref. | List of item refs (max about 10 per query). Empty list is a valid answer. The skill de-duplicates by id across queries and shows id, title, state, url. |
| `create` | write | `level`, `category`, `title`, `body`, optional `parent`, `labels/fields` the skill wants | The command/tool, how title/body/category map to flags or fields, how to attach `parent` at create time, what to do when a label/field does not exist (omit, never invent), how to deal with body format (Markdown vs Asana HTML). | One item ref (id and url mandatory). Failure returns the tool's message verbatim and no item. |
| `link` | write | `from` and `to` item refs, `relation` in {child-of, blocks, relates-to, duplicates}, optionally a plain URL when `to` is outside the tracker | Which relations are native; how to emulate the others (a comment, a body line, a task list). | `{ done: yes, how: native / emulated }`. The skill reports emulated links as such. |
| `promote` | write | `item` (ref), `to` level (issue->epic, epic->initiative); also used for demote with `to` lower | Whether an in-place conversion exists and the exact steps; what is preserved (id, comments, subscribers) and what is lost; whether the id/url changes. | Item ref after promotion (id/url may differ), and `inPlace: yes/no`. |
| `url` | read | an item ref or id, or a URL the user pasted | How to build a URL from an id, and how to parse a pasted URL into `{ level, id, scope }`. | URL string; or parsed ref. Used by every "report" step and by "user pasted a link as parent". |

### 1.1 Unsupported ops

An unsupported op is a section whose first line is `**Unsupported.**` followed by one sentence of why and, optionally, a `Workaround:` line. The skill reads the first line before anything else in the section. An absent section is treated as unsupported with no workaround (adapter lint should flag it).

Skill fallbacks (these live in the skills, once, so adapters stay thin):

| Unsupported | Skill fallback |
|---|---|
| `detect` | Ask the user which tracker, then continue; never guess. |
| `kinds` for a level | Refuse that level on this tracker, say which levels exist, offer the nearest lower level or another route in `work-tracker`. |
| `kinds` for a category | Create without the category marker; write the category as the first line of the body ("Type: bug"). |
| `search` | Skip the automatic duplicate check, say so, ask the user to confirm no duplicate, and proceed only on a yes. The check is never silently dropped. |
| `create` at a level | Unsupported level, see `kinds`. |
| `link` | Emulate: put the parent/child reference in the body or a comment of both items; report "linked by reference". |
| `promote` | Create a new item at the higher level (via the target skill's own create path), link old item as child (or `relates-to`), add a comment on the old item pointing at the new, and close it or mark it superseded if the user confirms. Report both URLs and that ids changed. |
| `url` | Return the id and tell the user to open the tracker. Do not fabricate a URL. |

Demote (epic->issue) is `promote` with a lower `to`. Same fallback in reverse: create the lower-level item, move/link children, close the old.

### 1.2 Declaring levels and categories

The `Levels and categories` section of the adapter reference (also what `kinds` returns) is a table, one row per level, because the agent reads tables reliably and teams override one section with `merge-sections`:

```md
| Level | Native object | Categories | Parent allowed | Notes |
| issue | issue | bug=label `bug`, feature=label `enhancement`, task=none | epic | |
| epic | issue with sub-issues | same | initiative | native sub-issues |
| initiative | unsupported | | | |
```

Values: native object name, or `unsupported`. Category cell: `category=how` pairs, or `none`. `Parent allowed`: the level that may parent it, or `-`. Frontmatter carries only a machine-ish summary (`levels: [issue, epic]`) so `search`/listing can show it without reading the body; the body table is authoritative.

### 1.3 Auth / CLI prerequisites

A `Prerequisites` section, a short list: tool (CLI or MCP server), minimum version if it matters, how to check login (one command), how to get set up (name the setup skill if one exists, e.g. `init-buddy`, `init-asana`), env var names (never values). Rule for skills: run the check as part of `detect`; if blocked, run the named setup skill if installed, else print the install/login instruction; never ask for a secret in chat (same rule `link-pr` and `file-issue` follow today).

## 2. Adapter reference shape

A reference is top-level `##` sections, no `#` title, frontmatter `description` and `tags` (create.md). Plugin names carry the `<plugin>.` prefix and no `/`. Proposed name: `<plugin>.tracker-adapter` (cyber-asana ships `cyber-asana.tracker-adapter.asana`; built-ins are skill-internal files, but follow the same sections so one reader code path serves both, and a team override of a built-in is `.agents/references/repobuddy.tracker-adapter.github.md`, referenced from `work-tracker`).

Required `##` sections, in this order:

1. `Applies when` (detect)
2. `Prerequisites`
3. `Levels and categories` (kinds)
4. `Search`
5. `Create`
6. `Link`
7. `Promote`
8. `URLs`
9. `Conventions` (optional: pointers to the tracker's own convention reference, e.g. `cyber-asana.task-conventions`; the skill reads it before `Create`)

Frontmatter: `description`, `tags: [tracker-adapter, <tracker>]`, `merge: merge-sections` recommended for teams overriding, `levels: [..]`, `contract: 1` (version of this contract so skills can reject a newer adapter).

Within each op section: bullet **Inputs mapping**, **Command/tool**, **Returns** (how to read the item ref out of the output), **Errors** (one line per likely failure and the action).

### Skeleton

```md
---
description: Work-item adapter for <Tracker>: detect, kinds, search, create, link, promote, url.
tags: [tracker-adapter, tracker]
contract: 1
levels: [issue, epic]
---

## Applies when
- Remote host matches `...`, or the user pasted a `...` URL, or `.agents/<tracker>.json` exists.
- Resolve scope: `...`

## Prerequisites
- Tool: `tool` (or MCP `...`). Check: `tool auth status`. Setup: skill `init-<tracker>`.

## Levels and categories
| Level | Native object | Categories | Parent allowed | Notes |
| --- | --- | --- | --- | --- |
| issue | ... | bug=..., feature=..., task=... | epic | |
| epic | ... | same | - | |
| initiative | unsupported | | | |

## Search
Run `...`. Include closed. Read `id`, `title`, `state`, `url` from `...`.

## Create
Run `...`. Body format: Markdown. Parent: `--parent <id>`. Unknown label: omit.
Returns: `id`, `url`.

## Link
child-of: native `...`. blocks: native `...`. relates-to / duplicates: **Unsupported.** Workaround: comment.

## Promote
**Unsupported.** issue->epic has no in-place conversion.

## URLs
Build: `https://.../<id>`. Parse: `...`.
```

## 3. Stress test: Asana (cyber-asana)

Facts from the repo: tasks, subtasks (`--parent-gid`), dependencies, projects (container, resolved via `.agents/cyber-asana.json` registry, default project), sections, custom fields, story/task points, tags, comments, `permalink_url`; no projects/milestones/portfolios in the conventions ("Projects and milestones are out of scope for this reference"). The conventions already say "Parents stay empty ... a parent task or epic": Asana usage already treats a parent task as an epic.

### 3.1 Level mapping

| Level | Asana object | Verdict |
|---|---|---|
| issue | task (with or without a parent in the conventions "Choosing the object") | Clean. Category -> custom field, tag, or name prefix; Asana has no native bug/feature type. Declare `bug=tag` or `custom field Type`, else `none` and use the body line fallback. |
| epic | parent task with subtasks (conventions **Grouping**: "two or more units that serve one outcome") | Works and is what cyber-asana does. Caveat: Asana subtasks nest several levels, but conventions say subtask is "a step", not an independently shippable issue. For independently shippable children with their own assignees/points, subtasks suffice (they can be in different projects via `task project add`). Alternative: epic = Asana project is wrong here: projects are containers with sections, not completable outcomes. |
| initiative | Goal (Asana Goals, Premium/Advanced) or Portfolio (container of projects) | Not covered by cyber-asana CLI/MCP/conventions. Decide: initiative unsupported in v1 (declare `unsupported`), fall back to a top-level parent task, or add goal/portfolio support to cyber-asana later. Open question for the owner. I did not verify Goals API availability by plan; flag as unknown. |

### 3.2 Op mapping

| Op | Asana |
|---|---|
| detect | No git signal. Applies when the user names Asana, pastes an Asana URL (`cyber-asana url parse`), `.agents/cyber-asana.json` exists, or `work-tracker` routes to it. Prerequisites: credentials via `init-asana` (Ensure cyber-asana CLI); MCP optional. |
| kinds | issue: task; epic: parent task; initiative: unsupported (or goal). Categories via tag/custom field per project; discover with `cyber-asana config discover-fields`. |
| search | `cyber-asana task search "<text>" --project <gid> --no-completed`, plus `--completed-on-after <date>` for recent completed, plus `task my-tasks list --incomplete`. Item ref: `gid`, `name`, `completed`, `permalink_url`. Note Asana search is text and completion-date scoped, so "state all" is two or three calls: the adapter section must say so. |
| create | `cyber-asana task create` through `create-task.md` (workspace, project resolution, assignee registry, conventions). Parent: `--parent-gid`. Body: Asana `html_notes` subset (see tidy-description) or `--notes` plain; skill's Markdown body must be rendered to notes. Returns `permalink_url`. |
| link | child-of: `--parent-gid` at create (or set parent later; unverified via CLI). blocks: `task dependency add <task> <blocking>`. relates-to/duplicates: comment. Host-PR link is the separate `link-pr`. |
| promote | issue->epic: no conversion needed in a sense; a task becomes a parent by adding subtasks, so promote is **in place and id-preserving** (better than GitHub). Adapter says: keep the task, create children as subtasks, move the task's own deliverable into a first subtask if it should stay shippable. epic->initiative: unsupported, fallback applies. |
| url | `permalink_url` from create; `cyber-asana url parse <url>` for pasted URLs. |

### 3.3 Overlap with the `epic` skill: plan-work

`plan-work.md` is Asana's equivalent of "plan the units, look up each one, group under a parent, confirm the plan, apply, report". Steps 2 (units), 4 (look up: reuse / already done / create), 5 (group), 6 (confirm table), 7 (apply order: parent first, children with parent id, dependencies, comments, complete), 8 (report). That is the `epic` skill's workflow almost line for line, plus session-tracking (units from commits/diff/PR) which is Asana-specific in framing but generic.

Recommended split:

- `epic` (repobuddy) owns the tracker-neutral workflow: scope the outcome, identify children, per-child duplicate check via adapter `search`, plan table, confirm, create parent then children via `issue`, link, report, plus promote/demote.
- cyber-asana owns what Asana looks like: `cyber-asana.task-conventions` (Grouping, Task, Subtask, points, section, custom fields) and `create-task.md` (workspace/project/assignee resolution, CLI call). These become the adapter's `Create` and `Conventions` sections by pointer, not copy.
- `plan-work.md` should not be deleted or duplicated. Two options: (A, recommended) keep `plan-work` for Asana-native requests ("track this session in Asana", "break this into Asana tasks"), and make the adapter's `Create`/`Search` call the same lookups it defines (search steps 4 table), so the commands exist once. When the user invokes `epic` and the tracker resolves to Asana, `epic` runs its generic workflow and uses the adapter; plan-work stays the entry for Asana-first users. Risk: two plans for the same job diverge. (B) Later, shrink plan-work to "invoke repobuddy `epic` with Asana pre-selected" when repobuddy is installed, keeping plan-work's content as fallback. Do not do B until `epic` ships. Dependency direction matters: cyber-asana must not require repobuddy (plan-work's `link-pr` already treats repobuddy as optional).
- Session-tracking ("record this session's work as a task") has no counterpart in `issue/epic`; leave in cyber-asana.
- Unit definition differs: Asana "one deliverable one person can finish" vs the `repobuddy.work-levels` default "one deliverable, one owner, ships in one or a few PRs". Compatible; cyber-asana can override `repobuddy.work-levels` with `merge-sections` or just leave the default.

## 4. Stress test: Linear

Sources (fetched during this spike; summaries are from the pages, not full text):
- Parent and sub-issues: https://linear.app/docs/parent-and-sub-issues
- Projects: https://linear.app/docs/projects
- Initiatives: https://linear.app/docs/initiatives
- MCP server: https://linear.app/docs/mcp

Facts: sub-issues "split a larger parent issue ... too big for one issue but too small for a project"; sub-issues inherit team, priority, project. An issue can belong to only one project at a time. A project "is a grouping of issues that have a clear outcome or planned completion date", can be shared across teams, has milestones. Initiatives group projects (added deliberately), have status (Proposed, Planned, Active, Completed, Canceled) and health; sub-initiatives roll up. The sub-issues page documents "Convert to project" from the parent's menu: the issue and its sub-issues become standalone issues inside the new project, the original is renamed, and sub-issue relationships are removed. The decision says promotion is not in place, which agrees: it is a conversion that changes object type and id (P-TEAM-NNN vs issue id) and flattens the hierarchy. I found no documented "convert project to initiative" (not verified; the page set did not say).

### 4.1 Level mapping: a real choice

| Level | Option A: epic = parent issue | Option B: epic = project |
|---|---|---|
| issue | issue | issue |
| epic | parent issue with sub-issues (Linear's own wording: too big for an issue, too small for a project) | project (own outcome, date, progress, milestones) |
| initiative | initiative | initiative (projects roll up into it) |

Recommendation: the adapter declares the choice in `Levels and categories`, default to B when the epic spans several PRs/teams or has a planned date, A for smaller. Since the skills check "several independently shippable issues delivering one outcome", B (project) matches the epic definition best and gives initiative -> project -> issue a clean three-level chain that equals issue/epic/initiative. Option A leaves initiatives containing issues, which Linear does not allow (initiatives hold projects), so with A an epic cannot sit under an initiative. Therefore B is the only mapping that keeps `Parent allowed: initiative` true. Sub-issues remain available for sub-tasks inside an issue, outside the model.

### 4.2 Ops

| Op | Linear |
|---|---|
| detect | User names Linear, pasted `linear.app` URL, or a team key in config. Prerequisite: Linear MCP at `https://mcp.linear.app/mcp` (OAuth 2.1, or Bearer API key; readonly endpoint exists). The MCP page describes no CLI and says nothing about initiatives, so initiative tool coverage is unverified: check with the live tool list. |
| kinds | issue: issue (category -> label, or issue type if the workspace has them); epic: project; initiative: initiative. |
| search | MCP issue/project search tools (names unverified; adapter should say "find the tool whose name contains list/search issues"). State all must include completed and canceled. |
| create | issue: create issue with team + labels. epic: create project, then each child via `issue` with the project set. initiative: create initiative, add projects ("added deliberately"). |
| link | issue->project: set the issue's project. project->initiative: add project to initiative. blocks/relates/duplicate: Linear has issue relations (not verified in the pages I read). |
| promote | issue->epic (project): "Convert to project" exists in the UI (docs above), but the original issue is consumed and sub-issues become plain project issues; the MCP may not expose it. Treat as not in place: use skill fallback (create project, move/link the issue, close or leave). Set `inPlace: no`. epic->initiative: no conversion; fallback. |
| url | Linear issue and project URLs are returned by the tool; parse `linear.app/<workspace>/issue/<KEY-N>` and `/project/<slug>`. Verify patterns against live data before documenting. |

Stress result: the contract holds if (1) `kinds` can map different levels to different native objects, (2) `promote` returns `inPlace`, (3) `create` accepts a `parent` that may be a different native type. All three are already in section 1.

## 5. The `work-tracker` reference

Purpose: choose the adapter and route by kind. Resolution order per decision 0003: tracker the user names, then `work-tracker`, then git remote. Name `work-tracker` is unprefixed because the project owns it (create.md: a repository's own reference needs no prefix). Location `.agents/references/work-tracker.md`; it should have no plugin default because the default is "git remote".

### Format: frontmatter for machine-ish fields, Markdown table for routes

Rationale: routes are a small ordered table the agent matches top to bottom; a table is readable by people and mergeable by section (`merge-sections` keys by heading, so one heading `## Routes` replaces wholesale). Frontmatter YAML is fine for the default and adapter map but an LLM-read table matches how every other reference in this repo is built. Use both: frontmatter `default` (single value, quick), body for routes and adapter map.

Rules the skill follows: rows match top to bottom, first match wins; match columns are `level`, `category`, `scope` (any = `*`); blank/`*` matches all; no match -> `default`; no `default` -> git remote; tracker named by the user overrides everything. A route may name a different adapter per level, so a child created through `epic` -> `issue` may land in a different tracker than its parent: the skill then uses `link` with a plain URL (the `to` outside the tracker) and says the link is by reference.

```md
---
description: Which tracker holds which work items in this repository.
default: github
merge: merge-sections
---

## Adapters
| Name | Adapter | Scope |
| --- | --- | --- |
| github | built-in `github` | `repobuddy/repobuddy` (from remote) |
| asana | reference `cyber-asana.tracker-adapter.asana` | project alias `repobuddy` |

## Routes
| Level | Category | Tracker | Reason |
| --- | --- | --- | --- |
| issue | bug | github | public, near the code |
| issue | * | github | |
| epic | * | github | parent issue with sub-issues |
| initiative | * | asana | planning lives with the roadmap team |

## Security
Vulnerabilities are never routed here; see the private channel (decision 0003 item 6).
```

Notes: the `Security` line is reminder text, not logic; the rule lives in the skill. `Adapter` column accepts `built-in <name>` or `reference <reference-name>`; reference names follow the `<plugin>.` prefix rule and never contain `/`. The `Scope` cell is passed to `detect` as a hint.

## 6. Open questions

1. Reference name for the adapter: `<plugin>.tracker-adapter` (one per plugin) vs `<plugin>.tracker-adapter.<tracker>`; a plugin supporting two trackers would need the second. Recommend `<plugin>.tracker-adapter` and let the plugin split if needed.
2. Do built-in GitHub/GitLab adapters live as skill-internal files in the same shape or as built-in references in the `repobuddy.` namespace so teams can override them with `merge-sections`? Recommend the latter (`repobuddy.tracker-adapter.github`).
3. Asana initiative: unsupported in v1, Goals, or Portfolios? Needs owner decision and a cyber-asana CLI check.
4. Linear: epic = project (recommended) vs parent issue; and whether the Linear MCP exposes initiatives and "convert to project" (docs do not say).
5. Should `search` return `level`? Needed so the duplicate check can warn "an epic already covers this". Recommend yes where the tracker can tell.
6. Cross-tracker parent links (Asana initiative -> GitHub epic) are by reference only; confirm that is acceptable.
7. Contract versioning (`contract: 1`) and who validates adapters (an `audit` check that all required sections exist).
8. Fallback for `promote` closes the old item: always ask first; confirm default is "leave open, link, comment".
