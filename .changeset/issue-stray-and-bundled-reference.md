---
"repobuddy": patch
---

The `issue` skill now says what to do after a failed create: when the failed command left an issue behind, give that issue's URL and do not retry; when it left none, say nothing was filed before any retry. Its fallback to the bundled GitHub reference now reads as applying after the fuzzier search matches are dropped.
