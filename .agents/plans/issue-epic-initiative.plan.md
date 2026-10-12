---
cr-ref: github-801
target: packages/buddy/skills/file-issue
status: in-progress
todos:
  - content: Record the decisions — ADR 0002 (noun-first routing names), ADR 0003 (split by level), glossary terms
    status: completed
  - content: Align the reference names with agent-harness naming (repobuddy. prefix, dots not slashes)
    status: completed
  - content: 'Spike: GitHub, GitLab, Bitbucket mapping of each adapter op and each level'
    status: completed
  - content: 'Spike: adapter contract, stress-tested on Asana and Linear; work-tracker format'
    status: completed
  - content: 'Spike: promotion and demotion rules, level checks, body templates'
    status: completed
  - content: 'Spike: name clashes for issue, epic, initiative in the skills registry'
    status: completed
  - content: Fold the spike results into ADR 0003 and the glossary
    status: completed
  - content: File this plan as an epic with its child issues (dogfood the epic workflow by hand)
    status: completed
---

# Epic: file tracked work at any level, on any tracker

Filed as [repobuddy/repobuddy#801](https://github.com/repobuddy/repobuddy/issues/801). Children, in
order: #802, #803, #804, [cyberuni/cyber-asana#266](https://github.com/cyberuni/cyber-asana/issues/266),
#805, #806, #807. Related, not blocking:
[cyberuni/agent-harness#79](https://github.com/cyberuni/agent-harness/issues/79) (list references by
name pattern).

This plan is tracked as an epic, by hand, the way the `epic` skill will do it. Each section below
is a step that skill must perform. Where this session did something the skill should do, the
**Dogfood** notes record it, so the skill is specified from a real run.

## Outcome

`file-issue` is replaced by three routing skills, `issue`, `epic`, and `initiative`, that file any
category of tracked work at the right level, on any tracker an adapter supports, with teams able to
override the levels, templates, and routing. See
[ADR 0003](../spec/design/decisions/0003-split-file-issue-by-level.md).

**Done when** every child issue below is done. The `initiative` child may move to another package
(ADR 0003, Scope); then this epic is done without it.

## Non-goals

- Filing documents or submissions that have no lifecycle (ADR 0003, Scope).
- Capabilities for a tracker other than GitHub, GitLab, and Asana in this epic.

## Child issues

Ordered as ADR 0003's build order: GitHub and Asana first, then the rest. Each ships on its own.

1. **`issue`**: rename `file-issue` to `issue`, add the task category and
   `project-tracker.capabilities.github`. Breaking rename, with a changeset. Update every page that
   names `file-issue` (spec docs, `to-question`, `agent-readiness`, website, root readme), except
   ADR 0001.
2. **References and contract**: move the templates and level checks into `repobuddy.work-levels`
   and `repobuddy.work-template.<kind>`; write `project-tracker.contract`.
3. **`project-tracker`**: the set-up skill. Lists installed capabilities, writes
   `project-tracker.routing` with pinned choices, checks it.
4. **`project-tracker.capabilities.asana`**: in the `cyber-asana` repository.
5. **`epic`**: create an epic and its issues; promote issue → epic; demote initiative → epic; the
   `Retype` sections for GitHub and Asana; moves across trackers.
6. **`project-tracker.capabilities.gitlab`**, Free-tier fallback included.
7. **`initiative`**: built last, against a real initiative (ADR 0003, Scope).

Outside this epic: Linear, Jira, and GitHub Discussions capabilities, written by whoever needs them.
In agent-harness, a `reference list <glob>` would make discovery exact (not blocking; not filed).

Each child gets an SDD spec node under `.agents/spec/agent-skills/` and evals before it ships.

## Open questions (spiked)

Results go here and into ADR 0003 when the spikes return.

- **Name clashes: low risk.** `npx skills find` shows no skill named exactly `issue`, `epic`, or
  `initiative`. Nearest are differently named (`mattpocock/skills@to-issues`, `create-epics`,
  `bmad-ticket`). `find` is fuzzy and capped near 20 results, so an exact match outside the top
  results is not ruled out. `create-issue` is common, one more reason to leave that name.

- **Levels, transitions, templates** ([report](./issue-epic-initiative/spike-levels-templates.md);
  external citations are from memory and unverified):
  - *Reference split* matches the names in ADR 0003: `repobuddy.work-levels` is one file, an H2 per
    level with fixed H3s (Is, Done when, Too big, Too small). The spike's `## Transitions` knobs
    moved to each adapter's `Retype` section (ADR 0003, decision 7);
    one `repobuddy.work-template.<kind>` per kind. Headings are API. `merge-sections` appends a
    section the base lacks (agent-harness `reference-document.ts`), so a team can add one.
  - The transition rules below are now the *default* the skill falls back to; each adapter states
    its own, and a team overrides them (ADR 0003, decision 7).
  - *issue → epic* keeps the original in place as the epic and moves its acceptance criteria into a
    first child; a new parent only where the tracker cannot retype.
  - *epic → initiative* creates a new parent with a metric (name, baseline, target); the epic
    becomes its first shell.
  - *epic → issue* retypes in place when no child is open; with up to 5 (knob) open children, folds
    them into a checklist and closes each as not planned, after confirmation; above that, or with
    grandchildren, it refuses and offers re-parenting. Never close children as duplicates.
  - *initiative → epic* asks per child epic, warns that the metric is dropped, refuses while a child
    epic has open issues.
  - The adapter's `promote` needs a demote counterpart; see `retype` below.
- **Adapter contract** ([report](./issue-epic-initiative/spike-adapter-contract.md); Linear pages
  were read as summaries):
  - An adapter is a reference with one section per op: Applies when, Prerequisites, Levels and
    categories, Search, Create, Link, Retype, URLs, optional Conventions. Frontmatter carries
    `contract: 1`. It marks which ops write, so the skill confirms before them.
  - Every op returns an item ref `{id, title, state, url, level}`, so `search` reports the level.
  - An op the tracker lacks opens with `**Unsupported.**`. Fallbacks live once, in the skills:
    no in-place retype → create at the new level, link, comment, close the old item only after
    confirmation; no search → ask the user to confirm there is no duplicate; no native link →
    link by reference in the body.
  - **Decided here:** `promote` becomes `retype`, both directions, returning `inPlace`. Adapters are
    named `<plugin>.tracker-adapter.<tracker>`, which covers a plugin with several trackers, and the
    built-ins ship the same way (`repobuddy.tracker-adapter.github`, `.gitlab`), so a team can
    override a built-in like any other reference.
  - `repobuddy.work-tracker`: frontmatter `default`, an `## Adapters` table and a `## Routes` table of
    `level, category, tracker` rows; first match wins, then the default, then the git remote.
  - *Asana*: issue = task, epic = parent task with subtasks, retype in place. Initiative (goal or
    portfolio) is not covered by `cyber-asana`; open until `initiative` is built.
    `cyber-asana`'s `plan-work` nearly duplicates `epic`: `epic` owns the neutral workflow,
    `cyber-asana` keeps its conventions and ships the adapter, and does not depend on repobuddy.
  - *Linear*: issue = issue, epic = project, initiative = initiative. "Convert to project" consumes
    the issue, so retype is not in place.

- **GitHub, GitLab, Bitbucket** ([report](./issue-epic-initiative/spike-tracker-mapping.md); each
  claim marked verified by command or from docs):
  - *GitHub*: `gh` 2.102.0 has native `--parent`, `--type`, `--add-sub-issue`, `--remove-sub-issue`,
    and `view --json subIssues,parent`. 100 children per parent, 8 levels deep. Issue types are
    org-only: this repo returns Bug, Feature, Task; a user-owned repo returns none, so fall back to
    the `bug` and `enhancement` labels after `gh label list`.
  - **Decided here:** on GitHub the issue type carries the *category* and an `epic` or `initiative`
    label carries the *level*, with sub-issues as the children. That keeps the two axes apart, which
    the spike's "type Feature plus `epic` label" did not. Retype is in place: change the label.
  - *GitLab*: epics need Premium or Ultimate, live at group level, became work items in 18.1, and the
    REST epics API is deprecated; child epics need Ultimate. `glab` has only an experimental
    `work-items` command, so the adapter uses `glab api`. Free tier falls back to a labelled issue
    with tasks. The work-items GraphQL calls are untested.
  - **Decided here:** drop Bitbucket. Its native issue tracker is reported removed (not fetched);
    a Bitbucket repository routes through `repobuddy.work-tracker` to a Jira adapter.
  - Risks to cover in the `issue` spec: the minimum `gh` version for these flags, `--type` on a repo
    without types, and the GitLab calls on a real instance.

- **Discovery by shared name** (tested against agent-harness with a scratch fixture: two fake
  provider packages and a project override):
  - Per-level names (`project-tracker.epic`): `reference show` exits 1 with "held by more than one
    plugin; ask for one of prov-asana/…, prov-gh/…"; the qualified name resolves; a bare
    `merge-sections` override over two providers stays ambiguous, over the qualified name it
    applies.
  - Per-tracker names (`project-tracker.capabilities.<tracker>`): `reference search
    project-tracker.capabilities` returns both providers tagged `match: prefix`, and also a planted
    unrelated reference tagged `match: description`, which the skill must drop.
  - **Decided:** per-tracker capabilities. A tracker's search, link, and auth are not per level, so
    per-level names would copy them into each file. Per-level choice lives in the routing.
- **Corrected by filing:** GitHub accepted cyber-asana#266 as a sub-issue of repobuddy#801, across
  owners (`gh issue edit 801 --add-sub-issue <url>`). The tracker-mapping spike's reading of the
  REST docs ("the sub-issue must share the parent's owner") is wrong for this case.
- **Superseded** above: `<plugin>.tracker-adapter.<tracker>` and `repobuddy.work-tracker`. A
  consumer cannot look a name up when the provider's plugin name or the tracker's name is part of
  it and unknown; see ADR 0003, decisions 4, 5, 8, 9.

## Dogfood notes

What the `epic` skill must do, observed in this session:

1. **Scope before breakdown.** The session settled the outcome and the level boundaries (ADR 0003)
   before naming any child. The skill asks for the outcome and done-when first.
2. **Audit for gaps before filing.** Asked "do we have the full picture?", the session listed what
   was decided and what was undefined. The skill runs that check before it creates children.
3. **Spike the unknowns, don't guess them.** Undefined items became spikes with a written result,
   not assumptions baked into child issues. The skill marks such a child as a spike.
4. **Check the customization surface against the real resolver.** The reference names were invalid
   under agent-harness (`a/b` is plugin `a`). The skill should validate reference names it writes
   with `reference show`.
5. **Track before filing.** The plan is local until the breakdown is stable; filing comes last,
   after duplicate check and confirmation.
6. **Spike in parallel, decide in one place.** The four spikes ran as separate agents. Their
   proposals conflicted (`promote` vs a demote op, `work-adapter` vs `tracker-adapter`, Feature type
   on an epic vs category on the type), and the conflicts were settled in the plan, then folded
   into the ADR. The skill keeps spike results beside the epic and records the decision taken from
   each.
7. **Put per-tracker behavior in the adapter, not the skill.** The first draft wrote the
   level-change fallback once, in the skills. The owner pointed out that each tracker changes levels
   differently and teams want to tune it, so the strategy moved to the adapter's `Retype` section
   and only the guards stayed in the skill. When the skill breaks work down, it asks of each rule:
   does this vary by tracker or by team? If so, it belongs in a reference.
8. **Order children by the owner's priority, not by the design's tidiness.** Build order put GitHub
   and GitLab together as "the built-ins"; the owner's priority is GitHub and Asana. The skill asks
   for priority before it orders children.
9. **Name extension points after the interface, not the provider.** The first adapter names carried
   the provider's plugin (`cyber-asana.…`), then the tracker as a lookup key; both make the consumer
   know something it cannot. The owner moved them to a shared prefix that is listed, not looked up.
   When the skill files a child that defines an extension point, it states who looks the name up
   and what they know at that moment.
10. **Test the platform before deciding on it.** The two naming schemes were run against the real
    resolver before choosing; the answer (both work, search needs filtering) differed from the
    assumption (wildcards needed).
11. **A breakdown can surface a missing child.** The `project-tracker` set-up skill appeared only
    when a mixed-tracker team was considered. The skill tries one non-default configuration against
    the breakdown before filing it.
12. **Filing, as run.** Duplicate search on each repo (five queries here, none matched); read the
    repo's issue types and labels first; create the level label when missing (`epic` did not
    exist); create the parent, then each child with `--parent` and its category as the issue type;
    a child in another repo is created there and attached with `--add-sub-issue`; read back
    `subIssuesSummary` to confirm the count. A body written before a step ran can go stale: the
    epic body claimed cross-owner nesting was impossible and was edited after the attach worked.
