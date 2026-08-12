---
spec-type: behavioral
---

# Update a plugin

*Stub — the entry point below is named, but the control-flow graph and scenario map are authored in
this node's explore pass.*

## What

Moving an active plugin to a newer version — updating the dependency through the repository's
package manager, without changing which plugins are active.

Unlike `add` and `remove`, this touches only the *installed* side: the `plugins` list already names
the plugin and keeps naming it. What has to be decided in this node's explore pass is the scope of a
bare invocation — whether updating with no package named means "every active plugin" or is an error.

**Non-goals.** Adding or removing a plugin (sibling units); updating dependencies that are not
repobuddy plugins — that is the package manager's job, not repobuddy's.

## Use Cases

*(To be authored. The surface this node covers: updating one named plugin, and updating with no
package named.)*
