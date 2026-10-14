---
"repobuddy": minor
---

New skill `epic` plans an epic and files it with its child issues: it settles the outcome and done-when first, makes each unknown a spike child, orders the children by your priority, searches for duplicates, and files after one confirmation. It also promotes an issue to an epic (in place where the tracker allows, with the issue's acceptance criteria moved into a first child) and demotes an initiative to an epic (warning that the metric is dropped and asking about each child epic). When the routing from `project-tracker` puts epics on another tracker, the change becomes a move: the epic is created there, the two are linked, and the source is closed as moved or kept as a mirror. How a level changes comes from each tracker's `Retype` section; the skill always confirms before writing, lists every child it touches, never closes a child as a duplicate, and never moves a private tracker's details into a public one.