13. **Running a child (#802) by hand.** What the first child taught the `epic` skill about handing a
    child to a pod:
    - *Base branch moves.* The child started from the design branch because the design was not on
      trunk. Merging that PR left the child with nothing to rebase but its base; the skill states the
      base up front and tells the pod when it merges.
    - *A minimum tool version is a fact to look up, not guess.* The spike left it `[U]`; the answer
      (`gh` 2.94.0) came from one search of the CLI's release notes. The child's brief names such risks
      so the pod resolves them.
    - *Shipping a reference needs a channel.* The `files` list in `package.json` carried only
      `skills/`, so a plugin-tier `references/` folder would not have been published. Skills CLI
      installs copy only skill folders, so the capabilities reference also ships a copy inside the
      skill. That copy is a known duplicate; #803, which moves references out, should dedupe it.
    - *A rename sweeps by grep, then by reading.* A global replace of the old name left sentences
      like "where issue and community-post are installed"; the diff review caught the ones that
      needed backticks. Historical records (ADRs, spike reports, this plan) keep the old name.
    - *A frozen-feature rename is not a narrowing.* The `to-question` suite names `file-issue` in a
      Given step; replacing the name is a pure rename and needs no re-open.
    - *The mission loop is heavy for one child.* The SDD judge rounds were skipped in this run (no
      user channel, no judge agents); the spec node and evals were written by the pod and reviewed
      by `pnpm verify` and the audit only. The `epic` skill should say what a child's pod may skip.
14. **Test the untested risk by hand, and expect a failed write to leave a trace.** The `--type`
    risk from the spike was resolved on a private scratch repo: `gh issue create --type` on a repo
    without issue types creates the issue and then fails, so the skill checks for a stray before any
    retry. A judge that reads instructions cannot find this; only the live call did. The `epic` skill
    must do the same after any failed create in a batch, or it files duplicates of its own children.
