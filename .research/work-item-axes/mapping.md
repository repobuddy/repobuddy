# How the working model maps onto each system (draft, November 2026)

Each column is a system's own terms, placed against the levels and fields of [model.md](model.md). Evidence IDs are in
[evidence.md](evidence.md). A cell that reads "not yet sourced" has no evidence behind it; do not read it as "none".
The tracker tables are split from the methods table so each stays readable.

## Levels: trackers

| Ours | Jira | GitHub | GitLab | Azure DevOps | Linear | Asana |
| --- | --- | --- | --- | --- | --- | --- |
| Initiative | initiative (Premium) | none built in | parent epic (Ultimate) | Epic (judgment; see below) | initiative, nests 5 deep (E16) | goal (E01, E02) |
| Epic | epic (E50) | custom Epic type or any parent issue | group epic (E68) | Feature (judgment) | project (E11, E12) | project; epic as a section, a custom field, or a portfolio (E09, E10) |
| Issue | story, task, bug | issue | issue | User Story, PBI, Requirement (E55) | issue (E19) | task |
| Sub-issue | sub-task | sub-issue, 8 levels (E63) | child issue, task | Task (E55) | sub-issue (E20) | subtask |

The Jira, GitHub, and GitLab level cells outside the cited entries come from the first-pass tracker table in
[topic.md](topic.md), which was summarized, not re-read. Azure DevOps's own top level is called Epic and its next
Feature (E55). I placed our epic at its Feature because the Azure DevOps docs group "larger scenarios" under Epics and
Features alike; this is a judgment, not a sourced equivalence.

## Levels: methods

| Ours | SAFe | Shape Up | Scrum |
| --- | --- | --- | --- |
| Initiative | epic, portfolio-owned (E33) | none | Product Goal, loosely (E43, E44) |
| Epic | epic or capability, by size (E33, E34) | pitch, then bet (E36) | none |
| Issue | story | scope inside a project | Product Backlog item |
| Sub-issue | task | none | none |

## Fields: trackers

| Ours | Jira | GitHub | GitLab | Azure DevOps | Linear | Asana |
| --- | --- | --- | --- | --- | --- | --- |
| X2 release | version, in the Fix versions field (E45, E46) | Release, a tag package (E59); milestone, by usage (E60) | Release, a tag snapshot (E64); milestone as a release, by convention (E65) | none in Boards; a pipeline release is a deployment (E56); a release node can nest in the iteration path (E53) | Release object (E21); milestone as a stage (E15) | milestone, loosely (E06) |
| X3 time box | sprint, scrum boards only (E49) | Projects iteration field (E62) | iteration in a cadence, group-level (E67); milestone, by convention (E65) | iteration path, also called a sprint (E53) | cycle (E17) | no sprint object (E07) |
| X4 ownership | version Driver (E46); others not yet sourced | not yet sourced | not yet sourced | area path (E54) | project lead, initiative owner, team (E12, E16) | goal, portfolio, and project owners (E02, E05) |
| X5 certainty | not yet sourced | not yet sourced | not yet sourced | not yet sourced | triage, status, date precision (E14, E19) | stages as custom fields (E09) |
| X6 kind | work type | issue type | work item type (E68) | work item type (E55) | labels (E11) | custom field (E09) |

## Fields: methods

| Ours | SAFe | Shape Up | Scrum |
| --- | --- | --- | --- |
| X2 release | release on demand (E35) | ship at the end of the cycle (E36) | an Increment can ship inside a Sprint (E42) |
| X3 time box | PI (E34) | six-week cycle (E36) | Sprint |
| X4 ownership | portfolio leadership approves epics (E33) | betting table (E36) | one named Product Owner (E42, E44) |
| X5 certainty | portfolio Kanban states (E33) | shaped pitch, then bet (E36) | none |
| X6 kind | business or enabler (E33) | none | none |

## How each system closes its epic-level item

| System | Epic-level term | Closes by | Evidence |
| --- | --- | --- | --- |
| Jira | epic | Manual "Done" that sets one field and leaves the children and the workflow untouched | E50 |
| GitHub | parent issue | Manual; progress is a computed count of sub-issues | E63 |
| GitLab | epic | Manual "Close epic"; progress is computed from the children | E69 |
| Azure DevOps | Feature or Epic | Manual state, or an opt-in rule that closes a parent when all children complete (Services only; level coverage unstated) | E58 |
| Linear | project | Manual status; progress and milestones are computed | E13, E15 |
| Asana | project, goal | Project status by hand; a goal closes by rule only when set to automatic | E03 |
| SAFe | epic | Portfolio Kanban, by approval | E33 |
| Shape Up | bet | Ships or is cancelled at the end of the cycle | E36 |

No system closes an epic on its outcome measure. This is the gap R2 fills.

## Weak points

- **Contested cells.** Asana's epic has three mappings (E09, E10). SAFe's epic and capability both claim the middle
  level, split by size and ownership (E33, E34).
- **Linear's project.** The Method sizes it at 1-3 weeks and 1-3 people (E18), so it is nearer a small shaped bet, while
  Linear's own Jira guide maps epic to project (E11). It sits under "epic" here with that flag.
- **Systems that merge release and time box.** Azure DevOps nests releases in the iteration path (E53); GitLab lets a
  milestone act as a release or a time box (E65); Shape Up ships at cycle end (E36). The model keeps X2 and X3 apart;
  these systems show it is a policy choice, not a necessity.
- **Systems that keep them apart.** Jira's version and sprint (E45, E49), GitHub's Release and iteration (E59, E62),
  Linear's Release and cycle (E21, E17), SAFe's release on demand (E35).
- **Still unsourced.** The X4 and X5 cells for Jira, GitHub, and GitLab, the X5 cell for Azure DevOps, and the open
  items in E52 and E70. Scrum has no levels (E43, E44), so its column holds goals, not item types.
