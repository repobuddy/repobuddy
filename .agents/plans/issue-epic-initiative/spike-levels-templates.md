> Spike report for [the plan](../issue-epic-initiative.plan.md). Reference names normalized to ADR 0003 after the spike; the plan records the decisions taken from it.

# Spike: level transitions, level checks, templates, reference split

Basis: ADR 0003 and `file-issue/SKILL.md`, read in full. External claims come from my background knowledge of the named docs. I did not re-fetch them this session (no network check), so verify the exact wording before quoting any of them in shipped docs. Where I am unsure of a tracker's exact behavior I say so.

## 0. What trackers actually do (evidence)

| Tracker | Relevant behavior | Source |
|---|---|---|
| GitHub | An epic is a parent issue; sub-issues are real issues with one parent. Parent can be changed. Task-list checkboxes can be "converted to issue". Sub-issues replaced tasklists. | docs.github.com, "Adding sub-issues"; "About tasklists" (retired) |
| GitLab | Epics are a separate object (moving toward work items). Quick action `/promote_to_epic` exists; the reverse is not a one-step action in classic epics. Newer work-item model allows "change type" with restrictions. | docs.gitlab.com, "Epics" and "Quick actions" |
| Jira | Change an issue's type with "Move". Moving an epic to a standard type drops the children's epic link, so children become orphans. Atlassian's guidance warns about this. Epics are "large bodies of work" delivered over multiple sprints. | support.atlassian.com, "Move an issue" and Atlassian Agile Coach "Epics" |
| Linear | Epic ~ Project (different object). Issue to project via "Convert to project"; no in-place reverse. Sub-issues are the checklist-like option. | linear.app/docs, "Projects" and "Parent and sub-issues" |
| Azure DevOps | Epic > Feature > User Story/Bug > Task hierarchy. "Change work item type" is supported; child links survive but must still satisfy the process hierarchy, otherwise the change is blocked or links are invalid. | learn.microsoft.com, "Change work item type" and "Define features and epics" |
| Shape Up | No epics or backlog. Work is shaped to a fixed appetite; scope is cut ("scope hammering") to fit rather than letting a ticket grow. Big unshaped items are rejected, not filed. | basecamp.com/shapeup, ch. 3 "Set Boundaries", ch. 14 "Decide When to Stop" |
| SAFe | Epic carries a hypothesis statement, MVP, and leading indicators; it is approved on a lean business case. Epics are portfolio-level and span PIs. | scaledagileframework.com, "Epic" |
| Story sizing | INVEST (Bill Wake): Independent, Negotiable, Valuable, Estimable, Small, Testable. Story-splitting patterns (Richard Lawrence, Humanizing Work). Mike Cohn: epic = story too big for one iteration. | xp123.com "INVEST in good stories"; humanizingwork.com "Patterns for splitting user stories"; mountaingoatsoftware.com |
| Goals | Key result = measurable, with baseline and target (Doerr, Measure What Matters). | Doerr 2018 |

Lessons: (a) The only safe demotion in Jira-like trackers is the one that re-homes the children first. (b) Tracker support for demotion is uneven, so demotion must be an adapter capability (`promote` in ADR 0003 should be `retype`/`reparent` or have a `demote` twin) with a manual fallback. (c) Shape Up shows the real fix for "too big" is cutting scope, which the `issue` suggestion should offer as an option.

## 1. Demotion rules

Principle: demotion loses structure; never lose a child silently and never lose information in the body. Demotion runs in the skill of the level entered (`issue` for epic to issue, `epic` for initiative to epic). The category is kept.

### 1a. epic to issue (run by `issue`)

Preconditions the skill checks, in order:

1. Count children and their states (open, closed).
2. Check the demoted item still passes the issue checks: one deliverable, one owner, shippable in one or a few PRs. If the epic obviously still fails them, ask once whether the user means "merge/close" instead; do not refuse, because the user may be right and the checks are heuristics.

Default rule by child state:

