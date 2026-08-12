---
spec-type: behavioral
---

# Initialization

*Stub — the entry points below are named, but the control-flow graph and scenario map are authored
in this node's explore pass.*

## What

`buddy init` — setting a repository up to use repobuddy. It does three things in one command:

1. **Writes the configuration file** — `.repobuddy.json` in the current directory.
2. **Detects plugins already installed** — reads the repository's dependencies and pre-populates the
   `plugins` list with the repobuddy plugins it finds, so a repository that already depends on
   `@repobuddy/typescript` gets a working configuration rather than an empty one.
3. **Copies template files** — the starter files in the package's `templates/` directory
   (`.editorconfig` today) into the repository.

It is **safe to repeat** (idempotent): running it a second time on an already-initialized repository
merges into what is there rather than overwriting it or failing. This is the property that makes
`init` usable for picking up newly installed plugins, not only for first-time setup.

**Non-goals.** Installing anything — `init` records and copies, it never adds a dependency (that is
`plugin-management/add/`); reading or validating an existing configuration (`configuration/`).

**Open question, carried to the gate:** when a template file already exists in the repository with
different contents, the assumed behavior is **skip it and report it**, with no overwrite unless an
explicit force flag is given. Confirm before this node freezes.

## Use Cases

*(To be authored. The surfaces this node covers: `buddy init` in a repository with no configuration,
in one that already has a configuration, and in one where a template file already exists.)*
