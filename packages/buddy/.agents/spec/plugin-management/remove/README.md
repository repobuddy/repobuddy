---
spec-type: behavioral
---

# Remove a plugin

*Stub — the entry point below is named, but the control-flow graph and scenario map are authored in
this node's explore pass.*

## What

Dropping a plugin a repository no longer wants: taking it out of the configuration's `plugins` list
so its commands stop appearing, and uninstalling the dependency.

The mirror of `add`, and it inherits `add`'s open question in reverse — whether removing should
always do both halves, or whether deactivating without uninstalling is a case worth having. That
choice is made in this node's explore pass.

**Non-goals.** Adding or upgrading a plugin (sibling units).

## Use Cases

*(To be authored. The surface this node covers: removing a plugin — including the cases where it is
active but not installed, installed but not active, or neither.)*
