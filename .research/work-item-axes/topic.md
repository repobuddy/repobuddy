# The axes of work-item levels (November 2026)

## Question

Teams press several independent axes into one tracker tree, and tools name that tree's levels after different axes,
with overlapping terms (initiative, epic, feature, story, task, sub-task). What are the axes, what are the levels on
each, and where does each methodology's and tool's term sit on them?

## Scope

In scope:

- Define the axes, then the levels on each axis.
- Map the terms of each method (Scrum, SAFe, XP and Cohn, Shape Up, Kanban) and each tool (Jira, GitHub, GitLab,
  Azure DevOps, Asana, Linear) onto the axes.
- Answer: when work spans several releases, is it still a feature, an initiative, or something else?
- A paper with many graphs: axis diagrams, a term-to-axis map per tool, and worked examples, published as an
  illustrated page.

Out of scope: changing repobuddy's level skills (`issue`, `epic`, `initiative`) or the shared
`project-tracker.levels` reference. The paper informs them, and they change later in their own work.

Consumer: the `epic` design spec on branch `docs/epic-sdd2-spec`
(`packages/buddy/.agents/spec2/epic/`). It is parked at section 2 (What) until this topic has a conclusion. Its What
and Key terms are redrafted from it.

## Starting points from the owner

- One axis is **business value**: initiative > feature (> story).
- One axis is **release**: (release >) releasable feature unit > story, task > sub-task.
- Identify the other axes and build the map.
- An epic is close to a feature, but can contain tasks or engineering items.
- Asana and Linear are to be covered on the tool side, Linear in depth.

## Preliminary map (to test, not to assume)

| # | Axis | Question it answers | Levels (big to small) |
| --- | --- | --- | --- |
| X1 | Value | why; what someone gains | initiative > feature > story |
| X2 | Release | when it reaches users | release > releasable unit > story or task > sub-task |
| X3 | Time box | when it is worked | roadmap horizon > cycle, PI, or quarter > sprint > day |
| X4 | Ownership | who coordinates it | portfolio > program > team > person |
| X5 | Certainty | how decided it is | idea > hypothesis or bet > shaped > ready |
| X6 | Kind | what sort of work | a category, not levels: business or enabler, feature, bug, task, spike, chore |

Containment, the parent/child tree, is not an axis. It is the mechanism every axis is forced into.

Hypotheses:

- **H1.** SAFe's "epic" is an X4 term (portfolio-owned). Cohn's is an X1 term (a story too big). Jira's is a
  containment term (the top of the default tree). "Task" collides on X2 (a level) and X6 (a kind).
