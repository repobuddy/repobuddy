---
spec-type: behavioral
---

# Workflows

*Stub — the flows below are named, but the control-flow graph and scenario map are authored in this
node's explore pass.*

## What

The paths a real user walks across several capabilities, as opposed to any single command in
isolation. A workflow is the project-level counterpart of a use case: it starts from a real
situation and ends when the user has what they came for.

These matter because repobuddy's capabilities are only useful in combination. Setting up a
repository and then adding a plugin has to leave a configuration that the next command can actually
read — a property no single capability node can assert on its own.

**Non-goals.** Re-testing what a single capability already covers. A workflow scenario earns its
place only by asserting something about the *seam* between capabilities.

## Use Cases

*(To be authored. The flows this node covers: first-time setup of a fresh repository through to a
working plugin command; adopting repobuddy in a repository that already depends on plugins; and
adding a plugin to a repository that was never initialized.)*
