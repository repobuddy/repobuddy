---
"repobuddy": minor
---

New skill `initiative` sets up an initiative: it settles the goal and one metric (measure, baseline, target, source) before naming any epic, writes an unknown baseline as `unmeasured` and plans measuring it as the first epic, and files the epics as shells (title, owner, one-line outcome, no child issues) for `epic` to break down later. Without a measure and a target it suggests an epic instead. It also promotes an epic to an initiative by creating the initiative as a new parent, with the epic unchanged as its first shell. Trackers resolve through the `project-tracker` routing; the skill confirms before writing, never closes or breaks down an epic, and never puts a private tracker's details into a public one.
