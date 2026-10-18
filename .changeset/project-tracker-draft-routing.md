---
"repobuddy": minor
---

The `project-tracker` skill now proposes the routing from what it can read: the remote host, which installed trackers are linked to the repo, what each tracker holds, and any line in `AGENTS.md` that says where work goes. Set-up shows each route with its signal and asks one confirmation, and asks a question only where the signals conflict or say nothing. Check also reports a stale route, such as a route to Asana after the project link is removed. When `issue` files without a routing, its closing line offers the draft ("Save GitHub as the tracker for all work in this repo? (y)") once per session instead of naming the skill. Nothing is written without a yes, and the draft picks only among installed trackers.