- **H2.** An epic is bounded by one outcome, not one user-facing capability, so it mixes X6 kinds.
  [repobuddy/.github#79](https://github.com/repobuddy/.github/issues/79) is an all-engineering epic with one outcome.
- **H3.** Release span (X2) does not decide the X1 level. One outcome shipped over several releases stays a feature
  or an epic, split by releasable unit inside it. Several outcomes judged together by one metric make an initiative.
  SAFe supports this: a capability fits one PI, while an epic spans PIs and stays an epic.

## Source angles

- Methodology frameworks: Scrum Guide, SAFe, Cohn and XP, Shape Up, Kanban. A first pass is done; see Findings.
- Tracker vendor docs: Jira, GitHub, GitLab, Azure DevOps, Linear. A first pass is done. **Asana is not yet covered.
  Linear needs depth**: initiatives and sub-initiatives, projects, project milestones, cycles, issues and
  sub-issues, labels.
- Practitioner evidence and critique. A first pass is done. Primary Pichler, Patton, Fowler, and Cagan texts are
  still missing.
- New for the paper: sources that separate the axes explicitly, such as story mapping (release slices against the
  backbone), SAFe's enabler and business split, OKR (objective and key result) as a value axis, and release-train
  and versioning practice.

## Findings

From a first pass on 2026-11-14 (three subagent angles, synthesized). Evidence entries are still to be written into
`evidence.md`.

### There is no standard definition of epic

Three framings compete:

1. **Size.** An epic is a story too big for one sprint, to be split before work starts. This is Cohn's view
   ([Stories, Epics, and Themes](https://www.mountaingoatsoftware.com/blog/stories-epics-and-themes)), and Jira's
   "big user story" ([What are issue types?](https://support.atlassian.com/jira-cloud-administration/docs/what-are-issue-types/)).
2. **Container.** An epic is a folder of backlog items. This is Scrum.org's view
   ([What are epics and features](https://www.scrum.org/resources/blog/what-are-epics-and-features)), Atlassian's,
   and how every tracker models it.
3. **Outcome.** An epic is a bounded bet on one outcome. SAFe gives the epic a hypothesis, an MVP, and a Lean
   business case ([Epic](https://framework.scaledagile.com/epic)). Linear: "Projects group issues together around a
   shared outcome" ([Conceptual model](https://linear.app/docs/conceptual-model)). Shape Up's pitch has a problem,
   an appetite, a solution, rabbit holes, and no-gos ([Write the Pitch](https://basecamp.com/shapeup/1.5-chapter-06)).

The Scrum Guide has no epic, story, feature, or initiative at all ([Scrum Guide](https://scrumguides.org/scrum-guide.html)).

### What fails, and what fixes it

The reported failures:

- an epic that never closes, because scope keeps growing ([Scrum.org thread](https://www.scrum.org/node/51975))
- an epic used as a dumping ground
- poorly refined work hidden inside an epic
  ([Jarrell, The Case for Eliminating Epics](https://jeremyjarrell.squarespace.com/jeremy-jarrell/eliminating-epics))

The reported fixes are outcome-framing moves: state the problem and the no-gos, give the epic a close condition,
and open a linked successor for the next phase.

### Trackers

| Tracker | Above epic | Epic | Below epic | Done when |
| --- | --- | --- | --- | --- |
| Jira | optional added level (Premium) | default top level | story, task, bug, then sub-task | manual transition |
| GitHub | none built in | a custom Epic type, or any parent issue | sub-issues, up to 8 levels | manual close |
| GitLab | parent epic (Ultimate) | a group-level work item (Premium) | child epic, issue, task | manual; progress from children |
| Linear | initiative | none; the project is the analogue | issues, sub-issues | project status set by hand |
| Azure DevOps | none | top portfolio level | feature, story or PBI or requirement, task | manual state; target date; rollup |

No tracker closes an epic on its own. Sources:
[GitHub issue types](https://docs.github.com/en/issues/tracking-your-work-with-issues/configuring-issues/managing-issue-types-in-an-organization),
[GitHub sub-issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues),
[GitLab epics](https://docs.gitlab.com/user/group/epics/),
[GitLab child items](https://docs.gitlab.com/user/work_items/child_items/),
[Linear: Jira terms](https://linear.app/docs/jira-terminology-translated),
[Azure Boards: features and epics](https://learn.microsoft.com/en-us/azure/devops/boards/backlogs/define-features-epics).

Fetched pages were summarized by a small model, so the quotes above are its wording. Re-read each before using it
in the paper.

## Contradictions

- Epic as a big story (Cohn) against epic as a funded portfolio initiative (SAFe).
- Epic as a container (Jira, Scrum.org) against epic as an item (Cohn, who notes that Jira's meaning differs from
  the original).
- Initiative sits above epic in Jira and Linear. In SAFe the epic is "a significant solution development
  initiative", so the word is a synonym there.
- Keep epics with a better definition, or abolish them in favour of themes and story maps
  ([Muth](https://www.freecodecamp.org/news/epics-are-dead-heres-what-we-should-do-instead-279bada1e644), Jarrell).

## Open questions

- Is X2 (release) one axis with X3 (time box), or two? Continuous delivery separates them; release trains merge them.
- Does X5 (certainty) have levels, or is it a state of an item on any level?
- Where does Asana's goal, portfolio, and project stack sit on the axes?
- Carried from the `epic` spec:
  - Q6. Should Revise open a linked successor epic when new scope arrives after the outcome is reached? The
    recommendation is yes.
  - Q7. Should an epic carry an appetite or time box? The recommendation is no, as a non-goal.

## Sources consulted

See the links under Findings.
