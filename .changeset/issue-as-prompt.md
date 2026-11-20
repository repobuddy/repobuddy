---
"repobuddy": minor
---

Add an `--as-prompt` mode to the `issue` skill. It does the usual work (category, details, environment, duplicate
search, title, and templated body), then replies with one copyable prompt for another agent to file the issue, in place
of creating it. The prompt names the target tracker, the exact title and body, and the searches already run, and tells
the receiving agent to search again, file the body from a file, and report back the URL.