| Situation | Default action | Ask or refuse |
|---|---|---|
| No children | Retype in place (adapter `retype`), keep number/URL and body. | No ask beyond the normal create confirmation. |
| Children all closed | Fold into a "Done so far" checklist in the body (checked items with links), keep links as comments. Retype in place. | Ask once to confirm. |
| 1 to 5 open children | Fold into a task checklist in the issue body (`- [ ] #123 title`). Each folded child is then closed as "not planned, folded into #N" with a link back, only after the user confirms the list. Alternative offered: keep them as sub-issues of the demoted issue (GitHub and Linear allow nesting under an issue). | Always show the list and ask before closing any child. |
| More than 5 open children, or any child with its own assignee, PRs, or non-trivial discussion | Do not fold. Offer: re-parent children to another named epic, or keep as sub-issues. | Refuse to fold silently. Ask the user to choose; if none, stop and recommend keeping it an epic. |
| Any child that is itself a parent (grandchildren) | Refuse. Demote bottom-up. | Refuse. |

Never: close children as duplicates (they are not duplicates; "duplicate" corrupts the search the duplicate-check step relies on). Use "not planned" or "folded into" with a link. Never delete.

Rationale: Jira loses the epic link when an epic changes type, leaving orphan children (Atlassian docs above). A folded checklist keeps the children's information in one place; GitHub and Linear sub-issues give a lossless alternative. Re-parenting is the right answer when children represent work that is still independently shippable (which is the epic definition), so a large open set means the demotion premise is probably wrong.

Tracker without in-place retype (Linear: project to issue; GitLab classic epics): create a new issue carrying the body, comment link both ways, close the old object as "superseded", and say so. Report the new URL.

### 1b. initiative to epic (run by `epic`)

An initiative's children are epics; demoting it makes it an epic whose children must be issues. Epics cannot nest, so child epics need a decision each.

| Situation | Default action | Ask or refuse |
|---|---|---|
| No child epics (shell-less) | Retype; drop the metric section into "Outcome" as a sentence, keep baseline/target as text. | Confirm once. |
| One child epic | Replace the initiative with that epic's content merged in, or make the initiative's remaining body the epic and re-parent the child epic's issues under it. Close the empty shell as "folded". | Ask which of the two. |
| Several child epics | Each child epic becomes an issue (under `issue`, category kept) only if it passes the issue checks; otherwise it stays an epic and is re-parented to a sibling (the user names it) or left parentless. The demoted item itself keeps only epics that do not fit. | Ask per child epic. No batch "make all issues". |
| A child epic has open child issues | Refuse to turn it into an issue; the grandchildren would need re-homing. | Refuse until the user decides, then run epic to issue (1a) on that child first. |

The skill must warn that the metric is being dropped: initiatives exist because of a measurable goal; demoting it declares the goal abandoned or absorbed. Record the old metric in the body under "Origin" with a link.

### 1c. When the skill refuses (summary)

- Grandchildren exist (demote bottom-up).
- More than 5 open children and the user has not chosen re-parent or sub-issue.
- The adapter cannot retype and cannot create plus link (nothing to carry over).
- A child's assignee or open PR would be orphaned and the user has not confirmed.

It asks, never refuses, when: counts are small, children are all closed, or the demotion is a judgment about size.

## 2. Promotion rules

### 2a. issue to epic (run by `epic`)

Default: keep the original item in place as the epic. Reason: it keeps the URL, the discussion, subscribers, and incoming links (GitHub: `#N` references; Jira move/retype keeps the key in Jira, GitLab `/promote_to_epic` creates a new epic and closes the issue but copies description and comments). Use the adapter: `retype` where the tracker supports it (Jira, Azure DevOps), "make parent" in GitHub (the issue becomes the parent), `/promote_to_epic` in GitLab (new object, link back, say so), "convert to project" in Linear (new object, link back).

Procedure the `epic` skill must follow:

1. Confirm the item. Show the current category and keep it.
2. Scope the outcome: ask "what is true for a user or the project when this is done?" in one sentence. This becomes Outcome. The original description is the raw material; do not discard it, move PR-sized pieces into children.
3. Write non-goals (at least one, or say "none identified").
4. Break into child issues. The original issue's own deliverable is usually one of the children: ask whether to create a first child "Implement X" carrying the original acceptance criteria. Default yes, because otherwise the work already agreed vanishes into a parent that has nothing to ship. This avoids both failure modes: a parent that is also a deliverable.
5. Each child is created through the `issue` skill, so duplicate checks and templates apply. Child bodies link to the epic. Category inherited by default; a bug epic's children may be tasks, so ask once.
6. Existing PRs or branches stay attached to the child that matches them; ask which.
7. Done-when is "all children done"; state it. Link children in the epic body.

