---
"repobuddy": minor
---

New skill `project-tracker` sets up, shows, changes, and checks the project's `project-tracker.routing`: which tracker holds each level and category, with each choice pinned as `<plugin>/project-tracker.capabilities.<tracker>` and a per-pair policy for what a move does to its source (close it as moved, or keep it open as a mirror). It lists the installed capabilities by their shared prefix, so a new tracker needs no change here, and refuses a move from a private tracker to a public one. Check reports a route whose tracker is missing, held by two plugins, on an unknown contract version, or that no route covers. `issue` now files to the routed tracker when a routing exists, stops with the problem named when a pin or route does not resolve, and behaves as before otherwise, ending its report with a suggestion to run `project-tracker`. `project-tracker.contract` gains a `Routing` section that defines the routing's tables; the contract version stays 1.
