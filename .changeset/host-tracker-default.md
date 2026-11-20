---
"repobuddy": minor
---

`project-tracker` treats the `origin` host's tracker (GitHub or GitLab) as the default. Set-up writes a routing only for a different tracker or for work split across trackers; when the host's tracker is the only signal, it says so and writes nothing. Show and check, with no routing, name the host's tracker in use, and check no longer reports the missing routing as a problem. `issue` no longer ends a filing with an offer to save the host's tracker as the routing. A host with no tracker, such as Bitbucket, still needs a routing: `issue`, `epic`, and `initiative` stop and point to `project-tracker` set-up.