Create a new parent instead when: the tracker cannot retype and nests only through a different object (Linear, GitLab), or the original has an assignee and PR history that should stay with the first child. Say which route was taken.

Gate: if the item fails "several independently shippable issues" (cannot name two), refuse to promote and offer to keep it an issue and split the PR work with a checklist.

### 2b. epic to initiative (run by `initiative`)

Initiative has a measurable goal; an epic does not. Steps:

1. Ask for the goal in one sentence and the metric. Metric needs three values: name, baseline (current), target. If the user cannot give a baseline, record "unmeasured" and make "establish baseline" the first epic; do not guess numbers.
2. Time horizon (quarter, date) and owners (one accountable; contributing teams).
3. Existing epic: keep it in place as the first child epic (shell: title, owner, link, one-line outcome). Do not re-edit its children. The initiative is a new item (an initiative is a different thing, not a bigger epic), so create a new parent and link; do not retype the epic, since its body is an outcome, not a goal.
4. Ask for the other epics as shells only. Their breakdown is left to `epic` later, per ADR 0003.
5. Check: does the metric move if all child epics finish? If the user says no, flag it: the epics are not aimed at the goal (see SAFe's leading indicators / hypothesis).
6. Category: inherited from the epic if the epic is a feature or bug; otherwise ask. Initiatives are rarely bugs.

Gate: no metric means no initiative; suggest keeping the epic and capturing the goal in its Outcome line.

## 3. Checks `issue` uses to suggest another level

`issue` only suggests, once per item, before the duplicate search, and proceeds as an issue if the user declines. All are questions an agent can ask or observe. Defaults mirror ADR 0003 and are team-overridable.

### Too big (suggest `epic`)

Ask or observe; two or more yes answers triggers the suggestion (one is only a note).

1. Can you name two parts that could ship on different days, each useful alone? (independently shippable; INVEST "Independent/Small")
2. Does the description contain more than one "and" in its goal sentence, or a list of 3 or more deliverables?
3. Would more than one person or team need to own parts of it?
4. Does it plausibly take more than one iteration or more than a few PRs?
5. Does the request mention several surfaces (e.g. CLI, docs, API) or several packages? Observable by grepping the description for package names / workspace folders.
6. Is "done" a state of the world ("users can X") rather than "this change merged"?
7. Is the title a verb of scale: "overhaul", "redesign", "migrate", "support X across", "improve Y"?
8. Do the acceptance criteria exceed about 7 bullets?

Shape Up variant for the note: before suggesting an epic, offer "cut scope to the smallest version that ships" (scope hammering).

### Too big for an issue and for an epic (suggest `initiative`)

1. Is there a number, a metric, or a target ("reduce build time 50%", "90% adoption")? 
2. Does it need more than one team or more than one quarter?
3. Would the user accept "done" only when a measure moves, not when work ships?
4. Would it need more than about 5 independently shippable issues in more than one distinct outcome?

An agent should treat the repository scope (packages/buddy/GOALS.md) as a signal: initiatives about the repo's own tooling are in scope, product-level goals may belong in a tracker or planning package.

### Too small (suggest not filing separately, or folding)

1. Is it a single obvious edit the requester can do now (typo, one-line fix)? Offer to just make the change.
2. Is it a sub-step of an open issue that has the same owner and would ship in the same PR? Search finds a related open issue; offer to add a checklist item or comment.
3. Does it have no owner-visible lifecycle (no one will track "done")?
4. Is it a duplicate of an open child of an epic? (duplicate check already handles.)

For an epic that looks too small: it has one child, or children that cannot ship apart, or one owner and one PR. `epic` suggests demotion (section 1a).

Wording: a suggestion is one line and a choice: "This reads like 3 separate deliverables (A, B, C). File as an epic with 3 issues, or keep as one issue?" Default answer is the user's original level.

## 4. Body templates

Keep headings stable: they are the override addresses (section 5). Replace the file-issue `Description` blend with category-specific sections.

### Category: bug (adapted from file-issue)

```md
## Summary
<one or two sentences: what is wrong>

## Steps to Reproduce
1. ...

## Expected Behavior
<expected>

## Actual Behavior
<actual>

## Environment
- OS / architecture:
- Runtime and package manager:
- Affected package and version:
- Related toolchain (and version if it differs from the consumer's):

## Notes
<container, WSL, CI context; workaround; anything else useful for triage>
```

### Category: feature

```md
## Summary
<what is wanted, in one or two sentences>

## Motivation
<who needs it and what they cannot do today>

## Proposed Behavior
<what the user sees or does; examples welcome>

## Acceptance Criteria
- [ ] ...

## Alternatives Considered
<optional>
```

### Category: task

```md
## Summary
<the work, in one sentence>

## Why
<what depends on it or what it unblocks>

## Done When
- [ ] ...

## Notes
<links, constraints, owner hand-off>
```

### Level: epic

```md
## Outcome
<what is true when this is done, in one sentence>

## Scope
- In: ...

## Non-goals
- ...

## Child Issues
- [ ] #123 <title>
- [ ] #124 <title>

## Done When
All child issues are done, and <the outcome statement is observable>.
```

If the tracker has real sub-issues (GitHub, Jira, Azure), the Child Issues list is generated by the tracker and the section is a short note, or the adapter renders it as a checklist where it does not.

### Level: initiative

```md
## Goal
<one sentence>

## Metric
| Measure | Baseline | Target | Source |
|---|---|---|---|
| ... | ... (date) | ... | where it is read |

## Epics
- [ ] <epic title> - <owner> - <one-line outcome> (shell)

## Time Horizon
<quarter or date; review dates>

## Owners
- Accountable: ...
- Contributing teams: ...

## Done When
The metric reaches its target and holds for <period>.
```

## 5. Reference split

Mechanism assumed: `merge-sections` replaces sections by heading path in a base reference, so an override file holds only the changed sections. Because the override is small whatever the base size, the real design question is that heading paths are stable, unique, and meaningful, and that unrelated concerns do not share a path prefix a team would have to copy.

Recommended split (5 template files, 1 levels file, 1 transitions block in skills):

| Reference | Contains | Common override |
|---|---|---|
| `repobuddy.work-levels` | One `## Issue`, `## Epic`, `## Initiative` section; each with `### Is`, `### Done when`, `### Too big`, `### Too small` (initiative has no too-big; issue's Too big and Too small carry the checks in section 3) | "Tune one level's checks": override `## Epic > ### Is` or `### Too big`. One small block. |
| `repobuddy.work-template.bug`, `repobuddy.work-template.feature`, `repobuddy.work-template.task` | The template body. Headings are the template's sections. | "Change one template": override the one file; to add a section, override the file's last section or the whole file. Whole-file replacement is a valid merge-sections case (all sections). |
| `repobuddy.work-template.epic`, `repobuddy.work-template.initiative` | The level templates (section 4). | Same. |
| `work-tracker` | Adapter and routing (already in ADR). | Unrelated; keep separate. |

Why not one big `work-item` reference: a team that only changes the bug template would need a path that goes through unrelated sections, and any heading rename in the base breaks every override of the file. One file per template keeps the blast radius to that template. Why not one file per level for definitions: the definitions are small (4 short sections each) and read together by `issue` when suggesting a level; splitting would make `issue` load three files for one check. Levels as one file with per-level H2s lets a team override one level without touching the others.

Where the transition rules (sections 1 and 2) live: in each level skill's `SKILL.md`, not in a reference, because they are procedure. Expose only the numeric knobs as a short `## Transitions` section in `repobuddy.work-levels` (fold limit default 5, per-child confirmation for initiative demotion, default route for promotion "in place or new parent"). Then a team tuning "fold limit" overrides a 3-line block, and the skills stay one copy of the workflow.

Rules to keep overrides cheap:
1. Heading text is API: treat as stable across releases; renaming needs a changeset.
2. Keep level template sections and level-definition sections in different files so a template override never needs the levels file.
3. Put the "Too big" and "Too small" lists as bullet lists under their own H3 so a team replaces the whole list, not individual bullets.
4. Skills must read `SKILL.local.md`-style overrides last; the reference override wins on conflict, as the repo's AGENTS.md says for skills.

## Open questions for the caller

- Does `merge-sections` support adding a section as well as replacing one? If not, templates should end in a catch-all `## Notes` that teams can replace to add content.
- The adapter operations in ADR 0003 list `promote`; demotion needs either `retype` in both directions or an explicit `demote` and a `fold` fallback. Decide before building `issue`.
- GitHub is the only built-in adapter where "make parent" is lossless; GitLab and Linear promotion creates a new object. State that in the adapter docs.
