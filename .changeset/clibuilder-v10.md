---
'repobuddy': patch
---

Move to `clibuilder` v10.1.0. An unrecognized command or option now exits with a non-zero code, so scripts can distinguish a typo from success — through v10.0.0 every rejection path exited 0.
