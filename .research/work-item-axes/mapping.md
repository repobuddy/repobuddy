# How the working model maps onto each system (draft, November 2026)

Each column is a system's own terms, placed against the levels and fields of [model.md](model.md). Evidence IDs are in
[evidence.md](evidence.md). A cell that reads "not yet sourced" has no evidence behind it; do not read it as "none".

## Levels

| Ours | Jira | GitHub | Linear | Asana | SAFe | Shape Up |
| --- | --- | --- | --- | --- | --- | --- |
| Initiative | initiative (Premium) | none built in | initiative, nests 5 deep (E16) | goal (E01, E02) | epic, portfolio-owned (E33) | none |
| Epic | epic | custom Epic type or any parent | project (E11, E12) | project; epic as a section, a custom field, or a portfolio (E09, E10) | epic or capability, by size (E33, E34) | pitch, then bet (E36) |
| Issue | story, task, bug | issue | issue (E19) | task | story | scope inside a project |
| Sub-issue | sub-task | sub-issue | sub-issue (E20) | subtask | task | none |

The Jira and GitHub level cells come from the first-pass tracker table in [topic.md](topic.md), which was summarized,
not re-read. GitLab and Azure DevOps are in that table but not yet in this one.

## Fields

| Ours | Jira | GitHub | Linear | Asana | SAFe | Shape Up |
| --- | --- | --- | --- | --- | --- | --- |
| X2 release | not yet sourced | not yet sourced | Release object (E21); milestone as a stage (E15) | milestone, loosely (E06) | release on demand (E35) | ship at the end of the cycle (E36) |
| X3 time box | sprint (named only in Linear's Jira guide, E11) | not yet sourced | cycle (E17) | no sprint object (E07) | PI (E34) | six-week cycle (E36) |
| X4 ownership | not yet sourced | not yet sourced | project lead, initiative owner, team (E12, E16) | goal owner, portfolio owner, project owner (E02, E05) | portfolio leadership approves epics (E33) | betting table (E36) |
| X5 certainty | not yet sourced | not yet sourced | triage, status, date precision (E14, E19) | stages as custom fields (E09) | portfolio Kanban states (E33) | shaped pitch, then bet (E36) |
| X6 kind | issue type | issue type | labels (E11) | custom field (E09) | business or enabler (E33) | none |

## Weak points

- **Contested cells.** Asana's epic has three mappings (E09, E10). SAFe's epic and capability both claim the middle
  level, split by size and ownership (E33, E34).
- **Linear's project.** The Method sizes it at 1-3 weeks and 1-3 people (E18), so it is nearer a small shaped bet, while
  Linear's own Jira guide maps epic to project (E11). It sits under "epic" here with that flag.
- **Scrum has no column.** Its commitments are the Product Goal and the Sprint Goal, not item types (E43, E44).
- **A column is missing for each of GitLab and Azure DevOps,** and the Jira, GitHub, GitLab, and Azure DevOps release,
  time-box, and ownership cells are unsourced. A sourcing pass for them is under way.
