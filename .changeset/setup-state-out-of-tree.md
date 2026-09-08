---
'repobuddy': patch
---

`setup-github-repo` no longer leaves `.github/setup-state.json` in the working tree. The run's state
artifact is written to a temp path keyed by `owner/repo` instead, so it can't be committed by
accident or linger as an untracked file that reads like the repo's settings policy. `detect-state`
reports the path in its stdout ack and accepts `--out` to override it; `scaffold-workflows` resolves
the same path by default. A leftover `.github/setup-state.json` from an earlier run is deleted.
