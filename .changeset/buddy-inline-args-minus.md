---
"repobuddy": patch
---

Bundle `args-minus` into the CLI instead of installing it as a dependency. The CLI now inlines clibuilder 12.1, whose argument descriptors work across separate copies, so plugins no longer need to share its `args-minus` instance.
